# API Endpoint Implementation Plan: POST /api/collections

## 1. Endpoint Overview

**Purpose**: Create a new collection for organizing recipes under the authenticated user's account.

**HTTP Method**: POST

**URL**: `/api/collections`

**Authentication**: Required (mocked userId `a85d6d6c-b7d4-4605-9cc4-3743401b67a0` for development)

**Key Features**:
- Creates a new empty collection (recipeCount: 0)
- Validates collection name (1-100 characters)
- Ensures name uniqueness per user
- Returns full collection details with generated UUID

## 2. Request Details

### HTTP Method
POST

### URL Structure
```
/api/collections
```

### Parameters
- **Required**: None in URL
- **Optional**: None

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "name": "Szybkie kolacje"
}
```

**Field Specifications**:
- `name` (string, required): Collection name
  - Minimum length: 1 character
  - Maximum length: 100 characters
  - Will be trimmed of leading/trailing whitespace
  - Must be unique per user

## 3. Used Types

### DTO Types (from `src/types.ts`)

**CreateCollectionCommand** (Request Payload):
```typescript
export interface CreateCollectionCommand {
  name: string;
}
```

**CollectionDTO** (Response):
```typescript
export interface CollectionDTO {
  id: string;
  userId: string;
  name: string;
  recipeCount: number;
  createdAt: string;
}
```

### Database Types
**DbCollectionInsert** (Database Insert):
```typescript
export type DbCollectionInsert = TablesInsert<"collections">;
```

### Zod Validation Schema (to be created)
```typescript
const CreateCollectionSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .trim()
});
```

## 4. Response Details

### Success Response (201 Created)
```json
{
  "success": true,
  "collection": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "a85d6d6c-b7d4-4605-9cc4-3743401b67a0",
    "name": "Szybkie kolacje",
    "recipeCount": 0,
    "createdAt": "2025-10-11T12:00:00Z"
  }
}
```

### Error Responses

**400 Bad Request** - Invalid name:
```json
{
  "error": "Bad Request",
  "message": "Name is required" // or "Name must be 100 characters or less"
}
```

**401 Unauthorized** - Not authenticated:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**409 Conflict** - Duplicate collection name:
```json
{
  "error": "Conflict",
  "message": "Collection with this name already exists"
}
```

**500 Internal Server Error** - Database or server error:
```json
{
  "error": "Internal Server Error",
  "message": "Failed to create collection"
}
```

## 5. Data Flow

### Request Flow
1. **Request Reception**: API route receives POST request
2. **Authentication Check**: Validate user session (mocked for development)
3. **Request Parsing**: Parse JSON body
4. **Input Validation**: Validate using Zod schema
5. **Service Call**: Pass validated data to CollectionsService
6. **Duplicate Check**: Query database for existing collection with same name for user
7. **Database Insert**: Insert new collection record
8. **Response Mapping**: Map database result to CollectionDTO
9. **Response Return**: Return 201 with collection data

### Service Layer (`CollectionsService`)
**Method**: `createCollection(userId: string, command: CreateCollectionCommand): Promise<CollectionDTO>`

**Logic**:
1. Check for duplicate collection name for the user
   - Query: `SELECT id FROM collections WHERE user_id = ? AND name = ?`
   - If exists, throw error with 409 status
2. Insert new collection
   - Auto-generate UUID for id
   - Set recipeCount to 0 (default in database)
   - Set createdAt to current timestamp
3. Return mapped CollectionDTO

### Database Interactions
**Table**: `collections`

**Insert Query** (via Supabase SDK):
```typescript
const { data, error } = await supabase
  .from('collections')
  .insert({
    user_id: userId,
    name: trimmedName
  })
  .select('id, user_id, name, created_at')
  .single();
```

**Duplicate Check Query**:
```typescript
const { data: existing } = await supabase
  .from('collections')
  .select('id')
  .eq('user_id', userId)
  .eq('name', trimmedName)
  .maybeSingle();
```

## 6. Security Considerations

### Authentication
- **Development**: Use mocked userId `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`
- **Production**: Retrieve user from `context.locals.supabase.auth.getUser()`
- Return 401 if authentication fails

### Authorization
- Users can only create collections for their own account
- User ID from session is used for the collection (no user input for userId)

### Input Validation
- Validate all input using Zod schemas
- Trim whitespace from collection names
- Enforce length constraints (1-100 characters)
- Validate JSON structure before parsing

### Data Sanitization
- Names are stored as-is in database
- XSS protection should be handled at output/rendering layer
- Use parameterized queries (Supabase SDK handles this)

### Threats and Mitigations
1. **SQL Injection**: Mitigated by Supabase prepared statements
2. **Duplicate Names**: Check uniqueness before insert
3. **XSS**: Sanitize on output, not input
4. **Mass Assignment**: Only accept `name` field
5. **CSRF**: Consider implementing CSRF tokens
6. **Rate Limiting**: Consider implementing to prevent spam

### Database Constraints
- Foreign key constraint: `collections.user_id` → `profiles.user_id` (CASCADE)
- Ensure user_id exists in profiles table (should exist due to authentication)

## 7. Error Handling

### Error Scenarios

| Error Type | Status Code | Handling Strategy |
|------------|-------------|-------------------|
| Invalid JSON | 400 | Catch JSON parse error, return user-friendly message |
| Validation failure | 400 | Return Zod validation errors with field details |
| Missing name | 400 | Return "Name is required" |
| Name too long | 400 | Return "Name must be 100 characters or less" |
| Not authenticated | 401 | Return "Authentication required" |
| Duplicate name | 409 | Return "Collection with this name already exists" |
| Database error | 500 | Log error, return generic message |
| Supabase connection error | 500 | Log error, return generic message |

### Error Logging
- Log 500-level errors to error table with:
  - userId
  - Error message
  - Stack trace
  - Request details
- Do not log 400/401/409 errors (expected user errors)

### Error Response Format
All errors follow consistent structure:
```json
{
  "error": "Error Type",
  "message": "Descriptive error message"
}
```

### Try-Catch Strategy
```typescript
try {
  // 1. Parse and validate input
  // 2. Call service method
  // 3. Return success response
} catch (error) {
  if (error instanceof ZodError) {
    return 400 with validation errors
  }
  if (error.code === 'DUPLICATE_NAME') {
    return 409 with conflict message
  }
  // Log unexpected errors
  return 500 with generic message
}
```

## 8. Performance Considerations

### Database Performance
- **Index on (user_id, name)**: Ensure composite index exists for duplicate check queries
- **Single Database Round Trip**: Combine duplicate check and insert if possible using RPC
- **Connection Pooling**: Use Supabase connection pooling

### Optimization Strategies
1. Use `maybeSingle()` instead of `select().limit(1)` for duplicate checks
2. Use `single()` for insert to get result directly
3. Minimize selected fields in queries (only what's needed)
4. Consider caching user collection names if frequently accessed

### Potential Bottlenecks
- Duplicate name check query (mitigated by index)
- Multiple database round trips (check then insert)

### Scalability
- Endpoint is lightweight (single insert)
- No N+1 query problems
- Stateless endpoint (scales horizontally)

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema
**File**: `src/pages/api/collections/index.ts` (inline) or `src/lib/schemas/collections.schema.ts` (if shared)

Create validation schema:
```typescript
const CreateCollectionSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .trim()
});
```

### Step 2: Create CollectionsService
**File**: `src/lib/services/collections.service.ts`

Implement:
- `createCollection(supabase: SupabaseClient, userId: string, command: CreateCollectionCommand): Promise<CollectionDTO>`
  - Check for duplicate name
  - Insert collection
  - Map to CollectionDTO
  - Handle errors with appropriate error codes

Export service methods.

### Step 3: Create API Route Handler
**File**: `src/pages/api/collections/index.ts`

Implement:
1. Add `export const prerender = false`
2. Implement POST handler:
   - Mock authentication (use hardcoded userId)
   - Parse request body
   - Validate with Zod schema
   - Call `CollectionsService.createCollection()`
   - Return 201 response with collection data
   - Handle errors with appropriate status codes

### Step 4: Implement Error Handling
In the POST handler:
- Wrap logic in try-catch
- Handle ZodError (400)
- Handle duplicate name error (409)
- Handle database errors (500)
- Log unexpected errors
- Return consistent error format

### Step 5: Test Duplicate Name Handling
Ensure:
- Case sensitivity is correct (default PostgreSQL is case-sensitive)
- Whitespace trimming works correctly
- Duplicate check is scoped to user (not global)

### Step 6: Verify Database Constraints
Check:
- `collections` table has `user_id` foreign key to `profiles.user_id`
- `created_at` has default value (CURRENT_TIMESTAMP)
- UUID generation works (default gen_random_uuid())

### Step 7: Add Response Mapping
Map database result to CollectionDTO:
- `id` → `id`
- `user_id` → `userId` (camelCase)
- `name` → `name`
- `created_at` → `createdAt` (camelCase, ISO string)
- `recipeCount` → 0 (hardcoded for new collections)

### Step 8: Manual Testing
Test scenarios:
1. ✅ Create collection with valid name
2. ❌ Create collection with missing name (400)
3. ❌ Create collection with name > 100 chars (400)
4. ❌ Create collection with duplicate name (409)
5. ✅ Create collection with whitespace (should trim)
6. ❌ Create collection without authentication (401) - test after removing mock

---

## Summary

This implementation plan provides comprehensive guidance for implementing the POST /api/collections endpoint. The plan follows the project's architectural patterns, uses existing types and services patterns, and ensures proper validation, error handling, and security.