/**
 * RPG Maker MV JSON Fixer
 * 
 * This script fixes common issues in RPG Maker MV JSON files:
 * 1. Adds missing commas between properties in JSON objects
 * 2. Validates and fixes JavaScript code in note fields
 * 
 * Usage:
 * node fix-rpgmaker-json.js <path-to-data-directory>
 */

const fs = require('fs');
const path = require('path');
const aiTools = require('./src/index');

// Configuration
const config = {
  // Directory containing RPG Maker MV data files
  dataDir: process.argv[2] || 'D:\\MegaEarth2049-master\\data',
  
  // Whether to create backups of original files
  createBackups: true,
  
  // Whether to validate JavaScript in note fields
  validateJavaScript: true,
  
  // File patterns to process
  filePatterns: [
    '*.json'
  ],
  
  // Files to exclude
  excludeFiles: [
    'MapInfos.json' // This file might have a different structure
  ]
};

/**
 * Main function
 */
async function main() {
  // Display the console art
  aiTools.displayConsoleArt({
    theme: 'default',
    additionalMessage: 'RPG Maker MV JSON Fixer'
  });
  
  console.log(`Data directory: ${config.dataDir}`);
  
  // Check if data directory exists
  if (!fs.existsSync(config.dataDir)) {
    console.error(`Error: Data directory not found: ${config.dataDir}`);
    process.exit(1);
  }
  
  // Get list of JSON files
  const files = getJsonFiles(config.dataDir);
  console.log(`Found ${files.length} JSON files`);
  
  // Process each file
  let fixedFiles = 0;
  for (const file of files) {
    const result = await processFile(file);
    if (result.fixed) {
      fixedFiles++;
      console.log(`Fixed: ${file} (${result.issues} issues)`);
    } else if (result.issues > 0) {
      console.log(`Issues found but not fixed: ${file} (${result.issues} issues)`);
    } else {
      console.log(`No issues: ${file}`);
    }
  }
  
  // Display success message with console art
  aiTools.displaySuccess(`Summary: Fixed ${fixedFiles} out of ${files.length} files`);
}

/**
 * Get list of JSON files in directory
 * @param {string} dir - Directory path
 * @returns {string[]} - List of file paths
 */
function getJsonFiles(dir) {
  const files = fs.readdirSync(dir);
  
  return files
    .filter(file => {
      // Check if file matches patterns
      const isMatch = config.filePatterns.some(pattern => {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(file);
      });
      
      // Check if file is excluded
      const isExcluded = config.excludeFiles.includes(file);
      
      return isMatch && !isExcluded;
    })
    .map(file => path.join(dir, file));
}

/**
 * Process a single file
 * @param {string} filePath - Path to file
 * @returns {Object} - Result of processing
 */
async function processFile(filePath) {
  try {
    // Read file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Fix JSON
    const result = fixJson(content);
    
    // If issues were found and fixed
    if (result.issues > 0) {
      // Create backup if enabled
      if (config.createBackups) {
        const backupPath = `${filePath}.bak`;
        fs.writeFileSync(backupPath, content);
      }
      
      // Write fixed content
      fs.writeFileSync(filePath, result.content);
      
      return {
        fixed: true,
        issues: result.issues
      };
    }
    
    return {
      fixed: false,
      issues: result.issues
    };
  } catch (error) {
    console.error(`Error processing file ${filePath}: ${error.message}`);
    return {
      fixed: false,
      issues: 0,
      error: error.message
    };
  }
}

/**
 * Fix JSON content
 * @param {string} content - JSON content
 * @returns {Object} - Result of fixing
 */
function fixJson(content) {
  let issues = 0;
  
  // Fix missing commas between properties
  const fixedContent = content.replace(/"([a-zA-Z0-9_]+)":([^,\s}])\s*"([a-zA-Z0-9_]+)":/g, (match, prop1, value, prop2) => {
    issues++;
    return `"${prop1}":${value},"${prop2}":`;
  });
  
  // Fix JavaScript in note fields if enabled
  let finalContent = fixedContent;
  if (config.validateJavaScript) {
    finalContent = fixJavaScriptInNotes(fixedContent, issues);
  }
  
  return {
    content: finalContent,
    issues
  };
}

/**
 * Fix JavaScript code in note fields
 * @param {string} content - JSON content
 * @param {number} issues - Number of issues found so far
 * @returns {string} - Fixed content
 */
function fixJavaScriptInNotes(content, issues) {
  // Find note fields
  const noteRegex = /"note":"((?:\\"|[^"])*)"/g;
  
  return content.replace(noteRegex, (match, noteContent) => {
    // Skip empty notes
    if (!noteContent) return match;
    
    // Fix common JavaScript issues in note content
    let fixedNote = noteContent;
    
    // Fix missing semicolons
    fixedNote = fixedNote.replace(/([^;{])\s*\n\s*([a-zA-Z$_])/g, (match, before, after) => {
      issues++;
      return `${before};\n${after}`;
    });
    
    // Fix unescaped quotes
    fixedNote = fixedNote.replace(/([^\\])"/g, (match, before) => {
      if (match === '\\"') return match; // Already escaped
      issues++;
      return `${before}\\"`;
    });
    
    // Fix arrow functions
    fixedNote = fixedNote.replace(/\(([^)]*)\)\s*=>\s*{/g, (match, params) => {
      issues++;
      return `function(${params}) {`;
    });
    
    // Fix let/const to var
    fixedNote = fixedNote.replace(/\b(let|const)\b\s+([a-zA-Z$_][a-zA-Z0-9$_]*)/g, (match, keyword, varName) => {
      issues++;
      return `var ${varName}`;
    });
    
    // Return fixed note
    return `"note":"${fixedNote}"`;
  });
}

// Run the script
main().catch(error => {
  // Display error message with console art
  aiTools.displayError(`Error: ${error.message}`);
  process.exit(1);
});
