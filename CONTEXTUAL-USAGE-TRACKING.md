# Contextual Usage Tracking System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-1.0.0-green.svg)](https://github.com/yourusername/ai-tools)
[![Node.js](https://img.shields.io/badge/Node.js-v10.x+-yellow.svg)](https://nodejs.org/)

A comprehensive system for tracking, debugging, and recovering from errors in AI-powered applications. This system enhances the AI-Tools project with advanced error handling, context collection, and smart recovery capabilities.

## Features

### Enhanced Tool Usage Tracking

- **Script Execution Context**: Track script name, environment, and command-line arguments
- **Contextual Relationships**: Track parent-child relationships between tool calls
- **Session Tracking**: Group related operations for better analysis
- **Detailed Error Context**: Capture comprehensive information when errors occur

### Context Collection

- **Code Context**: Capture the surrounding code where failures happen
- **State Snapshots**: Take snapshots of relevant state before/after operations
- **Dependency Chain**: Track the chain of operations that led to a failure
- **Resource Usage**: Monitor memory/CPU usage to identify performance issues
- **Data Sanitization**: Automatically redact sensitive information

### Smart Recovery

- **Context-Aware Retry**: Retry operations with exponential backoff and jitter
- **Adaptive Prompting**: Modify prompts based on failure patterns
- **Context-Aware Fallbacks**: Implement fallback strategies informed by context
- **Circuit Breaker Pattern**: Prevent cascading failures

## Installation

```bash
npm install ai-tools
```

## Quick Start

```javascript
const { retryWithBackoff } = require('ai-tools/smartRecovery');
const { startSession, endSession, addEvent } = require('ai-tools/contextCollector');

// Start a context session
const sessionId = startSession({ scriptName: 'example.js' });

// Add an event to the session
addEvent(sessionId, {
  type: 'start',
  params: { foo: 'bar' }
});

// Use retry with backoff
try {
  const result = await retryWithBackoff(
    async () => {
      // Function that might fail
      return await someApiCall();
    },
    {
      maxRetries: 3,
      context: { sessionId }
    }
  );
  
  // Add success event
  addEvent(sessionId, {
    type: 'success',
    result
  });
  
  // End session with success
  await endSession(sessionId, { status: 'success' });
  
  return result;
} catch (error) {
  // Session will be ended by retryWithBackoff
  throw error;
}
```

## Key Benefits

1. **Improved Reliability**: Automatically recover from common failures
2. **Enhanced Debugging**: Detailed context makes it easier to diagnose and fix issues
3. **Proactive Failure Prevention**: Identify and mitigate potential failure points
4. **Better User Experience**: Ensure scripts continue to work even when encountering issues
5. **Reduced Development Time**: Spend less time diagnosing and fixing issues

## Modules

### toolUsageTracker.js

Enhanced version of the existing tool usage tracker with added contextual tracking capabilities.

```javascript
const toolUsageTracker = require('ai-tools/toolUsageTracker');

// Create a proxy wrapper for a function to track its usage
const trackedFunction = toolUsageTracker.createToolProxy(
  myFunction,
  'category',
  { name: 'myFunction' }
);
```

### contextCollector.js

New module for collecting detailed context when failures occur.

```javascript
const contextCollector = require('ai-tools/contextCollector');

// Start a context session
const sessionId = contextCollector.startSession({ scriptName: 'example.js' });

// Add an event to the session
contextCollector.addEvent(sessionId, { type: 'start', params: { foo: 'bar' } });

// Capture a state snapshot
contextCollector.captureStateSnapshot(sessionId, { count: 42 }, 'Initial State');

// Handle an error with context collection
const contextId = await contextCollector.handleError(error, {
  toolName: 'myFunction',
  category: 'api',
  args: { /* arguments */ }
});

// End a session
await contextCollector.endSession(sessionId, { status: 'success' });
```

### smartRecovery.js

New module for implementing context-aware recovery strategies.

```javascript
const smartRecovery = require('ai-tools/smartRecovery');

// Retry with backoff
const result = await smartRecovery.retryWithBackoff(
  myFunction,
  {
    maxRetries: 3,
    initialDelay: 1000,
    context: { sessionId }
  }
);

// Apply adaptive prompting
const adaptedPrompt = smartRecovery.applyAdaptivePrompting(
  originalPrompt,
  error
);

// Apply fallback strategy
const fallbackResult = await smartRecovery.applyFallbackStrategy(
  error,
  'api',
  {
    sessionId,
    alternativeApi: myAlternativeFunction,
    params: { /* parameters */ },
    defaultResponse: { /* default response */ }
  }
);

// Check circuit breaker status
const isOpen = smartRecovery.isCircuitOpen('my-service');
```

## Demo

Check out the [demo script](contextual-usage-tracking-demo.js) for examples of how to use the contextual usage tracking system.

```bash
node contextual-usage-tracking-demo.js
```

## Documentation

For more detailed documentation, see the [Contextual Usage Tracking System Report](reports/summary-reports/contextual-usage-tracking-summary.md).

## License

MIT
