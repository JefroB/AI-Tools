/**
 * Token Utility Module for AI Tools
 * Provides token optimization utilities for Anthropic API
 */

const fs = require('fs-extra');
const path = require('path');
const diff = require('diff');

// Default token limits for Anthropic models
const DEFAULT_TOKEN_LIMITS = {
  'claude-3-opus': 200000,
  'claude-3-sonnet': 200000,
  'claude-3-haiku': 200000,
  'claude-2.1': 100000,
  'claude-2.0': 100000,
  'claude-instant-1.2': 100000,
  'default': 100000
};

/**
 * Count tokens for a string (Anthropic-specific)
 * @param {string} text - Text to count tokens for
 * @param {string} model - Model name
 * @returns {number} - Estimated token count
 */
function countTokens(text, model = 'claude-3-opus') {
  if (!text) return 0;
  
  // Simple estimation: ~4 characters per token for English text
  // This is a rough approximation for Claude models
  return Math.ceil(text.length / 4);
}

/**
 * Get token limit for a model
 * @param {string} model - Model name
 * @returns {number} - Token limit
 */
function getTokenLimit(model) {
  return DEFAULT_TOKEN_LIMITS[model] || DEFAULT_TOKEN_LIMITS.default;
}

/**
 * Truncate text to fit within token limit
 * @param {string} text - Text to truncate
 * @param {number} maxTokens - Maximum tokens allowed
 * @param {Object} options - Truncation options
 * @param {string} options.model - Model name for token counting
 * @param {boolean} options.preserveStart - Whether to preserve the start of the text (default: true)
 * @param {boolean} options.preserveEnd - Whether to preserve the end of the text (default: true)
 * @param {number} options.startRatio - Ratio of tokens to preserve at the start (default: 0.7)
 * @param {string} options.truncationMarker - Marker to insert at truncation points (default: "[...truncated...]")
 * @returns {Object} - Truncated text and token count
 */
function truncateToTokenLimit(text, maxTokens, options = {}) {
  const {
    model = 'claude-3-opus',
    preserveStart = true,
    preserveEnd = true,
    startRatio = 0.7,
    truncationMarker = "[...truncated...]"
  } = options;
  
  // Count tokens in the original text
  const tokenCount = countTokens(text, model);
  
  // If already under the limit, return as is
  if (tokenCount <= maxTokens) {
    return {
      text,
      tokenCount,
      truncated: false
    };
  }
  
  // Calculate tokens for truncation marker
  const markerTokens = countTokens(truncationMarker, model);
  
  // Adjust max tokens to account for marker
  const adjustedMaxTokens = maxTokens - markerTokens;
  
  // If we can't fit even with truncation, return error
  if (adjustedMaxTokens <= 0) {
    throw new Error(`Token limit too small to fit truncation marker (${markerTokens} tokens)`);
  }
  
  // Determine how to truncate based on options
  if (preserveStart && preserveEnd) {
    // Keep both start and end, remove middle
    const startTokens = Math.floor(adjustedMaxTokens * startRatio);
    const endTokens = adjustedMaxTokens - startTokens;
    
    // Convert tokens to approximate character counts
    const startChars = startTokens * 4;
    const endChars = endTokens * 4;
    
    // Split the text
    const startText = text.substring(0, startChars);
    const endText = text.substring(text.length - endChars);
    
    // Combine with truncation marker
    const truncatedText = startText + truncationMarker + endText;
    
    return {
      text: truncatedText,
      tokenCount: countTokens(truncatedText, model),
      truncated: true
    };
  } else if (preserveStart) {
    // Keep only the start
    const startChars = adjustedMaxTokens * 4;
    const truncatedText = text.substring(0, startChars) + truncationMarker;
    
    return {
      text: truncatedText,
      tokenCount: countTokens(truncatedText, model),
      truncated: true
    };
  } else if (preserveEnd) {
    // Keep only the end
    const endChars = adjustedMaxTokens * 4;
    const truncatedText = truncationMarker + text.substring(text.length - endChars);
    
    return {
      text: truncatedText,
      tokenCount: countTokens(truncatedText, model),
      truncated: true
    };
  } else {
    // Just truncate to the limit
    const chars = adjustedMaxTokens * 4;
    const truncatedText = text.substring(0, chars) + truncationMarker;
    
    return {
      text: truncatedText,
      tokenCount: countTokens(truncatedText, model),
      truncated: true
    };
  }
}

/**
 * Generate a diff between two texts
 * @param {string} originalText - Original text
 * @param {string} newText - New text
 * @param {Object} options - Diff options
 * @param {boolean} options.contextLines - Number of context lines to include (default: 3)
 * @returns {string} - Unified diff
 */
function generateDiff(originalText, newText, options = {}) {
  const { contextLines = 3 } = options;
  
  // Generate unified diff
  const patches = diff.createPatch(
    'text',
    originalText,
    newText,
    'Original',
    'Modified',
    { context: contextLines }
  );
  
  return patches;
}

/**
 * Apply a diff to original text
 * @param {string} originalText - Original text
 * @param {string} diffText - Diff to apply
 * @returns {string} - Text with diff applied
 */
function applyDiff(originalText, diffText) {
  // Parse the patch
  const patches = diff.parsePatch(diffText);
  
  // Apply the patch
  const result = diff.applyPatch(originalText, patches[0]);
  
  if (result === false) {
    throw new Error('Failed to apply diff: patch does not apply cleanly');
  }
  
  return result;
}

/**
 * Optimize a prompt for token usage
 * @param {Object} promptData - Prompt data
 * @param {string} promptData.system - System message
 * @param {Array<Object>} promptData.messages - Message history
 * @param {string} promptData.query - Current query
 * @param {Object} options - Optimization options
 * @param {string} options.model - Model name
 * @param {number} options.maxTokens - Maximum tokens allowed
 * @param {boolean} options.preserveQuery - Whether to preserve the query (default: true)
 * @param {boolean} options.preserveSystem - Whether to preserve the system message (default: true)
 * @returns {Object} - Optimized prompt data
 */
function optimizePrompt(promptData, options = {}) {
  const {
    model = 'claude-3-opus',
    maxTokens = getTokenLimit(model) * 0.9, // 90% of model's limit by default
    preserveQuery = true,
    preserveSystem = true
  } = options;
  
  // Clone the prompt data to avoid modifying the original
  const optimizedData = JSON.parse(JSON.stringify(promptData));
  
  // Count tokens in each component
  const systemTokens = countTokens(optimizedData.system || '', model);
  const queryTokens = countTokens(optimizedData.query || '', model);
  
  // Count tokens in messages
  const messageTokens = (optimizedData.messages || []).map(msg => ({
    ...msg,
    tokens: countTokens(msg.content, model)
  }));
  
  // Calculate total tokens
  const totalTokens = systemTokens + queryTokens + messageTokens.reduce((sum, msg) => sum + msg.tokens, 0);
  
  // If already under the limit, return as is
  if (totalTokens <= maxTokens) {
    return {
      ...optimizedData,
      tokenCount: totalTokens,
      optimized: false
    };
  }
  
  // Calculate how many tokens we need to remove
  let tokensToRemove = totalTokens - maxTokens;
  
  // Start optimizing messages (oldest first)
  if (tokensToRemove > 0 && optimizedData.messages && optimizedData.messages.length > 0) {
    // Sort messages by importance (keep most recent)
    const sortedMessages = [...messageTokens].sort((a, b) => {
      // Keep system messages at the top
      if (a.role === 'system' && b.role !== 'system') return -1;
      if (a.role !== 'system' && b.role === 'system') return 1;
      
      // Sort by timestamp or index if available
      if (a.timestamp && b.timestamp) return a.timestamp - b.timestamp;
      return 0; // Keep original order
    });
    
    // Remove or truncate messages until we're under the limit
    for (let i = 0; i < sortedMessages.length && tokensToRemove > 0; i++) {
      const msg = sortedMessages[i];
      
      // Skip system messages if preserveSystem is true
      if (preserveSystem && msg.role === 'system') continue;
      
      // If this message is small, just remove it entirely
      if (msg.tokens <= tokensToRemove) {
        tokensToRemove -= msg.tokens;
        msg.removed = true;
        continue;
      }
      
      // Otherwise, truncate the message
      const truncated = truncateToTokenLimit(msg.content, msg.tokens - tokensToRemove, {
        model,
        preserveStart: true,
        preserveEnd: false
      });
      
      msg.content = truncated.text;
      msg.truncated = true;
      tokensToRemove = 0;
    }
    
    // Filter out removed messages and update the optimized data
    optimizedData.messages = sortedMessages
      .filter(msg => !msg.removed)
      .map(({ role, content, truncated }) => ({ role, content, truncated }));
  }
  
  // If we still need to remove tokens and we can modify the system message
  if (tokensToRemove > 0 && !preserveSystem && optimizedData.system) {
    const truncated = truncateToTokenLimit(optimizedData.system, systemTokens - tokensToRemove, {
      model,
      preserveStart: true,
      preserveEnd: false
    });
    
    optimizedData.system = truncated.text;
    optimizedData.systemTruncated = true;
    tokensToRemove = 0;
  }
  
  // If we still need to remove tokens and we can modify the query
  if (tokensToRemove > 0 && !preserveQuery && optimizedData.query) {
    const truncated = truncateToTokenLimit(optimizedData.query, queryTokens - tokensToRemove, {
      model,
      preserveStart: true,
      preserveEnd: true,
      startRatio: 0.5 // Equal importance to start and end for queries
    });
    
    optimizedData.query = truncated.text;
    optimizedData.queryTruncated = true;
  }
  
  // Recalculate token count
  const finalSystemTokens = countTokens(optimizedData.system || '', model);
  const finalQueryTokens = countTokens(optimizedData.query || '', model);
  const finalMessageTokens = (optimizedData.messages || []).reduce(
    (sum, msg) => sum + countTokens(msg.content, model),
    0
  );
  
  const finalTokenCount = finalSystemTokens + finalQueryTokens + finalMessageTokens;
  
  return {
    ...optimizedData,
    tokenCount: finalTokenCount,
    optimized: true
  };
}

/**
 * Extract relevant sections from code based on a query
 * @param {string} code - Code to extract from
 * @param {string} query - Query to match against
 * @param {Object} options - Extraction options
 * @param {string} options.language - Programming language
 * @param {number} options.maxTokens - Maximum tokens to extract
 * @param {number} options.contextLines - Number of context lines to include
 * @returns {Object} - Extracted code sections
 */
function extractRelevantCode(code, query, options = {}) {
  const {
    language = 'javascript',
    maxTokens = 1000,
    contextLines = 3
  } = options;
  
  // Split code into lines
  const lines = code.split('\n');
  
  // Simple relevance scoring based on keyword matching
  const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
  
  // Score each line
  const lineScores = lines.map((line, index) => {
    const lowerLine = line.toLowerCase();
    
    // Calculate keyword matches
    let score = 0;
    for (const keyword of keywords) {
      if (lowerLine.includes(keyword)) {
        score += 1;
      }
    }
    
    // Boost score for function/class definitions
    if (language === 'javascript' || language === 'typescript') {
      if (/function\s+\w+\s*\(/.test(line) || /class\s+\w+/.test(line) || /const\s+\w+\s*=\s*function/.test(line)) {
        score += 2;
      }
    } else if (language === 'python') {
      if (/def\s+\w+\s*\(/.test(line) || /class\s+\w+/.test(line)) {
        score += 2;
      }
    }
    
    return { index, score };
  });
  
  // Sort lines by score (descending)
  const sortedLines = [...lineScores].sort((a, b) => b.score - a.score);
  
  // Extract top-scoring sections with context
  const sections = [];
  let totalTokens = 0;
  
  for (const { index, score } of sortedLines) {
    // Skip lines with no relevance
    if (score === 0) continue;
    
    // Determine section boundaries with context
    const startLine = Math.max(0, index - contextLines);
    const endLine = Math.min(lines.length - 1, index + contextLines);
    
    // Check if this section overlaps with any existing section
    let overlaps = false;
    for (const section of sections) {
      if (startLine <= section.endLine && endLine >= section.startLine) {
        // Expand the existing section to include this one
        section.startLine = Math.min(section.startLine, startLine);
        section.endLine = Math.max(section.endLine, endLine);
        overlaps = true;
        break;
      }
    }
    
    // If no overlap, add as a new section
    if (!overlaps) {
      sections.push({
        startLine,
        endLine,
        score
      });
    }
  }
  
  // Sort sections by position in file
  sections.sort((a, b) => a.startLine - b.startLine);
  
  // Extract section content and calculate tokens
  const extractedSections = [];
  let remainingTokens = maxTokens;
  
  for (const section of sections) {
    const sectionLines = lines.slice(section.startLine, section.endLine + 1);
    const sectionText = sectionLines.join('\n');
    const sectionTokens = countTokens(sectionText);
    
    // Skip if this section would exceed the token limit
    if (sectionTokens > remainingTokens) {
      continue;
    }
    
    extractedSections.push({
      startLine: section.startLine + 1, // Convert to 1-based line numbers
      endLine: section.endLine + 1,
      content: sectionText,
      tokens: sectionTokens
    });
    
    remainingTokens -= sectionTokens;
    
    // Stop if we've reached the token limit
    if (remainingTokens <= 0) {
      break;
    }
  }
  
  // Calculate total tokens
  totalTokens = maxTokens - remainingTokens;
  
  return {
    sections: extractedSections,
    tokenCount: totalTokens,
    extracted: extractedSections.length > 0
  };
}

module.exports = {
  countTokens,
  getTokenLimit,
  truncateToTokenLimit,
  generateDiff,
  applyDiff,
  optimizePrompt,
  extractRelevantCode
};
