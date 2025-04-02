/**
 * Prompt Style Manager Demo
 * 
 * This script demonstrates how to use the Prompt Style Manager module
 * to count tokens, log prompts, and analyze prompt styles.
 */

const { 
  countPromptTokens, 
  logPromptUsage, 
  getPromptUsageStats, 
  analyzePromptStyle,
  promptStyleManager
} = require('./src');

// Sample prompts with different styles
const samplePrompts = [
  // Question-based prompt
  {
    text: "What are the key differences between JavaScript and TypeScript? Can you provide examples of when to use each?",
    modelName: "claude-3-opus",
    aiToolName: "language-comparison-tool"
  },
  
  // Command-based prompt
  {
    text: "Create a React component that displays a list of items with pagination. The component should accept an array of items, itemsPerPage, and onPageChange callback.",
    modelName: "claude-3-opus",
    aiToolName: "code-generation-tool"
  },
  
  // Context-heavy prompt
  {
    text: `I'm working on a Node.js application that needs to process large CSV files. The files can be up to 1GB in size and contain millions of rows. I've tried using the 'csv-parser' library, but it's consuming too much memory.

Here's my current code:
\`\`\`javascript
const fs = require('fs');
const csv = require('csv-parser');

function processFile(filePath) {
  const results = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}
\`\`\`

How can I modify this code to process the file in chunks to reduce memory usage?`,
    modelName: "claude-3-opus",
    aiToolName: "code-optimization-tool"
  },
  
  // Bullet-point prompt
  {
    text: `Please help me create a marketing plan for a new SaaS product. Include:
- Target audience analysis
- Competitive positioning
- Key messaging
- Marketing channels
- Budget allocation
- Timeline for launch
- KPIs to track success`,
    modelName: "claude-3-sonnet",
    aiToolName: "marketing-strategy-tool"
  }
];

/**
 * Demonstrate token counting
 */
async function demoTokenCounting() {
  console.log('=== Token Counting Demo ===\n');
  
  for (const [index, prompt] of samplePrompts.entries()) {
    const tokenCount = countPromptTokens(prompt.text, prompt.modelName);
    console.log(`Prompt ${index + 1} (${prompt.modelName}):`);
    console.log(`- Characters: ${prompt.text.length}`);
    console.log(`- Tokens: ${tokenCount}`);
    console.log(`- Tokens per character ratio: ${(tokenCount / prompt.text.length).toFixed(3)}`);
    console.log();
  }
}

/**
 * Demonstrate prompt logging
 */
async function demoPromptLogging() {
  console.log('=== Prompt Logging Demo ===\n');
  
  // Initialize the prompt style manager with custom config
  await promptStyleManager.initialize({
    logging: {
      directory: './logs/demo',
      filename: 'demo-prompt-usage.log'
    }
  });
  
  for (const [index, prompt] of samplePrompts.entries()) {
    // Simulate API call
    const startTime = Date.now();
    
    // Simulate response (in a real scenario, this would be the API response)
    const response = `This is a simulated response for prompt ${index + 1}. It would contain the actual AI model response in a real scenario.`;
    
    // Add artificial delay to simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Log the prompt usage
    const logEntry = logPromptUsage(
      prompt.text,
      prompt.modelName,
      prompt.aiToolName,
      response,
      startTime
    );
    
    console.log(`Logged prompt ${index + 1} (${prompt.aiToolName}):`);
    console.log(`- Prompt tokens: ${logEntry && logEntry.promptTokenCount || 'N/A'}`);
    console.log(`- Response tokens: ${logEntry && logEntry.responseTokenCount || 'N/A'}`);
    console.log(`- Total tokens: ${logEntry && logEntry.totalTokenCount || 'N/A'}`);
    console.log(`- Latency: ${logEntry && logEntry.latency || 'N/A'}ms`);
    console.log();
  }
  
  // Get usage statistics
  const stats = await getPromptUsageStats();
  
  console.log('Prompt Usage Statistics:');
  console.log(`- Total calls: ${stats && stats.totalCalls || 0}`);
  console.log(`- Total tokens: ${stats && stats.totalTokens || 0}`);
  console.log(`- Avg tokens per call: ${stats && stats.avgTokensPerCall && stats.avgTokensPerCall.toFixed(2) || 0}`);
  console.log(`- Avg latency: ${stats && stats.avgLatency && stats.avgLatency.toFixed(2) || 0}ms`);
  console.log();
}

/**
 * Demonstrate prompt style analysis
 */
async function demoPromptStyleAnalysis() {
  console.log('=== Prompt Style Analysis Demo ===\n');
  
  for (const [index, prompt] of samplePrompts.entries()) {
    const analysis = analyzePromptStyle(prompt.text);
    
    console.log(`Prompt ${index + 1} Style Analysis:`);
    console.log(`- Length: ${analysis.length} characters`);
    console.log(`- Token count: ${analysis.tokenCount}`);
    console.log(`- Sentences: ${analysis.sentences}`);
    console.log(`- Questions: ${analysis.questions}`);
    console.log(`- Commands: ${analysis.commands}`);
    console.log(`- Code blocks: ${analysis.codeBlocks}`);
    console.log(`- Bullet points: ${analysis.bulletPoints}`);
    
    // Determine prompt style
    let dominantStyle = 'Mixed';
    if (analysis.questions > 0 && analysis.questions >= analysis.commands) {
      dominantStyle = 'Question-based';
    } else if (analysis.commands > 0 && analysis.commands > analysis.questions) {
      dominantStyle = 'Command-based';
    }
    if (analysis.bulletPoints > 0 && analysis.bulletPoints >= 3) {
      dominantStyle = 'Structured (Bullet points)';
    }
    if (analysis.codeBlocks > 0) {
      dominantStyle += ' with Code examples';
    }
    
    console.log(`- Dominant style: ${dominantStyle}`);
    console.log();
  }
}

/**
 * Run all demos
 */
async function runAllDemos() {
  try {
    console.log('=== Prompt Style Manager Demo ===\n');
    
    await demoTokenCounting();
    await demoPromptLogging();
    await demoPromptStyleAnalysis();
    
    console.log('=== Demo Completed Successfully ===');
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Run the demos
runAllDemos();
