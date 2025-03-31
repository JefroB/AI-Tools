/**
 * AI Tools - Advanced Usage Examples
 * Demonstrates the new features for error reduction and cost efficiency
 */

const path = require('path');
const fs = require('fs-extra');
const aiTools = require('../src/index');

// Create a test directory for our examples
const TEST_DIR = path.join(__dirname, '..', 'test-advanced-output');
fs.ensureDirSync(TEST_DIR);

// Create a sample file for testing
const EXAMPLE_FILE = path.join(TEST_DIR, 'example.js');
const EXAMPLE_CONTENT = `/**
 * Example JavaScript file
 * Contains some functions and classes for testing
 */

// Import some modules
import { useState } from 'react';
import axios from 'axios';

// Define a simple function
function calculateTotal(items) {
  return items.reduce((total, item) => total + item.price, 0);
}

// Format price with currency
function formatPrice(price, currency = 'USD') {
  return \`\${currency} \${price.toFixed(2)}\`;
}

// User class
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
    this.createdAt = new Date();
  }
  
  getDisplayName() {
    return this.name || this.email.split('@')[0];
  }
  
  toJSON() {
    return {
      name: this.name,
      email: this.email,
      createdAt: this.createdAt
    };
  }
}

// Export everything
export { calculateTotal, formatPrice, User };
`;

fs.writeFileSync(EXAMPLE_FILE, EXAMPLE_CONTENT);

// Helper function to run examples and log results
async function runExample(name, fn) {
  console.log(`\n=== Running Example: ${name} ===`);
  try {
    const result = await fn();
    if (result !== undefined) {
      console.log('Result:', typeof result === 'object' ? JSON.stringify(result, null, 2) : result);
    }
    console.log(`✅ ${name} completed successfully`);
  } catch (error) {
    console.error(`❌ ${name} failed:`, error.message);
  }
}

// Run all examples
async function runAllExamples() {
  // 1. Context-Aware Reading & Summarization Examples
  await runExample('Read File Chunk', async () => {
    const chunk = await aiTools.readFileChunk(EXAMPLE_FILE, 10, 15);
    console.log('File chunk (lines 10-15):');
    console.log(chunk);
  });
  
  await runExample('Read File Section', async () => {
    const section = await aiTools.readFileSection(EXAMPLE_FILE, 'function calculateTotal', 'function formatPrice');
    console.log('File section between "function calculateTotal" and "function formatPrice":');
    console.log(section);
  });
  
  await runExample('Get File Structure', async () => {
    const structure = await aiTools.getFileStructure(TEST_DIR, {
      ignorePatterns: ['node_modules/**', '.git/**'],
      respectGitignore: true
    });
    console.log('File structure:');
    console.log(structure);
  });
  
  await runExample('Summarize File', async () => {
    const summary = await aiTools.summarizeFile(EXAMPLE_FILE);
    console.log('File summary:');
    console.log(summary);
  });
  
  await runExample('Summarize Directory', async () => {
    const summary = await aiTools.summarizeDirectory(TEST_DIR);
    console.log('Directory summary:');
    console.log(summary);
  });
  
  // 2. Code-Specific Operations Examples
  await runExample('Find Function', async () => {
    const func = await aiTools.findFunction(EXAMPLE_FILE, 'calculateTotal');
    console.log('Found function:');
    console.log(func);
  });
  
  await runExample('Find Class', async () => {
    const cls = await aiTools.findClass(EXAMPLE_FILE, 'User');
    console.log('Found class:');
    console.log(cls);
  });
  
  await runExample('Replace Code Block', async () => {
    const newImplementation = `// Format price with currency and symbol
function formatPrice(price, currency = 'USD') {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥'
  };
  const symbol = symbols[currency] || '';
  return \`\${symbol}\${price.toFixed(2)} \${currency}\`;
}`;
    
    await aiTools.replaceCodeBlock(EXAMPLE_FILE, 'function formatPrice', newImplementation);
    console.log('Code block replaced');
    
    // Verify the replacement
    const content = await aiTools.readFile(EXAMPLE_FILE);
    console.log('Updated file content:');
    console.log(content);
  });
  
  await runExample('Add Import', async () => {
    await aiTools.addImport(EXAMPLE_FILE, "import { useEffect } from 'react';");
    console.log('Import added');
    
    // Verify the addition
    const content = await aiTools.readFile(EXAMPLE_FILE);
    console.log('Updated file with new import:');
    console.log(content);
  });
  
  // 3. Schema Validation Examples
  await runExample('Generate Schema', () => {
    const sampleData = {
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        preferences: {
          theme: 'dark',
          notifications: true
        }
      },
      items: [
        { id: 1, name: 'Item 1', price: 10.99 },
        { id: 2, name: 'Item 2', price: 24.99 }
      ],
      total: 35.98
    };
    
    const schema = aiTools.generateSchema(sampleData, {
      id: 'order',
      title: 'Order Schema',
      description: 'Schema for order data',
      required: {
        'user.name': true,
        'user.email': true,
        'items': true
      },
      critical: {
        'user.email': true,
        'total': true
      }
    });
    
    console.log('Generated schema:');
    return schema;
  });
  
  await runExample('Validate With Warnings', async () => {
    // Create sample data with some issues
    const data = {
      user: {
        name: 'Jane Doe',
        // Missing email (critical)
        age: 'twenty-five' // Wrong type (warning)
      },
      items: [
        { id: 1, name: 'Item 1', price: 10.99 },
        { id: 2, name: 'Item 2', price: 24.99 }
      ],
      total: 35.98
    };
    
    // Create a schema
    const schema = aiTools.generateSchema(data, {
      id: 'order-validation',
      required: {
        'user.email': true
      },
      critical: {
        'user.email': true
      }
    });
    
    // Validate the data
    const result = await aiTools.validateWithWarnings(data, schema);
    console.log('Validation result:');
    return result;
  });
  
  // 4. Token Optimization Examples
  await runExample('Count Tokens', () => {
    const text = 'This is a sample text that will be used to estimate token count.';
    const tokenCount = aiTools.countTokens(text, 'claude-3-opus');
    console.log(`Text: "${text}"`);
    console.log(`Estimated token count: ${tokenCount}`);
  });
  
  await runExample('Truncate To Token Limit', () => {
    const longText = 'This is a very long text that needs to be truncated to fit within a specific token limit. ' +
      'We want to preserve the beginning and end of the text, but remove some content from the middle. ' +
      'This is important for maintaining context while reducing token usage. ' +
      'The beginning of the text often contains important context and instructions. ' +
      'The end of the text often contains the most recent and relevant information. ' +
      'By truncating the middle, we can reduce tokens while preserving the most important parts.';
    
    const truncated = aiTools.truncateToTokenLimit(longText, 20, {
      model: 'claude-3-opus',
      preserveStart: true,
      preserveEnd: true,
      startRatio: 0.7
    });
    
    console.log('Original text:');
    console.log(longText);
    console.log(`Original token count: ${aiTools.countTokens(longText)}`);
    console.log('\nTruncated text:');
    console.log(truncated.text);
    console.log(`Truncated token count: ${truncated.tokenCount}`);
    
    return truncated;
  });
  
  await runExample('Generate and Apply Diff', async () => {
    // Original code
    const originalCode = await aiTools.readFile(EXAMPLE_FILE);
    
    // Modified code (add a new method to User class)
    const modifiedCode = originalCode.replace(
      'toJSON() {',
      'toJSON() {\n    // Added a comment to test diff\n'
    );
    
    // Generate diff
    const diffText = aiTools.generateDiff(originalCode, modifiedCode);
    console.log('Generated diff:');
    console.log(diffText);
    
    // Apply diff to create a new file
    const patchedFile = path.join(TEST_DIR, 'example-patched.js');
    await aiTools.writeFile(patchedFile, originalCode);
    
    // Apply the patch
    const patchedCode = aiTools.applyDiff(originalCode, diffText);
    await aiTools.writeFile(patchedFile, patchedCode);
    
    console.log('Patch applied to create:', patchedFile);
    console.log('Example JavaScript file (patched)');
  });
  
  await runExample('Optimize Prompt', () => {
    // Create a sample prompt with system message, history, and query
    const promptData = {
      system: 'You are a helpful AI assistant that provides information about JavaScript programming.',
      messages: [
        { role: 'user', content: 'How do I use async/await in JavaScript?' },
        { role: 'assistant', content: 'Async/await is a way to handle asynchronous operations in JavaScript. The async keyword is used to define an asynchronous function, which returns a Promise. The await keyword is used inside async functions to wait for a Promise to resolve before continuing execution. This makes asynchronous code look and behave more like synchronous code, which can be easier to understand and maintain.' },
        { role: 'user', content: 'Can you show me an example?' },
        { role: 'assistant', content: 'Sure, here\'s a simple example of using async/await to fetch data from an API:\n\n```javascript\nasync function fetchUserData(userId) {\n  try {\n    const response = await fetch(`https://api.example.com/users/${userId}`);\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error(\'Error fetching user data:\', error);\n    throw error;\n  }\n}\n\n// Using the async function\nfetchUserData(123)\n  .then(data => console.log(\'User data:\', data))\n  .catch(error => console.error(\'Failed to fetch user data:\', error));\n```\n\nIn this example, the `fetchUserData` function is declared as async, which allows us to use await inside it. We await the fetch call, which returns a Promise that resolves to the Response object. Then we await the response.json() call, which also returns a Promise that resolves to the parsed JSON data.' },
        { role: 'user', content: 'How does error handling work with async/await?' }
      ],
      query: 'I want to understand how to handle errors when using async/await in JavaScript, particularly for API calls and other asynchronous operations.'
    };
    
    // Optimize the prompt to fit within a token limit
    const optimized = aiTools.optimizePrompt(promptData, {
      model: 'claude-3-opus',
      maxTokens: 500,
      preserveQuery: true,
      preserveSystem: true
    });
    
    console.log('Original prompt data token count:', aiTools.countTokens(JSON.stringify(promptData)));
    console.log('Optimized prompt data token count:', optimized.tokenCount);
    console.log('Optimization ratio:', (optimized.tokenCount / aiTools.countTokens(JSON.stringify(promptData))).toFixed(2));
    
    return {
      originalTokenCount: aiTools.countTokens(JSON.stringify(promptData)),
      optimizedTokenCount: optimized.tokenCount,
      tokensSaved: aiTools.countTokens(JSON.stringify(promptData)) - optimized.tokenCount,
      optimized: optimized.optimized
    };
  });
  
  // 5. Caching Examples
  await runExample('Cache Operations', async () => {
    // Initialize cache with custom config
    await aiTools.cacheUtils.initialize({
      memoryCache: {
        maxItems: 100,
        ttl: 60 * 60 * 1000 // 1 hour
      },
      persistentCache: {
        storageDir: path.join(TEST_DIR, 'cache')
      }
    });
    
    // Sample request parameters
    const requestParams = {
      prompt: 'What is the capital of France?',
      model: 'claude-3-opus',
      options: {
        temperature: 0.7,
        max_tokens: 100
      }
    };
    
    // Sample response
    const response = {
      content: 'The capital of France is Paris.',
      model: 'claude-3-opus',
      usage: {
        prompt_tokens: 10,
        completion_tokens: 8,
        total_tokens: 18
      }
    };
    
    // Store in cache
    await aiTools.setCachedResponse(requestParams, response);
    console.log('Response stored in cache');
    
    // Retrieve from cache
    const cachedResponse = await aiTools.getCachedResponse(requestParams);
    console.log('Retrieved from cache:', cachedResponse ? 'Hit' : 'Miss');
    
    // Get cache stats
    const stats = await aiTools.getCacheStats();
    console.log('Cache stats:');
    
    return stats;
  });
  
  // 6. Metrics Examples
  await runExample('Metrics Collection', async () => {
    // Initialize metrics
    await aiTools.metricsUtils.initialize({
      storageDir: path.join(TEST_DIR, 'metrics')
    });
    
    // Record some metrics
    aiTools.recordMetric('api', 'call', 1, {
      tokens: { prompt: 100, completion: 50 },
      costs: { prompt: 0.0015, completion: 0.00375 },
      latency: 1200
    });
    
    aiTools.recordMetric('cache', 'hit', 1, {
      tokensSaved: 150,
      costSaved: 0.00525
    });
    
    aiTools.recordMetric('validation', 'success', 1);
    
    aiTools.recordMetric('optimization', 'prompt', 1, {
      originalTokens: 1000,
      optimizedTokens: 600,
      tokensSaved: 400
    });
    
    // Get metrics summary
    const summary = aiTools.getMetricsSummary();
    console.log('Metrics summary:');
    
    // Export metrics
    const jsonMetrics = aiTools.exportMetrics('json');
    console.log('Metrics exported as JSON');
    
    // Visualize metrics
    const visualization = aiTools.visualizeMetrics(summary);
    console.log('Metrics visualization:');
    console.log(visualization);
    
    return {
      apiCalls: summary.api.calls,
      tokensSaved: summary.cache.tokensSaved + summary.optimization.tokensSaved,
      costSaved: summary.cache.costSaved
    };
  });
  
  // 7. Project Management Examples
  await runExample('Package.json Operations', async () => {
    // Create a sample package.json
    const packageJsonPath = path.join(TEST_DIR, 'package.json');
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      description: 'Test project for AI Tools',
      main: 'index.js',
      scripts: {
        test: 'echo "Error: no test specified" && exit 1'
      },
      dependencies: {
        'lodash': '^4.17.21'
      },
      devDependencies: {
        'jest': '^29.0.0'
      }
    };
    
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    
    // Read package.json
    const readPackageJson = await aiTools.readPackageJson(TEST_DIR);
    console.log('Read package.json:');
    console.log(readPackageJson);
    
    // Get dependencies
    const dependencies = await aiTools.getDependencies(TEST_DIR);
    console.log('Dependencies:');
    console.log(dependencies);
    
    // Add a dependency
    await aiTools.addDependency('axios', true, TEST_DIR);
    console.log('Added axios as a dev dependency');
    
    // Read updated package.json
    const updatedPackageJson = await aiTools.readPackageJson(TEST_DIR);
    console.log('Updated package.json:');
    
    return updatedPackageJson;
  });
  
  console.log('\nAll advanced examples completed successfully!');
}

// Run all examples
runAllExamples().catch(console.error);
