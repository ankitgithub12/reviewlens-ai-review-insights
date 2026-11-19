import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { fakeLlm, memoryCache, validResult } from './helpers.js';

/** Starts the app on a random free port and returns its base URL plus a close function. */
async function startApp(options = {}) {
  const app = createApp({
    llm: fakeLlm((reviews) => reviews.map((r) => validResult(r.id))),
    cache: memoryCache(),
    batchSize: 5,
    maxUploadBytes: 1024 * 1024,
    clientDist: null,
    ...options,
  });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

test('allows a configured frontend origin and answers the preflight', async () => {
  const { url, close } = await startApp({ corsOrigins: ['https://reviewlens.example'] });
  try {
    const res = await fetch(`${url}/api/health`, { headers: { Origin: 'https://reviewlens.example' } });
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://reviewlens.example');

    const preflight = await fetch(`${url}/api/reply`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://reviewlens.example', 'Access-Control-Request-Method': 'POST' },
    });
    assert.equal(preflight.status, 204);
    assert.match(preflight.headers.get('access-control-allow-headers'), /Content-Type/);
  } finally {
    close();
  }
});

test('does not allow origins that are not configured', async () => {
  const { url, close } = await startApp({ corsOrigins: ['https://reviewlens.example'] });
  try {
    const res = await fetch(`${url}/api/health`, { headers: { Origin: 'https://evil.example' } });
    assert.equal(res.headers.get('access-control-allow-origin'), null);
  } finally {
    close();
  }
});

test('API errors are JSON with a clear message', async () => {
  const { url, close } = await startApp({ llm: null });
  try {
    const noKey = await fetch(`${url}/api/analyze`, { method: 'POST' });
    assert.equal(noKey.status, 503);
    assert.match((await noKey.json()).error, /LLM_API_KEY/);

    const missing = await fetch(`${url}/api/nope`);
    assert.equal(missing.status, 404);
  } finally {
    close();
  }
});
