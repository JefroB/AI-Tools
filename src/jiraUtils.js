/**
 * Jira Utilities Module for AI Tools
 * Provides specialized tools for Jira API integration, reference extraction, and caching
 */

const { memoize, memoizeAsync } = require('./memoizeUtils');
const { retryWithBackoff, throttleApiCalls } = require('./apiUtils');

/**
 * Default options for Jira reference extraction
 */
const DEFAULT_EXTRACTION_OPTIONS = {
  projectKeys: [],            // List of project keys to match (empty = match any)
  includeUrls: true,          // Whether to extract from URLs
  includeComments: true,      // Whether to extract from comment syntax
  maxResults: 100,            // Maximum number of references to extract
  deduplicate: true,          // Whether to deduplicate results
};

/**
 * Default options for Jira API memoization
 */
const DEFAULT_MEMO_OPTIONS = {
  ttl: {                      // Time-to-live by issue status (ms)
    default: 30 * 60 * 1000,  // Default: 30 minutes
    closed: 24 * 60 * 60 * 1000, // Closed issues: 24 hours
    resolved: 12 * 60 * 60 * 1000, // Resolved issues: 12 hours
  },
  maxSize: 1000,              // Maximum cache size
  statusField: 'status.name', // Path to status field in response
  keyField: 'key',            // Path to key field in response
};

/**
 * Default options for dependency graph building
 */
const DEFAULT_GRAPH_OPTIONS = {
  maxDepth: 3,                // Maximum depth to traverse
  relationshipTypes: [        // Relationship types to include
    'is blocked by',
    'blocks',
    'relates to',
    'is related to',
    'is a child of',
    'is a parent of',
    'depends on',
    'is a dependency of',
    'is cloned by',
    'is cloned from',
    'duplicates',
    'is duplicated by'
  ],
  includeFields: [            // Fields to include in issue data
    'key',
    'summary',
    'status',
    'issuetype',
    'priority',
    'assignee',
    'created',
    'updated'
  ],
  onProgress: null,           // Progress callback function
};

/**
 * Extracts Jira issue references from text
 * @param {string} text - Text to search for Jira references
 * @param {Object} options - Extraction options
 * @returns {Array} - Array of extracted Jira issue keys
 */
function extractJiraReferences(text, options = {}) {
  // Merge options with defaults
  const extractOptions = { ...DEFAULT_EXTRACTION_OPTIONS, ...options };
  
  // Validate input
  if (typeof text !== 'string' || !text) {
    return [];
  }
  
  const results = [];
  
  // Build project key pattern
  const projectKeyPattern = extractOptions.projectKeys.length > 0
    ? `(?:${extractOptions.projectKeys.join('|')})`
    : '[A-Z][A-Z0-9_]+'
  
  // Pattern for Jira issue keys (e.g., PROJ-123)
  const issueKeyPattern = new RegExp(`\\b(${projectKeyPattern}-\\d+)\\b`, 'g');
  
  // Extract issue keys from plain text
  let match;
  while ((match = issueKeyPattern.exec(text)) !== null) {
    if (results.length >= extractOptions.maxResults) break;
    results.push(match[1]);
  }
  
  // Extract from URLs if enabled
  if (extractOptions.includeUrls) {
    // Pattern for Jira URLs (e.g., https://jira.example.com/browse/PROJ-123)
    const urlPattern = new RegExp(`(?:https?://[^/]+/[^/]+/)(${projectKeyPattern}-\\d+)(?:[^A-Z0-9_-]|$)`, 'g');
    
    while ((match = urlPattern.exec(text)) !== null) {
      if (results.length >= extractOptions.maxResults) break;
      results.push(match[1]);
    }
  }
  
  // Extract from comments if enabled
  if (extractOptions.includeComments) {
    // Pattern for comments referencing Jira issues (e.g., // See PROJ-123)
    const commentPattern = new RegExp(`(?://|/\\*|\\*)\\s*(?:[^\\n]*?)\\b(${projectKeyPattern}-\\d+)\\b`, 'g');
    
    while ((match = commentPattern.exec(text)) !== null) {
      if (results.length >= extractOptions.maxResults) break;
      results.push(match[1]);
    }
  }
  
  // Deduplicate results if enabled
  if (extractOptions.deduplicate) {
    return [...new Set(results)];
  }
  
  return results.slice(0, extractOptions.maxResults);
}

/**
 * Gets a value from an object by path
 * @param {Object} obj - Object to get value from
 * @param {string} path - Path to value (e.g., 'status.name')
 * @returns {*} - Value at path or undefined
 */
function getValueByPath(obj, path) {
  if (!obj || !path) return undefined;
  
  const parts = path.split('.');
  let value = obj;
  
  for (const part of parts) {
    if (value === null || value === undefined) return undefined;
    value = value[part];
  }
  
  return value;
}

/**
 * Memoizes a Jira API call with intelligent invalidation based on issue status
 * @param {Function} jiraApiCall - The Jira API call to memoize
 * @param {Object} options - Memoization options
 * @returns {Function} - Memoized Jira API call
 */
function memoizeJiraCall(jiraApiCall, options = {}) {
  // Merge options with defaults
  const memoOptions = { ...DEFAULT_MEMO_OPTIONS, ...options };
  
  // Create a function to determine TTL based on issue status
  const getTtl = (result) => {
    if (!result) return memoOptions.ttl.default;
    
    // Get status from result
    const status = getValueByPath(result, memoOptions.statusField);
    if (!status) return memoOptions.ttl.default;
    
    // Normalize status to lowercase
    const normalizedStatus = status.toLowerCase();
    
    // Check for closed or resolved status
    if (normalizedStatus.includes('closed') || normalizedStatus.includes('done')) {
      return memoOptions.ttl.closed;
    }
    
    if (normalizedStatus.includes('resolved') || normalizedStatus.includes('fixed')) {
      return memoOptions.ttl.resolved;
    }
    
    return memoOptions.ttl.default;
  };
  
  // Create a custom key generator that includes the issue key
  const keyGenerator = (...args) => {
    // Extract issue key from arguments if possible
    let issueKey = null;
    
    // Check if first argument is an issue key
    if (args.length > 0 && typeof args[0] === 'string' && /^[A-Z]+-\d+$/.test(args[0])) {
      issueKey = args[0];
    }
    // Check if first argument is an object with an issue key
    else if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
      issueKey = args[0].issueKey || args[0].key;
    }
    
    // Create a key that includes the issue key if available
    return `jira:${issueKey || 'api'}:${JSON.stringify(args)}`;
  };
  
  // Create the memoized function with dynamic TTL
  const memoizedCall = memoizeAsync(jiraApiCall, {
    keyGenerator,
    maxSize: memoOptions.maxSize,
    // We'll set a default TTL and then update it based on the result
    ttl: memoOptions.ttl.default,
    // Track metrics to see how effective the cache is
    trackMetrics: true
  });
  
  // Return a wrapper function that updates the TTL based on the result
  return async function(...args) {
    try {
      const result = await memoizedCall(...args);
      
      // Get the appropriate TTL based on the result
      const ttl = getTtl(result);
      
      // Update the cache entry with the appropriate TTL
      // This is a bit of a hack, but it works because we have access to the memoizedCall's cache
      const cacheKey = keyGenerator(...args);
      const cache = memoizedCall.cache;
      const cacheEntry = cache && cache.get ? cache.get(cacheKey) : null;
      
      if (cacheEntry) {
        cacheEntry.expiry = Date.now() + ttl;
        memoizedCall.cache.set(cacheKey, cacheEntry);
      }
      
      return result;
    } catch (error) {
      // If there's an error, we don't want to cache it
      throw error;
    }
  };
}

/**
 * Builds a dependency graph of Jira issues
 * @param {string} issueKey - Starting issue key
 * @param {Function} jiraClient - Jira API client function
 * @param {Object} options - Graph options
 * @returns {Object} - Issue dependency graph
 */
async function buildIssueDependencyGraph(issueKey, jiraClient, options = {}) {
  // Merge options with defaults
  const graphOptions = { ...DEFAULT_GRAPH_OPTIONS, ...options };
  
  // Validate inputs
  if (!issueKey || typeof issueKey !== 'string') {
    throw new Error('Issue key must be a non-empty string');
  }
  
  if (typeof jiraClient !== 'function') {
    throw new Error('Jira client must be a function');
  }
  
  // Initialize graph
  const graph = {
    nodes: {},
    edges: [],
    metadata: {
      rootIssue: issueKey,
      createdAt: new Date().toISOString(),
      options: { ...graphOptions }
    }
  };
  
  // Set of visited issue keys to avoid cycles
  const visited = new Set();
  
  // Queue of issues to process
  const queue = [{ key: issueKey, depth: 0 }];
  
  // Total number of issues to process (for progress tracking)
  let totalIssues = 1;
  let processedIssues = 0;
  
  // Process the queue
  while (queue.length > 0) {
    const { key, depth } = queue.shift();
    
    // Skip if already visited
    if (visited.has(key)) {
      continue;
    }
    
    // Mark as visited
    visited.add(key);
    
    try {
      // Fetch issue data
      const issueData = await jiraClient(key, {
        fields: graphOptions.includeFields.join(','),
        expand: 'issuelinks'
      });
      
      // Extract relevant issue data
      const fields = issueData.fields || {};
      const status = fields.status || {};
      const issuetype = fields.issuetype || {};
      const priority = fields.priority || {};
      const assignee = fields.assignee || {};
      
      const node = {
        key: issueData.key,
        summary: fields.summary || '',
        status: status.name || '',
        type: issuetype.name || '',
        priority: priority.name || '',
        assignee: assignee.displayName || '',
        created: fields.created || '',
        updated: fields.updated || ''
      };
      
      // Add node to graph
      graph.nodes[key] = node;
      
      // Increment processed issues
      processedIssues++;
      
      // Call progress callback if provided
      if (typeof graphOptions.onProgress === 'function') {
        graphOptions.onProgress({
          processed: processedIssues,
          total: totalIssues,
          percentage: (processedIssues / totalIssues) * 100,
          currentIssue: key
        });
      }
      
      // Stop if we've reached the maximum depth
      if (depth >= graphOptions.maxDepth) {
        continue;
      }
      
      // Process issue links
      const issueLinks = (issueData.fields && issueData.fields.issuelinks) || [];
      
      for (const link of issueLinks) {
        // Determine relationship type and linked issue
        let relationshipType = (link.type && link.type.name) || '';
        let linkedIssue = null;
        let direction = '';
        
        if (link.outwardIssue) {
          linkedIssue = link.outwardIssue;
          direction = 'outward';
          relationshipType = (link.type && link.type.outward) || relationshipType;
        } else if (link.inwardIssue) {
          linkedIssue = link.inwardIssue;
          direction = 'inward';
          relationshipType = (link.type && link.type.inward) || relationshipType;
        }
        
        // Skip if no linked issue or relationship type not in options
        if (!linkedIssue || !graphOptions.relationshipTypes.includes(relationshipType)) {
          continue;
        }
        
        // Add edge to graph
        graph.edges.push({
          source: key,
          target: linkedIssue.key,
          type: relationshipType,
          direction
        });
        
        // Add linked issue to queue if not visited
        if (!visited.has(linkedIssue.key)) {
          queue.push({ key: linkedIssue.key, depth: depth + 1 });
          totalIssues++;
        }
      }
    } catch (error) {
      console.error(`Error processing issue ${key}:`, error);
      
      // Add error node to graph
      graph.nodes[key] = {
        key,
        error: error.message || 'Unknown error',
        errorType: error.name || 'Error'
      };
      
      // Increment processed issues
      processedIssues++;
      
      // Call progress callback if provided
      if (typeof graphOptions.onProgress === 'function') {
        graphOptions.onProgress({
          processed: processedIssues,
          total: totalIssues,
          percentage: (processedIssues / totalIssues) * 100,
          currentIssue: key,
          error
        });
      }
    }
  }
  
  return graph;
}

/**
 * Creates a throttled and retrying Jira client
 * @param {Function} jiraApiCall - Base Jira API call function
 * @param {Object} options - Client options
 * @returns {Function} - Enhanced Jira client
 */
function createJiraClient(jiraApiCall, options = {}) {
  // Default options
  const defaultOptions = {
    retry: {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      jitter: true
    },
    throttle: {
      requestsPerSecond: 5,
      burstSize: 2,
      maxQueueSize: 100
    },
    memoize: {
      enabled: true,
      ...DEFAULT_MEMO_OPTIONS
    }
  };
  
  // Merge options with defaults
  const clientOptions = {
    ...defaultOptions,
    ...options,
    retry: { ...defaultOptions.retry, ...options.retry },
    throttle: { ...defaultOptions.throttle, ...options.throttle },
    memoize: { ...defaultOptions.memoize, ...options.memoize }
  };
  
  // Create throttled function
  const throttledCall = throttleApiCalls(jiraApiCall, clientOptions.throttle);
  
  // Create retrying function
  const retryingCall = (params) => retryWithBackoff(
    () => throttledCall(params),
    clientOptions.retry
  );
  
  // Create memoized function if enabled
  if (clientOptions.memoize.enabled) {
    return memoizeJiraCall(retryingCall, clientOptions.memoize);
  }
  
  return retryingCall;
}

/**
 * Extracts blocking issue references from Jira comments
 * @param {string} text - Comment text to search
 * @param {Object} options - Extraction options
 * @returns {Array} - Array of blocking issue references
 */
function extractBlockingReferences(text, options = {}) {
  // Default options
  const defaultOptions = {
    blockingKeywords: [
      'block', 'blocks', 'blocked', 'blocking',
      'depend', 'depends', 'dependent', 'dependency',
      'wait', 'waiting', 'blocker', 'hold', 'holding'
    ],
    contextSize: 10, // Words before/after to consider as context
    ...DEFAULT_EXTRACTION_OPTIONS
  };
  
  // Merge options with defaults
  const extractOptions = { ...defaultOptions, ...options };
  
  // Validate input
  if (typeof text !== 'string' || !text) {
    return [];
  }
  
  // Extract all Jira references
  const allReferences = extractJiraReferences(text, extractOptions);
  
  // If no references found, return empty array
  if (allReferences.length === 0) {
    return [];
  }
  
  // Build regex pattern for blocking keywords
  const keywordPattern = new RegExp(
    `\\b(${extractOptions.blockingKeywords.join('|')})\\b`,
    'i'
  );
  
  // Find references that are mentioned in a blocking context
  const blockingReferences = [];
  
  for (const reference of allReferences) {
    // Find the reference in the text
    const refIndex = text.indexOf(reference);
    if (refIndex === -1) continue;
    
    // Get context around the reference
    const contextStart = Math.max(0, refIndex - 100);
    const contextEnd = Math.min(text.length, refIndex + reference.length + 100);
    const context = text.substring(contextStart, contextEnd);
    
    // Check if any blocking keywords are in the context
    if (keywordPattern.test(context)) {
      blockingReferences.push({
        key: reference,
        context
      });
    }
  }
  
  return blockingReferences;
}

module.exports = {
  extractJiraReferences,
  memoizeJiraCall,
  buildIssueDependencyGraph,
  createJiraClient,
  extractBlockingReferences
};
