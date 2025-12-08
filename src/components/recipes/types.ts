import type { RecipeDetailDTO, NutritionDTO, ModificationDTO, CreateModificationCommand } from "@/types";

// ============================================================================
// VIEW STATE TYPES
// ============================================================================

/**
 * Error types for recipe detail page
 */
export type RecipeErrorType = "not_found" | "forbidden" | "server_error" | "modification_load_failed";

/**
 * Recipe error object
 */
export interface RecipeError {
  type: RecipeErrorType;
  message: string;
}

/**
 * Recipe view state managing tab, servings, loading, and error state
 */
export interface RecipeViewState {
  /** Current active tab (if modification exists) */
  activeTab: TabType;

  /** Current servings (adjusted by user) */
  currentServings: number;

  /** Original servings from recipe data (for ratio calculation) */
  originalServings: number;

  /** Loading state for initial data fetch */
  isLoading: boolean;

  /** Error state */
  error: RecipeError | null;
}

/**
 * Loading states for each action button
 */
export interface ActionLoadingStates {
  favorite: boolean;
  delete: boolean;
  modify: boolean;
  addToCollection: boolean;
  deleteModification: boolean;
}

/**
 * Dialog visibility states
 */
export interface DialogStates {
  modifyAI: boolean;
  deleteRecipe: boolean;
  deleteModification: boolean;
  addToCollection: boolean;
}

// ============================================================================
// DATA TYPES
// ============================================================================

/**
 * Ingredient with adjusted amount based on servings
 */
export interface AdjustedIngredientDTO {
  name: string;
  amount: number;
  unit: string;
}

/**
 * Current data being displayed (changes based on tab and servings)
 */
export interface CurrentRecipeData {
  ingredients: AdjustedIngredientDTO[];
  steps: RecipeStepDTO[];
  nutrition: NutritionDTO;
  servings: number;
}

/**
 * Complete view model for recipe detail page
 */
export interface RecipeDetailViewModel {
  /** Original recipe data */
  recipe: RecipeDetailDTO | null;

  /** Modification data (null if no modification exists) */
  modification: ModificationDTO | null;

  /** Favorite status */
  isFavorited: boolean;

  /** Computed flag for modification existence */
  hasModification: boolean;

  /** Current data being displayed (changes based on tab and servings) */
  currentData: CurrentRecipeData | null;
}

// ============================================================================
// CHART TYPES
// ============================================================================

/**
 * Pie chart data item for nutrition visualization
 */
export interface PieChartDataItem {
  /** Display name in Polish */
  name: string; // "Białko", "Tłuszcze", "Węglowodany"

  /** Value in grams */
  value: number;

  /** Percentage of total macros */
  percentage: number;

  /** Hex color for pie segment */
  color: string;
}

// ============================================================================
// TAB TYPES
// ============================================================================

/**
 * Tab type for original vs modified recipe
 */
export type TabType = "original" | "modified";

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

/**
 * Return type for useRecipeDetail custom hook
 */
export interface UseRecipeDetailReturn {
  // Data
  recipe: RecipeDetailDTO | null;
  modification: ModificationDTO | null;
  currentData: CurrentRecipeData | null;

  // State
  viewState: RecipeViewState;
  isFavorited: boolean;
  hasModification: boolean;
  actionStates: ActionLoadingStates;
  dialogStates: DialogStates;

  // Functions
  adjustServings: (delta: number) => void;
  switchTab: (tab: TabType) => void;
  toggleFavorite: () => Promise<void>;
  deleteRecipe: () => Promise<void>;
  modifyWithAI: (command: CreateModificationCommand) => Promise<void>;
  deleteModification: () => Promise<void>;
  openDialog: (dialogName: keyof DialogStates) => void;
  closeDialog: (dialogName: keyof DialogStates) => void;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

/**
 * Props for RecipeDetailLayout component
 */
export interface RecipeDetailLayoutProps {
  recipeId: string;
  initialIsFavorited: boolean;
}

/**
 * Props for TabNavigation component
 */
export interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

/**
 * Props for RecipeHeader component
 */
export interface RecipeHeaderProps {
  title: string;
  description: string | null;
  prepTimeMinutes: number | null;
  tags: { id: string; name: string; slug: string }[];
  isPublic: boolean;
}

/**
 * Props for ServingsAdjuster component
 */
export interface ServingsAdjusterProps {
  currentServings: number;
  minServings: number;
  maxServings: number;
  onServingsChange: (delta: number) => void;
}

/**
 * Props for IngredientsList component
 */
export interface IngredientsListProps {
  ingredients: AdjustedIngredientDTO[];
}

/**
 * Props for PreparationSteps component
 */
export interface PreparationStepsProps {
  steps: RecipeStepDTO[];
}

/**
 * Props for NutritionCard component
 */
export interface NutritionCardProps {
  nutrition: NutritionDTO;
  servings: number;
}

/**
 * Props for NutritionPieChart component
 */
export interface NutritionPieChartProps {
  protein: number;
  fat: number;
  carbs: number;
}

/**
 * Props for ActionButtons component
 */
export interface ActionButtonsProps {
  recipeId: string;
  recipeUserId: string;
  currentUserId: string;
  activeTab: TabType;
  isFavorited: boolean;
  hasModification: boolean;
  actionStates: ActionLoadingStates;
  onModifyWithAI: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onAddToCollection: () => void;
  onDeleteModification: () => void;
}

/**
 * Props for ModifyWithAIModal component
 */
export interface ModifyWithAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (command: CreateModificationCommand) => Promise<void>;
  hasExistingModification: boolean;
  isLoading: boolean;
}

/**
 * Props for DeleteConfirmDialog component
 */
export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Props for DeleteModificationDialog component
 */
export interface DeleteModificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Props for AddToCollectionDialog component
 */
export interface AddToCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (collectionId: string) => Promise<void>;
  recipeId: string;
  isLoading: boolean;
}

/**
 * Props for ErrorState component
 */
export interface ErrorStateProps {
  errorType: RecipeErrorType;
  message?: string;
  onBack: () => void;
}
