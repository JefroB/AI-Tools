/**
 * Version Utilities Demo
 * 
 * This example demonstrates how to use the version utilities to work with
 * the AI-Tools versioning system.
 */

const versionUtils = require('../src/versionUtils');

/**
 * Example 1: Generating a version string
 * 
 * This example demonstrates how to generate a version string based on
 * the current date and provided parameters.
 */
function generateVersionExample() {
  console.log('\n=== Generating Version Example ===');
  
  // Generate a version for a core functionality update
  const coreVersion = versionUtils.generateVersion('C', 1, 123);
  console.log(`Generated core functionality version: ${coreVersion}`);
  
  // Generate a version for an API feature update
  const apiVersion = versionUtils.generateVersion('C', 2, 345);
  console.log(`Generated API feature version: ${apiVersion}`);
  
  // Generate a version for a bug fix
  const bugfixVersion = versionUtils.generateVersion('C', 7, 42);
  console.log(`Generated bug fix version: ${bugfixVersion}`);
  
  // Generate a version for a documentation update
  const docsVersion = versionUtils.generateVersion('C', 5, 789);
  console.log(`Generated documentation version: ${docsVersion}`);
}

/**
 * Example 2: Parsing a version string
 * 
 * This example demonstrates how to parse a version string into its components.
 */
function parseVersionExample() {
  console.log('\n=== Parsing Version Example ===');
  
  const versionString = '25.092.C.2345';
  console.log(`Parsing version string: ${versionString}`);
  
  const parsed = versionUtils.parseVersion(versionString);
  console.log('Parsed version:');
  console.log(JSON.stringify(parsed, null, 2));
  
  console.log(`\nYear: ${parsed.year}`);
  console.log(`Date: ${parsed.date}`);
  console.log(`Major Version: ${parsed.majorVersion}`);
  console.log(`Feature Category: ${parsed.featureCategory.name} (${parsed.featureCategory.id})`);
  console.log(`Build Number: ${parsed.buildNumber}`);
}

/**
 * Example 3: Formatting a version string
 * 
 * This example demonstrates how to format a version string in different styles.
 */
function formatVersionExample() {
  console.log('\n=== Formatting Version Example ===');
  
  const versionString = '25.092.C.2345';
  console.log(`Original version string: ${versionString}`);
  
  // Format as full version
  const fullVersion = versionUtils.formatVersion(versionString, 'full');
  console.log(`Full format: ${fullVersion}`);
  
  // Format as short version
  const shortVersion = versionUtils.formatVersion(versionString, 'short');
  console.log(`Short format: ${shortVersion}`);
  
  // Format as user-friendly version
  const userVersion = versionUtils.formatVersion(versionString, 'user');
  console.log(`User-friendly format: ${userVersion}`);
  
  // Format as date-focused version
  const dateVersion = versionUtils.formatVersion(versionString, 'date');
  console.log(`Date-focused format: ${dateVersion}`);
}

/**
 * Example 4: Comparing version strings
 * 
 * This example demonstrates how to compare version strings.
 */
function compareVersionsExample() {
  console.log('\n=== Comparing Versions Example ===');
  
  const versions = [
    '25.092.C.2345',
    '25.100.C.2345',
    '25.092.D.2345',
    '25.092.C.2346',
    '26.001.C.2345',
    '25.092.AA.2345'
  ];
  
  console.log('Versions to compare:');
  versions.forEach(version => console.log(`- ${version}`));
  
  console.log('\nSorting versions:');
  const sortedVersions = [...versions].sort(versionUtils.compareVersions);
  sortedVersions.forEach(version => console.log(`- ${version}`));
  
  console.log('\nComparison examples:');
  console.log(`'25.092.C.2345' < '25.100.C.2345': ${versionUtils.compareVersions('25.092.C.2345', '25.100.C.2345') < 0}`);
  console.log(`'25.092.C.2345' < '25.092.D.2345': ${versionUtils.compareVersions('25.092.C.2345', '25.092.D.2345') < 0}`);
  console.log(`'25.092.C.2345' < '25.092.C.2346': ${versionUtils.compareVersions('25.092.C.2345', '25.092.C.2346') < 0}`);
  console.log(`'25.092.C.2345' < '26.001.C.2345': ${versionUtils.compareVersions('25.092.C.2345', '26.001.C.2345') < 0}`);
  console.log(`'25.092.Z.2345' < '25.092.AA.2345': ${versionUtils.compareVersions('25.092.Z.2345', '25.092.AA.2345') < 0}`);
}

/**
 * Example 5: Working with package.json version
 * 
 * This example demonstrates how to get and update the version in package.json.
 * Note: This example doesn't actually update package.json to avoid modifying
 * your project files. Uncomment the updateVersion call to test it.
 */
function packageJsonVersionExample() {
  console.log('\n=== Package.json Version Example ===');
  
  // Get current version from package.json
  const currentVersion = versionUtils.getCurrentVersion();
  console.log(`Current version in package.json: ${currentVersion}`);
  
  // Generate a new version
  const newVersion = versionUtils.generateVersion('C', 2, 345);
  console.log(`Generated new version: ${newVersion}`);
  
  // Update version in package.json (commented out to avoid modifying your project)
  console.log(`To update package.json with the new version, uncomment the following line:`);
  console.log(`// versionUtils.updateVersion(newVersion);`);
}

/**
 * Example 6: Migration from semantic versioning
 * 
 * This example demonstrates how to migrate from semantic versioning to
 * the new versioning system.
 */
function migrationExample() {
  console.log('\n=== Migration from Semantic Versioning Example ===');
  
  const semanticVersion = '3.2.1';
  console.log(`Original semantic version: ${semanticVersion}`);
  
  // Map semantic version to new versioning system
  // For this example, we'll use:
  // - Major version 3 -> C
  // - Minor version 2 -> API features (category 2)
  // - Patch version 1 -> Build number 1
  const newVersion = versionUtils.generateVersion('C', 2, 1);
  console.log(`Migrated to new versioning system: ${newVersion}`);
  
  // Parse the new version to show its components
  const parsed = versionUtils.parseVersion(newVersion);
  console.log('New version components:');
  console.log(JSON.stringify(parsed, null, 2));
}

/**
 * Run all examples
 */
function runAllExamples() {
  try {
    generateVersionExample();
    parseVersionExample();
    formatVersionExample();
    compareVersionsExample();
    packageJsonVersionExample();
    migrationExample();
    
    console.log('\nAll examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the examples
runAllExamples();
