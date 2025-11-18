import { useState, useCallback } from "react";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for initializing the useDeleteCollection hook
 */
export interface UseDeleteCollectionOptions {
  /**
   * Collection UUID to delete
   */
  collectionId: string;

  /**
   * Callback when collection is successfully deleted
   * Parent component should handle navigation to /collections
   */
  onDeleted: () => void;
}

/**
 * Return type for the useDeleteCollection hook
 */
export interface UseDeleteCollectionReturn {
  /**
   * Delete the collection
   * Shows success toast and calls onDeleted callback
   */
  deleteCollection: () => Promise<void>;

  /**
   * Whether the deletion is in progress
   */
  isDeleting: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for deleting a collection
 *
 * This hook provides:
 * - API integration for collection deletion
 * - Loading state tracking
 * - Success/error toast notifications
 * - Automatic callback after success for navigation
 *
 * @example
 * ```tsx
 * const { deleteCollection, isDeleting } = useDeleteCollection({
 *   collectionId: 'collection-uuid',
 *   onDeleted: () => {
 *     toast.success("Kolekcja została usunięta");
 *     window.location.href = "/collections";
 *   }
 * });
 *
 * // In confirmation dialog
 * <button
 *   onClick={deleteCollection}
 *   disabled={isDeleting}
 * >
 *   {isDeleting ? 'Usuwanie...' : 'Usuń kolekcję'}
 * </button>
 * ```
 */
export const useDeleteCollection = (options: UseDeleteCollectionOptions): UseDeleteCollectionReturn => {
  const { collectionId, onDeleted } = options;

  // State for loading
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Delete the collection
   */
  const deleteCollection = useCallback(async (): Promise<void> => {
    setIsDeleting(true);

    try {
      // DELETE /api/collections/{collectionId}
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: "DELETE",
        credentials: "include",
      });

      // Handle error responses
      if (!response.ok) {
        if (response.status === 404) {
          // Collection not found (possibly already deleted) - redirect anyway
          toast.success("Kolekcja została usunięta");
          onDeleted();
          return;
        }

        if (response.status === 403) {
          // Unauthorized
          toast.error("Nie masz dostępu do tej kolekcji");
          return;
        }

        // Generic error
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Nie udało się usunąć kolekcji");
      }

      // Success (204 No Content)
      toast.success("Kolekcja została usunięta");

      // Call success callback (parent should redirect)
      onDeleted();
    } catch (error) {
      // Log error
      // eslint-disable-next-line no-console
      console.error("[useDeleteCollection] Delete error:", {
        collectionId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Show error toast
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [collectionId, onDeleted]);

  return {
    deleteCollection,
    isDeleting,
  };
};
