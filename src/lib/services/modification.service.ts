import type { SupabaseClient } from "../../db/supabase.client";
import type {
  ModificationDTO,
  ModificationDetailDTO,
  CreateModificationCommand,
  ModificationDataDTO,
  RecipeDetailDTO,
  RecipeIngredientDTO,
  RecipeStepDTO,
  NutritionDTO,
  DbModificationInsert,
  PaginationDTO,
} from "../../types";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Database query result interface for recipe_modifications table
 */
interface ModificationQueryResult {
  id: string;
  original_recipe_id: string;
  user_id: string;
  modification_type: string;
  modified_data: {
    ingredients?: RecipeIngredientDTO[];
    steps?: RecipeStepDTO[];
    nutritionPerServing?: NutritionDTO;
    servings?: number;
    modificationNotes?: string;
  };
  created_at: string;
}

/**
 * Database query result interface for modification detail with recipe join
 */
interface ModificationDetailQueryResult {
  id: string;
  original_recipe_id: string;
  user_id: string;
  modification_type: string;
  modified_data: ModificationDataDTO;
  created_at: string;
  recipes: {
    id: string;
    title: string;
    user_id: string;
    is_public: boolean;
    nutrition_per_serving: NutritionDTO;
  };
}

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Create a new recipe modification with mocked AI response
 * @param supabase - Supabase client instance from context.locals
 * @param recipe - Original recipe to modify
 * @param userId - ID of the user creating the modification
 * @param command - CreateModificationCommand with modification type and parameters
 * @returns ModificationDTO with complete modification information
 * @throws Error if database operation fails
 */
export async function createModification(
  supabase: SupabaseClient,
  recipe: RecipeDetailDTO,
  userId: string,
  command: CreateModificationCommand
): Promise<ModificationDTO> {
  // ========================================
  // GENERATE MOCK MODIFIED DATA
  // ========================================

  const modifiedData = generateMockModification(recipe, command);

  // ========================================
  // INSERT MODIFICATION INTO DATABASE
  // ========================================

  const modificationInsert: DbModificationInsert = {
    original_recipe_id: recipe.id,
    user_id: userId,
    modification_type: command.modificationType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modified_data: modifiedData as any, // JSONB field - type assertion required for Supabase
  };

  const { data, error } = await supabase.from("recipe_modifications").insert(modificationInsert).select().single();

  if (error || !data) {
    throw error || new Error("Failed to create modification");
  }

  // ========================================
  // MAP TO DTO AND RETURN
  // ========================================

  return mapToModificationDTO(data as ModificationQueryResult);
}

/**
 * Get paginated list of modifications for a specific recipe
 * @param supabase - Supabase client instance from context.locals
 * @param recipeId - UUID of the recipe to fetch modifications for
 * @param page - Page number (1-indexed)
 * @param limit - Number of results per page
 * @returns Object containing array of ModificationDTO and pagination metadata
 * @throws Error if database query fails
 */
export async function getModificationsByRecipeId(
  supabase: SupabaseClient,
  recipeId: string,
  page: number,
  limit: number
): Promise<{ modifications: ModificationDTO[]; pagination: PaginationDTO }> {
  // ========================================
  // BUILD QUERIES
  // ========================================

  // Count query - get total number of modifications for this recipe
  const countQuery = supabase
    .from("recipe_modifications")
    .select("*", { count: "exact", head: true })
    .eq("original_recipe_id", recipeId);

  // Data query - get paginated modifications ordered by creation date (newest first)
  const offset = (page - 1) * limit;
  const dataQuery = supabase
    .from("recipe_modifications")
    .select("*")
    .eq("original_recipe_id", recipeId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // ========================================
  // EXECUTE QUERIES IN PARALLEL
  // ========================================

  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

  if (countResult.error) {
    throw countResult.error;
  }

  if (dataResult.error) {
    throw dataResult.error;
  }

  const total = countResult.count || 0;
  const data = (dataResult.data || []) as ModificationQueryResult[];

  // ========================================
  // MAP TO DTOS
  // ========================================

  const modifications = data.map(mapToModificationDTO);

  // ========================================
  // CALCULATE PAGINATION METADATA
  // ========================================

  const totalPages = Math.ceil(total / limit);
  const pagination: PaginationDTO = {
    page,
    limit,
    total,
    totalPages,
  };

  return { modifications, pagination };
}

/**
 * Get modification by ID with original recipe information
 * Implements authorization check - user must own modification OR recipe must be public
 * @param supabase - Supabase client instance from context.locals
 * @param modificationId - UUID of the modification to fetch
 * @param userId - ID of the authenticated user
 * @returns ModificationDetailDTO if found and authorized, null otherwise
 * @throws Error if database query fails
 */
export async function getModificationById(
  supabase: SupabaseClient,
  modificationId: string,
  userId: string
): Promise<ModificationDetailDTO | null> {
  // ========================================
  // QUERY MODIFICATION WITH RECIPE JOIN
  // ========================================

  const { data, error } = await supabase
    .from("recipe_modifications")
    .select(
      `
      id,
      original_recipe_id,
      user_id,
      modification_type,
      modified_data,
      created_at,
      recipes:original_recipe_id (
        id,
        title,
        user_id,
        is_public,
        nutrition_per_serving
      )
    `
    )
    .eq("id", modificationId)
    .single();

  // ========================================
  // HANDLE ERRORS AND NOT FOUND
  // ========================================

  if (error || !data) {
    // Not found or query error - return null (404 will be returned)
    return null;
  }

  const modification = data as unknown as ModificationDetailQueryResult;

  // ========================================
  // AUTHORIZATION CHECK
  // ========================================

  // User can access modification if:
  // 1. User owns the modification, OR
  // 2. Recipe is public
  const isOwner = modification.user_id === userId;
  const isPublicRecipe = modification.recipes.is_public;

  if (!isOwner && !isPublicRecipe) {
    // User doesn't own modification AND recipe is private
    // Return null (will result in 404 for security - don't reveal existence)
    return null;
  }

  // ========================================
  // MAP TO DTO AND RETURN
  // ========================================

  return mapToModificationDetailDTO(modification);
}

// ============================================================================
// MOCK DATA GENERATION
// ============================================================================

/**
 * Generate mock modified recipe data based on modification type
 * For MVP, this simulates AI responses to avoid API costs during development
 * @param recipe - Original recipe to modify
 * @param command - Modification command with type and parameters
 * @returns ModificationDataDTO with mocked modifications
 */
function generateMockModification(recipe: RecipeDetailDTO, command: CreateModificationCommand): ModificationDataDTO {
  switch (command.modificationType) {
    case "reduce_calories":
      return generateMockReduceCalories(recipe, command.parameters);
    case "increase_calories":
      return generateMockIncreaseCalories(recipe, command.parameters);
    case "increase_protein":
      return generateMockIncreaseProtein(recipe, command.parameters);
    case "increase_fiber":
      return generateMockIncreaseFiber(recipe, command.parameters);
    case "portion_size":
      return generateMockPortionSize(recipe, command.parameters);
    case "ingredient_substitution":
      return generateMockIngredientSubstitution(recipe, command.parameters);
    default:
      throw new Error(`Unsupported modification type: ${command.modificationType}`);
  }
}

/**
 * Generate mock data for calorie reduction
 * Simulates AI adjusting ingredients and nutrition to reduce calories
 */
function generateMockReduceCalories(
  recipe: RecipeDetailDTO,
  parameters: { targetCalories?: number; reductionPercentage?: number }
): ModificationDataDTO {
  const originalCalories = recipe.nutritionPerServing.calories;

  // Calculate target calories
  let targetCalories: number;
  if (parameters.targetCalories !== undefined) {
    targetCalories = parameters.targetCalories;
  } else if (parameters.reductionPercentage !== undefined) {
    targetCalories = Math.round(originalCalories * (1 - parameters.reductionPercentage / 100));
  } else {
    targetCalories = originalCalories;
  }

  // Calculate reduction ratio
  const reductionRatio = targetCalories / originalCalories;

  // Adjust nutrition proportionally
  const modifiedNutrition: NutritionDTO = {
    calories: targetCalories,
    protein: Math.round(recipe.nutritionPerServing.protein * reductionRatio * 10) / 10,
    fat: Math.round(recipe.nutritionPerServing.fat * reductionRatio * 10) / 10,
    carbs: Math.round(recipe.nutritionPerServing.carbs * reductionRatio * 10) / 10,
    fiber: Math.round(recipe.nutritionPerServing.fiber * reductionRatio * 10) / 10,
    salt: Math.round(recipe.nutritionPerServing.salt * reductionRatio * 10) / 10,
  };

  // Copy ingredients and steps (in real AI, these would be modified)
  const modifiedIngredients = recipe.ingredients.map((ing) => ({ ...ing }));
  const modifiedSteps = recipe.steps.map((step) => ({ ...step }));

  const modificationNotes =
    `Zmniejszono kalorie z ${originalCalories} do ${targetCalories} kcal na porcję. ` +
    `Zmodyfikowano proporcje składników i zmniejszono ilości tłuszczów.`;

  return {
    ingredients: modifiedIngredients,
    steps: modifiedSteps,
    nutritionPerServing: modifiedNutrition,
    servings: recipe.servings,
    modificationNotes,
  };
}

/**
 * Generate mock data for calorie increase
 * Simulates AI adding ingredients to increase calories
 */
function generateMockIncreaseCalories(
  recipe: RecipeDetailDTO,
  parameters: { targetCalories?: number; increasePercentage?: number }
): ModificationDataDTO {
  const originalCalories = recipe.nutritionPerServing.calories;

  // Calculate target calories
  let targetCalories: number;
  if (parameters.targetCalories !== undefined) {
    targetCalories = parameters.targetCalories;
  } else if (parameters.increasePercentage !== undefined) {
    targetCalories = Math.round(originalCalories * (1 + parameters.increasePercentage / 100));
  } else {
    targetCalories = originalCalories;
  }

  // Calculate increase ratio
  const increaseRatio = targetCalories / originalCalories;

  // Adjust nutrition proportionally
  const modifiedNutrition: NutritionDTO = {
    calories: targetCalories,
    protein: Math.round(recipe.nutritionPerServing.protein * increaseRatio * 10) / 10,
    fat: Math.round(recipe.nutritionPerServing.fat * increaseRatio * 10) / 10,
    carbs: Math.round(recipe.nutritionPerServing.carbs * increaseRatio * 10) / 10,
    fiber: Math.round(recipe.nutritionPerServing.fiber * increaseRatio * 10) / 10,
    salt: Math.round(recipe.nutritionPerServing.salt * increaseRatio * 10) / 10,
  };

  const modifiedIngredients = recipe.ingredients.map((ing) => ({ ...ing }));
  const modifiedSteps = recipe.steps.map((step) => ({ ...step }));

  const modificationNotes =
    `Zwiększono kalorie z ${originalCalories} do ${targetCalories} kcal na porcję. ` +
    `Dodano więcej składników bogatych w zdrowe tłuszcze i węglowodany.`;

  return {
    ingredients: modifiedIngredients,
    steps: modifiedSteps,
    nutritionPerServing: modifiedNutrition,
    servings: recipe.servings,
    modificationNotes,
  };
}

/**
 * Generate mock data for protein increase
 * Simulates AI adding protein-rich ingredients
 */
function generateMockIncreaseProtein(
  recipe: RecipeDetailDTO,
  parameters: { targetProtein?: number; increasePercentage?: number }
): ModificationDataDTO {
  const originalProtein = recipe.nutritionPerServing.protein;

  // Calculate target protein
  let targetProtein: number;
  if (parameters.targetProtein !== undefined) {
    targetProtein = parameters.targetProtein;
  } else if (parameters.increasePercentage !== undefined) {
    targetProtein = Math.round(originalProtein * (1 + parameters.increasePercentage / 100) * 10) / 10;
  } else {
    targetProtein = originalProtein;
  }

  // Adjust nutrition (protein increases more than other macros)
  const proteinIncrease = targetProtein - originalProtein;
  const calorieIncrease = Math.round(proteinIncrease * 4); // 4 kcal per gram of protein

  const modifiedNutrition: NutritionDTO = {
    calories: recipe.nutritionPerServing.calories + calorieIncrease,
    protein: targetProtein,
    fat: recipe.nutritionPerServing.fat,
    carbs: recipe.nutritionPerServing.carbs,
    fiber: recipe.nutritionPerServing.fiber,
    salt: recipe.nutritionPerServing.salt,
  };

  const modifiedIngredients = recipe.ingredients.map((ing) => ({ ...ing }));
  const modifiedSteps = recipe.steps.map((step) => ({ ...step }));

  const modificationNotes =
    `Zwiększono białko z ${originalProtein}g do ${targetProtein}g na porcję. ` +
    `Dodano składniki bogate w białko, takie jak chude mięso, ryby, jajka lub rośliny strączkowe.`;

  return {
    ingredients: modifiedIngredients,
    steps: modifiedSteps,
    nutritionPerServing: modifiedNutrition,
    servings: recipe.servings,
    modificationNotes,
  };
}

/**
 * Generate mock data for fiber increase
 * Simulates AI adding high-fiber ingredients
 */
function generateMockIncreaseFiber(
  recipe: RecipeDetailDTO,
  parameters: { targetFiber?: number; increasePercentage?: number }
): ModificationDataDTO {
  const originalFiber = recipe.nutritionPerServing.fiber;

  // Calculate target fiber
  let targetFiber: number;
  if (parameters.targetFiber !== undefined) {
    targetFiber = parameters.targetFiber;
  } else if (parameters.increasePercentage !== undefined) {
    targetFiber = Math.round(originalFiber * (1 + parameters.increasePercentage / 100) * 10) / 10;
  } else {
    targetFiber = originalFiber;
  }

  // Adjust nutrition (adding fiber also adds some carbs and calories)
  const fiberIncrease = targetFiber - originalFiber;
  const carbIncrease = Math.round(fiberIncrease * 1.5 * 10) / 10; // Fiber-rich foods have carbs
  const calorieIncrease = Math.round(carbIncrease * 2); // Rough estimate

  const modifiedNutrition: NutritionDTO = {
    calories: recipe.nutritionPerServing.calories + calorieIncrease,
    protein: recipe.nutritionPerServing.protein,
    fat: recipe.nutritionPerServing.fat,
    carbs: recipe.nutritionPerServing.carbs + carbIncrease,
    fiber: targetFiber,
    salt: recipe.nutritionPerServing.salt,
  };

  const modifiedIngredients = recipe.ingredients.map((ing) => ({ ...ing }));
  const modifiedSteps = recipe.steps.map((step) => ({ ...step }));

  const modificationNotes =
    `Zwiększono błonnik z ${originalFiber}g do ${targetFiber}g na porcję. ` +
    `Dodano składniki bogate w błonnik, takie jak warzywa, owoce, pełne ziarna lub nasiona.`;

  return {
    ingredients: modifiedIngredients,
    steps: modifiedSteps,
    nutritionPerServing: modifiedNutrition,
    servings: recipe.servings,
    modificationNotes,
  };
}

/**
 * Generate mock data for portion size adjustment
 * Simulates adjusting recipe for different number of servings
 */
function generateMockPortionSize(recipe: RecipeDetailDTO, parameters: { newServings?: number }): ModificationDataDTO {
  const newServings = parameters.newServings || recipe.servings;
  const originalServings = recipe.servings;

  // Nutrition per serving stays the same
  const modifiedNutrition: NutritionDTO = { ...recipe.nutritionPerServing };

  // Copy ingredients and steps (in real AI, quantities would be scaled)
  const modifiedIngredients = recipe.ingredients.map((ing) => ({ ...ing }));
  const modifiedSteps = recipe.steps.map((step) => ({ ...step }));

  const modificationNotes =
    `Dostosowano przepis z ${originalServings} porcji do ${newServings} porcji. ` +
    `Wartości odżywcze na porcję pozostają bez zmian.`;

  return {
    ingredients: modifiedIngredients,
    steps: modifiedSteps,
    nutritionPerServing: modifiedNutrition,
    servings: newServings,
    modificationNotes,
  };
}

/**
 * Generate mock data for ingredient substitution
 * Simulates AI replacing one ingredient with another
 */
function generateMockIngredientSubstitution(
  recipe: RecipeDetailDTO,
  parameters: { originalIngredient?: string; preferredSubstitute?: string }
): ModificationDataDTO {
  const originalIngredient = parameters.originalIngredient || "nieznany składnik";
  const substitute = parameters.preferredSubstitute || "alternatywny składnik";

  // Copy ingredients (in real AI, the specific ingredient would be replaced)
  const modifiedIngredients = recipe.ingredients.map((ing) => ({ ...ing }));

  // Copy steps (in real AI, instructions might be updated)
  const modifiedSteps = recipe.steps.map((step) => ({ ...step }));

  // Adjust nutrition slightly (simulating difference between ingredients)
  const modifiedNutrition: NutritionDTO = {
    calories: Math.round(recipe.nutritionPerServing.calories * 0.95), // Slight reduction as example
    protein: Math.round(recipe.nutritionPerServing.protein * 1.05 * 10) / 10,
    fat: Math.round(recipe.nutritionPerServing.fat * 0.9 * 10) / 10,
    carbs: recipe.nutritionPerServing.carbs,
    fiber: Math.round(recipe.nutritionPerServing.fiber * 1.1 * 10) / 10,
    salt: recipe.nutritionPerServing.salt,
  };

  const modificationNotes =
    `Zastąpiono składnik "${originalIngredient}" składnikiem "${substitute}". ` +
    `Zmieniono wartości odżywcze, aby odzwierciedlić profil nowego składnika.`;

  return {
    ingredients: modifiedIngredients,
    steps: modifiedSteps,
    nutritionPerServing: modifiedNutrition,
    servings: recipe.servings,
    modificationNotes,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map database modification result to ModificationDTO
 * Converts snake_case to camelCase
 */
function mapToModificationDTO(dbModification: ModificationQueryResult): ModificationDTO {
  return {
    id: dbModification.id,
    originalRecipeId: dbModification.original_recipe_id,
    userId: dbModification.user_id,
    modificationType: dbModification.modification_type,
    modifiedData: dbModification.modified_data,
    createdAt: dbModification.created_at,
  };
}

/**
 * Map database modification detail result to ModificationDetailDTO
 * Converts snake_case to camelCase and structures nested recipe data
 */
function mapToModificationDetailDTO(dbModification: ModificationDetailQueryResult): ModificationDetailDTO {
  return {
    id: dbModification.id,
    originalRecipeId: dbModification.original_recipe_id,
    modificationType: dbModification.modification_type,
    modifiedData: dbModification.modified_data,
    originalRecipe: {
      id: dbModification.recipes.id,
      title: dbModification.recipes.title,
      nutritionPerServing: dbModification.recipes.nutrition_per_serving,
    },
    createdAt: dbModification.created_at,
  };
}
