# Prompt Style Manager

The Prompt Style Manager is a module that helps you track, analyze, and optimize your interactions with AI models. It provides tools for counting tokens, logging prompts, and analyzing prompt styles to help you understand and improve your prompting patterns.

## Key Features

- **Token Counting**: Accurately count tokens for different AI models
- **Prompt Logging**: Log prompts, responses, and metadata for analysis
- **Prompt Style Analysis**: Analyze prompt patterns to identify dominant styles
- **Usage Statistics**: Track token usage, latency, and other metrics

## Installation

The Prompt Style Manager is included in the AI-Tools package. No additional installation is required.

## Usage

### Token Counting

Count tokens in text for a specific AI model:

```javascript
const { countPromptTokens } = require('./src');

const text = "What are the key differences between JavaScript and TypeScript?";
const tokenCount = countPromptTokens(text, "claude-3-opus");

console.log(`Token count: ${tokenCount}`);
```

### Prompt Logging

Log prompts and responses for analysis:

```javascript
const { logPromptUsage } = require('./src');

// When making an API call
const startTime = Date.now();
const prompt = "Create a React component that displays a list of items with pagination.";
const modelName = "claude-3-opus";
const aiToolName = "code-generation-tool";

// After receiving the response
const response = "..."; // The API response
const logEntry = logPromptUsage(prompt, modelName, aiToolName, response, startTime);

console.log(`Logged prompt with ${logEntry.totalTokenCount} total tokens`);
```

### Prompt Style Analysis

Analyze the style of a prompt:

```javascript
const { analyzePromptStyle } = require('./src');

const prompt = `Please help me create a marketing plan for a new SaaS product. Include:
- Target audience analysis
- Competitive positioning
- Key messaging
- Marketing channels`;

const analysis = analyzePromptStyle(prompt);

console.log(`Prompt has ${analysis.sentences} sentences, ${analysis.questions} questions, ${analysis.commands} commands, and ${analysis.bulletPoints} bullet points`);
```

### Usage Statistics

Get statistics about prompt usage:

```javascript
const { getPromptUsageStats } = require('./src');

// Get all-time stats
const allTimeStats = await getPromptUsageStats();

// Get stats for the last 24 hours
const recentStats = await getPromptUsageStats({
  timeRange: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
});

console.log(`Total API calls: ${allTimeStats.totalCalls}`);
console.log(`Total tokens used: ${allTimeStats.totalTokens}`);
console.log(`Average tokens per call: ${allTimeStats.avgTokensPerCall}`);
```

### Advanced Configuration

Configure the Prompt Style Manager with custom settings:

```javascript
const { promptStyleManager } = require('./src');

await promptStyleManager.initialize({
  enabled: true,
  logging: {
    enabled: true,
    directory: './logs/prompts',
    filename: 'prompt-usage.log',
    level: 'info',
    maxSize: 10 * 1024 * 1024, // 10 MB
    maxFiles: 5,
    format: 'json'
  }
});
```

## Understanding Prompt Styles

The Prompt Style Manager can identify several common prompt styles:

1. **Question-based**: Prompts that primarily ask questions
   - Example: "What are the key differences between JavaScript and TypeScript?"

2. **Command-based**: Prompts that give direct instructions
   - Example: "Create a React component that displays a list of items with pagination."

3. **Structured**: Prompts that use bullet points or numbered lists
   - Example: "Please include: - Target audience - Key messaging - Budget"

4. **Context-heavy**: Prompts that provide substantial background information
   - Example: "I'm working on a Node.js application that needs to process large CSV files..."

5. **Code-inclusive**: Prompts that include code examples
   - Example: "Here's my current code: ```javascript...```"

Understanding your dominant prompt style can help you optimize your interactions with AI models and develop more effective prompting strategies.

## Demo

A comprehensive demo is available in `prompt-style-manager-demo.js` that showcases all the key features of the system.

## Integration with Other Modules

The Prompt Style Manager integrates with other AI-Tools modules:

- **tokenUtils.js**: For accurate token counting
- **metricsUtils.js**: For recording and analyzing metrics
- **promptEngineering.js**: For optimizing prompts based on style analysis

## Best Practices

1. **Log all prompts**: Enable prompt logging to build a dataset for analysis
2. **Analyze prompt patterns**: Regularly review your prompt styles to identify patterns
3. **Optimize based on data**: Use the insights from analysis to improve your prompting strategies
4. **Monitor token usage**: Track token consumption to optimize costs
5. **Experiment with styles**: Try different prompt styles and measure their effectiveness

## For More Information

See the demo script `prompt-style-manager-demo.js` for practical examples of using the Prompt Style Manager.
