import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAnalysis, validateBatchResponse } from '../src/llm/schema.js';
import { validResult } from './helpers.js';

const { id: _id, ...validAnalysis } = validResult('1');

test('accepts a well-formed analysis and normalises it', () => {
  const result = validateAnalysis({ ...validAnalysis, topics: ['price', 'price'], summary: ' Too\nexpensive ' });
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.topics, ['price']);
  assert.equal(result.value.summary, 'Too expensive');
});

test('rejects values outside the allowed lists and wrong types', () => {
  const cases = [
    { sentiment: 'mixed' },
    { topics: ['shipping'] },
    { topics: [] },
    { topics: 'quality' },
    { summary: '' },
    { needs_reply: 'true' },
    { extra_field: 1 },
  ];
  for (const override of cases) {
    assert.equal(validateAnalysis({ ...validAnalysis, ...override }).ok, false, JSON.stringify(override));
  }
  const { summary: _s, ...missingSummary } = validAnalysis;
  assert.equal(validateAnalysis(missingSummary).ok, false);
});

test('batch validation reports each id separately', () => {
  const content = JSON.stringify({
    results: [validResult('1'), validResult('2', { sentiment: 'great' })],
  });
  const { valid, errors } = validateBatchResponse(content, ['1', '2', '3']);
  assert.deepEqual([...valid.keys()], ['1']);
  assert.match(errors.get('2'), /invalid sentiment/);
  assert.equal(errors.get('3'), 'missing from response');
});

test('batch validation handles non-JSON, fenced JSON and duplicate ids', () => {
  assert.equal(validateBatchResponse('Sure! Here you go', ['1']).errors.get('1'), 'response was not valid JSON');

  const fenced = '```json\n' + JSON.stringify({ results: [validResult('1')] }) + '\n```';
  assert.equal(validateBatchResponse(fenced, ['1']).valid.size, 1);

  const twice = JSON.stringify({ results: [validResult('1'), validResult('1')] });
  assert.equal(validateBatchResponse(twice, ['1']).errors.get('1'), 'returned more than once');
});
