/**
 * OpenRouter Service
 *
 * Provides a type-safe interface for interacting with the OpenRouter API.
 * Supports both unstructured text completions and structured JSON outputs via JSON schemas.
 *
 * @module openrouter.service
 *
 * @example
 * Basic usage with unstructured output:
 * ```typescript
 * import { createChatCompletion } from './openrouter.service';
 *
 * const response = await createChatCompletion({
 *   model: "openai/gpt-4o-mini",
 *   systemMessage: "You are a helpful cooking assistant.",
 *   userMessage: "What are the health benefits of salmon?",
 * });
 * console.log(response.content); // string
 * ```
 *
 * @example
 * Structured output with type safety:
 * ```typescript
 * interface RecipeModification {
 *   modifiedIngredients: Array<{ name: string; amount: number; unit: string }>;
 *   changes: string[];
 *   nutritionImpact: string;
 * }
 *
 * const response = await createChatCompletion<RecipeModification>({
 *   model: "openai/gpt-4o-mini",
 *   userMessage: "Make this recipe vegan: Chicken Alfredo with heavy cream",
 *   responseSchema: {
 *     name: "recipe_modification",
 *     strict: true,
 *     schema: {
 *       type: "object",
 *       properties: {
 *         modifiedIngredients: { type: "array", items: { ... } },
 *         changes: { type: "array", items: { type: "string" } },
 *         nutritionImpact: { type: "string" },
 *       },
 *       required: ["modifiedIngredients", "changes", "nutritionImpact"],
 *       additionalProperties: false,
 *     },
 *   },
 * });
 * // TypeScript knows response.content is RecipeModification
 * console.log(response.content.changes);
 * ```
 *
 * @example
 * Error handling:
 * ```typescript
 * import { createChatCompletion, OpenRouterError } from './openrouter.service';
 *
 * try {
 *   const response = await createChatCompletion(config);
 *   return { success: true, data: response.content };
 * } catch (error) {
 *   if (error instanceof OpenRouterError) {
 *     switch (error.code) {
 *       case "INSUFFICIENT_CREDITS":
 *         return { success: false, error: "Please add credits to your account" };
 *       case "RATE_LIMIT_EXCEEDED":
 *         return { success: false, error: "Too many requests. Please wait." };
 *       case "MODERATION_FLAGGED":
 *         return { success: false, error: "Content violated usage policies" };
 *       default:
 *         return { success: false, error: error.message };
 *     }
 *   }
 *   console.error("Unexpected error:", error);
 *   return { success: false, error: "An unexpected error occurred" };
 * }
 * ```
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Message in a chat conversation
 */
interface Message {
  /** Role of the message sender */
  role: "system" | "user" | "assistant";
  /** Content of the message */
  content: string;
}

/**
 * Model configuration parameters for chat completions
 * All parameters are optional and will be merged with defaults
 */
interface ModelParameters {
  /**
   * Sampling temperature (0.0-2.0)
   * Higher values make output more random, lower values more deterministic
   * @default 1.0
   */
  temperature?: number;

  /**
   * Maximum number of tokens to generate (>= 1)
   * @default 1024
   */
  max_tokens?: number;

  /**
   * Nucleus sampling threshold (0.0-1.0)
   * Alternative to temperature sampling
   * @default 1.0
   */
  top_p?: number;

  /**
   * Frequency penalty (-2.0 to 2.0)
   * Reduces repetition of token sequences
   * @default 0.0
   */
  frequency_penalty?: number;

  /**
   * Presence penalty (-2.0 to 2.0)
   * Encourages talking about new topics
   * @default 0.0
   */
  presence_penalty?: number;

  /**
   * Array of strings where generation should stop
   */
  stop?: string[];

  /**
   * Top-k sampling parameter (>= 0)
   * Limits vocabulary to k most likely tokens
   * @default 0
   */
  top_k?: number;

  /**
   * Random seed for deterministic sampling
   */
  seed?: number;
}

/**
 * JSON schema definition for structured outputs
 */
interface JSONSchema {
  /** Name identifier for the schema */
  name: string;
  /** Whether to enforce strict schema validation */
  strict: boolean;
  /** JSON schema object definition */
  schema: {
    /** Schema type (must be "object" for structured outputs) */
    type: "object";
    /** Object property definitions */
    properties: Record<string, unknown>;
    /** Required property names */
    required: string[];
    /** Whether to allow additional properties */
    additionalProperties: boolean;
    /** Additional schema properties */
    [key: string]: unknown;
  };
}

/**
 * Configuration for creating a chat completion
 * @template T - Type of the expected response content (string for unstructured, custom type for structured)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ChatCompletionConfig<T = string> {
  /**
   * Model identifier in format "provider/model-name"
   * @example "openai/gpt-4o"
   * @example "openai/gpt-4o-mini"
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
  responseSchema?: JSONSchema;

  /**
   * Optional model configuration parameters
   * Merged with defaults: { temperature: 1.0, max_tokens: 1024, top_p: 1.0, ... }
   */
  parameters?: ModelParameters;
}

/**
 * OpenRouter API request body structure (internal use only)
 */
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

/**
 * OpenRouter API successful response structure (internal use only)
 */
interface OpenRouterAPIResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenRouter API error response structure (internal use only)
 */
interface OpenRouterErrorResponse {
  error: {
    code: number;
    message: string;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Chat completion response with typed content
 * @template T - Type of the response content (string for unstructured, custom type for structured)
 */
interface ChatCompletionResponse<T = string> {
  /** Parsed response content (string or typed object based on responseSchema) */
  content: T;
  /** Model that generated the response */
  model: string;
  /** Token usage statistics (if available) */
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================================================
// ERROR CLASS
// ============================================================================

/**
 * Custom error class for OpenRouter-specific errors
 * Extends standard Error with additional context for debugging and handling
 *
 * Error Codes:
 * - `MISSING_API_KEY` - OpenRouter API key not configured in environment
 * - `INVALID_CONFIG` - Missing required configuration fields
 * - `INVALID_PARAMETERS` - Model parameters out of valid range
 * - `UNAUTHORIZED` (401) - Invalid or expired API key
 * - `INSUFFICIENT_CREDITS` (402) - Account has no credits
 * - `MODERATION_FLAGGED` (403) - Content flagged by moderation system
 * - `BAD_REQUEST` (400) - Invalid request parameters
 * - `REQUEST_TIMEOUT` (408) - Request exceeded time limit
 * - `RATE_LIMIT_EXCEEDED` (429) - Too many requests
 * - `MODEL_UNAVAILABLE` (502) - Model is currently unavailable
 * - `SERVICE_UNAVAILABLE` (503) - No provider available
 * - `EMPTY_RESPONSE` - No content in API response
 * - `JSON_PARSE_ERROR` - Failed to parse response as JSON
 * - `NETWORK_ERROR` - Network/connection error
 * - `UNKNOWN_ERROR` - Unexpected error
 *
 * @example
 * ```typescript
 * try {
 *   const response = await createChatCompletion(config);
 * } catch (error) {
 *   if (error instanceof OpenRouterError) {
 *     console.log(error.code); // "RATE_LIMIT_EXCEEDED"
 *     console.log(error.statusCode); // 429
 *     console.log(error.metadata); // Additional error details
 *   }
 * }
 * ```
 */
export class OpenRouterError extends Error {
  /** Error code for programmatic error handling */
  public readonly code: string;
  /** HTTP status code if available */
  public readonly statusCode: number | null;
  /** Additional error metadata from the API */
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

// ============================================================================
// HELPER FUNCTIONS (PRIVATE)
// ============================================================================

/**
 * Validates that OpenRouter API key is available in environment variables
 * @returns The API key if valid
 * @throws OpenRouterError if API key is missing
 */
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

/**
 * Returns default model parameters for chat completions
 * @returns Default parameter values
 */
function getDefaultParameters(): ModelParameters {
  return {
    temperature: 1.0,
    max_tokens: 1024,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  };
}

/**
 * Validates chat completion configuration
 * Checks required fields and parameter ranges
 * @param config - Configuration to validate
 * @throws OpenRouterError if configuration is invalid
 */
function validateConfig<T>(config: ChatCompletionConfig<T>): void {
  // Validate required fields
  if (!config.model) {
    throw new OpenRouterError("Model is required", "INVALID_CONFIG", null, { field: "model" });
  }

  if (!config.userMessage) {
    throw new OpenRouterError("User message is required", "INVALID_CONFIG", null, { field: "userMessage" });
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

/**
 * Validates model parameters are within acceptable ranges
 * @param params - Parameters to validate
 * @throws OpenRouterError if any parameter is out of range
 */
function validateParameters(params: ModelParameters): void {
  if (params.temperature !== undefined) {
    if (params.temperature < 0 || params.temperature > 2) {
      throw new OpenRouterError("Temperature must be between 0 and 2", "INVALID_PARAMETERS", null, {
        parameter: "temperature",
        value: params.temperature,
      });
    }
  }

  if (params.max_tokens !== undefined) {
    if (params.max_tokens < 1) {
      throw new OpenRouterError("max_tokens must be at least 1", "INVALID_PARAMETERS", null, {
        parameter: "max_tokens",
        value: params.max_tokens,
      });
    }
  }

  if (params.top_p !== undefined) {
    if (params.top_p < 0 || params.top_p > 1) {
      throw new OpenRouterError("top_p must be between 0 and 1", "INVALID_PARAMETERS", null, {
        parameter: "top_p",
        value: params.top_p,
      });
    }
  }

  if (params.frequency_penalty !== undefined) {
    if (params.frequency_penalty < -2 || params.frequency_penalty > 2) {
      throw new OpenRouterError("frequency_penalty must be between -2 and 2", "INVALID_PARAMETERS", null, {
        parameter: "frequency_penalty",
        value: params.frequency_penalty,
      });
    }
  }

  if (params.presence_penalty !== undefined) {
    if (params.presence_penalty < -2 || params.presence_penalty > 2) {
      throw new OpenRouterError("presence_penalty must be between -2 and 2", "INVALID_PARAMETERS", null, {
        parameter: "presence_penalty",
        value: params.presence_penalty,
      });
    }
  }
}

/**
 * Validates JSON schema structure for structured outputs
 * @param schema - Schema to validate
 * @throws OpenRouterError if schema is invalid
 */
function validateResponseSchema(schema: JSONSchema): void {
  if (!schema.name) {
    throw new OpenRouterError("Response schema must have a name", "INVALID_CONFIG", null, {
      field: "responseSchema.name",
    });
  }

  if (typeof schema.strict !== "boolean") {
    throw new OpenRouterError("Response schema must specify strict as boolean", "INVALID_CONFIG", null, {
      field: "responseSchema.strict",
    });
  }

  if (!schema.schema || schema.schema.type !== "object") {
    throw new OpenRouterError("Response schema must have a schema with type 'object'", "INVALID_CONFIG", null, {
      field: "responseSchema.schema",
    });
  }
}

/**
 * Builds OpenRouter API request body from configuration
 * Creates messages array and merges parameters with defaults
 * @param config - Chat completion configuration
 * @returns Formatted request body for OpenRouter API
 */
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

/**
 * Maps HTTP status codes to internal error codes
 * @param status - HTTP status code
 * @returns Internal error code string
 */
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

/**
 * Handles API errors and converts them to OpenRouterError instances
 * Processes both network errors and HTTP error responses
 * @param error - Original error object
 * @param response - HTTP response object (if available)
 * @throws OpenRouterError with appropriate error details
 */
async function handleAPIError(error: unknown, response?: Response): Promise<never> {
  // Handle network errors
  if (error instanceof TypeError) {
    throw new OpenRouterError("Network error occurred while connecting to OpenRouter", "NETWORK_ERROR", null, {
      originalError: error,
    });
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

    throw new OpenRouterError(errorMessage, errorCode, response.status, metadata);
  }

  // Unknown error
  throw new OpenRouterError("An unknown error occurred", "UNKNOWN_ERROR", null, { originalError: error });
}

/**
 * Parses OpenRouter API response and extracts typed content
 * Handles both string responses and JSON parsing for structured outputs
 * @param rawResponse - Raw API response
 * @param hasResponseSchema - Whether a response schema was provided
 * @returns Parsed content (string or typed object)
 * @throws OpenRouterError if response is empty or JSON parsing fails
 */
function parseResponse<T>(rawResponse: OpenRouterAPIResponse, hasResponseSchema: boolean): T {
  // Extract message content
  const content = rawResponse.choices?.[0]?.message?.content;

  if (!content) {
    throw new OpenRouterError("No content in response", "EMPTY_RESPONSE", null, { response: rawResponse });
  }

  // Return string content for unstructured responses
  if (!hasResponseSchema) {
    return content as T;
  }

  // Parse JSON for structured responses
  try {
    return JSON.parse(content) as T;
  } catch (error) {
    throw new OpenRouterError("Failed to parse structured response as JSON", "JSON_PARSE_ERROR", null, {
      content,
      parseError: error,
    });
  }
}

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Create a chat completion using OpenRouter API
 * Supports both unstructured text responses and structured JSON responses via schema
 *
 * @template T - Type of the expected response content (default: string)
 * @param config - Configuration for the chat completion
 * @returns Promise resolving to chat completion response with typed content
 * @throws OpenRouterError for API errors, configuration errors, or network errors
 *
 * @example
 * Simple unstructured completion:
 * ```typescript
 * const response = await createChatCompletion({
 *   model: "openai/gpt-4o-mini",
 *   systemMessage: "You are a helpful cooking assistant.",
 *   userMessage: "What are the health benefits of salmon?",
 * });
 * console.log(response.content); // string response
 * ```
 *
 * @example
 * Structured completion with JSON schema:
 * ```typescript
 * interface RecipeModification {
 *   modifiedIngredients: Array<{ name: string; amount: number; unit: string }>;
 *   changes: string[];
 * }
 *
 * const response = await createChatCompletion<RecipeModification>({
 *   model: "openai/gpt-4o-mini",
 *   systemMessage: "You are a recipe modification expert.",
 *   userMessage: "Make this recipe vegan: Chicken Alfredo",
 *   responseSchema: {
 *     name: "recipe_modification",
 *     strict: true,
 *     schema: {
 *       type: "object",
 *       properties: {
 *         modifiedIngredients: { type: "array", items: { ... } },
 *         changes: { type: "array", items: { type: "string" } },
 *       },
 *       required: ["modifiedIngredients", "changes"],
 *       additionalProperties: false,
 *     },
 *   },
 * });
 * console.log(response.content.changes); // TypeScript knows this is RecipeModification
 * ```
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
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    return await handleAPIError(error);
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
    throw new OpenRouterError("Failed to parse API response as JSON", "JSON_PARSE_ERROR", null, {
      originalError: error,
    });
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

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Public API Exports
 *
 * Types:
 * - ChatCompletionConfig<T> - Configuration for creating chat completions
 * - ChatCompletionResponse<T> - Response structure with typed content
 * - ModelParameters - Model configuration parameters
 * - JSONSchema - JSON schema definition for structured outputs
 *
 * Functions:
 * - createChatCompletion<T>() - Create a chat completion (exported above)
 *
 * Error Classes:
 * - OpenRouterError - Custom error class for OpenRouter errors (exported above)
 */
export type { ChatCompletionConfig, ChatCompletionResponse, ModelParameters, JSONSchema };
