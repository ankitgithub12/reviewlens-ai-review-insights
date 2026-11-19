import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanReviews, CsvFormatError, normalizeText, parseCsv, parseRating } from '../src/csv/cleanReviews.js';
import { SAMPLE_CSV } from './helpers.js';

const reviews = cleanReviews(parseCsv(SAMPLE_CSV));
const byId = (id) => reviews.find((r) => r.review_id === id);

test('parses all 30 rows of the sample file, including quoted multi-sentence text', () => {
  assert.equal(reviews.length, 30);
  assert.match(byId('R028').text, /^I was worried .* especially during a sale\.$/);
});

test('empty review text is skipped and flagged, not sent for analysis', () => {
  assert.equal(byId('R005').status, 'skipped');
  assert.ok(byId('R005').flags.includes('empty_text'));
  assert.equal(byId('R005').hash, null);
});

test('missing and invalid ratings become unknown (null) with a flag', () => {
  assert.equal(byId('R010').rating, null);
  assert.ok(byId('R010').flags.includes('missing_rating'));
  assert.equal(byId('R022').rating, null);
  assert.equal(byId('R022').rating_raw, 'five');
  assert.ok(byId('R022').flags.includes('invalid_rating'));
  assert.equal(byId('R001').rating, 5);
});

test('duplicate text is detected and points at the first occurrence', () => {
  assert.equal(byId('R012').status, 'pending');
  assert.equal(byId('R015').status, 'duplicate');
  assert.equal(byId('R015').duplicate_of, 'R012');
  assert.equal(byId('R015').hash, byId('R012').hash);
});

test('HTML is stripped, Hindi and emoji are preserved', () => {
  assert.equal(byId('R024').text, 'Love it! Keeps my desk clean, and the bamboo smells nice.');
  assert.ok(byId('R024').flags.includes('html_stripped'));
  assert.match(byId('R016').text, /बैटरी/);
  assert.equal(byId('R009').text, '👍👍');
  assert.equal(byId('R009').status, 'pending');
});

test('dedupe ignores case and extra whitespace', () => {
  const rows = cleanReviews([
    { review_id: 'A', product: 'P', rating: '4', review_text: 'Great   product' },
    { review_id: 'B', product: 'P', rating: '4', review_text: ' great product ' },
  ]);
  assert.equal(rows[1].status, 'duplicate');
});

test('rating parser accepts only whole numbers 1-5', () => {
  assert.equal(parseRating('3').rating, 3);
  assert.equal(parseRating(' 4.0 ').rating, 4);
  for (const bad of ['0', '6', '3.5', '-1', 'abc']) assert.equal(parseRating(bad).flag, 'invalid_rating');
});

test('normalizeText removes tags, entities and invisible characters', () => {
  assert.equal(normalizeText('<i>Nice</i> &amp; ​cheap\n\n'), 'Nice & cheap');
});

test('rejects files without a review_text column or without rows', () => {
  assert.throws(() => parseCsv('id,comment\n1,hello'), CsvFormatError);
  assert.throws(() => parseCsv('review_id,review_text\n'), CsvFormatError);
});
