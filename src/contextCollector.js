/**
 * Context Collector Module for AI Tools
 * 
 * This module provides functionality to collect detailed context when failures occur,
 * enabling better debugging and analysis of AI-Tools operations.
 * 
 * Features:
 * - Code context capture (surrounding code where failures happen)
 * - State snapshots (before/after operations)
 * - Dependency chain tracking
 * - Resource usage monitoring
 * - Integration with toolUsageTracker
 */

const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { performance } = require('perf_hooks');
const os = require('os');
const safeStringify = require('fast-safe-stringify');

// Default configuration
const DEFAULT_CONFIG = {
  enabled: true,
  storageDir: path.resolve('metrics/context'),
  maxContextSize: 1024 * 1024, // 1MB max context size
  captureStackTraces: true,
  captureResourceUsage: true,
  captureStateSnapshots: true,
  sanitizeData: true,
  retentionDays: 30, // Keep context data for 30 days
  sensitivePatterns: [
    /password/i,
    /token/i,
    /api[_-]?key/i,
    /secret/i,
    /credential/i,
    /auth/i
  ]
};

// Runtime configuration
let config = { ...DEFAULT_CONFIG };

// Memory usage at startup (baseline)
const baselineMemoryUsage = process.memoryUsage();

// Active context collection sessions
const activeSessions = new Map();

/**
 * Initialize the context collector
 * @param {Object} customConfig - Custom configuration
 * @returns {Promise<void>}
 */
async function initialize(customConfig = {}) {
  try {
    // Merge custom configuration with defaults
    config = {
      ...DEFAULT_CONFIG,
      ...customConfig,
      sensitivePatterns: [
        ...DEFAULT_CONFIG.sensitivePatterns,
        ...(customConfig.sensitivePatterns || [])
      ]
    };
    
    // Ensure storage directory exists
    if (config.enabled) {
      await fs.ensureDir(config.storageDir);
    }
    
    // Set up cleanup job
    setInterval(() => {
      cleanupOldFiles().catch(console.error);
    }, 24 * 60 * 60 * 1000); // Run daily
    
    console.log('Context collector initialized with config:', JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(`Error initializing context collector: ${error.message}`);
    throw error;
  }
}

/**
 * Clean up old context files based on retention policy
 * @returns {Promise<void>}
 */
async function cleanupOldFiles() {
  try {
    // Get all context files
    const files = await fs.readdir(config.storageDir);
    const contextFiles = files.filter(file => file.endsWith('.json'));
    
    // Calculate cutoff date
    const cutoffTime = Date.now() - (config.retentionDays * 24 * 60 * 60 * 1000);
    
    // Delete old files
    for (const file of contextFiles) {
      try {
        const filePath = path.join(config.storageDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filePath);
          console.log(`Deleted old context file: ${file}`);
        }
      } catch (error) {
        console.error(`Error deleting old context file ${file}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`Error cleaning up old context files: ${error.message}`);
  }
}

/**
 * Start a new context collection session
 * @param {Object} options - Session options
 * @returns {string} - Session ID
 */
function startSession(options = {}) {
  if (!config.enabled) return null;
  
  try {
    const sessionId = options.sessionId || uuidv4();
    const scriptName = options.scriptName || getCallerScriptName();
    
    // Create session data
    const session = {
      id: sessionId,
      scriptName,
      startTime: Date.now(),
      startMemory: process.memoryUsage(),
      events: [],
      stateSnapshots: [],
      resourceUsage: [],
      commandLineArgs: process.argv.slice(2),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      hostname: os.hostname(),
      cpuInfo: os.cpus()[0]?.model || 'Unknown CPU',
      totalMemory: os.totalmem(),
      freeMemory: os.freemem()
    };
    
    // Store session
    activeSessions.set(sessionId, session);
    
    // Start resource monitoring if enabled
    if (config.captureResourceUsage) {
      session.resourceMonitorInterval = setInterval(() => {
        captureResourceUsage(sessionId);
      }, 1000); // Capture every second
    }
    
    return sessionId;
  } catch (error) {
    console.error(`Error starting context session: ${error.message}`);
    return null;
  }
}

/**
 * End a context collection session
 * @param {string} sessionId - Session ID
 * @param {Object} options - End options
 * @returns {Promise<string>} - Path to saved context file
 */
async function endSession(sessionId, options = {}) {
  if (!config.enabled || !sessionId || !activeSessions.has(sessionId)) {
    return null;
  }
  
  try {
    const session = activeSessions.get(sessionId);
    
    // Stop resource monitoring
    if (session.resourceMonitorInterval) {
      clearInterval(session.resourceMonitorInterval);
    }
    
    // Add end time and duration
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
    
    // Add final memory usage
    session.endMemory = process.memoryUsage();
    
    // Add status
    session.status = options.status || 'completed';
    
    // Add error if provided
    if (options.error) {
      session.error = {
        message: options.error.message,
        stack: config.captureStackTraces ? options.error.stack : undefined,
        code: options.error.code,
        name: options.error.name
      };
    }
    
    // Sanitize data if enabled
    const sanitizedSession = config.sanitizeData ? sanitizeSessionData(session) : session;
    
    // Save to file
    const filename = `context_${sessionId}.json`;
    const filePath = path.join(config.storageDir, filename);
    
    await fs.ensureDir(config.storageDir);
    await fs.writeJson(filePath, sanitizedSession, { spaces: 2 });
    
    // Remove from active sessions
    activeSessions.delete(sessionId);
    
    return filePath;
  } catch (error) {
    console.error(`Error ending context session: ${error.message}`);
    return null;
  }
}

/**
 * Add an event to a context session
 * @param {string} sessionId - Session ID
 * @param {Object} event - Event data
 * @returns {string} - Event ID
 */
function addEvent(sessionId, event) {
  if (!config.enabled || !sessionId || !activeSessions.has(sessionId)) {
    return null;
  }
  
  try {
    const session = activeSessions.get(sessionId);
    
    // Create event with ID and timestamp
    const eventId = event.id || uuidv4();
    const eventData = {
      id: eventId,
      timestamp: Date.now(),
      ...event
    };
    
    // Add to events array
    session.events.push(eventData);
    
    return eventId;
  } catch (error) {
    console.error(`Error adding event to context session: ${error.message}`);
    return null;
  }
}

/**
 * Capture a state snapshot
 * @param {string} sessionId - Session ID
 * @param {Object} state - State data
 * @param {string} label - Snapshot label
 * @returns {string} - Snapshot ID
 */
function captureStateSnapshot(sessionId, state, label = 'State Snapshot') {
  if (!config.enabled || !config.captureStateSnapshots || !sessionId || !activeSessions.has(sessionId)) {
    return null;
  }
  
  try {
    const session = activeSessions.get(sessionId);
    
    // Create snapshot with ID and timestamp
    const snapshotId = uuidv4();
    const snapshot = {
      id: snapshotId,
      timestamp: Date.now(),
      label,
      state
    };
    
    // Add to snapshots array
    session.stateSnapshots.push(snapshot);
    
    return snapshotId;
  } catch (error) {
    console.error(`Error capturing state snapshot: ${error.message}`);
    return null;
  }
}

/**
 * Capture resource usage
 * @param {string} sessionId - Session ID
 * @returns {Object|null} - Resource usage data
 */
function captureResourceUsage(sessionId) {
  if (!config.enabled || !config.captureResourceUsage || !sessionId || !activeSessions.has(sessionId)) {
    return null;
  }
  
  try {
    const session = activeSessions.get(sessionId);
    
    // Get current resource usage
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const freeMemory = os.freemem();
    
    // Calculate deltas from baseline
    const memoryDelta = {
      rss: memoryUsage.rss - baselineMemoryUsage.rss,
      heapTotal: memoryUsage.heapTotal - baselineMemoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed - baselineMemoryUsage.heapUsed,
      external: memoryUsage.external - baselineMemoryUsage.external
    };
    
    // Create resource usage data
    const resourceUsage = {
      timestamp: Date.now(),
      memory: memoryUsage,
      memoryDelta,
      cpu: cpuUsage,
      freeMemory,
      freeMemoryPercentage: (freeMemory / os.totalmem()) * 100
    };
    
    // Add to resource usage array
    session.resourceUsage.push(resourceUsage);
    
    return resourceUsage;
  } catch (error) {
    console.error(`Error capturing resource usage: ${error.message}`);
    return null;
  }
}

/**
 * Capture code context
 * @param {Error} error - Error object
 * @param {Object} options - Options
 * @returns {Object} - Code context
 */
function captureCodeContext(error, options = {}) {
  if (!config.enabled || !config.captureStackTraces) {
    return null;
  }
  
  try {
    // Default options
    const { 
      linesBefore = 5, 
      linesAfter = 5 
    } = options;
    
    // Get stack trace
    const stack = error.stack || new Error().stack;
    
    // Parse stack trace to get file and line information
    const stackLines = stack.split('\n');
    const fileLineRegex = /at\s+(?:.*\s+\()?(?:(.+):(\d+):(\d+))/;
    
    const codeContexts = [];
    
    // Process each stack frame
    for (let i = 1; i < stackLines.length; i++) {
      const match = fileLineRegex.exec(stackLines[i]);
      
      if (match) {
        const [, filePath, lineNumber, columnNumber] = match;
        
        // Skip node_modules and internal modules
        if (filePath.includes('node_modules') || !filePath.startsWith('/')) {
          continue;
        }
        
        try {
          // Read the file
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const lines = fileContent.split('\n');
          
          // Get line number as integer
          const line = parseInt(lineNumber, 10);
          
          // Calculate start and end lines
          const startLine = Math.max(0, line - linesBefore - 1);
          const endLine = Math.min(lines.length, line + linesAfter);
          
          // Extract the relevant lines
          const codeLines = lines.slice(startLine, endLine);
          
          // Add line numbers
          const codeWithLineNumbers = codeLines.map((codeLine, index) => {
            const currentLine = startLine + index + 1;
            const isErrorLine = currentLine === line;
            return {
              line: currentLine,
              code: codeLine,
              isErrorLine
            };
          });
          
          // Add to code contexts
          codeContexts.push({
            filePath,
            lineNumber: line,
            columnNumber: parseInt(columnNumber, 10),
            code: codeWithLineNumbers
          });
          
          // Only capture the first few frames
          if (codeContexts.length >= 3) {
            break;
          }
        } catch (readError) {
          console.error(`Error reading file for code context: ${readError.message}`);
        }
      }
    }
    
    return {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      contexts: codeContexts
    };
  } catch (error) {
    console.error(`Error capturing code context: ${error.message}`);
    return null;
  }
}

/**
 * Capture dependency chain
 * @param {Error} error - Error object
 * @returns {Array} - Dependency chain
 */
function captureDependencyChain(error) {
  if (!config.enabled || !config.captureStackTraces) {
    return null;
  }
  
  try {
    // Get stack trace
    const stack = error.stack || new Error().stack;
    
    // Parse stack trace
    const stackLines = stack.split('\n');
    const dependencyChain = [];
    
    // Process each stack frame
    for (let i = 1; i < stackLines.length; i++) {
      const line = stackLines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Extract function name and location
      const atMatch = line.match(/at\s+([^\s(]+)\s*\(?(.*?):(\d+):(\d+)\)?$/);
      
      if (atMatch) {
        const [, functionName, filePath, lineNumber, columnNumber] = atMatch;
        
        // Skip node_modules and internal modules
        if (filePath.includes('node_modules') || !filePath.startsWith('/')) {
          continue;
        }
        
        dependencyChain.push({
          functionName: functionName || 'anonymous',
          filePath,
          lineNumber: parseInt(lineNumber, 10),
          columnNumber: parseInt(columnNumber, 10)
        });
      }
    }
    
    return dependencyChain;
  } catch (error) {
    console.error(`Error capturing dependency chain: ${error.message}`);
    return null;
  }
}

/**
 * Sanitize session data to remove sensitive information
 * @param {Object} session - Session data
 * @returns {Object} - Sanitized session data
 */
function sanitizeSessionData(session) {
  if (!config.sanitizeData) {
    return session;
  }
  
  try {
    // Clone the session to avoid modifying the original
    const sanitized = JSON.parse(safeStringify(session));
    
    // Sanitize command line args
    if (sanitized.commandLineArgs) {
      sanitized.commandLineArgs = sanitized.commandLineArgs.map(arg => {
        // Check if arg contains sensitive information
        if (config.sensitivePatterns.some(pattern => pattern.test(arg))) {
          return '<REDACTED>';
        }
        return arg;
      });
    }
    
    // Sanitize environment variables
    if (sanitized.environment) {
      // Only keep non-sensitive environment name
      if (typeof sanitized.environment === 'object') {
        const envName = sanitized.environment.NODE_ENV || 'development';
        sanitized.environment = envName;
      }
    }
    
    // Sanitize state snapshots
    if (sanitized.stateSnapshots) {
      sanitized.stateSnapshots = sanitized.stateSnapshots.map(snapshot => {
        return {
          ...snapshot,
          state: sanitizeObject(snapshot.state)
        };
      });
    }
    
    // Sanitize events
    if (sanitized.events) {
      sanitized.events = sanitized.events.map(event => {
        // Sanitize event data
        const sanitizedEvent = { ...event };
        
        // Sanitize arguments if present
        if (sanitizedEvent.arguments) {
          sanitizedEvent.arguments = sanitizeObject(sanitizedEvent.arguments);
        }
        
        // Sanitize result if present
        if (sanitizedEvent.result) {
          sanitizedEvent.result = sanitizeObject(sanitizedEvent.result);
        }
        
        return sanitizedEvent;
      });
    }
    
    return sanitized;
  } catch (error) {
    console.error(`Error sanitizing session data: ${error.message}`);
    return session;
  }
}

/**
 * Sanitize an object to remove sensitive information
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  try {
    // Convert to string and back to handle circular references
    const objString = safeStringify(obj);
    const parsed = JSON.parse(objString);
    
    // Recursive function to sanitize object
    const sanitize = (object) => {
      if (!object || typeof object !== 'object') {
        return object;
      }
      
      // Handle arrays
      if (Array.isArray(object)) {
        return object.map(item => sanitize(item));
      }
      
      // Handle objects
      const result = {};
      
      for (const [key, value] of Object.entries(object)) {
        // Check if key contains sensitive information
        if (config.sensitivePatterns.some(pattern => pattern.test(key))) {
          result[key] = '<REDACTED>';
        } else if (typeof value === 'object' && value !== null) {
          // Recursively sanitize nested objects
          result[key] = sanitize(value);
        } else {
          result[key] = value;
        }
      }
      
      return result;
    };
    
    return sanitize(parsed);
  } catch (error) {
    console.error(`Error sanitizing object: ${error.message}`);
    return { sanitizationError: true };
  }
}

/**
 * Get the name of the script that called this function
 * @returns {string} - Script name
 */
function getCallerScriptName() {
  try {
    const stack = new Error().stack;
    const stackLines = stack.split('\n');
    
    // Find the first line that's not from this file
    for (let i = 1; i < stackLines.length; i++) {
      const line = stackLines[i];
      
      if (!line.includes('contextCollector.js')) {
        // Extract file path
        const match = line.match(/at\s+(?:.*\s+\()?(?:(.+):(\d+):(\d+))/);
        
        if (match) {
          const [, filePath] = match;
          return path.basename(filePath);
        }
      }
    }
    
    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Get a context session by ID
 * @param {string} sessionId - Session ID
 * @returns {Object|null} - Session data
 */
async function getSession(sessionId) {
  if (!config.enabled || !sessionId) {
    return null;
  }
  
  try {
    // Check if session is active
    if (activeSessions.has(sessionId)) {
      return activeSessions.get(sessionId);
    }
    
    // Try to load from file
    const filename = `context_${sessionId}.json`;
    const filePath = path.join(config.storageDir, filename);
    
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting context session: ${error.message}`);
    return null;
  }
}

/**
 * List all context sessions
 * @param {Object} options - Options
 * @returns {Promise<Array>} - List of sessions
 */
async function listSessions(options = {}) {
  if (!config.enabled) {
    return [];
  }
  
  try {
    const { limit = 100, status, startTime, endTime } = options;
    
    // Get all context files
    const files = await fs.readdir(config.storageDir);
    const contextFiles = files.filter(file => file.startsWith('context_') && file.endsWith('.json'));
    
    // Load session summaries
    const sessions = [];
    
    for (const file of contextFiles) {
      try {
        const filePath = path.join(config.storageDir, file);
        const session = await fs.readJson(filePath);
        
        // Filter by status if specified
        if (status && session.status !== status) {
          continue;
        }
        
        // Filter by start time if specified
        if (startTime && session.startTime < startTime) {
          continue;
        }
        
        // Filter by end time if specified
        if (endTime && session.endTime > endTime) {
          continue;
        }
        
        // Add summary to list
        sessions.push({
          id: session.id,
          scriptName: session.scriptName,
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration,
          status: session.status,
          error: session.error ? {
            message: session.error.message,
            name: session.error.name
          } : null,
          eventCount: session.events.length,
          snapshotCount: session.stateSnapshots.length
        });
      } catch (error) {
        console.error(`Error loading context session from file ${file}: ${error.message}`);
      }
    }
    
    // Sort by start time (newest first)
    sessions.sort((a, b) => b.startTime - a.startTime);
    
    // Apply limit
    return sessions.slice(0, limit);
  } catch (error) {
    console.error(`Error listing context sessions: ${error.message}`);
    return [];
  }
}

/**
 * Handle an error with context collection
 * @param {Error} error - Error object
 * @param {Object} options - Options
 * @returns {Promise<string>} - Context ID
 */
async function handleError(error, options = {}) {
  if (!config.enabled) {
    return null;
  }
  
  try {
    const { sessionId, toolName, category, args } = options;
    
    // Create a new session if not provided
    const contextSessionId = sessionId || startSession({
      scriptName: options.scriptName || getCallerScriptName()
    });
    
    // Capture code context
    const codeContext = captureCodeContext(error);
    
    // Capture dependency chain
    const dependencyChain = captureDependencyChain(error);
    
    // Capture resource usage
    const resourceUsage = captureResourceUsage(contextSessionId);
    
    // Add error event
    addEvent(contextSessionId, {
      type: 'error',
      toolName,
      category,
      error: {
        message: error.message,
        name: error.name,
        code: error.code
      },
      arguments: args,
      codeContext,
      dependencyChain
    });
    
    // End session with error status
    const contextFilePath = await endSession(contextSessionId, {
      status: 'error',
      error
    });
    
    return contextSessionId;
  } catch (handlerError) {
    console.error(`Error in context error handler: ${handlerError.message}`);
    return null;
  }
}

// Initialize on module load
initialize().catch(console.error);

// Export functions
module.exports = {
  initialize,
  startSession,
  endSession,
  addEvent,
  captureStateSnapshot,
  captureResourceUsage,
  captureCodeContext,
  captureDependencyChain,
  getSession,
  listSessions,
  handleError
};
