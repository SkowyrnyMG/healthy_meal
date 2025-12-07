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
import { createChatCompletion, OpenRouterError, type JSONSchema } from "./openrouter.service";

// ============================================================================
// TYPES
// ============================================================================

/**
 * AI response structure for recipe modifications
 * Used with OpenRouter structured outputs
 */
interface AIModificationResponse {
  ingredients: RecipeIngredientDTO[];
  steps: RecipeStepDTO[];
  nutritionPerServing: NutritionDTO;
  servings: number;
  modificationNotes: string;
}

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
  // GENERATE AI-POWERED MODIFIED DATA
  // ========================================

  const modifiedData = await generateAIModification(recipe, command);

  // ========================================
  // INSERT MODIFICATION INTO DATABASE
  // ========================================

  const modificationInsert: DbModificationInsert = {
    original_recipe_id: recipe.id,
    user_id: userId,
    modification_type: command.modificationType,

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

/**
 * Delete a recipe modification
 * Implements authorization check to prevent IDOR attacks
 *
 * @param supabase - Supabase client instance from context.locals
 * @param modificationId - UUID of the modification to delete
 * @param userId - ID of the authenticated user
 * @throws Error if modification not found or user not authorized
 */
export async function deleteModification(
  supabase: SupabaseClient,
  modificationId: string,
  userId: string
): Promise<void> {
  // ========================================
  // QUERY MODIFICATION TO VERIFY EXISTENCE AND OWNERSHIP
  // ========================================

  const { data, error } = await supabase
    .from("recipe_modifications")
    .select("id, user_id")
    .eq("id", modificationId)
    .single();

  // ========================================
  // HANDLE NOT FOUND
  // ========================================

  if (error || !data) {
    throw new Error("Modification not found");
  }

  // ========================================
  // VERIFY OWNERSHIP (IDOR PROTECTION)
  // ========================================

  if (data.user_id !== userId) {
    throw new Error("You don't have permission to delete this modification");
  }

  // ========================================
  // DELETE MODIFICATION
  // ========================================

  const { error: deleteError } = await supabase
    .from("recipe_modifications")
    .delete()
    .eq("id", modificationId)
    .eq("user_id", userId); // Additional safety check

  if (deleteError) {
    throw deleteError;
  }
}

// ============================================================================
// AI-POWERED MODIFICATION GENERATION
// ============================================================================

/**
 * JSON schema for AI modification responses
 * Ensures structured, type-safe output from OpenRouter
 */
const MODIFICATION_RESPONSE_SCHEMA: JSONSchema = {
  name: "recipe_modification",
  strict: true,
  schema: {
    type: "object",
    properties: {
      ingredients: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            amount: { type: "number" },
            unit: { type: "string" },
          },
          required: ["name", "amount", "unit"],
          additionalProperties: false,
        },
      },
      steps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            stepNumber: { type: "number" },
            instruction: { type: "string" },
          },
          required: ["stepNumber", "instruction"],
          additionalProperties: false,
        },
      },
      nutritionPerServing: {
        type: "object",
        properties: {
          calories: { type: "number" },
          protein: { type: "number" },
          fat: { type: "number" },
          carbs: { type: "number" },
          fiber: { type: "number" },
          salt: { type: "number" },
        },
        required: ["calories", "protein", "fat", "carbs", "fiber", "salt"],
        additionalProperties: false,
      },
      servings: { type: "number" },
      modificationNotes: { type: "string" },
    },
    required: ["ingredients", "steps", "nutritionPerServing", "servings", "modificationNotes"],
    additionalProperties: false,
  },
};

/**
 * Generate AI-powered modified recipe data using OpenRouter
 * @param recipe - Original recipe to modify
 * @param command - Modification command with type and parameters
 * @returns ModificationDataDTO with AI-generated modifications
 * @throws Error if OpenRouter API call fails
 */
async function generateAIModification(
  recipe: RecipeDetailDTO,
  command: CreateModificationCommand
): Promise<ModificationDataDTO> {
  // ========================================
  // BUILD PROMPT BASED ON MODIFICATION TYPE
  // ========================================

  const { systemMessage, userMessage } = buildModificationPrompt(recipe, command);

  // ========================================
  // CALL OPENROUTER API
  // ========================================

  try {
    const response = await createChatCompletion<AIModificationResponse>({
      model: "openai/gpt-4o-mini",
      systemMessage,
      userMessage,
      responseSchema: MODIFICATION_RESPONSE_SCHEMA,
      parameters: {
        temperature: 0.7,
        max_tokens: 2000,
      },
    });

    // ========================================
    // RETURN STRUCTURED RESPONSE
    // ========================================

    return response.content;
  } catch (error) {
    // ========================================
    // HANDLE OPENROUTER ERRORS
    // ========================================

    if (error instanceof OpenRouterError) {
      // Log error for debugging
      console.error("OpenRouter API error:", {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      });

      // Provide user-friendly error messages
      switch (error.code) {
        case "INSUFFICIENT_CREDITS":
          throw new Error("AI service credits exhausted. Please contact support.");
        case "RATE_LIMIT_EXCEEDED":
          throw new Error("Too many modification requests. Please try again in a moment.");
        case "MODERATION_FLAGGED":
          throw new Error("Recipe content was flagged. Please review the recipe.");
        default:
          throw new Error(`Failed to generate modification: ${error.message}`);
      }
    }

    // Unknown error
    console.error("Unexpected error during AI modification:", error);
    throw new Error("An unexpected error occurred while modifying the recipe.");
  }
}

/**
 * Build system and user prompts for AI modification based on type
 * @param recipe - Original recipe
 * @param command - Modification command
 * @returns Object with systemMessage and userMessage
 */
function buildModificationPrompt(
  recipe: RecipeDetailDTO,
  command: CreateModificationCommand
): { systemMessage: string; userMessage: string } {
  const systemMessage =
    "You are an expert nutritionist and chef who modifies recipes to meet specific dietary goals " +
    "while maintaining taste, quality, and culinary authenticity. " +
    "Provide accurate nutrition calculations and clear modification notes explaining your changes. " +
    "IMPORTANT: You MUST respond in Polish language. All ingredient names, instructions, and notes must be in Polish.";

  let userMessage = "";
  const originalNutrition = recipe.nutritionPerServing;

  switch (command.modificationType) {
    case "reduce_calories":
      userMessage = buildReduceCaloriesPrompt(recipe, command.parameters, originalNutrition);
      break;
    case "increase_calories":
      userMessage = buildIncreaseCaloriesPrompt(recipe, command.parameters, originalNutrition);
      break;
    case "increase_protein":
      userMessage = buildIncreaseProteinPrompt(recipe, command.parameters, originalNutrition);
      break;
    case "increase_fiber":
      userMessage = buildIncreaseFiberPrompt(recipe, command.parameters, originalNutrition);
      break;
    case "portion_size":
      userMessage = buildPortionSizePrompt(recipe, command.parameters);
      break;
    case "ingredient_substitution":
      userMessage = buildIngredientSubstitutionPrompt(recipe, command.parameters);
      break;
    default:
      throw new Error(`Unsupported modification type: ${command.modificationType}`);
  }

  return { systemMessage, userMessage };
}

/**
 * Build prompt for calorie reduction modification
 */
function buildReduceCaloriesPrompt(
  recipe: RecipeDetailDTO,
  parameters: { targetCalories?: number; reductionPercentage?: number },
  originalNutrition: NutritionDTO
): string {
  const originalCalories = originalNutrition.calories;

  // Calculate target calories
  let targetCalories: number;
  if (parameters.targetCalories !== undefined) {
    targetCalories = parameters.targetCalories;
  } else if (parameters.reductionPercentage !== undefined) {
    targetCalories = Math.round(originalCalories * (1 - parameters.reductionPercentage / 100));
  } else {
    targetCalories = Math.round(originalCalories * 0.8); // Default 20% reduction
  }

  return `Zmodyfikuj ten przepis, aby zmniejszyć kalorie z ${originalCalories} do ${targetCalories} kcal na porcję.

ORYGINALNY PRZEPIS:
Tytuł: ${recipe.title}
Porcje: ${recipe.servings}

Składniki:
${recipe.ingredients.map((ing) => `- ${ing.amount} ${ing.unit} ${ing.name}`).join("\n")}

Kroki przygotowania:
${recipe.steps.map((step) => `${step.stepNumber}. ${step.instruction}`).join("\n")}

Obecne wartości odżywcze (na porcję):
- Kalorie: ${originalNutrition.calories} kcal
- Białko: ${originalNutrition.protein}g
- Tłuszcz: ${originalNutrition.fat}g
- Węglowodany: ${originalNutrition.carbs}g
- Błonnik: ${originalNutrition.fiber}g
- Sól: ${originalNutrition.salt}g

INSTRUKCJE:
1. Zmodyfikuj składniki, aby zmniejszyć kalorie do około ${targetCalories} kcal na porcję
2. Dostosuj metody gotowania, jeśli trzeba zmniejszyć tłuszcz/olej
3. Zaktualizuj wartości odżywcze dokładnie na podstawie swoich zmian
4. Podaj jasne notatki wyjaśniające, co zmieniłeś i dlaczego
5. Zachowaj tę samą liczbę porcji: ${recipe.servings}
6. Dbaj o to, aby przepis był smaczny i satysfakcjonujący

WAŻNE: Wszystkie składniki, instrukcje i notatki MUSZĄ być po polsku!`;
}

/**
 * Helper function to format recipe details for AI prompts
 */
function formatRecipeForPrompt(recipe: RecipeDetailDTO): string {
  return `Title: ${recipe.title}
Servings: ${recipe.servings}

Ingredients:
${recipe.ingredients.map((ing) => `- ${ing.amount} ${ing.unit} ${ing.name}`).join("\n")}

Steps:
${recipe.steps.map((step) => `${step.stepNumber}. ${step.instruction}`).join("\n")}

Current Nutrition (per serving):
- Calories: ${recipe.nutritionPerServing.calories} kcal
- Protein: ${recipe.nutritionPerServing.protein}g
- Fat: ${recipe.nutritionPerServing.fat}g
- Carbs: ${recipe.nutritionPerServing.carbs}g
- Fiber: ${recipe.nutritionPerServing.fiber}g
- Salt: ${recipe.nutritionPerServing.salt}g`;
}

/**
 * Build prompt for calorie increase modification
 */
function buildIncreaseCaloriesPrompt(
  recipe: RecipeDetailDTO,
  parameters: { targetCalories?: number; increasePercentage?: number },
  originalNutrition: NutritionDTO
): string {
  const originalCalories = originalNutrition.calories;
  const targetCalories =
    parameters.targetCalories ||
    (parameters.increasePercentage
      ? Math.round(originalCalories * (1 + parameters.increasePercentage / 100))
      : Math.round(originalCalories * 1.2));

  return `Zmodyfikuj ten przepis, aby ZWIĘKSZYĆ kalorie z ${originalCalories} do ${targetCalories} kcal na porcję, dodając składniki bogate w wartości odżywcze.

ORYGINALNY PRZEPIS:
${formatRecipeForPrompt(recipe)}

INSTRUKCJE:
- Zwiększ kalorie do około ${targetCalories} kcal na porcję
- Dodaj zdrowe tłuszcze, złożone węglowodany lub składniki bogate w białko
- Zaktualizuj wartości odżywcze dokładnie
- Podaj jasne notatki wyjaśniające zmiany
- Zachowaj liczbę porcji: ${recipe.servings}

WAŻNE: Wszystkie składniki, instrukcje i notatki MUSZĄ być po polsku!`;
}

/**
 * Build prompt for protein increase modification
 */
function buildIncreaseProteinPrompt(
  recipe: RecipeDetailDTO,
  parameters: { targetProtein?: number; increasePercentage?: number },
  originalNutrition: NutritionDTO
): string {
  const originalProtein = originalNutrition.protein;
  const targetProtein =
    parameters.targetProtein ||
    (parameters.increasePercentage
      ? Math.round(originalProtein * (1 + parameters.increasePercentage / 100) * 10) / 10
      : Math.round(originalProtein * 1.3 * 10) / 10);

  return `Zmodyfikuj ten przepis, aby ZWIĘKSZYĆ białko z ${originalProtein}g do ${targetProtein}g na porcję.

ORYGINALNY PRZEPIS:
${formatRecipeForPrompt(recipe)}

INSTRUKCJE:
- Zwiększ białko do około ${targetProtein}g na porcję
- Dodaj chude mięso, ryby, jajka, rośliny strączkowe lub nabiał
- Zaktualizuj wszystkie wartości odżywcze dokładnie (pamiętaj: 4 kcal na gram białka)
- Podaj jasne notatki o modyfikacji
- Zachowaj liczbę porcji: ${recipe.servings}

WAŻNE: Wszystkie składniki, instrukcje i notatki MUSZĄ być po polsku!`;
}

/**
 * Build prompt for fiber increase modification
 */
function buildIncreaseFiberPrompt(
  recipe: RecipeDetailDTO,
  parameters: { targetFiber?: number; increasePercentage?: number },
  originalNutrition: NutritionDTO
): string {
  const originalFiber = originalNutrition.fiber;
  const targetFiber =
    parameters.targetFiber ||
    (parameters.increasePercentage
      ? Math.round(originalFiber * (1 + parameters.increasePercentage / 100) * 10) / 10
      : Math.round(originalFiber * 1.5 * 10) / 10);

  return `Zmodyfikuj ten przepis, aby ZWIĘKSZYĆ błonnik z ${originalFiber}g do ${targetFiber}g na porcję.

ORYGINALNY PRZEPIS:
${formatRecipeForPrompt(recipe)}

INSTRUKCJE:
- Zwiększ błonnik do około ${targetFiber}g na porcję
- Dodaj warzywa, owoce, pełne ziarna, nasiona lub rośliny strączkowe
- Zaktualizuj wartości odżywcze (żywność bogata w błonnik dodaje też węglowodany)
- Podaj jasne notatki o modyfikacji
- Zachowaj liczbę porcji: ${recipe.servings}

WAŻNE: Wszystkie składniki, instrukcje i notatki MUSZĄ być po polsku!`;
}

/**
 * Build prompt for portion size adjustment
 */
function buildPortionSizePrompt(recipe: RecipeDetailDTO, parameters: { newServings?: number }): string {
  const newServings = parameters.newServings || recipe.servings;

  return `Dostosuj ten przepis z ${recipe.servings} porcji do ${newServings} porcji.

ORYGINALNY PRZEPIS:
${formatRecipeForPrompt(recipe)}

INSTRUKCJE:
- Przeskaluj ilości składników proporcjonalnie dla ${newServings} porcji
- Zachowaj wartości odżywcze na porcję bez zmian
- Dostosuj czasy/metody gotowania, jeśli potrzeba dla innej wielkości porcji
- Podaj notatki wyjaśniające przeskalowanie

WAŻNE: Wszystkie składniki, instrukcje i notatki MUSZĄ być po polsku!`;
}

/**
 * Build prompt for ingredient substitution
 */
function buildIngredientSubstitutionPrompt(
  recipe: RecipeDetailDTO,
  parameters: { originalIngredient?: string; preferredSubstitute?: string }
): string {
  const originalIng = parameters.originalIngredient || "specified ingredient";
  const substitute = parameters.preferredSubstitute || "suitable alternative";

  return `Zmodyfikuj ten przepis, zastępując "${originalIng}" składnikiem "${substitute}".

ORYGINALNY PRZEPIS:
${formatRecipeForPrompt(recipe)}

INSTRUKCJE:
- Zastąp "${originalIng}" składnikiem "${substitute}"
- Dostosuj ilości, aby zachować smak i teksturę
- Zaktualizuj instrukcje gotowania, jeśli potrzeba
- Przelicz wartości odżywcze na podstawie zamiany
- Podaj szczegółowe notatki wyjaśniające zamianę i jej wpływ

WAŻNE: Wszystkie składniki, instrukcje i notatki MUSZĄ być po polsku!`;
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
