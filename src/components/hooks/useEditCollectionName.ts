import { useState, useCallback } from "react";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for initializing the useEditCollectionName hook
 */
export interface UseEditCollectionNameOptions {
  /**
   * Collection UUID
   */
  collectionId: string;

  /**
   * Callback when name is successfully updated
   * Receives the new name
   */
  onNameUpdated: (newName: string) => void;
}

/**
 * Return type for the useEditCollectionName hook
 */
export interface UseEditCollectionNameReturn {
  /**
   * Update the collection name
   * Validates input and calls API
   */
  updateName: (newName: string) => Promise<void>;

  /**
   * Whether the update is in progress
   */
  isUpdating: boolean;

  /**
   * Validation or API error message
   */
  error: string | null;

  /**
   * Clear the error message
   */
  clearError: () => void;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate collection name
 * @param name - Name to validate
 * @returns Error message or null if valid
 */
function validateName(name: string): string | null {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return "Nazwa jest wymagana";
  }

  if (trimmed.length > 100) {
    return "Nazwa musi mieć maksymalnie 100 znaków";
  }

  return null;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for updating collection name with validation
 *
 * This hook provides:
 * - Client-side validation (1-100 characters)
 * - API integration for name update
 * - Error state management
 * - Success toast notification
 * - Automatic callback after success
 *
 * @example
 * ```tsx
 * const { updateName, isUpdating, error, clearError } = useEditCollectionName({
 *   collectionId: 'collection-uuid',
 *   onNameUpdated: (newName) => setCollectionName(newName)
 * });
 *
 * // In form submit handler
 * await updateName('New Collection Name');
 * ```
 */
export const useEditCollectionName = (options: UseEditCollectionNameOptions): UseEditCollectionNameReturn => {
  const { collectionId, onNameUpdated } = options;

  // State for loading
  const [isUpdating, setIsUpdating] = useState(false);

  // State for errors
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Update collection name
   */
  const updateName = useCallback(
    async (newName: string): Promise<void> => {
      // Clear previous errors
      setError(null);

      // Validate name
      const trimmedName = newName.trim();
      const validationError = validateName(trimmedName);

      if (validationError) {
        setError(validationError);
        return;
      }

      // Set loading state
      setIsUpdating(true);

      try {
        // PUT /api/collections/{collectionId}
        const response = await fetch(`/api/collections/${collectionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ name: trimmedName }),
        });

        // Handle error responses
        if (!response.ok) {
          if (response.status === 409) {
            // Name conflict
            setError("Kolekcja o tej nazwie już istnieje");
            return;
          }

          if (response.status === 400) {
            // Validation error from API
            const errorData = await response.json().catch(() => ({}));
            setError(errorData.message || "Nieprawidłowe dane");
            return;
          }

          if (response.status === 404) {
            // Collection not found
            toast.error("Kolekcja nie została znaleziona");
            window.location.href = "/collections";
            return;
          }

          if (response.status === 403) {
            // Unauthorized
            toast.error("Nie masz dostępu do tej kolekcji");
            window.location.href = "/collections";
            return;
          }

          // Generic error
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Nie udało się zaktualizować nazwy kolekcji");
        }

        // Success - show toast
        toast.success("Nazwa kolekcji została zaktualizowana");

        // Call success callback
        onNameUpdated(trimmedName);
      } catch (err) {
        // Log error
        // eslint-disable-next-line no-console
        console.error("[useEditCollectionName] Update error:", {
          collectionId,
          newName: trimmedName,
          error: err instanceof Error ? err.message : "Unknown error",
        });

        // Set error message
        const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
        setError(errorMessage);
      } finally {
        setIsUpdating(false);
      }
    },
    [collectionId, onNameUpdated]
  );

  return {
    updateName,
    isUpdating,
    error,
    clearError,
  };
};
