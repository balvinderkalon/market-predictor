const cache = new Map<string, { data: unknown; ts: number }>();

// Smart TTLs per data type
const TTL_MAP: Record<string, number> = {
  quotes: 60 * 1000,        // 60s for quotes
  'market-data': 60 * 1000, // 60s for market data
  sentiment: 5 * 60 * 1000, // 5min for indicators/sentiment
  news: 60 * 60 * 1000,     // 1hr for news
  'ai-summary': 5 * 60 * 1000, // 5min for AI summaries
};

function getTTL(key: string): number {
  for (const [prefix, ttl] of Object.entries(TTL_MAP)) {
    if (key.startsWith(prefix)) return ttl;
  }
  return 5 * 60 * 1000; // default 5min
}

export function getCache<T>(key: string, ttlMs?: number): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  const ttl = ttlMs ?? getTTL(key);
  if (Date.now() - entry.ts > ttl) { cache.delete(key); return null; }
  return entry.data as T;
}

export function setCache(key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() });
}
