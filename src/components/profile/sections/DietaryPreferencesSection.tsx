import { useState, useEffect } from "react";
import type { DietaryPreferencesFormData, DietaryPreferencesFormErrors, DietType, TargetGoal } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props for DietaryPreferencesSection component
 */
interface DietaryPreferencesSectionProps {
  /**
   * Initial form data from profile
   */
  initialData: DietaryPreferencesFormData;

  /**
   * Save handler
   */
  onSave: (data: DietaryPreferencesFormData) => Promise<void>;

  /**
   * Whether save is in progress
   */
  isSaving: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Diet type options with Polish labels
 */
const DIET_TYPE_OPTIONS: { value: DietType; label: string }[] = [
  { value: "balanced", label: "Zbilansowana" },
  { value: "high_protein", label: "Wysokobiałkowa" },
  { value: "keto", label: "Ketogeniczna" },
  { value: "vegetarian", label: "Wegetariańska" },
  { value: "weight_loss", label: "Odchudzająca" },
  { value: "weight_gain", label: "Na masę" },
];

/**
 * Target goal options with Polish labels
 */
const TARGET_GOAL_OPTIONS: { value: TargetGoal; label: string }[] = [
  { value: "lose_weight", label: "Schudnąć" },
  { value: "gain_weight", label: "Przytyć" },
  { value: "maintain_weight", label: "Utrzymać wagę" },
];

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate dietary preferences form data
 */
const validateForm = (data: DietaryPreferencesFormData): DietaryPreferencesFormErrors => {
  const errors: DietaryPreferencesFormErrors = {};

  // Diet type validation
  if (!data.dietType) {
    errors.dietType = "Typ diety jest wymagany";
  } else if (
    !["high_protein", "keto", "vegetarian", "weight_gain", "weight_loss", "balanced"].includes(data.dietType)
  ) {
    errors.dietType = "Nieprawidłowy typ diety";
  }

  // Target goal validation
  if (!data.targetGoal) {
    errors.targetGoal = "Cel jest wymagany";
  } else if (!["lose_weight", "gain_weight", "maintain_weight"].includes(data.targetGoal)) {
    errors.targetGoal = "Nieprawidłowy cel";
  }

  // Target value validation (optional)
  if (data.targetValue !== null) {
    if (isNaN(data.targetValue)) {
      errors.targetValue = "Wartość docelowa musi być liczbą";
    } else if (data.targetValue < 0.1 || data.targetValue > 100) {
      errors.targetValue = "Wartość docelowa musi być między 0.1 a 100";
    }
  }

  return errors;
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Form section for user's dietary preferences
 *
 * Features:
 * - Diet type, target goal, target value fields
 * - Local form state and validation
 * - Error messages in Polish
 * - Save button with loading state
 */
export const DietaryPreferencesSection = ({ initialData, onSave, isSaving }: DietaryPreferencesSectionProps) => {
  // ========================================
  // STATE
  // ========================================

  const [formData, setFormData] = useState<DietaryPreferencesFormData>(initialData);
  const [errors, setErrors] = useState<DietaryPreferencesFormErrors>({});

  // Reset form when initial data changes
  useEffect(() => {
    setFormData(initialData);
    setErrors({});
  }, [initialData]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleDietTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, dietType: value as DietType }));
    if (errors.dietType) {
      setErrors((prev) => ({ ...prev, dietType: undefined }));
    }
  };

  const handleTargetGoalChange = (value: string) => {
    setFormData((prev) => ({ ...prev, targetGoal: value as TargetGoal }));
    if (errors.targetGoal) {
      setErrors((prev) => ({ ...prev, targetGoal: undefined }));
    }
  };

  const handleTargetValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? null : parseFloat(e.target.value);
    setFormData((prev) => ({ ...prev, targetValue: value }));
    if (errors.targetValue) {
      setErrors((prev) => ({ ...prev, targetValue: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Save data
    try {
      await onSave(formData);
    } catch {
      // Error is handled by the hook with toast
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Preferencje żywieniowe</h2>
        <p className="mt-1 text-sm text-gray-600">
          Określ swoje preferencje żywieniowe, aby AI mogło lepiej dostosować przepisy.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Diet Type */}
        <div className="space-y-2">
          <Label htmlFor="dietType">Typ diety</Label>
          <Select value={formData.dietType ?? ""} onValueChange={handleDietTypeChange} disabled={isSaving}>
            <SelectTrigger
              id="dietType"
              aria-invalid={!!errors.dietType}
              aria-describedby={errors.dietType ? "dietType-error" : undefined}
            >
              <SelectValue placeholder="Wybierz typ diety" />
            </SelectTrigger>
            <SelectContent>
              {DIET_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.dietType && (
            <p id="dietType-error" className="text-sm text-red-600">
              {errors.dietType}
            </p>
          )}
        </div>

        {/* Target Goal */}
        <div className="space-y-2">
          <Label htmlFor="targetGoal">Cel</Label>
          <Select value={formData.targetGoal ?? ""} onValueChange={handleTargetGoalChange} disabled={isSaving}>
            <SelectTrigger
              id="targetGoal"
              aria-invalid={!!errors.targetGoal}
              aria-describedby={errors.targetGoal ? "targetGoal-error" : undefined}
            >
              <SelectValue placeholder="Wybierz cel" />
            </SelectTrigger>
            <SelectContent>
              {TARGET_GOAL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.targetGoal && (
            <p id="targetGoal-error" className="text-sm text-red-600">
              {errors.targetGoal}
            </p>
          )}
        </div>

        {/* Target Value */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="targetValue">Docelowa waga (kg) - opcjonalnie</Label>
          <Input
            id="targetValue"
            type="number"
            min={0.1}
            max={100}
            step={0.1}
            value={formData.targetValue ?? ""}
            onChange={handleTargetValueChange}
            disabled={isSaving}
            placeholder="Wprowadź docelową wagę"
            aria-invalid={!!errors.targetValue}
            aria-describedby={errors.targetValue ? "targetValue-error" : undefined}
          />
          {errors.targetValue && (
            <p id="targetValue-error" className="text-sm text-red-600">
              {errors.targetValue}
            </p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Zapisywanie...
            </>
          ) : (
            "Zapisz"
          )}
        </Button>
      </div>
    </form>
  );
};
