import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLlmClient } from '../src/llm/client.js';
import { backoffDelay, LlmHttpError, withRetry } from '../src/llm/retry.js';

const okBody = { choices: [{ message: { content: '{"results":[]}' } }] };

/** Fake fetch that returns the queued responses in order. */
function queuedFetch(responses) {
  const requests = [];
  const fetchImpl = async (url, init) => {
    requests.push({ url, init });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return new Response(JSON.stringify(next.body ?? {}), { status: next.status, headers: next.headers });
  };
  return { fetchImpl, requests };
}

function clientWith(fetchImpl, waits) {
  return createLlmClient({
    apiKey: 'test-key',
    baseUrl: 'https://llm.example/v1',
    model: 'm',
    maxAttempts: 4,
    baseDelayMs: 100,
    timeoutMs: 1000,
    fetchImpl,
    wait: async (ms) => waits.push(ms),
  });
}

test('retries 429 and 5xx with exponential backoff, then succeeds', async () => {
  const waits = [];
  const { fetchImpl, requests } = queuedFetch([{ status: 429 }, { status: 503 }, { status: 200, body: okBody }]);
  const content = await clientWith(fetchImpl, waits).chatJson([{ role: 'user', content: 'hi' }]);

  assert.equal(content, '{"results":[]}');
  assert.equal(requests.length, 3);
  assert.equal(waits.length, 2);
  // 100ms then 200ms base, plus at most 25% jitter
  assert.ok(waits[0] >= 100 && waits[0] <= 125, `first wait ${waits[0]}`);
  assert.ok(waits[1] >= 200 && waits[1] <= 225, `second wait ${waits[1]}`);
  assert.equal(requests[0].init.headers.Authorization, 'Bearer test-key');
});

test('honours Retry-After from the API', async () => {
  const waits = [];
  const { fetchImpl } = queuedFetch([{ status: 429, headers: { 'retry-after': '3' } }, { status: 200, body: okBody }]);
  await clientWith(fetchImpl, waits).chatJson([]);
  assert.deepEqual(waits, [3000]);
});

test('does not retry client errors such as a bad API key', async () => {
  const waits = [];
  const { fetchImpl, requests } = queuedFetch([{ status: 401 }, { status: 200, body: okBody }]);
  await assert.rejects(clientWith(fetchImpl, waits).chatJson([]), (err) => err.status === 401);
  assert.equal(requests.length, 1);
  assert.equal(waits.length, 0);
});

test('gives up after maxAttempts and rethrows the last error', async () => {
  const waits = [];
  const { fetchImpl, requests } = queuedFetch([{ status: 500 }, { status: 500 }, { status: 500 }, { status: 500 }]);
  await assert.rejects(clientWith(fetchImpl, waits).chatJson([]), LlmHttpError);
  assert.equal(requests.length, 4);
  assert.equal(waits.length, 3);
});

test('network errors are retried', async () => {
  let calls = 0;
  const result = await withRetry(
    async () => {
      calls += 1;
      if (calls === 1) throw new TypeError('fetch failed');
      return 'ok';
    },
    { maxAttempts: 3, baseDelayMs: 1, wait: async () => {} },
  );
  assert.equal(result, 'ok');
  assert.equal(calls, 2);
});

test('backoff doubles each attempt', () => {
  const noJitter = () => 0;
  assert.deepEqual([1, 2, 3, 4].map((a) => backoffDelay(a, 1000, noJitter)), [1000, 2000, 4000, 8000]);
});
