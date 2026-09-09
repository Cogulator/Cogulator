'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { profileModel } = require('../packages/modeling-engine');

test('profiles source through the package API without a Cogulator UI', () => {
  const result = profileModel({
    source: 'Goal: Respond to alert\n.Look at <alert>\n.Think of <response>\n.Say <response>',
  });

  assert.equal(result.errors.length, 0);
  assert.equal(result.steps.length, 3);
  assert.equal(result.steps[0].operator, 'look');
  assert.ok(result.totalTaskTime > 0);
  assert.ok(Number.isFinite(result.memory.averageLoad));
  assert.ok(Number.isFinite(result.workload.max));
});

test('accepts custom operator definitions without reading Cogulator settings', () => {
  const result = profileModel({
    source: 'Goal: Wait\n.Wait for completion (2 seconds)',
    operatorText: 'system Wait 1000',
  });

  assert.equal(result.errors.length, 0);
  assert.equal(result.steps[0].time, 2000);
});

test('uses the default operator timing modifiers', () => {
  const result = profileModel({ source: 'Goal: Review\n.Proofread two words' });

  assert.equal(result.errors.length, 0);
  assert.equal(result.steps[0].time, 660);
});

test('returns a serializable zero-duration result for an empty model', () => {
  const result = profileModel({ source: '* A model has not been authored yet' });

  assert.equal(result.totalTaskTime, 0);
  assert.equal(result.steps.length, 0);
  assert.equal(result.memory.averageLoad, 0);
});
