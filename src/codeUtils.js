/**
 * Code Utility Module for AI Tools
 * Provides code-specific operations for various programming languages
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * Find a code block in a file based on a search pattern
 * @param {string} filePath - Path to the file to search
 * @param {string|RegExp} searchPattern - Pattern to search for (string or RegExp)
 * @param {Object} options - Options for finding the code block
 * @param {string} options.type - Type of code block to find ('function', 'class', 'block', 'auto') (default: 'auto')
 * @param {string} options.language - Programming language ('js', 'ts', 'py', 'auto') (default: 'auto')
 * @param {boolean} options.includeComments - Whether to include comments before the block (default: true)
 * @returns {Promise<Object>} - The found code block with line numbers and content
 */
async function findCodeBlock(filePath, searchPattern, options = {}) {
  try {
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    
    // Set default options
    const type = options.type || 'auto';
    const language = options.language || 'auto';
    const includeComments = options.includeComments !== undefined ? options.includeComments : true;
    
    // Check if file exists
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    // Determine language from file extension if auto
    let fileLanguage = language;
    if (fileLanguage === 'auto') {
      const ext = path.extname(resolvedPath).toLowerCase();
      if (['.js', '.jsx', '.mjs'].includes(ext)) fileLanguage = 'js';
      else if (['.ts', '.tsx'].includes(ext)) fileLanguage = 'ts';
      else if (['.py'].includes(ext)) fileLanguage = 'py';
      else fileLanguage = 'js'; // Default to JavaScript
    }
    
    // Read the file content
    const content = await fs.readFile(resolvedPath, 'utf8');
    const lines = content.split(/\r?\n/);
    
    // Convert string pattern to RegExp if needed
    const pattern = typeof searchPattern === 'string' 
      ? new RegExp(searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      : searchPattern;
    
    // Find the line that matches the pattern
    let matchLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        matchLineIndex = i;
        break;
      }
    }
    
    if (matchLineIndex === -1) {
      throw new Error(`Pattern not found in file: ${searchPattern}`);
    }
    
    // Determine the type of code block if auto
    let blockType = type;
    if (blockType === 'auto') {
      const line = lines[matchLineIndex];
      if (line.includes('function ') || line.includes('=>') || line.match(/\w+\s*\([^)]*\)\s*{/)) {
        blockType = 'function';
      } else if (line.includes('class ')) {
        blockType = 'class';
      } else {
        blockType = 'block';
      }
    }
    
    // Find the start and end of the code block
    let startLine = matchLineIndex;
    let endLine = matchLineIndex;
    let braceCount = 0;
    let indentLevel = 0;
    
    // Handle different languages and block types
    if (['js', 'ts'].includes(fileLanguage)) {
      // For JavaScript/TypeScript
      
      // Find the start of the block (including comments if requested)
      if (includeComments) {
        let i = matchLineIndex - 1;
        while (i >= 0) {
          const line = lines[i].trim();
          if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
            startLine = i;
            i--;
          } else if (line === '') {
            startLine = i + 1;
            break;
          } else {
            break;
          }
        }
      }
      
      // Find the end of the block
      if (blockType === 'function' || blockType === 'class') {
        // For functions and classes, track braces
        for (let i = matchLineIndex; i < lines.length; i++) {
          const line = lines[i];
          
          // Count braces
          for (const char of line) {
            if (char === '{') braceCount++;
            else if (char === '}') {
              braceCount--;
              if (braceCount === 0 && i > matchLineIndex) {
                endLine = i;
                break;
              }
            }
          }
          
          if (braceCount === 0 && i > matchLineIndex) {
            break;
          }
        }
      } else {
        // For other blocks, find the next empty line or decreased indentation
        const matchIndent = lines[matchLineIndex].search(/\S/);
        indentLevel = matchIndent === -1 ? 0 : matchIndent;
        
        for (let i = matchLineIndex + 1; i < lines.length; i++) {
          const line = lines[i];
          if (line.trim() === '') continue;
          
          const currentIndent = line.search(/\S/);
          if (currentIndent === -1 || currentIndent <= indentLevel) {
            endLine = i - 1;
            break;
          }
          
          endLine = i;
        }
      }
    } else if (fileLanguage === 'py') {
      // For Python
      
      // Find the start of the block (including comments if requested)
      if (includeComments) {
        let i = matchLineIndex - 1;
        while (i >= 0) {
          const line = lines[i].trim();
          if (line.startsWith('#') || line === '') {
            startLine = i;
            i--;
          } else {
            break;
          }
        }
      }
      
      // Find the end of the block based on indentation
      const matchIndent = lines[matchLineIndex].search(/\S/);
      indentLevel = matchIndent === -1 ? 0 : matchIndent;
      
      for (let i = matchLineIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') {
          endLine = i;
          continue;
        }
        
        const currentIndent = line.search(/\S/);
        if (currentIndent === -1 || currentIndent <= indentLevel) {
          endLine = i - 1;
          break;
        }
        
        endLine = i;
      }
    }
    
    // Extract the code block
    const codeBlock = lines.slice(startLine, endLine + 1).join('\n');
    
    return {
      content: codeBlock,
      startLine: startLine + 1, // Convert to 1-based line numbers
      endLine: endLine + 1,
      lineCount: endLine - startLine + 1,
      type: blockType,
      language: fileLanguage
    };
  } catch (error) {
    throw new Error(`Error finding code block in ${filePath}: ${error.message}`);
  }
}

/**
 * Find a function in a file by name
 * @param {string} filePath - Path to the file to search
 * @param {string} functionName - Name of the function to find
 * @param {Object} options - Options for finding the function
 * @param {string} options.language - Programming language ('js', 'ts', 'py', 'auto') (default: 'auto')
 * @param {boolean} options.includeComments - Whether to include comments before the function (default: true)
 * @returns {Promise<Object>} - The found function with line numbers and content
 */
async function findFunction(filePath, functionName, options = {}) {
  try {
    // Create patterns based on language
    const language = options.language || 'auto';
    let pattern;
    
    if (language === 'auto') {
      const ext = path.extname(filePath).toLowerCase();
      if (['.py'].includes(ext)) {
        pattern = new RegExp(`def\\s+${functionName}\\s*\\(`);
      } else {
        // For JS/TS, match various function declaration styles
        pattern = new RegExp(
          `(function\\s+${functionName}\\s*\\()|(const\\s+${functionName}\\s*=\\s*function)|(const\\s+${functionName}\\s*=\\s*\\()|(let\\s+${functionName}\\s*=\\s*function)|(let\\s+${functionName}\\s*=\\s*\\()|(var\\s+${functionName}\\s*=\\s*function)|(var\\s+${functionName}\\s*=\\s*\\()|(${functionName}\\s*\\(.*\\)\\s*{)`
        );
      }
    } else if (language === 'py') {
      pattern = new RegExp(`def\\s+${functionName}\\s*\\(`);
    } else {
      // For JS/TS
      pattern = new RegExp(
        `(function\\s+${functionName}\\s*\\()|(const\\s+${functionName}\\s*=\\s*function)|(const\\s+${functionName}\\s*=\\s*\\()|(let\\s+${functionName}\\s*=\\s*function)|(let\\s+${functionName}\\s*=\\s*\\()|(var\\s+${functionName}\\s*=\\s*function)|(var\\s+${functionName}\\s*=\\s*\\()|(${functionName}\\s*\\(.*\\)\\s*{)`
      );
    }
    
    return await findCodeBlock(filePath, pattern, {
      ...options,
      type: 'function'
    });
  } catch (error) {
    throw new Error(`Error finding function ${functionName} in ${filePath}: ${error.message}`);
  }
}

/**
 * Find a class in a file by name
 * @param {string} filePath - Path to the file to search
 * @param {string} className - Name of the class to find
 * @param {Object} options - Options for finding the class
 * @param {string} options.language - Programming language ('js', 'ts', 'py', 'auto') (default: 'auto')
 * @param {boolean} options.includeComments - Whether to include comments before the class (default: true)
 * @returns {Promise<Object>} - The found class with line numbers and content
 */
async function findClass(filePath, className, options = {}) {
  try {
    // Create patterns based on language
    const language = options.language || 'auto';
    let pattern;
    
    if (language === 'auto') {
      const ext = path.extname(filePath).toLowerCase();
      if (['.py'].includes(ext)) {
        pattern = new RegExp(`class\\s+${className}[\\s:(]`);
      } else {
        pattern = new RegExp(`class\\s+${className}[\\s{]`);
      }
    } else if (language === 'py') {
      pattern = new RegExp(`class\\s+${className}[\\s:(]`);
    } else {
      pattern = new RegExp(`class\\s+${className}[\\s{]`);
    }
    
    return await findCodeBlock(filePath, pattern, {
      ...options,
      type: 'class'
    });
  } catch (error) {
    throw new Error(`Error finding class ${className} in ${filePath}: ${error.message}`);
  }
}

/**
 * Replace a code block in a file
 * @param {string} filePath - Path to the file to modify
 * @param {string|RegExp} targetIdentifier - Pattern to identify the code block to replace
 * @param {string} newCode - New code to replace the block with
 * @param {Object} options - Options for replacing the code block
 * @param {string} options.type - Type of code block to replace ('function', 'class', 'block', 'auto') (default: 'auto')
 * @param {string} options.language - Programming language ('js', 'ts', 'py', 'auto') (default: 'auto')
 * @param {boolean} options.backup - Whether to create a backup before modifying (default: false)
 * @returns {Promise<Object>} - Result of the operation
 */
async function replaceCodeBlock(filePath, targetIdentifier, newCode, options = {}) {
  try {
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    
    // Set default options
    const backup = options.backup || false;
    
    // Check if file exists
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    // Create backup if requested
    if (backup) {
      const backupPath = `${resolvedPath}.bak`;
      await fs.copy(resolvedPath, backupPath);
    }
    
    // Find the code block to replace
    const codeBlock = await findCodeBlock(resolvedPath, targetIdentifier, options);
    
    // Read the file content
    const content = await fs.readFile(resolvedPath, 'utf8');
    const lines = content.split(/\r?\n/);
    
    // Replace the code block
    const startIndex = codeBlock.startLine - 1; // Convert to 0-based index
    const endIndex = codeBlock.endLine - 1;
    const newLines = [
      ...lines.slice(0, startIndex),
      ...newCode.split(/\r?\n/),
      ...lines.slice(endIndex + 1)
    ];
    
    // Write the modified content back to the file
    await fs.writeFile(resolvedPath, newLines.join('\n'));
    
    return {
      success: true,
      originalBlock: codeBlock,
      backupCreated: backup
    };
  } catch (error) {
    throw new Error(`Error replacing code block in ${filePath}: ${error.message}`);
  }
}

/**
 * Add an import statement to a file
 * @param {string} filePath - Path to the file to modify
 * @param {string} importStatement - Import statement to add
 * @param {Object} options - Options for adding the import
 * @param {string} options.language - Programming language ('js', 'ts', 'py', 'auto') (default: 'auto')
 * @param {boolean} options.skipIfExists - Whether to skip adding if the import already exists (default: true)
 * @param {boolean} options.groupWithSimilar - Whether to group with similar imports (default: true)
 * @returns {Promise<Object>} - Result of the operation
 */
async function addImport(filePath, importStatement, options = {}) {
  try {
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    
    // Set default options
    const skipIfExists = options.skipIfExists !== undefined ? options.skipIfExists : true;
    const groupWithSimilar = options.groupWithSimilar !== undefined ? options.groupWithSimilar : true;
    
    // Determine language from file extension if auto
    let language = options.language || 'auto';
    if (language === 'auto') {
      const ext = path.extname(resolvedPath).toLowerCase();
      if (['.js', '.jsx', '.mjs'].includes(ext)) language = 'js';
      else if (['.ts', '.tsx'].includes(ext)) language = 'ts';
      else if (['.py'].includes(ext)) language = 'py';
      else language = 'js'; // Default to JavaScript
    }
    
    // Check if file exists
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    // Read the file content
    const content = await fs.readFile(resolvedPath, 'utf8');
    const lines = content.split(/\r?\n/);
    
    // Clean the import statement
    const cleanImport = importStatement.trim();
    
    // Check if the import already exists
    if (skipIfExists && content.includes(cleanImport)) {
      return {
        success: true,
        added: false,
        message: 'Import already exists'
      };
    }
    
    // Find where to insert the import
    let insertIndex = 0;
    let lastImportIndex = -1;
    let similarImportIndex = -1;
    
    if (language === 'py') {
      // For Python, find the last import statement
      const importRegex = /^(import|from)\s+.+/;
      
      for (let i = 0; i < lines.length; i++) {
        if (importRegex.test(lines[i])) {
          lastImportIndex = i;
          
          // Check if this is a similar import (from the same module)
          if (groupWithSimilar && cleanImport.startsWith('from ')) {
            const moduleMatch = cleanImport.match(/from\s+([^\s]+)/);
            if (moduleMatch && lines[i].startsWith(`from ${moduleMatch[1]}`)) {
              similarImportIndex = i;
            }
          }
        } else if (lastImportIndex !== -1 && lines[i].trim() !== '') {
          // Stop when we find a non-empty line after imports
          break;
        }
      }
    } else {
      // For JS/TS, find the last import statement
      const importRegex = /^(import|export)\s+.+from\s+.+/;
      
      for (let i = 0; i < lines.length; i++) {
        if (importRegex.test(lines[i])) {
          lastImportIndex = i;
          
          // Check if this is a similar import (from the same module)
          if (groupWithSimilar) {
            const moduleMatch = cleanImport.match(/from\s+['"]([^'"]+)['"]/);
            const lineModuleMatch = lines[i].match(/from\s+['"]([^'"]+)['"]/);
            if (moduleMatch && lineModuleMatch && moduleMatch[1] === lineModuleMatch[1]) {
              similarImportIndex = i;
            }
          }
        } else if (lastImportIndex !== -1 && lines[i].trim() !== '') {
          // Stop when we find a non-empty line after imports
          break;
        }
      }
    }
    
    // Determine where to insert the import
    if (similarImportIndex !== -1 && groupWithSimilar) {
      insertIndex = similarImportIndex + 1;
    } else if (lastImportIndex !== -1) {
      insertIndex = lastImportIndex + 1;
    } else {
      // If no imports found, insert at the top of the file
      // But skip any shebang or docstring
      if (lines[0] && lines[0].startsWith('#!')) {
        insertIndex = 1;
        
        // Skip docstring in Python
        if (language === 'py' && lines[1] && lines[1].startsWith('"""')) {
          let i = 2;
          while (i < lines.length && !lines[i].includes('"""')) {
            i++;
          }
          insertIndex = i + 1;
        }
      }
    }
    
    // Insert the import
    lines.splice(insertIndex, 0, cleanImport);
    
    // Add a blank line after imports if needed
    if (lastImportIndex === -1 && insertIndex < lines.length - 1 && lines[insertIndex + 1].trim() !== '') {
      lines.splice(insertIndex + 1, 0, '');
    }
    
    // Write the modified content back to the file
    await fs.writeFile(resolvedPath, lines.join('\n'));
    
    return {
      success: true,
      added: true,
      insertedAt: insertIndex + 1 // Convert to 1-based line number
    };
  } catch (error) {
    throw new Error(`Error adding import to ${filePath}: ${error.message}`);
  }
}

/**
 * Remove an import statement from a file
 * @param {string} filePath - Path to the file to modify
 * @param {string|RegExp} importPattern - Pattern to match the import to remove
 * @param {Object} options - Options for removing the import
 * @param {string} options.language - Programming language ('js', 'ts', 'py', 'auto') (default: 'auto')
 * @returns {Promise<Object>} - Result of the operation
 */
async function removeImport(filePath, importPattern, options = {}) {
  try {
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    
    // Determine language from file extension if auto
    let language = options.language || 'auto';
    if (language === 'auto') {
      const ext = path.extname(resolvedPath).toLowerCase();
      if (['.js', '.jsx', '.mjs'].includes(ext)) language = 'js';
      else if (['.ts', '.tsx'].includes(ext)) language = 'ts';
      else if (['.py'].includes(ext)) language = 'py';
      else language = 'js'; // Default to JavaScript
    }
    
    // Check if file exists
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    // Read the file content
    const content = await fs.readFile(resolvedPath, 'utf8');
    const lines = content.split(/\r?\n/);
    
    // Convert string pattern to RegExp if needed
    const pattern = typeof importPattern === 'string' 
      ? new RegExp(importPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      : importPattern;
    
    // Find the import to remove
    let removedLines = [];
    const newLines = lines.filter((line, index) => {
      if (pattern.test(line)) {
        removedLines.push({ line, lineNumber: index + 1 });
        return false;
      }
      return true;
    });
    
    if (removedLines.length === 0) {
      return {
        success: true,
        removed: false,
        message: 'Import not found'
      };
    }
    
    // Write the modified content back to the file
    await fs.writeFile(resolvedPath, newLines.join('\n'));
    
    return {
      success: true,
      removed: true,
      removedLines
    };
  } catch (error) {
    throw new Error(`Error removing import from ${filePath}: ${error.message}`);
  }
}

/**
 * Format a code file using Prettier
 * @param {string} filePath - Path to the file to format
 * @param {Object} options - Options for formatting
 * @param {Object} options.prettierOptions - Options to pass to Prettier
 * @returns {Promise<Object>} - Result of the operation
 */
async function formatFile(filePath, options = {}) {
  try {
    // This function requires the prettier package to be installed
    let prettier;
    try {
      prettier = require('prettier');
    } catch (error) {
      throw new Error('Prettier is not installed. Install it with: npm install prettier');
    }
    
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    
    // Check if file exists
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    // Read the file content
    const content = await fs.readFile(resolvedPath, 'utf8');
    
    // Get Prettier config for the file
    const prettierOptions = options.prettierOptions || {};
    const resolvedOptions = await prettier.resolveConfig(resolvedPath) || {};
    const mergedOptions = { ...resolvedOptions, ...prettierOptions, filepath: resolvedPath };
    
    // Format the content
    const formattedContent = await prettier.format(content, mergedOptions);
    
    // Write the formatted content back to the file
    await fs.writeFile(resolvedPath, formattedContent);
    
    return {
      success: true,
      formatted: content !== formattedContent
    };
  } catch (error) {
    throw new Error(`Error formatting file ${filePath}: ${error.message}`);
  }
}

/**
 * Lint a code file using ESLint
 * @param {string} filePath - Path to the file to lint
 * @param {Object} options - Options for linting
 * @param {boolean} options.fix - Whether to automatically fix problems (default: false)
 * @param {Object} options.eslintOptions - Options to pass to ESLint
 * @returns {Promise<Object>} - Linting results
 */
async function lintFile(filePath, options = {}) {
  try {
    // This function requires the eslint package to be installed
    let eslint;
    try {
      eslint = require('eslint');
    } catch (error) {
      throw new Error('ESLint is not installed. Install it with: npm install eslint');
    }
    
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    
    // Set default options
    const fix = options.fix || false;
    const eslintOptions = options.eslintOptions || {};
    
    // Check if file exists
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    // Create ESLint instance
    const ESLint = eslint.ESLint;
    const linter = new ESLint({
      fix,
      overrideConfig: eslintOptions
    });
    
    // Run ESLint
    const results = await linter.lintFiles([resolvedPath]);
    
    // Apply fixes if requested
    if (fix) {
      await ESLint.outputFixes(results);
    }
    
    // Format the results
    const formatter = await linter.loadFormatter('stylish');
    const resultText = formatter.format(results);
    
    return {
      success: true,
      results: results[0],
      output: resultText,
      errorCount: results[0].errorCount,
      warningCount: results[0].warningCount,
      fixableErrorCount: results[0].fixableErrorCount,
      fixableWarningCount: results[0].fixableWarningCount
    };
  } catch (error) {
    throw new Error(`Error linting file ${filePath}: ${error.message}`);
  }
}

module.exports = {
  findCodeBlock,
  findFunction,
  findClass,
  replaceCodeBlock,
  addImport,
  removeImport,
  formatFile,
  lintFile
};
