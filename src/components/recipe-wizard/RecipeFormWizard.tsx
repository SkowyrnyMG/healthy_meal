import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ProgressIndicator from "./ProgressIndicator";
import WizardNavigation from "./WizardNavigation";
import BasicInfoStep from "./steps/BasicInfoStep";
import IngredientsStep from "./steps/IngredientsStep";
import StepsStep from "./steps/StepsStep";
import NutritionStep from "./steps/NutritionStep";
import TagsStep from "./steps/TagsStep";
import ReviewStep from "./steps/ReviewStep";
import { useRecipeFormWizard } from "@/components/hooks/useRecipeFormWizard";
import type { RecipeFormMode, RecipeDetailDTO, TagDTO } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface RecipeFormWizardProps {
  mode: RecipeFormMode;
  initialData?: RecipeDetailDTO;
  recipeId?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const RecipeFormWizard = ({ mode, initialData, recipeId }: RecipeFormWizardProps) => {
  const wizard = useRecipeFormWizard({
    mode,
    recipeId,
    initialData,
  });

  // Handle custom tag creation - add to local state and auto-select
  const handleCustomTagCreated = (newTag: TagDTO) => {
    wizard.toggleTag(newTag.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{mode === "create" ? "Nowy przepis" : "Edytuj przepis"}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {mode === "create"
              ? "Wypełnij formularz, aby dodać nowy przepis do swojej kolekcji"
              : "Zaktualizuj informacje o przepisie"}
          </p>
        </div>

        {/* Draft Restoration Banner */}
        {wizard.hasDraft && !wizard.isDraftRestoring && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">Znaleziono niezapisany szkic</AlertTitle>
            <AlertDescription className="text-blue-800">
              Masz niezapisane zmiany z poprzedniej sesji. Czy chcesz je przywrócić?
            </AlertDescription>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={wizard.restoreDraft} className="bg-blue-600 hover:bg-blue-700">
                Tak, przywróć
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={wizard.discardDraft}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                Nie, zacznij od nowa
              </Button>
            </div>
          </Alert>
        )}

        {/* Main Form Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
          {/* Progress Indicator */}
          <div className="mb-8">
            <ProgressIndicator
              currentStep={wizard.currentStep}
              totalSteps={6}
              mode={mode}
              onStepClick={wizard.goToStep}
            />
          </div>

          {/* Step Content */}
          <div className="mb-8" key={`step-${wizard.currentStep}`}>
            {wizard.currentStep === 1 && (
              <BasicInfoStep
                data={{
                  title: wizard.formData.title,
                  description: wizard.formData.description,
                  servings: wizard.formData.servings,
                  prepTimeMinutes: wizard.formData.prepTimeMinutes,
                  isPublic: wizard.formData.isPublic,
                }}
                errors={wizard.errors}
                onChange={wizard.updateField}
                onBlur={wizard.validateField}
              />
            )}

            {wizard.currentStep === 2 && (
              <IngredientsStep
                data={wizard.formData.ingredients}
                errors={{
                  ingredients: wizard.errors.ingredients,
                  ingredientFields: wizard.errors.ingredientFields,
                }}
                onAdd={wizard.addIngredient}
                onRemove={wizard.removeIngredient}
                onChange={wizard.updateIngredient}
              />
            )}

            {wizard.currentStep === 3 && (
              <StepsStep
                data={wizard.formData.steps}
                stepsEnabled={wizard.formData.stepsEnabled}
                errors={{
                  steps: wizard.errors.steps,
                  stepFields: wizard.errors.stepFields,
                }}
                onAdd={wizard.addStep}
                onRemove={wizard.removeStep}
                onChange={wizard.updateStepInstruction}
                onToggleEnabled={wizard.toggleStepsEnabled}
              />
            )}

            {wizard.currentStep === 4 && (
              <NutritionStep
                data={wizard.formData.nutritionPerServing}
                errors={{
                  calories: wizard.errors.calories,
                  protein: wizard.errors.protein,
                  fat: wizard.errors.fat,
                  carbs: wizard.errors.carbs,
                  fiber: wizard.errors.fiber,
                  salt: wizard.errors.salt,
                }}
                onChange={wizard.updateNutrition}
                onBlur={(field) => wizard.validateField(field)}
              />
            )}

            {wizard.currentStep === 5 && (
              <TagsStep
                selectedTagIds={wizard.formData.tagIds}
                errors={{
                  tags: wizard.errors.tags,
                }}
                onToggle={wizard.toggleTag}
                onCustomTagCreated={handleCustomTagCreated}
              />
            )}

            {wizard.currentStep === 6 && <ReviewStep data={wizard.formData} mode={mode} onEdit={wizard.goToStep} />}
          </div>

          {/* Navigation */}
          <WizardNavigation
            currentStep={wizard.currentStep}
            totalSteps={6}
            mode={mode}
            recipeId={recipeId}
            onPrevious={wizard.previousStep}
            onNext={wizard.nextStep}
            onSubmit={wizard.submitForm}
            onDiscardAll={wizard.discardAllChanges}
            isSubmitting={wizard.isSubmitting}
            canProceed={wizard.canProceedToNextStep}
          />
        </div>

        {/* Unsaved Changes Info */}
        {wizard.hasUnsavedChanges && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">Twoje zmiany są automatycznie zapisywane lokalnie co 2.5 sekundy</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeFormWizard;
