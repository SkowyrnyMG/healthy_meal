import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEditCollectionName } from "@/components/hooks/useEditCollectionName";

// ============================================================================
// TYPES
// ============================================================================

interface EditCollectionNameDialogProps {
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
   * Current collection name
   */
  currentName: string;

  /**
   * Callback when name is successfully updated
   */
  onNameUpdated: (newName: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * EditCollectionNameDialog - Dialog for editing collection name
 *
 * Features:
 * - Dialog with controlled input
 * - Real-time validation (1-100 characters)
 * - Integration with useEditCollectionName hook
 * - Loading state during submission
 * - Error display below input
 * - Auto-focus on input when opened
 * - Pre-filled with current name
 * - Submit on Enter key
 *
 * Validation:
 * - Required (length > 0 after trim)
 * - Max 100 characters
 * - Unique per user (validated by API, shows 409 conflict error)
 *
 * @example
 * ```tsx
 * <EditCollectionNameDialog
 *   open={editDialogOpen}
 *   onOpenChange={setEditDialogOpen}
 *   collectionId="uuid"
 *   currentName="Szybkie kolacje"
 *   onNameUpdated={(newName) => setCollectionName(newName)}
 * />
 * ```
 */
const EditCollectionNameDialog = ({
  open,
  onOpenChange,
  collectionId,
  currentName,
  onNameUpdated,
}: EditCollectionNameDialogProps) => {
  // ========================================
  // STATE
  // ========================================

  // Form input state
  const [name, setName] = useState(currentName);

  // Hook for updating collection name
  const { updateName, isUpdating, error, clearError } = useEditCollectionName({
    collectionId,
    onNameUpdated: (newName) => {
      // Call parent callback
      onNameUpdated(newName);
      // Close dialog
      onOpenChange(false);
    },
  });

  // ========================================
  // EFFECTS
  // ========================================

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName(currentName);
      clearError();
    }
  }, [open, currentName, clearError]);

  // ========================================
  // HANDLERS
  // ========================================

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateName(name);
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    // Clear error when user types
    if (error) {
      clearError();
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!isUpdating) {
      onOpenChange(false);
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edytuj nazwę kolekcji</DialogTitle>
          <DialogDescription>Zmień nazwę kolekcji na nową. Nazwa musi być unikalna.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="collection-name">Nazwa kolekcji</Label>
              <Input
                id="collection-name"
                type="text"
                value={name}
                onChange={handleInputChange}
                placeholder={currentName}
                disabled={isUpdating}
                maxLength={100}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {/* Character count */}
              <p className="text-xs text-gray-500">{name.trim().length}/100 znaków</p>

              {/* Error message */}
              {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isUpdating}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isUpdating || name.trim().length === 0}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                "Zapisz"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCollectionNameDialog;
