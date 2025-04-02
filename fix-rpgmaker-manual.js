/**
 * RPG Maker MV Broken JSON Fixer (Manual Approach)
 * 
 * This script takes a more direct approach to fixing the broken JSON files:
 * 1. Identifies the structure of RPG Maker MV JSON files
 * 2. Parses the content line by line
 * 3. Reconstructs the JSON with proper commas and formatting
 * 
 * Usage:
 * node fix-rpgmaker-manual.js <path-to-data-directory> <output-directory>
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  // Source directory containing broken RPG Maker MV data files
  sourceDir: process.argv[2] || 'D:\\MegaEarth2049-AI edits\\data',
  
  // Output directory for fixed files
  outputDir: process.argv[3] || './fixed-rpgmaker-data-manual',
  
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
  console.log('RPG Maker MV Broken JSON Fixer (Manual Approach)');
  console.log('=============================================');
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
  const result = fixJson(content, path.basename(filePath));
  
  // Write fixed content to output directory
  const outputPath = path.join(config.outputDir, path.basename(filePath));
  fs.writeFileSync(outputPath, result.content);
  
  return {
    fixed: result.issues > 0,
    issues: result.issues
  };
}

/**
 * Fix JSON content using a manual approach
 * @param {string} content - JSON content
 * @param {string} fileName - File name for logging
 * @returns {Object} - Result of fixing
 */
function fixJson(content, fileName) {
  let issues = 0;
  
  // Remove any HTML content at the beginning of the file
  // Look for the first '[' or '{' character
  const jsonStartIndex = content.search(/[\[\{]/);
  if (jsonStartIndex > 0) {
    content = content.substring(jsonStartIndex);
    issues++;
  }
  
  // Determine if the file is an array or object
  const isArray = content.trim().startsWith('[');
  
  // Split the content into lines for easier processing
  const lines = content.split('\n');
  
  // Reconstruct the JSON
  let fixedContent = '';
  let inObject = false;
  let inArray = false;
  let inString = false;
  let depth = 0;
  
  if (isArray) {
    fixedContent = '[';
    inArray = true;
    depth = 1;
  } else {
    fixedContent = '{';
    inObject = true;
    depth = 1;
  }
  
  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (line === '') continue;
    
    // Process the line character by character
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = j < line.length - 1 ? line[j + 1] : '';
      
      // Handle string literals
      if (char === '"' && (j === 0 || line[j - 1] !== '\\')) {
        inString = !inString;
        fixedContent += char;
        continue;
      }
      
      // Skip characters inside strings
      if (inString) {
        fixedContent += char;
        continue;
      }
      
      // Handle object start
      if (char === '{') {
        inObject = true;
        depth++;
        fixedContent += char;
        continue;
      }
      
      // Handle object end
      if (char === '}') {
        inObject = depth > 1;
        depth--;
        fixedContent += char;
        
        // Add comma if needed
        if (nextChar === '{' || nextChar === '[') {
          fixedContent += ',';
          issues++;
        }
        continue;
      }
      
      // Handle array start
      if (char === '[') {
        inArray = true;
        depth++;
        fixedContent += char;
        continue;
      }
      
      // Handle array end
      if (char === ']') {
        inArray = depth > 1;
        depth--;
        fixedContent += char;
        
        // Add comma if needed
        if (nextChar === '{' || nextChar === '[') {
          fixedContent += ',';
          issues++;
        }
        continue;
      }
      
      // Handle property separator
      if (char === ':') {
        fixedContent += char;
        continue;
      }
      
      // Handle comma
      if (char === ',') {
        fixedContent += char;
        continue;
      }
      
      // Handle missing comma between properties
      if (char === '"' && j > 0 && line[j - 1] === '"') {
        fixedContent += ',';
        issues++;
      }
      
      // Add the character
      fixedContent += char;
    }
  }
  
  // Close any open structures
  while (depth > 0) {
    if (inArray) {
      fixedContent += ']';
    } else if (inObject) {
      fixedContent += '}';
    }
    depth--;
  }
  
  // Special handling for RPG Maker MV files
  
  // Fix missing commas between properties
  fixedContent = fixedContent.replace(/"([a-zA-Z0-9_]+)":([^,\s\}\]]*)\s*"([a-zA-Z0-9_]+)":/g, (match, prop1, value, prop2) => {
    issues++;
    return `"${prop1}":${value},"${prop2}":`;
  });
  
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
    console.log(`Successfully fixed JSON for ${fileName}`);
  } catch (error) {
    console.warn(`Warning: Fixed content is still not valid JSON for ${fileName}: ${error.message}`);
    
    // Last resort: Try to manually fix the most common patterns in RPG Maker MV files
    if (isArray) {
      try {
        // For RPG Maker MV files, we know the structure is typically an array of objects
        // Let's try a more aggressive approach
        
        // Replace all instances of property without comma
        fixedContent = fixedContent.replace(/"([a-zA-Z0-9_]+)":/g, (match, prop) => {
          return `,"${prop}":`;
        });
        
        // Remove the first comma
        fixedContent = fixedContent.replace(/^\[,/, '[');
        
        // Replace all instances of object without comma
        fixedContent = fixedContent.replace(/\}\{/g, '},{');
        
        // Try to parse again
        JSON.parse(fixedContent);
        console.log(`Successfully fixed JSON with aggressive approach for ${fileName}`);
        issues += 100; // Add a large number to indicate aggressive fixing
      } catch (error) {
        console.warn(`Warning: Aggressive fixing still failed for ${fileName}: ${error.message}`);
      }
    }
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
