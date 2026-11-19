import { createHash } from 'node:crypto';
import { buildThemesMessages, PROMPT_VERSION } from '../llm/prompts.js';
import { parseJsonContent } from '../llm/schema.js';
import { fallbackThemes } from './report.js';

const MAX_THEMES = 3;
const MAX_THEME_LENGTH = 100;

/** Validates {"complaints": [...], "praises": [...]}; every review id must exist in the input. */
export function validateThemes(content, knownIds) {
  let parsed;
  try {
    parsed = parseJsonContent(content);
  } catch {
    return { ok: false, error: 'response was not valid JSON' };
  }
  const result = {};
  for (const key of ['complaints', 'praises']) {
    const list = parsed?.[key];
    if (!Array.isArray(list)) return { ok: false, error: `"${key}" must be an array` };
    const themes = [];
    for (const entry of list.slice(0, MAX_THEMES)) {
      const theme = typeof entry?.theme === 'string' ? entry.theme.replace(/\s+/g, ' ').trim() : '';
      if (!theme || theme.length > MAX_THEME_LENGTH) return { ok: false, error: `invalid theme in "${key}"` };
      const ids = Array.isArray(entry.review_ids) ? [...new Set(entry.review_ids.map(String))] : [];
      if (ids.length === 0 || ids.some((id) => !knownIds.has(id))) {
        return { ok: false, error: `theme "${theme}" references unknown or no review ids` };
      }
      themes.push({ theme, review_ids: ids, count: ids.length });
    }
    result[key] = themes.sort((a, b) => b.count - a.count);
  }
  return { ok: true, value: result };
}

/**
 * Asks the LLM for the top 3 complaints/praises across the analysed reviews (cached by input),
 * retrying once on invalid output and falling back to topic counts if it still fails.
 */
export async function generateThemes(analyzed, { llm, cache, stats }) {
  if (analyzed.length === 0) return { complaints: [], praises: [], source: 'none' };

  const input = analyzed.map((r) => ({
    id: r.review_id,
    product: r.product,
    sentiment: r.analysis.sentiment,
    topics: r.analysis.topics,
    summary: r.analysis.summary,
  }));
  const cacheKey = createHash('sha256').update(`${PROMPT_VERSION}:${JSON.stringify(input)}`).digest('hex');
  const cached = cache.get('themes', cacheKey);
  if (cached) {
    stats.cache_hits += 1;
    return { ...cached, source: 'cache' };
  }

  const knownIds = new Set(input.map((r) => r.id));
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      stats.ai_calls += 1;
      const content = await llm.chatJson(buildThemesMessages(input), {
        onRetry: () => {
          stats.http_retries += 1;
        },
      });
      const result = validateThemes(content, knownIds);
      if (result.ok) {
        cache.set('themes', cacheKey, result.value);
        await cache.save();
        return { ...result.value, source: 'ai' };
      }
      if (attempt === 1) stats.validation_retries += 1;
    } catch (err) {
      stats.errors.push(`Themes request failed: ${err.message}`);
      break;
    }
  }
  return fallbackThemes(analyzed);
}
