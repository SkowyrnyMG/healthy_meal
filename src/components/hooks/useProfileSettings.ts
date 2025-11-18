import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type {
  ProfileDTO,
  AllergenDTO,
  UserAllergenDTO,
  DislikedIngredientDTO,
  ProfileSettingsState,
  BasicInfoFormData,
  DietaryPreferencesFormData,
  UpdateProfileCommand,
} from "@/types";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Return type for the useProfileSettings hook
 */
export interface UseProfileSettingsReturn {
  /**
   * Complete profile settings state
   */
  state: ProfileSettingsState;

  /**
   * Save basic info (weight, age, gender, activity level)
   */
  saveBasicInfo: (data: BasicInfoFormData) => Promise<void>;

  /**
   * Save dietary preferences (diet type, target goal, target value)
   */
  saveDietaryPreferences: (data: DietaryPreferencesFormData) => Promise<void>;

  /**
   * Save allergens selection (diff-based sync)
   */
  saveAllergens: (selectedIds: Set<string>) => Promise<void>;

  /**
   * Add a disliked ingredient (optimistic update)
   */
  addDislikedIngredient: (name: string) => Promise<void>;

  /**
   * Remove a disliked ingredient (optimistic update)
   */
  removeDislikedIngredient: (id: string) => Promise<void>;

  /**
   * Refetch all profile data
   */
  refetchAll: () => Promise<void>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch user profile from API
 */
const fetchProfile = async (): Promise<ProfileDTO> => {
  const response = await fetch("/api/profile");
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Nie udało się pobrać profilu");
  }
  return response.json();
};

/**
 * Update user profile via API
 */
const updateProfile = async (data: UpdateProfileCommand): Promise<ProfileDTO> => {
  const response = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Nie udało się zaktualizować profilu");
  }
  return response.json();
};

/**
 * Fetch all available allergens
 */
const fetchAllAllergens = async (): Promise<AllergenDTO[]> => {
  const response = await fetch("/api/allergens");
  if (!response.ok) {
    throw new Error("Nie udało się pobrać listy alergenów");
  }
  const data = await response.json();
  return data.allergens;
};

/**
 * Fetch user's selected allergens
 */
const fetchUserAllergens = async (): Promise<UserAllergenDTO[]> => {
  const response = await fetch("/api/profile/allergens");
  if (!response.ok) {
    throw new Error("Nie udało się pobrać alergenów użytkownika");
  }
  const data = await response.json();
  return data.allergens;
};

/**
 * Fetch user's disliked ingredients
 */
const fetchDislikedIngredients = async (): Promise<DislikedIngredientDTO[]> => {
  const response = await fetch("/api/profile/disliked-ingredients");
  if (!response.ok) {
    throw new Error("Nie udało się pobrać niechcianych składników");
  }
  const data = await response.json();
  return data.dislikedIngredients;
};

/**
 * Add allergen to user profile
 */
const addAllergen = async (allergenId: string): Promise<UserAllergenDTO> => {
  const response = await fetch("/api/profile/allergens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ allergenId }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Nie udało się dodać alergenu");
  }
  const data = await response.json();
  return data.allergen;
};

/**
 * Remove allergen from user profile
 */
const removeAllergen = async (id: string): Promise<void> => {
  const response = await fetch(`/api/profile/allergens/${id}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 204) {
    throw new Error("Nie udało się usunąć alergenu");
  }
};

/**
 * Add disliked ingredient
 */
const addIngredient = async (ingredientName: string): Promise<DislikedIngredientDTO> => {
  const response = await fetch("/api/profile/disliked-ingredients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredientName }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 409) {
      throw new Error("Ten składnik już jest na liście");
    }
    throw new Error(error.message || "Nie udało się dodać składnika");
  }
  const data = await response.json();
  return data.dislikedIngredient;
};

/**
 * Remove disliked ingredient
 */
const removeIngredient = async (id: string): Promise<void> => {
  const response = await fetch(`/api/profile/disliked-ingredients/${id}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 204) {
    throw new Error("Nie udało się usunąć składnika");
  }
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for managing profile settings state and API interactions
 *
 * Features:
 * - Fetches all profile data on mount
 * - Handles loading, saving, and error states
 * - Optimistic updates for disliked ingredients
 * - Diff-based allergen syncing
 * - Toast notifications for user feedback
 *
 * @example
 * ```tsx
 * const {
 *   state,
 *   saveBasicInfo,
 *   saveDietaryPreferences,
 *   saveAllergens,
 *   addDislikedIngredient,
 *   removeDislikedIngredient,
 *   refetchAll
 * } = useProfileSettings();
 * ```
 */
export const useProfileSettings = (): UseProfileSettingsReturn => {
  // ========================================
  // STATE
  // ========================================

  const [state, setState] = useState<ProfileSettingsState>({
    // Data
    profile: null,
    allAllergens: [],
    userAllergens: [],
    dislikedIngredients: [],

    // Loading states
    isLoadingProfile: true,
    isLoadingAllergens: true,
    isLoadingDislikedIngredients: true,

    // Saving states
    isSavingBasicInfo: false,
    isSavingDietaryPreferences: false,
    isSavingAllergens: false,
    isAddingIngredient: false,
    removingIngredientId: null,

    // Error states
    error: null,
  });

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch all profile data in parallel
   */
  const refetchAll = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoadingProfile: true,
      isLoadingAllergens: true,
      isLoadingDislikedIngredients: true,
      error: null,
    }));

    try {
      const [profile, allAllergens, userAllergens, dislikedIngredients] = await Promise.all([
        fetchProfile(),
        fetchAllAllergens(),
        fetchUserAllergens(),
        fetchDislikedIngredients(),
      ]);

      setState((prev) => ({
        ...prev,
        profile,
        allAllergens,
        userAllergens,
        dislikedIngredients,
        isLoadingProfile: false,
        isLoadingAllergens: false,
        isLoadingDislikedIngredients: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wystąpił błąd podczas ładowania danych";
      setState((prev) => ({
        ...prev,
        isLoadingProfile: false,
        isLoadingAllergens: false,
        isLoadingDislikedIngredients: false,
        error: message,
      }));
      toast.error(message);
    }
  }, []);

  /**
   * Initial data fetch on mount
   */
  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  // ========================================
  // SAVE ACTIONS
  // ========================================

  /**
   * Save basic info (weight, age, gender, activity level)
   */
  const saveBasicInfo = useCallback(async (data: BasicInfoFormData) => {
    setState((prev) => ({ ...prev, isSavingBasicInfo: true }));

    try {
      const updateData: UpdateProfileCommand = {
        weight: data.weight ?? undefined,
        age: data.age ?? undefined,
        gender: data.gender ?? undefined,
        activityLevel: data.activityLevel ?? undefined,
      };

      const updatedProfile = await updateProfile(updateData);

      setState((prev) => ({
        ...prev,
        profile: updatedProfile,
        isSavingBasicInfo: false,
      }));

      toast.success("Dane podstawowe zostały zapisane");
    } catch (error) {
      setState((prev) => ({ ...prev, isSavingBasicInfo: false }));
      const message = error instanceof Error ? error.message : "Nie udało się zapisać danych podstawowych";
      toast.error(message);
      throw error;
    }
  }, []);

  /**
   * Save dietary preferences (diet type, target goal, target value)
   */
  const saveDietaryPreferences = useCallback(async (data: DietaryPreferencesFormData) => {
    setState((prev) => ({ ...prev, isSavingDietaryPreferences: true }));

    try {
      const updateData: UpdateProfileCommand = {
        dietType: data.dietType ?? undefined,
        targetGoal: data.targetGoal ?? undefined,
        targetValue: data.targetValue ?? undefined,
      };

      const updatedProfile = await updateProfile(updateData);

      setState((prev) => ({
        ...prev,
        profile: updatedProfile,
        isSavingDietaryPreferences: false,
      }));

      toast.success("Preferencje żywieniowe zostały zapisane");
    } catch (error) {
      setState((prev) => ({ ...prev, isSavingDietaryPreferences: false }));
      const message = error instanceof Error ? error.message : "Nie udało się zapisać preferencji żywieniowych";
      toast.error(message);
      throw error;
    }
  }, []);

  /**
   * Save allergens selection (diff-based sync)
   */
  const saveAllergens = useCallback(
    async (selectedIds: Set<string>) => {
      setState((prev) => ({ ...prev, isSavingAllergens: true }));

      try {
        // Get current allergen IDs
        const currentIds = new Set(state.userAllergens.map((a) => a.id));

        // Calculate diff
        const toAdd = [...selectedIds].filter((id) => !currentIds.has(id));
        const toRemove = [...currentIds].filter((id) => !selectedIds.has(id));

        // Execute all operations in parallel
        await Promise.all([...toAdd.map((id) => addAllergen(id)), ...toRemove.map((id) => removeAllergen(id))]);

        // Refetch user allergens to get updated list
        const userAllergens = await fetchUserAllergens();

        setState((prev) => ({
          ...prev,
          userAllergens,
          isSavingAllergens: false,
        }));

        toast.success("Alergeny zostały zaktualizowane");
      } catch (error) {
        setState((prev) => ({ ...prev, isSavingAllergens: false }));
        const message = error instanceof Error ? error.message : "Nie udało się zaktualizować alergenów";
        toast.error(message);
        throw error;
      }
    },
    [state.userAllergens]
  );

  /**
   * Add a disliked ingredient (optimistic update)
   */
  const addDislikedIngredient = useCallback(async (name: string) => {
    setState((prev) => ({ ...prev, isAddingIngredient: true }));

    // Create optimistic entry
    const optimisticIngredient: DislikedIngredientDTO = {
      id: `temp-${Date.now()}`,
      ingredientName: name.trim(),
      createdAt: new Date().toISOString(),
    };

    // Optimistically add to list
    setState((prev) => ({
      ...prev,
      dislikedIngredients: [...prev.dislikedIngredients, optimisticIngredient],
    }));

    try {
      const newIngredient = await addIngredient(name.trim());

      // Replace optimistic entry with real one
      setState((prev) => ({
        ...prev,
        dislikedIngredients: prev.dislikedIngredients.map((ing) =>
          ing.id === optimisticIngredient.id ? newIngredient : ing
        ),
        isAddingIngredient: false,
      }));

      toast.success("Składnik został dodany");
    } catch (error) {
      // Rollback optimistic update
      setState((prev) => ({
        ...prev,
        dislikedIngredients: prev.dislikedIngredients.filter((ing) => ing.id !== optimisticIngredient.id),
        isAddingIngredient: false,
      }));

      const message = error instanceof Error ? error.message : "Nie udało się dodać składnika";
      toast.error(message);
      throw error;
    }
  }, []);

  /**
   * Remove a disliked ingredient (optimistic update)
   */
  const removeDislikedIngredient = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, removingIngredientId: id }));

    // Store the ingredient for potential rollback
    let removedIngredient: DislikedIngredientDTO | undefined;

    // Optimistically remove from list
    setState((prev) => {
      removedIngredient = prev.dislikedIngredients.find((ing) => ing.id === id);
      return {
        ...prev,
        dislikedIngredients: prev.dislikedIngredients.filter((ing) => ing.id !== id),
      };
    });

    try {
      await removeIngredient(id);

      setState((prev) => ({
        ...prev,
        removingIngredientId: null,
      }));

      toast.success("Składnik został usunięty");
    } catch (error) {
      // Rollback optimistic update
      setState((prev) => ({
        ...prev,
        dislikedIngredients: removedIngredient
          ? [...prev.dislikedIngredients, removedIngredient]
          : prev.dislikedIngredients,
        removingIngredientId: null,
      }));

      const message = error instanceof Error ? error.message : "Nie udało się usunąć składnika";
      toast.error(message);
      throw error;
    }
  }, []);

  // ========================================
  // RETURN
  // ========================================

  return {
    state,
    saveBasicInfo,
    saveDietaryPreferences,
    saveAllergens,
    addDislikedIngredient,
    removeDislikedIngredient,
    refetchAll,
  };
};
