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
  
  // Export the modules themselves for advanced usage
  fileUtils,
  dirUtils,
  contextUtils,
  codeUtils,
  execUtils,
  projectUtils
};
