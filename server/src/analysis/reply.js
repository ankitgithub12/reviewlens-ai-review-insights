import { createHash } from 'node:crypto';
import { buildReplyMessages, PROMPT_VERSION } from '../llm/prompts.js';
import { LlmHttpError } from '../llm/retry.js';
import { parseJsonContent } from '../llm/schema.js';

const MIN_REPLY_LENGTH = 20;
const MAX_REPLY_LENGTH = 1000;

export function validateReply(content) {
  try {
    const reply = parseJsonContent(content)?.reply;
    if (typeof reply !== 'string') return { ok: false, error: '"reply" must be a string' };
    const trimmed = reply.trim();
    if (trimmed.length < MIN_REPLY_LENGTH || trimmed.length > MAX_REPLY_LENGTH) {
      return { ok: false, error: 'reply length out of range' };
    }
    return { ok: true, value: trimmed };
  } catch {
    return { ok: false, error: 'response was not valid JSON' };
  }
}

/** Generates (or returns the cached) suggested reply for one review. Retries once on invalid output. */
export async function generateReply({ product, text, analysis }, { llm, cache }) {
  const cacheKey = createHash('sha256').update(`${PROMPT_VERSION}:${product}:${text}`).digest('hex');
  const cached = cache.get('replies', cacheKey);
  if (cached) return { reply: cached, source: 'cache' };

  const messages = buildReplyMessages({
    product,
    review_text: text,
    sentiment: analysis.sentiment,
    topics: analysis.topics,
  });

  let lastError = 'unknown error';
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const result = validateReply(await llm.chatJson(messages));
    if (result.ok) {
      cache.set('replies', cacheKey, result.value);
      await cache.save();
      return { reply: result.value, source: 'ai' };
    }
    lastError = result.error;
  }
  throw new LlmHttpError(502, `the AI returned an invalid reply twice (${lastError}). Please try again.`);
}
