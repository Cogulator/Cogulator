'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { compileScenario, profileScenario, profileModel } = require('../packages/modeling-engine');

const source = 'Goal: Push\n. Look at Button (1 seconds)\n. Click Button (1 seconds)';

test('compiler wraps each invocation once and generated GOMS reproduces the profile', () => {
  const tasks = [{ id:'first task', model:'Push.goms', source, startTime:2000 },
    { id:'second/task', model:'Push.goms', source, startTime:2000 }];
  const result = profileScenario({ tasks });
  assert.deepEqual(result.errors, []);
  assert.equal((result.source.match(/^Task:/gm) || []).length, 2);
  assert.match(result.source, /Task: Push.goms as task_1 starting_at 2000 ms\n\. Goal: Push/);
  const direct = profileModel({ source:result.source });
  assert.equal(result.totalTaskTime, direct.totalTaskTime);
  assert.deepEqual(result.memory, direct.memory);
  assert.deepEqual(result.workload, direct.workload);
  assert.deepEqual(result.steps.map(s => [s.operator,s.startTime,s.endTime]), direct.steps.map(s => [s.operator,s.startTime,s.endTime]));
  assert.deepEqual(result.taskInstances.map(t=>t.id), ['first task','second/task']);
  assert.equal(result.steps[0].endTime-result.steps[0].startTime, 1000); // no extra 50ms cycle
});

test('CSV-style start dependencies follow actual first resource access, not requested release', () => {
  const tasks = [
    {id:'blocker',source:'Goal: Block\n. Look (3 seconds)',startTime:0},
    {id:'dependent',source:'Goal: Speak\n. Say (1 seconds)',startType:'after_start',referenceTask:'target',startTime:500},
    {id:'target',source:'Goal: Read\n. Look (1 seconds)',startTime:0},
    {id:'finish',source:'Goal: End\n. Think (1 seconds)',startType:'after_finish',referenceTask:'dependent',startTime:500},
  ];
  const result=profileScenario({tasks});
  assert.deepEqual(result.errors,[]);
  assert.equal(result.taskInstances.find(t=>t.id==='target').startTime,3000);
  assert.equal(result.taskInstances.find(t=>t.id==='dependent').startTime,3500);
  assert.equal(result.taskInstances.find(t=>t.id==='finish').startTime,5000);
  assert.match(result.source,/starting_after task_3 starts plus 500 ms/);
});

test('finish dependencies wait for the entire imported model including Also branches',()=>{
  const result=profileScenario({tasks:[
    {id:'a',source:'Goal: Main\n. Think (1 seconds)\n. Also: Watch as visual\n.. Goal: Observe\n... Look (4 seconds)'},
    {id:'b',source:'Goal: Respond\n. Say (1 seconds)',startType:'after_finish',referenceTask:'a',startTime:1000},
  ]});
  assert.deepEqual(result.errors,[]);
  assert.equal(result.taskInstances[1].startTime,5000);
});

test('reused Goal references remain local to their Task instance',()=>{
  const result=profileScenario({tasks:[
    {id:'a',source:'Goal: Reusable\n. Click (1 seconds)\n@Goal: Reusable'},
    {id:'b',source:'Goal: Reusable\n. Say (2 seconds)\n@Goal: Reusable'},
  ]});
  assert.deepEqual(result.errors,[]);
  assert.deepEqual(result.steps.filter(s=>s.taskId==='b').map(s=>s.operator),['say','say']);
});

test('maps errors back to original model lines and still returns source for inspection',()=>{
  const result=profileScenario({tasks:[{id:'broken',model:'Bad.goms',source:'Goal: Bad\n. UnknownOperator'}]});
  assert.ok(result.errors.length);
  assert.equal(result.errors[0].taskId,'broken');
  assert.equal(result.errors[0].model,'Bad.goms');
  assert.equal(result.errors[0].lineNo,1);
  assert.equal(result.source.split('\n')[result.errors[0].combinedLineNo],'. . UnknownOperator');
  assert.equal(result.steps.length,0);
});

test('validates scenario identities, timing, dependencies, and nested Task sources',()=>{
  for(const tasks of [
    [{id:'same',source},{id:'same',source}],
    [{id:'a',source,startTime:-1}],
    [{id:'a',source,startType:'typo'}],
    [{id:'a',source,startType:'after_finish',referenceTask:'missing'}],
    [{id:'a',source,startType:'after_start',referenceTask:'b'},{id:'b',source,startType:'after_finish',referenceTask:'a'}],
    [{id:'a',source:'Task: Nested as nested\n. Click'}],
  ]) assert.throws(()=>compileScenario({tasks}));
  assert.throws(()=>profileScenario({tasks:[{id:'a',source,operatorText:'hands Click 1000'},{id:'b',source,operatorText:'hands Click 2000'}]}),/same operator definitions/);
});

test('empty scenarios and empty timing anchors return valid results',()=>{
  assert.equal(profileScenario({tasks:[]}).totalTaskTime,0);
  const result=profileScenario({tasks:[{id:'a',source:'* anchor',startTime:1000},{id:'b',source,startTime:500,startType:'after_start',referenceTask:'a'}]});
  assert.deepEqual(result.errors,[]);
  assert.equal(result.taskInstances[1].startTime,1500);
});
