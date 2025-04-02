/**
 * Context Length Management Demo
 * 
 * This script demonstrates how to use the context length management system
 * to prevent and handle context length exceeded errors in AI model interactions.
 */

const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import AI-Tools modules
const tokenUtils = require('./src/tokenUtils');
const contextLengthManager = require('./src/contextLengthManager');
const promptEngineering = require('./src/promptEngineering');
const enhancedErrorHandling = require('./src/enhancedErrorHandling');

// Demo configuration
const CONFIG = {
  demoFiles: {
    directory: path.resolve('demo-output'),
    largeTextFile: 'large-text.txt',
    promptTemplateFile: 'prompt-template.json'
  },
  models: [
    'claude-3-opus',
    'claude-3-sonnet',
    'gpt-4-turbo'
  ]
};

/**
 * Initialize the demo
 */
async function initializeDemo() {
  console.log('=== Context Length Management Demo ===\n');
  
  // Create demo directory if it doesn't exist
  await fs.ensureDir(CONFIG.demoFiles.directory);
  
  // Create large text file for testing
  await createLargeTextFile();
  
  // Create prompt template
  await createPromptTemplate();
  
  console.log('Demo initialized successfully!\n');
}

/**
 * Create a large text file for testing context length management
 */
async function createLargeTextFile() {
  const filePath = path.join(CONFIG.demoFiles.directory, CONFIG.demoFiles.largeTextFile);
  
  // Generate large text (about 100K tokens)
  let largeText = '';
  
  // Add a header
  largeText += '# Large Text Document for Context Length Testing\n\n';
  largeText += 'This document contains a large amount of text to test context length management.\n\n';
  
  // Generate 50 sections with lorem ipsum text
  for (let i = 1; i <= 50; i++) {
    largeText += `## Section ${i}: ${generateRandomTitle()}\n\n`;
    
    // Add 10 paragraphs per section
    for (let j = 1; j <= 10; j++) {
      largeText += generateLoremIpsumParagraph() + '\n\n';
    }
    
    // Add some code examples in every 5th section
    if (i % 5 === 0) {
      largeText += '```javascript\n';
      largeText += generateRandomCode();
      largeText += '\n```\n\n';
    }
  }
  
  // Write to file
  await fs.writeFile(filePath, largeText);
  
  // Count tokens
  const tokenCount = tokenUtils.countTokens(largeText);
  console.log(`Created large text file (${tokenCount.toLocaleString()} tokens) at: ${filePath}`);
}

/**
 * Create a prompt template for testing
 */
async function createPromptTemplate() {
  const filePath = path.join(CONFIG.demoFiles.directory, CONFIG.demoFiles.promptTemplateFile);
  
  // Create template
  const template = {
    name: 'large-document-analysis',
    description: 'Template for analyzing large documents',
    template: `
You are an expert document analyzer. Please analyze the following document and provide a detailed summary.

Document to analyze:
{{document}}

Please provide:
1. A high-level summary of the document (max 3 paragraphs)
2. Key themes and topics identified
3. Important sections that require attention
4. Any patterns or trends observed
5. Recommendations based on the content

Format your response as markdown with appropriate headings and bullet points.
`,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    tokenCount: 0,
    variables: ['document']
  };
  
  // Count tokens
  template.tokenCount = tokenUtils.countTokens(template.template);
  
  // Write to file
  await fs.writeJson(filePath, template, { spaces: 2 });
  
  console.log(`Created prompt template (${template.tokenCount} tokens) at: ${filePath}`);
}

/**
 * Demo 1: Prompt Optimization for Token Limits
 */
async function demoPromptOptimization() {
  console.log('Demo 1: Prompt Optimization for Token Limits');
  console.log('------------------------------------------');
  
  // Load large text file
  const largeTextPath = path.join(CONFIG.demoFiles.directory, CONFIG.demoFiles.largeTextFile);
  const largeText = await fs.readFile(largeTextPath, 'utf8');
  
  // Load prompt template
  const templatePath = path.join(CONFIG.demoFiles.directory, CONFIG.demoFiles.promptTemplateFile);
  const template = await fs.readJson(templatePath);
  
  // Create prompt data
  const promptData = {
    system: template.template.replace('{{document}}', largeText),
    messages: [
      { role: 'system', content: 'You are an AI assistant that helps with document analysis.' },
      { role: 'user', content: 'Please analyze this document thoroughly.' }
    ],
    query: 'What are the key insights from this document?'
  };
  
  // Count tokens in original prompt
  const originalTokenCount = tokenUtils.countTokens(JSON.stringify(promptData));
  console.log(`Original prompt token count: ${originalTokenCount.toLocaleString()}`);
  
  // Test optimization for different models
  for (const model of CONFIG.models) {
    console.log(`\nOptimizing for ${model}:`);
    
    // Get token limit for model
    const tokenLimit = contextLengthManager.getTokenLimit(model);
    console.log(`Token limit for ${model}: ${tokenLimit.toLocaleString()}`);
    
    // Normal optimization
    console.log('\nNormal optimization:');
    const normalOptimized = contextLengthManager.optimizePromptForTokenLimit(promptData, {
      model,
      optimizationLevel: 'normal'
    });
    
    console.log(`- Token count after optimization: ${normalOptimized.tokenCount.toLocaleString()}`);
    console.log(`- Tokens saved: ${(originalTokenCount - normalOptimized.tokenCount).toLocaleString()}`);
    console.log(`- Reduction: ${((originalTokenCount - normalOptimized.tokenCount) / originalTokenCount * 100).toFixed(2)}%`);
    console.log(`- Within limit: ${normalOptimized.tokenCount <= tokenLimit ? 'Yes' : 'No'}`);
    
    // If still over limit, try aggressive optimization
    if (normalOptimized.tokenCount > tokenLimit) {
      console.log('\nAggressive optimization:');
      const aggressiveOptimized = contextLengthManager.optimizePromptForTokenLimit(promptData, {
        model,
        optimizationLevel: 'aggressive'
      });
      
      console.log(`- Token count after optimization: ${aggressiveOptimized.tokenCount.toLocaleString()}`);
      console.log(`- Tokens saved: ${(originalTokenCount - aggressiveOptimized.tokenCount).toLocaleString()}`);
      console.log(`- Reduction: ${((originalTokenCount - aggressiveOptimized.tokenCount) / originalTokenCount * 100).toFixed(2)}%`);
      console.log(`- Within limit: ${aggressiveOptimized.tokenCount <= tokenLimit ? 'Yes' : 'No'}`);
      
      // If still over limit, try extreme optimization
      if (aggressiveOptimized.tokenCount > tokenLimit) {
        console.log('\nExtreme optimization:');
        const extremeOptimized = contextLengthManager.optimizePromptForTokenLimit(promptData, {
          model,
          optimizationLevel: 'extreme'
        });
        
        console.log(`- Token count after optimization: ${extremeOptimized.tokenCount.toLocaleString()}`);
        console.log(`- Tokens saved: ${(originalTokenCount - extremeOptimized.tokenCount).toLocaleString()}`);
        console.log(`- Reduction: ${((originalTokenCount - extremeOptimized.tokenCount) / originalTokenCount * 100).toFixed(2)}%`);
        console.log(`- Within limit: ${extremeOptimized.tokenCount <= tokenLimit ? 'Yes' : 'No'}`);
      }
    }
  }
  
  console.log('\nDemo 1 completed!\n');
}

/**
 * Demo 2: Content Chunking
 */
async function demoContentChunking() {
  console.log('Demo 2: Content Chunking');
  console.log('----------------------');
  
  // Load large text file
  const largeTextPath = path.join(CONFIG.demoFiles.directory, CONFIG.demoFiles.largeTextFile);
  const largeText = await fs.readFile(largeTextPath, 'utf8');
  
  // Count tokens in original content
  const originalTokenCount = tokenUtils.countTokens(largeText);
  console.log(`Original content token count: ${originalTokenCount.toLocaleString()}`);
  
  // Test different chunk sizes
  const chunkSizes = [10000, 20000, 50000];
  
  for (const chunkSize of chunkSizes) {
    console.log(`\nChunking with max size of ${chunkSize.toLocaleString()} tokens:`);
    
    // Split into chunks
    const chunks = contextLengthManager.splitIntoChunks(largeText, {
      maxChunkSize: chunkSize,
      overlapSize: 500
    });
    
    console.log(`- Number of chunks: ${chunks.length}`);
    
    // Calculate token counts for each chunk
    const chunkTokenCounts = chunks.map(chunk => tokenUtils.countTokens(chunk));
    const totalChunkTokens = chunkTokenCounts.reduce((sum, count) => sum + count, 0);
    const avgChunkTokens = Math.round(totalChunkTokens / chunks.length);
    const maxChunkTokens = Math.max(...chunkTokenCounts);
    const minChunkTokens = Math.min(...chunkTokenCounts);
    
    console.log(`- Average tokens per chunk: ${avgChunkTokens.toLocaleString()}`);
    console.log(`- Maximum tokens in a chunk: ${maxChunkTokens.toLocaleString()}`);
    console.log(`- Minimum tokens in a chunk: ${minChunkTokens.toLocaleString()}`);
    console.log(`- Total tokens (with overlap): ${totalChunkTokens.toLocaleString()}`);
    console.log(`- Overlap overhead: ${(totalChunkTokens - originalTokenCount).toLocaleString()} tokens (${((totalChunkTokens - originalTokenCount) / originalTokenCount * 100).toFixed(2)}%)`);
  }
  
  // Demonstrate processing in chunks
  console.log('\nProcessing content in chunks:');
  
  // Define a simple processing function (in a real scenario, this would call an AI model)
  const processFn = async (chunk, context) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return a simple analysis (word count, section count, etc.)
    const wordCount = chunk.split(/\s+/).length;
    const sectionCount = (chunk.match(/## Section/g) || []).length;
    const codeBlockCount = (chunk.match(/```/g) || []).length / 2;
    
    return {
      chunkIndex: context.chunkIndex,
      wordCount,
      sectionCount,
      codeBlockCount,
      isFirstChunk: context.isFirstChunk,
      isLastChunk: context.isLastChunk
    };
  };
  
  // Process in chunks
  const results = await contextLengthManager.processInChunks(largeText, processFn, {
    maxChunkSize: 20000,
    combineResults: true
  });
  
  // Display results summary
  const totalWordCount = results.reduce((sum, result) => sum + result.wordCount, 0);
  const totalSectionCount = results.reduce((sum, result) => sum + result.sectionCount, 0);
  const totalCodeBlockCount = results.reduce((sum, result) => sum + result.codeBlockCount, 0);
  
  console.log(`- Processed ${results.length} chunks`);
  console.log(`- Total word count: ${totalWordCount.toLocaleString()}`);
  console.log(`- Total section count: ${totalSectionCount}`);
  console.log(`- Total code block count: ${totalCodeBlockCount}`);
  
  console.log('\nDemo 2 completed!\n');
}

/**
 * Demo 3: Adaptive Token Limits
 */
async function demoAdaptiveTokenLimits() {
  console.log('Demo 3: Adaptive Token Limits');
  console.log('--------------------------');
  
  // Test model: claude-3-opus
  const model = 'claude-3-opus';
  
  // Get initial token limit
  const initialLimit = contextLengthManager.getTokenLimit(model);
  console.log(`Initial token limit for ${model}: ${initialLimit.toLocaleString()}`);
  
  // Simulate context length exceeded errors
  console.log('\nSimulating context length exceeded errors:');
  
  for (let i = 1; i <= 3; i++) {
    // Create error
    const error = new Error('Context length exceeded');
    error.code = 'context_length_exceeded';
    
    // Record error
    contextLengthManager.recordError(model, error);
    
    // Get new limit
    const newLimit = contextLengthManager.getTokenLimit(model);
    console.log(`- After error ${i}: ${newLimit.toLocaleString()} tokens (${((newLimit / initialLimit) * 100).toFixed(2)}% of original)`);
  }
  
  // Simulate successful calls
  console.log('\nSimulating successful API calls:');
  
  for (let i = 1; i <= 5; i++) {
    // Record success
    contextLengthManager.recordSuccess(model);
    
    // Get current limit
    const currentLimit = contextLengthManager.getTokenLimit(model);
    console.log(`- After success ${i}: ${currentLimit.toLocaleString()} tokens (${((currentLimit / initialLimit) * 100).toFixed(2)}% of original)`);
  }
  
  // Get statistics
  const stats = contextLengthManager.getStatistics();
  console.log('\nModel statistics:');
  console.log(JSON.stringify(stats.modelStats[model], null, 2));
  
  console.log('\nDemo 3 completed!\n');
}

/**
 * Demo 4: Error Recovery
 */
async function demoErrorRecovery() {
  console.log('Demo 4: Error Recovery');
  console.log('-------------------');
  
  // Load large text file
  const largeTextPath = path.join(CONFIG.demoFiles.directory, CONFIG.demoFiles.largeTextFile);
  const largeText = await fs.readFile(largeTextPath, 'utf8');
  
  // Create prompt data that exceeds token limits
  const promptData = {
    system: `You are an AI assistant that helps with document analysis. Please analyze the following document: ${largeText}`,
    messages: [
      { role: 'system', content: 'You are an AI assistant that helps with document analysis.' },
      { role: 'user', content: 'Please analyze this document thoroughly.' }
    ],
    query: 'What are the key insights from this document?'
  };
  
  // Count tokens
  const tokenCount = tokenUtils.countTokens(JSON.stringify(promptData));
  console.log(`Prompt token count: ${tokenCount.toLocaleString()}`);
  
  // Simulate context length exceeded error
  const error = new Error('Context length exceeded');
  error.code = 'context_length_exceeded';
  
  // Define retry function (in a real scenario, this would call the AI model API)
  const retryFunction = async (optimizedPrompt) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if token count is within limit
    const optimizedTokenCount = tokenUtils.countTokens(JSON.stringify(optimizedPrompt));
    const model = 'claude-3-opus';
    const tokenLimit = contextLengthManager.getTokenLimit(model);
    
    if (optimizedTokenCount > tokenLimit) {
      throw new Error('Context length still exceeded');
    }
    
    // Return success response
    return {
      success: true,
      tokenCount: optimizedTokenCount,
      message: 'API call successful with optimized prompt'
    };
  };
  
  // Handle the error
  console.log('Handling context length exceeded error:');
  const recoveryResult = await contextLengthManager.handleContextLengthExceeded(error, {
    model: 'claude-3-opus',
    promptData,
    retryFunction
  });
  
  // Display recovery result
  console.log('\nRecovery result:');
  console.log(`- Success: ${recoveryResult.success}`);
  
  if (recoveryResult.success) {
    console.log(`- Optimization level: ${recoveryResult.optimizationLevel}`);
    console.log(`- Tokens saved: ${recoveryResult.tokensSaved.toLocaleString()}`);
    console.log(`- Message: ${recoveryResult.result.message}`);
  } else {
    console.log(`- Message: ${recoveryResult.message}`);
  }
  
  console.log('\nDemo 4 completed!\n');
}

/**
 * Generate a report
 */
async function generateReport() {
  console.log('Generating Context Length Management Report');
  console.log('----------------------------------------');
  
  // Generate report
  const reportResult = await contextLengthManager.generateReport();
  
  // Display report summary
  console.log('\nReport summary:');
  console.log(`- Total calls: ${reportResult.report.summary.totalCalls}`);
  console.log(`- Successful calls: ${reportResult.report.summary.totalSuccessfulCalls}`);
  console.log(`- Context exceeded errors: ${reportResult.report.summary.totalContextExceededErrors}`);
  console.log(`- Other errors: ${reportResult.report.summary.totalOtherErrors}`);
  console.log(`- Success rate: ${(reportResult.report.summary.successRate * 100).toFixed(2)}%`);
  console.log(`- Context exceeded rate: ${(reportResult.report.summary.contextExceededRate * 100).toFixed(2)}%`);
  
  console.log(`\nReport saved to: ${reportResult.path}`);
  
  console.log('\nReport generation completed!\n');
}

/**
 * Run all demos
 */
async function runAllDemos() {
  try {
    // Initialize the demo
    await initializeDemo();
    
    // Run demos
    await demoPromptOptimization();
    await demoContentChunking();
    await demoAdaptiveTokenLimits();
    await demoErrorRecovery();
    
    // Generate report
    await generateReport();
    
    console.log('=== All Demos Completed Successfully ===');
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Helper functions for demo data generation

/**
 * Generate a random title
 */
function generateRandomTitle() {
  const adjectives = ['Advanced', 'Comprehensive', 'Detailed', 'Essential', 'Fundamental', 'Innovative', 'Practical', 'Strategic', 'Technical', 'Theoretical'];
  const nouns = ['Analysis', 'Approach', 'Concepts', 'Framework', 'Methodology', 'Overview', 'Principles', 'Strategies', 'Techniques', 'Theory'];
  const topics = ['AI', 'Data Science', 'Machine Learning', 'Natural Language Processing', 'Neural Networks', 'Programming', 'Software Engineering', 'System Design', 'Web Development', 'Cloud Computing'];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  
  return `${adjective} ${noun} for ${topic}`;
}

/**
 * Generate a lorem ipsum paragraph
 */
function generateLoremIpsumParagraph() {
  const loremIpsum = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.

Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.
`.trim().split('\n\n');
  
  return loremIpsum[Math.floor(Math.random() * loremIpsum.length)];
}

/**
 * Generate random code
 */
function generateRandomCode() {
  const codeSnippets = [
    `
function processData(data) {
  const results = [];
  
  // Process each item in the data
  for (const item of data) {
    if (item.value > 100) {
      results.push({
        id: item.id,
        name: item.name,
        score: item.value * 0.75,
        category: 'high'
      });
    } else if (item.value > 50) {
      results.push({
        id: item.id,
        name: item.name,
        score: item.value * 0.85,
        category: 'medium'
      });
    } else {
      results.push({
        id: item.id,
        name: item.name,
        score: item.value,
        category: 'low'
      });
    }
  }
  
  return results;
}
`,
    `
class DataAnalyzer {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.5;
    this.maxIterations = options.maxIterations || 1000;
    this.tolerance = options.tolerance || 0.001;
    this.data = [];
    this.results = null;
  }
  
  loadData(data) {
    this.data = Array.isArray(data) ? data : [];
    return this;
  }
  
  analyze() {
    if (this.data.length === 0) {
      throw new Error('No data to analyze');
    }
    
    let iterations = 0;
    let error = Infinity;
    let result = 0;
    
    while (iterations < this.maxIterations && error > this.tolerance) {
      const newResult = this.data.reduce((sum, value) => sum + value, 0) / this.data.length;
      error = Math.abs(newResult - result);
      result = newResult;
      iterations++;
    }
    
    this.results = {
      value: result,
      iterations,
      error,
      converged: error <= this.tolerance
    };
    
    return this.results;
  }
  
  getResults() {
    return this.results;
  }
}
`,
    `
async function fetchDataFromAPI(endpoint, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    timeout = 5000,
    retries = 3
  } = options;
  
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : null,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(\`API error: \${response.status} \${response.statusText}\`);
      }
      
      return await response.json();
    } catch (error) {
      attempt++;
      
      if (attempt >= retries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
}
`
  ];
  
  return codeSnippets[Math.floor(Math.random() * codeSnippets.length)].trim();
}

// Run the demos
runAllDemos();
