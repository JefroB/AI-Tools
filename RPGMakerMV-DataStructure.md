# RPG Maker MV Data Structure Analysis

## Overview

This document analyzes the data structure of the MegaEarth2049 RPG Maker MV project and provides guidelines for writing JavaScript code snippets in JSON fields to avoid TypeScript errors.

## Common JSON Structure Issues

The primary issue identified in the data files is the absence of commas between properties in JSON objects. This is a syntax error that would cause problems when parsing the JSON.

### Example of Problematic JSON:

```json
{
  "id":1"name":"Attack""mpCost":0
}
```

### Corrected JSON:

```json
{
  "id":1,"name":"Attack","mpCost":0
}
```

## Data Files Structure

RPG Maker MV organizes game data in JSON files within the `data` directory. Each file serves a specific purpose:

### System Files
- **System.json**: Contains game system settings, including text, sounds, initial party, etc.
- **MapInfos.json**: Contains metadata about all maps in the game.

### Game Data Files
- **Actors.json**: Character data for playable characters.
- **Classes.json**: Character class definitions.
- **Skills.json**: Skill definitions including battle actions.
- **Items.json**: Item definitions.
- **Weapons.json**: Weapon definitions.
- **Armors.json**: Armor definitions.
- **Enemies.json**: Enemy character data.
- **Troops.json**: Enemy group configurations for battles.
- **States.json**: Status effect definitions.
- **Animations.json**: Battle animation definitions.
- **Tilesets.json**: Tileset definitions for maps.
- **CommonEvents.json**: Common event definitions.

### Map Files
- **Map001.json** through **Map102.json**: Individual map data.

## JavaScript in JSON Fields

RPG Maker MV allows for custom JavaScript code in certain fields, particularly in the "note" field of various data objects. This is where YanFly's plugins and other custom plugins extend the functionality.

### Common Locations for JavaScript Code

1. **Skill Notes**: In Skills.json, the "note" field often contains JavaScript for custom battle actions.
2. **Event Commands**: In Map files and CommonEvents.json, event commands may contain JavaScript code.
3. **Plugin Parameters**: Custom plugin parameters may include JavaScript code.

### Guidelines for Writing JavaScript in JSON Fields

To avoid TypeScript errors when writing JavaScript code in JSON fields:

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

Based on the code snippets observed in the data files, YanFly's plugins use specific patterns for extending functionality:

### Action Sequences

Action sequences are defined in the "note" field of skills using XML-like tags:

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

Custom evaluation code for conditional display of skills:

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

Custom tags for game mechanics:

```
<Ally Party Limit Gauge: +1>
<JP Gain: 15 + Math.randomInt(10)>
```

## Recommendations for Fixing TypeScript Errors

1. **Standardize JSON Format**:
   - Ensure all properties in JSON objects are separated by commas
   - Use a JSON validator/formatter to check and fix syntax

2. **Consistent Code Style in Note Fields**:
   - Establish a consistent style for JavaScript code in note fields
   - Document the style guidelines for the team

3. **Create Type Definitions**:
   - If using TypeScript with RPG Maker MV, create type definitions for the data structures
   - This will help catch errors during development

4. **Validate JavaScript in Note Fields**:
   - Create a validation tool that extracts and validates JavaScript from note fields
   - This can be run as part of a build process

5. **Use JSON Schema**:
   - Define a JSON schema for each data file type
   - Validate data files against the schema during development

## Conclusion

The MegaEarth2049 RPG Maker MV project uses custom JavaScript code in JSON fields to extend the game's functionality. The primary issue causing TypeScript errors is likely the missing commas between properties in JSON objects, combined with potentially problematic JavaScript syntax in note fields.

By following the guidelines outlined in this document, you can maintain a consistent and error-free data structure that works well with both RPG Maker MV and TypeScript.
