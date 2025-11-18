### Supabase Authentication Mocking for Development

For development purposes, authentication is mocked using a hardcoded user ID. This allows for easier testing without needing to set up real authentication flows.

Use the following code snippet in your API route handlers to mock authentication:

```typescript
// ========================================
// AUTHENTICATION (MOCK FOR DEVELOPMENT)
// ========================================

// TODO: Production - Uncomment this block for real authentication
// const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();
// if (authError || !user) {
//   return new Response(
//     JSON.stringify({
//       error: "Unauthorized",
//       message: "Authentication required"
//     }),
//     {
//       status: 401,
//       headers: { "Content-Type": "application/json" }
//     }
//   );
// }
// const userId = user.id;

// MOCK: Remove this in production
const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";
```
