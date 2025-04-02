/**
 * Token Efficiency Metrics Demo
 * 
 * This example demonstrates how to use the token efficiency metrics
 * to track and optimize token usage in your applications.
 */

const aiTools = require('../src');
const { metricsUtils, tokenUtils } = aiTools;

async function main() {
  console.log('=== Token Efficiency Metrics Demo ===\n');

  // Initialize metrics with custom configuration
  await metricsUtils.initialize({
    enabled: true,
    storageDir: './metrics',
    persistInterval: 60 * 60 * 1000, // 1 hour
    maxMemoryEntries: 1000
  });

  // Simulate some API operations with different efficiency levels
  simulateApiOperations();

  // Generate and display a token efficiency report
  const report = metricsUtils.generateTokenEfficiencyReport();
  console.log('\n=== Token Efficiency Report ===\n');
  console.log(JSON.stringify(report, null, 2));

  // Calculate and display the trifecta score
  const trifectaScore = metricsUtils.calculateTrifectaScore();
  console.log('\n=== Trifecta Score (Good, Cheap, Fast) ===\n');
  console.log(`Quality Score: ${trifectaScore.quality.toFixed(2)}/100`);
  console.log(`Cost Score: ${trifectaScore.cost.toFixed(2)}/100`);
  console.log(`Speed Score: ${trifectaScore.speed.toFixed(2)}/100`);
  console.log(`Overall Score: ${trifectaScore.total.toFixed(2)}/100`);

  // Take a snapshot for historical tracking
  metricsUtils.takeTokenEfficiencySnapshot('daily');
  console.log('\nToken efficiency snapshot taken for historical tracking.');

  // Persist metrics to disk
  await metricsUtils.persistMetrics();
  console.log('\nMetrics persisted to disk.');
}

/**
 * Simulate various API operations with different efficiency levels
 */
function simulateApiOperations() {
  console.log('Simulating API operations with varying efficiency...\n');

  // Simulate a highly efficient operation
  simulateOperation('summarizeText', 500, 8, {
    text: 'A long document that needs summarization',
    maxLength: 100
  });

  // Simulate a moderately efficient operation
  simulateOperation('generateResponse', 1200, 7, {
    prompt: 'Write a product description for a new smartphone',
    style: 'professional'
  });

  // Simulate a less efficient operation
  simulateOperation('translateText', 800, 4, {
    text: 'A technical document with specialized terminology',
    sourceLanguage: 'English',
    targetLanguage: 'Spanish'
  });

  // Simulate an inefficient operation
  simulateOperation('generateCode', 2000, 3, {
    description: 'A complex algorithm with many edge cases',
    language: 'JavaScript'
  });

  // Simulate token wastage
  simulateTokenWastage();

  // Simulate optimization impact
  simulateOptimizationImpact();
}

/**
 * Simulate an API operation with token efficiency tracking
 * @param {string} operation - Operation name
 * @param {number} tokensUsed - Number of tokens used
 * @param {number} valueScore - Value score (1-10)
 * @param {Object} metadata - Additional metadata
 */
function simulateOperation(operation, tokensUsed, valueScore, metadata = {}) {
  // Record API call
  metricsUtils.recordMetric('api', 'call', 1, {
    tokens: {
      prompt: Math.floor(tokensUsed * 0.3),
      completion: Math.floor(tokensUsed * 0.7)
    },
    costs: {
      prompt: Math.floor(tokensUsed * 0.3) * 0.00001,
      completion: Math.floor(tokensUsed * 0.7) * 0.00003
    },
    latency: 500 + Math.random() * 1000
  });

  // Record token efficiency
  const efficiencyResult = metricsUtils.recordTokenEfficiency(
    operation,
    tokensUsed,
    valueScore,
    metadata
  );

  console.log(`Operation: ${operation}`);
  console.log(`  Tokens Used: ${tokensUsed}`);
  console.log(`  Value Score: ${valueScore}/10`);
  console.log(`  Efficiency Ratio: ${efficiencyResult.efficiencyRatio.toFixed(4)}`);
  console.log('');
}

/**
 * Simulate token wastage detection
 */
function simulateTokenWastage() {
  console.log('Detecting token wastage patterns...\n');

  // Simulate redundant API calls
  metricsUtils.recordTokenWastage('redundantCalls', 1200, {
    description: 'Multiple calls for the same data without caching'
  });
  console.log('Detected redundant API calls wasting 1200 tokens');

  // Simulate oversized prompts
  metricsUtils.recordTokenWastage('oversizedPrompts', 1800, {
    description: 'Including unnecessary context in prompts'
  });
  console.log('Detected oversized prompts wasting 1800 tokens');

  // Simulate unnecessary context
  metricsUtils.recordTokenWastage('unnecessaryContext', 900, {
    description: 'Including irrelevant information in context'
  });
  console.log('Detected unnecessary context wasting 900 tokens');

  // Simulate poor caching
  metricsUtils.recordTokenWastage('poorCaching', 1500, {
    description: 'Short cache TTL causing frequent recomputation'
  });
  console.log('Detected poor caching strategy wasting 1500 tokens\n');
}

/**
 * Simulate optimization impact tracking
 */
function simulateOptimizationImpact() {
  console.log('Tracking optimization impacts...\n');

  // Simulate prompt reduction optimization
  const promptReductionResult = metricsUtils.recordOptimizationImpact(
    'promptReduction',
    2000,
    1200,
    { description: 'Removed unnecessary instructions from prompt' }
  );
  console.log('Prompt Reduction:');
  console.log(`  Before: ${promptReductionResult.tokensBefore} tokens`);
  console.log(`  After: ${promptReductionResult.tokensAfter} tokens`);
  console.log(`  Saved: ${promptReductionResult.tokensSaved} tokens`);
  console.log(`  Improvement: ${promptReductionResult.percentImprovement.toFixed(1)}%`);
  console.log('');

  // Simulate context pruning optimization
  const contextPruningResult = metricsUtils.recordOptimizationImpact(
    'contextPruning',
    3000,
    1500,
    { description: 'Removed irrelevant context from conversation history' }
  );
  console.log('Context Pruning:');
  console.log(`  Before: ${contextPruningResult.tokensBefore} tokens`);
  console.log(`  After: ${contextPruningResult.tokensAfter} tokens`);
  console.log(`  Saved: ${contextPruningResult.tokensSaved} tokens`);
  console.log(`  Improvement: ${contextPruningResult.percentImprovement.toFixed(1)}%`);
  console.log('');

  // Simulate caching optimization
  const cachingResult = metricsUtils.recordOptimizationImpact(
    'caching',
    5000,
    0,
    { description: 'Implemented caching for frequently accessed data' }
  );
  console.log('Caching:');
  console.log(`  Before: ${cachingResult.tokensBefore} tokens`);
  console.log(`  After: ${cachingResult.tokensAfter} tokens`);
  console.log(`  Saved: ${cachingResult.tokensSaved} tokens`);
  console.log(`  Improvement: ${cachingResult.percentImprovement.toFixed(1)}%`);
  console.log('');

  // Simulate batching optimization
  const batchingResult = metricsUtils.recordOptimizationImpact(
    'batching',
    4000,
    2800,
    { description: 'Batched multiple requests into a single API call' }
  );
  console.log('Batching:');
  console.log(`  Before: ${batchingResult.tokensBefore} tokens`);
  console.log(`  After: ${batchingResult.tokensAfter} tokens`);
  console.log(`  Saved: ${batchingResult.tokensSaved} tokens`);
  console.log(`  Improvement: ${batchingResult.percentImprovement.toFixed(1)}%`);
  console.log('');
}

// Run the demo
main().catch(console.error);
