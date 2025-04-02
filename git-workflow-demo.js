/**
 * Git Workflow Automation Demo
 * 
 * This script demonstrates how to use the Git Workflow Utilities module
 * to automate Git workflows, including branch creation, commit message formatting,
 * and pushing changes to GitHub.
 */

const { 
  gitWorkflowUtils,
  fileUtils,
  consoleArt
} = require('./src');

// Sample changes to make
const sampleChanges = {
  'demo-output/git-workflow-example.md': `# Git Workflow Example

This file was created by the Git Workflow Automation Demo.

## Features

- Automatic branch creation with proper naming conventions
- Commit message formatting according to standards
- Automated pull request creation

## Benefits

1. Consistent branch naming
2. Standardized commit messages
3. Streamlined workflow
4. Improved code quality through enforced reviews

Generated on: ${new Date().toISOString()}
`
};

/**
 * Demonstrate branch creation
 */
async function demoBranchCreation() {
  console.log('=== Branch Creation Demo ===\n');
  
  try {
    // Check if we're in a Git repository
    if (!gitWorkflowUtils.isGitRepository()) {
      console.error('Not in a Git repository. Please run this demo from a Git repository.');
      return false;
    }
    
    // Get current branch
    const originalBranch = gitWorkflowUtils.getCurrentBranch();
    console.log(`Current branch: ${originalBranch}`);
    
    // Create a new branch
    const branchType = 'feature';
    const branchDescription = 'git workflow automation demo';
    const branchName = gitWorkflowUtils.createBranch(branchType, branchDescription);
    
    console.log(`Created and checked out branch: ${branchName}`);
    
    return {
      success: true,
      originalBranch,
      branchName
    };
  } catch (error) {
    console.error(`Error in branch creation demo: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Demonstrate commit message formatting
 */
function demoCommitMessageFormatting() {
  console.log('\n=== Commit Message Formatting Demo ===\n');
  
  try {
    // Format commit messages
    const examples = [
      {
        type: 'feat',
        description: 'Add Git workflow automation',
        body: 'This adds utilities for automating Git workflows, including branch creation, commit message formatting, and pushing changes to GitHub.'
      },
      {
        type: 'fix',
        description: 'Fix branch name validation',
        body: ''
      },
      {
        type: 'docs',
        description: 'Update README with Git workflow instructions',
        body: 'This updates the README with instructions for using the Git workflow automation utilities.'
      }
    ];
    
    for (const example of examples) {
      const message = gitWorkflowUtils.formatCommitMessage(
        example.type,
        example.description,
        example.body
      );
      
      console.log(`Example commit message:`);
      console.log(`---`);
      console.log(message);
      console.log(`---\n`);
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error(`Error in commit message formatting demo: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Demonstrate making changes and committing them
 */
async function demoMakingChanges(branchInfo) {
  console.log('\n=== Making Changes Demo ===\n');
  
  if (!branchInfo || !branchInfo.success) {
    console.error('Branch creation failed. Skipping making changes demo.');
    return {
      success: false,
      error: 'Branch creation failed'
    };
  }
  
  try {
    // Create demo output directory if it doesn't exist
    await fileUtils.createDirectory('demo-output');
    
    // Create sample files
    for (const [filePath, content] of Object.entries(sampleChanges)) {
      await fileUtils.writeFile(filePath, content);
      console.log(`Created file: ${filePath}`);
    }
    
    // Stage files
    const filesToStage = Object.keys(sampleChanges);
    gitWorkflowUtils.stageFiles(filesToStage);
    console.log(`Staged files: ${filesToStage.join(', ')}`);
    
    // Commit changes
    const commitType = 'feat';
    const commitDescription = 'Add Git workflow example file';
    const commitBody = 'This adds an example file demonstrating the Git workflow automation utilities.';
    
    const commitHash = gitWorkflowUtils.commitChanges(
      commitType,
      commitDescription,
      commitBody
    );
    
    console.log(`Committed changes with hash: ${commitHash}`);
    
    return {
      success: true,
      commitHash,
      files: filesToStage
    };
  } catch (error) {
    console.error(`Error in making changes demo: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Demonstrate the complete workflow
 */
async function demoCompleteWorkflow() {
  console.log('\n=== Complete Workflow Demo ===\n');
  
  try {
    // Check if we're in a Git repository
    if (!gitWorkflowUtils.isGitRepository()) {
      console.error('Not in a Git repository. Please run this demo from a Git repository.');
      return false;
    }
    
    // Get current branch
    const originalBranch = gitWorkflowUtils.getCurrentBranch();
    console.log(`Current branch: ${originalBranch}`);
    
    // Create demo output directory if it doesn't exist
    await fileUtils.createDirectory('demo-output');
    
    // Create a new file for the demo
    const filePath = 'demo-output/automated-workflow-example.md';
    const content = `# Automated Git Workflow Example

This file was created by the Git Workflow Automation Demo using the automateWorkflow function.

## Features

- One-step workflow automation
- Consistent branch naming
- Standardized commit messages
- Automated pull request creation (when GitHub token is provided)

Generated on: ${new Date().toISOString()}
`;
    
    await fileUtils.writeFile(filePath, content);
    console.log(`Created file: ${filePath}`);
    
    // Automate the workflow
    const result = await gitWorkflowUtils.automateWorkflow({
      branchType: 'feature',
      branchDescription: 'automated workflow demo',
      commitType: 'feat',
      commitDescription: 'Add automated workflow example',
      commitBody: 'This demonstrates the complete automated Git workflow.',
      files: [filePath],
      createPR: false // Set to true if GitHub token is provided
    });
    
    console.log(`Automated workflow result:`);
    console.log(`- Branch: ${result.branch}`);
    console.log(`- Commit: ${result.commit}`);
    
    if (result.pullRequest) {
      console.log(`- Pull Request: ${result.pullRequest.html_url}`);
    } else {
      console.log(`- Pull Request: Not created (GitHub token not provided)`);
    }
    
    // Switch back to original branch
    gitWorkflowUtils.createBranch(originalBranch, '', true);
    console.log(`Switched back to original branch: ${originalBranch}`);
    
    return {
      success: true,
      result
    };
  } catch (error) {
    console.error(`Error in complete workflow demo: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Clean up after the demo
 */
async function cleanUp(branchInfo) {
  console.log('\n=== Cleaning Up ===\n');
  
  if (!branchInfo || !branchInfo.success) {
    console.log('Nothing to clean up.');
    return;
  }
  
  try {
    // Switch back to original branch
    gitWorkflowUtils.createBranch(branchInfo.originalBranch, '', true);
    console.log(`Switched back to original branch: ${branchInfo.originalBranch}`);
    
    // Note: We don't delete the branch or the files to keep the demo artifacts
    console.log(`Demo branch '${branchInfo.branchName}' and files were kept for reference.`);
  } catch (error) {
    console.error(`Error in clean up: ${error.message}`);
  }
}

/**
 * Run all demos
 */
async function runAllDemos() {
  try {
    console.log('=== Git Workflow Automation Demo ===\n');
    
    // Initialize Git workflow utilities
    await gitWorkflowUtils.initialize({
      repository: {
        owner: 'your-github-username',
        name: 'your-repository-name',
        defaultBranch: 'master'
      }
    });
    
    // Run demos
    const branchInfo = await demoBranchCreation();
    await demoCommitMessageFormatting();
    await demoMakingChanges(branchInfo);
    await demoCompleteWorkflow();
    
    // Clean up
    await cleanUp(branchInfo);
    
    consoleArt.displaySuccess('Demo Completed Successfully');
  } catch (error) {
    consoleArt.displayError(`Demo failed: ${error.message}`);
  }
}

// Run the demos
runAllDemos();
