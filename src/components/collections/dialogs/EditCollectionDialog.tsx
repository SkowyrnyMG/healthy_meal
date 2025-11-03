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
import { toast } from "sonner";
import type { EditCollectionDialogProps } from "../types";
import type { CollectionFormData, CollectionFormErrors } from "../types";

/**
 * Validate collection name
 * @param name - Collection name to validate
 * @returns Error message or undefined if valid
 */
const validateName = (name: string): string | undefined => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return "Nazwa kolekcji jest wymagana";
  }

  if (trimmedName.length < 1) {
    return "Nazwa kolekcji nie może być pusta";
  }

  if (name.length > 100) {
    return "Nazwa kolekcji może mieć maksymalnie 100 znaków";
  }

  return undefined;
};

/**
 * EditCollectionDialog component - Modal for editing collection name
 *
 * Features:
 * - Pre-populated input with current name
 * - Character counter (0/100)
 * - Client-side validation
 * - Skip API call if name unchanged
 * - API integration with error handling
 * - Loading states
 * - Toast notifications
 *
 * Validation rules:
 * - Required field
 * - Min length: 1 (after trim)
 * - Max length: 100
 * - Uniqueness (server-side, 409 conflict, excluding current collection)
 *
 * @example
 * ```tsx
 * <EditCollectionDialog
 *   open={dialogState.edit.open}
 *   collection={dialogState.edit.collection}
 *   onOpenChange={(open) => setDialogState({ ...state, edit: { ...state.edit, open } })}
 *   onSuccess={(updated) => updateCollectionInState(updated)}
 * />
 * ```
 */
const EditCollectionDialog = ({ open, collection, onOpenChange, onSuccess }: EditCollectionDialogProps) => {
  // ========================================
  // STATE
  // ========================================

  const [formData, setFormData] = useState<CollectionFormData>({ name: "" });
  const [formErrors, setFormErrors] = useState<CollectionFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // ========================================
  // EFFECTS
  // ========================================

  /**
   * Pre-populate form when collection changes
   */
  useEffect(() => {
    if (collection && open) {
      setFormData({ name: collection.name });
      setFormErrors({});
    }
  }, [collection, open]);

  /**
   * Reset form when dialog closes
   */
  useEffect(() => {
    if (!open) {
      setFormData({ name: "" });
      setFormErrors({});
      setIsLoading(false);
    }
  }, [open]);

  // ========================================
  // HANDLERS
  // ========================================

  /**
   * Handle name input change
   * Clears errors when user starts typing
   */
  const handleNameChange = (value: string) => {
    setFormData({ name: value });
    if (formErrors.name) {
      setFormErrors({});
    }
  };

  /**
   * Handle form submission
   * Validates input and calls API
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!collection) return;

    // Check if name unchanged - skip API call
    const trimmedName = formData.name.trim();
    if (trimmedName === collection.name) {
      onOpenChange(false);
      return;
    }

    // Client-side validation
    const nameError = validateName(formData.name);
    if (nameError) {
      setFormErrors({ name: nameError });
      return;
    }

    setIsLoading(true);

    try {
      // Call API to update collection
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      // Handle API errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 409) {
          // Duplicate name conflict
          setFormErrors({ name: "Kolekcja o tej nazwie już istnieje" });
          return;
        }

        if (response.status === 404) {
          // Collection not found
          toast.error("Kolekcja nie została znaleziona");
          onOpenChange(false);
          return;
        }

        // Generic error
        throw new Error(errorData.message || "Nie udało się zaktualizować kolekcji");
      }

      // Parse success response
      const { collection: updatedCollection } = await response.json();

      // Show success toast
      toast.success("Kolekcja została zaktualizowana");

      // Call success callback
      onSuccess(updatedCollection);

      // Close dialog
      onOpenChange(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[EditCollectionDialog] Error updating collection:", error);

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

  const charCount = formData.name.length;
  const charCountColor = charCount > 90 ? (charCount > 100 ? "text-red-600" : "text-amber-600") : "text-gray-500";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edytuj kolekcję</DialogTitle>
            <DialogDescription>Zmień nazwę kolekcji.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              {/* Label */}
              <Label htmlFor="collection-name-edit">Nazwa kolekcji</Label>

              {/* Input */}
              <Input
                id="collection-name-edit"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="np. Szybkie kolacje"
                maxLength={100}
                disabled={isLoading}
                className={formErrors.name ? "border-red-500" : ""}
              />

              {/* Character counter */}
              <div className="flex items-center justify-between">
                {/* Error message */}
                {formErrors.name && <p className="text-sm text-red-600">{formErrors.name}</p>}
                {!formErrors.name && <div />}

                {/* Character count */}
                <p className={`text-sm ${charCountColor}`}>{charCount}/100</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
              {isLoading ? (
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

export default EditCollectionDialog;
