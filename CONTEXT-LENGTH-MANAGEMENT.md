# Context Length Management System

The Context Length Management System is a comprehensive solution for handling context length exceeded errors in AI model interactions. It provides tools for optimizing prompts, managing token limits adaptively, and implementing chunking strategies to process large content efficiently.

## Problem

When working with AI models like Claude and GPT, you often encounter context length limitations:

- **Context length exceeded errors:** The model rejects inputs that are too large
- **Truncated responses:** The model cuts off responses when the combined input and output exceed limits
- **Inefficient token usage:** Sending unnecessarily large prompts wastes tokens and increases costs
- **Handling large documents:** Processing documents larger than the context window is challenging

## Solution

The Context Length Management System addresses these challenges with a multi-faceted approach:

1. **Prompt Optimization:** Automatically optimize prompts to fit within token limits
2. **Adaptive Token Limits:** Dynamically adjust token limits based on success/failure patterns
3. **Content Chunking:** Process large content in manageable chunks with smart overlap
4. **Error Recovery:** Implement recovery strategies when context length errors occur

## Quick Start

### Installation

The Context Length Management System is included in the AI-Tools package. No additional installation is required.

### Basic Usage

```javascript
const { contextLengthManager } = require('./src');

// Optimize a prompt to fit within token limits
const optimized = contextLengthManager.optimizePromptForTokenLimit(promptData, {
  model: 'claude-3-opus',
  optimizationLevel: 'normal'
});

// Use optimized prompt for API call
const result = await apiClient.generateContent(optimized.prompt);
```

### Error Handling

```javascript
try {
  const result = await apiClient.generateContent(promptData);
  return result;
} catch (error) {
  if (error.code === 'context_length_exceeded') {
    const recovery = await contextLengthManager.handleContextLengthExceeded(error, {
      model: 'claude-3-opus',
      promptData,
      retryFunction: (optimizedPrompt) => apiClient.generateContent(optimizedPrompt)
    });
    
    if (recovery.success) {
      return recovery.result;
    }
  }
  throw error;
}
```

### Processing Large Content

```javascript
const results = await contextLengthManager.processInChunks(largeContent, 
  async (chunk, context) => {
    // Process each chunk with AI model
    return await apiClient.generateContent({
      system: "Analyze this content chunk",
      messages: [{ role: 'user', content: chunk }]
    });
  }, 
  {
    maxChunkSize: 50000,
    overlapSize: 1000,
    combineResults: true
  }
);
```

## Key Features

### Prompt Optimization

The system offers three levels of optimization:

- **Normal:** Basic optimization that preserves most content
- **Aggressive:** More aggressive optimization that may compress code blocks
- **Extreme:** Maximum optimization for emergency situations

```javascript
// Normal optimization
const normalOptimized = contextLengthManager.optimizePromptForTokenLimit(promptData, {
  model: 'claude-3-opus',
  optimizationLevel: 'normal'
});

// Aggressive optimization
const aggressiveOptimized = contextLengthManager.optimizePromptForTokenLimit(promptData, {
  model: 'claude-3-opus',
  optimizationLevel: 'aggressive'
});

// Extreme optimization
const extremeOptimized = contextLengthManager.optimizePromptForTokenLimit(promptData, {
  model: 'claude-3-opus',
  optimizationLevel: 'extreme'
});
```

### Adaptive Token Limits

The system automatically adjusts token limits based on success and failure patterns:

- Decreases limits after context length exceeded errors
- Gradually increases limits after consecutive successful calls
- Maintains separate limits for different models

```javascript
// Record a successful API call
contextLengthManager.recordSuccess('claude-3-opus');

// Record an error
contextLengthManager.recordError('claude-3-opus', error);

// Get current token limit for a model
const tokenLimit = contextLengthManager.getTokenLimit('claude-3-opus');
```

### Content Chunking

Process large content by splitting it into manageable chunks:

- Splits at natural boundaries (paragraphs, sentences, etc.)
- Configurable overlap between chunks
- Automatic result combination

```javascript
// Split content into chunks
const chunks = contextLengthManager.splitIntoChunks(largeContent, {
  maxChunkSize: 50000,
  overlapSize: 1000
});

// Process content in chunks
const results = await contextLengthManager.processInChunks(largeContent, processFn, {
  maxChunkSize: 50000,
  overlapSize: 1000,
  combineResults: true
});
```

### Error Recovery

Recover from context length exceeded errors:

- Tries increasingly aggressive optimization levels
- Automatically retries with optimized prompts
- Detailed logging of recovery attempts

```javascript
const recovery = await contextLengthManager.handleContextLengthExceeded(error, {
  model: 'claude-3-opus',
  promptData,
  retryFunction: (optimizedPrompt) => apiClient.generateContent(optimizedPrompt)
});
```

## Configuration

The system is highly configurable:

```javascript
await contextLengthManager.initialize({
  tokenLimits: {
    'claude-3-opus': 180000,
    'claude-3-sonnet': 160000,
    'gpt-4-turbo': 120000
  },
  safetyMargin: 0.1, // 10% safety margin
  adaptiveConfig: {
    enabled: true,
    reductionFactor: 0.9, // Reduce by 10% on each failure
    recoveryFactor: 1.05, // Increase by 5% on each success
    minReductionFactor: 0.5, // Don't reduce below 50% of original limit
    consecutiveSuccessesForRecovery: 3
  },
  chunkingStrategies: {
    enabled: true,
    defaultMaxChunkSize: 50000,
    overlapSize: 1000,
    combineResults: true
  },
  optimizationLevels: {
    // Custom optimization rules
  }
});
```

## Reporting

Generate reports on context length management:

```javascript
// Get statistics
const stats = contextLengthManager.getStatistics();

// Generate a comprehensive report
const report = await contextLengthManager.generateReport();
```

## Demo

A comprehensive demo is available in `context-length-management-demo.js` that showcases all the key features of the system.

## Integration with Other Modules

The Context Length Management System integrates with other AI-Tools modules:

- **promptEngineering.js:** For prompt optimization techniques
- **enhancedErrorHandling.js:** For error categorization and handling
- **tokenUtils.js:** For token counting and management
- **contextCollector.js:** For detailed error context collection

## Best Practices

1. **Always optimize prompts before sending:** Proactively optimize to prevent errors
2. **Use appropriate chunk sizes:** Balance between too many small chunks and too few large chunks
3. **Configure model-specific limits:** Different models have different context windows
4. **Monitor token usage:** Use the reporting features to track token usage and optimization rates
5. **Implement proper error handling:** Always handle context length exceeded errors gracefully

## For More Information

See the detailed documentation in `reports/summary-reports/context-length-management-summary.md` for more information on the implementation details and advanced usage.
