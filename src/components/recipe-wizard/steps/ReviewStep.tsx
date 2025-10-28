import { Edit2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTags } from "@/components/hooks/useTags";
import type { RecipeFormData, RecipeFormMode, RecipeFormStep } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface ReviewStepProps {
  data: RecipeFormData;
  mode: RecipeFormMode;
  onEdit: (step: RecipeFormStep) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const ReviewStep = ({ data, mode, onEdit }: ReviewStepProps) => {
  const { tags } = useTags();

  // Get tag names from IDs
  const selectedTags = tags.filter((tag) => data.tagIds.includes(tag.id));

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Podsumowanie</h2>
        <p className="text-sm text-gray-600">Sprawdź wszystkie informacje przed zapisaniem przepisu</p>
      </div>

      {/* Success Icon */}
      <div className="flex items-center justify-center p-6 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>

      {/* Basic Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Podstawowe informacje</CardTitle>
              <CardDescription>Tytuł, opis i podstawowe dane</CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(1)}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edytuj
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Tytuł</h4>
            <p className="text-sm text-gray-900">{data.title}</p>
          </div>

          {data.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Opis</h4>
              <p className="text-sm text-gray-600">{data.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Liczba porcji</h4>
              <p className="text-sm text-gray-900">{data.servings}</p>
            </div>
            {data.prepTimeMinutes && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Czas przygotowania</h4>
                <p className="text-sm text-gray-900">{data.prepTimeMinutes} min</p>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Widoczność</h4>
            <Badge variant={data.isPublic ? "default" : "secondary"}>{data.isPublic ? "Publiczny" : "Prywatny"}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Ingredients Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Składniki</CardTitle>
              <CardDescription>{data.ingredients.length} składników</CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(2)}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edytuj
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.ingredients.map((ingredient, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span className="text-sm text-gray-900">
                  {ingredient.name} - {ingredient.amount} {ingredient.unit}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Steps Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kroki przygotowania</CardTitle>
              <CardDescription>{data.steps.length} kroków</CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(3)}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edytuj
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {data.steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  {step.stepNumber}
                </div>
                <p className="text-sm text-gray-900 flex-1">{step.instruction}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Nutrition Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Wartości odżywcze</CardTitle>
              <CardDescription>Na jedną porcję</CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(4)}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edytuj
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Kalorie</h4>
              <p className="text-lg font-semibold text-gray-900">{data.nutritionPerServing.calories} kcal</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Białko</h4>
              <p className="text-lg font-semibold text-gray-900">{data.nutritionPerServing.protein}g</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Tłuszcz</h4>
              <p className="text-lg font-semibold text-gray-900">{data.nutritionPerServing.fat}g</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Węglowodany</h4>
              <p className="text-lg font-semibold text-gray-900">{data.nutritionPerServing.carbs}g</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Błonnik</h4>
              <p className="text-lg font-semibold text-gray-900">{data.nutritionPerServing.fiber}g</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Sól</h4>
              <p className="text-lg font-semibold text-gray-900">{data.nutritionPerServing.salt}g</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags Card */}
      {data.tagIds.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Kategorie</CardTitle>
                <CardDescription>{data.tagIds.length} kategorii</CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(5)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edytuj
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedTags.length > 0 ? (
                selectedTags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-500">Ładowanie kategorii...</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Final Note */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          {mode === "create"
            ? "Kliknij 'Zapisz przepis' poniżej, aby dodać przepis do swojej kolekcji."
            : "Kliknij 'Zapisz zmiany' poniżej, aby zaktualizować przepis."}
        </p>
      </div>
    </div>
  );
};

export default ReviewStep;
