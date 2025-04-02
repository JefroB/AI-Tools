/**
 * Security Utilities Module for AI Tools
 * Provides tools for code security scanning and input sanitization
 */

/**
 * Default options for vulnerability scanning
 */
const DEFAULT_SCAN_OPTIONS = {
  severity: 'all',           // Severity level to report ('all', 'high', 'medium', 'low')
  includeRemediation: true,  // Whether to include remediation suggestions
  maxResults: 100,           // Maximum number of vulnerabilities to report
  customRules: [],           // Custom vulnerability rules
};

/**
 * Default options for input sanitization
 */
const DEFAULT_SANITIZE_OPTIONS = {
  allowedTags: [],           // HTML tags to allow (empty = strip all tags)
  allowedAttributes: {},     // Allowed attributes for specific tags
  stripComments: true,       // Whether to strip HTML comments
  escapeEntities: true,      // Whether to escape HTML entities
  preventScriptInjection: true, // Whether to prevent script injection
};

/**
 * Common security vulnerability patterns by language
 */
const VULNERABILITY_PATTERNS = {
  javascript: [
    {
      name: 'SQL Injection',
      severity: 'high',
      pattern: /(?:execute|select|insert|update|delete|drop|alter)\s*\(\s*[\"`'].*?\$\{.*?\}.*?[\"`']/gi,
      description: 'Potential SQL injection vulnerability detected. User input is directly concatenated into SQL query.',
      remediation: 'Use parameterized queries or prepared statements instead of string concatenation.'
    },
    {
      name: 'Cross-Site Scripting (XSS)',
      severity: 'high',
      pattern: /(?:innerHTML|outerHTML|document\.write|eval|setTimeout|setInterval)\s*\(\s*(?:.*?\$\{.*?\}|.*?\+\s*[a-zA-Z_][a-zA-Z0-9_]*)/gi,
      description: 'Potential XSS vulnerability detected. User input may be directly inserted into HTML.',
      remediation: 'Use safe DOM methods like textContent instead of innerHTML, or sanitize input with a library like DOMPurify.'
    },
    {
      name: 'Path Traversal',
      severity: 'high',
      pattern: /(?:fs|require\(['"]\w*fs\w*['"])\)\.(?:read|write|append)(?:File|FileSync)\s*\(\s*(?:.*?\$\{.*?\}|.*?\+\s*[a-zA-Z_][a-zA-Z0-9_]*)/gi,
      description: 'Potential path traversal vulnerability detected. User input may be used in file operations.',
      remediation: 'Validate and sanitize file paths. Use path.normalize() and restrict to specific directories.'
    },
    {
      name: 'Command Injection',
      severity: 'high',
      pattern: /(?:exec|spawn|execSync)\s*\(\s*(?:.*?\$\{.*?\}|.*?\+\s*[a-zA-Z_][a-zA-Z0-9_]*)/gi,
      description: 'Potential command injection vulnerability detected. User input may be used in shell commands.',
      remediation: 'Avoid using user input in shell commands. If necessary, validate and sanitize input carefully.'
    },
    {
      name: 'Insecure Randomness',
      severity: 'medium',
      pattern: /Math\.random\(\)/gi,
      description: 'Insecure random number generation detected. Math.random() is not cryptographically secure.',
      remediation: 'Use crypto.randomBytes() or crypto.randomUUID() for security-sensitive operations.'
    },
    {
      name: 'Hardcoded Credentials',
      severity: 'high',
      pattern: /(?:password|passwd|pwd|secret|key|token|auth)(?:\s*[:=]\s*['"`][^'"`]{4,}['"`])/gi,
      description: 'Potential hardcoded credentials detected.',
      remediation: 'Store sensitive information in environment variables or a secure configuration system.'
    },
    {
      name: 'Insecure Cookie',
      severity: 'medium',
      pattern: /document\.cookie\s*=\s*(?:(?!secure|httpOnly).)*?=/gi,
      description: 'Insecure cookie detected. Cookies should use secure and httpOnly flags.',
      remediation: 'Set secure and httpOnly flags on sensitive cookies.'
    },
    {
      name: 'Prototype Pollution',
      severity: 'medium',
      pattern: /Object\.assign\(\s*{}\s*,\s*(?:.*?\$\{.*?\}|.*?\+\s*[a-zA-Z_][a-zA-Z0-9_]*)/gi,
      description: 'Potential prototype pollution vulnerability detected.',
      remediation: 'Use Object.create(null) to create objects without prototype, or use a library like lodash with _.merge and _.defaultsDeep.'
    },
    {
      name: 'Insecure Regular Expression',
      severity: 'medium',
      pattern: /\.match\(\/\.\*\+\?/gi,
      description: 'Potentially insecure regular expression detected. May be vulnerable to ReDoS attacks.',
      remediation: 'Avoid using nested quantifiers like .* or .+ in regular expressions, or use a library like safe-regex.'
    },
    {
      name: 'Eval Usage',
      severity: 'high',
      pattern: /eval\s*\(/gi,
      description: 'Use of eval() detected. This can lead to code injection vulnerabilities.',
      remediation: 'Avoid using eval(). Consider safer alternatives like JSON.parse() for JSON data.'
    }
  ],
  python: [
    {
      name: 'SQL Injection',
      severity: 'high',
      pattern: /(?:execute|cursor\.execute)\s*\(\s*f['"](SELECT|INSERT|UPDATE|DELETE|DROP|ALTER).*?{.*?}.*?['"]/gi,
      description: 'Potential SQL injection vulnerability detected. User input is directly concatenated into SQL query.',
      remediation: 'Use parameterized queries with placeholders (?, %s) instead of string formatting or concatenation.'
    },
    {
      name: 'Command Injection',
      severity: 'high',
      pattern: /(?:os\.system|os\.popen|subprocess\.(?:call|run|Popen))\s*\(\s*f['"](.*?{.*?}.*?)['"](?:,|\))/gi,
      description: 'Potential command injection vulnerability detected. User input may be used in shell commands.',
      remediation: 'Use subprocess module with shell=False and pass arguments as a list instead of a string.'
    },
    {
      name: 'Path Traversal',
      severity: 'high',
      pattern: /(?:open|os\.path\.(?:join|exists|isfile))\s*\(\s*f['"](.*?{.*?}.*?)['"](?:,|\))/gi,
      description: 'Potential path traversal vulnerability detected. User input may be used in file operations.',
      remediation: 'Validate and sanitize file paths. Use os.path.normpath() and restrict to specific directories.'
    },
    {
      name: 'Cross-Site Scripting (XSS)',
      severity: 'high',
      pattern: /(?:render_template|render|Response)\s*\(\s*f['"](.*?{.*?}.*?)['"](?:,|\))/gi,
      description: 'Potential XSS vulnerability detected. User input may be directly inserted into HTML.',
      remediation: 'Use template engine autoescaping features or explicitly escape user input with html.escape().'
    },
    {
      name: 'Pickle Deserialization',
      severity: 'high',
      pattern: /pickle\.(?:loads|load)\s*\(/gi,
      description: 'Insecure deserialization detected. Pickle can execute arbitrary code during deserialization.',
      remediation: 'Avoid using pickle for untrusted data. Consider using json or other safer serialization formats.'
    },
    {
      name: 'Hardcoded Credentials',
      severity: 'high',
      pattern: /(?:password|passwd|pwd|secret|key|token|auth)(?:\s*=\s*['"][^'"]{4,}['"])/gi,
      description: 'Potential hardcoded credentials detected.',
      remediation: 'Store sensitive information in environment variables or a secure configuration system.'
    },
    {
      name: 'Eval Usage',
      severity: 'high',
      pattern: /(?:eval|exec)\s*\(/gi,
      description: 'Use of eval() or exec() detected. This can lead to code injection vulnerabilities.',
      remediation: 'Avoid using eval() or exec(). Consider safer alternatives.'
    },
    {
      name: 'Insecure Random',
      severity: 'medium',
      pattern: /random\.(?:random|randint|choice|sample)/gi,
      description: 'Insecure random number generation detected. The random module is not cryptographically secure.',
      remediation: 'Use secrets module for security-sensitive operations.'
    },
    {
      name: 'YAML Unsafe Load',
      severity: 'high',
      pattern: /yaml\.(?:load|unsafe_load)\s*\(/gi,
      description: 'Insecure YAML loading detected. yaml.load() can execute arbitrary code.',
      remediation: 'Use yaml.safe_load() instead of yaml.load().'
    },
    {
      name: 'Flask Debug Mode',
      severity: 'medium',
      pattern: /app\.run\s*\(.*?debug\s*=\s*True/gi,
      description: 'Flask debug mode enabled. This should not be used in production.',
      remediation: 'Disable debug mode in production environments.'
    }
  ],
  php: [
    {
      name: 'SQL Injection',
      severity: 'high',
      pattern: /(?:mysql_query|mysqli_query|->query)\s*\(\s*['"](SELECT|INSERT|UPDATE|DELETE|DROP|ALTER).*?\$.*?['"]/gi,
      description: 'Potential SQL injection vulnerability detected. User input is directly concatenated into SQL query.',
      remediation: 'Use prepared statements with placeholders (?, :name) instead of string concatenation.'
    },
    {
      name: 'Cross-Site Scripting (XSS)',
      severity: 'high',
      pattern: /(?:echo|print|print_r|printf)\s*\(\s*\$_(?:GET|POST|REQUEST|COOKIE)/gi,
      description: 'Potential XSS vulnerability detected. User input may be directly output to the page.',
      remediation: 'Use htmlspecialchars() or htmlentities() to escape user input before outputting it.'
    },
    {
      name: 'Command Injection',
      severity: 'high',
      pattern: /(?:system|exec|passthru|shell_exec|popen|proc_open|pcntl_exec)\s*\(\s*\$.*?\)/gi,
      description: 'Potential command injection vulnerability detected. User input may be used in shell commands.',
      remediation: 'Avoid using user input in shell commands. If necessary, validate and sanitize input carefully.'
    },
    {
      name: 'File Inclusion',
      severity: 'high',
      pattern: /(?:include|require|include_once|require_once)\s*\(\s*\$.*?\)/gi,
      description: 'Potential file inclusion vulnerability detected. User input may be used to include files.',
      remediation: 'Validate and sanitize file paths. Use a whitelist of allowed files.'
    },
    {
      name: 'Insecure Deserialization',
      severity: 'high',
      pattern: /(?:unserialize)\s*\(\s*\$.*?\)/gi,
      description: 'Insecure deserialization detected. unserialize() can lead to object injection vulnerabilities.',
      remediation: 'Avoid using unserialize() with untrusted data. Consider using json_decode() instead.'
    },
    {
      name: 'Hardcoded Credentials',
      severity: 'high',
      pattern: /(?:\$(?:password|passwd|pwd|secret|key|token|auth))\s*=\s*['"][^'"]{4,}['"];/gi,
      description: 'Potential hardcoded credentials detected.',
      remediation: 'Store sensitive information in environment variables or a secure configuration system.'
    },
    {
      name: 'Eval Usage',
      severity: 'high',
      pattern: /(?:eval|assert)\s*\(\s*\$.*?\)/gi,
      description: 'Use of eval() or assert() with variables detected. This can lead to code injection vulnerabilities.',
      remediation: 'Avoid using eval() or assert() with user input.'
    },
    {
      name: 'Insecure File Operations',
      severity: 'high',
      pattern: /(?:file_get_contents|file_put_contents|fopen|readfile)\s*\(\s*\$.*?\)/gi,
      description: 'Potential file operation vulnerability detected. User input may be used in file operations.',
      remediation: 'Validate and sanitize file paths. Restrict to specific directories.'
    },
    {
      name: 'Cross-Site Request Forgery (CSRF)',
      severity: 'medium',
      pattern: /(?:_POST|_GET|_REQUEST).*?(?:update|delete|create|modify|upload)/gi,
      description: 'Potential CSRF vulnerability detected. Form submission without CSRF token.',
      remediation: 'Implement CSRF tokens for all state-changing operations.'
    },
    {
      name: 'Session Fixation',
      severity: 'medium',
      pattern: /session_id\s*\(\s*\$.*?\)/gi,
      description: 'Potential session fixation vulnerability detected. User-provided session ID.',
      remediation: 'Generate new session ID after authentication with session_regenerate_id().'
    }
  ],
  generic: [
    {
      name: 'Hardcoded IP Address',
      severity: 'low',
      pattern: /(?:\/\/|\/\*|#).*?(?:\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/gi,
      description: 'Hardcoded IP address detected in comments.',
      remediation: 'Store IP addresses in configuration files or environment variables.'
    },
    {
      name: 'TODO Comments',
      severity: 'low',
      pattern: /(?:\/\/|\/\*|#).*?(?:TODO|FIXME|XXX|BUG|HACK)(?::|\s)/gi,
      description: 'TODO comment detected. This may indicate incomplete or insecure code.',
      remediation: 'Review and address TODO comments before deployment.'
    },
    {
      name: 'Sensitive Information in Comments',
      severity: 'medium',
      pattern: /(?:\/\/|\/\*|#).*?(?:password|secret|key|token|auth|credential)/gi,
      description: 'Potential sensitive information in comments detected.',
      remediation: 'Remove sensitive information from comments.'
    }
  ]
};

/**
 * HTML tag whitelist for sanitization
 */
const DEFAULT_ALLOWED_TAGS = [
  // Basic formatting
  'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // Text formatting
  'b', 'i', 'strong', 'em', 'u', 'small', 'sub', 'sup',
  // Lists
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  // Tables
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  // Other
  'div', 'span', 'blockquote', 'code', 'pre'
];

/**
 * Default allowed attributes for HTML tags
 */
const DEFAULT_ALLOWED_ATTRIBUTES = {
  'a': ['href', 'title', 'target'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  'table': ['border', 'cellpadding', 'cellspacing'],
  'th': ['colspan', 'rowspan', 'scope'],
  'td': ['colspan', 'rowspan'],
  'div': ['class', 'id'],
  'span': ['class', 'id'],
  'code': ['class'],
  'pre': ['class']
};

/**
 * Scans code for common security vulnerabilities
 * @param {string} code - Code to scan
 * @param {string} language - Programming language ('javascript', 'python', 'php', or 'generic')
 * @param {Object} options - Scan options
 * @returns {Array} - Detected vulnerabilities with remediation suggestions
 */
function scanForVulnerabilities(code, language = 'javascript', options = {}) {
  // Merge options with defaults
  const scanOptions = { ...DEFAULT_SCAN_OPTIONS, ...options };
  
  // Validate inputs
  if (!code || typeof code !== 'string') {
    return [];
  }
  
  // Normalize language
  language = language.toLowerCase();
  
  // Get vulnerability patterns for the specified language
  const languagePatterns = VULNERABILITY_PATTERNS[language] || [];
  const genericPatterns = VULNERABILITY_PATTERNS.generic || [];
  
  // Combine language-specific and generic patterns
  const patterns = [...languagePatterns, ...genericPatterns];
  
  // Add custom rules if provided
  if (scanOptions.customRules && Array.isArray(scanOptions.customRules)) {
    patterns.push(...scanOptions.customRules);
  }
  
  // Filter patterns by severity if needed
  const filteredPatterns = scanOptions.severity === 'all'
    ? patterns
    : patterns.filter(pattern => {
        switch (scanOptions.severity) {
          case 'high':
            return pattern.severity === 'high';
          case 'medium':
            return pattern.severity === 'high' || pattern.severity === 'medium';
          case 'low':
            return true; // All severities
          default:
            return true;
        }
      });
  
  // Scan code for vulnerabilities
  const vulnerabilities = [];
  
  for (const pattern of filteredPatterns) {
    // Reset lastIndex to ensure we find all matches
    pattern.pattern.lastIndex = 0;
    
    let match;
    while ((match = pattern.pattern.exec(code)) !== null) {
      // Get line number and context
      const lineInfo = getLineInfo(code, match.index);
      
      vulnerabilities.push({
        name: pattern.name,
        severity: pattern.severity,
        line: lineInfo.line,
        column: lineInfo.column,
        context: lineInfo.context,
        description: pattern.description,
        ...(scanOptions.includeRemediation && { remediation: pattern.remediation })
      });
      
      // Stop if we've reached the maximum number of vulnerabilities
      if (vulnerabilities.length >= scanOptions.maxResults) {
        break;
      }
    }
    
    // Stop if we've reached the maximum number of vulnerabilities
    if (vulnerabilities.length >= scanOptions.maxResults) {
      break;
    }
  }
  
  return vulnerabilities;
}

/**
 * Gets line and column information for a position in code
 * @param {string} code - Code string
 * @param {number} position - Position in code
 * @returns {Object} - Line and column information
 */
function getLineInfo(code, position) {
  // Get code up to the position
  const codeUpToPosition = code.substring(0, position);
  
  // Count newlines to get line number
  const lines = codeUpToPosition.split('\n');
  const line = lines.length;
  
  // Get column number (position in the last line)
  const column = lines[lines.length - 1].length + 1;
  
  // Get context (the line containing the vulnerability)
  const allLines = code.split('\n');
  const contextLine = allLines[line - 1] || '';
  
  // Get a few lines before and after for context
  const startLine = Math.max(0, line - 3);
  const endLine = Math.min(allLines.length, line + 2);
  const context = allLines.slice(startLine, endLine).join('\n');
  
  return {
    line,
    column,
    contextLine,
    context
  };
}

/**
 * Sanitizes user inputs to prevent injection attacks
 * @param {string} input - User input to sanitize
 * @param {string} context - Context where input will be used ('html', 'sql', 'js', 'url', 'shell', 'css')
 * @param {Object} options - Sanitization options
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input, context = 'html', options = {}) {
  // Validate input
  if (input === null || input === undefined) {
    return '';
  }
  
  // Convert input to string
  input = String(input);
  
  // Sanitize based on context
  switch (context.toLowerCase()) {
    case 'html':
      return sanitizeHtml(input, options);
    case 'sql':
      return sanitizeSql(input);
    case 'js':
      return sanitizeJs(input);
    case 'url':
      return sanitizeUrl(input);
    case 'shell':
      return sanitizeShell(input);
    case 'css':
      return sanitizeCss(input);
    default:
      // Default to HTML sanitization
      return sanitizeHtml(input, options);
  }
}

/**
 * Sanitizes HTML input
 * @param {string} input - HTML input to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} - Sanitized HTML
 */
function sanitizeHtml(input, options = {}) {
  // Merge options with defaults
  const sanitizeOptions = {
    ...DEFAULT_SANITIZE_OPTIONS,
    allowedTags: options.allowedTags || DEFAULT_ALLOWED_TAGS,
    allowedAttributes: options.allowedAttributes || DEFAULT_ALLOWED_ATTRIBUTES,
    ...options
  };
  
  // If no allowed tags, escape all HTML
  if (sanitizeOptions.allowedTags.length === 0) {
    return escapeHtml(input);
  }
  
  // Create a simple HTML parser
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = input;
  
  // Process all nodes recursively
  function processNode(node) {
    // If it's a text node, keep it as is
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    
    // If it's a comment node and we're stripping comments, remove it
    if (node.nodeType === Node.COMMENT_NODE && sanitizeOptions.stripComments) {
      return '';
    }
    
    // If it's an element node, check if it's allowed
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      
      // If the tag is not allowed, just return its text content
      if (!sanitizeOptions.allowedTags.includes(tagName)) {
        return Array.from(node.childNodes).map(processNode).join('');
      }
      
      // Create a new element with the same tag
      const newElement = document.createElement(tagName);
      
      // Copy allowed attributes
      const allowedAttrs = sanitizeOptions.allowedAttributes[tagName] || [];
      for (const attr of allowedAttrs) {
        if (node.hasAttribute(attr)) {
          let value = node.getAttribute(attr);
          
          // Special handling for href and src attributes to prevent JavaScript injection
          if ((attr === 'href' || attr === 'src') && sanitizeOptions.preventScriptInjection) {
            // Remove javascript: and data: URLs
            if (value.match(/^\s*javascript:/i) || value.match(/^\s*data:/i)) {
              value = '#';
            }
          }
          
          newElement.setAttribute(attr, value);
        }
      }
      
      // Process child nodes
      for (const child of node.childNodes) {
        const processedChild = processNode(child);
        if (processedChild) {
          if (typeof processedChild === 'string') {
            newElement.innerHTML += processedChild;
          } else {
            newElement.appendChild(processedChild);
          }
        }
      }
      
      return newElement.outerHTML;
    }
    
    return '';
  }
  
  // Process all nodes and join the results
  const result = Array.from(tempDiv.childNodes).map(processNode).join('');
  
  return result;
}

/**
 * Escapes HTML entities
 * @param {string} input - Input to escape
 * @returns {string} - Escaped input
 */
function escapeHtml(input) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes SQL input to prevent SQL injection
 * @param {string} input - SQL input to sanitize
 * @returns {string} - Sanitized SQL
 */
function sanitizeSql(input) {
  // Remove SQL comments
  input = input.replace(/--.*$/gm, '');
  
  // Remove multi-line comments
  input = input.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Escape single quotes
  input = input.replace(/'/g, "''");
  
  // Remove SQL keywords
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE',
    'TRUNCATE', 'UNION', 'JOIN', 'WHERE', 'OR', 'AND', 'FROM', 'INTO',
    'EXEC', 'EXECUTE', 'DECLARE', 'CAST', 'CONVERT'
  ];
  
  const pattern = new RegExp(`\\b(${sqlKeywords.join('|')})\\b`, 'gi');
  input = input.replace(pattern, '');
  
  return input;
}

/**
 * Sanitizes JavaScript input to prevent code injection
 * @param {string} input - JavaScript input to sanitize
 * @returns {string} - Sanitized JavaScript
 */
function sanitizeJs(input) {
  // Escape special characters
  input = JSON.stringify(input).slice(1, -1);
  
  // Remove script tags
  input = input.replace(/<\s*\/?\s*script\s*>/gi, '');
  
  // Remove JavaScript event handlers
  input = input.replace(/\bon\w+\s*=\s*["']?[^"']*["']?/gi, '');
  
  return input;
}

/**
 * Sanitizes URL input to prevent URL injection
 * @param {string} input - URL input to sanitize
 * @returns {string} - Sanitized URL
 */
function sanitizeUrl(input) {
  // Remove whitespace
  input = input.trim();
  
  // Check if it's a valid URL
  try {
    const url = new URL(input);
    
    // Only allow http and https protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }
    
    return url.toString();
  } catch (e) {
    // If it's not a valid URL, check if it's a relative URL
    if (input.startsWith('/')) {
      return input;
    }
    
    // Otherwise, return empty string
    return '';
  }
}

/**
 * Sanitizes shell command input to prevent command injection
 * @param {string} input - Shell input to sanitize
 * @returns {string} - Sanitized shell input
 */
function sanitizeShell(input) {
  // Remove shell metacharacters
  return input.replace(/[;&|`$(){}[\]<>\\]/g, '');
}

/**
 * Sanitizes CSS input to prevent CSS injection
 * @param {string} input - CSS input to sanitize
 * @returns {string} - Sanitized CSS
 */
function sanitizeCss(input) {
  // Remove CSS comments
  input = input.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Remove potentially dangerous CSS
  input = input.replace(/@import/gi, '');
  input = input.replace(/expression\s*\(/gi, '');
  input = input.replace(/url\s*\(/gi, '');
  
  return input;
}

/**
 * Validates a password against security requirements
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation results
 */
function validatePassword(password, options = {}) {
  // Default options
  const defaultOptions = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxConsecutiveChars: 3,
    checkCommonPasswords: true
  };
  
  // Merge options with defaults
  const validationOptions = { ...defaultOptions, ...options };
  
  // Validation results
  const results = {
    valid: true,
    errors: [],
    strength: 0 // 0-100
  };
  
  // Check length
  if (password.length < validationOptions.minLength) {
    results.valid = false;
    results.errors.push(`Password must be at least ${validationOptions.minLength} characters long.`);
  }
  
  // Check for uppercase letters
  if (validationOptions.requireUppercase && !/[A-Z]/.test(password)) {
    results.valid = false;
    results.errors.push('Password must contain at least one uppercase letter.');
  }
  
  // Check for lowercase letters
  if (validationOptions.requireLowercase && !/[a-z]/.test(password)) {
    results.valid = false;
    results.errors.push('Password must contain at least one lowercase letter.');
  }
  
  // Check for numbers
  if (validationOptions.requireNumbers && !/[0-9]/.test(password)) {
    results.valid = false;
    results.errors.push('Password must contain at least one number.');
  }
  
  // Check for special characters
  if (validationOptions.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    results.valid = false;
    results.errors.push('Password must contain at least one special character.');
  }
  
  // Check for consecutive characters
  if (validationOptions.maxConsecutiveChars > 0) {
    for (let i = 0; i < password.length - validationOptions.maxConsecutiveChars; i++) {
      const char = password[i];
      let consecutive = true;
      
      for (let j = 1; j <= validationOptions.maxConsecutiveChars; j++) {
        if (password[i + j] !== char) {
          consecutive = false;
          break;
        }
      }
      
      if (consecutive) {
        results.valid = false;
        results.errors.push(`Password must not contain more than ${validationOptions.maxConsecutiveChars} consecutive identical characters.`);
        break;
      }
    }
  }
  
  // Calculate password strength
  let strength = 0;
  
  // Length contribution (up to 25 points)
  strength += Math.min(25, password.length * 2);
  
  // Character variety contribution (up to 50 points)
  if (/[A-Z]/.test(password)) strength += 10;
  if (/[a-z]/.test(password)) strength += 10;
  if (/[0-9]/.test(password)) strength += 10;
  if (/[^A-Za-z0-9]/.test(password)) strength += 20;
  
  // Complexity contribution (up to 25 points)
  const uniqueChars = new Set(password.split('')).size;
  strength += Math.min(25, uniqueChars * 2);
  
  // Normalize to 0-100
  results.strength = Math.min(100, strength);
  
  return results;
}

/**
 * Generates a secure random password
 * @param {Object} options - Password generation options
 * @returns {string} - Generated password
 */
function generateSecurePassword(options = {}) {
  // Default options
  const defaultOptions = {
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSpecialChars: true,
    excludeSimilarChars: true
  };
  
  // Merge options with defaults
  const genOptions = { ...defaultOptions, ...options };
  
  // Character sets
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluding I and O
  const lowercaseChars = 'abcdefghijkmnopqrstuvwxyz'; // Excluding l
  const numberChars = '23456789'; // Excluding 0 and 1
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  // If not excluding similar characters, add them back
  const allUppercase = genOptions.excludeSimilarChars ? uppercaseChars : uppercaseChars + 'IO';
  const allLowercase = genOptions.excludeSimilarChars ? lowercaseChars : lowercaseChars + 'l';
  const allNumbers = genOptions.excludeSimilarChars ? numberChars : numberChars + '01';
  
  // Build character pool
  let charPool = '';
  if (genOptions.includeUppercase) charPool += allUppercase;
  if (genOptions.includeLowercase) charPool += allLowercase;
  if (genOptions.includeNumbers) charPool += allNumbers;
  if (genOptions.includeSpecialChars) charPool += specialChars;
  
  // Ensure we have at least some characters
  if (charPool.length === 0) {
    charPool = allLowercase + allNumbers;
  }
  
  // Generate password
  let password = '';
  const charPoolLength = charPool.length;
  
  // Use crypto.getRandomValues for secure random generation
  const randomValues = new Uint32Array(genOptions.length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < genOptions.length; i++) {
    password += charPool[randomValues[i] % charPoolLength];
  }
  
  // Ensure password meets requirements
  let meetsRequirements = true;
  
  if (genOptions.includeUppercase && !/[A-Z]/.test(password)) meetsRequirements = false;
  if (genOptions.includeLowercase && !/[a-z]/.test(password)) meetsRequirements = false;
  if (genOptions.includeNumbers && !/[0-9]/.test(password)) meetsRequirements = false;
  if (genOptions.includeSpecialChars && !/[^A-Za-z0-9]/.test(password)) meetsRequirements = false;
  
  // If password doesn't meet requirements, generate a new one
  if (!meetsRequirements) {
    return generateSecurePassword(options);
  }
  
  return password;
}

/**
 * Checks if a URL is safe (not a known malicious domain)
 * @param {string} url - URL to check
 * @returns {boolean} - Whether the URL is safe
 */
function isSafeUrl(url) {
  // Simple implementation - in a real-world scenario, this would check against
  // a database of known malicious domains or use an API
  
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Check for common phishing indicators
    const suspiciousTerms = [
      'secure', 'login', 'signin', 'account', 'banking', 'update', 'verify',
      'paypal', 'apple', 'microsoft', 'google', 'facebook', 'amazon'
    ];
    
    // Check for suspicious TLDs
    const suspiciousTlds = [
      '.xyz', '.top', '.club', '.work', '.info', '.site'
    ];
    
    // Check for IP address as hostname
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return false;
    }
    
    // Check for suspicious terms in hostname
    for (const term of suspiciousTerms) {
      if (hostname.includes(term) && hostname !== term + '.com') {
        return false;
      }
    }
    
    // Check for suspicious TLDs
    for (const tld of suspiciousTlds) {
      if (hostname.endsWith(tld)) {
        return false;
      }
    }
    
    // Check for excessive subdomains
    if (hostname.split('.').length > 4) {
      return false;
    }
    
    return true;
  } catch (e) {
    // Invalid URL
    return false;
  }
}

/**
 * Creates a Content Security Policy (CSP) header
 * @param {Object} options - CSP options
 * @returns {string} - CSP header value
 */
function createCSP(options = {}) {
  // Default options
  const defaultOptions = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    reportUri: '',
    reportOnly: false
  };
  
  // Merge options with defaults
  const cspOptions = { ...defaultOptions, ...options };
  
  // Build CSP directives
  const directives = [];
  
  // Add each directive
  for (const [directive, sources] of Object.entries(cspOptions)) {
    // Skip reportOnly and reportUri
    if (directive === 'reportOnly' || directive === 'reportUri') {
      continue;
    }
    
    // Convert camelCase to kebab-case
    const kebabDirective = directive.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    
    // Add directive if sources is an array
    if (Array.isArray(sources) && sources.length > 0) {
      directives.push(`${kebabDirective} ${sources.join(' ')}`);
    }
  }
  
  // Add report-uri if specified
  if (cspOptions.reportUri) {
    directives.push(`report-uri ${cspOptions.reportUri}`);
  }
  
  // Join directives with semicolons
  return directives.join('; ');
}

module.exports = {
  scanForVulnerabilities,
  sanitizeInput,
  sanitizeHtml,
  sanitizeSql,
  sanitizeJs,
  sanitizeUrl,
  sanitizeShell,
  sanitizeCss,
  escapeHtml,
  validatePassword,
  generateSecurePassword,
  isSafeUrl,
  createCSP
};
