import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import multer from 'multer';
import { CsvFormatError } from './csv/cleanReviews.js';
import { LlmHttpError } from './llm/retry.js';
import { createApiRouter, HttpError } from './routes/api.js';

export function createApp({ llm, cache, batchSize, maxUploadBytes, clientDist }) {
  const app = express();
  app.disable('x-powered-by');

  app.use('/api', createApiRouter({ llm, cache, batchSize, maxUploadBytes }));

  // In production the built React app is served from the same origin as the API.
  if (clientDist && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  // Express 5 forwards rejected async handlers here, so no route can crash the process.
  app.use((err, req, res, _next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    if (err instanceof CsvFormatError) return res.status(400).json({ error: err.message });
    if (err instanceof multer.MulterError) return res.status(400).json({ error: `Upload error: ${err.message}` });
    // The AI provider failed (bad key, model, rate limit after retries, invalid output twice):
    // tell the user why instead of a generic 500. 502 = an upstream service failed.
    if (err instanceof LlmHttpError) {
      console.error(err.message);
      return res.status(502).json({ error: `AI provider error: ${err.message}` });
    }
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong on the server.' });
  });

  return app;
}
