'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const defaultOperatorText = require('./default-operators');

const LEGACY_SOURCES = [
  'objects/Components.js',
  'objects/Operator.js',
  'objects/Step.js',
  'objects/Chunk.js',
  'objects/TimeObject.js',
  'cognition/LineParser.js',
  'cognition/GomsProcessor.js',
  'cognition/Memory.js',
  'cognition/SubjectiveWorkload.js',
];

function parseOperators(operatorText = defaultOperatorText) {
  return String(operatorText).split(/\r?\n/).flatMap((line) => {
    const [resource, operator, time, description, timeModifier] = line.trim().split(/\s+/);
    if (!resource || !operator || !Number.isFinite(Number(time))) return [];
    // Cogulator's full operators.txt has a description before timeModifier.
    // Compact definitions are convenient for API callers, so accept the fourth
    // token as a modifier too; unrecognized descriptions are harmless here.
    return [{ resource, operator, time: Number(time), timeModifier: timeModifier || description || '' }];
  });
}

function createEventShim() {
  return () => ({ on() {}, trigger() {} });
}

function createRuntime({ source, operatorText, sourceRoot }) {
  const errors = [];
  const context = vm.createContext({
    console,
    document: {},
    $: createEventShim(),
    G: {
      quill: { getText: () => source },
      errorManager: { errors },
      operatorsManager: { operators: parseOperators(operatorText) },
      stringUtils: { trim: value => String(value).trim() },
    },
  });

  // The UI error type also updates editor markers. The package intentionally
  // retains only the data portion of that contract.
  vm.runInContext(`class GomsError {
    constructor(type, lineNo, hint = '', chunkName = '') {
      this.type = type; this.lineNo = lineNo; this.chunkName = chunkName;
      this.id = lineNo + '_' + type; this.hint = hint;
    }
  }`, context, { filename: 'modeling-engine-errors.js' });

  for (const relativePath of LEGACY_SOURCES) {
    const filePath = path.join(sourceRoot, relativePath);
    vm.runInContext(fs.readFileSync(filePath, 'utf8'), context, { filename: filePath });
  }
  // In the application these two constructors run from jQuery's document-ready
  // queue. The package has no document lifecycle, so initialize them after all
  // legacy classes have been evaluated.
  vm.runInContext('G.memory = new Memory(); G.workload = new SubjectiveMentalWorkload();', context, {
    filename: 'modeling-engine-initialize.js',
  });
  return { context, errors };
}

function profileWithLegacyRuntime({ source, operatorText, sourceRoot }) {
  const runtime = createRuntime({ source, operatorText, sourceRoot });
  const { G } = runtime.context;
  G.gomsProcessor.process();
  // The legacy UI only renders a task time when there are steps. An API result
  // should remain serializable for an empty/comment-only model.
  const totalTaskTime = Number.isFinite(G.gomsProcessor.totalTaskTime) ? G.gomsProcessor.totalTaskTime : 0;
  G.memory.fire(totalTaskTime);
  G.workload.setMentalWorkload(G.memory.rehearsals);

  return {
    totalTaskTime,
    steps: G.gomsProcessor.intersteps.map(step => ({
      indentCount: step.indentCount, goal: step.goal, thread: step.thread,
      operator: step.operator, resource: step.resource, label: step.label,
      startTime: step.startTime, endTime: step.endTime, time: step.time,
      lineNo: step.lineNo, chunkNames: [...step.chunkNames],
    })),
    threadOrder: [...G.gomsProcessor.thrdOrdr],
    memory: {
      averageLoad: G.memory.averageLoad,
      workingMemory: G.memory.workingmemory.map(stack => stack.map(chunk => ({
        chunkName: chunk.chunkName, addedAt: chunk.addedAt, recallProbability: chunk.recallProbability,
        lineNumber: chunk.lineNumber,
      }))),
    },
    workload: { max: G.workload.maxWorkload, timeline: G.workload.workload.map(item => ({ ...item })) },
    errors: runtime.errors.map(error => ({ type: error.type, lineNo: error.lineNo, hint: error.hint, chunkName: error.chunkName })),
  };
}

module.exports = { parseOperators, profileWithLegacyRuntime };
