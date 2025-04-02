# AI-Powered Code Review System

The AI-Powered Code Review System provides automated code reviews for pull requests using Claude's advanced capabilities. This system analyzes code changes, identifies issues, and provides actionable feedback to improve code quality, security, and performance.

## Key Features

- **Automated Code Reviews**: Automatically review pull requests when they are created or updated
- **Comprehensive Analysis**: Identify issues related to code quality, security, performance, and more
- **Severity Levels**: Categorize issues by severity (critical, high, medium, low, info)
- **Email Notifications**: Receive detailed review reports via email
- **GitHub Integration**: Post summary comments on pull requests
- **Human Oversight**: Final approval remains with human reviewers

## How It Works

1. When a pull request is created or updated, the GitHub Action is triggered
2. The system extracts the diff from the pull request
3. The diff is analyzed to identify changed files and code
4. Claude generates a detailed code review based on AI-Tools rules
5. A summary comment is posted on the pull request
6. A detailed review report is sent via email
7. The human reviewer can use the provided approval link to review and approve the pull request

## Setup

### Prerequisites

- GitHub repository with Actions enabled
- SMTP server for email notifications
- GitHub token with appropriate permissions

### Configuration

1. Add the GitHub Action workflow file to your repository:

```yaml
# .github/workflows/claude-code-review.yml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  code-review:
    runs-on: ubuntu-latest
    steps:
      # ... (see the workflow file for details)
```

2. Configure the required secrets in your GitHub repository:

- `EMAIL_FROM`: Sender email address
- `EMAIL_TO`: Recipient email address
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: SMTP server port
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `SMTP_SECURE`: Whether to use TLS (true/false)

## Usage

### Automatic Reviews

Once configured, the system will automatically review pull requests when they are created or updated. No manual intervention is required.

### Manual Reviews

You can also manually trigger a review by:

1. Going to the Actions tab in your GitHub repository
2. Selecting the "Claude Code Review" workflow
3. Clicking "Run workflow"
4. Entering the pull request number
5. Clicking "Run workflow"

### Review Process

1. The system posts a summary comment on the pull request with the number of issues found and their severity levels
2. A detailed review report is sent to the configured email address
3. The email contains:
   - A summary of the issues found
   - Detailed descriptions and suggestions for each issue
   - A link to the pull request
   - Instructions for approving the pull request with Claude's comments

### Customizing Rules

You can customize which rules are enforced by modifying the `rules` object in the GitHub Action workflow:

```javascript
const rules = {
  codeQuality: true,
  security: true,
  performance: true,
  apiUsage: true,
  errorHandling: true,
  testing: true,
  documentation: true,
  codebaseSeparation: true,
  crossPlatform: true
};
```

## API Reference

### codeReviewer.initialize(config)

Initialize the code reviewer with the specified configuration.

```javascript
await codeReviewer.initialize({
  repository: {
    owner: 'your-org',
    name: 'your-repo',
    defaultBranch: 'main'
  },
  github: {
    token: process.env.GITHUB_TOKEN
  },
  email: {
    enabled: true,
    from: 'noreply@example.com',
    to: 'team@example.com',
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpUser: 'username',
    smtpPass: 'password',
    secure: false
  }
});
```

### codeReviewer.parseDiff(diff)

Parse a Git diff to extract changed files and their content.

```javascript
const changedFiles = codeReviewer.parseDiff(diff);
```

### codeReviewer.generateCodeReview(diff, options)

Generate a code review for a pull request.

```javascript
const result = await codeReviewer.generateCodeReview(diff, {
  prTitle: 'Add new feature',
  prNumber: 123,
  prUrl: 'https://github.com/your-org/your-repo/pull/123'
});
```

### codeReviewer.formatReviewComments(review)

Format review comments for GitHub.

```javascript
const comments = codeReviewer.formatReviewComments(review);
```

### codeReviewer.sendReviewEmail(options)

Send an email with the code review results.

```javascript
await codeReviewer.sendReviewEmail({
  subject: 'Code Review for PR #123',
  prTitle: 'Add new feature',
  prNumber: 123,
  prUrl: 'https://github.com/your-org/your-repo/pull/123',
  approvalUrl: 'https://github.com/your-org/your-repo/pull/123/reviews',
  review: reviewData
});
```

## Demo

A comprehensive demo is available in `code-review-demo.js` that showcases all the key features of the AI-Powered Code Review System.

To run the demo:

```bash
npm run code-review-demo
```

## Best Practices

1. **Review the AI's Feedback**: Always review Claude's suggestions before implementing them
2. **Focus on Critical Issues First**: Address critical and high-severity issues before medium and low ones
3. **Use as Part of a Broader Process**: Combine AI reviews with human reviews for best results
4. **Customize Rules**: Adjust the rules to match your project's specific needs
5. **Provide Context**: When manually triggering reviews, provide as much context as possible

## For More Information

See the demo script `code-review-demo.js` for practical examples of using the AI-Powered Code Review System.
