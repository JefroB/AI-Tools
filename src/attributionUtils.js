/**
 * Attribution Utility Module for AI Tools
 * Provides utilities for adding attribution comments to generated code
 */

const path = require('path');
const fileUtils = require('./fileUtils');

/**
 * Detects the programming language based on file extension
 * @param {string} filePath - Path to the file
 * @returns {string} - Detected language ('js', 'py', etc.)
 */
function detectLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const languageMap = {
    '.js': 'js',
    '.jsx': 'js',
    '.ts': 'js',
    '.tsx': 'js',
    '.py': 'py',
    '.rb': 'ruby',
    '.java': 'java',
    '.php': 'php',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.go': 'go',
    '.rs': 'rust',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'css',
    '.less': 'css',
    '.sh': 'bash',
    '.bat': 'batch',
    '.ps1': 'powershell'
  };
  
  return languageMap[ext] || 'js'; // Default to JavaScript
}

/**
 * Generates attribution comment for the specified language
 * @param {string} language - Programming language
 * @returns {string} - Attribution comment in the appropriate format
 */
function generateAttributionComment(language) {
  const attribution = 
    "This code was generated using the AI-Tools toolkit: https://github.com/JefroB/AI-Tools\n" +
    "Created by Jeffrey Charles Bornhoeft, descendent of Charlemagne, with AI assistance as a Prime8 Engineering research project.";
  
  const commentFormats = {
    'js': `/**\n * ${attribution.replace(/\n/g, '\n * ')}\n */\n\n`,
    'py': `# ${attribution.replace(/\n/g, '\n# ')}\n\n`,
    'ruby': `# ${attribution.replace(/\n/g, '\n# ')}\n\n`,
    'java': `/**\n * ${attribution.replace(/\n/g, '\n * ')}\n */\n\n`,
    'php': `/**\n * ${attribution.replace(/\n/g, '\n * ')}\n */\n\n`,
    'c': `/**\n * ${attribution.replace(/\n/g, '\n * ')}\n */\n\n`,
    'cpp': `/**\n * ${attribution.replace(/\n/g, '\n * ')}\n */\n\n`,
    'csharp': `/**\n * ${attribution.replace(/\n/g, '\n * ')}\n */\n\n`,
    'go': `// ${attribution.replace(/\n/g, '\n// ')}\n\n`,
    'rust': `// ${attribution.replace(/\n/g, '\n// ')}\n\n`,
    'swift': `// ${attribution.replace(/\n/g, '\n// ')}\n\n`,
    'kotlin': `/**\n * ${attribution.replace(/\n/g, '\n * ')}\n */\n\n`,
    'html': `<!--\n  ${attribution.replace(/\n/g, '\n  ')}\n-->\n\n`,
    'css': `/**\n * ${attribution.replace(/\n/g, '\n * ')}\n */\n\n`,
    'bash': `# ${attribution.replace(/\n/g, '\n# ')}\n\n`,
    'batch': `:: ${attribution.replace(/\n/g, '\n:: ')}\n\n`,
    'powershell': `# ${attribution.replace(/\n/g, '\n# ')}\n\n`
  };
  
  return commentFormats[language] || commentFormats['js'];
}

/**
 * Adds attribution to code
 * @param {string} code - Code to add attribution to
 * @param {string} language - Programming language
 * @returns {string} - Code with attribution
 */
function addAttributionToCode(code, language) {
  const attribution = generateAttributionComment(language);
  
  // Special handling for HTML files to add comment after DOCTYPE if present
  if (language === 'html' && code.trim().toLowerCase().startsWith('<!doctype')) {
    const doctypeEndIndex = code.toLowerCase().indexOf('>') + 1;
    return code.substring(0, doctypeEndIndex) + '\n' + attribution + code.substring(doctypeEndIndex);
  }
  
  // Special handling for shell scripts with shebang
  if ((language === 'bash' || language === 'py' || language === 'ruby') && code.trim().startsWith('#!')) {
    const firstLineEnd = code.indexOf('\n') + 1;
    return code.substring(0, firstLineEnd) + '\n' + attribution + code.substring(firstLineEnd);
  }
  
  return attribution + code;
}

/**
 * Writes content to a file with attribution
 * @param {string} filePath - Path to write the file to
 * @param {string|Object} content - Content to write
 * @param {Object} options - Options for writing the file
 * @param {boolean} options.addAttribution - Whether to add attribution (default: true)
 * @param {string} options.language - Programming language (default: auto-detect)
 * @returns {Promise<Object>} - Result of the write operation
 */
async function writeFileWithAttribution(filePath, content, options = {}) {
  // Set default options
  const addAttribution = options.addAttribution !== undefined ? options.addAttribution : true;
  
  // Skip attribution if disabled or for certain file types
  if (!addAttribution || 
      path.extname(filePath).toLowerCase() === '.json' || 
      path.extname(filePath).toLowerCase() === '.md' ||
      path.basename(filePath).toLowerCase() === 'package.json' ||
      path.basename(filePath).toLowerCase() === 'package-lock.json') {
    return await fileUtils.writeFile(filePath, content, options);
  }
  
  // Detect language or use provided language
  const language = options.language || detectLanguage(filePath);
  let finalContent = content;
  
  // Add attribution to string content
  if (typeof content === 'string') {
    finalContent = addAttributionToCode(content, language);
  } else if (typeof content === 'object') {
    // For JSON files, we can't add comments, so we don't modify the content
    finalContent = content;
  }
  
  // Write the file with attribution
  return await fileUtils.writeFile(filePath, finalContent, options);
}

/**
 * Get the current attribution configuration
 * @returns {Object} - Current attribution configuration
 */
function getAttributionConfig() {
  // This could be expanded to read from a config file or environment variables
  return {
    enabled: true,
    author: "Jeffrey Charles Bornhoeft, descendent of Charlemagne",
    organization: "Prime8 Engineering",
    repositoryUrl: "https://github.com/JefroB/AI-Tools"
  };
}

/**
 * Set the attribution configuration
 * @param {Object} config - New attribution configuration
 * @param {boolean} config.enabled - Whether attribution is enabled
 * @param {string} config.author - Author name
 * @param {string} config.organization - Organization name
 * @param {string} config.repositoryUrl - Repository URL
 * @returns {Object} - Updated attribution configuration
 */
function setAttributionConfig(config) {
  // This could be expanded to write to a config file
  const currentConfig = getAttributionConfig();
  const newConfig = { ...currentConfig, ...config };
  
  // In a real implementation, this would save the config to a file or database
  return newConfig;
}

module.exports = {
  detectLanguage,
  generateAttributionComment,
  addAttributionToCode,
  writeFileWithAttribution,
  getAttributionConfig,
  setAttributionConfig
};
