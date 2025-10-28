import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NutritionDTO } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface NutritionStepProps {
  data: NutritionDTO;
  errors: {
    calories?: string;
    protein?: string;
    fat?: string;
    carbs?: string;
    fiber?: string;
    salt?: string;
  };
  onChange: (field: keyof NutritionDTO, value: number) => void;
  onBlur: (field: keyof NutritionDTO) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const NutritionStep = ({ data, errors, onChange, onBlur }: NutritionStepProps) => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Wartości odżywcze</h2>
        <p className="text-sm text-gray-600">Wprowadź wartości odżywcze na jedną porcję</p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-blue-900">Wartości na porcję</p>
          <p className="text-xs text-blue-700">
            Wszystkie wartości odnoszą się do jednej porcji. Jeśli podałeś 4 porcje, wprowadź wartości odżywcze dla 1/4
            całego przepisu.
          </p>
        </div>
      </div>

      {/* Two-column grid for nutrition fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Calories */}
        <div className="space-y-2">
          <Label htmlFor="calories" className="text-sm font-medium text-gray-700">
            Kalorie (kcal) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="calories"
            type="number"
            min="0"
            max="10000"
            step="1"
            placeholder="250"
            value={data.calories || ""}
            onChange={(e) => onChange("calories", parseFloat(e.target.value) || 0)}
            onBlur={() => onBlur("calories")}
            aria-invalid={!!errors.calories}
            aria-describedby={errors.calories ? "calories-error" : undefined}
            className={errors.calories ? "border-red-500" : ""}
          />
          {errors.calories && (
            <p id="calories-error" className="text-xs text-red-600" role="alert">
              {errors.calories}
            </p>
          )}
        </div>

        {/* Protein */}
        <div className="space-y-2">
          <Label htmlFor="protein" className="text-sm font-medium text-gray-700">
            Białko (g) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="protein"
            type="number"
            min="0"
            max="1000"
            step="0.1"
            placeholder="20"
            value={data.protein || ""}
            onChange={(e) => onChange("protein", parseFloat(e.target.value) || 0)}
            onBlur={() => onBlur("protein")}
            aria-invalid={!!errors.protein}
            aria-describedby={errors.protein ? "protein-error" : undefined}
            className={errors.protein ? "border-red-500" : ""}
          />
          {errors.protein && (
            <p id="protein-error" className="text-xs text-red-600" role="alert">
              {errors.protein}
            </p>
          )}
        </div>

        {/* Fat */}
        <div className="space-y-2">
          <Label htmlFor="fat" className="text-sm font-medium text-gray-700">
            Tłuszcz (g) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fat"
            type="number"
            min="0"
            max="1000"
            step="0.1"
            placeholder="10"
            value={data.fat || ""}
            onChange={(e) => onChange("fat", parseFloat(e.target.value) || 0)}
            onBlur={() => onBlur("fat")}
            aria-invalid={!!errors.fat}
            aria-describedby={errors.fat ? "fat-error" : undefined}
            className={errors.fat ? "border-red-500" : ""}
          />
          {errors.fat && (
            <p id="fat-error" className="text-xs text-red-600" role="alert">
              {errors.fat}
            </p>
          )}
        </div>

        {/* Carbs */}
        <div className="space-y-2">
          <Label htmlFor="carbs" className="text-sm font-medium text-gray-700">
            Węglowodany (g) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="carbs"
            type="number"
            min="0"
            max="1000"
            step="0.1"
            placeholder="30"
            value={data.carbs || ""}
            onChange={(e) => onChange("carbs", parseFloat(e.target.value) || 0)}
            onBlur={() => onBlur("carbs")}
            aria-invalid={!!errors.carbs}
            aria-describedby={errors.carbs ? "carbs-error" : undefined}
            className={errors.carbs ? "border-red-500" : ""}
          />
          {errors.carbs && (
            <p id="carbs-error" className="text-xs text-red-600" role="alert">
              {errors.carbs}
            </p>
          )}
        </div>

        {/* Fiber */}
        <div className="space-y-2">
          <Label htmlFor="fiber" className="text-sm font-medium text-gray-700">
            Błonnik (g) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fiber"
            type="number"
            min="0"
            max="1000"
            step="0.1"
            placeholder="5"
            value={data.fiber || ""}
            onChange={(e) => onChange("fiber", parseFloat(e.target.value) || 0)}
            onBlur={() => onBlur("fiber")}
            aria-invalid={!!errors.fiber}
            aria-describedby={errors.fiber ? "fiber-error" : undefined}
            className={errors.fiber ? "border-red-500" : ""}
          />
          {errors.fiber && (
            <p id="fiber-error" className="text-xs text-red-600" role="alert">
              {errors.fiber}
            </p>
          )}
        </div>

        {/* Salt */}
        <div className="space-y-2">
          <Label htmlFor="salt" className="text-sm font-medium text-gray-700">
            Sól (g) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="salt"
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="1.5"
            value={data.salt || ""}
            onChange={(e) => onChange("salt", parseFloat(e.target.value) || 0)}
            onBlur={() => onBlur("salt")}
            aria-invalid={!!errors.salt}
            aria-describedby={errors.salt ? "salt-error" : undefined}
            className={errors.salt ? "border-red-500" : ""}
          />
          {errors.salt && (
            <p id="salt-error" className="text-xs text-red-600" role="alert">
              {errors.salt}
            </p>
          )}
        </div>
      </div>

      {/* Helper Text */}
      <div className="pt-2">
        <p className="text-xs text-gray-500">
          <span className="text-red-500">*</span> Wszystkie pola są wymagane
        </p>
      </div>
    </div>
  );
};

export default NutritionStep;
