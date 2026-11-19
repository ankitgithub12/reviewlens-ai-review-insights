import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';

export const REQUIRED_COLUMNS = ['review_text'];

/** Thrown when the upload cannot be read as a reviews CSV at all (bad header, unparseable). */
export class CsvFormatError extends Error {}

const HTML_ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

/** Removes HTML tags/entities, invisible characters and repeated whitespace. */
export function normalizeText(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFC')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => HTML_ENTITIES[entity])
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F​‎‏﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Ratings must be a whole number from 1 to 5; anything else is "unknown". */
export function parseRating(raw) {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (value === '') return { rating: null, flag: 'missing_rating' };
  if (/^[1-5](\.0+)?$/.test(value)) return { rating: Number.parseInt(value, 10), flag: null };
  return { rating: null, flag: 'invalid_rating' };
}

function parseDate(raw) {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}

/** Cache/dedupe key: case-insensitive, whitespace-insensitive hash of the review text. */
export function hashText(text) {
  return createHash('sha256').update(text.toLowerCase()).digest('hex');
}

/** Parses raw CSV bytes into row objects keyed by lower-case header names. */
export function parseCsv(input) {
  let records;
  try {
    records = parse(input, {
      bom: true,
      columns: (header) => header.map((h) => h.trim().toLowerCase()),
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
      trim: false,
    });
  } catch (err) {
    throw new CsvFormatError(`Could not parse CSV: ${err.message}`);
  }
  if (records.length === 0) throw new CsvFormatError('The CSV file has no data rows.');
  const columns = Object.keys(records[0]);
  const missing = REQUIRED_COLUMNS.filter((c) => !columns.includes(c));
  if (missing.length > 0) throw new CsvFormatError(`Missing required column(s): ${missing.join(', ')}`);
  return records;
}

/**
 * Turns parsed rows into review objects with a status:
 *  - "pending"   valid, needs analysis
 *  - "skipped"   no usable text (empty review)
 *  - "duplicate" same text as an earlier review of the same product
 * Flags record data problems (missing/invalid rating, HTML stripped, ...) without dropping the row.
 */
export function cleanReviews(records) {
  const seen = new Map(); // product + text hash -> first review_id
  return records.map((row, index) => {
    const flags = [];
    const rawText = row.review_text ?? '';
    const text = normalizeText(rawText);
    if (/<[^>]+>/.test(rawText)) flags.push('html_stripped');

    const { rating, flag: ratingFlag } = parseRating(row.rating);
    if (ratingFlag) flags.push(ratingFlag);

    const date = parseDate(row.date);
    if (row.date && !date) flags.push('invalid_date');

    const product = normalizeText(row.product ?? '') || 'Unknown product';
    const reviewId = normalizeText(row.review_id ?? '') || `ROW-${index + 2}`;

    const review = {
      review_id: reviewId,
      product,
      rating,
      rating_raw: (row.rating ?? '').trim(),
      date,
      text,
      hash: text ? hashText(text) : null,
      status: 'pending',
      duplicate_of: null,
      flags,
    };

    if (!text) {
      review.status = 'skipped';
      review.flags.push('empty_text');
      return review;
    }

    const dedupeKey = `${product.toLowerCase()}::${review.hash}`;
    if (seen.has(dedupeKey)) {
      review.status = 'duplicate';
      review.duplicate_of = seen.get(dedupeKey);
    } else {
      seen.set(dedupeKey, reviewId);
    }
    return review;
  });
}
