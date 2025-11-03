import { useRecipeDetail } from "@/components/hooks/useRecipeDetail";
import type { RecipeDetailLayoutProps } from "@/components/recipes/types";

// Core components
import RecipeHeader from "./core/RecipeHeader";
import ServingsAdjuster from "./core/ServingsAdjuster";
import IngredientsList from "./core/IngredientsList";
import PreparationSteps from "./core/PreparationSteps";
import NutritionCard from "./core/NutritionCard";

// Supporting components
import TabNavigation from "./supporting/TabNavigation";
import InfoBanner from "./supporting/InfoBanner";
import LoadingState from "./supporting/LoadingState";
import ErrorState from "./supporting/ErrorState";

// Action components
import ActionButtons from "./actions/ActionButtons";
import ModifyWithAIModal from "./actions/ModifyWithAIModal";
import DeleteConfirmDialog from "./actions/DeleteConfirmDialog";
import DeleteModificationDialog from "./actions/DeleteModificationDialog";
import AddToCollectionDialog from "./actions/AddToCollectionDialog";

/**
 * RecipeDetailLayout - Main React component for recipe detail page
 * Manages state, layout, and orchestrates all child components
 */
const RecipeDetailLayout = ({ recipeId, initialIsFavorited }: RecipeDetailLayoutProps) => {
  // Use custom hook for all state management
  const {
    recipe,
    currentData,
    viewState,
    isFavorited,
    hasModification,
    actionStates,
    dialogStates,
    adjustServings,
    switchTab,
    toggleFavorite,
    deleteRecipe,
    modifyWithAI,
    deleteModification,
    openDialog,
    closeDialog,
  } = useRecipeDetail(recipeId, initialIsFavorited);

  // Loading state
  if (viewState.isLoading) {
    return <LoadingState />;
  }

  // Error state
  if (viewState.error) {
    return (
      <ErrorState
        errorType={viewState.error.type}
        message={viewState.error.message}
        onBack={() => (window.location.href = "/recipes")}
      />
    );
  }

  // No recipe loaded
  if (!recipe || !currentData) {
    return <ErrorState errorType="not_found" onBack={() => (window.location.href = "/recipes")} />;
  }

  // Mock current user ID (TODO: Replace with actual auth)
  const currentUserId = recipe.userId;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Tab Navigation - Only show if modification exists */}
      {hasModification && (
        <div className="mb-6">
          <TabNavigation activeTab={viewState.activeTab} onTabChange={switchTab} />
        </div>
      )}

      {/* Info Banner - Only show on Modified tab */}
      {hasModification && viewState.activeTab === "modified" && (
        <div className="mb-6">
          <InfoBanner />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recipe Header */}
          <RecipeHeader
            title={recipe.title}
            description={recipe.description}
            prepTimeMinutes={recipe.prepTimeMinutes}
            tags={recipe.tags}
            isPublic={recipe.isPublic}
          />

          {/* Servings Adjuster */}
          <ServingsAdjuster
            currentServings={viewState.currentServings}
            minServings={1}
            maxServings={100}
            onServingsChange={adjustServings}
          />

          {/* Ingredients List */}
          <IngredientsList ingredients={currentData.ingredients} />

          {/* Preparation Steps */}
          <PreparationSteps steps={currentData.steps} />
        </div>

        {/* Right Sidebar - Nutrition & Actions (1/3 width on desktop) */}
        <div className="space-y-6">
          {/* Nutrition Card */}
          <NutritionCard nutrition={currentData.nutrition} servings={viewState.currentServings} />

          {/* Action Buttons */}
          <ActionButtons
            recipeId={recipe.id}
            recipeUserId={recipe.userId}
            currentUserId={currentUserId}
            activeTab={viewState.activeTab}
            isFavorited={isFavorited}
            hasModification={hasModification}
            actionStates={actionStates}
            onModifyWithAI={() => openDialog("modifyAI")}
            onEdit={() => (window.location.href = `/recipes/${recipe.id}/edit`)}
            onDelete={() => openDialog("deleteRecipe")}
            onToggleFavorite={toggleFavorite}
            onAddToCollection={() => openDialog("addToCollection")}
            onDeleteModification={() => openDialog("deleteModification")}
          />
        </div>
      </div>

      {/* Modals */}
      <ModifyWithAIModal
        isOpen={dialogStates.modifyAI}
        onClose={() => closeDialog("modifyAI")}
        onConfirm={modifyWithAI}
        hasExistingModification={hasModification}
        isLoading={actionStates.modify}
      />

      <DeleteConfirmDialog
        isOpen={dialogStates.deleteRecipe}
        onClose={() => closeDialog("deleteRecipe")}
        onConfirm={deleteRecipe}
        isLoading={actionStates.delete}
      />

      <DeleteModificationDialog
        isOpen={dialogStates.deleteModification}
        onClose={() => closeDialog("deleteModification")}
        onConfirm={deleteModification}
        isLoading={actionStates.deleteModification}
      />

      <AddToCollectionDialog
        isOpen={dialogStates.addToCollection}
        onClose={() => closeDialog("addToCollection")}
        onConfirm={async (collectionId) => {
          try {
            const response = await fetch(`/api/collections/${collectionId}/recipes`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ recipeId }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              if (response.status === 409) {
                throw new Error("Ten przepis jest już w tej kolekcji");
              }
              throw new Error(errorData.message || "Nie udało się dodać przepisu do kolekcji");
            }

            // Show success toast
            const { toast } = await import("sonner");
            toast.success("Przepis został dodany do kolekcji");

            // Close dialog
            closeDialog("addToCollection");
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error("[RecipeDetailLayout] Error adding to collection:", error);
            const { toast } = await import("sonner");
            toast.error(error instanceof Error ? error.message : "Wystąpił błąd. Spróbuj ponownie.");
            throw error; // Re-throw to prevent dialog from closing
          }
        }}
        recipeId={recipeId}
        isLoading={actionStates.addToCollection}
      />
    </div>
  );
};

export default RecipeDetailLayout;
