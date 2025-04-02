/**
 * AI-Tools Codebase Analysis Script
 * 
 * This script analyzes a codebase and generates a comprehensive report
 * including file statistics, code complexity, and potential issues.
 */

const aiTools = require('./src/index');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  // Directory to analyze (default: current project)
  targetDir: './src',
  
  // Output directory for reports
  outputDir: './analysis-output',
  
  // File patterns to include
  includePatterns: ['.js', '.jsx', '.ts', '.tsx'],
  
  // Patterns to ignore
  ignorePatterns: ['node_modules/**', '.git/**', '**/test/**', '**/dist/**'],
  
  // Maximum depth for directory traversal
  maxDepth: 5,
  
  // Code complexity thresholds
  thresholds: {
    fileSize: 1000, // lines
    functionSize: 50, // lines
    parameterCount: 5,
    cyclomaticComplexity: 10
  }
};

/**
 * Calculate cyclomatic complexity (simplified version)
 * @param {string} code - Code to analyze
 * @returns {number} - Estimated cyclomatic complexity
 */
function calculateComplexity(code) {
  // Count decision points (simplified)
  const ifCount = (code.match(/if\s*\(/g) || []).length;
  const forCount = (code.match(/for\s*\(/g) || []).length;
  const whileCount = (code.match(/while\s*\(/g) || []).length;
  const switchCount = (code.match(/switch\s*\(/g) || []).length;
  const caseCount = (code.match(/case\s+/g) || []).length;
  const catchCount = (code.match(/catch\s*\(/g) || []).length;
  const ternaryCount = (code.match(/\?.*:/g) || []).length;
  const andOrCount = (code.match(/&&|\|\|/g) || []).length;
  
  // Base complexity is 1
  return 1 + ifCount + forCount + whileCount + switchCount + caseCount + catchCount + ternaryCount + andOrCount;
}

/**
 * Analyze a single file
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeFile(filePath) {
  try {
    // Read file content
    const content = await aiTools.readFile(filePath);
    const lines = content.split('\n');
    
    // Basic file stats
    const fileStats = {
      path: filePath,
      name: path.basename(filePath),
      extension: path.extname(filePath),
      lineCount: lines.length,
      size: fs.statSync(filePath).size,
      lastModified: fs.statSync(filePath).mtime
    };
    
    // Check if file is too large
    const issues = [];
    if (lines.length > config.thresholds.fileSize) {
      issues.push({
        type: 'file_size',
        severity: 'medium',
        message: `File has ${lines.length} lines, which exceeds the threshold of ${config.thresholds.fileSize} lines`
      });
    }
    
    // Find functions and analyze them
    const functions = [];
    try {
      // Use regex to find function declarations (simplified)
      const functionMatches = content.match(/function\s+(\w+)\s*\([^)]*\)\s*{|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|const\s+(\w+)\s*=\s*function\s*\([^)]*\)/g) || [];
      
      for (const match of functionMatches) {
        // Extract function name
        const nameMatch = match.match(/function\s+(\w+)|const\s+(\w+)\s*=/);
        const name = nameMatch ? (nameMatch[1] || nameMatch[2]) : 'anonymous';
        
        // Extract parameters
        const paramsMatch = match.match(/\(([^)]*)\)/);
        const params = paramsMatch ? paramsMatch[1].split(',').filter(p => p.trim()) : [];
        
        // Find function body (simplified approach)
        const startIndex = content.indexOf(match);
        let braceCount = 0;
        let endIndex = startIndex;
        let foundOpeningBrace = false;
        
        // Scan for matching braces to find function end
        for (let i = startIndex; i < content.length; i++) {
          if (content[i] === '{') {
            foundOpeningBrace = true;
            braceCount++;
          } else if (content[i] === '}') {
            braceCount--;
            if (foundOpeningBrace && braceCount === 0) {
              endIndex = i;
              break;
            }
          }
        }
        
        // Extract function body
        const body = content.substring(startIndex, endIndex + 1);
        const bodyLines = body.split('\n');
        
        // Calculate complexity
        const complexity = calculateComplexity(body);
        
        // Check for issues
        const functionIssues = [];
        
        if (bodyLines.length > config.thresholds.functionSize) {
          functionIssues.push({
            type: 'function_size',
            severity: 'medium',
            message: `Function has ${bodyLines.length} lines, which exceeds the threshold of ${config.thresholds.functionSize} lines`
          });
        }
        
        if (params.length > config.thresholds.parameterCount) {
          functionIssues.push({
            type: 'parameter_count',
            severity: 'medium',
            message: `Function has ${params.length} parameters, which exceeds the threshold of ${config.thresholds.parameterCount} parameters`
          });
        }
        
        if (complexity > config.thresholds.cyclomaticComplexity) {
          functionIssues.push({
            type: 'cyclomatic_complexity',
            severity: 'high',
            message: `Function has a cyclomatic complexity of ${complexity}, which exceeds the threshold of ${config.thresholds.cyclomaticComplexity}`
          });
        }
        
        functions.push({
          name,
          paramCount: params.length,
          lineCount: bodyLines.length,
          complexity,
          issues: functionIssues
        });
        
        // Add function issues to file issues
        issues.push(...functionIssues.map(issue => ({
          ...issue,
          location: `function ${name}`
        })));
      }
    } catch (error) {
      console.warn(`Error analyzing functions in ${filePath}: ${error.message}`);
    }
    
    return {
      ...fileStats,
      functions,
      issues,
      complexity: functions.reduce((sum, fn) => sum + fn.complexity, 0) / (functions.length || 1)
    };
  } catch (error) {
    console.error(`Error analyzing file ${filePath}: ${error.message}`);
    return {
      path: filePath,
      name: path.basename(filePath),
      error: error.message
    };
  }
}

/**
 * Main analysis function
 */
async function analyzeCodebase() {
  try {
    // Display the console art
    aiTools.displayConsoleArt({
      theme: 'default',
      additionalMessage: 'AI-Tools Codebase Analysis'
    });
    
    console.log(`Target directory: ${config.targetDir}`);
    
    // Create output directory
    await aiTools.createDirectory(config.outputDir);
    console.log(`Created output directory: ${config.outputDir}`);
    
    // Get all files to analyze
    console.log(`\nListing files in ${config.targetDir}...`);
    const allFiles = await aiTools.listFiles(config.targetDir, {
      recursive: true,
      fullPaths: true
    });
    
    // Filter files based on patterns
    const filesToAnalyze = allFiles.filter(file => {
      // Check if file matches include patterns
      const shouldInclude = config.includePatterns.some(pattern => 
        file.endsWith(pattern)
      );
      
      // Check if file matches ignore patterns
      const shouldIgnore = config.ignorePatterns.some(pattern => {
        if (pattern.endsWith('/**')) {
          const dir = pattern.slice(0, -3);
          return file.includes(dir);
        }
        return file.includes(pattern);
      });
      
      return shouldInclude && !shouldIgnore;
    });
    
    console.log(`Found ${filesToAnalyze.length} files to analyze`);
    
    // Analyze each file
    console.log(`\nAnalyzing files...`);
    const analysisResults = [];
    let totalIssues = 0;
    
    for (let i = 0; i < filesToAnalyze.length; i++) {
      const file = filesToAnalyze[i];
      console.log(`Analyzing file ${i + 1}/${filesToAnalyze.length}: ${file}`);
      
      const result = await analyzeFile(file);
      analysisResults.push(result);
      
      if (result.issues) {
        totalIssues += result.issues.length;
      }
    }
    
    // Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      targetDirectory: config.targetDir,
      filesAnalyzed: filesToAnalyze.length,
      totalIssues,
      issuesByType: {},
      largestFiles: [...analysisResults]
        .sort((a, b) => b.lineCount - a.lineCount)
        .slice(0, 10)
        .map(file => ({
          path: file.path,
          lineCount: file.lineCount
        })),
      mostComplexFiles: [...analysisResults]
        .sort((a, b) => b.complexity - a.complexity)
        .slice(0, 10)
        .map(file => ({
          path: file.path,
          complexity: file.complexity
        }))
    };
    
    // Count issues by type
    for (const result of analysisResults) {
      if (result.issues) {
        for (const issue of result.issues) {
          summary.issuesByType[issue.type] = (summary.issuesByType[issue.type] || 0) + 1;
        }
      }
    }
    
    // Save detailed results
    await aiTools.writeFile(
      path.join(config.outputDir, 'analysis-results.json'),
      analysisResults
    );
    console.log(`\nSaved detailed analysis results to ${path.join(config.outputDir, 'analysis-results.json')}`);
    
    // Save summary
    await aiTools.writeFile(
      path.join(config.outputDir, 'analysis-summary.json'),
      summary
    );
    console.log(`Saved analysis summary to ${path.join(config.outputDir, 'analysis-summary.json')}`);
    
    // Generate HTML report
    console.log(`\nGenerating HTML report...`);
    
    // Create HTML report
    let htmlReport = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Codebase Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 30px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
    .issues { background: #fff8f8; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
    .files { background: #f8f8ff; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    .high { color: #d9534f; }
    .medium { color: #f0ad4e; }
    .low { color: #5bc0de; }
    .timestamp { color: #888; font-style: italic; }
  </style>
</head>
<body>
  <h1>Codebase Analysis Report</h1>
  <p class="timestamp">Generated on: ${summary.timestamp}</p>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Target Directory: ${summary.targetDirectory}</p>
    <p>Files Analyzed: ${summary.filesAnalyzed}</p>
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
  </div>
  
  <div class="files">
    <h2>Largest Files</h2>
    <table>
      <tr>
        <th>File</th>
        <th>Line Count</th>
      </tr>
      ${summary.largestFiles.map(file => `
      <tr>
        <td>${file.path}</td>
        <td>${file.lineCount}</td>
      </tr>
      `).join('')}
    </table>
    
    <h2>Most Complex Files</h2>
    <table>
      <tr>
        <th>File</th>
        <th>Complexity</th>
      </tr>
      ${summary.mostComplexFiles.map(file => `
      <tr>
        <td>${file.path}</td>
        <td>${file.complexity.toFixed(2)}</td>
      </tr>
      `).join('')}
    </table>
  </div>
  
  <div class="issues">
    <h2>All Issues</h2>
    <table>
      <tr>
        <th>File</th>
        <th>Location</th>
        <th>Type</th>
        <th>Severity</th>
        <th>Message</th>
      </tr>
      ${analysisResults.flatMap(file => 
        (file.issues || []).map(issue => `
        <tr>
          <td>${file.name}</td>
          <td>${issue.location || 'file'}</td>
          <td>${issue.type.replace(/_/g, ' ')}</td>
          <td class="${issue.severity}">${issue.severity}</td>
          <td>${issue.message}</td>
        </tr>
        `)
      ).join('')}
    </table>
  </div>
</body>
</html>`;
    
    // Save HTML report
    await aiTools.writeFile(
      path.join(config.outputDir, 'analysis-report.html'),
      htmlReport
    );
    console.log(`Saved HTML report to ${path.join(config.outputDir, 'analysis-report.html')}`);
    
    // Display success message with console art
    aiTools.displaySuccess(`Analysis completed successfully!\nAll output files are in: ${config.outputDir}`);
    
  } catch (error) {
    // Display error message with console art
    aiTools.displayError(`Error analyzing codebase: ${error.message}`);
  }
}

// Run the analysis
analyzeCodebase();
