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
import type { CreateCollectionDialogProps } from "../types";
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
 * CreateCollectionDialog component - Modal for creating new collection
 *
 * Features:
 * - Input field with validation
 * - Character counter (0/100)
 * - Client-side validation
 * - API integration with error handling
 * - Loading states
 * - Toast notifications
 *
 * Validation rules:
 * - Required field
 * - Min length: 1 (after trim)
 * - Max length: 100
 * - Uniqueness (server-side, 409 conflict)
 *
 * @example
 * ```tsx
 * <CreateCollectionDialog
 *   open={dialogState.create}
 *   onOpenChange={(open) => setDialogState({ ...state, create: open })}
 *   onSuccess={(collection) => addCollectionToState(collection)}
 * />
 * ```
 */
const CreateCollectionDialog = ({ open, onOpenChange, onSuccess }: CreateCollectionDialogProps) => {
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

    // Client-side validation
    const nameError = validateName(formData.name);
    if (nameError) {
      setFormErrors({ name: nameError });
      return;
    }

    setIsLoading(true);

    try {
      // Call API to create collection
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: formData.name.trim() }),
      });

      // Handle API errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 409) {
          // Duplicate name conflict
          setFormErrors({ name: "Kolekcja o tej nazwie już istnieje" });
          return;
        }

        // Generic error
        throw new Error(errorData.message || "Nie udało się utworzyć kolekcji");
      }

      // Parse success response
      const { collection } = await response.json();

      // Show success toast
      toast.success("Kolekcja została utworzona");

      // Call success callback
      onSuccess(collection);

      // Close dialog
      onOpenChange(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[CreateCollectionDialog] Error creating collection:", error);

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
            <DialogTitle>Nowa kolekcja</DialogTitle>
            <DialogDescription>Podaj nazwę dla nowej kolekcji przepisów.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              {/* Label */}
              <Label htmlFor="collection-name">Nazwa kolekcji</Label>

              {/* Input */}
              <Input
                id="collection-name"
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
                  Tworzenie...
                </>
              ) : (
                "Utwórz"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCollectionDialog;
