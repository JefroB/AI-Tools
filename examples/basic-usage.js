/**
 * AI Tools - Basic Usage Example
 * Demonstrates how to use the file and directory utilities
 */

const aiTools = require('../src');

// Async function to run the examples
async function runExamples() {
  try {
    console.log('AI Tools - Basic Usage Examples\n');
    
    // Create a test directory
    const testDir = './test-output';
    console.log(`Creating directory: ${testDir}`);
    await aiTools.createDirectory(testDir);
    
    // Write a file
    const filePath = `${testDir}/example.txt`;
    console.log(`Writing to file: ${filePath}`);
    await aiTools.writeFile(filePath, 'Hello, AI Tools!');
    
    // Read the file
    console.log(`Reading file: ${filePath}`);
    const content = await aiTools.readFile(filePath);
    console.log(`File content: ${content}`);
    
    // Write a JSON file
    const jsonPath = `${testDir}/data.json`;
    const jsonData = {
      name: 'AI Tools',
      version: '1.0.0',
      features: ['File operations', 'Directory operations']
    };
    console.log(`Writing JSON to file: ${jsonPath}`);
    await aiTools.writeFile(jsonPath, jsonData);
    
    // Read the JSON file
    console.log(`Reading JSON file: ${jsonPath}`);
    const jsonContent = await aiTools.readFile(jsonPath);
    console.log('JSON content:', jsonContent);
    
    // Append to a file
    console.log(`Appending to file: ${filePath}`);
    await aiTools.appendFile(filePath, '\nThis line was appended.');
    
    // Read the updated file
    console.log(`Reading updated file: ${filePath}`);
    const updatedContent = await aiTools.readFile(filePath);
    console.log(`Updated file content: ${updatedContent}`);
    
    // List files in the directory
    console.log(`Listing files in directory: ${testDir}`);
    const files = await aiTools.listFiles(testDir);
    console.log('Files:', files);
    
    // Check if a file exists
    console.log(`Checking if file exists: ${filePath}`);
    const exists = await aiTools.fileExists(filePath);
    console.log(`File exists: ${exists}`);
    
    // Create a subdirectory
    const subDir = `${testDir}/subdir`;
    console.log(`Creating subdirectory: ${subDir}`);
    await aiTools.createDirectory(subDir);
    
    // Write a file in the subdirectory
    const subFilePath = `${subDir}/subfile.txt`;
    console.log(`Writing to file in subdirectory: ${subFilePath}`);
    await aiTools.writeFile(subFilePath, 'This is a file in a subdirectory.');
    
    // List files recursively
    console.log(`Listing files recursively in directory: ${testDir}`);
    const recursiveFiles = await aiTools.listFiles(testDir, { recursive: true, fullPaths: true });
    console.log('Recursive files:', recursiveFiles);
    
    // Copy a directory
    const copyDir = `${testDir}-copy`;
    console.log(`Copying directory from ${testDir} to ${copyDir}`);
    await aiTools.copyDirectory(testDir, copyDir);
    
    // List files in the copied directory
    console.log(`Listing files in copied directory: ${copyDir}`);
    const copiedFiles = await aiTools.listFiles(copyDir, { recursive: true });
    console.log('Files in copied directory:', copiedFiles);
    
    // Clean up (uncomment to delete test directories)
    /*
    console.log(`Deleting directory: ${testDir}`);
    await aiTools.deleteDirectory(testDir);
    
    console.log(`Deleting directory: ${copyDir}`);
    await aiTools.deleteDirectory(copyDir);
    */
    
    console.log('\nAll examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the examples
runExamples();
