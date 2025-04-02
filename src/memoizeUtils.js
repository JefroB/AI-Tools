/**
 * Memoization Utility Module for AI Tools
 * Provides function memoization to reduce computational costs and API calls
 */

const crypto = require('crypto');
const cacheUtils = require('./cacheUtils');

// In-memory cache for memoized functions
const memoCache = new Map();
const memoStats = {
  hits: 0,
  misses: 0,
  stores: 0,
  evictions: 0
};

/**
 * Default options for memoization
 */
const DEFAULT_MEMO_OPTIONS = {
  // Cache settings
  maxSize: 1000,                  // Maximum number of cached results
  ttl: 24 * 60 * 60 * 1000,       // Time-to-live in milliseconds (24 hours)
  persistent: false,              // Whether to use persistent cache
  
  // Key generation
  keyGenerator: null,             // Custom function to generate cache keys
  
  // Cache behavior
  ignoreErrors: false,            // Whether to cache errors
  
  // Metrics
  trackMetrics: true,             // Whether to track metrics
  
  // Advanced options
  contextSensitive: false,        // Whether the function depends on external context
  deepEquality: false,            // Whether to use deep equality for arguments
};

/**
 * Generate a cache key from function arguments
 * @param {Function} fn - The function being memoized
 * @param {Array} args - Function arguments
 * @param {Object} options - Memoization options
 * @returns {string} - Cache key
 */
function generateCacheKey(fn, args, options) {
  // If a custom key generator is provided, use it
  if (typeof options.keyGenerator === 'function') {
    return options.keyGenerator(...args);
  }
  
  // Create a normalized object for hashing
  const keyComponents = {
    // Include function name or toString for anonymous functions
    fn: fn.name || fn.toString().slice(0, 100),
    // Serialize arguments
    args: options.deepEquality ? JSON.stringify(args) : args.map(arg => {
      if (arg === null || arg === undefined) {
        return String(arg);
      }
      
      // Handle primitive types directly
      if (typeof arg !== 'object' && typeof arg !== 'function') {
        return String(arg);
      }
      
      // For objects, use a simple representation
      if (typeof arg === 'object') {
        if (Array.isArray(arg)) {
          return `array:${arg.length}`;
        }
        if (arg instanceof Date) {
          return `date:${arg.getTime()}`;
        }
        if (arg instanceof RegExp) {
          return `regexp:${arg.toString()}`;
        }
        return `object:${Object.keys(arg).sort().join(',')}`;
      }
      
      // For functions, use name or partial toString
      if (typeof arg === 'function') {
        return `function:${arg.name || arg.toString().slice(0, 50)}`;
      }
      
      return String(arg);
    })
  };
  
  // Generate hash
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(keyComponents))
    .digest('hex');
}

/**
 * Enforce cache size limit using LRU policy
 * @param {Object} options - Memoization options
 */
function enforceCacheLimit(options) {
  if (memoCache.size <= options.maxSize) {
    return;
  }
  
  // Get entries sorted by last access time
  const entries = Array.from(memoCache.entries()).map(([key, entry]) => ({
    key,
    timestamp: entry.timestamp || 0,
    hits: entry.hits || 0
  }));
  
  // Sort by a combination of timestamp and hits (weighted)
  entries.sort((a, b) => {
    // Weight: 70% recency, 30% frequency
    const scoreA = 0.7 * a.timestamp + 0.3 * a.hits;
    const scoreB = 0.7 * b.timestamp + 0.3 * b.hits;
    return scoreA - scoreB;
  });
  
  // Remove oldest entries until we're under the limit
  const entriesToRemove = entries.slice(0, entries.length - options.maxSize);
  
  for (const entry of entriesToRemove) {
    memoCache.delete(entry.key);
    memoStats.evictions++;
  }
}

/**
 * Memoize a synchronous function
 * @param {Function} fn - Function to memoize
 * @param {Object} options - Memoization options
 * @returns {Function} - Memoized function
 */
function memoize(fn, options = {}) {
  // Merge options with defaults
  const memoOptions = { ...DEFAULT_MEMO_OPTIONS, ...options };
  
  // Return memoized function
  return function(...args) {
    // Generate cache key
    const cacheKey = generateCacheKey(fn, args, memoOptions);
    
    // Check in-memory cache
    if (memoCache.has(cacheKey)) {
      const cached = memoCache.get(cacheKey);
      
      // Check if entry is still valid
      if (!cached.expiry || cached.expiry > Date.now()) {
        // Update hit count and timestamp
        cached.hits = (cached.hits || 0) + 1;
        cached.timestamp = Date.now();
        
        // Update metrics
        if (memoOptions.trackMetrics) {
          memoStats.hits++;
        }
        
        // Return cached result (or throw cached error)
        if (cached.error && !memoOptions.ignoreErrors) {
          throw cached.error;
        }
        
        return cached.result;
      }
      
      // Entry expired, remove it
      memoCache.delete(cacheKey);
    }
    
    // Cache miss, update metrics
    if (memoOptions.trackMetrics) {
      memoStats.misses++;
    }
    
    try {
      // Execute function
      const result = fn(...args);
      
      // Cache result
      const expiry = memoOptions.ttl ? Date.now() + memoOptions.ttl : null;
      memoCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
        expiry,
        hits: 1
      });
      
      // Update metrics
      if (memoOptions.trackMetrics) {
        memoStats.stores++;
      }
      
      // Enforce cache size limit
      enforceCacheLimit(memoOptions);
      
      // Store in persistent cache if enabled
      if (memoOptions.persistent && cacheUtils) {
        cacheUtils.setCachedResponse({ cacheKey }, {
          result,
          timestamp: Date.now(),
          expiry
        }).catch(err => console.error('Error storing in persistent cache:', err));
      }
      
      return result;
    } catch (error) {
      // Cache error if configured to do so
      if (memoOptions.ignoreErrors) {
        const expiry = memoOptions.ttl ? Date.now() + memoOptions.ttl : null;
        memoCache.set(cacheKey, {
          error,
          timestamp: Date.now(),
          expiry,
          hits: 1
        });
        
        // Update metrics
        if (memoOptions.trackMetrics) {
          memoStats.stores++;
        }
        
        // Enforce cache size limit
        enforceCacheLimit(memoOptions);
      }
      
      // Re-throw the error
      throw error;
    }
  };
}

/**
 * Memoize an asynchronous function
 * @param {Function} fn - Async function to memoize
 * @param {Object} options - Memoization options
 * @returns {Function} - Memoized async function
 */
function memoizeAsync(fn, options = {}) {
  // Merge options with defaults
  const memoOptions = { ...DEFAULT_MEMO_OPTIONS, ...options };
  
  // Return memoized async function
  return async function(...args) {
    // Generate cache key
    const cacheKey = generateCacheKey(fn, args, memoOptions);
    
    // Check in-memory cache
    if (memoCache.has(cacheKey)) {
      const cached = memoCache.get(cacheKey);
      
      // Check if entry is still valid
      if (!cached.expiry || cached.expiry > Date.now()) {
        // Update hit count and timestamp
        cached.hits = (cached.hits || 0) + 1;
        cached.timestamp = Date.now();
        
        // Update metrics
        if (memoOptions.trackMetrics) {
          memoStats.hits++;
        }
        
        // Return cached result (or throw cached error)
        if (cached.error && !memoOptions.ignoreErrors) {
          throw cached.error;
        }
        
        return cached.result;
      }
      
      // Entry expired, remove it
      memoCache.delete(cacheKey);
    }
    
    // Check persistent cache if enabled
    if (memoOptions.persistent && cacheUtils) {
      try {
        const persistentCached = await cacheUtils.getCachedResponse({ cacheKey });
        
        if (persistentCached) {
          // Store in memory cache for faster access next time
          memoCache.set(cacheKey, {
            result: persistentCached.result,
            timestamp: Date.now(),
            expiry: persistentCached.expiry,
            hits: 1
          });
          
          // Update metrics
          if (memoOptions.trackMetrics) {
            memoStats.hits++;
          }
          
          // Enforce cache size limit
          enforceCacheLimit(memoOptions);
          
          return persistentCached.result;
        }
      } catch (err) {
        console.error('Error retrieving from persistent cache:', err);
      }
    }
    
    // Cache miss, update metrics
    if (memoOptions.trackMetrics) {
      memoStats.misses++;
    }
    
    try {
      // Execute async function
      const result = await fn(...args);
      
      // Cache result
      const expiry = memoOptions.ttl ? Date.now() + memoOptions.ttl : null;
      memoCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
        expiry,
        hits: 1
      });
      
      // Update metrics
      if (memoOptions.trackMetrics) {
        memoStats.stores++;
      }
      
      // Enforce cache size limit
      enforceCacheLimit(memoOptions);
      
      // Store in persistent cache if enabled
      if (memoOptions.persistent && cacheUtils) {
        cacheUtils.setCachedResponse({ cacheKey }, {
          result,
          timestamp: Date.now(),
          expiry
        }).catch(err => console.error('Error storing in persistent cache:', err));
      }
      
      return result;
    } catch (error) {
      // Cache error if configured to do so
      if (memoOptions.ignoreErrors) {
        const expiry = memoOptions.ttl ? Date.now() + memoOptions.ttl : null;
        memoCache.set(cacheKey, {
          error,
          timestamp: Date.now(),
          expiry,
          hits: 1
        });
        
        // Update metrics
        if (memoOptions.trackMetrics) {
          memoStats.stores++;
        }
        
        // Enforce cache size limit
        enforceCacheLimit(memoOptions);
      }
      
      // Re-throw the error
      throw error;
    }
  };
}

/**
 * Clear the memoization cache
 * @param {Object} options - Clear options
 * @param {Function} options.fn - Clear cache only for this function
 * @param {RegExp} options.keyPattern - Clear cache entries matching this pattern
 * @param {number} options.olderThan - Clear entries older than this timestamp
 * @returns {Object} - Clear results
 */
function clearMemoCache(options = {}) {
  const { fn, keyPattern, olderThan } = options;
  let cleared = 0;
  
  // If no specific options, clear everything
  if (!fn && !keyPattern && !olderThan) {
    cleared = memoCache.size;
    memoCache.clear();
    return { cleared };
  }
  
  // Selective clearing
  for (const [key, entry] of memoCache.entries()) {
    let shouldClear = false;
    
    // Check function
    if (fn && key.includes(fn.name || fn.toString().slice(0, 100))) {
      shouldClear = true;
    }
    
    // Check key pattern
    if (keyPattern && keyPattern.test(key)) {
      shouldClear = true;
    }
    
    // Check age
    if (olderThan && entry.timestamp < olderThan) {
      shouldClear = true;
    }
    
    if (shouldClear) {
      memoCache.delete(key);
      cleared++;
    }
  }
  
  return { cleared };
}

/**
 * Get memoization statistics
 * @returns {Object} - Memoization statistics
 */
function getMemoStats() {
  return {
    cacheSize: memoCache.size,
    ...memoStats,
    hitRate: memoStats.hits / (memoStats.hits + memoStats.misses) || 0
  };
}

/**
 * Reset memoization statistics
 */
function resetMemoStats() {
  memoStats.hits = 0;
  memoStats.misses = 0;
  memoStats.stores = 0;
  memoStats.evictions = 0;
}

/**
 * Create a decorator for memoizing class methods
 * @param {Object} options - Memoization options
 * @returns {Function} - Method decorator
 */
function memoizeMethod(options = {}) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    if (typeof originalMethod !== 'function') {
      throw new Error('Memoize decorator can only be applied to methods');
    }
    
    // Check if method is async
    const isAsync = originalMethod.constructor.name === 'AsyncFunction';
    
    // Create memoized version
    const memoizedMethod = isAsync
      ? memoizeAsync(originalMethod, options)
      : memoize(originalMethod, options);
    
    // Replace original method with memoized version
    descriptor.value = function(...args) {
      return memoizedMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

module.exports = {
  memoize,
  memoizeAsync,
  memoizeMethod,
  clearMemoCache,
  getMemoStats,
  resetMemoStats
};
