import { useState, useEffect } from "react";
import type { BasicInfoFormData, BasicInfoFormErrors, Gender, ActivityLevel } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props for BasicInfoSection component
 */
interface BasicInfoSectionProps {
  /**
   * Initial form data from profile
   */
  initialData: BasicInfoFormData;

  /**
   * Save handler
   */
  onSave: (data: BasicInfoFormData) => Promise<void>;

  /**
   * Whether save is in progress
   */
  isSaving: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Gender options with Polish labels
 */
const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Mężczyzna" },
  { value: "female", label: "Kobieta" },
];

/**
 * Activity level options with Polish labels
 */
const ACTIVITY_LEVEL_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Siedzący tryb życia" },
  { value: "lightly_active", label: "Lekko aktywny" },
  { value: "moderately_active", label: "Umiarkowanie aktywny" },
  { value: "very_active", label: "Bardzo aktywny" },
  { value: "extremely_active", label: "Ekstremalnie aktywny" },
];

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate basic info form data
 */
const validateForm = (data: BasicInfoFormData): BasicInfoFormErrors => {
  const errors: BasicInfoFormErrors = {};

  // Weight validation
  if (data.weight === null) {
    errors.weight = "Waga jest wymagana";
  } else if (isNaN(data.weight)) {
    errors.weight = "Waga musi być liczbą";
  } else if (data.weight < 40 || data.weight > 200) {
    errors.weight = "Waga musi być między 40 a 200 kg";
  }

  // Age validation
  if (data.age === null) {
    errors.age = "Wiek jest wymagany";
  } else if (isNaN(data.age) || !Number.isInteger(data.age)) {
    errors.age = "Wiek musi być liczbą całkowitą";
  } else if (data.age < 13 || data.age > 100) {
    errors.age = "Wiek musi być między 13 a 100 lat";
  }

  // Gender validation
  if (!data.gender) {
    errors.gender = "Płeć jest wymagana";
  } else if (!["male", "female"].includes(data.gender)) {
    errors.gender = "Nieprawidłowa wartość płci";
  }

  // Activity level validation
  if (!data.activityLevel) {
    errors.activityLevel = "Poziom aktywności jest wymagany";
  } else if (
    !["sedentary", "lightly_active", "moderately_active", "very_active", "extremely_active"].includes(
      data.activityLevel
    )
  ) {
    errors.activityLevel = "Nieprawidłowy poziom aktywności";
  }

  return errors;
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Form section for user's basic physical data
 *
 * Features:
 * - Weight, age, gender, activity level fields
 * - Local form state and validation
 * - Error messages in Polish
 * - Save button with loading state
 */
export const BasicInfoSection = ({ initialData, onSave, isSaving }: BasicInfoSectionProps) => {
  // ========================================
  // STATE
  // ========================================

  const [formData, setFormData] = useState<BasicInfoFormData>(initialData);
  const [errors, setErrors] = useState<BasicInfoFormErrors>({});

  // Reset form when initial data changes
  useEffect(() => {
    setFormData(initialData);
    setErrors({});
  }, [initialData]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? null : parseFloat(e.target.value);
    setFormData((prev) => ({ ...prev, weight: value }));
    if (errors.weight) {
      setErrors((prev) => ({ ...prev, weight: undefined }));
    }
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? null : parseInt(e.target.value, 10);
    setFormData((prev) => ({ ...prev, age: value }));
    if (errors.age) {
      setErrors((prev) => ({ ...prev, age: undefined }));
    }
  };

  const handleGenderChange = (value: string) => {
    setFormData((prev) => ({ ...prev, gender: value as Gender }));
    if (errors.gender) {
      setErrors((prev) => ({ ...prev, gender: undefined }));
    }
  };

  const handleActivityLevelChange = (value: string) => {
    setFormData((prev) => ({ ...prev, activityLevel: value as ActivityLevel }));
    if (errors.activityLevel) {
      setErrors((prev) => ({ ...prev, activityLevel: undefined }));
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
        <h2 className="text-xl font-semibold text-gray-900">Dane podstawowe</h2>
        <p className="mt-1 text-sm text-gray-600">
          Te informacje pomagają nam personalizować przepisy zgodnie z Twoimi potrzebami.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Weight */}
        <div className="space-y-2">
          <Label htmlFor="weight">Waga (kg)</Label>
          <Input
            id="weight"
            type="number"
            min={40}
            max={200}
            step={0.1}
            value={formData.weight ?? ""}
            onChange={handleWeightChange}
            disabled={isSaving}
            aria-invalid={!!errors.weight}
            aria-describedby={errors.weight ? "weight-error" : undefined}
          />
          {errors.weight && (
            <p id="weight-error" className="text-sm text-red-600">
              {errors.weight}
            </p>
          )}
        </div>

        {/* Age */}
        <div className="space-y-2">
          <Label htmlFor="age">Wiek</Label>
          <Input
            id="age"
            type="number"
            min={13}
            max={100}
            step={1}
            value={formData.age ?? ""}
            onChange={handleAgeChange}
            disabled={isSaving}
            aria-invalid={!!errors.age}
            aria-describedby={errors.age ? "age-error" : undefined}
          />
          {errors.age && (
            <p id="age-error" className="text-sm text-red-600">
              {errors.age}
            </p>
          )}
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender">Płeć</Label>
          <Select value={formData.gender ?? ""} onValueChange={handleGenderChange} disabled={isSaving}>
            <SelectTrigger
              id="gender"
              aria-invalid={!!errors.gender}
              aria-describedby={errors.gender ? "gender-error" : undefined}
            >
              <SelectValue placeholder="Wybierz płeć" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.gender && (
            <p id="gender-error" className="text-sm text-red-600">
              {errors.gender}
            </p>
          )}
        </div>

        {/* Activity Level */}
        <div className="space-y-2">
          <Label htmlFor="activityLevel">Poziom aktywności</Label>
          <Select value={formData.activityLevel ?? ""} onValueChange={handleActivityLevelChange} disabled={isSaving}>
            <SelectTrigger
              id="activityLevel"
              aria-invalid={!!errors.activityLevel}
              aria-describedby={errors.activityLevel ? "activityLevel-error" : undefined}
            >
              <SelectValue placeholder="Wybierz poziom aktywności" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_LEVEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.activityLevel && (
            <p id="activityLevel-error" className="text-sm text-red-600">
              {errors.activityLevel}
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
