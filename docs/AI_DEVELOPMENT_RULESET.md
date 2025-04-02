# AI Development Ruleset

This document outlines a comprehensive set of rules and best practices for AI-assisted development. These guidelines are designed to ensure that code generated or modified by AI assistants is high-quality, maintainable, secure, and efficient.

## Table of Contents

1. [Code Quality and Maintainability](#code-quality-and-maintainability)
2. [Security Considerations](#security-considerations)
3. [Performance Optimization](#performance-optimization)
4. [API Usage Efficiency](#api-usage-efficiency)
5. [Error Handling and Resilience](#error-handling-and-resilience)
6. [Testing Requirements](#testing-requirements)
7. [Documentation Standards](#documentation-standards)
8. [Codebase Separation](#codebase-separation)
9. [Cross-Platform Development](#cross-platform-development)

## Code Quality and Maintainability

### Rule 1.1: Follow Language-Specific Style Guides
- JavaScript/TypeScript: Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Python: Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/)
- Other languages: Use the most widely accepted style guide for that language

### Rule 1.2: Use Consistent Naming Conventions
- Use descriptive, intention-revealing names
- Follow language-specific naming conventions (camelCase, snake_case, etc.)
- Be consistent with the existing codebase

### Rule 1.3: Keep Functions and Methods Small
- Functions should do one thing and do it well
- Aim for functions under 30 lines of code
- If a function is too large, refactor it into smaller functions

### Rule 1.4: Limit Function Parameters
- Functions should have 5 or fewer parameters
- Use object parameters for functions that need many parameters
- Consider using the builder pattern for complex object construction

### Rule 1.5: Avoid Deep Nesting
- Limit nesting to 3 levels or less
- Use early returns to reduce nesting
- Extract nested code into separate functions

### Rule 1.6: Use Meaningful Comments
- Comment on "why" not "what"
- Keep comments up-to-date with code changes
- Use JSDoc, docstrings, or similar for API documentation

### Rule 1.7: Follow SOLID Principles
- **S**ingle Responsibility Principle: A class should have only one reason to change
- **O**pen/Closed Principle: Open for extension, closed for modification
- **L**iskov Substitution Principle: Subtypes must be substitutable for their base types
- **I**nterface Segregation Principle: Many client-specific interfaces are better than one general-purpose interface
- **D**ependency Inversion Principle: Depend on abstractions, not concretions

### Rule 1.8: Use Version Control Best Practices
- Write clear, descriptive commit messages
- Make small, focused commits
- Use feature branches for new development

### Rule 1.9: Avoid Code Duplication
- Follow the DRY (Don't Repeat Yourself) principle
- Extract common functionality into reusable functions or classes
- Use inheritance, composition, or mixins appropriately

### Rule 1.10: Prioritize Readability
- Write code for humans, not machines
- Prioritize clarity over cleverness
- Use whitespace effectively to improve readability

## Security Considerations

### Rule 2.1: Validate All Input
- Never trust user input
- Validate input on both client and server sides
- Use type checking and schema validation

### Rule 2.2: Prevent Injection Attacks
- Use parameterized queries for database operations
- Sanitize inputs for HTML, JavaScript, SQL, and shell commands
- Use the `sanitizeInput()` function from the security utilities

### Rule 2.3: Implement Proper Authentication and Authorization
- Use established authentication libraries and frameworks
- Implement proper session management
- Follow the principle of least privilege

### Rule 2.4: Protect Sensitive Data
- Never hardcode credentials or secrets
- Use environment variables or secure configuration systems
- Encrypt sensitive data at rest and in transit

### Rule 2.5: Use Security Headers
- Implement Content Security Policy (CSP)
- Use HTTPS Strict Transport Security (HSTS)
- Set appropriate X-Content-Type-Options, X-Frame-Options, etc.

### Rule 2.6: Keep Dependencies Updated
- Regularly update dependencies to patch security vulnerabilities
- Use tools like npm audit, Dependabot, or Snyk
- Remove unused dependencies

### Rule 2.7: Implement Rate Limiting
- Protect APIs and authentication endpoints with rate limiting
- Use exponential backoff for retries
- Implement account lockout policies

### Rule 2.8: Validate File Uploads
- Restrict file types and sizes
- Scan uploaded files for malware
- Store uploaded files outside the web root

### Rule 2.9: Use CSRF Protection
- Implement CSRF tokens for state-changing operations
- Use the SameSite cookie attribute
- Validate the Origin and Referer headers

### Rule 2.10: Conduct Security Scanning
- Use the `scanForVulnerabilities()` function from the security utilities
- Run static analysis tools regularly
- Perform security code reviews

## Performance Optimization

### Rule 3.1: Optimize Database Queries
- Use indexes appropriately
- Avoid N+1 query problems
- Use query optimization techniques like eager loading

### Rule 3.2: Implement Caching
- Cache expensive operations and API responses
- Use appropriate cache invalidation strategies
- Leverage the caching utilities in AI Tools

### Rule 3.3: Minimize HTTP Requests
- Bundle and minify JavaScript and CSS
- Use image sprites or SVGs where appropriate
- Implement lazy loading for images and other resources

### Rule 3.4: Optimize Frontend Performance
- Follow web performance best practices
- Use performance measurement tools
- Optimize the critical rendering path

### Rule 3.5: Use Efficient Data Structures and Algorithms
- Choose appropriate data structures for the task
- Consider time and space complexity
- Optimize hot paths in the code

### Rule 3.6: Implement Pagination and Lazy Loading
- Paginate large data sets
- Implement infinite scrolling or "load more" functionality
- Use virtualization for long lists

### Rule 3.7: Optimize Asset Delivery
- Compress and optimize images
- Use content delivery networks (CDNs)
- Implement proper caching headers

### Rule 3.8: Minimize DOM Manipulation
- Batch DOM updates
- Use document fragments
- Consider using virtual DOM libraries

### Rule 3.9: Use Asynchronous Operations
- Don't block the main thread
- Use async/await or Promises for asynchronous operations
- Implement proper error handling for asynchronous code

### Rule 3.10: Profile and Measure Performance
- Use performance measurement tools
- Establish performance budgets
- Regularly test performance in different environments

## API Usage Efficiency

### Rule 4.1: Minimize API Calls
- Batch API requests when possible
- Use the `batchRequests()` function from the API utilities
- Cache API responses appropriately

### Rule 4.2: Implement Retry Logic
- Use exponential backoff for retries
- Handle transient failures gracefully
- Use the `retryWithBackoff()` function from the API utilities

### Rule 4.3: Respect Rate Limits
- Implement client-side throttling
- Use the `throttleApiCalls()` function from the API utilities
- Monitor API usage and adjust accordingly

### Rule 4.4: Use Efficient Data Fetching
- Request only the data you need
- Use GraphQL or similar technologies for flexible data fetching
- Implement pagination for large data sets

### Rule 4.5: Handle API Versioning
- Be aware of API versioning requirements
- Plan for API changes and deprecations
- Implement adapters for different API versions

### Rule 4.6: Implement Proper Error Handling
- Handle API errors gracefully
- Provide meaningful error messages to users
- Log API errors for debugging

### Rule 4.7: Use Webhooks When Appropriate
- Use webhooks for event-driven architectures
- Implement proper validation for webhook payloads
- Handle webhook failures gracefully

### Rule 4.8: Optimize Authentication
- Use token-based authentication
- Refresh tokens before they expire
- Implement proper token storage

### Rule 4.9: Monitor API Performance
- Track API response times
- Monitor error rates
- Use the metrics utilities to collect and analyze API performance data

### Rule 4.10: Document API Usage
- Document API endpoints and their usage
- Keep API documentation up-to-date
- Provide examples for common API operations

## Error Handling and Resilience

### Rule 5.1: Use Try-Catch Blocks Appropriately
- Catch specific exceptions rather than generic ones
- Don't catch exceptions you can't handle
- Clean up resources in finally blocks

### Rule 5.2: Provide Meaningful Error Messages
- Include context in error messages
- Make error messages actionable
- Consider the audience for error messages

### Rule 5.3: Implement Graceful Degradation
- Design systems to fail gracefully
- Provide fallbacks for critical functionality
- Communicate failures to users appropriately

### Rule 5.4: Log Errors Properly
- Include relevant context in error logs
- Use appropriate log levels
- Don't log sensitive information

### Rule 5.5: Handle Asynchronous Errors
- Use try-catch with async/await
- Handle Promise rejections
- Implement error boundaries in React applications

### Rule 5.6: Validate Function Inputs
- Check function parameters for validity
- Provide meaningful error messages for invalid inputs
- Use type checking or schema validation

### Rule 5.7: Implement Circuit Breakers
- Use circuit breakers for external service calls
- Fail fast when services are unavailable
- Implement automatic recovery

### Rule 5.8: Handle Edge Cases
- Consider boundary conditions
- Handle empty or null values appropriately
- Test with extreme inputs

### Rule 5.9: Implement Proper Error Propagation
- Decide whether to handle or propagate errors
- Transform errors when appropriate
- Maintain the error chain for debugging

### Rule 5.10: Create Custom Error Types
- Create domain-specific error types
- Include relevant context in custom errors
- Make errors serializable for logging

## Testing Requirements

### Rule 6.1: Write Unit Tests
- Aim for high test coverage
- Test edge cases and error conditions
- Use mocking for external dependencies

### Rule 6.2: Implement Integration Tests
- Test interactions between components
- Use realistic test data
- Test error handling and edge cases

### Rule 6.3: Write End-to-End Tests
- Test critical user flows
- Use tools like Cypress, Playwright, or Selenium
- Test across different browsers and devices

### Rule 6.4: Use Test-Driven Development When Appropriate
- Write tests before implementing features
- Use tests to drive design decisions
- Refactor with confidence

### Rule 6.5: Test Performance
- Implement performance tests for critical paths
- Establish performance baselines
- Test performance under load

### Rule 6.6: Test Security
- Implement security testing
- Test for common vulnerabilities
- Use security scanning tools

### Rule 6.7: Implement Continuous Integration
- Run tests automatically on code changes
- Fix failing tests promptly
- Don't commit code that breaks tests

### Rule 6.8: Use Test Fixtures and Factories
- Create reusable test data
- Use factories for complex test objects
- Keep test data realistic

### Rule 6.9: Test Error Handling
- Test error conditions explicitly
- Verify error messages and codes
- Test recovery from errors

### Rule 6.10: Keep Tests Maintainable
- Follow the same code quality standards for tests
- Refactor tests when necessary
- Don't test implementation details

## Documentation Standards

### Rule 7.1: Document Public APIs
- Use JSDoc, docstrings, or similar for API documentation
- Include parameter and return value descriptions
- Document exceptions and error conditions

### Rule 7.2: Create README Files
- Include installation and setup instructions
- Provide usage examples
- List dependencies and requirements

### Rule 7.3: Document Architecture Decisions
- Use Architecture Decision Records (ADRs)
- Document the rationale for significant decisions
- Keep documentation up-to-date as decisions change

### Rule 7.4: Create User Documentation
- Write documentation for end users
- Include screenshots and examples
- Keep user documentation up-to-date

### Rule 7.5: Document Configuration Options
- List all configuration options
- Provide default values
- Explain the impact of each option

### Rule 7.6: Use Diagrams When Appropriate
- Create architecture diagrams
- Use sequence diagrams for complex interactions
- Keep diagrams up-to-date with code changes

### Rule 7.7: Document Database Schema
- Document database tables and relationships
- Include index information
- Document migration procedures

### Rule 7.8: Create Onboarding Documentation
- Document the development environment setup
- Create a getting started guide for new developers
- Include troubleshooting information

### Rule 7.9: Document Testing Procedures
- Explain how to run tests
- Document test coverage requirements
- Include information about test data

### Rule 7.10: Keep Documentation Close to Code
- Store documentation in the same repository as code
- Update documentation with code changes
- Use tools that generate documentation from code

## Codebase Separation

### Rule 8.1: Maintain Strict Codebase Separation
- Never mix code between utility libraries and application code
- Keep all utility functions in the appropriate library repository
- Import libraries as dependencies in application code

### Rule 8.2: Use Proper Dependency Management
- Declare dependencies explicitly in package.json or equivalent
- Use semantic versioning for dependencies
- Regularly update dependencies

### Rule 8.3: Create Clear Boundaries
- Define clear interfaces between components
- Use dependency injection to manage dependencies
- Follow the principle of least knowledge (Law of Demeter)

### Rule 8.4: Avoid Library-Specific Code in Applications
- Don't reference specific applications in library code
- Keep libraries generic and reusable
- Use configuration and options to customize library behavior

### Rule 8.5: Document Integration Points
- Clearly document how libraries should be integrated
- Provide examples of proper usage
- Document any required configuration

### Rule 8.6: Version Libraries Appropriately
- Use semantic versioning for libraries
- Document breaking changes
- Provide migration guides for major version updates

### Rule 8.7: Test Libraries Independently
- Create comprehensive tests for libraries
- Test libraries in isolation
- Don't rely on application code for library testing

### Rule 8.8: Use Feature Flags for New Functionality
- Implement feature flags for new features
- Allow gradual rollout of new functionality
- Provide fallbacks for when features are disabled

### Rule 8.9: Implement Proper Error Boundaries
- Contain errors within components
- Prevent library errors from crashing applications
- Provide meaningful error messages

### Rule 8.10: Follow the Single Responsibility Principle
- Each module should have a single responsibility
- Split large modules into smaller, focused ones
- Create cohesive libraries with clear purposes

## Cross-Platform Development

### Rule 9.1: Handle Command Line Differences
- Be aware of shell differences between Windows, macOS, and Linux
- Avoid using shell-specific features without proper fallbacks
- Test commands on all target platforms

### Rule 9.2: Avoid Using && for Command Chaining in Windows
- The `&&` operator works inconsistently in Windows command prompt (cmd.exe)
- Use alternative approaches for command chaining in Windows environments
- Consider using PowerShell for complex command sequences on Windows

### Rule 9.3: Use Cross-Platform Alternatives for Command Chaining
- Use sequential commands instead of chained commands
- Create batch/shell scripts for complex command sequences
- Use npm scripts or similar tools to abstract platform differences

### Rule 9.4: Implement Platform Detection
- Detect the operating system before executing platform-specific code
- Provide platform-specific implementations when necessary
- Use feature detection rather than platform detection when possible

### Rule 9.5: Use Path Separators Correctly
- Use path.join() or similar utilities to handle path separators
- Avoid hardcoding forward slashes (/) or backslashes (\\)
- Be aware of case sensitivity differences in file paths

### Rule 9.6: Handle Line Ending Differences
- Be aware of line ending differences (CRLF vs LF)
- Use .gitattributes to normalize line endings
- Use utilities to normalize line endings in code

### Rule 9.7: Test on All Target Platforms
- Test code on all platforms it will run on
- Use virtual machines or containers for cross-platform testing
- Implement continuous integration across multiple platforms

### Rule 9.8: Use Cross-Platform Libraries
- Prefer libraries with cross-platform support
- Check platform compatibility before adding dependencies
- Be aware of platform-specific dependencies

### Rule 9.9: Document Platform-Specific Requirements
- Clearly document any platform-specific requirements
- Provide installation instructions for each supported platform
- Document known platform-specific issues

### Rule 9.10: Use Platform-Agnostic APIs
- Use platform-agnostic APIs when available
- Abstract platform-specific code behind interfaces
- Implement adapters for platform-specific functionality
