/**
 * Code Reviewer Module for AI Tools
 * 
 * This module provides utilities for AI-powered code review,
 * including diff analysis, rule enforcement, and review generation.
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const { Octokit } = require('@octokit/rest');
const nodemailer = require('nodemailer');
const tokenUtils = require('./tokenUtils');
const securityUtils = require('./securityUtils');
const configurationManager = require('./configurationManager');
const enhancedErrorHandling = require('./enhancedErrorHandling');

// Default configuration
const DEFAULT_CONFIG = {
  enabled: true,
  repository: {
    owner: process.env.GITHUB_REPOSITORY_OWNER || '',
    name: process.env.GITHUB_REPOSITORY_NAME || '',
    defaultBranch: 'master'
  },
  github: {
    token: process.env.GITHUB_TOKEN || ''
  },
  email: {
    enabled: true,
    from: process.env.EMAIL_FROM || '',
    to: process.env.EMAIL_TO || '',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: process.env.SMTP_PORT || 587,
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    secure: process.env.SMTP_SECURE === 'true'
  },
  rules: {
    codeQuality: true,
    security: true,
    performance: true,
    apiUsage: true,
    errorHandling: true,
    testing: true,
    documentation: true,
    codebaseSeparation: true,
    crossPlatform: true
  },
  severityLevels: {
    critical: {
      name: 'Critical',
      color: '#FF0000',
      emoji: '🚨'
    },
    high: {
      name: 'High',
      color: '#FFA500',
      emoji: '⚠️'
    },
    medium: {
      name: 'Medium',
      color: '#FFFF00',
      emoji: '⚡'
    },
    low: {
      name: 'Low',
      color: '#00FF00',
      emoji: '📝'
    },
    info: {
      name: 'Info',
      color: '#0000FF',
      emoji: 'ℹ️'
    }
  }
};

// Runtime configuration
let config = { ...DEFAULT_CONFIG };

// Octokit instance for GitHub API
let octokit = null;

// Email transporter
let emailTransporter = null;

/**
 * Initialize the code reviewer
 * @param {Object} customConfig - Custom configuration
 * @returns {Promise<void>}
 */
async function initialize(customConfig = {}) {
  try {
    // Merge custom configuration with defaults
    config = {
      ...DEFAULT_CONFIG,
      ...customConfig,
      repository: {
        ...DEFAULT_CONFIG.repository,
        ...(customConfig.repository || {})
      },
      github: {
        ...DEFAULT_CONFIG.github,
        ...(customConfig.github || {})
      },
      email: {
        ...DEFAULT_CONFIG.email,
        ...(customConfig.email || {})
      },
      rules: {
        ...DEFAULT_CONFIG.rules,
        ...(customConfig.rules || {})
      }
    };
    
    // Initialize Octokit if GitHub token is provided
    if (config.github.token) {
      octokit = new Octokit({
        auth: config.github.token
      });
    }
    
    // Initialize email transporter if email is enabled
    if (config.email.enabled) {
      emailTransporter = nodemailer.createTransport({
        host: config.email.smtpHost,
        port: config.email.smtpPort,
        secure: config.email.secure,
        auth: {
          user: config.email.smtpUser,
          pass: config.email.smtpPass
        }
      });
    }
    
    console.log('Code reviewer initialized');
  } catch (error) {
    console.error(`Error initializing code reviewer: ${error.message}`);
    throw error;
  }
}

/**
 * Determine the programming language from a file path
 * @param {string} filePath - File path
 * @returns {string} - Programming language
 */
function determineLanguage(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  
  const languageMap = {
    '.js': 'JavaScript',
    '.jsx': 'JavaScript (React)',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript (React)',
    '.py': 'Python',
    '.rb': 'Ruby',
    '.java': 'Java',
    '.c': 'C',
    '.cpp': 'C++',
    '.cs': 'C#',
    '.go': 'Go',
    '.rs': 'Rust',
    '.php': 'PHP',
    '.swift': 'Swift',
    '.kt': 'Kotlin',
    '.scala': 'Scala',
    '.html': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.less': 'LESS',
    '.json': 'JSON',
    '.md': 'Markdown',
    '.yml': 'YAML',
    '.yaml': 'YAML',
    '.xml': 'XML',
    '.sh': 'Shell',
    '.bat': 'Batch',
    '.ps1': 'PowerShell',
    '.sql': 'SQL'
  };
  
  return languageMap[extension] || 'Unknown';
}

/**
 * Parse a Git diff to extract changed files and their content
 * @param {string} diff - Git diff
 * @returns {Array<Object>} - Array of changed files with their content
 */
function parseDiff(diff) {
  const changedFiles = [];
  
  // Split the diff into file sections
  const fileSections = diff.split('diff --git');
  
  // Skip the first empty section
  for (let i = 1; i < fileSections.length; i++) {
    const section = fileSections[i];
    
    // Extract file path
    const filePathMatch = section.match(/a\/(.*) b\/(.*)/);
    if (!filePathMatch) continue;
    
    const filePath = filePathMatch[2];
    
    // Skip binary files
    if (section.includes('Binary files')) {
      changedFiles.push({
        filePath,
        language: determineLanguage(filePath),
        isBinary: true,
        additions: [],
        deletions: []
      });
      continue;
    }
    
    // Extract hunks
    const hunks = [];
    const hunkRegex = /@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/g;
    let hunkMatch;
    
    while ((hunkMatch = hunkRegex.exec(section)) !== null) {
      const oldStart = parseInt(hunkMatch[1], 10);
      const oldLines = hunkMatch[2] ? parseInt(hunkMatch[2], 10) : 1;
      const newStart = parseInt(hunkMatch[3], 10);
      const newLines = hunkMatch[4] ? parseInt(hunkMatch[4], 10) : 1;
      
      const hunkContent = section.substring(hunkMatch.index + hunkMatch[0].length);
      const hunkEnd = hunkContent.indexOf('@@ -');
      const hunkText = hunkEnd !== -1 ? hunkContent.substring(0, hunkEnd) : hunkContent;
      
      hunks.push({
        oldStart,
        oldLines,
        newStart,
        newLines,
        text: hunkText
      });
    }
    
    // Extract additions and deletions
    const additions = [];
    const deletions = [];
    
    for (const hunk of hunks) {
      const lines = hunk.text.split('\n');
      let lineNumber = hunk.newStart;
      
      for (const line of lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          additions.push({
            lineNumber,
            content: line.substring(1)
          });
          lineNumber++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          deletions.push({
            lineNumber: hunk.oldStart + deletions.length,
            content: line.substring(1)
          });
        } else if (!line.startsWith('+') && !line.startsWith('-') && line.trim() !== '') {
          lineNumber++;
        }
      }
    }
    
    changedFiles.push({
      filePath,
      language: determineLanguage(filePath),
      isBinary: false,
      additions,
      deletions
    });
  }
  
  return changedFiles;
}

/**
 * Generate a Claude prompt for code review
 * @param {Array<Object>} changedFiles - Array of changed files
 * @param {Object} rules - Rules to enforce
 * @returns {string} - Claude prompt
 */
function generateClaudePrompt(changedFiles, rules) {
  let prompt = `You are an expert code reviewer with deep knowledge of software development best practices, security, and performance optimization. Please review the following code changes and provide detailed feedback.

Follow these guidelines for your review:

1. Focus on the most important issues first
2. Be specific and actionable in your feedback
3. Explain why each issue matters
4. Suggest concrete improvements
5. Acknowledge good practices you observe

For each issue, assign a severity level:
- CRITICAL: Security vulnerabilities, major bugs, or issues that could cause data loss
- HIGH: Significant code quality issues, performance problems, or maintainability concerns
- MEDIUM: Code style inconsistencies, minor bugs, or areas for improvement
- LOW: Nitpicks, suggestions, or alternative approaches
- INFO: Observations, questions, or comments

Here are the code changes to review:

`;

  // Add changed files to the prompt
  for (const file of changedFiles) {
    if (file.isBinary) {
      prompt += `## File: ${file.filePath} (Binary file)\n\n`;
      continue;
    }
    
    prompt += `## File: ${file.filePath} (${file.language})\n\n`;
    
    if (file.additions.length === 0 && file.deletions.length === 0) {
      prompt += `No changes detected in this file.\n\n`;
      continue;
    }
    
    prompt += `### Additions:\n\n`;
    for (const addition of file.additions) {
      prompt += `Line ${addition.lineNumber}: \`${addition.content}\`\n`;
    }
    
    prompt += `\n### Deletions:\n\n`;
    for (const deletion of file.deletions) {
      prompt += `Line ${deletion.lineNumber}: \`${deletion.content}\`\n`;
    }
    
    prompt += `\n`;
  }
  
  // Add specific rules to enforce
  prompt += `\nPlease enforce the following rules in your review:\n\n`;
  
  if (rules.codeQuality) {
    prompt += `- Code Quality: Follow language-specific style guides, use consistent naming conventions, keep functions small, limit function parameters, avoid deep nesting, use meaningful comments, follow SOLID principles, avoid code duplication, prioritize readability\n`;
  }
  
  if (rules.security) {
    prompt += `- Security: Validate all input, prevent injection attacks, implement proper authentication and authorization, protect sensitive data, use security headers, keep dependencies updated, implement rate limiting, validate file uploads, use CSRF protection, conduct security scanning\n`;
  }
  
  if (rules.performance) {
    prompt += `- Performance: Optimize database queries, implement caching, minimize HTTP requests, optimize frontend performance, use efficient data structures and algorithms, implement pagination and lazy loading, optimize asset delivery, minimize DOM manipulation, use asynchronous operations, profile and measure performance\n`;
  }
  
  if (rules.apiUsage) {
    prompt += `- API Usage: Minimize API calls, implement retry logic, respect rate limits, use efficient data fetching, handle API versioning, implement proper error handling, use webhooks when appropriate, optimize authentication, monitor API performance, document API usage\n`;
  }
  
  if (rules.errorHandling) {
    prompt += `- Error Handling: Use try-catch blocks appropriately, provide meaningful error messages, implement graceful degradation, log errors properly, handle asynchronous errors, validate function inputs, implement circuit breakers, handle edge cases, implement proper error propagation, create custom error types\n`;
  }
  
  if (rules.testing) {
    prompt += `- Testing: Write unit tests, implement integration tests, write end-to-end tests, use test-driven development when appropriate, test performance, test security, implement continuous integration, use test fixtures and factories, test error handling, keep tests maintainable\n`;
  }
  
  if (rules.documentation) {
    prompt += `- Documentation: Document public APIs, create README files, document architecture decisions, create user documentation, document configuration options, use diagrams when appropriate, document database schema, create onboarding documentation, document testing procedures, keep documentation close to code\n`;
  }
  
  if (rules.codebaseSeparation) {
    prompt += `- Codebase Separation: Maintain strict codebase separation, use proper dependency management, create clear boundaries, avoid library-specific code in applications, document integration points, version libraries appropriately, test libraries independently, use feature flags for new functionality, implement proper error boundaries, follow the single responsibility principle\n`;
  }
  
  if (rules.crossPlatform) {
    prompt += `- Cross-Platform Development: Handle command line differences, avoid using && for command chaining in Windows, use cross-platform alternatives for command chaining, implement platform detection, use path separators correctly, handle line ending differences, test on all target platforms, use cross-platform libraries, document platform-specific requirements, use platform-agnostic APIs\n`;
  }
  
  prompt += `\nFormat your response as a structured review with sections for each file, and bullet points for each issue. For each issue, include the line number, severity level, description, and suggested improvement. At the end, provide a summary of the most important issues and an overall assessment.`;
  
  return prompt;
}

/**
 * Call Claude API to generate a code review
 * @param {string} prompt - Claude prompt
 * @returns {Promise<Object>} - Claude response
 */
async function callClaudeApi(prompt) {
  // This is a placeholder for the actual Claude API call
  // In a real implementation, you would use the appropriate API client
  
  // For now, we'll return a mock response
  return {
    review: `# Code Review

## File: src/example.js (JavaScript)

- **Line 5 (CRITICAL)**: Potential SQL injection vulnerability in the query construction. 
  - **Issue**: User input is directly concatenated into the SQL query without parameterization.
  - **Suggestion**: Use parameterized queries with prepared statements.

- **Line 12 (HIGH)**: Unhandled promise rejection.
  - **Issue**: The promise can reject but there's no error handling.
  - **Suggestion**: Add a .catch() handler or use try/catch with async/await.

- **Line 25 (MEDIUM)**: Function is too long and does multiple things.
  - **Issue**: This function is 40 lines long and handles multiple responsibilities.
  - **Suggestion**: Break it down into smaller, single-purpose functions.

- **Line 37 (LOW)**: Inconsistent naming convention.
  - **Issue**: This variable uses snake_case while the rest of the codebase uses camelCase.
  - **Suggestion**: Rename to follow the established camelCase convention.

## File: src/utils.js (JavaScript)

- **Line 8 (HIGH)**: Inefficient algorithm with O(n²) complexity.
  - **Issue**: The nested loops create quadratic time complexity.
  - **Suggestion**: Refactor to use a Map or Set for O(n) complexity.

- **Line 19 (MEDIUM)**: Magic number used without explanation.
  - **Issue**: The number 86400000 is used without context.
  - **Suggestion**: Create a named constant like MILLISECONDS_IN_DAY = 86400000.

## Summary

The code has several issues that need attention:

1. **Critical security vulnerability** in src/example.js that could lead to SQL injection
2. **Error handling improvements** needed throughout the codebase
3. **Code organization** could be improved by breaking down large functions
4. **Performance optimization** opportunities in src/utils.js

Overall, the code needs significant improvements before it should be merged, particularly addressing the security vulnerability.`,
    issues: [
      {
        filePath: 'src/example.js',
        lineNumber: 5,
        severity: 'critical',
        description: 'Potential SQL injection vulnerability in the query construction.',
        suggestion: 'Use parameterized queries with prepared statements.'
      },
      {
        filePath: 'src/example.js',
        lineNumber: 12,
        severity: 'high',
        description: 'Unhandled promise rejection.',
        suggestion: 'Add a .catch() handler or use try/catch with async/await.'
      },
      {
        filePath: 'src/example.js',
        lineNumber: 25,
        severity: 'medium',
        description: 'Function is too long and does multiple things.',
        suggestion: 'Break it down into smaller, single-purpose functions.'
      },
      {
        filePath: 'src/example.js',
        lineNumber: 37,
        severity: 'low',
        description: 'Inconsistent naming convention.',
        suggestion: 'Rename to follow the established camelCase convention.'
      },
      {
        filePath: 'src/utils.js',
        lineNumber: 8,
        severity: 'high',
        description: 'Inefficient algorithm with O(n²) complexity.',
        suggestion: 'Refactor to use a Map or Set for O(n) complexity.'
      },
      {
        filePath: 'src/utils.js',
        lineNumber: 19,
        severity: 'medium',
        description: 'Magic number used without explanation.',
        suggestion: 'Create a named constant like MILLISECONDS_IN_DAY = 86400000.'
      }
    ],
    summary: {
      criticalCount: 1,
      highCount: 2,
      mediumCount: 2,
      lowCount: 1,
      infoCount: 0,
      totalCount: 6,
      overallAssessment: 'The code has several issues that need attention, particularly a critical security vulnerability. It should not be merged until these issues are addressed.'
    }
  };
}

/**
 * Parse Claude's review response into a structured format
 * @param {Object} claudeResponse - Claude's response
 * @returns {Object} - Structured review
 */
function parseClaudeReview(claudeResponse) {
  // In a real implementation, you would parse Claude's response
  // For now, we'll return the mock response directly
  return claudeResponse;
}

/**
 * Format review comments for GitHub
 * @param {Object} review - Structured review
 * @returns {string} - Formatted review comments
 */
function formatReviewComments(review) {
  let comments = '';
  
  // Add summary
  comments += `# Code Review Summary\n\n`;
  comments += `- Critical issues: ${review.summary.criticalCount}\n`;
  comments += `- High issues: ${review.summary.highCount}\n`;
  comments += `- Medium issues: ${review.summary.mediumCount}\n`;
  comments += `- Low issues: ${review.summary.lowCount}\n`;
  comments += `- Info: ${review.summary.infoCount}\n`;
  comments += `- Total issues: ${review.summary.totalCount}\n\n`;
  comments += `## Overall Assessment\n\n${review.summary.overallAssessment}\n\n`;
  
  // Add issues grouped by file
  const issuesByFile = {};
  for (const issue of review.issues) {
    if (!issuesByFile[issue.filePath]) {
      issuesByFile[issue.filePath] = [];
    }
    issuesByFile[issue.filePath].push(issue);
  }
  
  for (const [filePath, issues] of Object.entries(issuesByFile)) {
    comments += `## ${filePath}\n\n`;
    
    for (const issue of issues) {
      const severity = config.severityLevels[issue.severity];
      comments += `### ${severity.emoji} ${severity.name}: Line ${issue.lineNumber}\n\n`;
      comments += `**Issue**: ${issue.description}\n\n`;
      comments += `**Suggestion**: ${issue.suggestion}\n\n`;
    }
  }
  
  return comments;
}

/**
 * Generate an approval link for GitHub
 * @param {number} prNumber - Pull request number
 * @param {string} reviewComments - Review comments
 * @returns {string} - Approval link
 */
function generateApprovalLink(prNumber, reviewComments) {
  const encodedComments = encodeURIComponent(reviewComments);
  const baseUrl = `https://github.com/${config.repository.owner}/${config.repository.name}/pull/${prNumber}/reviews`;
  
  // GitHub doesn't support pre-populating review comments via URL parameters
  // So we'll just return the review URL and include the comments in the email
  return baseUrl;
}

/**
 * Send an email with the code review results
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.prTitle - Pull request title
 * @param {number} options.prNumber - Pull request number
 * @param {string} options.prUrl - Pull request URL
 * @param {string} options.approvalUrl - Approval URL
 * @param {Object} options.review - Review data
 * @returns {Promise<Object>} - Email send result
 */
async function sendReviewEmail(options) {
  if (!emailTransporter) {
    throw new Error('Email transporter not initialized');
  }
  
  const {
    to = config.email.to,
    subject,
    prTitle,
    prNumber,
    prUrl,
    approvalUrl,
    review
  } = options;
  
  // Generate HTML email content
  const htmlContent = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1, h2, h3 {
            color: #0066cc;
          }
          .summary {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .critical {
            color: ${config.severityLevels.critical.color};
            font-weight: bold;
          }
          .high {
            color: ${config.severityLevels.high.color};
            font-weight: bold;
          }
          .medium {
            color: ${config.severityLevels.medium.color};
            font-weight: bold;
          }
          .low {
            color: ${config.severityLevels.low.color};
          }
          .info {
            color: ${config.severityLevels.info.color};
          }
          .issue {
            margin-bottom: 15px;
            border-left: 4px solid #ddd;
            padding-left: 15px;
          }
          .file {
            margin-top: 30px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }
          .button {
            display: inline-block;
            background-color: #0066cc;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
          pre {
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
          }
          code {
            font-family: monospace;
            background-color: #f5f5f5;
            padding: 2px 4px;
            border-radius: 3px;
          }
        </style>
      </head>
      <body>
        <h1>Code Review for PR #${prNumber}: ${prTitle}</h1>
        
        <div class="summary">
          <h2>Summary</h2>
          <p>
            <span class="critical">${config.severityLevels.critical.emoji} Critical: ${review.summary.criticalCount}</span> | 
            <span class="high">${config.severityLevels.high.emoji} High: ${review.summary.highCount}</span> | 
            <span class="medium">${config.severityLevels.medium.emoji} Medium: ${review.summary.mediumCount}</span> | 
            <span class="low">${config.severityLevels.low.emoji} Low: ${review.summary.lowCount}</span> | 
            <span class="info">${config.severityLevels.info.emoji} Info: ${review.summary.infoCount}</span>
          </p>
          <p><strong>Total issues:</strong> ${review.summary.totalCount}</p>
          <h3>Overall Assessment</h3>
          <p>${review.summary.overallAssessment}</p>
        </div>
        
        <h2>Review Details</h2>
        
        ${Object.entries(review.issues.reduce((acc, issue) => {
          if (!acc[issue.filePath]) {
            acc[issue.filePath] = [];
          }
          acc[issue.filePath].push(issue);
          return acc;
        }, {})).map(([filePath, issues]) => `
          <div class="file">
            <h3>${filePath}</h3>
            ${issues.map(issue => `
              <div class="issue">
                <h4 class="${issue.severity}">
                  ${config.severityLevels[issue.severity].emoji} 
                  ${config.severityLevels[issue.severity].name}: Line ${issue.lineNumber}
                </h4>
                <p><strong>Issue:</strong> ${issue.description}</p>
                <p><strong>Suggestion:</strong> ${issue.suggestion}</p>
              </div>
            `).join('')}
          </div>
        `).join('')}
        
        <h2>Next Steps</h2>
        <p>
          1. Review the issues identified above<br>
          2. Make necessary changes to address the issues<br>
          3. Use the link below to approve the pull request with Claude's comments
        </p>
        
        <p>
          <a href="${prUrl}" class="button">View Pull Request</a>
          <a href="${approvalUrl}" class="button">Review on GitHub</a>
        </p>
        
        <h3>Review Comments for Copy/Paste</h3>
        <p>Copy and paste these comments into the GitHub review:</p>
        <pre>${formatReviewComments(review)}</pre>
      </body>
    </html>
  `;
  
  // Send email
  const mailOptions = {
    from: config.email.from,
    to,
    subject,
    html: htmlContent,
    text: formatReviewComments(review)
  };
  
  return await emailTransporter.sendMail(mailOptions);
}

/**
 * Generate a code review for a pull request
 * @param {string} diff - Git diff
 * @param {Object} options - Review options
 * @param {Object} options.rules - Rules to enforce
 * @param {string} options.prTitle - Pull request title
 * @param {number} options.prNumber - Pull request number
 * @param {string} options.prUrl - Pull request URL
 * @returns {Promise<Object>} - Review result
 */
async function generateCodeReview(diff, options) {
  try {
    const {
      rules = config.rules,
      prTitle,
      prNumber,
      prUrl
    } = options;
    
    // Parse the diff
    const changedFiles = parseDiff(diff);
    
    // Generate Claude prompt
    const prompt = generateClaudePrompt(changedFiles, rules);
    
    // Call Claude API
    const claudeResponse = await callClaudeApi(prompt);
    
    // Parse Claude's response
    const review = parseClaudeReview(claudeResponse);
    
    // Format review comments
    const reviewComments = formatReviewComments(review);
    
    // Generate approval link
    const approvalUrl = generateApprovalLink(prNumber, reviewComments);
    
    // Send email
    if (config.email.enabled) {
      await sendReviewEmail({
        subject: `Code Review for PR #${prNumber}: ${prTitle}`,
        prTitle,
        prNumber,
        prUrl,
        approvalUrl,
        review
      });
    }
    
    return {
      review,
      reviewComments,
      approvalUrl
    };
  } catch (error) {
    console.error(`Error generating code review: ${error.message}`);
    throw error;
  }
}

module.exports = {
  initialize,
  parseDiff,
  generateClaudePrompt,
  formatReviewComments,
  generateApprovalLink,
  sendReviewEmail,
  generateCodeReview
};
