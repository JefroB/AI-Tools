/**
 * Security Utilities Demo
 * 
 * This example demonstrates how to use the security utilities to scan code for
 * vulnerabilities and sanitize user inputs to prevent injection attacks.
 */

const aiTools = require('../src/index');

/**
 * Example 1: Scanning Code for Vulnerabilities
 * 
 * This example demonstrates how to scan code for common security vulnerabilities.
 */
function vulnerabilityScanExample() {
  console.log('\n=== Vulnerability Scanning Example ===');
  
  // Example 1: JavaScript code with vulnerabilities
  const jsCode = `
    // Get user input from the URL
    const userId = new URLSearchParams(window.location.search).get('userId');
    
    // SQL Injection vulnerability
    db.query("SELECT * FROM users WHERE id = '" + userId + "'");
    
    // XSS vulnerability
    document.getElementById('user-info').innerHTML = 'Welcome, ' + userId;
    
    // Insecure random number generation
    const token = Math.random().toString(36).substring(2);
    
    // Hardcoded credentials
    const apiKey = "sk_live_abcdef123456789";
    
    // Eval usage
    const userFunction = eval('(' + userInput + ')');
    
    // TODO: Implement proper input validation
  `;
  
  console.log('Scanning JavaScript code for vulnerabilities:');
  const jsResults = aiTools.scanForVulnerabilities(jsCode, 'javascript', {
    severity: 'all',
    includeRemediation: true
  });
  
  // Display the results
  console.log(`\nFound ${jsResults.length} vulnerabilities:`);
  jsResults.forEach((vuln, index) => {
    console.log(`\n${index + 1}. ${vuln.name} (${vuln.severity})`);
    console.log(`   Line ${vuln.line}: ${vuln.contextLine.trim()}`);
    console.log(`   Description: ${vuln.description}`);
    if (vuln.remediation) {
      console.log(`   Remediation: ${vuln.remediation}`);
    }
  });
  
  // Example 2: Python code with vulnerabilities
  const pythonCode = `
    # Get user input
    user_id = request.args.get('user_id')
    
    # SQL Injection vulnerability
    cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
    
    # Command Injection vulnerability
    os.system(f"ping {user_id}")
    
    # Path Traversal vulnerability
    with open(f"data/{user_id}.txt", "r") as f:
        data = f.read()
    
    # Insecure deserialization
    user_data = pickle.loads(request.data)
    
    # Insecure random
    token = random.randint(1000, 9999)
    
    # YAML unsafe load
    config = yaml.load(config_string)
  `;
  
  console.log('\nScanning Python code for vulnerabilities:');
  const pythonResults = aiTools.scanForVulnerabilities(pythonCode, 'python', {
    severity: 'high',  // Only show high severity issues
    includeRemediation: true
  });
  
  // Display the results
  console.log(`\nFound ${pythonResults.length} high severity vulnerabilities:`);
  pythonResults.forEach((vuln, index) => {
    console.log(`\n${index + 1}. ${vuln.name} (${vuln.severity})`);
    console.log(`   Line ${vuln.line}: ${vuln.contextLine.trim()}`);
    console.log(`   Description: ${vuln.description}`);
    if (vuln.remediation) {
      console.log(`   Remediation: ${vuln.remediation}`);
    }
  });
  
  // Example 3: PHP code with vulnerabilities
  const phpCode = `
    <?php
    // Get user input
    $userId = $_GET['user_id'];
    
    // SQL Injection vulnerability
    $query = "SELECT * FROM users WHERE id = '$userId'";
    $result = mysqli_query($conn, $query);
    
    // XSS vulnerability
    echo "Welcome, " . $userId;
    
    // Command Injection vulnerability
    system("ping " . $userId);
    
    // File Inclusion vulnerability
    include($_GET['page'] . ".php");
    
    // Insecure deserialization
    $userData = unserialize($_COOKIE['user_data']);
    
    // Hardcoded credentials
    $password = "super_secret_password";
    ?>
  `;
  
  console.log('\nScanning PHP code for vulnerabilities:');
  const phpResults = aiTools.scanForVulnerabilities(phpCode, 'php');
  
  // Display the results
  console.log(`\nFound ${phpResults.length} vulnerabilities:`);
  phpResults.forEach((vuln, index) => {
    console.log(`\n${index + 1}. ${vuln.name} (${vuln.severity})`);
    console.log(`   Line ${vuln.line}: ${vuln.contextLine.trim()}`);
    console.log(`   Description: ${vuln.description}`);
    if (vuln.remediation) {
      console.log(`   Remediation: ${vuln.remediation}`);
    }
  });
  
  // Example 4: Using custom rules
  console.log('\nScanning with custom vulnerability rules:');
  
  const customRules = [
    {
      name: 'Insecure JWT Verification',
      severity: 'high',
      pattern: /verify\s*\(\s*.*\s*,\s*['"]none['"]\s*\)/g,
      description: 'JWT token is being verified with the "none" algorithm, which is insecure.',
      remediation: 'Always specify the expected algorithm when verifying JWT tokens.'
    },
    {
      name: 'Potential Memory Leak',
      severity: 'medium',
      pattern: /new\s+\w+\s*\([^)]*\)(?!.*=)/g,
      description: 'Object is created but not assigned to a variable or property, potentially causing a memory leak.',
      remediation: 'Ensure all created objects are properly managed and disposed of.'
    }
  ];
  
  const codeWithCustomVulnerabilities = `
    // Insecure JWT verification
    jwt.verify(token, secret, { algorithms: ['none'] });
    
    // Potential memory leak
    new FileReader();
    
    // This is fine
    const reader = new FileReader();
  `;
  
  const customResults = aiTools.scanForVulnerabilities(
    codeWithCustomVulnerabilities,
    'javascript',
    { customRules }
  );
  
  // Display the results
  console.log(`\nFound ${customResults.length} custom vulnerabilities:`);
  customResults.forEach((vuln, index) => {
    console.log(`\n${index + 1}. ${vuln.name} (${vuln.severity})`);
    console.log(`   Line ${vuln.line}: ${vuln.contextLine.trim()}`);
    console.log(`   Description: ${vuln.description}`);
    if (vuln.remediation) {
      console.log(`   Remediation: ${vuln.remediation}`);
    }
  });
}

/**
 * Example 2: Sanitizing User Input
 * 
 * This example demonstrates how to sanitize user input to prevent injection attacks.
 */
function inputSanitizationExample() {
  console.log('\n=== Input Sanitization Example ===');
  
  // Example inputs with potential injection attacks
  const inputs = {
    html: '<script>alert("XSS Attack!")</script><img src="x" onerror="alert(\'XSS\')" />',
    sql: "Robert'); DROP TABLE Students;--",
    js: 'console.log("hello"); alert("Injected!");',
    url: 'javascript:alert("URL Injection")',
    shell: 'echo hello; rm -rf /',
    css: 'body { background: url("javascript:alert(1)") }'
  };
  
  // Sanitize each input for its respective context
  console.log('\nSanitizing inputs for different contexts:');
  
  for (const [context, input] of Object.entries(inputs)) {
    console.log(`\n${context.toUpperCase()} Input:`);
    console.log(`Original: ${input}`);
    
    const sanitized = aiTools.sanitizeInput(input, context);
    console.log(`Sanitized: ${sanitized}`);
  }
  
  // Example: HTML sanitization with custom options
  console.log('\nHTML sanitization with custom options:');
  
  const htmlInput = '<div class="user-content"><script>alert("XSS")</script><p>Hello <b>World</b>!</p><img src="x" onerror="alert(\'XSS\')" /></div>';
  console.log(`Original: ${htmlInput}`);
  
  // Allow only specific tags and attributes
  const customSanitized = aiTools.sanitizeInput(htmlInput, 'html', {
    allowedTags: ['p', 'b', 'i', 'u', 'a'],
    allowedAttributes: {
      'a': ['href', 'title']
    },
    stripComments: true
  });
  
  console.log(`Custom Sanitized: ${customSanitized}`);
  
  // Example: Escaping HTML entities
  console.log('\nEscaping HTML entities:');
  
  const htmlContent = '<p>This is <strong>HTML</strong> content with <script>alert("danger")</script></p>';
  console.log(`Original: ${htmlContent}`);
  
  const escaped = aiTools.sanitizeInput(htmlContent, 'html', {
    allowedTags: [] // Strip all tags
  });
  
  console.log(`Escaped: ${escaped}`);
}

/**
 * Example 3: Password Validation and Generation
 * 
 * This example demonstrates how to validate and generate secure passwords.
 */
function passwordSecurityExample() {
  console.log('\n=== Password Security Example ===');
  
  // Example 1: Validating passwords
  console.log('\nValidating passwords:');
  
  const passwords = [
    'password123',
    'Password',
    'Password123',
    'Password123!',
    'aaaaaaaaaaa',
    'P@ssw0rd!'
  ];
  
  for (const password of passwords) {
    console.log(`\nPassword: ${password}`);
    
    const result = aiTools.validatePassword(password, {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxConsecutiveChars: 3
    });
    
    console.log(`Valid: ${result.valid}`);
    console.log(`Strength: ${result.strength}/100`);
    
    if (!result.valid) {
      console.log('Validation errors:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
  }
  
  // Example 2: Generating secure passwords
  console.log('\nGenerating secure passwords:');
  
  // Generate a default password
  const defaultPassword = aiTools.generateSecurePassword();
  console.log(`Default password: ${defaultPassword}`);
  
  // Generate a password with custom options
  const customPassword = aiTools.generateSecurePassword({
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSpecialChars: false,
    excludeSimilarChars: true
  });
  
  console.log(`Custom password: ${customPassword}`);
  
  // Validate the generated passwords
  console.log('\nValidating generated passwords:');
  
  const defaultResult = aiTools.validatePassword(defaultPassword);
  console.log(`Default password valid: ${defaultResult.valid}`);
  console.log(`Default password strength: ${defaultResult.strength}/100`);
  
  const customResult = aiTools.validatePassword(customPassword);
  console.log(`Custom password valid: ${customResult.valid}`);
  console.log(`Custom password strength: ${customResult.strength}/100`);
}

/**
 * Example 4: URL Safety Checking
 * 
 * This example demonstrates how to check if a URL is safe.
 */
function urlSafetyExample() {
  console.log('\n=== URL Safety Example ===');
  
  // Example URLs to check
  const urls = [
    'https://example.com',
    'https://login.example.com',
    'https://secure-paypal.phishing-site.com',
    'http://192.168.1.1/admin',
    'https://example.com/path/to/page',
    'https://very.suspicious.subdomain.example.com',
    'javascript:alert("XSS")',
    'data:text/html,<script>alert("XSS")</script>',
    'https://example.xyz/login'
  ];
  
  console.log('\nChecking URLs for safety:');
  
  for (const url of urls) {
    console.log(`\nURL: ${url}`);
    const isSafe = aiTools.isSafeUrl(url);
    console.log(`Safe: ${isSafe ? 'Yes' : 'No'}`);
  }
}

/**
 * Example 5: Content Security Policy Generation
 * 
 * This example demonstrates how to generate a Content Security Policy (CSP) header.
 */
function cspExample() {
  console.log('\n=== Content Security Policy Example ===');
  
  // Example 1: Default CSP
  console.log('\nDefault CSP:');
  const defaultCsp = aiTools.createCSP();
  console.log(defaultCsp);
  
  // Example 2: Custom CSP for a web application
  console.log('\nCustom CSP for a web application:');
  const webAppCsp = aiTools.createCSP({
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", 'https://cdn.example.com', 'https://analytics.example.com'],
    styleSrc: ["'self'", 'https://cdn.example.com', "'unsafe-inline'"],
    imgSrc: ["'self'", 'https://images.example.com', 'data:'],
    connectSrc: ["'self'", 'https://api.example.com'],
    fontSrc: ["'self'", 'https://fonts.googleapis.com'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ['https://www.youtube.com'],
    reportUri: 'https://example.com/csp-report'
  });
  
  console.log(webAppCsp);
  
  // Example 3: Strict CSP for a banking application
  console.log('\nStrict CSP for a banking application:');
  const bankingCsp = aiTools.createCSP({
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'none'"],
    frameSrc: ["'none'"],
    formAction: ["'self'"],
    baseUri: ["'none'"],
    reportUri: 'https://banking.example.com/csp-report'
  });
  
  console.log(bankingCsp);
}

/**
 * Run all examples
 */
function runAllExamples() {
  try {
    vulnerabilityScanExample();
    inputSanitizationExample();
    passwordSecurityExample();
    urlSafetyExample();
    cspExample();
    
    console.log('\nAll examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the examples
runAllExamples();
