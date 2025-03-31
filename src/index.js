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
  metricsUtils
};
