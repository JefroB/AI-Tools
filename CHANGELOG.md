# Changelog

All notable changes to the AI-Tools project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to the custom versioning system described in [VERSIONING.md](./docs/VERSIONING.md).

## [25.091.C.1002] - 2025-04-01

### Added
- **Contextual Usage Tracking System**
  - Enhanced Tool Usage Tracker with script execution context tracking
  - Context Collector for detailed error context capture
  - Smart Recovery with retry, fallback, and circuit breaker patterns
  - Adaptive prompting based on failure patterns
  - Comprehensive documentation in CONTEXTUAL-USAGE-TRACKING.md

## [25.091.C.1001] - 2025-04-01

### Added
- **Tool Usage Tracking System**
  - Function call tracking via proxy wrappers
  - Token savings estimation for each tool use
  - Cross-referencing with Claude token usage
  - Comprehensive analysis reports
  - Tool usage visualization
  - Performance bottleneck identification
  - Error-prone tool detection
  - Adaptive sampling for high-volume applications
  - Batch logging for efficiency
  - Documentation in [TOOL_USAGE_TRACKING.md](./docs/TOOL_USAGE_TRACKING.md)

### Changed
- **External API Integration Documentation**
  - Clarified that the code examples in the README.md are specifically for Jira integration
  - Added explicit instructions for creating custom rules and tools for other APIs
  - Emphasized that the AI-Tools toolkit is designed to grow and expand with usage
  - Updated documentation to better explain the integration patterns

### Fixed
- Fixed minor typos in documentation
- Improved code examples for clarity

## [25.090.C.1000] - 2025-03-31

### Added
- Initial release of version C
- Attribution and API Integration features
- User Preferences system
- Tool Usage Analyzer
- Security Scanning utilities
- UI Testing capabilities

## [25.060.B.9000] - 2025-03-01

### Added
- Version B major release
- Memoization utilities
- Token optimization features
- Metrics collection system
- Caching improvements

## [25.001.A.1000] - 2025-01-01

### Added
- Initial release of AI-Tools
- Enhanced file operations
- Enhanced directory operations
- Context-aware reading & summarization
- Code-specific operations
- Execution & validation utilities
- Project & dependency management
- Schema validation
