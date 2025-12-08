import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { RecipeFormData } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface BasicInfoStepProps {
  data: {
    title: string;
    description?: string;
    servings: number;
    prepTimeMinutes?: number;
    isPublic: boolean;
  };
  errors: {
    title?: string;
    description?: string;
    servings?: string;
    prepTimeMinutes?: string;
  };
  onChange: (field: keyof RecipeFormData, value: string | number | boolean) => void;
  onBlur: (field: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const BasicInfoStep = ({ data, errors, onChange, onBlur }: BasicInfoStepProps) => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Podstawowe informacje</h2>
        <p className="text-sm text-gray-600">Wprowadź podstawowe dane o przepisie</p>
      </div>

      {/* Title Field */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium text-gray-700">
          Tytuł przepisu <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          type="text"
          placeholder="np. Sałatka grecka z kurczakiem"
          value={data.title}
          onChange={(e) => onChange("title", e.target.value)}
          onBlur={() => onBlur("title")}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
          className={errors.title ? "border-red-500" : ""}
          maxLength={255}
        />
        <div className="flex items-center justify-between">
          {errors.title && (
            <p id="title-error" className="text-sm text-red-600" role="alert">
              {errors.title}
            </p>
          )}
          <p className="text-xs text-gray-500 ml-auto">{data.title.length}/255</p>
        </div>
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium text-gray-700">
          Opis (opcjonalnie)
        </Label>
        <Textarea
          id="description"
          placeholder="Krótki opis przepisu, np. dlaczego jest zdrowy, do czego pasuje..."
          value={data.description || ""}
          onChange={(e) => onChange("description", e.target.value)}
          onBlur={() => onBlur("description")}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "description-error" : undefined}
          className={errors.description ? "border-red-500" : ""}
          rows={4}
          maxLength={5000}
        />
        {errors.description && (
          <p id="description-error" className="text-sm text-red-600" role="alert">
            {errors.description}
          </p>
        )}
        {data.description && <p className="text-xs text-gray-500">{data.description.length}/5000</p>}
      </div>

      {/* Two-column layout for servings and prep time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Servings Field */}
        <div className="space-y-2">
          <Label htmlFor="servings" className="text-sm font-medium text-gray-700">
            Liczba porcji <span className="text-red-500">*</span>
          </Label>
          <Input
            id="servings"
            type="number"
            min="1"
            placeholder="1"
            value={data.servings || ""}
            onChange={(e) => onChange("servings", parseInt(e.target.value) || 0)}
            onBlur={() => onBlur("servings")}
            aria-invalid={!!errors.servings}
            aria-describedby={errors.servings ? "servings-error" : undefined}
            className={errors.servings ? "border-red-500" : ""}
          />
          {errors.servings && (
            <p id="servings-error" className="text-sm text-red-600" role="alert">
              {errors.servings}
            </p>
          )}
        </div>

        {/* Prep Time Field */}
        <div className="space-y-2">
          <Label htmlFor="prepTimeMinutes" className="text-sm font-medium text-gray-700">
            Czas przygotowania (minuty)
          </Label>
          <Input
            id="prepTimeMinutes"
            type="number"
            min="1"
            max="1440"
            placeholder="30"
            value={data.prepTimeMinutes || ""}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              onChange("prepTimeMinutes", isNaN(value) ? 0 : value);
            }}
            onBlur={() => onBlur("prepTimeMinutes")}
            aria-invalid={!!errors.prepTimeMinutes}
            aria-describedby={errors.prepTimeMinutes ? "prepTimeMinutes-error" : undefined}
            className={errors.prepTimeMinutes ? "border-red-500" : ""}
          />
          {errors.prepTimeMinutes && (
            <p id="prepTimeMinutes-error" className="text-sm text-red-600" role="alert">
              {errors.prepTimeMinutes}
            </p>
          )}
          <p className="text-xs text-gray-500">Maksymalnie 1440 minut (24 godziny)</p>
        </div>
      </div>

      {/* Is Public Checkbox */}
      <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <Checkbox
          id="isPublic"
          checked={data.isPublic}
          onCheckedChange={(checked) => onChange("isPublic", checked as boolean)}
          aria-describedby="isPublic-description"
        />
        <div className="space-y-1">
          <Label htmlFor="isPublic" className="text-sm font-medium text-gray-700 cursor-pointer">
            Przepis publiczny
          </Label>
          <p id="isPublic-description" className="text-xs text-gray-600">
            Jeśli zaznaczone, przepis będzie widoczny dla wszystkich użytkowników. W przeciwnym razie tylko Ty będziesz
            mógł go zobaczyć.
          </p>
        </div>
      </div>

      {/* Required fields note */}
      <div className="pt-2">
        <p className="text-xs text-gray-500">
          <span className="text-red-500">*</span> Pola wymagane
        </p>
      </div>
    </div>
  );
};

export default BasicInfoStep;
