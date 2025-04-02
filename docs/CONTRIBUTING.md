# Contributing to AI-Tools

Thank you for your interest in contributing to AI-Tools! This document outlines the guidelines and workflows we use to maintain code quality and consistency in our repository.

## Table of Contents

- [Git Workflow](#git-workflow)
  - [Branch Naming Convention](#branch-naming-convention)
  - [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
  - [Code Review Requirements](#code-review-requirements)
- [AI-Assisted Development](#ai-assisted-development)

## Git Workflow

### Branch Naming Convention

All changes to the codebase MUST be made on a dedicated branch (not directly on `master`). Branch names MUST follow this format:

```
<type>/<short-description>
```

Where `<type>` is one of:

- `feature`: For new features or functionality
- `fix`: For bug fixes
- `refactor`: For code refactoring (no new functionality)
- `docs`: For documentation changes
- `chore`: For other maintenance tasks (e.g., dependency updates, build changes)

And `<short-description>` is a brief, hyphenated description of the changes.

**Examples of valid branch names:**
- `feature/add-token-counting`
- `fix/cache-invalidation-bug`
- `refactor/prompt-truncation-logic`
- `docs/update-readme`
- `chore/update-dependencies`

### Commit Message Convention

Commit messages should be clear and descriptive, following this format:

```
<type>: <description>
```

Where `<type>` is the same as for branch names, and `<description>` is a concise description of the changes.

**Examples of valid commit messages:**
- `feat: Add token counting functionality`
- `fix: Fix cache invalidation issue`
- `refactor: Refactor prompt truncation logic`
- `docs: Update README with usage instructions`
- `chore: Update dependencies to latest versions`

For more complex changes, you can add a body to the commit message:

```
<type>: <description>

<body>
```

## Pull Request Process

1. Create a new branch following the [branch naming convention](#branch-naming-convention)
2. Make your changes on this branch
3. Commit your changes following the [commit message convention](#commit-message-convention)
4. Push your branch to the remote repository
5. Create a Pull Request (PR) from your branch to `master`
6. Wait for code review and approval
7. Once approved, merge your PR into `master`

### Code Review Requirements

**All PRs MUST be reviewed and approved by at least one team member before merging, even for the code owner.**

This requirement ensures:
- Code quality and adherence to best practices
- Knowledge sharing among team members
- Catching potential issues before they reach the main codebase

While another team member's approval is mandatory, the code owner has the final say. If there are disagreements or concerns, the code owner's decision prevails.

## AI-Assisted Development

When using AI tools (like Claude) to assist with development:

1. Each set of changes resulting from an AI-assisted task MUST be committed to a dedicated branch following our [branch naming convention](#branch-naming-convention)
2. The branch MUST be pushed to GitHub and a PR created
3. The PR MUST go through the standard code review process
4. No AI-generated code should be merged directly to `master` without review

### Automated Workflow

Our repository includes GitHub Actions workflows that automatically enforce:

1. Branch naming conventions
2. Commit message formats
3. Required reviews before merging

These workflows help maintain consistency and quality in our codebase.

## Questions?

If you have any questions about the contribution process, please reach out to the repository maintainers.
