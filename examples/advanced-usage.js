/**
 * AI Tools - Advanced Usage Example
 * Demonstrates how to use the advanced features of the AI Tools package
 */

const aiTools = require('../src');
const path = require('path');

// Async function to run the examples
async function runAdvancedExamples() {
  try {
    console.log('AI Tools - Advanced Usage Examples\n');
    
    // Create a test directory
    const testDir = './test-advanced-output';
    console.log(`Creating directory: ${testDir}`);
    await aiTools.createDirectory(testDir);
    
    // Create some test files
    const jsFilePath = path.join(testDir, 'example.js');
    const jsContent = `/**
 * Example JavaScript file
 * Contains some functions and classes for testing
 */

// Import some modules
import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Calculate the total price of items
 * @param {Array} items - Array of items with prices
 * @returns {number} - Total price
 */
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

/**
 * Format a price as currency
 * @param {number} price - The price to format
 * @returns {string} - Formatted price
 */
function formatPrice(price) {
  return '$' + price.toFixed(2);
}

/**
 * User class representing a user in the system
 */
class User {
  /**
   * Create a user
   * @param {string} name - User's name
   * @param {string} email - User's email
   */
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }
  
  /**
   * Get user's display name
   * @returns {string} - Display name
   */
  getDisplayName() {
    return this.name;
  }
}

// Export the functions and classes
export { calculateTotal, formatPrice, User };
`;
    
    console.log(`Writing JavaScript file: ${jsFilePath}`);
    await aiTools.writeFile(jsFilePath, jsContent);
    
    // Create a package.json file
    const packageJsonPath = path.join(testDir, 'package.json');
    const packageJsonContent = {
      name: 'ai-tools-test',
      version: '1.0.0',
      description: 'Test project for AI Tools',
      main: 'index.js',
      scripts: {
        test: 'echo "Error: no test specified" && exit 1',
        start: 'node index.js'
      },
      dependencies: {
        'lodash': '^4.17.21'
      },
      devDependencies: {
        'jest': '^29.5.0'
      }
    };
    
    console.log(`Writing package.json: ${packageJsonPath}`);
    await aiTools.writeFile(packageJsonPath, packageJsonContent);
    
    // Create a subdirectory with files
    const subDir = path.join(testDir, 'src');
    await aiTools.createDirectory(subDir);
    
    const indexPath = path.join(subDir, 'index.js');
    await aiTools.writeFile(indexPath, `// Main entry point\nconsole.log('Hello, world!');`);
    
    // ==========================================
    // Context-Aware Reading & Summarization
    // ==========================================
    console.log('\n=== Context-Aware Reading & Summarization ===');
    
    // Read a chunk of a file
    console.log(`\nReading chunk of file: ${jsFilePath} (lines 10-15)`);
    const chunk = await aiTools.readFileChunk(jsFilePath, 10, 15);
    console.log('Chunk content:');
    console.log(chunk);
    
    // Read a section of a file
    console.log(`\nReading section of file: ${jsFilePath} (between function calculateTotal and function formatPrice)`);
    const section = await aiTools.readFileSection(
      jsFilePath, 
      'function calculateTotal', 
      'function formatPrice',
      { inclusive: false }
    );
    console.log('Section content:');
    console.log(section);
    
    // Get file structure
    console.log(`\nGetting file structure of: ${testDir}`);
    const structure = await aiTools.getFileStructure(testDir, {
      depth: 2,
      includeStats: true
    });
    console.log('File structure:');
    console.log(JSON.stringify(structure, null, 2));
    
    // Summarize a file
    console.log(`\nSummarizing file: ${jsFilePath}`);
    const fileSummary = await aiTools.summarizeFile(jsFilePath);
    console.log('File summary:');
    console.log(JSON.stringify(fileSummary, null, 2));
    
    // Summarize a directory
    console.log(`\nSummarizing directory: ${testDir}`);
    const dirSummary = await aiTools.summarizeDirectory(testDir, {
      recursive: true,
      maxDepth: 2
    });
    console.log('Directory summary:');
    console.log(JSON.stringify(dirSummary, null, 2));
    
    // ==========================================
    // Code-Specific Operations
    // ==========================================
    console.log('\n=== Code-Specific Operations ===');
    
    // Find a function
    console.log(`\nFinding function 'calculateTotal' in: ${jsFilePath}`);
    const calcFunction = await aiTools.findFunction(jsFilePath, 'calculateTotal');
    console.log('Function found:');
    console.log(calcFunction);
    
    // Find a class
    console.log(`\nFinding class 'User' in: ${jsFilePath}`);
    const userClass = await aiTools.findClass(jsFilePath, 'User');
    console.log('Class found:');
    console.log(userClass);
    
    // Replace a code block
    console.log(`\nReplacing function 'formatPrice' in: ${jsFilePath}`);
    const newFormatPrice = `function formatPrice(price, currency = '$') {
  return currency + price.toFixed(2);
}`;
    
    await aiTools.replaceCodeBlock(jsFilePath, 'function formatPrice', newFormatPrice, {
      type: 'function',
      backup: true
    });
    console.log('Function replaced. New content:');
    const updatedContent = await aiTools.readFile(jsFilePath);
    console.log(updatedContent);
    
    // Add an import
    console.log(`\nAdding import to: ${jsFilePath}`);
    await aiTools.addImport(jsFilePath, `import lodash from 'lodash';`);
    console.log('Import added.');
    
    // ==========================================
    // Project & Dependency Management
    // ==========================================
    console.log('\n=== Project & Dependency Management ===');
    
    // Read package.json
    console.log(`\nReading package.json: ${packageJsonPath}`);
    const packageJson = await aiTools.readPackageJson(testDir);
    console.log('Package.json content:');
    console.log(JSON.stringify(packageJson, null, 2));
    
    // Get dependencies
    console.log(`\nGetting dependencies from: ${packageJsonPath}`);
    const dependencies = await aiTools.getDependencies(testDir, {
      dev: true,
      includeVersions: true
    });
    console.log('Dependencies:');
    console.log(JSON.stringify(dependencies, null, 2));
    
    // Add a dependency (note: this would normally run npm install, but we'll skip that for the example)
    console.log(`\nAdding dependency to: ${packageJsonPath}`);
    await aiTools.addDependency('express', {
      version: '^4.18.2',
      install: false, // Skip npm install for this example
      dirPath: testDir
    });
    console.log('Dependency added.');
    
    // Read updated package.json
    const updatedPackageJson = await aiTools.readPackageJson(testDir);
    console.log('Updated package.json:');
    console.log(JSON.stringify(updatedPackageJson, null, 2));
    
    // ==========================================
    // Execution & Validation (commented out for safety)
    // ==========================================
    console.log('\n=== Execution & Validation ===');
    console.log('Note: Command execution examples are commented out for safety.');
    
    /*
    // Run a shell command
    console.log('\nRunning shell command: ls -la');
    const cmdResult = await aiTools.runShellCommand('ls -la');
    console.log('Command result:');
    console.log(cmdResult);
    
    // Run an npm script (if available)
    console.log('\nRunning npm script: start');
    const scriptResult = await aiTools.runNpmScript('start', {
      cwd: testDir
    });
    console.log('Script result:');
    console.log(scriptResult);
    */
    
    // Apply a patch (create a simple patch)
    console.log('\nApplying a patch to a file');
    const patchContent = `--- example.js
+++ example.js
@@ -1,4 +1,4 @@
 /**
- * Example JavaScript file
+ * Example JavaScript file (patched)
  * Contains some functions and classes for testing
  */`;
    
    await aiTools.applyPatch(jsFilePath, patchContent, {
      backup: true
    });
    console.log('Patch applied.');
    
    // Read the patched file
    const patchedContent = await aiTools.readFile(jsFilePath);
    console.log('Patched file content:');
    console.log(patchedContent.substring(0, 200) + '...'); // Show just the beginning
    
    console.log('\nAll advanced examples completed successfully!');
    
    // Clean up (uncomment to delete test directory)
    /*
    console.log(`\nCleaning up: deleting ${testDir}`);
    await aiTools.deleteDirectory(testDir);
    console.log('Cleanup complete.');
    */
  } catch (error) {
    console.error('Error running advanced examples:', error);
  }
}

// Run the examples
runAdvancedExamples();
