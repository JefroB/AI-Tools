/**
 * Prompt Style Manager Module for AI Tools
 * 
 * This module provides utilities for managing prompt styles, token counting,
 * and logging prompt usage to help optimize AI interactions.
 */

const fs = require('fs-extra');
const path = require('path');
const tokenUtils = require('./tokenUtils');
const metricsUtils = require('./metricsUtils');

// Default configuration
const DEFAULT_CONFIG = {
  enabled: true,
  logging: {
    enabled: true,
    directory: path.resolve('logs/prompts'),
    filename: 'prompt-usage.log',
    format: 'json'
  }
};

// Runtime configuration
let config = { ...DEFAULT_CONFIG };

/**
 * Initialize the prompt style manager
 * @param {Object} customConfig - Custom configuration
 * @returns {Promise<void>}
 */
async function initialize(customConfig = {}) {
  try {
    // Merge custom configuration with defaults
    config = {
      ...DEFAULT_CONFIG,
      ...customConfig,
      logging: {
        ...DEFAULT_CONFIG.logging,
        ...(customConfig.logging || {})
      }
    };
    
    // Ensure log directory exists if logging is enabled
    if (config.enabled && config.logging.enabled) {
      await fs.ensureDir(config.logging.directory);
    }
    
    console.log('Prompt style manager initialized');
  } catch (error) {
    console.error(`Error initializing prompt style manager: ${error.message}`);
    throw error;
  }
}

/**
 * Simple file logger
 * @param {string} level - Log level
 * @param {Object} data - Data to log
 * @returns {Promise<void>}
 */
async function logToFile(level, data) {
  try {
    if (!config.enabled || !config.logging.enabled) return;
    
    const logFilePath = path.join(config.logging.directory, config.logging.filename);
    
    // Create log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      ...data
    };
    
    // Format log entry
    let logString;
    if (config.logging.format === 'json') {
      logString = JSON.stringify(logEntry) + '\n';
    } else {
      logString = `[${logEntry.timestamp}] [${level.toUpperCase()}] ${JSON.stringify(data)}\n`;
    }
    
    // Append to log file
    await fs.appendFile(logFilePath, logString);
  } catch (error) {
    console.error(`Error logging to file: ${error.message}`);
  }
}

/**
 * Count tokens in text
 * @param {string} text - Text to count tokens for
 * @param {string} modelName - Model name (e.g., 'gpt-3.5-turbo', 'claude-3-opus')
 * @returns {number} - Token count
 */
function countTokens(text, modelName = 'claude-3-opus') {
  if (!text) return 0;
  
  try {
    // Use tokenUtils for token counting
    return tokenUtils.countTokens(text, modelName);
  } catch (error) {
    console.error(`Error counting tokens: ${error.message}`);
    
    // Fallback to simple estimation if tokenUtils fails
    return Math.ceil(text.length / 4);
  }
}

/**
 * Log prompt usage
 * @param {string} prompt - The prompt text
 * @param {string} modelName - Model name
 * @param {string} aiToolName - AI tool name
 * @param {string} response - Response text
 * @param {number} startTime - Start time (milliseconds since epoch)
 * @returns {Object} - Log entry
 */
function logPrompt(prompt, modelName, aiToolName, response, startTime) {
  if (!config.enabled) {
    return null;
  }
  
  try {
    // Calculate token counts
    const promptTokenCount = countTokens(prompt, modelName);
    const responseTokenCount = countTokens(response, modelName);
    const totalTokenCount = promptTokenCount + responseTokenCount;
    
    // Calculate latency
    const latency = Date.now() - startTime;
    
    // Create log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      aiToolName,
      modelName,
      promptTokenCount,
      responseTokenCount,
      totalTokenCount,
      latency
    };
    
    // Log to file (don't include full prompt/response text to keep logs manageable)
    logToFile('info', {
      event: 'prompt_usage',
      ...logEntry,
      prompt: prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt,
      response: response.length > 100 ? response.substring(0, 100) + '...' : response
    });
    
    // Record metrics
    metricsUtils.recordMetric('api', 'call', 1, {
      tokens: {
        prompt: promptTokenCount,
        completion: responseTokenCount,
        total: totalTokenCount
      },
      latency
    });
    
    // Include full prompt/response in returned log entry
    logEntry.prompt = prompt;
    logEntry.response = response;
    
    return logEntry;
  } catch (error) {
    console.error(`Error logging prompt: ${error.message}`);
    
    // Try to log the error
    logToFile('error', {
      event: 'prompt_log_error',
      error: error.message,
      aiToolName,
      modelName
    });
    
    return null;
  }
}

/**
 * Get prompt usage statistics
 * @param {Object} options - Options
 * @param {number} options.timeRange - Time range in milliseconds
 * @param {string} options.modelName - Filter by model name
 * @param {string} options.aiToolName - Filter by AI tool name
 * @returns {Promise<Object>} - Usage statistics
 */
async function getPromptUsageStats(options = {}) {
  if (!config.enabled) {
    return null;
  }
  
  try {
    // Get metrics summary
    const metrics = metricsUtils.getMetricsSummary({
      category: 'api',
      timeRange: options.timeRange
    });
    
    // Return API metrics
    return {
      totalCalls: metrics.api.calls,
      totalTokens: metrics.api.tokens.total,
      promptTokens: metrics.api.tokens.prompt,
      completionTokens: metrics.api.tokens.completion,
      avgTokensPerCall: metrics.api.avgTokensPerCall || 0,
      avgLatency: metrics.api.avgLatency || 0,
      errors: metrics.api.errors,
      errorRate: metrics.api.calls > 0 ? metrics.api.errors / metrics.api.calls : 0
    };
  } catch (error) {
    console.error(`Error getting prompt usage stats: ${error.message}`);
    return null;
  }
}

/**
 * Analyze prompt style patterns
 * @param {string} prompt - Prompt text to analyze
 * @returns {Object} - Analysis results
 */
function analyzePromptStyle(prompt) {
  if (!prompt) return null;
  
  try {
    // Basic analysis of prompt style
    const analysis = {
      length: prompt.length,
      tokenCount: countTokens(prompt),
      sentences: 0,
      questions: 0,
      commands: 0,
      codeBlocks: 0,
      bulletPoints: 0
    };
    
    // Count sentences
    const sentenceMatches = prompt.match(/[.!?]+\s+/g);
    analysis.sentences = sentenceMatches ? sentenceMatches.length + 1 : 1;
    
    // Count questions
    const questionMatches = prompt.match(/\?/g);
    analysis.questions = questionMatches ? questionMatches.length : 0;
    
    // Count commands (imperative sentences)
    const commandMatches = prompt.match(/\b(create|make|generate|write|implement|add|remove|delete|update|modify|change|find|search|list|show|display|explain|describe|analyze|summarize|review)\b/gi);
    analysis.commands = commandMatches ? commandMatches.length : 0;
    
    // Count code blocks
    const codeBlockMatches = prompt.match(/```[\s\S]*?```/g);
    analysis.codeBlocks = codeBlockMatches ? codeBlockMatches.length : 0;
    
    // Count bullet points
    const bulletPointMatches = prompt.match(/^[\s]*[-*•][\s]/gm);
    analysis.bulletPoints = bulletPointMatches ? bulletPointMatches.length : 0;
    
    return analysis;
  } catch (error) {
    console.error(`Error analyzing prompt style: ${error.message}`);
    return null;
  }
}

// Initialize on module load
initialize().catch(console.error);

module.exports = {
  initialize,
  countTokens,
  logPrompt,
  getPromptUsageStats,
  analyzePromptStyle
};
