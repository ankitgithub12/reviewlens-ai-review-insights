export const SENTIMENTS = ['positive', 'neutral', 'negative'];
export const TOPICS = ['quality', 'delivery', 'price', 'packaging', 'support', 'size_fit', 'other'];

const ANALYSIS_FIELDS = ['sentiment', 'topics', 'summary', 'needs_reply'];
const MAX_SUMMARY_LENGTH = 300;

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Parses model output as JSON, tolerating a ```json fence some models add despite instructions. */
export function parseJsonContent(content) {
  const unfenced = String(content).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(unfenced);
}

/**
 * Validates one analysis object. It must have exactly the four fields with allowed values.
 * Returns { ok: true, value } with a normalised copy, or { ok: false, error }.
 */
export function validateAnalysis(candidate) {
  if (!isPlainObject(candidate)) return { ok: false, error: 'analysis is not an object' };

  const extra = Object.keys(candidate).filter((key) => !ANALYSIS_FIELDS.includes(key));
  if (extra.length > 0) return { ok: false, error: `unexpected field(s): ${extra.join(', ')}` };

  const { sentiment, topics, summary, needs_reply: needsReply } = candidate;

  if (!SENTIMENTS.includes(sentiment)) return { ok: false, error: `invalid sentiment: ${JSON.stringify(sentiment)}` };

  if (!Array.isArray(topics) || topics.length === 0) return { ok: false, error: 'topics must be a non-empty array' };
  const badTopic = topics.find((topic) => !TOPICS.includes(topic));
  if (badTopic !== undefined) return { ok: false, error: `invalid topic: ${JSON.stringify(badTopic)}` };

  if (typeof summary !== 'string') return { ok: false, error: 'summary must be a string' };
  const oneLineSummary = summary.replace(/\s+/g, ' ').trim();
  if (!oneLineSummary) return { ok: false, error: 'summary is empty' };
  if (oneLineSummary.length > MAX_SUMMARY_LENGTH) return { ok: false, error: 'summary is too long' };

  if (typeof needsReply !== 'boolean') return { ok: false, error: 'needs_reply must be a boolean' };

  return {
    ok: true,
    value: { sentiment, topics: [...new Set(topics)], summary: oneLineSummary, needs_reply: needsReply },
  };
}

/**
 * Validates a batch response of the form {"results": [{"id": "...", ...analysis}]}.
 * Every expected id gets either a valid analysis or an error, so one bad item never sinks the batch.
 */
export function validateBatchResponse(content, expectedIds) {
  const valid = new Map();
  const errors = new Map();

  let parsed;
  try {
    parsed = parseJsonContent(content);
  } catch {
    expectedIds.forEach((id) => errors.set(id, 'response was not valid JSON'));
    return { valid, errors };
  }

  const items = isPlainObject(parsed) && Array.isArray(parsed.results) ? parsed.results : null;
  if (!items) {
    expectedIds.forEach((id) => errors.set(id, 'response has no "results" array'));
    return { valid, errors };
  }

  const byId = new Map();
  for (const item of items) {
    if (!isPlainObject(item)) continue;
    const id = String(item.id);
    byId.set(id, byId.has(id) ? null : item); // null marks an id the model returned twice
  }

  for (const id of expectedIds) {
    const item = byId.get(id);
    if (item === undefined) {
      errors.set(id, 'missing from response');
      continue;
    }
    if (item === null) {
      errors.set(id, 'returned more than once');
      continue;
    }
    const { id: _ignored, ...analysis } = item;
    const result = validateAnalysis(analysis);
    if (result.ok) valid.set(id, result.value);
    else errors.set(id, result.error);
  }
  return { valid, errors };
}
