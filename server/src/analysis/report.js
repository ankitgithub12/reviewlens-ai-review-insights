import { SENTIMENTS, TOPICS } from '../llm/schema.js';

const INJECTION_PATTERNS = [
  /\b(ignore|disregard|forget)\b.{0,20}\b(previous|prior|above|earlier|all)\b.{0,20}\b(instructions?|prompts?|rules?)\b/i,
  /\byou are now\b/i,
  /\bsystem prompt\b/i,
  /\b(mark|classify|label)\b.{0,15}\breview\b.{0,15}\bas\b/i,
];

/** Heuristic flag shown in the UI; the real defence is the prompt design (see README). */
export function looksLikePromptInjection(text) {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

/** What the star rating alone would suggest. */
export function sentimentFromRating(rating) {
  if (rating == null) return null;
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'negative';
}

/** A mismatch is an opposite-polarity disagreement, e.g. 5 stars with a negative text (R008). */
export function isRatingMismatch(rating, sentiment) {
  if (rating == null || !sentiment) return false;
  return (rating >= 4 && sentiment === 'negative') || (rating <= 2 && sentiment === 'positive');
}

const percent = (part, whole) => (whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10);

/** Attaches analysis results (keyed by text hash) to the cleaned reviews and sets final statuses. */
export function attachResults(reviews, resultsByHash) {
  return reviews.map((review) => {
    const result = review.hash ? resultsByHash.get(review.hash) : undefined;
    const enriched = { ...review, analysis: null, source: null, error: null, rating_mismatch: false };

    if (review.text && looksLikePromptInjection(review.text)) {
      enriched.flags = [...review.flags, 'prompt_injection_suspected'];
    }
    if (review.status === 'skipped' || !result) return enriched;

    if (result.analysis) {
      enriched.analysis = result.analysis;
      enriched.source = result.source;
      enriched.rating_mismatch = isRatingMismatch(review.rating, result.analysis.sentiment);
      if (review.status === 'pending') enriched.status = 'analyzed';
    } else {
      enriched.error = result.error;
      if (review.status === 'pending') enriched.status = 'analysis_failed';
    }
    return enriched;
  });
}

function sentimentSplit(analyzed) {
  const counts = Object.fromEntries(SENTIMENTS.map((s) => [s, 0]));
  analyzed.forEach((r) => {
    counts[r.analysis.sentiment] += 1;
  });
  return Object.fromEntries(SENTIMENTS.map((s) => [s, { count: counts[s], pct: percent(counts[s], analyzed.length) }]));
}

/** Topic counts for reviews with the given sentiment, most frequent first. */
function topicRanking(analyzed, sentiment) {
  const byTopic = new Map(TOPICS.map((topic) => [topic, []]));
  analyzed
    .filter((r) => r.analysis.sentiment === sentiment)
    .forEach((r) => r.analysis.topics.forEach((topic) => byTopic.get(topic).push(r.review_id)));
  return [...byTopic.entries()]
    .filter(([, ids]) => ids.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([topic, ids]) => ({ topic, count: ids.length, review_ids: ids }));
}

const TOPIC_LABELS = {
  quality: 'Product quality',
  delivery: 'Delivery',
  price: 'Price / value',
  packaging: 'Packaging',
  support: 'Customer support',
  size_fit: 'Size and fit',
  other: 'Other',
};

/** Deterministic top-3 complaints/praises from topic counts, used when the AI themes call fails. */
export function fallbackThemes(analyzed) {
  const toThemes = (ranking, suffix) =>
    ranking.slice(0, 3).map(({ topic, review_ids }) => ({
      theme: `${TOPIC_LABELS[topic]} ${suffix}`,
      review_ids,
      count: review_ids.length,
    }));
  return {
    complaints: toThemes(topicRanking(analyzed, 'negative'), 'complaints'),
    praises: toThemes(topicRanking(analyzed, 'positive'), 'praised'),
    source: 'fallback',
  };
}

/** Canonical analysed reviews only: duplicates and failures are excluded from statistics. */
export const analyzedOnly = (reviews) => reviews.filter((r) => r.status === 'analyzed');

export function buildSummary(reviews) {
  const analyzed = analyzedOnly(reviews);
  const countStatus = (status) => reviews.filter((r) => r.status === status).length;
  return {
    total_rows: reviews.length,
    analyzed: analyzed.length,
    skipped_empty: countStatus('skipped'),
    duplicates: countStatus('duplicate'),
    failed: countStatus('analysis_failed'),
    sentiment: sentimentSplit(analyzed),
    needs_reply: analyzed.filter((r) => r.analysis.needs_reply).length,
  };
}

export function buildRatingAgreement(reviews) {
  const comparable = analyzedOnly(reviews).filter((r) => r.rating != null);
  const agreed = comparable.filter((r) => sentimentFromRating(r.rating) === r.analysis.sentiment).length;
  return {
    compared: comparable.length,
    agreed,
    agreement_pct: percent(agreed, comparable.length),
    mismatched_ids: comparable.filter((r) => r.rating_mismatch).map((r) => r.review_id),
  };
}

export function buildProductBreakdown(reviews) {
  const analyzed = analyzedOnly(reviews);
  const products = [...new Set(reviews.map((r) => r.product))].sort();
  return products.map((product) => {
    const productReviews = analyzed.filter((r) => r.product === product);
    const ratings = productReviews.map((r) => r.rating).filter((rating) => rating != null);
    return {
      product,
      analyzed: productReviews.length,
      sentiment: sentimentSplit(productReviews),
      needs_reply: productReviews.filter((r) => r.analysis.needs_reply).length,
      avg_rating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
      top_issues: topicRanking(productReviews, 'negative').slice(0, 3),
    };
  });
}
