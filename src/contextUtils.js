/**
 * Context Utility Module for AI Tools
 * Provides context-aware reading and summarization capabilities
 */

const fs = require('fs-extra');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

/**
 * Read a specific chunk of a file by line numbers
 * @param {string} filePath - Path to the file to read
 * @param {number} startLine - Starting line number (1-based)
 * @param {number} endLine - Ending line number (1-based, inclusive)
 * @param {Object} options - Options for reading the file
 * @param {string} options.encoding - File encoding (default: 'utf8')
 * @returns {Promise<string>} - The requested chunk of the file
 */
async function readFileChunk(filePath, startLine, endLine, options = {}) {
  try {
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    
    // Set default options
    const encoding = options.encoding || 'utf8';
    
    // Check if file exists
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    // Validate line numbers
    if (startLine < 1) {
      throw new Error('Start line must be at least 1');
    }
    
    if (endLine < startLine) {
      throw new Error('End line must be greater than or equal to start line');
    }
    
    // Read the file content
    const content = await fs.readFile(resolvedPath, { encoding });
    
    // Split into lines
    const lines = content.split(/\r?\n/);
    
    // Validate line range
    if (startLine > lines.length) {
      throw new Error(`Start line ${startLine} exceeds file length ${lines.length}`);
    }
    
    // Adjust for 0-based array indexing
    const start = startLine - 1;
    const end = Math.min(endLine, lines.length);
    
    // Extract the requested lines
    return lines.slice(start, end).join('\n');
  } catch (error) {
    throw new Error(`Error reading file chunk ${filePath}:${startLine}-${endLine}: ${error.message}`);
  }
}

/**
 * Read a section of a file between start and end tokens
 * @param {string} filePath - Path to the file to read
 * @param {string} startToken - Token marking the start of the section
 * @param {string} endToken - Token marking the end of the section
 * @param {Object} options - Options for reading the file
 * @param {string} options.encoding - File encoding (default: 'utf8')
 * @param {boolean} options.inclusive - Whether to include the start and end tokens (default: false)
 * @returns {Promise<string>} - The requested section of the file
 */
async function readFileSection(filePath, startToken, endToken, options = {}) {
  try {
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    
    // Set default options
    const encoding = options.encoding || 'utf8';
    const inclusive = options.inclusive || false;
    
    // Check if file exists
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    // Read the file content
    const content = await fs.readFile(resolvedPath, { encoding });
    
    // Find the start and end positions
    const startPos = content.indexOf(startToken);
    if (startPos === -1) {
      throw new Error(`Start token "${startToken}" not found in file`);
    }
    
    const endPos = content.indexOf(endToken, startPos + startToken.length);
    if (endPos === -1) {
      throw new Error(`End token "${endToken}" not found after start token in file`);
    }
    
    // Extract the section
    if (inclusive) {
      return content.substring(startPos, endPos + endToken.length);
    } else {
      return content.substring(startPos + startToken.length, endPos);
    }
  } catch (error) {
    throw new Error(`Error reading file section ${filePath}: ${error.message}`);
  }
}

/**
 * Get a structured representation of a directory
 * @param {string} dirPath - Path to the directory
 * @param {Object} options - Options for getting the file structure
 * @param {number} options.depth - Maximum depth to traverse (default: Infinity)
 * @param {boolean} options.respectGitignore - Whether to respect .gitignore rules (default: false)
 * @param {Array<string>} options.ignorePatterns - Glob patterns to ignore (e.g., ['node_modules/**', '.git/**'])
 * @param {boolean} options.includeStats - Whether to include file stats (size, modified date) (default: false)
 * @returns {Promise<Object>} - Structured representation of the directory
 */
async function getFileStructure(dirPath, options = {}) {
  try {
    // Resolve the directory path
    const resolvedPath = path.resolve(dirPath);
    
    // Set default options
    const depth = options.depth !== undefined ? options.depth : Infinity;
    const respectGitignore = options.respectGitignore || false;
    const ignorePatterns = options.ignorePatterns || [];
    const includeStats = options.includeStats || false;
    
    // Check if directory exists
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`Directory not found: ${resolvedPath}`);
    }
    
    // Check if it's a directory
    const stats = await fs.stat(resolvedPath);
    if (!stats.isDirectory()) {
      throw new Error(`Not a directory: ${resolvedPath}`);
    }
    
    // Load .gitignore patterns if needed
    let gitignorePatterns = [];
    if (respectGitignore) {
      const gitignorePath = path.join(resolvedPath, '.gitignore');
      if (await fs.pathExists(gitignorePath)) {
        const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
        gitignorePatterns = gitignoreContent
          .split(/\r?\n/)
          .filter(line => line.trim() && !line.startsWith('#'))
          .map(line => line.trim());
      }
    }
    
    // Combine ignore patterns
    const allIgnorePatterns = [...ignorePatterns, ...gitignorePatterns];
    
    // Helper function to check if a path should be ignored
    const shouldIgnore = (itemPath) => {
      const relativePath = path.relative(resolvedPath, itemPath);
      
      // Simple pattern matching (a more robust solution would use minimatch or similar)
      return allIgnorePatterns.some(pattern => {
        if (pattern.endsWith('/**')) {
          const dir = pattern.slice(0, -3);
          return relativePath === dir || relativePath.startsWith(dir + path.sep);
        } else if (pattern.endsWith('/*')) {
          const dir = pattern.slice(0, -2);
          return relativePath.startsWith(dir + path.sep) && 
                 !relativePath.slice(dir.length + 1).includes(path.sep);
        } else if (pattern.includes('*')) {
          // Very basic glob support - replace * with .* for regex
          const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*');
          return new RegExp(`^${regexPattern}$`).test(relativePath);
        } else {
          return relativePath === pattern;
        }
      });
    };
    
    // Recursive function to build the structure
    const buildStructure = async (currentPath, currentDepth = 0) => {
      if (currentDepth > depth) {
        return null;
      }
      
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      const result = {
        name: path.basename(currentPath),
        path: currentPath,
        type: 'directory',
        children: []
      };
      
      if (includeStats) {
        const dirStats = await fs.stat(currentPath);
        result.stats = {
          size: dirStats.size,
          modified: dirStats.mtime,
          created: dirStats.birthtime
        };
      }
      
      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry.name);
        
        // Skip ignored paths
        if (shouldIgnore(entryPath)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          const subStructure = await buildStructure(entryPath, currentDepth + 1);
          if (subStructure) {
            result.children.push(subStructure);
          }
        } else {
          const fileInfo = {
            name: entry.name,
            path: entryPath,
            type: 'file'
          };
          
          if (includeStats) {
            const fileStats = await fs.stat(entryPath);
            fileInfo.stats = {
              size: fileStats.size,
              modified: fileStats.mtime,
              created: fileStats.birthtime
            };
          }
          
          result.children.push(fileInfo);
        }
      }
      
      return result;
    };
    
    return await buildStructure(resolvedPath);
  } catch (error) {
    throw new Error(`Error getting file structure for ${dirPath}: ${error.message}`);
  }
}

/**
 * Generate a summary of a file
 * @param {string} filePath - Path to the file to summarize
 * @param {Object} options - Options for summarizing the file
 * @param {string} options.type - Type of summary ('code', 'text', 'auto') (default: 'auto')
 * @param {number} options.maxLines - Maximum number of lines to include in the summary (default: 10)
 * @returns {Promise<Object>} - Summary of the file
 */
async function summarizeFile(filePath, options = {}) {
  try {
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    
    // Set default options
    const type = options.type || 'auto';
    const maxLines = options.maxLines || 10;
    
    // Check if file exists
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    // Get file extension
    const ext = path.extname(resolvedPath).toLowerCase();
    
    // Determine file type if auto
    let fileType = type;
    if (fileType === 'auto') {
      const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.cs', '.go', '.rb', '.php', '.swift', '.kt', '.rs'];
      fileType = codeExtensions.includes(ext) ? 'code' : 'text';
    }
    
    // Read the file content
    const content = await fs.readFile(resolvedPath, 'utf8');
    const lines = content.split(/\r?\n/);
    
    // Create the summary object
    const summary = {
      path: resolvedPath,
      size: (await fs.stat(resolvedPath)).size,
      lines: lines.length,
      type: fileType
    };
    
    // Generate summary based on file type
    if (fileType === 'code') {
      // For code files, extract exports, functions, classes
      const exportMatches = content.match(/export\s+(const|let|var|function|class|default)\s+(\w+)/g) || [];
      const functionMatches = content.match(/function\s+(\w+)\s*\(/g) || [];
      const classMatches = content.match(/class\s+(\w+)(\s+extends\s+(\w+))?\s*\{/g) || [];
      
      summary.exports = exportMatches.map(match => match.replace(/export\s+(const|let|var|function|class|default)\s+/, ''));
      summary.functions = functionMatches.map(match => match.replace(/function\s+/, '').replace(/\s*\($/, ''));
      summary.classes = classMatches.map(match => match.replace(/class\s+/, '').replace(/\s*\{$/, ''));
      
      // Include first few lines (likely comments/imports)
      summary.preview = lines.slice(0, Math.min(maxLines, lines.length)).join('\n');
    } else {
      // For text files, include first and last few lines
      const halfMax = Math.floor(maxLines / 2);
      const firstLines = lines.slice(0, Math.min(halfMax, lines.length)).join('\n');
      
      if (lines.length <= maxLines) {
        summary.preview = content;
      } else {
        const lastLines = lines.slice(Math.max(0, lines.length - halfMax)).join('\n');
        summary.preview = `${firstLines}\n\n[...${lines.length - maxLines} more lines...]\n\n${lastLines}`;
      }
    }
    
    return summary;
  } catch (error) {
    throw new Error(`Error summarizing file ${filePath}: ${error.message}`);
  }
}

/**
 * Generate a summary of a directory
 * @param {string} dirPath - Path to the directory to summarize
 * @param {Object} options - Options for summarizing the directory
 * @param {boolean} options.recursive - Whether to summarize subdirectories (default: false)
 * @param {number} options.maxDepth - Maximum depth for recursive summarization (default: 2)
 * @param {Array<string>} options.ignorePatterns - Glob patterns to ignore
 * @returns {Promise<Object>} - Summary of the directory
 */
async function summarizeDirectory(dirPath, options = {}) {
  try {
    // Resolve the directory path
    const resolvedPath = path.resolve(dirPath);
    
    // Set default options
    const recursive = options.recursive || false;
    const maxDepth = options.maxDepth || 2;
    const ignorePatterns = options.ignorePatterns || [];
    
    // Check if directory exists
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`Directory not found: ${resolvedPath}`);
    }
    
    // Check if it's a directory
    const stats = await fs.stat(resolvedPath);
    if (!stats.isDirectory()) {
      throw new Error(`Not a directory: ${resolvedPath}`);
    }
    
    // Helper function to check if a path should be ignored
    const shouldIgnore = (itemPath) => {
      const relativePath = path.relative(resolvedPath, itemPath);
      
      // Simple pattern matching
      return ignorePatterns.some(pattern => {
        if (pattern.endsWith('/**')) {
          const dir = pattern.slice(0, -3);
          return relativePath === dir || relativePath.startsWith(dir + path.sep);
        } else if (pattern.endsWith('/*')) {
          const dir = pattern.slice(0, -2);
          return relativePath.startsWith(dir + path.sep) && 
                 !relativePath.slice(dir.length + 1).includes(path.sep);
        } else if (pattern.includes('*')) {
          // Very basic glob support - replace * with .* for regex
          const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*');
          return new RegExp(`^${regexPattern}$`).test(relativePath);
        } else {
          return relativePath === pattern;
        }
      });
    };
    
    // Recursive function to summarize directories
    const summarizeDir = async (currentPath, currentDepth = 0) => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      // Count files by type
      const fileTypes = {};
      const subdirs = [];
      let totalFiles = 0;
      let totalSize = 0;
      
      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry.name);
        
        // Skip ignored paths
        if (shouldIgnore(entryPath)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          subdirs.push(entryPath);
        } else {
          totalFiles++;
          const ext = path.extname(entry.name).toLowerCase() || '(no extension)';
          fileTypes[ext] = (fileTypes[ext] || 0) + 1;
          
          try {
            const fileStats = await fs.stat(entryPath);
            totalSize += fileStats.size;
          } catch (error) {
            // Ignore errors when getting file stats
          }
        }
      }
      
      // Create summary for current directory
      const summary = {
        path: currentPath,
        name: path.basename(currentPath),
        files: totalFiles,
        size: totalSize,
        fileTypes,
        subdirectories: subdirs.length
      };
      
      // Recursively summarize subdirectories if needed
      if (recursive && currentDepth < maxDepth) {
        summary.subdirectories = await Promise.all(
          subdirs.map(async subdir => {
            return await summarizeDir(subdir, currentDepth + 1);
          })
        );
      } else if (subdirs.length > 0) {
        summary.subdirectoryNames = subdirs.map(subdir => path.basename(subdir));
      }
      
      return summary;
    };
    
    return await summarizeDir(resolvedPath);
  } catch (error) {
    throw new Error(`Error summarizing directory ${dirPath}: ${error.message}`);
  }
}

module.exports = {
  readFileChunk,
  readFileSection,
  getFileStructure,
  summarizeFile,
  summarizeDirectory
};
