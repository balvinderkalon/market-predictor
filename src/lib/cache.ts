const cache = new Map<string, { data: unknown; ts: number }>();

export function getCache<T>(key: string, ttlMs = 5 * 60 * 1000): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttlMs) { cache.delete(key); return null; }
  return entry.data as T;
}

export function setCache(key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() });
}
