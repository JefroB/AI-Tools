# AI Tools

A collection of enhanced file and directory utilities designed for AI assistants and developers.

## Overview

AI Tools provides a set of utilities that simplify common file and directory operations with improved error handling, automatic directory creation, and enhanced options. These tools are particularly useful for AI assistants that need to interact with the file system in a robust and user-friendly way.

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

## Advanced Usage

For advanced usage, you can access the underlying modules directly:

```javascript
const { fileUtils, dirUtils } = require('ai-tools');

// Use specific module functions
const result = await fileUtils.readFile('file.txt');
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
