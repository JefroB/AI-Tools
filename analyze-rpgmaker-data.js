/**
 * RPG Maker MV Data Analyzer and Fixer using AI-Tools
 * 
 * This script analyzes and fixes RPG Maker MV data files using the AI-Tools library.
 * It provides more comprehensive analysis and fixing capabilities than the basic script.
 * 
 * Usage:
 * node analyze-rpgmaker-data.js <path-to-data-directory>
 */

const aiTools = require('./src/index');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  // Directory containing RPG Maker MV data files
  dataDir: process.argv[2] || 'D:\\MegaEarth2049-master\\data',
  
  // Output directory for reports and fixed files
  outputDir: './rpgmaker-analysis',
  
  // Whether to create backups of original files
  createBackups: true,
  
  // Whether to fix issues automatically
  autoFix: true,
  
  // File patterns to process
  filePatterns: [
    '*.json'
  ],
  
  // Files to exclude
  excludeFiles: [
    'MapInfos.json' // This file might have a different structure
  ],
  
  // JavaScript validation options
  jsValidation: {
    checkSemicolons: true,
    checkQuotes: true,
    checkArrowFunctions: true,
    checkVarDeclarations: true
  }
};

/**
 * Main function
 */
async function main() {
  // Display the console art
  aiTools.displayConsoleArt({
    theme: 'default',
    additionalMessage: 'RPG Maker MV Data Analyzer and Fixer'
  });
  
  console.log(`Data directory: ${config.dataDir}`);
  
  // Check if data directory exists
  if (!fs.existsSync(config.dataDir)) {
    console.error(`Error: Data directory not found: ${config.dataDir}`);
    process.exit(1);
  }
  
  // Create output directory
  await aiTools.createDirectory(config.outputDir);
  console.log(`Created output directory: ${config.outputDir}`);
  
  // Get list of JSON files
  const files = await getJsonFiles(config.dataDir);
  console.log(`Found ${files.length} JSON files`);
  
  // Analyze files
  const analysisResults = await analyzeFiles(files);
  
  // Generate report
  await generateReport(analysisResults);
  
  // Fix files if enabled
  if (config.autoFix) {
    await fixFiles(analysisResults);
  }
  
  // Display success message with console art
  aiTools.displaySuccess(`Analysis completed. Results saved to ${config.outputDir}`);
}

/**
 * Get list of JSON files in directory
 * @param {string} dir - Directory path
 * @returns {Promise<string[]>} - List of file paths
 */
async function getJsonFiles(dir) {
  const files = await aiTools.listFiles(dir, {
    recursive: false,
    fullPaths: true
  });
  
  return files.filter(file => {
    const fileName = path.basename(file);
    
    // Check if file matches patterns
    const isMatch = config.filePatterns.some(pattern => {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(fileName);
    });
    
    // Check if file is excluded
    const isExcluded = config.excludeFiles.includes(fileName);
    
    return isMatch && !isExcluded;
  });
}

/**
 * Analyze RPG Maker MV data files
 * @param {string[]} files - List of file paths
 * @returns {Promise<Object[]>} - Analysis results
 */
async function analyzeFiles(files) {
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`Analyzing file ${i + 1}/${files.length}: ${path.basename(file)}`);
    
    try {
      // Read file content
      const content = await aiTools.readFile(file);
      
      // Analyze file
      const result = analyzeFile(file, content);
      results.push(result);
      
      console.log(`  Found ${result.issues.length} issues`);
    } catch (error) {
      console.error(`  Error analyzing file: ${error.message}`);
      results.push({
        file,
        content: '',
        issues: [{
          type: 'error',
          message: `Failed to analyze file: ${error.message}`,
          line: 0,
          column: 0,
          severity: 'error'
        }],
        fixable: false
      });
    }
  }
  
  return results;
}

/**
 * Analyze a single RPG Maker MV data file
 * @param {string} file - File path
 * @param {string} content - File content
 * @returns {Object} - Analysis result
 */
function analyzeFile(file, content) {
  const issues = [];
  let fixable = true;
  
  // Check for missing commas between properties
  const missingCommas = findMissingCommas(content);
  issues.push(...missingCommas);
  
  // Check for JavaScript issues in note fields
  const jsIssues = findJavaScriptIssues(content);
  issues.push(...jsIssues);
  
  // Check if file is valid JSON
  try {
    JSON.parse(content);
  } catch (error) {
    issues.push({
      type: 'invalid_json',
      message: `Invalid JSON: ${error.message}`,
      line: 0,
      column: 0,
      severity: 'error'
    });
    fixable = false;
  }
  
  return {
    file,
    content,
    issues,
    fixable
  };
}

/**
 * Find missing commas between properties in JSON
 * @param {string} content - File content
 * @returns {Object[]} - List of issues
 */
function findMissingCommas(content) {
  const issues = [];
  const regex = /"([a-zA-Z0-9_]+)":([^,\s}])\s*"([a-zA-Z0-9_]+)":/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const [fullMatch, prop1, value, prop2] = match;
    
    issues.push({
      type: 'missing_comma',
      message: `Missing comma between "${prop1}" and "${prop2}"`,
      line: getLineNumber(content, match.index),
      column: getColumnNumber(content, match.index),
      index: match.index,
      length: fullMatch.length,
      prop1,
      value,
      prop2,
      severity: 'error',
      fixable: true
    });
  }
  
  return issues;
}

/**
 * Find JavaScript issues in note fields
 * @param {string} content - File content
 * @returns {Object[]} - List of issues
 */
function findJavaScriptIssues(content) {
  const issues = [];
  const noteRegex = /"note":"((?:\\"|[^"])*)"/g;
  let match;
  
  while ((match = noteRegex.exec(content)) !== null) {
    const [fullMatch, noteContent] = match;
    
    // Skip empty notes
    if (!noteContent) continue;
    
    // Check for missing semicolons
    if (config.jsValidation.checkSemicolons) {
      const semicolonRegex = /([^;{])\s*\n\s*([a-zA-Z$_])/g;
      let semicolonMatch;
      
      while ((semicolonMatch = semicolonRegex.exec(noteContent)) !== null) {
        issues.push({
          type: 'missing_semicolon',
          message: 'Missing semicolon in JavaScript code',
          line: getLineNumber(content, match.index + semicolonMatch.index + 7), // 7 for "note":"
          column: getColumnNumber(content, match.index + semicolonMatch.index + 7),
          index: match.index + semicolonMatch.index + 7,
          length: semicolonMatch[0].length,
          severity: 'warning',
          fixable: true
        });
      }
    }
    
    // Check for unescaped quotes
    if (config.jsValidation.checkQuotes) {
      const quoteRegex = /([^\\])"/g;
      let quoteMatch;
      
      while ((quoteMatch = quoteRegex.exec(noteContent)) !== null) {
        if (quoteMatch[0] === '\\"') continue; // Already escaped
        
        issues.push({
          type: 'unescaped_quote',
          message: 'Unescaped quote in JavaScript code',
          line: getLineNumber(content, match.index + quoteMatch.index + 7),
          column: getColumnNumber(content, match.index + quoteMatch.index + 7),
          index: match.index + quoteMatch.index + 7,
          length: quoteMatch[0].length,
          severity: 'error',
          fixable: true
        });
      }
    }
    
    // Check for arrow functions
    if (config.jsValidation.checkArrowFunctions) {
      const arrowRegex = /\(([^)]*)\)\s*=>\s*{/g;
      let arrowMatch;
      
      while ((arrowMatch = arrowRegex.exec(noteContent)) !== null) {
        issues.push({
          type: 'arrow_function',
          message: 'Arrow function used in JavaScript code (may not be supported by older plugins)',
          line: getLineNumber(content, match.index + arrowMatch.index + 7),
          column: getColumnNumber(content, match.index + arrowMatch.index + 7),
          index: match.index + arrowMatch.index + 7,
          length: arrowMatch[0].length,
          severity: 'warning',
          fixable: true
        });
      }
    }
    
    // Check for let/const declarations
    if (config.jsValidation.checkVarDeclarations) {
      const varRegex = /\b(let|const)\b\s+([a-zA-Z$_][a-zA-Z0-9$_]*)/g;
      let varMatch;
      
      while ((varMatch = varRegex.exec(noteContent)) !== null) {
        issues.push({
          type: 'modern_var_declaration',
          message: `"${varMatch[1]}" used in JavaScript code (may not be supported by older plugins)`,
          line: getLineNumber(content, match.index + varMatch.index + 7),
          column: getColumnNumber(content, match.index + varMatch.index + 7),
          index: match.index + varMatch.index + 7,
          length: varMatch[0].length,
          severity: 'warning',
          fixable: true
        });
      }
    }
  }
  
  return issues;
}

/**
 * Get line number for a position in text
 * @param {string} text - Text content
 * @param {number} index - Character index
 * @returns {number} - Line number (1-based)
 */
function getLineNumber(text, index) {
  const lines = text.substring(0, index).split('\n');
  return lines.length;
}

/**
 * Get column number for a position in text
 * @param {string} text - Text content
 * @param {number} index - Character index
 * @returns {number} - Column number (1-based)
 */
function getColumnNumber(text, index) {
  const lines = text.substring(0, index).split('\n');
  return lines[lines.length - 1].length + 1;
}

/**
 * Generate analysis report
 * @param {Object[]} results - Analysis results
 * @returns {Promise<void>}
 */
async function generateReport(results) {
  // Create summary
  const summary = {
    totalFiles: results.length,
    filesWithIssues: results.filter(r => r.issues.length > 0).length,
    totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
    issuesByType: {},
    issuesBySeverity: {
      error: 0,
      warning: 0,
      info: 0
    },
    fixableIssues: 0,
    unfixableIssues: 0
  };
  
  // Count issues by type and severity
  for (const result of results) {
    for (const issue of result.issues) {
      // Count by type
      summary.issuesByType[issue.type] = (summary.issuesByType[issue.type] || 0) + 1;
      
      // Count by severity
      summary.issuesBySeverity[issue.severity] = (summary.issuesBySeverity[issue.severity] || 0) + 1;
      
      // Count fixable issues
      if (issue.fixable) {
        summary.fixableIssues++;
      } else {
        summary.unfixableIssues++;
      }
    }
  }
  
  // Save detailed results
  await aiTools.writeFile(
    path.join(config.outputDir, 'analysis-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  // Save summary
  await aiTools.writeFile(
    path.join(config.outputDir, 'analysis-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  // Generate HTML report
  await generateHtmlReport(results, summary);
}

/**
 * Generate HTML report
 * @param {Object[]} results - Analysis results
 * @param {Object} summary - Analysis summary
 * @returns {Promise<void>}
 */
async function generateHtmlReport(results, summary) {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RPG Maker MV Data Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 30px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
    .issues { background: #fff8f8; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    .error { color: #d9534f; }
    .warning { color: #f0ad4e; }
    .info { color: #5bc0de; }
    .fixable { color: #5cb85c; }
    .unfixable { color: #d9534f; }
  </style>
</head>
<body>
  <h1>RPG Maker MV Data Analysis Report</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Total Files: ${summary.totalFiles}</p>
    <p>Files with Issues: ${summary.filesWithIssues}</p>
    <p>Total Issues: ${summary.totalIssues}</p>
    
    <h3>Issues by Type</h3>
    <table>
      <tr>
        <th>Issue Type</th>
        <th>Count</th>
      </tr>
      ${Object.entries(summary.issuesByType).map(([type, count]) => `
      <tr>
        <td>${type.replace(/_/g, ' ')}</td>
        <td>${count}</td>
      </tr>
      `).join('')}
    </table>
    
    <h3>Issues by Severity</h3>
    <table>
      <tr>
        <th>Severity</th>
        <th>Count</th>
      </tr>
      ${Object.entries(summary.issuesBySeverity).map(([severity, count]) => `
      <tr>
        <td class="${severity}">${severity}</td>
        <td>${count}</td>
      </tr>
      `).join('')}
    </table>
    
    <h3>Fixability</h3>
    <table>
      <tr>
        <th>Status</th>
        <th>Count</th>
      </tr>
      <tr>
        <td class="fixable">Fixable</td>
        <td>${summary.fixableIssues}</td>
      </tr>
      <tr>
        <td class="unfixable">Unfixable</td>
        <td>${summary.unfixableIssues}</td>
      </tr>
    </table>
  </div>
  
  <div class="issues">
    <h2>Issues by File</h2>
    ${results.map(result => `
    <h3>${path.basename(result.file)}</h3>
    ${result.issues.length === 0 ? '<p>No issues found</p>' : `
    <table>
      <tr>
        <th>Type</th>
        <th>Message</th>
        <th>Line</th>
        <th>Column</th>
        <th>Severity</th>
        <th>Fixable</th>
      </tr>
      ${result.issues.map(issue => `
      <tr>
        <td>${issue.type.replace(/_/g, ' ')}</td>
        <td>${issue.message}</td>
        <td>${issue.line}</td>
        <td>${issue.column}</td>
        <td class="${issue.severity}">${issue.severity}</td>
        <td class="${issue.fixable ? 'fixable' : 'unfixable'}">${issue.fixable ? 'Yes' : 'No'}</td>
      </tr>
      `).join('')}
    </table>
    `}
    `).join('')}
  </div>
</body>
</html>`;

  await aiTools.writeFile(
    path.join(config.outputDir, 'analysis-report.html'),
    html
  );
}

/**
 * Fix issues in files
 * @param {Object[]} results - Analysis results
 * @returns {Promise<void>}
 */
async function fixFiles(results) {
  console.log('\nFixing issues in files...');
  
  let fixedFiles = 0;
  let fixedIssues = 0;
  
  for (const result of results) {
    // Skip files with no issues or unfixable files
    if (result.issues.length === 0 || !result.fixable) {
      continue;
    }
    
    try {
      // Fix issues in file
      const fixResult = fixFileIssues(result);
      
      if (fixResult.fixed) {
        // Create backup if enabled
        if (config.createBackups) {
          const backupPath = path.join(config.outputDir, path.basename(result.file) + '.bak');
          await aiTools.writeFile(backupPath, result.content);
        }
        
        // Write fixed content
        await aiTools.writeFile(result.file, fixResult.content);
        
        fixedFiles++;
        fixedIssues += fixResult.fixedIssues;
        
        console.log(`Fixed ${fixResult.fixedIssues} issues in ${path.basename(result.file)}`);
      }
    } catch (error) {
      console.error(`Error fixing file ${result.file}: ${error.message}`);
    }
  }
  
  console.log(`\nFixed ${fixedIssues} issues in ${fixedFiles} files`);
}

/**
 * Fix issues in a single file
 * @param {Object} result - Analysis result
 * @returns {Object} - Fix result
 */
function fixFileIssues(result) {
  let content = result.content;
  let fixedIssues = 0;
  
  // Fix missing commas
  const missingCommaIssues = result.issues.filter(issue => issue.type === 'missing_comma');
  if (missingCommaIssues.length > 0) {
    content = content.replace(/"([a-zA-Z0-9_]+)":([^,\s}])\s*"([a-zA-Z0-9_]+)":/g, (match, prop1, value, prop2) => {
      fixedIssues++;
      return `"${prop1}":${value},"${prop2}":`;
    });
  }
  
  // Fix JavaScript issues in note fields
  const noteRegex = /"note":"((?:\\"|[^"])*)"/g;
  content = content.replace(noteRegex, (match, noteContent) => {
    // Skip empty notes
    if (!noteContent) return match;
    
    let fixedNote = noteContent;
    
    // Fix missing semicolons
    if (config.jsValidation.checkSemicolons) {
      fixedNote = fixedNote.replace(/([^;{])\s*\n\s*([a-zA-Z$_])/g, (match, before, after) => {
        fixedIssues++;
        return `${before};\n${after}`;
      });
    }
    
    // Fix unescaped quotes
    if (config.jsValidation.checkQuotes) {
      fixedNote = fixedNote.replace(/([^\\])"/g, (match, before) => {
        if (match === '\\"') return match; // Already escaped
        fixedIssues++;
        return `${before}\\"`;
      });
    }
    
    // Fix arrow functions
    if (config.jsValidation.checkArrowFunctions) {
      fixedNote = fixedNote.replace(/\(([^)]*)\)\s*=>\s*{/g, (match, params) => {
        fixedIssues++;
        return `function(${params}) {`;
      });
    }
    
    // Fix let/const to var
    if (config.jsValidation.checkVarDeclarations) {
      fixedNote = fixedNote.replace(/\b(let|const)\b\s+([a-zA-Z$_][a-zA-Z0-9$_]*)/g, (match, keyword, varName) => {
        fixedIssues++;
        return `var ${varName}`;
      });
    }
    
    // Return fixed note
    return `"note":"${fixedNote}"`;
  });
  
  return {
    content,
    fixed: fixedIssues > 0,
    fixedIssues
  };
}

// Run the script
main().catch(error => {
  // Display error message with console art
  aiTools.displayError(`Error: ${error.message}`);
  process.exit(1);
});
