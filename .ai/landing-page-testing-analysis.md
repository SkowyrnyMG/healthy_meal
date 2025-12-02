# Landing Page Testing Analysis

**Focus:** Components from `src/pages/index.astro` and dependencies
**Based on:** `.ai/component-structure.txt`
**Generated:** 2025-12-02

---

## Table of Contents

1. [Overview](#overview)
2. [Component-by-Component Analysis](#component-by-component-analysis)
3. [Testing Priority Matrix](#testing-priority-matrix)
4. [Recommended Testing Approach](#recommended-testing-approach)

---

## Overview

### Landing Page Component Tree

```
index.astro (Landing Page)
├── Layout.astro
│   ├── global.css
│   └── Toaster (sonner, client:load)
├── LandingHeader.astro
│   └── MobileMenu.tsx (React, client:load) ⭐
├── HeroSection.astro
├── FeaturesSection.astro
│   └── Card components
├── HowItWorksSection.astro
│   └── Card components
├── SocialProofSection.astro
│   └── Card components
├── FinalCTASection.astro
└── Footer.astro
    └── Separator component
```

### Testing Philosophy for Landing Page

**Key Insight:** Landing pages are **conversion-critical** but mostly **presentational**. Testing strategy should focus on:

1. ✅ **Business logic** - Authentication state handling, conditional rendering
2. ✅ **Interactive elements** - Mobile menu, smooth scrolling, CTA buttons
3. ✅ **Shared utilities** - Class name merging, type definitions
4. ❌ **Static content** - Text, icons, layout (use visual regression tests)
5. ❌ **Astro components** - Server-rendered HTML (use E2E tests)

---

## Component-by-Component Analysis

### 1. index.astro (Main Page) ❌ **NOT WORTH UNIT TESTING**

**File:** `src/pages/index.astro`

**What it does:**
- Server-side authentication check via Supabase
- Passes `isAuthenticated` prop to child components
- Renders layout with all landing sections

**Why NOT unit test:**
```astro
---
import Layout from "../layouts/Layout.astro";
import LandingHeader from "../components/landing/LandingHeader.astro";
// ... other imports

// Authentication check
const { data: { user } } = await Astro.locals.supabase.auth.getUser();
const isAuthenticated = !!user;
---

<Layout title="HealthyMeal - Dopasuj przepisy...">
  <LandingHeader isAuthenticated={isAuthenticated} />
  <main>
    <HeroSection isAuthenticated={isAuthenticated} />
    <!-- ... other sections -->
  </main>
  <Footer />
</Layout>
```

**Reasons to skip unit testing:**
1. **Server-rendered only:** Runs at build time, not in browser
2. **Composition only:** Just assembles child components
3. **No business logic:** Authentication check is straightforward
4. **Difficult to test in isolation:** Astro runtime required
5. **Better tested via E2E:** Playwright can test full page with real auth

**Alternative testing approach:**
- ✅ **E2E test:** Verify page renders correctly for authenticated/unauthenticated users
- ✅ **Integration test:** Test Supabase auth flow end-to-end
- ✅ **Manual testing:** Visual review during development

---

### 2. Layout.astro ❌ **NOT WORTH UNIT TESTING**

**File:** `src/layouts/Layout.astro`

**What it does:**
- Provides HTML structure (head, body)
- Imports global CSS
- Includes Toaster component for notifications

**Why NOT unit test:**
```astro
---
import "../styles/global.css";
import { Toaster } from "sonner";

interface Props {
  title?: string;
}

const { title = "Healthy Meal" } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>{title}</title>
  </head>
  <body class="gradient-bg">
    <slot />
    <Toaster richColors position="bottom-right" client:load />
  </body>
</html>
```

**Reasons to skip:**
1. **Pure HTML template:** No logic to test
2. **Third-party component:** Toaster is from `sonner` library
3. **Presentation only:** Layout structure is visual
4. **Server-rendered:** Astro-specific syntax

**Alternative testing:**
- ✅ **Visual regression:** Screenshot tests
- ✅ **E2E:** Verify page structure exists
- ✅ **Manual:** Check responsive design

---

### 3. LandingHeader.astro ❌ **NOT WORTH UNIT TESTING**

**File:** `src/components/landing/LandingHeader.astro`

**What it does:**
- Displays logo and navigation
- Shows different auth buttons based on `isAuthenticated` prop
- Renders MobileMenu for mobile devices

**Why NOT unit test:**
```astro
---
interface Props {
  isAuthenticated?: boolean;
}

const { isAuthenticated = false } = Astro.props;

const navLinks: NavLink[] = [
  { href: "#features", label: "Funkcje" },
  { href: "#how-it-works", label: "Jak to działa" },
];
---

<header class="...">
  <!-- Logo -->
  <a href="/">
    <ChefHat className="..." />
    <span>HealthyMeal</span>
  </a>

  <!-- Desktop Nav -->
  <nav class="hidden md:flex">
    {navLinks.map((link) => (
      <a href={link.href}>{link.label}</a>
    ))}
  </nav>

  <!-- Auth Buttons -->
  <div class="hidden md:flex">
    {isAuthenticated ? (
      <a href="/dashboard">Przejdź do panelu</a>
    ) : (
      <>
        <a href="/auth/login">Zaloguj się</a>
        <a href="/auth/register">Zarejestruj się</a>
      </>
    )}
  </div>

  <!-- Mobile Menu -->
  <div class="md:hidden">
    <MobileMenu client:load isAuthenticated={isAuthenticated} />
  </div>
</header>
```

**Reasons to skip:**
1. **Presentation-focused:** Mostly HTML structure
2. **Static data:** `navLinks` array has no logic
3. **Conditional rendering:** Simple ternary, easily verified visually
4. **Astro component:** Server-rendered

**What IS worth testing:**
- ✅ **MobileMenu.tsx** (see section 4) - React component with state

**Alternative testing:**
- ✅ **E2E:** Test both authenticated/unauthenticated states
- ✅ **Visual regression:** Verify layout at different breakpoints

---

### 4. MobileMenu.tsx ⭐⭐⭐⭐ **HIGH PRIORITY - UNIT TEST THIS**

**File:** `src/components/landing/MobileMenu.tsx`

**What it does:**
- React component with state management (isOpen)
- Handles navigation clicks with smooth scrolling
- Handles auth button clicks with navigation
- Conditional rendering based on authentication

**Why UNIT TEST:**

```typescript
const MobileMenu = ({ isAuthenticated = false }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAuthClick = (href: string) => {
    setIsOpen(false);
    window.location.href = href;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        {/* Navigation links */}
        {navLinks.map((link) => (
          <button onClick={() => handleNavClick(link.href)}>
            {link.label}
          </button>
        ))}

        {/* Auth buttons */}
        {isAuthenticated ? (
          <Button onClick={() => handleAuthClick("/dashboard")}>
            Przejdź do panelu
          </Button>
        ) : (
          <>
            <Button onClick={() => handleAuthClick("/auth/login")}>
              Zaloguj się
            </Button>
            <Button onClick={() => handleAuthClick("/auth/register")}>
              Zarejestruj się
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
```

#### What to Test:

##### ✅ **1. State Management**
```typescript
describe('MobileMenu - State Management', () => {
  it('should start with menu closed', () => {
    render(<MobileMenu />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should open menu when trigger is clicked', async () => {
    render(<MobileMenu />);
    const trigger = screen.getByLabelText('Otwórz menu');
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

**Why test this:**
- ✅ State management is core functionality
- ✅ Menu open/close affects user experience
- ✅ Bugs here would break mobile navigation
- ✅ Easy to test with React Testing Library

##### ✅ **2. Navigation Behavior (handleNavClick)**
```typescript
describe('MobileMenu - Navigation', () => {
  it('should close menu when nav link is clicked', async () => {
    const mockScrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = mockScrollIntoView;

    render(<MobileMenu />);

    // Open menu
    await userEvent.click(screen.getByLabelText('Otwórz menu'));

    // Click nav link
    const navLink = screen.getByText('Funkcje');
    await userEvent.click(navLink);

    // Menu should close
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should scroll to section when nav link is clicked', async () => {
    const mockElement = { scrollIntoView: vi.fn() };
    document.querySelector = vi.fn(() => mockElement);

    render(<MobileMenu />);
    await userEvent.click(screen.getByLabelText('Otwórz menu'));

    const navLink = screen.getByText('Funkcje');
    await userEvent.click(navLink);

    expect(document.querySelector).toHaveBeenCalledWith('#features');
    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth'
    });
  });

  it('should handle missing DOM element gracefully', async () => {
    document.querySelector = vi.fn(() => null);

    render(<MobileMenu />);
    await userEvent.click(screen.getByLabelText('Otwórz menu'));

    const navLink = screen.getByText('Funkcje');
    // Should not throw
    await expect(userEvent.click(navLink)).resolves.not.toThrow();
  });
});
```

**Why test this:**
- ✅ **Critical UX:** Smooth scrolling is a key feature
- ✅ **DOM dependency:** Need to verify querySelector works correctly
- ✅ **Error handling:** Must handle missing elements gracefully
- ✅ **Regression prevention:** Changes to event handlers could break this

##### ✅ **3. Auth Button Behavior (handleAuthClick)**
```typescript
describe('MobileMenu - Authentication', () => {
  it('should close menu and navigate when auth button clicked', async () => {
    delete window.location;
    window.location = { href: '' } as Location;

    render(<MobileMenu isAuthenticated={false} />);
    await userEvent.click(screen.getByLabelText('Otwórz menu'));

    const loginButton = screen.getByText('Zaloguj się');
    await userEvent.click(loginButton);

    expect(window.location.href).toBe('/auth/login');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
```

**Why test this:**
- ✅ **Navigation is critical:** Broken links = lost conversions
- ✅ **Multiple paths:** Login, Register, Dashboard
- ✅ **Easy to break:** window.location is fragile

##### ✅ **4. Conditional Rendering Based on Auth State**
```typescript
describe('MobileMenu - Conditional Rendering', () => {
  it('should show Login and Register when not authenticated', async () => {
    render(<MobileMenu isAuthenticated={false} />);
    await userEvent.click(screen.getByLabelText('Otwórz menu'));

    expect(screen.getByText('Zaloguj się')).toBeInTheDocument();
    expect(screen.getByText('Zarejestruj się')).toBeInTheDocument();
    expect(screen.queryByText('Przejdź do panelu')).not.toBeInTheDocument();
  });

  it('should show Dashboard button when authenticated', async () => {
    render(<MobileMenu isAuthenticated={true} />);
    await userEvent.click(screen.getByLabelText('Otwórz menu'));

    expect(screen.getByText('Przejdź do panelu')).toBeInTheDocument();
    expect(screen.queryByText('Zaloguj się')).not.toBeInTheDocument();
    expect(screen.queryByText('Zarejestruj się')).not.toBeInTheDocument();
  });
});
```

**Why test this:**
- ✅ **Business logic:** Auth state affects UI
- ✅ **Conversion critical:** Wrong buttons = confused users
- ✅ **Easy to break:** Props could be passed incorrectly
- ✅ **Security awareness:** Authenticated users shouldn't see signup

##### ✅ **5. NavLinks Data Integrity**
```typescript
describe('MobileMenu - Navigation Links', () => {
  it('should render all navigation links', async () => {
    render(<MobileMenu />);
    await userEvent.click(screen.getByLabelText('Otwórz menu'));

    expect(screen.getByText('Funkcje')).toBeInTheDocument();
    expect(screen.getByText('Jak to działa')).toBeInTheDocument();
  });

  it('should have correct href attributes', async () => {
    render(<MobileMenu />);
    await userEvent.click(screen.getByLabelText('Otwórz menu'));

    const funkLink = screen.getByText('Funkcje');
    await userEvent.click(funkLink);

    expect(document.querySelector).toHaveBeenCalledWith('#features');
  });
});
```

**Why test this:**
- ✅ **Content accuracy:** Links must go to correct sections
- ✅ **Regression prevention:** Refactoring could break links
- ✅ **Low effort:** Simple assertions

#### ROI Summary for MobileMenu

| Aspect | Effort | Value | ROI |
|--------|--------|-------|-----|
| State management | Low | High | ⭐⭐⭐⭐⭐ |
| Navigation behavior | Medium | High | ⭐⭐⭐⭐ |
| Auth conditional rendering | Low | High | ⭐⭐⭐⭐⭐ |
| Auth button navigation | Low | High | ⭐⭐⭐⭐⭐ |
| Error handling | Medium | Medium | ⭐⭐⭐ |

**Overall: HIGH PRIORITY** - This is the ONLY landing page component worth unit testing.

---

### 5. HeroSection.astro ❌ **NOT WORTH UNIT TESTING**

**File:** `src/components/landing/HeroSection.astro`

**What it does:**
- Displays hero text and CTA buttons
- Conditional CTA based on `isAuthenticated`
- Client-side script for "Learn more" button scroll

**Code highlights:**
```astro
<!-- CTA Buttons -->
{isAuthenticated ? (
  <a href="/dashboard">Przejdź do panelu</a>
) : (
  <a href="/auth/register">Zacznij za darmo</a>
)}
<button data-cta-action="learn-more">Dowiedz się więcej</button>

<script>
  document.addEventListener("DOMContentLoaded", () => {
    const learnMoreBtn = document.querySelector('[data-cta-action="learn-more"]');
    if (learnMoreBtn) {
      learnMoreBtn.addEventListener("click", () => {
        const featuresSection = document.querySelector("#features");
        if (featuresSection) {
          featuresSection.scrollIntoView({ behavior: "smooth" });
        }
      });
    }
  });
</script>
```

**Why NOT unit test:**
1. **Astro component:** Server-rendered template
2. **Simple conditional:** One ternary operator
3. **DOM-dependent:** Script runs in browser
4. **Presentation-heavy:** Mostly visual content

**What's worth extracting and testing:**

#### Option A: Extract scroll logic to shared utility ⭐⭐⭐

```typescript
// src/lib/utils/scroll.ts
export function smoothScrollToSection(sectionId: string): void {
  const element = document.querySelector(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
}

// src/lib/utils/scroll.test.ts
describe('smoothScrollToSection', () => {
  it('should call scrollIntoView on element', () => {
    const mockElement = { scrollIntoView: vi.fn() };
    document.querySelector = vi.fn(() => mockElement);

    smoothScrollToSection('#features');

    expect(document.querySelector).toHaveBeenCalledWith('#features');
    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth'
    });
  });

  it('should not throw when element not found', () => {
    document.querySelector = vi.fn(() => null);
    expect(() => smoothScrollToSection('#missing')).not.toThrow();
  });
});
```

**Why extract and test:**
- ✅ Reusable across components
- ✅ Easy to test in isolation
- ✅ Prevents duplication
- ✅ Low effort, medium value

#### Option B: Leave as-is ✅

**Argument for skipping:**
- ⚠️ Simple inline script (6 lines)
- ⚠️ Same logic as MobileMenu (already tested there)
- ⚠️ E2E test covers this behavior
- ⚠️ Extraction adds complexity for minimal gain

**Recommendation:** **Skip unit testing**, verify via E2E test

---

### 6. FeaturesSection.astro ❌ **NOT WORTH UNIT TESTING**

**File:** `src/components/landing/FeaturesSection.astro`

**What it does:**
- Displays 3 feature cards with icons
- Uses shadcn/ui Card components
- Maps over static `features` array

**Code highlights:**
```astro
---
const features: Feature[] = [
  {
    icon: Flame,
    title: "Dostosuj kaloryczność",
    description: "Automatycznie obniżaj lub podwyższaj...",
  },
  // ... more features
];
---

<section id="features">
  <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {features.map((feature) => {
      const Icon = feature.icon;
      return (
        <Card>
          <CardHeader>
            <Icon className="h-6 w-6 text-green-600" />
            <CardTitle>{feature.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>{feature.description}</CardDescription>
          </CardContent>
        </Card>
      );
    })}
  </div>
</section>
```

**Why NOT unit test:**
1. **Static data:** `features` array is constant
2. **No logic:** Just mapping over data
3. **Third-party components:** Card is from shadcn/ui
4. **Presentation only:** Content is visual
5. **Astro component:** Server-rendered

**Alternative testing:**
- ✅ **Visual regression:** Screenshot comparison
- ✅ **E2E:** Verify all 3 cards render
- ✅ **Manual:** Content review

---

### 7. HowItWorksSection.astro ❌ **NOT WORTH UNIT TESTING**

**File:** `src/components/landing/HowItWorksSection.astro`

**Identical reasoning to FeaturesSection:**
- Static `steps` array
- Maps over data to render cards
- No business logic
- Presentation only

**Skip unit testing.**

---

### 8. SocialProofSection.astro ❌ **NOT WORTH UNIT TESTING**

**File:** `src/components/landing/SocialProofSection.astro`

**What it does:**
- Placeholder testimonial cards
- Static stats (1000+ users, 5000+ recipes)

**Why NOT unit test:**
1. **Placeholder content:** TODO comment for future testimonials
2. **Static data:** Stats are hardcoded
3. **No logic:** Just renders HTML

**Skip until testimonials are added.**

---

### 9. FinalCTASection.astro ❌ **NOT WORTH UNIT TESTING**

**File:** `src/components/landing/FinalCTASection.astro`

**What it does:**
- Final call-to-action banner
- Static link to `/auth/register`
- Trust indicators (checkmarks)

**Why NOT unit test:**
- Static HTML template
- No logic
- Presentation only

**Skip unit testing.**

---

### 10. Footer.astro ❌ **NOT WORTH UNIT TESTING**

**File:** `src/components/landing/Footer.astro`

**What it does:**
- Footer links organized in groups
- Social media icons
- Current year display

**Code highlights:**
```astro
---
const footerLinkGroups: FooterLinkGroup[] = [
  { title: "Produkt", links: [...] },
  // ... more groups
];

const currentYear = new Date().getFullYear();
---

<footer>
  <!-- Link groups -->
  {footerLinkGroups.map((group) => (
    <div>
      <h3>{group.title}</h3>
      {group.links.map((link) => (
        <a href={link.href}>{link.label}</a>
      ))}
    </div>
  ))}

  <p>© {currentYear} HealthyMeal</p>
</footer>
```

**Why NOT unit test:**
1. **Static data:** Link groups are constants
2. **Simple logic:** `new Date().getFullYear()` is trivial
3. **Presentation focused:** Footer layout is visual

**What's potentially testable:**

```typescript
// Extract if reused elsewhere
export function getCurrentYear(): number {
  return new Date().getFullYear();
}
```

**But honestly:** This is overkill. Testing `new Date().getFullYear()` adds no value.

**Skip unit testing.**

---

## Supporting Components & Dependencies

### 11. types.ts (Landing Components) ✅ **TYPE DEFINITIONS - NO UNIT TESTS**

**File:** `src/components/landing/types.ts`

**What it contains:**
```typescript
export interface NavLink {
  href: string;
  label: string;
}

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface Step {
  number: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}
```

**Why NOT unit test:**
- ❌ TypeScript interfaces have no runtime behavior
- ❌ Type checking happens at compile time
- ❌ Can't test types with Jest/Vitest

**How to verify correctness:**
```bash
# TypeScript compiler will catch type errors
npm run build  # or
tsc --noEmit
```

---

### 12. src/lib/utils.ts ⭐⭐⭐⭐⭐ **HIGH PRIORITY - UNIT TEST THIS**

**File:** `src/lib/utils.ts`

**What it does:**
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Why UNIT TEST:**

#### ✅ Used in EVERY component
- Button, Card, Sheet, Separator, and all custom components
- Breaking this breaks the entire UI

#### ✅ Complex behavior (Tailwind class merging)
- `clsx` handles conditional classes
- `twMerge` resolves Tailwind conflicts

#### ✅ Edge cases to verify
```typescript
describe('cn - Class Name Utility', () => {
  it('should merge class strings', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('should resolve Tailwind conflicts (later wins)', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
    expect(cn('base', true && 'active')).toBe('base active');
  });

  it('should handle arrays', () => {
    expect(cn(['px-4', 'py-2'])).toBe('px-4 py-2');
  });

  it('should handle objects', () => {
    expect(cn({ 'px-4': true, 'py-2': false })).toBe('px-4');
  });

  it('should handle mixed inputs', () => {
    expect(
      cn('base', ['px-4', 'py-2'], { active: true, hidden: false }, 'text-sm')
    ).toBe('base px-4 py-2 active text-sm');
  });

  it('should handle undefined and null', () => {
    expect(cn('base', undefined, null, 'text-sm')).toBe('base text-sm');
  });

  it('should resolve complex Tailwind conflicts', () => {
    expect(cn('p-4 px-2')).toBe('p-4 px-2'); // Different properties
    expect(cn('px-4 px-2')).toBe('px-2');    // Same property, later wins
  });
});
```

**Why these tests matter:**

| Test Case | Why Important |
|-----------|---------------|
| Merge strings | Basic functionality |
| Tailwind conflicts | Prevents style bugs (px-4 vs px-2) |
| Conditional classes | Used for active states, hover, etc. |
| Arrays & objects | Advanced usage patterns |
| Null/undefined | Defensive programming |
| Complex conflicts | Real-world scenarios |

**Real-world impact:**
```typescript
// In Button component
className={cn(
  buttonVariants({ variant, size }),  // Base styles
  className                          // Override styles
)}

// If cn() breaks:
// - Override styles might not apply
// - Conflicting classes cause visual bugs
// - Conditional states break
```

**ROI: ⭐⭐⭐⭐⭐ (Maximum)**
- **Effort:** 30 minutes to write tests
- **Value:** Prevents catastrophic UI bugs
- **Coverage:** Affects entire application

---

### 13. Shadcn/UI Components ❌ **NOT WORTH UNIT TESTING**

**Files:**
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/separator.tsx`

**Why NOT unit test:**

#### Button Component
```typescript
// This is a thin wrapper around Radix UI Slot
function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

**Reasons to skip:**
1. ✅ **Already tested by shadcn/ui:** Standard implementation
2. ✅ **Thin wrapper:** No custom logic added
3. ✅ **CVA handles variants:** `class-variance-authority` is tested
4. ✅ **Radix UI tested:** `@radix-ui/react-slot` is tested

**When you SHOULD test shadcn components:**
- ⚠️ If you add custom behavior (event handlers, state)
- ⚠️ If you modify variant logic
- ⚠️ If you add business logic

**Current state:** These are stock implementations → **Skip testing**

---

## Testing Priority Matrix

### Landing Page Components Ranked by Testing Value

| Component | Type | Test Priority | Effort | Value | ROI |
|-----------|------|---------------|--------|-------|-----|
| **MobileMenu.tsx** | React | ⭐⭐⭐⭐⭐ | Medium | High | **⭐⭐⭐⭐⭐** |
| **src/lib/utils.ts (cn)** | Utility | ⭐⭐⭐⭐⭐ | Low | Critical | **⭐⭐⭐⭐⭐** |
| **smoothScrollToSection** | Utility | ⭐⭐⭐ | Low | Medium | **⭐⭐⭐** |
| index.astro | Astro | ❌ | High | Low | ❌ |
| Layout.astro | Astro | ❌ | High | Low | ❌ |
| LandingHeader.astro | Astro | ❌ | High | Low | ❌ |
| HeroSection.astro | Astro | ❌ | High | Low | ❌ |
| FeaturesSection.astro | Astro | ❌ | High | Low | ❌ |
| HowItWorksSection.astro | Astro | ❌ | High | Low | ❌ |
| SocialProofSection.astro | Astro | ❌ | High | Low | ❌ |
| FinalCTASection.astro | Astro | ❌ | High | Low | ❌ |
| Footer.astro | Astro | ❌ | High | Low | ❌ |
| types.ts | Types | ❌ | N/A | N/A | ❌ |
| Button.tsx | UI Lib | ❌ | Medium | Low | ❌ |
| Card.tsx | UI Lib | ❌ | Medium | Low | ❌ |
| Sheet.tsx | UI Lib | ❌ | Medium | Low | ❌ |
| Separator.tsx | UI Lib | ❌ | Medium | Low | ❌ |

---

## Recommended Testing Approach

### Phase 1: Unit Tests (Week 1)

#### Test 1: `src/lib/utils.ts` (cn function)
```bash
# Create test file
touch src/lib/utils.test.ts
```

**Time estimate:** 30-45 minutes

**Test coverage:** 100% of cn() function

**Expected tests:** 8-10 test cases

---

#### Test 2: `src/components/landing/MobileMenu.test.tsx`
```bash
# Create test file
touch src/components/landing/MobileMenu.test.tsx
```

**Time estimate:** 2-3 hours

**Test coverage:**
- State management (open/close)
- Navigation click handling
- Auth button click handling
- Conditional rendering (authenticated vs not)
- Error handling (missing DOM elements)

**Expected tests:** 12-15 test cases

---

### Phase 2: Integration Tests (Week 2)

#### E2E Test: Landing Page User Journey
```typescript
// tests/e2e/landing-page.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Landing Page - Unauthenticated User', () => {
  test('should display all sections', async ({ page }) => {
    await page.goto('/');

    // Verify sections exist
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('#features')).toBeVisible();
    await expect(page.locator('#how-it-works')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should show login and register buttons', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Zaloguj się')).toBeVisible();
    await expect(page.getByText('Zarejestruj się')).toBeVisible();
  });

  test('should scroll to features when "Learn more" clicked', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Dowiedz się więcej').click();

    // Wait for scroll animation
    await page.waitForTimeout(500);

    // Features section should be in viewport
    const featuresSection = page.locator('#features');
    await expect(featuresSection).toBeInViewport();
  });

  test('mobile menu should work', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.goto('/');

    // Open menu
    await page.getByLabel('Otwórz menu').click();

    // Verify menu content
    await expect(page.getByText('Funkcje')).toBeVisible();
    await expect(page.getByText('Jak to działa')).toBeVisible();

    // Click nav link
    await page.getByText('Funkcje').click();

    // Menu should close
    await expect(page.getByText('Funkcje')).not.toBeVisible();
  });
});

test.describe('Landing Page - Authenticated User', () => {
  test.use({
    // Mock authenticated state
    storageState: 'tests/fixtures/authenticated.json'
  });

  test('should show dashboard button instead of auth buttons', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Przejdź do panelu')).toBeVisible();
    await expect(page.getByText('Zaloguj się')).not.toBeVisible();
    await expect(page.getByText('Zarejestruj się')).not.toBeVisible();
  });
});
```

**Time estimate:** 1-2 hours

**Coverage:**
- All user journeys
- Responsive behavior
- Authentication state
- Navigation flows

---

### Phase 3: Visual Regression Tests (Optional)

```typescript
// tests/visual/landing-page.spec.ts
import { test } from '@playwright/test';

test.describe('Landing Page - Visual Regression', () => {
  test('desktop layout', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('landing-desktop.png', {
      fullPage: true,
    });
  });

  test('mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page).toHaveScreenshot('landing-mobile.png', {
      fullPage: true,
    });
  });

  test('tablet layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page).toHaveScreenshot('landing-tablet.png', {
      fullPage: true,
    });
  });
});
```

---

## Summary

### What to Test (Landing Page Specific):

1. ✅ **MobileMenu.tsx** - Only interactive component
   - State management
   - Event handlers
   - Conditional rendering

2. ✅ **src/lib/utils.ts** - Critical utility
   - Class name merging
   - Tailwind conflict resolution

3. ❌ **All Astro components** - Skip unit tests
   - Use E2E tests instead
   - Better suited for integration testing

4. ❌ **Shadcn/UI components** - Skip
   - Already tested by library
   - No custom logic added

5. ❌ **Type definitions** - Skip
   - TypeScript handles this

### Test Distribution:

- **Unit tests:** 2 test files (~20 test cases)
- **E2E tests:** 1 test file (~6-8 test scenarios)
- **Visual regression:** Optional (3 screenshots)

### Time Investment:

- **Unit tests:** 3-4 hours
- **E2E tests:** 1-2 hours
- **Visual regression:** 1 hour

**Total:** 5-7 hours for comprehensive landing page test coverage

### Expected Outcomes:

✅ **Catch bugs before production:**
- Broken mobile menu states
- Navigation scroll failures
- Auth button rendering errors
- Class name merge conflicts

✅ **Enable confident refactoring:**
- Change mobile menu UI without breaking behavior
- Update Tailwind classes safely
- Refactor auth state handling

✅ **Serve as documentation:**
- Tests show how MobileMenu should behave
- Examples of cn() usage patterns

✅ **Prevent regressions:**
- CI runs tests on every commit
- Breaking changes caught immediately

---

## Conclusion

**For the landing page specifically, only 2 components justify unit testing:**

1. **MobileMenu.tsx** - React component with state and event handling
2. **cn() utility** - Used throughout the entire application

**Everything else should be tested via:**
- E2E tests (Playwright)
- Visual regression tests
- Manual testing

**This focused approach provides:**
- ✅ Maximum ROI
- ✅ Fast test execution
- ✅ Easy maintenance
- ✅ Comprehensive coverage where it matters

**Avoid the trap of testing for testing's sake.** Astro components, static data, and third-party libraries don't benefit from unit tests.
