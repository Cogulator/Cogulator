'use strict';

const Memory = require('./core/cognition/Memory');
const SubjectiveMentalWorkload = require('./core/cognition/SubjectiveWorkload');
const { profileModel } = require('./index');

const CYCLE_TIME = 50;

function resourceName(resource) {
  return resource === 'speech' || resource === 'hear' ? 'verbalcoms' : resource;
}

function findResourceStart(intervals, earliest, duration) {
  let start = earliest;
  for (const interval of intervals) {
    if (start + duration <= interval.startTime) return start;
    if (start < interval.endTime) start = interval.endTime;
  }
  return start;
}

function scheduleSteps(taskProfiles) {
  const resources = { verbalcoms: [], see: [], cognitive: [], hands: [] };
  const threads = [];
  taskProfiles.forEach((task, taskIndex) => {
    const grouped = new Map();
    task.profile.steps.forEach((step, stepIndex) => {
      const key = step.thread || 'base';
      if (!grouped.has(key)) grouped.set(key, []);
      // A scenario can invoke the same model more than once. Scope chunks to
      // their task instance so identical labels do not become one memory item.
      grouped.get(key).push({
        ...step,
        chunkNames: step.chunkNames.map(chunk => `<${task.id}:${chunk.slice(1, -1)}>`),
        taskId: task.id,
        taskIndex,
        stepIndex,
      });
    });
    for (const [thread, steps] of grouped) {
      steps.sort((a, b) => a.startTime - b.startTime || a.stepIndex - b.stepIndex);
      threads.push({ task, thread, steps, cursor: 0, availableAt: task.startTime });
    }
  });

  const scheduled = [];
  while (threads.some(thread => thread.cursor < thread.steps.length)) {
    let chosen = null;
    let chosenEarliest = Infinity;
    for (const thread of threads) {
      const step = thread.steps[thread.cursor];
      if (!step) continue;
      const earliest = Math.max(thread.availableAt, thread.task.startTime + step.startTime);
      if (earliest < chosenEarliest || (earliest === chosenEarliest && thread.task.taskIndex < chosen?.task.taskIndex)) {
        chosen = thread;
        chosenEarliest = earliest;
      }
    }
    const original = chosen.steps[chosen.cursor];
    const resource = resourceName(original.resource);
    const duration = original.time + CYCLE_TIME;
    const startTime = resources[resource]
      ? findResourceStart(resources[resource], chosenEarliest, duration)
      : chosenEarliest;
    const endTime = startTime + duration;
    const step = { ...original, thread: `${original.taskId}:${original.thread}`, startTime, endTime };
    scheduled.push(step);
    if (resources[resource]) {
      resources[resource].push({ startTime, endTime });
      resources[resource].sort((a, b) => a.startTime - b.startTime);
    }
    chosen.availableAt = endTime;
    chosen.cursor += 1;
  }
  return scheduled.sort((a, b) => a.startTime - b.startTime || a.taskIndex - b.taskIndex || a.stepIndex - b.stepIndex);
}

function profileScenario({ tasks, operatorText } = {}) {
  if (!Array.isArray(tasks)) throw new TypeError('profileScenario requires a tasks array.');
  const ids = new Set();
  const taskProfiles = tasks.map((task, taskIndex) => {
    if (!task || typeof task.id !== 'string' || !task.id.trim()) throw new TypeError('Every scenario task requires a non-empty id.');
    if (ids.has(task.id)) throw new Error(`Scenario task ids must be unique: ${task.id}`);
    ids.add(task.id);
    if (typeof task.source !== 'string') throw new TypeError(`Scenario task ${task.id} requires GOMS source text.`);
    const startTime = Number(task.startTime);
    if (!Number.isFinite(startTime) || startTime < 0) throw new TypeError(`Scenario task ${task.id} requires a non-negative startTime in milliseconds.`);
    return { id: task.id, taskIndex, startTime, profile: profileModel({ source: task.source, operatorText: task.operatorText || operatorText }) };
  });
  const steps = scheduleSteps(taskProfiles);
  const errors = taskProfiles.flatMap(task => task.profile.errors.map(error => ({ ...error, taskId: task.id })));
  const createError = (type, lineNo, hint = '', chunkName = '') => ({ type, lineNo, hint, chunkName, id: `${lineNo}_${type}` });
  const totalTaskTime = steps.length ? Math.max(...steps.map(step => step.endTime)) : 0;
  const memory = new Memory({ standalone: true, errors, createError, emit: () => {} });
  memory.fire(totalTaskTime, steps);
  const workload = new SubjectiveMentalWorkload({ standalone: true, emit: () => {} });
  workload.setMentalWorkload(memory.rehearsals);
  const taskInstances = taskProfiles.map(task => {
    const instanceSteps = steps.filter(step => step.taskId === task.id);
    return { id: task.id, scheduledStartTime: task.startTime, startTime: instanceSteps.length ? Math.min(...instanceSteps.map(step => step.startTime)) : task.startTime, endTime: instanceSteps.length ? Math.max(...instanceSteps.map(step => step.endTime)) : task.startTime };
  });
  return {
    totalTaskTime, steps, taskInstances,
    memory: { averageLoad: memory.averageLoad, workingMemory: memory.workingmemory },
    workload: { max: workload.maxWorkload, timeline: workload.workload },
    errors,
  };
}

module.exports = { profileScenario };
