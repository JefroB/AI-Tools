/**
 * Code Review Demo
 * 
 * This script demonstrates how to use the Code Reviewer module
 * to perform AI-powered code reviews on pull requests.
 */

const { 
  codeReviewer,
  consoleArt,
  fileUtils
} = require('./src');

// Sample diff for demonstration
const SAMPLE_DIFF = `diff --git a/src/example.js b/src/example.js
index 1234567..abcdefg 100644
--- a/src/example.js
+++ b/src/example.js
@@ -1,10 +1,12 @@
 const express = require('express');
 const app = express();
+const mysql = require('mysql');
 
 app.get('/users/:id', (req, res) => {
-  // Get user by ID from database
-  const user = getUserById(req.params.id);
-  res.json(user);
+  // Get user by ID from database using raw SQL
+  const query = "SELECT * FROM users WHERE id = " + req.params.id;
+  const user = executeQuery(query);
+  res.json({ user });
 });
 
 function getUserById(id) {
@@ -12,6 +14,12 @@ function getUserById(id) {
   return { id, name: 'John Doe' };
 }
 
+function executeQuery(query) {
+  // Execute SQL query
+  const result = mysql.query(query);
+  return result;
+}
+
 app.listen(3000, () => {
   console.log('Server running on port 3000');
 });
diff --git a/src/utils.js b/src/utils.js
index 9876543..fedcba9 100644
--- a/src/utils.js
+++ b/src/utils.js
@@ -5,7 +5,14 @@
 
 function findDuplicates(array) {
   const duplicates = [];
-  array.forEach(item => {
+  
+  // Find duplicates using nested loops
+  for (let i = 0; i < array.length; i++) {
+    for (let j = i + 1; j < array.length; j++) {
+      if (array[i] === array[j] && !duplicates.includes(array[i])) {
+        duplicates.push(array[i]);
+      }
+    }
   });
   
   return duplicates;
@@ -15,7 +22,7 @@ function findDuplicates(array) {
 function convertTimestamp(timestamp) {
   // Convert timestamp to date
   const date = new Date(timestamp);
-  return date.toISOString();
+  return date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
 }
 
 module.exports = {
`;

/**
 * Initialize the code reviewer
 */
async function initializeCodeReviewer() {
  console.log('Initializing code reviewer...');
  
  await codeReviewer.initialize({
    repository: {
      owner: 'example-org',
      name: 'example-repo',
      defaultBranch: 'master'
    },
    email: {
      enabled: false // Disable email for demo
    }
  });
  
  console.log('Code reviewer initialized');
}

/**
 * Demonstrate parsing a diff
 */
function demoParseDiff() {
  console.log('\n=== Parsing Diff ===\n');
  
  const changedFiles = codeReviewer.parseDiff(SAMPLE_DIFF);
  
  console.log(`Found ${changedFiles.length} changed files:`);
  
  for (const file of changedFiles) {
    console.log(`\nFile: ${file.filePath} (${file.language})`);
    console.log(`- Additions: ${file.additions.length}`);
    console.log(`- Deletions: ${file.deletions.length}`);
    
    if (file.additions.length > 0) {
      console.log('\nSample additions:');
      for (let i = 0; i < Math.min(3, file.additions.length); i++) {
        console.log(`  Line ${file.additions[i].lineNumber}: ${file.additions[i].content}`);
      }
    }
    
    if (file.deletions.length > 0) {
      console.log('\nSample deletions:');
      for (let i = 0; i < Math.min(3, file.deletions.length); i++) {
        console.log(`  Line ${file.deletions[i].lineNumber}: ${file.deletions[i].content}`);
      }
    }
  }
  
  return changedFiles;
}

/**
 * Demonstrate generating a Claude prompt
 */
function demoGeneratePrompt(changedFiles) {
  console.log('\n=== Generating Claude Prompt ===\n');
  
  const rules = {
    codeQuality: true,
    security: true,
    performance: true,
    apiUsage: false,
    errorHandling: true,
    testing: false,
    documentation: false,
    codebaseSeparation: false,
    crossPlatform: false
  };
  
  const prompt = codeReviewer.generateClaudePrompt(changedFiles, rules);
  
  console.log(`Generated prompt (${prompt.length} characters)`);
  console.log('\nPrompt preview:');
  console.log(prompt.substring(0, 500) + '...');
  
  return prompt;
}

/**
 * Demonstrate generating a code review
 */
async function demoGenerateReview() {
  console.log('\n=== Generating Code Review ===\n');
  
  try {
    const result = await codeReviewer.generateCodeReview(SAMPLE_DIFF, {
      prTitle: 'Add user query functionality',
      prNumber: 123,
      prUrl: 'https://github.com/example-org/example-repo/pull/123'
    });
    
    console.log('Code review generated successfully');
    
    // Display review summary
    console.log('\nReview Summary:');
    console.log(`- Critical issues: ${result.review.summary.criticalCount}`);
    console.log(`- High issues: ${result.review.summary.highCount}`);
    console.log(`- Medium issues: ${result.review.summary.mediumCount}`);
    console.log(`- Low issues: ${result.review.summary.lowCount}`);
    console.log(`- Info: ${result.review.summary.infoCount}`);
    console.log(`- Total issues: ${result.review.summary.totalCount}`);
    
    console.log('\nOverall Assessment:');
    console.log(result.review.summary.overallAssessment);
    
    // Display issues
    console.log('\nIssues:');
    for (const issue of result.review.issues) {
      console.log(`\n${issue.severity.toUpperCase()}: ${issue.filePath}, Line ${issue.lineNumber}`);
      console.log(`Description: ${issue.description}`);
      console.log(`Suggestion: ${issue.suggestion}`);
    }
    
    // Save review to file
    const reviewFile = 'demo-output/code-review-result.md';
    await fileUtils.createDirectory('demo-output');
    await fileUtils.writeFile(reviewFile, result.reviewComments);
    console.log(`\nReview comments saved to ${reviewFile}`);
    
    return result;
  } catch (error) {
    console.error(`Error generating code review: ${error.message}`);
    throw error;
  }
}

/**
 * Run the demo
 */
async function runDemo() {
  try {
    consoleArt.displayConsoleArt('CODE REVIEW DEMO');
    
    await initializeCodeReviewer();
    const changedFiles = demoParseDiff();
    demoGeneratePrompt(changedFiles);
    await demoGenerateReview();
    
    consoleArt.displaySuccess('Demo Completed Successfully');
  } catch (error) {
    consoleArt.displayError(`Demo failed: ${error.message}`);
  }
}

// Run the demo
runDemo();
