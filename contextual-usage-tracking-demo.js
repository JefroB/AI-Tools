/**
 * Contextual Usage Tracking Demo
 * 
 * This script demonstrates how to use the new contextual usage tracking system
 * to improve error handling, debugging, and reliability of AI-Tools operations.
 */

const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import AI-Tools modules
const toolUsageTracker = require('./src/toolUsageTracker');
const contextCollector = require('./src/contextCollector');
const smartRecovery = require('./src/smartRecovery');
const cacheUtils = require('./src/cacheUtils');

// Demo configuration
const CONFIG = {
  demoFiles: {
    directory: path.resolve('demo-output'),
    validFile: 'valid-data.json',
    invalidFile: 'invalid-data.json',
    missingFile: 'missing-data.json'
  },
  api: {
    baseUrl: 'https://jsonplaceholder.typicode.com',
    endpoints: {
      posts: '/posts',
      users: '/users',
      nonexistent: '/nonexistent'
    }
  }
};

/**
 * Initialize the demo
 */
async function initializeDemo() {
  console.log('=== Contextual Usage Tracking Demo ===\n');
  
  // Create demo directory if it doesn't exist
  await fs.ensureDir(CONFIG.demoFiles.directory);
  
  // Create valid demo file
  await fs.writeJson(
    path.join(CONFIG.demoFiles.directory, CONFIG.demoFiles.validFile),
    { 
      id: 1, 
      name: 'Demo Data', 
      timestamp: Date.now(),
      valid: true
    },
    { spaces: 2 }
  );
  
  // Create invalid demo file (malformed JSON)
  await fs.writeFile(
    path.join(CONFIG.demoFiles.directory, CONFIG.demoFiles.invalidFile),
    '{ "id": 1, "name": "Invalid Data", "timestamp": ' + Date.now() + ', invalid JSON'
  );
  
  // Delete missing file if it exists
  const missingFilePath = path.join(CONFIG.demoFiles.directory, CONFIG.demoFiles.missingFile);
  if (await fs.pathExists(missingFilePath)) {
    await fs.remove(missingFilePath);
  }
  
  console.log('Demo initialized successfully!\n');
}

/**
 * Demo 1: Basic Error Handling with Context Collection
 */
async function demoBasicErrorHandling() {
  console.log('Demo 1: Basic Error Handling with Context Collection');
  console.log('--------------------------------------------------');
  
  // Start a context session
  const sessionId = contextCollector.startSession({
    scriptName: 'contextual-usage-tracking-demo.js',
  });
  
  console.log(`Started context session: ${sessionId}`);
  
  try {
    // Add an event to the session
    contextCollector.addEvent(sessionId, {
      type: 'demo_start',
      demo: 'basicErrorHandling',
      timestamp: Date.now()
    });
    
    console.log('Reading missing file...');
    
    // Try to read a file that doesn't exist
    const missingFilePath = path.join(CONFIG.demoFiles.directory, CONFIG.demoFiles.missingFile);
    const data = await fs.readJson(missingFilePath);
    
    // This code will not be reached
    console.log('File data:', data);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    
    // Handle the error with context collection
    const contextId = await contextCollector.handleError(error, {
      toolName: 'fs.readJson',
      category: 'file',
      args: [path.join(CONFIG.demoFiles.directory, CONFIG.demoFiles.missingFile)]
    });
    
    console.log(`Error context captured with ID: ${contextId}`);
    
    // Get the session data
    const sessionData = await contextCollector.getSession(sessionId);
    console.log(`Session contains ${sessionData.events.length} events and captured error details`);
  }
  
  console.log('Demo 1 completed!\n');
}

/**
 * Demo 2: Retry with Backoff
 */
async function demoRetryWithBackoff() {
  console.log('Demo 2: Retry with Backoff');
  console.log('-------------------------');
  
  // Start a context session
  const sessionId = contextCollector.startSession({
    scriptName: 'contextual-usage-tracking-demo.js',
  });
  
  console.log(`Started context session: ${sessionId}`);
  
  // Function that simulates an API call with potential failures
  let attemptCount = 0;
  
  async function simulatedApiCall() {
    attemptCount++;
    
    // Simulate success after 2 attempts
    if (attemptCount <= 2) {
      const error = new Error('API temporarily unavailable');
      error.code = 'ETIMEDOUT';
      throw error;
    }
    
    return {
      id: uuidv4(),
      data: 'API response data',
      timestamp: Date.now()
    };
  }
  
  try {
    console.log('Making API call with retry...');
    
    // Use retry with backoff
    const result = await smartRecovery.retryWithBackoff(
      simulatedApiCall,
      {
        maxRetries: 3,
        initialDelay: 100, // 100ms for demo purposes
        context: { sessionId }
      }
    );
    
    console.log(`API call succeeded after ${attemptCount} attempts!`);
    console.log(`Result: ${JSON.stringify(result, null, 2)}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  
  console.log('Demo 2 completed!\n');
}

/**
 * Demo 3: Fallback Strategies
 */
async function demoFallbackStrategies() {
  console.log('Demo 3: Fallback Strategies');
  console.log('--------------------------');
  
  // Start a context session
  const sessionId = contextCollector.startSession({
    scriptName: 'contextual-usage-tracking-demo.js',
  });
  
  console.log(`Started context session: ${sessionId}`);
  
  // Function that simulates a primary data source
  async function getPrimaryData() {
    console.log('Attempting to get data from primary source...');
    const error = new Error('Primary data source unavailable');
    error.code = 'PRIMARY_UNAVAILABLE';
    throw error;
  }
  
  // Function that simulates a secondary data source
  async function getSecondaryData() {
    console.log('Getting data from secondary source...');
    return {
      id: uuidv4(),
      source: 'secondary',
      data: 'Secondary data source response',
      timestamp: Date.now()
    };
  }
  
  try {
    // Try to get data from primary source
    const data = await getPrimaryData();
    console.log('Primary data:', data);
  } catch (error) {
    console.log(`Primary source error: ${error.message}`);
    
    try {
      // Capture context and apply fallback strategy
      const contextId = await contextCollector.handleError(error, {
        toolName: 'getPrimaryData',
        category: 'api',
        args: {}
      });
      
      console.log(`Error context captured with ID: ${contextId}`);
      
      // Apply fallback strategy
      const result = await smartRecovery.applyFallbackStrategy(error, 'api', {
        sessionId: contextId,
        alternativeApi: getSecondaryData,
        params: {},
        defaultResponse: { source: 'default', data: 'Default response' }
      });
      
      console.log('Fallback succeeded!');
      console.log(`Result: ${JSON.stringify(result, null, 2)}`);
    } catch (fallbackError) {
      console.log(`Fallback error: ${fallbackError.message}`);
    }
  }
  
  console.log('Demo 3 completed!\n');
}

/**
 * Demo 4: Circuit Breaker Pattern
 */
async function demoCircuitBreaker() {
  console.log('Demo 4: Circuit Breaker Pattern');
  console.log('------------------------------');
  
  // Function that simulates a failing service
  async function callFailingService(id) {
    console.log(`Calling failing service (ID: ${id})...`);
    const error = new Error('Service unavailable');
    error.code = 'SERVICE_UNAVAILABLE';
    throw error;
  }
  
  // Circuit breaker key
  const circuitKey = 'demo-failing-service';
  
  // Make multiple calls to trigger circuit breaker
  for (let i = 1; i <= 7; i++) {
    try {
      // Check if circuit is open
      if (smartRecovery.isCircuitOpen(circuitKey)) {
        console.log(`Circuit is open for ${circuitKey}, skipping call ${i}`);
        continue;
      }
      
      // Call the failing service
      await callFailingService(i);
    } catch (error) {
      console.log(`Call ${i} failed: ${error.message}`);
      
      // Increment failure counter and check circuit breaker
      // (This is normally handled by retryWithBackoff, but we're doing it manually for demo purposes)
      if (i >= 5) {
        // After 5 failures, manually open the circuit
        smartRecovery.openCircuit(circuitKey);
        console.log(`Circuit opened for ${circuitKey} after ${i} failures`);
      }
    }
  }
  
  // Get circuit breaker status
  const status = smartRecovery.getCircuitBreakerStatus();
  console.log('Circuit Breaker Status:', JSON.stringify(status, null, 2));
  
  // Close the circuit for cleanup
  smartRecovery.closeCircuit(circuitKey);
  console.log(`Circuit closed for ${circuitKey}`);
  
  console.log('Demo 4 completed!\n');
}

/**
 * Demo 5: Adaptive Prompting
 */
async function demoAdaptivePrompting() {
  console.log('Demo 5: Adaptive Prompting');
  console.log('------------------------');
  
  // Original prompt
  const originalPrompt = `
Please analyze the following code and provide detailed feedback:

\`\`\`javascript
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}

function applyDiscount(total, discountCode) {
  if (discountCode === 'SAVE10') {
    return total * 0.9;
  } else if (discountCode === 'SAVE20') {
    return total * 0.8;
  }
  return total;
}
\`\`\`

Please provide:
1. A detailed code review
2. Suggestions for improvement
3. Potential bugs or edge cases
4. Performance considerations
5. Best practices that should be applied
`;
  
  // Simulate different error types
  const errors = [
    { type: 'context_length_exceeded', message: 'Context length exceeded' },
    { type: 'model_overloaded', message: 'Model is currently overloaded' },
    { type: 'invalid_request_error', message: 'Invalid request' }
  ];
  
  for (const errorInfo of errors) {
    console.log(`\nSimulating error: ${errorInfo.type}`);
    
    // Create error object
    const error = new Error(errorInfo.message);
    error.code = errorInfo.type;
    
    // Apply adaptive prompting
    const adaptedPrompt = smartRecovery.applyAdaptivePrompting(originalPrompt, error);
    
    // Calculate reduction percentage
    const reductionPercent = ((originalPrompt.length - adaptedPrompt.length) / originalPrompt.length * 100).toFixed(2);
    
    console.log(`Original prompt length: ${originalPrompt.length} characters`);
    console.log(`Adapted prompt length: ${adaptedPrompt.length} characters`);
    console.log(`Reduction: ${reductionPercent}%`);
    console.log(`Adaptation strategy: ${errorInfo.type}`);
  }
  
  console.log('\nDemo 5 completed!\n');
}

/**
 * Run all demos
 */
async function runAllDemos() {
  try {
    // Initialize the demo
    await initializeDemo();
    
    // Run demos
    await demoBasicErrorHandling();
    await demoRetryWithBackoff();
    await demoFallbackStrategies();
    await demoCircuitBreaker();
    await demoAdaptivePrompting();
    
    console.log('=== All Demos Completed Successfully ===');
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Run the demos
runAllDemos();
