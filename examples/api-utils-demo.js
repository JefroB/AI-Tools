/**
 * API Utilities Demo
 * 
 * This example demonstrates how to use the API utilities to optimize API requests,
 * implement retry logic, and throttle API calls to stay within rate limits.
 */

const aiTools = require('../src/index');

// Sample API client for demonstration
const apiClient = {
  // Simulated API call that sometimes fails
  async fetchData(id) {
    console.log(`Fetching data for ID: ${id}`);
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Simulate random failures (30% chance)
    if (Math.random() < 0.3) {
      const error = new Error('API request failed');
      error.status = 429; // Too Many Requests
      throw error;
    }
    
    return { id, name: `Item ${id}`, value: Math.floor(Math.random() * 1000) };
  },
  
  // Simulated batch API call
  async fetchBatch(ids) {
    console.log(`Fetching batch data for IDs: ${ids.join(', ')}`);
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate random failures (20% chance)
    if (Math.random() < 0.2) {
      const error = new Error('Batch API request failed');
      error.status = 500; // Internal Server Error
      throw error;
    }
    
    return ids.map(id => ({ id, name: `Item ${id}`, value: Math.floor(Math.random() * 1000) }));
  }
};

/**
 * Example 1: Using retryWithBackoff
 * 
 * This example demonstrates how to use retryWithBackoff to handle transient API failures.
 */
async function retryExample() {
  console.log('\n=== Retry With Backoff Example ===');
  
  // Create a function that will be retried
  const fetchWithRetry = async (id) => {
    return aiTools.retryWithBackoff(
      () => apiClient.fetchData(id),
      {
        maxRetries: 3,
        initialDelay: 500,
        maxDelay: 5000,
        backoffFactor: 2,
        jitter: true,
        onRetry: ({ attempt, delay }) => {
          console.log(`Retry attempt ${attempt} after ${delay}ms delay`);
        }
      }
    );
  };
  
  try {
    // Try to fetch data with retry logic
    console.log('Fetching data with retry logic...');
    const result = await fetchWithRetry(42);
    console.log('Success:', result);
  } catch (error) {
    console.error('All retries failed:', error.message);
  }
}

/**
 * Example 2: Using batchRequests
 * 
 * This example demonstrates how to batch multiple API requests into a single request.
 */
async function batchExample() {
  console.log('\n=== Batch Requests Example ===');
  
  // Create an array of IDs to fetch
  const ids = Array.from({ length: 15 }, (_, i) => i + 1);
  
  // Create individual requests
  const requests = ids.map(id => ({ id }));
  
  try {
    // Process requests in batches
    console.log(`Processing ${requests.length} requests in batches...`);
    const results = await aiTools.batchRequests(
      requests,
      async (batch) => {
        // Extract IDs from the batch
        const batchIds = batch.map(req => req.id);
        
        // Make a batch request
        const batchResults = await apiClient.fetchBatch(batchIds);
        
        // Return the results
        return batchResults;
      },
      {
        maxBatchSize: 5,
        retryFailedItems: true,
        maxRetries: 2,
        onProgress: ({ completed, total, percentage }) => {
          console.log(`Progress: ${completed}/${total} (${percentage.toFixed(1)}%)`);
        }
      }
    );
    
    console.log(`Successfully processed ${results.length} items`);
    console.log('First few results:', results.slice(0, 3));
  } catch (error) {
    console.error('Batch processing failed:', error.message);
  }
}

/**
 * Example 3: Using throttleApiCalls
 * 
 * This example demonstrates how to throttle API calls to stay within rate limits.
 */
async function throttleExample() {
  console.log('\n=== Throttle API Calls Example ===');
  
  // Create a throttled version of the API call
  const throttledFetchData = aiTools.throttleApiCalls(
    apiClient.fetchData.bind(apiClient),
    {
      requestsPerSecond: 2, // Limit to 2 requests per second
      burstSize: 1,
      maxQueueSize: 20,
      onThrottled: ({ queueLength, waitTime }) => {
        console.log(`Request throttled. Queue length: ${queueLength}, wait time: ${waitTime}ms`);
      }
    }
  );
  
  try {
    // Make multiple API calls in quick succession
    console.log('Making multiple API calls in quick succession...');
    
    const ids = [101, 102, 103, 104, 105];
    const promises = ids.map(id => {
      // These will be automatically throttled
      return throttledFetchData(id)
        .then(result => {
          console.log(`Received result for ID ${id}:`, result.name);
          return result;
        })
        .catch(error => {
          console.error(`Error fetching ID ${id}:`, error.message);
          return null;
        });
    });
    
    // Wait for all requests to complete
    const results = await Promise.all(promises);
    console.log(`Completed ${results.filter(Boolean).length} of ${ids.length} requests`);
  } catch (error) {
    console.error('Throttle example failed:', error.message);
  }
}

/**
 * Example 4: Using debounce
 * 
 * This example demonstrates how to debounce function calls.
 */
async function debounceExample() {
  console.log('\n=== Debounce Example ===');
  
  // Create a debounced function
  const debouncedSearch = aiTools.debounce(
    (query) => {
      console.log(`Searching for: "${query}"`);
      return `Results for "${query}"`;
    },
    500, // Wait 500ms after the last call
    { leading: false, trailing: true }
  );
  
  // Simulate rapid user input
  console.log('Simulating rapid user input...');
  
  const queries = ['a', 'ap', 'app', 'appl', 'apple'];
  
  for (const query of queries) {
    console.log(`User typed: ${query}`);
    debouncedSearch(query);
    
    // Wait a short time before the next input
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Wait for the debounced function to execute
  await new Promise(resolve => setTimeout(resolve, 600));
  
  console.log('Debounce example completed');
}

/**
 * Example 5: Combining multiple techniques
 * 
 * This example demonstrates how to combine batching, retrying, and throttling.
 */
async function combinedExample() {
  console.log('\n=== Combined Example ===');
  
  // Create a throttled version of the batch API call
  const throttledFetchBatch = aiTools.throttleApiCalls(
    apiClient.fetchBatch.bind(apiClient),
    { requestsPerSecond: 1 }
  );
  
  // Create a retrying version of the throttled batch API call
  const retryingThrottledFetchBatch = async (ids) => {
    return aiTools.retryWithBackoff(
      () => throttledFetchBatch(ids),
      { maxRetries: 2 }
    );
  };
  
  // Create an array of IDs to fetch
  const ids = Array.from({ length: 25 }, (_, i) => i + 201);
  
  // Create individual requests
  const requests = ids.map(id => ({ id }));
  
  try {
    // Process requests in batches with throttling and retrying
    console.log(`Processing ${requests.length} requests with batching, throttling, and retrying...`);
    
    const results = await aiTools.batchRequests(
      requests,
      async (batch) => {
        // Extract IDs from the batch
        const batchIds = batch.map(req => req.id);
        
        // Make a batch request with retrying and throttling
        return retryingThrottledFetchBatch(batchIds);
      },
      { maxBatchSize: 5 }
    );
    
    console.log(`Successfully processed ${results.length} items`);
    console.log('First few results:', results.slice(0, 3));
  } catch (error) {
    console.error('Combined example failed:', error.message);
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    await retryExample();
    await batchExample();
    await throttleExample();
    await debounceExample();
    await combinedExample();
    
    console.log('\nAll examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the examples
runAllExamples();
