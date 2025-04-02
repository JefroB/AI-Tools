# AI-Tools Toolkit

**Prime8 Engineering Research Project**

This toolkit is a research project of Prime8 Engineering, exploring the capabilities of AI-assisted software development.

A comprehensive collection of utilities designed for AI assistants and developers, providing enhanced file operations, code manipulation, execution capabilities, project management tools, and cost-efficiency features.

## Overview

AI Tools provides a set of utilities that simplify common operations with improved error handling and enhanced options. These tools are particularly useful for AI assistants that need to interact with the file system, manipulate code, execute commands, and manage projects in a robust and user-friendly way. Version 3.0 adds significant features for API optimization, security scanning, UI testing, and external API integration.

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

- **Schema Validation**
  - Automatic schema generation from sample data
  - Schema versioning for API evolution
  - Validation with support for warnings vs. critical errors
  - Input/output validation for AI interactions

- **Caching**
  - Multi-level caching (memory and persistent)
  - Intelligent cache invalidation
  - Cache metrics and statistics
  - Optimized for Anthropic API

- **Token Optimization**
  - Token counting for Anthropic models
  - Smart text truncation with context preservation
  - Diff-based updates for iterative changes
  - Prompt optimization for token efficiency

- **Metrics Collection**
  - Comprehensive API usage metrics
  - Cache performance tracking
  - Token and cost savings measurement
  - Visualization and reporting

- **Memoization**
  - Function result caching for expensive operations
  - Support for both synchronous and asynchronous functions
  - Configurable TTL, cache size, and persistence
  - Class method memoization support
  - Integration with existing caching system

- **API Request Optimization** (New in 3.0)
  - Batch API requests for efficiency
  - Retry with exponential backoff
  - Rate limiting and throttling
  - Request deduplication and caching

- **External API Integration** (New in 3.0)
  - Extract references from text (e.g., issue IDs, tickets)
  - Memoize API calls for improved performance
  - Build dependency graphs from structured data
  - Extract relationship references from context

- **UI Testing** (New in 3.0)
  - Test color contrast for accessibility
  - Validate color distinction
  - Parse and convert between color formats
  - Adjust colors for better contrast

- **Security Scanning** (New in 3.0)
  - Scan code for security vulnerabilities
  - Sanitize user inputs
  - Validate password strength
  - Generate secure passwords
  - Check URL safety
  - Create Content Security Policy headers

- **Attribution Utilities** (New in 3.0)
  - Generate attribution comments for different languages
  - Add attribution to generated code
  - Configure attribution settings
  - Language detection from file extensions
  - Special handling for different file types

- **User Preferences** (New in 3.0)
  - Store user-specific settings between sessions
  - Remember user's preferred name
  - Maintain consistent settings across multiple runs
  - Store preferences locally with privacy in mind
  - Easily customize the user experience

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

### API Request Optimization

```javascript
// Batch multiple API requests
const requests = [
  { id: 1, data: 'request1' },
  { id: 2, data: 'request2' },
  { id: 3, data: 'request3' }
];

const results = await aiTools.batchRequests(
  requests,
  async (batch) => {
    // Process batch of requests
    return batch.map(req => ({ id: req.id, result: `processed-${req.data}` }));
  },
  {
    maxBatchSize: 2,
    retryFailedItems: true,
    maxRetries: 3
  }
);

// Retry with exponential backoff
const result = await aiTools.retryWithBackoff(
  async () => {
    // Function that might fail
    return await fetchData();
  },
  {
    maxRetries: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    jitter: true
  }
);

// Throttle API calls
const throttledFetch = aiTools.throttleApiCalls(
  fetchData,
  {
    requestsPerSecond: 5,
    burstSize: 2,
    maxQueueSize: 100
  }
);

// Use the throttled function
const data = await throttledFetch('endpoint');
```

### External API Integration (New in 3.0)

The library provides tools for integrating with external APIs. The examples below demonstrate integration with Jira, but the same patterns and techniques can be applied to any external API system (GitHub, Slack, Trello, Asana, etc.).

```javascript
// Extract references from text (Jira-specific example)
const text = `
  We need to fix the bug described in PROJ-123 before we can implement
  the feature requested in PROJ-456. This is related to the epic EPIC-789.
  See https://jira.example.com/browse/PROJ-123 for details.
`;

const references = aiTools.extractJiraReferences(text);
// ['PROJ-123', 'PROJ-456', 'EPIC-789']

// Extract relationship references from context
const blockingRefs = aiTools.extractBlockingReferences(text);
// [{ key: 'PROJ-123', context: '...bug described in PROJ-123 before we can implement...' }]

// Create an API client with retry, throttling, and memoization
const jiraClient = aiTools.createJiraClient(
  fetchJiraIssue,
  {
    retry: { maxRetries: 3 },
    throttle: { requestsPerSecond: 5 },
    memoize: { enabled: true }
  }
);

// Build a dependency graph from structured data
const graph = await aiTools.buildIssueDependencyGraph('PROJ-123', jiraClient, {
  maxDepth: 2,
  relationshipTypes: ['is blocked by', 'blocks', 'relates to']
});
```

For integrating with other APIs, refer to the [External API Integration Ruleset](./docs/EXTERNAL_API_INTEGRATION.md) which provides a comprehensive framework for extending the AI-Tools toolkit with any external API. The toolkit is designed to grow and expand with usage, making it easier to integrate with a wide variety of external services over time.

### UI Testing

```javascript
// Test color contrast for accessibility
const result = aiTools.testColorContrast('#333333', '#FFFFFF', {
  wcagLevel: 'AA',
  largeText: false
});
// { valid: true, contrastRatio: 12.63, ... }

// Validate color distinction
const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'];
const distinctionResult = aiTools.validateColorDistinction(colors, {
  minimumDistance: 25,
  algorithm: 'CIEDE2000'
});
// { valid: true, colorPairs: [...], ... }

// Parse color
const rgb = aiTools.parseColor('#1a2b3c');
// { r: 26, g: 43, b: 60 }

// Adjust color for better contrast
const adjustedColor = aiTools.adjustColorForContrast(
  { r: 120, g: 120, b: 120 },
  { r: 255, g: 255, b: 255 },
  4.5
);
// { r: 88, g: 88, b: 88 }
```

### Security Scanning

```javascript
// Scan code for vulnerabilities
const code = `
  const userId = req.params.id;
  db.query("SELECT * FROM users WHERE id = '" + userId + "'");
  document.getElementById('user-info').innerHTML = 'Welcome, ' + userId;
`;

const vulnerabilities = aiTools.scanForVulnerabilities(code, 'javascript', {
  severity: 'high',
  includeRemediation: true
});
// [{ name: 'SQL Injection', severity: 'high', ... }, { name: 'XSS', ... }]

// Sanitize user input
const userInput = '<script>alert("XSS")</script><img src="x" onerror="alert(\'XSS\')" />';
const sanitized = aiTools.sanitizeInput(userInput, 'html', {
  allowedTags: ['p', 'b', 'i', 'u', 'a'],
  allowedAttributes: {
    'a': ['href', 'title']
  }
});
// "&lt;script&gt;alert("XSS")&lt;/script&gt;&lt;img src="x" onerror="alert('XSS')" /&gt;"

// Validate password strength
const passwordResult = aiTools.validatePassword('password123', {
  minLength: 8,
  requireUppercase: true,
  requireNumbers: true,
  requireSpecialChars: true
});
// { valid: false, errors: ['Password must contain at least one uppercase letter', ...], strength: 45 }

// Generate a secure password
const securePassword = aiTools.generateSecurePassword({
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSpecialChars: true
});
// "X7@tR9pL#2sK4!zQ"

// Check URL safety
const isSafe = aiTools.isSafeUrl('https://example.com');
// true

// Create a Content Security Policy
const csp = aiTools.createCSP({
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", 'https://cdn.example.com'],
  styleSrc: ["'self'", 'https://fonts.googleapis.com'],
  reportUri: 'https://example.com/csp-report'
});
// "default-src 'self'; script-src 'self' https://cdn.example.com; ..."
```

## File Utilities

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

## Examples

See the [examples](./examples) directory for more usage examples.

## Refactoring Guidelines

This library is designed to be AI-friendly and maintainable. We've created comprehensive refactoring guidelines to help maintain code quality, readability, and AI assistant usability.

Key topics covered in the guidelines:
- Function length and complexity
- Managing dependencies
- Error handling strategies
- Code duplication
- Single Responsibility Principle
- Documentation best practices
- Code style for AI interaction
- Guidelines for AI-generated code
- Version control integration

For detailed information, see the [RefactoringGuidelines.md](./docs/RefactoringGuidelines.md) documentation.

## Versioning

AI-Tools uses a **mandatory** custom versioning system that provides detailed version information while ensuring version numbers always increase over time. The version format is:

```
YY.DDD.LETTER.FEATURE
```

Where:
- **YY**: Last two digits of the year
- **DDD**: Day of the year (001-366)
- **LETTER**: Alphabetic major version (A-Z, then AA-ZZ)
- **FEATURE**: Feature/build identifier (1000-9999)

For example: `25.092.C.2345` represents a version released in 2025, on the 92nd day of the year, with major version C, and feature build 2345.

This versioning system is mandatory for all AI-Tools releases. The project includes utilities to help maintain this versioning system:

```bash
# Validate the current version
npm run validate-version

# Bump the version (increments build number)
npm run bump-version

# Bump major version (e.g., C -> D)
npm run bump-version:major
```

For more details, see the [Versioning documentation](./docs/VERSIONING.md) and [Contributing guidelines](./docs/CONTRIBUTING.md).

## Attribution

AI-Tools includes utilities for adding proper attribution to generated code. These utilities ensure that code generated using the toolkit is properly attributed to Prime8 Engineering and Jeffrey Charles Bornhoeft.

```javascript
// Generate an attribution comment for JavaScript
const jsComment = aiTools.generateAttributionComment('js');

// Add attribution to code
const codeWithAttribution = aiTools.addAttributionToCode(code, 'js');

// Write a file with attribution
await aiTools.writeFileWithAttribution('path/to/file.js', code);
```

For more details, see the [Attribution documentation](./docs/ATTRIBUTION.md).

### User Preferences

```javascript
// Get the user's name
const userName = aiTools.getUserName();
// Returns the user's preferred name or "User" if not set

// Set the user's name
aiTools.setUserName("Jeffrey Charles Bornhoeft");

// Get a specific preference with a default value
const theme = aiTools.getUserPreference('theme', 'light');

// Set a specific preference
aiTools.setUserPreference('theme', 'dark');

// Reset all preferences to defaults
aiTools.resetUserPreferences();

// Prompt for user name if not already set
const name = aiTools.promptForUserName("Default Name");
```

The user preferences are stored in a local JSON file (`.user-prefs/preferences.json`) that is automatically added to `.gitignore` to ensure that personal preferences are not committed to version control.

For more details, see the [User Preferences documentation](./docs/USER_PREFERENCES.md).

## License

MIT
