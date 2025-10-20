# Color Schema - HealthyMeal Landing Page

## Overview

The HealthyMeal application uses a **green/healthy theme** with neutral grays for a fresh, health-focused brand identity. The color palette emphasizes natural, wholesome qualities while maintaining excellent readability and accessibility.

## Color Palette

### Primary Colors (Green)

```
green-50   - #f0fdf4  - Lightest green, backgrounds
green-100  - #dcfce7  - Light green, icon backgrounds
green-200  - #bbf7d0  - Decorative elements
green-400  - #4ade80  - Decorative blur effects
green-500  - #22c55e  - Decorative blur effects
green-600  - #16a34a  - PRIMARY BRAND COLOR (main actions, accents)
green-700  - #15803d  - Hover states, darker accents
```

**Primary Brand Color:** `green-600` (#16a34a)

### Neutral Colors (Gray)

```
gray-50    - #f9fafb  - Section backgrounds, subtle surfaces
gray-100   - #f3f4f6  - Card backgrounds, borders
gray-200   - #e5e7eb  - Dividers, borders
gray-300   - #d1d5db  - Border colors, disabled states
gray-400   - #9ca3af  - Placeholder text, icons
gray-600   - #4b5563  - Secondary text, descriptions
gray-700   - #374151  - Primary text (links, navigation)
gray-900   - #111827  - Headings, primary text
```

### Base Colors

```
white      - #ffffff  - Backgrounds, cards, buttons
```

## Usage Patterns

### Headers & Navigation

**LandingHeader:**
- Background: `white/80` (with backdrop-blur)
- Logo text: `gray-900` (hover: `green-600`)
- Navigation links: `gray-700` (hover: `green-600`)
- Login button border: `gray-300` (hover: `green-600`)
- Register button: `green-600` background (hover: `green-700`)
- Sticky positioning on desktop

**MobileMenu:**
- Navigation text: `gray-700` (hover: `green-600`)
- Divider: `gray-200`
- Auth buttons: Same as header

### Hero Section

**Background:**
- Gradient: `from-green-50 to-white`

**Typography:**
- H1: `gray-900` with `green-600` accent word
- Subheadline: `gray-600`

**Buttons:**
- Primary CTA: `green-600` (hover: `green-700`)
- Secondary: `green-600` border, `green-600` text (hover: `green-50` background)

**Illustration:**
- Gradient: `from-green-100 to-green-200`
- Icon: `green-600`
- Decorative blurs: `green-400`, `green-500`

### Content Sections

**FeaturesSection:**
- Section background: `white` (default)
- Card borders: `border-2` (hover: `green-600`)
- Icon backgrounds: `green-100`
- Icons: `green-600`
- Headings: `gray-900`
- Descriptions: `gray-600`

**HowItWorksSection:**
- Section background: `gray-50`
- Number badges: `green-600` background with white text
- Card styling: Same as FeaturesSection
- Connecting arrows: `green-600`

**SocialProofSection:**
- Headings: `gray-900`
- Descriptions: `gray-600`
- Placeholder cards: `gray-50` background, `gray-300` dashed border
- Placeholder text: `gray-400`
- Stats numbers: `green-600` (bold)

**FinalCTASection:**
- Background gradient: `from-green-600 to-green-700`
- Icon background: `white/20`
- All text: `white` or `green-50`
- CTA button: `white` background with `green-600` text (hover: `gray-100`)
- Trust indicators: `green-100` text

### Footer

**Background:** `gray-50`

**Elements:**
- Logo text: `gray-900`
- Description: `gray-600`
- Social icons: `gray-200` background, `gray-600` icon (hover: `green-600` background, white icon)
- Link group titles: `gray-900`
- Links: `gray-600` (hover: `green-600`)
- Copyright: `gray-600`

## Semantic Design Tokens

### Actions & Interactions

```
Primary Action:    green-600 (background), white (text)
Primary Hover:     green-700 (background)
Secondary Action:  green-600 (border/text), white (background)
Secondary Hover:   green-50 (background)
```

### Typography

```
Headings (H1-H2):  gray-900
Subheadings (H3):  gray-900
Body Text:         gray-600
Navigation:        gray-700
Link Hover:        green-600
```

### Surfaces & Borders

```
Page Background:   white
Section Alt BG:    gray-50
Card Background:   white
Card Border:       gray-200 or border-2
Card Hover:        green-600 (border)
Dividers:          gray-200
```

### States

```
Default:           gray-300 (borders), gray-600 (text)
Hover:             green-600
Active/Selected:   green-600
Disabled:          gray-300, opacity-50
Placeholder:       gray-400
```

## Accessibility Notes

- **Text Contrast:** All text colors meet WCAG AA standards for contrast ratios
  - `gray-900` on `white`: High contrast for headings
  - `gray-600` on `white`: Sufficient for body text
  - `white` on `green-600`: Good contrast for buttons
  - `green-600` on `white`: Good contrast for links/accents

- **Interactive Elements:**
  - Green hover states provide clear feedback
  - Border colors ensure visibility
  - Focus states inherit from Shadcn/ui components

## Usage Guidelines

### When to Use Green

✅ **Use green for:**
- Primary call-to-action buttons
- Brand-related elements (logo accents, headings highlights)
- Interactive hover states
- Success states and positive indicators
- Icon backgrounds (light green-100)
- Stats and metrics highlighting
- Decorative gradient elements

❌ **Avoid green for:**
- Long-form body text (use gray-600)
- Disabled states
- Error messages

### When to Use Gray

✅ **Use gray for:**
- All body text and descriptions (gray-600)
- Navigation links (gray-700)
- Headings (gray-900)
- Backgrounds and surfaces (gray-50, white)
- Borders and dividers (gray-200, gray-300)
- Disabled and placeholder states (gray-400, gray-300)

### Background Combinations

**High Contrast (Primary Content):**
```
white background + gray-900 headings + gray-600 body
```

**Subtle Differentiation (Sections):**
```
gray-50 background + gray-900 headings + gray-600 body
```

**Bold Conversion (CTAs):**
```
green-600/700 gradient + white text
```

**Soft Highlight (Hero):**
```
green-50 to white gradient + gray-900/600 text
```

## Implementation Examples

### Primary Button
```html
<button class="bg-green-600 text-white hover:bg-green-700">
  Zacznij za darmo
</button>
```

### Secondary Button
```html
<button class="border border-green-600 text-green-600 hover:bg-green-50">
  Dowiedz się więcej
</button>
```

### Icon Badge
```html
<div class="bg-green-100 rounded-lg">
  <Icon class="text-green-600" />
</div>
```

### Card Hover Effect
```html
<Card class="border-2 hover:border-green-600 hover:shadow-lg">
  ...
</Card>
```

### Section Background
```html
<section class="bg-gray-50">
  <!-- Alternating section background -->
</section>
```
