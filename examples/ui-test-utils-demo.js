/**
 * UI Testing Utilities Demo
 * 
 * This example demonstrates how to use the UI testing utilities to test color contrast
 * for accessibility and validate that colors are sufficiently distinct from each other.
 */

const aiTools = require('../src/index');

/**
 * Example 1: Testing Color Contrast
 * 
 * This example demonstrates how to test color contrast for accessibility.
 */
function colorContrastExample() {
  console.log('\n=== Color Contrast Testing Example ===');
  
  // Define some colors to test
  const colors = {
    // Good contrast examples
    good1: { fg: '#000000', bg: '#FFFFFF' }, // Black on white
    good2: { fg: '#FFFFFF', bg: '#0000AA' }, // White on dark blue
    good3: { fg: '#FFFF00', bg: '#000000' }, // Yellow on black
    
    // Poor contrast examples
    poor1: { fg: '#777777', bg: '#FFFFFF' }, // Light gray on white
    poor2: { fg: '#0000FF', bg: '#000080' }, // Blue on dark blue
    poor3: { fg: '#FF0000', bg: '#800000' }, // Red on dark red
  };
  
  // Test each color combination
  for (const [name, { fg, bg }] of Object.entries(colors)) {
    console.log(`\nTesting color combination: ${name}`);
    console.log(`Foreground: ${fg}, Background: ${bg}`);
    
    // Test for normal text (WCAG AA)
    const result = aiTools.testColorContrast(fg, bg, {
      wcagLevel: 'AA',
      largeText: false,
      includeRecommendations: true
    });
    
    // Display the results
    console.log(`Contrast ratio: ${result.contrastRatio.toFixed(2)}`);
    console.log(`Required ratio: ${result.requiredRatio.toFixed(2)}`);
    console.log(`WCAG ${result.wcagLevel} compliant: ${result.valid ? 'Yes' : 'No'}`);
    
    // If the contrast is insufficient, show recommendations
    if (!result.valid && result.recommendation) {
      console.log('\nRecommendation to improve contrast:');
      console.log(`Adjust ${result.recommendation.type} color to: ${result.recommendation.color.hex}`);
      console.log(`New contrast ratio would be: ${result.recommendation.contrastRatio.toFixed(2)}`);
    }
  }
  
  // Test with different WCAG levels and text sizes
  console.log('\n\nTesting different WCAG levels and text sizes:');
  
  const testCases = [
    { level: 'A', large: false, name: 'WCAG A, Normal text' },
    { level: 'A', large: true, name: 'WCAG A, Large text' },
    { level: 'AA', large: false, name: 'WCAG AA, Normal text' },
    { level: 'AA', large: true, name: 'WCAG AA, Large text' },
    { level: 'AAA', large: false, name: 'WCAG AAA, Normal text' },
    { level: 'AAA', large: true, name: 'WCAG AAA, Large text' }
  ];
  
  // Test a borderline color combination with different requirements
  const borderlineFg = '#767676';
  const borderlineBg = '#FFFFFF';
  
  for (const testCase of testCases) {
    const result = aiTools.testColorContrast(borderlineFg, borderlineBg, {
      wcagLevel: testCase.level,
      largeText: testCase.large
    });
    
    console.log(`\n${testCase.name}:`);
    console.log(`Contrast ratio: ${result.contrastRatio.toFixed(2)}`);
    console.log(`Required ratio: ${result.requiredRatio.toFixed(2)}`);
    console.log(`Compliant: ${result.valid ? 'Yes' : 'No'}`);
  }
}

/**
 * Example 2: Testing Color Distinction
 * 
 * This example demonstrates how to test if a set of colors are sufficiently distinct
 * from each other, which is important for data visualizations and UI elements.
 */
function colorDistinctionExample() {
  console.log('\n=== Color Distinction Testing Example ===');
  
  // Example 1: Testing a good color palette
  console.log('\nTesting a good color palette:');
  const goodPalette = [
    '#1f77b4', // Blue
    '#ff7f0e', // Orange
    '#2ca02c', // Green
    '#d62728', // Red
    '#9467bd', // Purple
    '#8c564b', // Brown
    '#e377c2', // Pink
    '#7f7f7f', // Gray
    '#bcbd22', // Olive
    '#17becf'  // Cyan
  ];
  
  const goodResult = aiTools.validateColorDistinction(goodPalette, {
    minimumDistance: 25,
    algorithm: 'CIEDE2000'
  });
  
  console.log(`Valid: ${goodResult.valid}`);
  console.log(`Number of color pairs tested: ${goodResult.colorPairs.length}`);
  console.log(`Number of insufficient pairs: ${goodResult.insufficientPairs.length}`);
  
  // Example 2: Testing a poor color palette with similar colors
  console.log('\nTesting a poor color palette with similar colors:');
  const poorPalette = [
    '#1f77b4', // Blue
    '#1f78b5', // Very similar blue
    '#1f79b6', // Very similar blue
    '#ff7f0e', // Orange
    '#ff8010', // Very similar orange
    '#2ca02c', // Green
    '#d62728'  // Red
  ];
  
  const poorResult = aiTools.validateColorDistinction(poorPalette, {
    minimumDistance: 25,
    algorithm: 'CIEDE2000',
    includeRecommendations: true,
    groupSimilarColors: true
  });
  
  console.log(`Valid: ${poorResult.valid}`);
  console.log(`Number of color pairs tested: ${poorResult.colorPairs.length}`);
  console.log(`Number of insufficient pairs: ${poorResult.insufficientPairs.length}`);
  
  // Show similar color groups
  if (poorResult.similarGroups && poorResult.similarGroups.length > 0) {
    console.log('\nSimilar color groups:');
    poorResult.similarGroups.forEach((group, index) => {
      console.log(`Group ${index + 1}: ${group.join(', ')}`);
    });
  }
  
  // Show recommendations
  if (poorResult.recommendations && poorResult.recommendations.length > 0) {
    console.log('\nRecommendations to improve distinction:');
    poorResult.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. Replace ${rec.originalColor} with ${rec.suggestedColor}`);
    });
  }
  
  // Example 3: Testing with different algorithms
  console.log('\nComparing different color distance algorithms:');
  
  const algorithms = ['CIEDE2000', 'CIE76', 'CIE94'];
  const testColors = ['#ff0000', '#ff0080', '#ff00ff'];
  
  for (const algorithm of algorithms) {
    const result = aiTools.validateColorDistinction(testColors, {
      minimumDistance: 25,
      algorithm
    });
    
    console.log(`\nAlgorithm: ${algorithm}`);
    console.log(`Valid: ${result.valid}`);
    
    // Show color pair distances
    console.log('Color pair distances:');
    result.colorPairs.forEach(pair => {
      console.log(`${pair.color1} vs ${pair.color2}: ${pair.distance.toFixed(2)} (${pair.sufficient ? 'Sufficient' : 'Insufficient'})`);
    });
  }
}

/**
 * Example 3: Working with Different Color Formats
 * 
 * This example demonstrates how to work with different color formats.
 */
function colorFormatExample() {
  console.log('\n=== Color Format Example ===');
  
  // Test different color formats
  const colorFormats = [
    { name: 'Hex', value: '#1a2b3c' },
    { name: 'RGB', value: 'rgb(26, 43, 60)' },
    { name: 'RGBA', value: 'rgba(26, 43, 60, 0.8)' },
    { name: 'HSL', value: 'hsl(210, 40%, 17%)' },
    { name: 'HSLA', value: 'hsla(210, 40%, 17%, 0.8)' },
    { name: 'Named', value: 'steelblue' }
  ];
  
  console.log('Parsing different color formats:');
  for (const { name, value } of colorFormats) {
    const parsed = aiTools.parseColor(value);
    
    if (parsed) {
      console.log(`\n${name} color: ${value}`);
      console.log(`Parsed RGB: r=${parsed.r}, g=${parsed.g}, b=${parsed.b}`);
      
      // Convert to other formats
      const hsl = aiTools.rgbToHsl(parsed.r, parsed.g, parsed.b);
      console.log(`Converted to HSL: h=${hsl.h}°, s=${hsl.s}%, l=${hsl.l}%`);
      
      // Convert back to hex
      const hex = aiTools.rgbToHex(parsed);
      console.log(`Converted to Hex: ${hex}`);
    } else {
      console.log(`\n${name} color: ${value}`);
      console.log('Failed to parse color');
    }
  }
}

/**
 * Example 4: Adjusting Colors for Contrast
 * 
 * This example demonstrates how to automatically adjust colors to meet contrast requirements.
 */
function adjustColorExample() {
  console.log('\n=== Adjusting Colors for Contrast Example ===');
  
  // Define some color pairs with poor contrast
  const colorPairs = [
    { fg: '#777777', bg: '#FFFFFF', name: 'Gray on White' },
    { fg: '#0000FF', bg: '#000080', name: 'Blue on Dark Blue' },
    { fg: '#FF0000', bg: '#800000', name: 'Red on Dark Red' }
  ];
  
  for (const { fg, bg, name } of colorPairs) {
    console.log(`\nAdjusting colors for: ${name}`);
    console.log(`Original - Foreground: ${fg}, Background: ${bg}`);
    
    // Parse colors
    const fgColor = aiTools.parseColor(fg);
    const bgColor = aiTools.parseColor(bg);
    
    if (!fgColor || !bgColor) {
      console.log('Failed to parse colors');
      continue;
    }
    
    // Calculate original contrast
    const originalContrast = aiTools.calculateContrastRatio(fgColor, bgColor);
    console.log(`Original contrast ratio: ${originalContrast.toFixed(2)}`);
    
    // Target WCAG AA (4.5:1)
    const targetRatio = 4.5;
    console.log(`Target contrast ratio: ${targetRatio}`);
    
    // Adjust foreground color
    const adjustedFg = aiTools.adjustColorForContrast(fgColor, bgColor, targetRatio);
    const fgContrast = aiTools.calculateContrastRatio(adjustedFg, bgColor);
    
    // Adjust background color
    const adjustedBg = aiTools.adjustColorForContrast(bgColor, fgColor, targetRatio);
    const bgContrast = aiTools.calculateContrastRatio(fgColor, adjustedBg);
    
    // Convert to hex for display
    const adjustedFgHex = aiTools.rgbToHex(adjustedFg);
    const adjustedBgHex = aiTools.rgbToHex(adjustedBg);
    
    console.log('\nAdjusted colors:');
    console.log(`Option 1: Adjust foreground to ${adjustedFgHex} (Contrast: ${fgContrast.toFixed(2)})`);
    console.log(`Option 2: Adjust background to ${adjustedBgHex} (Contrast: ${bgContrast.toFixed(2)})`);
    
    // Determine which adjustment is better (less perceptual change)
    const fgDistance = aiTools.calculateColorDistance(fgColor, adjustedFg);
    const bgDistance = aiTools.calculateColorDistance(bgColor, adjustedBg);
    
    console.log('\nRecommended adjustment:');
    if (fgDistance <= bgDistance) {
      console.log(`Adjust foreground to ${adjustedFgHex} (smaller color change: ${fgDistance.toFixed(2)})`);
    } else {
      console.log(`Adjust background to ${adjustedBgHex} (smaller color change: ${bgDistance.toFixed(2)})`);
    }
  }
}

/**
 * Run all examples
 */
function runAllExamples() {
  try {
    colorContrastExample();
    colorDistinctionExample();
    colorFormatExample();
    adjustColorExample();
    
    console.log('\nAll examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the examples
runAllExamples();
