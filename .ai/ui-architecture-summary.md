# UI Architecture Planning - Conversation Summary

## Latest Round Answers (Questions 51-60)

51. **AI Modify button behavior on Modified tab**: Allow it with replacement warning - when clicked, show dialog "Ten przepis ma już modyfikację. Nowa modyfikacja zastąpi obecną. Kontynuować?" with Confirm/Cancel options
52. **Tag creation interface**: Agreed - add "+ Dodaj nowy tag" button below tag checkboxes, show inline input/dialog for tag creation, auto-generate slug, save to DB via API, immediately update UI
53. **Global loading state indicator**: Agreed - implement subtle top progress bar for page navigations and API calls >500ms
54. **Dashboard public recipes section**: Agreed - show 4-6 random public recipes in horizontal scrolling row, simplified cards, "Zobacz więcej" link, refresh on page load
55. **Form placeholder text**: Agreed - use both visible labels and helpful placeholder text for better accessibility
56. **Modifying recipe with existing modification**: Allow modifications with information about overwriting (replacement warning)
57. **Recipe steps display**: Simple numbered list for MVP (no checkboxes, no cooking mode)
58. **Collections dropdown**: Agreed - keep it simple, add to one collection at a time
59. **API validation error display**: Agreed - show both inline per-field errors and summary alert at top of form
60. **Nutrition pie chart edge cases**: Each piece of macro nutrition (FAT, Protein, Carbs, Fiber) should have at least 10% space on chart; if value is 0, don't display on chart

**Follow-up clarifications for Q51**:
- **Edit button on Modified tab**: Hide the Edit button on modified tab (only show on Original tab)
- **Delete modification functionality**: Yes - add 'Usuń modyfikację' button on Modified tab to remove only the modification (keep original recipe)

---

<conversation_summary>

<decisions>

### Core Architecture Decisions

1. **Framework Pattern**: Use Astro's multi-page architecture with partial hydration (NOT SPA). Create separate `.astro` pages for major views with static content, use React components with `client:load` or `client:visible` only for interactive elements.

2. **State Management**: Keep it simple for MVP - use React Context for auth state (deferred) and reference data cache (tags, allergens), component-level state (useState) for UI state, URL state for filters/search, NO global state management library.

3. **Authentication**: Skip auth logic implementation for MVP, focus purely on UI components and flows.

4. **Caching Strategy**: Don't implement client-side caching in MVP to reduce complexity. Consider for post-MVP improvements.

### Recipe Management

5. **Recipe Creation Form**: Implement multi-step wizard with 6 steps: (1) Basic Info, (2) Ingredients (dynamic list), (3) Preparation Steps (ordered list), (4) Nutrition Values (6 fields), (5) Tags (checkboxes + custom creation), (6) Review & Submit.

6. **Form State Persistence**: Save draft to localStorage every 2-3 seconds with namespaced keys:
   - New recipe: `draft_recipe_new`
   - Edit recipe: `draft_recipe_edit_{recipeId}`
   - Include timestamp, auto-expire after 24 hours
   - Show restoration prompt on form mount if recent draft found
   - Clear draft on successful submit or explicit discard

7. **Recipe Display Cards**: Show summarized nutrition (calories badge with color-coding: green <400, yellow 400-600, orange >600) and protein amount. Full nutrition on hover (desktop) or tap-to-expand (mobile).

8. **Recipe Detail Layout**: Single-column on mobile, two-column on desktop (left: recipe content, right sidebar: nutrition card + action buttons).

9. **Recipe Modification Display**: When recipe has AI modification, show tabs "Oryginalny" | "Zmodyfikowany":
   - **Original Tab**: Shows original recipe, all actions available (Edit, Delete, Modify with AI, Favorite, Add to Collection)
   - **Modified Tab**: Shows modified data, "Modyfikuj z AI" button active with replacement warning, "Edytuj" button HIDDEN, "Usuń modyfikację" button available, info banner explaining this is modified version

10. **Servings Adjuster**: Display [−] **4 porcje** [+] buttons that dynamically update ingredient amounts in real-time using ratio calculation from original values.

11. **Recipe Steps**: Simple numbered list for MVP (no checkboxes, no cooking mode features).

### AI Modification Flow

12. **AI Modification Limit**: Allow only ONE modification per recipe for MVP.

13. **Modification Flow**: Modal dialog with: (1) Type selection, (2) Parameter input (hybrid: preset buttons + custom slider), (3) Loading state with progress indicators, (4) Split-view comparison (side-by-side desktop, tabs mobile), (5) Confirm to save modification to DB or Cancel to discard.

14. **Modification Replacement**: When modifying a recipe that already has a modification, show alert dialog "Ten przepis ma już modyfikację. Nowa modyfikacja zastąpi obecną. Kontynuować?" with Confirm/Cancel options. If confirmed, delete old modification and create new one.

15. **AI Loading State**: Display modal overlay with animated spinner, estimated time remaining, rotating status messages ("Analizuję przepis...", "Obliczam wartości odżywcze...", "Finalizuję zmiany..."), and cancel button for 3-5 second AI processing.

16. **Modification Parameters**: Hybrid approach - provide quick-action preset buttons ("Zmniejsz kalorie o 20%", "Zwiększ białko o 50%") AND "Dostosuj" option revealing slider/number input for precise control.

### Search, Filtering & Navigation

17. **Search & Filtering**: Implement URL-based filtering - search bar at top, "Filtry" button opening collapsible panel (desktop) or drawer (mobile) with tag multi-select, max calories slider, max prep time slider, sort options. Display active filters as removable chips above results.

18. **Navigation Structure**: Two-level navigation - (1) Primary: persistent header/sidebar with Dashboard, Moje Przepisy, Publiczne Przepisy, Kolekcje, Profile; (2) Contextual sub-navigation within sections. Mobile: bottom tab bar for primary, hamburger for secondary.

19. **Public Recipes**: For MVP, display random 10 public recipes (no advanced sorting/curation). Show author name on cards. Actions: View, Favorite, Add to Collection (no Edit/Delete).

20. **Breadcrumbs**: Skip breadcrumb navigation for MVP to keep UI simple.

### Collections & Favorites

21. **Collections Page**: Dedicated page with grid of collection cards showing name, recipe count, thumbnail grid of first 3-4 recipes. Click card → navigate to collection detail with filtered recipes list.

22. **Adding to Collections**: "Add to Collection" dropdown/dialog on recipe cards and detail page. If no collections exist, skip selection and directly open "Create Collection" dialog with message "Nie masz jeszcze kolekcji. Utwórz pierwszą!" After creating, automatically add recipe to it.

23. **Collections Management**: Keep simple for MVP - add recipe to ONE collection at a time (no multi-select). Show which collections already contain recipe with "Już dodano" label (disabled).

24. **Favorites**: Simple heart icon toggle (outline when not favorited, filled when favorited). Optimistic UI update with toast notification. Favorites page displays favorited recipes in same card layout as main list, sorted by date added (most recent first).

### Tags System

25. **Tag Selection**: Display all available tags (15-20 predefined + user-created custom tags) as checkboxes in responsive grid (3 cols desktop, 2 tablet, 1 mobile). Allow selecting multiple tags, limit maximum to 5 per recipe.

26. **Custom Tag Creation**: Add "+ Dodaj nowy tag" button below tag grid. When clicked, show inline input field or small dialog with text input for tag name. Auto-generate slug (lowercase, hyphens, no special characters). On submit, create tag via API, add to list immediately and auto-check it. Handle duplicate names with error message.

### Dashboard & Landing Pages

27. **Public Landing Page**: Create modern single-page with sections: (1) Hero with headline "Dopasuj przepisy do swojej diety z pomocą AI" and CTAs, (2) Features (3-4 benefits), (3) How It Works (3 steps), (4) Social proof placeholder, (5) Final CTA.

28. **User Dashboard**: Landing page for logged users with sections: (1) Welcome banner + quick action button, (2) "Twoje ostatnie przepisy" (last 4-6 recipes, horizontal scroll), (3) "Ulubione" (last 4-6 favorites), (4) "Przeglądaj publiczne przepisy" (4-6 random public recipes, refresh on load). Each section has "Zobacz wszystkie/więcej" link.

### Profile & Settings

29. **Profile Settings Layout**: Single page with sidebar navigation (desktop) or tab navigation (mobile) organizing settings into: (1) Podstawowe dane, (2) Preferencje żywieniowe, (3) Alergeny, (4) Nielubiane składniki, (5) Konto.

### UI Patterns & Components

30. **Form Validation**: Progressive validation approach - required fields on blur, format validation real-time with 500ms debounce, cross-field validation on submit. Display inline errors below fields AND summary alert at top for multiple errors. Use Shadcn/ui Field component (Form component is deprecated).

31. **Error Handling**: Three-tier strategy - (1) Inline validation errors in form fields, (2) User-actionable errors via toast notifications with retry button, (3) AI-specific errors in dedicated modal error state with Polish messaging and suggested actions.

32. **Loading States**: Use skeletons for content loading >500ms (recipe lists, detail pages), spinners for quick operations <500ms, top progress bar (NProgress-style) for page transitions and long API calls, custom modal with progress for AI modifications.

33. **Empty States**: Design friendly, actionable empty states for each context with large icon, message, and primary CTA button. Examples: "Nie masz jeszcze przepisów" with "+ Dodaj pierwszy przepis", "Nie znaleziono przepisów" with "Wyczyść filtry".

34. **Confirmation Dialogs**: Use Shadcn/ui AlertDialog for destructive actions with clear title, descriptive message, additional context for complex actions, contrasting button colors (destructive in red, cancel in neutral), default focus on cancel.

35. **Toast Notifications**: Use for success messages, errors, info updates. Position bottom-right (desktop), bottom-center (mobile). Duration 3-5 seconds, dismissible. Include undo button for reversible actions.

36. **Global Loading Indicator**: Implement subtle top progress bar for page navigations and API calls >500ms using brand/accent color. Fixed at top with high z-index. Skip for operations <500ms to avoid flicker.

### Data Visualization

37. **Nutrition Pie Chart**: Display medium-sized (200-250px desktop, 180-200px mobile) pie chart for macronutrients (Protein: blue, Carbs: orange, Fat: green) with legend below. Handle edge cases: each macro with value > 0 gets minimum 10% visible space; if macro value is 0, don't display on chart. Show actual values and percentages in legend (e.g., "Białko: 12g (10%)"). Total calories displayed prominently above/center of chart.

### Responsive Design

38. **Mobile-First Approach**: Design for mobile first, enhance for larger screens. Horizontal scrolling for recipe rows on dashboard (mobile), grid for recipe cards (1 col mobile, 2-3 tablet, 3-4 desktop), hamburger menu for main nav (mobile), bottom sheet for filters (mobile) vs collapsible panel (desktop), stacked sections on detail pages (mobile) vs sidebar layout (desktop).

39. **Touch Targets**: Ensure minimum 44x44px touch targets on mobile for accessibility.

40. **Typography Scale**: Responsive typography using Tailwind - Page titles: `text-3xl md:text-4xl font-bold`, Section headings: `text-xl md:text-2xl font-semibold`, Card titles: `text-lg font-medium`, Body text: `text-base`, Small text: `text-sm text-muted-foreground`.

41. **Text Truncation**: Recipe titles on cards use `line-clamp-2`, ingredient names `line-clamp-1` with full text in tooltip on hover, collection names `line-clamp-1` or `line-clamp-2`. Front-end validation must enforce max lengths matching API/DB constraints.

### Accessibility

42. **Form Inputs**: Use both visible labels (required for accessibility) AND helpful placeholder text for additional context/examples. Don't put critical information only in placeholders.

43. **Shadcn/ui Benefits**: Leverage built-in ARIA attributes, keyboard navigation, focus management in modals/dialogs, screen reader support. Minimal additional accessibility work needed beyond ensuring proper labels and focus indicators.

### Component Organization

44. **File Structure**: Domain-driven organization - `src/components/recipes/`, `src/components/collections/`, `src/components/profile/`, `src/components/ui/` (Shadcn/ui), `src/components/shared/` (reusable like EmptyState, LoadingSpinner), `src/components/layout/` (Header, Footer, Navigation). Use index.ts files for clean imports.

### Image Handling

45. **Recipe Placeholders**: Since image upload is not in MVP, use colored blocks with recipe title initial and icon from Lucide-react (chef hat, utensils) centered. Different background colors based on recipe tags/categories. Consistent aspect ratio (16:9 or 4:3).

### MVP Exclusions

46. **Out of Scope for MVP**:
   - Authentication logic implementation (UI only)
   - Breadcrumb navigation
   - Meal planner/calendar
   - Recipe rating system
   - Image upload/display (using placeholders)
   - Import recipes from URL
   - Social features
   - Offline functionality
   - Multi-language support (Polish only)
   - Admin dashboard
   - Command palette/keyboard shortcuts (basic nav only)
   - Client-side caching strategies
   - Ingredient autocomplete
   - Cooking mode with step checkboxes
   - Multi-select for adding to multiple collections
   - Advanced recipe sorting (popularity, rating)
   - Drag-to-reorder steps in recipe form
   - Multiple modifications per recipe (modification history)

</decisions>

<matched_recommendations>

1. **Multi-page Astro Architecture**: Recommended using Astro's native multi-page routing with partial hydration instead of SPA pattern. This provides better initial page load performance and aligns with the tech stack choice. User agreed and emphasized leveraging Astro's strengths.

2. **Split-View Recipe Modification Comparison**: Recommended side-by-side comparison on desktop, tabbed on mobile, with color-coded badges for nutrition changes. User agreed, emphasizing visual clarity for before/after understanding.

3. **Optimistic UI Updates**: Recommended for non-critical actions (favorites, collections, ratings) with toast notifications for confirmation/rollback. User agreed but emphasized using inline errors for critical operations and toasts for less important messages.

4. **URL-Based Filtering**: Recommended implementing URL query parameters for search and filters to enable shareable filtered views and browser history navigation. User agreed, recognizing the value for UX and SEO.

5. **Two-Level Navigation Structure**: Recommended primary navigation in header/sidebar with contextual sub-navigation within sections, bottom tab bar on mobile. User agreed with the hierarchical approach.

6. **Progressive Form Validation**: Recommended three-tier validation: required fields on blur, format validation real-time with debounce, cross-field on submit. User agreed and noted Shadcn/ui Form component is deprecated, use Field instead.

7. **LocalStorage Form Drafts**: Recommended saving drafts every 2-3s with restoration prompt. User raised concern about edge case where new recipe tab might restore edit draft. Solution provided: use namespaced keys (`draft_recipe_new` vs `draft_recipe_edit_{recipeId}`) with timestamp-based expiration.

8. **Three-Tier Error Handling**: Recommended inline validation errors, toast for user-actionable errors, dedicated modal state for AI errors. User agreed with comprehensive error feedback approach.

9. **Dedicated Collections Page**: Recommended separate page showing collection cards with recipe counts and thumbnails, navigating to filtered recipe list on click. User agreed with clear information architecture.

10. **Multi-Step Recipe Creation Form**: Recommended wizard with 6 steps including Basic Info, Ingredients, Steps, Nutrition, Tags, Review. User agreed, particularly appreciating the organized flow for complex data entry.

11. **Hybrid AI Parameter Input**: Recommended quick-action preset buttons for common modifications plus "Dostosuj" option for custom values. User agreed, valuing balance between simplicity and flexibility.

12. **Modal-Based AI Modification Flow**: Recommended keeping user in same modal throughout: selection → loading → comparison → save/cancel. User agreed, noting the cohesive flow prevents jarring transitions.

13. **Loading State Strategy**: Recommended skeletons for content >500ms, spinners for quick ops, progress bar for navigation, custom modal for AI. User agreed with differentiated loading feedback based on operation type.

14. **Searchable Filter Panel**: Recommended prominent search bar with collapsible "Filtry" panel containing tag multi-select, sliders for calories/time, sort options. User agreed with progressive disclosure approach.

15. **Confirmation Dialogs for Destructive Actions**: Recommended AlertDialog with clear messaging, contextual info, destructive button styling, cancel as default focus. User agreed with safety-first approach.

16. **Dashboard with Multiple Recipe Sections**: Recommended welcome banner + quick action, sections for recent recipes, favorites, and public recipes with horizontal scroll and "See all" links. User particularly emphasized this should shorten time to reach any destination in the app.

17. **Single-Page Settings with Tabs**: Recommended organizing profile settings into tabbed sections (Basic Info, Dietary Preferences, Allergens, Disliked Ingredients, Account). User agreed with logical grouping.

18. **Custom Tag Creation from Recipe Form**: Recommended "+ Dodaj nowy tag" button with inline input, auto-slug generation, immediate DB save and UI update. User agreed and emphasized this functionality as important for flexibility.

19. **Simple Heart Toggle for Favorites**: Recommended straightforward toggle without additional metadata for MVP. User agreed: "Yes let's use simple heart toggle, keep it simple as you've mentioned."

20. **Friendly Empty States**: Recommended actionable empty states with icon, message, and CTA for every "no data" scenario. User agreed it provides good starting point for new users.

21. **Recipe Detail with Tabs for Modified Versions**: Recommended "Oryginalny" | "Zmodyfikowany" tabs when modification exists. User specifically confirmed: "I'd keep it simple. We want to support only one modification per recipe, so I would create 2 tabs."

22. **Prominent "Modyfikuj z AI" Button**: Recommended making AI modification the primary CTA on recipe detail page with distinctive icon. User agreed, recognizing it as core value proposition.

23. **Responsive Typography Scale**: Recommended Tailwind responsive utilities with clear hierarchy from page titles to small text. User agreed and noted Shadcn/ui provides good accessibility foundation.

24. **Domain-Driven Component Organization**: Recommended organizing by feature/domain rather than by type (recipes/, collections/, profile/ folders). User confirmed: "The domain driven development is a way to go in here."

25. **Nutrition Chart Edge Case Handling**: Recommended setting minimum slice size and showing actual values in legend. User refined: each macro with value > 0 should have minimum 10% space; if 0, don't display on chart.

26. **Form Inputs with Labels AND Placeholders**: Recommended both for accessibility (labels) and UX (example placeholders). User agreed: "let's use both for better Accessibility."

27. **Colored Block Recipe Placeholders**: Recommended using recipe initial with icon on colored background instead of complex placeholder generation. User agreed: "Let's go simple with and use colored blocks with recipe initials."

28. **Loading Skeletons for Better Perceived Performance**: Recommended skeleton components matching layout for content >500ms instead of just spinners. User agreed with reducing perceived loading time.

29. **Single Collection Addition at a Time**: Recommended keeping simple for MVP rather than multi-select checkbox interface. User agreed: "I agree, lets keep it simple."

30. **Both Inline and Summary Error Display**: Recommended showing validation errors both per-field inline and as summary alert at top of form. User agreed with comprehensive validation feedback.

</matched_recommendations>

<ui_architecture_planning_summary>

## Overview

The HealthyMeal MVP UI architecture is designed as a mobile-first, Polish-language web application built on Astro 5 with React 19 for interactive components, Tailwind 4 for styling, and Shadcn/ui for accessible component patterns. The application helps users modify recipes according to dietary needs using AI, with features for recipe management, collections, favorites, and profile customization.

## Key Architecture Principles

### Framework & Rendering Strategy

The application uses Astro's **multi-page architecture** with partial hydration, NOT a Single Page Application pattern. Each major view (dashboard, recipes list, recipe detail, collections, profile) is a separate `.astro` page with server-side rendering. React components are used selectively with `client:load` or `client:visible` directives only for interactive elements like forms, modals, AI modification interfaces, and dynamic controls.

This hybrid approach provides:
- Excellent initial page load performance through SSR
- Minimal JavaScript sent to client
- Progressive enhancement where JavaScript adds interactivity
- Better SEO through server-rendered content

### State Management Strategy

For MVP, a **minimal state management** approach is adopted:

1. **React Context**: Used for auth state (implementation deferred for MVP) and reference data cache (tags list, allergens list) that's accessed across many components
2. **Component State (useState)**: For all UI state like modal open/closed, form inputs, active tabs, loading flags
3. **URL State**: For search queries, filters, sorting, and pagination - enables shareable URLs and browser history navigation
4. **LocalStorage**: For form drafts only (with namespaced keys and timestamp-based expiration)
5. **No Global State Library**: No Zustand, Redux, or similar for MVP to reduce complexity

### Authentication

Authentication logic implementation is **explicitly deferred for MVP**. The UI will be built with all authenticated screens and flows, but without actual auth integration. This allows focusing on core UI functionality first, with auth to be added in a subsequent phase.

## Page Structure & User Flows

### Public Landing Page (`/`)

Single-page marketing site with sections:
- Hero with value proposition "Dopasuj przepisy do swojej diety z pomocą AI" and CTAs
- Features section highlighting AI modifications, dietary preferences, recipe organization
- How It Works with 3-step illustration
- Social proof placeholder
- Final CTA

### User Dashboard (`/dashboard`)

Post-login landing page serving as navigation hub with horizontally scrollable sections:
1. **Welcome banner** with personalized greeting and "+ Dodaj przepis" quick action
2. **Twoje ostatnie przepisy**: Last 4-6 user recipes with "Zobacz wszystkie" link
3. **Ulubione**: Last 4-6 favorited recipes with "Zobacz wszystkie" link
4. **Przeglądaj publiczne przepisy**: 4-6 **random** public recipes (refreshed on page load) with "Zobacz więcej" link

This structure was specifically designed to "shorten user time to reach the wanted destination in the application."

### My Recipes Page (`/recipes` or `/recipes/my`)

User's personal recipe collection with:
- Prominent search bar (placeholder: "Szukaj przepisów...")
- "Filtry" button opening collapsible panel (desktop) or drawer (mobile, Shadcn/ui Sheet)
- Filter options: tag multi-select, max calories slider, max prep time slider, sort dropdown
- Active filters displayed as removable chips with count badge on Filtry button
- Recipe cards in responsive grid (1 col mobile, 2-3 tablet, 3-4 desktop)
- Pagination (20 items per page default)

All filter changes update URL query parameters, enabling:
- Shareable filtered views
- Browser back/forward navigation
- Bookmarkable searches

Empty state: "Nie masz jeszcze przepisów" with "+ Dodaj pierwszy przepis" CTA

### Public Recipes Page (`/recipes/public`)

Similar layout to My Recipes but showing public recipes from all users. Key differences:
- Recipe cards display author name
- For MVP: Shows random 10 public recipes (no advanced sorting/curation)
- Actions: View, Favorite, Add to Collection (no Edit/Delete)

### Recipe Detail Page (`/recipes/[id]`)

Comprehensive recipe view with responsive layout:

**Desktop Layout**:
- Left column: Recipe header (title, description, tags, prep time, servings adjuster), ingredients list, preparation steps
- Right sidebar: Nutrition card with pie chart, action buttons

**Mobile Layout**: Single column with all sections stacked vertically

**Servings Adjuster**: [−] **4 porcje** [+] buttons that dynamically recalculate ingredient amounts in real-time

**Modified Recipe Display** (when recipe has AI modification):
- Two tabs: "Oryginalny" | "Zmodyfikowany"
- **Original Tab**:
  - Shows original recipe data
  - All actions available: Edit, Delete, Modify with AI, Favorite, Add to Collection
- **Modified Tab**:
  - Shows modified recipe data
  - "Modyfikuj z AI" button active (shows replacement warning when clicked)
  - "Edytuj" button HIDDEN (edit only from Original tab)
  - "Usuń modyfikację" button available (removes modification only, keeps original)
  - Info banner: "To jest zmodyfikowana wersja. Oryginalny przepis możesz zobaczyć w zakładce 'Oryginalny'."

This tab-based approach supports the MVP constraint of **one modification per recipe**, with the ability to replace the modification with a new one after confirmation.

### Collections Page (`/collections`)

Dedicated page showing user's collections in responsive grid:
- Collection cards display: name, recipe count, thumbnail grid of first 3-4 recipes, created date
- Desktop hover: Edit/Delete icons overlay
- Mobile: "..." menu button with dropdown for Edit/Delete
- "+ Nowa kolekcja" button prominently at top

Empty state: "Nie masz jeszcze kolekcji" with "+ Utwórz pierwszą kolekcję" CTA

### Collection Detail Page (`/collections/[id]`)

Shows recipes within a specific collection:
- Collection name as editable header
- Same recipe card grid as My Recipes page
- Pagination for large collections
- Actions per recipe: View, Remove from Collection, Favorite

### Favorites Page (`/favorites`)

Simple list of favorited recipes:
- Same card layout as My Recipes page
- Sorted by date added (most recent first)
- No search/filtering for MVP (simple list only)

Empty state: "Nie masz ulubionych przepisów" with suggestion to browse recipes

### Profile Settings Page (`/profile` or `/settings`)

Single page with sidebar navigation (desktop) or tabs (mobile, Shadcn/ui Tabs):

1. **Podstawowe dane** (Basic Info): Weight, age, gender, activity level
2. **Preferencje żywieniowe** (Dietary Preferences): Diet type, target goal, target value
3. **Alergeny** (Allergens): Multi-select from predefined list
4. **Nielubiane składniki** (Disliked Ingredients): Dynamic list with add/remove
5. **Konto** (Account): Email, password change

## Core Features & Interactions

### Recipe Creation & Editing

**Multi-Step Form Wizard** with 6 steps:

1. **Podstawowe informacje**: Title, description, servings, prep time
2. **Składniki**: Dynamic list with Name/Amount/Unit three-column layout, "+ Dodaj składnik" button
3. **Kroki przygotowania**: Ordered list (auto-numbered), add/remove buttons. Simple list for MVP (no drag-to-reorder, no checkboxes)
4. **Wartości odżywcze**: 6 input fields in 2-column grid (Kalorie, Białko, Tłuszcz, Węglowodany, Błonnik, Sól) with info icon/tooltip providing guidance
5. **Tagi**: Checkbox grid (3 cols desktop, 2 tablet, 1 mobile) showing 15-20 predefined tags + user-created custom tags. Maximum 5 tags selectable. Includes "+ Dodaj nowy tag" button for custom tag creation.
6. **Przegląd i zapisz**: Summary with edit links to previous steps, submit button

**Custom Tag Creation Flow**:
- Click "+ Dodaj nowy tag" below tag grid
- Show inline input field or small dialog
- Text input for tag name (validated against max length)
- Auto-generate slug (lowercase, hyphens, no special characters)
- "Dodaj" / "Anuluj" buttons
- On submit: POST to API, immediately add to tag list and auto-check it
- Handle duplicate tag names with clear error message

**Form State Persistence** (addressing localStorage edge case concern):
- Draft saved every 2-3 seconds to localStorage
- **Namespaced keys** prevent conflicts:
  - New recipe: `draft_recipe_new`
  - Edit recipe: `draft_recipe_edit_{recipeId}`
- Draft object includes timestamp field
- Auto-expire drafts older than 24 hours
- On form mount, check if key matches current context (new vs edit with specific ID)
- Offer restoration with banner/toast if recent draft found
- Clear specific draft key on successful submit or explicit discard
- Browser confirmation dialog on navigate away with unsaved changes

**Form Validation** (Progressive approach):
- Required fields: Validate on blur
- Format validation (numbers, lengths): Real-time with 500ms debounce
- Cross-field validation: On form submit
- Display: Inline errors below fields (red text, error icon) using Shadcn/ui Field component (NOT deprecated Form component)
- For multiple errors: Summary alert at top of form with count
- Submit button remains enabled but shows errors on click if validation fails
- Front-end max length validation must match API/DB constraints

**Edit Mode**:
- Pre-populate all fields with existing recipe data
- Show all available tags (predefined + all user-created tags from DB) with recipe's current tags pre-checked
- Same validation and draft behavior as create mode
- Same multi-step wizard interface

### AI Recipe Modification

**Core Constraint**: ONE modification per recipe for MVP

**Flow** (Modal-based, keeping user in same dialog throughout):

1. **Trigger**: User clicks prominent "Modyfikuj z AI" button (primary color, sparkles icon)
2. **Replacement Check**: If recipe already has modification, show AlertDialog: "Ten przepis ma już modyfikację. Nowa modyfikacja zastąpi obecną. Kontynuować?" with Confirm/Cancel options
3. **Type Selection**: Modal shows modification types (Reduce calories, Increase calories, Increase protein, Increase fiber, Change portion size, Ingredient substitution)
4. **Parameter Input** (Hybrid approach):
   - Quick-action preset buttons: "Zmniejsz kalorie o 20%", "Zwiększ białko o 50%"
   - "Dostosuj" (Customize) option reveals slider or number input for precise control
   - For portion size: always show number input (servings count)
5. **Processing**: Modal transitions to loading state (same dialog):
   - Animated spinner
   - Estimated time remaining
   - Rotating status messages: "Analizuję przepis...", "Obliczam wartości odżywcze...", "Finalizuję zmiany..."
   - Cancel button (aborts API request)
   - Hard timeout: 5 seconds (API constraint)
6. **Comparison** (on success): Smooth transition to split-view comparison within same modal:
   - **Desktop**: Side-by-side (original left, modified right)
   - **Mobile**: Tabbed interface (Oryginał | Zmodyfikowany)
   - Visual indicators for nutrition changes: Green badges (improvements), Yellow (neutral), Red (increases in unwanted nutrients)
   - Show changed ingredients, steps, nutrition values
7. **Confirm or Cancel**:
   - "Zapisz modyfikację" button → API call → save to `recipe_modifications` table
   - "Anuluj" button → discard changes, close modal
8. **Post-Save**: Close modal, reload recipe detail page now showing tabs "Oryginalny" | "Zmodyfikowany", success toast

**Error Handling**:
- API timeout (>5s): Show error in modal with retry button and clear Polish messaging
- Processing failed: Show error with suggested actions
- Network error: Toast notification with retry option

### Collections Management

**Creating Collections**:
- "+ Nowa kolekcja" button on Collections page
- Dialog with name input (1-100 chars, unique per user), "Utwórz" / "Anuluj" buttons
- On submit: API call, add to list, show success toast

**Adding Recipes to Collections** (simplified for MVP):
- "Dodaj do kolekcji" button on recipe card/detail page opens dropdown menu or dialog
- Shows list of user's collections
- Collections already containing recipe show checkmark + "Już dodano" (disabled)
- "+ Nowa kolekcja" option at top
- Click collection → add recipe to that collection, close menu, success toast
- **MVP: Add to ONE collection at a time** (no multi-select)

**No Collections Edge Case**:
- When user clicks "Dodaj do kolekcji" but has no collections
- Skip selection, directly open "Create Collection" dialog with message: "Nie masz jeszcze kolekcji. Utwórz pierwszą!"
- After creating collection, automatically add recipe to it

**Collection Editing**:
- Edit name: Click name on detail page → inline edit or modal
- Delete collection: "..." menu → "Usuń kolekcję" → AlertDialog confirmation with context ("Kolekcja zawiera X przepisów")
- Remove recipe: Button on collection detail page per recipe

### Favorites System

**Implementation**: Absolute simplicity for MVP
- Heart icon toggle (Lucide-react Heart, outline/filled states)
- Optimistic UI update: toggle immediately, rollback on API error
- Success/error feedback via toast notification
- No additional metadata (notes, categories, etc.)

**Favorites Page**:
- Same card layout as My Recipes
- Sorted by date added (most recent first)
- No search/filtering (just simple paginated list)

### Search & Filtering

**Search**:
- Prominent search bar at top of recipe list pages
- Placeholder: "Szukaj przepisów..."
- Full-text search in title and description (Polish language support via PostgreSQL tsvector)
- Trigger on Enter or after 500ms debounce
- Updates URL query parameter

**Filters**:
- "Filtry" button with count badge (e.g., "Filtry (3)" when active)
- Opens collapsible panel (desktop) or drawer (mobile, Shadcn/ui Sheet)
- Options:
  - **Tags**: Multi-select checkboxes (predefined + custom)
  - **Max Calories**: Slider (0-10000 kcal)
  - **Max Prep Time**: Slider (0-1440 minutes)
  - **Sort By**: Dropdown (Najnowsze, Najstarsze, Tytuł A-Z, Czas przygotowania)
- "Zastosuj" button updates URL and refetches results
- Active filters displayed as removable chips above results
- "Wyczyść filtry" button resets all to defaults

**URL Integration**:
- All filter state persists in URL query parameters
- Enables shareable filtered views
- Browser back/forward navigation works correctly
- Astro pages read `searchParams` on server-side render for initial state

### Recipe Display Components

**Recipe Card** (List/Grid View):
- Placeholder image: colored block with recipe initial + icon (chef hat, utensils from Lucide-react), different colors based on tags
- Title: truncate with `line-clamp-2` after 2 lines
- Summarized nutrition:
  - Calories badge with color-coding: Green <400, Yellow 400-600, Orange >600
  - Protein amount with icon
- Prep time (clock icon + minutes)
- Primary tag badge
- Actions (on hover/tap): Heart for favorite, "..." menu for Add to Collection, View, Edit, Delete

**Nutrition Pie Chart**:
- Medium size: 200-250px diameter (desktop), 180-200px (mobile)
- Show macronutrient distribution: Protein (blue), Carbs (orange), Fat (green), Fiber (if displayed)
- **Edge Case Handling** (user-specified):
  - Each macro with value > 0 gets **minimum 10% visible space** on chart
  - If macro value is 0, **don't display it on chart**
  - Show actual values AND percentages in legend: "Białko: 12g (10%)"
- Total calories displayed prominently above or center of chart
- Use Recharts or Chart.js

## Navigation Structure

### Main Navigation

**Header** (persistent, sticky):
- **Left**: Logo/brand (links to dashboard when logged in, landing when logged out)
- **Center** (desktop only): Main nav links
  - Dashboard
  - Moje Przepisy
  - Publiczne Przepisy
  - Kolekcje
- **Right**:
  - Logged in: User menu dropdown (avatar + name) → Profile, Settings, Logout
  - Logged out: Login / Register buttons
- **Mobile**: Hamburger menu (Shadcn/ui Sheet) for main links

### Breadcrumbs

**Explicitly skipped for MVP** to keep UI simple and reduce development time.

### Quick Actions

- Floating "+ Dodaj przepis" button prominently on dashboard
- Inline "+ Nowa kolekcja" button on Collections page

## UI Patterns & Component Specifications

### Loading States

**Strategy**: Differentiated loading feedback based on operation type and duration

1. **Skeletons** (for content loading >500ms):
   - Recipe list/grid: Show 3-4 skeleton cards matching layout
   - Recipe detail: Skeleton matching page structure (header, ingredients, steps, nutrition)
   - Collections list: Skeleton collection cards
   - Use Shadcn/ui Skeleton component
   - Prevents layout shifts, reduces perceived loading time

2. **Spinners** (for quick operations <500ms):
   - Simple spinner or no loading state
   - Avoid flicker for fast operations

3. **Top Progress Bar** (page transitions, long API calls):
   - NProgress-style linear progress bar
   - Fixed at very top of viewport, high z-index
   - Brand/accent color
   - Show for operations >500ms
   - Start immediately on navigation/API call, complete when done

4. **AI Modification** (3-5 second operations):
   - Custom modal with:
     - Animated spinner
     - Estimated time remaining
     - Rotating status messages in Polish
     - Cancel button

### Error Handling

**Three-Tier Strategy**:

1. **Inline Validation Errors**: Shown in form fields below inputs (red text, error icon), using Shadcn/ui Field component
2. **User-Actionable Errors**: Toast notifications with retry button for network issues, 404s, 403s
3. **AI-Specific Errors**: Dedicated error state within modification modal with clear Polish messaging and suggested next steps (for timeouts, rate limits, processing failures)

**Network Error Handling**:
- Transient errors: Toast with "Błąd połączenia. Spróbuj ponownie." and retry button
- Offline detection: Persistent banner at top "Jesteś offline. Sprawdź połączenie internetowe." (disappears when connection restored)
- Disable action buttons when offline using `navigator.onLine` detection

**Error Boundaries**: React error boundaries wrapping major component sections for graceful degradation

### Empty States

**Pattern**: Friendly, actionable, consistent across app

Components:
- Large icon from Lucide-react
- Clear message in Polish
- Primary CTA button
- Optional suggestion text

Examples:
- **No Recipes**: "Nie masz jeszcze przepisów" + "+ Dodaj pierwszy przepis" button
- **No Collections**: "Nie masz jeszcze kolekcji" + "+ Utwórz pierwszą kolekcję" button
- **No Favorites**: "Nie masz ulubionych przepisów" + suggestion to browse recipes
- **No Search Results**: "Nie znaleziono przepisów" + "Wyczyść filtry" button with search tips

### Confirmation Dialogs

**Purpose**: Prevent accidental destructive actions

**Implementation** (Shadcn/ui AlertDialog):
- Clear title: "Usuń przepis?", "Usuń kolekcję?", "Usuń modyfikację?"
- Descriptive message: "Ta akcja jest nieodwracalna. Przepis zostanie trwale usunięty."
- Additional context for complex actions: "Kolekcja zawiera 12 przepisów"
- Button colors: Destructive in red/danger ("Usuń"), Cancel in neutral ("Anuluj")
- Default focus: Cancel button for safety

**Use Cases**:
- Delete recipe
- Delete collection
- Delete modification (removes modification only, keeps original recipe)
- Replace existing modification (when creating new modification)

### Toast Notifications

**Usage** (Shadcn/ui Toast):
- Success: "Przepis dodany", "Zapisano zmiany", "Dodano do kolekcji"
- Error: "Błąd podczas zapisywania", "Nie udało się usunąć"
- Info: "Przepis dodany do ulubionych", "Przywrócono szkic"
- Position: Bottom-right (desktop), bottom-center (mobile)
- Duration: 3-5 seconds, dismissible
- Include undo button for reversible actions (e.g., remove from favorites)

## Responsive Design

### Mobile-First Approach

Design for mobile first, progressively enhance for larger screens:

- Recipe rows on dashboard: Horizontal scroll (mobile) → Grid (desktop)
- Recipe cards: 1 col (mobile) → 2-3 (tablet) → 3-4 (desktop)
- Main navigation: Hamburger menu (mobile) → Header links (desktop)
- Filters: Bottom sheet drawer (mobile) → Collapsible panel (desktop)
- Recipe detail: Stacked sections (mobile) → Sidebar layout (desktop)
- AI modification comparison: Tabs (mobile) → Side-by-side (desktop)

### Touch Targets

**Minimum 44x44px** on mobile for all interactive elements (buttons, links, checkboxes) per accessibility guidelines

### Typography

Responsive scale using Tailwind utilities:
- Page titles: `text-3xl md:text-4xl font-bold`
- Section headings: `text-xl md:text-2xl font-semibold`
- Card titles: `text-lg font-medium`
- Body text: `text-base`
- Small text/metadata: `text-sm text-muted-foreground`

Consistent spacing: Tailwind scale (`space-y-4`, `gap-6`, etc.)

Max-width constraints:
- Full-width pages: `max-w-7xl mx-auto`
- Reading content: `max-w-3xl mx-auto`

### Text Truncation & Overflow

- Recipe titles on cards: `line-clamp-2`
- Ingredient names: `line-clamp-1`, show full in tooltip on hover
- Collection names: `line-clamp-1` or `line-clamp-2`
- Preparation steps: Allow full text with wrapping
- **Important**: Front-end validation must enforce max lengths matching API/DB constraints to prevent truncation issues

## Accessibility

### Leveraging Shadcn/ui

Shadcn/ui components provide excellent baseline accessibility:
- Built-in ARIA attributes
- Keyboard navigation support
- Focus management in modals/dialogs
- Screen reader support
- Proper contrast ratios

### Additional Considerations

1. **Form Labels**: Always include visible labels, not just placeholders
2. **Placeholders**: Use for examples/hints only, not critical information
3. **Keyboard Navigation**: Support Tab order, Enter to submit, Escape to close modals
4. **Focus Indicators**: Visible focus rings (Tailwind provides defaults)
5. **Touch Targets**: Minimum 44x44px on mobile
6. **Language**: All ARIA labels and announcements in Polish

User noted: "As far as I know shadcn/ui have good Accessibility so we will have to just do the small improvements if any will be needed at all."

## Component Organization

### File Structure (Domain-Driven)

```
src/
├── components/
│   ├── recipes/
│   │   ├── RecipeCard.tsx
│   │   ├── RecipeList.tsx
│   │   ├── RecipeForm.tsx
│   │   ├── RecipeDetail.tsx
│   │   ├── RecipeModificationModal.tsx
│   │   ├── ServingsAdjuster.tsx
│   │   ├── NutritionChart.tsx
│   │   └── index.ts
│   ├── collections/
│   │   ├── CollectionCard.tsx
│   │   ├── CollectionList.tsx
│   │   ├── CollectionDialog.tsx
│   │   └── index.ts
│   ├── profile/
│   │   ├── ProfileForm.tsx
│   │   ├── AllergenSelector.tsx
│   │   ├── DislikedIngredientsManager.tsx
│   │   └── index.ts
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── FilterChips.tsx
│   │   └── index.ts
│   ├── ui/ (Shadcn/ui components)
│   ├── shared/ (reusable: EmptyState, LoadingSpinner, LoadingSkeleton, ErrorBoundary)
│   └── layout/ (Header, Footer, Navigation)
├── pages/ (Astro pages)
└── lib/ (utilities, API clients)
```

User confirmed: "The domain driven development is a way to go in here."

## API Integration Strategy

### Endpoints & Data Flow

All API endpoints defined in `.ai/api-plan.md`. Key integration points:

1. **Recipe CRUD**: GET/POST/PUT/DELETE `/api/recipes/*`
2. **AI Modifications**: POST `/api/recipes/{id}/modifications`, GET modifications list
3. **Collections**: CRUD on `/api/collections/*`, add/remove recipes
4. **Favorites**: POST/DELETE `/api/favorites/*`
5. **Tags**: GET `/api/tags` (public), POST for creating custom tags
6. **Profile**: GET/PUT `/api/profile`, manage allergens and disliked ingredients
7. **Search & Filtering**: Query params on GET `/api/recipes` (search, tags, maxCalories, maxPrepTime, sortBy, sortOrder, page, limit)

### Validation

**Client-side validation using Zod schemas** that match API validation exactly:
- Prevents unnecessary API calls
- Provides immediate user feedback
- Ensures front-end enforces same constraints (lengths, ranges, formats)
- Example: Recipe title 1-255 chars, nutrition values non-negative numbers, max 5 tags per recipe

### Error Handling

- Parse API error responses (see API plan error codes)
- Map to appropriate UI feedback (inline errors, toasts, alert dialogs)
- Handle rate limiting (429) for AI endpoints with clear messaging
- Timeout handling for AI operations (504) with retry option

## Performance Considerations

### Optimization Techniques

1. **Lazy Loading**: React components with `client:visible` for below-fold content
2. **Code Splitting**: Astro handles automatically per page
3. **Pagination**: Limit 20 items per page default (max 100)
4. **Debouncing**: Search input (500ms), real-time validation (500ms)
5. **Optimistic UI**: For favorites and collections (non-critical mutations)

### Caching

**Explicitly NOT implemented in MVP** per user decision: "Let's not cache it in MVP, but it is a viable point for later improvements."

Post-MVP caching strategy would include:
- Reference data (tags, allergens) cached in React Context for session
- Individual recipe details cached for 5 minutes
- Cache invalidation on user actions (create, update, delete)

## Technology Stack Summary

### Core

- **Astro 5**: Multi-page routing, SSR, partial hydration
- **React 19**: Interactive components only
- **TypeScript 5**: Full type safety
- **Tailwind 4**: Utility-first styling
- **Shadcn/ui**: Component library (New York style, neutral base)
- **Lucide React**: Icon library

### Supporting

- **Zod**: Validation schemas
- **Recharts or Chart.js**: Pie charts
- **React Hook Form + Shadcn/ui Field**: Form management (NOT deprecated Form component)
- **NProgress or similar**: Top loading bar

### Language

**Polish** throughout entire interface (all labels, messages, placeholders, error messages, date/number formatting)

## MVP Scope Definition

### Included

✅ Public landing page
✅ User dashboard with recipe sections
✅ Recipe CRUD with multi-step form
✅ Custom tag creation from recipe form
✅ AI modification (one per recipe, replacement allowed)
✅ Recipe detail with tabs for original/modified
✅ Collections (create, manage, add/remove)
✅ Favorites (simple toggle)
✅ Search & filtering (URL-based)
✅ Profile settings (tabbed)
✅ Public recipes (random 10)
✅ Responsive design (mobile-first)
✅ Loading states (skeletons, spinners, progress)
✅ Error handling (three-tier)
✅ Empty states
✅ Form validation (progressive)
✅ Confirmation dialogs
✅ LocalStorage drafts
✅ Nutrition charts

### Explicitly Excluded

❌ Authentication logic implementation (UI only)
❌ Breadcrumb navigation
❌ Meal planner/calendar
❌ Recipe rating system
❌ Image upload (using placeholders)
❌ Import from URL
❌ Social features
❌ Offline functionality
❌ Multi-language (Polish only)
❌ Admin dashboard
❌ Command palette
❌ Client-side caching
❌ Ingredient autocomplete
❌ Cooking mode with checkboxes
❌ Multi-collection selection
❌ Advanced sorting (popularity, ratings)
❌ Drag-to-reorder
❌ Multiple modifications per recipe

### Post-MVP Roadmap

**High Priority**:
- Auth integration
- Meal planner
- Rating system
- Image upload
- Multiple modifications with history

**Medium Priority**:
- Admin dashboard
- Ingredient autocomplete
- Cooking mode
- Command palette
- Caching strategies

**Low Priority**:
- Social features
- Native apps
- Multi-language
- Offline mode
- Monetization

</ui_architecture_planning_summary>

<unresolved_issues>

## Technical Clarifications Needed

1. **API Endpoint for Custom Tag Creation**: The API plan (`.ai/api-plan.md`) shows GET `/api/tags` as publicly accessible but doesn't explicitly define POST `/api/tags` for creating custom tags. This endpoint needs to be added to the API plan to support the custom tag creation functionality from the recipe form.

2. **Recipe Modification Save Behavior**: When a user saves an AI modification, the summary states it's saved to the `recipe_modifications` table. The recipe detail page then shows tabs for Original/Modified. However, the exact API response structure and how the modification is linked to the recipe needs clarification to ensure proper implementation of the tab switching logic.

3. **Chart Library Selection**: The recommendation mentions "Recharts or Chart.js" for the nutrition pie chart. A decision should be made on which library to use based on:
   - Bundle size impact
   - Ease of customization for the 10% minimum slice requirement
   - React integration quality
   - TypeScript support

4. **Top Progress Bar Library**: Mentioned "NProgress or similar" for the global loading indicator. Specific library should be chosen or a custom implementation planned.

## Design Clarifications Needed

5. **Recipe Placeholder Color Assignment**: The placeholder images use "different background colors based on recipe tags/categories." A specific color mapping scheme needs to be defined:
   - Which tags map to which colors?
   - Fallback color if recipe has no tags?
   - How to handle multiple tags (use primary tag color)?

6. **Nutrition Info Icon Tooltip Content**: The recommendation mentions an info icon (ⓘ) with guidance for nutrition values. The exact Polish text for this tooltip should be finalized:
   - Current suggestion: "Wartości odżywcze podaj na jedną porcję. Możesz użyć kalkulatorów online lub tablic wartości odżywczych."
   - Should we provide links to specific calculators?

7. **Filter Slider Ranges**: While max values are defined (10000 kcal, 1440 minutes), the step increments for sliders need definition:
   - Calorie slider: step of 50? 100?
   - Prep time slider: step of 5 minutes? 10 minutes?

## User Experience Details

8. **Dashboard Recipe Section Behavior**: When a section (Recent Recipes, Favorites, Public Recipes) has fewer items than the display target (4-6 items), should:
   - The section shrink to fit actual count?
   - Empty slots be shown?
   - Section be hidden if no items?

9. **"Zobacz wszystkie/więcej" Link Behavior**: When user clicks these links from dashboard sections:
   - Should they navigate to a filtered view or full list?
   - Should any context be preserved (e.g., "came from dashboard")?

10. **Modification Comparison: What Constitutes a "Change"?**: In the AI modification comparison view, visual indicators show "changes" in green/yellow/red. Clarification needed on thresholds:
    - What % change is considered significant enough to highlight?
    - Should all modified ingredients be highlighted regardless of quantity change?

## Future Consideration Flags

11. **Mobile Navigation Pattern**: Currently using hamburger menu for mobile. User mentioned bottom tab bar for "primary navigation." Clarification needed:
    - Is bottom tab bar desired for MVP or post-MVP?
    - Which items belong in bottom tab bar vs hamburger menu?

12. **Recipe Card Tap Behavior on Mobile**: Current spec mentions "tap-to-expand or navigate to detail page." Should be decided:
    - Tap card → navigate to detail (simpler, consistent with desktop click)
    - Tap card → expand inline (shows more info without navigation)

Note: These are relatively minor clarifications that shouldn't block initial development. Most can be resolved during implementation or in early review cycles. The core architecture and user flows are well-defined and ready for development.

</unresolved_issues>

</conversation_summary>
