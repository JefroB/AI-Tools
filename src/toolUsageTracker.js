/**
 * Tool Usage Tracker Module for AI Tools
 * 
 * This module provides functionality to track usage of AI-Tools functions,
 * estimate token savings, and analyze efficiency.
 */

const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const safeStringify = require('fast-safe-stringify');
const { performance } = require('perf_hooks');

// Default configuration
const DEFAULT_CONFIG = {
  enabled: true,
  storageDir: path.resolve('metrics/tool-usage'),
  persistInterval: 60 * 60 * 1000, // 1 hour in milliseconds
  retentionDays: 30, // Keep metrics for 30 days
  maxMemoryEntries: 10000, // Maximum number of entries to keep in memory
  sampling: {
    enabled: false,
    baseRate: 1.0, // 100% sampling by default
    minRate: 0.01, // Never sample less than 1%
    loadThreshold: 1000 // calls per minute
  },
  batching: {
    enabled: true,
    batchSize: 50,
    flushInterval: 10000 // 10 seconds
  }
};

// Runtime configuration
let config = { ...DEFAULT_CONFIG };

// In-memory storage for tool usage data
const toolUsageStore = {
  // Overall metrics
  metrics: {
    totalCalls: 0,
    totalExecutionTime: 0,
    avgExecutionTime: 0,
    totalEstimatedTokenSavings: 0,
    errorCount: 0,
    errorRate: 0
  },
  
  // Metrics by tool
  byTool: {},
  
  // Metrics by category
  byCategory: {},
  
  // Recent entries
  entries: [],
  
  // System info
  system: {
    startTime: Date.now(),
    lastResetTime: Date.now(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  }
};

// Batch logger for efficient storage
class BatchLogger {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 50;
    this.flushInterval = options.flushInterval || 10000; // 10 seconds
    this.queue = [];
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  log(entry) {
    this.queue.push(entry);
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.queue.length === 0) return;
    
    const batch = [...this.queue];
    this.queue = [];
    
    try {
      await this.persistBatch(batch);
    } catch (error) {
      console.error('Error flushing log batch:', error);
      // Re-queue failed items or write to backup storage
      this.handleFlushFailure(batch, error);
    }
  }

  async persistBatch(batch) {
    // Create filename based on current date
    const now = new Date();
    const filename = `tool_usage_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.json`;
    const filePath = path.join(config.storageDir, filename);
    
    // Check if file exists
    let existingData = [];
    try {
      if (await fs.pathExists(filePath)) {
        existingData = await fs.readJson(filePath);
      }
    } catch (error) {
      console.error(`Error reading existing data file ${filePath}:`, error);
    }
    
    // Append new data
    const updatedData = [...existingData, ...batch];
    
    // Write to file
    await fs.ensureDir(config.storageDir);
    await fs.writeJson(filePath, updatedData, { spaces: 2 });
  }

  handleFlushFailure(batch, error) {
    // Write to backup storage (e.g., local file)
    const backupFile = `tool_usage_backup_${Date.now()}.json`;
    const backupPath = path.join(config.storageDir, 'backups');
    
    fs.ensureDir(backupPath)
      .then(() => {
        fs.writeJson(path.join(backupPath, backupFile), batch, { spaces: 2 })
          .catch(err => console.error('Error writing backup file:', err));
      })
      .catch(err => console.error('Error creating backup directory:', err));
  }

  shutdown() {
    clearInterval(this.timer);
    return this.flush(); // Final flush
  }
}

// Adaptive sampler for high-volume scenarios
class AdaptiveSampler {
  constructor(options = {}) {
    this.baseRate = options.baseRate || 1.0; // 100% sampling by default
    this.minRate = options.minRate || 0.01; // Never sample less than 1%
    this.loadThreshold = options.loadThreshold || 1000; // calls per minute
    this.currentRate = this.baseRate;
    this.callsLastMinute = 0;
    this.lastRateAdjustment = Date.now();
    
    // Reset counter every minute
    setInterval(() => {
      this.adjustSamplingRate();
      this.callsLastMinute = 0;
    }, 60000);
  }

  shouldSample() {
    this.callsLastMinute++;
    return Math.random() < this.currentRate;
  }

  adjustSamplingRate() {
    const callsPerMinute = this.callsLastMinute;
    
    // Adjust sampling rate based on load
    if (callsPerMinute > this.loadThreshold * 2) {
      this.currentRate = Math.max(this.minRate, this.currentRate * 0.5);
    } else if (callsPerMinute > this.loadThreshold) {
      this.currentRate = Math.max(this.minRate, this.currentRate * 0.75);
    } else if (callsPerMinute < this.loadThreshold / 2) {
      this.currentRate = Math.min(this.baseRate, this.currentRate * 1.25);
    }
    
    console.log(`Adjusted sampling rate to ${this.currentRate * 100}% based on ${callsPerMinute} calls/minute`);
  }

  getExtrapolationFactor() {
    return 1 / this.currentRate; // For scaling metrics
  }
}

// Initialize batch logger
let batchLogger = new BatchLogger({
  batchSize: config.batching.batchSize,
  flushInterval: config.batching.flushInterval
});

// Initialize adaptive sampler
let sampler = new AdaptiveSampler({
  baseRate: config.sampling.baseRate,
  minRate: config.sampling.minRate,
  loadThreshold: config.sampling.loadThreshold
});

/**
 * Initialize the tool usage tracker
 * @param {Object} customConfig - Custom configuration
 * @returns {Promise<void>}
 */
async function initialize(customConfig = {}) {
  try {
    // Merge custom configuration with defaults
    config = {
      ...DEFAULT_CONFIG,
      ...customConfig,
      sampling: {
        ...DEFAULT_CONFIG.sampling,
        ...(customConfig.sampling || {})
      },
      batching: {
        ...DEFAULT_CONFIG.batching,
        ...(customConfig.batching || {})
      }
    };
    
    // Ensure storage directory exists
    if (config.enabled) {
      await fs.ensureDir(config.storageDir);
      
      // Create backups directory
      await fs.ensureDir(path.join(config.storageDir, 'backups'));
    }
    
    // Re-initialize batch logger with new config
    batchLogger = new BatchLogger({
      batchSize: config.batching.batchSize,
      flushInterval: config.batching.flushInterval
    });
    
    // Re-initialize adaptive sampler with new config
    sampler = new AdaptiveSampler({
      baseRate: config.sampling.baseRate,
      minRate: config.sampling.minRate,
      loadThreshold: config.sampling.loadThreshold
    });
    
    // Set up cleanup job
    setInterval(() => {
      cleanupOldFiles().catch(console.error);
    }, 24 * 60 * 60 * 1000); // Run daily
    
    console.log('Tool usage tracker initialized with config:', JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(`Error initializing tool usage tracker: ${error.message}`);
    throw error;
  }
}

/**
 * Clean up old files based on retention policy
 * @returns {Promise<void>}
 */
async function cleanupOldFiles() {
  try {
    // Get all tool usage files
    const files = await fs.readdir(config.storageDir);
    const usageFiles = files.filter(file => file.startsWith('tool_usage_') && file.endsWith('.json'));
    
    // Calculate cutoff date
    const cutoffTime = Date.now() - (config.retentionDays * 24 * 60 * 60 * 1000);
    
    // Delete old files
    for (const file of usageFiles) {
      try {
        // Extract date from filename
        const dateMatch = file.match(/tool_usage_(\d{4}-\d{2}-\d{2})\.json/);
        if (dateMatch) {
          const fileDate = new Date(dateMatch[1]);
          if (fileDate.getTime() < cutoffTime) {
            await fs.unlink(path.join(config.storageDir, file));
            console.log(`Deleted old tool usage file: ${file}`);
          }
        }
      } catch (error) {
        console.error(`Error deleting old tool usage file ${file}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`Error cleaning up old tool usage files: ${error.message}`);
  }
}

/**
 * Sanitize arguments for logging
 * @param {Array} args - Function arguments
 * @param {Function} sanitizer - Custom sanitizer function
 * @returns {Array} - Sanitized arguments
 */
function sanitizeArguments(args, sanitizer = defaultSanitizer) {
  return args.map(arg => {
    try {
      return sanitizer(arg);
    } catch (e) {
      console.error("Error sanitizing argument", e);
      return '<SANITIZATION_ERROR>';
    }
  });
}

/**
 * Sanitize result for logging
 * @param {any} result - Function result
 * @param {Function} sanitizer - Custom sanitizer function
 * @returns {any} - Sanitized result
 */
function sanitizeResult(result, sanitizer = defaultSanitizer) {
  try {
    return sanitizer(result);
  } catch (e) {
    console.error("Error sanitizing result", e);
    return '<SANITIZATION_ERROR>';
  }
}

/**
 * Default sanitizer function
 * @param {any} arg - Value to sanitize
 * @returns {any} - Sanitized value
 */
function defaultSanitizer(arg) {
  if (typeof arg === 'string') {
    return arg.length > 100 ? arg.substring(0, 100) + '...' : arg;
  } else if (typeof arg === 'object' && arg !== null) {
    try {
      return JSON.parse(safeStringify(arg, (key, value) => {
        if (key.toLowerCase().includes('password') || 
            key.toLowerCase().includes('token') || 
            key.toLowerCase().includes('api') || 
            key.toLowerCase().includes('secret') || 
            key.toLowerCase().includes('key')) {
          return '<REDACTED>';
        }
        
        // Truncate long strings
        if (typeof value === 'string' && value.length > 100) {
          return value.substring(0, 100) + '...';
        }
        
        return value;
      }));
    } catch (e) {
      return '<OBJECT>';
    }
  } else {
    return arg;
  }
}

/**
 * Token savings estimation models
 */
const tokenSavingsModels = {
  // File operations
  readFile: (args, result) => {
    try {
      // Estimate based on file size if available
      if (result && typeof result === 'string') {
        return Math.ceil(result.length / 4); // Rough estimate: 4 chars per token
      } else if (result && typeof result === 'object') {
        return Math.ceil(JSON.stringify(result).length / 4);
      } else if (args && args[0] && typeof args[0] === 'string') {
        // Try to get file size from fs
        try {
          const stats = fs.statSync(args[0]);
          return Math.ceil(stats.size / 4);
        } catch (e) {
          // If we can't get file size, estimate based on path length
          return Math.ceil(args[0].length / 4) * 10; // Rough multiplier
        }
      }
      return 100; // Default if we can't determine
    } catch (e) {
      console.error("Error in readFile token estimator:", e);
      return 100; // Default on error
    }
  },
  
  // Write operations
  writeFile: (args, result) => {
    try {
      if (args && args.length >= 2) {
        const content = args[1];
        if (typeof content === 'string') {
          return Math.ceil(content.length / 4);
        } else if (typeof content === 'object') {
          return Math.ceil(JSON.stringify(content).length / 4);
        }
      }
      return 100; // Default if we can't determine
    } catch (e) {
      console.error("Error in writeFile token estimator:", e);
      return 100; // Default on error
    }
  },
  
  // Code operations
  formatCode: (args, result) => {
    try {
      // Estimate based on code size
      if (args && args.length >= 1 && typeof args[0] === 'string') {
        const code = args[0];
        // More complex code = more tokens saved
        const complexity = (code.match(/[{}]/g) || []).length; // Count braces as complexity indicator
        return Math.ceil(code.length / 4) + (complexity * 2);
      }
      return 150; // Default for code operations
    } catch (e) {
      console.error("Error in formatCode token estimator:", e);
      return 150; // Default on error
    }
  },
  
  // API operations
  apiRequest: (args, result) => {
    try {
      // Estimate based on response size
      if (result && typeof result === 'object') {
        return Math.ceil(JSON.stringify(result).length / 4);
      } else if (result && typeof result === 'string') {
        return Math.ceil(result.length / 4);
      }
      return 200; // Default for API operations
    } catch (e) {
      console.error("Error in apiRequest token estimator:", e);
      return 200; // Default on error
    }
  },
  
  // Default estimator
  default: (args, result) => {
    try {
      // Try to make a reasonable guess based on args and result
      let estimate = 100; // Base estimate
      
      // Add for each argument
      if (args && args.length) {
        args.forEach(arg => {
          if (typeof arg === 'string') {
            estimate += Math.ceil(arg.length / 8); // Less weight for args
          } else if (typeof arg === 'object' && arg !== null) {
            try {
              estimate += Math.ceil(JSON.stringify(arg).length / 8);
            } catch (e) {
              estimate += 20; // Default for objects we can't stringify
            }
          }
        });
      }
      
      // Add for result
      if (result) {
        if (typeof result === 'string') {
          estimate += Math.ceil(result.length / 4);
        } else if (typeof result === 'object' && result !== null) {
          try {
            estimate += Math.ceil(JSON.stringify(result).length / 4);
          } catch (e) {
            estimate += 50; // Default for objects we can't stringify
          }
        }
      }
      
      return estimate;
    } catch (e) {
      console.error("Error in default token estimator:", e);
      return 100; // Default on error
    }
  }
};

/**
 * Calculate estimated token savings
 * @param {string} toolName - Name of the tool
 * @param {Array} args - Function arguments
 * @param {any} result - Function result
 * @returns {number} - Estimated token savings
 */
function calculateTokenSavings(toolName, args, result) {
  try {
    // Get the appropriate estimator
    const estimator = tokenSavingsModels[toolName] || tokenSavingsModels.default;
    
    // Calculate estimate
    return estimator(args, result);
  } catch (error) {
    console.error(`Error calculating token savings for ${toolName}:`, error);
    return 100; // Default on error
  }
}

/**
 * Log tool usage
 * @param {Object} usage - Tool usage data
 * @returns {Promise<void>}
 */
async function logToolUsage(usage) {
  if (!config.enabled) return;
  
  try {
    // Apply sampling if enabled
    if (config.sampling.enabled && !sampler.shouldSample()) {
      // Update basic metrics even when not sampling
      updateMetrics(usage);
      return;
    }
    
    // Add timestamp and ID if not present
    const enhancedUsage = {
      id: usage.id || uuidv4(),
      timestamp: usage.timestamp || new Date().toISOString(),
      ...usage
    };
    
    // Update metrics
    updateMetrics(enhancedUsage);
    
    // Add to entries
    toolUsageStore.entries.push(enhancedUsage);
    
    // Enforce maximum entries limit
    if (toolUsageStore.entries.length > config.maxMemoryEntries) {
      toolUsageStore.entries.shift(); // Remove oldest entry
    }
    
    // Log to batch logger if batching is enabled
    if (config.batching.enabled) {
      batchLogger.log(enhancedUsage);
    } else {
      // Log directly to file
      const now = new Date();
      const filename = `tool_usage_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.json`;
      const filePath = path.join(config.storageDir, filename);
      
      // Check if file exists
      let existingData = [];
      try {
        if (await fs.pathExists(filePath)) {
          existingData = await fs.readJson(filePath);
        }
      } catch (error) {
        console.error(`Error reading existing data file ${filePath}:`, error);
      }
      
      // Append new data
      existingData.push(enhancedUsage);
      
      // Write to file
      await fs.ensureDir(config.storageDir);
      await fs.writeJson(filePath, existingData, { spaces: 2 });
    }
  } catch (error) {
    console.error(`Error logging tool usage:`, error);
  }
}

/**
 * Update metrics based on tool usage
 * @param {Object} usage - Tool usage data
 */
function updateMetrics(usage) {
  try {
    const { tool, category, executionTime, estimatedTokenSavings, error } = usage;
    
    // Update overall metrics
    toolUsageStore.metrics.totalCalls++;
    
    if (executionTime) {
      toolUsageStore.metrics.totalExecutionTime += executionTime;
      toolUsageStore.metrics.avgExecutionTime = 
        toolUsageStore.metrics.totalExecutionTime / toolUsageStore.metrics.totalCalls;
    }
    
    if (estimatedTokenSavings) {
      toolUsageStore.metrics.totalEstimatedTokenSavings += estimatedTokenSavings;
    }
    
    if (error) {
      toolUsageStore.metrics.errorCount++;
      toolUsageStore.metrics.errorRate = 
        toolUsageStore.metrics.errorCount / toolUsageStore.metrics.totalCalls;
    }
    
    // Update tool-specific metrics
    if (tool) {
      if (!toolUsageStore.byTool[tool]) {
        toolUsageStore.byTool[tool] = {
          calls: 0,
          executionTime: 0,
          avgExecutionTime: 0,
          estimatedTokenSavings: 0,
          errors: 0,
          errorRate: 0
        };
      }
      
      const toolMetrics = toolUsageStore.byTool[tool];
      toolMetrics.calls++;
      
      if (executionTime) {
        toolMetrics.executionTime += executionTime;
        toolMetrics.avgExecutionTime = toolMetrics.executionTime / toolMetrics.calls;
      }
      
      if (estimatedTokenSavings) {
        toolMetrics.estimatedTokenSavings += estimatedTokenSavings;
      }
      
      if (error) {
        toolMetrics.errors++;
        toolMetrics.errorRate = toolMetrics.errors / toolMetrics.calls;
      }
    }
    
    // Update category-specific metrics
    if (category) {
      if (!toolUsageStore.byCategory[category]) {
        toolUsageStore.byCategory[category] = {
          calls: 0,
          executionTime: 0,
          avgExecutionTime: 0,
          estimatedTokenSavings: 0,
          errors: 0,
          errorRate: 0,
          tools: {}
        };
      }
      
      const categoryMetrics = toolUsageStore.byCategory[category];
      categoryMetrics.calls++;
      
      if (executionTime) {
        categoryMetrics.executionTime += executionTime;
        categoryMetrics.avgExecutionTime = categoryMetrics.executionTime / categoryMetrics.calls;
      }
      
      if (estimatedTokenSavings) {
        categoryMetrics.estimatedTokenSavings += estimatedTokenSavings;
      }
      
      if (error) {
        categoryMetrics.errors++;
        categoryMetrics.errorRate = categoryMetrics.errors / categoryMetrics.calls;
      }
      
      // Track tools within category
      if (tool) {
        if (!categoryMetrics.tools[tool]) {
          categoryMetrics.tools[tool] = 0;
        }
        categoryMetrics.tools[tool]++;
      }
    }
  } catch (error) {
    console.error(`Error updating metrics:`, error);
  }
}

/**
 * Create a proxy wrapper for a function to track its usage
 * @param {Function} fn - Function to wrap
 * @param {string} category - Function category
 * @param {Object} options - Options
 * @returns {Function} - Wrapped function
 */
function createToolProxy(fn, category, options = {}) {
  // Ensure function name is available
  const fnName = fn.name || options.name || 'anonymous';
  
  return new Proxy(fn, {
    apply: async function(target, thisArg, argumentsList) {
      // Skip tracking if disabled
      if (!config.enabled) {
        return Reflect.apply(target, thisArg, argumentsList);
      }
      
      const startTime = performance.now();
      const id = uuidv4();
      let result, endTime, error;
      
      try {
        // Prepare arguments for logging (handle potential errors)
        let sanitizedArguments;
        try {
          sanitizedArguments = sanitizeArguments(argumentsList, options.argumentSanitizer);
        } catch (err) {
          console.error(`Error sanitizing arguments for tool ${fnName}:`, err);
          sanitizedArguments = ['<SANITIZATION_ERROR>'];
        }
        
        // Call the original function
        result = await Reflect.apply(target, thisArg, argumentsList);
        
        endTime = performance.now();
        
        // Sanitize the result
        let sanitizedResult;
        try {
          sanitizedResult = sanitizeResult(result, options.resultSanitizer);
        } catch (err) {
          console.error(`Error sanitizing result for tool ${fnName}:`, err);
          sanitizedResult = '<SANITIZATION_ERROR>';
        }
        
        // Calculate token savings
        const estimatedTokenSavings = calculateTokenSavings(fnName, argumentsList, result);
        
        // Log the usage
        await logToolUsage({
          id,
          tool: fnName,
          category,
          executionTime: endTime - startTime,
          arguments: sanitizedArguments,
          result: sanitizedResult,
          estimatedTokenSavings,
          timestamp: new Date().toISOString()
        });
        
        return result;
      } catch (err) {
        error = err;
        endTime = performance.now();
        
        // Log the error
        await logToolUsage({
          id,
          tool: fnName,
          category,
          executionTime: endTime - startTime,
          arguments: sanitizedArguments || ['<UNKNOWN>'],
          error: err.message || 'Unknown error',
          estimatedTokenSavings: 0,
          timestamp: new Date().toISOString()
        });
        
        // Re-throw the error
        throw err;
      }
    }
  });
}

/**
 * Get tool usage metrics
 * @param {Object} options - Options
 * @returns {Object} - Tool usage metrics
 */
function getToolUsageMetrics(options = {}) {
  const { timeRange, category, tool } = options;
  
  // Clone the metrics store to avoid modifying the original
  const metrics = JSON.parse(JSON.stringify(toolUsageStore));
  
  // Filter entries by time range if specified
  if (timeRange) {
    const cutoffTime = new Date(Date.now() - timeRange);
    metrics.entries = metrics.entries.filter(entry => 
      new Date(entry.timestamp) >= cutoffTime
    );
  }
  
  // Filter entries by category if specified
  if (category) {
    metrics.entries = metrics.entries.filter(entry => 
      entry.category === category
    );
  }
  
  // Filter entries by tool if specified
  if (tool) {
    metrics.entries = metrics.entries.filter(entry => 
      entry.tool === tool
    );
  }
  
  // Add system metrics
  metrics.system.uptime = Date.now() - metrics.system.startTime;
  metrics.system.timeSinceReset = Date.now() - metrics.system.lastResetTime;
  
  // Add sampling info if enabled
  if (config.sampling.enabled) {
    metrics.sampling = {
      currentRate: sampler.currentRate,
      extrapolationFactor: sampler.getExtrapolationFactor(),
      callsLastMinute: sampler.callsLastMinute
    };
    
    // Apply extrapolation to metrics if sampling is active
    if (sampler.currentRate < 1.0) {
      const factor = sampler.getExtrapolationFactor();
      
      // Extrapolate overall metrics
      metrics.metrics.totalCalls = Math.round(metrics.metrics.totalCalls * factor);
      metrics.metrics.totalEstimatedTokenSavings = Math.round(metrics.metrics.totalEstimatedTokenSavings * factor);
      metrics.metrics.errorCount = Math.round(metrics.metrics.errorCount * factor);
      
      // Extrapolate tool-specific metrics
      Object.keys(metrics.byTool).forEach(toolName => {
        const toolMetrics = metrics.byTool[toolName];
        toolMetrics.calls = Math.round(toolMetrics.calls * factor);
        toolMetrics.estimatedTokenSavings = Math.round(toolMetrics.estimatedTokenSavings * factor);
        toolMetrics.errors = Math.round(toolMetrics.errors * factor);
      });
      
      // Extrapolate category-specific metrics
      Object.keys(metrics.byCategory).forEach(categoryName => {
        const categoryMetrics = metrics.byCategory[categoryName];
        categoryMetrics.calls = Math.round(categoryMetrics.calls * factor);
        categoryMetrics.estimatedTokenSavings = Math.round(categoryMetrics.estimatedTokenSavings * factor);
        categoryMetrics.errors = Math.round(categoryMetrics.errors * factor);
        
        // Extrapolate tool counts within category
        Object.keys(categoryMetrics.tools).forEach(toolName => {
          categoryMetrics.tools[toolName] = Math.round(categoryMetrics.tools[toolName] * factor);
        });
      });
    }
  }
  
  return metrics;
}

/**
 * Reset tool usage metrics
 * @param {Object} options - Options
 * @returns {boolean} - Success status
 */
function resetToolUsageMetrics(options = {}) {
  const { keepEntries = false } = options;
  
  try {
    // Reset overall metrics
    toolUsageStore.metrics = {
      totalCalls: 0,
      totalExecutionTime: 0,
      avgExecutionTime: 0,
      totalEstimatedTokenSavings: 0,
      errorCount: 0,
      errorRate: 0
    };
    
    // Reset tool-specific metrics
    toolUsageStore.byTool = {};
    
    // Reset category-specific metrics
    toolUsageStore.byCategory = {};
    
    // Reset entries if not keeping them
    if (!keepEntries) {
      toolUsageStore.entries = [];
    }
    
    // Update reset time
    toolUsageStore.system.lastResetTime = Date.now();
    
    return true;
  } catch (error) {
    console.error(`Error resetting tool usage metrics:`, error);
    return false;
  }
}

/**
 * Cross-reference tool usage with Claude token usage
 * @param {Object} options - Options
 * @returns {Object} - Cross-reference analysis
 */
async function crossReferenceWithClaudeUsage(options = {}) {
  try {
    const { timeRange } = options;
    
    // Load tool usage data
    const toolUsage = getToolUsageMetrics({ timeRange });
    
    // Load Claude token data
    let claudeData;
    try {
      // Try to import metricsUtils
      const metricsUtils = require('./metricsUtils');
      claudeData = metricsUtils.getMetricsSummary({ timeRange });
    } catch (error) {
      console.error('Error loading Claude token data:', error);
      claudeData = { api: { tokens: { total: 0 } } };
    }
    
    // Calculate metrics
    const totalTokensSaved = toolUsage.metrics.totalEstimatedTokenSavings;
    const totalTokensUsed = claudeData.api.tokens.total || 0;
    
    const efficiencyRatio = (totalTokensUsed + totalTokensSaved) === 0 
      ? 0 
      : totalTokensSaved / (totalTokensUsed + totalTokensSaved);
    
    // Calculate cost savings (assuming $0.06 per 1K tokens)
    const costSaved = (totalTokensSaved / 1000) * 0.06;
    
    // Identify most used tools
    const toolsByUsage = Object.entries(toolUsage.byTool)
      .map(([name, metrics]) => ({ name, ...metrics }))
      .sort((a, b) => b.calls - a.calls);
    
    // Identify most token-saving tools
    const toolsByTokenSavings = Object.entries(toolUsage.byTool)
      .map(([name, metrics]) => ({ name, ...metrics }))
      .sort((a, b) => b.estimatedTokenSavings - a.estimatedTokenSavings);
    
    // Identify most efficient categories
    const categoriesByEfficiency = Object.entries(toolUsage.byCategory)
      .map(([name, metrics]) => ({ 
        name, 
        ...metrics,
        efficiencyRatio: metrics.calls > 0 
          ? metrics.estimatedTokenSavings / metrics.calls 
          : 0
      }))
      .sort((a, b) => b.efficiencyRatio - a.efficiencyRatio);
    
    // Return analysis
    return {
      summary: {
        totalTokensSaved,
        totalTokensUsed,
        totalTokens: totalTokensSaved + totalTokensUsed,
        efficiencyRatio,
        costSaved,
        toolCalls: toolUsage.metrics.totalCalls,
        apiCalls: claudeData.api.calls || 0
      },
      tools: {
        byUsage: toolsByUsage.slice(0, 10), // Top 10
        byTokenSavings: toolsByTokenSavings.slice(0, 10) // Top 10
      },
      categories: {
        byEfficiency: categoriesByEfficiency
      },
      timeRange: {
        start: timeRange ? new Date(Date.now() - timeRange).toISOString() : 'all time',
        end: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error(`Error cross-referencing with Claude usage:`, error);
    return {
      error: error.message,
      summary: {
        totalTokensSaved: 0,
        totalTokensUsed: 0,
        totalTokens: 0,
        efficiencyRatio: 0,
        costSaved: 0,
        toolCalls: 0,
        apiCalls: 0
      }
    };
  }
}

/**
 * Generate a comprehensive analysis report
 * @param {Object} options - Options
 * @returns {Object} - Analysis report
 */
async function generateAnalysisReport(options = {}) {
  try {
    // Get cross-reference analysis
    const crossReference = await crossReferenceWithClaudeUsage(options);
    
    // Get tool usage metrics
    const toolUsage = getToolUsageMetrics(options);
    
    // Calculate additional metrics
    const avgExecutionTime = toolUsage.metrics.totalCalls > 0
      ? toolUsage.metrics.totalExecutionTime / toolUsage.metrics.totalCalls
      : 0;
    
    const avgTokenSavingsPerCall = toolUsage.metrics.totalCalls > 0
      ? toolUsage.metrics.totalEstimatedTokenSavings / toolUsage.metrics.totalCalls
      : 0;
    
    // Identify performance bottlenecks
    const performanceBottlenecks = Object.entries(toolUsage.byTool)
      .map(([name, metrics]) => ({ name, ...metrics }))
      .filter(tool => tool.calls >= 10) // Only consider tools with significant usage
      .sort((a, b) => b.avgExecutionTime - a.avgExecutionTime)
      .slice(0, 5); // Top 5 slowest tools
    
    // Identify error-prone tools
    const errorProneTools = Object.entries(toolUsage.byTool)
      .map(([name, metrics]) => ({ name, ...metrics }))
      .filter(tool => tool.calls >= 10) // Only consider tools with significant usage
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 5); // Top 5 error-prone tools
    
    // Generate recommendations
    const recommendations = [];
    
    // Recommend optimizing slow tools
    if (performanceBottlenecks.length > 0) {
      recommendations.push({
        type: 'performance',
        title: 'Optimize Slow Tools',
        description: `Consider optimizing the following slow tools: ${performanceBottlenecks.map(t => t.name).join(', ')}`,
        impact: 'medium'
      });
    }
    
    // Recommend fixing error-prone tools
    if (errorProneTools.length > 0 && errorProneTools[0].errorRate > 0.1) {
      recommendations.push({
        type: 'reliability',
        title: 'Fix Error-Prone Tools',
        description: `Address errors in the following tools: ${errorProneTools.map(t => t.name).join(', ')}`,
        impact: 'high'
      });
    }
    
    // Recommend using more token-efficient tools
    if (crossReference.summary.efficiencyRatio < 0.5) {
      recommendations.push({
        type: 'efficiency',
        title: 'Increase Tool Usage',
        description: 'Increase usage of AI-Tools functions to improve token efficiency',
        impact: 'high'
      });
    }
    
    // Return the report
    return {
      summary: {
        ...crossReference.summary,
        avgExecutionTime,
        avgTokenSavingsPerCall,
        errorRate: toolUsage.metrics.errorRate
      },
      tools: {
        ...crossReference.tools,
        performanceBottlenecks,
        errorProneTools
      },
      categories: crossReference.categories,
      recommendations,
      timeRange: crossReference.timeRange
    };
  } catch (error) {
    console.error(`Error generating analysis report:`, error);
    return {
      error: error.message,
      summary: {
        totalTokensSaved: 0,
        totalTokensUsed: 0,
        totalTokens: 0,
        efficiencyRatio: 0,
        costSaved: 0,
        toolCalls: 0,
        apiCalls: 0,
        avgExecutionTime: 0,
        avgTokenSavingsPerCall: 0,
        errorRate: 0
      },
      recommendations: []
    };
  }
}

/**
 * Visualize tool usage metrics
 * @param {Object} metrics - Tool usage metrics
 * @param {Object} options - Visualization options
 * @returns {string} - ASCII visualization
 */
function visualizeToolUsage(metrics, options = {}) {
  const { width = 80, showTools = 5 } = options;
  
  // Simple ASCII visualization
  let visualization = '=== AI-Tools Usage Visualization ===\n\n';
  
  // Tool calls
  visualization += `Tool Calls: ${metrics.metrics.totalCalls}\n`;
  visualization += generateBar(metrics.metrics.totalCalls, 0, 1000, width) + '\n\n';
  
  // Token savings
  visualization += `Estimated Token Savings: ${metrics.metrics.totalEstimatedTokenSavings}\n`;
  visualization += generateBar(metrics.metrics.totalEstimatedTokenSavings, 0, 100000, width) + '\n\n';
  
  // Top tools by usage
  visualization += '=== Top Tools by Usage ===\n\n';
  
  const topToolsByUsage = Object.entries(metrics.byTool)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.calls - a.calls)
    .slice(0, showTools);
  
  topToolsByUsage.forEach(tool => {
    visualization += `${tool.name}: ${tool.calls} calls\n`;
    visualization += generateBar(tool.calls, 0, topToolsByUsage[0].calls, width) + '\n';
  });
  
  visualization += '\n';
  
  // Top tools by token savings
  visualization += '=== Top Tools by Token Savings ===\n\n';
  
  const topToolsByTokens = Object.entries(metrics.byTool)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.estimatedTokenSavings - a.estimatedTokenSavings)
    .slice(0, showTools);
  
  topToolsByTokens.forEach(tool => {
    visualization += `${tool.name}: ${tool.estimatedTokenSavings} tokens saved\n`;
    visualization += generateBar(tool.estimatedTokenSavings, 0, topToolsByTokens[0].estimatedTokenSavings, width) + '\n';
  });
  
  return visualization;
}

/**
 * Generate an ASCII bar
 * @param {number} value - Value to represent
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} width - Bar width
 * @returns {string} - ASCII bar
 */
function generateBar(value, min, max, width) {
  // Normalize value to 0-1 range
  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  // Calculate bar length
  const barLength = Math.round(normalizedValue * width);
  
  // Generate bar
  return '[' + '#'.repeat(barLength) + ' '.repeat(width - barLength) + ']';
}

// Initialize on module load
initialize().catch(console.error);

// Export functions
module.exports = {
  initialize,
  createToolProxy,
  logToolUsage,
  getToolUsageMetrics,
  resetToolUsageMetrics,
  crossReferenceWithClaudeUsage,
  generateAnalysisReport,
  visualizeToolUsage,
  tokenSavingsModels
};
