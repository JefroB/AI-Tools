/**
 * Context Length Manager Module for AI Tools
 * 
 * This module provides tools for managing context length in AI model interactions,
 * including dynamic token limit adjustment, chunking strategies, and integration
 * with prompt optimization to prevent context length exceeded errors.
 */

const fs = require('fs-extra');
const path = require('path');
const { performance } = require('perf_hooks');

// Import existing modules
const tokenUtils = require('./tokenUtils');
const metricsUtils = require('./metricsUtils');
const toolUsageTracker = require('./toolUsageTracker');
const promptEngineering = require('./promptEngineering');
const enhancedErrorHandling = require('./enhancedErrorHandling');
const contextCollector = require('./contextCollector');

// Default configuration
const DEFAULT_CONFIG = {
  tokenLimits: {
    default: 4000,
    'claude-3-opus': 180000,
    'claude-3-sonnet': 160000,
    'claude-3-haiku': 140000,
    'gpt-4': 8000,
    'gpt-4-turbo': 120000,
    'gpt-3.5-turbo': 4000
  },
  safetyMargin: 0.1, // 10% safety margin
  adaptiveConfig: {
    enabled: true,
    reductionFactor: 0.9, // Reduce by 10% on each failure
    recoveryFactor: 1.05, // Increase by 5% on each success (up to original limit)
    minReductionFactor: 0.5, // Don't reduce below 50% of original limit
    consecutiveSuccessesForRecovery: 3
  },
  chunkingStrategies: {
    enabled: true,
    defaultMaxChunkSize: 50000,
    overlapSize: 1000, // Overlap between chunks for context continuity
    combineResults: true
  },
  optimizationLevels: {
    normal: {
      trimConversationHistory: true,
      removeRedundantInstructions: true,
      compressSystemPrompt: true,
      removeUnnecessaryWhitespace: true,
      compressCodeBlocks: false
    },
    aggressive: {
      trimConversationHistory: true,
      removeRedundantInstructions: true,
      compressSystemPrompt: true,
      removeUnnecessaryWhitespace: true,
      compressCodeBlocks: true
    },
    extreme: {
      trimConversationHistory: true,
      removeRedundantInstructions: true,
      compressSystemPrompt: true,
      removeUnnecessaryWhitespace: true,
      compressCodeBlocks: true,
      // Additional extreme measures
      maxMessages: 3,
      maxTokens: 1000
    }
  },
  logging: {
    enabled: true,
    directory: path.resolve('reports/token-efficiency'),
    contextLengthLogFile: 'context-length-events.json'
  }
};

// Runtime configuration
let config = { ...DEFAULT_CONFIG };

// Model-specific adaptive limits
const adaptiveLimits = {};

// Success/failure tracking
const modelStats = {};

// Event log
const eventLog = [];

/**
 * Initialize the context length manager
 * @param {Object} customConfig - Custom configuration
 * @returns {Promise<void>}
 */
async function initialize(customConfig = {}) {
  try {
    // Merge custom configuration with defaults
    config = {
      ...DEFAULT_CONFIG,
      ...customConfig,
      tokenLimits: {
        ...DEFAULT_CONFIG.tokenLimits,
        ...(customConfig.tokenLimits || {})
      },
      adaptiveConfig: {
        ...DEFAULT_CONFIG.adaptiveConfig,
        ...(customConfig.adaptiveConfig || {})
      },
      chunkingStrategies: {
        ...DEFAULT_CONFIG.chunkingStrategies,
        ...(customConfig.chunkingStrategies || {})
      },
      optimizationLevels: {
        ...DEFAULT_CONFIG.optimizationLevels,
        ...(customConfig.optimizationLevels || {})
      },
      logging: {
        ...DEFAULT_CONFIG.logging,
        ...(customConfig.logging || {})
      }
    };
    
    // Initialize adaptive limits with default token limits
    for (const [model, limit] of Object.entries(config.tokenLimits)) {
      adaptiveLimits[model] = limit;
      
      // Initialize stats
      modelStats[model] = {
        totalCalls: 0,
        successfulCalls: 0,
        contextExceededErrors: 0,
        otherErrors: 0,
        consecutiveSuccesses: 0,
        currentLimit: limit,
        originalLimit: limit
      };
    }
    
    // Ensure logging directory exists
    if (config.logging.enabled) {
      await fs.ensureDir(config.logging.directory);
    }
    
    console.log('Context length manager initialized with config:', JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(`Error initializing context length manager: ${error.message}`);
    throw error;
  }
}

/**
 * Get the current token limit for a model
 * @param {string} model - Model name
 * @returns {number} - Token limit
 */
function getTokenLimit(model) {
  // Get adaptive limit if available, otherwise use default
  const limit = adaptiveLimits[model] || adaptiveLimits.default || config.tokenLimits[model] || config.tokenLimits.default;
  
  // Apply safety margin
  return Math.floor(limit * (1 - config.safetyMargin));
}

/**
 * Optimize a prompt to fit within token limits
 * @param {Object} promptData - Prompt data
 * @param {Object} options - Options
 * @returns {Object} - Optimized prompt
 */
function optimizePromptForTokenLimit(promptData, options = {}) {
  try {
    // Start performance measurement
    const startTime = performance.now();
    
    const {
      model = 'default',
      optimizationLevel = 'normal',
      forceOptimization = false
    } = options;
    
    // Get token limit for model
    const tokenLimit = getTokenLimit(model);
    
    // Count tokens in prompt
    const promptTokens = tokenUtils.countTokens(JSON.stringify(promptData));
    
    // Check if optimization is needed
    if (!forceOptimization && promptTokens <= tokenLimit) {
      // No optimization needed
      return {
        prompt: promptData,
        tokenCount: promptTokens,
        tokenLimit,
        optimized: false
      };
    }
    
    // Get optimization rules based on level
    let optimizationRules = config.optimizationLevels[optimizationLevel] || config.optimizationLevels.normal;
    
    // If still over limit after normal optimization, try aggressive
    let optimized = promptEngineering.optimizePrompt(promptData, {
      model,
      maxTokens: tokenLimit,
      rules: optimizationRules
    });
    
    // Check if we're still over the limit
    if (optimized.tokensAfter > tokenLimit && optimizationLevel === 'normal') {
      // Try aggressive optimization
      optimizationRules = config.optimizationLevels.aggressive;
      
      optimized = promptEngineering.optimizePrompt(promptData, {
        model,
        maxTokens: tokenLimit,
        rules: optimizationRules
      });
      
      // If still over limit, try extreme optimization
      if (optimized.tokensAfter > tokenLimit) {
        optimizationRules = config.optimizationLevels.extreme;
        
        optimized = promptEngineering.optimizePrompt(promptData, {
          model,
          maxTokens: tokenLimit,
          rules: optimizationRules
        });
      }
    }
    
    // Calculate execution time
    const executionTime = performance.now() - startTime;
    
    // Log event
    logEvent('optimize_prompt', {
      model,
      tokensBefore: promptTokens,
      tokensAfter: optimized.tokensAfter,
      tokenLimit,
      optimizationLevel,
      executionTime
    });
    
    // Record with tool usage tracker
    toolUsageTracker.logToolUsage({
      tool: 'optimizePromptForTokenLimit',
      category: 'contextLengthManager',
      executionTime,
      result: {
        tokensBefore: promptTokens,
        tokensAfter: optimized.tokensAfter,
        tokensSaved: promptTokens - optimized.tokensAfter
      },
      estimatedTokenSavings: promptTokens - optimized.tokensAfter,
      timestamp: new Date().toISOString()
    });
    
    return {
      prompt: optimized.prompt,
      tokenCount: optimized.tokensAfter,
      tokenLimit,
      optimized: true,
      optimizationLevel,
      tokensSaved: promptTokens - optimized.tokensAfter
    };
  } catch (error) {
    console.error(`Error optimizing prompt for token limit: ${error.message}`);
    
    // Return original prompt in case of error
    return {
      prompt: promptData,
      tokenCount: tokenUtils.countTokens(JSON.stringify(promptData)),
      error: error.message
    };
  }
}

/**
 * Handle a context length exceeded error
 * @param {Error} error - The error
 * @param {Object} context - Error context
 * @returns {Promise<Object>} - Recovery strategy
 */
async function handleContextLengthExceeded(error, context = {}) {
  try {
    const {
      model = 'default',
      promptData,
      retryFunction
    } = context;
    
    // Log the error
    logEvent('context_length_exceeded', {
      model,
      errorMessage: error.message,
      currentLimit: getTokenLimit(model)
    });
    
    // Update model stats
    if (modelStats[model]) {
      modelStats[model].contextExceededErrors++;
      modelStats[model].consecutiveSuccesses = 0;
    }
    
    // Adjust token limit for model
    adjustTokenLimit(model, 'decrease');
    
    // If no prompt data or retry function, can't recover
    if (!promptData || !retryFunction) {
      return {
        success: false,
        message: 'Cannot recover without prompt data and retry function'
      };
    }
    
    // Try to optimize the prompt with aggressive settings
    const optimized = optimizePromptForTokenLimit(promptData, {
      model,
      optimizationLevel: 'aggressive',
      forceOptimization: true
    });
    
    // If optimization failed or still over limit, try extreme optimization
    if (optimized.error || optimized.tokenCount > getTokenLimit(model)) {
      const extremeOptimized = optimizePromptForTokenLimit(promptData, {
        model,
        optimizationLevel: 'extreme',
        forceOptimization: true
      });
      
      // If extreme optimization succeeded, retry with optimized prompt
      if (!extremeOptimized.error && extremeOptimized.tokenCount <= getTokenLimit(model)) {
        try {
          const result = await retryFunction(extremeOptimized.prompt);
          
          // Log success
          logEvent('recovery_success', {
            model,
            optimizationLevel: 'extreme',
            tokensBefore: optimized.tokenCount,
            tokensAfter: extremeOptimized.tokenCount
          });
          
          return {
            success: true,
            result,
            optimizationLevel: 'extreme',
            tokensSaved: optimized.tokenCount - extremeOptimized.tokenCount
          };
        } catch (retryError) {
          // If retry failed, log and return error
          logEvent('recovery_failure', {
            model,
            optimizationLevel: 'extreme',
            errorMessage: retryError.message
          });
          
          return {
            success: false,
            message: `Recovery failed with extreme optimization: ${retryError.message}`
          };
        }
      }
    } else {
      // Try with aggressive optimization
      try {
        const result = await retryFunction(optimized.prompt);
        
        // Log success
        logEvent('recovery_success', {
          model,
          optimizationLevel: 'aggressive',
          tokensBefore: tokenUtils.countTokens(JSON.stringify(promptData)),
          tokensAfter: optimized.tokenCount
        });
        
        return {
          success: true,
          result,
          optimizationLevel: 'aggressive',
          tokensSaved: tokenUtils.countTokens(JSON.stringify(promptData)) - optimized.tokenCount
        };
      } catch (retryError) {
        // If retry failed, log and return error
        logEvent('recovery_failure', {
          model,
          optimizationLevel: 'aggressive',
          errorMessage: retryError.message
        });
        
        return {
          success: false,
          message: `Recovery failed with aggressive optimization: ${retryError.message}`
        };
      }
    }
    
    // If we get here, all recovery attempts failed
    return {
      success: false,
      message: 'All recovery attempts failed'
    };
  } catch (error) {
    console.error(`Error handling context length exceeded: ${error.message}`);
    return {
      success: false,
      message: `Error in recovery process: ${error.message}`
    };
  }
}

/**
 * Adjust token limit for a model
 * @param {string} model - Model name
 * @param {string} direction - 'increase' or 'decrease'
 * @returns {number} - New token limit
 */
function adjustTokenLimit(model, direction) {
  // If model not in adaptive limits, initialize it
  if (!adaptiveLimits[model]) {
    adaptiveLimits[model] = config.tokenLimits[model] || config.tokenLimits.default;
  }
  
  // Get current limit
  const currentLimit = adaptiveLimits[model];
  const originalLimit = config.tokenLimits[model] || config.tokenLimits.default;
  
  // Calculate new limit
  let newLimit;
  if (direction === 'decrease') {
    // Don't go below minimum
    const minLimit = originalLimit * config.adaptiveConfig.minReductionFactor;
    newLimit = Math.max(currentLimit * config.adaptiveConfig.reductionFactor, minLimit);
  } else {
    // Don't go above original
    newLimit = Math.min(currentLimit * config.adaptiveConfig.recoveryFactor, originalLimit);
  }
  
  // Update adaptive limit
  adaptiveLimits[model] = newLimit;
  
  // Update model stats
  if (modelStats[model]) {
    modelStats[model].currentLimit = newLimit;
  }
  
  // Log adjustment
  logEvent('token_limit_adjustment', {
    model,
    direction,
    previousLimit: currentLimit,
    newLimit,
    originalLimit
  });
  
  return newLimit;
}

/**
 * Record a successful API call
 * @param {string} model - Model name
 */
function recordSuccess(model) {
  // If model not in stats, initialize it
  if (!modelStats[model]) {
    modelStats[model] = {
      totalCalls: 0,
      successfulCalls: 0,
      contextExceededErrors: 0,
      otherErrors: 0,
      consecutiveSuccesses: 0,
      currentLimit: config.tokenLimits[model] || config.tokenLimits.default,
      originalLimit: config.tokenLimits[model] || config.tokenLimits.default
    };
  }
  
  // Update stats
  modelStats[model].totalCalls++;
  modelStats[model].successfulCalls++;
  modelStats[model].consecutiveSuccesses++;
  
  // If enough consecutive successes, try increasing token limit
  if (modelStats[model].consecutiveSuccesses >= config.adaptiveConfig.consecutiveSuccessesForRecovery) {
    adjustTokenLimit(model, 'increase');
    
    // Reset consecutive successes
    modelStats[model].consecutiveSuccesses = 0;
  }
  
  // Log success
  logEvent('api_call_success', {
    model,
    consecutiveSuccesses: modelStats[model].consecutiveSuccesses,
    currentLimit: adaptiveLimits[model]
  });
}

/**
 * Record an API call error
 * @param {string} model - Model name
 * @param {Error} error - The error
 */
function recordError(model, error) {
  // If model not in stats, initialize it
  if (!modelStats[model]) {
    modelStats[model] = {
      totalCalls: 0,
      successfulCalls: 0,
      contextExceededErrors: 0,
      otherErrors: 0,
      consecutiveSuccesses: 0,
      currentLimit: config.tokenLimits[model] || config.tokenLimits.default,
      originalLimit: config.tokenLimits[model] || config.tokenLimits.default
    };
  }
  
  // Update stats
  modelStats[model].totalCalls++;
  modelStats[model].consecutiveSuccesses = 0;
  
  // Check error type
  const errorCategory = enhancedErrorHandling.categorizeError(error);
  const isContextLengthError = error.code === 'context_length_exceeded' || 
    (error.message && error.message.includes('context length'));
  
  if (isContextLengthError) {
    modelStats[model].contextExceededErrors++;
    
    // Adjust token limit
    adjustTokenLimit(model, 'decrease');
  } else {
    modelStats[model].otherErrors++;
  }
  
  // Log error
  logEvent('api_call_error', {
    model,
    errorType: isContextLengthError ? 'context_length_exceeded' : errorCategory.name,
    errorMessage: error.message,
    currentLimit: adaptiveLimits[model]
  });
}

/**
 * Split content into chunks for processing
 * @param {string} content - Content to split
 * @param {Object} options - Chunking options
 * @returns {Array<string>} - Content chunks
 */
function splitIntoChunks(content, options = {}) {
  try {
    const {
      maxChunkSize = config.chunkingStrategies.defaultMaxChunkSize,
      overlapSize = config.chunkingStrategies.overlapSize,
      splitOn = ['\n\n', '\n', '. ', ' '] // Try to split on paragraph breaks, then lines, then sentences, then words
    } = options;
    
    // If content is small enough, return as is
    if (tokenUtils.countTokens(content) <= maxChunkSize) {
      return [content];
    }
    
    const chunks = [];
    let remainingContent = content;
    
    while (remainingContent.length > 0) {
      // Find the best split point
      let splitIndex = -1;
      let splitChar = '';
      
      for (const splitChar of splitOn) {
        // Find the last occurrence of splitChar within maxChunkSize
        const maxPos = remainingContent.length;
        let pos = 0;
        let lastGoodPos = -1;
        
        while (pos < maxPos) {
          pos = remainingContent.indexOf(splitChar, pos);
          if (pos === -1) break;
          
          // Check if this position would create a chunk within the token limit
          const potentialChunk = remainingContent.substring(0, pos + splitChar.length);
          if (tokenUtils.countTokens(potentialChunk) <= maxChunkSize) {
            lastGoodPos = pos;
            pos += splitChar.length;
          } else {
            break;
          }
        }
        
        if (lastGoodPos !== -1) {
          splitIndex = lastGoodPos;
          break;
        }
      }
      
      // If no good split point found, force split at maxChunkSize
      if (splitIndex === -1) {
        // Find the last space within maxChunkSize characters
        const maxChars = maxChunkSize * 4; // Rough estimate: 1 token ≈ 4 characters
        const limitedContent = remainingContent.substring(0, Math.min(remainingContent.length, maxChars));
        splitIndex = limitedContent.lastIndexOf(' ');
        
        // If no space found, just split at maxChars
        if (splitIndex === -1) {
          splitIndex = Math.min(remainingContent.length, maxChars);
        }
      }
      
      // Extract chunk
      const chunk = remainingContent.substring(0, splitIndex + 1);
      chunks.push(chunk);
      
      // Update remaining content, with overlap
      const overlapStart = Math.max(0, splitIndex - overlapSize);
      remainingContent = remainingContent.substring(overlapStart);
    }
    
    // Log chunking
    logEvent('content_chunking', {
      originalSize: tokenUtils.countTokens(content),
      chunkCount: chunks.length,
      averageChunkSize: chunks.reduce((sum, chunk) => sum + tokenUtils.countTokens(chunk), 0) / chunks.length
    });
    
    return chunks;
  } catch (error) {
    console.error(`Error splitting content into chunks: ${error.message}`);
    
    // Return original content as a single chunk
    return [content];
  }
}

/**
 * Process content in chunks
 * @param {string} content - Content to process
 * @param {Function} processFn - Function to process each chunk
 * @param {Object} options - Processing options
 * @returns {Promise<any>} - Combined result
 */
async function processInChunks(content, processFn, options = {}) {
  try {
    // Start performance measurement
    const startTime = performance.now();
    
    const {
      maxChunkSize = config.chunkingStrategies.defaultMaxChunkSize,
      overlapSize = config.chunkingStrategies.overlapSize,
      combineResults = config.chunkingStrategies.combineResults,
      combineFunction = defaultCombineFunction,
      chunkContext = {}
    } = options;
    
    // Split content into chunks
    const chunks = splitIntoChunks(content, {
      maxChunkSize,
      overlapSize
    });
    
    // Process each chunk
    const results = [];
    let chunkIndex = 0;
    
    for (const chunk of chunks) {
      try {
        // Process chunk
        const result = await processFn(chunk, {
          ...chunkContext,
          chunkIndex,
          totalChunks: chunks.length,
          isFirstChunk: chunkIndex === 0,
          isLastChunk: chunkIndex === chunks.length - 1
        });
        
        results.push(result);
      } catch (error) {
        console.error(`Error processing chunk ${chunkIndex}: ${error.message}`);
        
        // Add error to results
        results.push({
          error: error.message,
          chunk,
          chunkIndex
        });
      }
      
      chunkIndex++;
    }
    
    // Combine results if requested
    let finalResult;
    if (combineResults && chunks.length > 1) {
      finalResult = combineFunction(results, options);
    } else {
      finalResult = results;
    }
    
    // Calculate execution time
    const executionTime = performance.now() - startTime;
    
    // Log processing
    logEvent('chunk_processing', {
      chunkCount: chunks.length,
      successfulChunks: results.filter(r => !r.error).length,
      failedChunks: results.filter(r => r.error).length,
      executionTime
    });
    
    // Record with tool usage tracker
    toolUsageTracker.logToolUsage({
      tool: 'processInChunks',
      category: 'contextLengthManager',
      executionTime,
      result: {
        chunkCount: chunks.length,
        successfulChunks: results.filter(r => !r.error).length
      },
      estimatedTokenSavings: 0, // Hard to estimate
      timestamp: new Date().toISOString()
    });
    
    return finalResult;
  } catch (error) {
    console.error(`Error processing content in chunks: ${error.message}`);
    throw error;
  }
}

/**
 * Default function to combine results from chunks
 * @param {Array} results - Results from each chunk
 * @param {Object} options - Combining options
 * @returns {any} - Combined result
 */
function defaultCombineFunction(results, options = {}) {
  // If all results are strings, concatenate them
  if (results.every(r => typeof r === 'string')) {
    return results.join('\n\n');
  }
  
  // If all results are arrays, concatenate them
  if (results.every(r => Array.isArray(r))) {
    return results.flat();
  }
  
  // If all results are objects, merge them
  if (results.every(r => typeof r === 'object' && r !== null && !Array.isArray(r))) {
    return Object.assign({}, ...results);
  }
  
  // Otherwise, return array of results
  return results;
}

/**
 * Log an event
 * @param {string} eventType - Event type
 * @param {Object} eventData - Event data
 */
function logEvent(eventType, eventData = {}) {
  try {
    if (!config.logging.enabled) return;
    
    // Create event
    const event = {
      timestamp: new Date().toISOString(),
      eventType,
      ...eventData
    };
    
    // Add to in-memory log
    eventLog.push(event);
    
    // Write to file
    const logFilePath = path.join(config.logging.directory, config.logging.contextLengthLogFile);
    fs.ensureDir(path.dirname(logFilePath))
      .then(() => {
        fs.readJson(logFilePath)
          .then(existingLogs => {
            existingLogs.push(event);
            return fs.writeJson(logFilePath, existingLogs, { spaces: 2 });
          })
          .catch(() => {
            // If file doesn't exist or can't be read, create new file
            return fs.writeJson(logFilePath, [event], { spaces: 2 });
          });
      })
      .catch(error => {
        console.error(`Error writing to context length log: ${error.message}`);
      });
    
    // Record metric
    metricsUtils.recordMetric('contextLength', eventType, 1, eventData);
  } catch (error) {
    console.error(`Error logging event: ${error.message}`);
  }
}

/**
 * Get statistics about context length management
 * @returns {Object} - Statistics
 */
function getStatistics() {
  return {
    modelStats,
    adaptiveLimits,
    eventCounts: eventLog.reduce((counts, event) => {
      counts[event.eventType] = (counts[event.eventType] || 0) + 1;
      return counts;
    }, {})
  };
}

/**
 * Generate a context length management report
 * @returns {Promise<Object>} - Report
 */
async function generateReport() {
  try {
    // Get statistics
    const stats = getStatistics();
    
    // Calculate overall metrics
    const totalCalls = Object.values(stats.modelStats).reduce((sum, modelStat) => sum + modelStat.totalCalls, 0);
    const totalContextExceededErrors = Object.values(stats.modelStats).reduce((sum, modelStat) => sum + modelStat.contextExceededErrors, 0);
    const totalOtherErrors = Object.values(stats.modelStats).reduce((sum, modelStat) => sum + modelStat.otherErrors, 0);
    const totalSuccessfulCalls = Object.values(stats.modelStats).reduce((sum, modelStat) => sum + modelStat.successfulCalls, 0);
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalCalls,
        totalSuccessfulCalls,
        totalContextExceededErrors,
        totalOtherErrors,
        successRate: totalCalls > 0 ? totalSuccessfulCalls / totalCalls : 0,
        contextExceededRate: totalCalls > 0 ? totalContextExceededErrors / totalCalls : 0
      },
      modelStats: stats.modelStats,
      adaptiveLimits: stats.adaptiveLimits,
      eventCounts: stats.eventCounts
    };
    
    // Save report to file
    const reportPath = path.join(config.logging.directory, `context-length-report-${new Date().toISOString().replace(/:/g, '-')}.json`);
    await fs.writeJson(reportPath, report, { spaces: 2 });
    
    return {
      report,
      path: reportPath
    };
  } catch (error) {
    console.error(`Error generating context length report: ${error.message}`);
    throw error;
  }
}

// Initialize on module load
initialize().catch(console.error);

// Export functions
module.exports = {
  initialize,
  getTokenLimit,
  optimizePromptForTokenLimit,
  handleContextLengthExceeded,
  recordSuccess,
  recordError,
  splitIntoChunks,
  processInChunks,
  getStatistics,
  generateReport
};
