'use strict';

const { compileScenario } = require('./scenario-compiler');
const { profileWithNativeModules } = require('./native-runtime');

function profileScenario({ tasks, operatorText } = {}) {
  const compiled = compileScenario({ tasks });
  // One source is evaluated with one operator vocabulary. Reject incompatible
  // per-task overrides instead of silently profiling them with different timings.
  const vocabularies = new Set(tasks.map(task => task.operatorText || operatorText).filter(value => value != null));
  if (vocabularies.size > 1 || (vocabularies.size && !operatorText && tasks.some(task => !task.operatorText))) {
    throw new Error('A combined scenario requires the same operator definitions for every task.');
  }
  const result = profileWithNativeModules({ source: compiled.source, operatorText: [...vocabularies][0] || operatorText });
  const byGeneratedId = new Map(compiled.tasks.map(task => [task.generatedId, task]));
  return {
    ...result,
    source: compiled.source,
    sourceMap: compiled.sourceMap,
    taskInstances: (result.taskInstances || []).map(task => ({ ...task, id: byGeneratedId.get(task.id).id, generatedId: task.id })),
    steps: result.steps.map(step => ({ ...step, taskId: byGeneratedId.get(step.taskId).id,
      combinedLineNo: step.lineNo, lineNo: compiled.sourceMap[step.lineNo]?.lineNo ?? step.lineNo })),
    errors: result.errors.map(error => ({ ...error, combinedLineNo: error.lineNo,
      taskId: compiled.sourceMap[error.lineNo]?.taskId || null,
      model: compiled.sourceMap[error.lineNo]?.model || null,
      lineNo: compiled.sourceMap[error.lineNo]?.lineNo ?? error.lineNo })),
  };
}

module.exports = { profileScenario };
