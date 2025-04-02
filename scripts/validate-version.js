#!/usr/bin/env node

/**
 * This code was generated using the AI-Tools toolkit: https://github.com/JefroB/AI-Tools
 * Created by Jeffrey Charles Bornhoeft, descendent of Charlemagne, with AI assistance as a Prime8 Engineering research project.
 */

/**
 * Version Validation Script
 * 
 * This script validates that the version in package.json follows the required format:
 * YY.DDD.LETTER.FEATURE
 * 
 * It is designed to be used as a pre-commit hook to ensure all version changes
 * comply with the mandatory versioning system.
 */

const fs = require('fs');
const path = require('path');

// Regular expression for validating version format
const VERSION_REGEX = /^(\d{2})\.(\d{3})\.([A-Z]{1,2})\.(\d{4})$/;

// Function to validate version format
function validateVersionFormat(version) {
  if (!VERSION_REGEX.test(version)) {
    return {
      valid: false,
      message: `Invalid version format: ${version}. Expected format: YY.DDD.LETTER.FEATURE`
    };
  }
  
  const [, yearStr, dayStr, letter, featureStr] = VERSION_REGEX.exec(version);
  
  // Validate year (should be current year or future)
  const year = parseInt(yearStr, 10) + 2000;
  const currentYear = new Date().getFullYear();
  if (year < currentYear) {
    return {
      valid: false,
      message: `Invalid year in version: ${yearStr}. Year should be current or future.`
    };
  }
  
  // Validate day of year (1-366)
  const day = parseInt(dayStr, 10);
  if (day < 1 || day > 366) {
    return {
      valid: false,
      message: `Invalid day of year in version: ${dayStr}. Day should be between 001 and 366.`
    };
  }
  
  // Validate letter format (A-Z or AA-ZZ)
  if (letter.length > 2) {
    return {
      valid: false,
      message: `Invalid letter format in version: ${letter}. Should be A-Z or AA-ZZ.`
    };
  }
  
  // Validate feature number (1000-9999)
  const feature = parseInt(featureStr, 10);
  if (feature < 1000 || feature > 9999) {
    return {
      valid: false,
      message: `Invalid feature number in version: ${featureStr}. Should be between 1000 and 9999.`
    };
  }
  
  // Validate first digit of feature (1-9)
  const categoryDigit = Math.floor(feature / 1000);
  if (categoryDigit < 1 || categoryDigit > 9) {
    return {
      valid: false,
      message: `Invalid feature category in version: ${categoryDigit}. Should be between 1 and 9.`
    };
  }
  
  return { valid: true };
}

// Function to validate version details in package.json
function validateVersionDetails(packageJson) {
  const { version, versionDetails } = packageJson;
  
  if (!versionDetails) {
    return {
      valid: false,
      message: 'Missing versionDetails in package.json'
    };
  }
  
  // Parse version to compare with versionDetails
  const [, yearStr, dayStr, letter, featureStr] = VERSION_REGEX.exec(version);
  const year = parseInt(yearStr, 10) + 2000;
  const day = parseInt(dayStr, 10);
  const feature = parseInt(featureStr, 10);
  const categoryDigit = Math.floor(feature / 1000);
  const buildNumber = feature % 1000;
  
  // Validate year
  if (versionDetails.year !== year) {
    return {
      valid: false,
      message: `Year in versionDetails (${versionDetails.year}) does not match version (${year})`
    };
  }
  
  // Validate day of year
  if (versionDetails.dayOfYear !== day) {
    return {
      valid: false,
      message: `Day of year in versionDetails (${versionDetails.dayOfYear}) does not match version (${day})`
    };
  }
  
  // Validate major version
  if (versionDetails.major !== letter) {
    return {
      valid: false,
      message: `Major version in versionDetails (${versionDetails.major}) does not match version (${letter})`
    };
  }
  
  // Validate build number
  if (versionDetails.feature && versionDetails.feature.build !== buildNumber) {
    return {
      valid: false,
      message: `Build number in versionDetails (${versionDetails.feature.build}) does not match version (${buildNumber})`
    };
  }
  
  return { valid: true };
}

// Main function
function main() {
  try {
    // Read package.json
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Get version
    const { version } = packageJson;
    
    // Validate version format
    const formatResult = validateVersionFormat(version);
    if (!formatResult.valid) {
      console.error(`❌ ${formatResult.message}`);
      console.error('Version must follow the format: YY.DDD.LETTER.FEATURE');
      console.error('See docs/VERSIONING.md for details');
      process.exit(1);
    }
    
    // Validate version details
    const detailsResult = validateVersionDetails(packageJson);
    if (!detailsResult.valid) {
      console.error(`❌ ${detailsResult.message}`);
      console.error('versionDetails in package.json must match the version');
      console.error('See docs/VERSIONING.md for details');
      process.exit(1);
    }
    
    console.log(`✅ Version ${version} is valid`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error validating version: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main();
