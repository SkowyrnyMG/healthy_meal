# Authentication System - Technical Specification

## Document Overview

This document provides a comprehensive technical specification for implementing user authentication (registration, login, password recovery, logout) in the HealthyMeal application. The specification covers frontend UI architecture, backend API design, Supabase Auth integration, and migration strategy from mocked authentication to production-ready authentication system.

**Target User Stories:**
- US-001: User Registration
- US-002: User Login
- US-003: Password Recovery
- US-004: User Logout

**Technology Stack:**
- Frontend: Astro 5 (SSR), React 19, TypeScript 5, Tailwind 4, Shadcn/ui
- Backend: Astro API Routes, Supabase Auth, PostgreSQL
- Validation: Zod schemas
- Language: Polish (UI and error messages)

---

## 1. USER INTERFACE ARCHITECTURE

### 1.1 Authentication Pages Overview

The authentication flow consists of four main pages, all server-side rendered by Astro with interactive React components for forms and dynamic behavior.

#### 1.1.1 Login Page (`/auth/login`)

**Purpose:** Allow existing users to authenticate with email and password.

**Page Structure:**
- **Layout:** Centered card layout on gradient background (consistent with landing page)
- **Components:**
  - Page title: "Zaloguj się do HealthyMeal"
  - Login form (React component with client:load)
  - Link to password recovery: "Zapomniałeś hasła?"
  - Link to registration: "Nie masz konta? Zarejestruj się"
  - Optional: Social auth buttons placeholder (for future OAuth implementation)

**Form Fields:**
1. Email input
   - Type: email
   - Label: "Adres e-mail"
   - Placeholder: "twoj@email.pl"
   - Required: Yes
   - Validation: Valid email format
   - Autocomplete: "email"

2. Password input
   - Type: password with show/hide toggle
   - Label: "Hasło"
   - Placeholder: "Wprowadź hasło"
   - Required: Yes
   - Min length: 8 characters (client-side hint only, backend validates)
   - Autocomplete: "current-password"

3. Submit button
   - Text: "Zaloguj się"
   - Loading state: "Logowanie..." with spinner
   - Full width on mobile, fixed width on desktop

**Validation Rules:**
- **Email:**
  - Format validation: Must be valid email (RFC 5322 basic format)
  - Error message: "Wprowadź poprawny adres e-mail"

- **Password:**
  - Min length check (8 chars) - client-side only
  - Error message: "Hasło musi mieć co najmniej 8 znaków"

**Error Handling Scenarios:**

1. **Invalid credentials (401)**
   - Display: Alert banner above form (red background)
   - Message: "Nieprawidłowy e-mail lub hasło. Spróbuj ponownie."
   - Clear previous errors on new submission

2. **User not found (404)**
   - Display: Same as invalid credentials (security - don't reveal if user exists)
   - Message: "Nieprawidłowy e-mail lub hasło. Spróbuj ponownie."

3. **Account not verified (403)**
   - Display: Warning banner (yellow background)
   - Message: "Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę e-mail."
   - Action: Show "Wyślij ponownie link weryfikacyjny" button

4. **Network error / Server error (500)**
   - Display: Error banner (red background)
   - Message: "Wystąpił błąd serwera. Spróbuj ponownie później."

5. **Validation errors (400)**
   - Display: Field-level errors below each input
   - Clear on field change

**Success Flow:**
1. Form submission triggers loading state
2. API call to `/api/auth/login`
3. On success (200):
   - Session cookies are set automatically by Supabase
   - Client-side redirect to `/dashboard`
   - Optional: Show success toast "Zalogowano pomyślnie!"

**Accessibility:**
- Proper form labels and ARIA attributes
- Error messages announced to screen readers (aria-live)
- Keyboard navigation support
- Focus management (focus first field on mount, focus error field on validation)

**Security Considerations:**
- No password shown in plain text by default
- Rate limiting on server side (prevent brute force)
- HTTPS enforced
- No sensitive data in URL parameters

---

#### 1.1.2 Registration Page (`/auth/register`)

**Purpose:** Allow new users to create an account with email and password.

**Page Structure:**
- **Layout:** Centered card layout on gradient background
- **Components:**
  - Page title: "Utwórz konto HealthyMeal"
  - Registration form (React component with client:load)
  - Link to login: "Masz już konto? Zaloguj się"
  - Terms and privacy policy checkbox/link

**Form Fields:**
1. Email input
   - Type: email
   - Label: "Adres e-mail"
   - Placeholder: "twoj@email.pl"
   - Required: Yes
   - Validation: Valid email format, uniqueness checked server-side
   - Autocomplete: "email"

2. Password input
   - Type: password with show/hide toggle
   - Label: "Hasło"
   - Placeholder: "Minimum 8 znaków"
   - Required: Yes
   - Min length: 8 characters
   - Validation: Length, complexity (at least one letter and one number)
   - Autocomplete: "new-password"
   - Password strength indicator (weak/medium/strong)

3. Confirm Password input
   - Type: password with show/hide toggle
   - Label: "Potwierdź hasło"
   - Placeholder: "Wprowadź hasło ponownie"
   - Required: Yes
   - Validation: Must match password field
   - Autocomplete: "new-password"

4. Terms acceptance checkbox (optional for MVP)
   - Label: "Akceptuję regulamin i politykę prywatności"
   - Required: Yes (if implemented)

5. Submit button
   - Text: "Zarejestruj się"
   - Loading state: "Tworzenie konta..." with spinner
   - Full width on mobile, fixed width on desktop

**Validation Rules:**
- **Email:**
  - Format validation: Valid email (RFC 5322 basic)
  - Uniqueness: Checked server-side
  - Error messages:
    - Format: "Wprowadź poprawny adres e-mail"
    - Duplicate: "Konto z tym adresem e-mail już istnieje"

- **Password:**
  - Min length: 8 characters
  - Complexity: At least one letter AND one number
  - Error messages:
    - Length: "Hasło musi mieć co najmniej 8 znaków"
    - Complexity: "Hasło musi zawierać co najmniej jedną literę i jedną cyfrę"

- **Confirm Password:**
  - Must match password field
  - Error message: "Hasła nie są identyczne"

**Password Strength Indicator:**
- Visual bar below password field (red/yellow/green)
- Criteria:
  - Weak (red): < 8 chars or only numbers/letters
  - Medium (yellow): 8+ chars with letters and numbers
  - Strong (green): 12+ chars with letters, numbers, and special characters

**Error Handling Scenarios:**

1. **Email already exists (409)**
   - Display: Alert banner above form (red background)
   - Message: "Konto z tym adresem e-mail już istnieje. Zaloguj się lub użyj innego adresu."
   - Action: Link to login page

2. **Invalid email format (400)**
   - Display: Field-level error below email input
   - Message: "Wprowadź poprawny adres e-mail"

3. **Weak password (400)**
   - Display: Field-level error below password input
   - Message: Based on validation failure (see validation rules)

4. **Network/Server error (500)**
   - Display: Error banner (red background)
   - Message: "Wystąpił błąd serwera. Spróbuj ponownie później."

5. **Validation errors (400)**
   - Display: Field-level errors below each input
   - Clear on field change

**Success Flow:**
1. Form submission triggers loading state
2. API call to `/api/auth/register`
3. On success (201):
   - If email verification required:
     - Redirect to `/auth/verify-email` with success message
     - Message: "Konto utworzone! Sprawdź swoją skrzynkę e-mail, aby zweryfikować adres."
   - If auto-login enabled (recommended for MVP):
     - Session cookies set automatically
     - Redirect to `/dashboard` or `/profile` (onboarding)
     - Success toast: "Witaj w HealthyMeal!"

**Post-Registration Flow (US-001 Acceptance Criteria):**
- User is automatically logged in after successful registration
- User receives account creation confirmation (via email if verification enabled, or UI message)
- User is redirected to dashboard or profile completion page

**Accessibility:**
- Proper form labels and ARIA attributes
- Password strength indicator accessible via aria-live
- Error messages announced to screen readers
- Keyboard navigation support
- Focus management

**Security Considerations:**
- Password not shown in plain text by default
- Password strength requirements enforced
- Rate limiting on server side
- HTTPS enforced
- No password in URL or logs
- Email uniqueness verified server-side (not just client-side)

---

#### 1.1.3 Forgot Password Page (`/auth/forgot-password`)

**Purpose:** Allow users to initiate password reset process by providing their email.

**Page Structure:**
- **Layout:** Centered card layout on gradient background
- **Components:**
  - Page title: "Resetuj hasło"
  - Instructions: "Podaj adres e-mail powiązany z Twoim kontem. Wyślemy Ci link do resetowania hasła."
  - Email form (React component with client:load)
  - Link back to login: "Wróć do logowania"

**Form Fields:**
1. Email input
   - Type: email
   - Label: "Adres e-mail"
   - Placeholder: "twoj@email.pl"
   - Required: Yes
   - Validation: Valid email format
   - Autocomplete: "email"

2. Submit button
   - Text: "Wyślij link resetujący"
   - Loading state: "Wysyłanie..." with spinner
   - Full width on mobile, fixed width on desktop

**Validation Rules:**
- **Email:**
  - Format validation: Valid email
  - Error message: "Wprowadź poprawny adres e-mail"

**Error Handling Scenarios:**

1. **Email not found (404)**
   - Security best practice: DO NOT reveal if email exists
   - Display: Success message (same as success case)
   - Message: "Jeśli konto z tym adresem e-mail istnieje, wyślemy link do resetowania hasła."

2. **Rate limit exceeded (429)**
   - Display: Warning banner (yellow background)
   - Message: "Wysłano zbyt wiele próśb. Spróbuj ponownie za kilka minut."

3. **Network/Server error (500)**
   - Display: Error banner (red background)
   - Message: "Wystąpił błąd serwera. Spróbuj ponownie później."

**Success Flow:**
1. Form submission triggers loading state
2. API call to `/api/auth/forgot-password`
3. On success (200):
   - Display success message (replace form with message card)
   - Message: "Link do resetowania hasła został wysłany na Twój adres e-mail. Sprawdź swoją skrzynkę pocztową."
   - Note: "Jeśli nie widzisz wiadomości, sprawdź folder spam."
   - Action: "Wróć do logowania" button → `/auth/login`

**Email Content (sent by Supabase):**
- Subject: "HealthyMeal - Resetowanie hasła"
- Body: Personalized message with reset link
- Link format: `{APP_URL}/auth/reset-password?token={reset_token}`
- Link expiration: 1 hour (configurable in Supabase)

**Accessibility:**
- Clear instructions for screen readers
- Success/error messages announced
- Keyboard navigation
- Focus management

**Security Considerations:**
- Do not reveal whether email exists in system
- Rate limiting to prevent abuse
- Reset token valid for limited time only
- Token single-use only

---

#### 1.1.4 Reset Password Page (`/auth/reset-password`)

**Purpose:** Allow users to set a new password after clicking the reset link from email.

**Page Structure:**
- **Layout:** Centered card layout on gradient background
- **Components:**
  - Page title: "Ustaw nowe hasło"
  - New password form (React component with client:load)
  - Token validation (server-side before rendering form)

**Form Fields:**
1. New Password input
   - Type: password with show/hide toggle
   - Label: "Nowe hasło"
   - Placeholder: "Minimum 8 znaków"
   - Required: Yes
   - Min length: 8 characters
   - Validation: Same as registration password
   - Autocomplete: "new-password"
   - Password strength indicator

2. Confirm New Password input
   - Type: password with show/hide toggle
   - Label: "Potwierdź nowe hasło"
   - Placeholder: "Wprowadź hasło ponownie"
   - Required: Yes
   - Validation: Must match new password
   - Autocomplete: "new-password"

3. Submit button
   - Text: "Zmień hasło"
   - Loading state: "Zapisywanie..." with spinner
   - Full width on mobile, fixed width on desktop

**Validation Rules:**
- Same as registration password validation
- Password must be different from old password (optional enhancement)

**Error Handling Scenarios:**

1. **Invalid or expired token (401)**
   - Display: Error page instead of form
   - Message: "Link resetowania hasła wygasł lub jest nieprawidłowy."
   - Action: "Wyślij nowy link" button → `/auth/forgot-password`

2. **Password validation error (400)**
   - Display: Field-level errors below inputs
   - Messages: Same as registration

3. **Network/Server error (500)**
   - Display: Error banner (red background)
   - Message: "Wystąpił błąd serwera. Spróbuj ponownie później."

**Success Flow:**
1. On page load: Validate reset token server-side
2. If valid: Render form
3. Form submission triggers loading state
4. API call to `/api/auth/reset-password` with token and new password
5. On success (200):
   - Display success message (replace form)
   - Message: "Hasło zostało zmienione pomyślnie!"
   - Auto-redirect to `/auth/login` after 3 seconds
   - Or manual redirect: "Przejdź do logowania" button

**Accessibility:**
- Token validation errors clearly announced
- Password strength indicator accessible
- Success/error messages with aria-live
- Keyboard navigation
- Focus management

**Security Considerations:**
- Token validated server-side before rendering form
- Token single-use only (invalidated after use)
- Token expires after 1 hour
- New password hashed before storage
- Session invalidation after password change (user must re-login)

---

### 1.2 Changes to Existing Pages and Components

#### 1.2.1 Landing Page (`/`)

**Current State:**
- Auth buttons show alert: "Ta funkcja będzie wkrótce dostępna"

**Required Changes:**

1. **LandingHeader Component** (`src/components/landing/LandingHeader.astro`)
   - Remove JavaScript alert handler
   - Update login button behavior:
     ```astro
     <a href="/auth/login" class="button-styles">
       Zaloguj się
     </a>
     ```
   - Update register button behavior:
     ```astro
     <a href="/auth/register" class="button-styles">
       Zarejestruj się
     </a>
     ```

2. **Hero Section** (`src/components/landing/HeroSection.astro`)
   - Update primary CTA to link to `/auth/register`
   - Ensure clear call-to-action text

3. **Final CTA Section** (`src/components/landing/FinalCTASection.astro`)
   - Update CTA buttons to link to authentication pages

4. **Auth State Detection (Enhancement)**
   - Add server-side user detection in `src/pages/index.astro`
   - If user is already logged in, redirect to `/dashboard` or show "Go to Dashboard" button instead of auth buttons

**Implementation Pattern:**
```astro
---
// src/pages/index.astro
const { data: { user } } = await Astro.locals.supabase.auth.getUser();

// If user is logged in, optionally redirect or modify CTAs
if (user) {
  return Astro.redirect('/dashboard');
}
---
```

---

#### 1.2.2 AppLayout (`src/layouts/AppLayout.astro`)

**Current State:**
- Auth check commented out (TODO: Production)
- Mock user data used when no real user exists

**Required Changes:**

1. **Enable Authentication Redirect**
   - Uncomment authentication check
   - Redirect to `/auth/login` if no user session
   - Remove mock user fallback

**Updated Code Pattern:**
```astro
---
// Fetch current user from Supabase
const {
  data: { user },
  error: authError,
} = await Astro.locals.supabase.auth.getUser();

// Redirect to login if not authenticated
if (authError || !user) {
  return Astro.redirect('/auth/login');
}

// Transform Supabase user to UserInfo for AppHeader
const userInfo: UserInfo = {
  userId: user.id,
  email: user.email || "",
  displayName: user.user_metadata?.full_name || user.user_metadata?.name || null,
};
---
```

2. **Remove Mock User Data**
   - Delete lines 44-49 (mock userInfo block)

3. **User Metadata Handling**
   - Extract display name from Supabase user metadata
   - Fallback hierarchy: `full_name` → `name` → `email` (first part)

**Impact:**
- All pages using AppLayout will now require authentication
- Pages affected: `/dashboard`, `/recipes`, `/favorites`, `/collections`, `/profile`

---

#### 1.2.3 Middleware (`src/middleware/index.ts`)

**Current State:**
- Only adds Supabase client to `context.locals`
- No authentication or session management

**Required Changes:**

1. **Implement Supabase SSR Client**
   - Replace simple `supabaseClient` with `createSupabaseServerInstance()`
   - Implement proper cookie management using `getAll()` and `setAll()`

2. **Add Public Paths Configuration**
   - Define routes that don't require authentication
   - Public paths: Landing page, auth pages, auth API endpoints

3. **Add Session Refresh Logic**
   - Call `supabase.auth.getUser()` on every request
   - This refreshes session if needed

4. **Add User to Locals**
   - Store authenticated user in `context.locals.user`
   - Make user data available to all routes

**Implementation Pattern:**
```typescript
import { createSupabaseServerInstance } from '../db/supabase.client.ts';
import { defineMiddleware } from 'astro:middleware';

// Public paths - no auth required
const PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    // Create Supabase server instance with proper cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Store supabase client in locals for API routes
    locals.supabase = supabase;

    // Skip auth check for public paths
    if (PUBLIC_PATHS.includes(url.pathname)) {
      return next();
    }

    // Get user session (this also refreshes tokens if needed)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Store user in locals if authenticated
    if (user) {
      locals.user = {
        id: user.id,
        email: user.email,
      };
    } else if (!PUBLIC_PATHS.includes(url.pathname)) {
      // Redirect to login for protected routes
      return redirect('/auth/login');
    }

    return next();
  },
);
```

**Note:** This middleware pattern requires updating the Supabase client to support SSR (see Section 3.1).

---

#### 1.2.4 API Routes - Remove Mock Authentication

**Current State:**
- All API routes use hardcoded userId: `"a85d6d6c-b7d4-4605-9cc4-3743401b67a0"`
- Auth logic commented out with TODO tags

**Required Changes:**

For ALL API routes that require authentication, apply the following pattern:

1. **Remove Mock User ID**
2. **Uncomment Authentication Block**
3. **Use Real User ID**

**Files to Update:**
- `src/pages/api/profile.ts` (GET, PUT)
- `src/pages/api/recipes.ts` (GET, POST)
- `src/pages/api/recipes/[recipeId].ts` (GET, PUT, DELETE)
- `src/pages/api/recipes/[recipeId]/modifications.ts` (POST)
- `src/pages/api/modifications/[modificationId].ts` (GET, PUT)
- `src/pages/api/favorites.ts` (GET, POST)
- `src/pages/api/favorites/[recipeId].ts` (DELETE)
- `src/pages/api/collections/index.ts` (GET, POST)
- `src/pages/api/collections/[collectionId].ts` (GET, PUT, DELETE)
- `src/pages/api/collections/[collectionId]/recipes.ts` (GET, POST)
- `src/pages/api/collections/[collectionId]/recipes/[recipeId].ts` (DELETE)
- `src/pages/api/profile/allergens.ts` (GET, POST)
- `src/pages/api/profile/allergens/[id].ts` (DELETE)
- `src/pages/api/profile/disliked-ingredients.ts` (GET, POST)
- `src/pages/api/profile/disliked-ingredients/[id].ts` (DELETE)
- `src/pages/api/ingredient-substitutions.ts` (POST)

**Replacement Pattern:**

**BEFORE (Current Mock):**
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

**AFTER (Production):**
```typescript
// ========================================
// AUTHENTICATION
// ========================================

const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

if (authError || !user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Authentication required"
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" }
    }
  );
}

const userId = user.id;
```

**Public API Endpoints (No Auth Required):**
- `src/pages/api/tags.ts` - Public tag list
- `src/pages/api/allergens.ts` - Public allergen list
- `src/pages/api/recipes/public.ts` - Public recipes (anonymous access)

These endpoints should NOT have authentication checks.

---

#### 1.2.5 Dashboard Page (`src/pages/dashboard.astro`)

**Current State:**
- Uses hardcoded userId for data fetching: `"a85d6d6c-b7d4-4605-9cc4-3743401b67a0"`
- Comment: "For now, using mock userId for data fetching until full auth is implemented"

**Required Changes:**

1. **Remove Hardcoded User ID**
2. **Get User from AppLayout**
   - AppLayout already handles auth and passes user to locals
   - No need to check auth again in dashboard.astro

3. **Use Session User ID for API Calls**
   - Option A: Get from AppLayout via props (cleaner)
   - Option B: Re-fetch from Supabase in page (redundant)

**Implementation Pattern (Recommended):**

Since AppLayout already validates authentication and gets the user, pass userId via context or re-fetch minimally:

```astro
---
// src/pages/dashboard.astro
import AppLayout from "@/layouts/AppLayout.astro";

// AppLayout already checked auth, so user exists
// Get user ID from Supabase (already validated in AppLayout)
const { data: { user } } = await Astro.locals.supabase.auth.getUser();

if (!user) {
  // Should never happen due to AppLayout redirect, but handle gracefully
  return Astro.redirect("/auth/login");
}

const userId = user.id;

// Now use userId for API calls
const [profileResult, userRecipesResult, favoritesResult, publicRecipesResult] =
  await Promise.allSettled([
    fetch(`${Astro.url.origin}/api/profile`, {
      headers: {
        Cookie: Astro.request.headers.get("Cookie") || "",
      },
    }),
    // ... rest of fetches
  ]);

// ... rest of page logic
---
```

**Alternative Pattern (Pass userId from AppLayout):**

Modify AppLayout to pass userId as a slot prop or via Astro.locals:

```astro
---
// In AppLayout.astro
Astro.locals.userId = user.id;
---

<!-- In dashboard.astro -->
---
const userId = Astro.locals.userId;
// Use userId directly
---
```

**Note:** The second pattern is cleaner but requires updating `env.d.ts` to type `Astro.locals.userId`.

---

### 1.3 React Components for Authentication Forms

#### 1.3.1 LoginForm Component

**Location:** `src/components/auth/LoginForm.tsx`

**Purpose:** Interactive login form with validation, error handling, and submission logic.

**Props:** None (all state internal)

**State Management:**
- Form state: email, password, errors, loading, submitError
- Library: React Hook Form with Zod validation

**Component Structure:**
```typescript
interface LoginFormState {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
  submit?: string; // Server-side error
}
```

**Key Features:**
1. Real-time validation on blur
2. Submit button disabled during loading
3. Error display (field-level and form-level)
4. Password show/hide toggle
5. Success redirect to `/dashboard`

**Validation Schema (Zod):**
```typescript
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Adres e-mail jest wymagany")
    .email("Wprowadź poprawny adres e-mail"),
  password: z
    .string()
    .min(1, "Hasło jest wymagane")
});
```

**API Integration:**
- Endpoint: `POST /api/auth/login`
- Request: `{ email: string, password: string }`
- Response: `{ user: User } | { error: string }`
- On success: Cookies set automatically, redirect to `/dashboard`
- On error: Display error message above form

**Error Message Mapping:**
```typescript
const errorMessages: Record<string, string> = {
  'Invalid login credentials': 'Nieprawidłowy e-mail lub hasło. Spróbuj ponownie.',
  'Email not confirmed': 'Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę e-mail.',
  default: 'Wystąpił błąd podczas logowania. Spróbuj ponownie.'
};
```

**Accessibility:**
- Labels for all inputs
- Error messages with aria-live="polite"
- Focus on first error field after validation
- Loading state announced to screen readers

---

#### 1.3.2 RegisterForm Component

**Location:** `src/components/auth/RegisterForm.tsx`

**Purpose:** Interactive registration form with validation, password strength, and submission logic.

**Props:** None

**State Management:**
- Form state: email, password, confirmPassword, errors, loading, submitError
- Password strength: weak/medium/strong
- Library: React Hook Form with Zod validation

**Component Structure:**
```typescript
interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
}

type PasswordStrength = 'weak' | 'medium' | 'strong';
```

**Key Features:**
1. Real-time validation on blur
2. Password strength indicator
3. Password match validation
4. Submit button disabled during loading
5. Error display (field-level and form-level)
6. Password show/hide toggles
7. Success redirect to `/dashboard` (auto-login)

**Validation Schema (Zod):**
```typescript
const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Adres e-mail jest wymagany")
    .email("Wprowadź poprawny adres e-mail"),
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/[a-zA-Z]/, "Hasło musi zawierać co najmniej jedną literę")
    .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła nie są identyczne",
  path: ["confirmPassword"],
});
```

**Password Strength Calculation:**
```typescript
function calculatePasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) return 'weak';

  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);

  if (password.length >= 12 && hasLetters && hasNumbers && hasSpecialChars) {
    return 'strong';
  }

  if (password.length >= 8 && hasLetters && hasNumbers) {
    return 'medium';
  }

  return 'weak';
}
```

**API Integration:**
- Endpoint: `POST /api/auth/register`
- Request: `{ email: string, password: string }`
- Response: `{ user: User } | { error: string }`
- On success: Auto-login, redirect to `/dashboard`
- On error: Display error message

**Error Message Mapping:**
```typescript
const errorMessages: Record<string, string> = {
  'User already registered': 'Konto z tym adresem e-mail już istnieje. Zaloguj się lub użyj innego adresu.',
  'Password should be at least 8 characters': 'Hasło musi mieć co najmniej 8 znaków.',
  default: 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.'
};
```

---

#### 1.3.3 ForgotPasswordForm Component

**Location:** `src/components/auth/ForgotPasswordForm.tsx`

**Purpose:** Form to request password reset email.

**Props:** None

**State Management:**
- Form state: email, error, loading, success
- Library: React Hook Form with Zod validation

**Component Structure:**
```typescript
interface ForgotPasswordFormState {
  email: string;
}
```

**Key Features:**
1. Single email input with validation
2. Success state replaces form with confirmation message
3. Error handling
4. Loading state

**Validation Schema (Zod):**
```typescript
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Adres e-mail jest wymagany")
    .email("Wprowadź poprawny adres e-mail"),
});
```

**API Integration:**
- Endpoint: `POST /api/auth/forgot-password`
- Request: `{ email: string }`
- Response: `{ success: true } | { error: string }`
- Always show success message (don't reveal if email exists)

**Success State:**
- Hide form, show success card
- Message: "Link do resetowania hasła został wysłany na Twój adres e-mail."
- Action: "Wróć do logowania" button

---

#### 1.3.4 ResetPasswordForm Component

**Location:** `src/components/auth/ResetPasswordForm.tsx`

**Purpose:** Form to set new password with reset token.

**Props:**
```typescript
interface ResetPasswordFormProps {
  token: string; // From URL query parameter
}
```

**State Management:**
- Form state: password, confirmPassword, errors, loading, success
- Password strength: weak/medium/strong
- Library: React Hook Form with Zod validation

**Validation Schema:**
- Same as RegisterForm password validation

**API Integration:**
- Endpoint: `POST /api/auth/reset-password`
- Request: `{ token: string, password: string }`
- Response: `{ success: true } | { error: string }`
- On success: Show success message, auto-redirect to login

**Success Flow:**
- Show success message: "Hasło zostało zmienione pomyślnie!"
- Auto-redirect to `/auth/login` after 3 seconds
- Or manual button: "Przejdź do logowania"

---

#### 1.3.5 Shared UI Components

**PasswordInput Component** (`src/components/auth/PasswordInput.tsx`)
- Reusable password input with show/hide toggle
- Props: label, placeholder, value, onChange, error, autocomplete
- Eye icon button to toggle visibility

**PasswordStrengthIndicator Component** (`src/components/auth/PasswordStrengthIndicator.tsx`)
- Visual bar (red/yellow/green) with text label
- Props: strength ('weak' | 'medium' | 'strong')
- Display: "Siła hasła: Słabe/Średnie/Silne"

**FormErrorMessage Component** (`src/components/auth/FormErrorMessage.tsx`)
- Styled error banner for form-level errors
- Props: message (string), visible (boolean)
- Red background, white text, dismiss button

---

### 1.4 Navigation and Routing

#### 1.4.1 Auth Flow Redirects

**Logged-out users accessing protected pages:**
- Redirect to: `/auth/login`
- After login: Redirect back to originally requested page (optional enhancement)

**Logged-in users accessing auth pages:**
- Redirect to: `/dashboard`
- Example: If user is logged in and visits `/auth/login`, redirect to `/dashboard`

**Post-login destination:**
- Default: `/dashboard`
- Optional: Store intended destination in query param (`?redirect=/recipes`)

**Post-registration destination:**
- Default: `/dashboard` (auto-login enabled)
- Alternative: `/profile` (onboarding flow - future enhancement)

**Post-logout destination:**
- Default: `/` (landing page)
- Alternative: `/auth/login`

#### 1.4.2 URL Structure

| Page | Path | Query Params | Auth Required |
|------|------|--------------|---------------|
| Landing | `/` | None | No |
| Login | `/auth/login` | `?redirect=/path` (optional) | No |
| Register | `/auth/register` | `?redirect=/path` (optional) | No |
| Forgot Password | `/auth/forgot-password` | None | No |
| Reset Password | `/auth/reset-password` | `?token={reset_token}` | No |
| Dashboard | `/dashboard` | None | Yes |
| Recipes | `/recipes` | Various filters | Yes |
| Profile | `/profile` | None | Yes |
| All other pages | Various | Various | Yes |

---

### 1.5 Error Messages Reference (Polish)

#### Validation Errors

| Field | Rule | Error Message |
|-------|------|---------------|
| Email | Required | "Adres e-mail jest wymagany" |
| Email | Format | "Wprowadź poprawny adres e-mail" |
| Email | Already exists | "Konto z tym adresem e-mail już istnieje" |
| Password | Required | "Hasło jest wymagane" |
| Password | Min length | "Hasło musi mieć co najmniej 8 znaków" |
| Password | Complexity | "Hasło musi zawierać co najmniej jedną literę i jedną cyfrę" |
| Confirm Password | Match | "Hasła nie są identyczne" |

#### Authentication Errors

| Error Code | User-Facing Message |
|------------|-------------------|
| 401 Unauthorized | "Nieprawidłowy e-mail lub hasło. Spróbuj ponownie." |
| 403 Forbidden (Not verified) | "Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę e-mail." |
| 404 Not Found | "Nieprawidłowy e-mail lub hasło. Spróbuj ponownie." (security) |
| 409 Conflict (Duplicate) | "Konto z tym adresem e-mail już istnieje. Zaloguj się lub użyj innego adresu." |
| 429 Rate Limited | "Wysłano zbyt wiele próśb. Spróbuj ponownie za kilka minut." |
| 500 Server Error | "Wystąpił błąd serwera. Spróbuj ponownie później." |

#### Success Messages

| Action | Success Message |
|--------|----------------|
| Login | "Zalogowano pomyślnie!" |
| Registration | "Witaj w HealthyMeal!" |
| Password Reset Request | "Link do resetowania hasła został wysłany na Twój adres e-mail." |
| Password Reset Complete | "Hasło zostało zmienione pomyślnie!" |
| Logout | "Wylogowano pomyślnie!" |

---

## 2. BACKEND LOGIC

### 2.1 API Endpoints Structure

All authentication API endpoints are located in `src/pages/api/auth/` directory. Each endpoint follows Astro's API route pattern with `export const prerender = false` for SSR.

#### 2.1.1 POST /api/auth/register

**Purpose:** Create a new user account with email and password.

**Request:**
```typescript
// Request Body
{
  email: string;      // Valid email format
  password: string;   // Min 8 chars, must contain letter and number
}
```

**Response:**
```typescript
// Success (201 Created)
{
  user: {
    id: string;
    email: string;
    created_at: string;
    // ... other Supabase user fields
  }
}

// Error (400 Bad Request)
{
  error: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

// Error (409 Conflict - Email exists)
{
  error: "Conflict";
  message: "User already registered";
}

// Error (500 Internal Server Error)
{
  error: "Internal Server Error";
  message: string;
}
```

**Validation Rules:**
- Email: Required, valid format, unique
- Password: Required, min 8 chars, contains letter and number

**Business Logic:**
1. Parse and validate request body using Zod
2. Call `supabase.auth.signUp({ email, password })`
3. Supabase handles:
   - Email uniqueness check
   - Password hashing
   - User creation in `auth.users` table
   - Profile creation in `public.profiles` table (via trigger)
   - Session creation (cookies set automatically)
4. If email confirmation required: Supabase sends verification email
5. Return user object and set session cookies

**Error Handling:**
- Duplicate email → 409 Conflict
- Validation errors → 400 Bad Request
- Supabase errors → 500 Internal Server Error
- Log all errors server-side with context

**Database Trigger (Already exists in Supabase):**
When a new user is created in `auth.users`, a trigger automatically creates a corresponding row in `public.profiles`:

```sql
-- This trigger already exists in Supabase
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Security Considerations:**
- Password never stored in plain text (Supabase handles hashing)
- Rate limiting applied to prevent abuse
- Email sent only if Supabase configured for email verification
- Session cookies httpOnly, secure, sameSite=lax

**File Location:** `src/pages/api/auth/register.ts`

---

#### 2.1.2 POST /api/auth/login

**Purpose:** Authenticate existing user with email and password.

**Request:**
```typescript
// Request Body
{
  email: string;
  password: string;
}
```

**Response:**
```typescript
// Success (200 OK)
{
  user: {
    id: string;
    email: string;
    // ... other Supabase user fields
  }
}

// Error (401 Unauthorized)
{
  error: "Unauthorized";
  message: string;
}

// Error (400 Bad Request)
{
  error: "Bad Request";
  message: string;
  details?: Array<{ field: string; message: string }>;
}

// Error (500 Internal Server Error)
{
  error: "Internal Server Error";
  message: string;
}
```

**Validation Rules:**
- Email: Required, valid format (basic check)
- Password: Required

**Business Logic:**
1. Parse and validate request body using Zod
2. Call `supabase.auth.signInWithPassword({ email, password })`
3. Supabase handles:
   - User lookup by email
   - Password verification
   - Session creation
   - Session cookies set automatically via SSR client
4. Return user object

**Error Handling:**
- Invalid credentials → 401 Unauthorized (don't distinguish between wrong email/password)
- Account not verified → 403 Forbidden (if email confirmation enabled)
- Validation errors → 400 Bad Request
- Supabase errors → 500 Internal Server Error

**Security Considerations:**
- Generic error message for invalid credentials (don't reveal if user exists)
- Rate limiting to prevent brute force attacks
- Session cookies httpOnly, secure, sameSite=lax
- Failed login attempts logged for monitoring

**File Location:** `src/pages/api/auth/login.ts`

---

#### 2.1.3 POST /api/auth/logout

**Purpose:** End the current user session.

**Request:** No body required

**Response:**
```typescript
// Success (200 OK)
{
  success: true;
  message: "Logged out successfully";
}

// Error (500 Internal Server Error)
{
  success: false;
  error: string;
}
```

**Business Logic:**
1. Call `supabase.auth.signOut()`
2. Supabase clears session from database
3. Clear session cookies via `setAll([])` or explicit cookie deletion
4. Return success response

**Error Handling:**
- Supabase signOut errors → 500 Internal Server Error
- Even if error occurs, clear cookies client-side

**Cookie Clearing:**
Supabase SSR client automatically clears auth cookies via `setAll([])` method.

**Security Considerations:**
- Invalidate session server-side (not just client-side)
- Clear all auth cookies
- No sensitive data in logs

**File Location:** `src/pages/api/auth/logout.ts` (Already implemented)

---

#### 2.1.4 POST /api/auth/forgot-password

**Purpose:** Initiate password reset process by sending reset email.

**Request:**
```typescript
// Request Body
{
  email: string;
}
```

**Response:**
```typescript
// Success (200 OK)
{
  success: true;
  message: string;
}

// Note: Always return success even if email doesn't exist (security)

// Error (400 Bad Request)
{
  error: "Bad Request";
  message: string;
}

// Error (429 Too Many Requests)
{
  error: "Too Many Requests";
  message: "Rate limit exceeded";
}

// Error (500 Internal Server Error)
{
  error: "Internal Server Error";
  message: string;
}
```

**Validation Rules:**
- Email: Required, valid format

**Business Logic:**
1. Parse and validate request body using Zod
2. Call `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'http://yourapp.com/auth/reset-password' })`
3. Supabase handles:
   - User lookup by email
   - Reset token generation
   - Email sending with reset link
4. Always return success (don't reveal if email exists)

**Reset Link Format:**
```
http://yourapp.com/auth/reset-password?token={token}&type=recovery
```

Supabase automatically appends token and type parameters.

**Error Handling:**
- Invalid email format → 400 Bad Request
- Rate limiting → 429 Too Many Requests
- Always return success message to user (security best practice)
- Log actual errors server-side for monitoring

**Security Considerations:**
- Don't reveal if email exists in system
- Rate limiting per IP address (prevent abuse)
- Reset token expires after 1 hour (configurable in Supabase)
- Reset token is single-use

**File Location:** `src/pages/api/auth/forgot-password.ts`

---

#### 2.1.5 POST /api/auth/reset-password

**Purpose:** Set new password using reset token.

**Request:**
```typescript
// Request Body
{
  token: string;      // Reset token from email link
  password: string;   // New password (min 8 chars, letter + number)
}
```

**Response:**
```typescript
// Success (200 OK)
{
  success: true;
  message: "Password reset successfully";
}

// Error (401 Unauthorized - Invalid/expired token)
{
  error: "Unauthorized";
  message: "Invalid or expired reset token";
}

// Error (400 Bad Request)
{
  error: "Bad Request";
  message: string;
  details?: Array<{ field: string; message: string }>;
}

// Error (500 Internal Server Error)
{
  error: "Internal Server Error";
  message: string;
}
```

**Validation Rules:**
- Token: Required, valid format
- Password: Required, min 8 chars, contains letter and number (same as registration)

**Business Logic:**
1. Parse and validate request body using Zod
2. Verify reset token with Supabase
3. Call `supabase.auth.updateUser({ password: newPassword })`
4. Supabase handles:
   - Token validation and expiration check
   - Password hashing
   - Password update in database
   - Token invalidation (single-use)
   - **Session invalidation (user must re-login)**
5. Return success response

**Error Handling:**
- Invalid/expired token → 401 Unauthorized
- Weak password → 400 Bad Request with validation details
- Supabase errors → 500 Internal Server Error

**Security Considerations:**
- Token validated server-side before accepting password
- Token expires after 1 hour
- Token is single-use (invalidated after successful reset)
- New password hashed before storage
- All existing sessions invalidated (user must re-login)
- Old password cannot be reused (optional enhancement)

**Session Invalidation:**
After password reset, user must log in again with new password. This is handled automatically by Supabase (existing session tokens are invalidated).

**File Location:** `src/pages/api/auth/reset-password.ts`

---

### 2.2 Supabase Client Updates (SSR Support)

#### 2.2.1 Create Supabase SSR Client

**Current State:**
- `src/db/supabase.client.ts` exports a simple Supabase client
- No cookie management for SSR

**Required Changes:**
- Implement `createSupabaseServerInstance()` function
- Use `@supabase/ssr` package
- Implement `getAll()` and `setAll()` cookie methods
- NEVER use individual `get()`, `set()`, `remove()` methods

**Implementation:**

**File:** `src/db/supabase.client.ts`

```typescript
import type { AstroCookies } from 'astro';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import type { Database } from './database.types';

// Cookie options for Supabase auth cookies
export const cookieOptions: CookieOptionsWithName = {
  path: '/',
  secure: true,      // HTTPS only in production
  httpOnly: true,    // Prevent JavaScript access
  sameSite: 'lax',   // CSRF protection
};

/**
 * Parse Cookie header string into array of name-value pairs
 * Required by Supabase SSR client
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];

  return cookieHeader.split(';').map((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  });
}

/**
 * Create Supabase server client for SSR
 * Must be called with request context (headers and cookies)
 */
export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
  const supabase = createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookieOptions,
      cookies: {
        /**
         * Get all cookies from request
         * Called by Supabase to read auth state
         */
        getAll() {
          const cookieHeader = context.headers.get('Cookie') ?? '';
          return parseCookieHeader(cookieHeader);
        },

        /**
         * Set multiple cookies in response
         * Called by Supabase to persist auth state
         */
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            context.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  return supabase;
};

// Keep simple client export for backward compatibility (non-auth operations)
import { createClient } from '@supabase/supabase-js';

export const supabaseClient = createClient<Database>(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_KEY
);

/**
 * Typed Supabase client with Database schema
 */
export type SupabaseClient = ReturnType<typeof createSupabaseServerInstance>;
```

**Key Points:**
1. **Two clients:**
   - `createSupabaseServerInstance()` for SSR auth operations (middleware, API routes)
   - `supabaseClient` for simple non-auth operations (kept for backward compatibility)

2. **Cookie management:**
   - ONLY use `getAll()` and `setAll()`
   - NEVER use individual cookie methods
   - Supabase handles cookie naming and values

3. **Security:**
   - `httpOnly: true` prevents XSS attacks
   - `secure: true` ensures HTTPS only
   - `sameSite: 'lax'` prevents CSRF attacks

---

#### 2.2.2 Environment Variables

**File:** `.env` (add if not present)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

**File:** `src/env.d.ts` (update)

```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Add types for Astro.locals
declare namespace App {
  interface Locals {
    supabase: import('@supabase/supabase-js').SupabaseClient<
      import('./db/database.types').Database
    >;
    user?: {
      id: string;
      email: string | undefined;
    };
  }
}
```

This provides proper TypeScript support for `Astro.locals.supabase` and `Astro.locals.user`.

---

### 2.3 Input Validation with Zod

All authentication endpoints use Zod schemas for input validation. Validation is performed server-side before calling Supabase methods.

#### 2.3.1 Common Validation Schemas

**File:** `src/lib/validation/auth.schemas.ts` (create new file)

```typescript
import { z } from 'zod';

/**
 * Email validation schema
 * RFC 5322 basic format
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Adres e-mail jest wymagany")
  .email("Wprowadź poprawny adres e-mail")
  .toLowerCase(); // Normalize email to lowercase

/**
 * Password validation schema
 * Min 8 chars, must contain at least one letter and one number
 */
export const passwordSchema = z
  .string()
  .min(8, "Hasło musi mieć co najmniej 8 znaków")
  .regex(/[a-zA-Z]/, "Hasło musi zawierać co najmniej jedną literę")
  .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę");

/**
 * Login request schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Hasło jest wymagane"), // No complexity check for login
});

/**
 * Registration request schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Registration with confirmation schema
 * Used if frontend includes confirmPassword field
 */
export const registerWithConfirmSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

/**
 * Forgot password request schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset password request schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordSchema,
});

// Export types for TypeScript
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
```

#### 2.3.2 Validation Usage Pattern in API Routes

**Example:** `src/pages/api/auth/login.ts`

```typescript
import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '@/db/supabase.client';
import { loginSchema } from '@/lib/validation/auth.schemas';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Validate with Zod schema
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Validation failed",
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email, password } = validationResult.data;

    // 3. Create Supabase client and perform auth operation
    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 4. Handle Supabase errors
    if (error) {
      console.error("[Login API] Supabase error:", error);

      // Map Supabase error to user-friendly message
      const statusCode = error.status || 500;
      const message = mapAuthError(error.message);

      return new Response(
        JSON.stringify({ error: "Unauthorized", message }),
        { status: statusCode, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Success response
    return new Response(
      JSON.stringify({ user: data.user }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Login API] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Helper function to map Supabase errors to user-friendly messages
function mapAuthError(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Nieprawidłowy e-mail lub hasło. Spróbuj ponownie.',
    'Email not confirmed': 'Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę e-mail.',
  };

  return errorMap[errorMessage] || 'Wystąpił błąd podczas logowania. Spróbuj ponownie.';
}
```

**Validation Benefits:**
1. Type safety with TypeScript inference
2. Consistent error messages
3. Detailed validation errors for frontend
4. Server-side validation prevents malicious input
5. Reusable schemas across API routes

---

### 2.4 Error Handling Strategy

#### 2.4.1 Error Response Format

All API endpoints return consistent error responses:

```typescript
// Standard Error Response
{
  error: string;        // Error type (e.g., "Bad Request", "Unauthorized")
  message: string;      // User-friendly message in Polish
  details?: Array<{     // Optional: Field-level validation errors
    field: string;
    message: string;
  }>;
}
```

#### 2.4.2 HTTP Status Codes

| Status Code | Usage | Example |
|-------------|-------|---------|
| 200 OK | Successful operation | Login, logout, password reset |
| 201 Created | Resource created | User registration |
| 400 Bad Request | Validation error | Invalid email format, weak password |
| 401 Unauthorized | Authentication failed | Wrong password, invalid token |
| 403 Forbidden | Action not allowed | Account not verified |
| 404 Not Found | Resource not found | User not found (but return 401 for security) |
| 409 Conflict | Resource conflict | Email already exists |
| 429 Too Many Requests | Rate limit exceeded | Too many password reset requests |
| 500 Internal Server Error | Server error | Database error, Supabase error |

#### 2.4.3 Error Logging

All errors should be logged server-side with context:

```typescript
console.error("[API Endpoint Name] Error Type:", {
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
  userId: user?.id || "anonymous",
  timestamp: new Date().toISOString(),
});
```

**DO NOT log sensitive data:**
- Passwords (plain or hashed)
- Reset tokens
- Session tokens
- Full user objects (only userId)

#### 2.4.4 Error Mapping Helper

Create a shared helper for consistent error mapping:

**File:** `src/lib/utils/error-mapper.ts`

```typescript
/**
 * Map Supabase auth errors to user-friendly Polish messages
 */
export function mapAuthError(supabaseError: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Nieprawidłowy e-mail lub hasło. Spróbuj ponownie.',
    'Email not confirmed': 'Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę e-mail.',
    'User already registered': 'Konto z tym adresem e-mail już istnieje.',
    'Invalid or expired reset token': 'Link resetowania hasła wygasł lub jest nieprawidłowy.',
    'Password should be at least 8 characters': 'Hasło musi mieć co najmniej 8 znaków.',
  };

  return errorMap[supabaseError] || 'Wystąpił błąd. Spróbuj ponownie później.';
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  status: number,
  error: string,
  message: string,
  details?: Array<{ field: string; message: string }>
): Response {
  return new Response(
    JSON.stringify({ error, message, details }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

---

### 2.5 Session Management

#### 2.5.1 Session Lifecycle

1. **Session Creation:**
   - Occurs during login or registration
   - Supabase creates JWT access token and refresh token
   - Tokens stored in httpOnly cookies
   - Cookie names: `sb-{project-ref}-auth-token` (contains both tokens)

2. **Session Validation:**
   - Performed on every request via middleware
   - Middleware calls `supabase.auth.getUser()`
   - This validates JWT and refreshes if needed
   - User info stored in `Astro.locals.user`

3. **Session Refresh:**
   - Handled automatically by Supabase SSR client
   - Access token expires after 1 hour (default)
   - Refresh token used to get new access token
   - Happens transparently in `getUser()` call

4. **Session Termination:**
   - User clicks logout
   - API calls `supabase.auth.signOut()`
   - Session deleted from database
   - Cookies cleared via `setAll([])`

#### 2.5.2 Token Storage

**Cookie Names (Supabase managed):**
- `sb-{project-ref}-auth-token` - Main auth token (JSON with access_token and refresh_token)
- `sb-{project-ref}-auth-token.0`, `.1`, etc. - Chunked tokens if too large for single cookie

**Cookie Properties:**
- `httpOnly: true` - Cannot be accessed by JavaScript
- `secure: true` - Only sent over HTTPS
- `sameSite: 'lax'` - CSRF protection
- `path: '/'` - Available to all routes
- `maxAge` - Managed by Supabase based on session duration

#### 2.5.3 Session Persistence

**User stays logged in across browser sessions:**
- Refresh token has long expiration (default: 30 days)
- As long as user visits site within 30 days, session is refreshed
- If refresh token expires, user must log in again

**Session invalidation scenarios:**
1. User logs out explicitly
2. Refresh token expires (no activity for 30 days)
3. Password changed (all sessions invalidated)
4. Account deleted
5. Manual session revocation by admin (future enhancement)

---

### 2.6 Rate Limiting and Security

#### 2.6.1 Rate Limiting Strategy

**Supabase Built-in Rate Limiting:**
- Supabase Auth has built-in rate limiting
- Default: 30 requests per hour per IP for password reset
- Configurable in Supabase dashboard

**Custom Rate Limiting (Optional Enhancement):**
For additional protection, implement rate limiting at application level:

- Login attempts: 5 per minute per IP
- Registration: 3 per hour per IP
- Password reset: 3 per hour per email

**Implementation:** Use middleware or API route guards with in-memory rate limit tracker or Redis.

#### 2.6.2 Security Headers

Add security headers to API responses:

```typescript
const securityHeaders = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};
```

#### 2.6.3 Input Sanitization

- All user input validated with Zod before processing
- Email addresses normalized to lowercase
- Passwords never logged or returned in responses
- SQL injection prevented by using Supabase SDK (parameterized queries)

---

## 3. AUTHENTICATION SYSTEM

### 3.1 Supabase Auth Integration

#### 3.1.1 Supabase Setup Requirements

**Prerequisites:**
1. Supabase project created at [supabase.com](https://supabase.com)
2. Environment variables configured (see Section 2.2.2)
3. npm package installed: `@supabase/ssr` and `@supabase/supabase-js`

**Supabase Dashboard Configuration:**

1. **Authentication Settings** (Supabase Dashboard → Authentication → Settings):
   - Enable email provider
   - Configure Site URL: `https://yourdomain.com` (production) or `http://localhost:3000` (development)
   - Configure Redirect URLs:
     - `https://yourdomain.com/auth/**` (wildcard for all auth pages)
     - `http://localhost:3000/auth/**` (development)

2. **Email Templates** (Supabase Dashboard → Authentication → Email Templates):
   - **Confirm signup:** Customize email for email verification (if enabled)
   - **Reset password:** Customize email for password reset
     - Update link to: `{{ .SiteURL }}/auth/reset-password?token={{ .Token }}&type=recovery`
   - **Magic link:** Not used in MVP
   - Ensure all templates use Polish language

3. **Email Confirmation** (Optional for MVP):
   - Can be enabled or disabled
   - If enabled: Users must verify email before first login
   - If disabled: Users can log in immediately after registration
   - **Recommendation for MVP:** Disable for faster onboarding, enable in production

4. **Password Requirements** (Supabase Dashboard → Authentication → Settings):
   - Min password length: 8 characters (default: 6, should be increased)
   - No complexity requirements enforced by Supabase (we enforce in Zod schema)

#### 3.1.2 Database Schema

**Auth Tables (Managed by Supabase):**
- `auth.users` - Core authentication table (Supabase managed)
  - `id` (UUID) - Primary key
  - `email` (text) - User email (unique)
  - `encrypted_password` (text) - Hashed password
  - `email_confirmed_at` (timestamp) - Email verification time
  - `created_at`, `updated_at` (timestamps)
  - Other Supabase metadata fields

**Application Tables:**
- `public.profiles` - User profile data (already exists in database)
  - `user_id` (UUID) - Foreign key to auth.users.id
  - `weight`, `age`, `gender`, `activity_level` - Physical data
  - `diet_type`, `target_goal`, `target_value` - Dietary preferences
  - `created_at`, `updated_at` (timestamps)

**Database Trigger (Already exists):**
Automatically create profile when user registers:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Row Level Security (RLS):**
Ensure profiles table has RLS policies:

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

These policies should already exist if database was set up according to initial schema.

#### 3.1.3 Supabase Auth Methods Used

**Methods in API Routes:**

1. **`signUp({ email, password })`**
   - Creates new user in auth.users
   - Sends verification email if enabled
   - Returns user object and session
   - Used in: `/api/auth/register`

2. **`signInWithPassword({ email, password })`**
   - Authenticates user with credentials
   - Returns user object and session
   - Sets session cookies automatically
   - Used in: `/api/auth/login`

3. **`signOut()`**
   - Ends current session
   - Clears session from database
   - Used in: `/api/auth/logout`

4. **`resetPasswordForEmail(email, { redirectTo })`**
   - Sends password reset email
   - Generates reset token
   - Used in: `/api/auth/forgot-password`

5. **`updateUser({ password })`**
   - Updates user password
   - Requires valid reset token in session
   - Invalidates all other sessions
   - Used in: `/api/auth/reset-password`

**Methods in Middleware:**

1. **`getUser()`**
   - Validates current session
   - Refreshes tokens if needed
   - Returns user object or null
   - Used in: Middleware, AppLayout, protected pages

---

### 3.2 Cookie Management

#### 3.2.1 Cookie Handling with @supabase/ssr

**Key Principle:**
ONLY use `getAll()` and `setAll()` methods. NEVER use individual `get()`, `set()`, or `remove()`.

**Why:**
- Supabase may store multiple cookies (chunked for large tokens)
- `getAll()` and `setAll()` handle all cookies atomically
- Individual methods can cause sync issues and missing cookies

**Implementation in Supabase Client:**

```typescript
// src/db/supabase.client.ts
export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
  const supabase = createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookieOptions: {
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
      },
      cookies: {
        // Read all cookies from request
        getAll() {
          const cookieHeader = context.headers.get('Cookie') ?? '';
          return parseCookieHeader(cookieHeader);
        },

        // Write all cookies to response
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            context.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  return supabase;
};
```

**Cookie Flow:**
1. **On Login/Register:**
   - Supabase creates session
   - `setAll()` writes auth cookies to response
   - Browser stores cookies
   - Cookies sent with subsequent requests

2. **On Every Request:**
   - Middleware gets cookies via `getAll()`
   - Supabase validates/refreshes session
   - If tokens refreshed, `setAll()` updates cookies

3. **On Logout:**
   - Supabase calls `setAll([])` (empty array)
   - Astro deletes all auth cookies

#### 3.2.2 Cookie Security

**Security Properties:**
```typescript
{
  httpOnly: true,    // Not accessible via JavaScript (XSS protection)
  secure: true,      // Only sent over HTTPS (MITM protection)
  sameSite: 'lax',   // CSRF protection (not sent on cross-site requests)
  path: '/',         // Available to all application routes
}
```

**Cookie Lifespan:**
- Access token: 1 hour (short-lived)
- Refresh token: 30 days (long-lived)
- Session persists as long as refresh token is valid

---

### 3.3 Session Refresh Mechanism

#### 3.3.1 Automatic Refresh

**How it works:**
1. Access token expires after 1 hour
2. On next request, middleware calls `supabase.auth.getUser()`
3. Supabase detects expired access token
4. Uses refresh token to get new access token
5. Updates cookies via `setAll()`
6. User remains logged in seamlessly

**User Experience:**
- No interruption or re-login required
- Happens transparently in background
- As long as user visits site within 30 days, session continues

#### 3.3.2 Refresh Failure Scenarios

**Refresh token expired:**
- User hasn't visited site in 30+ days
- `getUser()` returns null
- Middleware redirects to `/auth/login`

**Refresh token invalidated:**
- User changed password (all sessions terminated)
- User was deleted
- `getUser()` returns null
- Middleware redirects to `/auth/login`

**Network error:**
- Supabase API unreachable
- `getUser()` returns error
- Middleware can either:
  - Option A: Allow request to proceed (risky)
  - Option B: Show error page (recommended)

---

### 3.4 Protected Routes Implementation

#### 3.4.1 Middleware Protection

Protected routes are enforced in middleware:

```typescript
// src/middleware/index.ts
const PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/api/auth/*",
];

export const onRequest = defineMiddleware(async (context, next) => {
  // Skip auth for public paths
  if (PUBLIC_PATHS.includes(context.url.pathname)) {
    return next();
  }

  // Check authentication
  const { data: { user } } = await context.locals.supabase.auth.getUser();

  if (!user) {
    // Redirect to login
    return context.redirect('/auth/login');
  }

  // Store user in locals
  context.locals.user = { id: user.id, email: user.email };

  return next();
});
```

**Protected by default:** All routes not in PUBLIC_PATHS require authentication.

#### 3.4.2 Page-Level Protection

Pages using AppLayout are automatically protected because AppLayout checks for user:

```astro
---
// src/layouts/AppLayout.astro
const { data: { user }, error } = await Astro.locals.supabase.auth.getUser();

if (error || !user) {
  return Astro.redirect('/auth/login');
}
---
```

This provides defense in depth (protection at both middleware and layout level).

#### 3.4.3 API Route Protection

API routes check authentication manually:

```typescript
// src/pages/api/some-endpoint.ts
export const GET: APIRoute = async ({ locals }) => {
  const { data: { user }, error } = await locals.supabase.auth.getUser();

  if (error || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401 }
    );
  }

  const userId = user.id;
  // ... use userId for data access
};
```

---

## 4. MIGRATION FROM MOCK TO REAL AUTH

### 4.1 Migration Strategy

**Approach:** Systematic replacement of hardcoded userId with real authentication.

**Steps:**
1. Implement Supabase SSR client
2. Update middleware
3. Create auth pages and API endpoints
4. Update AppLayout
5. Replace mock userId in all API routes
6. Update dashboard and other pages
7. Test thoroughly
8. Deploy

### 4.2 Files to Modify

#### 4.2.1 Core Infrastructure

1. **`src/db/supabase.client.ts`**
   - Add `createSupabaseServerInstance()` function
   - Implement SSR cookie handling
   - Keep existing `supabaseClient` for backward compatibility

2. **`src/middleware/index.ts`**
   - Replace simple client with SSR client
   - Add public paths list
   - Add auth check and user storage
   - Add redirect logic for unauthenticated users

3. **`src/env.d.ts`**
   - Add `Astro.locals.user` type definition
   - Update `Astro.locals.supabase` type

#### 4.2.2 Authentication Components (New)

Create these new files:

1. **`src/pages/auth/login.astro`** - Login page
2. **`src/pages/auth/register.astro`** - Registration page
3. **`src/pages/auth/forgot-password.astro`** - Password reset request page
4. **`src/pages/auth/reset-password.astro`** - Password reset page
5. **`src/components/auth/LoginForm.tsx`** - Login form React component
6. **`src/components/auth/RegisterForm.tsx`** - Registration form React component
7. **`src/components/auth/ForgotPasswordForm.tsx`** - Forgot password form
8. **`src/components/auth/ResetPasswordForm.tsx`** - Reset password form
9. **`src/components/auth/PasswordInput.tsx`** - Reusable password input with toggle
10. **`src/components/auth/PasswordStrengthIndicator.tsx`** - Password strength visual
11. **`src/components/auth/FormErrorMessage.tsx`** - Error banner component

#### 4.2.3 Authentication API Routes (New)

Create these new files:

1. **`src/pages/api/auth/register.ts`** - Registration endpoint
2. **`src/pages/api/auth/login.ts`** - Login endpoint
3. **`src/pages/api/auth/forgot-password.ts`** - Password reset request endpoint
4. **`src/pages/api/auth/reset-password.ts`** - Password reset endpoint
5. **`src/lib/validation/auth.schemas.ts`** - Zod validation schemas
6. **`src/lib/utils/error-mapper.ts`** - Error mapping utility

Note: `src/pages/api/auth/logout.ts` already exists.

#### 4.2.4 Existing Files to Update

1. **`src/layouts/AppLayout.astro`**
   - Uncomment auth redirect logic
   - Remove mock user fallback
   - Use real user from Supabase

2. **`src/pages/dashboard.astro`**
   - Remove hardcoded userId
   - Get userId from Astro.locals or Supabase

3. **`src/pages/index.astro` (Landing Page)**
   - Remove alert handlers from auth buttons
   - Update buttons to link to auth pages
   - Optional: Redirect logged-in users to dashboard

4. **`src/components/landing/LandingHeader.astro`**
   - Update login button: `<a href="/auth/login">`
   - Update register button: `<a href="/auth/register">`
   - Remove JavaScript alert handler

5. **All API routes** (18 files):
   - Replace mock userId block with real auth check
   - Pattern: Uncomment auth block, delete mock line

**List of API routes to update:**
- `src/pages/api/profile.ts`
- `src/pages/api/recipes.ts`
- `src/pages/api/recipes/[recipeId].ts`
- `src/pages/api/recipes/[recipeId]/modifications.ts`
- `src/pages/api/recipes/[recipeId]/collections.ts`
- `src/pages/api/modifications/[modificationId].ts`
- `src/pages/api/favorites.ts`
- `src/pages/api/favorites/[recipeId].ts`
- `src/pages/api/collections/index.ts`
- `src/pages/api/collections/[collectionId].ts`
- `src/pages/api/collections/[collectionId]/recipes.ts`
- `src/pages/api/collections/[collectionId]/recipes/[recipeId].ts`
- `src/pages/api/profile/allergens.ts`
- `src/pages/api/profile/allergens/[id].ts`
- `src/pages/api/profile/disliked-ingredients.ts`
- `src/pages/api/profile/disliked-ingredients/[id].ts`
- `src/pages/api/ingredient-substitutions.ts`

### 4.3 Mock Authentication Removal Pattern

**Current Pattern (To Be Removed):**
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

**New Pattern (Production):**
```typescript
// ========================================
// AUTHENTICATION
// ========================================

const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

if (authError || !user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Authentication required"
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" }
    }
  );
}

const userId = user.id;
```

**Steps:**
1. Find `// MOCK: Remove this in production`
2. Delete the line with hardcoded userId
3. Uncomment the auth block above it
4. Remove TODO comment
5. Ensure proper error handling

### 4.4 Testing Strategy

#### 4.4.1 Manual Testing Checklist

**Registration Flow:**
- [ ] Can register with valid email and password
- [ ] Cannot register with invalid email format
- [ ] Cannot register with weak password (< 8 chars, no letter/number)
- [ ] Cannot register with existing email (shows error)
- [ ] Password strength indicator works correctly
- [ ] Confirm password validation works
- [ ] Auto-login after registration works
- [ ] Redirects to dashboard after registration
- [ ] Profile is created automatically in database

**Login Flow:**
- [ ] Can log in with correct credentials
- [ ] Cannot log in with wrong password
- [ ] Cannot log in with wrong email
- [ ] Shows appropriate error messages
- [ ] Password toggle works
- [ ] Redirects to dashboard after login
- [ ] Session persists across page reloads
- [ ] Session persists after browser close (if refresh token valid)

**Logout Flow:**
- [ ] Can log out from user menu
- [ ] Redirects to landing page after logout
- [ ] Cannot access protected pages after logout
- [ ] Session cookies cleared
- [ ] API calls return 401 after logout

**Password Recovery Flow:**
- [ ] Can request password reset with valid email
- [ ] Shows success message even if email doesn't exist
- [ ] Receives password reset email
- [ ] Reset link in email works
- [ ] Can set new password with reset link
- [ ] Cannot use expired reset link (after 1 hour)
- [ ] Cannot use reset link twice
- [ ] Must re-login after password reset
- [ ] Old sessions invalidated after password reset

**Protected Routes:**
- [ ] Cannot access /dashboard without login
- [ ] Cannot access /recipes without login
- [ ] Cannot access /profile without login
- [ ] Cannot access /favorites without login
- [ ] Cannot access /collections without login
- [ ] Middleware redirects to /auth/login for all protected routes

**API Endpoints:**
- [ ] All API endpoints reject requests without authentication (401)
- [ ] All API endpoints work with valid session
- [ ] API endpoints return correct user data (not mock user)
- [ ] Cannot access other users' data

**Session Management:**
- [ ] Session refreshes automatically before expiration
- [ ] Session expires after 30 days of inactivity
- [ ] User must re-login after session expiration
- [ ] Session survives page reloads
- [ ] Session survives browser restarts (until expiration)

**Error Handling:**
- [ ] All error messages in Polish
- [ ] Errors displayed in correct location (field-level vs form-level)
- [ ] Errors clear on field change
- [ ] Network errors handled gracefully
- [ ] Server errors show user-friendly messages

**Accessibility:**
- [ ] All forms keyboard navigable
- [ ] Error messages announced to screen readers
- [ ] Focus management works correctly
- [ ] Labels present for all inputs
- [ ] Color contrast sufficient

**Security:**
- [ ] Passwords not visible by default
- [ ] Passwords not in URL or logs
- [ ] Session cookies httpOnly
- [ ] Session cookies secure (HTTPS)
- [ ] Generic error messages don't reveal if user exists
- [ ] Rate limiting prevents brute force (Supabase built-in)

#### 4.4.2 Automated Testing (Future Enhancement)

**Unit Tests:**
- Zod schema validation
- Error mapping functions
- Password strength calculation

**Integration Tests:**
- API endpoint responses
- Authentication flows
- Session management

**E2E Tests (Playwright/Cypress):**
- Complete user registration flow
- Complete login flow
- Complete password recovery flow
- Protected route access

### 4.5 Migration Rollback Plan

If issues occur after deployment:

**Option 1: Quick Rollback**
1. Revert to previous git commit
2. Redeploy application
3. Users lose access until fix deployed

**Option 2: Feature Flag**
1. Add environment variable: `ENABLE_REAL_AUTH=false`
2. Keep mock auth code path
3. Toggle between mock and real auth
4. Allows testing in production without breaking users

**Option 3: Database Rollback**
If database migrations applied:
1. Restore database from backup
2. Revert application code
3. Redeploy

**Recommendation:** Test thoroughly in staging environment before production deployment.

---

## 5. DEPLOYMENT CONSIDERATIONS

### 5.1 Environment Variables

**Production Environment:**
```env
# Supabase Production Project
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_KEY=your-prod-anon-key

# OpenRouter (existing)
OPENROUTER_API_KEY=your-openrouter-key
```

**Staging Environment:**
```env
# Supabase Staging Project (recommended: separate project)
SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_KEY=your-staging-anon-key

# OpenRouter
OPENROUTER_API_KEY=your-openrouter-key
```

**Local Development:**
```env
# Supabase Local/Development Project
SUPABASE_URL=https://your-dev-project.supabase.co
SUPABASE_KEY=your-dev-anon-key

# Or use Supabase local development setup
# SUPABASE_URL=http://localhost:54321
# SUPABASE_KEY=your-local-anon-key

# OpenRouter
OPENROUTER_API_KEY=your-openrouter-key
```

### 5.2 Supabase Configuration Per Environment

**Recommended Setup:**
- **Local:** Development Supabase project or local Supabase instance
- **Staging:** Separate Supabase project for staging
- **Production:** Separate Supabase project for production

**Configuration for each environment:**
1. Set Site URL to environment domain
2. Configure Redirect URLs for auth pages
3. Set up email templates (production should have branded templates)
4. Configure email provider (production should use custom SMTP)
5. Enable/disable email confirmation as needed

### 5.3 HTTPS Requirement

**Critical:** Authentication MUST run over HTTPS in production.

**Reasons:**
- Session cookies marked as `secure: true` (won't work over HTTP)
- Prevents man-in-the-middle attacks
- Required for modern browser security features

**Local Development:**
- HTTP is acceptable (http://localhost:3000)
- Supabase client automatically detects and adjusts cookie settings

**Production:**
- HTTPS required
- Configure SSL certificate in hosting provider
- Enforce HTTPS redirects

### 5.4 Cookie Domain Configuration

If deploying across subdomains:

**Single domain (e.g., healthymeal.com):**
- No additional configuration needed
- Cookies work on main domain and all subdomains

**Multiple domains:**
- Requires custom cookie configuration
- Set cookie domain explicitly
- May need Supabase custom domain feature

### 5.5 Monitoring and Logging

**What to Monitor:**
1. Failed login attempts (potential brute force)
2. High rate of password reset requests (potential abuse)
3. Session refresh failures (potential token issues)
4. API authentication errors (401/403 responses)
5. User registration rate (sudden spikes may indicate bot activity)

**Logging Strategy:**
- Log all authentication events (login, logout, registration, password reset)
- Include: timestamp, userId (if available), IP address, user agent
- DO NOT log passwords or tokens
- Use structured logging for easier analysis
- Send logs to monitoring service (e.g., Sentry, LogRocket, Datadog)

### 5.6 Email Configuration

**Development:**
- Use Supabase default email sender
- Emails may go to spam

**Production:**
- Configure custom SMTP provider (SendGrid, AWS SES, Mailgun)
- Set up SPF, DKIM, DMARC records for domain
- Use branded email templates
- Test email delivery thoroughly

**Email Templates to Configure:**
1. **Email confirmation** (if enabled)
   - Subject: "Witaj w HealthyMeal - Potwierdź swój adres e-mail"
   - Body: Personalized with confirmation link

2. **Password reset**
   - Subject: "HealthyMeal - Resetowanie hasła"
   - Body: Personalized with reset link
   - Link expiration notice: "Link wygasa za 1 godzinę"

3. **Email change confirmation** (future)
   - Subject: "HealthyMeal - Potwierdź zmianę adresu e-mail"

---

## 6. FUTURE ENHANCEMENTS

### 6.1 Planned Features (Post-MVP)

1. **OAuth Social Login**
   - Google Sign-In
   - Apple Sign-In
   - Facebook Login (optional)
   - Implementation: Use Supabase OAuth providers

2. **Two-Factor Authentication (2FA)**
   - TOTP-based (Google Authenticator, Authy)
   - SMS-based (optional)
   - Implementation: Supabase supports 2FA

3. **Email Change Flow**
   - Request email change with confirmation
   - Verify new email before switching
   - Keep old email until verified

4. **Account Deletion**
   - User-initiated account deletion
   - Confirmation dialog and grace period
   - Cascade delete user data

5. **Session Management Dashboard**
   - View active sessions
   - Revoke specific sessions
   - "Log out all devices" option

6. **Login History**
   - Show recent login attempts
   - IP addresses and locations
   - Suspicious activity alerts

7. **Remember Device**
   - Extend session duration for trusted devices
   - Requires device fingerprinting

8. **Magic Link Login**
   - Passwordless login via email
   - Alternative to password-based auth
   - Supabase supports this natively

### 6.2 Security Enhancements

1. **Advanced Rate Limiting**
   - Per-IP and per-account limits
   - Progressive delays (increase delay after each failed attempt)
   - CAPTCHA after multiple failures

2. **Account Lockout**
   - Lock account after N failed login attempts
   - Require password reset to unlock

3. **Password Policies**
   - Prevent password reuse (store hashed history)
   - Force password expiration after N days
   - Detect common/leaked passwords (Have I Been Pwned API)

4. **Suspicious Activity Detection**
   - Detect login from new location/device
   - Send notification email
   - Require additional verification

5. **Audit Logging**
   - Comprehensive audit trail
   - All authentication events logged
   - Immutable log storage for compliance

---

## 7. APPENDICES

### 7.1 Complete File Structure

```
src/
├── components/
│   ├── auth/                          # NEW: Auth components
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   ├── ResetPasswordForm.tsx
│   │   ├── PasswordInput.tsx
│   │   ├── PasswordStrengthIndicator.tsx
│   │   └── FormErrorMessage.tsx
│   ├── landing/                       # MODIFY: Update auth buttons
│   │   └── LandingHeader.astro
│   └── ui/                            # Existing Shadcn components
│       ├── button.tsx
│       ├── input.tsx
│       └── ...
├── db/
│   ├── supabase.client.ts             # MODIFY: Add SSR client
│   └── database.types.ts              # Existing
├── layouts/
│   ├── Layout.astro                   # Existing
│   └── AppLayout.astro                # MODIFY: Enable auth redirect
├── lib/
│   ├── services/                      # Existing services
│   ├── utils/
│   │   └── error-mapper.ts            # NEW: Error mapping
│   └── validation/
│       └── auth.schemas.ts            # NEW: Auth validation schemas
├── middleware/
│   └── index.ts                       # MODIFY: Add auth middleware
├── pages/
│   ├── auth/                          # NEW: Auth pages
│   │   ├── login.astro
│   │   ├── register.astro
│   │   ├── forgot-password.astro
│   │   └── reset-password.astro
│   ├── api/
│   │   ├── auth/                      # NEW: Auth API endpoints
│   │   │   ├── login.ts
│   │   │   ├── register.ts
│   │   │   ├── logout.ts              # Already exists
│   │   │   ├── forgot-password.ts
│   │   │   └── reset-password.ts
│   │   ├── profile.ts                 # MODIFY: Remove mock auth
│   │   ├── recipes.ts                 # MODIFY: Remove mock auth
│   │   └── ... (18 API files total)  # MODIFY: Remove mock auth
│   ├── index.astro                    # MODIFY: Update auth button links
│   ├── dashboard.astro                # MODIFY: Remove mock userId
│   └── ... (other pages)
├── env.d.ts                           # MODIFY: Add Locals types
└── types.ts                           # Existing
```

### 7.2 Dependencies to Install

**Required npm packages:**
```bash
npm install @supabase/ssr @supabase/supabase-js
```

**Already installed (verify):**
- zod
- react
- react-dom
- @astrojs/react
- tailwindcss
- @shadcn/ui components

### 7.3 Supabase Configuration Checklist

- [ ] Supabase project created
- [ ] Environment variables set (SUPABASE_URL, SUPABASE_KEY)
- [ ] Email provider enabled in Supabase
- [ ] Site URL configured
- [ ] Redirect URLs configured
- [ ] Email templates customized (Polish language)
- [ ] Password requirements set (min 8 chars)
- [ ] Email confirmation enabled/disabled (choose based on MVP needs)
- [ ] Database trigger `handle_new_user()` exists
- [ ] RLS policies enabled on profiles table
- [ ] Test user created for development

### 7.4 Glossary

- **SSR:** Server-Side Rendering
- **RLS:** Row Level Security (Supabase feature for database access control)
- **JWT:** JSON Web Token (used for session tokens)
- **httpOnly:** Cookie attribute that prevents JavaScript access
- **CSRF:** Cross-Site Request Forgery
- **XSS:** Cross-Site Scripting
- **TOTP:** Time-based One-Time Password (for 2FA)
- **OAuth:** Open Authentication (social login protocol)
- **SMTP:** Simple Mail Transfer Protocol (email sending)

---

## 8. SUMMARY

This specification provides a complete blueprint for implementing authentication in HealthyMeal without writing implementation code. Key points:

**User Interface:**
- 4 auth pages (login, register, forgot password, reset password)
- React form components with validation and error handling
- Updates to existing landing page and layouts
- Polish language throughout

**Backend:**
- 4 new API endpoints (register, login, forgot-password, reset-password)
- Zod validation schemas for all inputs
- Consistent error handling and user-friendly messages
- Migration from mock userId to real authentication in 18+ API routes

**Authentication System:**
- Supabase Auth integration with Astro SSR
- Proper cookie management using @supabase/ssr
- Session lifecycle and refresh mechanism
- Protected routes via middleware

**Migration Strategy:**
- Systematic replacement of mocked authentication
- Clear patterns for updating existing code
- Testing checklist for validation
- Rollback plan for safety

**Next Steps:**
1. Review and approve this specification
2. Set up Supabase project and configuration
3. Implement Supabase SSR client and middleware
4. Create auth pages and API endpoints
5. Update existing pages and API routes
6. Test thoroughly in development
7. Deploy to staging for user acceptance testing
8. Deploy to production

---

**Document Version:** 1.0
**Last Updated:** 2025-11-20
**Author:** Claude Code (AI Assistant)
**Status:** Ready for Implementation
