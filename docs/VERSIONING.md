# AI-Tools Versioning System

> **IMPORTANT: MANDATORY USAGE**  
> This versioning system is mandatory for all AI-Tools releases. No other versioning format is permitted. All contributors must follow this system for any version changes.

This document outlines the versioning system used for the AI-Tools project. The system is designed to provide detailed version information while ensuring version numbers always increase over time.

## Version Structure

```
YY.DDD.LETTER.FEATURE
```

Where:

1. **YY**: Last two digits of the year (25, 26, etc.)
   - Automatically increases with calendar year
   - Provides immediate context for when the version was released

2. **DDD**: Day of the year (001-366)
   - Automatically increases with each day
   - Allows for multiple releases per day while maintaining order

3. **LETTER**: Alphabetic major version (A-Z, then AA-ZZ if needed)
   - Starts at A and progresses through the alphabet
   - More memorable than numeric versions
   - Provides 26 single-letter versions, then expands to two letters
   - Example progression: A, B, C, ..., Z, AA, AB, ..., AZ, BA, etc.

4. **FEATURE**: Feature/build identifier (1000-9999)
   - Four-digit number that increases with each build
   - First digit can represent category:
     - 1xxx: Core functionality
     - 2xxx: API features
     - 3xxx: Performance improvements
     - 4xxx: Security updates
     - 5xxx: Documentation
     - 6xxx: Experimental features
     - 7xxx: Bug fixes
     - 8xxx: UI/UX improvements
     - 9xxx: Special releases

## Examples

- `25.092.C.2345`: Released in 2025, on April 2nd (92nd day), major version C, API feature build 2345
- `25.092.C.7120`: Released in 2025, on April 2nd (92nd day), major version C, bug fix build 7120
- `25.100.D.1500`: Released in 2025, on April 10th (100th day), major version D, core functionality build 1500
- `26.001.D.3001`: Released in 2026, on January 1st (1st day), major version D, performance improvement build 3001
- `27.150.AA.4500`: Released in 2027, on May 30th (150th day), major version AA, security update build 4500

## Version Progression Rules

### Major Version (LETTER)

The alphabetic major version provides a more memorable way to refer to releases:

- Version A: Initial release
- Version B: First major update
- Version C: Second major update
- ...and so on

When you reach Z, you can move to two-letter versions:

- Version Z: 26th major version
- Version AA: 27th major version
- Version AB: 28th major version
- ...and so on

This gives you 26 + 26² = 702 possible major versions before needing to expand to three letters.

### Feature Version (FEATURE)

For patch releases on the same day, you can increment the FEATURE number:

- `25.092.C.2345`: Initial release
- `25.092.C.2346`: First patch
- `25.092.C.2347`: Second patch

The first digit of the FEATURE number indicates the category of changes:

- 1xxx: Core functionality changes
- 2xxx: API feature changes
- 3xxx: Performance improvements
- 4xxx: Security updates
- 5xxx: Documentation updates
- 6xxx: Experimental features
- 7xxx: Bug fixes
- 8xxx: UI/UX improvements
- 9xxx: Special releases

## Implementation

### In package.json

```json
{
  "name": "ai-tools",
  "version": "25.092.C.2345",
  "versionDetails": {
    "year": 2025,
    "dayOfYear": 92,
    "date": "2025-04-02",
    "major": "C",
    "feature": {
      "category": "API features",
      "build": 345
    }
  }
}
```

### Version Generation Utility

```javascript
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

// Example usage:
// generateVersion('C', 2, 345) => "25.092.C.2345"
```

## Benefits of This System

1. **Automatic Temporal Ordering**: Versions naturally increase over time due to the date components
2. **Large Number Groups**: Uses larger numbers (YY.DDD.X.XXXX)
3. **Memorable Major Versions**: Alphabetic major versions are easier to remember
4. **Meaningful Components**: Each part of the version conveys specific information
5. **Flexibility**: Allows for multiple releases per day while maintaining order
6. **Simplicity**: Fewer decimals but still provides detailed versioning information

## Version Display Options

Depending on the context, you might want to display the version in different formats:

- **Full**: `25.092.C.2345`
- **Short**: `C.2345`
- **User-Friendly**: `Version C (Build 2345)`
- **Date-Focused**: `2025-04-02 Version C`

## Migration from Semantic Versioning

If you're migrating from semantic versioning (MAJOR.MINOR.PATCH), you can map your existing versions to the new system:

1. Choose an appropriate letter for your current major version
2. Use the current date for the YY.DDD components
3. Select an appropriate feature category and build number

For example, if your current version is 3.2.1, you might migrate to `25.092.C.2345`.
