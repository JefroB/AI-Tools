# Contributing to AI-Tools

Thank you for your interest in contributing to the AI-Tools project! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Versioning Requirements](#versioning-requirements)
5. [Pull Request Process](#pull-request-process)
6. [Coding Standards](#coding-standards)
7. [Testing](#testing)
8. [Documentation](#documentation)

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We aim to foster an inclusive and welcoming community.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/AI-Tools.git`
3. Install dependencies: `npm install`
4. Create a new branch for your changes: `git checkout -b feature/your-feature-name`

## Development Workflow

1. Make your changes
2. Run tests: `npm test`
3. Ensure code quality: `npm run lint`
4. Update documentation as needed
5. Commit your changes (see [Commit Message Guidelines](#commit-message-guidelines))
6. Push to your fork
7. Submit a pull request

## Versioning Requirements

> **IMPORTANT: The AI-Tools project uses a mandatory versioning system.**

All contributions that affect the version number must follow the AI-Tools versioning system as described in [VERSIONING.md](./VERSIONING.md). No other versioning format is permitted.

### Version Format

```
YY.DDD.LETTER.FEATURE
```

Where:
- **YY**: Last two digits of the year
- **DDD**: Day of the year (001-366)
- **LETTER**: Alphabetic major version (A-Z, then AA-ZZ)
- **FEATURE**: Feature/build identifier (1000-9999)

### Bumping the Version

The project provides utilities to help you bump the version correctly:

```bash
# Bump build number by 1 (default)
npm run bump-version

# Bump major version (e.g., C -> D)
npm run bump-version:major

# Set feature category to documentation (5)
npm run bump-version:docs

# Set feature category to bug fix (7)
npm run bump-version:fix

# Custom bump with specific category and build number
npm run bump-version -- --category=2 --build=345
```

### Version Validation

Before submitting a pull request, validate your version:

```bash
npm run validate-version
```

This validation is automatically run as part of the pre-commit hook.

## Pull Request Process

1. Ensure your code passes all tests and linting
2. Update documentation as needed
3. Bump the version according to the versioning requirements
4. Submit your pull request with a clear description of the changes
5. Wait for review and address any feedback

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code changes that neither fix bugs nor add features
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Changes to the build process or tools

Example:
```
feat(api): add new endpoint for user authentication

This adds a new endpoint for user authentication using JWT tokens.

Closes #123
```

## Coding Standards

- Follow the existing code style
- Use meaningful variable and function names
- Write clear comments for complex logic
- Follow the Single Responsibility Principle
- Keep functions small and focused
- See [RefactoringGuidelines.md](./RefactoringGuidelines.md) for more details

## Testing

- Write tests for all new features and bug fixes
- Ensure all tests pass before submitting a pull request
- Aim for high test coverage

## Documentation

- Update documentation for all new features and changes
- Use clear and concise language
- Include examples where appropriate
- Keep the README.md up to date

Thank you for contributing to AI-Tools!
