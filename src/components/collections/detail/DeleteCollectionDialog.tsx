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
import { useDeleteCollection } from "@/components/hooks/useDeleteCollection";

// ============================================================================
// TYPES
// ============================================================================

interface DeleteCollectionDialogProps {
  /**
   * Whether dialog is open
   */
  open: boolean;

  /**
   * Callback to change dialog open state
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Collection UUID
   */
  collectionId: string;

  /**
   * Collection name to display in confirmation
   */
  collectionName: string;

  /**
   * Callback when collection is successfully deleted
   * Parent should handle navigation to /collections
   */
  onDeleted: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * DeleteCollectionDialog - Confirmation dialog for deleting collection
 *
 * Features:
 * - AlertDialog for destructive action
 * - Shows collection name in warning message
 * - Clarifies that recipes remain available
 * - Integration with useDeleteCollection hook
 * - Loading state during deletion
 * - Automatic close after successful deletion
 * - Cannot be closed while deleting
 *
 * Dialog Message:
 * "Czy na pewno chcesz usunąć kolekcję '{name}'? Wszystkie przepisy zostaną
 * zachowane, ale stracisz tę organizację. Tej operacji nie można cofnąć."
 *
 * @example
 * ```tsx
 * <DeleteCollectionDialog
 *   open={deleteDialogOpen}
 *   onOpenChange={setDeleteDialogOpen}
 *   collectionId="uuid"
 *   collectionName="Szybkie kolacje"
 *   onDeleted={() => window.location.href = "/collections"}
 * />
 * ```
 */
const DeleteCollectionDialog = ({
  open,
  onOpenChange,
  collectionId,
  collectionName,
  onDeleted,
}: DeleteCollectionDialogProps) => {
  // ========================================
  // HOOKS
  // ========================================

  // Hook for deleting collection
  const { deleteCollection, isDeleting } = useDeleteCollection({
    collectionId,
    onDeleted,
  });

  // ========================================
  // HANDLERS
  // ========================================

  /**
   * Handle delete confirmation
   */
  const handleDelete = async () => {
    await deleteCollection();
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!isDeleting) {
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
            <p>
              Czy na pewno chcesz usunąć kolekcję{" "}
              <span className="font-semibold text-gray-900">&ldquo;{collectionName}&rdquo;</span>?
            </p>
            <p>Wszystkie przepisy zostaną zachowane, ale stracisz tę organizację.</p>
            <p className="font-medium text-gray-900">Tej operacji nie można cofnąć.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Usuwanie...
              </>
            ) : (
              "Usuń kolekcję"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteCollectionDialog;
