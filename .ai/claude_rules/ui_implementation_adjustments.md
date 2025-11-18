# UI Implementation Adjustments

## Interactive Elements in Astro Components

### Problem

Astro components are server-rendered. Using React components (like Shadcn Button) with `onClick` handlers doesn't work without `client:*` directives. The `onClick` attribute in server-rendered components outputs as a string, not executable JavaScript.

### Solution

**Use native HTML buttons with client-side scripts:**

```astro
---
// No Button import needed for simple interactions
---

<button
  data-action="my-action"
  class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-green-600 text-white shadow hover:bg-green-700 h-9 px-4 py-2"
>
  Click Me
</button>

<script>
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.querySelector('[data-action="my-action"]');
    if (btn) {
      btn.addEventListener("click", () => {
        // Your action here
      });
    }
  });
</script>
```

**Key points:**

- Use `data-*` attributes for JavaScript targeting
- Use Shadcn CSS classes directly on HTML elements
- Add `<script>` tags for client-side interactivity
- Only use React components with `client:load` when needed (complex state/interactions)

## Type Organization

**Create dedicated type files for component groups:**

```
src/components/landing/
├── types.ts              # Shared types for landing components
├── LandingHeader.astro
├── MobileMenu.tsx
└── ...
```

**Import types with `type` modifier:**

```typescript
import type { NavLink, Feature } from "./types";
```

## Arrow Functions for React Components

**Use arrow functions instead of function declarations:**

```typescript
// ✅ Good
const MyComponent = () => {
  return <div>Content</div>;
};

export default MyComponent;

// ❌ Avoid
export default function MyComponent() {
  return <div>Content</div>;
}
```

## ESLint and Script Tags in Astro

**Problem:** ESLint/Prettier has parsing issues with `<script>` tags in Astro files.

**Solution:** Add ESLint disable comment inside script tags:

```astro
<script>
  /* eslint-disable prettier/prettier */
  document.addEventListener("DOMContentLoaded", () => {
    // Your code here
  });
</script>
```

**For frontmatter arrays/objects:** Add disable comment before problematic lines:

```astro
---
/* eslint-disable prettier/prettier */
const items = [{ key: "value" }];
---
```

## Icon Types with Lucide React

**Use proper type for lucide-react icons:**

```typescript
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon; // ✅ Correct
  // icon: any;      // ❌ Avoid
  title: string;
}
```
