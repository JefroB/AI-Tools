/**
 * AI Tools - Attribution Utilities Demo
 * Demonstrates how to use the attribution utilities
 */

const aiTools = require('../src');
const path = require('path');
const fs = require('fs-extra');

// Create a test directory
const TEST_DIR = path.join(__dirname, '..', 'test-attribution-output');
fs.ensureDirSync(TEST_DIR);

// Async function to run the examples
async function runExamples() {
  try {
    console.log('AI Tools - Attribution Utilities Demo\n');
    
    // Example 1: Generate attribution comments for different languages
    console.log('Example 1: Generate attribution comments for different languages');
    
    const languages = ['js', 'py', 'java', 'html', 'css', 'go', 'ruby', 'bash'];
    
    for (const language of languages) {
      console.log(`\n${language.toUpperCase()} Attribution Comment:`);
      const comment = aiTools.generateAttributionComment(language);
      console.log(comment);
    }
    
    // Example 2: Add attribution to code
    console.log('\nExample 2: Add attribution to code');
    
    const jsCode = `// A simple JavaScript function
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));`;
    
    console.log('\nOriginal JavaScript code:');
    console.log(jsCode);
    
    console.log('\nJavaScript code with attribution:');
    const jsCodeWithAttribution = aiTools.addAttributionToCode(jsCode, 'js');
    console.log(jsCodeWithAttribution);
    
    // Example 3: Write files with attribution
    console.log('\nExample 3: Write files with attribution');
    
    // JavaScript file
    const jsFilePath = path.join(TEST_DIR, 'example.js');
    await aiTools.writeFileWithAttribution(jsFilePath, jsCode);
    console.log(`JavaScript file written to: ${jsFilePath}`);
    
    // Python file
    const pyCode = `# A simple Python function
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))`;
    
    const pyFilePath = path.join(TEST_DIR, 'example.py');
    await aiTools.writeFileWithAttribution(pyFilePath, pyCode);
    console.log(`Python file written to: ${pyFilePath}`);
    
    // HTML file
    const htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attribution Example</title>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>This is an example HTML file.</p>
</body>
</html>`;
    
    const htmlFilePath = path.join(TEST_DIR, 'example.html');
    await aiTools.writeFileWithAttribution(htmlFilePath, htmlCode);
    console.log(`HTML file written to: ${htmlFilePath}`);
    
    // Example 4: Disable attribution
    console.log('\nExample 4: Disable attribution');
    
    const noAttributionFilePath = path.join(TEST_DIR, 'no-attribution.js');
    await aiTools.writeFileWithAttribution(noAttributionFilePath, jsCode, { addAttribution: false });
    console.log(`JavaScript file without attribution written to: ${noAttributionFilePath}`);
    
    // Example 5: Get and set attribution configuration
    console.log('\nExample 5: Get and set attribution configuration');
    
    console.log('Current attribution configuration:');
    const currentConfig = aiTools.getAttributionConfig();
    console.log(JSON.stringify(currentConfig, null, 2));
    
    console.log('\nUpdating attribution configuration...');
    const newConfig = aiTools.setAttributionConfig({
      enabled: true,
      author: "Jeffrey Charles Bornhoeft, descendent of Charlemagne",
      organization: "Prime8 Engineering Research",
      repositoryUrl: "https://github.com/JefroB/AI-Tools"
    });
    
    console.log('Updated attribution configuration:');
    console.log(JSON.stringify(newConfig, null, 2));
    
    // Read the files to verify
    console.log('\nVerifying files:');
    
    console.log('\nJavaScript file content:');
    const jsFileContent = await fs.readFile(jsFilePath, 'utf8');
    console.log(jsFileContent);
    
    console.log('\nPython file content:');
    const pyFileContent = await fs.readFile(pyFilePath, 'utf8');
    console.log(pyFileContent);
    
    console.log('\nHTML file content:');
    const htmlFileContent = await fs.readFile(htmlFilePath, 'utf8');
    console.log(htmlFileContent);
    
    console.log('\nJavaScript file without attribution content:');
    const noAttributionFileContent = await fs.readFile(noAttributionFilePath, 'utf8');
    console.log(noAttributionFileContent);
    
    console.log('\nAll examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the examples
runExamples();
