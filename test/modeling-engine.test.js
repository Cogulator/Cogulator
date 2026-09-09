'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { profileModel } = require('../packages/modeling-engine');
const { profileWithLegacyRuntime } = require('../packages/modeling-engine/src/legacy-runtime');

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

test('native modules preserve the compatibility results across corpus models', () => {
  const models = [
    'parallel_monitor_and_respond.goms',
    'parallel_navigation_and_conversation.goms',
    'remember_contact_and_call.goms',
    'mental_addition_with_chunks.goms',
    'nested_reusable_form_entry.goms',
    'touchscreen_phone_message.goms',
  ];

  for (const model of models) {
    const source = fs.readFileSync(path.join(__dirname, '../src/RAG/corpus/models', model), 'utf8');
    const nativeResult = profileModel({ source });
    const compatibilityResult = profileWithLegacyRuntime({
      source,
      sourceRoot: path.join(__dirname, '../src'),
    });

    assert.equal(nativeResult.totalTaskTime, compatibilityResult.totalTaskTime, model);
    assert.deepEqual(nativeResult.steps, compatibilityResult.steps, model);
    assert.equal(nativeResult.memory.averageLoad, compatibilityResult.memory.averageLoad, model);
    assert.equal(nativeResult.workload.max, compatibilityResult.workload.max, model);
    assert.deepEqual(nativeResult.errors, compatibilityResult.errors, model);
  }
});
