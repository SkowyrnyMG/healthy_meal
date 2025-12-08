import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type {
  RecipeFormMode,
  RecipeFormStep,
  RecipeFormData,
  RecipeFormErrors,
  RecipeDraftData,
  RecipeDetailDTO,
  RecipeIngredientDTO,
  NutritionDTO,
  CreateRecipeCommand,
} from "@/types";
import { DRAFT_KEYS, DRAFT_EXPIRATION_MS } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface UseRecipeFormWizardParams {
  mode: RecipeFormMode;
  recipeId?: string; // Required for edit mode
  initialData?: RecipeDetailDTO; // Pre-populated data for edit mode
}

interface UseRecipeFormWizardReturn {
  // Form state
  formData: RecipeFormData;
  errors: RecipeFormErrors;
  currentStep: RecipeFormStep;

  // Loading states
  isSubmitting: boolean;
  isDraftRestoring: boolean;
  hasUnsavedChanges: boolean;

  // Data modification
  updateField: <K extends keyof RecipeFormData>(field: K, value: RecipeFormData[K]) => void;
  updateIngredient: (index: number, field: keyof RecipeIngredientDTO, value: string | number) => void;
  addIngredient: () => void;
  removeIngredient: (index: number) => void;
  updateStepInstruction: (index: number, instruction: string) => void;
  addStep: () => void;
  removeStep: (index: number) => void;
  toggleTag: (tagId: string) => void;
  toggleStepsEnabled: (enabled: boolean) => void;
  updateNutrition: (field: keyof NutritionDTO, value: number) => void;

  // Validation
  validateField: (field: string) => void;
  validateStep: (step: RecipeFormStep) => boolean;
  clearError: (field: string) => void;

  // Navigation
  goToStep: (step: RecipeFormStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  canProceedToNextStep: boolean;

  // Draft management
  hasDraft: boolean;
  restoreDraft: () => void;
  discardDraft: () => void;
  discardAllChanges: () => void;

  // Submission
  submitForm: () => Promise<void>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get initial form data based on mode
 */
function getInitialFormData(params: UseRecipeFormWizardParams): RecipeFormData {
  if (params.mode === "edit" && params.initialData) {
    // Map RecipeDetailDTO to RecipeFormData
    return {
      title: params.initialData.title,
      description: params.initialData.description || undefined,
      servings: params.initialData.servings,
      prepTimeMinutes: params.initialData.prepTimeMinutes || undefined,
      isPublic: params.initialData.isPublic,
      ingredients: params.initialData.ingredients,
      stepsEnabled: params.initialData.steps.length > 0,
      steps: params.initialData.steps,
      nutritionPerServing: params.initialData.nutritionPerServing,
      tagIds: params.initialData.tags.map((t) => t.id),
    };
  }

  // Default empty form for create mode
  return {
    title: "",
    servings: 1,
    isPublic: false,
    ingredients: [{ name: "", amount: 0, unit: "" }],
    stepsEnabled: false,
    steps: [{ stepNumber: 1, instruction: "" }],
    nutritionPerServing: {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0,
      salt: 0,
    },
    tagIds: [],
  };
}

/**
 * Save draft to localStorage
 */
function saveDraft(data: RecipeFormData, step: RecipeFormStep, params: UseRecipeFormWizardParams): void {
  const draftKey = params.mode === "create" ? DRAFT_KEYS.NEW_RECIPE : DRAFT_KEYS.EDIT_RECIPE(params.recipeId!);

  const draft: RecipeDraftData = {
    timestamp: new Date().toISOString(),
    step,
    data,
  };

  try {
    localStorage.setItem(draftKey, JSON.stringify(draft));
  } catch (error) {
    console.error("Failed to save draft:", error);
  }
}

/**
 * Detect and validate existing draft
 */
function detectDraft(draftKey: string): RecipeDraftData | null {
  try {
    const saved = localStorage.getItem(draftKey);
    if (!saved) return null;

    const draft: RecipeDraftData = JSON.parse(saved);
    const age = Date.now() - new Date(draft.timestamp).getTime();

    // Check if draft is expired (older than 24 hours)
    if (age > DRAFT_EXPIRATION_MS) {
      localStorage.removeItem(draftKey);
      return null;
    }

    return draft;
  } catch (error) {
    console.error("Failed to load draft:", error);
    return null;
  }
}

/**
 * Clear draft from localStorage
 */
function clearDraft(draftKey: string): void {
  try {
    localStorage.removeItem(draftKey);
  } catch (error) {
    console.error("Failed to clear draft:", error);
  }
}

/**
 * Generate slug from tag name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export const useRecipeFormWizard = (params: UseRecipeFormWizardParams): UseRecipeFormWizardReturn => {
  // State declarations
  const [formData, setFormData] = useState<RecipeFormData>(getInitialFormData(params));
  const [errors, setErrors] = useState<RecipeFormErrors>({});
  const [currentStep, setCurrentStep] = useState<RecipeFormStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [isDraftRestoring, setIsDraftRestoring] = useState(false);

  const draftKey = params.mode === "create" ? DRAFT_KEYS.NEW_RECIPE : DRAFT_KEYS.EDIT_RECIPE(params.recipeId!);

  // Use ref to prevent duplicate draft detection
  const draftDetected = useRef(false);

  // Use ref to track intentional navigation (save/discard)
  const isIntentionalNavigation = useRef(false);

  // Draft detection on mount
  useEffect(() => {
    if (draftDetected.current) return;
    draftDetected.current = true;

    const savedDraft = detectDraft(draftKey);
    if (savedDraft) {
      setHasDraft(true);
    }
  }, [draftKey]);

  // Auto-save draft every 2.5 seconds
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      saveDraft(formData, currentStep, params);
    }, 2500);

    return () => clearTimeout(timer);
  }, [formData, currentStep, hasUnsavedChanges, params]);

  // Browser navigation warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Don't show warning if user intentionally saved or discarded
      if (hasUnsavedChanges && !isIntentionalNavigation.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ========================================
  // VALIDATION FUNCTIONS
  // ========================================

  const validateBasicInfo = useCallback((): boolean => {
    const newErrors: RecipeFormErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Tytuł jest wymagany";
    } else if (formData.title.trim().length > 255) {
      newErrors.title = "Tytuł może mieć maksymalnie 255 znaków";
    }

    // Description validation
    if (formData.description && formData.description.length > 5000) {
      newErrors.description = "Opis może mieć maksymalnie 5000 znaków";
    }

    // Servings validation
    if (formData.servings <= 0) {
      newErrors.servings = "Liczba porcji musi być większa niż 0";
    }

    // Prep time validation
    if (formData.prepTimeMinutes !== undefined) {
      if (formData.prepTimeMinutes <= 0) {
        newErrors.prepTimeMinutes = "Czas przygotowania musi być większy niż 0";
      } else if (formData.prepTimeMinutes > 1440) {
        newErrors.prepTimeMinutes = "Czas przygotowania nie może przekroczyć 1440 minut (24 godziny)";
      }
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [formData.title, formData.description, formData.servings, formData.prepTimeMinutes]);

  const validateIngredients = useCallback((): boolean => {
    const newErrors: RecipeFormErrors = {};

    if (formData.ingredients.length === 0) {
      newErrors.ingredients = "Wymagany jest co najmniej jeden składnik";
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return false;
    }

    const ingredientFieldErrors: { name?: string; amount?: string; unit?: string }[] = [];
    let hasError = false;

    formData.ingredients.forEach((ing, idx) => {
      const fieldErrors: { name?: string; amount?: string; unit?: string } = {};

      if (!ing.name.trim()) {
        fieldErrors.name = "Nazwa składnika jest wymagana";
        hasError = true;
      } else if (ing.name.length > 255) {
        fieldErrors.name = "Nazwa może mieć maksymalnie 255 znaków";
        hasError = true;
      }

      if (ing.amount <= 0) {
        fieldErrors.amount = "Ilość musi być większa niż 0";
        hasError = true;
      }

      if (!ing.unit.trim()) {
        fieldErrors.unit = "Jednostka jest wymagana";
        hasError = true;
      } else if (ing.unit.length > 50) {
        fieldErrors.unit = "Jednostka może mieć maksymalnie 50 znaków";
        hasError = true;
      }

      ingredientFieldErrors[idx] = fieldErrors;
    });

    if (hasError) {
      newErrors.ingredientFields = ingredientFieldErrors;
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return !hasError;
  }, [formData.ingredients]);

  const validateSteps = useCallback((): boolean => {
    const newErrors: RecipeFormErrors = {};

    // If steps are disabled, skip validation
    if (!formData.stepsEnabled) {
      setErrors((prev) => ({ ...prev, steps: undefined, stepFields: undefined }));
      return true;
    }

    if (formData.steps.length === 0) {
      newErrors.steps = "Wymagany jest co najmniej jeden krok przygotowania";
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return false;
    }

    const stepFieldErrors: { instruction?: string }[] = [];
    let hasError = false;

    formData.steps.forEach((step, idx) => {
      const fieldErrors: { instruction?: string } = {};

      if (!step.instruction.trim()) {
        fieldErrors.instruction = "Instrukcja jest wymagana";
        hasError = true;
      } else if (step.instruction.length > 2000) {
        fieldErrors.instruction = "Instrukcja może mieć maksymalnie 2000 znaków";
        hasError = true;
      }

      stepFieldErrors[idx] = fieldErrors;
    });

    if (hasError) {
      newErrors.stepFields = stepFieldErrors;
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return !hasError;
  }, [formData.steps, formData.stepsEnabled]);

  const validateNutrition = useCallback((): boolean => {
    const newErrors: RecipeFormErrors = {};
    const n = formData.nutritionPerServing;

    if (n.calories < 0 || n.calories > 10000) {
      newErrors.calories = "Kalorie muszą wynosić od 0 do 10000";
    }
    if (n.protein < 0 || n.protein > 1000) {
      newErrors.protein = "Białko musi wynosić od 0 do 1000g";
    }
    if (n.fat < 0 || n.fat > 1000) {
      newErrors.fat = "Tłuszcz musi wynosić od 0 do 1000g";
    }
    if (n.carbs < 0 || n.carbs > 1000) {
      newErrors.carbs = "Węglowodany muszą wynosić od 0 do 1000g";
    }
    if (n.fiber < 0 || n.fiber > 1000) {
      newErrors.fiber = "Błonnik musi wynosić od 0 do 1000g";
    }
    if (n.salt < 0 || n.salt > 100) {
      newErrors.salt = "Sól musi wynosić od 0 do 100g";
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [formData.nutritionPerServing]);

  const validateTags = useCallback((): boolean => {
    const newErrors: RecipeFormErrors = {};

    if (formData.tagIds.length > 5) {
      newErrors.tags = "Możesz wybrać maksymalnie 5 tagów";
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [formData.tagIds]);

  const validateStep = useCallback(
    (step: RecipeFormStep): boolean => {
      switch (step) {
        case 1:
          return validateBasicInfo();
        case 2:
          return validateIngredients();
        case 3:
          return validateSteps();
        case 4:
          return validateNutrition();
        case 5:
          return validateTags();
        case 6:
          return true; // Review step has no validation
        default:
          return false;
      }
    },
    [validateBasicInfo, validateIngredients, validateSteps, validateNutrition, validateTags]
  );

  // ========================================
  // DATA MODIFICATION
  // ========================================

  const updateField = useCallback(<K extends keyof RecipeFormData>(field: K, value: RecipeFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  }, []);

  const updateIngredient = useCallback((index: number, field: keyof RecipeIngredientDTO, value: string | number) => {
    setFormData((prev) => {
      const newIngredients = [...prev.ingredients];
      newIngredients[index] = { ...newIngredients[index], [field]: value };
      return { ...prev, ingredients: newIngredients };
    });
    setHasUnsavedChanges(true);
  }, []);

  const addIngredient = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: "", amount: 0, unit: "" }],
    }));
    setHasUnsavedChanges(true);
  }, []);

  const removeIngredient = useCallback((index: number) => {
    setFormData((prev) => {
      if (prev.ingredients.length <= 1) {
        setErrors((e) => ({ ...e, ingredients: "Wymagany jest co najmniej jeden składnik" }));
        return prev;
      }
      const newIngredients = prev.ingredients.filter((_, i) => i !== index);
      return { ...prev, ingredients: newIngredients };
    });
    setHasUnsavedChanges(true);
  }, []);

  const updateStepInstruction = useCallback((index: number, instruction: string) => {
    setFormData((prev) => {
      const newSteps = [...prev.steps];
      newSteps[index] = { ...newSteps[index], instruction };
      return { ...prev, steps: newSteps };
    });
    setHasUnsavedChanges(true);
  }, []);

  const addStep = useCallback(() => {
    setFormData((prev) => {
      const newStepNumber = prev.steps.length + 1;
      return {
        ...prev,
        steps: [...prev.steps, { stepNumber: newStepNumber, instruction: "" }],
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  const removeStep = useCallback((index: number) => {
    setFormData((prev) => {
      if (prev.steps.length <= 1) {
        setErrors((e) => ({ ...e, steps: "Wymagany jest co najmniej jeden krok" }));
        return prev;
      }
      // Remove step and renumber remaining steps
      const newSteps = prev.steps.filter((_, i) => i !== index).map((step, idx) => ({ ...step, stepNumber: idx + 1 }));
      return { ...prev, steps: newSteps };
    });
    setHasUnsavedChanges(true);
  }, []);

  const toggleTag = useCallback((tagId: string) => {
    setFormData((prev) => {
      const isSelected = prev.tagIds.includes(tagId);
      if (isSelected) {
        return { ...prev, tagIds: prev.tagIds.filter((id) => id !== tagId) };
      } else {
        if (prev.tagIds.length >= 5) {
          setErrors((e) => ({ ...e, tags: "Możesz wybrać maksymalnie 5 tagów" }));
          return prev;
        }
        return { ...prev, tagIds: [...prev.tagIds, tagId] };
      }
    });
    setHasUnsavedChanges(true);
  }, []);

  const toggleStepsEnabled = useCallback((enabled: boolean) => {
    setFormData((prev) => ({
      ...prev,
      stepsEnabled: enabled,
      // If disabling, keep existing steps but they won't be validated or submitted
      // If enabling and no steps exist, add one empty step
      steps: enabled && prev.steps.length === 0 ? [{ stepNumber: 1, instruction: "" }] : prev.steps,
    }));
    setHasUnsavedChanges(true);
  }, []);

  const updateNutrition = useCallback((field: keyof NutritionDTO, value: number) => {
    setFormData((prev) => ({
      ...prev,
      nutritionPerServing: { ...prev.nutritionPerServing, [field]: value },
    }));
    setHasUnsavedChanges(true);
  }, []);

  // ========================================
  // VALIDATION HELPERS
  // ========================================

  const validateField = useCallback(
    (_field: string) => {
      // Validate specific field based on current step
      // This is called on blur
      validateStep(currentStep);
    },
    [currentStep, validateStep]
  );

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field as keyof RecipeFormErrors];
      return newErrors;
    });
  }, []);

  // ========================================
  // NAVIGATION
  // ========================================

  const goToStep = useCallback((step: RecipeFormStep) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < 6) {
        setCurrentStep((currentStep + 1) as RecipeFormStep);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [currentStep, validateStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as RecipeFormStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep]);

  // Check if current step can proceed (without setting state)
  const canProceedToNextStep = useMemo(() => {
    // Basic validation check without side effects
    switch (currentStep) {
      case 1:
        return formData.title.trim().length > 0 && formData.servings > 0;
      case 2:
        return (
          formData.ingredients.length > 0 &&
          formData.ingredients.every((ing) => ing.name.trim() && ing.amount > 0 && ing.unit.trim())
        );
      case 3:
        // If steps are disabled, always allow proceeding
        if (!formData.stepsEnabled) return true;
        return formData.steps.length > 0 && formData.steps.every((step) => step.instruction.trim());
      case 4:
        return true; // Nutrition has defaults, always valid
      case 5:
        return formData.tagIds.length <= 5;
      case 6:
        return true; // Review step always allows proceeding
      default:
        return false;
    }
  }, [currentStep, formData]);

  // ========================================
  // DRAFT MANAGEMENT
  // ========================================

  const restoreDraft = useCallback(() => {
    setIsDraftRestoring(true);
    const savedDraft = detectDraft(draftKey);
    if (savedDraft) {
      setFormData(savedDraft.data);
      setCurrentStep(savedDraft.step);
      setHasUnsavedChanges(true);
    }
    setHasDraft(false);
    setIsDraftRestoring(false);
  }, [draftKey]);

  const discardDraft = useCallback(() => {
    clearDraft(draftKey);
    setHasDraft(false);
  }, [draftKey]);

  const discardAllChanges = useCallback(() => {
    // Mark as intentional navigation to prevent beforeunload warning
    isIntentionalNavigation.current = true;

    // Clear draft from localStorage
    clearDraft(draftKey);
    setHasDraft(false);
    setHasUnsavedChanges(false);

    // Redirect based on mode
    if (params.mode === "edit" && params.recipeId) {
      window.location.href = `/recipes/${params.recipeId}`;
    } else {
      window.location.href = "/recipes";
    }
  }, [draftKey, params.mode, params.recipeId]);

  // ========================================
  // SUBMISSION
  // ========================================

  const submitForm = useCallback(async (): Promise<void> => {
    setIsSubmitting(true);

    try {
      // Final validation of all steps
      const allStepsValid = [1, 2, 3, 4, 5].every((step) => validateStep(step as RecipeFormStep));

      if (!allStepsValid) {
        // Find first step with error and navigate to it
        for (let step = 1; step <= 5; step++) {
          if (!validateStep(step as RecipeFormStep)) {
            goToStep(step as RecipeFormStep);
            break;
          }
        }
        setIsSubmitting(false);
        return;
      }

      // Prepare payload
      const payload: CreateRecipeCommand = {
        title: formData.title.trim(),
        description: formData.description?.trim(),
        ingredients: formData.ingredients,
        steps: formData.stepsEnabled ? formData.steps : [],
        servings: formData.servings,
        nutritionPerServing: formData.nutritionPerServing,
        prepTimeMinutes: formData.prepTimeMinutes,
        isPublic: formData.isPublic,
        tagIds: formData.tagIds.length > 0 ? formData.tagIds : undefined,
      };

      // API call based on mode
      const endpoint = params.mode === "create" ? "/api/recipes" : `/api/recipes/${params.recipeId}`;
      const method = params.mode === "create" ? "POST" : "PUT";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 400) {
          // Validation errors - display in form
          // TODO: Map API errors to form errors
          throw new Error(errorData.message || "Błąd walidacji");
        }

        throw new Error(errorData.message || "Wystąpił błąd podczas zapisywania przepisu");
      }

      const result = await response.json();

      // Success
      // Mark as intentional navigation to prevent beforeunload warning
      isIntentionalNavigation.current = true;

      clearDraft(draftKey);
      setHasUnsavedChanges(false);

      // Redirect to recipe detail page
      window.location.href = `/recipes/${result.recipe.id}`;
    } catch (error) {
      console.error("Submit error:", error);
      alert(error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, params, validateStep, goToStep, draftKey]);

  return {
    formData,
    errors,
    currentStep,
    isSubmitting,
    isDraftRestoring,
    hasUnsavedChanges,
    updateField,
    updateIngredient,
    addIngredient,
    removeIngredient,
    updateStepInstruction,
    addStep,
    removeStep,
    toggleTag,
    toggleStepsEnabled,
    updateNutrition,
    validateField,
    validateStep,
    clearError,
    goToStep,
    nextStep,
    previousStep,
    canProceedToNextStep,
    hasDraft,
    restoreDraft,
    discardDraft,
    discardAllChanges,
    submitForm,
  };
};
