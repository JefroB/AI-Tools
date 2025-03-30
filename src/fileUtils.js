/**
 * File Utility Module for AI Tools
 * Provides enhanced file reading and writing capabilities
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * Read a file with enhanced error handling and automatic parsing
 * @param {string} filePath - Path to the file to read
 * @param {Object} options - Options for reading the file
 * @param {boolean} options.parse - Whether to parse the file as JSON (default: auto-detect based on extension)
 * @param {string} options.encoding - File encoding (default: 'utf8')
 * @returns {Promise<string|Object>} - File contents as string or parsed object
 */
async function readFile(filePath, options = {}) {
  try {
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    
    // Set default options
    const encoding = options.encoding || 'utf8';
    const shouldParse = options.parse !== undefined 
      ? options.parse 
      : path.extname(filePath).toLowerCase() === '.json';
    
    // Check if file exists
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    // Read the file
    const content = await fs.readFile(resolvedPath, { encoding });
    
    // Parse if needed
    if (shouldParse) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        throw new Error(`Error parsing JSON file ${filePath}: ${parseError.message}`);
      }
    }
    
    return content;
  } catch (error) {
    throw new Error(`Error reading file ${filePath}: ${error.message}`);
  }
}

/**
 * Write content to a file with enhanced error handling
 * @param {string} filePath - Path to write the file to
 * @param {string|Object} content - Content to write (objects will be stringified)
 * @param {Object} options - Options for writing the file
 * @param {boolean} options.createDir - Whether to create directories if they don't exist (default: true)
 * @param {boolean} options.pretty - Whether to pretty-print JSON (default: true for objects)
 * @param {string} options.encoding - File encoding (default: 'utf8')
 * @returns {Promise<void>}
 */
async function writeFile(filePath, content, options = {}) {
  try {
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    
    // Set default options
    const encoding = options.encoding || 'utf8';
    const createDir = options.createDir !== undefined ? options.createDir : true;
    const pretty = options.pretty !== undefined ? options.pretty : typeof content === 'object';
    
    // Create directory if it doesn't exist
    if (createDir) {
      await fs.ensureDir(path.dirname(resolvedPath));
    }
    
    // Convert content to string if it's an object
    let finalContent = content;
    if (typeof content === 'object') {
      try {
        finalContent = pretty 
          ? JSON.stringify(content, null, 2) 
          : JSON.stringify(content);
      } catch (stringifyError) {
        throw new Error(`Error stringifying object: ${stringifyError.message}`);
      }
    }
    
    // Write the file
    await fs.writeFile(resolvedPath, finalContent, { encoding });
  } catch (error) {
    throw new Error(`Error writing file ${filePath}: ${error.message}`);
  }
}

/**
 * Append content to a file with enhanced error handling
 * @param {string} filePath - Path to the file to append to
 * @param {string|Object} content - Content to append (objects will be stringified)
 * @param {Object} options - Options for appending to the file
 * @param {boolean} options.createDir - Whether to create directories if they don't exist (default: true)
 * @param {boolean} options.pretty - Whether to pretty-print JSON (default: true for objects)
 * @param {string} options.encoding - File encoding (default: 'utf8')
 * @returns {Promise<void>}
 */
async function appendFile(filePath, content, options = {}) {
  try {
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    
    // Set default options
    const encoding = options.encoding || 'utf8';
    const createDir = options.createDir !== undefined ? options.createDir : true;
    const pretty = options.pretty !== undefined ? options.pretty : typeof content === 'object';
    
    // Create directory if it doesn't exist
    if (createDir) {
      await fs.ensureDir(path.dirname(resolvedPath));
    }
    
    // Convert content to string if it's an object
    let finalContent = content;
    if (typeof content === 'object') {
      try {
        finalContent = pretty 
          ? JSON.stringify(content, null, 2) 
          : JSON.stringify(content);
      } catch (stringifyError) {
        throw new Error(`Error stringifying object: ${stringifyError.message}`);
      }
    }
    
    // Append to the file
    await fs.appendFile(resolvedPath, finalContent, { encoding });
  } catch (error) {
    throw new Error(`Error appending to file ${filePath}: ${error.message}`);
  }
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to the file to check
 * @returns {Promise<boolean>} - Whether the file exists
 */
async function fileExists(filePath) {
  try {
    const resolvedPath = path.resolve(filePath);
    return await fs.pathExists(resolvedPath);
  } catch (error) {
    throw new Error(`Error checking if file exists ${filePath}: ${error.message}`);
  }
}

/**
 * Delete a file
 * @param {string} filePath - Path to the file to delete
 * @returns {Promise<void>}
 */
async function deleteFile(filePath) {
  try {
    const resolvedPath = path.resolve(filePath);
    
    // Check if file exists
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    // Delete the file
    await fs.remove(resolvedPath);
  } catch (error) {
    throw new Error(`Error deleting file ${filePath}: ${error.message}`);
  }
}

module.exports = {
  readFile,
  writeFile,
  appendFile,
  fileExists,
  deleteFile
};
