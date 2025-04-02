/**
 * Jira Utilities Demo
 * 
 * This example demonstrates how to use the Jira utilities to extract Jira references,
 * memoize Jira API calls, and build dependency graphs of Jira issues.
 */

const aiTools = require('../src/index');

// Mock Jira API client for demonstration purposes
const mockJiraClient = {
  // Simulated Jira API call to get issue details
  async getIssue(issueKey, options = {}) {
    console.log(`Fetching issue: ${issueKey}`);
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate random failures (20% chance)
    if (Math.random() < 0.2) {
      throw new Error(`Failed to fetch issue ${issueKey}`);
    }
    
    // Generate mock issue data
    const issueTypes = ['Bug', 'Task', 'Story', 'Epic'];
    const statuses = ['Open', 'In Progress', 'In Review', 'Done', 'Closed'];
    const priorities = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];
    
    // Deterministic randomness based on issue key
    const hash = issueKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const getRandomItem = (array) => array[hash % array.length];
    
    // Create mock issue data
    return {
      key: issueKey,
      fields: {
        summary: `Sample issue ${issueKey}`,
        description: `This is a sample description for issue ${issueKey}`,
        issuetype: {
          name: getRandomItem(issueTypes)
        },
        status: {
          name: getRandomItem(statuses)
        },
        priority: {
          name: getRandomItem(priorities)
        },
        assignee: {
          displayName: 'John Doe'
        },
        created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date().toISOString(),
        issuelinks: [
          {
            type: {
              name: 'Blocks',
              inward: 'is blocked by',
              outward: 'blocks'
            },
            outwardIssue: {
              key: `DEMO-${(parseInt(issueKey.split('-')[1]) + 1)}`
            }
          },
          {
            type: {
              name: 'Relates',
              inward: 'relates to',
              outward: 'relates to'
            },
            inwardIssue: {
              key: `DEMO-${(parseInt(issueKey.split('-')[1]) - 1)}`
            }
          }
        ]
      }
    };
  }
};

/**
 * Example 1: Extracting Jira References
 * 
 * This example demonstrates how to extract Jira issue references from text.
 */
function extractReferencesExample() {
  console.log('\n=== Extracting Jira References Example ===');
  
  // Example 1: Extract from plain text
  const text1 = `
    We need to fix the bug described in PROJ-123 before we can implement
    the feature requested in PROJ-456. This is related to the epic EPIC-789.
  `;
  
  console.log('Extracting from plain text:');
  console.log(text1);
  
  const references1 = aiTools.extractJiraReferences(text1);
  console.log('\nExtracted references:');
  console.log(references1);
  
  // Example 2: Extract from text with URLs
  const text2 = `
    Please check these issues:
    - https://jira.example.com/browse/PROJ-123
    - https://jira.example.com/browse/PROJ-456?filter=myissues
    - EPIC-789
  `;
  
  console.log('\nExtracting from text with URLs:');
  console.log(text2);
  
  const references2 = aiTools.extractJiraReferences(text2);
  console.log('\nExtracted references:');
  console.log(references2);
  
  // Example 3: Extract from code comments
  const text3 = `
    /**
     * This function implements the feature described in FEAT-123
     * TODO: Fix the bug reported in BUG-456
     */
    function someFunction() {
      // This is related to PROJ-789
      console.log('Hello, world!');
    }
  `;
  
  console.log('\nExtracting from code comments:');
  console.log(text3);
  
  const references3 = aiTools.extractJiraReferences(text3);
  console.log('\nExtracted references:');
  console.log(references3);
  
  // Example 4: Extract with specific project keys
  const text4 = `
    Issues to fix:
    - PROJ-123: High priority
    - FEAT-456: Medium priority
    - BUG-789: Low priority
    - TEST-101: Not a real issue
  `;
  
  console.log('\nExtracting with specific project keys:');
  console.log(text4);
  
  const references4 = aiTools.extractJiraReferences(text4, {
    projectKeys: ['PROJ', 'BUG']
  });
  
  console.log('\nExtracted references (PROJ and BUG only):');
  console.log(references4);
}

/**
 * Example 2: Extracting Blocking References
 * 
 * This example demonstrates how to extract blocking issue references from text.
 */
function extractBlockingReferencesExample() {
  console.log('\n=== Extracting Blocking References Example ===');
  
  // Example 1: Extract blocking references from plain text
  const text1 = `
    We can't proceed with PROJ-123 because it's blocked by PROJ-456.
    PROJ-789 is also waiting on PROJ-456 to be completed.
    PROJ-101 is related to PROJ-202 but not blocking.
  `;
  
  console.log('Extracting blocking references from text:');
  console.log(text1);
  
  const blockingRefs1 = aiTools.extractBlockingReferences(text1);
  console.log('\nExtracted blocking references:');
  console.log(blockingRefs1);
  
  // Example 2: Extract blocking references from code comments
  const text2 = `
    /**
     * This feature is blocked by BUG-123
     * We need to wait for the dependency in FEAT-456
     */
    function blockedFeature() {
      // This is related to PROJ-789 but not blocking
      console.log('This feature is blocked!');
    }
  `;
  
  console.log('\nExtracting blocking references from code comments:');
  console.log(text2);
  
  const blockingRefs2 = aiTools.extractBlockingReferences(text2);
  console.log('\nExtracted blocking references:');
  console.log(blockingRefs2);
  
  // Example 3: Extract with custom blocking keywords
  const text3 = `
    PROJ-123 is waiting for PROJ-456.
    PROJ-789 depends on PROJ-456.
    PROJ-101 is a prerequisite for PROJ-202.
    PROJ-303 is related to PROJ-404.
  `;
  
  console.log('\nExtracting with custom blocking keywords:');
  console.log(text3);
  
  const blockingRefs3 = aiTools.extractBlockingReferences(text3, {
    blockingKeywords: ['waiting', 'depends', 'prerequisite']
  });
  
  console.log('\nExtracted blocking references:');
  console.log(blockingRefs3);
}

/**
 * Example 3: Memoizing Jira API Calls
 * 
 * This example demonstrates how to memoize Jira API calls to reduce API usage.
 */
async function memoizeJiraCallExample() {
  console.log('\n=== Memoizing Jira API Calls Example ===');
  
  // Create a memoized version of the Jira API client
  const memoizedJiraClient = aiTools.memoizeJiraCall(
    mockJiraClient.getIssue.bind(mockJiraClient),
    {
      ttl: {
        default: 5 * 1000, // 5 seconds (for demo purposes)
        closed: 10 * 1000, // 10 seconds for closed issues
        resolved: 8 * 1000 // 8 seconds for resolved issues
      },
      maxSize: 100,
      statusField: 'fields.status.name'
    }
  );
  
  // Example 1: First call (cache miss)
  console.log('\nFirst call to get issue DEMO-123:');
  try {
    const issue1 = await memoizedJiraClient('DEMO-123');
    console.log(`Got issue: ${issue1.key} - ${issue1.fields.summary}`);
    console.log(`Status: ${issue1.fields.status.name}`);
  } catch (error) {
    console.error('Error fetching issue:', error.message);
  }
  
  // Example 2: Second call (cache hit)
  console.log('\nSecond call to get the same issue (should be cached):');
  try {
    const issue2 = await memoizedJiraClient('DEMO-123');
    console.log(`Got issue: ${issue2.key} - ${issue2.fields.summary}`);
    console.log(`Status: ${issue2.fields.status.name}`);
  } catch (error) {
    console.error('Error fetching issue:', error.message);
  }
  
  // Example 3: Different issue (cache miss)
  console.log('\nCall to get a different issue DEMO-456:');
  try {
    const issue3 = await memoizedJiraClient('DEMO-456');
    console.log(`Got issue: ${issue3.key} - ${issue3.fields.summary}`);
    console.log(`Status: ${issue3.fields.status.name}`);
  } catch (error) {
    console.error('Error fetching issue:', error.message);
  }
  
  // Example 4: Wait for cache to expire
  console.log('\nWaiting for cache to expire (6 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 6000));
  
  // Example 5: Call after cache expiry (cache miss)
  console.log('\nCall after cache expiry:');
  try {
    const issue4 = await memoizedJiraClient('DEMO-123');
    console.log(`Got issue: ${issue4.key} - ${issue4.fields.summary}`);
    console.log(`Status: ${issue4.fields.status.name}`);
  } catch (error) {
    console.error('Error fetching issue:', error.message);
  }
}

/**
 * Example 4: Building Issue Dependency Graph
 * 
 * This example demonstrates how to build a dependency graph of Jira issues.
 */
async function buildDependencyGraphExample() {
  console.log('\n=== Building Issue Dependency Graph Example ===');
  
  // Create a Jira client with retry and throttling
  const jiraClient = aiTools.createJiraClient(
    mockJiraClient.getIssue.bind(mockJiraClient),
    {
      retry: {
        maxRetries: 3,
        initialDelay: 500
      },
      throttle: {
        requestsPerSecond: 2
      },
      memoize: {
        enabled: true,
        ttl: {
          default: 60 * 1000 // 1 minute
        }
      }
    }
  );
  
  // Build a dependency graph starting from a specific issue
  console.log('\nBuilding dependency graph for issue DEMO-100:');
  try {
    const graph = await aiTools.buildIssueDependencyGraph('DEMO-100', jiraClient, {
      maxDepth: 2,
      relationshipTypes: ['is blocked by', 'blocks', 'relates to'],
      includeFields: ['key', 'summary', 'status', 'issuetype'],
      onProgress: ({ processed, total, percentage }) => {
        console.log(`Progress: ${processed}/${total} issues (${percentage.toFixed(1)}%)`);
      }
    });
    
    // Display the graph
    console.log('\nDependency graph:');
    console.log(`Root issue: ${graph.metadata.rootIssue}`);
    console.log(`Nodes: ${Object.keys(graph.nodes).length}`);
    console.log(`Edges: ${graph.edges.length}`);
    
    // Display nodes
    console.log('\nNodes:');
    Object.entries(graph.nodes).slice(0, 3).forEach(([key, node]) => {
      console.log(`- ${key}: ${node.summary} (${node.status})`);
    });
    
    if (Object.keys(graph.nodes).length > 3) {
      console.log(`... and ${Object.keys(graph.nodes).length - 3} more nodes`);
    }
    
    // Display edges
    console.log('\nEdges:');
    graph.edges.slice(0, 3).forEach(edge => {
      console.log(`- ${edge.source} ${edge.type} ${edge.target}`);
    });
    
    if (graph.edges.length > 3) {
      console.log(`... and ${graph.edges.length - 3} more edges`);
    }
    
    // Example of how to find blocked issues
    const blockedIssues = graph.edges
      .filter(edge => edge.type === 'is blocked by')
      .map(edge => ({
        issue: edge.source,
        blockedBy: edge.target
      }));
    
    console.log('\nBlocked issues:');
    blockedIssues.forEach(({ issue, blockedBy }) => {
      console.log(`- ${issue} is blocked by ${blockedBy}`);
    });
    
  } catch (error) {
    console.error('Error building dependency graph:', error.message);
  }
}

/**
 * Example 5: Combining Multiple Techniques
 * 
 * This example demonstrates how to combine multiple Jira utilities.
 */
async function combinedExample() {
  console.log('\n=== Combined Example ===');
  
  // Example text with Jira references
  const text = `
    We need to implement the feature described in DEMO-101.
    This feature is blocked by DEMO-102 and depends on DEMO-103.
    It's also related to DEMO-104 but that's not blocking.
    
    See the details at https://jira.example.com/browse/DEMO-101
    
    // TODO: Fix the bug in DEMO-105 before releasing
  `;
  
  console.log('Analyzing text for Jira references:');
  console.log(text);
  
  // Step 1: Extract all Jira references
  const allReferences = aiTools.extractJiraReferences(text);
  console.log('\nAll Jira references:');
  console.log(allReferences);
  
  // Step 2: Extract blocking references
  const blockingReferences = aiTools.extractBlockingReferences(text);
  console.log('\nBlocking references:');
  console.log(blockingReferences);
  
  // Step 3: Create a Jira client
  const jiraClient = aiTools.createJiraClient(
    mockJiraClient.getIssue.bind(mockJiraClient),
    {
      retry: { maxRetries: 2 },
      throttle: { requestsPerSecond: 2 },
      memoize: { enabled: true }
    }
  );
  
  // Step 4: Fetch details for blocking issues
  console.log('\nFetching details for blocking issues:');
  
  const blockingIssueKeys = blockingReferences.map(ref => ref.key);
  const blockingIssues = [];
  
  for (const issueKey of blockingIssueKeys) {
    try {
      const issue = await jiraClient(issueKey);
      blockingIssues.push({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        type: issue.fields.issuetype.name
      });
      console.log(`Fetched ${issue.key}: ${issue.fields.summary} (${issue.fields.status.name})`);
    } catch (error) {
      console.error(`Error fetching ${issueKey}:`, error.message);
    }
  }
  
  // Step 5: Build a dependency graph for the main issue
  if (allReferences.length > 0) {
    const mainIssue = allReferences[0];
    console.log(`\nBuilding dependency graph for main issue ${mainIssue}:`);
    
    try {
      const graph = await aiTools.buildIssueDependencyGraph(mainIssue, jiraClient, {
        maxDepth: 1
      });
      
      console.log(`Graph built with ${Object.keys(graph.nodes).length} nodes and ${graph.edges.length} edges`);
      
      // Display the main issue's direct dependencies
      console.log('\nDirect dependencies:');
      graph.edges
        .filter(edge => edge.source === mainIssue)
        .forEach(edge => {
          const targetNode = graph.nodes[edge.target];
          console.log(`- ${edge.type} ${edge.target}: ${targetNode.summary} (${targetNode.status})`);
        });
    } catch (error) {
      console.error('Error building dependency graph:', error.message);
    }
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    extractReferencesExample();
    extractBlockingReferencesExample();
    await memoizeJiraCallExample();
    await buildDependencyGraphExample();
    await combinedExample();
    
    console.log('\nAll examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the examples
runAllExamples();
