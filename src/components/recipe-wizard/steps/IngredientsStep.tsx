import { Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RecipeIngredientDTO, RecipeFormErrors } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface IngredientsStepProps {
  data: RecipeIngredientDTO[];
  errors: {
    ingredients?: string;
    ingredientFields?: {
      name?: string;
      amount?: string;
      unit?: string;
    }[];
  };
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: keyof RecipeIngredientDTO, value: string | number) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const IngredientsStep = ({ data, errors, onAdd, onRemove, onChange }: IngredientsStepProps) => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Składniki</h2>
        <p className="text-sm text-gray-600">Dodaj wszystkie składniki potrzebne do przygotowania przepisu</p>
      </div>

      {/* General Error Message */}
      {errors.ingredients && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600" role="alert">
            {errors.ingredients}
          </p>
        </div>
      )}

      {/* Ingredients List */}
      <div className="space-y-4">
        {data.map((ingredient, index) => {
          const fieldErrors = errors.ingredientFields?.[index];

          return (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              {/* Ingredient Header with Remove Button */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Składnik #{index + 1}</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  disabled={data.length === 1}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  aria-label={`Usuń składnik ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Three-column layout on desktop, stacked on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Ingredient Name */}
                <div className="md:col-span-1 space-y-1">
                  <Label htmlFor={`ingredient-name-${index}`} className="text-xs text-gray-600">
                    Nazwa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`ingredient-name-${index}`}
                    type="text"
                    placeholder="np. Kurczak"
                    value={ingredient.name}
                    onChange={(e) => onChange(index, "name", e.target.value)}
                    aria-invalid={!!fieldErrors?.name}
                    aria-describedby={fieldErrors?.name ? `ingredient-name-error-${index}` : undefined}
                    className={fieldErrors?.name ? "border-red-500" : ""}
                    maxLength={255}
                  />
                  {fieldErrors?.name && (
                    <p id={`ingredient-name-error-${index}`} className="text-xs text-red-600" role="alert">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                {/* Ingredient Amount */}
                <div className="space-y-1">
                  <Label htmlFor={`ingredient-amount-${index}`} className="text-xs text-gray-600">
                    Ilość <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`ingredient-amount-${index}`}
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="250"
                    value={ingredient.amount || ""}
                    onChange={(e) => onChange(index, "amount", parseFloat(e.target.value) || 0)}
                    aria-invalid={!!fieldErrors?.amount}
                    aria-describedby={fieldErrors?.amount ? `ingredient-amount-error-${index}` : undefined}
                    className={fieldErrors?.amount ? "border-red-500" : ""}
                  />
                  {fieldErrors?.amount && (
                    <p id={`ingredient-amount-error-${index}`} className="text-xs text-red-600" role="alert">
                      {fieldErrors.amount}
                    </p>
                  )}
                </div>

                {/* Ingredient Unit */}
                <div className="space-y-1">
                  <Label htmlFor={`ingredient-unit-${index}`} className="text-xs text-gray-600">
                    Jednostka <span className="text-red-500">*</span>
                  </Label>
                  <Select value={ingredient.unit} onValueChange={(value) => onChange(index, "unit", value)}>
                    <SelectTrigger
                      id={`ingredient-unit-${index}`}
                      className={`w-full ${fieldErrors?.unit ? "border-red-500" : ""}`}
                      aria-invalid={!!fieldErrors?.unit}
                      aria-describedby={fieldErrors?.unit ? `ingredient-unit-error-${index}` : undefined}
                    >
                      <SelectValue placeholder="Wybierz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="szt.">szt.</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors?.unit && (
                    <p id={`ingredient-unit-error-${index}`} className="text-xs text-red-600" role="alert">
                      {fieldErrors.unit}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Ingredient Button */}
      <Button
        type="button"
        variant="outline"
        onClick={onAdd}
        className="w-full border-dashed border-2 hover:border-green-600 hover:bg-green-50"
      >
        <Plus className="h-4 w-4 mr-2" />
        Dodaj składnik
      </Button>

      {/* Helper Text */}
      <div className="pt-2">
        <p className="text-xs text-gray-500">
          <span className="text-red-500">*</span> Wszystkie pola są wymagane. Wymagany jest co najmniej jeden składnik.
        </p>
      </div>
    </div>
  );
};

export default IngredientsStep;
