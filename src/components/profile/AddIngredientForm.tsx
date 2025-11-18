import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props for AddIngredientForm component
 */
interface AddIngredientFormProps {
  /**
   * Add handler
   */
  onAdd: (name: string) => Promise<void>;

  /**
   * Whether add is in progress
   */
  isAdding: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Inline form for adding new disliked ingredients
 *
 * Features:
 * - Text input with validation (1-100 chars)
 * - Add button with loading state
 * - Submit on Enter key
 * - Clears input on successful add
 */
export const AddIngredientForm = ({ onAdd, isAdding }: AddIngredientFormProps) => {
  // ========================================
  // STATE
  // ========================================

  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // ========================================
  // HANDLERS
  // ========================================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedValue = inputValue.trim();

    // Validate
    if (!trimmedValue) {
      setError("Nazwa składnika jest wymagana");
      return;
    }

    if (trimmedValue.length > 100) {
      setError("Nazwa składnika nie może przekraczać 100 znaków");
      return;
    }

    // Add ingredient
    try {
      await onAdd(trimmedValue);
      setInputValue("");
      setError(null);
    } catch {
      // Error is handled by the hook with toast
      // Keep input value for retry
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Wpisz nazwę składnika..."
            disabled={isAdding}
            maxLength={100}
            aria-invalid={!!error}
            aria-describedby={error ? "add-ingredient-error" : undefined}
          />
        </div>
        <Button type="submit" disabled={isAdding || !inputValue.trim()} className="bg-green-600 hover:bg-green-700">
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="mr-1 h-4 w-4" />
              Dodaj
            </>
          )}
        </Button>
      </div>
      {error && (
        <p id="add-ingredient-error" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
};
