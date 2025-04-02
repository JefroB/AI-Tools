/**
 * Metrics Utility Module for AI Tools
 * Provides centralized metrics collection and reporting
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Default configuration
const DEFAULT_CONFIG = {
  enabled: true,
  storageDir: path.resolve('metrics'),
  persistInterval: 60 * 60 * 1000, // 1 hour in milliseconds
  retentionDays: 30, // Keep metrics for 30 days
  maxMemoryEntries: 10000, // Maximum number of entries to keep in memory
};

// Runtime configuration
let config = { ...DEFAULT_CONFIG };

// In-memory metrics storage
const metricsStore = {
  // API usage metrics
  api: {
    calls: 0,
    tokens: {
      prompt: 0,
      completion: 0,
      total: 0
    },
    costs: {
      prompt: 0,
      completion: 0,
      total: 0
    },
    errors: 0,
    latency: []
  },
  
  // Cache metrics
  cache: {
    hits: 0,
    misses: 0,
    hitRate: 0,
    tokensSaved: 0,
    costSaved: 0
  },
  
  // Validation metrics
  validation: {
    success: 0,
    warnings: 0,
    errors: 0,
    errorRate: 0
  },
  
  // Token optimization metrics
  optimization: {
    promptsOptimized: 0,
    tokensSaved: 0,
    savingsRate: 0
  },
  
  // Token efficiency metrics
  tokenEfficiency: {
    // Overall efficiency metrics
    overallRatio: 0,
    totalValueScore: 0,
    totalTokensUsed: 0,
    
    // Operation-specific metrics
    byOperation: {}, // Map of operation types to efficiency metrics
    
    // Wastage tracking
    wastagePatterns: {
      redundantCalls: { count: 0, tokensWasted: 0 },
      oversizedPrompts: { count: 0, tokensWasted: 0 },
      unnecessaryContext: { count: 0, tokensWasted: 0 },
      poorCaching: { count: 0, tokensWasted: 0 }
    },
    
    // Optimization tracking
    optimizations: {
      promptReduction: { count: 0, tokensSaved: 0, percentImprovement: 0 },
      contextPruning: { count: 0, tokensSaved: 0, percentImprovement: 0 },
      caching: { count: 0, tokensSaved: 0, percentImprovement: 0 },
      batching: { count: 0, tokensSaved: 0, percentImprovement: 0 }
    },
    
    // Historical data for trend analysis
    history: {
      daily: [], // Daily snapshots
      weekly: [], // Weekly snapshots
      monthly: [] // Monthly snapshots
    }
  },
  
  // Detailed metrics entries (time series)
  entries: [],
  
  // System info
  system: {
    startTime: Date.now(),
    lastResetTime: Date.now(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    hostname: os.hostname()
  }
};

/**
 * Initialize the metrics module
 * @param {Object} customConfig - Custom configuration
 * @returns {Promise<void>}
 */
async function initialize(customConfig = {}) {
  try {
    // Merge custom configuration with defaults
    config = {
      ...DEFAULT_CONFIG,
      ...customConfig
    };
    
    // Ensure metrics directory exists if persistence is enabled
    if (config.enabled) {
      await fs.ensureDir(config.storageDir);
    }
    
    // Set up periodic persistence if enabled
    if (config.enabled && config.persistInterval > 0) {
      setInterval(() => {
        persistMetrics().catch(console.error);
      }, config.persistInterval);
    }
    
    console.log('Metrics initialized with config:', JSON.stringify(config, null, 2));
  } catch (error) {
    throw new Error(`Error initializing metrics: ${error.message}`);
  }
}

/**
 * Record a metric data point
 * @param {string} category - Metric category (api, cache, validation, optimization)
 * @param {string} name - Metric name
 * @param {any} value - Metric value
 * @param {Object} metadata - Additional metadata
 * @returns {boolean} - Success status
 */
function recordMetric(category, name, value, metadata = {}) {
  if (!config.enabled) return false;
  
  try {
    // Create metric entry
    const entry = {
      timestamp: Date.now(),
      category,
      name,
      value,
      metadata
    };
    
    // Add to entries array
    metricsStore.entries.push(entry);
    
    // Enforce maximum entries limit
    if (metricsStore.entries.length > config.maxMemoryEntries) {
      metricsStore.entries.shift(); // Remove oldest entry
    }
    
    // Update summary metrics based on category and name
    updateSummaryMetrics(category, name, value, metadata);
    
    return true;
  } catch (error) {
    console.error(`Error recording metric: ${error.message}`);
    return false;
  }
}

/**
 * Update summary metrics based on new data point
 * @param {string} category - Metric category
 * @param {string} name - Metric name
 * @param {any} value - Metric value
 * @param {Object} metadata - Additional metadata
 */
function updateSummaryMetrics(category, name, value, metadata) {
  // Handle API metrics
  if (category === 'api') {
    switch (name) {
      case 'call':
        metricsStore.api.calls++;
        if (metadata.tokens) {
          metricsStore.api.tokens.prompt += metadata.tokens.prompt || 0;
          metricsStore.api.tokens.completion += metadata.tokens.completion || 0;
          metricsStore.api.tokens.total += (metadata.tokens.prompt || 0) + (metadata.tokens.completion || 0);
        }
        if (metadata.costs) {
          metricsStore.api.costs.prompt += metadata.costs.prompt || 0;
          metricsStore.api.costs.completion += metadata.costs.completion || 0;
          metricsStore.api.costs.total += (metadata.costs.prompt || 0) + (metadata.costs.completion || 0);
        }
        if (metadata.latency) {
          metricsStore.api.latency.push(metadata.latency);
          // Keep only the last 100 latency measurements
          if (metricsStore.api.latency.length > 100) {
            metricsStore.api.latency.shift();
          }
        }
        break;
      case 'error':
        metricsStore.api.errors++;
        break;
    }
  }
  
  // Handle cache metrics
  else if (category === 'cache') {
    switch (name) {
      case 'hit':
        metricsStore.cache.hits++;
        metricsStore.cache.hitRate = metricsStore.cache.hits / (metricsStore.cache.hits + metricsStore.cache.misses);
        if (metadata.tokensSaved) {
          metricsStore.cache.tokensSaved += metadata.tokensSaved;
        }
        if (metadata.costSaved) {
          metricsStore.cache.costSaved += metadata.costSaved;
        }
        break;
      case 'miss':
        metricsStore.cache.misses++;
        metricsStore.cache.hitRate = metricsStore.cache.hits / (metricsStore.cache.hits + metricsStore.cache.misses);
        break;
    }
  }
  
  // Handle validation metrics
  else if (category === 'validation') {
    switch (name) {
      case 'success':
        metricsStore.validation.success++;
        metricsStore.validation.errorRate = metricsStore.validation.errors / 
          (metricsStore.validation.success + metricsStore.validation.warnings + metricsStore.validation.errors);
        break;
      case 'warning':
        metricsStore.validation.warnings++;
        break;
      case 'error':
        metricsStore.validation.errors++;
        metricsStore.validation.errorRate = metricsStore.validation.errors / 
          (metricsStore.validation.success + metricsStore.validation.warnings + metricsStore.validation.errors);
        break;
    }
  }
  
  // Handle optimization metrics
  else if (category === 'optimization') {
    switch (name) {
      case 'prompt':
        metricsStore.optimization.promptsOptimized++;
        if (metadata.tokensSaved) {
          metricsStore.optimization.tokensSaved += metadata.tokensSaved;
        }
        if (metadata.originalTokens && metadata.optimizedTokens) {
          const savingsRate = (metadata.originalTokens - metadata.optimizedTokens) / metadata.originalTokens;
          // Update running average of savings rate
          metricsStore.optimization.savingsRate = 
            (metricsStore.optimization.savingsRate * (metricsStore.optimization.promptsOptimized - 1) + savingsRate) / 
            metricsStore.optimization.promptsOptimized;
        }
        break;
    }
  }
}

/**
 * Get a summary of collected metrics
 * @param {Object} options - Options for the summary
 * @param {number} options.timeRange - Time range in milliseconds (default: all time)
 * @param {string} options.category - Filter by category
 * @returns {Object} - Metrics summary
 */
function getMetricsSummary(options = {}) {
  const { timeRange, category } = options;
  
  // Clone the metrics store to avoid modifying the original
  const summary = JSON.parse(JSON.stringify(metricsStore));
  
  // Add derived metrics
  if (summary.api.calls > 0) {
    summary.api.avgLatency = summary.api.latency.reduce((sum, val) => sum + val, 0) / summary.api.latency.length;
    summary.api.avgTokensPerCall = summary.api.tokens.total / summary.api.calls;
    summary.api.avgCostPerCall = summary.api.costs.total / summary.api.calls;
  }
  
  // Add system metrics
  summary.system.uptime = Date.now() - summary.system.startTime;
  summary.system.timeSinceReset = Date.now() - summary.system.lastResetTime;
  
  // Filter entries by time range if specified
  if (timeRange) {
    const cutoffTime = Date.now() - timeRange;
    summary.entries = summary.entries.filter(entry => entry.timestamp >= cutoffTime);
  }
  
  // Filter entries by category if specified
  if (category) {
    summary.entries = summary.entries.filter(entry => entry.category === category);
  }
  
  return summary;
}

/**
 * Reset metrics
 * @param {Object} options - Reset options
 * @param {boolean} options.keepEntries - Whether to keep detailed entries
 * @returns {boolean} - Success status
 */
function resetMetrics(options = {}) {
  const { keepEntries = false } = options;
  
  try {
    // Reset API metrics
    metricsStore.api.calls = 0;
    metricsStore.api.tokens.prompt = 0;
    metricsStore.api.tokens.completion = 0;
    metricsStore.api.tokens.total = 0;
    metricsStore.api.costs.prompt = 0;
    metricsStore.api.costs.completion = 0;
    metricsStore.api.costs.total = 0;
    metricsStore.api.errors = 0;
    metricsStore.api.latency = [];
    
    // Reset cache metrics
    metricsStore.cache.hits = 0;
    metricsStore.cache.misses = 0;
    metricsStore.cache.hitRate = 0;
    metricsStore.cache.tokensSaved = 0;
    metricsStore.cache.costSaved = 0;
    
    // Reset validation metrics
    metricsStore.validation.success = 0;
    metricsStore.validation.warnings = 0;
    metricsStore.validation.errors = 0;
    metricsStore.validation.errorRate = 0;
    
    // Reset optimization metrics
    metricsStore.optimization.promptsOptimized = 0;
    metricsStore.optimization.tokensSaved = 0;
    metricsStore.optimization.savingsRate = 0;
    
    // Reset entries if not keeping them
    if (!keepEntries) {
      metricsStore.entries = [];
    }
    
    // Update reset time
    metricsStore.system.lastResetTime = Date.now();
    
    return true;
  } catch (error) {
    console.error(`Error resetting metrics: ${error.message}`);
    return false;
  }
}

/**
 * Persist metrics to disk
 * @returns {Promise<boolean>} - Success status
 */
async function persistMetrics() {
  if (!config.enabled) return false;
  
  try {
    // Create filename based on current date
    const now = new Date();
    const filename = `metrics_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.json`;
    const filePath = path.join(config.storageDir, filename);
    
    // Get current metrics
    const metrics = getMetricsSummary();
    
    // Add persistence metadata
    metrics.persistence = {
      timestamp: Date.now(),
      filename
    };
    
    // Write to file
    await fs.writeJson(filePath, metrics, { spaces: 2 });
    
    // Clean up old metrics files
    await cleanupOldMetricsFiles();
    
    return true;
  } catch (error) {
    console.error(`Error persisting metrics: ${error.message}`);
    return false;
  }
}

/**
 * Clean up old metrics files based on retention policy
 * @returns {Promise<void>}
 */
async function cleanupOldMetricsFiles() {
  try {
    // Get all metrics files
    const files = await fs.readdir(config.storageDir);
    const metricsFiles = files.filter(file => file.startsWith('metrics_') && file.endsWith('.json'));
    
    // Calculate cutoff date
    const cutoffTime = Date.now() - (config.retentionDays * 24 * 60 * 60 * 1000);
    
    // Delete old files
    for (const file of metricsFiles) {
      try {
        // Extract date from filename
        const dateMatch = file.match(/metrics_(\d{4}-\d{2}-\d{2})\.json/);
        if (dateMatch) {
          const fileDate = new Date(dateMatch[1]);
          if (fileDate.getTime() < cutoffTime) {
            await fs.unlink(path.join(config.storageDir, file));
          }
        }
      } catch (error) {
        console.error(`Error deleting old metrics file ${file}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`Error cleaning up old metrics files: ${error.message}`);
  }
}

/**
 * Export metrics in various formats
 * @param {string} format - Export format (json, csv)
 * @param {Object} options - Export options
 * @returns {string|Object} - Exported metrics
 */
function exportMetrics(format = 'json', options = {}) {
  // Get metrics summary
  const metrics = getMetricsSummary(options);
  
  // Export in requested format
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(metrics, null, 2);
      
    case 'csv':
      // Convert entries to CSV
      const entries = metrics.entries;
      if (!entries || entries.length === 0) {
        return 'timestamp,category,name,value\n';
      }
      
      // Create CSV header
      let csv = 'timestamp,category,name,value\n';
      
      // Add rows
      for (const entry of entries) {
        const timestamp = new Date(entry.timestamp).toISOString();
        const value = typeof entry.value === 'object' ? JSON.stringify(entry.value) : entry.value;
        csv += `${timestamp},${entry.category},${entry.name},${value}\n`;
      }
      
      return csv;
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Generate a simple ASCII visualization of metrics
 * @param {Object} metrics - Metrics to visualize
 * @param {Object} options - Visualization options
 * @returns {string} - ASCII visualization
 */
function visualizeMetrics(metrics, options = {}) {
  const { width = 80, height = 20 } = options;
  
  // Simple ASCII bar chart
  let visualization = '=== AI Tools Metrics Visualization ===\n\n';
  
  // API Calls
  visualization += 'API Calls: ' + metrics.api.calls + '\n';
  visualization += generateBar(metrics.api.calls, 0, 1000, width) + '\n\n';
  
  // Token Usage
  visualization += 'Token Usage: ' + metrics.api.tokens.total + '\n';
  visualization += generateBar(metrics.api.tokens.total, 0, 1000000, width) + '\n\n';
  
  // Cost
  visualization += 'API Cost: $' + metrics.api.costs.total.toFixed(2) + '\n';
  visualization += generateBar(metrics.api.costs.total, 0, 100, width) + '\n\n';
  
  // Cache Hit Rate
  visualization += 'Cache Hit Rate: ' + (metrics.cache.hitRate * 100).toFixed(1) + '%\n';
  visualization += generateBar(metrics.cache.hitRate, 0, 1, width) + '\n\n';
  
  // Tokens Saved
  visualization += 'Tokens Saved: ' + metrics.cache.tokensSaved + '\n';
  visualization += generateBar(metrics.cache.tokensSaved, 0, 1000000, width) + '\n\n';
  
  // Cost Saved
  visualization += 'Cost Saved: $' + metrics.cache.costSaved.toFixed(2) + '\n';
  visualization += generateBar(metrics.cache.costSaved, 0, 100, width) + '\n\n';
  
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

/**
 * Record token efficiency for an operation
 * @param {string} operation - Operation name
 * @param {number} tokensUsed - Number of tokens used
 * @param {number} valueScore - Value score (1-10, with 10 being highest value)
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Efficiency metrics
 */
function recordTokenEfficiency(operation, tokensUsed, valueScore, metadata = {}) {
  if (!config.enabled) return null;
  
  try {
    // Calculate efficiency ratio
    const efficiencyRatio = tokensUsed > 0 ? valueScore / tokensUsed : 0;
    
    // Create efficiency record
    const record = {
      timestamp: Date.now(),
      operation,
      tokensUsed,
      valueScore,
      efficiencyRatio,
      metadata
    };
    
    // Update overall metrics
    metricsStore.tokenEfficiency.totalTokensUsed += tokensUsed;
    metricsStore.tokenEfficiency.totalValueScore += valueScore;
    metricsStore.tokenEfficiency.overallRatio = 
      metricsStore.tokenEfficiency.totalTokensUsed > 0 
        ? metricsStore.tokenEfficiency.totalValueScore / metricsStore.tokenEfficiency.totalTokensUsed 
        : 0;
    
    // Update operation-specific metrics
    if (!metricsStore.tokenEfficiency.byOperation[operation]) {
      metricsStore.tokenEfficiency.byOperation[operation] = {
        count: 0,
        tokensUsed: 0,
        valueScore: 0,
        efficiencyRatio: 0
      };
    }
    
    const opMetrics = metricsStore.tokenEfficiency.byOperation[operation];
    opMetrics.count++;
    opMetrics.tokensUsed += tokensUsed;
    opMetrics.valueScore += valueScore;
    opMetrics.efficiencyRatio = opMetrics.tokensUsed > 0 
      ? opMetrics.valueScore / opMetrics.tokensUsed 
      : 0;
    
    // Record the efficiency data point
    recordMetric('tokenEfficiency', 'operation', efficiencyRatio, {
      operation,
      tokensUsed,
      valueScore,
      ...metadata
    });
    
    return record;
  } catch (error) {
    console.error(`Error recording token efficiency: ${error.message}`);
    return null;
  }
}

/**
 * Detect and record token wastage
 * @param {string} wastageType - Type of wastage (redundantCalls, oversizedPrompts, etc.)
 * @param {number} tokensWasted - Estimated tokens wasted
 * @param {Object} metadata - Additional metadata
 * @returns {boolean} - Success status
 */
function recordTokenWastage(wastageType, tokensWasted, metadata = {}) {
  if (!config.enabled) return false;
  
  try {
    // Ensure wastage type exists
    if (!metricsStore.tokenEfficiency.wastagePatterns[wastageType]) {
      metricsStore.tokenEfficiency.wastagePatterns[wastageType] = {
        count: 0,
        tokensWasted: 0
      };
    }
    
    // Update wastage metrics
    metricsStore.tokenEfficiency.wastagePatterns[wastageType].count++;
    metricsStore.tokenEfficiency.wastagePatterns[wastageType].tokensWasted += tokensWasted;
    
    // Record the wastage data point
    recordMetric('tokenEfficiency', 'wastage', tokensWasted, {
      wastageType,
      ...metadata
    });
    
    return true;
  } catch (error) {
    console.error(`Error recording token wastage: ${error.message}`);
    return false;
  }
}

/**
 * Record the impact of a token optimization
 * @param {string} optimizationType - Type of optimization
 * @param {number} tokensBefore - Tokens used before optimization
 * @param {number} tokensAfter - Tokens used after optimization
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Optimization metrics
 */
function recordOptimizationImpact(optimizationType, tokensBefore, tokensAfter, metadata = {}) {
  if (!config.enabled) return null;
  
  try {
    // Calculate improvement metrics
    const tokensSaved = Math.max(0, tokensBefore - tokensAfter);
    const percentImprovement = tokensBefore > 0 
      ? (tokensSaved / tokensBefore) * 100 
      : 0;
    
    // Ensure optimization type exists
    if (!metricsStore.tokenEfficiency.optimizations[optimizationType]) {
      metricsStore.tokenEfficiency.optimizations[optimizationType] = {
        count: 0,
        tokensSaved: 0,
        percentImprovement: 0
      };
    }
    
    // Update optimization metrics
    const optMetrics = metricsStore.tokenEfficiency.optimizations[optimizationType];
    optMetrics.count++;
    optMetrics.tokensSaved += tokensSaved;
    
    // Update running average of percent improvement
    optMetrics.percentImprovement = 
      ((optMetrics.percentImprovement * (optMetrics.count - 1)) + percentImprovement) / 
      optMetrics.count;
    
    // Create optimization record
    const record = {
      timestamp: Date.now(),
      optimizationType,
      tokensBefore,
      tokensAfter,
      tokensSaved,
      percentImprovement,
      metadata
    };
    
    // Record the optimization data point
    recordMetric('tokenEfficiency', 'optimization', percentImprovement, {
      optimizationType,
      tokensBefore,
      tokensAfter,
      tokensSaved,
      ...metadata
    });
    
    return record;
  } catch (error) {
    console.error(`Error recording optimization impact: ${error.message}`);
    return null;
  }
}

/**
 * Generate recommendations for improving token efficiency
 * @param {Object} metrics - Metrics data
 * @returns {Array} - List of recommendations
 */
function generateEfficiencyRecommendations(metrics) {
  const recommendations = [];
  
  // Check for high wastage patterns
  const wastagePatterns = Object.entries(metrics.tokenEfficiency.wastagePatterns);
  for (const [type, data] of wastagePatterns) {
    if (data.tokensWasted > 1000) { // Threshold for significant waste
      let recommendation;
      
      switch (type) {
        case 'redundantCalls':
          recommendation = {
            title: 'Reduce Redundant API Calls',
            description: `Detected ${data.count} redundant API calls wasting approximately ${data.tokensWasted} tokens.`,
            impact: 'High',
            action: 'Implement or improve caching for frequently accessed data.'
          };
          break;
          
        case 'oversizedPrompts':
          recommendation = {
            title: 'Optimize Prompt Size',
            description: `Detected ${data.count} oversized prompts wasting approximately ${data.tokensWasted} tokens.`,
            impact: 'High',
            action: 'Review and refactor prompts to be more concise while maintaining effectiveness.'
          };
          break;
          
        case 'unnecessaryContext':
          recommendation = {
            title: 'Reduce Unnecessary Context',
            description: `Detected ${data.count} instances of unnecessary context wasting approximately ${data.tokensWasted} tokens.`,
            impact: 'Medium',
            action: 'Implement context pruning to remove irrelevant information.'
          };
          break;
          
        case 'poorCaching':
          recommendation = {
            title: 'Improve Caching Strategy',
            description: `Detected ${data.count} instances of poor caching wasting approximately ${data.tokensWasted} tokens.`,
            impact: 'Medium',
            action: 'Review cache invalidation strategies and consider increasing TTL for stable data.'
          };
          break;
          
        default:
          recommendation = {
            title: `Address ${type} Wastage`,
            description: `Detected ${data.count} instances wasting approximately ${data.tokensWasted} tokens.`,
            impact: 'Medium',
            action: 'Investigate and optimize this pattern.'
          };
      }
      
      recommendations.push(recommendation);
    }
  }
  
  // Check for inefficient operations
  const operations = Object.entries(metrics.tokenEfficiency.byOperation);
  for (const [name, data] of operations) {
    if (data.efficiencyRatio < 0.01 && data.tokensUsed > 1000) { // Threshold for inefficiency
      recommendations.push({
        title: `Optimize ${name} Operation`,
        description: `This operation has a low efficiency ratio (${data.efficiencyRatio.toFixed(4)}) and has used ${data.tokensUsed} tokens.`,
        impact: 'High',
        action: 'Review implementation for optimization opportunities.'
      });
    }
  }
  
  // Check for successful optimization patterns to expand
  const optimizations = Object.entries(metrics.tokenEfficiency.optimizations);
  let bestOptimization = null;
  let bestImprovementPercent = 0;
  
  for (const [type, data] of optimizations) {
    if (data.percentImprovement > bestImprovementPercent) {
      bestOptimization = type;
      bestImprovementPercent = data.percentImprovement;
    }
  }
  
  if (bestOptimization) {
    recommendations.push({
      title: `Expand ${bestOptimization} Optimization`,
      description: `This optimization technique has shown a ${bestImprovementPercent.toFixed(1)}% improvement in token efficiency.`,
      impact: 'Medium',
      action: 'Apply this optimization technique to more areas of the codebase.'
    });
  }
  
  return recommendations;
}

/**
 * Generate a comprehensive token efficiency report
 * @param {Object} options - Report options
 * @returns {Object} - Token efficiency report
 */
function generateTokenEfficiencyReport(options = {}) {
  try {
    const { timeRange } = options;
    
    // Get metrics for the specified time range
    const metrics = getMetricsSummary({ timeRange, category: 'tokenEfficiency' });
    
    // Calculate high-level metrics
    const overallEfficiency = metrics.tokenEfficiency.overallRatio;
    
    // Identify most and least efficient operations
    const operations = Object.entries(metrics.tokenEfficiency.byOperation)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.efficiencyRatio - a.efficiencyRatio);
    
    const mostEfficient = operations.slice(0, 3);
    const leastEfficient = operations.slice(-3).reverse();
    
    // Calculate total waste
    let totalWaste = 0;
    const wasteByType = Object.entries(metrics.tokenEfficiency.wastagePatterns)
      .map(([type, data]) => {
        totalWaste += data.tokensWasted;
        return { type, ...data };
      })
      .sort((a, b) => b.tokensWasted - a.tokensWasted);
    
    // Calculate optimization impact
    let totalSaved = 0;
    const optimizationsByImpact = Object.entries(metrics.tokenEfficiency.optimizations)
      .map(([type, data]) => {
        totalSaved += data.tokensSaved;
        return { type, ...data };
      })
      .sort((a, b) => b.percentImprovement - a.percentImprovement);
    
    // Generate recommendations based on the data
    const recommendations = generateEfficiencyRecommendations(metrics);
    
    // Compile the report
    return {
      summary: {
        overallEfficiency,
        totalTokensUsed: metrics.tokenEfficiency.totalTokensUsed,
        totalValueScore: metrics.tokenEfficiency.totalValueScore,
        totalWaste,
        totalSaved,
        wastePercentage: metrics.tokenEfficiency.totalTokensUsed > 0 
          ? (totalWaste / metrics.tokenEfficiency.totalTokensUsed) * 100 
          : 0,
        savingsPercentage: metrics.tokenEfficiency.totalTokensUsed > 0 
          ? (totalSaved / metrics.tokenEfficiency.totalTokensUsed) * 100 
          : 0
      },
      operations: {
        mostEfficient,
        leastEfficient,
        all: operations
      },
      wastage: {
        byType: wasteByType,
        total: totalWaste
      },
      optimizations: {
        byType: optimizationsByImpact,
        total: totalSaved
      },
      recommendations
    };
  } catch (error) {
    console.error(`Error generating token efficiency report: ${error.message}`);
    return null;
  }
}

/**
 * Take a snapshot of token efficiency metrics for historical tracking
 * @param {string} interval - Interval type ('daily', 'weekly', 'monthly')
 * @returns {boolean} - Success status
 */
function takeTokenEfficiencySnapshot(interval = 'daily') {
  if (!config.enabled) return false;
  
  try {
    // Get current metrics
    const metrics = {
      timestamp: Date.now(),
      overallRatio: metricsStore.tokenEfficiency.overallRatio,
      totalTokensUsed: metricsStore.tokenEfficiency.totalTokensUsed,
      totalValueScore: metricsStore.tokenEfficiency.totalValueScore,
      wastageTotal: Object.values(metricsStore.tokenEfficiency.wastagePatterns)
        .reduce((sum, data) => sum + data.tokensWasted, 0),
      savingsTotal: Object.values(metricsStore.tokenEfficiency.optimizations)
        .reduce((sum, data) => sum + data.tokensSaved, 0)
    };
    
    // Add to history
    metricsStore.tokenEfficiency.history[interval].push(metrics);
    
    // Limit history size (keep last 90 entries)
    const maxEntries = {
      daily: 90,
      weekly: 52,
      monthly: 24
    };
    
    if (metricsStore.tokenEfficiency.history[interval].length > maxEntries[interval]) {
      metricsStore.tokenEfficiency.history[interval].shift();
    }
    
    return true;
  } catch (error) {
    console.error(`Error taking token efficiency snapshot: ${error.message}`);
    return false;
  }
}

/**
 * Calculate the trifecta score (Good, Cheap, Fast)
 * @param {Object} metrics - Metrics data
 * @returns {Object} - Trifecta score components and total
 */
function calculateTrifectaScore(metrics = null) {
  // Use provided metrics or get current metrics
  const data = metrics || getMetricsSummary();
  
  try {
    // Quality component (0-100)
    const qualityScore = 100 * (1 - (data.validation.errorRate || 0));
    
    // Cost component (0-100)
    const costScore = data.tokenEfficiency && data.tokenEfficiency.overallRatio
      ? 100 * Math.min(1, data.tokenEfficiency.overallRatio * 10) // Scale the efficiency ratio
      : 50; // Default if no data
    
    // Speed component (0-100)
    const avgLatency = data.api.latency && data.api.latency.length > 0
      ? data.api.latency.reduce((sum, val) => sum + val, 0) / data.api.latency.length
      : 1000; // Default if no data
    
    const speedScore = 100 * Math.min(1, 2000 / Math.max(1, avgLatency));
    
    // Combined score (0-100)
    const totalScore = (qualityScore + costScore + speedScore) / 3;
    
    return {
      quality: qualityScore,
      cost: costScore,
      speed: speedScore,
      total: totalScore
    };
  } catch (error) {
    console.error(`Error calculating trifecta score: ${error.message}`);
    return {
      quality: 0,
      cost: 0,
      speed: 0,
      total: 0
    };
  }
}

/**
 * Initialize the metrics module
 * @param {Object} customConfig - Custom configuration
 * @returns {Promise<void>}
 */
async function initialize(customConfig = {}) {
  try {
    // Merge custom configuration with defaults
    config = {
      ...DEFAULT_CONFIG,
      ...customConfig
    };
    
    // Ensure metrics directory exists if persistence is enabled
    if (config.enabled) {
      await fs.ensureDir(config.storageDir);
    }
    
    // Set up periodic persistence if enabled
    if (config.enabled && config.persistInterval > 0) {
      setInterval(() => {
        persistMetrics().catch(console.error);
      }, config.persistInterval);
    }
    
    console.log('Metrics initialized with config:', JSON.stringify(config, null, 2));
  } catch (error) {
    throw new Error(`Error initializing metrics: ${error.message}`);
  }
}

/**
 * Record a metric data point
 * @param {string} category - Metric category (api, cache, validation, optimization)
 * @param {string} name - Metric name
 * @param {any} value - Metric value
 * @param {Object} metadata - Additional metadata
 * @returns {boolean} - Success status
 */
function recordMetric(category, name, value, metadata = {}) {
  if (!config.enabled) return false;
  
  try {
    // Create metric entry
    const entry = {
      timestamp: Date.now(),
      category,
      name,
      value,
      metadata
    };
    
    // Add to entries array
    metricsStore.entries.push(entry);
    
    // Enforce maximum entries limit
    if (metricsStore.entries.length > config.maxMemoryEntries) {
      metricsStore.entries.shift(); // Remove oldest entry
    }
    
    // Update summary metrics based on category and name
    updateSummaryMetrics(category, name, value, metadata);
    
    return true;
  } catch (error) {
    console.error(`Error recording metric: ${error.message}`);
    return false;
  }
}

/**
 * Update summary metrics based on new data point
 * @param {string} category - Metric category
 * @param {string} name - Metric name
 * @param {any} value - Metric value
 * @param {Object} metadata - Additional metadata
 */
function updateSummaryMetrics(category, name, value, metadata) {
  // Handle API metrics
  if (category === 'api') {
    switch (name) {
      case 'call':
        metricsStore.api.calls++;
        if (metadata.tokens) {
          metricsStore.api.tokens.prompt += metadata.tokens.prompt || 0;
          metricsStore.api.tokens.completion += metadata.tokens.completion || 0;
          metricsStore.api.tokens.total += (metadata.tokens.prompt || 0) + (metadata.tokens.completion || 0);
        }
        if (metadata.costs) {
          metricsStore.api.costs.prompt += metadata.costs.prompt || 0;
          metricsStore.api.costs.completion += metadata.costs.completion || 0;
          metricsStore.api.costs.total += (metadata.costs.prompt || 0) + (metadata.costs.completion || 0);
        }
        if (metadata.latency) {
          metricsStore.api.latency.push(metadata.latency);
          // Keep only the last 100 latency measurements
          if (metricsStore.api.latency.length > 100) {
            metricsStore.api.latency.shift();
          }
        }
        break;
      case 'error':
        metricsStore.api.errors++;
        break;
    }
  }
  
  // Handle cache metrics
  else if (category === 'cache') {
    switch (name) {
      case 'hit':
        metricsStore.cache.hits++;
        metricsStore.cache.hitRate = metricsStore.cache.hits / (metricsStore.cache.hits + metricsStore.cache.misses);
        if (metadata.tokensSaved) {
          metricsStore.cache.tokensSaved += metadata.tokensSaved;
        }
        if (metadata.costSaved) {
          metricsStore.cache.costSaved += metadata.costSaved;
        }
        break;
      case 'miss':
        metricsStore.cache.misses++;
        metricsStore.cache.hitRate = metricsStore.cache.hits / (metricsStore.cache.hits + metricsStore.cache.misses);
        break;
    }
  }
  
  // Handle validation metrics
  else if (category === 'validation') {
    switch (name) {
      case 'success':
        metricsStore.validation.success++;
        metricsStore.validation.errorRate = metricsStore.validation.errors / 
          (metricsStore.validation.success + metricsStore.validation.warnings + metricsStore.validation.errors);
        break;
      case 'warning':
        metricsStore.validation.warnings++;
        break;
      case 'error':
        metricsStore.validation.errors++;
        metricsStore.validation.errorRate = metricsStore.validation.errors / 
          (metricsStore.validation.success + metricsStore.validation.warnings + metricsStore.validation.errors);
        break;
    }
  }
  
  // Handle optimization metrics
  else if (category === 'optimization') {
    switch (name) {
      case 'prompt':
        metricsStore.optimization.promptsOptimized++;
        if (metadata.tokensSaved) {
          metricsStore.optimization.tokensSaved += metadata.tokensSaved;
        }
        if (metadata.originalTokens && metadata.optimizedTokens) {
          const savingsRate = (metadata.originalTokens - metadata.optimizedTokens) / metadata.originalTokens;
          // Update running average of savings rate
          metricsStore.optimization.savingsRate = 
            (metricsStore.optimization.savingsRate * (metricsStore.optimization.promptsOptimized - 1) + savingsRate) / 
            metricsStore.optimization.promptsOptimized;
        }
        break;
    }
  }
}

/**
 * Get a summary of collected metrics
 * @param {Object} options - Options for the summary
 * @param {number} options.timeRange - Time range in milliseconds (default: all time)
 * @param {string} options.category - Filter by category
 * @returns {Object} - Metrics summary
 */
function getMetricsSummary(options = {}) {
  const { timeRange, category } = options;
  
  // Clone the metrics store to avoid modifying the original
  const summary = JSON.parse(JSON.stringify(metricsStore));
  
  // Add derived metrics
  if (summary.api.calls > 0) {
    summary.api.avgLatency = summary.api.latency.reduce((sum, val) => sum + val, 0) / summary.api.latency.length;
    summary.api.avgTokensPerCall = summary.api.tokens.total / summary.api.calls;
    summary.api.avgCostPerCall = summary.api.costs.total / summary.api.calls;
  }
  
  // Add system metrics
  summary.system.uptime = Date.now() - summary.system.startTime;
  summary.system.timeSinceReset = Date.now() - summary.system.lastResetTime;
  
  // Filter entries by time range if specified
  if (timeRange) {
    const cutoffTime = Date.now() - timeRange;
    summary.entries = summary.entries.filter(entry => entry.timestamp >= cutoffTime);
  }
  
  // Filter entries by category if specified
  if (category) {
    summary.entries = summary.entries.filter(entry => entry.category === category);
  }
  
  return summary;
}

/**
 * Reset metrics
 * @param {Object} options - Reset options
 * @param {boolean} options.keepEntries - Whether to keep detailed entries
 * @returns {boolean} - Success status
 */
function resetMetrics(options = {}) {
  const { keepEntries = false } = options;
  
  try {
    // Reset API metrics
    metricsStore.api.calls = 0;
    metricsStore.api.tokens.prompt = 0;
    metricsStore.api.tokens.completion = 0;
    metricsStore.api.tokens.total = 0;
    metricsStore.api.costs.prompt = 0;
    metricsStore.api.costs.completion = 0;
    metricsStore.api.costs.total = 0;
    metricsStore.api.errors = 0;
    metricsStore.api.latency = [];
    
    // Reset cache metrics
    metricsStore.cache.hits = 0;
    metricsStore.cache.misses = 0;
    metricsStore.cache.hitRate = 0;
    metricsStore.cache.tokensSaved = 0;
    metricsStore.cache.costSaved = 0;
    
    // Reset validation metrics
    metricsStore.validation.success = 0;
    metricsStore.validation.warnings = 0;
    metricsStore.validation.errors = 0;
    metricsStore.validation.errorRate = 0;
    
    // Reset optimization metrics
    metricsStore.optimization.promptsOptimized = 0;
    metricsStore.optimization.tokensSaved = 0;
    metricsStore.optimization.savingsRate = 0;
    
    // Reset entries if not keeping them
    if (!keepEntries) {
      metricsStore.entries = [];
    }
    
    // Update reset time
    metricsStore.system.lastResetTime = Date.now();
    
    return true;
  } catch (error) {
    console.error(`Error resetting metrics: ${error.message}`);
    return false;
  }
}

/**
 * Persist metrics to disk
 * @returns {Promise<boolean>} - Success status
 */
async function persistMetrics() {
  if (!config.enabled) return false;
  
  try {
    // Create filename based on current date
    const now = new Date();
    const filename = `metrics_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.json`;
    const filePath = path.join(config.storageDir, filename);
    
    // Get current metrics
    const metrics = getMetricsSummary();
    
    // Add persistence metadata
    metrics.persistence = {
      timestamp: Date.now(),
      filename
    };
    
    // Write to file
    await fs.writeJson(filePath, metrics, { spaces: 2 });
    
    // Clean up old metrics files
    await cleanupOldMetricsFiles();
    
    return true;
  } catch (error) {
    console.error(`Error persisting metrics: ${error.message}`);
    return false;
  }
}

/**
 * Clean up old metrics files based on retention policy
 * @returns {Promise<void>}
 */
async function cleanupOldMetricsFiles() {
  try {
    // Get all metrics files
    const files = await fs.readdir(config.storageDir);
    const metricsFiles = files.filter(file => file.startsWith('metrics_') && file.endsWith('.json'));
    
    // Calculate cutoff date
    const cutoffTime = Date.now() - (config.retentionDays * 24 * 60 * 60 * 1000);
    
    // Delete old files
    for (const file of metricsFiles) {
      try {
        // Extract date from filename
        const dateMatch = file.match(/metrics_(\d{4}-\d{2}-\d{2})\.json/);
        if (dateMatch) {
          const fileDate = new Date(dateMatch[1]);
          if (fileDate.getTime() < cutoffTime) {
            await fs.unlink(path.join(config.storageDir, file));
          }
        }
      } catch (error) {
        console.error(`Error deleting old metrics file ${file}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`Error cleaning up old metrics files: ${error.message}`);
  }
}

/**
 * Export metrics in various formats
 * @param {string} format - Export format (json, csv)
 * @param {Object} options - Export options
 * @returns {string|Object} - Exported metrics
 */
function exportMetrics(format = 'json', options = {}) {
  // Get metrics summary
  const metrics = getMetricsSummary(options);
  
  // Export in requested format
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(metrics, null, 2);
      
    case 'csv':
      // Convert entries to CSV
      const entries = metrics.entries;
      if (!entries || entries.length === 0) {
        return 'timestamp,category,name,value\n';
      }
      
      // Create CSV header
      let csv = 'timestamp,category,name,value\n';
      
      // Add rows
      for (const entry of entries) {
        const timestamp = new Date(entry.timestamp).toISOString();
        const value = typeof entry.value === 'object' ? JSON.stringify(entry.value) : entry.value;
        csv += `${timestamp},${entry.category},${entry.name},${value}\n`;
      }
      
      return csv;
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Generate a simple ASCII visualization of metrics
 * @param {Object} metrics - Metrics to visualize
 * @param {Object} options - Visualization options
 * @returns {string} - ASCII visualization
 */
function visualizeMetrics(metrics, options = {}) {
  const { width = 80, height = 20 } = options;
  
  // Simple ASCII bar chart
  let visualization = '=== AI Tools Metrics Visualization ===\n\n';
  
  // API Calls
  visualization += 'API Calls: ' + metrics.api.calls + '\n';
  visualization += generateBar(metrics.api.calls, 0, 1000, width) + '\n\n';
  
  // Token Usage
  visualization += 'Token Usage: ' + metrics.api.tokens.total + '\n';
  visualization += generateBar(metrics.api.tokens.total, 0, 1000000, width) + '\n\n';
  
  // Cost
  visualization += 'API Cost: $' + metrics.api.costs.total.toFixed(2) + '\n';
  visualization += generateBar(metrics.api.costs.total, 0, 100, width) + '\n\n';
  
  // Cache Hit Rate
  visualization += 'Cache Hit Rate: ' + (metrics.cache.hitRate * 100).toFixed(1) + '%\n';
  visualization += generateBar(metrics.cache.hitRate, 0, 1, width) + '\n\n';
  
  // Tokens Saved
  visualization += 'Tokens Saved: ' + metrics.cache.tokensSaved + '\n';
  visualization += generateBar(metrics.cache.tokensSaved, 0, 1000000, width) + '\n\n';
  
  // Cost Saved
  visualization += 'Cost Saved: $' + metrics.cache.costSaved.toFixed(2) + '\n';
  visualization += generateBar(metrics.cache.costSaved, 0, 100, width) + '\n\n';
  
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

module.exports = {
  initialize,
  recordMetric,
  getMetricsSummary,
  resetMetrics,
  persistMetrics,
  exportMetrics,
  visualizeMetrics,
  recordTokenEfficiency,
  recordTokenWastage,
  recordOptimizationImpact,
  generateTokenEfficiencyReport,
  takeTokenEfficiencySnapshot,
  calculateTrifectaScore
};
