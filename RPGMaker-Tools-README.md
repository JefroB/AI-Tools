# RPG Maker MV Data Structure Analysis and Fixing Tools

This repository contains tools for analyzing and fixing data structure issues in RPG Maker MV projects, specifically focusing on the MegaEarth2049 project.

## Overview

RPG Maker MV stores game data in JSON files within the `data` directory. These files define various aspects of the game, including characters, items, skills, maps, and events. The MegaEarth2049 project has issues with its JSON files, particularly missing commas between properties and potentially problematic JavaScript code in note fields.

This repository provides:

1. A detailed analysis of the RPG Maker MV data structure
2. Tools for identifying and fixing common issues
3. Guidelines for writing JavaScript code in JSON fields

## Files in this Repository

- **RPGMakerMV-DataStructure.md**: Comprehensive documentation of the RPG Maker MV data structure and guidelines for writing JavaScript code in JSON fields.
- **fix-rpgmaker-json.js**: A simple Node.js script for fixing common issues in RPG Maker MV JSON files.
- **analyze-rpgmaker-data.js**: A more advanced script that uses the AI-Tools library to analyze and fix RPG Maker MV data files, generating detailed reports.

## Common Issues

The primary issues identified in the MegaEarth2049 project are:

1. **Missing Commas Between Properties**: JSON objects are missing commas between properties, which causes parsing errors.

   Example of problematic JSON:
   ```json
   {
     "id":1"name":"Attack""mpCost":0
   }
   ```

   Corrected JSON:
   ```json
   {
     "id":1,"name":"Attack","mpCost":0
   }
   ```

2. **JavaScript Code in Note Fields**: RPG Maker MV allows for custom JavaScript code in note fields, but this code may contain syntax that causes TypeScript errors.

## Using the Tools

### Basic JSON Fixer

The `fix-rpgmaker-json.js` script is a simple tool for fixing missing commas in JSON files.

```bash
# Install dependencies
npm install

# Run the script
node fix-rpgmaker-json.js [path-to-data-directory]
```

If no path is provided, the script will default to `D:\MegaEarth2049-master\data`.

### Advanced Analyzer and Fixer

The `analyze-rpgmaker-data.js` script provides more comprehensive analysis and fixing capabilities using the AI-Tools library.

```bash
# Install dependencies
npm install

# Run the script
node analyze-rpgmaker-data.js [path-to-data-directory]
```

This script will:

1. Analyze all JSON files in the specified directory
2. Generate a detailed report of issues found
3. Fix issues automatically if enabled
4. Create backups of original files

The report will be saved to the `rpgmaker-analysis` directory and includes:

- `analysis-results.json`: Detailed analysis results for each file
- `analysis-summary.json`: Summary of issues found
- `analysis-report.html`: HTML report with visualizations and tables

## Guidelines for Writing JavaScript in JSON Fields

When writing JavaScript code in RPG Maker MV note fields, follow these guidelines to avoid TypeScript errors:

1. **Proper String Escaping**: 
   - Use backslashes to escape quotes within strings: `\"` instead of `"`
   - Escape newlines with `\n`

2. **Avoid Template Literals in Older Plugins**:
   - Some older plugins may not support ES6 template literals (`${variable}`)
   - Use string concatenation instead: `variable + " text"`

3. **Function Declarations**:
   - Use function expressions instead of declarations when possible
   - Example: `function(a, b) { return a + b; }` instead of `function name(a, b) { return a + b; }`

4. **Variable Declarations**:
   - Use `var` instead of `let` or `const` for older plugins
   - Declare variables before using them

5. **Avoid Arrow Functions in Older Plugins**:
   - Use traditional function expressions: `function(x) { return x * 2; }`
   - Instead of arrow functions: `(x) => x * 2`

6. **Proper Semicolon Usage**:
   - Always terminate statements with semicolons
   - This helps prevent ambiguous code that might be interpreted differently

7. **Conditional Statements**:
   - Always use braces for conditional blocks, even for single-line statements
   - Example: `if (condition) { doSomething(); }`

8. **Avoid TypeScript-Specific Syntax**:
   - Do not use type annotations
   - Do not use interfaces or other TypeScript-specific features

## YanFly Plugin-Specific Patterns

The MegaEarth2049 project uses YanFly's plugins, which have specific patterns for extending functionality:

### Action Sequences

```
<setup action>
display action
immortal: targets true
</setup action>

<target action>
move user: targets front 20
wait for movement
motion attack: user
wait: 10
attack animation: target
wait for animation
action effect
</target action>
```

### Custom Show Eval

```
<Custom Show Eval>
var equips = user._equips;
var gunOne;
var gunTwo;

user._equips.forEach(function(element) {
  if(element._dataClass == 'weapon') {
    var i = element._itemId;
    var itemName = $dataWeapons[i].baseItemName;
    if((itemName == 'Pea Shooter') || (itemName == 'Pee Shooter')) {
     gunOne = true;
    }
    if(itemName == 'Pee Shooter'){
     gunTwo = true;
    }
  }
});

if((gunOne === true) && (gunTwo === true)){
  visible = true;
} else {
  visible = false;
}
</Custom Show Eval>
```

### Party Limit Gauge and JP Gain

```
<Ally Party Limit Gauge: +1>
<JP Gain: 15 + Math.randomInt(10)>
```

## Conclusion

By using these tools and following the guidelines, you can fix the TypeScript errors in the MegaEarth2049 RPG Maker MV project and maintain a consistent and error-free data structure.
