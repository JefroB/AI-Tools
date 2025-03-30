/**
 * Directory Utility Module for AI Tools
 * Provides enhanced directory operations
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * List files in a directory with enhanced options
 * @param {string} dirPath - Path to the directory
 * @param {Object} options - Options for listing files
 * @param {boolean} options.recursive - Whether to list files recursively (default: false)
 * @param {string|Array<string>} options.filter - File extension(s) to filter by (e.g., '.js' or ['.js', '.json'])
 * @param {boolean} options.includeDirectories - Whether to include directories in the results (default: false)
 * @param {boolean} options.fullPaths - Whether to return full paths (default: false)
 * @returns {Promise<Array<string>>} - Array of file paths
 */
async function listFiles(dirPath, options = {}) {
  try {
    // Resolve the directory path
    const resolvedPath = path.resolve(dirPath);
    
    // Set default options
    const recursive = options.recursive || false;
    const includeDirectories = options.includeDirectories || false;
    const fullPaths = options.fullPaths || false;
    
    // Check if directory exists
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`Directory not found: ${resolvedPath}`);
    }
    
    // Check if it's a directory
    const stats = await fs.stat(resolvedPath);
    if (!stats.isDirectory()) {
      throw new Error(`Not a directory: ${resolvedPath}`);
    }
    
    // Function to filter files by extension
    const filterByExtension = (filePath) => {
      if (!options.filter) return true;
      
      const fileExt = path.extname(filePath).toLowerCase();
      if (Array.isArray(options.filter)) {
        return options.filter.map(ext => ext.toLowerCase()).includes(fileExt);
      }
      return fileExt === options.filter.toLowerCase();
    };
    
    // Read directory contents
    if (recursive) {
      // For recursive listing, use a more complex approach
      const items = [];
      
      // Helper function for recursive directory traversal
      const traverseDir = async (currentPath, relativePath = '') => {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const entryPath = path.join(currentPath, entry.name);
          const entryRelativePath = path.join(relativePath, entry.name);
          
          if (entry.isDirectory()) {
            if (includeDirectories) {
              items.push(fullPaths ? entryPath : entryRelativePath);
            }
            await traverseDir(entryPath, entryRelativePath);
          } else if (filterByExtension(entry.name)) {
            items.push(fullPaths ? entryPath : entryRelativePath);
          }
        }
      };
      
      await traverseDir(resolvedPath);
      return items;
    } else {
      // For non-recursive listing, simply read the directory
      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
      
      return entries
        .filter(entry => {
          if (entry.isDirectory()) return includeDirectories;
          return filterByExtension(entry.name);
        })
        .map(entry => {
          const entryPath = path.join(resolvedPath, entry.name);
          return fullPaths ? entryPath : entry.name;
        });
    }
  } catch (error) {
    throw new Error(`Error listing files in directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Create a directory if it doesn't exist
 * @param {string} dirPath - Path to the directory to create
 * @param {Object} options - Options for creating the directory
 * @param {boolean} options.recursive - Whether to create parent directories if they don't exist (default: true)
 * @returns {Promise<void>}
 */
async function createDirectory(dirPath, options = {}) {
  try {
    // Resolve the directory path
    const resolvedPath = path.resolve(dirPath);
    
    // Set default options
    const recursive = options.recursive !== undefined ? options.recursive : true;
    
    // Create the directory
    await fs.ensureDir(resolvedPath, { recursive });
  } catch (error) {
    throw new Error(`Error creating directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Check if a directory exists
 * @param {string} dirPath - Path to the directory to check
 * @returns {Promise<boolean>} - Whether the directory exists
 */
async function directoryExists(dirPath) {
  try {
    const resolvedPath = path.resolve(dirPath);
    
    // Check if path exists
    if (!await fs.pathExists(resolvedPath)) {
      return false;
    }
    
    // Check if it's a directory
    const stats = await fs.stat(resolvedPath);
    return stats.isDirectory();
  } catch (error) {
    throw new Error(`Error checking if directory exists ${dirPath}: ${error.message}`);
  }
}

/**
 * Delete a directory
 * @param {string} dirPath - Path to the directory to delete
 * @param {Object} options - Options for deleting the directory
 * @param {boolean} options.recursive - Whether to delete recursively (default: true)
 * @param {boolean} options.force - Whether to ignore errors (default: false)
 * @returns {Promise<void>}
 */
async function deleteDirectory(dirPath, options = {}) {
  try {
    // Resolve the directory path
    const resolvedPath = path.resolve(dirPath);
    
    // Set default options
    const recursive = options.recursive !== undefined ? options.recursive : true;
    const force = options.force || false;
    
    // Check if directory exists
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`Directory not found: ${resolvedPath}`);
    }
    
    // Check if it's a directory
    const stats = await fs.stat(resolvedPath);
    if (!stats.isDirectory()) {
      throw new Error(`Not a directory: ${resolvedPath}`);
    }
    
    // Delete the directory
    await fs.remove(resolvedPath, { recursive, force });
  } catch (error) {
    throw new Error(`Error deleting directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Copy a directory
 * @param {string} srcPath - Path to the source directory
 * @param {string} destPath - Path to the destination directory
 * @param {Object} options - Options for copying the directory
 * @param {boolean} options.overwrite - Whether to overwrite existing files (default: false)
 * @returns {Promise<void>}
 */
async function copyDirectory(srcPath, destPath, options = {}) {
  try {
    // Resolve the paths
    const resolvedSrcPath = path.resolve(srcPath);
    const resolvedDestPath = path.resolve(destPath);
    
    // Set default options
    const overwrite = options.overwrite || false;
    
    // Check if source directory exists
    if (!await fs.pathExists(resolvedSrcPath)) {
      throw new Error(`Source directory not found: ${resolvedSrcPath}`);
    }
    
    // Check if source is a directory
    const stats = await fs.stat(resolvedSrcPath);
    if (!stats.isDirectory()) {
      throw new Error(`Source is not a directory: ${resolvedSrcPath}`);
    }
    
    // Copy the directory
    await fs.copy(resolvedSrcPath, resolvedDestPath, { overwrite });
  } catch (error) {
    throw new Error(`Error copying directory from ${srcPath} to ${destPath}: ${error.message}`);
  }
}

module.exports = {
  listFiles,
  createDirectory,
  directoryExists,
  deleteDirectory,
  copyDirectory
};
