/**
 * Version Utilities
 * 
 * This module provides utilities for working with the AI-Tools versioning system.
 * See docs/VERSIONING.md for details on the versioning system.
 */

/**
 * Generates a version string based on the current date and provided parameters
 * 
 * @param {string} majorVersion - The alphabetic major version (e.g., 'A', 'B', 'C', 'AA', etc.)
 * @param {number} featureCategory - The feature category (1-9)
 * @param {number} buildNumber - The build number (0-999)
 * @returns {string} The formatted version string
 */
function generateVersion(majorVersion, featureCategory, buildNumber) {
  const now = new Date();
  const year = now.getFullYear();
  const yearShort = year % 100; // Last two digits
  
  // Calculate day of year
  const start = new Date(year, 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  // Format day of year to 3 digits with leading zeros
  const dayOfYearFormatted = dayOfYear.toString().padStart(3, '0');
  
  // Calculate feature number
  const categoryDigit = featureCategory; // 1-9
  const buildNumberFormatted = buildNumber.toString().padStart(3, '0');
  const featureNumber = parseInt(`${categoryDigit}${buildNumberFormatted}`);
  
  return `${yearShort}.${dayOfYearFormatted}.${majorVersion}.${featureNumber}`;
}

/**
 * Parses a version string into its components
 * 
 * @param {string} versionString - The version string to parse (e.g., "25.092.C.2345")
 * @returns {Object} An object containing the parsed components
 */
function parseVersion(versionString) {
  const parts = versionString.split('.');
  
  if (parts.length !== 4) {
    throw new Error(`Invalid version string: ${versionString}. Expected format: YY.DDD.LETTER.FEATURE`);
  }
  
  const [yearShort, dayOfYear, majorVersion, featureNumber] = parts;
  
  // Parse year
  const year = 2000 + parseInt(yearShort, 10);
  
  // Parse day of year
  const dayOfYearInt = parseInt(dayOfYear, 10);
  
  // Calculate date from year and day of year
  const date = new Date(year, 0);
  date.setDate(dayOfYearInt);
  
  // Parse feature number
  const featureNumberInt = parseInt(featureNumber, 10);
  const featureCategory = Math.floor(featureNumberInt / 1000);
  const buildNumber = featureNumberInt % 1000;
  
  // Map feature category to name
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
  
  return {
    year,
    yearShort: parseInt(yearShort, 10),
    dayOfYear: dayOfYearInt,
    date: date.toISOString().split('T')[0], // YYYY-MM-DD format
    majorVersion,
    featureNumber: featureNumberInt,
    featureCategory: {
      id: featureCategory,
      name: categoryNames[featureCategory] || 'Unknown'
    },
    buildNumber
  };
}

/**
 * Formats a version string in different styles
 * 
 * @param {string} versionString - The version string to format
 * @param {string} format - The format to use ('full', 'short', 'user', 'date')
 * @returns {string} The formatted version string
 */
function formatVersion(versionString, format = 'full') {
  const parsed = parseVersion(versionString);
  
  switch (format) {
    case 'full':
      return versionString;
    case 'short':
      return `${parsed.majorVersion}.${parsed.featureNumber}`;
    case 'user':
      return `Version ${parsed.majorVersion} (Build ${parsed.featureNumber})`;
    case 'date':
      return `${parsed.date} Version ${parsed.majorVersion}`;
    default:
      return versionString;
  }
}

/**
 * Compares two version strings
 * 
 * @param {string} versionA - The first version string
 * @param {string} versionB - The second version string
 * @returns {number} -1 if versionA < versionB, 0 if equal, 1 if versionA > versionB
 */
function compareVersions(versionA, versionB) {
  const parsedA = parseVersion(versionA);
  const parsedB = parseVersion(versionB);
  
  // Compare year
  if (parsedA.year !== parsedB.year) {
    return parsedA.year < parsedB.year ? -1 : 1;
  }
  
  // Compare day of year
  if (parsedA.dayOfYear !== parsedB.dayOfYear) {
    return parsedA.dayOfYear < parsedB.dayOfYear ? -1 : 1;
  }
  
  // Compare major version (letter)
  // For single letters, we can compare directly
  if (parsedA.majorVersion.length === 1 && parsedB.majorVersion.length === 1) {
    if (parsedA.majorVersion !== parsedB.majorVersion) {
      return parsedA.majorVersion < parsedB.majorVersion ? -1 : 1;
    }
  } else {
    // For multi-letter versions, we need to compare them lexicographically
    // but taking into account their length
    if (parsedA.majorVersion.length !== parsedB.majorVersion.length) {
      return parsedA.majorVersion.length < parsedB.majorVersion.length ? -1 : 1;
    }
    
    if (parsedA.majorVersion !== parsedB.majorVersion) {
      return parsedA.majorVersion < parsedB.majorVersion ? -1 : 1;
    }
  }
  
  // Compare feature number
  if (parsedA.featureNumber !== parsedB.featureNumber) {
    return parsedA.featureNumber < parsedB.featureNumber ? -1 : 1;
  }
  
  // Versions are equal
  return 0;
}

/**
 * Gets the current version from package.json
 * 
 * @returns {string} The current version
 */
function getCurrentVersion() {
  try {
    const packageJson = require('../package.json');
    return packageJson.version;
  } catch (error) {
    console.error('Error reading package.json:', error);
    return null;
  }
}

/**
 * Updates the version in package.json
 * 
 * @param {string} newVersion - The new version string
 * @returns {boolean} True if successful, false otherwise
 */
function updateVersion(newVersion) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Parse the new version to validate it
    const parsed = parseVersion(newVersion);
    
    // Read package.json
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Update version
    packageJson.version = newVersion;
    
    // Add version details
    packageJson.versionDetails = {
      year: parsed.year,
      dayOfYear: parsed.dayOfYear,
      date: parsed.date,
      major: parsed.majorVersion,
      feature: {
        category: parsed.featureCategory.name,
        build: parsed.buildNumber
      }
    };
    
    // Write back to package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    
    return true;
  } catch (error) {
    console.error('Error updating version:', error);
    return false;
  }
}

module.exports = {
  generateVersion,
  parseVersion,
  formatVersion,
  compareVersions,
  getCurrentVersion,
  updateVersion
};
