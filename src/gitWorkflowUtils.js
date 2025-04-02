/**
 * Git Workflow Utilities Module for AI Tools
 * 
 * This module provides utilities for automating Git workflows,
 * including branch creation, commit message formatting, and
 * pushing changes to GitHub.
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const { Octokit } = require('@octokit/rest');

// Default configuration
const DEFAULT_CONFIG = {
  enabled: true,
  repository: {
    owner: process.env.GITHUB_REPOSITORY_OWNER || '',
    name: process.env.GITHUB_REPOSITORY_NAME || '',
    defaultBranch: 'master'
  },
  branchTypes: ['feature', 'fix', 'refactor', 'docs', 'chore'],
  commitTypes: ['feat', 'fix', 'refactor', 'docs', 'chore', 'test', 'style', 'perf', 'ci', 'build', 'revert'],
  github: {
    token: process.env.GITHUB_TOKEN || ''
  }
};

// Runtime configuration
let config = { ...DEFAULT_CONFIG };

// Octokit instance for GitHub API
let octokit = null;

/**
 * Initialize the Git workflow utilities
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
      }
    };
    
    // Initialize Octokit if GitHub token is provided
    if (config.github.token) {
      octokit = new Octokit({
        auth: config.github.token
      });
    }
    
    console.log('Git workflow utilities initialized');
  } catch (error) {
    console.error(`Error initializing Git workflow utilities: ${error.message}`);
    throw error;
  }
}

/**
 * Get the current Git branch
 * @returns {string} - Current branch name
 */
function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch (error) {
    console.error(`Error getting current branch: ${error.message}`);
    return '';
  }
}

/**
 * Check if the current directory is a Git repository
 * @returns {boolean} - True if the current directory is a Git repository
 */
function isGitRepository() {
  try {
    execSync('git rev-parse --is-inside-work-tree');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Create a new Git branch
 * @param {string} type - Branch type (feature, fix, refactor, docs, chore)
 * @param {string} description - Branch description
 * @param {boolean} checkout - Whether to checkout the new branch
 * @returns {string} - New branch name
 */
function createBranch(type, description, checkout = true) {
  if (!isGitRepository()) {
    throw new Error('Not a Git repository');
  }
  
  if (!config.branchTypes.includes(type)) {
    throw new Error(`Invalid branch type: ${type}. Must be one of: ${config.branchTypes.join(', ')}`);
  }
  
  // Format description: lowercase, replace spaces with hyphens
  const formattedDescription = description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
  
  // Create branch name
  const branchName = `${type}/${formattedDescription}`;
  
  try {
    // Create branch
    execSync(`git branch ${branchName}`);
    
    // Checkout branch if requested
    if (checkout) {
      execSync(`git checkout ${branchName}`);
    }
    
    console.log(`Created branch: ${branchName}`);
    return branchName;
  } catch (error) {
    console.error(`Error creating branch: ${error.message}`);
    throw error;
  }
}

/**
 * Format a commit message according to conventions
 * @param {string} type - Commit type (feat, fix, refactor, docs, chore, etc.)
 * @param {string} description - Commit description
 * @param {string} body - Commit body (optional)
 * @returns {string} - Formatted commit message
 */
function formatCommitMessage(type, description, body = '') {
  if (!config.commitTypes.includes(type)) {
    throw new Error(`Invalid commit type: ${type}. Must be one of: ${config.commitTypes.join(', ')}`);
  }
  
  // Format the commit message
  let message = `${type}: ${description}`;
  
  // Add body if provided
  if (body) {
    message += `\n\n${body}`;
  }
  
  return message;
}

/**
 * Commit changes with a formatted message
 * @param {string} type - Commit type (feat, fix, refactor, docs, chore, etc.)
 * @param {string} description - Commit description
 * @param {string} body - Commit body (optional)
 * @returns {string} - Commit hash
 */
function commitChanges(type, description, body = '') {
  if (!isGitRepository()) {
    throw new Error('Not a Git repository');
  }
  
  try {
    // Format commit message
    const message = formatCommitMessage(type, description, body);
    
    // Commit changes
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`);
    
    // Get commit hash
    const commitHash = execSync('git rev-parse HEAD').toString().trim();
    
    console.log(`Committed changes: ${commitHash}`);
    return commitHash;
  } catch (error) {
    console.error(`Error committing changes: ${error.message}`);
    throw error;
  }
}

/**
 * Stage files for commit
 * @param {string|string[]} files - File(s) to stage
 * @returns {boolean} - Success status
 */
function stageFiles(files) {
  if (!isGitRepository()) {
    throw new Error('Not a Git repository');
  }
  
  try {
    if (Array.isArray(files)) {
      // Stage multiple files
      for (const file of files) {
        execSync(`git add "${file}"`);
      }
    } else {
      // Stage a single file
      execSync(`git add "${files}"`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error staging files: ${error.message}`);
    throw error;
  }
}

/**
 * Push changes to remote repository
 * @param {string} branch - Branch to push
 * @param {boolean} setUpstream - Whether to set upstream
 * @returns {boolean} - Success status
 */
function pushChanges(branch = '', setUpstream = false) {
  if (!isGitRepository()) {
    throw new Error('Not a Git repository');
  }
  
  try {
    // Use current branch if not specified
    const branchToPush = branch || getCurrentBranch();
    
    // Push changes
    if (setUpstream) {
      execSync(`git push -u origin ${branchToPush}`);
    } else {
      execSync(`git push origin ${branchToPush}`);
    }
    
    console.log(`Pushed changes to origin/${branchToPush}`);
    return true;
  } catch (error) {
    console.error(`Error pushing changes: ${error.message}`);
    throw error;
  }
}

/**
 * Create a pull request on GitHub
 * @param {Object} options - Pull request options
 * @param {string} options.title - Pull request title
 * @param {string} options.body - Pull request body
 * @param {string} options.head - Head branch
 * @param {string} options.base - Base branch
 * @returns {Promise<Object>} - Pull request data
 */
async function createPullRequest(options) {
  if (!octokit) {
    throw new Error('GitHub API not initialized. Please provide a GitHub token.');
  }
  
  try {
    const { title, body, head, base = config.repository.defaultBranch } = options;
    
    // Create pull request
    const response = await octokit.pulls.create({
      owner: config.repository.owner,
      repo: config.repository.name,
      title,
      body,
      head,
      base
    });
    
    console.log(`Created pull request: ${response.data.html_url}`);
    return response.data;
  } catch (error) {
    console.error(`Error creating pull request: ${error.message}`);
    throw error;
  }
}

/**
 * Automate the entire Git workflow for a task
 * @param {Object} options - Workflow options
 * @param {string} options.branchType - Branch type (feature, fix, refactor, docs, chore)
 * @param {string} options.branchDescription - Branch description
 * @param {string} options.commitType - Commit type (feat, fix, refactor, docs, chore, etc.)
 * @param {string} options.commitDescription - Commit description
 * @param {string} options.commitBody - Commit body (optional)
 * @param {string|string[]} options.files - File(s) to stage
 * @param {boolean} options.createPR - Whether to create a pull request
 * @param {string} options.prTitle - Pull request title
 * @param {string} options.prBody - Pull request body
 * @returns {Promise<Object>} - Workflow result
 */
async function automateWorkflow(options) {
  if (!isGitRepository()) {
    throw new Error('Not a Git repository');
  }
  
  try {
    const {
      branchType,
      branchDescription,
      commitType,
      commitDescription,
      commitBody = '',
      files,
      createPR = false,
      prTitle = '',
      prBody = ''
    } = options;
    
    // Create branch
    const branchName = createBranch(branchType, branchDescription);
    
    // Stage files
    stageFiles(files);
    
    // Commit changes
    const commitHash = commitChanges(commitType, commitDescription, commitBody);
    
    // Push changes
    pushChanges(branchName, true);
    
    // Create pull request if requested
    let pullRequest = null;
    if (createPR) {
      pullRequest = await createPullRequest({
        title: prTitle || `${commitType}: ${commitDescription}`,
        body: prBody || commitBody,
        head: branchName
      });
    }
    
    return {
      branch: branchName,
      commit: commitHash,
      pullRequest
    };
  } catch (error) {
    console.error(`Error automating workflow: ${error.message}`);
    throw error;
  }
}

module.exports = {
  initialize,
  getCurrentBranch,
  isGitRepository,
  createBranch,
  formatCommitMessage,
  commitChanges,
  stageFiles,
  pushChanges,
  createPullRequest,
  automateWorkflow
};
