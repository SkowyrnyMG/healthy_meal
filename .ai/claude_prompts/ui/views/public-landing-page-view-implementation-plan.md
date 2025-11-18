# View Implementation Plan: Public Landing Page

## 1. Overview

The Public Landing Page is the marketing entry point for the HealthyMeal application, accessible at the root path `/`. This static page serves to attract new users by clearly communicating the application's value proposition: AI-powered recipe modification for personalized dietary needs. The page is designed with a mobile-first approach, features Polish-language content, and prioritizes fast loading times with minimal JavaScript. It includes placeholder Login/Register functionality that will be connected to actual authentication endpoints in future development phases.

## 2. View Routing

**Path:** `/`

**File Location:** `src/pages/index.astro`

This page uses Astro's static site generation capabilities and should be accessible without authentication.

## 3. Component Structure

```
LandingPage (index.astro)
├── LandingHeader
│   ├── Logo
│   ├── DesktopNavigation
│   │   ├── NavLink (Features)
│   │   ├── NavLink (How It Works)
│   │   └── NavLink (Pricing)
│   ├── MobileMenu (React Component)
│   └── AuthButtons
│       ├── LoginButton (placeholder)
│       └── RegisterButton (placeholder)
├── HeroSection
│   ├── Headline (H1)
│   ├── Subheadline
│   ├── PrimaryCTA
│   └── HeroIllustration
├── FeaturesSection
│   ├── SectionTitle (H2)
│   └── FeatureGrid
│       └── FeatureCard (3-4 instances)
│           ├── Icon
│           ├── Title (H3)
│           └── Description
├── HowItWorksSection
│   ├── SectionTitle (H2)
│   └── StepsGrid
│       └── StepCard (3 instances)
│           ├── StepNumber
│           ├── Icon
│           ├── Title (H3)
│           └── Description
├── SocialProofSection
│   ├── SectionTitle (H2)
│   └── PlaceholderContent
├── FinalCTASection
│   ├── CTAHeadline
│   ├── CTASubtext
│   └── CTAButton
└── Footer
    ├── FooterLinks
    ├── Copyright
    └── ContactInfo
```

## 4. Component Details

### LandingHeader

**Component Description:**
The header serves as the primary navigation component for the landing page, containing the logo, navigation links, and authentication buttons. On desktop, it becomes sticky when the user scrolls. On mobile, it displays a hamburger menu button that opens the MobileMenu component.

**Main Elements:**

- `<header>` element with sticky positioning (desktop only: `md:sticky md:top-0`)
- Logo image or text with link to home page
- `<nav>` element containing navigation links (desktop only, hidden on mobile)
- MobileMenu toggle button (mobile only, hidden on desktop)
- Authentication button group (Login and Register buttons)

**Handled Interactions:**

- Click on navigation links triggers smooth scroll to respective sections
- Click on mobile menu toggle opens/closes the MobileMenu component
- Hover states on navigation links and buttons

**Handled Validation:**

- None (static component)

**Types:**

```typescript
interface NavLink {
  href: string;
  label: string;
}
```

**Props:**
None (standalone component, uses inline data)

---

### MobileMenu (React Component)

**Component Description:**
An interactive React component that provides mobile navigation through a hamburger menu interface. This component manages its own state to control the open/closed status and renders a slide-in menu with navigation links.

**Main Elements:**

- Hamburger icon button (toggle)
- Overlay backdrop (when open)
- Slide-in menu panel with navigation links
- Close button
- Navigation links matching desktop navigation

**Handled Interactions:**

- Click on hamburger icon toggles menu open
- Click on backdrop closes menu
- Click on navigation link scrolls to section and closes menu
- Click on close button closes menu

**Handled Validation:**

- None

**Types:**

```typescript
interface MobileMenuProps {
  client: load; // Astro client directive
}
```

**State:**

- `isOpen: boolean` - controls menu visibility

**Props:**

- `client:load` directive for hydration

---

### HeroSection

**Component Description:**
The hero section is the primary focal point of the landing page, featuring a large headline in Polish that communicates the application's core value proposition, a supporting subheadline, and a prominent call-to-action button. It's designed to immediately capture user attention and encourage registration.

**Main Elements:**

- `<section>` wrapper with background styling
- `<h1>` with text "Dopasuj przepisy do swojej diety z pomocą AI"
- `<p>` subheadline explaining AI-powered recipe modification benefits
- Primary CTA button with text "Zacznij za darmo"
- Secondary button with text "Dowiedz się więcej" (optional)
- Hero illustration or image (placeholder or SVG illustration)

**Handled Interactions:**

- Click on "Zacznij za darmo" button (currently no action, placeholder for future registration)
- Click on "Dowiedz się więcej" button scrolls to features section
- Hover states on buttons

**Handled Validation:**

- None

**Types:**
None (uses inline content)

**Props:**
None

---

### FeaturesSection

**Component Description:**
This section showcases 3-4 key features of the HealthyMeal application in an easy-to-scan grid layout. Each feature is presented as a card with an icon, title, and description, highlighting the main benefits: calorie adjustment, protein increase, ingredient substitutions, and AI-powered customization.

**Main Elements:**

- `<section>` wrapper with id="features" for anchor linking
- `<h2>` section title
- Grid container (responsive: 1 column mobile, 2-3 columns tablet/desktop)
- Feature cards (3-4 instances):
  - Icon component (lucide-react icon)
  - `<h3>` feature title
  - `<p>` feature description

**Handled Interactions:**

- None (static content)

**Handled Validation:**

- None

**Types:**

```typescript
interface Feature {
  icon: string; // lucide-react icon name (e.g., 'Flame', 'Beef', 'Replace')
  title: string;
  description: string;
}
```

**Props:**
None (uses inline data array of features)

**Content Structure:**

```typescript
const features: Feature[] = [
  {
    icon: "Flame",
    title: "Dostosuj kaloryczność",
    description: "Automatycznie obniżaj lub podwyższaj wartość kaloryczną przepisów zgodnie z Twoimi celami.",
  },
  {
    icon: "Beef",
    title: "Zwiększ białko",
    description: "Optymalizuj przepisy pod kątem zawartości białka dla lepszych wyników treningowych.",
  },
  {
    icon: "Replace",
    title: "Zamień składniki",
    description: "Znajdź zdrowsze alternatywy dla składników z porównaniem wartości odżywczych.",
  },
  // Optional 4th feature
];
```

---

### HowItWorksSection

**Component Description:**
This section explains the application's workflow through a clear 3-step process, making it easy for users to understand how to use the application. Each step is presented with a number, icon, title, and description.

**Main Elements:**

- `<section>` wrapper with id="how-it-works" for anchor linking
- `<h2>` section title "Jak to działa?"
- Steps container (responsive grid or flex layout)
- Step cards (3 instances):
  - Step number badge (1, 2, 3)
  - Icon component
  - `<h3>` step title
  - `<p>` step description

**Handled Interactions:**

- None (static content)

**Handled Validation:**

- None

**Types:**

```typescript
interface Step {
  number: number;
  title: string;
  description: string;
  icon: string; // lucide-react icon name
}
```

**Props:**
None (uses inline data array of steps)

**Content Structure:**

```typescript
const steps: Step[] = [
  {
    number: 1,
    title: "Dodaj przepis",
    description: "Wprowadź swój ulubiony przepis lub wybierz z naszej kolekcji.",
    icon: "FileText",
  },
  {
    number: 2,
    title: "Modyfikuj z AI",
    description: "Dostosuj przepis do swoich potrzeb żywieniowych za pomocą sztucznej inteligencji.",
    icon: "Sparkles",
  },
  {
    number: 3,
    title: "Gotuj zdrowo",
    description: "Przygotuj posiłki idealnie dopasowane do Twojej diety i celów.",
    icon: "ChefHat",
  },
];
```

---

### SocialProofSection

**Component Description:**
A placeholder section reserved for future testimonials, user statistics, or social proof elements. Currently displays minimal content with a note indicating upcoming features.

**Main Elements:**

- `<section>` wrapper
- `<h2>` section title (e.g., "Dołącz do tysięcy zadowolonych użytkowników")
- Placeholder content or empty testimonial grid structure
- Optional: Commented-out structure for future testimonials

**Handled Interactions:**

- None

**Handled Validation:**

- None

**Types:**
None currently (placeholder)

**Props:**
None

---

### FinalCTASection

**Component Description:**
A secondary conversion section positioned near the bottom of the page to re-engage users who have scrolled through all the content. It reinforces the value proposition and provides another opportunity to register.

**Main Elements:**

- `<section>` wrapper with background styling (different from hero)
- `<h2>` or `<h3>` CTA headline (e.g., "Zacznij swoją zdrowszą przygodę kulinarną już dziś")
- `<p>` supporting text
- CTA button with text "Zacznij za darmo"

**Handled Interactions:**

- Click on CTA button (currently no action, placeholder for future registration)
- Hover state on button

**Handled Validation:**

- None

**Types:**
None

**Props:**
None

---

### Footer

**Component Description:**
The footer provides supplementary navigation, legal information, and contact details. It follows a standard footer layout with link groups and copyright information.

**Main Elements:**

- `<footer>` wrapper
- Link columns/groups (optional: Product, Company, Resources, Legal)
- Copyright text
- Contact information or social media links (optional)

**Handled Interactions:**

- Click on footer links (navigation to respective pages)

**Handled Validation:**

- None

**Types:**

```typescript
interface FooterLink {
  label: string;
  href: string;
}

interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}
```

**Props:**
None (uses inline data)

## 5. Types

Since this is a static landing page with no backend integration, types are primarily used for component props and inline data structures.

### Component-Level Types

```typescript
// Navigation
interface NavLink {
  href: string; // Anchor link (e.g., '#features', '#how-it-works')
  label: string; // Display text in Polish
}

// Features Section
interface Feature {
  icon: string; // lucide-react icon name
  title: string; // Feature title in Polish
  description: string; // Feature description in Polish
}

// How It Works Section
interface Step {
  number: number; // Step number (1, 2, or 3)
  title: string; // Step title in Polish
  description: string; // Step description in Polish
  icon: string; // lucide-react icon name
}

// Footer
interface FooterLink {
  label: string; // Link text
  href: string; // Link destination
}

interface FooterLinkGroup {
  title: string; // Group title (e.g., 'Produkt', 'Firma')
  links: FooterLink[]; // Array of links in this group
}
```

### MobileMenu React Component Types

```typescript
interface MobileMenuProps {
  // No props needed, component is self-contained
}

interface MobileMenuState {
  isOpen: boolean; // Controls menu visibility
}
```

**Type Location:**
These types can be defined inline within each component file or in a shared `src/components/landing/types.ts` file if preferred.

## 6. State Management

### State Requirements

This view requires minimal state management due to its static nature. The only stateful component is the MobileMenu React component.

### MobileMenu Component State

**State Variable:** `isOpen`

- **Type:** `boolean`
- **Initial Value:** `false`
- **Purpose:** Controls the visibility of the mobile navigation menu
- **Updates:**
  - Set to `true` when hamburger button is clicked
  - Set to `false` when close button is clicked, backdrop is clicked, or navigation link is clicked

**Implementation:**

```typescript
const [isOpen, setIsOpen] = useState(false);

const handleToggle = () => setIsOpen(!isOpen);
const handleClose = () => setIsOpen(false);
```

### Custom Hooks

**Not Required** - The state management is simple enough to be handled directly in the MobileMenu component without the need for custom hooks.

### Global State

**Not Required** - No global state management is needed for this static landing page.

## 7. API Integration

### Current State

**No API Integration Required** - This is a static marketing page with no backend communication.

### Future Integration Points

When authentication is implemented, the following endpoints will be integrated:

1. **Login Button Click**
   - **Endpoint:** `/api/auth/login` (future)
   - **Method:** Navigation to login page
   - **Current Behavior:** Button is non-functional placeholder

2. **Register Button Click**
   - **Endpoint:** `/api/auth/register` (future)
   - **Method:** Navigation to registration page
   - **Current Behavior:** Button is non-functional placeholder

### Placeholder Implementation

Login and Register buttons should include:

- Visual indication they are placeholders (optional: subtle "Coming Soon" tooltip)
- `href="#"` or `onClick` handler with no action
- Proper styling to match final design
- ARIA attributes for accessibility

## 8. User Interactions

### Primary Interactions

1. **Navigation Link Clicks (Desktop & Mobile)**
   - **Trigger:** User clicks on "Features", "How It Works", or "Pricing" link
   - **Action:** Smooth scroll to the corresponding section on the page
   - **Implementation:** HTML anchor links (`href="#features"`) with CSS `scroll-behavior: smooth` or JavaScript smooth scroll

2. **Primary CTA Button Click ("Zacznij za darmo")**
   - **Trigger:** User clicks the primary CTA button in HeroSection or FinalCTASection
   - **Current Action:** No action (placeholder)
   - **Future Action:** Navigate to registration page
   - **Implementation:** `<button>` or `<a>` with placeholder behavior

3. **Secondary CTA Button Click ("Dowiedz się więcej")**
   - **Trigger:** User clicks the secondary button in HeroSection
   - **Action:** Smooth scroll to FeaturesSection
   - **Implementation:** Anchor link to `#features`

4. **Login Button Click**
   - **Trigger:** User clicks Login button in header
   - **Current Action:** No action (placeholder)
   - **Future Action:** Navigate to login page
   - **Implementation:** `<button>` or `<a>` with placeholder behavior

5. **Register Button Click**
   - **Trigger:** User clicks Register button in header
   - **Current Action:** No action (placeholder)
   - **Future Action:** Navigate to registration page
   - **Implementation:** `<button>` or `<a>` with placeholder behavior

6. **Mobile Menu Toggle**
   - **Trigger:** User clicks hamburger icon (mobile only)
   - **Action:** Opens mobile menu overlay
   - **Implementation:** React state update in MobileMenu component

7. **Mobile Menu Close**
   - **Trigger:** User clicks close button, backdrop, or navigation link
   - **Action:** Closes mobile menu overlay
   - **Implementation:** React state update in MobileMenu component

8. **Page Scroll (Desktop)**
   - **Trigger:** User scrolls down the page
   - **Action:** Header becomes sticky and remains at top of viewport
   - **Implementation:** CSS `position: sticky` with Tailwind classes

### Hover States

All interactive elements should have appropriate hover states:

- Navigation links: Color change or underline
- CTA buttons: Background color change or subtle elevation
- Login/Register buttons: Background color change
- Mobile menu items: Background highlight

## 9. Conditions and Validation

### Validation Requirements

**None** - This is a static landing page with no form inputs or data submission.

### Conditional Rendering

1. **Desktop vs Mobile Navigation**
   - **Condition:** Screen width (responsive breakpoints)
   - **Desktop (md and above):** Show inline navigation links, hide hamburger button
   - **Mobile (below md):** Hide inline navigation, show hamburger button
   - **Implementation:** Tailwind responsive classes (`hidden md:flex`, `md:hidden`)

2. **Mobile Menu Visibility**
   - **Condition:** `isOpen` state in MobileMenu component
   - **When true:** Display menu overlay and panel
   - **When false:** Hide menu overlay and panel
   - **Implementation:** Conditional rendering in React component

3. **Sticky Header**
   - **Condition:** Screen width (desktop only)
   - **Desktop:** Apply sticky positioning
   - **Mobile:** Static positioning
   - **Implementation:** Tailwind responsive classes (`md:sticky md:top-0`)

### Display Logic

All content is static and displayed unconditionally. No dynamic content loading or conditional sections based on user state.

## 10. Error Handling

### Current Error Scenarios

**None** - Since this is a static page with no API calls or form submissions, there are no error scenarios to handle at this stage.

### Future Error Handling

When authentication is implemented:

1. **Login Failure**
   - Display error message for invalid credentials
   - Maintain user input in form fields
   - Provide clear guidance for password reset

2. **Registration Failure**
   - Display validation errors (email format, password strength, etc.)
   - Highlight specific fields with errors
   - Provide clear error messages in Polish

3. **Network Errors**
   - Display user-friendly message for connection issues
   - Provide retry option
   - Graceful degradation

### Edge Cases

1. **JavaScript Disabled**
   - Page content remains fully accessible
   - Navigation still works via anchor links
   - MobileMenu won't function (consider fallback)

2. **Slow Connection**
   - Optimize images and assets
   - Use appropriate loading states
   - Minimize JavaScript bundle size

3. **Small Screens**
   - Ensure all content is readable and accessible
   - Test on various device sizes
   - Maintain touch-friendly hit areas (minimum 44x44px)

## 11. Implementation Steps

### Step 1: Project Setup and File Structure

1. Create `src/pages/index.astro` for the main landing page
2. Create component directory `src/components/landing/` for landing-specific components
3. Ensure Tailwind and lucide-react dependencies are installed

### Step 2: Implement LandingHeader Component

1. Create `src/components/landing/LandingHeader.astro`
2. Add logo section (text or image)
3. Implement desktop navigation with anchor links
4. Add Login and Register placeholder buttons
5. Apply sticky positioning for desktop (`md:sticky md:top-0`)
6. Style with Tailwind classes
7. Ensure proper ARIA labels and semantic HTML

### Step 3: Implement MobileMenu React Component

1. Create `src/components/landing/MobileMenu.tsx`
2. Set up component state with `useState` for `isOpen`
3. Implement hamburger button with click handler
4. Create overlay backdrop with close handler
5. Build slide-in menu panel with navigation links
6. Add smooth scroll functionality on link click
7. Style with Tailwind classes (slide-in animation)
8. Test open/close interactions

### Step 4: Implement HeroSection Component

1. Create `src/components/landing/HeroSection.astro`
2. Add main headline (H1): "Dopasuj przepisy do swojej diety z pomocą AI"
3. Add supporting subheadline text
4. Implement primary CTA button "Zacznij za darmo"
5. Add optional secondary button "Dowiedz się więcej"
6. Add hero illustration or placeholder image
7. Style with Tailwind (responsive layout, typography, spacing)
8. Ensure accessibility (alt text, ARIA labels)

### Step 5: Implement FeaturesSection Component

1. Create `src/components/landing/FeaturesSection.astro`
2. Define features array with 3-4 feature objects
3. Add section title (H2)
4. Create responsive grid layout (1 column mobile, 2-3 columns desktop)
5. Map over features to create feature cards
6. Add lucide-react icons for each feature
7. Style cards with consistent spacing and styling
8. Add id="features" for anchor linking

### Step 6: Implement HowItWorksSection Component

1. Create `src/components/landing/HowItWorksSection.astro`
2. Define steps array with 3 step objects
3. Add section title (H2): "Jak to działa?"
4. Create layout for step cards (horizontal or vertical flow)
5. Map over steps to create numbered step cards
6. Add step numbers, icons, titles, and descriptions
7. Style with visual hierarchy (numbers prominent)
8. Add id="how-it-works" for anchor linking

### Step 7: Implement SocialProofSection Component

1. Create `src/components/landing/SocialProofSection.astro`
2. Add section title (H2)
3. Add placeholder content or empty grid structure
4. Include HTML comment indicating "Testimonials coming soon"
5. Style section to match overall design
6. Consider adding subtle background or border

### Step 8: Implement FinalCTASection Component

1. Create `src/components/landing/FinalCTASection.astro`
2. Add CTA headline (H2 or H3)
3. Add supporting text
4. Implement CTA button "Zacznij za darmo"
5. Style with distinctive background (different from hero)
6. Ensure button styling matches primary CTA

### Step 9: Implement Footer Component

1. Create `src/components/landing/Footer.astro`
2. Define footer link groups structure
3. Create responsive layout (stacked on mobile, columns on desktop)
4. Add link groups with titles and links
5. Add copyright text with current year
6. Add optional contact information
7. Style with Tailwind (appropriate spacing, typography)

### Step 10: Compose Main Landing Page

1. Open `src/pages/index.astro`
2. Import all landing components
3. Set up page layout with proper structure
4. Add components in order:
   - LandingHeader
   - HeroSection
   - FeaturesSection
   - HowItWorksSection
   - SocialProofSection
   - FinalCTASection
   - Footer
5. Add MobileMenu component with `client:load` directive
6. Set page title and meta description
7. Ensure proper semantic HTML structure

### Step 11: Implement Smooth Scroll Behavior

1. Add CSS for smooth scrolling:
   ```css
   html {
     scroll-behavior: smooth;
   }
   ```
2. Ensure all anchor links use proper href format (`#section-id`)
3. Test navigation links scroll to correct sections
4. Adjust scroll offset if needed for sticky header

### Step 12: Responsive Design Implementation

1. Review all components for responsive breakpoints
2. Test layout on mobile devices (320px, 375px, 414px)
3. Test layout on tablets (768px, 1024px)
4. Test layout on desktop (1280px, 1440px, 1920px)
5. Ensure touch targets are minimum 44x44px
6. Verify text readability at all sizes
7. Check image scaling and aspect ratios

### Step 13: Accessibility Audit

1. Verify proper heading hierarchy (H1 → H2 → H3)
2. Add ARIA labels to icon-only buttons
3. Ensure all images have alt text
4. Test keyboard navigation (Tab, Enter, Escape)
5. Check color contrast ratios (WCAG AA minimum)
6. Test with screen reader (VoiceOver or NVDA)
7. Ensure focus indicators are visible
8. Add skip-to-content link (optional)

### Step 14: Performance Optimization

1. Optimize images (compress, use appropriate formats)
2. Consider using SVG for illustrations
3. Minimize JavaScript bundle (only MobileMenu needs JS)
4. Review Tailwind output for unused classes
5. Test page load time (target < 2 seconds)
6. Check Lighthouse score
7. Ensure above-the-fold content loads first

### Step 15: Content Review

1. Verify all Polish text is correct and natural
2. Check spelling and grammar
3. Ensure CTA button text is "Zacznij za darmo"
4. Verify headline is "Dopasuj przepisy do swojej diety z pomocą AI"
5. Confirm 3 steps are correctly described
6. Review tone and messaging consistency

### Step 16: Final Testing

1. Test all interactive elements (buttons, links, menu)
2. Verify smooth scrolling works correctly
3. Test mobile menu open/close functionality
4. Check sticky header behavior on scroll
5. Test on multiple browsers (Chrome, Firefox, Safari, Edge)
6. Test on actual mobile devices
7. Verify placeholder buttons have appropriate behavior

### Step 17: Documentation

1. Add comments to complex sections
2. Document component props and usage
3. Create README note about placeholder functionality
4. Document future integration points for auth system

### Step 18: Code Review and Cleanup

1. Review code for consistency with project standards
2. Remove any unused imports or code
3. Ensure proper TypeScript typing
4. Format code with Prettier
5. Run ESLint and fix any issues
6. Check for console errors or warnings

### Step 19: Deploy Preparation

1. Test production build (`npm run build`)
2. Preview production build (`npm run preview`)
3. Verify all assets load correctly
4. Check for any build warnings
5. Ensure environment variables are not needed
6. Confirm page works without authentication

### Step 20: Handoff and Future Notes

1. Document areas that need backend integration
2. Note where Login/Register functionality should be connected
3. List any design assets that may need creation (illustrations, images)
4. Prepare notes for testimonials content when available
5. Document any assumptions made during implementation
