/**
 * User Preferences Demo
 * 
 * This script demonstrates how to use the userPrefsUtils module to manage
 * user preferences, including setting and retrieving the user's preferred name.
 */

const { 
  getUserName, 
  setUserName, 
  getUserPreference, 
  setUserPreference, 
  resetUserPreferences,
  promptForUserName
} = require('../src/userPrefsUtils');
const { displayConsoleArt, displaySuccess } = require('../src/consoleArt');

// Display the console art
displayConsoleArt();

console.log('User Preferences Demo\n');

// Check if the user name is already set
let userName = getUserName();
if (userName === 'User') {
  // If not, prompt for it
  console.log('No user name set. Let\'s set one now.\n');
  
  // In a real implementation, this would use readline to get user input
  // For demo purposes, we'll set a name directly
  const newName = process.argv[2] || 'Jeffrey Charles Bornhoeft';
  
  if (setUserName(newName)) {
    console.log(`User name set to: ${newName}`);
    userName = newName;
  } else {
    console.log('Failed to set user name.');
  }
} else {
  console.log(`Welcome back, ${userName}!`);
}

// Demonstrate setting and getting preferences
console.log('\nSetting some preferences...');

// Set a theme preference
setUserPreference('theme', 'dark');
console.log(`Theme set to: ${getUserPreference('theme')}`);

// Set a custom preference
setUserPreference('favoriteColor', 'blue');
console.log(`Favorite color set to: ${getUserPreference('favoriteColor')}`);

// Demonstrate getting a preference with a default value
const editor = getUserPreference('preferredEditor', 'VSCode');
console.log(`Preferred editor: ${editor} (default if not set)`);

// Show all current preferences
console.log('\nCurrent preferences:');
const prefs = require('../src/userPrefsUtils').loadUserPreferences();
console.log(JSON.stringify(prefs, null, 2));

// Demonstrate how to use the user name in your application
console.log('\nUsing the user name in your application:');
displaySuccess(`Hello ${userName}, your preferences have been saved!`);

console.log('\nTo reset all preferences, you can use:');
console.log('resetUserPreferences()');

// Instructions for running the demo with a different name
console.log('\nRun this demo with a different name:');
console.log('node examples/user-prefs-demo.js "Your Name"');
