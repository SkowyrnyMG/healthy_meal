# UI Architecture for HealthyMeal

## 1. UI Structure Overview

### 1.1 Architecture Principles

HealthyMeal is a mobile-first, Polish-language web application built using Astro 5 with React 19 for interactive components. The architecture follows a **multi-page application (MPA)** pattern with partial hydration, prioritizing performance and progressive enhancement.

**Core Technical Decisions:**

- **Framework Pattern**: Astro's multi-page architecture with server-side rendering (SSR). Each major view is a separate `.astro` page. React components are used selectively with `client:load` or `client:visible` directives only for interactive elements requiring JavaScript.

- **State Management**: Minimal approach for MVP
  - React Context for auth state and reference data (tags, allergens)
  - Component-level state (useState) for UI interactions
  - URL parameters for search, filters, sorting, pagination
  - LocalStorage for form draft persistence only
  - No global state management library (Zustand, Redux, etc.)

- **Styling**: Tailwind 4 utility-first CSS with Shadcn/ui component library (New York style, neutral base color)

- **Language**: Polish throughout the entire interface (labels, messages, placeholders, errors, date/number formatting)

**Key Architectural Patterns:**

1. **Progressive Enhancement**: Core content rendered server-side, interactivity added via React islands
2. **Mobile-First Responsive Design**: Design for mobile viewport first, enhance for tablet and desktop
3. **URL-Based State**: Search queries and filters persist in URL for shareability and browser navigation
4. **Optimistic UI Updates**: For non-critical actions (favorites, collections) with rollback on error
5. **Form Draft Persistence**: Auto-save to LocalStorage every 2-3 seconds with restoration prompts

### 1.2 Technology Stack

**Core Technologies:**
- Astro 5 (multi-page routing, SSR, partial hydration)
- React 19 (interactive components)
- TypeScript 5 (full type safety)
- Tailwind 4 (utility-first styling)
- Shadcn/ui (accessible component library)
- Lucide React (icon library)

**Supporting Libraries:**
- Zod (validation schemas matching API)
- Chart.js (nutrition pie charts)
- React Hook Form + Shadcn/ui Field component (form management)

**Backend Integration:**
- Supabase (PostgreSQL database, authentication)
- OpenRouter.ai via OpenAI SDK (AI recipe modifications)

### 1.3 Design System Foundations

**Typography Scale (Responsive):**
- Page titles: `text-3xl md:text-4xl font-bold`
- Section headings: `text-xl md:text-2xl font-semibold`
- Card titles: `text-lg font-medium`
- Body text: `text-base`
- Small text/metadata: `text-sm text-muted-foreground`

**Spacing System:** Tailwind default scale (4px base unit)

**Color System:**
- Primary: Defined by Shadcn/ui theme (neutral base)
- Semantic colors: Success (green), Warning (yellow), Error (red), Info (blue)
- Nutrition indicators: Protein (blue), Carbs (orange), Fat (green)
- Calorie badges: Green (<400 kcal), Yellow (400-600 kcal), Orange (>600 kcal)

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Touch Targets:** Minimum 44x44px on mobile for accessibility

---

## 2. View List

### 2.1 Public Landing Page

**Path:** `/`

**Main Purpose:** Marketing page to attract new users and explain the application's value proposition. Encourages registration.

**Key Information to Display:**
- Hero section with headline: "Dopasuj przepisy do swojej diety z pomocą AI"
- Value proposition: AI-powered recipe modification for personalized dietary needs
- Features highlights: calorie adjustment, protein increase, ingredient substitutions
- "How It Works" with 3 steps: (1) Add recipe, (2) Modify with AI, (3) Cook healthy meals
- Social proof placeholder (testimonials section for future)
- Call-to-action buttons: "Zacznij za darmo" (Register), "Dowiedz się więcej" (Learn more)

**Key View Components:**

**Layout Components:**
- `<LandingHeader>` - Logo, navigation links (Features, How It Works, Pricing), Login/Register buttons
- `<HeroSection>` - Large headline, subheadline, primary CTA, hero image/illustration
- `<FeaturesSection>` - 3-4 feature cards with icons, titles, descriptions
- `<HowItWorksSection>` - 3 steps with numbered cards, icons, descriptions
- `<SocialProofSection>` - Placeholder for testimonials or user statistics
- `<FinalCTASection>` - Secondary conversion section
- `<Footer>` - Links, copyright, contact

**Interactive Components:**
- Smooth scroll navigation to sections
- CTA button hover/press states
- Mobile hamburger menu

**UX Considerations:**
- Clear, action-oriented language in Polish
- High-contrast CTAs for visibility
- Fast page load (minimal JavaScript, optimized images)
- Responsive images/illustrations
- Sticky header on scroll (desktop)

**Accessibility Considerations:**
- Proper heading hierarchy (H1 for main headline)
- ARIA labels for icon-only buttons
- Keyboard navigation support
- Alt text for all images/illustrations
- Sufficient color contrast ratios

**Security Considerations:**
- No sensitive data on public page
- HTTPS enforced
- No external script injections

---

### 2.2 User Dashboard

**Path:** `/dashboard`

**Main Purpose:** Post-login landing page serving as navigation hub. Provides quick access to user's recipes, favorites, and public recipes. Designed to "shorten user time to reach any destination in the application."

**Key Information to Display:**
- Personalized welcome banner with user's name
- Last 4-6 user recipes (recent activity)
- Last 4-6 favorited recipes
- 4-6 random public recipes (refreshed on page load)
- Quick action button: "+ Dodaj przepis"

**Key View Components:**

**Layout Components:**
- `<DashboardLayout>` - Overall container with max-width constraint, responsive padding
- `<WelcomeBanner>` - Greeting message ("Witaj, [Name]!"), quick action CTA
- `<RecipeSectionRow>` - Reusable component for horizontally scrolling recipe rows
  - Props: title, recipes[], viewAllLink, emptyMessage
  - Horizontal scroll on mobile, grid on desktop
  - "Zobacz wszystkie/więcej" link
- `<Footer>` - Consistent app footer

**Recipe Cards:**
- `<RecipeCard>` (summarized version)
  - Colored placeholder image with recipe initial + icon
  - Recipe title (truncated with line-clamp-2)
  - Calorie badge (color-coded)
  - Protein amount
  - Prep time
  - Primary tag badge
  - Quick actions: Favorite heart icon, "..." menu

**Interactive Components:**
- Horizontal scroll containers with touch/swipe support
- Quick action "+ Dodaj przepis" button (fixed or prominent)
- Recipe card tap/click navigation
- Favorite toggle (optimistic UI)

**UX Considerations:**
- Immediate visual feedback on favorite toggle
- Loading skeletons for recipe sections (if >500ms load time)
- Empty state messages if user has no recipes/favorites
- Random public recipes refresh on each page visit
- Touch-friendly swipe for horizontal scrolling
- Clear visual separation between sections

**Accessibility Considerations:**
- Keyboard navigation for scrollable sections (arrow keys)
- Screen reader announcements for section counts
- Proper ARIA labels for icon-only actions
- Focus management when navigating between sections

**Security Considerations:**
- User authentication required
- Display only user's own recipes and favorites
- Public recipes filtered for appropriate content

**Empty States:**
- No recent recipes: "Nie masz jeszcze przepisów" + "+ Dodaj pierwszy przepis" button
- No favorites: "Nie masz ulubionych przepisów" + suggestion to browse recipes
- No public recipes available: Unlikely, but show placeholder message

---

### 2.3 My Recipes Page

**Path:** `/recipes`

**Main Purpose:** Display user's personal recipe collection with search, filtering, and sorting capabilities. Primary interface for finding and managing recipes.

**Key Information to Display:**
- User's recipe collection in responsive grid
- Active search query and filters
- Recipe count and pagination info
- Sort order indicator

**Key View Components:**

**Layout Components:**
- `<RecipeListLayout>` - Main container with sidebar (desktop) or top sections (mobile)
- `<SearchBar>` - Prominent text input with search icon, placeholder: "Szukaj przepisów..."
- `<FilterButton>` - Button with count badge (e.g., "Filtry (3)") when filters active
- `<FilterPanel>` - Collapsible panel (desktop) or drawer/sheet (mobile, Shadcn/ui Sheet)
  - Tag multi-select checkboxes (predefined + custom tags)
  - Max calories slider (0-10000 kcal)
  - Max prep time slider (0-1440 minutes)
  - Sort dropdown (Najnowsze, Najstarsze, Tytuł A-Z, Czas przygotowania)
  - "Zastosuj" and "Wyczyść filtry" buttons
- `<ActiveFilterChips>` - Removable chips showing active filters
- `<RecipeGrid>` - Responsive grid (1 col mobile, 2-3 tablet, 3-4 desktop)
- `<Pagination>` - Page numbers, prev/next buttons (20 items per page)

**Recipe Cards:**
- `<RecipeCard>` (full version)
  - Colored placeholder with initial + icon
  - Title (line-clamp-2)
  - Description preview (line-clamp-2)
  - Nutrition summary (calories badge, protein)
  - Prep time, servings
  - Tag badges (primary 1-2 visible)
  - Actions: Favorite heart, "..." menu (Edit, Delete, View, Add to Collection, Modify with AI)

**Interactive Components:**
- Search input with 500ms debounce
- Filter panel slide-in/slide-out animation
- Active filter chip removal
- Recipe card hover states (desktop)
- Sort dropdown
- Pagination navigation

**UX Considerations:**
- All filter state persists in URL query parameters
- Shareable filtered URLs
- Browser back/forward navigation support
- Loading skeletons while fetching recipes
- Empty state when no recipes match filters: "Nie znaleziono przepisów" + "Wyczyść filtry" button
- Filter count badge visibility
- Clear visual feedback when filters applied
- Smooth transitions between filter changes

**Accessibility Considerations:**
- Search bar with proper label (visible or aria-label)
- Filter panel keyboard navigation (Tab, Enter, Escape)
- Checkbox/slider ARIA states
- Screen reader announcements for filter updates
- Focus management when opening/closing filter panel
- Keyboard-accessible pagination

**Security Considerations:**
- Display only user's own recipes
- Recipe ownership verification before Edit/Delete actions
- XSS protection in search query display

**Empty States:**
- No recipes at all: "Nie masz jeszcze przepisów" + "+ Dodaj pierwszy przepis" CTA
- No results from search/filter: "Nie znaleziono przepisów pasujących do kryteriów" + "Wyczyść filtry" button

**URL State Example:**
```
/recipes?search=kurczak&tags=uuid1,uuid2&maxCalories=500&maxPrepTime=30&sortBy=prepTime&sortOrder=asc&page=2
```

---

### 2.4 Public Recipes Page

**Path:** `/recipes/public`

**Main Purpose:** Browse recipes shared by other users. Discover new meal ideas and inspiration from the community.

**Key Information to Display:**
- Public recipes from all users
- Recipe author information
- Same search/filter capabilities as My Recipes
- Recipe count

**Key View Components:**

**Layout Components:**
- Same as My Recipes page: `<RecipeListLayout>`, `<SearchBar>`, `<FilterPanel>`, `<RecipeGrid>`, `<Pagination>`

**Recipe Cards:**
- `<PublicRecipeCard>` (variant of RecipeCard)
  - All same elements as RecipeCard
  - **Additional**: Author name/avatar display
  - **Action differences**: No Edit/Delete buttons, only View, Favorite, Add to Collection

**Interactive Components:**
- Same search and filtering as My Recipes
- Author name click could navigate to author profile (future feature, not MVP)

**UX Considerations:**
- For MVP: Display 10 random public recipes (no advanced curation/sorting by popularity)
- Clear visual distinction between public and user's own recipes (author badge)
- Same URL-based filtering approach
- Loading states and empty states
- Refresh shows different random recipes

**Accessibility Considerations:**
- Same as My Recipes page
- Author information accessible to screen readers

**Security Considerations:**
- Display only recipes with `isPublic: true`
- No access to Edit/Delete for recipes owned by others
- User can favorite/add to collection any public recipe

**Empty States:**
- No public recipes available: "Brak publicznych przepisów" (unlikely in production)
- No results from search/filter: Same as My Recipes page

**Future Enhancements (Post-MVP):**
- Featured/trending recipes
- Sort by popularity, rating, most favorited
- Author profiles with recipe collections

---

### 2.5 Recipe Detail Page

**Path:** `/recipes/[id]`

**Main Purpose:** Display full recipe information including ingredients, preparation steps, nutrition values. Primary interface for viewing, modifying with AI, and managing individual recipes.

**Key Information to Display:**
- Complete recipe data (title, description, tags, prep time, servings)
- Full ingredients list with amounts
- Step-by-step preparation instructions
- Detailed nutrition information with pie chart
- Original vs Modified tabs (if modification exists)
- Action buttons (Edit, Delete, Modify with AI, Favorite, Add to Collection)

**Key View Components:**

**Layout Components:**

**Desktop Layout (Two-Column):**
- Left column (main content):
  - `<RecipeHeader>` - Title, description, tags, metadata (prep time, servings)
  - `<ServingsAdjuster>` - [−] **4 porcje** [+] buttons
  - `<IngredientsList>` - Formatted list with amounts that update with servings adjustment
  - `<PreparationSteps>` - Simple numbered list (no checkboxes for MVP)
- Right sidebar:
  - `<NutritionCard>` - Card with pie chart, macros breakdown, calorie count
  - `<ActionButtons>` - Stacked action buttons

**Mobile Layout (Single Column):**
- All sections stacked vertically
- Nutrition card appears after recipe header
- Action buttons sticky at bottom or in floating action menu

**Tab Interface (when modification exists):**
- `<TabNavigation>` - "Oryginalny" | "Zmodyfikowany" tabs
- **Original Tab:**
  - Shows original recipe data
  - All actions available: Edit, Delete, Modify with AI, Favorite, Add to Collection
- **Modified Tab:**
  - Shows modified recipe data (ingredients, steps, nutrition from `recipe_modifications` table)
  - Info banner: "To jest zmodyfikowana wersja. Oryginalny przepis możesz zobaczyć w zakładce 'Oryginalny'."
  - Actions: Modify with AI (shows replacement warning), Usuń modyfikację, Favorite, Add to Collection
  - **Edit button HIDDEN** (edit only from Original tab)

**Core Components:**

`<RecipeHeader>`
- Title (H1)
- Description paragraph
- Tag badges (clickable to filter)
- Prep time icon + minutes
- Author name (if public recipe)

`<ServingsAdjuster>`
- Decrement button [−]
- Current servings display: "4 porcje"
- Increment button [+]
- Real-time ingredient amount recalculation using ratio: `newAmount = originalAmount × (newServings / originalServings)`

`<IngredientsList>`
- Each ingredient shows: amount, unit, name
- Amounts update dynamically with servings adjustment
- Responsive layout (multi-column on desktop if space allows)

`<PreparationSteps>`
- Simple numbered list (auto-numbered with CSS or explicit)
- Each step as paragraph
- No checkboxes or cooking mode features (excluded from MVP)

`<NutritionCard>`
- Total calories prominently displayed
- `<NutritionPieChart>` - Pie chart for macros (see section 5.4 for details)
- Macronutrient breakdown list:
  - Białko: Xg (Y%)
  - Tłuszcz: Xg (Y%)
  - Węglowodany: Xg (Y%)
  - Błonnik: Xg
  - Sól: Xg

`<ActionButtons>`
- Primary: "Modyfikuj z AI" (prominent button with sparkles icon)
- Secondary actions:
  - "Edytuj" (only on Original tab)
  - "Usuń przepis" (destructive)
  - "Dodaj do ulubionych" / "Usuń z ulubionych" (heart toggle)
  - "Dodaj do kolekcji" (dropdown menu)
  - "Usuń modyfikację" (only on Modified tab, if modification exists)

**Interactive Components:**
- Tab switching (if modification exists)
- Servings increment/decrement with real-time updates
- Favorite toggle (optimistic UI)
- "Modyfikuj z AI" button opens modal
- "Dodaj do kolekcji" opens dropdown/dialog
- Delete confirmation dialog
- Delete modification confirmation

**UX Considerations:**
- Responsive layout shift (two-column to single-column)
- Ingredient amounts update smoothly with servings changes
- Clear visual distinction between Original and Modified tabs
- Replacement warning when modifying recipe that already has modification: "Ten przepis ma już modyfikację. Nowa modyfikacja zastąpi obecną. Kontynuować?"
- Loading state for initial recipe fetch
- Error handling if recipe not found (404)
- Breadcrumb navigation excluded for MVP
- Tab state not persisted in URL (simpler UX)

**Accessibility Considerations:**
- Proper heading hierarchy (H1 recipe title, H2 for sections)
- Tab panel accessibility (ARIA tabs pattern from Shadcn/ui)
- Servings adjuster keyboard support (arrow keys or +/- keys)
- Ingredient list semantically marked (unordered list)
- Steps semantically marked (ordered list)
- Chart has text alternative (legend with actual values)

**Security Considerations:**
- Recipe ownership check for Edit/Delete actions
- Public recipes viewable by all authenticated users
- Private recipes only viewable by owner
- Modification ownership verified before deletion

**Empty/Error States:**
- Recipe not found: "Nie znaleziono przepisu" with back button
- Recipe access denied: "Nie masz dostępu do tego przepisu"
- Failed to load modification: Toast error, show original only

**Future Enhancements (Post-MVP):**
- Recipe rating display (stars, "Did you cook this?" status)
- Comments section
- Print-friendly view
- Share button (social media, copy link)
- Cooking mode with step checkboxes and timer

---

### 2.6 Recipe Create/Edit Pages

**Path:** `/recipes/new` (create), `/recipes/[id]/edit` (edit)

**Main Purpose:** Multi-step wizard for creating new recipes or editing existing ones. Collects all recipe data in organized, user-friendly steps.

**Key Information to Display:**
- Progress indicator showing current step (1 of 6)
- Form fields for current step
- Validation errors (inline and summary)
- Draft restoration prompt (if applicable)
- Navigation buttons (Previous, Next, Submit)

**Key View Components:**

**Layout Components:**
- `<RecipeFormWizard>` - Container managing multi-step state
- `<ProgressIndicator>` - Visual step indicator (1 of 6, progress bar, or breadcrumb-style)
- `<StepContainer>` - Content area for current step
- `<WizardNavigation>` - Previous/Next/Submit buttons at bottom

**Multi-Step Structure:**

**Step 1: Podstawowe informacje (Basic Info)**

`<BasicInfoStep>`
- Title input (text, required, 1-255 chars)
- Description textarea (optional, multiline)
- Servings input (number, required, min 1)
- Prep time input (number, optional, in minutes)
- "isPublic" checkbox (default: false)

Validation: Required fields on blur, character limits real-time with 500ms debounce

**Step 2: Składniki (Ingredients)**

`<IngredientsStep>`
- Dynamic ingredient list
- Each ingredient row: Name (text), Amount (number), Unit (text)
- Three-column layout on desktop, stacked on mobile
- "+ Dodaj składnik" button
- Remove button for each ingredient (trash icon)
- Minimum 1 ingredient required

Interaction: Add/remove ingredients dynamically
Validation: Each ingredient requires all three fields

**Step 3: Kroki przygotowania (Preparation Steps)**

`<StepsStep>`
- Dynamic ordered list
- Each step: Text area for instruction
- Auto-numbered (1, 2, 3...)
- "+ Dodaj krok" button
- Remove button for each step
- Minimum 1 step required

Interaction: Add/remove steps dynamically
Validation: Each step requires instruction text
Note: No drag-to-reorder for MVP (simple add/remove only)

**Step 4: Wartości odżywcze (Nutrition Values)**

`<NutritionStep>`
- 6 input fields in 2-column grid:
  - Kalorie (kcal) - number, required, ≥0
  - Białko (g) - number, required, ≥0
  - Tłuszcz (g) - number, required, ≥0
  - Węglowodany (g) - number, required, ≥0
  - Błonnik (g) - number, required, ≥0
  - Sól (g) - number, required, ≥0
- Info icon (ⓘ) with tooltip: "Wartości odżywcze podaj na jedną porcję. Możesz użyć kalkulatorów online lub tablic wartości odżywczych."
- All values per serving

Validation: Non-negative numbers, required fields

**Step 5: Tagi (Tags)**

`<TagsStep>`
- Checkbox grid (3 cols desktop, 2 tablet, 1 mobile)
- Shows all available tags (15-20 predefined + user-created custom tags)
- Maximum 5 tags selectable
- Visual indication when limit reached
- "+ Dodaj nowy tag" button below grid

`<CustomTagCreation>` (inline or dialog):
- Text input for tag name (1-100 chars)
- Auto-generate slug (lowercase, hyphens, no special chars)
- "Dodaj" / "Anuluj" buttons
- On submit: POST to API, add to list, auto-check new tag
- Duplicate handling: Error message if tag name exists

Validation: Max 5 tags, unique tag names

**Step 6: Przegląd i zapisz (Review & Submit)**

`<ReviewStep>`
- Summary of all entered data
- Sections: Basic Info, Ingredients, Steps, Nutrition, Tags
- Edit links for each section (navigate back to specific step)
- Final submit button: "Zapisz przepis" (create) or "Zapisz zmiany" (edit)

**Form State Management:**

**LocalStorage Draft Persistence:**
- Auto-save every 2-3 seconds
- Namespaced keys to prevent conflicts:
  - New recipe: `draft_recipe_new`
  - Edit recipe: `draft_recipe_edit_{recipeId}`
- Draft object structure:
  ```json
  {
    "timestamp": "2025-10-18T12:00:00Z",
    "step": 3,
    "data": { /* form data */ }
  }
  ```
- Auto-expire drafts older than 24 hours
- Restoration prompt on form mount (if recent draft found):
  - Banner or toast: "Znaleziono niezapisany szkic z [date]. Przywrócić?" with Yes/No buttons
- Clear draft on successful submit or explicit discard
- Browser confirmation on navigate away with unsaved changes

**Validation Strategy (Progressive):**
- Required fields: Validate on blur
- Format validation (numbers, lengths): Real-time with 500ms debounce
- Cross-field validation: On next step or submit
- Display: Inline errors below fields (red text, error icon) using Shadcn/ui Field component
- Multiple errors: Summary alert at top of form with count
- Submit button remains enabled, shows errors on click if validation fails
- Front-end max length validation must match API/DB constraints

**Edit Mode Differences:**
- Pre-populate all fields with existing recipe data
- Load all user's tags (predefined + custom) with recipe's current tags pre-checked
- Same wizard interface
- Same validation and draft behavior
- Submit button: "Zapisz zmiany" instead of "Zapisz przepis"

**Interactive Components:**
- Step navigation (Previous/Next buttons)
- Dynamic add/remove for ingredients and steps
- Tag checkboxes with max limit enforcement
- Custom tag creation dialog/inline form
- Draft restoration banner
- Form validation feedback
- Loading state on submit

**UX Considerations:**
- Clear step progression indicator
- Ability to navigate back to previous steps
- Unsaved changes warning
- Draft restoration reduces data loss
- Visual feedback on tag limit (5 max)
- Help text and tooltips for guidance
- Loading spinner on submit (API call in progress)
- Success toast and redirect to recipe detail on successful save

**Accessibility Considerations:**
- Proper form labels (visible, not just placeholders)
- Helpful placeholder text for examples
- Error messages associated with fields (ARIA)
- Keyboard navigation between fields and steps
- Focus management when moving between steps
- Required field indicators (asterisk + label)

**Security Considerations:**
- Client-side validation matches server-side (Zod schemas)
- XSS protection in text inputs
- Recipe ownership verified on edit (server-side)
- CSRF protection on form submit

**Empty/Error States:**
- API error on submit: Toast notification with retry option
- Tag creation failure: Inline error in tag creation dialog
- Draft restoration failure: Silent fail, start fresh

**Future Enhancements (Post-MVP):**
- Ingredient autocomplete
- Drag-to-reorder steps
- Nutrition calculator integration
- Image upload
- Import recipe from URL
- Recipe templates

---

### 2.7 Collections List Page

**Path:** `/collections`

**Main Purpose:** Display user's recipe collections. Provides organizational structure for grouping related recipes.

**Key Information to Display:**
- All user's collections in grid layout
- Collection name, recipe count, preview thumbnails
- Quick actions for each collection (Edit, Delete)
- Create new collection button

**Key View Components:**

**Layout Components:**
- `<CollectionsLayout>` - Main container with max-width
- `<PageHeader>` - Title "Moje Kolekcje", "+ Nowa kolekcja" button
- `<CollectionGrid>` - Responsive grid (1 col mobile, 2 tablet, 3-4 desktop)

**Collection Cards:**

`<CollectionCard>`
- Collection name (H3)
- Recipe count: "X przepisów"
- Thumbnail grid of first 3-4 recipes (colored placeholders)
- Created date
- Hover overlay (desktop): Edit icon, Delete icon
- Mobile: "..." menu button with Edit/Delete options

**Create Collection Dialog:**

`<CreateCollectionDialog>` (Shadcn/ui Dialog)
- Text input for collection name (1-100 chars, unique per user)
- "Utwórz" / "Anuluj" buttons
- Validation: Required, max length, uniqueness

**Edit Collection Dialog:**

`<EditCollectionDialog>` (same as Create)
- Pre-populated with current name
- "Zapisz" / "Anuluj" buttons
- Validation: Same as create

**Delete Collection Confirmation:**

`<DeleteCollectionDialog>` (Shadcn/ui AlertDialog)
- Title: "Usuń kolekcję?"
- Message: "Ta akcja jest nieodwracalna. Kolekcja '[name]' zostanie trwale usunięta."
- Context: "Kolekcja zawiera X przepisów" (recipes remain, only collection deleted)
- Buttons: "Usuń" (destructive red), "Anuluj"

**Interactive Components:**
- Collection card click → navigate to collection detail
- "+ Nowa kolekcja" button → open create dialog
- Edit icon → open edit dialog
- Delete icon → open delete confirmation
- Mobile "..." menu with actions

**UX Considerations:**
- Loading skeletons for collections (if >500ms)
- Empty state when no collections
- Success toasts on create/edit/delete
- Visual feedback on hover (desktop)
- Touch-friendly tap targets (mobile)
- Thumbnail preview gives visual context

**Accessibility Considerations:**
- Collection cards keyboard accessible (Enter to open)
- Edit/Delete actions keyboard accessible
- Dialog focus management (Shadcn/ui handles)
- Screen reader announcements for collection count

**Security Considerations:**
- Display only user's own collections
- Collection ownership verified before edit/delete

**Empty State:**
- No collections: Large icon, "Nie masz jeszcze kolekcji", "+ Utwórz pierwszą kolekcję" CTA

**Future Enhancements (Post-MVP):**
- Collection sharing (public collections)
- Collection categories/tags
- Sort collections (alphabetical, date, recipe count)
- Collection cover image

---

### 2.8 Collection Detail Page

**Path:** `/collections/[id]`

**Main Purpose:** Display recipes within a specific collection. Allows viewing, removing recipes, and editing collection name.

**Key Information to Display:**
- Collection name (editable)
- Number of recipes in collection
- Recipe grid (same as My Recipes page)
- Actions per recipe (View, Remove from Collection, Favorite)

**Key View Components:**

**Layout Components:**
- `<CollectionDetailLayout>` - Main container
- `<CollectionHeader>` - Collection name, recipe count, edit name button
- `<RecipeGrid>` - Responsive grid (same as My Recipes)
- `<Pagination>` - If collection has many recipes (20 per page)

**Collection Header:**

`<CollectionHeader>`
- Collection name (H1, inline editable or click to edit)
- Recipe count: "X przepisów w kolekcji"
- "Edytuj nazwę" button (pencil icon)
- "Usuń kolekcję" button (trash icon, secondary/destructive)

**Recipe Cards:**

`<CollectionRecipeCard>` (variant)
- Same as RecipeCard on My Recipes
- Action difference: "Usuń z kolekcji" instead of "Delete recipe"
- Favorite toggle available
- Click → navigate to recipe detail

**Remove from Collection:**

`<RemoveFromCollectionDialog>` (Shadcn/ui AlertDialog)
- Title: "Usuń z kolekcji?"
- Message: "Przepis '[title]' zostanie usunięty z kolekcji '[collection name]'. Sam przepis nie zostanie usunięty."
- Buttons: "Usuń z kolekcji", "Anuluj"

**Interactive Components:**
- Edit collection name (inline edit or dialog)
- Remove recipe from collection
- Favorite toggle
- Delete collection (redirects to /collections after confirmation)

**UX Considerations:**
- Loading skeletons for recipes
- Empty state if collection has no recipes
- Success toasts on remove
- Breadcrumb-style navigation: Collections > [Collection Name] (future, not MVP)
- Pagination for large collections

**Accessibility Considerations:**
- Editable collection name keyboard accessible
- Recipe cards keyboard navigable
- Remove action keyboard accessible

**Security Considerations:**
- Collection ownership verified
- Only show recipes user has access to (own + public)

**Empty State:**
- No recipes in collection: "Ta kolekcja jest pusta", "Dodaj przepisy do kolekcji" with link to browse recipes

**Future Enhancements (Post-MVP):**
- Bulk remove recipes
- Sort recipes within collection
- Add notes to recipes in collection
- Collection statistics (total calories, avg prep time)

---

### 2.9 Favorites Page

**Path:** `/favorites`

**Main Purpose:** Display user's favorited recipes in simple list format. Quick access to most-liked recipes.

**Key Information to Display:**
- All favorited recipes
- Date added (for sorting)
- Recipe count

**Key View Components:**

**Layout Components:**
- `<FavoritesLayout>` - Main container
- `<PageHeader>` - Title "Ulubione przepisy", count
- `<RecipeGrid>` - Responsive grid (same as My Recipes)
- `<Pagination>` - 20 items per page

**Recipe Cards:**

`<FavoriteRecipeCard>` (same as RecipeCard)
- Heart icon filled (favorited state)
- All standard recipe card elements
- Actions: View, Unfavorite, Add to Collection, Edit (if own recipe), Delete (if own recipe)

**Sorting:**
- Default: Date added (most recent first)
- No search/filtering for MVP (simple paginated list)

**Interactive Components:**
- Favorite toggle (removes from list with optimistic UI)
- Recipe card actions menu
- Pagination

**UX Considerations:**
- Loading skeletons on initial load
- Empty state if no favorites
- Optimistic removal (unfavorite removes from list immediately)
- Undo option in toast after unfavorite
- Clear indication of favorited status (filled heart)

**Accessibility Considerations:**
- Heart toggle keyboard accessible
- Screen reader announcement: "Usunięto z ulubionych"

**Security Considerations:**
- Display user's own favorites only
- Can favorite any accessible recipe (own + public)

**Empty State:**
- No favorites: Heart icon, "Nie masz ulubionych przepisów", "Przeglądaj przepisy i dodaj do ulubionych" with link to public recipes

**Future Enhancements (Post-MVP):**
- Search within favorites
- Filter favorites by tags
- Sort by different criteria
- Favorite collections

---

### 2.10 Profile Settings Page

**Path:** `/profile` or `/settings`

**Main Purpose:** Centralized settings page for user profile data, dietary preferences, allergens, and disliked ingredients. Organized into tabbed sections for clarity.

**Key Information to Display:**
- User profile data (weight, age, gender, activity level)
- Dietary preferences (diet type, target goal, target value)
- Selected allergens
- Disliked ingredients list
- Account settings (email, password change)

**Key View Components:**

**Layout Components:**

**Desktop:**
- `<SettingsLayout>` - Two-column layout
- Sidebar navigation (left): List of setting sections
- Content area (right): Active section content

**Mobile:**
- `<SettingsLayout>` - Single column
- `<TabNavigation>` (Shadcn/ui Tabs): Horizontal tabs for sections
- Content area: Active tab content

**Setting Sections (5 tabs):**

**1. Podstawowe dane (Basic Info) - Tab/Section**

`<BasicInfoSection>`
- Form fields:
  - Waga (kg) - number input, 40-200 range
  - Wiek - number input, 13-100 range
  - Płeć - select dropdown (male, female, other, prefer_not_to_say)
  - Poziom aktywności - select dropdown (sedentary, lightly_active, moderately_active, very_active, extremely_active)
- "Zapisz" button
- Success/error feedback via toast

**2. Preferencje żywieniowe (Dietary Preferences)**

`<DietaryPreferencesSection>`
- Form fields:
  - Typ diety - select dropdown (high_protein, keto, vegetarian, weight_gain, weight_loss, balanced)
  - Cel - select dropdown (lose_weight, gain_weight, maintain_weight)
  - Wartość docelowa - number input (target weight change in kg)
- "Zapisz" button
- Success/error feedback

**3. Alergeny (Allergens)**

`<AllergensSection>`
- Multi-select from predefined allergen list (fetched from API)
- Checkbox grid (3 cols desktop, 2 tablet, 1 mobile)
- Selected allergens highlighted/checked
- "Zapisz" button updates user_allergens

**4. Nielubiane składniki (Disliked Ingredients)**

`<DislikedIngredientsSection>`
- Dynamic list of disliked ingredients
- Each item: ingredient name, remove button (X icon)
- "+ Dodaj składnik" button
- Add ingredient: Text input (1-100 chars), "Dodaj" button
- List updates immediately on add/remove (optimistic UI)

**5. Konto (Account)**

`<AccountSection>`
- Display email (read-only or editable in future)
- "Zmień hasło" button → opens password change dialog
- "Wyloguj" button (secondary/destructive)
- "Usuń konto" button (destructive, future feature)

`<ChangePasswordDialog>` (Shadcn/ui Dialog)
- Current password input
- New password input (min 8 chars)
- Confirm new password input
- "Zmień hasło" / "Anuluj" buttons
- Validation: Password strength, confirmation match

**Interactive Components:**
- Tab/sidebar navigation
- Form inputs with validation
- Allergen checkboxes
- Dynamic ingredient list (add/remove)
- Password change dialog
- Save buttons per section
- Logout confirmation

**UX Considerations:**
- Auto-save on change (or explicit Save button per section for clarity)
- Loading states when saving
- Success toasts on save
- Error messages for validation failures
- Unsaved changes warning when navigating away
- Clear visual separation between sections

**Accessibility Considerations:**
- Tab navigation keyboard accessible
- Form labels visible and associated with inputs
- Helpful placeholder text
- ARIA announcements for add/remove ingredients
- Focus management in dialogs

**Security Considerations:**
- Password change requires current password
- Email change verification (future)
- Account deletion requires confirmation (future)
- Profile data only accessible to owner

**Empty States:**
- No allergens selected: Informational message, "Zaznacz alergeny, aby AI mogło je uwzględniać przy modyfikacjach"
- No disliked ingredients: "Nie masz nielubianych składników", "+ Dodaj pierwszy składnik"

**Future Enhancements (Post-MVP):**
- Email change with verification
- Account deletion
- Export user data (GDPR)
- Notification preferences
- Privacy settings

---

### 2.11 AI Recipe Modification Modal

**Component:** `<RecipeModificationModal>` (not a page, but a critical view component)

**Trigger:** User clicks "Modyfikuj z AI" button on Recipe Detail page

**Main Purpose:** Modal-based flow for AI-powered recipe modification. Guides user through type selection, parameter input, processing, comparison, and save/discard decision.

**Key Information to Display:**
- Available modification types
- Parameter input controls
- Loading state with progress
- Before/after comparison
- Save/cancel actions

**Modal Flow (5 Stages):**

**Stage 0: Replacement Check (if modification exists)**

`<ReplacementWarningDialog>` (Shadcn/ui AlertDialog)
- Title: "Przepis ma już modyfikację"
- Message: "Ten przepis ma już modyfikację. Nowa modyfikacja zastąpi obecną. Kontynuować?"
- Buttons: "Kontynuuj" (proceed to Stage 1), "Anuluj" (close modal)

**Stage 1: Modification Type Selection**

`<ModificationTypeSelector>`
- Modal title: "Modyfikuj przepis z AI"
- Grid of modification type cards:
  1. Zmniejsz kalorie (reduce_calories) - icon, description
  2. Zwiększ kalorie (increase_calories) - icon, description
  3. Zwiększ białko (increase_protein) - icon, description
  4. Zwiększ błonnik (increase_fiber) - icon, description
  5. Zmień liczbę porcji (portion_size) - icon, description
  6. Zamienniki składników (ingredient_substitution) - icon, description
- Click card → proceed to Stage 2 with selected type
- "Anuluj" button to close modal

**Stage 2: Parameter Input**

`<ModificationParameterInput>` (dynamic based on type)

**Hybrid Approach:**

For calorie/protein/fiber modifications:
- Quick-action preset buttons:
  - "Zmniejsz o 20%", "Zmniejsz o 30%", "Zmniejsz o 50%" (for reduce_calories)
  - "Zwiększ o 30%", "Zwiększ o 50%", "Zwiększ o 100%" (for increase_protein/fiber/calories)
- "Dostosuj" option → reveals custom controls:
  - Slider or number input for precise target value or percentage
  - Range indicators (min/max)

For portion size:
- Number input for new servings count
- Current servings display for reference

For ingredient substitution:
- Dropdown or text input to select ingredient from recipe
- Optional: Preferred substitute text input
- Description: "AI zaproponuje zdrowsze zamienniki"

- "Dalej" button (proceeds to Stage 3, triggers API call)
- "Wstecz" button (back to Stage 1)
- "Anuluj" button (close modal)

**Stage 3: Processing (Loading State)**

`<ModificationProcessing>`
- Modal transitions smoothly to loading state (same dialog)
- Animated spinner (centered)
- Estimated time remaining (e.g., "około 3-5 sekund")
- Rotating status messages (change every 1-2 seconds):
  1. "Analizuję przepis..."
  2. "Obliczam wartości odżywcze..."
  3. "Finalizuję zmiany..."
- "Anuluj" button (aborts API request, closes modal)
- Hard timeout: 5 seconds (API requirement)
- Error handling:
  - Timeout (504): Show error state in modal
  - Processing failed (500): Show error state
  - Rate limit (429): Show error with retry delay

**Stage 4: Comparison (Success)**

`<ModificationComparison>`
- Modal transitions to split-view comparison (same dialog)
- Modal title: "Porównaj zmiany"

**Desktop Layout: Side-by-Side**
- Left column: "Oryginalny"
  - Recipe title
  - Key ingredients (changed ones highlighted)
  - Nutrition summary
- Right column: "Zmodyfikowany"
  - Modified title (if changed)
  - Modified ingredients (changes highlighted in green/yellow/red)
  - Modified nutrition with change indicators

**Mobile Layout: Tabs**
- Tab navigation: "Oryginalny" | "Zmodyfikowany"
- Each tab shows full recipe data for that version

**Change Indicators:**
- Green badges: Improvements (e.g., +50% protein, -200 kcal)
- Yellow badges: Neutral changes
- Red badges: Increases in unwanted nutrients (e.g., +fat when reducing calories)
- Show modification notes: Text explanation from AI about what changed and why

**Actions:**
- "Zapisz modyfikację" button (primary, green)
  - API POST to `/api/recipes/{id}/modifications`
  - On success: Close modal, reload recipe detail page, show success toast
- "Anuluj" button (secondary)
  - Discard changes, close modal
- "Wstecz" button (back to parameter input to adjust)

**Stage 5: Error State**

`<ModificationError>`
- Modal shows error message (replaces content)
- Icon (warning/error)
- Clear Polish error message based on error type:
  - Timeout: "Przetwarzanie trwało zbyt długo. Spróbuj ponownie."
  - Processing failed: "Nie udało się przetworzyć przepisu. Spróbuj ponownie później."
  - Rate limit: "Osiągnięto limit żądań. Spróbuj ponownie za [X] sekund."
- "Spróbuj ponownie" button (retry from Stage 1 or current parameters)
- "Zamknij" button (close modal)

**Interactive Components:**
- Modal state management (5 stages)
- API call with abort controller
- Real-time progress updates
- Split-view/tab comparison
- Save/cancel actions

**UX Considerations:**
- Keep user in same modal throughout (no jarring transitions)
- Smooth animations between stages
- Clear progress indication
- Cancel available at all stages
- Comparison view helps user make informed decision
- Modification notes provide transparency

**Accessibility Considerations:**
- Modal focus trap (Shadcn/ui handles)
- Keyboard navigation (Escape to cancel, Enter to proceed)
- Screen reader announcements for stage changes
- Loading state announced to screen readers
- Comparison accessible as table or structured list

**Security Considerations:**
- Rate limiting enforced (10 requests/minute per user)
- Recipe ownership/access verified
- API timeout enforced (5s max)
- XSS protection in AI-generated content

**Future Enhancements (Post-MVP):**
- Multiple modifications per recipe (modification history)
- Compare multiple modification options side-by-side
- Save modifications as new recipes
- Advanced AI parameters (dietary restrictions, cuisine style)

---

## 3. User Journey Map

### 3.1 Primary User Journey: From Registration to AI-Modified Recipe

This section maps the complete user journey for the core use case: A new user registers, sets preferences, adds a recipe, and modifies it with AI.

**Journey Steps:**

**Step 1: Discovery & Registration**
- User lands on public landing page (`/`)
- Reads value proposition: "Dopasuj przepisy do swojej diety z pomocą AI"
- Clicks "Zacznij za darmo" CTA
- Navigates to registration page (auth deferred for MVP, UI exists)
- Enters email and password
- Submits form → Account created
- Auto-login → Redirects to `/dashboard`

**Step 2: First-Time Dashboard Experience**
- Dashboard loads with welcome banner: "Witaj, [Name]!"
- Shows empty states:
  - "Nie masz jeszcze przepisów" + "+ Dodaj pierwszy przepis" CTA
  - "Nie masz ulubionych przepisów"
  - "Przeglądaj publiczne przepisy" section shows random public recipes
- User clicks "+ Dodaj przepis" button

**Step 3: Creating First Recipe (Multi-Step Form)**
- Navigates to `/recipes/new`
- Progress indicator shows Step 1 of 6

**Step 1/6: Basic Info**
- Enters title: "Spaghetti Carbonara"
- Enters description
- Servings: 4
- Prep time: 30 minutes
- Clicks "Dalej"

**Step 2/6: Ingredients**
- Adds ingredients:
  - "spaghetti, 400, g"
  - "jajka, 4, sztuki"
  - "boczek, 200, g"
  - "parmezan, 100, g"
- Clicks "Dalej"

**Step 3/6: Preparation Steps**
- Adds steps:
  1. "Ugotuj makaron według instrukcji..."
  2. "Usmaż boczek na złoty kolor..."
  3. "Wymieszaj jajka z parmezanem..."
  4. "Połącz makaron z sosem..."
- Clicks "Dalej"

**Step 4/6: Nutrition Values**
- Enters nutrition per serving:
  - Kalorie: 650 kcal
  - Białko: 25g
  - Tłuszcz: 35g
  - Węglowodany: 55g
  - Błonnik: 3g
  - Sól: 1.5g
- Info tooltip provides guidance
- Clicks "Dalej"

**Step 5/6: Tags**
- Selects tags: "Obiad", "Włoskie", "Makaron"
- Clicks "Dalej"

**Step 6/6: Review**
- Reviews all entered data
- Sees edit links for each section
- Clicks "Zapisz przepis"
- Form submits → API creates recipe
- Success toast: "Przepis został dodany"
- Redirects to `/recipes/[id]` (recipe detail page)

**Step 4: Viewing Created Recipe**
- Recipe detail page displays:
  - Title, description, tags
  - Servings adjuster (4 porcje)
  - Ingredients list
  - Preparation steps (numbered)
  - Nutrition card with pie chart showing macros
  - Action buttons including "Modyfikuj z AI"
- User reviews recipe, notes high calories (650 kcal)

**Step 5: AI Recipe Modification**
- User clicks "Modyfikuj z AI" button
- Modal opens: Modification Type Selection
- User selects "Zmniejsz kalorie"
- Modal transitions to Parameter Input
- User chooses preset: "Zmniejsz o 30%" (target: ~455 kcal)
- Clicks "Dalej"
- Modal transitions to Processing state
- Animated spinner, status messages:
  - "Analizuję przepis..."
  - "Obliczam wartości odżywcze..."
  - "Finalizuję zmiany..."
- After 3-4 seconds, modal transitions to Comparison view

**Step 6: Comparing Original vs Modified**
- Split-view (desktop) shows:
  - Left: Original (650 kcal, 35g fat, 200g boczek)
  - Right: Modified (450 kcal, 20g fat, 100g boczek + 100g pieczarki)
- Change badges show:
  - "-200 kcal" (green)
  - "-15g tłuszczu" (green)
- Modification notes: "Zmniejszono kalorie przez zmniejszenie ilości boczku i dodanie pieczarek jako zamiennika dla objętości."
- User reviews changes, satisfied with result
- Clicks "Zapisz modyfikację"
- API saves modification to `recipe_modifications` table
- Modal closes
- Recipe detail page reloads

**Step 7: Viewing Modified Recipe**
- Recipe detail now shows tabs: "Oryginalny" | "Zmodyfikowany"
- "Zmodyfikowany" tab is active
- Displays modified recipe data:
  - New ingredients list (100g boczek, 100g pieczarki)
  - Updated nutrition (450 kcal, 20g fat)
  - Info banner: "To jest zmodyfikowana wersja..."
- User can switch to "Oryginalny" tab to see original
- User adds modified recipe to favorites (heart icon)
- Success toast: "Dodano do ulubionych"

**Step 8: Creating Collection**
- User clicks "Dodaj do kolekcji"
- Dialog shows: "Nie masz jeszcze kolekcji. Utwórz pierwszą!"
- Input field for collection name: "Niskokaloryczne obiady"
- Clicks "Utwórz"
- Collection created, recipe automatically added
- Success toast: "Kolekcja utworzona i przepis dodany"

**Journey Complete:**
- User has successfully:
  - Registered account
  - Created recipe
  - Modified recipe with AI
  - Favorited recipe
  - Organized recipe in collection
- Can now continue exploring: browsing public recipes, creating more recipes, modifying existing ones

**Key Touchpoints:**
- Landing page → Dashboard → Recipe creation → Recipe detail → AI modification → Modified recipe view → Collections
- Total steps: ~8 major interactions
- Total time: ~10-15 minutes for first recipe + modification

### 3.2 Secondary User Journeys

**Journey A: Browsing Public Recipes to Inspiration**
1. Dashboard → "Przeglądaj publiczne przepisy" section
2. Clicks "Zobacz więcej" → `/recipes/public`
3. Browses random public recipes
4. Uses search: "kurczak"
5. Applies filters: "Obiad" tag, max 500 kcal
6. Finds recipe, clicks card → Recipe detail
7. Favorites recipe (heart icon)
8. Adds to existing collection "Zdrowe obiady"
9. Navigates back to favorites (`/favorites`)
10. Sees favorited public recipe in list

**Journey B: Organizing Existing Recipes**
1. Dashboard → "Moje Przepisy" section
2. Clicks "Zobacz wszystkie" → `/recipes`
3. Uses filters: Tag "Śniadanie", sort by prep time
4. Bulk adds recipes to new collection "Szybkie śniadania"
5. Navigates to `/collections`
6. Sees new collection with 5 recipes
7. Clicks collection → Collection detail
8. Reviews recipes, removes one from collection
9. Edits collection name to "Ekspresowe śniadania"

**Journey C: Setting Up Profile Preferences**
1. Dashboard → User menu → "Ustawienia"
2. Navigates to `/profile`
3. Tab 1: Fills basic data (weight, age, gender, activity level)
4. Tab 2: Sets dietary preferences (high_protein, lose_weight, -5kg)
5. Tab 3: Selects allergens (gluten, lactose)
6. Tab 4: Adds disliked ingredients (cebula, pietruszka)
7. Saves all settings
8. Returns to dashboard
9. Future: AI modifications will respect these preferences

**Journey D: Editing Existing Recipe**
1. Dashboard → "Moje Przepisy" section
2. Clicks recipe card "..." menu → "Edytuj"
3. Navigates to `/recipes/[id]/edit`
4. Multi-step form pre-populated with current data
5. Changes servings from 4 to 6
6. Adjusts ingredient amounts proportionally
7. Updates nutrition values
8. Adds new tag "Przyjęcie"
9. Reviews changes in Step 6
10. Saves → Redirects to updated recipe detail

### 3.3 User Flow Diagrams (Text Format)

**Recipe Creation Flow:**
```
Dashboard
  ↓ [+ Dodaj przepis]
Recipe Form Step 1 (Basic Info)
  ↓ [Dalej]
Recipe Form Step 2 (Ingredients)
  ↓ [Dalej]
Recipe Form Step 3 (Steps)
  ↓ [Dalej]
Recipe Form Step 4 (Nutrition)
  ↓ [Dalej]
Recipe Form Step 5 (Tags)
  ↓ [Dalej + optional custom tag creation]
Recipe Form Step 6 (Review)
  ↓ [Zapisz przepis]
Recipe Detail Page
```

**AI Modification Flow:**
```
Recipe Detail Page (Original)
  ↓ [Modyfikuj z AI]
Modal: Replacement Warning (if existing modification)
  ↓ [Kontynuuj or Anuluj]
Modal: Type Selection
  ↓ [Select type]
Modal: Parameter Input
  ↓ [Dalej with parameters]
Modal: Processing (3-5s)
  ↓ [API success or error]
Modal: Comparison (split-view)
  ↓ [Zapisz modyfikację or Anuluj]
Recipe Detail Page (with tabs: Oryginalny | Zmodyfikowany)
```

**Collection Management Flow:**
```
Collections Page
  ↓ [+ Nowa kolekcja]
Create Collection Dialog
  ↓ [Utwórz]
Collections Page (updated with new collection)
  ↓ [Click collection card]
Collection Detail Page
  ↓ [View recipes, remove from collection]
  ↓ [Edit collection name or Delete collection]
```

---

## 4. Layout and Navigation Structure

### 4.1 Application Header (Persistent)

**Component:** `<AppHeader>`

**Position:** Fixed/sticky at top of viewport, high z-index

**Desktop Layout:**
- **Left section:**
  - Logo/brand (HealthyMeal wordmark + icon)
  - Links to dashboard when logged in, landing page when logged out
- **Center section (desktop only):**
  - Main navigation links (horizontal):
    - Dashboard
    - Moje Przepisy
    - Publiczne Przepisy
    - Kolekcje
  - Active link highlighted (underline or background color)
- **Right section:**
  - Logged in: User menu dropdown
    - Avatar circle with user initial
    - Username truncated
    - Dropdown menu:
      - Profil / Ustawienia
      - Wyloguj
  - Logged out: "Zaloguj się" | "Zarejestruj" buttons

**Mobile Layout:**
- Logo/brand (left)
- Hamburger menu button (right, Shadcn/ui Sheet)
- Hamburger opens slide-in drawer with:
  - User info at top (avatar, name)
  - Main nav links (stacked vertically)
  - Profile/Settings link
  - Logout button

**Interactive Elements:**
- Navigation links with active state
- User menu dropdown (click to open/close)
- Hamburger menu slide animation
- Focus states for keyboard navigation

**Sticky Behavior:**
- Header remains visible on scroll
- Collapses slightly on scroll down (optional, reduced height)
- Expands on scroll up

### 4.2 Mobile Navigation Pattern

**Bottom Tab Bar (Future Consideration, Not MVP):**
- Fixed at bottom on mobile for primary navigation
- 4-5 tabs: Dashboard, Recipes, Collections, Profile
- Icons + labels
- Active tab highlighted

**For MVP: Hamburger Menu Only**
- Simpler implementation
- Fewer visual elements competing for space
- Consistent with desktop experience

### 4.3 Breadcrumb Navigation

**Status:** Explicitly excluded from MVP to keep UI simple

**Future Implementation:**
- Appears below header on internal pages
- Format: Dashboard > Moje Przepisy > [Recipe Title]
- Clickable links for each level
- Mobile: May hide or truncate intermediate levels

### 4.4 Quick Actions & Floating Elements

**Floating Action Button (FAB):**
- "+ Dodaj przepis" button
- Position: Fixed bottom-right (desktop), bottom-center (mobile)
- Circular button with plus icon
- Primary color, elevated shadow
- Always accessible from recipe-related pages
- Click → navigate to `/recipes/new`

**Alternative: Prominent Button in Header:**
- "+ Dodaj przepis" button in header (right section, before user menu)
- More conventional, less intrusive
- Recommended approach for MVP

### 4.5 Footer

**Component:** `<AppFooter>`

**Content:**
- Links: O nas, Kontakt, Regulamin, Polityka prywatności
- Copyright notice: "© 2025 HealthyMeal. Wszelkie prawa zastrzeżone."
- Social media icons (placeholder, future)

**Position:**
- Bottom of page (not fixed, scrolls with content)

**Mobile:**
- Stacked links vertically
- Centered text

### 4.6 Page Layouts

**Standard Page Layout:**
```
<AppHeader />
<main>
  <PageContainer maxWidth="7xl">
    <PageHeader>
      <Breadcrumbs /> (future, not MVP)
      <Title />
      <Actions /> (e.g., + Nowa kolekcja)
    </PageHeader>
    <PageContent>
      {/* Page-specific content */}
    </PageContent>
  </PageContainer>
</main>
<AppFooter />
```

**Dashboard Layout:**
- Full-width sections with max-width containers
- Horizontal scrolling rows for recipe sections
- Vertical stacking on mobile

**Two-Column Layout (Recipe Detail Desktop):**
- Main content (left, 2/3 width)
- Sidebar (right, 1/3 width)
- Stacks vertically on mobile

**Settings Layout:**
- Sidebar navigation (left, 1/4 width) on desktop
- Content area (right, 3/4 width)
- Tabs (horizontal) on mobile

### 4.7 Navigation Hierarchy

**Level 1: Primary Navigation (in header)**
- Dashboard
- Moje Przepisy
- Publiczne Przepisy
- Kolekcje
- Profil/Ustawienia (in user menu)

**Level 2: Contextual Navigation (within pages)**
- Recipe list: Search, filters, sort
- Recipe detail: Tabs (Original/Modified), action buttons
- Profile: Settings sections (tabs or sidebar)
- Collections: Collection grid, individual collection detail

**Navigation Patterns:**
- Horizontal navigation for primary (header)
- Vertical navigation for secondary (sidebars, lists)
- Tabs for content sections (profile settings, recipe original/modified)

### 4.8 Responsive Navigation Breakpoints

**Mobile (< 768px):**
- Hamburger menu for primary navigation
- Bottom sheet for filters
- Stacked layouts
- Full-width components

**Tablet (768px - 1024px):**
- Header navigation may switch to hamburger or remain visible (depends on space)
- Two-column grids for recipe cards
- Collapsible filter panel

**Desktop (> 1024px):**
- Full header navigation always visible
- Sidebar filter panel
- Three-column+ grids for recipe cards
- Two-column layouts (content + sidebar)

---

## 5. Key Components

This section documents reusable components used across multiple views.

### 5.1 Recipe Card Component

**Component:** `<RecipeCard>`

**Usage:** My Recipes, Public Recipes, Collections, Favorites, Dashboard sections

**Props:**
- `recipe` (object): Recipe data
- `variant` ("default" | "public" | "collection"): Card variant
- `showAuthor` (boolean): Display author name (for public recipes)
- `actions` (array): Available actions for this recipe

**Visual Structure:**
- Colored placeholder image (16:9 aspect ratio)
  - Recipe title initial centered
  - Icon from Lucide-react (chef hat, utensils)
  - Background color based on primary tag (or default if no tags)
- Title (H3, line-clamp-2)
- Description (line-clamp-2, muted text)
- Metadata row:
  - Calorie badge (color-coded: <400 green, 400-600 yellow, >600 orange)
  - Protein amount with icon
  - Prep time with clock icon
- Tag badges (primary 1-2 visible, truncate rest)
- Action buttons (hover overlay on desktop, "..." menu on mobile):
  - Favorite heart toggle (always visible)
  - "..." menu: View, Edit, Delete, Add to Collection, Modify with AI

**Placeholder Color Mapping:**
- Śniadanie: Light yellow (#FEF3C7)
- Obiad: Light orange (#FED7AA)
- Kolacja: Light blue (#DBEAFE)
- Deser: Light pink (#FCE7F3)
- Przekąska: Light green (#D1FAE5)
- Default: Light gray (#F3F4F6)

**Interactions:**
- Click card → navigate to recipe detail
- Click heart → toggle favorite (optimistic UI)
- Click "..." → open action menu
- Hover (desktop) → show action overlay

**Responsive:**
- Mobile: Full-width card, stacked metadata
- Tablet/Desktop: Flexible card width in grid

### 5.2 Search Bar Component

**Component:** `<SearchBar>`

**Usage:** My Recipes, Public Recipes pages

**Props:**
- `value` (string): Current search query
- `onChange` (function): Callback on search input change
- `placeholder` (string): Placeholder text (default: "Szukaj przepisów...")

**Visual Structure:**
- Text input with search icon (magnifying glass) on left
- Clear button (X icon) on right when input has value
- Full-width on mobile, fixed width on desktop (e.g., 400px)

**Interactions:**
- Type → debounce 500ms → trigger onChange
- Press Enter → immediate search (bypass debounce)
- Click X → clear input, reset search

**Accessibility:**
- Label (visible or aria-label)
- Clear button ARIA label: "Wyczyść wyszukiwanie"

### 5.3 Filter Panel Component

**Component:** `<FilterPanel>`

**Usage:** My Recipes, Public Recipes pages

**Props:**
- `activeFilters` (object): Current filter state
- `onApply` (function): Callback when filters applied
- `onClear` (function): Callback to clear all filters
- `tags` (array): Available tags for filtering
- `isMobile` (boolean): Render as drawer (Sheet) or panel

**Visual Structure:**

**Desktop: Collapsible Panel**
- "Filtry (X)" button with count badge
- Panel slides in/out from left or top
- Filter sections:
  - **Tagi:** Checkbox grid (3 cols), multi-select
  - **Maksymalna kaloryczność:** Slider (0-10000 kcal), step 50
  - **Maksymalny czas przygotowania:** Slider (0-1440 min), step 5
  - **Sortuj według:** Dropdown (Najnowsze, Najstarsze, Tytuł A-Z, Czas przygotowania)
- "Zastosuj" button (primary)
- "Wyczyść filtry" button (secondary)

**Mobile: Bottom Sheet Drawer**
- "Filtry (X)" button opens Shadcn/ui Sheet from bottom
- Same filter sections as desktop, stacked vertically
- Larger touch targets
- Sheet has close button (X) and "Zastosuj" / "Wyczyść" buttons at bottom

**Interactions:**
- Toggle filter panel open/closed
- Select/deselect tags (checkbox)
- Adjust sliders (drag or keyboard arrows)
- Change sort option (dropdown)
- Apply filters → updates URL, refetches recipes
- Clear filters → resets to defaults

**Accessibility:**
- Filter panel keyboard navigable (Tab)
- Escape key closes panel
- Focus management when opening/closing
- Sliders keyboard accessible (arrow keys)

### 5.4 Nutrition Pie Chart Component

**Component:** `<NutritionPieChart>`

**Usage:** Recipe detail page, Recipe card (on hover/expand, future)

**Props:**
- `nutrition` (object): Nutrition data (calories, protein, fat, carbs, fiber)
- `size` ("small" | "medium" | "large"): Chart size

**Visual Structure:**
- Pie chart showing macronutrient distribution
- Slices:
  - Protein: Blue
  - Carbs: Orange
  - Fat: Green
  - (Fiber typically not shown in pie, listed separately)
- Legend below chart with actual values and percentages:
  - "Białko: 25g (20%)"
  - "Tłuszcz: 35g (30%)"
  - "Węglowodany: 55g (50%)"
- Total calories prominently above or center of chart: "650 kcal"

**Edge Case Handling:**
- Each macro with value > 0 gets **minimum 10% visible space** on chart
- If macro value is 0, **don't display on chart** (omit from pie, show in legend as "0g")
- If sum of macros < 100% (due to rounding or edge cases), adjust proportions

**Size Variants:**
- Small: 150px (for cards, future)
- Medium: 200-250px desktop, 180-200px mobile (for recipe detail)
- Large: 300px+ (for future detailed views)

**Library:**
- Recharts or Chart.js (decision needed, see unresolved issues)
- Ensure library supports minimum slice size constraint

**Accessibility:**
- Chart has text alternative (legend with exact values)
- ARIA label: "Wykres wartości odżywczych"
- Legend is accessible to screen readers

### 5.5 Loading States Components

**Skeleton Components:** `<RecipeCardSkeleton>`, `<RecipeDetailSkeleton>`

**Usage:** Recipe lists, recipe detail page (while fetching data)

**Visual Structure:**
- Matches layout of actual component
- Gray/neutral animated rectangles (shimmer effect)
- Recipe card skeleton: image block, title lines, metadata row
- Recipe detail skeleton: header, ingredient lines, step lines, nutrition card

**Animation:**
- Shimmer/pulse animation (Shadcn/ui Skeleton component)
- Duration: Shown for >500ms loading times

**Loading Spinner:** `<LoadingSpinner>`

**Usage:** Quick operations (<500ms), button loading states

**Visual:**
- Small circular spinner
- Brand color
- Size variants: small, medium, large

**Top Progress Bar:** `<TopProgressBar>`

**Usage:** Page navigations, long API calls (>500ms)

**Visual:**
- Thin linear progress bar (2-3px height)
- Fixed at very top of viewport (z-index: 9999)
- Brand/accent color
- Animates from left to right
- Indeterminate (continuous animation) or determinate (percentage-based, future)

**Library:**
- NProgress or similar, or custom implementation

**Trigger:**
- Start on navigation begin or API call start
- Complete when page loaded or API response received
- Auto-hide on completion

### 5.6 Empty State Component

**Component:** `<EmptyState>`

**Usage:** All pages with potentially empty lists (recipes, collections, favorites)

**Props:**
- `icon` (ReactNode): Lucide icon component
- `title` (string): Main message
- `description` (string, optional): Additional context
- `action` (object, optional): CTA button config { label, onClick }

**Visual Structure:**
- Large icon (80-100px, muted color)
- Title (H3, centered)
- Description (paragraph, muted, centered)
- CTA button (primary, centered)

**Examples:**
- No recipes: Icon: `<ChefHat />`, Title: "Nie masz jeszcze przepisów", Action: "+ Dodaj pierwszy przepis"
- No collections: Icon: `<FolderOpen />`, Title: "Nie masz jeszcze kolekcji", Action: "+ Utwórz pierwszą kolekcję"
- No favorites: Icon: `<Heart />`, Title: "Nie masz ulubionych przepisów", Description: "Przeglądaj przepisy i dodaj do ulubionych"

**Responsive:**
- Icon smaller on mobile (60px)
- Text size scales down on mobile

### 5.7 Toast Notification Component

**Component:** `<Toast>` (Shadcn/ui Toast)

**Usage:** Success messages, errors, info updates across entire application

**Props:**
- `variant` ("default" | "success" | "error" | "info")
- `title` (string): Toast title
- `description` (string, optional): Additional message
- `action` (ReactNode, optional): Action button (e.g., Undo)
- `duration` (number): Auto-dismiss duration in ms (default: 3000-5000)

**Visual Structure:**
- Compact notification card
- Icon based on variant (checkmark for success, X for error, etc.)
- Title and description text
- Optional action button
- Dismiss button (X icon)

**Position:**
- Bottom-right (desktop)
- Bottom-center (mobile)
- Stacked if multiple toasts

**Variants:**
- Success: Green accent, checkmark icon
- Error: Red accent, alert icon
- Info: Blue accent, info icon
- Default: Neutral

**Examples:**
- Success: "Przepis został dodany"
- Error: "Nie udało się zapisać przepisu. Spróbuj ponownie."
- Info: "Przywrócono szkic z [date]"
- With action: "Usunięto z ulubionych" + [Cofnij] button

**Accessibility:**
- ARIA live region (polite or assertive based on importance)
- Screen reader announcements
- Keyboard dismissible (focus on dismiss button)

### 5.8 Confirmation Dialog Component

**Component:** `<ConfirmationDialog>` (Shadcn/ui AlertDialog)

**Usage:** Destructive actions (delete recipe, delete collection, delete modification)

**Props:**
- `open` (boolean): Dialog open state
- `onOpenChange` (function): Callback for open/close
- `title` (string): Dialog title
- `description` (string): Explanatory message
- `context` (string, optional): Additional context (e.g., "Kolekcja zawiera X przepisów")
- `confirmLabel` (string): Confirm button label (default: "Potwierdź")
- `cancelLabel` (string): Cancel button label (default: "Anuluj")
- `onConfirm` (function): Callback on confirm
- `variant` ("default" | "destructive"): Button style

**Visual Structure:**
- Modal overlay (dims background)
- Centered dialog card
- Warning icon (for destructive)
- Title (H2)
- Description (paragraph)
- Context (if provided, muted text)
- Button row:
  - Cancel button (secondary, default focus)
  - Confirm button (destructive red for destructive actions)

**Examples:**
- Delete recipe: Title: "Usuń przepis?", Description: "Ta akcja jest nieodwracalna. Przepis '[title]' zostanie trwale usunięty.", Buttons: "Usuń" (red) / "Anuluj"
- Delete modification: Title: "Usuń modyfikację?", Description: "Modyfikacja zostanie usunięta. Oryginalny przepis pozostanie.", Buttons: "Usuń" / "Anuluj"
- Replace modification: Title: "Przepis ma już modyfikację", Description: "Nowa modyfikacja zastąpi obecną. Kontynuować?", Buttons: "Kontynuuj" / "Anuluj"

**Accessibility:**
- Focus trap (Shadcn/ui handles)
- Escape key closes dialog (cancel action)
- Default focus on Cancel button for safety
- ARIA role: alertdialog

### 5.9 Servings Adjuster Component

**Component:** `<ServingsAdjuster>`

**Usage:** Recipe detail page

**Props:**
- `servings` (number): Current servings count
- `onServingsChange` (function): Callback when servings changed
- `min` (number): Minimum servings (default: 1)
- `max` (number, optional): Maximum servings

**Visual Structure:**
- Decrement button: [−] (minus icon)
- Servings display: "4 porcje" (centered, medium text)
- Increment button: [+] (plus icon)
- Horizontal layout, centered alignment

**Interactions:**
- Click [−] → decrease servings by 1 (min 1)
- Click [+] → increase servings by 1 (max optional)
- Callback triggers ingredient amount recalculation in parent component
- Buttons disabled at min/max limits

**Responsive:**
- Touch-friendly button size on mobile (44x44px min)
- Larger text on mobile for readability

**Accessibility:**
- Buttons have ARIA labels: "Zmniejsz liczbę porcji", "Zwiększ liczbę porcji"
- Servings count announced to screen readers
- Keyboard accessible (Tab to buttons, Enter/Space to activate)

### 5.10 Tag Badge Component

**Component:** `<TagBadge>`

**Usage:** Recipe cards, recipe detail, tag selection

**Props:**
- `tag` (object): Tag data (name, slug)
- `variant` ("default" | "outline" | "selected"): Visual style
- `clickable` (boolean): Tag is clickable (for filtering)
- `onClick` (function, optional): Callback on click

**Visual Structure:**
- Small pill-shaped badge
- Tag name text
- Background color based on variant:
  - Default: Light background, dark text
  - Outline: Border only, transparent background
  - Selected: Primary color background, white text

**Interactions:**
- If clickable: Click → filter recipes by this tag
- Hover state (desktop): Background color change

**Responsive:**
- Smaller text on mobile
- Adequate padding for touch targets if clickable

**Accessibility:**
- Semantic element (button if clickable, span if decorative)
- ARIA label if clickable: "Filtruj według tagu [name]"

---

## 6. UI Patterns & Best Practices

### 6.1 Form Validation

**Progressive Validation Strategy:**
1. **Required fields:** Validate on blur (when user leaves field)
2. **Format validation:** Real-time with 500ms debounce (e.g., email format, number ranges)
3. **Cross-field validation:** On form submit (e.g., password confirmation match)

**Error Display:**
- **Inline errors:** Below each field with error (red text, error icon), using Shadcn/ui Field component
- **Summary alert:** At top of form showing count of errors if multiple ("Popraw 3 błędy w formularzu")
- **Field highlighting:** Red border on invalid fields

**Client-Side Validation:**
- Use Zod schemas matching API validation exactly
- Prevents unnecessary API calls
- Provides immediate feedback
- Enforces same constraints as backend (lengths, ranges, formats)

**Example: Recipe Title Field**
```tsx
// Zod schema
const titleSchema = z.string().min(1, "Tytuł jest wymagany").max(255, "Tytuł nie może przekraczać 255 znaków");

// Validation on blur
// Format validation real-time with 500ms debounce
// Error display inline below field
```

### 6.2 Error Handling

**Three-Tier Strategy:**

**Tier 1: Inline Validation Errors**
- Form field errors (see 6.1)
- Displayed immediately below field
- Red text, error icon
- Specific, actionable messages

**Tier 2: User-Actionable Errors (Toasts)**
- Network errors: "Błąd połączenia. Spróbuj ponownie." + retry button
- 404 errors: "Nie znaleziono przepisu."
- 403 errors: "Nie masz dostępu do tego zasobu."
- 409 errors: "Przepis o tej nazwie już istnieje."
- General errors: "Wystąpił błąd. Spróbuj ponownie później."

**Tier 3: AI-Specific Errors (Modal)**
- Timeout (504): "Przetwarzanie trwało zbyt długo. Spróbuj ponownie."
- Processing failed (500): "Nie udało się przetworzyć przepisu. Spróbuj ponownie później."
- Rate limit (429): "Osiągnięto limit żądań. Spróbuj ponownie za [X] sekund."
- Displayed in modification modal (replaces content)
- Clear error icon, Polish message, retry/close buttons

**Network Error Handling:**
- Offline detection: Banner at top "Jesteś offline. Sprawdź połączenie internetowe."
- Disable action buttons when offline
- Monitor `navigator.onLine` and `online`/`offline` events

**Error Boundaries:**
- React error boundaries wrap major sections (recipe list, recipe detail, dashboard)
- Graceful degradation: Show fallback UI with error message and reload option
- Log errors to console (future: send to error tracking service)

### 6.3 Loading States

**Differentiated Strategy:**

**Skeletons (>500ms content loading):**
- Recipe list/grid: 3-4 skeleton cards
- Recipe detail: Skeleton matching page structure
- Collections: Skeleton collection cards
- Use Shadcn/ui Skeleton component
- Prevents layout shifts, reduces perceived loading time

**Spinners (<500ms quick operations):**
- Button loading states (e.g., form submit)
- Small spinner replaces button text
- Simple circular spinner
- Avoid for fast operations to prevent flicker

**Top Progress Bar (page transitions, long API calls):**
- NProgress-style linear bar
- Fixed at top, high z-index
- Brand color
- Show for operations >500ms
- Auto-hide on completion

**AI Modification Modal (3-5s operations):**
- Custom loading state within modal
- Animated spinner, status messages, estimated time
- Cancel button available

**Loading State Thresholds:**
- <500ms: No loading indicator (fast enough)
- 500ms-3s: Skeleton or top progress bar
- 3s+: Custom loading state with progress/status (AI modifications)

### 6.4 Optimistic UI Updates

**Use Cases:**
- Favorite toggle (heart icon)
- Add/remove from collection
- Simple mutations with low failure risk

**Pattern:**
1. User triggers action (click favorite)
2. UI updates immediately (heart fills)
3. API call sent in background
4. On success: No further action (already updated)
5. On error: Revert UI change, show error toast with retry option

**Benefits:**
- Feels instant and responsive
- Reduces perceived latency
- Improves user experience for common actions

**Rollback Strategy:**
- Store previous state before optimistic update
- On error: Revert to previous state
- Toast notification: "Nie udało się dodać do ulubionych. Spróbuj ponownie." + [Spróbuj ponownie] button

### 6.5 Accessibility Guidelines

**General Principles:**
1. **Semantic HTML:** Use proper elements (button, nav, main, article, etc.)
2. **Keyboard Navigation:** All interactive elements keyboard accessible (Tab, Enter, Space, Escape, Arrow keys)
3. **Focus Indicators:** Visible focus rings (Tailwind defaults sufficient)
4. **ARIA Attributes:** Use appropriately (labels, roles, states) - Shadcn/ui provides most
5. **Color Contrast:** Ensure sufficient contrast ratios (WCAG AA minimum: 4.5:1 for text)
6. **Touch Targets:** Minimum 44x44px on mobile
7. **Screen Reader Support:** Proper labels, announcements, alternative text

**Form Accessibility:**
- Visible labels (not just placeholders)
- Helpful placeholder text for examples
- Error messages associated with fields (ARIA)
- Required field indicators (asterisk + label)
- Grouped related fields (fieldset/legend for radio groups)

**Modal/Dialog Accessibility:**
- Focus trap (Shadcn/ui handles)
- Escape key closes
- Return focus to trigger element on close
- ARIA role: dialog or alertdialog

**Dynamic Content Accessibility:**
- ARIA live regions for toasts and announcements
- Screen reader announcements for state changes (favorited, added to collection)
- Loading state announcements ("Ładowanie przepisów...")

**Shadcn/ui Benefits:**
- Built-in ARIA attributes
- Keyboard navigation support
- Focus management in modals/dialogs
- Screen reader support
- Minimal additional accessibility work needed

**User Note:**
"As far as I know shadcn/ui have good Accessibility so we will have to just do the small improvements if any will be needed at all."

### 6.6 Security Considerations

**Client-Side:**
- Validate all user input (XSS protection)
- Sanitize HTML content (if rich text added in future)
- Use parameterized queries (handled by Supabase)
- HTTPS enforced
- Secure cookie attributes (httpOnly, secure, sameSite)

**Authentication:**
- JWT tokens in httpOnly cookies (Supabase handles)
- Token refresh automatic (Supabase SDK)
- Protected routes check auth status
- Redirect to login if unauthenticated

**Authorization:**
- Recipe ownership verified before Edit/Delete (server-side)
- Collection ownership verified (server-side)
- Public recipes viewable by all, private only by owner
- RLS policies enforce database-level security

**API Integration:**
- CSRF protection (Supabase/Astro handles)
- Rate limiting headers respected (429 handling)
- Timeout enforcement (5s for AI operations)
- Error responses don't leak sensitive info

**User Data:**
- Profile data only accessible to owner
- No public display of email addresses
- Future: GDPR compliance (data export, deletion)

---

## 7. Responsive Design Strategy

### 7.1 Mobile-First Approach

**Design Philosophy:**
- Design for mobile viewport first (320px-767px)
- Progressively enhance for larger screens
- Touch-friendly interactions on mobile
- Hover states on desktop

**Mobile-Specific Patterns:**
- Single-column layouts
- Stacked sections
- Full-width components
- Bottom sheet drawers for filters
- Hamburger menu for navigation
- Larger touch targets (44x44px min)
- Swipe gestures for horizontal scrolling

**Desktop Enhancements:**
- Multi-column grids (3-4 columns for recipe cards)
- Sidebar layouts (two-column)
- Hover states and overlays
- Collapsible panels for filters
- Persistent navigation in header
- Keyboard shortcuts (future)

### 7.2 Breakpoint Strategy

**Mobile:** < 768px
- 1 column grids
- Stacked layouts
- Full-width components
- Bottom navigation (future) or hamburger
- Bottom sheet for filters

**Tablet:** 768px - 1024px
- 2-3 column grids
- Some sidebar layouts
- Collapsible filter panel or drawer (depends on space)
- Header navigation visible or hamburger (depends on design)

**Desktop:** > 1024px
- 3-4 column grids
- Two-column layouts (content + sidebar)
- Sidebar filter panel always visible
- Full header navigation
- Hover interactions
- More whitespace, larger content areas

### 7.3 Responsive Component Behavior

**Recipe Cards:**
- Mobile: 1 column, full-width
- Tablet: 2-3 columns
- Desktop: 3-4 columns

**Recipe Detail:**
- Mobile: Single column (header → nutrition → ingredients → steps)
- Desktop: Two columns (content left, sidebar right with nutrition + actions)

**AI Modification Comparison:**
- Mobile: Tabs (Oryginalny | Zmodyfikowany)
- Desktop: Side-by-side split view

**Filter Panel:**
- Mobile: Bottom sheet drawer (Shadcn/ui Sheet)
- Desktop: Collapsible panel or always-visible sidebar

**Profile Settings:**
- Mobile: Horizontal tabs at top
- Desktop: Sidebar navigation (left) + content area (right)

**Typography:**
- Page titles: `text-3xl md:text-4xl`
- Section headings: `text-xl md:text-2xl`
- Card titles: `text-lg`
- Body: `text-base`
- Responsive scaling with Tailwind utilities

### 7.4 Touch vs Mouse Interactions

**Mobile (Touch):**
- Tap to select, navigate
- Swipe for horizontal scrolling
- Long-press for context menu (future)
- Pinch-to-zoom disabled (controlled scaling)
- No hover states (all actions visible or in "..." menu)

**Desktop (Mouse + Keyboard):**
- Click to select, navigate
- Hover for previews, action overlays
- Right-click for context menu (future)
- Keyboard shortcuts (future)
- Focus states for keyboard navigation

### 7.5 Image & Media Handling

**Recipe Placeholder Images:**
- Responsive aspect ratio (16:9 or 4:3, consistent)
- Colored blocks with recipe initial + icon
- Different colors per tag/category
- Scales proportionally on all devices
- No image upload for MVP (placeholders only)

**Pie Charts:**
- Responsive sizing:
  - Mobile: 180-200px diameter
  - Desktop: 200-250px diameter
- SVG-based (scales cleanly)
- Legend always readable (text size scales)

### 7.6 Performance Considerations

**Mobile Optimization:**
- Minimize JavaScript bundle size (code splitting)
- Lazy load below-fold content (client:visible)
- Optimize images (future: responsive images, WebP)
- Reduce animations/transitions on low-end devices
- Pagination to limit DOM size (20 items per page)

**Network Considerations:**
- Assume slower connections on mobile
- Loading states for >500ms operations
- Offline detection and handling
- Debouncing for search/filter inputs (reduce API calls)

---

## 8. MVP Scope Summary

### 8.1 Included in MVP

✅ **Pages & Views:**
- Public landing page
- User dashboard with recipe sections
- My recipes list with search/filtering
- Public recipes list
- Recipe detail with original/modified tabs
- Recipe create/edit multi-step form
- Collections list and detail pages
- Favorites page
- Profile settings (tabbed)

✅ **Features:**
- Recipe CRUD (create, read, update, delete)
- Multi-step recipe creation wizard (6 steps)
- Custom tag creation from recipe form
- AI recipe modification (one per recipe, replacement allowed)
- Recipe modification comparison (split-view/tabs)
- Collections management (create, add/remove recipes, delete)
- Favorites system (simple toggle)
- Search & filtering (URL-based, shareable)
- Servings adjuster with real-time ingredient recalculation
- Profile settings (basic data, dietary preferences, allergens, disliked ingredients)
- Public recipes browsing (random 10 for MVP)

✅ **UI Components:**
- Recipe cards (multiple variants)
- Nutrition pie chart
- Search bar
- Filter panel (collapsible/drawer)
- AI modification modal (5-stage flow)
- Empty states (all contexts)
- Loading states (skeletons, spinners, progress bar)
- Error handling (three-tier)
- Toast notifications
- Confirmation dialogs
- Form validation (progressive)

✅ **Responsive Design:**
- Mobile-first approach
- Responsive layouts for mobile, tablet, desktop
- Touch-friendly interactions
- Hover states on desktop

✅ **Technical:**
- Astro multi-page architecture
- React islands for interactivity
- Tailwind 4 styling
- Shadcn/ui components
- TypeScript type safety
- Zod validation (client-side matching server-side)
- LocalStorage form drafts

### 8.2 Explicitly Excluded from MVP

❌ **Features:**
- Authentication logic implementation (UI exists, logic deferred)
- Breadcrumb navigation
- Meal planner/calendar
- Recipe rating system (stars, "Did you cook?")
- Image upload/display (using colored placeholders)
- Import recipes from URL
- Social features (sharing, comments, community)
- Offline functionality
- Multi-language support (Polish only)
- Admin dashboard
- Command palette/keyboard shortcuts
- Client-side caching strategies
- Ingredient autocomplete
- Cooking mode with step checkboxes
- Multi-select for adding to multiple collections
- Advanced recipe sorting (popularity, ratings)
- Drag-to-reorder steps in recipe form
- Multiple modifications per recipe (modification history)

❌ **Technical:**
- Service workers
- PWA features
- Native mobile apps
- Advanced performance optimizations (beyond MVP basics)

### 8.3 Post-MVP Roadmap

**Phase 1 (High Priority):**
- Authentication integration (Supabase Auth)
- Meal planner with calendar
- Recipe rating system
- Image upload with optimization
- Multiple modifications per recipe (history)

**Phase 2 (Medium Priority):**
- Admin dashboard with statistics
- Ingredient autocomplete
- Cooking mode with timers and step checkboxes
- Command palette for power users
- Client-side caching strategies
- Breadcrumb navigation

**Phase 3 (Low Priority):**
- Social features (recipe sharing, comments, following users)
- Native mobile apps (iOS, Android)
- Multi-language support (English, etc.)
- Offline mode with sync
- Monetization features (premium accounts, subscriptions)
- Advanced analytics

---

## 9. Design Tokens & Style Guide

### 9.1 Colors

**Primary Palette:**
- Defined by Shadcn/ui theme configuration (neutral base)
- Customizable via CSS variables

**Semantic Colors:**
- Success: Green (Tailwind green-500)
- Warning: Yellow (Tailwind yellow-500)
- Error: Red (Tailwind red-500)
- Info: Blue (Tailwind blue-500)

**Nutrition Colors:**
- Protein: Blue (#3B82F6)
- Carbs: Orange (#F97316)
- Fat: Green (#10B981)
- Fiber: Purple (#A855F7) (if shown separately)

**Calorie Badge Colors:**
- Low (<400 kcal): Green (#10B981)
- Medium (400-600 kcal): Yellow (#FACC15)
- High (>600 kcal): Orange (#F97316)

**Recipe Placeholder Colors:**
- Śniadanie: Light yellow (#FEF3C7)
- Obiad: Light orange (#FED7AA)
- Kolacja: Light blue (#DBEAFE)
- Deser: Light pink (#FCE7F3)
- Przekąska: Light green (#D1FAE5)
- Default: Light gray (#F3F4F6)

### 9.2 Typography

**Font Family:**
- System font stack or custom font (to be defined)
- Fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

**Type Scale (Responsive):**
```css
/* Page Titles */
.text-page-title {
  @apply text-3xl md:text-4xl font-bold;
}

/* Section Headings */
.text-section-heading {
  @apply text-xl md:text-2xl font-semibold;
}

/* Card Titles */
.text-card-title {
  @apply text-lg font-medium;
}

/* Body Text */
.text-body {
  @apply text-base;
}

/* Small Text */
.text-small {
  @apply text-sm text-muted-foreground;
}
```

**Line Heights:**
- Headings: 1.2-1.3
- Body text: 1.5-1.6
- Tight (for UI elements): 1.2

**Font Weights:**
- Bold: 700 (headings, important text)
- Semibold: 600 (subheadings, labels)
- Medium: 500 (card titles, buttons)
- Regular: 400 (body text)

### 9.3 Spacing

**Tailwind Default Scale (4px base unit):**
- `space-y-2`: 8px vertical spacing
- `space-y-4`: 16px
- `space-y-6`: 24px
- `gap-4`: 16px gap in grids/flex
- `gap-6`: 24px gap

**Component Spacing:**
- Between sections: 48-64px (`space-y-12` or `space-y-16`)
- Between cards in grid: 16-24px (`gap-4` or `gap-6`)
- Inside cards (padding): 16-24px (`p-4` or `p-6`)
- Button padding: 12px horizontal, 8px vertical (`px-3 py-2`)

**Max Width Constraints:**
- Full-width pages: `max-w-7xl` (1280px)
- Reading content: `max-w-3xl` (768px)
- Form containers: `max-w-2xl` (672px)

### 9.4 Border Radius

**Shadcn/ui Defaults:**
- Small: 4px (`rounded`)
- Medium: 8px (`rounded-md`)
- Large: 12px (`rounded-lg`)
- Full: 9999px (`rounded-full`) for pills, avatars

**Component-Specific:**
- Cards: `rounded-lg`
- Buttons: `rounded-md`
- Inputs: `rounded-md`
- Badges: `rounded-full`
- Modals: `rounded-lg`

### 9.5 Shadows

**Tailwind Shadows:**
- Small: `shadow-sm` (subtle, cards at rest)
- Medium: `shadow-md` (cards on hover, dropdowns)
- Large: `shadow-lg` (modals, prominent elements)
- Extra large: `shadow-xl` (floating action button)

**Component-Specific:**
- Recipe cards: `shadow-sm` default, `shadow-md` on hover
- Modals: `shadow-lg`
- Dropdowns: `shadow-md`
- Top progress bar: No shadow

### 9.6 Transitions & Animations

**Transition Durations:**
- Fast: 150ms (hover states, small UI changes)
- Medium: 300ms (modals, drawers, page elements)
- Slow: 500ms (page transitions, large animations)

**Easing:**
- Default: `ease-in-out`
- Snappy: `ease-out` (for opening animations)
- Smooth: `ease-in` (for closing animations)

**Common Animations:**
- Hover scale: `transition-transform hover:scale-105`
- Fade in: `transition-opacity`
- Slide in: `transition-transform` with translate
- Skeleton shimmer: Continuous gradient animation

**Performance:**
- Use `transform` and `opacity` for animations (GPU-accelerated)
- Avoid animating `height`, `width`, `top`, `left` (triggers layout)

---

## 10. Implementation Guidelines

### 10.1 Component Development Order

**Recommended Implementation Sequence:**

**Phase 1: Foundation (Week 1-1.5)**
1. Setup Astro project with Tailwind, Shadcn/ui, TypeScript
2. Create base layout components (Header, Footer)
3. Implement basic routing structure (pages)
4. Setup API client utilities
5. Create shared UI components (Button, Input, etc. via Shadcn/ui)

**Phase 2: Core Features (Week 2-3)**
6. Public landing page
7. Recipe list page (My Recipes) with search/filter
8. Recipe card component (all variants)
9. Recipe detail page (without AI modification)
10. Recipe create/edit multi-step form

**Phase 3: Advanced Features (Week 3.5-5)**
11. AI modification modal (all 5 stages)
12. Collections (list, detail, CRUD)
13. Favorites system
14. Profile settings page (all tabs)
15. User dashboard with sections

**Phase 4: Polish & Refinements (Week 5.5-6)**
16. Loading states (skeletons, spinners, progress bar)
17. Error handling (three-tier implementation)
18. Empty states (all contexts)
19. Form validation (progressive, with Zod)
20. Responsive design refinements
21. Accessibility audit and improvements
22. Performance optimizations

### 10.2 Testing Strategy

**Component Testing:**
- Unit tests for utility functions (calculations, formatting)
- Component tests for complex components (RecipeForm, FilterPanel)
- Test user interactions (button clicks, form submissions)

**Integration Testing:**
- Test API integration (mocked responses)
- Test user flows (create recipe → modify with AI → add to collection)

**E2E Testing:**
- Critical paths: Registration → Create recipe → Modify with AI
- Test across browsers (Chrome, Firefox, Safari)
- Test on mobile devices (real devices or emulators)

**Accessibility Testing:**
- Automated: axe-core, Lighthouse
- Manual: Keyboard navigation, screen reader testing (NVDA, VoiceOver)

**Performance Testing:**
- Lighthouse audits (aim for >90 score)
- Bundle size analysis (keep under 200KB initial load)
- Loading time targets: <2s for pages, <5s for AI operations

### 10.3 Code Organization

**File Structure Example:**
```
src/
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx
│   │   ├── AppFooter.tsx
│   │   └── index.ts
│   ├── recipes/
│   │   ├── RecipeCard.tsx
│   │   ├── RecipeList.tsx
│   │   ├── RecipeForm/
│   │   │   ├── RecipeFormWizard.tsx
│   │   │   ├── BasicInfoStep.tsx
│   │   │   ├── IngredientsStep.tsx
│   │   │   └── ... (other steps)
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
│   ├── shared/
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ConfirmationDialog.tsx
│   │   └── index.ts
│   └── ui/ (Shadcn/ui components)
├── pages/
│   ├── index.astro (landing page)
│   ├── dashboard.astro
│   ├── recipes/
│   │   ├── index.astro (my recipes)
│   │   ├── public.astro
│   │   ├── new.astro
│   │   ├── [id].astro (detail)
│   │   └── [id]/
│   │       └── edit.astro
│   ├── collections/
│   │   ├── index.astro
│   │   └── [id].astro
│   ├── favorites.astro
│   └── profile.astro
├── lib/
│   ├── api/
│   │   ├── recipes.ts
│   │   ├── collections.ts
│   │   ├── profile.ts
│   │   └── ... (API client functions)
│   ├── utils/
│   │   ├── calculations.ts (servings, nutrition)
│   │   ├── formatting.ts (date, numbers)
│   │   └── validation.ts (Zod schemas)
│   └── constants.ts (tags, allergens, enums)
├── styles/
│   └── global.css
└── types.ts (shared TypeScript types)
```

**Naming Conventions:**
- Components: PascalCase (RecipeCard.tsx)
- Utilities: camelCase (formatDate.ts)
- Constants: UPPER_SNAKE_CASE or camelCase
- CSS classes: Tailwind utilities preferred, custom classes in kebab-case

**Import Organization:**
- External libraries first
- Internal absolute imports (@/...)
- Relative imports last
- Group by type (components, utils, types)

### 10.4 Performance Optimization Checklist

**Initial Load:**
- [ ] Code splitting by page (Astro handles automatically)
- [ ] Lazy load below-fold React components (`client:visible`)
- [ ] Minimize initial JavaScript bundle (<200KB)
- [ ] Use system fonts or preload custom fonts
- [ ] Optimize images (future: responsive images, WebP)

**Runtime:**
- [ ] Debounce search and filter inputs (500ms)
- [ ] Pagination to limit DOM size (20 items per page)
- [ ] Virtualization for very long lists (future, if needed)
- [ ] Memoize expensive calculations (React.useMemo)
- [ ] Optimize re-renders (React.memo for pure components)

**Network:**
- [ ] Implement loading states for >500ms operations
- [ ] Reduce unnecessary API calls (validation before submission)
- [ ] Handle API timeouts gracefully (especially AI at 5s)
- [ ] Respect rate limits (UI feedback for 429 errors)

**Accessibility:**
- [ ] Ensure all interactive elements keyboard accessible
- [ ] Minimum 44x44px touch targets on mobile
- [ ] ARIA labels for icon-only buttons
- [ ] Focus management in modals/dialogs
- [ ] Color contrast ratios meet WCAG AA (4.5:1 minimum)

### 10.5 Deployment Considerations

**Build Process:**
- Astro static build or SSR mode (configured for Node.js adapter)
- TypeScript compilation
- Tailwind CSS purging (remove unused classes)
- Asset optimization (minification, compression)

**Environment Variables:**
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY` (server-only)

**Hosting:**
- DigitalOcean (via Docker, per CLAUDE.md)
- Node.js standalone mode adapter

**CI/CD:**
- GitHub Actions for automated builds
- Automated tests on PR
- Deploy on merge to main

**Monitoring:**
- Error tracking (future: Sentry or similar)
- Performance monitoring (Lighthouse CI)
- API usage monitoring (rate limits, response times)

---

## 11. Appendix

### 11.1 User Story to UI Mapping

This section maps each user story from the PRD to the corresponding UI views and components.

**US-001: Rejestracja nowego użytkownika**
- Views: Public landing page (`/`) → Registration page (auth UI, deferred)
- Components: Registration form, email/password inputs, submit button

**US-002: Logowanie istniejącego użytkownika**
- Views: Login page (auth UI, deferred)
- Components: Login form, email/password inputs, submit button

**US-003: Odzyskiwanie hasła**
- Views: Password reset page (auth UI, deferred)
- Components: Password reset form, email input

**US-004: Wylogowanie**
- Views: Header user menu
- Components: Logout button in dropdown

**US-005: Uzupełnianie profilu o dane podstawowe**
- Views: Profile settings (`/profile`), Tab 1: Podstawowe dane
- Components: ProfileForm with inputs for weight, age, gender, activity level

**US-006: Ustawianie preferencji żywieniowych**
- Views: Profile settings, Tab 2: Preferencje żywieniowe
- Components: DietaryPreferencesSection with diet type, target goal, target value inputs

**US-007: Edycja danych profilu**
- Views: Same as US-005/US-006
- Components: Same forms with pre-populated data, edit mode

**US-008: Określanie celów dietetycznych**
- Views: Profile settings, Tab 2
- Components: Target goal and target value inputs

**US-009: Dodawanie nowego przepisu**
- Views: Recipe creation (`/recipes/new`)
- Components: RecipeFormWizard (6 steps), all step components

**US-010: Przeglądanie istniejących przepisów**
- Views: My Recipes page (`/recipes`)
- Components: RecipeList, RecipeCard, pagination

**US-011: Edycja przepisu**
- Views: Recipe edit (`/recipes/[id]/edit`)
- Components: RecipeFormWizard (pre-populated)

**US-012: Usuwanie przepisu**
- Views: Recipe detail page, My Recipes page (card menu)
- Components: Delete button, ConfirmationDialog

**US-013: Wyszukiwanie i filtrowanie przepisów**
- Views: My Recipes page, Public Recipes page
- Components: SearchBar, FilterPanel, ActiveFilterChips

**US-014: Zapisywanie przepisów do ulubionych**
- Views: Recipe detail page, recipe cards (all lists)
- Components: Heart icon toggle button

**US-015: Organizowanie przepisów w kolekcje**
- Views: Collections page (`/collections`), Collection detail (`/collections/[id]`)
- Components: CollectionCard, CollectionDialog, add/remove buttons

**US-016: Dostosowanie kaloryczności przepisu**
- Views: Recipe detail page
- Components: RecipeModificationModal (type: reduce_calories or increase_calories)

**US-017: Zwiększenie zawartości białka**
- Views: Recipe detail page
- Components: RecipeModificationModal (type: increase_protein)

**US-018: Zmiana wielkości porcji**
- Views: Recipe detail page
- Components: ServingsAdjuster component, real-time ingredient recalculation

**US-019: Wyszukiwanie zdrowszych zamienników składników**
- Views: Recipe detail page
- Components: RecipeModificationModal (type: ingredient_substitution)

**US-020: Ocena zmodyfikowanego przepisu**
- **Excluded from MVP** (rating system not included)

**US-021: Przypisywanie przepisów do dni w kalendarzu**
- **Excluded from MVP** (meal planner not included)

**US-022: Przeglądanie zaplanowanych posiłków**
- **Excluded from MVP**

**US-023: Usuwanie zaplanowanych posiłków**
- **Excluded from MVP**

**US-024: Przeglądanie statystyk użytkowników (Admin)**
- **Excluded from MVP** (admin dashboard not included)

**US-025: Przeglądanie statystyk generowania przepisów (Admin)**
- **Excluded from MVP**

**US-026: Przeglądanie statystyk ocen przepisów (Admin)**
- **Excluded from MVP**

### 11.2 Requirements to UI Elements Mapping

**Requirement: AI-powered recipe modification**
- UI Elements: "Modyfikuj z AI" button, RecipeModificationModal (5-stage flow), comparison view (split-view/tabs), modification notes display

**Requirement: Multi-step recipe creation**
- UI Elements: RecipeFormWizard, ProgressIndicator, 6 step components, navigation buttons, draft restoration prompt

**Requirement: Polish language interface**
- UI Elements: All labels, buttons, messages, errors, placeholders in Polish

**Requirement: Mobile-first responsive design**
- UI Elements: Responsive grids (1/2-3/3-4 columns), hamburger menu, bottom sheet drawers, stacked layouts, touch targets 44x44px

**Requirement: Dietary preferences and allergens**
- UI Elements: Profile settings tabs (Preferencje żywieniowe, Alergeny), checkbox grids, dropdowns for diet type, allergen multi-select

**Requirement: Recipe search and filtering**
- UI Elements: SearchBar with debounce, FilterPanel (collapsible/drawer), tag checkboxes, calorie/time sliders, sort dropdown, ActiveFilterChips, URL parameter integration

**Requirement: Collections and favorites**
- UI Elements: Heart icon toggle, Collections page with grid, CollectionDialog, add/remove buttons, collection detail page

**Requirement: Nutrition visualization**
- UI Elements: NutritionPieChart, macronutrient breakdown list, calorie badges (color-coded)

**Requirement: System hasztagów (tags)**
- UI Elements: Tag checkboxes in recipe form (Step 5), custom tag creation button/dialog, tag badges on recipe cards, tag filter in FilterPanel

**Requirement: Public vs private recipes**
- UI Elements: isPublic checkbox in recipe form, Public Recipes page (`/recipes/public`), author name display on public recipe cards

**Requirement: Servings adjustment**
- UI Elements: ServingsAdjuster component ([−] count [+]), real-time ingredient amount recalculation

**Requirement: Form validation**
- UI Elements: Inline error messages (red text, icon), summary alert at form top, field highlighting, required indicators (asterisk)

**Requirement: Loading and error states**
- UI Elements: Skeletons (RecipeCardSkeleton, etc.), LoadingSpinner, TopProgressBar, error toasts, error modals for AI, EmptyState components

### 11.3 User Pain Points & UI Solutions

**Pain Point: "Standardowe przepisy nie uwzględniają moich potrzeb dietetycznych"**
- **Solution:** AI modification feature with specific types (reduce calories, increase protein, etc.), dietary preferences in profile settings considered by AI (future enhancement)

**Pain Point: "Ręczne przeliczanie wartości odżywczych jest czasochłonne"**
- **Solution:** AI automatically recalculates nutrition when modifying recipe, ServingsAdjuster automatically recalculates ingredient amounts and nutrition per serving

**Pain Point: "Nie wiem jakie składniki mogę zamienić na zdrowsze"**
- **Solution:** AI ingredient substitution feature with comparison of nutrition values (original vs substitute), modification notes explain changes

**Pain Point: "Trudno znaleźć potrzebny przepis w mojej kolekcji"**
- **Solution:** Search bar with full-text search, filter panel with tags/calories/time, collections for organizing recipes, favorites for quick access

**Pain Point: "Nie mam czasu na długie formularze"**
- **Solution:** Multi-step wizard breaks form into manageable chunks, draft auto-save prevents data loss, progress indicator shows how much left

**Pain Point: "Nie wiem czy modyfikacja AI będzie dobra"**
- **Solution:** Before/after comparison view (split-view or tabs), change indicators (green/red badges), modification notes explaining changes, option to cancel before saving

**Pain Point: "Nie pamiętam ile składników użyć dla innej liczby porcji"**
- **Solution:** ServingsAdjuster with real-time recalculation, clear display of adjusted amounts

**Pain Point: "Aplikacje internetowe są wolne i frustrujące"**
- **Solution:** Loading states (skeletons) reduce perceived latency, optimistic UI for favorites/collections, top progress bar for page transitions, pagination limits DOM size

**Pain Point: "Ciężko używać aplikacji na telefonie"**
- **Solution:** Mobile-first design, touch-friendly targets (44x44px), swipe gestures, bottom sheet drawers, responsive layouts, hamburger menu

### 11.4 Glossary

**Terms:**

- **Astro Island:** Pattern where interactive React components are "islands" of JavaScript in otherwise static HTML (partial hydration)
- **Client Directive:** Astro directive specifying when to hydrate React component (client:load, client:visible, etc.)
- **Line Clamp:** CSS technique to truncate text after specific number of lines (line-clamp-2)
- **Optimistic UI:** Pattern where UI updates immediately before API confirmation, reverting on error
- **Progressive Validation:** Validation strategy where different fields validate at different times (blur, real-time, submit)
- **RLS (Row-Level Security):** PostgreSQL feature enforcing data access rules at database level
- **Server-Side Rendering (SSR):** Rendering HTML on server before sending to client
- **Shadcn/ui:** Component library providing accessible, customizable React components
- **Skeleton:** Loading placeholder matching layout of actual content
- **Toast:** Temporary notification message (success, error, info)
- **Zod:** TypeScript-first schema validation library

**Polish UI Terms:**

- Ulubione: Favorites
- Kolekcje: Collections
- Przepisy: Recipes
- Składniki: Ingredients
- Kroki przygotowania: Preparation steps
- Wartości odżywcze: Nutrition values
- Porcje: Servings
- Tagi: Tags
- Alergeny: Allergens
- Preferencje żywieniowe: Dietary preferences
- Modyfikuj z AI: Modify with AI
- Zmniejsz kalorie: Reduce calories
- Zwiększ białko: Increase protein

### 11.5 Open Questions & Unresolved Issues

Based on the session notes, these items need clarification before or during implementation:

**Technical Decisions:**

1. **API Endpoint for Custom Tag Creation:** Need to add POST `/api/tags` to API plan for custom tag creation from recipe form

2. **Chart Library Selection:** Choose between Recharts and Chart.js based on:
   - Bundle size
   - Ease of implementing 10% minimum slice requirement
   - React integration quality
   - TypeScript support

3. **Top Progress Bar Library:** Choose specific library (NProgress or alternative) or implement custom

**Design Clarifications:**

4. **Recipe Placeholder Color Assignment:** Define specific color mapping for all tag categories and fallback color logic

5. **Nutrition Info Icon Tooltip Content:** Finalize Polish text for nutrition guidance tooltip, decide if links to calculators should be included

6. **Filter Slider Steps:** Define step increments for calorie slider (50? 100?) and prep time slider (5 min? 10 min?)

**UX Details:**

7. **Dashboard Empty Sections:** When section has fewer items than target (4-6), should it shrink, show empty slots, or hide?

8. **"Zobacz wszystkie/więcej" Link Context:** Should links preserve any context like "came from dashboard"?

9. **Modification Comparison Change Thresholds:** What % change is significant enough to highlight with color indicators?

10. **Mobile Navigation Pattern:** Bottom tab bar desired for MVP or post-MVP? Which items in bottom bar vs hamburger?

11. **Recipe Card Tap Behavior:** Tap card → navigate to detail or tap → expand inline?

**Note:** These clarifications are minor and shouldn't block initial development. Most can be resolved during implementation or early review cycles.

---

**Document Version:** 1.0
**Date:** 2025-10-18
**Status:** Ready for Implementation
**Next Steps:** Begin Phase 1 implementation (Foundation), set up Astro project with Tailwind and Shadcn/ui