# Claude Token Logger

A simple utility to track token usage during Claude/Cline development sessions.

## Overview

Claude Token Logger is a lightweight, browser-based tool that helps you track and analyze token usage during your development sessions with Claude or Cline. It allows you to:

- Log token usage from each development session
- Categorize sessions by task type
- Track files modified during each session
- Visualize token usage over time and by task type
- Calculate estimated costs based on current Claude pricing

## Getting Started

1. Simply open `claude-token-logger.html` in any modern web browser
2. No installation or setup required - it works right out of the box
3. All data is stored locally in your browser's localStorage

## How to Use

### Logging Token Usage

1. After each significant Claude interaction, note the token counts from the Claude UI
2. Open the Claude Token Logger
3. Fill in the form with:
   - Date (defaults to today)
   - Task type (planning, coding, debugging, etc.)
   - Task description
   - Files modified (comma-separated)
   - Prompt tokens used
   - Completion tokens used
   - Number of interactions
   - Any additional notes
4. Click "Save Token Usage"

### Viewing Reports

1. Click the "View Reports" tab
2. See summary metrics:
   - Total prompt tokens
   - Total completion tokens
   - Total tokens
   - Estimated cost
3. View charts:
   - Token usage by task type
   - Token usage over time
4. Browse recent logs in the table

### Exporting Data

1. Click the "Export Data" button in the View Reports tab
2. A JSON file will be downloaded with all your token usage data
3. This file can be used for backup or further analysis

## Finding Token Counts in Claude

To find token counts for your Claude interactions:

1. In Claude Desktop or Claude web interface, look for token information at the bottom of each message
2. Note both the prompt (input) tokens and completion (output) tokens
3. Enter these values in the Claude Token Logger

## Tips for Effective Token Tracking

1. Log consistently after each significant development session
2. Use consistent task type categorization
3. Include detailed descriptions to help identify patterns
4. Note which files were modified to correlate token usage with specific parts of your codebase
5. Export your data periodically as a backup

## Privacy

All data is stored locally in your browser's localStorage. No data is sent to any server.

## Pricing Reference (as of April 2025)

The cost estimates use the following pricing:
- Prompt tokens: $0.03 per 1,000 tokens
- Completion tokens: $0.15 per 1,000 tokens

These rates are based on Claude 3 Opus pricing as of April 2025. If pricing changes, you may need to adjust the calculations in the code.
