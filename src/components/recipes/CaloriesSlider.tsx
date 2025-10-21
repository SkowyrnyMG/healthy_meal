import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useDebounce } from "@/components/hooks/useDebounce";

// ============================================================================
// TYPES
// ============================================================================

interface CaloriesSliderProps {
  /**
   * Current max calories value
   */
  value: number | undefined;

  /**
   * Callback when value changes
   */
  onChange: (value: number | undefined) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_CALORIES = 0;
const MAX_CALORIES = 2000; // Practical max for slider (API supports up to 10000)
const DEFAULT_CALORIES = 1000;

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * CaloriesSlider component for filtering by maximum calories per serving
 *
 * Features:
 * - Range slider (0-2000 kcal for better UX, API supports up to 10000)
 * - Current value display
 * - Reset button to clear filter
 * - Integer values only
 * - Debounced API calls (300ms delay after user stops moving slider)
 *
 * @example
 * ```tsx
 * <CaloriesSlider
 *   value={filters.maxCalories}
 *   onChange={setMaxCalories}
 * />
 * ```
 */
const CaloriesSlider = ({ value, onChange }: CaloriesSliderProps) => {
  // Local state for immediate slider feedback
  const [localValue, setLocalValue] = useState<number>(value !== undefined ? value : DEFAULT_CALORIES);

  // Sync local state with prop changes (e.g., from reset or URL)
  useEffect(() => {
    setLocalValue(value !== undefined ? value : DEFAULT_CALORIES);
  }, [value]);

  // Create debounced onChange callback (300ms delay)
  const debouncedOnChange = useDebounce((newValue: number | undefined) => {
    onChange(newValue);
  }, 300);

  // Handle slider change (updates local state immediately, triggers debounced API call)
  const handleChange = (values: number[]) => {
    const newValue = values[0];
    setLocalValue(newValue);
    // Only set if different from default to avoid unnecessary filters
    debouncedOnChange(newValue !== DEFAULT_CALORIES ? newValue : undefined);
  };

  // Handle reset (immediate, no debounce)
  const handleReset = () => {
    setLocalValue(DEFAULT_CALORIES);
    onChange(undefined);
  };

  return (
    <div className="space-y-3">
      {/* Label and Value Display */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">Maksymalna kaloryczność</span>
        {value !== undefined && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-6 w-6"
            aria-label="Wyczyść filtr kaloryczności"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Current Value */}
      <div className="text-center text-sm text-gray-600">
        {localValue !== DEFAULT_CALORIES ? `do ${localValue} kcal` : "nie wybrano"}
      </div>

      {/* Slider */}
      <Slider
        min={MIN_CALORIES}
        max={MAX_CALORIES}
        step={50}
        value={[localValue]}
        onValueChange={handleChange}
        className="w-full"
        aria-label="Maksymalna kaloryczność na porcję"
      />

      {/* Min/Max Labels */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>{MIN_CALORIES} kcal</span>
        <span>{MAX_CALORIES}+ kcal</span>
      </div>
    </div>
  );
};

export default CaloriesSlider;
