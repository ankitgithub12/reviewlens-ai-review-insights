import { config } from './config.js';
import { JsonCache } from './cache/jsonCache.js';
import { createLlmClient } from './llm/client.js';
import { createApp } from './app.js';

const cache = await new JsonCache(config.cacheFile).load();

const llm = config.llm.apiKey ? createLlmClient(config.llm) : null;
if (!llm) console.warn('LLM_API_KEY is not set - uploads will be rejected until you add it to .env');

const app = createApp({
  llm,
  cache,
  batchSize: config.batchSize,
  maxUploadBytes: config.maxUploadBytes,
  clientDist: config.clientDist,
});

app.listen(config.port, () => {
  console.log(`ReviewLens API listening on http://localhost:${config.port} (model: ${config.llm.model})`);
});
