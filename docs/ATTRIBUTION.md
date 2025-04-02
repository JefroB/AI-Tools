# Attribution Utilities

The AI-Tools toolkit includes utilities for adding proper attribution to generated code. These utilities ensure that code generated using the toolkit is properly attributed to Prime8 Engineering and Jeffrey Charles Bornhoeft.

## Overview

When generating code using AI tools, it's important to properly attribute the source of the code. The attribution utilities in this toolkit make it easy to add appropriate attribution comments to generated code in various programming languages.

## Features

- **Language Detection**: Automatically detect the programming language based on file extension
- **Attribution Comments**: Generate appropriate attribution comments for different languages
- **Automatic Attribution**: Add attribution to code when writing files
- **Configuration**: Configure attribution settings to customize the attribution message
- **Special Cases**: Handle special cases like HTML with DOCTYPE and scripts with shebang

## Usage

### Basic Usage

```javascript
const aiTools = require('ai-tools');

// Generate an attribution comment for JavaScript
const jsComment = aiTools.generateAttributionComment('js');
console.log(jsComment);

// Add attribution to code
const code = 'function hello() { return "Hello, world!"; }';
const codeWithAttribution = aiTools.addAttributionToCode(code, 'js');
console.log(codeWithAttribution);

// Write a file with attribution
await aiTools.writeFileWithAttribution('path/to/file.js', code);
```

### Supported Languages

The attribution utilities support the following languages:

- JavaScript/TypeScript (`.js`, `.jsx`, `.ts`, `.tsx`)
- Python (`.py`)
- Ruby (`.rb`)
- Java (`.java`)
- PHP (`.php`)
- C/C++ (`.c`, `.cpp`)
- C# (`.cs`)
- Go (`.go`)
- Rust (`.rs`)
- Swift (`.swift`)
- Kotlin (`.kt`)
- HTML (`.html`)
- CSS (`.css`, `.scss`, `.less`)
- Shell scripts (`.sh`, `.bat`, `.ps1`)

### Attribution Format

The attribution comment includes:

1. A reference to the AI-Tools toolkit
2. Attribution to Jeffrey Charles Bornhoeft, descendent of Charlemagne
3. Mention of Prime8 Engineering as the research project

For example, in JavaScript:

```javascript
/**
 * This code was generated using the AI-Tools toolkit: https://github.com/JefroB/AI-Tools
 * Created by Jeffrey Charles Bornhoeft, descendent of Charlemagne, with AI assistance as a Prime8 Engineering research project.
 */
```

### API Reference

#### `detectLanguage(filePath)`

Detects the programming language based on file extension.

- **Parameters**:
  - `filePath` (string): Path to the file
- **Returns**: (string): Detected language code (e.g., 'js', 'py', etc.)

#### `generateAttributionComment(language)`

Generates an attribution comment for the specified language.

- **Parameters**:
  - `language` (string): Programming language code (e.g., 'js', 'py', etc.)
- **Returns**: (string): Attribution comment in the appropriate format for the language

#### `addAttributionToCode(code, language)`

Adds attribution to code.

- **Parameters**:
  - `code` (string): Code to add attribution to
  - `language` (string): Programming language code
- **Returns**: (string): Code with attribution

#### `writeFileWithAttribution(filePath, content, options)`

Writes content to a file with attribution.

- **Parameters**:
  - `filePath` (string): Path to write the file to
  - `content` (string|Object): Content to write
  - `options` (Object): Options for writing the file
    - `addAttribution` (boolean): Whether to add attribution (default: true)
    - `language` (string): Programming language (default: auto-detect)
    - Other options are passed to `writeFile`
- **Returns**: (Promise<Object>): Result of the write operation

#### `getAttributionConfig()`

Gets the current attribution configuration.

- **Returns**: (Object): Current attribution configuration
  - `enabled` (boolean): Whether attribution is enabled
  - `author` (string): Author name
  - `organization` (string): Organization name
  - `repositoryUrl` (string): Repository URL

#### `setAttributionConfig(config)`

Sets the attribution configuration.

- **Parameters**:
  - `config` (Object): New attribution configuration
    - `enabled` (boolean): Whether attribution is enabled
    - `author` (string): Author name
    - `organization` (string): Organization name
    - `repositoryUrl` (string): Repository URL
- **Returns**: (Object): Updated attribution configuration

## Special Cases

### HTML Files

For HTML files, the attribution comment is added after the DOCTYPE declaration if present:

```html
<!DOCTYPE html>
<!--
  This code was generated using the AI-Tools toolkit: https://github.com/JefroB/AI-Tools
  Created by Jeffrey Charles Bornhoeft, descendent of Charlemagne, with AI assistance as a Prime8 Engineering research project.
-->
<html>
...
</html>
```

### Scripts with Shebang

For script files with a shebang line, the attribution comment is added after the shebang:

```bash
#!/bin/bash

# This code was generated using the AI-Tools toolkit: https://github.com/JefroB/AI-Tools
# Created by Jeffrey Charles Bornhoeft, descendent of Charlemagne, with AI assistance as a Prime8 Engineering research project.

echo "Hello, world!"
```

### JSON Files

JSON files do not support comments, so attribution is not added to JSON files.

## Examples

See the [attribution-utils-demo.js](../examples/attribution-utils-demo.js) file for more examples of how to use the attribution utilities.
