import fs from 'node:fs/promises';
import path from 'node:path';

const EMPTY = () => ({ analyses: {}, replies: {}, themes: {} });

/**
 * Small persistent key/value store backed by one JSON file, with separate namespaces for
 * review analyses, generated replies and dashboard themes. Writes go to a temp file first
 * and are renamed into place so a crash mid-write never corrupts the cache.
 */
export class JsonCache {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = EMPTY();
    this.writeChain = Promise.resolve();
  }

  async load() {
    try {
      const parsed = JSON.parse(await fs.readFile(this.filePath, 'utf8'));
      this.data = { ...EMPTY(), ...parsed };
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn(`Cache file unreadable, starting empty: ${err.message}`);
      this.data = EMPTY();
    }
    return this;
  }

  get(namespace, key) {
    return this.data[namespace][key];
  }

  set(namespace, key, value) {
    this.data[namespace][key] = value;
  }

  /** Persists the cache. Calls are serialised so concurrent saves cannot interleave. */
  save() {
    // .catch() first so one failed write does not make every later save fail too.
    this.writeChain = this.writeChain.catch(() => {}).then(async () => {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const tmp = `${this.filePath}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(this.data, null, 2));
      await fs.rename(tmp, this.filePath);
    });
    return this.writeChain;
  }
}
