# Git Workflow Automation

The Git Workflow Automation module provides utilities for automating Git workflows, including branch creation, commit message formatting, and pushing changes to GitHub. This module helps enforce consistent branch naming conventions, standardized commit messages, and streamlined workflows.

## Key Features

- **Branch Creation**: Create branches with proper naming conventions
- **Commit Message Formatting**: Format commit messages according to standards
- **File Staging**: Stage files for commit
- **Change Committing**: Commit changes with formatted messages
- **Change Pushing**: Push changes to remote repositories
- **Pull Request Creation**: Create pull requests on GitHub
- **Complete Workflow Automation**: Automate the entire Git workflow in one step

## Installation

The Git Workflow Automation module is included in the AI-Tools package. No additional installation is required.

## Usage

### Initializing the Module

```javascript
const { gitWorkflowUtils } = require('./src');

// Initialize with custom configuration
await gitWorkflowUtils.initialize({
  repository: {
    owner: 'your-github-username',
    name: 'your-repository-name',
    defaultBranch: 'master'
  },
  github: {
    token: process.env.GITHUB_TOKEN // Optional, required for PR creation
  }
});
```

### Creating Branches

```javascript
const { gitWorkflowUtils } = require('./src');

// Check if we're in a Git repository
if (gitWorkflowUtils.isGitRepository()) {
  // Get current branch
  const currentBranch = gitWorkflowUtils.getCurrentBranch();
  console.log(`Current branch: ${currentBranch}`);
  
  // Create a new branch
  const branchType = 'feature'; // feature, fix, refactor, docs, chore
  const branchDescription = 'add-token-counting';
  const branchName = gitWorkflowUtils.createBranch(branchType, branchDescription);
  console.log(`Created branch: ${branchName}`);
}
```

### Formatting Commit Messages

```javascript
const { gitWorkflowUtils } = require('./src');

// Format a commit message
const type = 'feat'; // feat, fix, refactor, docs, chore, etc.
const description = 'Add token counting functionality';
const body = 'This adds utilities for counting tokens in text.';

const message = gitWorkflowUtils.formatCommitMessage(type, description, body);
console.log(message);
// Output:
// feat: Add token counting functionality
//
// This adds utilities for counting tokens in text.
```

### Staging and Committing Changes

```javascript
const { gitWorkflowUtils } = require('./src');

// Stage files
const files = ['src/tokenUtils.js', 'test/tokenUtils.test.js'];
gitWorkflowUtils.stageFiles(files);

// Commit changes
const commitHash = gitWorkflowUtils.commitChanges(
  'feat',
  'Add token counting functionality',
  'This adds utilities for counting tokens in text.'
);
console.log(`Committed changes: ${commitHash}`);
```

### Pushing Changes

```javascript
const { gitWorkflowUtils } = require('./src');

// Push changes to remote
gitWorkflowUtils.pushChanges('feature/add-token-counting', true);
```

### Creating Pull Requests

```javascript
const { gitWorkflowUtils } = require('./src');

// Create a pull request
const pullRequest = await gitWorkflowUtils.createPullRequest({
  title: 'Add token counting functionality',
  body: 'This PR adds utilities for counting tokens in text.',
  head: 'feature/add-token-counting',
  base: 'master'
});

console.log(`Created pull request: ${pullRequest.html_url}`);
```

### Automating the Entire Workflow

```javascript
const { gitWorkflowUtils } = require('./src');

// Automate the entire workflow
const result = await gitWorkflowUtils.automateWorkflow({
  branchType: 'feature',
  branchDescription: 'add-token-counting',
  commitType: 'feat',
  commitDescription: 'Add token counting functionality',
  commitBody: 'This adds utilities for counting tokens in text.',
  files: ['src/tokenUtils.js', 'test/tokenUtils.test.js'],
  createPR: true,
  prTitle: 'Add token counting functionality',
  prBody: 'This PR adds utilities for counting tokens in text.'
});

console.log(`Created branch: ${result.branch}`);
console.log(`Committed changes: ${result.commit}`);
console.log(`Created pull request: ${result.pullRequest.html_url}`);
```

## Integration with GitHub Actions

The Git Workflow Automation module works seamlessly with the GitHub Actions workflows included in the repository:

- **Branch Name Check**: Ensures branch names follow the required format
- **Commit Message Check**: Ensures commit messages follow the required format
- **Required Reviews Check**: Ensures pull requests have been reviewed and approved

These GitHub Actions workflows help enforce the Git workflow rules defined in the [CONTRIBUTING.md](./CONTRIBUTING.md) file.

## Demo

A comprehensive demo is available in `git-workflow-demo.js` that showcases all the key features of the Git Workflow Automation module.

## Best Practices

1. **Use Consistent Branch Types**: Stick to the standard branch types (feature, fix, refactor, docs, chore)
2. **Use Descriptive Branch Names**: Make branch names descriptive but concise
3. **Use Standardized Commit Messages**: Follow the commit message format (type: description)
4. **Create Pull Requests**: Always create pull requests for changes
5. **Require Code Reviews**: Enforce code reviews for all pull requests

## For More Information

See the demo script `git-workflow-demo.js` for practical examples of using the Git Workflow Automation module.
