import { createContext, useContext, useRef, useCallback, ReactNode, useState } from 'react';

/**
 * ApiCacheProvider / useApiCache
 *
 * Context-scoped version of the API cache — dedupes identical requests
 * across multiple component instances (e.g. several <AutocompleteInput>s
 * fetching the same URL+query), without relying on module-level global
 * state. Wrap your app (or a subtree) in <ApiCacheProvider> once; every
 * component under it that calls useApiCache() shares the same cache.
 *
 * Why context instead of a module-level singleton:
 *  - Cache lifetime is tied to the provider's mount, not the whole JS
 *    module's lifetime — unmounting the provider naturally drops the
 *    cache (useful for logout, switching database/tenant, tests).
 *  - You can nest multiple independent providers if different parts of
 *    the app need isolated caches (e.g. per-database, from your
 *    multi-DB setup).
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

interface ApiCacheContextValue {
  cachedFetch: <T>(key: string, fetcher: () => Promise<T>, ttlMs?: number) => Promise<T>;
  invalidate: (key: string) => void;
  invalidatePrefix: (prefix: string) => void;
  clear: () => void;
  isCached: (key: string, ttlMs?: number) => boolean;
  invalidateEvent: number;
}

const ApiCacheContext = createContext<ApiCacheContextValue | null>(null);

const DEFAULT_TTL_MS = 60_000;

export function ApiCacheProvider({ children }: { children: ReactNode }) {
  const cache = useRef(new Map<string, CacheEntry<any>>());
  const inFlight = useRef(new Map<string, Promise<any>>());

  // This thing alternate between True and False
  // The sole purpose is to have an easy way to trigger useEffect callback
  const [invalidateEvent, setInvalidateEvent] = useState(0);

  const cachedFetch = useCallback(async <T,>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = DEFAULT_TTL_MS
  ): Promise<T> => {
    const cached = cache.current.get(key);
    if (cached && Date.now() - cached.timestamp < ttlMs) {
      return cached.value;
    }

    const existing = inFlight.current.get(key);
    if (existing) {
      return existing;
    }

    const promise = fetcher()
      .then((value) => {
        cache.current.set(key, { value, timestamp: Date.now() });
        inFlight.current.delete(key);
        return value;
      })
      .catch((err) => {
        inFlight.current.delete(key);
        throw err;
      });

    inFlight.current.set(key, promise);
    return promise;
  }, []);

  const invalidate = useCallback((key: string) => {
    cache.current.delete(key);
    inFlight.current.delete(key);
    setInvalidateEvent(v => v + 1);
  }, []);

  // Busts every cached key starting with `prefix` — e.g. invalidatePrefix('/employees/search:')
  // clears cached results for every distinct query against that endpoint at once,
  // without needing to know each individual query string that was cached.
  const invalidatePrefix = useCallback((prefix: string) => {
    for (const key of cache.current.keys()) {
      if (key.startsWith(prefix)) {
        cache.current.delete(key);
      }
    }
    for (const key of inFlight.current.keys()) {
      if (key.startsWith(prefix)) {
        inFlight.current.delete(key);
      }
    }
    setInvalidateEvent(v => v + 1);
  }, []);

  const clear = useCallback(() => {
    cache.current.clear();
    inFlight.current.clear();
    setInvalidateEvent(v => v + 1);
  }, []);

  const isCached = useCallback((key: string, ttlMs: number = DEFAULT_TTL_MS) => {
    const cached = cache.current.get(key);
    return !!cached && Date.now() - cached.timestamp < ttlMs;
  }, [])

  return (
    <ApiCacheContext.Provider value={{ cachedFetch, invalidate, invalidatePrefix, clear, isCached, invalidateEvent }}>
      {children}
    </ApiCacheContext.Provider>
  );
}

/** Access the shared cache from any component under <ApiCacheProvider>. */
export function useApiCache(): ApiCacheContextValue {
  const ctx = useContext(ApiCacheContext);
  if (!ctx) {
    throw new Error('useApiCache must be used within an ApiCacheProvider');
  }
  return ctx;
}