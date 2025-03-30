# AI Tools

A comprehensive collection of utilities designed for AI assistants and developers, providing enhanced file operations, code manipulation, execution capabilities, and project management tools.

## Overview

AI Tools provides a set of utilities that simplify common operations with improved error handling and enhanced options. These tools are particularly useful for AI assistants that need to interact with the file system, manipulate code, execute commands, and manage projects in a robust and user-friendly way.

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
  encoding: 'utf8'  // Specify encoding
});
```

#### appendFile(filePath, content, options)

Appends content to a file with enhanced error handling.

```javascript
// Append to a text file
await aiTools.appendFile('file.txt', '\nNew line');

// Append JSON data (automatic stringification)
await aiTools.appendFile('data.json', { newKey: 'newValue' });
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
await aiTools.deleteFile('file.txt');
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

## Advanced Usage

For advanced usage, you can access the underlying modules directly:

```javascript
const { 
  fileUtils, 
  dirUtils, 
  contextUtils, 
  codeUtils, 
  execUtils, 
  projectUtils 
} = require('ai-tools');

// Use specific module functions
const result = await fileUtils.readFile('file.txt');
const codeBlock = await codeUtils.findFunction('file.js', 'calculateTotal');
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
