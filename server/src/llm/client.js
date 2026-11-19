import { LlmHttpError, withRetry } from './retry.js';

const MAX_RETRY_AFTER_MS = 60000;

/** Returns the model's rejected text for a "json_validate_failed" error, otherwise null. */
export function parseFailedGeneration(status, body) {
  if (status !== 400 || !body.includes('json_validate_failed')) return null;
  try {
    return String(JSON.parse(body)?.error?.failed_generation ?? '');
  } catch {
    return '';
  }
}

function parseRetryAfter(headerValue) {
  if (!headerValue) return null;
  const seconds = Number(headerValue);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
}

/**
 * Minimal client for any OpenAI-compatible /chat/completions endpoint (Groq, Gemini, OpenRouter...).
 * Only the server uses it, so the API key never reaches the browser.
 * Each chatJson() call counts as one "AI call" in the run stats; transport retries are counted separately.
 */
export function createLlmClient({
  apiKey,
  baseUrl,
  model,
  maxAttempts,
  baseDelayMs,
  timeoutMs,
  fetchImpl = fetch,
  wait,
}) {
  async function requestOnce(messages) {
    const response = await fetchImpl(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      // In JSON mode Groq answers 400 "json_validate_failed" when the model's output was not valid
      // JSON. That is bad *output*, not a bad request: hand the raw text back so the callers'
      // schema validation rejects it and their retry-once logic applies.
      const failedGeneration = parseFailedGeneration(response.status, body);
      if (failedGeneration !== null) return failedGeneration;
      throw new LlmHttpError(
        response.status,
        `LLM API returned ${response.status}: ${body.slice(0, 300)}`,
        parseRetryAfter(response.headers.get('retry-after')),
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new LlmHttpError(502, 'LLM API response had no message content');
    return content;
  }

  return {
    model,
    /** Sends the messages and returns the raw text content (expected to be JSON, validated by the caller). */
    chatJson(messages, { onRetry } = {}) {
      return withRetry(() => requestOnce(messages), { maxAttempts, baseDelayMs, onRetry, wait });
    },
  };
}
