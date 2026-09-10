'use strict';

const GomsProcessor = require('./core/cognition/GomsProcessor');
const Memory = require('./core/cognition/Memory');
const SubjectiveMentalWorkload = require('./core/cognition/SubjectiveWorkload');
const { parseOperators } = require('./operators');

function toProfileResult({ processor, memory, workload, errors }) {
  return {
    totalTaskTime: Number.isFinite(processor.totalTaskTime) ? processor.totalTaskTime : 0,
    ...(processor.taskMode ? { taskInstances: processor.taskInstances.map(task => ({ ...task })) } : {}),
    steps: processor.intersteps.map(step => ({
      indentCount: step.indentCount, goal: step.goal, thread: step.thread,
      operator: step.operator, resource: step.resource, label: step.label,
      startTime: step.startTime, endTime: step.endTime, time: step.time,
      lineNo: step.lineNo, chunkNames: [...step.chunkNames],
      ...(step.taskId ? { taskId: step.taskId, taskLabel: step.taskLabel } : {}),
    })),
    threadOrder: [...processor.thrdOrdr],
    memory: {
      averageLoad: memory.averageLoad,
      workingMemory: memory.workingmemory.map(stack => stack.map(chunk => ({
        chunkName: chunk.chunkName, addedAt: chunk.addedAt, recallProbability: chunk.recallProbability,
        lineNumber: chunk.lineNumber,
        ...(processor.taskMode ? { color: chunk.color } : {}),
      }))),
    },
    workload: { max: workload.maxWorkload, timeline: workload.workload.map(item => ({ ...item })) },
    errors: errors.map(error => ({ type: error.type, lineNo: error.lineNo, hint: error.hint, chunkName: error.chunkName })),
  };
}

function profileWithNativeModules({ source, operatorText }) {
  // Cogulator models may have been created on older systems that use CR-only
  // line endings. The processor operates on newline-delimited source, so keep
  // the standalone API consistent with the editor's normalized text input.
  const normalizedSource = source.replace(/\r\n?/g, '\n');
  const errors = [];
  const createError = (type, lineNo, hint = '', chunkName = '') => ({
    type, lineNo, hint, chunkName, id: `${lineNo}_${type}`,
  });
  const processor = new GomsProcessor({
    standalone: true,
    getModelText: () => normalizedSource,
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
