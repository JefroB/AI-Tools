/**
 * Tool Usage Tracker Demo
 * 
 * This example demonstrates how to use the Tool Usage Tracker to monitor
 * function calls, estimate token savings, and analyze efficiency.
 */

const fs = require('fs-extra');
const path = require('path');
const { performance } = require('perf_hooks');

// Import the toolUsageTracker
const toolUsageTracker = require('../src/toolUsageTracker');

// Import metricsUtils for cross-referencing
const metricsUtils = require('../src/metricsUtils');

// Sample functions to track
async function readSampleFile(filePath) {
  return fs.readFile(filePath, 'utf8');
}

async function writeSampleFile(filePath, content) {
  await fs.ensureDir(path.dirname(filePath));
  return fs.writeFile(filePath, content);
}

async function formatSampleCode(code) {
  // Simple formatting: add indentation to blocks
  return code.replace(/\{([^{}]*)\}/g, '{\n  $1\n}');
}

async function makeApiRequest(url) {
  // Simulate API request
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, data: { message: 'API response' } };
}

// Create proxied versions of the functions
const fileUtils = {
  readFile: toolUsageTracker.createToolProxy(readSampleFile, 'fileUtils'),
  writeFile: toolUsageTracker.createToolProxy(writeSampleFile, 'fileUtils')
};

const codeUtils = {
  formatCode: toolUsageTracker.createToolProxy(formatSampleCode, 'codeUtils')
};

const apiUtils = {
  makeRequest: toolUsageTracker.createToolProxy(makeApiRequest, 'apiUtils', {
    // Custom sanitizer for API requests
    argumentSanitizer: (arg) => {
      if (typeof arg === 'string' && arg.startsWith('http')) {
        // Redact query parameters for privacy
        return arg.split('?')[0];
      }
      return arg;
    }
  })
};

// Demo function
async function runDemo() {
  console.log('=== Tool Usage Tracker Demo ===\n');
  
  // Initialize the tracker with custom config
  await toolUsageTracker.initialize({
    storageDir: path.resolve('test-demo-output/tool-usage'),
    sampling: {
      enabled: false // Disable sampling for demo
    }
  });
  
  console.log('Running sample operations...\n');
  
  // Create a test directory
  const testDir = path.resolve('test-demo-output/tool-usage-demo');
  await fs.ensureDir(testDir);
  
  // Sample file operations
  const sampleFilePath = path.join(testDir, 'sample.txt');
  await fileUtils.writeFile(sampleFilePath, 'This is a sample file for the tool usage tracker demo.');
  const fileContent = await fileUtils.readFile(sampleFilePath);
  console.log(`Read file content: "${fileContent}"\n`);
  
  // Sample code formatting
  const sampleCode = 'function hello() {console.log("Hello, world!");}';
  const formattedCode = await codeUtils.formatCode(sampleCode);
  console.log(`Formatted code:\n${formattedCode}\n`);
  
  // Sample API request
  const apiResponse = await apiUtils.makeRequest('https://example.com/api?key=secret');
  console.log(`API response: ${JSON.stringify(apiResponse)}\n`);
  
  // Get tool usage metrics
  const metrics = toolUsageTracker.getToolUsageMetrics();
  console.log('Tool Usage Metrics:');
  console.log(`- Total calls: ${metrics.metrics.totalCalls}`);
  console.log(`- Total execution time: ${metrics.metrics.totalExecutionTime.toFixed(2)}ms`);
  console.log(`- Total estimated token savings: ${metrics.metrics.totalEstimatedTokenSavings}`);
  console.log();
  
  // Visualize tool usage
  const visualization = toolUsageTracker.visualizeToolUsage(metrics);
  console.log(visualization);
  
  // Cross-reference with Claude token usage
  try {
    // Initialize metrics module if not already initialized
    if (typeof metricsUtils.initialize === 'function') {
      await metricsUtils.initialize({
        storageDir: path.resolve('test-demo-output/metrics')
      });
    }
    
    // Record some sample Claude API usage
    metricsUtils.recordMetric('api', 'call', 1, {
      tokens: { prompt: 500, completion: 300 },
      costs: { prompt: 0.01, completion: 0.01 },
      latency: 2000
    });
    
    // Cross-reference
    const crossReference = await toolUsageTracker.crossReferenceWithClaudeUsage();
    console.log('Cross-Reference Analysis:');
    console.log(`- Total tokens saved: ${crossReference.summary.totalTokensSaved}`);
    console.log(`- Total tokens used: ${crossReference.summary.totalTokensUsed}`);
    console.log(`- Efficiency ratio: ${(crossReference.summary.efficiencyRatio * 100).toFixed(2)}%`);
    console.log(`- Estimated cost saved: $${crossReference.summary.costSaved.toFixed(4)}`);
    console.log();
    
    // Generate analysis report
    const report = await toolUsageTracker.generateAnalysisReport();
    console.log('Analysis Report:');
    console.log('- Summary:');
    Object.entries(report.summary).forEach(([key, value]) => {
      if (typeof value === 'number') {
        console.log(`  - ${key}: ${value.toFixed(2)}`);
      } else {
        console.log(`  - ${key}: ${value}`);
      }
    });
    
    // Show recommendations
    if (report.recommendations && report.recommendations.length > 0) {
      console.log('- Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`  - [${rec.impact.toUpperCase()}] ${rec.title}: ${rec.description}`);
      });
    }
  } catch (error) {
    console.error('Error in cross-reference:', error);
  }
  
  console.log('\nDemo completed!');
}

// Run the demo
runDemo().catch(console.error);
