/**
 * Project Utility Module for AI Tools
 * Provides utilities for project and dependency management
 */

const fs = require('fs-extra');
const path = require('path');
const execUtils = require('./execUtils');

/**
 * Read and parse package.json
 * @param {string} dirPath - Path to the directory containing package.json (default: process.cwd())
 * @returns {Promise<Object>} - Parsed package.json content
 */
async function readPackageJson(dirPath = process.cwd()) {
  try {
    // Resolve the directory path
    const resolvedPath = path.resolve(dirPath);
    
    // Resolve the package.json path
    const packageJsonPath = path.join(resolvedPath, 'package.json');
    
    // Check if package.json exists
    if (!await fs.pathExists(packageJsonPath)) {
      throw new Error(`package.json not found in ${resolvedPath}`);
    }
    
    // Read and parse package.json
    const packageJson = await fs.readJson(packageJsonPath);
    
    return packageJson;
  } catch (error) {
    throw new Error(`Error reading package.json in ${dirPath}: ${error.message}`);
  }
}

/**
 * Get dependencies from package.json
 * @param {string} dirPath - Path to the directory containing package.json (default: process.cwd())
 * @param {Object} options - Options for getting dependencies
 * @param {boolean} options.dev - Whether to include devDependencies (default: true)
 * @param {boolean} options.peer - Whether to include peerDependencies (default: false)
 * @param {boolean} options.optional - Whether to include optionalDependencies (default: false)
 * @param {boolean} options.includeVersions - Whether to include version strings (default: true)
 * @returns {Promise<Object>} - Dependencies object
 */
async function getDependencies(dirPath = process.cwd(), options = {}) {
  try {
    // Set default options
    const includeDev = options.dev !== undefined ? options.dev : true;
    const includePeer = options.peer || false;
    const includeOptional = options.optional || false;
    const includeVersions = options.includeVersions !== undefined ? options.includeVersions : true;
    
    // Read package.json
    const packageJson = await readPackageJson(dirPath);
    
    // Initialize result object
    const result = {
      dependencies: {},
      count: {
        dependencies: 0,
        devDependencies: 0,
        peerDependencies: 0,
        optionalDependencies: 0,
        total: 0
      }
    };
    
    // Process regular dependencies
    if (packageJson.dependencies) {
      result.count.dependencies = Object.keys(packageJson.dependencies).length;
      result.count.total += result.count.dependencies;
      
      if (includeVersions) {
        result.dependencies = { ...packageJson.dependencies };
      } else {
        result.dependencies = Object.keys(packageJson.dependencies).reduce((acc, dep) => {
          acc[dep] = true;
          return acc;
        }, {});
      }
    }
    
    // Process devDependencies if requested
    if (includeDev && packageJson.devDependencies) {
      result.count.devDependencies = Object.keys(packageJson.devDependencies).length;
      result.count.total += result.count.devDependencies;
      
      if (!result.devDependencies) {
        result.devDependencies = {};
      }
      
      if (includeVersions) {
        result.devDependencies = { ...packageJson.devDependencies };
      } else {
        result.devDependencies = Object.keys(packageJson.devDependencies).reduce((acc, dep) => {
          acc[dep] = true;
          return acc;
        }, {});
      }
    }
    
    // Process peerDependencies if requested
    if (includePeer && packageJson.peerDependencies) {
      result.count.peerDependencies = Object.keys(packageJson.peerDependencies).length;
      result.count.total += result.count.peerDependencies;
      
      if (!result.peerDependencies) {
        result.peerDependencies = {};
      }
      
      if (includeVersions) {
        result.peerDependencies = { ...packageJson.peerDependencies };
      } else {
        result.peerDependencies = Object.keys(packageJson.peerDependencies).reduce((acc, dep) => {
          acc[dep] = true;
          return acc;
        }, {});
      }
    }
    
    // Process optionalDependencies if requested
    if (includeOptional && packageJson.optionalDependencies) {
      result.count.optionalDependencies = Object.keys(packageJson.optionalDependencies).length;
      result.count.total += result.count.optionalDependencies;
      
      if (!result.optionalDependencies) {
        result.optionalDependencies = {};
      }
      
      if (includeVersions) {
        result.optionalDependencies = { ...packageJson.optionalDependencies };
      } else {
        result.optionalDependencies = Object.keys(packageJson.optionalDependencies).reduce((acc, dep) => {
          acc[dep] = true;
          return acc;
        }, {});
      }
    }
    
    return result;
  } catch (error) {
    throw new Error(`Error getting dependencies in ${dirPath}: ${error.message}`);
  }
}

/**
 * Add a dependency to package.json
 * @param {string} packageName - Name of the package to add
 * @param {Object} options - Options for adding the dependency
 * @param {boolean} options.dev - Whether to add as a dev dependency (default: false)
 * @param {boolean} options.peer - Whether to add as a peer dependency (default: false)
 * @param {boolean} options.optional - Whether to add as an optional dependency (default: false)
 * @param {string} options.version - Specific version to add (default: latest)
 * @param {boolean} options.install - Whether to run npm install after adding (default: true)
 * @param {string} options.dirPath - Path to the directory containing package.json (default: process.cwd())
 * @returns {Promise<Object>} - Result of the operation
 */
async function addDependency(packageName, options = {}) {
  try {
    // Validate package name
    if (!packageName || typeof packageName !== 'string') {
      throw new Error('Invalid package name');
    }
    
    // Set default options
    const isDev = options.dev || false;
    const isPeer = options.peer || false;
    const isOptional = options.optional || false;
    const version = options.version || 'latest';
    const install = options.install !== undefined ? options.install : true;
    const dirPath = options.dirPath || process.cwd();
    
    // Resolve the directory path
    const resolvedPath = path.resolve(dirPath);
    
    // Resolve the package.json path
    const packageJsonPath = path.join(resolvedPath, 'package.json');
    
    // Check if package.json exists
    if (!await fs.pathExists(packageJsonPath)) {
      throw new Error(`package.json not found in ${resolvedPath}`);
    }
    
    // Read package.json
    const packageJson = await fs.readJson(packageJsonPath);
    
    // Determine the dependency type
    let dependencyType = 'dependencies';
    if (isDev) dependencyType = 'devDependencies';
    else if (isPeer) dependencyType = 'peerDependencies';
    else if (isOptional) dependencyType = 'optionalDependencies';
    
    // Ensure the dependency section exists
    if (!packageJson[dependencyType]) {
      packageJson[dependencyType] = {};
    }
    
    // Check if the dependency already exists
    const alreadyExists = packageJson[dependencyType][packageName] !== undefined;
    
    // Add the dependency
    packageJson[dependencyType][packageName] = version;
    
    // Write the updated package.json
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    
    // Run npm install if requested
    if (install) {
      const installCommand = `npm install`;
      await execUtils.runShellCommand(installCommand, { cwd: resolvedPath });
    }
    
    return {
      success: true,
      packageName,
      version,
      dependencyType,
      alreadyExists,
      installed: install
    };
  } catch (error) {
    throw new Error(`Error adding dependency ${packageName}: ${error.message}`);
  }
}

/**
 * Remove a dependency from package.json
 * @param {string} packageName - Name of the package to remove
 * @param {Object} options - Options for removing the dependency
 * @param {boolean} options.dev - Whether to remove from devDependencies (default: false)
 * @param {boolean} options.peer - Whether to remove from peerDependencies (default: false)
 * @param {boolean} options.optional - Whether to remove from optionalDependencies (default: false)
 * @param {boolean} options.removeAll - Whether to remove from all dependency types (default: false)
 * @param {boolean} options.uninstall - Whether to run npm uninstall after removing (default: true)
 * @param {string} options.dirPath - Path to the directory containing package.json (default: process.cwd())
 * @returns {Promise<Object>} - Result of the operation
 */
async function removeDependency(packageName, options = {}) {
  try {
    // Validate package name
    if (!packageName || typeof packageName !== 'string') {
      throw new Error('Invalid package name');
    }
    
    // Set default options
    const isDev = options.dev || false;
    const isPeer = options.peer || false;
    const isOptional = options.optional || false;
    const removeAll = options.removeAll || false;
    const uninstall = options.uninstall !== undefined ? options.uninstall : true;
    const dirPath = options.dirPath || process.cwd();
    
    // Resolve the directory path
    const resolvedPath = path.resolve(dirPath);
    
    // Resolve the package.json path
    const packageJsonPath = path.join(resolvedPath, 'package.json');
    
    // Check if package.json exists
    if (!await fs.pathExists(packageJsonPath)) {
      throw new Error(`package.json not found in ${resolvedPath}`);
    }
    
    // Read package.json
    const packageJson = await fs.readJson(packageJsonPath);
    
    // Initialize result
    const result = {
      success: true,
      packageName,
      removed: false,
      removedFrom: []
    };
    
    // Determine which dependency types to check
    const typesToCheck = [];
    if (removeAll) {
      typesToCheck.push('dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies');
    } else {
      if (!isDev && !isPeer && !isOptional) typesToCheck.push('dependencies');
      if (isDev) typesToCheck.push('devDependencies');
      if (isPeer) typesToCheck.push('peerDependencies');
      if (isOptional) typesToCheck.push('optionalDependencies');
    }
    
    // Remove the dependency from each type
    for (const type of typesToCheck) {
      if (packageJson[type] && packageJson[type][packageName]) {
        delete packageJson[type][packageName];
        result.removed = true;
        result.removedFrom.push(type);
      }
    }
    
    // Write the updated package.json
    if (result.removed) {
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
      
      // Run npm uninstall if requested
      if (uninstall) {
        const uninstallCommand = `npm uninstall ${packageName}`;
        await execUtils.runShellCommand(uninstallCommand, { cwd: resolvedPath });
        result.uninstalled = true;
      }
    }
    
    return result;
  } catch (error) {
    throw new Error(`Error removing dependency ${packageName}: ${error.message}`);
  }
}

module.exports = {
  readPackageJson,
  getDependencies,
  addDependency,
  removeDependency
};
