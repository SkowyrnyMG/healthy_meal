import { useMemo } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import NutritionPieChart from "./NutritionPieChart";
import type { NutritionCardProps } from "@/components/recipes/types";

/**
 * NutritionCard component displays comprehensive nutrition information
 * Includes calories, pie chart, and detailed macronutrient breakdown
 */
const NutritionCard = ({ nutrition }: NutritionCardProps) => {
  /**
   * Calculate total macros and percentages
   */
  const macroStats = useMemo(() => {
    const totalMacros = nutrition.protein + nutrition.fat + nutrition.carbs;

    const proteinPercent = totalMacros > 0 ? ((nutrition.protein / totalMacros) * 100).toFixed(1) : "0";
    const fatPercent = totalMacros > 0 ? ((nutrition.fat / totalMacros) * 100).toFixed(1) : "0";
    const carbsPercent = totalMacros > 0 ? ((nutrition.carbs / totalMacros) * 100).toFixed(1) : "0";

    return {
      totalMacros,
      proteinPercent,
      fatPercent,
      carbsPercent,
    };
  }, [nutrition]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Wartości odżywcze</CardTitle>
        <p className="text-sm text-gray-600">Na porcję</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Total Calories - Prominent Display */}
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-4xl font-bold text-green-600">{nutrition.calories}</div>
          <div className="text-sm text-gray-600 mt-1">kcal</div>
        </div>

        {/* Pie Chart */}
        <div className="py-2">
          <NutritionPieChart protein={nutrition.protein} fat={nutrition.fat} carbs={nutrition.carbs} />
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Makroskładniki</h3>

          <ul className="space-y-2">
            {/* Protein */}
            <li className="flex items-center justify-between p-2 rounded bg-gray-50">
              <span className="text-sm text-gray-700">Białko</span>
              <span className="text-sm font-medium text-gray-900">
                {nutrition.protein}g ({macroStats.proteinPercent}%)
              </span>
            </li>

            {/* Fat */}
            <li className="flex items-center justify-between p-2 rounded bg-gray-50">
              <span className="text-sm text-gray-700">Tłuszcze</span>
              <span className="text-sm font-medium text-gray-900">
                {nutrition.fat}g ({macroStats.fatPercent}%)
              </span>
            </li>

            {/* Carbs */}
            <li className="flex items-center justify-between p-2 rounded bg-gray-50">
              <span className="text-sm text-gray-700">Węglowodany</span>
              <span className="text-sm font-medium text-gray-900">
                {nutrition.carbs}g ({macroStats.carbsPercent}%)
              </span>
            </li>

            {/* Fiber */}
            <li className="flex items-center justify-between p-2 rounded bg-gray-50">
              <span className="text-sm text-gray-700">Błonnik</span>
              <span className="text-sm font-medium text-gray-900">{nutrition.fiber}g</span>
            </li>

            {/* Salt */}
            <li className="flex items-center justify-between p-2 rounded bg-gray-50">
              <span className="text-sm text-gray-700">Sól</span>
              <span className="text-sm font-medium text-gray-900">{nutrition.salt}g</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default NutritionCard;
