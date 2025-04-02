/**
 * Memoization Demo
 * 
 * This example demonstrates how to use the memoization utilities
 * to improve performance by caching function results.
 */

const { 
  memoize, 
  memoizeAsync, 
  memoizeMethod,
  clearMemoCache, 
  getMemoStats 
} = require('../src/memoizeUtils');

// ===== Example 1: Basic Memoization =====

// A computationally expensive function (simulated)
function fibonacci(n) {
  console.log(`Computing fibonacci(${n})...`);
  
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Create a memoized version
const memoizedFibonacci = memoize(fibonacci);

console.log('===== Example 1: Basic Memoization =====');
console.log('First call (not cached):');
console.time('First call');
console.log(`Result: ${memoizedFibonacci(10)}`);
console.timeEnd('First call');

console.log('\nSecond call (cached):');
console.time('Second call');
console.log(`Result: ${memoizedFibonacci(10)}`);
console.timeEnd('Second call');

console.log('\nDifferent argument (not cached):');
console.time('Different argument');
console.log(`Result: ${memoizedFibonacci(11)}`);
console.timeEnd('Different argument');

console.log('\nStats after basic usage:');
console.log(getMemoStats());

// ===== Example 2: Async Memoization =====

// An async function that makes an API call (simulated)
async function fetchUserData(userId) {
  console.log(`Fetching data for user ${userId}...`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock data
  return {
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
    lastUpdated: new Date().toISOString()
  };
}

// Create a memoized version with a short TTL
const memoizedFetchUserData = memoizeAsync(fetchUserData, {
  ttl: 5000 // 5 seconds
});

console.log('\n\n===== Example 2: Async Memoization =====');

// Function to demonstrate async memoization
async function demonstrateAsyncMemoization() {
  console.log('First call (not cached):');
  console.time('First async call');
  const user1 = await memoizedFetchUserData(42);
  console.log(user1);
  console.timeEnd('First async call');
  
  console.log('\nSecond call (cached):');
  console.time('Second async call');
  const user2 = await memoizedFetchUserData(42);
  console.log(user2);
  console.timeEnd('Second async call');
  
  console.log('\nDifferent user (not cached):');
  console.time('Different user');
  const user3 = await memoizedFetchUserData(43);
  console.log(user3);
  console.timeEnd('Different user');
  
  console.log('\nWaiting for cache to expire (5 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 5100));
  
  console.log('\nAfter expiration (not cached):');
  console.time('After expiration');
  const user4 = await memoizedFetchUserData(42);
  console.log(user4);
  console.timeEnd('After expiration');
  
  console.log('\nStats after async usage:');
  console.log(getMemoStats());
}

// ===== Example 3: Class Method Memoization =====

// A class with methods that can be memoized
class DataProcessor {
  constructor(multiplier) {
    this.multiplier = multiplier;
  }
  
  // Regular method (will be memoized using decorator)
  processData(data) {
    console.log(`Processing data ${JSON.stringify(data)}...`);
    
    // Simulate expensive computation
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.random();
    }
    
    return {
      originalData: data,
      result: result * this.multiplier,
      timestamp: new Date().toISOString()
    };
  }
  
  // Async method (will be memoized using decorator)
  async fetchAndProcess(id) {
    console.log(`Fetching and processing id ${id}...`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const data = { id, value: Math.random() * 100 };
    return this.processData(data);
  }
}

// Apply memoization to class methods
DataProcessor.prototype.processData = memoize(DataProcessor.prototype.processData);
DataProcessor.prototype.fetchAndProcess = memoizeAsync(DataProcessor.prototype.fetchAndProcess);

console.log('\n\n===== Example 3: Class Method Memoization =====');

// Function to demonstrate class method memoization
async function demonstrateClassMemoization() {
  const processor = new DataProcessor(2);
  const processor2 = new DataProcessor(3); // Different instance
  
  console.log('First instance, first call:');
  console.time('First instance');
  console.log(processor.processData({ x: 1, y: 2 }));
  console.timeEnd('First instance');
  
  console.log('\nFirst instance, same data (cached):');
  console.time('First instance cached');
  console.log(processor.processData({ x: 1, y: 2 }));
  console.timeEnd('First instance cached');
  
  console.log('\nSecond instance, same data (different context):');
  console.time('Second instance');
  console.log(processor2.processData({ x: 1, y: 2 }));
  console.timeEnd('Second instance');
  
  console.log('\nAsync method, first call:');
  console.time('Async method');
  console.log(await processor.fetchAndProcess(123));
  console.timeEnd('Async method');
  
  console.log('\nAsync method, same id (cached):');
  console.time('Async method cached');
  console.log(await processor.fetchAndProcess(123));
  console.timeEnd('Async method cached');
  
  console.log('\nStats after class method usage:');
  console.log(getMemoStats());
}

// ===== Example 4: Advanced Options =====

// Function with complex arguments
function processComplexData(options) {
  console.log(`Processing complex data with options: ${JSON.stringify(options)}`);
  
  // Simulate expensive computation
  let result = 0;
  for (let i = 0; i < 500000; i++) {
    result += Math.random();
  }
  
  return {
    options,
    result,
    timestamp: new Date().toISOString()
  };
}

// Create memoized version with deep equality checking
const memoizedProcessComplex = memoize(processComplexData, {
  deepEquality: true,
  maxSize: 5 // Small cache size to demonstrate eviction
});

console.log('\n\n===== Example 4: Advanced Options =====');

// Function to demonstrate advanced options
function demonstrateAdvancedOptions() {
  console.log('First call with complex object:');
  console.time('Complex first');
  console.log(memoizedProcessComplex({ filter: 'name', sort: 'asc', page: 1 }));
  console.timeEnd('Complex first');
  
  console.log('\nSecond call with same object structure (cached):');
  console.time('Complex cached');
  console.log(memoizedProcessComplex({ filter: 'name', sort: 'asc', page: 1 }));
  console.timeEnd('Complex cached');
  
  console.log('\nCall with different object order (still cached with deepEquality):');
  console.time('Different order');
  console.log(memoizedProcessComplex({ sort: 'asc', page: 1, filter: 'name' }));
  console.timeEnd('Different order');
  
  // Fill cache to demonstrate eviction
  console.log('\nFilling cache to demonstrate eviction...');
  for (let i = 0; i < 10; i++) {
    memoizedProcessComplex({ id: i, data: `test${i}` });
  }
  
  console.log('\nStats after filling cache (should show evictions):');
  console.log(getMemoStats());
  
  // Clear cache for specific function
  console.log('\nClearing cache for processComplexData function:');
  const clearResult = clearMemoCache({ fn: processComplexData });
  console.log(clearResult);
  
  console.log('\nStats after clearing:');
  console.log(getMemoStats());
}

// Run all examples
(async () => {
  try {
    await demonstrateAsyncMemoization();
    await demonstrateClassMemoization();
    demonstrateAdvancedOptions();
    
    console.log('\n\nAll examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
})();
