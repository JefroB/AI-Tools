/**
 * AI Tools - Main Entry Point
 * Exports all utility functions
 */

const fileUtils = require('./fileUtils');
const dirUtils = require('./dirUtils');
const contextUtils = require('./contextUtils');
const codeUtils = require('./codeUtils');
const execUtils = require('./execUtils');
const projectUtils = require('./projectUtils');
const validationUtils = require('./validationUtils');
const cacheUtils = require('./cacheUtils');
const tokenUtils = require('./tokenUtils');
const metricsUtils = require('./metricsUtils');
const memoizeUtils = require('./memoizeUtils');
const apiUtils = require('./apiUtils');
const jiraUtils = require('./jiraUtils');
const uiTestUtils = require('./uiTestUtils');
const securityUtils = require('./securityUtils');
const versionUtils = require('./versionUtils');
const attributionUtils = require('./attributionUtils');
const consoleArt = require('./consoleArt');
const userPrefsUtils = require('./userPrefsUtils');
const toolUsageAnalyzer = require('./toolUsageAnalyzer');
const toolUsageTracker = require('./toolUsageTracker');
const contextCollector = require('./contextCollector');
const smartRecovery = require('./smartRecovery');
const configurationManager = require('./configurationManager');
const enhancedErrorHandling = require('./enhancedErrorHandling');
const promptEngineering = require('./promptEngineering');
const contextLengthManager = require('./contextLengthManager');

// Export all utilities
module.exports = {
  // File utilities
  readFile: fileUtils.readFile,
  writeFile: fileUtils.writeFile,
  appendFile: fileUtils.appendFile,
  fileExists: fileUtils.fileExists,
  deleteFile: fileUtils.deleteFile,
  
  // Directory utilities
  listFiles: dirUtils.listFiles,
  createDirectory: dirUtils.createDirectory,
  directoryExists: dirUtils.directoryExists,
  deleteDirectory: dirUtils.deleteDirectory,
  copyDirectory: dirUtils.copyDirectory,
  
  // Context-aware reading and summarization
  readFileChunk: contextUtils.readFileChunk,
  readFileSection: contextUtils.readFileSection,
  getFileStructure: contextUtils.getFileStructure,
  summarizeFile: contextUtils.summarizeFile,
  summarizeDirectory: contextUtils.summarizeDirectory,
  
  // Code-specific operations
  findCodeBlock: codeUtils.findCodeBlock,
  findFunction: codeUtils.findFunction,
  findClass: codeUtils.findClass,
  replaceCodeBlock: codeUtils.replaceCodeBlock,
  addImport: codeUtils.addImport,
  removeImport: codeUtils.removeImport,
  formatFile: codeUtils.formatFile,
  lintFile: codeUtils.lintFile,
  
  // Execution and validation
  runShellCommand: execUtils.runShellCommand,
  runCommandWithOutput: execUtils.runCommandWithOutput,
  runNpmScript: execUtils.runNpmScript,
  runTests: execUtils.runTests,
  applyPatch: execUtils.applyPatch,
  
  // Project and dependency management
  readPackageJson: projectUtils.readPackageJson,
  getDependencies: projectUtils.getDependencies,
  addDependency: projectUtils.addDependency,
  removeDependency: projectUtils.removeDependency,
  
  // Schema validation
  generateSchema: validationUtils.generateSchema,
  validateInput: validationUtils.validateInput,
  validateOutput: validationUtils.validateOutput,
  validateWithWarnings: validationUtils.validateWithWarnings,
  
  // Caching
  getCachedResponse: cacheUtils.getCachedResponse,
  setCachedResponse: cacheUtils.setCachedResponse,
  invalidateCache: cacheUtils.invalidateCache,
  clearCache: cacheUtils.clearCache,
  getCacheStats: cacheUtils.getCacheStats,
  
  // Token optimization
  countTokens: tokenUtils.countTokens,
  truncateToTokenLimit: tokenUtils.truncateToTokenLimit,
  generateDiff: tokenUtils.generateDiff,
  applyDiff: tokenUtils.applyDiff,
  optimizePrompt: tokenUtils.optimizePrompt,
  extractRelevantCode: tokenUtils.extractRelevantCode,
  
  // Metrics collection
  recordMetric: metricsUtils.recordMetric,
  getMetricsSummary: metricsUtils.getMetricsSummary,
  resetMetrics: metricsUtils.resetMetrics,
  exportMetrics: metricsUtils.exportMetrics,
  visualizeMetrics: metricsUtils.visualizeMetrics,
  
  // Token efficiency metrics
  recordTokenEfficiency: metricsUtils.recordTokenEfficiency,
  recordTokenWastage: metricsUtils.recordTokenWastage,
  recordOptimizationImpact: metricsUtils.recordOptimizationImpact,
  generateTokenEfficiencyReport: metricsUtils.generateTokenEfficiencyReport,
  takeTokenEfficiencySnapshot: metricsUtils.takeTokenEfficiencySnapshot,
  calculateTrifectaScore: metricsUtils.calculateTrifectaScore,
  
  // Memoization utilities
  memoize: memoizeUtils.memoize,
  memoizeAsync: memoizeUtils.memoizeAsync,
  memoizeMethod: memoizeUtils.memoizeMethod,
  clearMemoCache: memoizeUtils.clearMemoCache,
  getMemoStats: memoizeUtils.getMemoStats,
  resetMemoStats: memoizeUtils.resetMemoStats,
  
  // API request optimization
  batchRequests: apiUtils.batchRequests,
  retryWithBackoff: apiUtils.retryWithBackoff,
  throttleApiCalls: apiUtils.throttleApiCalls,
  generateApiCacheKey: apiUtils.generateApiCacheKey,
  debounce: apiUtils.debounce,
  
  // Jira integration utilities
  extractJiraReferences: jiraUtils.extractJiraReferences,
  memoizeJiraCall: jiraUtils.memoizeJiraCall,
  buildIssueDependencyGraph: jiraUtils.buildIssueDependencyGraph,
  createJiraClient: jiraUtils.createJiraClient,
  extractBlockingReferences: jiraUtils.extractBlockingReferences,
  
  // UI testing utilities
  testColorContrast: uiTestUtils.testColorContrast,
  validateColorDistinction: uiTestUtils.validateColorDistinction,
  parseColor: uiTestUtils.parseColor,
  rgbToHsl: uiTestUtils.rgbToHsl,
  hslToRgb: uiTestUtils.hslToRgb,
  calculateContrastRatio: uiTestUtils.calculateContrastRatio,
  adjustColorForContrast: uiTestUtils.adjustColorForContrast,
  
  // Security utilities
  scanForVulnerabilities: securityUtils.scanForVulnerabilities,
  sanitizeInput: securityUtils.sanitizeInput,
  validatePassword: securityUtils.validatePassword,
  generateSecurePassword: securityUtils.generateSecurePassword,
  isSafeUrl: securityUtils.isSafeUrl,
  createCSP: securityUtils.createCSP,
  
  // Export the modules themselves for advanced usage
  fileUtils,
  dirUtils,
  contextUtils,
  codeUtils,
  execUtils,
  projectUtils,
  validationUtils,
  cacheUtils,
  tokenUtils,
  metricsUtils,
  memoizeUtils,
  apiUtils,
  jiraUtils,
  uiTestUtils,
  securityUtils,
  
  // Version utilities
  generateVersion: versionUtils.generateVersion,
  parseVersion: versionUtils.parseVersion,
  formatVersion: versionUtils.formatVersion,
  compareVersions: versionUtils.compareVersions,
  getCurrentVersion: versionUtils.getCurrentVersion,
  updateVersion: versionUtils.updateVersion,
  
  // Export the version module itself for advanced usage
  versionUtils,
  
  // Attribution utilities
  writeFileWithAttribution: attributionUtils.writeFileWithAttribution,
  addAttributionToCode: attributionUtils.addAttributionToCode,
  generateAttributionComment: attributionUtils.generateAttributionComment,
  detectLanguage: attributionUtils.detectLanguage,
  getAttributionConfig: attributionUtils.getAttributionConfig,
  setAttributionConfig: attributionUtils.setAttributionConfig,
  
  // Export the attribution module itself for advanced usage
  attributionUtils,
  
  // Console art utilities
  displayConsoleArt: consoleArt.displayConsoleArt,
  displaySuccess: consoleArt.displaySuccess,
  displayError: consoleArt.displayError,
  displayWarning: consoleArt.displayWarning,
  
  // Export the console art module itself for advanced usage
  consoleArt,
  
  // User preferences utilities
  getUserName: userPrefsUtils.getUserName,
  setUserName: userPrefsUtils.setUserName,
  getUserPreference: userPrefsUtils.getUserPreference,
  setUserPreference: userPrefsUtils.setUserPreference,
  resetUserPreferences: userPrefsUtils.resetUserPreferences,
  promptForUserName: userPrefsUtils.promptForUserName,
  
  // Export the user preferences module itself for advanced usage
  userPrefsUtils,
  
  // Tool Usage Analyzer utilities
  analyzeFile: toolUsageAnalyzer.analyzeFile,
  analyzeDirectory: toolUsageAnalyzer.analyzeDirectory,
  generateToolUsageReport: toolUsageAnalyzer.generateReport,
  analyzeAndGenerateReport: toolUsageAnalyzer.analyzeAndGenerateReport,
  identifyPotentialExtensions: toolUsageAnalyzer.identifyPotentialExtensions,
  
  // Export the tool usage analyzer module itself for advanced usage
  toolUsageAnalyzer,
  
  // Tool Usage Tracker utilities
  createToolProxy: toolUsageTracker.createToolProxy,
  getToolUsageMetrics: toolUsageTracker.getToolUsageMetrics,
  resetToolUsageMetrics: toolUsageTracker.resetToolUsageMetrics,
  crossReferenceWithClaudeUsage: toolUsageTracker.crossReferenceWithClaudeUsage,
  generateAnalysisReport: toolUsageTracker.generateAnalysisReport,
  visualizeToolUsage: toolUsageTracker.visualizeToolUsage,
  
  // Export the tool usage tracker module itself for advanced usage
  toolUsageTracker,
  
  // Context Collector utilities
  startSession: contextCollector.startSession,
  endSession: contextCollector.endSession,
  addEvent: contextCollector.addEvent,
  captureStateSnapshot: contextCollector.captureStateSnapshot,
  captureCodeContext: contextCollector.captureCodeContext,
  handleError: contextCollector.handleError,
  
  // Export the context collector module itself for advanced usage
  contextCollector,
  
  // Smart Recovery utilities
  retryWithBackoff: smartRecovery.retryWithBackoff,
  applyAdaptivePrompting: smartRecovery.applyAdaptivePrompting,
  applyFallbackStrategy: smartRecovery.applyFallbackStrategy,
  getCircuitBreakerStatus: smartRecovery.getCircuitBreakerStatus,
  
  // Export the smart recovery module itself for advanced usage
  smartRecovery,
  
  // Configuration Manager utilities
  getConfig: configurationManager.get,
  setConfig: configurationManager.set,
  removeConfig: configurationManager.remove,
  getAllConfig: configurationManager.getAll,
  generateConfigReport: configurationManager.generateConfigReport,
  
  // Export the configuration manager module itself for advanced usage
  configurationManager,
  
  // Enhanced Error Handling utilities
  executeWithRetry: enhancedErrorHandling.executeWithRetry,
  createApiClientWrapper: enhancedErrorHandling.createApiClientWrapper,
  getErrorStatistics: enhancedErrorHandling.getErrorStatistics,
  generateErrorReport: enhancedErrorHandling.generateErrorReport,
  
  // Export the enhanced error handling module itself for advanced usage
  enhancedErrorHandling,
  
  // Prompt Engineering utilities
  createTemplate: promptEngineering.createTemplate,
  updateTemplate: promptEngineering.updateTemplate,
  getTemplate: promptEngineering.getTemplate,
  applyTemplate: promptEngineering.applyTemplate,
  optimizePrompt: promptEngineering.optimizePrompt,
  
  // Export the prompt engineering module itself for advanced usage
  promptEngineering,
  
  // Context Length Manager utilities
  getTokenLimit: contextLengthManager.getTokenLimit,
  optimizePromptForTokenLimit: contextLengthManager.optimizePromptForTokenLimit,
  handleContextLengthExceeded: contextLengthManager.handleContextLengthExceeded,
  recordSuccess: contextLengthManager.recordSuccess,
  recordError: contextLengthManager.recordError,
  splitIntoChunks: contextLengthManager.splitIntoChunks,
  processInChunks: contextLengthManager.processInChunks,
  
  // Export the context length manager module itself for advanced usage
  contextLengthManager
};
