# OpenRouter Service Implementation Plan

## Table of Contents
1. [Service Description](#service-description)
2. [Constructor Description](#constructor-description)
3. [Public Methods and Fields](#public-methods-and-fields)
4. [Private Methods and Fields](#private-methods-and-fields)
5. [Error Handling](#error-handling)
6. [Security Considerations](#security-considerations)
7. [Step-by-Step Implementation Plan](#step-by-step-implementation-plan)

---

## Service Description

The OpenRouter service provides a type-safe, production-ready interface for interacting with the OpenRouter API. OpenRouter is a unified API gateway that provides access to hundreds of AI models (OpenAI, Anthropic, Google, etc.) through a single endpoint.

### Core Responsibilities

1. **Chat Completions**: Execute LLM-based chat completions with system and user messages
2. **Structured Outputs**: Support JSON schema-based structured responses via `response_format`
3. **Model Configuration**: Configure model selection and parameters (temperature, max_tokens, etc.)
4. **Error Handling**: Gracefully handle API errors with meaningful error messages
5. **Type Safety**: Provide full TypeScript support with generics for structured outputs

### Key Features

- **Unified Interface**: Single method for both structured and unstructured completions
- **Type-Safe Responses**: Generic typing for structured outputs with JSON schema validation
- **Comprehensive Error Handling**: Map all OpenRouter error codes to user-friendly messages
- **Flexible Configuration**: Support all OpenRouter model parameters with sensible defaults
- **Environment-Based API Key**: Secure API key management via environment variables

### Integration Points

- **Recipe Modification**: Use AI to modify recipes based on dietary preferences
- **Ingredient Substitution**: Generate ingredient substitutions using AI

---

## Constructor Description

The service does not use a class-based approach. Instead, it follows the functional pattern established in the codebase (similar to `recipe.service.ts` and `profile.service.ts`). Functions receive necessary configuration as parameters.

### API Key Management

The OpenRouter API key is accessed from environment variables:

```typescript
const apiKey = import.meta.env.OPENROUTER_API_KEY;
```

**Validation:**
- Check if API key exists before making requests
- Throw descriptive error if missing
- Never expose API key in logs or error messages

---

## Public Methods and Fields

### 1. `createChatCompletion<T = string>`

Primary method for executing chat completions with OpenRouter API.

#### Signature

```typescript
export async function createChatCompletion<T = string>(
  config: ChatCompletionConfig<T>
): Promise<ChatCompletionResponse<T>>
```

#### Parameters

**`config: ChatCompletionConfig<T>`** - Configuration object with the following properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `model` | `string` | Yes | Model identifier in format `provider/model-name` (e.g., `"openai/gpt-4o"`) |
| `userMessage` | `string` | Yes | User message content to send to the model |
| `systemMessage` | `string` | No | System message to set model behavior/context |
| `responseSchema` | `JSONSchema<T>` | No | JSON schema for structured outputs. When provided, enforces response format |
| `parameters` | `ModelParameters` | No | Model configuration parameters (temperature, max_tokens, etc.) |

#### Return Value

Returns `Promise<ChatCompletionResponse<T>>`:

```typescript
interface ChatCompletionResponse<T = string> {
  content: T;           // Parsed response content (string or typed object)
  model: string;        // Model that generated the response
  usage?: {             // Token usage statistics (if available)
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

#### Type Parameter

- **`T`**: Generic type for structured response content
  - Default: `string` (for unstructured completions)
  - When using `responseSchema`, specify expected response type: `createChatCompletion<RecipeModification>(config)`

#### Usage Examples

**Example 1: Simple Unstructured Completion**

```typescript
const response = await createChatCompletion({
  model: "openai/gpt-4o",
  systemMessage: "You are a helpful cooking assistant.",
  userMessage: "What are the health benefits of salmon?",
});

console.log(response.content); // string response
```

**Example 2: Structured Completion with JSON Schema**

```typescript
interface RecipeModification {
  modifiedIngredients: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  changes: string[];
  nutritionImpact: string;
}

const response = await createChatCompletion<RecipeModification>({
  model: "openai/gpt-4o",
  systemMessage: "You are a recipe modification expert.",
  userMessage: "Make this recipe vegan: Chicken Alfredo with heavy cream",
  responseSchema: {
    name: "recipe_modification",
    strict: true,
    schema: {
      type: "object",
      properties: {
        modifiedIngredients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              amount: { type: "number" },
              unit: { type: "string" },
            },
            required: ["name", "amount", "unit"],
            additionalProperties: false,
          },
        },
        changes: {
          type: "array",
          items: { type: "string" },
        },
        nutritionImpact: { type: "string" },
      },
      required: ["modifiedIngredients", "changes", "nutritionImpact"],
      additionalProperties: false,
    },
  },
  parameters: {
    temperature: 0.7,
    max_tokens: 1000,
  },
});

// TypeScript knows response.content is RecipeModification
console.log(response.content.changes);
```

**Example 3: With Custom Model Parameters**

```typescript
const response = await createChatCompletion({
  model: "anthropic/claude-3-opus",
  systemMessage: "You are a nutritionist.",
  userMessage: "Create a 1500 calorie meal plan for weight loss",
  parameters: {
    temperature: 0.8,
    max_tokens: 2000,
    top_p: 0.9,
    frequency_penalty: 0.5,
    presence_penalty: 0.5,
  },
});
```

---

## Private Methods and Fields

### 1. `buildRequestBody`

Constructs the OpenRouter API request body from configuration.

#### Signature

```typescript
function buildRequestBody<T>(config: ChatCompletionConfig<T>): OpenRouterRequestBody
```

#### Functionality

1. Create messages array with proper role assignments
2. Add system message if provided (role: "system")
3. Add user message (role: "user")
4. Set model from config
5. Merge default parameters with provided parameters
6. Add response_format if responseSchema is provided
7. Validate parameter ranges

#### Implementation Details

```typescript
function buildRequestBody<T>(config: ChatCompletionConfig<T>): OpenRouterRequestBody {
  const messages: Message[] = [];

  // Add system message if provided
  if (config.systemMessage) {
    messages.push({
      role: "system",
      content: config.systemMessage,
    });
  }

  // Add user message (required)
  messages.push({
    role: "user",
    content: config.userMessage,
  });

  // Build base request
  const requestBody: OpenRouterRequestBody = {
    model: config.model,
    messages,
    ...getDefaultParameters(),
    ...config.parameters,
  };

  // Add response_format for structured outputs
  if (config.responseSchema) {
    requestBody.response_format = {
      type: "json_schema",
      json_schema: config.responseSchema,
    };
  }

  return requestBody;
}
```

### 2. `getDefaultParameters`

Returns default model parameters.

#### Signature

```typescript
function getDefaultParameters(): ModelParameters
```

#### Default Values

```typescript
function getDefaultParameters(): ModelParameters {
  return {
    temperature: 1.0,
    max_tokens: 1024,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  };
}
```

### 3. `parseResponse`

Parses OpenRouter API response and extracts content.

#### Signature

```typescript
function parseResponse<T>(
  rawResponse: OpenRouterAPIResponse,
  hasResponseSchema: boolean
): T
```

#### Functionality

1. Extract content from `choices[0].message.content`
2. If `hasResponseSchema` is true, parse as JSON
3. If parsing fails, throw descriptive error
4. Return typed content

#### Implementation Details

```typescript
function parseResponse<T>(
  rawResponse: OpenRouterAPIResponse,
  hasResponseSchema: boolean
): T {
  // Extract message content
  const content = rawResponse.choices?.[0]?.message?.content;

  if (!content) {
    throw new OpenRouterError(
      "No content in response",
      "EMPTY_RESPONSE",
      null,
      { response: rawResponse }
    );
  }

  // Return string content for unstructured responses
  if (!hasResponseSchema) {
    return content as T;
  }

  // Parse JSON for structured responses
  try {
    return JSON.parse(content) as T;
  } catch (error) {
    throw new OpenRouterError(
      "Failed to parse structured response as JSON",
      "JSON_PARSE_ERROR",
      null,
      { content, parseError: error }
    );
  }
}
```

### 4. `validateAPIKey`

Validates that OpenRouter API key is available.

#### Signature

```typescript
function validateAPIKey(): string
```

#### Functionality

1. Check if `OPENROUTER_API_KEY` exists in environment
2. Throw descriptive error if missing
3. Return API key if valid

#### Implementation Details

```typescript
function validateAPIKey(): string {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new OpenRouterError(
      "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in your environment variables.",
      "MISSING_API_KEY",
      null,
      null
    );
  }

  return apiKey;
}
```

### 5. `handleAPIError`

Converts fetch errors and OpenRouter API errors into `OpenRouterError` instances.

#### Signature

```typescript
function handleAPIError(error: unknown, response?: Response): never
```

#### Functionality

1. Check if error is a fetch/network error
2. Parse OpenRouter error response if available
3. Map HTTP status codes to error codes
4. Extract error metadata (moderation, provider info)
5. Create and throw `OpenRouterError` with appropriate details

#### Implementation Details

```typescript
async function handleAPIError(error: unknown, response?: Response): Promise<never> {
  // Handle network errors
  if (error instanceof TypeError) {
    throw new OpenRouterError(
      "Network error occurred while connecting to OpenRouter",
      "NETWORK_ERROR",
      null,
      { originalError: error }
    );
  }

  // Handle HTTP errors with response
  if (response && !response.ok) {
    let errorBody: OpenRouterErrorResponse | null = null;

    try {
      errorBody = await response.json();
    } catch {
      // Failed to parse error response
    }

    const errorMessage = errorBody?.error?.message || response.statusText;
    const errorCode = mapStatusCodeToErrorCode(response.status);
    const metadata = errorBody?.error?.metadata;

    throw new OpenRouterError(
      errorMessage,
      errorCode,
      response.status,
      metadata
    );
  }

  // Unknown error
  throw new OpenRouterError(
    "An unknown error occurred",
    "UNKNOWN_ERROR",
    null,
    { originalError: error }
  );
}
```

### 6. `mapStatusCodeToErrorCode`

Maps HTTP status codes to internal error codes.

#### Signature

```typescript
function mapStatusCodeToErrorCode(status: number): string
```

#### Status Code Mapping

```typescript
function mapStatusCodeToErrorCode(status: number): string {
  const statusMap: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    402: "INSUFFICIENT_CREDITS",
    403: "MODERATION_FLAGGED",
    408: "REQUEST_TIMEOUT",
    429: "RATE_LIMIT_EXCEEDED",
    502: "MODEL_UNAVAILABLE",
    503: "SERVICE_UNAVAILABLE",
  };

  return statusMap[status] || "UNKNOWN_ERROR";
}
```

---

## Error Handling

### Custom Error Class: `OpenRouterError`

Extends the standard `Error` class with OpenRouter-specific context.

#### Class Definition

```typescript
export class OpenRouterError extends Error {
  public readonly code: string;
  public readonly statusCode: number | null;
  public readonly metadata: Record<string, unknown> | null;

  constructor(
    message: string,
    code: string,
    statusCode: number | null = null,
    metadata: Record<string, unknown> | null = null
  ) {
    super(message);
    this.name = "OpenRouterError";
    this.code = code;
    this.statusCode = statusCode;
    this.metadata = metadata;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OpenRouterError);
    }
  }
}
```

### Error Codes and Scenarios

#### 1. Configuration Errors

| Error Code | HTTP Status | Scenario | User-Friendly Message |
|------------|-------------|----------|----------------------|
| `MISSING_API_KEY` | - | API key not in environment | "OpenRouter API key is not configured" |
| `INVALID_CONFIG` | - | Missing required config fields | "Invalid configuration: [details]" |
| `INVALID_PARAMETERS` | - | Parameter out of range | "Invalid parameter [name]: [reason]" |

#### 2. Authentication Errors

| Error Code | HTTP Status | Scenario | User-Friendly Message |
|------------|-------------|----------|----------------------|
| `UNAUTHORIZED` | 401 | Invalid/expired API key | "Invalid or expired OpenRouter API key" |

#### 3. Payment Errors

| Error Code | HTTP Status | Scenario | User-Friendly Message |
|------------|-------------|----------|----------------------|
| `INSUFFICIENT_CREDITS` | 402 | Account has no credits | "Insufficient credits on OpenRouter account" |

#### 4. Content Moderation Errors

| Error Code | HTTP Status | Scenario | User-Friendly Message |
|------------|-------------|----------|----------------------|
| `MODERATION_FLAGGED` | 403 | Content flagged by provider | "Content was flagged by moderation system" |

**Metadata includes:**
- `reasons`: Array of flagging reasons
- `flagged_input`: First 100 chars of problematic content
- `provider_name`: Provider that flagged content

#### 5. Request Errors

| Error Code | HTTP Status | Scenario | User-Friendly Message |
|------------|-------------|----------|----------------------|
| `BAD_REQUEST` | 400 | Invalid request parameters | "Invalid request: [details]" |
| `REQUEST_TIMEOUT` | 408 | Request exceeded time limit | "Request timed out" |

#### 6. Rate Limiting Errors

| Error Code | HTTP Status | Scenario | User-Friendly Message |
|------------|-------------|----------|----------------------|
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | "Rate limit exceeded. Please try again later." |

#### 7. Service Availability Errors

| Error Code | HTTP Status | Scenario | User-Friendly Message |
|------------|-------------|----------|----------------------|
| `MODEL_UNAVAILABLE` | 502 | Model not available | "Model is currently unavailable" |
| `SERVICE_UNAVAILABLE` | 503 | No provider available | "Service temporarily unavailable" |

#### 8. Response Parsing Errors

| Error Code | HTTP Status | Scenario | User-Friendly Message |
|------------|-------------|----------|----------------------|
| `EMPTY_RESPONSE` | 200 | No content in response | "No content received from model" |
| `JSON_PARSE_ERROR` | 200 | Invalid JSON in structured response | "Failed to parse response as JSON" |

#### 9. Network Errors

| Error Code | HTTP Status | Scenario | User-Friendly Message |
|------------|-------------|----------|----------------------|
| `NETWORK_ERROR` | - | Connection failed | "Network error occurred" |
| `UNKNOWN_ERROR` | - | Unexpected error | "An unexpected error occurred" |

### Error Handling Best Practices

1. **Early Returns**: Validate configuration before making API requests
2. **Try-Catch Blocks**: Wrap all API calls and parsing operations
3. **Descriptive Messages**: Include context in error messages
4. **Preserve Original Errors**: Store original error in metadata
5. **Don't Expose Secrets**: Never include API key in error messages
6. **Log for Debugging**: Log full error details server-side
7. **User-Friendly Messages**: Return simplified messages to clients

### Error Handling in Calling Code

```typescript
try {
  const response = await createChatCompletion({
    model: "openai/gpt-4o",
    userMessage: "Hello!",
  });

  return { success: true, data: response.content };
} catch (error) {
  if (error instanceof OpenRouterError) {
    // Handle specific error codes
    switch (error.code) {
      case "INSUFFICIENT_CREDITS":
        return { success: false, error: "Please add credits to your account" };
      case "RATE_LIMIT_EXCEEDED":
        return { success: false, error: "Too many requests. Please wait." };
      case "MODERATION_FLAGGED":
        return { success: false, error: "Content violated usage policies" };
      default:
        return { success: false, error: error.message };
    }
  }

  // Unknown error
  console.error("Unexpected error:", error);
  return { success: false, error: "An unexpected error occurred" };
}
```

---

## Security Considerations

### 1. API Key Management

**Risk**: Exposed API key can lead to unauthorized usage and charges.

**Mitigation:**
1. Store API key in environment variables only
2. Never commit API key to version control
3. Use `.env` file locally (gitignored)
4. Use secure environment variable management in production
5. Never log or expose API key in error messages
6. Validate API key exists before making requests

**Example:**

```typescript
// ✅ GOOD: Load from environment
const apiKey = import.meta.env.OPENROUTER_API_KEY;

// ❌ BAD: Hardcoded in code
const apiKey = "sk-or-v1-abc123...";
```

### 2. Input Validation

**Risk**: Invalid input can cause errors, waste tokens, or bypass rate limiting.

**Mitigation:**
1. Validate all required fields are provided
2. Check parameter ranges before sending requests
3. Sanitize user input to prevent injection attacks
4. Limit message length to prevent excessive token usage
5. Use TypeScript types to enforce valid configuration

**Example:**

```typescript
function validateConfig<T>(config: ChatCompletionConfig<T>): void {
  // Required fields
  if (!config.model) {
    throw new OpenRouterError(
      "Model is required",
      "INVALID_CONFIG",
      null,
      null
    );
  }

  if (!config.userMessage) {
    throw new OpenRouterError(
      "User message is required",
      "INVALID_CONFIG",
      null,
      null
    );
  }

  // Parameter validation
  if (config.parameters) {
    const { temperature, max_tokens, top_p } = config.parameters;

    if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
      throw new OpenRouterError(
        "Temperature must be between 0 and 2",
        "INVALID_PARAMETERS",
        null,
        { parameter: "temperature", value: temperature }
      );
    }

    if (max_tokens !== undefined && max_tokens < 1) {
      throw new OpenRouterError(
        "max_tokens must be at least 1",
        "INVALID_PARAMETERS",
        null,
        { parameter: "max_tokens", value: max_tokens }
      );
    }

    if (top_p !== undefined && (top_p < 0 || top_p > 1)) {
      throw new OpenRouterError(
        "top_p must be between 0 and 1",
        "INVALID_PARAMETERS",
        null,
        { parameter: "top_p", value: top_p }
      );
    }
  }
}
```

### 3. Response Validation

**Risk**: Malformed responses can break application logic.

**Mitigation:**
1. Validate response structure before parsing
2. Use try-catch for JSON parsing
3. Check for expected fields (choices, message, content)
4. Handle empty responses gracefully
5. Validate structured outputs against schema (optional but recommended)

### 4. Rate Limiting

**Risk**: Excessive requests can lead to rate limiting or high costs.

**Mitigation:**
1. Implement client-side rate limiting if needed
2. Handle 429 errors gracefully with retry logic
3. Add exponential backoff for retries
4. Monitor token usage
5. Set reasonable max_tokens limits

**Example:**

```typescript
async function createChatCompletionWithRetry<T>(
  config: ChatCompletionConfig<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<ChatCompletionResponse<T>> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await createChatCompletion(config);
    } catch (error) {
      if (error instanceof OpenRouterError && error.code === "RATE_LIMIT_EXCEEDED") {
        lastError = error;
        const delay = baseDelay * Math.pow(2, i); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error; // Re-throw non-rate-limit errors
    }
  }

  throw lastError || new Error("Max retries exceeded");
}
```

### 5. Sensitive Data Handling

**Risk**: User data in messages could contain PII or sensitive information.

**Mitigation:**
1. Never log full message content
2. Sanitize messages before logging errors
3. Be cautious with system messages containing business logic
4. Consider data retention policies
5. Comply with privacy regulations (GDPR, CCPA)

### 6. Model Selection Security

**Risk**: Using untrusted or expensive models without validation.

**Mitigation:**
1. Maintain whitelist of approved models
2. Validate model format (provider/model-name)
3. Consider cost implications of model selection
4. Use environment variables for default model configuration

**Example:**

```typescript
const APPROVED_MODELS = [
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "anthropic/claude-3-opus",
  "anthropic/claude-3-sonnet",
] as const;

function validateModel(model: string): void {
  if (!APPROVED_MODELS.includes(model as typeof APPROVED_MODELS[number])) {
    throw new OpenRouterError(
      `Model ${model} is not approved for use`,
      "INVALID_CONFIG",
      null,
      { model, approvedModels: APPROVED_MODELS }
    );
  }
}
```

---

## Step-by-Step Implementation Plan

### Step 1: Create Type Definitions

**File:** `src/lib/services/openrouter.service.ts`

**Task:** Define all TypeScript interfaces and types for the service.

#### Actions:

1. **Define Message Type**
   ```typescript
   interface Message {
     role: "system" | "user" | "assistant";
     content: string;
   }
   ```

2. **Define Model Parameters Interface**
   ```typescript
   interface ModelParameters {
     temperature?: number;        // 0.0-2.0, default 1.0
     max_tokens?: number;         // >= 1, default 1024
     top_p?: number;              // 0.0-1.0, default 1.0
     frequency_penalty?: number;  // -2.0 to 2.0, default 0.0
     presence_penalty?: number;   // -2.0 to 2.0, default 0.0
     stop?: string[];             // Array of stop sequences
     top_k?: number;              // >= 0, default 0
     seed?: number;               // For deterministic sampling
   }
   ```

3. **Define JSON Schema Type**
   ```typescript
   interface JSONSchema<T = unknown> {
     name: string;
     strict: boolean;
     schema: {
       type: "object";
       properties: Record<string, unknown>;
       required: string[];
       additionalProperties: boolean;
       [key: string]: unknown;
     };
   }
   ```

4. **Define Chat Completion Config**
   ```typescript
   interface ChatCompletionConfig<T = string> {
     model: string;
     userMessage: string;
     systemMessage?: string;
     responseSchema?: JSONSchema<T>;
     parameters?: ModelParameters;
   }
   ```

5. **Define OpenRouter Request Body**
   ```typescript
   interface OpenRouterRequestBody {
     model: string;
     messages: Message[];
     temperature?: number;
     max_tokens?: number;
     top_p?: number;
     frequency_penalty?: number;
     presence_penalty?: number;
     stop?: string[];
     top_k?: number;
     seed?: number;
     response_format?: {
       type: "json_schema";
       json_schema: JSONSchema;
     };
   }
   ```

6. **Define OpenRouter API Response**
   ```typescript
   interface OpenRouterAPIResponse {
     id: string;
     model: string;
     choices: Array<{
       index: number;
       message: {
         role: string;
         content: string;
       };
       finish_reason: string;
     }>;
     usage?: {
       prompt_tokens: number;
       completion_tokens: number;
       total_tokens: number;
     };
   }
   ```

7. **Define OpenRouter Error Response**
   ```typescript
   interface OpenRouterErrorResponse {
     error: {
       code: number;
       message: string;
       metadata?: Record<string, unknown>;
     };
   }
   ```

8. **Define Chat Completion Response**
   ```typescript
   interface ChatCompletionResponse<T = string> {
     content: T;
     model: string;
     usage?: {
       prompt_tokens: number;
       completion_tokens: number;
       total_tokens: number;
     };
   }
   ```

**Validation Criteria:**
- All interfaces compile without errors
- Generic type `T` is properly constrained
- All optional fields are marked with `?`
- JSDoc comments added for clarity

---

### Step 2: Implement OpenRouterError Class

**File:** `src/lib/services/openrouter.service.ts`

**Task:** Create custom error class for OpenRouter-specific errors.

#### Actions:

1. **Define Error Class**
   ```typescript
   export class OpenRouterError extends Error {
     public readonly code: string;
     public readonly statusCode: number | null;
     public readonly metadata: Record<string, unknown> | null;

     constructor(
       message: string,
       code: string,
       statusCode: number | null = null,
       metadata: Record<string, unknown> | null = null
     ) {
       super(message);
       this.name = "OpenRouterError";
       this.code = code;
       this.statusCode = statusCode;
       this.metadata = metadata;

       // Maintains proper stack trace (V8 only)
       if (Error.captureStackTrace) {
         Error.captureStackTrace(this, OpenRouterError);
       }
     }
   }
   ```

**Validation Criteria:**
- Error class extends Error properly
- All properties are readonly
- Stack trace is preserved
- Can be instantiated with various parameter combinations

---

### Step 3: Implement Helper Functions

**File:** `src/lib/services/openrouter.service.ts`

**Task:** Create private helper functions for request building and validation.

#### Actions:

1. **Implement `validateAPIKey`**
   ```typescript
   function validateAPIKey(): string {
     const apiKey = import.meta.env.OPENROUTER_API_KEY;

     if (!apiKey) {
       throw new OpenRouterError(
         "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in your environment variables.",
         "MISSING_API_KEY",
         null,
         null
       );
     }

     return apiKey;
   }
   ```

2. **Implement `getDefaultParameters`**
   ```typescript
   function getDefaultParameters(): ModelParameters {
     return {
       temperature: 1.0,
       max_tokens: 1024,
       top_p: 1.0,
       frequency_penalty: 0.0,
       presence_penalty: 0.0,
     };
   }
   ```

3. **Implement `validateConfig`**
   ```typescript
   function validateConfig<T>(config: ChatCompletionConfig<T>): void {
     if (!config.model) {
       throw new OpenRouterError(
         "Model is required",
         "INVALID_CONFIG",
         null,
         { field: "model" }
       );
     }

     if (!config.userMessage) {
       throw new OpenRouterError(
         "User message is required",
         "INVALID_CONFIG",
         null,
         { field: "userMessage" }
       );
     }

     // Validate parameters if provided
     if (config.parameters) {
       validateParameters(config.parameters);
     }

     // Validate response schema if provided
     if (config.responseSchema) {
       validateResponseSchema(config.responseSchema);
     }
   }
   ```

4. **Implement `validateParameters`**
   ```typescript
   function validateParameters(params: ModelParameters): void {
     if (params.temperature !== undefined) {
       if (params.temperature < 0 || params.temperature > 2) {
         throw new OpenRouterError(
           "Temperature must be between 0 and 2",
           "INVALID_PARAMETERS",
           null,
           { parameter: "temperature", value: params.temperature }
         );
       }
     }

     if (params.max_tokens !== undefined) {
       if (params.max_tokens < 1) {
         throw new OpenRouterError(
           "max_tokens must be at least 1",
           "INVALID_PARAMETERS",
           null,
           { parameter: "max_tokens", value: params.max_tokens }
         );
       }
     }

     if (params.top_p !== undefined) {
       if (params.top_p < 0 || params.top_p > 1) {
         throw new OpenRouterError(
           "top_p must be between 0 and 1",
           "INVALID_PARAMETERS",
           null,
           { parameter: "top_p", value: params.top_p }
         );
       }
     }

     if (params.frequency_penalty !== undefined) {
       if (params.frequency_penalty < -2 || params.frequency_penalty > 2) {
         throw new OpenRouterError(
           "frequency_penalty must be between -2 and 2",
           "INVALID_PARAMETERS",
           null,
           { parameter: "frequency_penalty", value: params.frequency_penalty }
         );
       }
     }

     if (params.presence_penalty !== undefined) {
       if (params.presence_penalty < -2 || params.presence_penalty > 2) {
         throw new OpenRouterError(
           "presence_penalty must be between -2 and 2",
           "INVALID_PARAMETERS",
           null,
           { parameter: "presence_penalty", value: params.presence_penalty }
         );
       }
     }
   }
   ```

5. **Implement `validateResponseSchema`**
   ```typescript
   function validateResponseSchema(schema: JSONSchema): void {
     if (!schema.name) {
       throw new OpenRouterError(
         "Response schema must have a name",
         "INVALID_CONFIG",
         null,
         { field: "responseSchema.name" }
       );
     }

     if (typeof schema.strict !== "boolean") {
       throw new OpenRouterError(
         "Response schema must specify strict as boolean",
         "INVALID_CONFIG",
         null,
         { field: "responseSchema.strict" }
       );
     }

     if (!schema.schema || schema.schema.type !== "object") {
       throw new OpenRouterError(
         "Response schema must have a schema with type 'object'",
         "INVALID_CONFIG",
         null,
         { field: "responseSchema.schema" }
       );
     }
   }
   ```

6. **Implement `buildRequestBody`**
   ```typescript
   function buildRequestBody<T>(config: ChatCompletionConfig<T>): OpenRouterRequestBody {
     const messages: Message[] = [];

     // Add system message if provided
     if (config.systemMessage) {
       messages.push({
         role: "system",
         content: config.systemMessage,
       });
     }

     // Add user message (required)
     messages.push({
       role: "user",
       content: config.userMessage,
     });

     // Build base request with defaults and overrides
     const requestBody: OpenRouterRequestBody = {
       model: config.model,
       messages,
       ...getDefaultParameters(),
       ...config.parameters,
     };

     // Add response_format for structured outputs
     if (config.responseSchema) {
       requestBody.response_format = {
         type: "json_schema",
         json_schema: config.responseSchema,
       };
     }

     return requestBody;
   }
   ```

7. **Implement `mapStatusCodeToErrorCode`**
   ```typescript
   function mapStatusCodeToErrorCode(status: number): string {
     const statusMap: Record<number, string> = {
       400: "BAD_REQUEST",
       401: "UNAUTHORIZED",
       402: "INSUFFICIENT_CREDITS",
       403: "MODERATION_FLAGGED",
       408: "REQUEST_TIMEOUT",
       429: "RATE_LIMIT_EXCEEDED",
       502: "MODEL_UNAVAILABLE",
       503: "SERVICE_UNAVAILABLE",
     };

     return statusMap[status] || "UNKNOWN_ERROR";
   }
   ```

8. **Implement `handleAPIError`**
   ```typescript
   async function handleAPIError(error: unknown, response?: Response): Promise<never> {
     // Handle network errors
     if (error instanceof TypeError) {
       throw new OpenRouterError(
         "Network error occurred while connecting to OpenRouter",
         "NETWORK_ERROR",
         null,
         { originalError: error }
       );
     }

     // Handle HTTP errors with response
     if (response && !response.ok) {
       let errorBody: OpenRouterErrorResponse | null = null;

       try {
         errorBody = await response.json();
       } catch {
         // Failed to parse error response
       }

       const errorMessage = errorBody?.error?.message || response.statusText;
       const errorCode = mapStatusCodeToErrorCode(response.status);
       const metadata = errorBody?.error?.metadata;

       throw new OpenRouterError(
         errorMessage,
         errorCode,
         response.status,
         metadata
       );
     }

     // Unknown error
     throw new OpenRouterError(
       "An unknown error occurred",
       "UNKNOWN_ERROR",
       null,
       { originalError: error }
     );
   }
   ```

9. **Implement `parseResponse`**
   ```typescript
   function parseResponse<T>(
     rawResponse: OpenRouterAPIResponse,
     hasResponseSchema: boolean
   ): T {
     // Extract message content
     const content = rawResponse.choices?.[0]?.message?.content;

     if (!content) {
       throw new OpenRouterError(
         "No content in response",
         "EMPTY_RESPONSE",
         null,
         { response: rawResponse }
       );
     }

     // Return string content for unstructured responses
     if (!hasResponseSchema) {
       return content as T;
     }

     // Parse JSON for structured responses
     try {
       return JSON.parse(content) as T;
     } catch (error) {
       throw new OpenRouterError(
         "Failed to parse structured response as JSON",
         "JSON_PARSE_ERROR",
         null,
         { content, parseError: error }
       );
     }
   }
   ```

**Validation Criteria:**
- All functions implement early returns for error conditions
- Parameter validation covers all edge cases
- Error messages are descriptive and actionable
- Functions follow single responsibility principle

---

### Step 4: Implement Main `createChatCompletion` Function

**File:** `src/lib/services/openrouter.service.ts`

**Task:** Implement the primary public function for chat completions.

#### Actions:

1. **Implement Function**
   ```typescript
   /**
    * Create a chat completion using OpenRouter API
    * Supports both unstructured text responses and structured JSON responses via schema
    * @param config - Configuration for the chat completion
    * @returns Promise resolving to chat completion response with typed content
    * @throws OpenRouterError for API errors, configuration errors, or network errors
    */
   export async function createChatCompletion<T = string>(
     config: ChatCompletionConfig<T>
   ): Promise<ChatCompletionResponse<T>> {
     // ========================================
     // VALIDATE CONFIGURATION
     // ========================================

     validateConfig(config);
     const apiKey = validateAPIKey();

     // ========================================
     // BUILD REQUEST
     // ========================================

     const requestBody = buildRequestBody(config);
     const hasResponseSchema = !!config.responseSchema;

     // ========================================
     // MAKE API REQUEST
     // ========================================

     let response: Response;

     try {
       response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
         method: "POST",
         headers: {
           "Authorization": `Bearer ${apiKey}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify(requestBody),
       });
     } catch (error) {
       await handleAPIError(error);
     }

     // ========================================
     // HANDLE ERROR RESPONSES
     // ========================================

     if (!response.ok) {
       await handleAPIError(null, response);
     }

     // ========================================
     // PARSE RESPONSE
     // ========================================

     let rawResponse: OpenRouterAPIResponse;

     try {
       rawResponse = await response.json();
     } catch (error) {
       throw new OpenRouterError(
         "Failed to parse API response as JSON",
         "JSON_PARSE_ERROR",
         null,
         { originalError: error }
       );
     }

     // ========================================
     // EXTRACT AND PARSE CONTENT
     // ========================================

     const content = parseResponse<T>(rawResponse, hasResponseSchema);

     // ========================================
     // RETURN TYPED RESPONSE
     // ========================================

     return {
       content,
       model: rawResponse.model,
       usage: rawResponse.usage,
     };
   }
   ```

**Validation Criteria:**
- Function signature matches specification
- All error paths are handled
- Configuration is validated before making request
- Response parsing handles both structured and unstructured outputs
- Type safety is maintained with generics
- Comments clearly separate logical sections

---

### Step 5: Add JSDoc Documentation

**File:** `src/lib/services/openrouter.service.ts`

**Task:** Add comprehensive JSDoc comments to all types and functions.

#### Actions:

1. **Document All Interfaces**
   - Add description for each interface
   - Document each property with type constraints and defaults
   - Include examples where helpful

2. **Document Error Class**
   - Explain purpose and usage
   - Document all properties
   - Provide usage examples

3. **Document Public Functions**
   - Full JSDoc with `@param`, `@returns`, `@throws`
   - Include usage examples
   - Document generic type parameters

4. **Document Private Functions**
   - Brief description of purpose
   - Document parameters and return values
   - Note any side effects

**Example:**
```typescript
/**
 * Configuration for creating a chat completion
 * @template T - Type of the expected response content (string for unstructured, custom type for structured)
 */
interface ChatCompletionConfig<T = string> {
  /**
   * Model identifier in format "provider/model-name"
   * @example "openai/gpt-4o"
   * @example "anthropic/claude-3-opus"
   */
  model: string;

  /**
   * User message content to send to the model
   */
  userMessage: string;

  /**
   * Optional system message to set model behavior and context
   */
  systemMessage?: string;

  /**
   * Optional JSON schema for structured outputs
   * When provided, enforces response format and enables type-safe parsing
   */
  responseSchema?: JSONSchema<T>;

  /**
   * Optional model configuration parameters
   * Merged with defaults: { temperature: 1.0, max_tokens: 1024, top_p: 1.0, ... }
   */
  parameters?: ModelParameters;
}
```

**Validation Criteria:**
- All public APIs have complete JSDoc
- Examples are included for complex types
- Parameter constraints are documented
- Return types are clearly described

---

### Step 6: Export Types and Functions

**File:** `src/lib/services/openrouter.service.ts`

**Task:** Export public interfaces and functions for use in other parts of the application.

#### Actions:

1. **Export Public Interfaces**
   ```typescript
   export type {
     ChatCompletionConfig,
     ChatCompletionResponse,
     ModelParameters,
     JSONSchema,
   };
   ```

2. **Export Error Class**
   ```typescript
   export { OpenRouterError };
   ```

3. **Export Main Function**
   ```typescript
   export { createChatCompletion };
   ```

4. **Keep Internal Types Private**
   - Do not export: `Message`, `OpenRouterRequestBody`, `OpenRouterAPIResponse`, `OpenRouterErrorResponse`
   - These are implementation details

**Validation Criteria:**
- Only necessary types are exported
- Implementation details remain private
- TypeScript compilation succeeds
- No circular dependencies

---

### Step 7: Add Environment Variable Validation

**File:** Check if environment variable handling is already configured

**Task:** Ensure OPENROUTER_API_KEY is documented and validated.

#### Actions:

1. **Check `.env.example`**
   - Verify OPENROUTER_API_KEY is listed
   - Add comments explaining how to obtain key

2. **Update if Needed**
   ```env
   # OpenRouter API Key
   # Get your key from: https://openrouter.ai/keys
   OPENROUTER_API_KEY=your-api-key-here
   ```

3. **Update TypeScript Environment Types (if needed)**
   - Add type definition for import.meta.env
   - Ensure OPENROUTER_API_KEY is typed

**Validation Criteria:**
- `.env.example` includes OPENROUTER_API_KEY
- Environment variable is properly typed
- Validation function throws clear error if missing

---

### Step 8: Write Unit Tests (Optional but Recommended)

**File:** `src/lib/services/openrouter.service.test.ts`

**Task:** Create comprehensive unit tests for the service.

#### Test Cases:

1. **Configuration Validation Tests**
   - Missing model throws error
   - Missing user message throws error
   - Invalid temperature throws error
   - Invalid max_tokens throws error
   - Invalid top_p throws error
   - Invalid frequency_penalty throws error
   - Invalid presence_penalty throws error
   - Invalid response schema throws error

2. **Request Building Tests**
   - Builds correct messages array
   - Includes system message when provided
   - Excludes system message when not provided
   - Merges parameters with defaults
   - Adds response_format when schema provided

3. **Response Parsing Tests**
   - Parses string responses correctly
   - Parses JSON responses correctly
   - Throws error for empty responses
   - Throws error for invalid JSON
   - Returns correct usage statistics

4. **Error Handling Tests**
   - Maps 401 to UNAUTHORIZED
   - Maps 402 to INSUFFICIENT_CREDITS
   - Maps 403 to MODERATION_FLAGGED
   - Maps 429 to RATE_LIMIT_EXCEEDED
   - Maps 502 to MODEL_UNAVAILABLE
   - Maps 503 to SERVICE_UNAVAILABLE
   - Handles network errors
   - Preserves error metadata

5. **Integration Tests (with Mock)**
   - Successful unstructured completion
   - Successful structured completion
   - Error response handling
   - Network error handling

**Validation Criteria:**
- All test cases pass
- Code coverage > 80%
- Tests use mocks for API calls
- Tests are maintainable and readable

---

### Step 9: Create Usage Examples

**File:** `docs/openrouter-service-examples.md` or inline comments

**Task:** Document common usage patterns with real-world examples.

#### Examples to Include:

1. **Recipe Modification**
   ```typescript
   // Modify recipe to be vegan
   const response = await createChatCompletion<RecipeModification>({
     model: "openai/gpt-4o",
     systemMessage: "You are a recipe expert that modifies recipes based on dietary restrictions.",
     userMessage: `Modify this recipe to be vegan: ${recipeContent}`,
     responseSchema: recipeModificationSchema,
     parameters: {
       temperature: 0.7,
       max_tokens: 2000,
     },
   });
   ```

2. **Ingredient Substitution**
   ```typescript
   // Find ingredient substitution
   const response = await createChatCompletion({
     model: "openai/gpt-4o-mini",
     systemMessage: "You are a cooking assistant that suggests ingredient substitutions.",
     userMessage: `What can I use instead of ${ingredient}?`,
     parameters: {
       temperature: 0.8,
       max_tokens: 500,
     },
   });
   ```

3. **Dietary Analysis**
   ```typescript
   // Analyze recipe for allergens
   interface AllergenAnalysis {
     hasAllergens: boolean;
     allergens: string[];
     severity: "low" | "medium" | "high";
     recommendations: string[];
   }

   const response = await createChatCompletion<AllergenAnalysis>({
     model: "openai/gpt-4o",
     systemMessage: "Analyze recipes for common allergens.",
     userMessage: `Analyze this recipe for allergens: ${recipeContent}`,
     responseSchema: allergenAnalysisSchema,
   });
   ```

**Validation Criteria:**
- Examples are relevant to the application
- Examples demonstrate key features
- Examples include error handling
- Code is runnable with minimal setup

---

### Step 10: Integration with Existing Codebase

**Task:** Integrate OpenRouter service with existing application features.

#### Integration Points:

1. **Recipe Modification API Endpoint**
   - File: `src/pages/api/recipes/[id]/modify.ts`
   - Use `createChatCompletion` to modify recipes based on user preferences
   - Handle errors and return appropriate HTTP status codes

2. **Ingredient Substitution Feature**
   - File: `src/pages/api/ingredients/substitute.ts`
   - Use service to suggest substitutions
   - Cache common substitutions to reduce API calls

3. **Profile-Based Suggestions**
   - File: `src/pages/api/suggestions.ts`
   - Use user profile data to generate personalized meal suggestions
   - Combine with profile.service.ts data

#### Example Integration:

```typescript
// src/pages/api/recipes/[id]/modify.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { createChatCompletion, OpenRouterError } from "../../../lib/services/openrouter.service";
import { getRecipeById } from "../../../lib/services/recipe.service";

const modifyRequestSchema = z.object({
  modifications: z.array(z.string()),
  dietType: z.string().optional(),
});

export const POST: APIRoute = async ({ params, request, locals }) => {
  // ========================================
  // AUTHENTICATION CHECK
  // ========================================

  const { data: { session } } = await locals.supabase.auth.getSession();

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ========================================
  // VALIDATE REQUEST
  // ========================================

  let body;

  try {
    body = modifyRequestSchema.parse(await request.json());
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ========================================
  // FETCH RECIPE
  // ========================================

  const recipeId = params.id;
  const recipe = await getRecipeById(locals.supabase, recipeId);

  if (!recipe) {
    return new Response(JSON.stringify({ error: "Recipe not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ========================================
  // CALL OPENROUTER SERVICE
  // ========================================

  try {
    const response = await createChatCompletion<ModifiedRecipe>({
      model: "openai/gpt-4o",
      systemMessage: "You are a recipe expert. Modify recipes based on user requirements while maintaining taste and nutrition.",
      userMessage: `Modify this recipe with these changes: ${body.modifications.join(", ")}. Recipe: ${JSON.stringify(recipe)}`,
      responseSchema: modifiedRecipeSchema,
      parameters: {
        temperature: 0.7,
        max_tokens: 2000,
      },
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    if (error instanceof OpenRouterError) {
      // Handle specific OpenRouter errors
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code,
        }),
        {
          status: error.statusCode || 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Unknown error
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const prerender = false;
```

**Validation Criteria:**
- Service integrates with existing architecture
- Error handling follows codebase patterns
- Authentication checks are performed
- API endpoints follow REST conventions
- Response format matches existing patterns

---

### Step 11: Performance Optimization (Optional)

**Task:** Add optional performance improvements.

#### Optimizations:

1. **Request Caching**
   - Cache common requests (e.g., ingredient substitutions)
   - Use LRU cache with expiration
   - Cache key based on hash of request parameters

2. **Retry Logic**
   - Add exponential backoff for 429 errors
   - Limit max retries to avoid infinite loops
   - Make retry behavior configurable

3. **Request Batching**
   - Batch multiple similar requests if possible
   - Useful for bulk operations

4. **Token Counting**
   - Estimate token count before sending request
   - Validate against max_tokens to avoid truncation
   - Use libraries like `gpt-tokenizer` for accurate counts

**Example Retry Logic:**

```typescript
async function createChatCompletionWithRetry<T>(
  config: ChatCompletionConfig<T>,
  options: { maxRetries?: number; baseDelay?: number } = {}
): Promise<ChatCompletionResponse<T>> {
  const { maxRetries = 3, baseDelay = 1000 } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await createChatCompletion(config);
    } catch (error) {
      if (
        error instanceof OpenRouterError &&
        error.code === "RATE_LIMIT_EXCEEDED" &&
        attempt < maxRetries - 1
      ) {
        lastError = error;
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error("Max retries exceeded");
}
```

**Validation Criteria:**
- Optimizations don't compromise correctness
- Performance improvements are measurable
- Caching respects data freshness requirements
- Retry logic prevents infinite loops

---

## Final Checklist

Before considering the implementation complete, verify:

- [ ] All type definitions are complete and compile without errors
- [ ] OpenRouterError class is implemented and tested
- [ ] All helper functions are implemented with proper validation
- [ ] Main `createChatCompletion` function is implemented
- [ ] JSDoc documentation is comprehensive
- [ ] Public API is properly exported
- [ ] Environment variables are configured
- [ ] Error handling covers all scenarios
- [ ] Security considerations are addressed
- [ ] Unit tests are written and passing (if applicable)
- [ ] Usage examples are documented
- [ ] Integration with existing codebase is complete
- [ ] Code follows project style guidelines
- [ ] Linting passes without errors
- [ ] TypeScript compilation succeeds
- [ ] Manual testing with real API key succeeds
- [ ] Error messages are user-friendly
- [ ] Performance is acceptable

---

## Appendix: Model Selection Guide

### Recommended Models by Use Case

| Use Case | Recommended Model | Reasoning |
|----------|------------------|-----------|
| For all use cases for MVP purposes | `openai/gpt-4o-mini` | Cost-effective for simple tasks |

### Model Format

All models use the format: `provider/model-name`

**Examples:**
- OpenAI: `openai/gpt-4o`, `openai/gpt-4o-mini`
- Anthropic: `anthropic/claude-3-opus`, `anthropic/claude-3-sonnet`
- Google: `google/gemini-pro`
- Meta: `meta-llama/llama-3-70b`

### Structured Outputs Support

Only certain models support the `response_format` parameter with JSON schema:
- All OpenAI models (GPT-4o and later)
- Fireworks-provided models
- Check model details on openrouter.ai/models

For models without structured output support, use JSON mode:
```typescript
response_format: { type: "json_object" }
```

---

## Appendix: Testing Checklist

### Manual Testing Scenarios

1. **Happy Path - Unstructured**
   - Send simple question
   - Verify string response
   - Check response structure

2. **Happy Path - Structured**
   - Send request with JSON schema
   - Verify parsed object response
   - Validate against schema

3. **Error Cases**
   - Invalid API key (401)
   - No credits (402)
   - Moderation flagged (403)
   - Rate limiting (429)
   - Model unavailable (502)
   - Network error

4. **Edge Cases**
   - Empty user message
   - Very long user message
   - Invalid temperature
   - Invalid max_tokens
   - Malformed JSON schema
   - Model returns invalid JSON

5. **Integration Testing**
   - Test with recipe modification endpoint
   - Test with ingredient substitution endpoint
   - Test error handling in API routes
   - Test with authenticated requests

---

## Appendix: Common Pitfalls and Solutions

### Pitfall 1: Missing API Key

**Problem:** Service fails with unclear error message

**Solution:**
- Validate API key in constructor/initialization
- Provide clear error message with instructions
- Check environment variable loading

### Pitfall 2: Invalid JSON in Structured Response

**Problem:** Model returns text instead of JSON

**Solution:**
- Ensure model supports structured outputs
- Use `strict: true` in schema
- Add retry logic with clearer instructions
- Validate model against supported list

### Pitfall 3: Rate Limiting

**Problem:** Frequent 429 errors under load

**Solution:**
- Implement exponential backoff
- Add request queuing
- Use caching for common requests
- Monitor and alert on rate limits

### Pitfall 4: Token Limit Exceeded

**Problem:** Responses get truncated

**Solution:**
- Estimate tokens before sending
- Set appropriate max_tokens
- Handle truncation in response parser
- Split long requests into chunks

### Pitfall 5: Timeout Errors

**Problem:** Long-running requests timeout

**Solution:**
- Increase fetch timeout
- Use shorter max_tokens for faster responses
- Handle 408 errors gracefully
- Consider streaming for long responses

---

## Appendix: Useful Resources

- OpenRouter Documentation: https://openrouter.ai/docs
- OpenRouter Models: https://openrouter.ai/models
- OpenRouter API Keys: https://openrouter.ai/keys
- JSON Schema Reference: https://json-schema.org/
- TypeScript Generics: https://www.typescriptlang.org/docs/handbook/2/generics.html
