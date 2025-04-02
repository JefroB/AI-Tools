# External API Integration Ruleset

This ruleset provides guidelines for extending the AI-Tools toolkit to integrate with external APIs. It's designed to be future-proof, allowing integration with any API regardless of its specific implementation details.

## Table of Contents

1. [General Principles](#general-principles)
2. [API Integration Framework](#api-integration-framework)
3. [Documentation References](#documentation-references)
4. [Authentication Patterns](#authentication-patterns)
5. [Rate Limiting and Throttling](#rate-limiting-and-throttling)
6. [Error Handling](#error-handling)
7. [Data Transformation](#data-transformation)
8. [Testing and Validation](#testing-and-validation)
9. [Example Implementations](#example-implementations)

## General Principles

- **Modularity**: Create separate modules for each API integration
- **Consistency**: Follow consistent patterns across different API integrations
- **Abstraction**: Abstract away API-specific details behind a clean interface
- **Documentation**: Thoroughly document all API integrations
- **Error Handling**: Implement robust error handling for all API interactions
- **Performance**: Optimize API usage through caching, batching, and throttling

## API Integration Framework

When integrating a new API, follow this framework:

1. **Create a dedicated module** for the API integration
2. **Implement core functionality**:
   - Authentication
   - Basic CRUD operations
   - Specialized operations
3. **Add optimization layers**:
   - Retry logic
   - Throttling
   - Caching/Memoization
   - Batching
4. **Implement utility functions**:
   - Reference extraction
   - Data transformation
   - Relationship mapping

## Documentation References

For each API integration, maintain references to external documentation:

1. **API Documentation**: Include links to the official API documentation
2. **Authentication Guide**: Reference the authentication documentation
3. **Rate Limiting Information**: Link to rate limiting documentation
4. **Schema Definitions**: Reference schema documentation or provide local copies
5. **Example Usage**: Link to official examples or tutorials

Example documentation reference format:

```javascript
/**
 * GitHub API Integration
 * 
 * @see Official API Documentation: https://docs.github.com/en/rest
 * @see Authentication: https://docs.github.com/en/rest/authentication
 * @see Rate Limiting: https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting
 */
```

## Authentication Patterns

Support multiple authentication methods based on the API's requirements:

1. **API Keys**: Simple key-based authentication
2. **OAuth**: Full OAuth flow with refresh tokens
3. **JWT**: JSON Web Token authentication
4. **Basic Auth**: Username/password authentication
5. **Custom**: Support for custom authentication schemes

Example implementation pattern:

```javascript
function createApiClient(config) {
  // Determine authentication method
  const authMethod = determineAuthMethod(config);
  
  // Create appropriate authenticator
  const authenticator = createAuthenticator(authMethod, config);
  
  // Create and return API client with authentication
  return createClientWithAuth(baseUrl, authenticator);
}
```

## Rate Limiting and Throttling

Implement adaptive rate limiting based on API documentation:

1. **Read limits from API responses** when available
2. **Configure default limits** based on documentation
3. **Implement backoff strategies** for rate limit errors
4. **Track usage metrics** to stay within limits

Example implementation:

```javascript
const throttledApiCall = aiTools.throttleApiCalls(
  apiClient.makeRequest,
  {
    requestsPerSecond: 5, // Based on API documentation
    burstSize: 2,
    maxQueueSize: 100,
    onThrottled: ({ queueLength, waitTime }) => {
      console.log(`Request throttled. Queue length: ${queueLength}, wait time: ${waitTime}ms`);
    }
  }
);
```

## Error Handling

Implement standardized error handling:

1. **Categorize errors** (authentication, rate limiting, server, etc.)
2. **Implement appropriate recovery strategies** for each category
3. **Provide clear error messages** with troubleshooting guidance
4. **Log detailed error information** for debugging

Example implementation:

```javascript
async function makeApiRequest(endpoint, options) {
  try {
    const response = await apiClient.request(endpoint, options);
    return response.data;
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      throw new AuthenticationError('Authentication failed', { cause: error });
    } else if (error.status === 429) {
      throw new RateLimitError('Rate limit exceeded', { cause: error });
    } else if (error.status >= 500) {
      throw new ServerError('Server error', { cause: error });
    } else {
      throw new ApiError('API request failed', { cause: error });
    }
  }
}
```

## Data Transformation

Standardize data transformation patterns:

1. **Input transformation**: Convert from toolkit format to API format
2. **Output transformation**: Convert from API format to toolkit format
3. **Schema validation**: Validate data against expected schemas
4. **Relationship mapping**: Extract and map relationships between entities

Example implementation:

```javascript
function transformApiResponse(apiResponse, options = {}) {
  // Extract the data we need
  const { id, name, attributes, relationships } = apiResponse;
  
  // Transform to our standard format
  const result = {
    id,
    name,
    properties: transformAttributes(attributes),
  };
  
  // Add relationships if requested
  if (options.includeRelationships && relationships) {
    result.relationships = transformRelationships(relationships);
  }
  
  return result;
}
```

## Testing and Validation

Guidelines for testing API integrations:

1. **Mock API responses** for unit testing
2. **Create integration tests** with API sandboxes when available
3. **Implement validation** of request/response formats
4. **Test error scenarios** and recovery mechanisms

Example test implementation:

```javascript
describe('GitHub API Integration', () => {
  // Mock the fetch function
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  
  test('should fetch repository details', async () => {
    // Mock successful response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 123, name: 'test-repo' }),
    });
    
    const repo = await githubClient.getRepository('owner', 'repo');
    
    expect(repo.id).toBe(123);
    expect(repo.name).toBe('test-repo');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/owner/repo',
      expect.objectContaining({ method: 'GET' })
    );
  });
  
  test('should handle rate limiting errors', async () => {
    // Mock rate limit response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ message: 'Rate limit exceeded' }),
    });
    
    await expect(
      githubClient.getRepository('owner', 'repo')
    ).rejects.toThrow('Rate limit exceeded');
  });
});
```

## Example Implementations

The toolkit includes example implementations for reference:

1. **Jira API**: See `examples/jira-utils-demo.js` (Note: The code examples in the README.md are specific to Jira)
2. **Generic API**: See `examples/api-utils-demo.js`

> **Important Note**: While the examples in the README.md showcase Jira integration, the AI-Tools toolkit is designed to work with any external API. The same patterns and techniques demonstrated with Jira can be applied to integrate with other APIs such as GitHub, Slack, Trello, Asana, or any other service with an API.
>
> **Users are strongly encouraged to create their own API integrations** by following the guidelines in this document and using the existing examples as templates. The toolkit is designed to be extensible, allowing you to create custom rules and tools for any API you need to work with. This approach enables the AI-Tools toolkit to grow and evolve with your specific requirements over time.
>
> By creating your own API integration modules, you can:
> - Connect to services specific to your workflow
> - Customize the behavior to match your exact needs
> - Extend the toolkit's capabilities in ways that make sense for your projects
> - Contribute back to the community with new integration patterns

When implementing a new API integration, use these examples as templates and adapt them to the specific requirements of the target API. The AI-Tools toolkit is designed to grow and expand with usage, making it easier to integrate with a wide variety of external services over time.

### Creating a New API Integration

To create a new API integration:

1. **Study the API documentation** thoroughly
2. **Create a dedicated module** for the API integration
3. **Implement authentication** based on the API's requirements
4. **Create basic CRUD operations** for the main resources
5. **Add specialized operations** for specific functionality
6. **Implement optimization layers** (retry, throttling, caching)
7. **Create utility functions** for common tasks
8. **Add comprehensive documentation** with references to official docs
9. **Write tests** for all functionality

Example structure for a new API integration:

```
src/
  apis/
    github/
      index.js           # Main entry point
      auth.js            # Authentication functionality
      repositories.js    # Repository-related operations
      issues.js          # Issue-related operations
      pulls.js           # Pull request operations
      utils.js           # Utility functions
      transformers.js    # Data transformation functions
      schemas.js         # JSON schemas for validation
```

By following this ruleset, you can create consistent, robust, and efficient integrations with any external API, while maintaining the high quality standards of the AI-Tools toolkit.
