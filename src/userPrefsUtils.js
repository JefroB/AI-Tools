/**
 * This code was generated using the AI-Tools toolkit: https://github.com/JefroB/AI-Tools
 * Created by Jeffrey Charles Bornhoeft with AI assistance as a Prime8 Engineering research project.
 */

/**
 * User Preferences Utilities
 * 
 * This module provides functions for managing user preferences that persist
 * between sessions. Preferences are stored in a local JSON file that is
 * excluded from version control.
 */

const fs = require('fs');
const path = require('path');
const { fileExists, createDirectory } = require('./fileUtils');

// Constants
const USER_PREFS_DIR = '.user-prefs';
const USER_PREFS_FILE = 'preferences.json';
const DEFAULT_PREFS = {
  userName: 'User', // Default name if not specified
  theme: 'default',
  lastUsed: null,
  preferences: {}
};

/**
 * Ensures the user preferences directory exists
 * @returns {string} Path to the user preferences directory
 */
function ensurePrefsDirectory() {
  const prefsDir = path.join(process.cwd(), USER_PREFS_DIR);
  
  if (!fs.existsSync(prefsDir)) {
    try {
      fs.mkdirSync(prefsDir, { recursive: true });
    } catch (error) {
      console.error(`Error creating preferences directory: ${error.message}`);
      throw error;
    }
  }
  
  return prefsDir;
}

/**
 * Gets the path to the user preferences file
 * @returns {string} Path to the user preferences file
 */
function getPrefsFilePath() {
  const prefsDir = ensurePrefsDirectory();
  return path.join(prefsDir, USER_PREFS_FILE);
}

/**
 * Loads user preferences from the preferences file
 * @returns {Object} User preferences object
 */
function loadUserPreferences() {
  const prefsFilePath = getPrefsFilePath();
  
  if (!fs.existsSync(prefsFilePath)) {
    // If the file doesn't exist, return default preferences
    return { ...DEFAULT_PREFS };
  }
  
  try {
    const prefsData = fs.readFileSync(prefsFilePath, 'utf8');
    const prefs = JSON.parse(prefsData);
    
    // Update the last used timestamp
    prefs.lastUsed = new Date().toISOString();
    
    return prefs;
  } catch (error) {
    console.error(`Error loading user preferences: ${error.message}`);
    // If there's an error, return default preferences
    return { ...DEFAULT_PREFS };
  }
}

/**
 * Saves user preferences to the preferences file
 * @param {Object} prefs - User preferences object to save
 * @returns {boolean} True if successful, false otherwise
 */
function saveUserPreferences(prefs) {
  const prefsFilePath = getPrefsFilePath();
  
  try {
    // Update the last used timestamp
    prefs.lastUsed = new Date().toISOString();
    
    // Write the preferences to the file
    fs.writeFileSync(prefsFilePath, JSON.stringify(prefs, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error saving user preferences: ${error.message}`);
    return false;
  }
}

/**
 * Gets the user's preferred name
 * @returns {string} The user's preferred name
 */
function getUserName() {
  const prefs = loadUserPreferences();
  return prefs.userName || DEFAULT_PREFS.userName;
}

/**
 * Sets the user's preferred name
 * @param {string} name - The user's preferred name
 * @returns {boolean} True if successful, false otherwise
 */
function setUserName(name) {
  if (!name || typeof name !== 'string') {
    console.error('Invalid user name provided');
    return false;
  }
  
  const prefs = loadUserPreferences();
  prefs.userName = name;
  return saveUserPreferences(prefs);
}

/**
 * Gets a specific user preference
 * @param {string} key - The preference key
 * @param {*} defaultValue - Default value if the preference doesn't exist
 * @returns {*} The preference value or default value
 */
function getUserPreference(key, defaultValue = null) {
  const prefs = loadUserPreferences();
  
  if (key in prefs) {
    return prefs[key];
  } else if (prefs.preferences && key in prefs.preferences) {
    return prefs.preferences[key];
  }
  
  return defaultValue;
}

/**
 * Sets a specific user preference
 * @param {string} key - The preference key
 * @param {*} value - The preference value
 * @returns {boolean} True if successful, false otherwise
 */
function setUserPreference(key, value) {
  if (!key || typeof key !== 'string') {
    console.error('Invalid preference key provided');
    return false;
  }
  
  const prefs = loadUserPreferences();
  
  // Handle top-level preferences
  if (key === 'userName' || key === 'theme') {
    prefs[key] = value;
  } else {
    // Store other preferences in the preferences object
    if (!prefs.preferences) {
      prefs.preferences = {};
    }
    prefs.preferences[key] = value;
  }
  
  return saveUserPreferences(prefs);
}

/**
 * Clears all user preferences and resets to defaults
 * @returns {boolean} True if successful, false otherwise
 */
function resetUserPreferences() {
  return saveUserPreferences({ ...DEFAULT_PREFS });
}

/**
 * Prompts the user for their preferred name if not already set
 * @param {string} defaultName - Default name to use if the user doesn't provide one
 * @returns {string} The user's preferred name
 */
function promptForUserName(defaultName = DEFAULT_PREFS.userName) {
  const prefs = loadUserPreferences();
  
  // If the user name is already set, return it
  if (prefs.userName && prefs.userName !== DEFAULT_PREFS.userName) {
    return prefs.userName;
  }
  
  // In a real implementation, this would prompt the user via readline or similar
  // For now, we'll just set it to the default name
  console.log(`
==========================================================
Welcome to AI-Tools! 
==========================================================
To personalize your experience, please provide your name.
This will be stored locally and not shared with anyone.
  `);
  
  // Simulate user input (in a real implementation, this would be readline)
  const name = defaultName;
  
  // Save the user's name
  setUserName(name);
  
  return name;
}

module.exports = {
  getUserName,
  setUserName,
  getUserPreference,
  setUserPreference,
  resetUserPreferences,
  promptForUserName,
  loadUserPreferences,
  saveUserPreferences
};
