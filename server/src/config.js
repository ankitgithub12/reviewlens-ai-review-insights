import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(serverRoot, '..');

// The .env file lives at the repository root so there is a single place for secrets.
dotenv.config({ path: path.join(repoRoot, '.env'), quiet: true });

function intFromEnv(name, fallback) {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  port: intFromEnv('PORT', 3001),
  llm: {
    apiKey: process.env.LLM_API_KEY?.trim() || '',
    baseUrl: (process.env.LLM_BASE_URL?.trim() || 'https://api.groq.com/openai/v1').replace(/\/+$/, ''),
    model: process.env.LLM_MODEL?.trim() || 'openai/gpt-oss-120b',
    maxAttempts: intFromEnv('LLM_MAX_ATTEMPTS', 4),
    baseDelayMs: intFromEnv('LLM_BASE_DELAY_MS', 1000),
    timeoutMs: intFromEnv('LLM_TIMEOUT_MS', 60000),
  },
  batchSize: intFromEnv('BATCH_SIZE', 5),
  cacheFile: process.env.CACHE_FILE?.trim() || path.join(serverRoot, 'data', 'cache.json'),
  clientDist: path.join(repoRoot, 'client', 'dist'),
  maxUploadBytes: 2 * 1024 * 1024,
};
