/**
 * Caching Utility Module for AI Tools
 * Provides multi-level caching optimized for Anthropic API
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
// Custom file-based storage implementation
const fileStorage = {
  // Initialize storage
  async init(options) {
    this.dir = options.dir;
    this.ttl = options.ttl || 0;
    await fs.ensureDir(this.dir);
  },
  
  // Get item from storage
  async getItem(key) {
    try {
      const filePath = path.join(this.dir, `${key}.json`);
      if (!await fs.pathExists(filePath)) {
        return null;
      }
      
      const data = await fs.readJson(filePath);
      
      // Check TTL if specified
      if (this.ttl > 0) {
        const now = Date.now();
        if (data.timestamp && now - data.timestamp > this.ttl) {
          // Entry expired, remove it
          await fs.remove(filePath);
          return null;
        }
      }
      
      return data.value;
    } catch (error) {
      console.error(`Error reading cache file: ${error.message}`);
      return null;
    }
  },
  
  // Set item in storage
  async setItem(key, value) {
    try {
      const filePath = path.join(this.dir, `${key}.json`);
      await fs.writeJson(filePath, {
        value,
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      console.error(`Error writing cache file: ${error.message}`);
      return false;
    }
  },
  
  // Remove item from storage
  async removeItem(key) {
    try {
      const filePath = path.join(this.dir, `${key}.json`);
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }
      return true;
    } catch (error) {
      console.error(`Error removing cache file: ${error.message}`);
      return false;
    }
  },
  
  // Get all keys
  async keys() {
    try {
      const files = await fs.readdir(this.dir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.slice(0, -5)); // Remove .json extension
    } catch (error) {
      console.error(`Error reading cache directory: ${error.message}`);
      return [];
    }
  },
  
  // Clear all items
  async clear() {
    try {
      const files = await fs.readdir(this.dir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.remove(path.join(this.dir, file));
        }
      }
      return true;
    } catch (error) {
      console.error(`Error clearing cache: ${error.message}`);
      return false;
    }
  }
};
const { promisify } = require('util');

// Cache configuration
const DEFAULT_CONFIG = {
  // Memory cache settings
  memoryCache: {
    enabled: true,
    maxItems: 1000,
    ttl: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },
  // Persistent cache settings
  persistentCache: {
    enabled: true,
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    storageDir: path.resolve('cache'),
  },
  // Metrics settings
  metrics: {
    enabled: true,
    logInterval: 60 * 60 * 1000, // 1 hour in milliseconds
  }
};

// Runtime cache configuration
let config = { ...DEFAULT_CONFIG };

// In-memory cache
const memoryCache = new Map();
const memoryCacheTimestamps = new Map();
const memoryCacheHits = new Map();

// Metrics
const metrics = {
  hits: {
    memory: 0,
    persistent: 0,
    total: 0
  },
  misses: {
    memory: 0,
    persistent: 0,
    total: 0
  },
  stores: {
    memory: 0,
    persistent: 0,
    total: 0
  },
  tokensSaved: 0,
  estimatedCostSaved: 0,
  startTime: Date.now(),
  lastResetTime: Date.now()
};

/**
 * Initialize the cache module
 * @param {Object} customConfig - Custom configuration
 * @returns {Promise<void>}
 */
async function initialize(customConfig = {}) {
  try {
    // Merge custom configuration with defaults
    config = {
      ...DEFAULT_CONFIG,
      ...customConfig,
      memoryCache: {
        ...DEFAULT_CONFIG.memoryCache,
        ...customConfig.memoryCache
      },
      persistentCache: {
        ...DEFAULT_CONFIG.persistentCache,
        ...customConfig.persistentCache
      },
      metrics: {
        ...DEFAULT_CONFIG.metrics,
        ...customConfig.metrics
      }
    };
    
    // Initialize persistent storage if enabled
    if (config.persistentCache.enabled) {
      await fileStorage.init({
        dir: config.persistentCache.storageDir,
        ttl: config.persistentCache.ttl
      });
    }
    
    // Start metrics logging if enabled
    if (config.metrics.enabled && config.metrics.logInterval > 0) {
      setInterval(() => {
        logMetrics();
      }, config.metrics.logInterval);
    }
    
    console.log('Cache initialized with config:', JSON.stringify(config, null, 2));
  } catch (error) {
    throw new Error(`Error initializing cache: ${error.message}`);
  }
}

/**
 * Generate a cache key from request parameters
 * @param {Object} params - Request parameters
 * @param {string} params.prompt - The prompt text
 * @param {string} params.model - The model name
 * @param {Object} params.options - Additional options
 * @returns {string} - Cache key
 */
function generateCacheKey(params) {
  // Extract relevant parameters
  const { prompt, model, options = {} } = params;
  
  // Create a normalized object for hashing
  const normalizedParams = {
    prompt: prompt.trim(),
    model: model,
    options: { ...options }
  };
  
  // Remove non-deterministic or irrelevant options
  delete normalizedParams.options.stream;
  delete normalizedParams.options.timeout;
  
  // Generate hash
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(normalizedParams))
    .digest('hex');
}

/**
 * Estimate token count for a string (Anthropic-specific)
 * @param {string} text - Text to estimate tokens for
 * @returns {number} - Estimated token count
 */
function estimateTokenCount(text) {
  if (!text) return 0;
  
  // Simple estimation: ~4 characters per token for English text
  // This is a rough approximation for Claude models
  return Math.ceil(text.length / 4);
}

/**
 * Estimate cost for tokens (Anthropic-specific)
 * @param {number} promptTokens - Number of prompt tokens
 * @param {number} completionTokens - Number of completion tokens
 * @param {string} model - Model name
 * @returns {number} - Estimated cost in USD
 */
function estimateCost(promptTokens, completionTokens, model = 'claude-3-opus') {
  // Pricing as of March 2025 for Anthropic models (per 1M tokens)
  const pricing = {
    'claude-3-opus': {
      prompt: 15, // $15 per 1M tokens
      completion: 75 // $75 per 1M tokens
    },
    'claude-3-sonnet': {
      prompt: 3, // $3 per 1M tokens
      completion: 15 // $15 per 1M tokens
    },
    'claude-3-haiku': {
      prompt: 0.25, // $0.25 per 1M tokens
      completion: 1.25 // $1.25 per 1M tokens
    },
    'claude-2.1': {
      prompt: 8, // $8 per 1M tokens
      completion: 24 // $24 per 1M tokens
    },
    'claude-2.0': {
      prompt: 8, // $8 per 1M tokens
      completion: 24 // $24 per 1M tokens
    },
    'claude-instant-1.2': {
      prompt: 1.63, // $1.63 per 1M tokens
      completion: 5.51 // $5.51 per 1M tokens
    }
  };
  
  // Default to opus pricing if model not found
  const modelPricing = pricing[model] || pricing['claude-3-opus'];
  
  // Calculate cost
  const promptCost = (promptTokens / 1000000) * modelPricing.prompt;
  const completionCost = (completionTokens / 1000000) * modelPricing.completion;
  
  return promptCost + completionCost;
}

/**
 * Get a cached response
 * @param {Object} params - Request parameters
 * @returns {Promise<Object|null>} - Cached response or null if not found
 */
async function getCachedResponse(params) {
  try {
    const cacheKey = generateCacheKey(params);
    
    // Try memory cache first
    if (config.memoryCache.enabled) {
      const memoryResult = memoryCache.get(cacheKey);
      
      if (memoryResult) {
        const timestamp = memoryCacheTimestamps.get(cacheKey);
        const now = Date.now();
        
        // Check if cache entry is still valid
        if (now - timestamp < config.memoryCache.ttl) {
          // Update hit count
          const hits = memoryCacheHits.get(cacheKey) || 0;
          memoryCacheHits.set(cacheKey, hits + 1);
          
          // Update metrics
          metrics.hits.memory++;
          metrics.hits.total++;
          
          // Estimate tokens saved
          const promptTokens = estimateTokenCount(params.prompt);
          const completionTokens = estimateTokenCount(memoryResult.content);
          metrics.tokensSaved += promptTokens + completionTokens;
          metrics.estimatedCostSaved += estimateCost(promptTokens, completionTokens, params.model);
          
          return {
            ...memoryResult,
            cached: true,
            cacheSource: 'memory',
            cacheKey
          };
        }
        
        // Entry expired, remove it
        memoryCache.delete(cacheKey);
        memoryCacheTimestamps.delete(cacheKey);
        memoryCacheHits.delete(cacheKey);
      }
      
      metrics.misses.memory++;
    }
    
    // Try persistent cache if memory cache failed
    if (config.persistentCache.enabled) {
      const persistentResult = await fileStorage.getItem(cacheKey);
      
      if (persistentResult) {
        // Cache hit in persistent storage
        
        // Store in memory cache for faster access next time
        if (config.memoryCache.enabled) {
          memoryCache.set(cacheKey, persistentResult);
          memoryCacheTimestamps.set(cacheKey, Date.now());
          memoryCacheHits.set(cacheKey, 1);
          
          // Enforce memory cache size limit
          enforceCacheLimit();
        }
        
        // Update metrics
        metrics.hits.persistent++;
        metrics.hits.total++;
        
        // Estimate tokens saved
        const promptTokens = estimateTokenCount(params.prompt);
        const completionTokens = estimateTokenCount(persistentResult.content);
        metrics.tokensSaved += promptTokens + completionTokens;
        metrics.estimatedCostSaved += estimateCost(promptTokens, completionTokens, params.model);
        
        return {
          ...persistentResult,
          cached: true,
          cacheSource: 'persistent',
          cacheKey
        };
      }
      
      metrics.misses.persistent++;
    }
    
    // Cache miss
    metrics.misses.total++;
    
    return null;
  } catch (error) {
    console.error(`Cache error: ${error.message}`);
    // On error, return null to proceed without caching
    return null;
  }
}

/**
 * Store a response in the cache
 * @param {Object} params - Request parameters
 * @param {Object} response - Response to cache
 * @returns {Promise<boolean>} - Success status
 */
async function setCachedResponse(params, response) {
  try {
    const cacheKey = generateCacheKey(params);
    
    // Prepare cache entry
    const cacheEntry = {
      ...response,
      cachedAt: Date.now()
    };
    
    // Store in memory cache
    if (config.memoryCache.enabled) {
      memoryCache.set(cacheKey, cacheEntry);
      memoryCacheTimestamps.set(cacheKey, Date.now());
      memoryCacheHits.set(cacheKey, 0);
      
      // Enforce memory cache size limit
      enforceCacheLimit();
      
      metrics.stores.memory++;
    }
    
    // Store in persistent cache
    if (config.persistentCache.enabled) {
      await fileStorage.setItem(cacheKey, cacheEntry);
      metrics.stores.persistent++;
    }
    
    metrics.stores.total++;
    
    return true;
  } catch (error) {
    console.error(`Error storing cache entry: ${error.message}`);
    return false;
  }
}

/**
 * Enforce memory cache size limit using LRU policy
 */
function enforceCacheLimit() {
  if (memoryCache.size <= config.memoryCache.maxItems) {
    return;
  }
  
  // Get entries sorted by last access time and hit count
  const entries = Array.from(memoryCache.keys()).map(key => ({
    key,
    timestamp: memoryCacheTimestamps.get(key) || 0,
    hits: memoryCacheHits.get(key) || 0
  }));
  
  // Sort by a combination of timestamp and hits (weighted)
  // This is a simple LRU with frequency consideration
  entries.sort((a, b) => {
    // Weight: 70% recency, 30% frequency
    const scoreA = 0.7 * a.timestamp + 0.3 * a.hits;
    const scoreB = 0.7 * b.timestamp + 0.3 * b.hits;
    return scoreA - scoreB;
  });
  
  // Remove oldest entries until we're under the limit
  const entriesToRemove = entries.slice(0, entries.length - config.memoryCache.maxItems);
  
  for (const entry of entriesToRemove) {
    memoryCache.delete(entry.key);
    memoryCacheTimestamps.delete(entry.key);
    memoryCacheHits.delete(entry.key);
  }
}

/**
 * Invalidate cache entries
 * @param {Object} options - Invalidation options
 * @param {string} options.key - Specific cache key to invalidate
 * @param {RegExp} options.promptPattern - Pattern to match against prompts
 * @param {string} options.model - Model to invalidate entries for
 * @param {number} options.olderThan - Invalidate entries older than this timestamp
 * @returns {Promise<Object>} - Invalidation results
 */
async function invalidateCache(options = {}) {
  try {
    const { key, promptPattern, model, olderThan } = options;
    
    let memoryInvalidated = 0;
    let persistentInvalidated = 0;
    
    // Invalidate specific key
    if (key) {
      if (config.memoryCache.enabled && memoryCache.has(key)) {
        memoryCache.delete(key);
        memoryCacheTimestamps.delete(key);
        memoryCacheHits.delete(key);
        memoryInvalidated++;
      }
      
      if (config.persistentCache.enabled) {
        await fileStorage.removeItem(key);
        persistentInvalidated++;
      }
      
      return {
        success: true,
        memoryInvalidated,
        persistentInvalidated,
        total: memoryInvalidated + persistentInvalidated
      };
    }
    
    // More complex invalidation requires checking each entry
    if (promptPattern || model || olderThan) {
      // Memory cache invalidation
      if (config.memoryCache.enabled) {
        for (const [cacheKey, entry] of memoryCache.entries()) {
          let shouldInvalidate = false;
          
          // Check timestamp
          if (olderThan && memoryCacheTimestamps.get(cacheKey) < olderThan) {
            shouldInvalidate = true;
          }
          
          // Check model
          if (model && entry.model === model) {
            shouldInvalidate = true;
          }
          
          // Check prompt pattern
          if (promptPattern && promptPattern.test(entry.prompt)) {
            shouldInvalidate = true;
          }
          
          if (shouldInvalidate) {
            memoryCache.delete(cacheKey);
            memoryCacheTimestamps.delete(cacheKey);
            memoryCacheHits.delete(cacheKey);
            memoryInvalidated++;
          }
        }
      }
      
      // Persistent cache invalidation
      if (config.persistentCache.enabled) {
        const keys = await fileStorage.keys();
        
        for (const cacheKey of keys) {
          const entry = await fileStorage.getItem(cacheKey);
          let shouldInvalidate = false;
          
          // Check timestamp
          if (olderThan && entry.cachedAt < olderThan) {
            shouldInvalidate = true;
          }
          
          // Check model
          if (model && entry.model === model) {
            shouldInvalidate = true;
          }
          
          // Check prompt pattern
          if (promptPattern && promptPattern.test(entry.prompt)) {
            shouldInvalidate = true;
          }
          
          if (shouldInvalidate) {
            await fileStorage.removeItem(cacheKey);
            persistentInvalidated++;
          }
        }
      }
    }
    
    return {
      success: true,
      memoryInvalidated,
      persistentInvalidated,
      total: memoryInvalidated + persistentInvalidated
    };
  } catch (error) {
    throw new Error(`Error invalidating cache: ${error.message}`);
  }
}

/**
 * Clear the entire cache
 * @returns {Promise<Object>} - Clear results
 */
async function clearCache() {
  try {
    let memoryCleared = 0;
    let persistentCleared = 0;
    
    // Clear memory cache
    if (config.memoryCache.enabled) {
      memoryCleared = memoryCache.size;
      memoryCache.clear();
      memoryCacheTimestamps.clear();
      memoryCacheHits.clear();
    }
    
    // Clear persistent cache
    if (config.persistentCache.enabled) {
      const keys = await fileStorage.keys();
      persistentCleared = keys.length;
      await fileStorage.clear();
    }
    
    return {
      success: true,
      memoryCleared,
      persistentCleared,
      total: memoryCleared + persistentCleared
    };
  } catch (error) {
    throw new Error(`Error clearing cache: ${error.message}`);
  }
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} - Cache statistics
 */
async function getCacheStats() {
  try {
    const stats = {
      config: { ...config },
      memory: {
        enabled: config.memoryCache.enabled,
        size: memoryCache.size,
        maxSize: config.memoryCache.maxItems,
        usage: config.memoryCache.enabled ? memoryCache.size / config.memoryCache.maxItems : 0
      },
      persistent: {
        enabled: config.persistentCache.enabled,
        size: 0
      },
      metrics: { ...metrics },
      hitRate: {
        memory: metrics.hits.memory / (metrics.hits.memory + metrics.misses.memory) || 0,
        persistent: metrics.hits.persistent / (metrics.hits.persistent + metrics.misses.persistent) || 0,
        overall: metrics.hits.total / (metrics.hits.total + metrics.misses.total) || 0
      }
    };
    
    // Get persistent cache size
    if (config.persistentCache.enabled) {
      const keys = await fileStorage.keys();
      stats.persistent.size = keys.length;
    }
    
    return stats;
  } catch (error) {
    throw new Error(`Error getting cache stats: ${error.message}`);
  }
}

/**
 * Reset cache metrics
 */
function resetMetrics() {
  metrics.hits.memory = 0;
  metrics.hits.persistent = 0;
  metrics.hits.total = 0;
  metrics.misses.memory = 0;
  metrics.misses.persistent = 0;
  metrics.misses.total = 0;
  metrics.stores.memory = 0;
  metrics.stores.persistent = 0;
  metrics.stores.total = 0;
  metrics.tokensSaved = 0;
  metrics.estimatedCostSaved = 0;
  metrics.lastResetTime = Date.now();
}

/**
 * Log cache metrics
 */
function logMetrics() {
  const stats = {
    timestamp: new Date().toISOString(),
    uptime: Date.now() - metrics.startTime,
    since: new Date(metrics.lastResetTime).toISOString(),
    hits: metrics.hits,
    misses: metrics.misses,
    stores: metrics.stores,
    hitRate: {
      memory: metrics.hits.memory / (metrics.hits.memory + metrics.misses.memory) || 0,
      persistent: metrics.hits.persistent / (metrics.hits.persistent + metrics.misses.persistent) || 0,
      overall: metrics.hits.total / (metrics.hits.total + metrics.misses.total) || 0
    },
    tokensSaved: metrics.tokensSaved,
    estimatedCostSaved: metrics.estimatedCostSaved.toFixed(4)
  };
  
  console.log('Cache Metrics:', JSON.stringify(stats, null, 2));
}

// Initialize on module load
initialize().catch(console.error);

module.exports = {
  initialize,
  generateCacheKey,
  getCachedResponse,
  setCachedResponse,
  invalidateCache,
  clearCache,
  getCacheStats,
  resetMetrics,
  estimateTokenCount,
  estimateCost
};
