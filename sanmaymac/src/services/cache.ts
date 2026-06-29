type CacheEnvelope<T> = {
  value: T;
  expiresAt: number;
};

const CACHE_PREFIX = 'sanmaymac-cache:';

const buildKey = (key: string) => `${CACHE_PREFIX}${key}`;

const now = () => Date.now();

export const cacheService = {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    const raw = localStorage.getItem(buildKey(key));
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as CacheEnvelope<T>;
      if (typeof parsed.expiresAt === 'number' && parsed.expiresAt < now()) {
        localStorage.removeItem(buildKey(key));
        return null;
      }
      return parsed.value;
    } catch {
      localStorage.removeItem(buildKey(key));
      return null;
    }
  },

  set<T>(key: string, value: T, ttlMs: number) {
    if (typeof window === 'undefined') return;

    const payload: CacheEnvelope<T> = {
      value,
      expiresAt: now() + ttlMs,
    };

    localStorage.setItem(buildKey(key), JSON.stringify(payload));
  },

  remove(key: string) {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(buildKey(key));
  },

  clearByPrefix(prefix: string) {
    if (typeof window === 'undefined') return;

    const targetPrefix = buildKey(prefix);
    Object.keys(localStorage)
      .filter((key) => key.startsWith(targetPrefix))
      .forEach((key) => localStorage.removeItem(key));
  },
};

export const cacheKeys = {
  categories: 'catalog:categories',
  customerProfile: 'customer:profile',
  favoriteProducts: (userId: string | number) => `catalog:favorites:${userId}`,
};

export const cacheTtl = {
  categories: 24 * 60 * 60 * 1000,
  customerProfile: 30 * 60 * 1000,
  favoriteProducts: 10 * 60 * 1000,
};