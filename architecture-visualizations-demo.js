/**
 * Architecture Visualizations Demo
 * 
 * This script demonstrates how to use the architecture visualization system.
 * It shows how to:
 * 1. View the architecture visualizations
 * 2. Update the visualizations
 * 3. Customize the visualizations
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');
const open = require('open');

// Import AI-Tools modules
const fileUtils = require('./src/fileUtils');
const dirUtils = require('./src/dirUtils');
const enhancedLogging = require('./src/enhancedLogging');

// Get logger
const logger = enhancedLogging.getLogger('architecture-visualizations-demo');

/**
 * Main function to run the demo
 */
async function runDemo() {
  try {
    console.log(chalk.blue.bold('\n=== Architecture Visualizations Demo ===\n'));
    
    // Step 1: View the architecture visualizations
    await viewArchitectureVisualizations();
    
    // Step 2: Update the visualizations
    await updateArchitectureVisualizations();
    
    // Step 3: Customize the visualizations
    await customizeArchitectureVisualizations();
    
    console.log(chalk.green('\nDemo completed successfully!'));
    
  } catch (error) {
    logger.error('Error running demo', error);
    console.error(chalk.red('Error running demo:'), error.message);
  }
}

/**
 * Step 1: View the architecture visualizations
 */
async function viewArchitectureVisualizations() {
  console.log(chalk.yellow('\n=== Step 1: View the Architecture Visualizations ===\n'));
  
  // Check if the architecture visualizations exist
  const architectureDir = path.join(__dirname, 'docs', 'architecture');
  const dashboardPath = path.join(architectureDir, 'dashboard.html');
  
  if (!await fileUtils.fileExists(dashboardPath)) {
    console.log(chalk.red('Architecture dashboard not found. Please run the update script first.'));
    return;
  }
  
  // List the available visualizations
  console.log(chalk.cyan('Available visualizations:'));
  const files = await dirUtils.listFiles(architectureDir, { filter: '.md' });
  
  for (const file of files) {
    if (file !== 'index.md') {
      const filePath = path.join(architectureDir, file);
      const content = await fileUtils.readFile(filePath);
      const title = content.split('\n')[0].replace('# ', '');
      console.log(chalk.green(`- ${title} (${file})`));
    }
  }
  
  // Open the dashboard in the default browser
  console.log(chalk.cyan('\nOpening the architecture dashboard in your browser...'));
  
  try {
    // Convert the file path to a URL
    const dashboardUrl = `file://${dashboardPath.replace(/\\/g, '/')}`;
    
    // Open the dashboard in the default browser
    await open(dashboardUrl);
    
    console.log(chalk.green('Dashboard opened in your browser.'));
    console.log(chalk.cyan('You can also open individual visualization files in your browser or view them on GitHub.'));
    
  } catch (error) {
    console.log(chalk.red(`Error opening dashboard: ${error.message}`));
    console.log(chalk.cyan(`You can manually open the dashboard at: ${dashboardPath}`));
  }
}

/**
 * Step 2: Update the visualizations
 */
async function updateArchitectureVisualizations() {
  console.log(chalk.yellow('\n=== Step 2: Update the Architecture Visualizations ===\n'));
  
  // Check if the update script exists
  const updateScriptPath = path.join(__dirname, 'docs', 'architecture', 'update-diagrams.js');
  
  if (!await fileUtils.fileExists(updateScriptPath)) {
    console.log(chalk.red('Update script not found.'));
    return;
  }
  
  console.log(chalk.cyan('The architecture visualizations can be updated in three ways:'));
  
  // 1. Using the npm script
  console.log(chalk.green('\n1. Using the npm script:'));
  console.log(chalk.white('   npm run update-architecture'));
  
  // 2. Running the update script directly
  console.log(chalk.green('\n2. Running the update script directly:'));
  console.log(chalk.white('   node docs/architecture/update-diagrams.js'));
  
  // 3. Using the GitHub Action
  console.log(chalk.green('\n3. Using the GitHub Action:'));
  console.log(chalk.white('   The visualizations are automatically updated when changes are pushed to the main branch.'));
  console.log(chalk.white('   You can also manually trigger the workflow in the GitHub Actions tab.'));
  
  // Ask if the user wants to update the visualizations now
  console.log(chalk.cyan('\nWould you like to update the visualizations now? (y/n)'));
  console.log(chalk.yellow('For demo purposes, we\'ll simulate the update process without actually running it.'));
  
  // Simulate the update process
  console.log(chalk.cyan('\nSimulating update process...'));
  
  // Show sample output
  console.log(chalk.white('\n=== Architecture Diagram Generator ===\n'));
  console.log(chalk.yellow('Analyzing codebase...'));
  console.log(chalk.green('Analyzed 35 modules'));
  console.log(chalk.yellow('Generating module dependencies diagram...'));
  console.log(chalk.green('Module dependencies diagram updated'));
  console.log(chalk.yellow('Generating feature timeline diagram...'));
  console.log(chalk.green('Feature timeline diagram updated'));
  console.log(chalk.yellow('Generating data flow diagram...'));
  console.log(chalk.green('Data flow diagram updated'));
  console.log(chalk.yellow('Generating module categories diagram...'));
  console.log(chalk.green('Module categories diagram updated'));
  console.log(chalk.yellow('Generating optimization pipeline diagram...'));
  console.log(chalk.green('Optimization pipeline diagram updated'));
  console.log(chalk.yellow('Generating component interactions diagram...'));
  console.log(chalk.green('Component interactions diagram updated'));
  console.log(chalk.yellow('Updating timestamps...'));
  console.log(chalk.green('Timestamps updated'));
  console.log(chalk.green('\nAll diagrams generated successfully!'));
  
  console.log(chalk.cyan('\nIn a real scenario, the update script would analyze the codebase and generate updated diagrams.'));
}

/**
 * Step 3: Customize the visualizations
 */
async function customizeArchitectureVisualizations() {
  console.log(chalk.yellow('\n=== Step 3: Customize the Architecture Visualizations ===\n'));
  
  console.log(chalk.cyan('The architecture visualizations can be customized in several ways:'));
  
  // 1. Modifying the update script
  console.log(chalk.green('\n1. Modifying the update script:'));
  console.log(chalk.white('   The update script (docs/architecture/update-diagrams.js) contains the logic for generating the diagrams.'));
  console.log(chalk.white('   You can modify this script to change how the diagrams are generated.'));
  
  // 2. Editing the markdown files
  console.log(chalk.green('\n2. Editing the markdown files:'));
  console.log(chalk.white('   The individual .md files in the docs/architecture directory contain the Mermaid diagrams.'));
  console.log(chalk.white('   You can edit these files to customize the diagrams.'));
  
  // 3. Customizing the dashboard
  console.log(chalk.green('\n3. Customizing the dashboard:'));
  console.log(chalk.white('   The dashboard (docs/architecture/dashboard.html) provides a web-based interface for exploring the visualizations.'));
  console.log(chalk.white('   You can customize this file to change the dashboard layout and features.'));
  
  // 4. Adding new visualizations
  console.log(chalk.green('\n4. Adding new visualizations:'));
  console.log(chalk.white('   You can add new visualizations by creating new .md files in the docs/architecture directory.'));
  console.log(chalk.white('   You\'ll also need to update the update script and dashboard to include the new visualizations.'));
  
  // Example of customizing a visualization
  console.log(chalk.cyan('\nExample of customizing a visualization:'));
  
  // Show a sample Mermaid diagram
  console.log(chalk.white('Original diagram:'));
  console.log(chalk.white('```mermaid'));
  console.log(chalk.white('graph TD'));
  console.log(chalk.white('    A[Module A] --> B[Module B]'));
  console.log(chalk.white('    B --> C[Module C]'));
  console.log(chalk.white('```'));
  
  // Show a customized version
  console.log(chalk.white('\nCustomized diagram:'));
  console.log(chalk.white('```mermaid'));
  console.log(chalk.white('graph TD'));
  console.log(chalk.white('    A[Module A] --> B[Module B]'));
  console.log(chalk.white('    B --> C[Module C]'));
  console.log(chalk.white('    B --> D[New Module D]'));
  console.log(chalk.white('    C --> D'));
  console.log(chalk.white('    classDef default fill:#f9f9f9,stroke:#333,stroke-width:1px'));
  console.log(chalk.white('    classDef highlight fill:#ff9,stroke:#333,stroke-width:2px'));
  console.log(chalk.white('    class D highlight'));
  console.log(chalk.white('```'));
  
  console.log(chalk.cyan('\nFor more information on customizing the visualizations, see the documentation:'));
  console.log(chalk.white('docs/ARCHITECTURE_VISUALIZATIONS.md'));
}

// Run the demo if this script is executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = { runDemo };
