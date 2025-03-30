/**
 * AI Tools - Main Entry Point
 * Exports all utility functions
 */

const fileUtils = require('./fileUtils');
const dirUtils = require('./dirUtils');

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
  
  // Export the modules themselves for advanced usage
  fileUtils,
  dirUtils
};
