/**
 * AI-Tools Demo
 * Demonstrates how to use AI-Tools in a development workflow
 */

const aiTools = require('./src/index');

// Async function to run the demo
async function runDemo() {
  try {
    console.log('=== AI-Tools Development Workflow Demo ===\n');
    
    // 1. Project Analysis
    console.log('1. Project Analysis');
    console.log('-------------------');
    
    // Get file structure
    console.log('Getting project structure...');
    const structure = await aiTools.getFileStructure('.', {
      depth: 2,
      respectGitignore: true,
      ignorePatterns: ['node_modules/**', '.git/**']
    });
    console.log(`Found ${structure.children.length} top-level items in the project`);
    
    // Summarize the project
    console.log('\nGenerating project summary...');
    const summary = await aiTools.summarizeDirectory('.', {
      recursive: true,
      maxDepth: 2,
      ignorePatterns: ['node_modules/**', '.git/**']
    });
    console.log(`Project contains ${summary.files} files in ${summary.subdirectories.length} directories`);
    console.log('File types:', Object.keys(summary.fileTypes).join(', '));
    
    // 2. Code Analysis
    console.log('\n2. Code Analysis');
    console.log('---------------');
    
    // Find a specific function
    console.log('Finding a function in the codebase...');
    try {
      const func = await aiTools.findFunction('src/fileUtils.js', 'readFile');
      console.log(`Found 'readFile' function (${func.lineCount} lines)`);
    } catch (error) {
      console.log(`Couldn't find function: ${error.message}`);
    }
    
    // Extract relevant code based on a query
    console.log('\nExtracting code relevant to "token optimization"...');
    try {
      const code = await aiTools.readFile('src/tokenUtils.js');
      const relevantCode = aiTools.extractRelevantCode(code, 'token optimization', {
        language: 'javascript',
        maxTokens: 500,
        contextLines: 2
      });
      console.log(`Found ${relevantCode.sections.length} relevant code sections`);
    } catch (error) {
      console.log(`Couldn't extract relevant code: ${error.message}`);
    }
    
    // 3. File Operations
    console.log('\n3. File Operations');
    console.log('------------------');
    
    // Create a test directory
    const testDir = './test-demo-output';
    console.log(`Creating directory: ${testDir}`);
    await aiTools.createDirectory(testDir);
    
    // Write a file
    const filePath = `${testDir}/example.txt`;
    console.log(`Writing to file: ${filePath}`);
    await aiTools.writeFile(filePath, 'Hello from AI-Tools!');
    
    // Read the file
    console.log(`Reading file: ${filePath}`);
    const content = await aiTools.readFile(filePath);
    console.log(`File content: ${content}`);
    
    // Append to the file
    console.log(`Appending to file: ${filePath}`);
    await aiTools.appendFile(filePath, '\nThis line was added using appendFile.');
    
    // Read the updated file
    console.log(`Reading updated file: ${filePath}`);
    const updatedContent = await aiTools.readFile(filePath);
    console.log(`Updated file content: ${updatedContent}`);
    
    // 4. Code Modification
    console.log('\n4. Code Modification');
    console.log('--------------------');
    
    // Create a sample JavaScript file
    const jsFilePath = `${testDir}/sample.js`;
    const jsContent = `/**
 * Sample JavaScript file
 */

// Import modules
import { useState } from 'react';

// Calculate sum function
function calculateSum(a, b) {
  return a + b;
}

// Export the function
export { calculateSum };
`;
    
    console.log(`Creating sample JS file: ${jsFilePath}`);
    await aiTools.writeFile(jsFilePath, jsContent);
    
    // Add an import statement
    console.log('Adding an import statement...');
    await aiTools.addImport(jsFilePath, "import { useEffect } from 'react';");
    
    // Replace a code block
    console.log('Replacing a code block...');
    const newImplementation = `// Enhanced sum function with validation
function calculateSum(a, b) {
  // Ensure inputs are numbers
  a = Number(a);
  b = Number(b);
  
  // Return the sum
  return a + b;
}`;
    
    await aiTools.replaceCodeBlock(jsFilePath, 'function calculateSum', newImplementation);
    
    // Read the modified file
    console.log(`Reading modified JS file: ${jsFilePath}`);
    const modifiedJsContent = await aiTools.readFile(jsFilePath);
    console.log('Modified JS content:');
    console.log(modifiedJsContent);
    
    // 5. Dependency Management
    console.log('\n5. Dependency Management');
    console.log('------------------------');
    
    // Create a sample package.json
    const packageJsonPath = `${testDir}/package.json`;
    const packageJson = {
      name: 'ai-tools-demo',
      version: '1.0.0',
      description: 'Demo project for AI-Tools',
      main: 'index.js',
      scripts: {
        test: 'echo "Error: no test specified" && exit 1'
      },
      dependencies: {},
      devDependencies: {}
    };
    
    console.log(`Creating sample package.json: ${packageJsonPath}`);
    await aiTools.writeFile(packageJsonPath, packageJson);
    
    // Add dependencies (without installing)
    console.log('Adding dependencies to package.json...');
    await aiTools.addDependency('lodash', { 
      dirPath: testDir, 
      install: false 
    });
    
    await aiTools.addDependency('jest', { 
      dirPath: testDir, 
      dev: true, 
      install: false 
    });
    
    // Read the updated package.json
    console.log(`Reading updated package.json: ${packageJsonPath}`);
    const updatedPackageJson = await aiTools.readPackageJson(testDir);
    console.log('Updated package.json:');
    console.log(updatedPackageJson);
    
    // 6. Schema Validation
    console.log('\n6. Schema Validation');
    console.log('--------------------');
    
    // Sample data for schema generation
    const sampleData = {
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      },
      preferences: {
        theme: 'dark',
        notifications: true
      }
    };
    
    console.log('Generating schema from sample data...');
    const schema = aiTools.generateSchema(sampleData, {
      id: 'user-profile',
      title: 'User Profile Schema',
      description: 'Schema for user profile data',
      required: {
        'user.name': true,
        'user.email': true
      },
      critical: {
        'user.email': true
      }
    });
    
    console.log('Generated schema:');
    console.log(JSON.stringify(schema, null, 2));
    
    // Validate data against schema
    console.log('\nValidating data against schema...');
    const validData = { ...sampleData };
    const validationResult = await aiTools.validateWithWarnings(validData, schema);
    console.log('Validation result:', validationResult.valid ? 'Valid' : 'Invalid');
    
    // 7. Token Optimization
    console.log('\n7. Token Optimization');
    console.log('---------------------');
    
    // Sample text for token counting
    const sampleText = 'This is a sample text that will be used to demonstrate token counting and optimization.';
    console.log(`Sample text: "${sampleText}"`);
    
    // Count tokens
    const tokenCount = aiTools.countTokens(sampleText);
    console.log(`Estimated token count: ${tokenCount}`);
    
    // Sample prompt data
    const promptData = {
      system: 'You are a helpful AI assistant.',
      messages: [
        { role: 'user', content: 'Tell me about JavaScript.' },
        { role: 'assistant', content: 'JavaScript is a programming language commonly used for web development. It allows you to add interactive features to websites.' },
        { role: 'user', content: 'How do I declare variables in JavaScript?' }
      ],
      query: 'Can you show me examples of var, let, and const in JavaScript?'
    };
    
    console.log('\nOptimizing a prompt...');
    const optimized = aiTools.optimizePrompt(promptData, {
      model: 'claude-3-opus',
      maxTokens: 100,
      preserveQuery: true,
      preserveSystem: true
    });
    
    console.log(`Original token count: ${aiTools.countTokens(JSON.stringify(promptData))}`);
    console.log(`Optimized token count: ${optimized.tokenCount}`);
    console.log(`Tokens saved: ${aiTools.countTokens(JSON.stringify(promptData)) - optimized.tokenCount}`);
    
    // 8. Metrics Collection
    console.log('\n8. Metrics Collection');
    console.log('---------------------');
    
    // Record some metrics
    console.log('Recording metrics...');
    
    aiTools.recordMetric('api', 'call', 1, {
      tokens: { prompt: 100, completion: 50 },
      costs: { prompt: 0.0015, completion: 0.00375 },
      latency: 1200
    });
    
    aiTools.recordMetric('cache', 'hit', 1, {
      tokensSaved: 150,
      costSaved: 0.00525
    });
    
    aiTools.recordMetric('validation', 'success', 1);
    
    // Get metrics summary
    console.log('\nGetting metrics summary...');
    const metricsSummary = aiTools.getMetricsSummary();
    console.log('API calls:', metricsSummary.api.calls);
    console.log('Cache hit rate:', metricsSummary.cache.hitRate);
    console.log('Tokens saved:', metricsSummary.cache.tokensSaved);
    console.log('Cost saved: $' + metricsSummary.cache.costSaved.toFixed(5));
    
    // Visualize metrics
    console.log('\nMetrics visualization:');
    const visualization = aiTools.visualizeMetrics(metricsSummary);
    console.log(visualization);
    
    console.log('\nDemo completed successfully!');
    console.log(`Demo output directory: ${testDir}`);
    
  } catch (error) {
    console.error('Error running demo:', error);
  }
}

// Run the demo
runDemo();
