import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ServingsAdjusterProps } from "@/components/recipes/types";

/**
 * ServingsAdjuster component allows users to adjust recipe servings
 * Includes proper Polish pluralization for "porcja/porcje/porcji"
 */
const ServingsAdjuster = ({ currentServings, minServings, maxServings, onServingsChange }: ServingsAdjusterProps) => {
  /**
   * Get proper Polish plural form for "porcja"
   * @param count - Number of servings
   * @returns Correct Polish plural form
   */
  const getServingsLabel = (count: number): string => {
    if (count === 1) return "porcja";
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
      return "porcje";
    }
    return "porcji";
  };

  const isMinReached = currentServings <= minServings;
  const isMaxReached = currentServings >= maxServings;

  return (
    <div className="flex items-center gap-4 py-4">
      <span className="text-sm font-medium text-gray-700">Porcje:</span>

      <div className="flex items-center gap-3">
        {/* Decrement Button */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onServingsChange(-1)}
          disabled={isMinReached}
          aria-label="Zmniejsz liczbę porcji"
        >
          <Minus className="h-4 w-4" />
        </Button>

        {/* Current Servings Display */}
        <span className="min-w-[120px] text-center text-base font-medium text-gray-900">
          {currentServings} {getServingsLabel(currentServings)}
        </span>

        {/* Increment Button */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onServingsChange(1)}
          disabled={isMaxReached}
          aria-label="Zwiększ liczbę porcji"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ServingsAdjuster;
