import { useState } from "react";
import { Button } from "@/components/ui/button";
import EmptyState from "./EmptyState";
import CollectionGrid from "./CollectionGrid";
import CreateCollectionDialog from "./dialogs/CreateCollectionDialog";
import EditCollectionDialog from "./dialogs/EditCollectionDialog";
import DeleteCollectionDialog from "./dialogs/DeleteCollectionDialog";
import type { CollectionsLayoutProps, DialogState } from "./types";
import type { CollectionDTO } from "@/types";

/**
 * CollectionsLayout component - Main container for Collections List Page
 *
 * Features:
 * - Displays all user collections in a responsive grid
 * - Create new collection with validation
 * - Edit collection name with conflict detection
 * - Delete collection with confirmation
 * - Empty state with call-to-action
 * - Loading states (initial load handled by Astro)
 * - Toast notifications for user feedback
 * - Navigation to collection detail page
 *
 * State management:
 * - collections: Array of CollectionDTO (optimistic updates)
 * - dialogState: Controls all dialog open/close states
 *
 * @example
 * ```tsx
 * // In collections.astro
 * <CollectionsLayout initialCollections={collections} client:load />
 * ```
 */
const CollectionsLayout = ({ initialCollections }: CollectionsLayoutProps) => {
  // ========================================
  // STATE
  // ========================================

  // Collections data (optimistic updates)
  const [collections, setCollections] = useState<CollectionDTO[]>(initialCollections);

  // Dialog state management
  const [dialogState, setDialogState] = useState<DialogState>({
    create: false,
    edit: { open: false, collection: null },
    delete: { open: false, collection: null },
  });

  // ========================================
  // DIALOG HANDLERS
  // ========================================

  /**
   * Open create collection dialog
   */
  const openCreateDialog = () => {
    setDialogState((prev) => ({ ...prev, create: true }));
  };

  /**
   * Close create collection dialog
   */
  const closeCreateDialog = () => {
    setDialogState((prev) => ({ ...prev, create: false }));
  };

  /**
   * Open edit collection dialog
   */
  const openEditDialog = (collection: CollectionDTO) => {
    setDialogState((prev) => ({
      ...prev,
      edit: { open: true, collection },
    }));
  };

  /**
   * Close edit collection dialog
   */
  const closeEditDialog = () => {
    setDialogState((prev) => ({
      ...prev,
      edit: { open: false, collection: null },
    }));
  };

  /**
   * Open delete collection dialog
   */
  const openDeleteDialog = (collection: CollectionDTO) => {
    setDialogState((prev) => ({
      ...prev,
      delete: { open: true, collection },
    }));
  };

  /**
   * Close delete collection dialog
   */
  const closeDeleteDialog = () => {
    setDialogState((prev) => ({
      ...prev,
      delete: { open: false, collection: null },
    }));
  };

  // ========================================
  // COLLECTION HANDLERS
  // ========================================

  /**
   * Handle create success - add new collection to state
   */
  const handleCreateSuccess = (newCollection: CollectionDTO) => {
    setCollections((prev) => [newCollection, ...prev]);
  };

  /**
   * Handle edit success - update collection in state
   */
  const handleEditSuccess = (updatedCollection: { id: string; name: string }) => {
    setCollections((prev) =>
      prev.map((collection) =>
        collection.id === updatedCollection.id ? { ...collection, name: updatedCollection.name } : collection
      )
    );
  };

  /**
   * Handle delete success - remove collection from state
   */
  const handleDeleteSuccess = (deletedCollectionId: string) => {
    setCollections((prev) => prev.filter((collection) => collection.id !== deletedCollectionId));
  };

  /**
   * Handle collection card click - navigate to detail page
   */
  const handleCardClick = (collectionId: string) => {
    window.location.href = `/collections/${collectionId}`;
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Moje Kolekcje</h1>
          {collections.length > 0 && (
            <p className="mt-1 text-sm text-gray-600">
              {collections.length === 1
                ? "1 kolekcja"
                : collections.length >= 2 && collections.length <= 4
                  ? `${collections.length} kolekcje`
                  : `${collections.length} kolekcji`}
            </p>
          )}
        </div>
        {collections.length > 0 && (
          <Button onClick={openCreateDialog} className="bg-green-600 text-white hover:bg-green-700">
            + Nowa kolekcja
          </Button>
        )}
      </div>

      {/* Empty State */}
      {collections.length === 0 && <EmptyState onCreateClick={openCreateDialog} />}

      {/* Collection Grid */}
      {collections.length > 0 && (
        <CollectionGrid
          collections={collections}
          onCardClick={handleCardClick}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
        />
      )}

      {/* Create Collection Dialog */}
      <CreateCollectionDialog
        open={dialogState.create}
        onOpenChange={closeCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Collection Dialog */}
      <EditCollectionDialog
        open={dialogState.edit.open}
        collection={dialogState.edit.collection}
        onOpenChange={closeEditDialog}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Collection Dialog */}
      <DeleteCollectionDialog
        open={dialogState.delete.open}
        collection={dialogState.delete.collection}
        onOpenChange={closeDeleteDialog}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default CollectionsLayout;
