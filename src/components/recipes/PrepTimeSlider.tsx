import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useDebounce } from "@/components/hooks/useDebounce";

// ============================================================================
// TYPES
// ============================================================================

interface PrepTimeSliderProps {
  /**
   * Current max prep time value (in minutes)
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

const MIN_PREP_TIME = 0;
const MAX_PREP_TIME = 180; // 3 hours (API supports up to 1440 - 24 hours)
const DEFAULT_PREP_TIME = 60;

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * PrepTimeSlider component for filtering by maximum preparation time
 *
 * Features:
 * - Range slider (0-180 minutes for better UX, API supports up to 1440)
 * - Current value display in minutes
 * - Reset button to clear filter
 * - Integer values only
 * - Debounced API calls (300ms delay after user stops moving slider)
 *
 * @example
 * ```tsx
 * <PrepTimeSlider
 *   value={filters.maxPrepTime}
 *   onChange={setMaxPrepTime}
 * />
 * ```
 */
const PrepTimeSlider = ({ value, onChange }: PrepTimeSliderProps) => {
  // Local state for immediate slider feedback
  const [localValue, setLocalValue] = useState<number>(value !== undefined ? value : DEFAULT_PREP_TIME);

  // Sync local state with prop changes (e.g., from reset or URL)
  useEffect(() => {
    setLocalValue(value !== undefined ? value : DEFAULT_PREP_TIME);
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
    debouncedOnChange(newValue !== DEFAULT_PREP_TIME ? newValue : undefined);
  };

  // Handle reset (immediate, no debounce)
  const handleReset = () => {
    setLocalValue(DEFAULT_PREP_TIME);
    onChange(undefined);
  };

  return (
    <div className="space-y-3">
      {/* Label and Value Display */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">Maksymalny czas przygotowania</span>
        {value !== undefined && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-6 w-6"
            aria-label="Wyczyść filtr czasu przygotowania"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Current Value */}
      <div className="text-center text-sm text-gray-600">
        {localValue !== DEFAULT_PREP_TIME ? `do ${localValue} min` : "nie wybrano"}
      </div>

      {/* Slider */}
      <Slider
        min={MIN_PREP_TIME}
        max={MAX_PREP_TIME}
        step={5}
        value={[localValue]}
        onValueChange={handleChange}
        className="w-full"
        aria-label="Maksymalny czas przygotowania w minutach"
      />

      {/* Min/Max Labels */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>{MIN_PREP_TIME} min</span>
        <span>{MAX_PREP_TIME}+ min</span>
      </div>
    </div>
  );
};

export default PrepTimeSlider;
