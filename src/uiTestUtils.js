/**
 * UI Testing Utilities Module for AI Tools
 * Provides tools for testing UI components, colors, and accessibility
 */

/**
 * Default options for color contrast testing
 */
const DEFAULT_CONTRAST_OPTIONS = {
  wcagLevel: 'AA',            // WCAG level to test against ('A', 'AA', or 'AAA')
  largeText: false,           // Whether the text is large (>=18pt or >=14pt bold)
  includeRecommendations: true, // Whether to include color adjustment recommendations
};

/**
 * Default options for color distinction testing
 */
const DEFAULT_DISTINCTION_OPTIONS = {
  minimumDistance: 25,        // Minimum perceptual distance between colors
  algorithm: 'CIEDE2000',     // Color distance algorithm ('CIEDE2000', 'CIE76', or 'CIE94')
  includeRecommendations: true, // Whether to include color adjustment recommendations
  groupSimilarColors: true,   // Whether to group similar colors
  similarityThreshold: 10,    // Threshold for considering colors similar
};

/**
 * Parses a color string into RGB components
 * @param {string} color - Color string (hex, rgb, rgba, hsl, hsla, or named color)
 * @returns {Object|null} - RGB components or null if invalid
 */
function parseColor(color) {
  if (!color || typeof color !== 'string') {
    return null;
  }
  
  // Normalize color string
  color = color.trim().toLowerCase();
  
  // Handle hex colors
  if (color.startsWith('#')) {
    // Convert shorthand hex to full hex
    if (color.length === 4) {
      color = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
    }
    
    // Parse hex color
    if (color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        return { r, g, b };
      }
    }
  }
  
  // Handle rgb/rgba colors
  if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        return { r, g, b };
      }
    }
  }
  
  // Handle hsl/hsla colors
  if (color.startsWith('hsl')) {
    const match = color.match(/hsla?\((\d+),\s*([\d.]+)%,\s*([\d.]+)%(?:,\s*([\d.]+))?\)/);
    
    if (match) {
      const h = parseInt(match[1], 10) / 360;
      const s = parseInt(match[2], 10) / 100;
      const l = parseInt(match[3], 10) / 100;
      
      // Convert HSL to RGB
      const rgb = hslToRgb(h, s, l);
      
      if (rgb) {
        return rgb;
      }
    }
  }
  
  // Handle named colors
  const namedColors = {
    black: { r: 0, g: 0, b: 0 },
    silver: { r: 192, g: 192, b: 192 },
    gray: { r: 128, g: 128, b: 128 },
    white: { r: 255, g: 255, b: 255 },
    maroon: { r: 128, g: 0, b: 0 },
    red: { r: 255, g: 0, b: 0 },
    purple: { r: 128, g: 0, b: 128 },
    fuchsia: { r: 255, g: 0, b: 255 },
    green: { r: 0, g: 128, b: 0 },
    lime: { r: 0, g: 255, b: 0 },
    olive: { r: 128, g: 128, b: 0 },
    yellow: { r: 255, g: 255, b: 0 },
    navy: { r: 0, g: 0, b: 128 },
    blue: { r: 0, g: 0, b: 255 },
    teal: { r: 0, g: 128, b: 128 },
    aqua: { r: 0, g: 255, b: 255 },
    orange: { r: 255, g: 165, b: 0 },
    aliceblue: { r: 240, g: 248, b: 255 },
    antiquewhite: { r: 250, g: 235, b: 215 },
    aquamarine: { r: 127, g: 255, b: 212 },
    azure: { r: 240, g: 255, b: 255 },
    beige: { r: 245, g: 245, b: 220 },
    bisque: { r: 255, g: 228, b: 196 },
    blanchedalmond: { r: 255, g: 235, b: 205 },
    blueviolet: { r: 138, g: 43, b: 226 },
    brown: { r: 165, g: 42, b: 42 },
    burlywood: { r: 222, g: 184, b: 135 },
    cadetblue: { r: 95, g: 158, b: 160 },
    chartreuse: { r: 127, g: 255, b: 0 },
    chocolate: { r: 210, g: 105, b: 30 },
    coral: { r: 255, g: 127, b: 80 },
    cornflowerblue: { r: 100, g: 149, b: 237 },
    cornsilk: { r: 255, g: 248, b: 220 },
    crimson: { r: 220, g: 20, b: 60 },
    cyan: { r: 0, g: 255, b: 255 },
    darkblue: { r: 0, g: 0, b: 139 },
    darkcyan: { r: 0, g: 139, b: 139 },
    darkgoldenrod: { r: 184, g: 134, b: 11 },
    darkgray: { r: 169, g: 169, b: 169 },
    darkgreen: { r: 0, g: 100, b: 0 },
    darkgrey: { r: 169, g: 169, b: 169 },
    darkkhaki: { r: 189, g: 183, b: 107 },
    darkmagenta: { r: 139, g: 0, b: 139 },
    darkolivegreen: { r: 85, g: 107, b: 47 },
    darkorange: { r: 255, g: 140, b: 0 },
    darkorchid: { r: 153, g: 50, b: 204 },
    darkred: { r: 139, g: 0, b: 0 },
    darksalmon: { r: 233, g: 150, b: 122 },
    darkseagreen: { r: 143, g: 188, b: 143 },
    darkslateblue: { r: 72, g: 61, b: 139 },
    darkslategray: { r: 47, g: 79, b: 79 },
    darkslategrey: { r: 47, g: 79, b: 79 },
    darkturquoise: { r: 0, g: 206, b: 209 },
    darkviolet: { r: 148, g: 0, b: 211 },
    deeppink: { r: 255, g: 20, b: 147 },
    deepskyblue: { r: 0, g: 191, b: 255 },
    dimgray: { r: 105, g: 105, b: 105 },
    dimgrey: { r: 105, g: 105, b: 105 },
    dodgerblue: { r: 30, g: 144, b: 255 },
    firebrick: { r: 178, g: 34, b: 34 },
    floralwhite: { r: 255, g: 250, b: 240 },
    forestgreen: { r: 34, g: 139, b: 34 },
    gainsboro: { r: 220, g: 220, b: 220 },
    ghostwhite: { r: 248, g: 248, b: 255 },
    gold: { r: 255, g: 215, b: 0 },
    goldenrod: { r: 218, g: 165, b: 32 },
    greenyellow: { r: 173, g: 255, b: 47 },
    grey: { r: 128, g: 128, b: 128 },
    honeydew: { r: 240, g: 255, b: 240 },
    hotpink: { r: 255, g: 105, b: 180 },
    indianred: { r: 205, g: 92, b: 92 },
    indigo: { r: 75, g: 0, b: 130 },
    ivory: { r: 255, g: 255, b: 240 },
    khaki: { r: 240, g: 230, b: 140 },
    lavender: { r: 230, g: 230, b: 250 },
    lavenderblush: { r: 255, g: 240, b: 245 },
    lawngreen: { r: 124, g: 252, b: 0 },
    lemonchiffon: { r: 255, g: 250, b: 205 },
    lightblue: { r: 173, g: 216, b: 230 },
    lightcoral: { r: 240, g: 128, b: 128 },
    lightcyan: { r: 224, g: 255, b: 255 },
    lightgoldenrodyellow: { r: 250, g: 250, b: 210 },
    lightgray: { r: 211, g: 211, b: 211 },
    lightgreen: { r: 144, g: 238, b: 144 },
    lightgrey: { r: 211, g: 211, b: 211 },
    lightpink: { r: 255, g: 182, b: 193 },
    lightsalmon: { r: 255, g: 160, b: 122 },
    lightseagreen: { r: 32, g: 178, b: 170 },
    lightskyblue: { r: 135, g: 206, b: 250 },
    lightslategray: { r: 119, g: 136, b: 153 },
    lightslategrey: { r: 119, g: 136, b: 153 },
    lightsteelblue: { r: 176, g: 196, b: 222 },
    lightyellow: { r: 255, g: 255, b: 224 },
    limegreen: { r: 50, g: 205, b: 50 },
    linen: { r: 250, g: 240, b: 230 },
    magenta: { r: 255, g: 0, b: 255 },
    mediumaquamarine: { r: 102, g: 205, b: 170 },
    mediumblue: { r: 0, g: 0, b: 205 },
    mediumorchid: { r: 186, g: 85, b: 211 },
    mediumpurple: { r: 147, g: 112, b: 219 },
    mediumseagreen: { r: 60, g: 179, b: 113 },
    mediumslateblue: { r: 123, g: 104, b: 238 },
    mediumspringgreen: { r: 0, g: 250, b: 154 },
    mediumturquoise: { r: 72, g: 209, b: 204 },
    mediumvioletred: { r: 199, g: 21, b: 133 },
    midnightblue: { r: 25, g: 25, b: 112 },
    mintcream: { r: 245, g: 255, b: 250 },
    mistyrose: { r: 255, g: 228, b: 225 },
    moccasin: { r: 255, g: 228, b: 181 },
    navajowhite: { r: 255, g: 222, b: 173 },
    oldlace: { r: 253, g: 245, b: 230 },
    olivedrab: { r: 107, g: 142, b: 35 },
    orangered: { r: 255, g: 69, b: 0 },
    orchid: { r: 218, g: 112, b: 214 },
    palegoldenrod: { r: 238, g: 232, b: 170 },
    palegreen: { r: 152, g: 251, b: 152 },
    paleturquoise: { r: 175, g: 238, b: 238 },
    palevioletred: { r: 219, g: 112, b: 147 },
    papayawhip: { r: 255, g: 239, b: 213 },
    peachpuff: { r: 255, g: 218, b: 185 },
    peru: { r: 205, g: 133, b: 63 },
    pink: { r: 255, g: 192, b: 203 },
    plum: { r: 221, g: 160, b: 221 },
    powderblue: { r: 176, g: 224, b: 230 },
    rosybrown: { r: 188, g: 143, b: 143 },
    royalblue: { r: 65, g: 105, b: 225 },
    saddlebrown: { r: 139, g: 69, b: 19 },
    salmon: { r: 250, g: 128, b: 114 },
    sandybrown: { r: 244, g: 164, b: 96 },
    seagreen: { r: 46, g: 139, b: 87 },
    seashell: { r: 255, g: 245, b: 238 },
    sienna: { r: 160, g: 82, b: 45 },
    skyblue: { r: 135, g: 206, b: 235 },
    slateblue: { r: 106, g: 90, b: 205 },
    slategray: { r: 112, g: 128, b: 144 },
    slategrey: { r: 112, g: 128, b: 144 },
    snow: { r: 255, g: 250, b: 250 },
    springgreen: { r: 0, g: 255, b: 127 },
    steelblue: { r: 70, g: 130, b: 180 },
    tan: { r: 210, g: 180, b: 140 },
    thistle: { r: 216, g: 191, b: 216 },
    tomato: { r: 255, g: 99, b: 71 },
    turquoise: { r: 64, g: 224, b: 208 },
    violet: { r: 238, g: 130, b: 238 },
    wheat: { r: 245, g: 222, b: 179 },
    whitesmoke: { r: 245, g: 245, b: 245 },
    yellowgreen: { r: 154, g: 205, b: 50 }
  };
  
  if (namedColors[color]) {
    return namedColors[color];
  }
  
  return null;
}

/**
 * Converts HSL color to RGB
 * @param {number} h - Hue (0-1)
 * @param {number} s - Saturation (0-1)
 * @param {number} l - Lightness (0-1)
 * @returns {Object} - RGB components
 */
function hslToRgb(h, s, l) {
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Converts RGB color to HSL
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @returns {Object} - HSL components
 */
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Converts RGB color to luminance
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @returns {number} - Relative luminance
 */
function rgbToLuminance(r, g, b) {
  // Convert RGB to linear RGB
  const linearR = r / 255 <= 0.03928 ? r / 255 / 12.92 : Math.pow((r / 255 + 0.055) / 1.055, 2.4);
  const linearG = g / 255 <= 0.03928 ? g / 255 / 12.92 : Math.pow((g / 255 + 0.055) / 1.055, 2.4);
  const linearB = b / 255 <= 0.03928 ? b / 255 / 12.92 : Math.pow((b / 255 + 0.055) / 1.055, 2.4);
  
  // Calculate luminance
  return 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB;
}

/**
 * Calculates contrast ratio between two colors
 * @param {Object} color1 - First color (RGB components)
 * @param {Object} color2 - Second color (RGB components)
 * @returns {number} - Contrast ratio
 */
function calculateContrastRatio(color1, color2) {
  const luminance1 = rgbToLuminance(color1.r, color1.g, color1.b);
  const luminance2 = rgbToLuminance(color2.r, color2.g, color2.b);
  
  // Ensure the lighter color is first
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Converts RGB color to LAB color space
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @returns {Object} - LAB components
 */
function rgbToLab(r, g, b) {
  // Convert RGB to XYZ
  r = r / 255;
  g = g / 255;
  b = b / 255;
  
  // Apply gamma correction
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  
  // Convert to XYZ
  r = r * 100;
  g = g * 100;
  b = b * 100;
  
  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
  
  // Convert XYZ to LAB
  const xRef = 95.047;
  const yRef = 100.0;
  const zRef = 108.883;
  
  const xNorm = x / xRef;
  const yNorm = y / yRef;
  const zNorm = z / zRef;
  
  const fx = xNorm > 0.008856 ? Math.pow(xNorm, 1/3) : (7.787 * xNorm) + (16/116);
  const fy = yNorm > 0.008856 ? Math.pow(yNorm, 1/3) : (7.787 * yNorm) + (16/116);
  const fz = zNorm > 0.008856 ? Math.pow(zNorm, 1/3) : (7.787 * zNorm) + (16/116);
  
  const l = (116 * fy) - 16;
  const a = 500 * (fx - fy);
  const lab_b = 200 * (fy - fz);
  
  return { l, a, b: lab_b };
}

/**
 * Calculates color distance using CIEDE2000 algorithm
 * @param {Object} lab1 - First color in LAB space
 * @param {Object} lab2 - Second color in LAB space
 * @returns {number} - Color distance
 */
function calculateCIEDE2000(lab1, lab2) {
  // Implementation of CIEDE2000 color difference formula
  // Based on the paper "The CIEDE2000 Color-Difference Formula: Implementation Notes,
  // Supplementary Test Data, and Mathematical Observations" by Gaurav Sharma, Wencheng Wu, and Edul N. Dalal
  
  // Extract LAB components
  const L1 = lab1.l;
  const a1 = lab1.a;
  const b1 = lab1.b;
  const L2 = lab2.l;
  const a2 = lab2.a;
  const b2 = lab2.b;
  
  // Calculate C1, C2 (Chroma)
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  
  // Calculate mean C
  const C_mean = (C1 + C2) / 2;
  
  // Calculate G
  const G = 0.5 * (1 - Math.sqrt(Math.pow(C_mean, 7) / (Math.pow(C_mean, 7) + Math.pow(25, 7))));
  
  // Calculate a' (a prime)
  const a1_prime = a1 * (1 + G);
  const a2_prime = a2 * (1 + G);
  
  // Calculate C' (C prime)
  const C1_prime = Math.sqrt(a1_prime * a1_prime + b1 * b1);
  const C2_prime = Math.sqrt(a2_prime * a2_prime + b2 * b2);
  
  // Calculate h' (h prime)
  let h1_prime = Math.atan2(b1, a1_prime) * 180 / Math.PI;
  if (h1_prime < 0) h1_prime += 360;
  
  let h2_prime = Math.atan2(b2, a2_prime) * 180 / Math.PI;
  if (h2_prime < 0) h2_prime += 360;
  
  // Calculate ΔL', ΔC', ΔH'
  const delta_L_prime = L2 - L1;
  const delta_C_prime = C2_prime - C1_prime;
  
  let delta_h_prime;
  if (C1_prime * C2_prime === 0) {
    delta_h_prime = 0;
  } else {
    delta_h_prime = h2_prime - h1_prime;
    if (delta_h_prime > 180) delta_h_prime -= 360;
    else if (delta_h_prime < -180) delta_h_prime += 360;
  }
  
  const delta_H_prime = 2 * Math.sqrt(C1_prime * C2_prime) * Math.sin(delta_h_prime * Math.PI / 360);
  
  // Calculate mean L', C', h'
  const L_prime_mean = (L1 + L2) / 2;
  const C_prime_mean = (C1_prime + C2_prime) / 2;
  
  let h_prime_mean;
  if (C1_prime * C2_prime === 0) {
    h_prime_mean = h1_prime + h2_prime;
  } else {
    h_prime_mean = (h1_prime + h2_prime) / 2;
    if (Math.abs(h1_prime - h2_prime) > 180) {
      if (h1_prime + h2_prime < 360) h_prime_mean += 180;
      else h_prime_mean -= 180;
    }
  }
  
  // Calculate T
  const T = 1 - 0.17 * Math.cos((h_prime_mean - 30) * Math.PI / 180)
            + 0.24 * Math.cos((2 * h_prime_mean) * Math.PI / 180)
            + 0.32 * Math.cos((3 * h_prime_mean + 6) * Math.PI / 180)
            - 0.20 * Math.cos((4 * h_prime_mean - 63) * Math.PI / 180);
  
  // Calculate RT
  const theta = 30 * Math.exp(-Math.pow((h_prime_mean - 275) / 25, 2));
  const RC = 2 * Math.sqrt(Math.pow(C_prime_mean, 7) / (Math.pow(C_prime_mean, 7) + Math.pow(25, 7)));
  const RT = -Math.sin(2 * theta * Math.PI / 180) * RC;
  
  // Calculate weighting factors
  const SL = 1 + (0.015 * Math.pow(L_prime_mean - 50, 2)) / Math.sqrt(20 + Math.pow(L_prime_mean - 50, 2));
  const SC = 1 + 0.045 * C_prime_mean;
  const SH = 1 + 0.015 * C_prime_mean * T;
  
  // Calculate CIEDE2000 color difference
  const delta_L_term = delta_L_prime / SL;
  const delta_C_term = delta_C_prime / SC;
  const delta_H_term = delta_H_prime / SH;
  
  const delta_E = Math.sqrt(
    Math.pow(delta_L_term, 2) +
    Math.pow(delta_C_term, 2) +
    Math.pow(delta_H_term, 2) +
    RT * delta_C_term * delta_H_term
  );
  
  return delta_E;
}

/**
 * Calculates color distance using CIE76 algorithm
 * @param {Object} lab1 - First color in LAB space
 * @param {Object} lab2 - Second color in LAB space
 * @returns {number} - Color distance
 */
function calculateCIE76(lab1, lab2) {
  return Math.sqrt(
    Math.pow(lab1.l - lab2.l, 2) +
    Math.pow(lab1.a - lab2.a, 2) +
    Math.pow(lab1.b - lab2.b, 2)
  );
}

/**
 * Calculates color distance using CIE94 algorithm
 * @param {Object} lab1 - First color in LAB space
 * @param {Object} lab2 - Second color in LAB space
 * @returns {number} - Color distance
 */
function calculateCIE94(lab1, lab2) {
  // Constants
  const kL = 1;
  const kC = 1;
  const kH = 1;
  const k1 = 0.045;
  const k2 = 0.015;
  
  // Calculate C1, C2 (Chroma)
  const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
  const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
  
  // Calculate delta L, C, H
  const deltaL = lab1.l - lab2.l;
  const deltaC = C1 - C2;
  
  // Calculate delta a, b
  const deltaA = lab1.a - lab2.a;
  const deltaB = lab1.b - lab2.b;
  
  // Calculate delta H (Hue)
  const deltaH = Math.sqrt(deltaA * deltaA + deltaB * deltaB - deltaC * deltaC);
  
  // Calculate SL, SC, SH
  const SL = 1;
  const SC = 1 + k1 * C1;
  const SH = 1 + k2 * C1;
  
  // Calculate CIE94 color difference
  const deltaE = Math.sqrt(
    Math.pow(deltaL / (kL * SL), 2) +
    Math.pow(deltaC / (kC * SC), 2) +
    Math.pow(deltaH / (kH * SH), 2)
  );
  
  return deltaE;
}

/**
 * Calculates color distance between two colors
 * @param {Object} color1 - First color (RGB components)
 * @param {Object} color2 - Second color (RGB components)
 * @param {string} algorithm - Algorithm to use ('CIEDE2000', 'CIE76', or 'CIE94')
 * @returns {number} - Color distance
 */
function calculateColorDistance(color1, color2, algorithm = 'CIEDE2000') {
  // Convert RGB to LAB
  const lab1 = rgbToLab(color1.r, color1.g, color1.b);
  const lab2 = rgbToLab(color2.r, color2.g, color2.b);
  
  // Calculate distance using the specified algorithm
  switch (algorithm) {
    case 'CIEDE2000':
      return calculateCIEDE2000(lab1, lab2);
    case 'CIE76':
      return calculateCIE76(lab1, lab2);
    case 'CIE94':
      return calculateCIE94(lab1, lab2);
    default:
      return calculateCIEDE2000(lab1, lab2);
  }
}

/**
 * Adjusts a color to improve contrast with another color
 * @param {Object} color - Color to adjust (RGB components)
 * @param {Object} backgroundColor - Background color (RGB components)
 * @param {number} targetRatio - Target contrast ratio
 * @returns {Object} - Adjusted color (RGB components)
 */
function adjustColorForContrast(color, backgroundColor, targetRatio = 4.5) {
  // Convert to HSL for easier adjustment
  const hsl = rgbToHsl(color.r, color.g, color.b);
  
  // Calculate current contrast ratio
  let currentRatio = calculateContrastRatio(color, backgroundColor);
  
  // If already meets target, return original color
  if (currentRatio >= targetRatio) {
    return color;
  }
  
  // Determine if we need to lighten or darken
  const bgLuminance = rgbToLuminance(backgroundColor.r, backgroundColor.g, backgroundColor.b);
  const colorLuminance = rgbToLuminance(color.r, color.g, color.b);
  
  const shouldLighten = colorLuminance <= bgLuminance;
  
  // Adjust lightness until we meet the target ratio
  let adjustedHsl = { ...hsl };
  let adjustedColor = color;
  let step = shouldLighten ? 5 : -5;
  let maxIterations = 20;
  
  while (currentRatio < targetRatio && maxIterations > 0) {
    // Adjust lightness
    adjustedHsl.l = Math.max(0, Math.min(100, adjustedHsl.l + step));
    
    // Convert back to RGB
    const rgb = hslToRgb(adjustedHsl.h / 360, adjustedHsl.s / 100, adjustedHsl.l / 100);
    adjustedColor = rgb;
    
    // Calculate new contrast ratio
    currentRatio = calculateContrastRatio(adjustedColor, backgroundColor);
    
    // If we've reached the limit of lightness adjustment, try adjusting saturation
    if ((shouldLighten && adjustedHsl.l >= 95) || (!shouldLighten && adjustedHsl.l <= 5)) {
      adjustedHsl.s = Math.max(0, adjustedHsl.s - 10);
      if (adjustedHsl.s <= 0) {
        break;
      }
    }
    
    maxIterations--;
  }
  
  return adjustedColor;
}

/**
 * Tests color contrast for accessibility
 * @param {string} foregroundColor - Foreground color (hex, rgb, rgba, hsl, hsla, or named color)
 * @param {string} backgroundColor - Background color (hex, rgb, rgba, hsl, hsla, or named color)
 * @param {Object} options - Testing options
 * @returns {Object} - Test results
 */
function testColorContrast(foregroundColor, backgroundColor, options = {}) {
  // Merge options with defaults
  const testOptions = { ...DEFAULT_CONTRAST_OPTIONS, ...options };
  
  // Parse colors
  const fg = parseColor(foregroundColor);
  const bg = parseColor(backgroundColor);
  
  // Validate inputs
  if (!fg || !bg) {
    return {
      valid: false,
      error: !fg ? 'Invalid foreground color' : 'Invalid background color',
      contrastRatio: 0,
      wcagLevel: testOptions.wcagLevel,
      largeText: testOptions.largeText
    };
  }
  
  // Calculate contrast ratio
  const contrastRatio = calculateContrastRatio(fg, bg);
  
  // Determine WCAG level requirements
  let requirements = {
    'A': {
      normalText: 3,
      largeText: 3
    },
    'AA': {
      normalText: 4.5,
      largeText: 3
    },
    'AAA': {
      normalText: 7,
      largeText: 4.5
    }
  };
  
  // Get the required contrast ratio
  const requiredRatio = testOptions.largeText
    ? requirements[testOptions.wcagLevel].largeText
    : requirements[testOptions.wcagLevel].normalText;
  
  // Check if contrast is sufficient
  const valid = contrastRatio >= requiredRatio;
  
  // Prepare result
  const result = {
    valid,
    contrastRatio,
    wcagLevel: testOptions.wcagLevel,
    largeText: testOptions.largeText,
    requiredRatio,
    foregroundColor: {
      hex: `#${fg.r.toString(16).padStart(2, '0')}${fg.g.toString(16).padStart(2, '0')}${fg.b.toString(16).padStart(2, '0')}`,
      rgb: `rgb(${fg.r}, ${fg.g}, ${fg.b})`,
      hsl: rgbToHsl(fg.r, fg.g, fg.b)
    },
    backgroundColor: {
      hex: `#${bg.r.toString(16).padStart(2, '0')}${bg.g.toString(16).padStart(2, '0')}${bg.b.toString(16).padStart(2, '0')}`,
      rgb: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
      hsl: rgbToHsl(bg.r, bg.g, bg.b)
    }
  };
  
  // Add recommendations if enabled
  if (testOptions.includeRecommendations && !valid) {
    const adjustedFg = adjustColorForContrast(fg, bg, requiredRatio);
    const adjustedBg = adjustColorForContrast(bg, fg, requiredRatio);
    
    // Determine which adjustment is better (less perceptual change)
    const fgDistance = calculateColorDistance(fg, adjustedFg);
    const bgDistance = calculateColorDistance(bg, adjustedBg);
    
    const recommendation = fgDistance <= bgDistance ? {
      type: 'foreground',
      color: {
        hex: `#${adjustedFg.r.toString(16).padStart(2, '0')}${adjustedFg.g.toString(16).padStart(2, '0')}${adjustedFg.b.toString(16).padStart(2, '0')}`,
        rgb: `rgb(${adjustedFg.r}, ${adjustedFg.g}, ${adjustedFg.b})`,
        hsl: rgbToHsl(adjustedFg.r, adjustedFg.g, adjustedFg.b)
      },
      contrastRatio: calculateContrastRatio(adjustedFg, bg)
    } : {
      type: 'background',
      color: {
        hex: `#${adjustedBg.r.toString(16).padStart(2, '0')}${adjustedBg.g.toString(16).padStart(2, '0')}${adjustedBg.b.toString(16).padStart(2, '0')}`,
        rgb: `rgb(${adjustedBg.r}, ${adjustedBg.g}, ${adjustedBg.b})`,
        hsl: rgbToHsl(adjustedBg.r, adjustedBg.g, adjustedBg.b)
      },
      contrastRatio: calculateContrastRatio(fg, adjustedBg)
    };
    
    result.recommendation = recommendation;
  }
  
  return result;
}

/**
 * Validates that colors are sufficiently distinct
 * @param {Array} colors - Array of colors to compare
 * @param {Object} options - Validation options
 * @returns {Object} - Validation results with suggestions
 */
function validateColorDistinction(colors, options = {}) {
  // Merge options with defaults
  const validationOptions = { ...DEFAULT_DISTINCTION_OPTIONS, ...options };
  
  // Parse colors
  const parsedColors = colors.map(color => {
    const parsed = parseColor(color);
    return {
      original: color,
      rgb: parsed,
      lab: parsed ? rgbToLab(parsed.r, parsed.g, parsed.b) : null
    };
  });
  
  // Filter out invalid colors
  const validColors = parsedColors.filter(color => color.rgb !== null);
  
  // Check if we have enough valid colors
  if (validColors.length < 2) {
    return {
      valid: false,
      error: 'At least two valid colors are required',
      invalidColors: parsedColors.filter(color => color.rgb === null).map(color => color.original)
    };
  }
  
  // Calculate distances between all color pairs
  const colorPairs = [];
  for (let i = 0; i < validColors.length; i++) {
    for (let j = i + 1; j < validColors.length; j++) {
      const color1 = validColors[i];
      const color2 = validColors[j];
      
      const distance = calculateColorDistance(
        color1.rgb,
        color2.rgb,
        validationOptions.algorithm
      );
      
      colorPairs.push({
        color1: color1.original,
        color2: color2.original,
        distance,
        sufficient: distance >= validationOptions.minimumDistance
      });
    }
  }
  
  // Find pairs with insufficient distance
  const insufficientPairs = colorPairs.filter(pair => !pair.sufficient);
  
  // Group similar colors if enabled
  let similarGroups = [];
  if (validationOptions.groupSimilarColors && insufficientPairs.length > 0) {
    // Create a graph of similar colors
    const similarityGraph = {};
    
    for (const pair of insufficientPairs) {
      if (!similarityGraph[pair.color1]) {
        similarityGraph[pair.color1] = [];
      }
      if (!similarityGraph[pair.color2]) {
        similarityGraph[pair.color2] = [];
      }
      
      similarityGraph[pair.color1].push(pair.color2);
      similarityGraph[pair.color2].push(pair.color1);
    }
    
    // Find connected components (groups of similar colors)
    const visited = new Set();
    
    for (const color of Object.keys(similarityGraph)) {
      if (!visited.has(color)) {
        const group = [];
        const queue = [color];
        
        while (queue.length > 0) {
          const current = queue.shift();
          if (!visited.has(current)) {
            visited.add(current);
            group.push(current);
            
            for (const neighbor of similarityGraph[current] || []) {
              if (!visited.has(neighbor)) {
                queue.push(neighbor);
              }
            }
          }
        }
        
        if (group.length > 1) {
          similarGroups.push(group);
        }
      }
    }
  }
  
  // Prepare result
  const result = {
    valid: insufficientPairs.length === 0,
    algorithm: validationOptions.algorithm,
    minimumDistance: validationOptions.minimumDistance,
    colorPairs,
    insufficientPairs
  };
  
  if (similarGroups.length > 0) {
    result.similarGroups = similarGroups;
  }
  
  // Add recommendations if enabled
  if (validationOptions.includeRecommendations && insufficientPairs.length > 0) {
    const recommendations = [];
    
    for (const group of similarGroups) {
      // Find the color with the most similar pairs
      const colorCounts = {};
      for (const color of group) {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      }
      
      const mostSimilarColor = Object.keys(colorCounts).reduce((a, b) => 
        colorCounts[a] > colorCounts[b] ? a : b
      );
      
      // Get the parsed color
      const colorIndex = parsedColors.findIndex(c => c.original === mostSimilarColor);
      if (colorIndex >= 0) {
        const color = parsedColors[colorIndex];
        
        // Adjust the HSL values to create a more distinct color
        const hsl = rgbToHsl(color.rgb.r, color.rgb.g, color.rgb.b);
        
        // Shift hue by 30 degrees
        hsl.h = (hsl.h + 30) % 360;
        
        // Adjust saturation and lightness if needed
        if (hsl.s < 50) hsl.s = Math.min(100, hsl.s + 20);
        if (hsl.l < 30) hsl.l = Math.min(70, hsl.l + 20);
        if (hsl.l > 70) hsl.l = Math.max(30, hsl.l - 20);
        
        // Convert back to RGB
        const rgb = hslToRgb(hsl.h / 360, hsl.s / 100, hsl.l / 100);
        
        // Create hex representation
        const hex = `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
        
        recommendations.push({
          originalColor: mostSimilarColor,
          suggestedColor: hex,
          hsl
        });
      }
    }
    
    if (recommendations.length > 0) {
      result.recommendations = recommendations;
    }
  }
  
  return result;
}

/**
 * Converts a color to a hex string
 * @param {Object} rgb - RGB color object
 * @returns {string} - Hex color string
 */
function rgbToHex(rgb) {
  return `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
}

module.exports = {
  testColorContrast,
  validateColorDistinction,
  parseColor,
  rgbToHsl,
  hslToRgb,
  rgbToLab,
  calculateContrastRatio,
  calculateColorDistance,
  adjustColorForContrast,
  rgbToHex
};
