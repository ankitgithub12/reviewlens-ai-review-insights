import express from 'express';
import multer from 'multer';
import { hashText, normalizeText } from '../csv/cleanReviews.js';
import { analysisCacheKey } from '../analysis/analyzer.js';
import { runPipeline } from '../analysis/pipeline.js';
import { generateReply } from '../analysis/reply.js';

/** Thrown for bad client input; the error handler turns it into a 4xx response. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const MAX_REPLY_INPUT_CHARS = 5000;

export function createApiRouter({ llm, cache, batchSize, maxUploadBytes }) {
  const router = express.Router();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxUploadBytes, files: 1 } });

  const requireLlm = () => {
    if (!llm) throw new HttpError(503, 'LLM_API_KEY is not set on the server. Copy .env.example to .env and add a key.');
  };

  router.get('/health', (req, res) => {
    res.json({ ok: true, llm_configured: Boolean(llm), model: llm?.model ?? null });
  });

  router.post('/analyze', upload.single('file'), async (req, res) => {
    requireLlm();
    if (!req.file) throw new HttpError(400, 'Upload a CSV file in the "file" field.');
    if (!/\.csv$/i.test(req.file.originalname)) throw new HttpError(400, 'Only .csv files are accepted.');
    res.json(await runPipeline(req.file.buffer, { llm, cache, batchSize }));
  });

  /** Suggested reply, generated on demand. Only reviews that were already analysed are accepted. */
  router.post('/reply', express.json({ limit: '20kb' }), async (req, res) => {
    requireLlm();
    const product = normalizeText(String(req.body?.product ?? '')).slice(0, 200);
    const text = normalizeText(String(req.body?.review_text ?? ''));
    if (!text || text.length > MAX_REPLY_INPUT_CHARS) throw new HttpError(400, 'review_text is required.');

    const analysis = cache.get('analyses', analysisCacheKey(hashText(text)));
    if (!analysis) throw new HttpError(404, 'This review has not been analysed yet. Upload the CSV first.');

    res.json(await generateReply({ product, text, analysis }, { llm, cache }));
  });

  return router;
}
