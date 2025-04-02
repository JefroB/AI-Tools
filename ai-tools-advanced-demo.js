/**
 * AI-Tools Advanced Demo
 * Demonstrates how to use AI-Tools for code analysis and refactoring
 */

const aiTools = require('./src/index');
const path = require('path');

// Async function to run the advanced demo
async function runAdvancedDemo() {
  try {
    console.log('=== AI-Tools Advanced Demo: Code Analysis & Refactoring ===\n');
    
    // Create output directory for demo
    const outputDir = './advanced-demo-output';
    await aiTools.createDirectory(outputDir);
    console.log(`Created output directory: ${outputDir}`);
    
    // 1. Project Analysis
    console.log('\n1. Project Analysis');
    console.log('-------------------');
    
    // Analyze the project structure
    console.log('Analyzing project structure...');
    const projectSummary = await aiTools.summarizeDirectory('./src', {
      recursive: true,
      ignorePatterns: ['node_modules/**', '.git/**']
    });
    
    // Write project analysis report
    const analysisReport = {
      timestamp: new Date().toISOString(),
      projectStats: {
        totalFiles: projectSummary.files,
        totalDirectories: projectSummary.subdirectories.length,
        fileTypes: projectSummary.fileTypes
      },
      moduleBreakdown: {}
    };
    
    // Analyze each module
    for (const subdir of projectSummary.subdirectoryNames || []) {
      try {
        const modulePath = path.join('./src', subdir);
        const moduleSummary = await aiTools.summarizeFile(modulePath);
        analysisReport.moduleBreakdown[subdir] = moduleSummary;
      } catch (error) {
        // Skip if not a file
        continue;
      }
    }
    
    // Save analysis report
    await aiTools.writeFile(
      path.join(outputDir, 'project-analysis.json'), 
      analysisReport
    );
    console.log(`Saved project analysis to ${path.join(outputDir, 'project-analysis.json')}`);
    
    // 2. Code Quality Assessment
    console.log('\n2. Code Quality Assessment');
    console.log('-------------------------');
    
    // Create a sample file with code smells for demonstration
    const sampleCodePath = path.join(outputDir, 'sample-with-issues.js');
    const sampleCode = `/**
 * Sample file with code quality issues
 */

// Global variable - code smell
var globalCounter = 0;

// Function with too many parameters
function processData(data, options, callback, errorHandler, logger, validator, formatter) {
  // Long function body
  if (!data) {
    errorHandler('No data provided');
    return;
  }
  
  // Duplicate code block 1
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (item.value > 100) {
      logger('Value too high: ' + item.value);
    }
  }
  
  // More code...
  
  // Duplicate code block 2
  for (let i = 0; i < options.items.length; i++) {
    const item = options.items[i];
    if (item.value > 100) {
      logger('Value too high: ' + item.value);
    }
  }
  
  // Nested conditionals - code smell
  if (options.validate) {
    if (validator) {
      if (validator.isActive) {
        if (validator.rules.length > 0) {
          // Apply validation rules
          for (let i = 0; i < validator.rules.length; i++) {
            // More code...
          }
        }
      }
    }
  }
  
  // Increment global counter - code smell
  globalCounter++;
  
  // Format and return result
  return formatter ? formatter(data) : data;
}

// Export the function
module.exports = {
  processData
};
`;

    await aiTools.writeFile(sampleCodePath, sampleCode);
    console.log(`Created sample code file with issues: ${sampleCodePath}`);
    
    // Analyze code quality
    console.log('\nAnalyzing code quality...');
    const codeQualityIssues = [
      {
        type: 'code_smell',
        severity: 'medium',
        description: 'Use of global variables',
        line: 6,
        suggestion: 'Encapsulate state within modules or classes'
      },
      {
        type: 'code_smell',
        severity: 'high',
        description: 'Function with too many parameters',
        line: 9,
        suggestion: 'Use an options object pattern instead of many parameters'
      },
      {
        type: 'code_smell',
        severity: 'medium',
        description: 'Duplicate code blocks',
        line: '14-19, 24-29',
        suggestion: 'Extract duplicate code into a separate function'
      },
      {
        type: 'code_smell',
        severity: 'high',
        description: 'Deeply nested conditionals',
        line: '33-41',
        suggestion: 'Use early returns or guard clauses to reduce nesting'
      }
    ];
    
    // Save code quality report
    await aiTools.writeFile(
      path.join(outputDir, 'code-quality-report.json'),
      {
        filePath: sampleCodePath,
        timestamp: new Date().toISOString(),
        issues: codeQualityIssues,
        summary: {
          totalIssues: codeQualityIssues.length,
          highSeverity: codeQualityIssues.filter(i => i.severity === 'high').length,
          mediumSeverity: codeQualityIssues.filter(i => i.severity === 'medium').length,
          lowSeverity: codeQualityIssues.filter(i => i.severity === 'low').length
        }
      }
    );
    console.log(`Saved code quality report to ${path.join(outputDir, 'code-quality-report.json')}`);
    
    // 3. Code Refactoring
    console.log('\n3. Code Refactoring');
    console.log('------------------');
    
    console.log('Refactoring the code with issues...');
    
    // Create refactored version of the code
    const refactoredCodePath = path.join(outputDir, 'sample-refactored.js');
    const refactoredCode = `/**
 * Sample file after refactoring
 */

// Configuration object instead of global variable
const config = {
  counter: 0
};

/**
 * Check if a value exceeds the threshold
 * @param {number} value - The value to check
 * @param {function} logger - Logger function
 */
function checkValueThreshold(value, logger) {
  if (value > 100) {
    logger('Value too high: ' + value);
  }
}

/**
 * Process data with improved structure
 * @param {Object} params - Processing parameters
 * @param {Array} params.data - Data to process
 * @param {Object} params.options - Processing options
 * @param {function} params.callback - Callback function
 * @param {function} params.errorHandler - Error handler function
 * @param {function} params.logger - Logger function
 * @param {Object} params.validator - Validator object
 * @param {function} params.formatter - Formatter function
 * @returns {*} - Processed data
 */
function processData({
  data,
  options,
  callback,
  errorHandler,
  logger,
  validator,
  formatter
}) {
  // Early return for missing data
  if (!data) {
    errorHandler('No data provided');
    return;
  }
  
  // Process data items
  for (let i = 0; i < data.length; i++) {
    checkValueThreshold(data[i].value, logger);
  }
  
  // Process option items
  if (options && options.items) {
    for (let i = 0; i < options.items.length; i++) {
      checkValueThreshold(options.items[i].value, logger);
    }
  }
  
  // Simplified validation with guard clauses
  if (!options.validate) return formatter ? formatter(data) : data;
  if (!validator) return formatter ? formatter(data) : data;
  if (!validator.isActive) return formatter ? formatter(data) : data;
  if (!validator.rules || validator.rules.length === 0) return formatter ? formatter(data) : data;
  
  // Apply validation rules
  for (let i = 0; i < validator.rules.length; i++) {
    // Validation logic here
  }
  
  // Update counter in config object
  config.counter++;
  
  // Format and return result
  return formatter ? formatter(data) : data;
}

// Export the function and config
module.exports = {
  processData,
  config
};
`;

    await aiTools.writeFile(refactoredCodePath, refactoredCode);
    console.log(`Created refactored code file: ${refactoredCodePath}`);
    
    // Generate diff between original and refactored code
    console.log('\nGenerating diff between original and refactored code...');
    const codeDiff = aiTools.generateDiff(sampleCode, refactoredCode);
    
    // Save diff to file
    await aiTools.writeFile(
      path.join(outputDir, 'code-refactoring.diff'),
      codeDiff
    );
    console.log(`Saved code diff to ${path.join(outputDir, 'code-refactoring.diff')}`);
    
    // 4. Documentation Generation
    console.log('\n4. Documentation Generation');
    console.log('--------------------------');
    
    console.log('Generating documentation for the refactored code...');
    
    // Extract function documentation
    const functionDocs = [];
    
    // Simple regex-based extraction (in a real scenario, use a proper parser)
    const funcMatches = refactoredCode.match(/\/\*\*\s*\n([^\*]|\*[^\/])*\*\/\s*\nfunction\s+(\w+)/g) || [];
    
    for (const match of funcMatches) {
      const nameMatch = match.match(/function\s+(\w+)/);
      const name = nameMatch ? nameMatch[1] : 'unknown';
      
      const descMatch = match.match(/\/\*\*\s*\n\s*\*\s*([^\n]*)/);
      const description = descMatch ? descMatch[1] : '';
      
      const paramMatches = match.match(/@param\s+\{[^}]*\}\s+([^-]*)-\s*([^\n]*)/g) || [];
      const params = paramMatches.map(paramMatch => {
        const [_, type, name, desc] = paramMatch.match(/@param\s+\{([^}]*)\}\s+([^-]*)-\s*([^\n]*)/) || [null, '', '', ''];
        return { type, name: name.trim(), description: desc.trim() };
      });
      
      const returnMatch = match.match(/@returns\s+\{[^}]*\}\s+-\s*([^\n]*)/);
      const returns = returnMatch ? { 
        type: returnMatch[0].match(/@returns\s+\{([^}]*)\}/)[1],
        description: returnMatch[1].trim() 
      } : null;
      
      functionDocs.push({
        name,
        description,
        params,
        returns
      });
    }
    
    // Generate markdown documentation
    let markdownDocs = '# Code Documentation\n\n';
    markdownDocs += `Generated on: ${new Date().toISOString()}\n\n`;
    
    for (const func of functionDocs) {
      markdownDocs += `## ${func.name}\n\n`;
      markdownDocs += `${func.description}\n\n`;
      
      if (func.params.length > 0) {
        markdownDocs += '### Parameters\n\n';
        for (const param of func.params) {
          markdownDocs += `- \`${param.name}\` (${param.type}): ${param.description}\n`;
        }
        markdownDocs += '\n';
      }
      
      if (func.returns) {
        markdownDocs += '### Returns\n\n';
        markdownDocs += `(${func.returns.type}): ${func.returns.description}\n\n`;
      }
    }
    
    // Save documentation
    await aiTools.writeFile(
      path.join(outputDir, 'documentation.md'),
      markdownDocs
    );
    console.log(`Saved documentation to ${path.join(outputDir, 'documentation.md')}`);
    
    // 5. Performance Metrics
    console.log('\n5. Performance Metrics');
    console.log('---------------------');
    
    console.log('Recording performance metrics...');
    
    // Record code optimization metrics
    aiTools.recordMetric('optimization', 'refactoring', 1, {
      originalLines: sampleCode.split('\n').length,
      refactoredLines: refactoredCode.split('\n').length,
      issuesFixed: codeQualityIssues.length
    });
    
    // Get metrics summary
    const metricsSummary = aiTools.getMetricsSummary();
    
    // Save metrics report
    await aiTools.writeFile(
      path.join(outputDir, 'performance-metrics.json'),
      {
        timestamp: new Date().toISOString(),
        codeOptimization: {
          refactoringCount: 1,
          issuesFixed: codeQualityIssues.length,
          originalLines: sampleCode.split('\n').length,
          refactoredLines: refactoredCode.split('\n').length,
          lineReduction: sampleCode.split('\n').length - refactoredCode.split('\n').length
        },
        metrics: metricsSummary
      }
    );
    console.log(`Saved performance metrics to ${path.join(outputDir, 'performance-metrics.json')}`);
    
    // 6. Generate Final Report
    console.log('\n6. Final Report');
    console.log('---------------');
    
    // Create a summary report of all activities
    const finalReport = {
      title: 'AI-Tools Advanced Demo Report',
      timestamp: new Date().toISOString(),
      sections: [
        {
          title: 'Project Analysis',
          description: 'Analysis of the project structure and modules',
          artifacts: ['project-analysis.json']
        },
        {
          title: 'Code Quality Assessment',
          description: 'Identification of code quality issues',
          artifacts: ['code-quality-report.json', 'sample-with-issues.js']
        },
        {
          title: 'Code Refactoring',
          description: 'Refactoring of code to address quality issues',
          artifacts: ['sample-refactored.js', 'code-refactoring.diff']
        },
        {
          title: 'Documentation Generation',
          description: 'Automatic generation of code documentation',
          artifacts: ['documentation.md']
        },
        {
          title: 'Performance Metrics',
          description: 'Metrics on code optimization and performance',
          artifacts: ['performance-metrics.json']
        }
      ],
      summary: {
        totalArtifacts: 7,
        issuesIdentified: codeQualityIssues.length,
        issuesFixed: codeQualityIssues.length,
        documentedFunctions: functionDocs.length
      }
    };
    
    // Save final report
    await aiTools.writeFile(
      path.join(outputDir, 'final-report.json'),
      finalReport
    );
    console.log(`Saved final report to ${path.join(outputDir, 'final-report.json')}`);
    
    // Generate HTML report
    let htmlReport = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${finalReport.title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 30px; }
    .section { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .artifacts { background: #eef; padding: 10px; border-radius: 3px; }
    .summary { background: #efe; padding: 15px; border-radius: 5px; margin-top: 30px; }
    .timestamp { color: #888; font-style: italic; }
  </style>
</head>
<body>
  <h1>${finalReport.title}</h1>
  <p class="timestamp">Generated on: ${finalReport.timestamp}</p>
  
  <div class="summary">
    <h2>Summary</h2>
    <ul>
      <li>Total Artifacts: ${finalReport.summary.totalArtifacts}</li>
      <li>Issues Identified: ${finalReport.summary.issuesIdentified}</li>
      <li>Issues Fixed: ${finalReport.summary.issuesFixed}</li>
      <li>Documented Functions: ${finalReport.summary.documentedFunctions}</li>
    </ul>
  </div>
  
  <h2>Sections</h2>`;
  
  for (const section of finalReport.sections) {
    htmlReport += `
  <div class="section">
    <h3>${section.title}</h3>
    <p>${section.description}</p>
    <div class="artifacts">
      <strong>Artifacts:</strong>
      <ul>
        ${section.artifacts.map(a => `<li>${a}</li>`).join('\n        ')}
      </ul>
    </div>
  </div>`;
  }
  
  htmlReport += `
</body>
</html>`;
    
    // Save HTML report
    await aiTools.writeFile(
      path.join(outputDir, 'report.html'),
      htmlReport
    );
    console.log(`Saved HTML report to ${path.join(outputDir, 'report.html')}`);
    
    console.log('\nAdvanced demo completed successfully!');
    console.log(`All output files are in: ${outputDir}`);
    
  } catch (error) {
    console.error('Error running advanced demo:', error);
  }
}

// Run the advanced demo
runAdvancedDemo();
