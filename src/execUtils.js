/**
 * Execution Utility Module for AI Tools
 * Provides utilities for executing commands and validating operations
 */

const fs = require('fs-extra');
const path = require('path');
const { promisify } = require('util');
const { exec, spawn } = require('child_process');
const execAsync = promisify(exec);

/**
 * Run a shell command with enhanced options and safety checks
 * @param {string} command - The command to execute
 * @param {Object} options - Options for running the command
 * @param {string} options.cwd - Current working directory (default: process.cwd())
 * @param {number} options.timeout - Timeout in milliseconds (default: 30000)
 * @param {boolean} options.dryRun - Whether to simulate the command without executing it (default: false)
 * @param {Object} options.env - Environment variables to set
 * @returns {Promise<Object>} - Result of the command execution
 */
async function runShellCommand(command, options = {}) {
  try {
    // Set default options
    const cwd = options.cwd || process.cwd();
    const timeout = options.timeout || 30000;
    const dryRun = options.dryRun || false;
    const env = options.env || {};
    
    // Validate the command (basic security check)
    if (!command || typeof command !== 'string') {
      throw new Error('Invalid command');
    }
    
    // Check for potentially dangerous commands
    const dangerousCommands = [
      /rm\s+(-rf?|--recursive)\s+[\/~]/i,
      /mkfs/i,
      /dd\s+if=/i,
      />\s*\/dev\/(hd|sd|nvme)/i,
      /chmod\s+777/i
    ];
    
    for (const pattern of dangerousCommands) {
      if (pattern.test(command)) {
        throw new Error(`Potentially dangerous command detected: ${command}`);
      }
    }
    
    // Dry run mode
    if (dryRun) {
      return {
        command,
        cwd,
        dryRun: true,
        message: `[DRY RUN] Would execute: ${command} in ${cwd}`
      };
    }
    
    // Execute the command
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout,
      env: { ...process.env, ...env }
    });
    
    return {
      command,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      success: true
    };
  } catch (error) {
    if (error.killed && error.signal === 'SIGTERM') {
      throw new Error(`Command timed out: ${command}`);
    } else {
      throw new Error(`Error executing command: ${error.message}`);
    }
  }
}

/**
 * Run a command with real-time output streaming
 * @param {string} command - The command to execute
 * @param {Array<string>} args - Arguments for the command
 * @param {Object} options - Options for running the command
 * @param {string} options.cwd - Current working directory (default: process.cwd())
 * @param {boolean} options.dryRun - Whether to simulate the command without executing it (default: false)
 * @param {Object} options.env - Environment variables to set
 * @param {Function} options.onStdout - Callback for stdout data
 * @param {Function} options.onStderr - Callback for stderr data
 * @returns {Promise<Object>} - Result of the command execution
 */
function runCommandWithOutput(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    // Set default options
    const cwd = options.cwd || process.cwd();
    const dryRun = options.dryRun || false;
    const env = options.env || {};
    const onStdout = options.onStdout || (data => process.stdout.write(data));
    const onStderr = options.onStderr || (data => process.stderr.write(data));
    
    // Validate the command
    if (!command || typeof command !== 'string') {
      return reject(new Error('Invalid command'));
    }
    
    // Dry run mode
    if (dryRun) {
      return resolve({
        command,
        args,
        cwd,
        dryRun: true,
        message: `[DRY RUN] Would execute: ${command} ${args.join(' ')} in ${cwd}`
      });
    }
    
    // Spawn the process
    const childProcess = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      shell: true
    });
    
    let stdout = '';
    let stderr = '';
    
    // Handle stdout
    childProcess.stdout.on('data', (data) => {
      const dataStr = data.toString();
      stdout += dataStr;
      onStdout(dataStr);
    });
    
    // Handle stderr
    childProcess.stderr.on('data', (data) => {
      const dataStr = data.toString();
      stderr += dataStr;
      onStderr(dataStr);
    });
    
    // Handle process completion
    childProcess.on('close', (code) => {
      resolve({
        command,
        args,
        stdout,
        stderr,
        exitCode: code,
        success: code === 0
      });
    });
    
    // Handle errors
    childProcess.on('error', (error) => {
      reject(new Error(`Error executing command: ${error.message}`));
    });
  });
}

/**
 * Run an npm script from package.json
 * @param {string} scriptName - Name of the npm script to run
 * @param {Object} options - Options for running the script
 * @param {string} options.cwd - Current working directory (default: process.cwd())
 * @param {boolean} options.dryRun - Whether to simulate the script without executing it (default: false)
 * @param {boolean} options.stream - Whether to stream output in real-time (default: true)
 * @param {Function} options.onStdout - Callback for stdout data when streaming
 * @param {Function} options.onStderr - Callback for stderr data when streaming
 * @returns {Promise<Object>} - Result of the script execution
 */
async function runNpmScript(scriptName, options = {}) {
  try {
    // Set default options
    const cwd = options.cwd || process.cwd();
    const dryRun = options.dryRun || false;
    const stream = options.stream !== undefined ? options.stream : true;
    
    // Resolve the package.json path
    const packageJsonPath = path.join(cwd, 'package.json');
    
    // Check if package.json exists
    if (!await fs.pathExists(packageJsonPath)) {
      throw new Error(`package.json not found in ${cwd}`);
    }
    
    // Read package.json
    const packageJson = await fs.readJson(packageJsonPath);
    
    // Check if the script exists
    if (!packageJson.scripts || !packageJson.scripts[scriptName]) {
      throw new Error(`Script "${scriptName}" not found in package.json`);
    }
    
    // Dry run mode
    if (dryRun) {
      return {
        script: scriptName,
        command: `npm run ${scriptName}`,
        cwd,
        dryRun: true,
        message: `[DRY RUN] Would run npm script: ${scriptName} in ${cwd}`
      };
    }
    
    // Run the script
    if (stream) {
      return await runCommandWithOutput('npm', ['run', scriptName], {
        cwd,
        onStdout: options.onStdout,
        onStderr: options.onStderr
      });
    } else {
      return await runShellCommand(`npm run ${scriptName}`, { cwd });
    }
  } catch (error) {
    throw new Error(`Error running npm script ${scriptName}: ${error.message}`);
  }
}

/**
 * Run tests for a project
 * @param {Object} options - Options for running tests
 * @param {string} options.cwd - Current working directory (default: process.cwd())
 * @param {string} options.command - Custom test command (default: uses npm test)
 * @param {boolean} options.dryRun - Whether to simulate the tests without executing them (default: false)
 * @param {boolean} options.stream - Whether to stream output in real-time (default: true)
 * @param {Function} options.onStdout - Callback for stdout data when streaming
 * @param {Function} options.onStderr - Callback for stderr data when streaming
 * @returns {Promise<Object>} - Result of the test execution
 */
async function runTests(options = {}) {
  try {
    // Set default options
    const cwd = options.cwd || process.cwd();
    const dryRun = options.dryRun || false;
    const stream = options.stream !== undefined ? options.stream : true;
    
    // Use custom command or npm test
    if (options.command) {
      if (stream) {
        const [cmd, ...args] = options.command.split(' ');
        return await runCommandWithOutput(cmd, args, {
          cwd,
          dryRun,
          onStdout: options.onStdout,
          onStderr: options.onStderr
        });
      } else {
        return await runShellCommand(options.command, { cwd, dryRun });
      }
    } else {
      // Use npm test
      return await runNpmScript('test', {
        cwd,
        dryRun,
        stream,
        onStdout: options.onStdout,
        onStderr: options.onStderr
      });
    }
  } catch (error) {
    throw new Error(`Error running tests: ${error.message}`);
  }
}

/**
 * Apply a patch to a file
 * @param {string} filePath - Path to the file to patch
 * @param {string} patchContent - Patch content in unified diff format
 * @param {Object} options - Options for applying the patch
 * @param {boolean} options.backup - Whether to create a backup before modifying (default: false)
 * @param {boolean} options.dryRun - Whether to simulate the patch without applying it (default: false)
 * @returns {Promise<Object>} - Result of the patch operation
 */
async function applyPatch(filePath, patchContent, options = {}) {
  try {
    // This function requires the diff package to be installed
    let diff;
    try {
      diff = require('diff');
    } catch (error) {
      throw new Error('diff package is not installed. Install it with: npm install diff');
    }
    
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    
    // Set default options
    const backup = options.backup || false;
    const dryRun = options.dryRun || false;
    
    // Check if file exists
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    // Read the file content
    const content = await fs.readFile(resolvedPath, 'utf8');
    
    // Parse the patch
    const patches = diff.parsePatch(patchContent);
    
    // Apply the patch
    const result = diff.applyPatch(content, patches[0]);
    
    if (result === false) {
      throw new Error('Failed to apply patch: patch does not apply cleanly');
    }
    
    // Dry run mode
    if (dryRun) {
      return {
        filePath: resolvedPath,
        dryRun: true,
        message: `[DRY RUN] Would apply patch to ${resolvedPath}`,
        patchedContent: result
      };
    }
    
    // Create backup if requested
    if (backup) {
      const backupPath = `${resolvedPath}.bak`;
      await fs.writeFile(backupPath, content);
    }
    
    // Write the patched content back to the file
    await fs.writeFile(resolvedPath, result);
    
    return {
      success: true,
      filePath: resolvedPath,
      backupCreated: backup
    };
  } catch (error) {
    throw new Error(`Error applying patch to ${filePath}: ${error.message}`);
  }
}

module.exports = {
  runShellCommand,
  runCommandWithOutput,
  runNpmScript,
  runTests,
  applyPatch
};
