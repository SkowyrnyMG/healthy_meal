import type { IngredientsListProps } from "@/components/recipes/types";

/**
 * IngredientsList component displays recipe ingredients with adjusted amounts
 * Uses responsive grid layout (1 column mobile, 2 columns desktop)
 */
const IngredientsList = ({ ingredients }: IngredientsListProps) => {
  /**
   * Format ingredient amount to avoid excessive decimals
   * @param amount - Ingredient amount
   * @returns Formatted amount string
   */
  const formatAmount = (amount: number): string => {
    // If whole number, show without decimals
    if (Number.isInteger(amount)) {
      return amount.toString();
    }

    // If less than 0.01, show as "~0"
    if (amount < 0.01) {
      return "~0";
    }

    // Round to 1 decimal for numbers >= 10
    if (amount >= 10) {
      return amount.toFixed(1);
    }

    // Round to 2 decimals for smaller numbers
    return amount.toFixed(2);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Składniki</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ingredients.map((ingredient, index) => (
          <div
            key={index}
            className="flex items-baseline gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="font-medium text-gray-900">
              {formatAmount(ingredient.amount)} {ingredient.unit}
            </span>
            <span className="text-gray-700">{ingredient.name}</span>
          </div>
        ))}
      </div>

      {ingredients.length === 0 && <p className="text-gray-500 italic">Brak składników</p>}
    </div>
  );
};

export default IngredientsList;
