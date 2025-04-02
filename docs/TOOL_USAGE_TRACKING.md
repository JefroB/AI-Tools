# Tool Usage Tracking

> **Version: 25.091.C.1001** (2025-04-01, Version C, Attribution and API Integration)

This document explains how to use the Tool Usage Tracker to monitor function calls, estimate token savings, and analyze efficiency in your AI-Tools projects.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Tracking Functions](#tracking-functions)
4. [Analyzing Usage](#analyzing-usage)
5. [Cross-Referencing with Claude](#cross-referencing-with-claude)
6. [Visualization](#visualization)
7. [Best Practices](#best-practices)
8. [API Reference](#api-reference)
9. [Version Information](#version-information)

## Overview

The Tool Usage Tracker is a system for monitoring how your application uses the AI-Tools library. It tracks function calls, estimates token savings, and provides insights into efficiency. By using this tracker, you can:

- Monitor which tools are used most frequently
- Estimate how many tokens are saved by using local tools instead of API calls
- Identify performance bottlenecks and error-prone tools
- Cross-reference tool usage with Claude token usage
- Generate comprehensive analysis reports

This information helps you optimize your application for cost-efficiency and performance.

## Getting Started

### Installation

The Tool Usage Tracker is included in the AI-Tools library. No additional installation is required.

### Basic Setup

To start using the Tool Usage Tracker, initialize it in your application:

```javascript
const { toolUsageTracker } = require('ai-tools');

// Initialize with default configuration
await toolUsageTracker.initialize();

// Or with custom configuration
await toolUsageTracker.initialize({
  enabled: true,
  storageDir: path.resolve('metrics/tool-usage'),
  sampling: {
    enabled: false // Disable sampling for now
  }
});
```

## Tracking Functions

### Creating Proxied Functions

To track a function, wrap it with the `createToolProxy` function:

```javascript
const { toolUsageTracker } = require('ai-tools');

// Original function
async function readFile(filePath) {
  // Implementation...
}

// Proxied function that will be tracked
const trackedReadFile = toolUsageTracker.createToolProxy(readFile, 'fileUtils');

// Use the tracked function
const content = await trackedReadFile('path/to/file.txt');
```

### Organizing by Category

Group related functions by category to better organize your tracking:

```javascript
const fileUtils = {
  readFile: toolUsageTracker.createToolProxy(readFile, 'fileUtils'),
  writeFile: toolUsageTracker.createToolProxy(writeFile, 'fileUtils'),
  deleteFile: toolUsageTracker.createToolProxy(deleteFile, 'fileUtils')
};

const codeUtils = {
  formatCode: toolUsageTracker.createToolProxy(formatCode, 'codeUtils'),
  lintCode: toolUsageTracker.createToolProxy(lintCode, 'codeUtils')
};
```

### Custom Sanitization

For sensitive data, provide custom sanitizers:

```javascript
const apiUtils = {
  makeRequest: toolUsageTracker.createToolProxy(makeRequest, 'apiUtils', {
    // Custom sanitizer for API requests
    argumentSanitizer: (arg) => {
      if (typeof arg === 'string' && arg.startsWith('http')) {
        // Redact query parameters for privacy
        return arg.split('?')[0];
      }
      return arg;
    },
    // Custom sanitizer for API responses
    resultSanitizer: (result) => {
      if (result && result.auth) {
        return { ...result, auth: '<REDACTED>' };
      }
      return result;
    }
  })
};
```

## Analyzing Usage

### Getting Metrics

Retrieve metrics about tool usage:

```javascript
// Get all metrics
const metrics = toolUsageTracker.getToolUsageMetrics();

// Get metrics for a specific time range (last 24 hours)
const recentMetrics = toolUsageTracker.getToolUsageMetrics({
  timeRange: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
});

// Get metrics for a specific category
const fileMetrics = toolUsageTracker.getToolUsageMetrics({
  category: 'fileUtils'
});

// Get metrics for a specific tool
const readFileMetrics = toolUsageTracker.getToolUsageMetrics({
  tool: 'readFile'
});
```

### Interpreting Metrics

The metrics object contains:

- `metrics`: Overall metrics (calls, execution time, token savings)
- `byTool`: Metrics broken down by tool
- `byCategory`: Metrics broken down by category
- `entries`: Detailed log entries
- `system`: System information

Example:

```javascript
console.log(`Total calls: ${metrics.metrics.totalCalls}`);
console.log(`Total execution time: ${metrics.metrics.totalExecutionTime}ms`);
console.log(`Total estimated token savings: ${metrics.metrics.totalEstimatedTokenSavings}`);
console.log(`Error rate: ${metrics.metrics.errorRate * 100}%`);

// Most used tools
const topTools = Object.entries(metrics.byTool)
  .map(([name, data]) => ({ name, ...data }))
  .sort((a, b) => b.calls - a.calls)
  .slice(0, 5);

console.log('Top 5 most used tools:');
topTools.forEach(tool => {
  console.log(`- ${tool.name}: ${tool.calls} calls`);
});
```

## Cross-Referencing with Claude

### Basic Cross-Reference

Cross-reference tool usage with Claude token usage:

```javascript
const crossReference = await toolUsageTracker.crossReferenceWithClaudeUsage();

console.log(`Total tokens saved: ${crossReference.summary.totalTokensSaved}`);
console.log(`Total tokens used: ${crossReference.summary.totalTokensUsed}`);
console.log(`Efficiency ratio: ${crossReference.summary.efficiencyRatio * 100}%`);
console.log(`Estimated cost saved: $${crossReference.summary.costSaved}`);
```

### Generating Analysis Reports

Generate a comprehensive analysis report:

```javascript
const report = await toolUsageTracker.generateAnalysisReport();

console.log('Analysis Report:');
console.log(JSON.stringify(report, null, 2));

// Show recommendations
if (report.recommendations && report.recommendations.length > 0) {
  console.log('Recommendations:');
  report.recommendations.forEach(rec => {
    console.log(`- [${rec.impact.toUpperCase()}] ${rec.title}: ${rec.description}`);
  });
}
```

## Visualization

### ASCII Visualization

Generate a simple ASCII visualization of tool usage:

```javascript
const visualization = toolUsageTracker.visualizeToolUsage(metrics);
console.log(visualization);
```

### Custom Visualization

Customize the visualization:

```javascript
const customVisualization = toolUsageTracker.visualizeToolUsage(metrics, {
  width: 100, // Width of the bars
  showTools: 10 // Number of tools to show
});
```

## Best Practices

### Performance Considerations

- **Selective Tracking**: Only track functions that are important for your analysis
- **Sampling**: Enable sampling for high-volume applications
- **Batching**: Use batching to reduce I/O operations

```javascript
await toolUsageTracker.initialize({
  sampling: {
    enabled: true,
    baseRate: 0.1, // Sample 10% of calls
    minRate: 0.01, // Never go below 1%
    loadThreshold: 1000 // Adjust based on calls per minute
  },
  batching: {
    enabled: true,
    batchSize: 100,
    flushInterval: 30000 // 30 seconds
  }
});
```

### Privacy and Security

- Always use sanitizers for sensitive data
- Be careful with logging API keys, passwords, and personal information
- Consider the privacy implications of tracking user-specific data

### Maintenance

- Periodically clean up old log files
- Monitor the size of your metrics directory
- Reset metrics when they're no longer needed

```javascript
// Reset all metrics
toolUsageTracker.resetToolUsageMetrics();

// Reset metrics but keep detailed entries
toolUsageTracker.resetToolUsageMetrics({ keepEntries: true });
```

## API Reference

### `initialize(config)`

Initializes the Tool Usage Tracker with the specified configuration.

**Parameters:**
- `config` (Object): Configuration options
  - `enabled` (boolean): Whether tracking is enabled
  - `storageDir` (string): Directory to store metrics
  - `persistInterval` (number): Interval for persisting metrics (ms)
  - `retentionDays` (number): Days to retain

## Version Information

The Tool Usage Tracker follows the AI-Tools versioning system. The current version is:

```
25.091.C.1001
```

This breaks down as:
- **25**: Year 2025
- **091**: 91st day of the year (April 1st)
- **C**: Major version C
- **1001**: Feature build 1001 (Core functionality, build 001)

For more details on the versioning system, see [VERSIONING.md](VERSIONING.md).

### Version History

- **25.091.C.1001**: Initial release of the Tool Usage Tracker
  - Added function call tracking via proxy wrappers
  - Implemented token savings estimation
  - Added cross-referencing with Claude token usage
  - Added visualization capabilities
