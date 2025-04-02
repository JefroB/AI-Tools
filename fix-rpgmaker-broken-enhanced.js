/**
 * RPG Maker MV Broken JSON Fixer (Enhanced)
 * 
 * This script is designed to fix the specific issues in the broken version of the MegaEarth2049 project:
 * 1. Remove any HTML content at the beginning of the files
 * 2. Add missing commas between properties in JSON objects
 * 3. Use a more aggressive approach to fix JSON syntax
 * 
 * Usage:
 * node fix-rpgmaker-broken-enhanced.js <path-to-data-directory> <output-directory>
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  // Source directory containing broken RPG Maker MV data files
  sourceDir: process.argv[2] || './fixed-rpgmaker-data',
  
  // Output directory for fixed files
  outputDir: process.argv[3] || './fixed-rpgmaker-data-enhanced',
  
  // File patterns to process
  filePatterns: [
    '*.json'
  ],
  
  // Files to exclude
  excludeFiles: []
};

/**
 * Main function
 */
async function main() {
  console.log('RPG Maker MV Broken JSON Fixer (Enhanced)');
  console.log('=======================================');
  console.log(`Source directory: ${config.sourceDir}`);
  console.log(`Output directory: ${config.outputDir}`);
  
  // Check if source directory exists
  if (!fs.existsSync(config.sourceDir)) {
    console.error(`Error: Source directory not found: ${config.sourceDir}`);
    process.exit(1);
  }
  
  // Create output directory
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  console.log(`Created output directory: ${config.outputDir}`);
  
  // Get list of JSON files
  const files = getJsonFiles(config.sourceDir);
  console.log(`Found ${files.length} JSON files`);
  
  // Process each file
  let fixedFiles = 0;
  let failedFiles = 0;
  
  for (const file of files) {
    try {
      const result = await processFile(file);
      
      if (result.fixed) {
        fixedFiles++;
        console.log(`Fixed: ${path.basename(file)} (${result.issues} issues)`);
      } else {
        console.log(`No issues found: ${path.basename(file)}`);
      }
    } catch (error) {
      failedFiles++;
      console.error(`Error fixing file ${path.basename(file)}: ${error.message}`);
    }
  }
  
  console.log(`\nSummary: Fixed ${fixedFiles} files, Failed to fix ${failedFiles} files`);
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
 * @returns {Promise<Object>} - Result of processing
 */
async function processFile(filePath) {
  // Read file
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Fix JSON
  const result = fixJson(content);
  
  // Write fixed content to output directory
  const outputPath = path.join(config.outputDir, path.basename(filePath));
  fs.writeFileSync(outputPath, result.content);
  
  return {
    fixed: result.issues > 0,
    issues: result.issues
  };
}

/**
 * Fix JSON content
 * @param {string} content - JSON content
 * @returns {Object} - Result of fixing
 */
function fixJson(content) {
  let issues = 0;
  let fixedContent = content;
  
  // Remove any HTML content at the beginning of the file
  // Look for the first '[' or '{' character
  const jsonStartIndex = content.search(/[\[\{]/);
  if (jsonStartIndex > 0) {
    fixedContent = content.substring(jsonStartIndex);
    issues++;
  }
  
  // Enhanced approach: Insert commas between all properties
  // This regex looks for patterns like "property1":value"property2": and adds a comma
  // It's more aggressive than the previous version
  let prevContent;
  do {
    prevContent = fixedContent;
    
    // Fix missing commas between properties
    fixedContent = fixedContent.replace(/"([a-zA-Z0-9_]+)":\s*([^,\s\}\]]*)\s*"([a-zA-Z0-9_]+)":/g, (match, prop1, value, prop2) => {
      issues++;
      return `"${prop1}":${value},"${prop2}":`;
    });
    
    // Fix missing commas in arrays
    fixedContent = fixedContent.replace(/\}\s*\{/g, (match) => {
      issues++;
      return '},{';
    });
    
    // Fix missing commas after closing brackets in arrays
    fixedContent = fixedContent.replace(/\]\s*"([a-zA-Z0-9_]+)":/g, (match, prop) => {
      issues++;
      return `],"${prop}":`;
    });
    
    // Fix missing commas after closing braces in arrays
    fixedContent = fixedContent.replace(/\}\s*"([a-zA-Z0-9_]+)":/g, (match, prop) => {
      issues++;
      return `},"${prop}":`;
    });
    
    // Fix missing commas between array elements
    fixedContent = fixedContent.replace(/\]\s*\[/g, (match) => {
      issues++;
      return '],[';
    });
    
    // Fix missing commas between numeric values and properties
    fixedContent = fixedContent.replace(/(\d+)\s*"([a-zA-Z0-9_]+)":/g, (match, num, prop) => {
      issues++;
      return `${num},"${prop}":`;
    });
    
    // Fix missing commas between boolean values and properties
    fixedContent = fixedContent.replace(/(true|false)\s*"([a-zA-Z0-9_]+)":/g, (match, bool, prop) => {
      issues++;
      return `${bool},"${prop}":`;
    });
    
    // Fix missing commas between null values and properties
    fixedContent = fixedContent.replace(/(null)\s*"([a-zA-Z0-9_]+)":/g, (match, nullVal, prop) => {
      issues++;
      return `${nullVal},"${prop}":`;
    });
    
    // Fix missing commas between string values and properties
    fixedContent = fixedContent.replace(/"([^"]+)"\s*"([a-zA-Z0-9_]+)":/g, (match, str, prop) => {
      issues++;
      return `"${str}","${prop}":`;
    });
    
  } while (prevContent !== fixedContent); // Repeat until no more changes are made
  
  // Manual fixes for common patterns in RPG Maker MV files
  
  // Fix arrays with missing commas
  fixedContent = fixedContent.replace(/\[(\d+)(\d+)(\d+)/g, (match, num1, num2, num3) => {
    issues++;
    return `[${num1},${num2},${num3}`;
  });
  
  // Fix arrays with null and missing commas
  fixedContent = fixedContent.replace(/\[(null)(\d+)/g, (match, null1, num) => {
    issues++;
    return `[${null1},${num}`;
  });
  
  fixedContent = fixedContent.replace(/\[(\d+)(null)/g, (match, num, null1) => {
    issues++;
    return `[${num},${null1}`;
  });
  
  // Fix arrays with multiple nulls and missing commas
  fixedContent = fixedContent.replace(/\[(null)(null)/g, (match, null1, null2) => {
    issues++;
    return `[${null1},${null2}`;
  });
  
  // Fix specific patterns in RPG Maker MV files
  fixedContent = fixedContent.replace(/\[(\d+)(\d+)(\d+)(null)(\d+)\]/g, (match, num1, num2, num3, null1, num4) => {
    issues++;
    return `[${num1},${num2},${num3},${null1},${num4}]`;
  });
  
  // Validate the fixed JSON
  try {
    JSON.parse(fixedContent);
    console.log(`Successfully fixed JSON for ${path.basename(filePath)}`);
  } catch (error) {
    console.warn(`Warning: Fixed content is still not valid JSON: ${error.message}`);
  }
  
  return {
    content: fixedContent,
    issues
  };
}

// Run the script
main().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
