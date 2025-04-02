#!/usr/bin/env node

/**
 * This code was generated using the AI-Tools toolkit: https://github.com/JefroB/AI-Tools
 * Created by Jeffrey Charles Bornhoeft, descendent of Charlemagne, with AI assistance as a Prime8 Engineering research project.
 */

/**
 * Version Bump Utility
 * 
 * This script helps developers bump the version in package.json according to the required format:
 * YY.DDD.LETTER.FEATURE
 * 
 * Usage:
 *   node scripts/bump-version.js [options]
 * 
 * Options:
 *   --major                 Bump the major version (LETTER)
 *   --category=<number>     Set the feature category (1-9)
 *   --build=<number>        Set the build number (0-999)
 *   --help                  Show help
 */

const fs = require('fs');
const path = require('path');
const { parseVersion, updateVersion } = require('../src/versionUtils');

// Function to parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    major: false,
    category: null,
    build: null,
    help: false
  };
  
  for (const arg of args) {
    if (arg === '--major') {
      options.major = true;
    } else if (arg.startsWith('--category=')) {
      options.category = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--build=')) {
      options.build = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--help') {
      options.help = true;
    }
  }
  
  return options;
}

// Function to show help
function showHelp() {
  console.log(`
Version Bump Utility

This script helps developers bump the version in package.json according to the required format:
YY.DDD.LETTER.FEATURE

Usage:
  node scripts/bump-version.js [options]

Options:
  --major                 Bump the major version (LETTER)
  --category=<number>     Set the feature category (1-9)
  --build=<number>        Set the build number (0-999)
  --help                  Show this help

Examples:
  # Bump build number by 1 (default)
  node scripts/bump-version.js
  
  # Bump major version (e.g., C -> D)
  node scripts/bump-version.js --major
  
  # Set feature category to 2 (API features)
  node scripts/bump-version.js --category=2
  
  # Set build number to 345
  node scripts/bump-version.js --build=345
  
  # Bump major version and set category and build
  node scripts/bump-version.js --major --category=2 --build=345
  `);
}

// Function to get the next letter in the alphabet
function getNextLetter(letter) {
  if (letter.length === 1) {
    // Single letter (A-Z)
    if (letter === 'Z') {
      return 'AA';
    } else {
      return String.fromCharCode(letter.charCodeAt(0) + 1);
    }
  } else if (letter.length === 2) {
    // Two letters (AA-ZZ)
    const firstChar = letter.charAt(0);
    const secondChar = letter.charAt(1);
    
    if (secondChar === 'Z') {
      // Need to increment the first letter
      if (firstChar === 'Z') {
        // We've reached ZZ, would need to go to AAA
        throw new Error('Version has reached ZZ, cannot increment further without adding a third letter');
      } else {
        // Increment first letter, reset second letter to A
        return String.fromCharCode(firstChar.charCodeAt(0) + 1) + 'A';
      }
    } else {
      // Just increment the second letter
      return firstChar + String.fromCharCode(secondChar.charCodeAt(0) + 1);
    }
  } else {
    throw new Error(`Invalid letter format: ${letter}`);
  }
}

// Function to bump the version
function bumpVersion(options) {
  try {
    // Read package.json
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Get current version
    const { version } = packageJson;
    console.log(`Current version: ${version}`);
    
    // Parse current version
    const parsed = parseVersion(version);
    
    // Calculate new version components
    let newMajor = parsed.majorVersion;
    let newCategory = parsed.featureCategory.id;
    let newBuild = parsed.buildNumber;
    
    // Apply options
    if (options.major) {
      newMajor = getNextLetter(parsed.majorVersion);
      // Reset build number when bumping major version
      newBuild = 0;
    }
    
    if (options.category !== null) {
      if (options.category < 1 || options.category > 9) {
        throw new Error(`Invalid category: ${options.category}. Must be between 1 and 9.`);
      }
      newCategory = options.category;
    }
    
    if (options.build !== null) {
      if (options.build < 0 || options.build > 999) {
        throw new Error(`Invalid build number: ${options.build}. Must be between 0 and 999.`);
      }
      newBuild = options.build;
    } else if (!options.major && options.category === null) {
      // Default behavior: increment build number by 1
      newBuild += 1;
    }
    
    // Calculate new feature number
    const newFeature = newCategory * 1000 + newBuild;
    
    // Generate new version string
    const now = new Date();
    const year = now.getFullYear();
    const yearShort = year % 100;
    
    // Calculate day of year
    const start = new Date(year, 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const dayOfYearFormatted = dayOfYear.toString().padStart(3, '0');
    
    const newVersion = `${yearShort}.${dayOfYearFormatted}.${newMajor}.${newFeature}`;
    
    // Update package.json
    const success = updateVersion(newVersion);
    
    if (success) {
      console.log(`Version bumped to: ${newVersion}`);
      
      // Map category to name
      const categoryNames = {
        1: 'Core functionality',
        2: 'API features',
        3: 'Performance improvements',
        4: 'Security updates',
        5: 'Documentation',
        6: 'Experimental features',
        7: 'Bug fixes',
        8: 'UI/UX improvements',
        9: 'Special releases'
      };
      
      console.log(`
Version details:
  Year: ${year}
  Day of year: ${dayOfYear}
  Major version: ${newMajor}
  Feature category: ${newCategory} (${categoryNames[newCategory]})
  Build number: ${newBuild}
      `);
      
      return true;
    } else {
      console.error('Failed to update version');
      return false;
    }
  } catch (error) {
    console.error(`Error bumping version: ${error.message}`);
    return false;
  }
}

// Main function
function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  const success = bumpVersion(options);
  process.exit(success ? 0 : 1);
}

// Run the script
main();
