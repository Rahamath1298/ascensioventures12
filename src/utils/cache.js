/**
 * In-memory LRU cache with TTL support.
 */

export class LRUCache {
  /**
   * Initializes the LRU cache with max capacity and default TTL.
   * @param {number} [max=200] - Maximum number of entries
   * @param {number} [ttlMs=600000] - Time to live in ms (default 10 min)
   */
  constructor(max = 200, ttlMs = 10 * 60 * 1000) {
    this.max = max;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  /**
   * Generates a normalized cache key for query and overrides.
   * @param {string} query - Raw search query
   * @param {Record<string, unknown>} [overrides] - Optional overrides object
   * @returns {string} Cache key
   */
  static generateKey(query, overrides = {}) {
    const normQuery = (query || '').trim().toLowerCase();
    const sortedOverrides = Object.keys(overrides || {})
      .sort()
      .reduce((acc, k) => {
        if (overrides[k] !== undefined && overrides[k] !== null) {
          acc[k] = overrides[k];
        }
        return acc;
      }, {});
    return `${normQuery}::${JSON.stringify(sortedOverrides)}`;
  }

  /**
   * Retrieves an item from cache if not expired.
   * @param {string} key - Cache key
   * @returns {unknown | null} Cached value or null
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    // Refresh position for LRU
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  /**
   * Stores an item in cache with LRU eviction.
   * @param {string} key - Cache key
   * @param {unknown} value - Value to cache
   * @param {number} [ttlMs] - Custom TTL in ms
   */
  set(key, value, ttlMs = this.ttlMs) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.max) {
      // Evict oldest entry (first item in Map iterator)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
  }

  /**
   * Clears all cache entries.
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Returns current cache size.
   * @returns {number} Current size
   */
  size() {
    return this.cache.size;
  }
}

export const searchCache = new LRUCache(200, 10 * 60 * 1000);
export const intentCache = new LRUCache(200, 10 * 60 * 1000);
export default searchCache;
