import { useRecipeFilters } from "@/components/hooks/useRecipeFilters";
import { useRecipeList } from "@/components/hooks/useRecipeList";
import { useTags } from "@/components/hooks/useTags";
import { useFavoriteToggle } from "@/components/hooks/useFavoriteToggle";
import SearchBar from "./SearchBar";
import FilterPanel from "./FilterPanel";
import ActiveFilterChips from "./ActiveFilterChips";
import RecipeGrid from "./RecipeGrid";
import LoadingSkeletons from "./LoadingSkeletons";
import EmptyState from "./EmptyState";
import Pagination from "./Pagination";

// ============================================================================
// TYPES
// ============================================================================

interface RecipeListLayoutProps {
  /**
   * Initial set of favorite recipe IDs (from server)
   */
  initialFavoriteIds: string[];
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * RecipeListLayout is the main container component for the My Recipes page
 *
 * Features:
 * - Responsive layout with filter sidebar (desktop) or sheet (mobile)
 * - URL-based filter state management
 * - Real-time search with debouncing
 * - Advanced filtering (tags, calories, prep time)
 * - Pagination
 * - Loading states and empty states
 * - Favorite toggle with optimistic updates
 *
 * Layout:
 * - Desktop: Sidebar (filters) + Main content area
 * - Mobile: Stacked layout with filter button/sheet
 *
 * @example
 * ```astro
 * <RecipeListLayout
 *   initialFavoriteIds={favoriteIds}
 *   client:load
 * />
 * ```
 */
const RecipeListLayout = ({ initialFavoriteIds }: RecipeListLayoutProps) => {
  // Initialize hooks
  const {
    filters,
    setSearch,
    setTagIds,
    setMaxCalories,
    setMaxPrepTime,
    setSortBy,
    setPage,
    clearFilters,
    removeFilter,
    activeFilterCount,
    isFilterPanelOpen,
    toggleFilterPanel,
  } = useRecipeFilters();

  const { recipes, pagination, isLoading, error, refetch } = useRecipeList(filters);

  const { tags, isLoading: isLoadingTags, error: tagsError } = useTags();

  const { favorites, toggleFavorite, isTogglingRecipe } = useFavoriteToggle({
    initialFavorites: new Set(initialFavoriteIds),
  });

  // Handle filter changes (for FilterPanel)
  const handleFiltersChange = (partialFilters: Partial<typeof filters>) => {
    if (partialFilters.tagIds !== undefined) {
      setTagIds(partialFilters.tagIds);
    }
    if (partialFilters.maxCalories !== undefined) {
      setMaxCalories(partialFilters.maxCalories);
    }
    if (partialFilters.maxPrepTime !== undefined) {
      setMaxPrepTime(partialFilters.maxPrepTime);
    }
    if (partialFilters.sortBy !== undefined && partialFilters.sortOrder !== undefined) {
      setSortBy(partialFilters.sortBy, partialFilters.sortOrder);
    }
  };

  // Determine empty state type
  const emptyStateType = activeFilterCount === 0 ? "no-recipes" : "no-results";

  // Handle empty state actions
  const handleAddRecipe = () => {
    window.location.href = "/recipes/new";
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  // Handle apply filters (mobile - closes sheet)
  const handleApplyFilters = () => {
    toggleFilterPanel();
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:flex-row lg:p-6">
      {/* Filter Panel (Sidebar on desktop, Sheet on mobile) */}
      <FilterPanel
        filters={filters}
        tags={tags}
        isLoadingTags={isLoadingTags}
        onFiltersChange={handleFiltersChange}
        onApply={handleApplyFilters}
        onClear={clearFilters}
        isOpen={isFilterPanelOpen}
        onOpenChange={toggleFilterPanel}
        activeFilterCount={activeFilterCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 space-y-6">
        {/* Search Bar */}
        <SearchBar value={filters.search} onChange={setSearch} />

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <ActiveFilterChips filters={filters} tags={tags} onRemoveFilter={removeFilter} onClearAll={clearFilters} />
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-900">{error}</p>
            <button onClick={refetch} className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700">
              Spróbuj ponownie
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !error && <LoadingSkeletons count={12} />}

        {/* Empty State */}
        {!isLoading && !error && recipes.length === 0 && (
          <EmptyState
            type={emptyStateType}
            onAddRecipe={emptyStateType === "no-recipes" ? handleAddRecipe : undefined}
            onClearFilters={emptyStateType === "no-results" ? handleClearFilters : undefined}
          />
        )}

        {/* Recipe Grid */}
        {!isLoading && !error && recipes.length > 0 && (
          <>
            <RecipeGrid
              recipes={recipes}
              favoriteRecipeIds={favorites}
              onFavoriteToggle={toggleFavorite}
              isTogglingRecipe={isTogglingRecipe}
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && <Pagination pagination={pagination} onPageChange={setPage} />}
          </>
        )}

        {/* Tags Loading Error (non-blocking) */}
        {tagsError && (
          <div className="mt-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
            Uwaga: Nie udało się załadować kategorii. Filtrowanie po kategoriach jest niedostępne.
          </div>
        )}
      </main>
    </div>
  );
};

export default RecipeListLayout;
