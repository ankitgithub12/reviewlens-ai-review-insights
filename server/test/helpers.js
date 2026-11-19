import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SAMPLE_CSV = fs.readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'reviews.csv'),
);

/** In-memory stand-in for JsonCache with the same interface. */
export function memoryCache() {
  const data = { analyses: {}, replies: {}, themes: {} };
  return {
    data,
    get: (ns, key) => data[ns][key],
    set: (ns, key, value) => {
      data[ns][key] = value;
    },
    save: async () => {},
  };
}

/** Pulls the review array the prompt placed inside <data>...</data>. */
export function reviewsFromMessages(messages) {
  const user = messages.find((m) => m.role === 'user').content;
  return JSON.parse(user.slice(user.indexOf('<data>') + 6, user.indexOf('</data>')));
}

/**
 * Fake LLM. `respond(reviews, callNumber)` builds the result list for an analysis batch;
 * themes/reply prompts get simple valid answers. Records every call for assertions.
 */
export function fakeLlm(respond) {
  const calls = [];
  return {
    model: 'fake-model',
    calls,
    async chatJson(messages) {
      calls.push(messages);
      const system = messages[0].content;
      const data = reviewsFromMessages(messages);
      if (system.includes('TOP 3 COMPLAINTS')) {
        return JSON.stringify({ complaints: [{ theme: 'Broken items', review_ids: [data[0].id] }], praises: [] });
      }
      if (system.includes('customer-service replies')) {
        return JSON.stringify({ reply: 'Sorry to hear that. Please contact support with your order number.' });
      }
      return JSON.stringify({ results: respond(data, calls.length) });
    },
  };
}

export const validResult = (id, overrides = {}) => ({
  id,
  sentiment: 'negative',
  topics: ['quality'],
  summary: 'Customer reports a problem.',
  needs_reply: true,
  ...overrides,
});
