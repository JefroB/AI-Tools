/**
 * This code was generated using the AI-Tools toolkit: https://github.com/JefroB/AI-Tools
 * Created by Jeffrey Charles Bornhoeft with AI assistance as a Prime8 Engineering research project.
 */

/**
 * Tool Usage Analyzer
 * 
 * This module provides utilities for analyzing code to identify opportunities
 * for using AI-Tools utilities. It helps ensure consistent usage of the toolkit
 * and identifies areas where the toolkit could be extended.
 */

const fs = require('fs');
const path = require('path');

// Import AI-Tools utilities
const fileUtils = require('./fileUtils');
const codeUtils = require('./codeUtils');
const metricsUtils = require('./metricsUtils');

// Patterns to look for in code
const PATTERNS = {
  // File operations that could use fileUtils
  fileOperations: {
    pattern: /(?:fs|require\(['"]fs['"]\))\.(?:readFile|writeFile|appendFile|existsSync|mkdirSync|readdir)/g,
    suggestion: 'Consider using AI-Tools fileUtils for enhanced file operations with better error handling and automatic directory creation.',
    aiToolsAlternative: 'fileUtils.readFile, fileUtils.writeFile, fileUtils.appendFile, fileUtils.fileExists, dirUtils.createDirectory, dirUtils.listFiles'
  },
  
  // Path operations that could use path utilities
  pathOperations: {
    pattern: /path\.(?:join|resolve|dirname|basename)/g,
    suggestion: 'Ensure cross-platform compatibility by using AI-Tools path utilities consistently.',
    aiToolsAlternative: 'Use consistent path handling through fileUtils and dirUtils'
  },
  
  // API calls that could use API utilities
  apiCalls: {
    pattern: /(?:fetch|axios|http\.request|https\.request|request\(|\.get\(|\.post\(|\.put\(|\.delete\()/g,
    suggestion: 'Consider using AI-Tools apiUtils for enhanced API operations with retry logic, throttling, and caching.',
    aiToolsAlternative: 'apiUtils.batchRequests, apiUtils.retryWithBackoff, apiUtils.throttleApiCalls'
  },
  
  // Error handling that could be improved
  errorHandling: {
    pattern: /try\s*{[^}]*}\s*catch\s*\([^)]*\)\s*{[^}]*}/g,
    suggestion: 'Consider using AI-Tools error handling patterns for more consistent error management.',
    aiToolsAlternative: 'See error handling patterns in the toolkit documentation'
  },
  
  // Caching opportunities
  cachingOpportunities: {
    pattern: /function\s+(\w+)\s*\([^)]*\)\s*{[^}]*return[^}]*}/g,
    suggestion: 'Consider using AI-Tools memoization for caching function results.',
    aiToolsAlternative: 'memoizeUtils.memoize, memoizeUtils.memoizeAsync'
  },
  
  // Validation opportunities
  validationOpportunities: {
    pattern: /if\s*\([^)]*(?:typeof|instanceof|===|!==|==|!=)[^)]*\)\s*{[^}]*}/g,
    suggestion: 'Consider using AI-Tools validation utilities for more robust input validation.',
    aiToolsAlternative: 'validationUtils.validateInput, validationUtils.validateWithWarnings'
  }
};

/**
 * Analyzes a file for AI-Tools usage opportunities
 * 
 * @param {string} filePath - Path to the file to analyze
 * @returns {Promise<Array>} - Array of suggestions for using AI-Tools utilities
 */
async function analyzeFile(filePath) {
  try {
    // Use AI-Tools fileUtils to read the file
    const content = await fileUtils.readFile(filePath, { parse: false });
    
    // Track this analysis in metrics
    metricsUtils.recordMetric('toolUsageAnalyzer', 'fileAnalyzed', {
      filePath,
      timestamp: new Date().toISOString()
    });
    
    const suggestions = [];
    
    // Check for each pattern
    Object.entries(PATTERNS).forEach(([name, { pattern, suggestion, aiToolsAlternative }]) => {
      const matches = content.match(pattern) || [];
      
      if (matches.length > 0) {
        suggestions.push({
          type: name,
          count: matches.length,
          suggestion,
          aiToolsAlternative,
          examples: matches.slice(0, 3) // Show up to 3 examples
        });
        
        // Track this suggestion in metrics
        metricsUtils.recordMetric('toolUsageAnalyzer', 'suggestionMade', {
          filePath,
          type: name,
          count: matches.length,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return suggestions;
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error);
    return [];
  }
}

/**
 * Analyzes a directory for AI-Tools usage opportunities
 * 
 * @param {string} dirPath - Path to the directory to analyze
 * @param {Object} options - Analysis options
 * @param {boolean} options.recursive - Whether to analyze subdirectories
 * @param {string} options.filePattern - Pattern to match files to analyze
 * @returns {Promise<Object>} - Object with analysis results
 */
async function analyzeDirectory(dirPath, options = {}) {
  const { recursive = true, filePattern = '.js' } = options;
  
  try {
    // Use AI-Tools dirUtils to list files
    const files = await fileUtils.listFiles(dirPath, {
      recursive,
      filter: filePattern,
      fullPaths: true
    });
    
    const results = {
      directoryPath: dirPath,
      filesAnalyzed: 0,
      suggestionsByType: {},
      fileResults: []
    };
    
    // Analyze each file
    for (const file of files) {
      const fileSuggestions = await analyzeFile(file);
      
      if (fileSuggestions.length > 0) {
        results.filesAnalyzed++;
        
        // Add to file results
        results.fileResults.push({
          filePath: file,
          suggestions: fileSuggestions
        });
        
        // Aggregate suggestions by type
        fileSuggestions.forEach(suggestion => {
          if (!results.suggestionsByType[suggestion.type]) {
            results.suggestionsByType[suggestion.type] = {
              count: 0,
              files: []
            };
          }
          
          results.suggestionsByType[suggestion.type].count += suggestion.count;
          results.suggestionsByType[suggestion.type].files.push(file);
        });
      }
    }
    
    // Track this analysis in metrics
    metricsUtils.recordMetric('toolUsageAnalyzer', 'directoryAnalyzed', {
      dirPath,
      filesAnalyzed: results.filesAnalyzed,
      suggestionTypes: Object.keys(results.suggestionsByType),
      timestamp: new Date().toISOString()
    });
    
    return results;
  } catch (error) {
    console.error(`Error analyzing directory ${dirPath}:`, error);
    return {
      directoryPath: dirPath,
      error: error.message,
      filesAnalyzed: 0,
      suggestionsByType: {},
      fileResults: []
    };
  }
}

/**
 * Generates a report of AI-Tools usage opportunities
 * 
 * @param {Object} analysisResults - Results from analyzeDirectory
 * @returns {string} - Formatted report
 */
function generateReport(analysisResults) {
  const { directoryPath, filesAnalyzed, suggestionsByType, fileResults } = analysisResults;
  
  let report = `# AI-Tools Usage Analysis Report\n\n`;
  report += `## Summary\n\n`;
  report += `- Directory: ${directoryPath}\n`;
  report += `- Files analyzed: ${filesAnalyzed}\n`;
  report += `- Suggestion types found: ${Object.keys(suggestionsByType).length}\n\n`;
  
  report += `## Suggestions by Type\n\n`;
  
  Object.entries(suggestionsByType).forEach(([type, { count, files }]) => {
    report += `### ${type} (${count} occurrences in ${files.length} files)\n\n`;
    
    // Get the pattern details
    const patternDetails = PATTERNS[type];
    if (patternDetails) {
      report += `${patternDetails.suggestion}\n\n`;
      report += `**AI-Tools Alternative:** ${patternDetails.aiToolsAlternative}\n\n`;
    }
    
    report += `**Files with this pattern:**\n\n`;
    files.slice(0, 10).forEach(file => {
      report += `- ${file}\n`;
    });
    
    if (files.length > 10) {
      report += `- ... and ${files.length - 10} more files\n`;
    }
    
    report += `\n`;
  });
  
  report += `## Detailed Results\n\n`;
  
  fileResults.slice(0, 20).forEach(({ filePath, suggestions }) => {
    report += `### ${filePath}\n\n`;
    
    suggestions.forEach(({ type, count, suggestion, examples }) => {
      report += `- **${type}** (${count} occurrences)\n`;
      report += `  - ${suggestion}\n`;
      report += `  - Examples: ${examples.join(', ')}\n\n`;
    });
  });
  
  if (fileResults.length > 20) {
    report += `... and ${fileResults.length - 20} more files\n`;
  }
  
  return report;
}

/**
 * Analyzes a directory and generates a report
 * 
 * @param {string} dirPath - Path to the directory to analyze
 * @param {Object} options - Analysis options
 * @param {boolean} options.recursive - Whether to analyze subdirectories
 * @param {string} options.filePattern - Pattern to match files to analyze
 * @param {string} options.outputPath - Path to write the report to
 * @returns {Promise<string>} - Path to the generated report
 */
async function analyzeAndGenerateReport(dirPath, options = {}) {
  const { 
    recursive = true, 
    filePattern = '.js', 
    outputPath = path.join(process.cwd(), 'ai-tools-usage-report.md') 
  } = options;
  
  // Analyze the directory
  const results = await analyzeDirectory(dirPath, { recursive, filePattern });
  
  // Generate the report
  const report = generateReport(results);
  
  // Write the report to a file
  await fileUtils.writeFile(outputPath, report);
  
  return outputPath;
}

/**
 * Identifies potential extensions to the AI-Tools toolkit
 * 
 * @param {Object} analysisResults - Results from analyzeDirectory
 * @returns {Array} - Array of potential extensions
 */
function identifyPotentialExtensions(analysisResults) {
  const { fileResults } = analysisResults;
  const potentialExtensions = [];
  
  // Look for patterns that might indicate a need for new utilities
  const customUtilityPattern = /function\s+(\w+Utils?)\s*\(/g;
  const helperFunctionPattern = /function\s+(\w+(?:Helper|Util|Utility))\s*\(/g;
  
  fileResults.forEach(({ filePath, suggestions }) => {
    // Check the file content
    fileUtils.readFile(filePath, { parse: false })
      .then(content => {
        // Look for custom utility functions
        let match;
        while ((match = customUtilityPattern.exec(content)) !== null) {
          potentialExtensions.push({
            type: 'customUtility',
            name: match[1],
            filePath,
            suggestion: `Consider adding ${match[1]} to the AI-Tools toolkit if it provides generally useful functionality.`
          });
        }
        
        // Look for helper functions
        while ((match = helperFunctionPattern.exec(content)) !== null) {
          potentialExtensions.push({
            type: 'helperFunction',
            name: match[1],
            filePath,
            suggestion: `Consider adding ${match[1]} to the AI-Tools toolkit if it provides generally useful functionality.`
          });
        }
      })
      .catch(error => {
        console.error(`Error reading file ${filePath}:`, error);
      });
  });
  
  return potentialExtensions;
}

module.exports = {
  analyzeFile,
  analyzeDirectory,
  generateReport,
  analyzeAndGenerateReport,
  identifyPotentialExtensions,
  PATTERNS
};
