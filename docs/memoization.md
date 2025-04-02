# Memoization Utilities

The memoization utilities in AI-Tools provide a powerful way to optimize performance by caching function results. This can significantly reduce computational costs, API calls, and development time.

## Overview

Memoization is a technique that stores the results of expensive function calls and returns the cached result when the same inputs occur again. This is particularly useful for:

- Computationally expensive functions
- API calls that return the same data for the same inputs
- Functions that are called repeatedly with the same arguments
- Reducing token usage and costs when working with AI APIs

## Features

- **Simple API**: Easy-to-use functions for memoizing both synchronous and asynchronous functions
- **Flexible Caching**: Configure TTL (time-to-live), cache size, and more
- **Smart Key Generation**: Automatically generates cache keys based on function arguments
- **Metrics Tracking**: Monitor cache hits, misses, and performance improvements
- **Persistent Cache Option**: Optionally store cached results to disk for persistence across runs
- **Class Method Support**: Easily memoize class methods

## Usage

### Basic Memoization

```javascript
const { memoize } = require('ai-tools');

// A computationally expensive function
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Create a memoized version
const memoizedFibonacci = memoize(fibonacci);

// First call (computes the result)
console.log(memoizedFibonacci(10)); // Slow

// Second call (returns cached result)
console.log(memoizedFibonacci(10)); // Fast
```

### Async Memoization

```javascript
const { memoizeAsync } = require('ai-tools');

// An async function that makes an API call
async function fetchUserData(userId) {
  const response = await fetch(`https://api.example.com/users/${userId}`);
  return response.json();
}

// Create a memoized version with a 1-hour TTL
const memoizedFetchUserData = memoizeAsync(fetchUserData, {
  ttl: 60 * 60 * 1000 // 1 hour in milliseconds
});

// Usage
async function getUserInfo(userId) {
  // This will only make the API call once per userId per hour
  const userData = await memoizedFetchUserData(userId);
  return userData;
}
```

### Class Method Memoization

```javascript
const { memoize, memoizeAsync } = require('ai-tools');

class DataProcessor {
  constructor(multiplier) {
    this.multiplier = multiplier;
  }
  
  processData(data) {
    // Expensive computation...
    return result * this.multiplier;
  }
  
  async fetchAndProcess(id) {
    // API call and processing...
  }
}

// Apply memoization to class methods
DataProcessor.prototype.processData = memoize(DataProcessor.prototype.processData);
DataProcessor.prototype.fetchAndProcess = memoizeAsync(DataProcessor.prototype.fetchAndProcess);

// Usage
const processor = new DataProcessor(2);
processor.processData({ x: 1, y: 2 }); // Slow (first call)
processor.processData({ x: 1, y: 2 }); // Fast (cached)
```

## Configuration Options

The memoization functions accept an options object with the following properties:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxSize` | Number | 1000 | Maximum number of cached results |
| `ttl` | Number | 24 * 60 * 60 * 1000 (24h) | Time-to-live in milliseconds |
| `persistent` | Boolean | false | Whether to use persistent cache |
| `keyGenerator` | Function | null | Custom function to generate cache keys |
| `ignoreErrors` | Boolean | false | Whether to cache errors |
| `trackMetrics` | Boolean | true | Whether to track metrics |
| `contextSensitive` | Boolean | false | Whether the function depends on external context |
| `deepEquality` | Boolean | false | Whether to use deep equality for arguments |

Example with custom options:

```javascript
const memoizedFn = memoize(expensiveFunction, {
  maxSize: 500,
  ttl: 5 * 60 * 1000, // 5 minutes
  deepEquality: true,
  keyGenerator: (...args) => args.map(arg => arg.id).join('-')
});
```

## Cache Management

### Clearing the Cache

```javascript
const { clearMemoCache } = require('ai-tools');

// Clear entire cache
clearMemoCache();

// Clear cache for a specific function
clearMemoCache({ fn: myFunction });

// Clear cache entries matching a pattern
clearMemoCache({ keyPattern: /user-\d+/ });

// Clear entries older than a timestamp
clearMemoCache({ olderThan: Date.now() - 3600000 }); // Older than 1 hour
```

### Getting Cache Statistics

```javascript
const { getMemoStats } = require('ai-tools');

const stats = getMemoStats();
console.log(stats);
// {
//   cacheSize: 42,
//   hits: 120,
//   misses: 30,
//   stores: 50,
//   evictions: 8,
//   hitRate: 0.8
// }
```

## Performance Considerations

- **Memory Usage**: Each cached result consumes memory. Use the `maxSize` option to limit memory usage.
- **TTL**: Set appropriate TTL values based on how frequently your data changes.
- **Complex Arguments**: For functions with complex object arguments, consider using `deepEquality: true` or a custom `keyGenerator`.
- **Context Sensitivity**: Be careful when memoizing methods that depend on instance properties.

## Integration with AI APIs

When working with AI APIs like OpenAI or Anthropic, memoization can significantly reduce costs by caching responses:

```javascript
const { memoizeAsync } = require('ai-tools');
const { Anthropic } = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Memoize the message creation function
const memoizedMessage = memoizeAsync(
  (prompt) => anthropic.messages.create({
    model: "claude-3-opus-20240229",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }]
  }),
  {
    ttl: 7 * 24 * 60 * 60 * 1000, // 1 week
    persistent: true, // Store to disk
    deepEquality: true
  }
);

// Usage
async function getAIResponse(prompt) {
  const response = await memoizedMessage(prompt);
  return response.content;
}
```

## Examples

See the [memoize-demo.js](../examples/memoize-demo.js) file for complete examples of how to use the memoization utilities.
