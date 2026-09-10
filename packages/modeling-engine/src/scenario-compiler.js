'use strict';

// This compiler only assembles source. The GOMS processor owns all scheduling.
function compileScenario({ tasks } = {}) {
  if (!Array.isArray(tasks)) throw new TypeError('compileScenario requires a tasks array.');
  const byId = new Map();
  const instances = tasks.map((task, index) => {
    if (!task || typeof task.id !== 'string' || !task.id.trim()) throw new TypeError('Every scenario task requires a non-empty id.');
    if (byId.has(task.id)) throw new Error(`Scenario task ids must be unique: ${task.id}`);
    if (typeof task.source !== 'string') throw new TypeError(`Task “${task.id}” requires GOMS source text.`);
    const startTime = Number(task.startTime ?? 0);
    if (!Number.isFinite(startTime) || startTime < 0) throw new TypeError(`Task “${task.id}” requires a non-negative start time in milliseconds.`);
    const startType = task.startType || 'absolute';
    if (!['absolute', 'after_start', 'after_finish'].includes(startType)) throw new Error(`Task “${task.id}” has an unknown start type: ${startType}`);
    const instance = { ...task, startTime, startType, generatedId: `task_${index + 1}` };
    byId.set(task.id, instance);
    return instance;
  });
  const visiting = new Set(), visited = new Set();
  function visit(task) {
    if (visited.has(task.id)) return;
    if (visiting.has(task.id)) throw new Error(`Circular timing reference involving “${task.id}”.`);
    visiting.add(task.id);
    if (task.startType !== 'absolute') {
      const reference = byId.get(task.referenceTask);
      if (!reference) throw new Error(`Task “${task.id}” references missing task “${task.referenceTask}”.`);
      visit(reference);
    }
    visiting.delete(task.id);
    visited.add(task.id);
  }
  instances.forEach(visit);

  const lines = ['* Generated scenario. Task offsets are in milliseconds.'];
  const sourceMap = [null];
  const clean = value => String(value).replace(/[\r\n*]/g, ' ').trim();
  const metadata = [];
  for (const task of instances) {
    const modelLines = task.source.replace(/\r\n?/g, '\n').split('\n');
    if (modelLines.some(line => /^[.\s]*task\b/i.test(line.split('*')[0]))) {
      throw new Error(`Model for task “${task.id}” already contains Task containers. Load an individual Goal/Also model instead.`);
    }
    const label = clean(task.model || task.label || task.id) || task.generatedId;
    const offset = task.startTime.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 });
    const timing = task.startType === 'absolute' ? `starting_at ${offset} ms`
      : `starting_after ${byId.get(task.referenceTask).generatedId} ${task.startType === 'after_finish' ? 'finishes' : 'starts'} plus ${offset} ms`;
    lines.push('', `* Scenario task: ${clean(task.id)}${task.model ? ` | Model: ${clean(task.model)}` : ''}`);
    sourceMap.push(null, null);
    const headerLine = lines.length;
    lines.push(`Task: ${label} as ${task.generatedId} ${timing}`);
    sourceMap.push({ taskId: task.id, model: task.model || null, lineNo: null });
    metadata.push({ id: task.id, generatedId: task.generatedId, model: task.model || null, headerLine });
    modelLines.forEach((line, lineNo) => {
      lines.push(line.trim() ? `. ${line}` : '');
      sourceMap.push({ taskId: task.id, model: task.model || null, lineNo });
    });
  }
  return { source: lines.join('\n') + '\n', tasks: metadata, sourceMap };
}

module.exports = { compileScenario };
