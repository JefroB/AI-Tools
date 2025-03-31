# AI Tools

A comprehensive collection of utilities designed for AI assistants and developers, providing enhanced file operations, code manipulation, execution capabilities, project management tools, and cost-efficiency features.

## Overview

AI Tools provides a set of utilities that simplify common operations with improved error handling and enhanced options. These tools are particularly useful for AI assistants that need to interact with the file system, manipulate code, execute commands, and manage projects in a robust and user-friendly way. Version 2.0 adds significant features for error reduction and cost efficiency.

## Features

- **Enhanced File Operations**
  - Read files with automatic JSON parsing
  - Write files with automatic directory creation
  - Append to files with robust error handling
  - Check if files exist
  - Delete files safely

- **Enhanced Directory Operations**
  - List files with recursive options and filtering
  - Create directories with parent directories
  - Check if directories exist
  - Delete directories safely
  - Copy directories with options

- **Context-Aware Reading & Summarization**
  - Read specific chunks of files by line numbers
  - Read sections of files between tokens
  - Get structured file system representations
  - Generate summaries of files and directories

- **Code-Specific Operations**
  - Find and extract code blocks, functions, and classes
  - Replace code blocks safely
  - Add and remove import statements
  - Format and lint code files

- **Execution & Validation**
  - Run shell commands with enhanced safety and options
  - Execute commands with real-time output streaming
  - Run npm scripts and tests
  - Apply patches to files

- **Project & Dependency Management**
  - Read and parse package.json
  - Get project dependencies
  - Add and remove dependencies

- **Schema Validation** (New in 2.0)
  - Automatic schema generation from sample data
  - Schema versioning for API evolution
  - Validation with support for warnings vs. critical errors
  - Input/output validation for AI interactions

- **Caching** (New in 2.0)
  - Multi-level caching (memory and persistent)
  - Intelligent cache invalidation
  - Cache metrics and statistics
  - Optimized for Anthropic API

- **Token Optimization** (New in 2.0)
  - Token counting for Anthropic models
  - Smart text truncation with context preservation
  - Diff-based updates for iterative changes
  - Prompt optimization for token efficiency

- **Metrics Collection** (New in 2.0)
  - Comprehensive API usage metrics
  - Cache performance tracking
  - Token and cost savings measurement
  - Visualization and reporting

## Installation

```bash
npm install ai-tools
```

## Usage

### Basic Usage

```javascript
const aiTools = require('ai-tools');

// Read a file (with automatic JSON parsing for .json files)
const content = await aiTools.readFile('path/to/file.txt');
const jsonData = await aiTools.readFile('path/to/data.json');

// Write a file (automatically creates directories if they don't exist)
await aiTools.writeFile('path/to/new/file.txt', 'Hello, world!');

// Write JSON data (automatically stringifies and pretty-prints)
await aiTools.writeFile('path/to/data.json', { key: 'value' });

// Append to a file
await aiTools.appendFile('path/to/file.txt', '\nNew line');

// List files in a directory
const files = await aiTools.listFiles('path/to/directory');

// List files recursively with filtering
const jsFiles = await aiTools.listFiles('path/to/directory', {
  recursive: true,
  filter: '.js',
  fullPaths: true
});

// Create a directory (and parent directories)
await aiTools.createDirectory('path/to/new/directory');

// Copy a directory
await aiTools.copyDirectory('source/dir', 'destination/dir');
```

### File Utilities

#### readFile(filePath, options)

Reads a file with enhanced error handling and automatic parsing.

```javascript
// Read a text file
const text = await aiTools.readFile('file.txt');

// Read a JSON file (automatic parsing)
const data = await aiTools.readFile('data.json');

// Read with specific options
const content = await aiTools.readFile('file.ext', {
  parse: false,  // Disable automatic parsing
  encoding: 'utf8'  // Specify encoding
});
```

#### writeFile(filePath, content, options)

Writes content to a file with enhanced error handling.

```javascript
// Write a text file
await aiTools.writeFile('file.txt', 'Hello, world!');

// Write a JSON file (automatic stringification)
await aiTools.writeFile('data.json', { hello: 'world' });

// Write with specific options
await aiTools.writeFile('file.txt', 'content', {
  createDir: true,  // Create parent directories if they don't exist
  pretty: true,     // Pretty-print JSON (for objects)
  encoding: 'utf8', // Specify encoding
  backup: true,     // Create a backup before overwriting
  diff: true        // Return a diff of changes
});

// Check the result of the write operation
const result = await aiTools.writeFile('file.txt', 'content', { backup: true });
console.log('File created:', result.created);
console.log('File updated:', result.updated);
console.log('Backup created:', result.backupCreated);
if (result.backupCreated) {
  console.log('Backup path:', result.backupPath);
}
```

#### appendFile(filePath, content, options)

Appends content to a file with enhanced error handling.

```javascript
// Append to a text file
await aiTools.appendFile('file.txt', '\nNew line');

// Append JSON data (automatic stringification)
await aiTools.appendFile('data.json', { newKey: 'newValue' });

// Check the result of the append operation
const result = await aiTools.appendFile('file.txt', '\nNew line');
console.log('File created:', result.created);
console.log('Content appended:', result.appended);
```

#### fileExists(filePath)

Checks if a file exists.

```javascript
const exists = await aiTools.fileExists('file.txt');
if (exists) {
  console.log('File exists!');
}
```

#### deleteFile(filePath)

Deletes a file safely.

```javascript
// Delete a file
await aiTools.deleteFile('file.txt');

// Check the result of the delete operation
const result = await aiTools.deleteFile('file.txt');
console.log('Operation successful:', result.success);
console.log('File deleted:', result.deleted);
if (!result.success) {
  console.log('Error:', result.error);
}
```

### Directory Utilities

#### listFiles(dirPath, options)

Lists files in a directory with enhanced options.

```javascript
// List files in a directory
const files = await aiTools.listFiles('directory');

// List files recursively
const allFiles = await aiTools.listFiles('directory', {
  recursive: true
});

// Filter by extension
const jsFiles = await aiTools.listFiles('directory', {
  filter: '.js'
});

// Multiple filters
const codeFiles = await aiTools.listFiles('directory', {
  filter: ['.js', '.ts', '.jsx', '.tsx'],
  recursive: true
});

// Include directories in results
const allItems = await aiTools.listFiles('directory', {
  includeDirectories: true
});

// Get full paths
const fullPaths = await aiTools.listFiles('directory', {
  fullPaths: true
});
```

#### createDirectory(dirPath, options)

Creates a directory if it doesn't exist.

```javascript
// Create a directory (and parent directories)
await aiTools.createDirectory('path/to/new/directory');

// Create without parent directories
await aiTools.createDirectory('directory', {
  recursive: false
});
```

#### directoryExists(dirPath)

Checks if a directory exists.

```javascript
const exists = await aiTools.directoryExists('directory');
if (exists) {
  console.log('Directory exists!');
}
```

#### deleteDirectory(dirPath, options)

Deletes a directory safely.

```javascript
// Delete a directory and all its contents
await aiTools.deleteDirectory('directory');

// Delete without recursion
await aiTools.deleteDirectory('directory', {
  recursive: false
});

// Force deletion (ignore errors)
await aiTools.deleteDirectory('directory', {
  force: true
});
```

#### copyDirectory(srcPath, destPath, options)

Copies a directory.

```javascript
// Copy a directory
await aiTools.copyDirectory('source', 'destination');

// Overwrite existing files
await aiTools.copyDirectory('source', 'destination', {
  overwrite: true
});
```

### Context-Aware Reading & Summarization

#### readFileChunk(filePath, startLine, endLine, options)

Reads a specific chunk of a file by line numbers.

```javascript
// Read lines 10-20 of a file
const chunk = await aiTools.readFileChunk('file.txt', 10, 20);

// With options
const chunk = await aiTools.readFileChunk('file.txt', 10, 20, {
  encoding: 'utf8'
});
```

#### readFileSection(filePath, startToken, endToken, options)

Reads a section of a file between start and end tokens.

```javascript
// Read a section between tokens
const section = await aiTools.readFileSection('file.js', 'function start() {', 'function end() {');

// Include the tokens in the result
const section = await aiTools.readFileSection('file.js', 'function start() {', 'function end() {', {
  inclusive: true
});
```

#### getFileStructure(dirPath, options)

Gets a structured representation of a directory.

```javascript
// Get basic file structure
const structure = await aiTools.getFileStructure('project/');

// With options
const structure = await aiTools.getFileStructure('project/', {
  depth: 2,  // Limit depth
  respectGitignore: true,  // Respect .gitignore rules
  ignorePatterns: ['node_modules/**', '.git/**'],  // Ignore patterns
  includeStats: true  // Include file stats (size, modified date)
});
```

#### summarizeFile(filePath, options)

Generates a summary of a file.

```javascript
// Summarize a file
const summary = await aiTools.summarizeFile('file.js');

// With options
const summary = await aiTools.summarizeFile('file.js', {
  type: 'code',  // 'code', 'text', or 'auto'
  maxLines: 20  // Maximum number of lines to include in the summary
});
```

#### summarizeDirectory(dirPath, options)

Generates a summary of a directory.

```javascript
// Summarize a directory
const summary = await aiTools.summarizeDirectory('project/');

// With options
const summary = await aiTools.summarizeDirectory('project/', {
  recursive: true,  // Summarize subdirectories
  maxDepth: 3,  // Maximum depth for recursive summarization
  ignorePatterns: ['node_modules/**', '.git/**']  // Ignore patterns
});
```

### Code-Specific Operations

#### findCodeBlock(filePath, searchPattern, options)

Finds a code block in a file based on a search pattern.

```javascript
// Find a code block by string pattern
const block = await aiTools.findCodeBlock('file.js', 'function calculateTotal');

// Find a code block by regex
const block = await aiTools.findCodeBlock('file.js', /class\s+User/);

// With options
const block = await aiTools.findCodeBlock('file.js', 'function calculateTotal', {
  type: 'function',  // 'function', 'class', 'block', or 'auto'
  language: 'js',  // 'js', 'ts', 'py', or 'auto'
  includeComments: true  // Whether to include comments before the block
});
```

#### findFunction(filePath, functionName, options)

Finds a function in a file by name.

```javascript
// Find a function
const func = await aiTools.findFunction('file.js', 'calculateTotal');

// With options
const func = await aiTools.findFunction('file.js', 'calculateTotal', {
  language: 'js',  // 'js', 'ts', 'py', or 'auto'
  includeComments: true  // Whether to include comments before the function
});
```

#### findClass(filePath, className, options)

Finds a class in a file by name.

```javascript
// Find a class
const cls = await aiTools.findClass('file.js', 'User');

// With options
const cls = await aiTools.findClass('file.js', 'User', {
  language: 'js',  // 'js', 'ts', 'py', or 'auto'
  includeComments: true  // Whether to include comments before the class
});
```

#### replaceCodeBlock(filePath, targetIdentifier, newCode, options)

Replaces a code block in a file.

```javascript
// Replace a function
await aiTools.replaceCodeBlock('file.js', 'function calculateTotal', 'function calculateTotal() {\n  return items.reduce((sum, item) => sum + item.price, 0);\n}');

// With options
await aiTools.replaceCodeBlock('file.js', 'function calculateTotal', newCode, {
  type: 'function',  // 'function', 'class', 'block', or 'auto'
  language: 'js',  // 'js', 'ts', 'py', or 'auto'
  backup: true  // Create a backup before modifying
});
```

#### addImport(filePath, importStatement, options)

Adds an import statement to a file.

```javascript
// Add an import
await aiTools.addImport('file.js', 'import { useState } from "react";');

// With options
await aiTools.addImport('file.js', 'import { useState } from "react";', {
  language: 'js',  // 'js', 'ts', 'py', or 'auto'
  skipIfExists: true,  // Skip adding if the import already exists
  groupWithSimilar: true  // Group with similar imports
});
```

#### removeImport(filePath, importPattern, options)

Removes an import statement from a file.

```javascript
// Remove an import by string pattern
await aiTools.removeImport('file.js', 'import { useState }');

// Remove an import by regex
await aiTools.removeImport('file.js', /import.*from\s+['"]react['"]/);
```

#### formatFile(filePath, options)

Formats a code file using Prettier.

```javascript
// Format a file
await aiTools.formatFile('file.js');

// With options
await aiTools.formatFile('file.js', {
  prettierOptions: {
    semi: false,
    singleQuote: true
  }
});
```

#### lintFile(filePath, options)

Lints a code file using ESLint.

```javascript
// Lint a file
const results = await aiTools.lintFile('file.js');

// With options
const results = await aiTools.lintFile('file.js', {
  fix: true,  // Automatically fix problems
  eslintOptions: {
    rules: {
      'no-console': 'error'
    }
  }
});
```

### Execution & Validation

#### runShellCommand(command, options)

Runs a shell command with enhanced options and safety checks.

```javascript
// Run a simple command
const result = await aiTools.runShellCommand('ls -la');

// With options
const result = await aiTools.runShellCommand('npm install', {
  cwd: 'project/',  // Current working directory
  timeout: 60000,  // Timeout in milliseconds
  dryRun: false,  // Whether to simulate the command without executing it
  env: { NODE_ENV: 'development' }  // Environment variables
});
```

#### runCommandWithOutput(command, args, options)

Runs a command with real-time output streaming.

```javascript
// Run a command with output streaming
const result = await aiTools.runCommandWithOutput('npm', ['install'], {
  cwd: 'project/',  // Current working directory
  onStdout: (data) => console.log(data),  // Callback for stdout data
  onStderr: (data) => console.error(data)  // Callback for stderr data
});
```

#### runNpmScript(scriptName, options)

Runs an npm script from package.json.

```javascript
// Run an npm script
const result = await aiTools.runNpmScript('test');

// With options
const result = await aiTools.runNpmScript('build', {
  cwd: 'project/',  // Current working directory
  stream: true,  // Whether to stream output in real-time
  onStdout: (data) => console.log(data),  // Callback for stdout data
  onStderr: (data) => console.error(data)  // Callback for stderr data
});
```

#### runTests(options)

Runs tests for a project.

```javascript
// Run tests
const result = await aiTools.runTests();

// With options
const result = await aiTools.runTests({
  cwd: 'project/',  // Current working directory
  command: 'jest --coverage',  // Custom test command
  stream: true  // Whether to stream output in real-time
});
```

#### applyPatch(filePath, patchContent, options)

Applies a patch to a file.

```javascript
// Apply a patch
await aiTools.applyPatch('file.js', patchContent);

// With options
await aiTools.applyPatch('file.js', patchContent, {
  backup: true,  // Create a backup before modifying
  dryRun: false  // Whether to simulate the patch without applying it
});
```

### Project & Dependency Management

#### readPackageJson(dirPath)

Reads and parses package.json.

```javascript
// Read package.json in the current directory
const packageJson = await aiTools.readPackageJson();

// Read package.json in a specific directory
const packageJson = await aiTools.readPackageJson('project/');
```

#### getDependencies(dirPath, options)

Gets dependencies from package.json.

```javascript
// Get all dependencies
const deps = await aiTools.getDependencies();

// With options
const deps = await aiTools.getDependencies('project/', {
  dev: true,  // Include devDependencies
  peer: false,  // Include peerDependencies
  optional: false,  // Include optionalDependencies
  includeVersions: true  // Include version strings
});
```

#### addDependency(packageName, options)

Adds a dependency to package.json.

```javascript
// Add a dependency
await aiTools.addDependency('lodash');

// With options
await aiTools.addDependency('jest', {
  dev: true,  // Add as a dev dependency
  version: '^29.0.0',  // Specific version
  install: true,  // Run npm install after adding
  dirPath: 'project/'  // Path to the directory containing package.json
});
```

#### removeDependency(packageName, options)

Removes a dependency from package.json.

```javascript
// Remove a dependency
await aiTools.removeDependency('lodash');

// With options
await aiTools.removeDependency('jest', {
  dev: true,  // Remove from devDependencies
  removeAll: false,  // Remove from all dependency types
  uninstall: true,  // Run npm uninstall after removing
  dirPath: 'project/'  // Path to the directory containing package.json
});
```

### Schema Validation

#### generateSchema(sampleData, options)

Automatically generates a JSON Schema from sample data.

```javascript
// Generate a schema from sample data
const sampleData = {
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  },
  items: [
    { id: 1, name: 'Item 1', price: 10.99 }
  ]
};

const schema = aiTools.generateSchema(sampleData, {
  id: 'order',
  title: 'Order Schema',
  description: 'Schema for order data',
  required: {
    'user.name': true,
    'user.email': true
  },
  critical: {
    'user.email': true
  }
});
```

#### validateInput(interactionType, data)

Validates input data before sending to AI, with automatic schema generation.

```javascript
// Validate input data
const inputData = {
  prompt: 'Generate a function to calculate factorial',
  options: {
    temperature: 0.7,
    max_tokens: 500
  }
};

const validationResult = await aiTools.validateInput('code-generation', inputData);
if (validationResult.valid) {
  console.log('Input is valid');
} else {
  console.log('Validation errors:', validationResult.errors);
  console.log('Validation warnings:', validationResult.warnings);
}
```

#### validateOutput(interactionType, data)

Validates output data from AI, with automatic schema generation.

```javascript
// Validate AI response
const aiResponse = {
  content: 'function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }',
  model: 'claude-3-opus',
  usage: {
    prompt_tokens: 15,
    completion_tokens: 12
  }
};

const validationResult = await aiTools.validateOutput('code-generation', aiResponse);
if (validationResult.valid) {
  console.log('Output is valid');
} else {
  console.log('Validation errors:', validationResult.errors);
  console.log('Validation warnings:', validationResult.warnings);
}
```

#### validateWithWarnings(data, schema)

Validates data against a schema with support for warnings vs. critical errors.

```javascript
// Validate data with warnings
const data = {
  user: {
    name: 'Jane Doe',
    // Missing email (critical)
    age: 'twenty-five' // Wrong type (warning)
  }
};

const schema = aiTools.generateSchema(data, {
  required: {
    'user.email': true
  },
  critical: {
    'user.email': true
  }
});

const result = await aiTools.validateWithWarnings(data, schema);
console.log('Valid:', result.valid);
console.log('Critical errors:', result.errors);
console.log('Warnings:', result.warnings);
```

### Caching

#### getCachedResponse(params)

Retrieves a cached response based on request parameters.

```javascript
// Get a cached response
const requestParams = {
  prompt: 'What is the capital of France?',
  model: 'claude-3-opus',
  options: {
    temperature: 0.7
  }
};

const cachedResponse = await aiTools.getCachedResponse(requestParams);
if (cachedResponse) {
  console.log('Cache hit:', cachedResponse);
} else {
  console.log('Cache miss');
  // Make API call and then cache the response
}
```

#### setCachedResponse(params, response)

Stores a response in the cache.

```javascript
// Store a response in the cache
const requestParams = {
  prompt: 'What is the capital of France?',
  model: 'claude-3-opus',
  options: {
    temperature: 0.7
  }
};

const response = {
  content: 'The capital of France is Paris.',
  model: 'claude-3-opus',
  usage: {
    prompt_tokens: 10,
    completion_tokens: 8
  }
};

await aiTools.setCachedResponse(requestParams, response);
```

#### invalidateCache(options)

Invalidates cache entries based on various criteria.

```javascript
// Invalidate specific cache entry
await aiTools.invalidateCache({ key: 'specific-cache-key' });

// Invalidate by prompt pattern
await aiTools.invalidateCache({ 
  promptPattern: /capital of France/i 
});

// Invalidate by model
await aiTools.invalidateCache({ model: 'claude-3-opus' });

// Invalidate entries older than a timestamp
await aiTools.invalidateCache({ 
  olderThan: Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago
});
```

#### clearCache()

Clears the entire cache.

```javascript
// Clear the entire cache
await aiTools.clearCache();
```

#### getCacheStats()

Gets cache statistics and metrics.

```javascript
// Get cache statistics
const stats = await aiTools.getCacheStats();
console.log('Cache stats:', stats);
console.log('Memory cache size:', stats.memory.size);
console.log('Hit rate:', stats.hitRate.overall);
console.log('Tokens saved:', stats.metrics.tokensSaved);
console.log('Cost saved:', stats.metrics.costSaved);
```

### Token Optimization

#### countTokens(text, model)

Counts tokens for a string (Anthropic-specific).

```javascript
// Count tokens in a text
const text = 'This is a sample text that will be used to estimate token count.';
const tokenCount = aiTools.countTokens(text, 'claude-3-opus');
console.log(`Estimated token count: ${tokenCount}`);
```

#### truncateToTokenLimit(text, maxTokens, options)

Truncates text to fit within a token limit while preserving context.

```javascript
// Truncate text to fit token limit
const longText = 'This is a very long text that needs to be truncated...';
const truncated = aiTools.truncateToTokenLimit(longText, 20, {
  model: 'claude-3-opus',
  preserveStart: true,
  preserveEnd: true,
  startRatio: 0.7
});

console.log('Truncated text:', truncated.text);
console.log('Token count:', truncated.tokenCount);
```

#### generateDiff(originalText, newText, options)

Generates a diff between two texts.

```javascript
// Generate a diff
const originalCode = 'function add(a, b) {\n  return a + b;\n}';
const newCode = 'function add(a, b) {\n  // Add two numbers\n  return a + b;\n}';

const diff = aiTools.generateDiff(originalCode, newCode);
console.log('Diff:', diff);
```

#### applyDiff(originalText, diffText)

Applies a diff to original text.

```javascript
// Apply a diff
const originalCode = 'function add(a, b) {\n  return a + b;\n}';
const diffText = '--- text\n+++ text\n@@ -1,3 +1,4 @@\n function add(a, b) {\n+  // Add two numbers\n   return a + b;\n }';

const patchedCode = aiTools.applyDiff(originalCode, diffText);
console.log('Patched code:', patchedCode);
```

#### optimizePrompt(promptData, options)

Optimizes a prompt to fit within token limits.

```javascript
// Optimize a prompt
const promptData = {
  system: 'You are a helpful AI assistant.',
  messages: [
    { role: 'user', content: 'Tell me about JavaScript.' },
    { role: 'assistant', content: 'JavaScript is a programming language...' },
    { role: 'user', content: 'How do I use async/await?' }
  ],
  query: 'Can you show me an example of async/await in JavaScript?'
};

const optimized = aiTools.optimizePrompt(promptData, {
  model: 'claude-3-opus',
  maxTokens: 500,
  preserveQuery: true,
  preserveSystem: true
});

console.log('Original token count:', aiTools.countTokens(JSON.stringify(promptData)));
console.log('Optimized token count:', optimized.tokenCount);
console.log('Tokens saved:', aiTools.countTokens(JSON.stringify(promptData)) - optimized.tokenCount);
```

#### extractRelevantCode(code, query, options)

Extracts relevant sections from code based on a query.

```javascript
// Extract relevant code sections
const code = `
// Import modules
import React from 'react';

// Component for user profile
function UserProfile({ user }) {
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// Component for user list
function UserList({ users }) {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
`;

const relevantSections = aiTools.extractRelevantCode(code, 'user profile component', {
  language: 'javascript',
  maxTokens: 100,
  contextLines: 2
});

console.log('Relevant sections:', relevantSections);
```

### Metrics Collection

#### recordMetric(category, name, value, metadata)

Records a metric data point.

```javascript
// Record API call metric
aiTools.recordMetric('api', 'call', 1, {
  tokens: { prompt: 100, completion: 50 },
  costs: { prompt: 0.0015, completion: 0.00375 },
  latency: 1200
});

// Record cache hit metric
aiTools.recordMetric('cache', 'hit', 1, {
  tokensSaved: 150,
  costSaved: 0.00525
});

// Record validation metric
aiTools.recordMetric('validation', 'success', 1);

// Record optimization metric
aiTools.recordMetric('optimization', 'prompt', 1, {
  originalTokens: 1000,
  optimizedTokens: 600,
  tokensSaved: 400
});
```

#### getMetricsSummary(options)

Gets a summary of collected metrics.

```javascript
// Get all metrics
const allMetrics = aiTools.getMetricsSummary();
console.log('All metrics:', allMetrics);

// Get metrics for a specific time range
const recentMetrics = aiTools.getMetricsSummary({
  timeRange: 60 * 60 * 1000 // Last hour
});
console.log('Recent metrics:', recentMetrics);

// Get metrics for a specific category
const apiMetrics = aiTools.getMetricsSummary({
  category: 'api'
});
console.log('API metrics:', apiMetrics);
```

#### resetMetrics(options)

Resets metrics.

```javascript
// Reset all metrics
aiTools.resetMetrics();

// Reset metrics but keep detailed entries
aiTools.resetMetrics({ keepEntries: true });
```

#### exportMetrics(format, options)

Exports metrics in various formats.

```javascript
// Export metrics as JSON
const jsonMetrics = aiTools.exportMetrics('json');
console.log('JSON metrics:', jsonMetrics);

// Export metrics as CSV
const csvMetrics = aiTools.exportMetrics('csv');
console.log('CSV metrics:', csvMetrics);

// Export with time range
const recentMetrics = aiTools.exportMetrics('json', {
  timeRange: 24 * 60 * 60 * 1000 // Last 24 hours
});
```

#### visualizeMetrics(metrics, options)

Generates a simple ASCII visualization of metrics.

```javascript
// Visualize metrics
const metrics = aiTools.getMetricsSummary();
const visualization = aiTools.visualizeMetrics(metrics, {
  width: 80,
  height: 20
});
console.log(visualization);
```

## Advanced Usage

For advanced usage, you can access the underlying modules directly:

```javascript
const { 
  fileUtils, 
  dirUtils, 
  contextUtils, 
  codeUtils, 
  execUtils, 
  projectUtils,
  validationUtils,
  cacheUtils,
  tokenUtils,
  metricsUtils
} = require('ai-tools');

// Use specific module functions
const result = await fileUtils.readFile('file.txt');
const codeBlock = await codeUtils.findFunction('file.js', 'calculateTotal');
const schema = validationUtils.generateSchema(sampleData);
const tokenCount = tokenUtils.countTokens('Sample text');
```

## Error Handling

All functions return promises and include enhanced error handling. You can use try/catch blocks to handle errors:

```javascript
try {
  await aiTools.readFile('nonexistent-file.txt');
} catch (error) {
  console.error('Error reading file:', error.message);
}
```

## Examples

See the [examples](./examples) directory for more usage examples.

## License

MIT
