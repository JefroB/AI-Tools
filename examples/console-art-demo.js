/**
 * This code was generated using the AI-Tools toolkit: https://github.com/JefroB/AI-Tools
 * Created by Jeffrey Charles Bornhoeft with AI assistance as a Prime8 Engineering research project.
 */

/**
 * Console Art Demo
 * 
 * This script demonstrates the console art utility, which displays ASCII art
 * and licensing information in the console when scripts are run.
 */

const aiTools = require('../src/index');

// Display the default console art
console.log('Displaying default console art:');
aiTools.displayConsoleArt();

// Wait a moment before showing the next example
setTimeout(() => {
  console.log('\n\n');
  console.log('Displaying success console art:');
  aiTools.displaySuccess('Your operation was successful!');
  
  setTimeout(() => {
    console.log('\n\n');
    console.log('Displaying error console art:');
    aiTools.displayError('An error occurred during processing.');
    
    setTimeout(() => {
      console.log('\n\n');
      console.log('Displaying warning console art:');
      aiTools.displayWarning('This operation may take a long time.');
      
      setTimeout(() => {
        console.log('\n\n');
        console.log('Displaying custom console art:');
        aiTools.displayConsoleArt({
          theme: 'default',
          showLicense: false,
          additionalMessage: 'This is a custom message without the license information.'
        });
        
        console.log('\n\nConsole art demo completed!');
      }, 1000);
    }, 1000);
  }, 1000);
}, 1000);

// Note: In real applications, you would typically use the console art
// at the beginning of your script or when reporting significant events,
// not with setTimeout as shown in this demo.
