import { cleanReviews, parseCsv } from '../csv/cleanReviews.js';
import { analyzeTexts, createRunStats } from './analyzer.js';
import {
  analyzedOnly,
  attachResults,
  buildProductBreakdown,
  buildRatingAgreement,
  buildSummary,
} from './report.js';
import { generateThemes } from './themes.js';

/**
 * Full upload flow: parse + clean the CSV, analyse each unique text once (cache first, then
 * the LLM in batches), and build everything the dashboard needs in one response.
 */
export async function runPipeline(csvInput, { llm, cache, batchSize }) {
  const startedAt = Date.now();
  const stats = createRunStats();

  const cleaned = cleanReviews(parseCsv(csvInput));

  // Same text => same hash => analysed once, even if it appears in several rows or products.
  const uniqueTexts = new Map();
  cleaned
    .filter((r) => r.status === 'pending' || r.status === 'duplicate')
    .forEach((r) => uniqueTexts.set(r.hash, { hash: r.hash, text: r.text }));

  const resultsByHash = await analyzeTexts([...uniqueTexts.values()], { llm, cache, batchSize, stats });
  const reviews = attachResults(cleaned, resultsByHash);
  const themes = await generateThemes(analyzedOnly(reviews), { llm, cache, stats });

  return {
    reviews,
    summary: buildSummary(reviews),
    themes,
    rating_agreement: buildRatingAgreement(reviews),
    products: buildProductBreakdown(reviews),
    stats: { ...stats, unique_texts: uniqueTexts.size, processing_ms: Date.now() - startedAt, model: llm.model },
  };
}
