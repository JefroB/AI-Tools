# AI-Tools Demos

This repository contains demonstration scripts that showcase how to use the AI-Tools library in various development workflows.

## Overview

AI-Tools is a comprehensive collection of utilities designed for AI assistants and developers, providing enhanced file operations, code manipulation, execution capabilities, project management tools, and cost-efficiency features.

These demo scripts demonstrate how to use AI-Tools in real-world development scenarios.

## Demo Scripts

### Running All Demos

For convenience, you can run all demos in sequence using the provided scripts:

- **Linux/macOS**: Use the shell script
  ```bash
  # Make the script executable
  chmod +x run-all-demos.sh
  
  # Run the script
  ./run-all-demos.sh
  ```

- **Windows**: Use the batch file
  ```
  run-all-demos.bat
  ```

These scripts will run all demos in sequence and provide status updates along the way.

### 1. Basic Demo (`ai-tools-demo.js`)

This script demonstrates the basic features of AI-Tools, including:

- Project analysis
- Code analysis
- File operations
- Code modification
- Dependency management
- Schema validation
- Token optimization
- Metrics collection

To run the basic demo:

```bash
node ai-tools-demo.js
```

This will create a `test-demo-output` directory with example files demonstrating various AI-Tools capabilities.

### 2. Advanced Demo (`ai-tools-advanced-demo.js`)

This script demonstrates more advanced use cases focused on code analysis and refactoring:

- Project structure analysis
- Code quality assessment
- Code refactoring
- Documentation generation
- Performance metrics
- Report generation

To run the advanced demo:

```bash
node ai-tools-advanced-demo.js
```

This will create an `advanced-demo-output` directory containing:

- Project analysis report
- Sample code with issues
- Code quality report
- Refactored code
- Code diff
- Auto-generated documentation
- Performance metrics
- Final report (JSON and HTML)

### 3. Codebase Analysis (`analyze-codebase.js`)

This script demonstrates how to use AI-Tools for analyzing a codebase and generating a comprehensive report:

- File statistics and metrics
- Code complexity analysis
- Function analysis
- Issue detection and reporting
- HTML report generation

To run the codebase analysis:

```bash
node analyze-codebase.js
```

This will analyze the files in the `./src` directory (configurable in the script) and create an `analysis-output` directory containing:

- Detailed analysis results (JSON)
- Analysis summary (JSON)
- HTML report with visualizations and tables

This script is particularly useful for:
- Code quality assessment
- Technical debt identification
- Refactoring planning
- Codebase health monitoring

### 4. Version Utilities Demo (`examples/version-utils-demo.js`)

This script demonstrates how to use the versioning system utilities:

- Generating version strings based on the current date
- Parsing version strings into their components
- Formatting version strings in different styles
- Comparing version strings
- Working with package.json version
- Migrating from semantic versioning

To run the version utilities demo:

```bash
node examples/version-utils-demo.js
```

This demo doesn't create any output files, but displays the results in the console. It demonstrates how to use the custom versioning system described in the [Versioning documentation](./docs/VERSIONING.md).

### 5. Attribution Utilities Demo (`examples/attribution-utils-demo.js`)

This script demonstrates how to use the attribution utilities for adding proper attribution to generated code:

- Generating attribution comments for different programming languages
- Adding attribution to code snippets
- Writing files with automatic attribution
- Configuring attribution settings
- Handling special cases (HTML with DOCTYPE, scripts with shebang)

To run the attribution utilities demo:

```bash
node examples/attribution-utils-demo.js
```

This will create a `test-attribution-output` directory containing example files with attribution comments in different languages. The demo shows how to properly attribute code generated using the AI-Tools toolkit to Prime8 Engineering and Jeffrey Charles Bornhoeft.

### 6. Console Art Demo (`examples/console-art-demo.js`)

This script demonstrates how to use the console art utilities for displaying ASCII art and licensing information in the console:

- Displaying ASCII art with different color themes
- Adding licensing information to console output
- Using different display modes (success, error, warning)
- Customizing the display with additional messages

To run the console art demo:

```bash
node examples/console-art-demo.js
```

This demo doesn't create any output files, but displays colorful ASCII art and licensing information in the console. It demonstrates how to add a visual branding element to scripts that analyze, repair, or generate code.

## Key Features Demonstrated

### Console Art

- Displaying ASCII art in the console
- Using different color themes for different contexts
- Adding licensing information to console output
- Customizing the display with additional messages

### Attribution

- Generating attribution comments for different languages
- Adding attribution to generated code
- Configuring attribution settings
- Language detection from file extensions
- Special handling for different file types

### Versioning

- Generating version strings with date-based components
- Parsing and comparing version strings
- Formatting version strings for different contexts
- Migrating from semantic versioning

### File Operations

- Reading and writing files
- Creating directories
- Appending to files
- Checking if files exist

### Code Analysis

- Finding functions and classes
- Extracting relevant code based on queries
- Analyzing code quality
- Generating diffs between code versions

### Code Modification

- Adding import statements
- Replacing code blocks
- Refactoring code to improve quality

### Documentation

- Extracting JSDoc comments
- Generating markdown documentation
- Creating HTML reports

### Metrics and Optimization

- Recording performance metrics
- Counting tokens
- Optimizing prompts
- Visualizing metrics

## Integration with Development Workflows

These demos show how AI-Tools can be integrated into various development workflows:

1. **Code Review**: Analyze code quality and identify issues
2. **Refactoring**: Improve code structure and fix code smells
3. **Documentation**: Generate documentation from code comments
4. **Performance Optimization**: Measure and improve code performance
5. **Project Management**: Analyze project structure and dependencies

## Next Steps

After exploring these demos, you can:

1. Integrate AI-Tools into your own projects
2. Extend the demos with additional features
3. Create custom utilities using AI-Tools as a foundation
4. Contribute to the AI-Tools library

## Resources

- [AI-Tools GitHub Repository](https://github.com/JefroB/AI-Tools)
- [AI-Tools Documentation](README.md)
