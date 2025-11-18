import { useMemo, useState } from "react";
import { useCollectionDetail } from "@/components/hooks/useCollectionDetail";
import { useFavoriteToggle } from "@/components/hooks/useFavoriteToggle";
import { useRemoveFromCollection } from "@/components/hooks/useRemoveFromCollection";
import CollectionHeader from "./CollectionHeader";
import CollectionRecipeGrid from "./CollectionRecipeGrid";
import EditCollectionNameDialog from "./EditCollectionNameDialog";
import DeleteCollectionDialog from "./DeleteCollectionDialog";
import type { CollectionDetailDTO } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface CollectionDetailLayoutProps {
  /**
   * Initial collection data from server-side fetch
   */
  initialCollection: CollectionDetailDTO;

  /**
   * Initial favorited recipe IDs (array for serialization from Astro)
   */
  initialFavorites: string[];
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * CollectionDetailLayout - Main container component for collection detail view
 *
 * This component:
 * - Manages all client-side state and interactions
 * - Coordinates between custom hooks
 * - Orchestrates data fetching, pagination, favorites, and recipe removal
 * - Provides loading states and error handling
 * - Delegates rendering to child components
 *
 * State Management:
 * - useCollectionDetail: Collection data and pagination
 * - useFavoriteToggle: Favorite status management
 * - useRemoveFromCollection: Recipe removal (will be added in next step)
 * - useEditCollectionName: Name editing (will be added in next step)
 * - useDeleteCollection: Collection deletion (will be added in next step)
 *
 * @example
 * ```tsx
 * // In Astro page
 * <CollectionDetailLayout
 *   client:load
 *   initialCollection={serverData}
 *   initialFavorites={Array.from(favoritesSet)}
 * />
 * ```
 */
const CollectionDetailLayout = ({ initialCollection, initialFavorites }: CollectionDetailLayoutProps) => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  // Convert favorites array to Set
  const initialFavoritesSet = useMemo(() => new Set(initialFavorites), [initialFavorites]);

  // Collection data hook
  const { collection, isLoading, currentPage, goToPage, refreshCollection } = useCollectionDetail({
    collectionId: initialCollection.id,
    initialCollection,
    initialPage: 1,
  });

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collectionName, setCollectionName] = useState(initialCollection.name);

  // Favorites hook (reused)
  const { favorites, toggleFavorite, isTogglingRecipe } = useFavoriteToggle({
    initialFavorites: initialFavoritesSet,
  });

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Handle recipe removal
   */
  const handleRecipeRemoved = async () => {
    // Check if current page becomes empty after removal
    if (collection && collection.recipes.length === 1 && currentPage > 1) {
      // Last recipe on current page - go to previous page
      await goToPage(currentPage - 1);
    } else {
      // Refresh current page (may show empty state)
      await refreshCollection();
    }
  };

  // Remove from collection hook
  const { removeRecipe, isRemoving } = useRemoveFromCollection({
    collectionId: initialCollection.id,
    onRemoved: handleRecipeRemoved,
  });

  /**
   * Handle collection name update
   */
  const handleNameUpdated = (newName: string) => {
    // Update local state
    setCollectionName(newName);
  };

  /**
   * Handle collection deletion
   */
  const handleCollectionDeleted = () => {
    // Redirect to collections list
    window.location.href = "/collections";
  };

  /**
   * Handle page change
   */
  const handlePageChange = async (page: number) => {
    await goToPage(page);
    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ========================================
  // COMPUTED VALUES
  // ========================================

  // Check if we should show empty state
  const isEmpty = collection && collection.recipes.length === 0 && !isLoading;

  // ========================================
  // RENDER
  // ========================================

  // Loading state (initial load)
  if (!collection && isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
          <p className="text-gray-600">Ładowanie kolekcji...</p>
        </div>
      </div>
    );
  }

  // Error state (no collection data)
  if (!collection) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Nie można załadować kolekcji</h2>
          <p className="mt-2 text-gray-600">Wystąpił błąd podczas pobierania danych</p>
          <a
            href="/collections"
            className="mt-4 inline-block rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Wróć do kolekcji
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Header Section */}
        <CollectionHeader
          collectionId={collection.id}
          collectionName={collectionName}
          recipeCount={collection.pagination.total}
          onEditClick={() => setEditDialogOpen(true)}
          onDeleteClick={() => setDeleteDialogOpen(true)}
        />

        {/* Empty State */}
        {isEmpty && (
          <div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Ta kolekcja jest pusta</p>
              <p className="mt-2 text-gray-600">Dodaj przepisy, aby zorganizować swoje ulubione posiłki</p>
              <a
                href="/recipes"
                className="mt-4 inline-block rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                Przeglądaj przepisy
              </a>
            </div>
          </div>
        )}

        {/* Recipe Grid */}
        {!isEmpty && (
          <CollectionRecipeGrid
            collectionId={collection.id}
            collectionName={collectionName}
            recipes={collection.recipes}
            pagination={collection.pagination}
            favorites={favorites}
            onPageChange={handlePageChange}
            onFavoriteToggle={toggleFavorite}
            onRecipeRemoved={handleRecipeRemoved}
            isLoadingPage={isLoading}
            isTogglingRecipe={isTogglingRecipe}
            isRemovingRecipe={isRemoving}
            removeRecipe={removeRecipe}
          />
        )}
      </div>

      {/* Dialogs */}
      <EditCollectionNameDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        collectionId={collection.id}
        currentName={collectionName}
        onNameUpdated={handleNameUpdated}
      />

      <DeleteCollectionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        collectionId={collection.id}
        collectionName={collectionName}
        onDeleted={handleCollectionDeleted}
      />
    </>
  );
};

export default CollectionDetailLayout;
