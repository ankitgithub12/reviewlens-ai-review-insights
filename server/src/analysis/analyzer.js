import { LlmHttpError } from '../llm/retry.js';
import { buildAnalysisMessages, PROMPT_VERSION } from '../llm/prompts.js';
import { validateBatchResponse } from '../llm/schema.js';

/** Longer reviews are cut before sending; enough context to classify, bounded token cost. */
export const MAX_REVIEW_CHARS = 2000;

/** Errors where retrying later batches is pointless (bad key, wrong model/URL). */
const isFatal = (err) => err instanceof LlmHttpError && [401, 403, 404].includes(err.status);

export const analysisCacheKey = (hash) => `${PROMPT_VERSION}:${hash}`;

export function createRunStats() {
  return { ai_calls: 0, cache_hits: 0, http_retries: 0, validation_retries: 0, errors: [] };
}

function recordError(stats, message) {
  if (!stats.errors.includes(message)) stats.errors.push(message);
}

/**
 * Analyses unique review texts. Cached texts are served from the cache; the rest are sent to
 * the LLM in batches of `batchSize`, one batch at a time. Each batch response is validated per
 * item; items that fail validation are retried once in a smaller batch, then marked failed.
 *
 * @param {{hash: string, text: string}[]} items unique texts to analyse
 * @returns {Promise<Map<string, {analysis?: object, source?: 'cache'|'ai', error?: string}>>}
 */
export async function analyzeTexts(items, { llm, cache, batchSize, stats }) {
  const results = new Map();
  const pending = [];

  for (const item of items) {
    const cached = cache.get('analyses', analysisCacheKey(item.hash));
    if (cached) {
      results.set(item.hash, { analysis: cached, source: 'cache' });
      stats.cache_hits += 1;
    } else {
      pending.push(item);
    }
  }

  let fatalError = null;

  async function sendBatch(batch) {
    const ids = batch.map((_, index) => String(index + 1));
    const payload = batch.map((item, index) => ({ id: ids[index], text: item.text.slice(0, MAX_REVIEW_CHARS) }));
    stats.ai_calls += 1;
    const content = await llm.chatJson(buildAnalysisMessages(payload), {
      onRetry: () => {
        stats.http_retries += 1;
      },
    });
    const { valid, errors } = validateBatchResponse(content, ids);
    return {
      succeeded: batch.flatMap((item, i) => (valid.has(ids[i]) ? [[item, valid.get(ids[i])]] : [])),
      failed: batch.flatMap((item, i) => (errors.has(ids[i]) ? [[item, errors.get(ids[i])]] : [])),
    };
  }

  function markFailed(batchItems, message) {
    for (const item of batchItems) results.set(item.hash, { error: message });
  }

  /** Sends a batch; a transport failure (after backoff retries ran out) fails only that batch. */
  async function trySendBatch(batch) {
    try {
      return await sendBatch(batch);
    } catch (err) {
      const message = `AI request failed: ${err.message}`;
      recordError(stats, message);
      if (isFatal(err)) fatalError = message;
      markFailed(batch, message);
      return null;
    }
  }

  function storeSuccesses(succeeded) {
    for (const [item, analysis] of succeeded) {
      cache.set('analyses', analysisCacheKey(item.hash), analysis);
      results.set(item.hash, { analysis, source: 'ai' });
    }
  }

  for (let start = 0; start < pending.length; start += batchSize) {
    const batch = pending.slice(start, start + batchSize);
    if (fatalError) {
      markFailed(batch, fatalError);
      continue;
    }

    const first = await trySendBatch(batch);
    if (first) {
      storeSuccesses(first.succeeded);
      if (first.failed.length > 0) {
        // Schema validation failed for some items: retry exactly those once.
        stats.validation_retries += 1;
        const retry = await trySendBatch(first.failed.map(([item]) => item));
        if (retry) {
          storeSuccesses(retry.succeeded);
          for (const [item, reason] of retry.failed) {
            results.set(item.hash, { error: `Invalid AI output after retry: ${reason}` });
          }
        }
      }
    }

    await cache.save();
  }

  return results;
}
