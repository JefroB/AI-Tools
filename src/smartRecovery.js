/**
 * Smart Recovery Module for AI Tools
 * 
 * This module provides context-aware recovery strategies for AI-Tools operations,
 * including retry mechanisms, adaptive prompting, and fallback strategies.
 * 
 * Features:
 * - Context-aware retry with exponential backoff and jitter
 * - Adaptive prompting based on failure patterns
 * - Context-aware fallback strategies
 * - Circuit breaker pattern to prevent cascading failures
 * - Integration with contextCollector and toolUsageTracker
 */

const { v4: uuidv4 } = require('uuid');
const { performance } = require('perf_hooks');
const contextCollector = require('./contextCollector');

// Default configuration
const DEFAULT_CONFIG = {
  enabled: true,
  retry: {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffFactor: 2,
    jitter: true,
    retryableErrors: [
      // Network errors
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'ENOTFOUND',
      // HTTP errors
      '429', // Too Many Requests
      '500', // Internal Server Error
      '502', // Bad Gateway
      '503', // Service Unavailable
      '504', // Gateway Timeout
      // AI model errors
      'model_overloaded',
      'context_length_exceeded'
    ]
  },
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5, // Number of failures before opening circuit
    resetTimeout: 60000, // 60 seconds
    halfOpenMaxCalls: 1 // Number of calls allowed in half-open state
  },
  adaptivePrompting: {
    enabled: true,
    promptModifications: {
      'context_length_exceeded': {
        action: 'truncate',
        factor: 0.75
      },
      'model_overloaded': {
        action: 'simplify',
        factor: 0.5
      },
      'invalid_request_error': {
        action: 'sanitize',
        factor: 1.0
      }
    }
  },
  fallback: {
    enabled: true,
    strategies: {
      // Default fallback strategies by category
      'api': ['retry', 'alternative_api', 'cached_response', 'degraded_response'],
      'file': ['retry', 'alternative_path', 'create_if_missing', 'empty_result'],
      'processing': ['retry', 'simplified_processing', 'skip_processing'],
      'default': ['retry', 'degraded_response']
    }
  }
};

// Runtime configuration
let config = { ...DEFAULT_CONFIG };

// Circuit breaker state
const circuitBreakers = new Map();

// Failure counters
const failureCounters = new Map();

/**
 * Initialize the smart recovery module
 * @param {Object} customConfig - Custom configuration
 * @returns {Promise<void>}
 */
async function initialize(customConfig = {}) {
  try {
    // Merge custom configuration with defaults
    config = {
      ...DEFAULT_CONFIG,
      ...customConfig,
      retry: {
        ...DEFAULT_CONFIG.retry,
        ...(customConfig.retry || {})
      },
      circuitBreaker: {
        ...DEFAULT_CONFIG.circuitBreaker,
        ...(customConfig.circuitBreaker || {})
      },
      adaptivePrompting: {
        ...DEFAULT_CONFIG.adaptivePrompting,
        ...(customConfig.adaptivePrompting || {}),
        promptModifications: {
          ...DEFAULT_CONFIG.adaptivePrompting.promptModifications,
          ...(customConfig.adaptivePrompting?.promptModifications || {})
        }
      },
      fallback: {
        ...DEFAULT_CONFIG.fallback,
        ...(customConfig.fallback || {}),
        strategies: {
          ...DEFAULT_CONFIG.fallback.strategies,
          ...(customConfig.fallback?.strategies || {})
        }
      }
    };
    
    console.log('Smart recovery initialized with config:', JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(`Error initializing smart recovery: ${error.message}`);
    throw error;
  }
}

/**
 * Retry a function with exponential backoff and jitter
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>} - Function result
 */
async function retryWithBackoff(fn, options = {}) {
  if (!config.enabled) {
    return fn();
  }
  
  // Merge options with defaults
  const retryOptions = {
    ...config.retry,
    ...options,
    context: options.context || {}
  };
  
  const {
    maxRetries,
    initialDelay,
    maxDelay,
    backoffFactor,
    jitter,
    retryableErrors,
    context
  } = retryOptions;
  
  // Start context session if not provided
  const sessionId = context.sessionId || contextCollector.startSession({
    scriptName: context.scriptName || 'smartRecovery'
  });
  
  // Add initial event
  contextCollector.addEvent(sessionId, {
    type: 'retry_start',
    maxRetries,
    initialDelay,
    backoffFactor,
    functionName: fn.name || 'anonymous'
  });
  
  // Check circuit breaker
  const circuitBreakerKey = context.circuitBreakerKey || fn.name || 'default';
  if (config.circuitBreaker.enabled && isCircuitOpen(circuitBreakerKey)) {
    const circuitBreakerError = new Error(`Circuit breaker open for ${circuitBreakerKey}`);
    circuitBreakerError.code = 'CIRCUIT_OPEN';
    
    // Add circuit breaker event
    contextCollector.addEvent(sessionId, {
      type: 'circuit_breaker',
      status: 'open',
      key: circuitBreakerKey
    });
    
    // End session with error
    await contextCollector.endSession(sessionId, {
      status: 'error',
      error: circuitBreakerError
    });
    
    throw circuitBreakerError;
  }
  
  let lastError;
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      // If not first attempt, add retry event
      if (attempt > 0) {
        contextCollector.addEvent(sessionId, {
          type: 'retry_attempt',
          attempt,
          delay: calculateDelay(attempt, initialDelay, maxDelay, backoffFactor, jitter),
          error: lastError ? {
            message: lastError.message,
            code: lastError.code,
            name: lastError.name
          } : null
        });
      }
      
      // Execute function
      const result = await fn();
      
      // Success - reset failure counter and close circuit if half-open
      resetFailureCounter(circuitBreakerKey);
      if (getCircuitState(circuitBreakerKey) === 'half-open') {
        closeCircuit(circuitBreakerKey);
      }
      
      // Add success event
      contextCollector.addEvent(sessionId, {
        type: 'retry_success',
        attempt,
        totalAttempts: attempt + 1
      });
      
      // End session with success
      await contextCollector.endSession(sessionId, {
        status: 'success'
      });
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      const isRetryable = isRetryableError(error, retryableErrors);
      
      // Add error event
      contextCollector.addEvent(sessionId, {
        type: 'retry_error',
        attempt,
        error: {
          message: error.message,
          code: error.code,
          name: error.name,
          stack: error.stack
        },
        isRetryable
      });
      
      // If not retryable or max retries reached, throw error
      if (!isRetryable || attempt >= maxRetries) {
        // Increment failure counter and check circuit breaker
        incrementFailureCounter(circuitBreakerKey);
        checkCircuitBreaker(circuitBreakerKey);
        
        // End session with error
        await contextCollector.endSession(sessionId, {
          status: 'error',
          error
        });
        
        throw error;
      }
      
      // Calculate delay for next retry
      const delay = calculateDelay(attempt + 1, initialDelay, maxDelay, backoffFactor, jitter);
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      attempt++;
    }
  }
  
  // This should never be reached, but just in case
  throw lastError;
}

/**
 * Check if an error is retryable
 * @param {Error} error - Error to check
 * @param {Array<string>} retryableErrors - List of retryable error codes
 * @returns {boolean} - Whether the error is retryable
 */
function isRetryableError(error, retryableErrors) {
  // Check error code
  if (error.code && retryableErrors.includes(error.code)) {
    return true;
  }
  
  // Check HTTP status code
  if (error.status && retryableErrors.includes(error.status.toString())) {
    return true;
  }
  
  // Check error message for known patterns
  for (const pattern of retryableErrors) {
    if (error.message && error.message.toLowerCase().includes(pattern.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate delay for retry with exponential backoff and jitter
 * @param {number} attempt - Retry attempt number (1-based)
 * @param {number} initialDelay - Initial delay in milliseconds
 * @param {number} maxDelay - Maximum delay in milliseconds
 * @param {number} backoffFactor - Backoff factor
 * @param {boolean} jitter - Whether to add jitter
 * @returns {number} - Delay in milliseconds
 */
function calculateDelay(attempt, initialDelay, maxDelay, backoffFactor, jitter) {
  // Calculate exponential backoff
  let delay = initialDelay * Math.pow(backoffFactor, attempt - 1);
  
  // Apply jitter if enabled (adds or subtracts up to 25% of the delay)
  if (jitter) {
    const jitterFactor = 0.25; // 25% jitter
    const jitterAmount = delay * jitterFactor;
    delay = delay + (Math.random() * jitterAmount * 2) - jitterAmount;
  }
  
  // Ensure delay is not greater than max delay
  return Math.min(delay, maxDelay);
}

/**
 * Apply adaptive prompting based on error
 * @param {string} prompt - Original prompt
 * @param {Error} error - Error that occurred
 * @param {Object} options - Options
 * @returns {string} - Modified prompt
 */
function applyAdaptivePrompting(prompt, error, options = {}) {
  if (!config.enabled || !config.adaptivePrompting.enabled) {
    return prompt;
  }
  
  try {
    // Get error code or message
    const errorCode = error.code || '';
    const errorMessage = error.message || '';
    
    // Find matching modification
    let modification = null;
    
    // Check for exact code match
    if (errorCode && config.adaptivePrompting.promptModifications[errorCode]) {
      modification = config.adaptivePrompting.promptModifications[errorCode];
    } else {
      // Check for partial message match
      for (const [code, mod] of Object.entries(config.adaptivePrompting.promptModifications)) {
        if (errorMessage.toLowerCase().includes(code.toLowerCase())) {
          modification = mod;
          break;
        }
      }
    }
    
    // If no modification found, return original prompt
    if (!modification) {
      return prompt;
    }
    
    // Apply modification based on action
    switch (modification.action) {
      case 'truncate':
        // Truncate prompt to a percentage of its original length
        const maxLength = Math.floor(prompt.length * modification.factor);
        return prompt.substring(0, maxLength);
        
      case 'simplify':
        // Simplify prompt by removing detailed instructions
        return simplifyPrompt(prompt, modification.factor);
        
      case 'sanitize':
        // Sanitize prompt by removing potentially problematic characters
        return sanitizePrompt(prompt);
        
      default:
        return prompt;
    }
  } catch (error) {
    console.error(`Error applying adaptive prompting: ${error.message}`);
    return prompt;
  }
}

/**
 * Simplify a prompt by removing detailed instructions
 * @param {string} prompt - Original prompt
 * @param {number} factor - Simplification factor (0-1)
 * @returns {string} - Simplified prompt
 */
function simplifyPrompt(prompt, factor) {
  try {
    // Split prompt into lines
    const lines = prompt.split('\n');
    
    // If factor is very low, return a drastically simplified version
    if (factor <= 0.3) {
      // Extract just the main request, typically the last paragraph
      const mainRequest = lines.filter(line => line.trim().length > 0).slice(-2).join('\n');
      return `Please respond to this request concisely: ${mainRequest}`;
    }
    
    // For moderate simplification, remove detailed examples and keep main instructions
    if (factor <= 0.7) {
      // Remove lines that look like examples (often indented or have code blocks)
      const simplified = lines.filter(line => {
        const trimmed = line.trim();
        return !(
          line.startsWith('  ') || // Indented lines
          line.startsWith('\t') || // Tab-indented lines
          trimmed.startsWith('```') || // Code blocks
          trimmed.startsWith('Example:') || // Example markers
          trimmed.startsWith('e.g.,') // Example markers
        );
      });
      
      return simplified.join('\n');
    }
    
    // For light simplification, just remove very detailed parts
    const simplified = lines.filter(line => {
      const trimmed = line.trim();
      return !(
        trimmed.startsWith('```') || // Code blocks
        trimmed.startsWith('Note:') || // Notes
        trimmed.startsWith('Important:') // Important notes
      );
    });
    
    return simplified.join('\n');
  } catch (error) {
    console.error(`Error simplifying prompt: ${error.message}`);
    return prompt;
  }
}

/**
 * Sanitize a prompt by removing potentially problematic characters
 * @param {string} prompt - Original prompt
 * @returns {string} - Sanitized prompt
 */
function sanitizePrompt(prompt) {
  try {
    // Remove control characters
    let sanitized = prompt.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    // Remove potentially problematic sequences
    sanitized = sanitized.replace(/```/g, ''); // Remove code block markers
    
    return sanitized;
  } catch (error) {
    console.error(`Error sanitizing prompt: ${error.message}`);
    return prompt;
  }
}

/**
 * Apply fallback strategy based on error and category
 * @param {Error} error - Error that occurred
 * @param {string} category - Operation category
 * @param {Object} context - Operation context
 * @returns {Promise<any>} - Fallback result
 */
async function applyFallbackStrategy(error, category, context = {}) {
  if (!config.enabled || !config.fallback.enabled) {
    throw error;
  }
  
  try {
    // Get fallback strategies for category
    const strategies = config.fallback.strategies[category] || config.fallback.strategies.default;
    
    // Start context session if not provided
    const sessionId = context.sessionId || contextCollector.startSession({
      scriptName: context.scriptName || 'smartRecovery'
    });
    
    // Add fallback event
    contextCollector.addEvent(sessionId, {
      type: 'fallback_start',
      category,
      error: {
        message: error.message,
        code: error.code,
        name: error.name
      },
      availableStrategies: strategies
    });
    
    // Try each strategy in order
    for (const strategy of strategies) {
      try {
        // Add strategy attempt event
        contextCollector.addEvent(sessionId, {
          type: 'fallback_attempt',
          strategy
        });
        
        // Apply strategy
        const result = await applyStrategy(strategy, error, context);
        
        // Add success event
        contextCollector.addEvent(sessionId, {
          type: 'fallback_success',
          strategy
        });
        
        // End session with success
        await contextCollector.endSession(sessionId, {
          status: 'success'
        });
        
        return result;
      } catch (strategyError) {
        // Add strategy failure event
        contextCollector.addEvent(sessionId, {
          type: 'fallback_failure',
          strategy,
          error: {
            message: strategyError.message,
            code: strategyError.code,
            name: strategyError.name
          }
        });
        
        // Continue to next strategy
      }
    }
    
    // If all strategies failed, throw original error
    // End session with error
    await contextCollector.endSession(sessionId, {
      status: 'error',
      error
    });
    
    throw error;
  } catch (fallbackError) {
    console.error(`Error applying fallback strategy: ${fallbackError.message}`);
    throw error; // Throw original error
  }
}

/**
 * Apply a specific fallback strategy
 * @param {string} strategy - Strategy name
 * @param {Error} error - Original error
 * @param {Object} context - Operation context
 * @returns {Promise<any>} - Strategy result
 */
async function applyStrategy(strategy, error, context) {
  switch (strategy) {
    case 'retry':
      // Already handled by retryWithBackoff
      throw new Error('Retry strategy should be handled by retryWithBackoff');
      
    case 'alternative_api':
      return applyAlternativeApiStrategy(error, context);
      
    case 'cached_response':
      return applyCachedResponseStrategy(error, context);
      
    case 'degraded_response':
      return applyDegradedResponseStrategy(error, context);
      
    case 'alternative_path':
      return applyAlternativePathStrategy(error, context);
      
    case 'create_if_missing':
      return applyCreateIfMissingStrategy(error, context);
      
    case 'empty_result':
      return applyEmptyResultStrategy(error, context);
      
    case 'simplified_processing':
      return applySimplifiedProcessingStrategy(error, context);
      
    case 'skip_processing':
      return applySkipProcessingStrategy(error, context);
      
    default:
      throw new Error(`Unknown fallback strategy: ${strategy}`);
  }
}

/**
 * Apply alternative API strategy
 * @param {Error} error - Original error
 * @param {Object} context - Operation context
 * @returns {Promise<any>} - Strategy result
 */
async function applyAlternativeApiStrategy(error, context) {
  // Check if alternative API is provided
  if (!context.alternativeApi) {
    throw new Error('No alternative API provided');
  }
  
  // Call alternative API
  return context.alternativeApi(context.params);
}

/**
 * Apply cached response strategy
 * @param {Error} error - Original error
 * @param {Object} context - Operation context
 * @returns {Promise<any>} - Strategy result
 */
async function applyCachedResponseStrategy(error, context) {
  // Check if cache key is provided
  if (!context.cacheKey) {
    throw new Error('No cache key provided');
  }
  
  // Try to get cached response
  const cachedResponse = await getCachedResponse(context.cacheKey);
  
  if (!cachedResponse) {
    throw new Error('No cached response available');
  }
  
  return {
    ...cachedResponse,
    fromCache: true
  };
}

/**
 * Apply degraded response strategy
 * @param {Error} error - Original error
 * @param {Object} context - Operation context
 * @returns {Promise<any>} - Strategy result
 */
async function applyDegradedResponseStrategy(error, context) {
  // Check if degraded response generator is provided
  if (!context.degradedResponse && !context.defaultResponse) {
    throw new Error('No degraded response generator or default response provided');
  }
  
  // Generate degraded response
  if (context.degradedResponse) {
    return context.degradedResponse(context.params, error);
  }
  
  // Return default response
  return {
    ...context.defaultResponse,
    degraded: true
  };
}

/**
 * Apply alternative path strategy
 * @param {Error} error - Original error
 * @param {Object} context - Operation context
 * @returns {Promise<any>} - Strategy result
 */
async function applyAlternativePathStrategy(error, context) {
  // Check if alternative path is provided
  if (!context.alternativePath) {
    throw new Error('No alternative path provided');
  }
  
  // Check if original path is provided
  if (!context.originalPath) {
    throw new Error('No original path provided');
  }
  
  // Replace original path with alternative path in params
  const newParams = { ...context.params };
  
  // Find the parameter that contains the path
  let pathParam = null;
  for (const [key, value] of Object.entries(newParams)) {
    if (typeof value === 'string' && value.includes(context.originalPath)) {
      pathParam = key;
      break;
    }
  }
  
  if (!pathParam) {
    throw new Error('Could not find path parameter');
  }
  
  // Replace path
  newParams[pathParam] = newParams[pathParam].replace(context.originalPath, context.alternativePath);
  
  // Call original function with new params
  if (!context.originalFunction) {
    throw new Error('No original function provided');
  }
  
  return context.originalFunction(newParams);
}

/**
 * Apply create if missing strategy
 * @param {Error} error - Original error
 * @param {Object} context - Operation context
 * @returns {Promise<any>} - Strategy result
 */
async function applyCreateIfMissingStrategy(error, context) {
  // Check if error is "not found" or "does not exist"
  if (!error.message.toLowerCase().includes('not found') && 
      !error.message.toLowerCase().includes('does not exist') &&
      !error.message.toLowerCase().includes('no such file') &&
      error.code !== 'ENOENT') {
    throw error;
  }
  
  // Check if create function is provided
  if (!context.createFunction) {
    throw new Error('No create function provided');
  }
  
  // Create resource
  await context.createFunction(context.params);
  
  // Retry original function
  if (!context.originalFunction) {
    throw new Error('No original function provided');
  }
  
  return context.originalFunction(context.params);
}

/**
 * Apply empty result strategy
 * @param {Error} error - Original error
 * @param {Object} context - Operation context
 * @returns {Promise<any>} - Strategy result
 */
async function applyEmptyResultStrategy(error, context) {
  // Return empty result based on context
  if (context.emptyResult !== undefined) {
    return context.emptyResult;
  }
  
  // Default empty results by type
  if (context.resultType === 'array') {
    return [];
  } else if (context.resultType === 'object') {
    return {};
  } else if (context.resultType === 'string') {
    return '';
  } else if (context.resultType === 'number') {
    return 0;
  } else if (context.resultType === 'boolean') {
    return false;
  }
  
  // Default to null
  return null;
}

/**
 * Apply simplified processing strategy
 * @param {Error} error - Original error
 * @param {Object} context - Operation context
 * @returns {Promise<any>} - Strategy result
 */
async function applySimplifiedProcessingStrategy(error, context) {
  // Check if simplified processing function is provided
  if (!context.simplifiedProcessing) {
    throw new Error('No simplified processing function provided');
  }
  
  // Call simplified processing function
  return context.simplifiedProcessing(context.params, error);
}

/**
 * Apply skip processing strategy
 * @param {Error} error - Original error
 * @param {Object} context - Operation context
 * @returns {Promise<any>} - Strategy result
 */
async function applySkipProcessingStrategy(error, context) {
  // Check if skip result is provided
  if (context.skipResult !== undefined) {
    return context.skipResult;
  }
  
  // Default to input data
  return context.params;
}

/**
 * Get cached response
 * @param {string} cacheKey - Cache key
 * @returns {Promise<any>} - Cached response
 */
async function getCachedResponse(cacheKey) {
  try {
    // Try to import cacheUtils
    const cacheUtils = require('./cacheUtils');
    return await cacheUtils.getCachedResponse({ cacheKey });
  } catch (error) {
    console.error(`Error getting cached response: ${error.message}`);
    return null;
  }
}

/**
 * Increment failure counter for circuit breaker
 * @param {string} key - Circuit breaker key
 * @returns {number} - New failure count
 */
function incrementFailureCounter(key) {
  if (!config.circuitBreaker.enabled) {
    return 0;
  }
  
  const count = (failureCounters.get(key) || 0) + 1;
  failureCounters.set(key, count);
  
  return count;
}

/**
 * Reset failure counter for circuit breaker
 * @param {string} key - Circuit breaker key
 */
function resetFailureCounter(key) {
  if (!config.circuitBreaker.enabled) {
    return;
  }
  
  failureCounters.set(key, 0);
}

/**
 * Check circuit breaker and open if threshold reached
 * @param {string} key - Circuit breaker key
 */
function checkCircuitBreaker(key) {
  if (!config.circuitBreaker.enabled) {
    return;
  }
  
  const count = failureCounters.get(key) || 0;
  
  if (count >= config.circuitBreaker.failureThreshold) {
    openCircuit(key);
  }
}

/**
 * Open circuit breaker
 * @param {string} key - Circuit breaker key
 */
function openCircuit(key) {
  if (!config.circuitBreaker.enabled) {
    return;
  }
  
  circuitBreakers.set(key, {
    state: 'open',
    openedAt: Date.now(),
    callCount: 0
  });
  
  console.log(`Circuit breaker opened for ${key}`);
  
  // Schedule reset to half-open
  setTimeout(() => {
    if (getCircuitState(key) === 'open') {
      setCircuitHalfOpen(key);
    }
  }, config.circuitBreaker.resetTimeout);
}

/**
 * Set circuit breaker to half-open
 * @param {string} key - Circuit breaker key
 */
function setCircuitHalfOpen(key) {
  if (!config.circuitBreaker.enabled) {
    return;
  }
  
  circuitBreakers.set(key, {
    state: 'half-open',
    openedAt: Date.now(),
    callCount: 0
  });
  
  console.log(`Circuit breaker half-open for ${key}`);
}

/**
 * Close circuit breaker
 * @param {string} key - Circuit breaker key
 */
function closeCircuit(key) {
  if (!config.circuitBreaker.enabled) {
    return;
  }
  
  circuitBreakers.delete(key);
  failureCounters.set(key, 0);
  
  console.log(`Circuit breaker closed for ${key}`);
}

/**
 * Get circuit breaker state
 * @param {string} key - Circuit breaker key
 * @returns {string} - Circuit state ('open', 'half-open', 'closed')
 */
function getCircuitState(key) {
  if (!config.circuitBreaker.enabled) {
    return 'closed';
  }
  
  const circuit = circuitBreakers.get(key);
  
  if (!circuit) {
    return 'closed';
  }
  
  return circuit.state;
}

/**
 * Check if circuit breaker is open
 * @param {string} key - Circuit breaker key
 * @returns {boolean} - Whether circuit is open
 */
function isCircuitOpen(key) {
  if (!config.circuitBreaker.enabled) {
    return false;
  }
  
  const state = getCircuitState(key);
  
  if (state === 'open') {
    return true;
  }
  
  if (state === 'half-open') {
    const circuit = circuitBreakers.get(key);
    
    // Increment call count
    circuit.callCount++;
    
    // Allow a limited number of calls in half-open state
    return circuit.callCount > config.circuitBreaker.halfOpenMaxCalls;
  }
  
  return false;
}

/**
 * Get circuit breaker status
 * @returns {Object} - Circuit breaker status
 */
function getCircuitBreakerStatus() {
  if (!config.circuitBreaker.enabled) {
    return {
      enabled: false,
      circuits: []
    };
  }
  
  const circuits = [];
  
  for (const [key, circuit] of circuitBreakers.entries()) {
    circuits.push({
      key,
      state: circuit.state,
      openedAt: circuit.openedAt,
      openDuration: Date.now() - circuit.openedAt,
      callCount: circuit.callCount
    });
  }
  
  return {
    enabled: true,
    failureThreshold: config.circuitBreaker.failureThreshold,
    resetTimeout: config.circuitBreaker.resetTimeout,
    halfOpenMaxCalls: config.circuitBreaker.halfOpenMaxCalls,
    circuits
  };
}

// Initialize on module load
initialize().catch(console.error);

// Export functions
module.exports = {
  initialize,
  retryWithBackoff,
  applyAdaptivePrompting,
  applyFallbackStrategy,
  getCircuitBreakerStatus,
  isCircuitOpen,
  closeCircuit,
  openCircuit
};
