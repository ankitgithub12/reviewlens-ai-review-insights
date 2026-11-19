export class LlmHttpError extends Error {
  constructor(status, message, retryAfterMs = null) {
    super(message);
    this.name = 'LlmHttpError';
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

/** Rate limits (429), server errors (5xx), timeouts and network failures are worth retrying. */
export function isRetryableError(err) {
  if (err instanceof LlmHttpError) return err.status === 429 || err.status >= 500;
  return err?.name === 'TimeoutError' || err?.name === 'AbortError' || err instanceof TypeError;
}

/** Exponential backoff with a little jitter; a server-provided Retry-After wins when present. */
export function backoffDelay(attempt, baseDelayMs, random = Math.random, retryAfterMs = null) {
  if (retryAfterMs != null) return retryAfterMs;
  const exponential = baseDelayMs * 2 ** (attempt - 1);
  return Math.round(exponential + random() * baseDelayMs * 0.25);
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs fn(); on a retryable error waits (1x, 2x, 4x, ... baseDelayMs) and tries again,
 * up to maxAttempts total. Non-retryable errors (e.g. 401 bad key) are thrown immediately.
 */
export async function withRetry(fn, { maxAttempts, baseDelayMs, onRetry, wait = sleep, random = Math.random }) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= maxAttempts || !isRetryableError(err)) throw err;
      const delayMs = backoffDelay(attempt, baseDelayMs, random, err.retryAfterMs);
      onRetry?.({ attempt, delayMs, error: err });
      await wait(delayMs);
    }
  }
}
