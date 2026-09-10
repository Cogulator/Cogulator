'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { profileModel } = require('../packages/modeling-engine');
const { profileWithLegacyRuntime } = require('../packages/modeling-engine/src/legacy-runtime');
// Keep model fixtures with the tests so documentation examples are optional.
const examples = {
  'Task-Offsets': `Task: Push a button as button starting_at 2 seconds
. Goal: Accomplish A Button Push
. . Look at Button (1 seconds)
. . Point to Button (1 seconds)
. . Click on Button (1 seconds)

Task: Read status as status starting_at 2 seconds
. Goal: Check Status
. . Look at Status (1 seconds)
. . Think about Status (2 seconds)`,
  'Task-Dependencies': `Task: Respond as response starting_after monitor finishes plus 1 seconds
. Goal: Announce completion
. . Say Complete (1 seconds)

Task: Monitor as monitor starting_at 0 seconds
. Goal: Check system
. . Think about System (1 seconds)
. . Also: Watch display as visual
. . . Goal: Observe display
. . . . Look at Display (4 seconds)
. . Click Acknowledge (1 seconds)`,
  'Task-Parallel-Waits': `Task: Visual task as visual starting_at 0 seconds
. Wait (3 seconds)
. Goal: Inspect
. . Look at Display (1 seconds)

Task: Verbal task as verbal starting_at 0 seconds
. Wait (3 seconds)
. Goal: Respond
. . Say Ready (1 seconds)`,
};
const example = name => examples[name];
const times = result => result.steps.map(s => [s.taskId, s.operator, s.startTime, s.endTime]);

test('task offsets share resources at operator level and nested Goals retain task threads', () => {
  const result = profileModel({ source: example('Task-Offsets') });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(times(result), [
    ['button', 'look', 2000, 3000], ['button', 'point', 3000, 4000],
    ['status', 'look', 3000, 4000], ['button', 'click', 4000, 5000],
    ['status', 'think', 4000, 6000],
  ]);
  assert.equal(result.steps.find(s => s.taskId === 'status').thread, 'status');
  assert.deepEqual(result.taskInstances.map(t => [t.id, t.scheduledStartTime, t.startTime, t.endTime]),
    [['button', 2000, 2000, 5000], ['status', 2000, 3000, 6000]]);
});

test('finish dependencies wait for all branches, allow forward references, and support an offset', () => {
  const result = profileModel({ source: example('Task-Dependencies') });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(times(result), [
    ['monitor', 'think', 0, 1000], ['monitor', 'look', 0, 4000],
    ['monitor', 'click', 1000, 2000], ['response', 'say', 5000, 6000],
  ]);
  assert.equal(result.steps.find(s => s.operator === 'look').thread, 'monitor:visual');
});

test('Wait operators in independent tasks can overlap', () => {
  const result = profileModel({ source: example('Task-Parallel-Waits') });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(times(result), [
    ['visual', 'wait', 0, 3000], ['verbal', 'wait', 0, 3000],
    ['visual', 'look', 3000, 4000], ['verbal', 'say', 3000, 4000],
  ]);
});

test('release offsets are independent of source order, accept milliseconds and decimals', () => {
  const result = profileModel({ source: 'Task: Later as late starting_at 2.5 seconds\n. Click (1 seconds)\nTask: Earlier as early starting_at 500 ms\n. Click (1 seconds)' });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(times(result), [['early', 'click', 500, 1500], ['late', 'click', 2500, 3500]]);
});

test('empty tasks complete at release time and release dependent tasks', () => {
  const result = profileModel({ source: 'Task: Child as child starting_after empty finishes\n. Click (1 seconds)\nTask: Empty as empty starting_at 2 seconds' });
  assert.deepEqual(result.errors, []);
  assert.equal(result.taskInstances[0].startTime, 2000);
  assert.equal(result.taskInstances[1].endTime, 2000);
});

test('task and Also identities isolate repeated chunks and thread labels', () => {
  const source = ['a', 'b'].map(id => `Task: Repeated as ${id}\n. Look at <item>\n. Also: Branch as branch\n.. Think about <item>`).join('\n');
  const result = profileModel({ source });
  assert.deepEqual(result.errors, []);
  assert.deepEqual([...new Set(result.steps.map(s => s.thread))].sort(), ['a', 'a:branch', 'b', 'b:branch']);
  assert.deepEqual([...new Set(result.steps.flatMap(s => s.chunkNames))].sort(), ['<a:item>', '<b:item>']);
});

test('malformed task definitions and dependencies report errors without scheduling partial results', () => {
  const sources = [
    'Task: Missing ID',
    'Task: A as a starting_at -1 seconds\n. Click',
    '. Task: Nested as a\n.. Click',
    'Task: A as a\n. Click\nTask: B as a\n. Click',
    'Task: A as a starting_after missing finishes\n. Click',
    'Task: A as a starting_after b finishes\n. Click\nTask: B as b starting_after a finishes\n. Click',
    'Task: A as a\n.. Click',
    'Task: A as a\n. Click\nGoal: Outside\n. Click',
    'Task: A as a\n. GoTo Goal: Missing',
    'Task: A as a\n. Also: X as x\n.. Click\n. Also: Y as x\n.. Click',
  ];
  for (const source of sources) {
    const result = profileModel({ source });
    assert.ok(result.errors.length > 0, source);
    assert.equal(result.steps.length, 0, source);
    assert.equal(result.totalTaskTime, 0, source);
  }
});

test('Cogulator browser-script runtime executes the same Task examples as the package API', () => {
  for (const name of ['Task-Offsets', 'Task-Dependencies', 'Task-Parallel-Waits']) {
    const source = example(name);
    const native = profileModel({ source });
    const browser = profileWithLegacyRuntime({ source, sourceRoot: path.join(__dirname, '../packages/modeling-engine/src/core') });
    assert.deepEqual(browser.errors, [], name);
    assert.equal(browser.totalTaskTime, native.totalTaskTime, name);
    assert.deepEqual(browser.steps, native.steps.map(({ taskId, taskLabel, ...step }) => step), name);
    assert.equal(browser.memory.averageLoad, native.memory.averageLoad, name);
    assert.equal(browser.workload.max, native.workload.max, name);
  }
});

test('task IDs can use ordinary JavaScript property names', () => {
  for (const id of ['length', 'constructor', '__proto__']) {
    const result = profileModel({ source: `Task: Test as ${id}\n. Click (1 seconds)` });
    assert.deepEqual(result.errors, []);
    assert.equal(result.totalTaskTime, 1000);
  }
});

test('shared resource lookup fills gaps and keeps reservations chronological', () => {
  const GomsProcessor = require('../packages/modeling-engine/src/core/cognition/GomsProcessor');
  const processor = new GomsProcessor({ standalone: true });
  processor.resourceAvailability.hands = [{ st: 0, et: 0 }, { st: 1000, et: 2000 }];
  assert.equal(processor.getResourceAvailability('hands', 0, 500, 500, false), 0);
  assert.equal(processor.resourceAvailability.hands.length, 2);
  assert.equal(processor.getResourceAvailability('hands', 0, 500, 500), 0);
  assert.equal(processor.getResourceAvailability('hands', 500, 1000, 500), 500);
  assert.equal(processor.getResourceAvailability('hands', 750, 1250, 500), 2000);
});

test('Task timing requires underscored keywords and unparenthesized offsets', () => {
  for (const timing of ['starting at 0 seconds', 'starting at (0 seconds)', 'starting_at (0 seconds)',
    'starting after a finishes', 'starting_after a finishes plus (1 seconds)']) {
    const result = profileModel({ source: `Task: A as a\n. Wait (1 seconds)\nTask: B as b ${timing}\n. Click` });
    assert.ok(result.errors.some(e => e.type === 'task_syntax_error'), timing);
    assert.equal(result.steps.length, 0, timing);
  }
  const result = profileModel({ source: 'Task: Verbal task as verbal starting_at 0 seconds\n. Say Ready (1 seconds)' });
  assert.deepEqual(result.errors, []);
  assert.equal(result.taskInstances[0].scheduledStartTime, 0);
  assert.equal(result.totalTaskTime, 1000);
});
