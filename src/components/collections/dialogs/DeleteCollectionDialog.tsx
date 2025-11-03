import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { DeleteCollectionDialogProps } from "../types";

/**
 * Format recipe count with proper Polish pluralization
 * @param count - Number of recipes
 * @returns Formatted string (e.g., "5 przepisów")
 */
const formatRecipeCount = (count: number): string => {
  if (count === 0) return "0 przepisów";
  if (count === 1) return "1 przepis";
  if (count >= 2 && count <= 4) return `${count} przepisy`;
  return `${count} przepisów`;
};

/**
 * DeleteCollectionDialog component - Confirmation dialog for deleting collection
 *
 * Features:
 * - AlertDialog for destructive action
 * - Shows collection name and recipe count
 * - Clarifies that recipes remain available
 * - API integration with error handling
 * - Loading states
 * - Toast notifications
 *
 * Response:
 * - 204 No Content on success
 * - 404 if collection not found
 * - 500 on server error
 *
 * @example
 * ```tsx
 * <DeleteCollectionDialog
 *   open={dialogState.delete.open}
 *   collection={dialogState.delete.collection}
 *   onOpenChange={(open) => setDialogState({ ...state, delete: { ...state.delete, open } })}
 *   onSuccess={(id) => removeCollectionFromState(id)}
 * />
 * ```
 */
const DeleteCollectionDialog = ({ open, collection, onOpenChange, onSuccess }: DeleteCollectionDialogProps) => {
  // ========================================
  // STATE
  // ========================================

  const [isLoading, setIsLoading] = useState(false);

  // ========================================
  // HANDLERS
  // ========================================

  /**
   * Handle delete confirmation
   * Calls API to delete collection
   */
  const handleDelete = async () => {
    if (!collection) return;

    setIsLoading(true);

    try {
      // Call API to delete collection
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "DELETE",
      });

      // Handle API errors
      if (!response.ok) {
        if (response.status === 404) {
          // Collection not found (possibly already deleted)
          toast.error("Kolekcja nie została znaleziona");
          onOpenChange(false);
          return;
        }

        // Generic error
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Nie udało się usunąć kolekcji");
      }

      // Show success toast
      toast.success("Kolekcja została usunięta");

      // Call success callback
      onSuccess(collection.id);

      // Close dialog
      onOpenChange(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[DeleteCollectionDialog] Error deleting collection:", error);

      // Show error toast
      toast.error(error instanceof Error ? error.message : "Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usuń kolekcję?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Ta akcja jest nieodwracalna.</p>
            {collection && (
              <>
                <p>
                  Kolekcja <span className="font-semibold text-gray-900">&ldquo;{collection.name}&rdquo;</span> zostanie
                  trwale usunięta.
                </p>
                <p>
                  Kolekcja zawiera{" "}
                  <span className="font-semibold text-gray-900">{formatRecipeCount(collection.recipeCount)}</span>.
                  {collection.recipeCount > 0 && " Przepisy pozostaną dostępne w Twoich przepisach."}
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Usuwanie...
              </>
            ) : (
              "Usuń"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteCollectionDialog;
