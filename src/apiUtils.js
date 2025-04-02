/**
 * API Utilities Module for AI Tools
 * Provides tools for optimizing API requests, reducing costs, and improving reliability
 */

const crypto = require('crypto');

/**
 * Default options for batch requests
 */
const DEFAULT_BATCH_OPTIONS = {
  maxBatchSize: 10,           // Maximum number of requests in a batch
  maxBatchDelay: 100,         // Maximum delay before processing a batch (ms)
  retryFailedItems: true,     // Whether to retry failed items individually
  maxRetries: 3,              // Maximum number of retries for failed batches
  retryDelay: 1000,           // Base delay between retries (ms)
  concurrentBatches: 1,       // Number of batches to process concurrently
  onProgress: null,           // Progress callback function
};

/**
 * Default options for retry with backoff
 */
const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 5,              // Maximum number of retry attempts
  initialDelay: 1000,         // Initial delay before first retry (ms)
  maxDelay: 30000,            // Maximum delay between retries (ms)
  backoffFactor: 2,           // Exponential backoff factor
  jitter: true,               // Whether to add jitter to delay
  retryableErrors: [          // HTTP status codes to retry
    408, 429, 500, 502, 503, 504
  ],
  retryableNetworkErrors: [   // Network error types to retry
    'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EPIPE', 'ENOTFOUND'
  ],
  onRetry: null,              // Callback function on retry
};

/**
 * Default options for throttling
 */
const DEFAULT_THROTTLE_OPTIONS = {
  requestsPerSecond: 10,      // Maximum requests per second
  burstSize: 1,               // Number of requests allowed in a burst
  maxQueueSize: 100,          // Maximum size of the request queue
  timeout: 30000,             // Request timeout (ms)
  onQueueFull: null,          // Callback when queue is full
  onThrottled: null,          // Callback when request is throttled
};

/**
 * Batches multiple API requests into a single request when possible
 * @param {Array} requests - Array of request objects
 * @param {Function} batchProcessor - Function to process batched requests
 * @param {Object} options - Batching options
 * @returns {Promise<Array>} - Results for each request
 */
async function batchRequests(requests, batchProcessor, options = {}) {
  // Merge options with defaults
  const batchOptions = { ...DEFAULT_BATCH_OPTIONS, ...options };
  
  // Validate inputs
  if (!Array.isArray(requests) || requests.length === 0) {
    throw new Error('Requests must be a non-empty array');
  }
  
  if (typeof batchProcessor !== 'function') {
    throw new Error('Batch processor must be a function');
  }
  
  // Initialize results array with same length as requests
  const results = new Array(requests.length).fill(null);
  
  // Create batches of requests
  const batches = [];
  let currentBatch = [];
  let currentBatchIndices = [];
  
  for (let i = 0; i < requests.length; i++) {
    currentBatch.push(requests[i]);
    currentBatchIndices.push(i);
    
    if (currentBatch.length >= batchOptions.maxBatchSize) {
      batches.push({ requests: currentBatch, indices: currentBatchIndices });
      currentBatch = [];
      currentBatchIndices = [];
    }
  }
  
  // Add the last batch if it's not empty
  if (currentBatch.length > 0) {
    batches.push({ requests: currentBatch, indices: currentBatchIndices });
  }
  
  // Process batches with concurrency control
  const processBatch = async (batch, retryCount = 0) => {
    try {
      // Process the batch
      const batchResults = await batchProcessor(batch.requests);
      
      // Validate batch results
      if (!Array.isArray(batchResults) || batchResults.length !== batch.requests.length) {
        throw new Error('Batch processor must return an array of results with the same length as the batch');
      }
      
      // Assign results to the correct positions
      for (let i = 0; i < batch.indices.length; i++) {
        results[batch.indices[i]] = batchResults[i];
      }
      
      // Call progress callback if provided
      if (typeof batchOptions.onProgress === 'function') {
        const completedCount = results.filter(r => r !== null).length;
        batchOptions.onProgress({
          completed: completedCount,
          total: requests.length,
          percentage: (completedCount / requests.length) * 100
        });
      }
      
      return true;
    } catch (error) {
      // Check if we should retry the batch
      if (retryCount < batchOptions.maxRetries) {
        // Calculate delay with exponential backoff
        const delay = batchOptions.retryDelay * Math.pow(2, retryCount);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the batch
        return processBatch(batch, retryCount + 1);
      }
      
      // If we've exhausted retries for the batch, try individual requests if enabled
      if (batchOptions.retryFailedItems && batch.requests.length > 1) {
        // Create individual batches for each request
        const individualBatches = batch.requests.map((req, i) => ({
          requests: [req],
          indices: [batch.indices[i]]
        }));
        
        // Process each individual request
        await Promise.all(individualBatches.map(b => processBatch(b)));
        return true;
      }
      
      // If we can't retry, propagate the error
      throw error;
    }
  };
  
  // Process batches with concurrency control
  if (batchOptions.concurrentBatches > 1) {
    // Process batches concurrently
    const batchPromises = [];
    for (let i = 0; i < batches.length; i += batchOptions.concurrentBatches) {
      const batchGroup = batches.slice(i, i + batchOptions.concurrentBatches);
      const groupPromises = batchGroup.map(batch => processBatch(batch));
      await Promise.all(groupPromises);
    }
  } else {
    // Process batches sequentially
    for (const batch of batches) {
      await processBatch(batch);
    }
  }
  
  return results;
}

/**
 * Implements exponential backoff and retry logic for API calls
 * @param {Function} apiCall - The API call function to execute
 * @param {Object} options - Retry options
 * @returns {Promise} - Result of the API call
 */
async function retryWithBackoff(apiCall, options = {}) {
  // Merge options with defaults
  const retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  
  // Validate input
  if (typeof apiCall !== 'function') {
    throw new Error('API call must be a function');
  }
  
  // Helper function to determine if an error is retryable
  const isRetryableError = (error) => {
    // Check for HTTP status codes
    if (error.status && retryOptions.retryableErrors.includes(error.status)) {
      return true;
    }
    
    // Check for response status
    if (error.response && error.response.status && 
        retryOptions.retryableErrors.includes(error.response.status)) {
      return true;
    }
    
    // Check for network errors
    if (error.code && retryOptions.retryableNetworkErrors.includes(error.code)) {
      return true;
    }
    
    // Check for timeout
    if (error.message && (
      error.message.includes('timeout') || 
      error.message.includes('timed out')
    )) {
      return true;
    }
    
    return false;
  };
  
  // Execute the API call with retries
  let lastError = null;
  
  for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
    try {
      // Execute the API call
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Check if we've exhausted retries or if the error is not retryable
      if (attempt >= retryOptions.maxRetries || !isRetryableError(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      let delay = retryOptions.initialDelay * Math.pow(retryOptions.backoffFactor, attempt);
      
      // Apply maximum delay
      delay = Math.min(delay, retryOptions.maxDelay);
      
      // Add jitter if enabled
      if (retryOptions.jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }
      
      // Call onRetry callback if provided
      if (typeof retryOptions.onRetry === 'function') {
        retryOptions.onRetry({
          error,
          attempt: attempt + 1,
          delay,
          willRetry: true
        });
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the throw in the loop,
  // but just in case, throw the last error
  throw lastError;
}

/**
 * Throttles API requests to stay within rate limits
 * @param {Function} apiCall - The API call function to execute
 * @param {Object} options - Throttling options
 * @returns {Function} - Throttled API call function
 */
function throttleApiCalls(apiCall, options = {}) {
  // Merge options with defaults
  const throttleOptions = { ...DEFAULT_THROTTLE_OPTIONS, ...options };
  
  // Validate input
  if (typeof apiCall !== 'function') {
    throw new Error('API call must be a function');
  }
  
  // Initialize throttling state
  const state = {
    queue: [],
    processing: false,
    lastRequestTime: 0,
    tokenBucket: throttleOptions.burstSize,
    lastTokenRefill: Date.now()
  };
  
  // Calculate time between tokens (in ms)
  const timeBetweenTokens = 1000 / throttleOptions.requestsPerSecond;
  
  // Process the queue
  const processQueue = async () => {
    if (state.processing || state.queue.length === 0) {
      return;
    }
    
    state.processing = true;
    
    try {
      while (state.queue.length > 0) {
        // Refill token bucket based on time elapsed
        const now = Date.now();
        const timeElapsed = now - state.lastTokenRefill;
        const tokensToAdd = Math.floor(timeElapsed / timeBetweenTokens);
        
        if (tokensToAdd > 0) {
          state.tokenBucket = Math.min(
            throttleOptions.burstSize,
            state.tokenBucket + tokensToAdd
          );
          state.lastTokenRefill = now - (timeElapsed % timeBetweenTokens);
        }
        
        // Check if we have tokens available
        if (state.tokenBucket < 1) {
          // Calculate time until next token
          const waitTime = timeBetweenTokens - (now - state.lastTokenRefill);
          
          // Call onThrottled callback if provided
          if (typeof throttleOptions.onThrottled === 'function') {
            throttleOptions.onThrottled({
              queueLength: state.queue.length,
              waitTime
            });
          }
          
          // Wait until next token is available
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // Take a token
        state.tokenBucket--;
        
        // Get the next request from the queue
        const { args, resolve: requestResolve, reject: requestReject } = state.queue.shift();
        
        // Execute the request with timeout
        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out')), throttleOptions.timeout);
          });
          
          const result = await Promise.race([
            apiCall(...args),
            timeoutPromise
          ]);
          
          requestResolve(result);
        } catch (error) {
          requestReject(error);
        }
        
        // Update last request time
        state.lastRequestTime = Date.now();
      }
    } finally {
      state.processing = false;
    }
  };
  
  // Return throttled function
  return function throttled(...args) {
    return new Promise((resolve, reject) => {
      // Check if queue is full
      if (state.queue.length >= throttleOptions.maxQueueSize) {
        // Call onQueueFull callback if provided
        if (typeof throttleOptions.onQueueFull === 'function') {
          throttleOptions.onQueueFull({
            queueLength: state.queue.length,
            maxQueueSize: throttleOptions.maxQueueSize
          });
        }
        
        reject(new Error('Request queue is full'));
        return;
      }
      
      // Add request to queue
      state.queue.push({ args, resolve, reject });
      
      // Start processing queue
      processQueue();
    });
  };
}

/**
 * Generates a cache key for API requests
 * @param {Object} request - Request object
 * @returns {string} - Cache key
 */
function generateApiCacheKey(request) {
  // Create a normalized object for hashing
  const normalizedRequest = {
    url: request.url || '',
    method: (request.method || 'GET').toUpperCase(),
    headers: request.headers || {},
    params: request.params || {},
    data: request.data || {}
  };
  
  // Generate hash
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(normalizedRequest))
    .digest('hex');
}

/**
 * Creates a debounced version of a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {Object} options - Debounce options
 * @returns {Function} - Debounced function
 */
function debounce(func, wait, options = {}) {
  let timeout;
  let result;
  let lastArgs;
  let lastThis;
  let lastCallTime;
  let lastInvokeTime = 0;
  const maxWait = options.maxWait;
  const leading = !!options.leading;
  const trailing = 'trailing' in options ? !!options.trailing : true;
  
  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;
    
    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }
  
  function leadingEdge(time) {
    lastInvokeTime = time;
    timeout = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }
  
  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;
    
    return maxWait === undefined
      ? timeWaiting
      : Math.min(timeWaiting, maxWait - timeSinceLastInvoke);
  }
  
  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxWait !== undefined && timeSinceLastInvoke >= maxWait));
  }
  
  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    
    timeout = setTimeout(timerExpired, remainingWait(time));
  }
  
  function trailingEdge(time) {
    timeout = undefined;
    
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    
    lastArgs = lastThis = undefined;
    return result;
  }
  
  function cancel() {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timeout = undefined;
  }
  
  function flush() {
    return timeout === undefined ? result : trailingEdge(Date.now());
  }
  
  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;
    
    if (isInvoking) {
      if (timeout === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timeout = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timeout === undefined) {
      timeout = setTimeout(timerExpired, wait);
    }
    return result;
  }
  
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

module.exports = {
  batchRequests,
  retryWithBackoff,
  throttleApiCalls,
  generateApiCacheKey,
  debounce
};
