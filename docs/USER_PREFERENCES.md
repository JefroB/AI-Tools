# User Preferences in AI-Tools

This document describes how to use the user preferences system in the AI-Tools library.

## Overview

The user preferences system allows AI tools to remember user-specific settings between sessions. This is particularly useful for:

- Personalizing the user experience by remembering the user's name
- Storing user-specific configuration options
- Maintaining consistent settings across multiple runs

All preferences are stored locally in a JSON file and are not shared with any external services.

## How It Works

The user preferences system stores data in a `.user-prefs/preferences.json` file in the project root directory. This file is automatically added to `.gitignore` to ensure that personal preferences are not committed to version control.

## Available Functions

### Basic Usage

```javascript
const { getUserName, setUserName } = require('ai-tools');

// Get the user's name (returns "User" if not set)
const userName = getUserName();

// Set the user's name
setUserName("Jeffrey Charles Bornhoeft");

// Use the name in your application
console.log(`Hello, ${userName}!`);
```

### Advanced Usage

```javascript
const { 
  getUserPreference, 
  setUserPreference, 
  resetUserPreferences 
} = require('ai-tools');

// Set a preference
setUserPreference('theme', 'dark');

// Get a preference (with a default value if not set)
const theme = getUserPreference('theme', 'light');

// Reset all preferences to defaults
resetUserPreferences();
```

## Preference Structure

The preferences are stored in a JSON file with the following structure:

```json
{
  "userName": "Jeffrey Charles Bornhoeft",
  "theme": "dark",
  "lastUsed": "2025-04-01T19:11:20.093Z",
  "preferences": {
    "favoriteColor": "blue",
    "otherSetting": "value"
  }
}
```

- `userName`: The user's preferred name
- `theme`: A top-level preference for the UI theme
- `lastUsed`: Timestamp of the last time the preferences were accessed
- `preferences`: An object containing all other user preferences

## API Reference

### getUserName()

Returns the user's preferred name. If not set, returns "User".

### setUserName(name)

Sets the user's preferred name.

- `name` (string): The name to set
- Returns: `true` if successful, `false` otherwise

### getUserPreference(key, defaultValue)

Gets a specific user preference.

- `key` (string): The preference key to retrieve
- `defaultValue` (any): The default value to return if the preference doesn't exist
- Returns: The preference value or the default value

### setUserPreference(key, value)

Sets a specific user preference.

- `key` (string): The preference key to set
- `value` (any): The preference value to store
- Returns: `true` if successful, `false` otherwise

### resetUserPreferences()

Resets all user preferences to their default values.

- Returns: `true` if successful, `false` otherwise

### promptForUserName(defaultName)

Prompts the user for their preferred name if not already set.

- `defaultName` (string, optional): Default name to use if the user doesn't provide one
- Returns: The user's preferred name

## Example

See `examples/user-prefs-demo.js` for a complete example of how to use the user preferences system.

## Best Practices

1. **Always provide default values** when getting preferences to handle cases where the preference hasn't been set yet.

2. **Use descriptive preference keys** to make the code more maintainable.

3. **Consider user privacy** when deciding what to store in preferences. Don't store sensitive information.

4. **Handle errors gracefully** when preferences can't be loaded or saved.

5. **Use the preferences system sparingly** for settings that truly need to persist between sessions.
