import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { RecipeDetailDTO, ModificationDTO, CreateModificationCommand } from "@/types";
import type {
  RecipeViewState,
  ActionLoadingStates,
  DialogStates,
  CurrentRecipeData,
  AdjustedIngredientDTO,
  TabType,
  UseRecipeDetailReturn,
} from "@/components/recipes/types";

/**
 * Custom hook for managing recipe detail page state and interactions
 *
 * Handles:
 * - Recipe data fetching (original + modifications)
 * - Tab switching between original/modified
 * - Servings adjustment with ingredient recalculation
 * - Action handlers (favorite, delete, modify with AI, etc.)
 * - Dialog state management
 * - Loading and error states
 *
 * @param recipeId - UUID of the recipe to display
 * @param initialIsFavorited - Initial favorite status from server
 * @returns Hook state and functions for recipe detail page
 */
export const useRecipeDetail = (recipeId: string, initialIsFavorited: boolean): UseRecipeDetailReturn => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [recipe, setRecipe] = useState<RecipeDetailDTO | null>(null);
  const [modification, setModification] = useState<ModificationDTO | null>(null);
  const [isFavorited, setIsFavorited] = useState<boolean>(initialIsFavorited);

  // Use ref to track the actual current favorite state to avoid stale closures
  const isFavoritedRef = useRef<boolean>(initialIsFavorited);

  const [viewState, setViewState] = useState<RecipeViewState>({
    activeTab: "original",
    currentServings: 1,
    originalServings: 1,
    isLoading: true,
    error: null,
  });

  const [actionStates, setActionStates] = useState<ActionLoadingStates>({
    favorite: false,
    delete: false,
    modify: false,
    addToCollection: false,
    deleteModification: false,
  });

  const [dialogStates, setDialogStates] = useState<DialogStates>({
    modifyAI: false,
    deleteRecipe: false,
    deleteModification: false,
    addToCollection: false,
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const hasModification = useMemo(() => modification !== null, [modification]);

  /**
   * Compute current data based on active tab and current servings
   * Dynamically adjusts ingredient amounts based on servings ratio
   */
  const currentData = useMemo<CurrentRecipeData | null>(() => {
    if (!recipe) return null;

    // Determine base data (original or modified)
    const baseData =
      viewState.activeTab === "modified" && modification
        ? {
            ingredients: modification.modifiedData.ingredients || recipe.ingredients,
            steps: modification.modifiedData.steps || recipe.steps,
            nutrition: modification.modifiedData.nutritionPerServing || recipe.nutritionPerServing,
            servings: modification.modifiedData.servings || recipe.servings,
          }
        : {
            ingredients: recipe.ingredients,
            steps: recipe.steps,
            nutrition: recipe.nutritionPerServing,
            servings: recipe.servings,
          };

    // Calculate serving ratio
    const ratio = viewState.currentServings / viewState.originalServings;

    // Adjust ingredients based on ratio
    const adjustedIngredients: AdjustedIngredientDTO[] = baseData.ingredients.map((ing) => ({
      name: ing.name,
      amount: ing.amount * ratio,
      unit: ing.unit,
    }));

    return {
      ingredients: adjustedIngredients,
      steps: baseData.steps,
      nutrition: baseData.nutrition, // Nutrition is per serving, no adjustment needed
      servings: viewState.currentServings,
    };
  }, [recipe, modification, viewState.activeTab, viewState.currentServings, viewState.originalServings]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch recipe data from API
   */
  const fetchRecipe = useCallback(async () => {
    try {
      setViewState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(`/api/recipes/${recipeId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setViewState((prev) => ({
            ...prev,
            isLoading: false,
            error: {
              type: "not_found",
              message: "Nie znaleziono przepisu",
            },
          }));
          return;
        }

        if (response.status === 403) {
          setViewState((prev) => ({
            ...prev,
            isLoading: false,
            error: {
              type: "forbidden",
              message: "Nie masz dostępu do tego przepisu",
            },
          }));
          return;
        }

        throw new Error("Failed to fetch recipe");
      }

      const data: RecipeDetailDTO = await response.json();
      setRecipe(data);

      // Initialize servings
      setViewState((prev) => ({
        ...prev,
        originalServings: data.servings,
        currentServings: data.servings,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error fetching recipe:", error);
      setViewState((prev) => ({
        ...prev,
        isLoading: false,
        error: {
          type: "server_error",
          message: "Wystąpił błąd podczas ładowania przepisu",
        },
      }));
    }
  }, [recipeId]);

  /**
   * Fetch modifications for this recipe
   */
  const fetchModifications = useCallback(async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/modifications`);

      if (!response.ok) {
        // Don't block on modification load failure
        console.error("Failed to fetch modifications");
        return;
      }

      const data = await response.json();

      // MVP: Take first modification if exists (only one modification per recipe)
      if (data.modifications && data.modifications.length > 0) {
        setModification(data.modifications[0]);
      }
    } catch (error) {
      // Log but don't block on modification fetch failure
      console.error("Error fetching modifications:", error);
    }
  }, [recipeId]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Load recipe and modifications on mount or recipeId change
   */
  useEffect(() => {
    fetchRecipe();
    fetchModifications();
  }, [fetchRecipe, fetchModifications]);

  /**
   * Sync ref with state to ensure ref is always up-to-date
   */
  useEffect(() => {
    isFavoritedRef.current = isFavorited;
  }, [isFavorited]);

  // ============================================================================
  // SERVINGS & TAB MANAGEMENT
  // ============================================================================

  /**
   * Adjust servings by delta
   * @param delta - Change amount (typically -1 or +1)
   */
  const adjustServings = useCallback((delta: number) => {
    setViewState((prev) => {
      const newServings = prev.currentServings + delta;

      // Constraints: min 1, max 100
      if (newServings < 1 || newServings > 100) {
        return prev;
      }

      return {
        ...prev,
        currentServings: newServings,
      };
    });
  }, []);

  /**
   * Switch between original and modified tabs
   * @param tab - Tab to switch to
   */
  const switchTab = useCallback((tab: TabType) => {
    setViewState((prev) => ({
      ...prev,
      activeTab: tab,
    }));
  }, []);

  // ============================================================================
  // ACTION HANDLERS
  // ============================================================================

  /**
   * Toggle favorite status with optimistic UI update
   */
  const toggleFavorite = useCallback(async () => {
    // Get current state from ref (always up-to-date)
    const currentState = isFavoritedRef.current;
    const newState = !currentState;

    // Determine method based on current state (before toggle)
    const method = currentState ? "DELETE" : "POST";

    // Update both state and ref optimistically
    setIsFavorited(newState);
    isFavoritedRef.current = newState;

    setActionStates((prev) => ({ ...prev, favorite: true }));

    try {
      const response = await fetch(`/api/favorites`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle favorite");
      }

      // Success - optimistic update was correct
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Revert on error - restore previous state
      setIsFavorited(currentState);
      isFavoritedRef.current = currentState;
      // TODO: Show error toast
    } finally {
      setActionStates((prev) => ({ ...prev, favorite: false }));
    }
  }, [recipeId]);

  /**
   * Delete recipe
   */
  const deleteRecipe = useCallback(async () => {
    setActionStates((prev) => ({ ...prev, delete: true }));

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete recipe");
      }

      // Redirect to recipes list on success
      window.location.href = "/recipes";
    } catch (error) {
      console.error("Error deleting recipe:", error);
      // TODO: Show error toast
      setActionStates((prev) => ({ ...prev, delete: false }));
    }
  }, [recipeId]);

  /**
   * Modify recipe with AI
   * @param command - Modification command with type and parameters
   */
  const modifyWithAI = useCallback(
    async (command: CreateModificationCommand) => {
      setActionStates((prev) => ({ ...prev, modify: true }));

      try {
        const response = await fetch(`/api/recipes/${recipeId}/modifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          throw new Error("Failed to modify recipe");
        }

        const data = await response.json();
        setModification(data.modification);

        // Switch to modified tab
        switchTab("modified");

        // Close dialog
        closeDialog("modifyAI");

        // TODO: Show success toast
      } catch (error) {
        console.error("Error modifying recipe:", error);
        // TODO: Show error toast
      } finally {
        setActionStates((prev) => ({ ...prev, modify: false }));
      }
    },
    [recipeId, switchTab]
  );

  /**
   * Delete modification
   */
  const deleteModification = useCallback(async () => {
    if (!modification) return;

    setActionStates((prev) => ({ ...prev, deleteModification: true }));

    try {
      const response = await fetch(`/api/modifications/${modification.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete modification");
      }

      // Clear modification
      setModification(null);

      // Switch to original tab
      switchTab("original");

      // Close dialog
      closeDialog("deleteModification");

      // TODO: Show success toast
    } catch (error) {
      console.error("Error deleting modification:", error);
      // TODO: Show error toast
    } finally {
      setActionStates((prev) => ({ ...prev, deleteModification: false }));
    }
  }, [recipeId, modification, switchTab]);

  // ============================================================================
  // DIALOG MANAGEMENT
  // ============================================================================

  /**
   * Open dialog
   * @param dialogName - Name of dialog to open
   */
  const openDialog = useCallback((dialogName: keyof DialogStates) => {
    setDialogStates((prev) => ({ ...prev, [dialogName]: true }));
  }, []);

  /**
   * Close dialog
   * @param dialogName - Name of dialog to close
   */
  const closeDialog = useCallback((dialogName: keyof DialogStates) => {
    setDialogStates((prev) => ({ ...prev, [dialogName]: false }));
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Data
    recipe,
    modification,
    currentData,

    // State
    viewState,
    isFavorited,
    hasModification,
    actionStates,
    dialogStates,

    // Functions
    adjustServings,
    switchTab,
    toggleFavorite,
    deleteRecipe,
    modifyWithAI,
    deleteModification,
    openDialog,
    closeDialog,
  };
};
