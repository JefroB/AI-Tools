/**
 * This code was generated using the AI-Tools toolkit: https://github.com/JefroB/AI-Tools
 * Created by Jeffrey Charles Bornhoeft with AI assistance as a Prime8 Engineering research project.
 */

/**
 * Tool Usage Analyzer Demo
 * 
 * This script demonstrates how to use the toolUsageAnalyzer module to identify
 * opportunities for using AI-Tools utilities in your codebase.
 */

const path = require('path');
const aiTools = require('../src/index');
const toolUsageAnalyzer = require('../src/toolUsageAnalyzer');

// Display a welcome message
aiTools.displayConsoleArt({
  additionalMessage: 'Tool Usage Analyzer Demo - Identify opportunities to use AI-Tools utilities'
});

// Define the directory to analyze
const directoryToAnalyze = process.argv[2] || path.join(__dirname, '../examples');

// Define the output path for the report
const outputPath = path.join(process.cwd(), 'ai-tools-usage-report.md');

console.log(`Analyzing directory: ${directoryToAnalyze}`);
console.log(`Report will be saved to: ${outputPath}`);
console.log('');

// Analyze the directory and generate a report
async function runAnalysis() {
  try {
    console.log('Starting analysis...');
    
    // Use the toolUsageAnalyzer to analyze the directory and generate a report
    const reportPath = await toolUsageAnalyzer.analyzeAndGenerateReport(directoryToAnalyze, {
      recursive: true,
      filePattern: '.js',
      outputPath
    });
    
    console.log(`Analysis complete! Report saved to: ${reportPath}`);
    console.log('');
    
    // Display a summary of the patterns that were checked
    console.log('Patterns checked for AI-Tools usage opportunities:');
    Object.entries(toolUsageAnalyzer.PATTERNS).forEach(([name, { suggestion }]) => {
      console.log(`- ${name}: ${suggestion}`);
    });
    
    // Display success message
    aiTools.displaySuccess('Analysis completed successfully!');
    
    // Provide next steps
    console.log('Next steps:');
    console.log('1. Review the generated report for AI-Tools usage opportunities');
    console.log('2. Update your code to use AI-Tools utilities where appropriate');
    console.log('3. Run this analysis periodically to ensure consistent usage of AI-Tools');
    console.log('');
    console.log('For more information, see the AI-Tools Usage Ruleset:');
    console.log('docs/AI_TOOLS_USAGE_RULESET.md');
  } catch (error) {
    console.error('Error during analysis:', error);
    aiTools.displayError('Analysis failed. See error details above.');
  }
}

// Run the analysis
runAnalysis();

/**
 * Usage:
 * 
 * node examples/tool-usage-analyzer-demo.js [directory-to-analyze]
 * 
 * If no directory is specified, it will analyze the examples directory.
 */
