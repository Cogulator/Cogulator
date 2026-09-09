'use strict';

const GomsProcessor = require('../../../src/cognition/GomsProcessor');
const Memory = require('../../../src/cognition/Memory');
const SubjectiveMentalWorkload = require('../../../src/cognition/SubjectiveWorkload');
const { parseOperators } = require('./operators');

function toProfileResult({ processor, memory, workload, errors }) {
  return {
    totalTaskTime: Number.isFinite(processor.totalTaskTime) ? processor.totalTaskTime : 0,
    steps: processor.intersteps.map(step => ({
      indentCount: step.indentCount, goal: step.goal, thread: step.thread,
      operator: step.operator, resource: step.resource, label: step.label,
      startTime: step.startTime, endTime: step.endTime, time: step.time,
      lineNo: step.lineNo, chunkNames: [...step.chunkNames],
    })),
    threadOrder: [...processor.thrdOrdr],
    memory: {
      averageLoad: memory.averageLoad,
      workingMemory: memory.workingmemory.map(stack => stack.map(chunk => ({
        chunkName: chunk.chunkName, addedAt: chunk.addedAt, recallProbability: chunk.recallProbability,
        lineNumber: chunk.lineNumber,
      }))),
    },
    workload: { max: workload.maxWorkload, timeline: workload.workload.map(item => ({ ...item })) },
    errors: errors.map(error => ({ type: error.type, lineNo: error.lineNo, hint: error.hint, chunkName: error.chunkName })),
  };
}

function profileWithNativeModules({ source, operatorText }) {
  const errors = [];
  const createError = (type, lineNo, hint = '', chunkName = '') => ({
    type, lineNo, hint, chunkName, id: `${lineNo}_${type}`,
  });
  const processor = new GomsProcessor({
    standalone: true,
    getModelText: () => source,
    getOperators: () => parseOperators(operatorText),
    errors,
    createError,
    emit: () => {},
  });
  processor.process();
  const totalTaskTime = Number.isFinite(processor.totalTaskTime) ? processor.totalTaskTime : 0;
  const memory = new Memory({ standalone: true, errors, createError, emit: () => {} });
  memory.fire(totalTaskTime, processor.intersteps);
  const workload = new SubjectiveMentalWorkload({ standalone: true, emit: () => {} });
  workload.setMentalWorkload(memory.rehearsals);
  return toProfileResult({ processor, memory, workload, errors });
}

module.exports = { profileWithNativeModules };
