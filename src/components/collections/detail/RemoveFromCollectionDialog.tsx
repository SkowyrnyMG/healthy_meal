import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface RemoveFromCollectionDialogProps {
  /**
   * Whether dialog is open
   */
  open: boolean;

  /**
   * Callback to change dialog open state
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Recipe UUID to remove
   */
  recipeId: string;

  /**
   * Recipe title to display in confirmation
   */
  recipeTitle: string;

  /**
   * Collection UUID
   */
  collectionId: string;

  /**
   * Collection name to display in confirmation
   */
  collectionName: string;

  /**
   * Callback to remove recipe from collection
   * Should be the removeRecipe function from useRemoveFromCollection hook
   */
  onRemove: (recipeId: string, recipeTitle: string) => Promise<void>;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * RemoveFromCollectionDialog - Confirmation dialog for removing recipe from collection
 *
 * Features:
 * - AlertDialog for confirmation
 * - Shows recipe title and collection name
 * - Clarifies that only association is removed, not the recipe itself
 * - Loading state during removal
 * - Automatic close after successful removal
 * - Cannot be closed while removing
 * - Shows undo toast after removal (handled by useRemoveFromCollection hook)
 *
 * Dialog Message:
 * "Przepis '{recipeTitle}' zostanie usunięty z kolekcji '{collectionName}'.
 * Sam przepis nie zostanie usunięty."
 *
 * @example
 * ```tsx
 * const { removeRecipe } = useRemoveFromCollection({
 *   collectionId: 'uuid',
 *   onRemoved: () => refreshCollection()
 * });
 *
 * <RemoveFromCollectionDialog
 *   open={removeDialogOpen}
 *   onOpenChange={setRemoveDialogOpen}
 *   recipeId="recipe-uuid"
 *   recipeTitle="Placki ziemniaczane"
 *   collectionId="collection-uuid"
 *   collectionName="Szybkie kolacje"
 *   onRemove={removeRecipe}
 * />
 * ```
 */
const RemoveFromCollectionDialog = ({
  open,
  onOpenChange,
  recipeId,
  recipeTitle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  collectionId,
  collectionName,
  onRemove,
}: RemoveFromCollectionDialogProps) => {
  // ========================================
  // STATE
  // ========================================

  const [isRemoving, setIsRemoving] = useState(false);

  // ========================================
  // HANDLERS
  // ========================================

  /**
   * Handle remove confirmation
   */
  const handleRemove = async () => {
    setIsRemoving(true);

    try {
      // Call parent's remove function (from useRemoveFromCollection hook)
      await onRemove(recipeId, recipeTitle);

      // Close dialog
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook (shows toast)
      // Just log it here for debugging
      // eslint-disable-next-line no-console
      console.error("[RemoveFromCollectionDialog] Remove error:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!isRemoving) {
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
          <AlertDialogTitle>Usuń z kolekcji?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Przepis <span className="font-semibold text-gray-900">&ldquo;{recipeTitle}&rdquo;</span> zostanie usunięty
              z kolekcji <span className="font-semibold text-gray-900">&ldquo;{collectionName}&rdquo;</span>.
            </p>
            <p>Sam przepis nie zostanie usunięty.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isRemoving}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={handleRemove} disabled={isRemoving}>
            {isRemoving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Usuwanie...
              </>
            ) : (
              "Usuń z kolekcji"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RemoveFromCollectionDialog;
