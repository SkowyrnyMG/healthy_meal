# REST API Plan - HealthyMeal

## 1. Resources

| Resource               | Database Table              | Description                                             |
| ---------------------- | --------------------------- | ------------------------------------------------------- |
| Profile                | `profiles`                  | User profile with dietary preferences and physical data |
| Allergen               | `allergens`                 | Predefined allergen reference data                      |
| UserAllergen           | `user_allergens`            | User's selected allergens                               |
| DislikedIngredient     | `user_disliked_ingredients` | User's disliked ingredients                             |
| Tag                    | `tags`                      | Recipe category tags (15-20 predefined)                 |
| Recipe                 | `recipes`                   | User recipes with ingredients, steps, and nutrition     |
| RecipeTag              | `recipe_tags`               | Recipe categorization                                   |
| Modification           | `recipe_modifications`      | AI-generated recipe modifications                       |
| Favorite               | `favorites`                 | User's favorite recipes                                 |
| Collection             | `collections`               | User-created recipe collections                         |
| CollectionRecipe       | `collection_recipes`        | Recipes within collections                              |
| Rating                 | `recipe_ratings`            | User ratings and cooking status                         |
| MealPlan               | `meal_plans`                | Meal planning calendar entries                          |
| IngredientSubstitution | `ingredient_substitutions`  | Knowledge base for ingredient alternatives              |

## 2. Endpoints

### 2.1 Authentication

## Skip for now.

### 2.2 User Profile Management

#### GET /api/profile

**Description**: Get current user's profile

**Authentication**: Required

**Response** (200 OK):

```json
{
  "userId": "uuid",
  "weight": 75.5,
  "age": 28,
  "gender": "male",
  "activityLevel": "moderately_active",
  "dietType": "high_protein",
  "targetGoal": "lose_weight",
  "targetValue": 5.0,
  "createdAt": "2025-10-11T12:00:00Z",
  "updatedAt": "2025-10-11T12:00:00Z"
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 404 Not Found: Profile not found

#### PUT /api/profile

**Description**: Update user profile

**Authentication**: Required

**Request Payload**:

```json
{
  "weight": 75.5,
  "age": 28,
  "gender": "male",
  "activityLevel": "moderately_active",
  "dietType": "high_protein",
  "targetGoal": "lose_weight",
  "targetValue": 5.0
}
```

**Validation**:

- `weight`: 40-200 (DECIMAL)
- `age`: 13-100 (INTEGER)
- `gender`: "male" | "female" | "other" | "prefer_not_to_say"
- `activityLevel`: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extremely_active"
- `dietType`: "high_protein" | "keto" | "vegetarian" | "weight_gain" | "weight_loss" | "balanced"
- `targetGoal`: "lose_weight" | "gain_weight" | "maintain_weight"
- `targetValue`: DECIMAL (target weight change in kg)

**Response** (200 OK):

```json
{
  "success": true,
  "profile": {
    "userId": "uuid",
    "weight": 75.5,
    "age": 28,
    "gender": "male",
    "activityLevel": "moderately_active",
    "dietType": "high_protein",
    "targetGoal": "lose_weight",
    "targetValue": 5.0,
    "updatedAt": "2025-10-11T12:30:00Z"
  }
}
```

**Error Responses**:

- 400 Bad Request: Validation failed
- 401 Unauthorized: Not authenticated

#### GET /api/profile/allergens

**Description**: Get user's selected allergens

**Authentication**: Required

**Response** (200 OK):

```json
{
  "allergens": [
    {
      "id": "uuid",
      "name": "Gluten",
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ]
}
```

**Error Responses**:

- 404 Not Found: Allergen not found
- 401 Unauthorized: Not authenticated

#### POST /api/profile/allergens

**Description**: Add allergen to user profile

**Authentication**: Required

**Request Payload**:

```json
{
  "allergenId": "uuid"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "allergen": {
    "id": "uuid",
    "name": "Gluten",
    "createdAt": "2025-10-11T12:00:00Z"
  }
}
```

**Error Responses**:

- 400 Bad Request: Invalid allergen ID
- 409 Conflict: Allergen already added

#### DELETE /api/profile/allergens/{allergenId}

**Description**: Remove allergen from user profile

**Authentication**: Required

**Response** (204 No Content)

**Error Responses**:

- 404 Not Found: Allergen not in user's list
- 401 Unauthorized: Not authenticated

#### GET /api/profile/disliked-ingredients

**Description**: Get user's disliked ingredients

**Authentication**: Required

**Response** (200 OK):

```json
{
  "dislikedIngredients": [
    {
      "id": "uuid",
      "ingredientName": "cebula",
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ]
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated

#### POST /api/profile/disliked-ingredients

**Description**: Add disliked ingredient

**Authentication**: Required

**Request Payload**:

```json
{
  "ingredientName": "cebula"
}
```

**Validation**:

- `ingredientName`: 1-100 characters, trimmed

**Response** (201 Created):

```json
{
  "success": true,
  "dislikedIngredient": {
    "id": "uuid",
    "ingredientName": "cebula",
    "createdAt": "2025-10-11T12:00:00Z"
  }
}
```

**Error Responses**:

- 400 Bad Request: Invalid ingredient name
- 409 Conflict: Ingredient already in disliked list
- 401 Unauthorized: Not authenticated

#### DELETE /api/profile/disliked-ingredients/{id}

**Description**: Remove disliked ingredient

**Authentication**: Required

**Response** (204 No Content)

**Error Responses**:

- 404 Not Found: Ingredient not in disliked list
- 401 Unauthorized: Not authenticated

---

### 2.3 Reference Data

#### GET /api/tags

**Description**: Get all recipe tags (publicly accessible)

**Authentication**: Optional

**Response** (200 OK):

```json
{
  "tags": [
    {
      "id": "uuid",
      "name": "Śniadanie",
      "slug": "sniadanie",
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ]
}
```

#### GET /api/allergens

**Description**: Get all allergens (publicly accessible)

**Authentication**: Optional

**Response** (200 OK):

```json
{
  "allergens": [
    {
      "id": "uuid",
      "name": "Gluten",
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ]
}
```

---

### 2.4 Recipe Management

#### GET /api/recipes

**Description**: List user's recipes with search and filtering

**Authentication**: Required

**Query Parameters**:

- `search` (string): Full-text search in title and description (uses Polish text search)
- `tags` (string): Comma-separated tag IDs
- `maxCalories` (number): Maximum calories per serving
- `maxPrepTime` (number): Maximum preparation time in minutes
- `isPublic` (boolean): Filter by public/private status
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20, max: 100)
- `sortBy` (string): "createdAt" | "updatedAt" | "title" | "prepTime" (default: "createdAt")
- `sortOrder` (string): "asc" | "desc" (default: "desc")

**Validation**:

- `search`: Optional, 1-255 characters, trimmed
- `tags`: Optional, comma-separated UUIDs (each UUID validated)
- `maxCalories`: Optional, positive number (min: 1, max: 10000)
- `maxPrepTime`: Optional, positive integer (min: 1, max: 1440)
- `isPublic`: Optional, boolean (parsed from string "true"/"false")
- `page`: Optional, positive integer (min: 1, default: 1)
- `limit`: Optional, positive integer (min: 1, max: 100, default: 20)
- `sortBy`: Optional, enum: "createdAt" | "updatedAt" | "title" | "prepTime" (default: "createdAt")
- `sortOrder`: Optional, enum: "asc" | "desc" (default: "desc")

**Response** (200 OK):

```json
{
  "recipes": [
    {
      "id": "uuid",
      "userId": "uuid",
      "title": "Placki ziemniaczane",
      "description": "Tradycyjne polskie placki",
      "servings": 4,
      "prepTimeMinutes": 30,
      "isPublic": false,
      "featured": false,
      "nutritionPerServing": {
        "calories": 450,
        "protein": 12,
        "fat": 15,
        "carbs": 60,
        "fiber": 6,
        "salt": 1.5
      },
      "tags": [
        {
          "id": "uuid",
          "name": "Obiad",
          "slug": "obiad"
        }
      ],
      "createdAt": "2025-10-11T12:00:00Z",
      "updatedAt": "2025-10-11T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Error Responses**:

- 400 Bad Request: Invalid query parameters
- 401 Unauthorized: Not authenticated

#### GET /api/recipes/public

**Description**: Browse public recipes from all users

**Authentication**: Required

**Query Parameters**: Same as GET /api/recipes (except `isPublic` is always true)

**Validation**:

- `search`: Optional, 1-255 characters, trimmed
- `tags`: Optional, comma-separated UUIDs (each UUID validated)
- `maxCalories`: Optional, positive number (min: 1, max: 10000)
- `maxPrepTime`: Optional, positive integer (min: 1, max: 1440)
- `page`: Optional, positive integer (min: 1, default: 1)
- `limit`: Optional, positive integer (min: 1, max: 100, default: 20)
- `sortBy`: Optional, enum: "createdAt" | "updatedAt" | "title" | "prepTime" (default: "createdAt")
- `sortOrder`: Optional, enum: "asc" | "desc" (default: "desc")

**Response**: Same structure as GET /api/recipes

**Error Responses**:

- 400 Bad Request: Invalid query parameters
- 401 Unauthorized: Not authenticated

#### POST /api/recipes

**Description**: Create new recipe

**Authentication**: Required

**Request Payload**:

```json
{
  "title": "Placki ziemniaczane",
  "description": "Tradycyjne polskie placki",
  "ingredients": [
    {
      "name": "ziemniaki",
      "amount": 1000,
      "unit": "g"
    },
    {
      "name": "jajka",
      "amount": 2,
      "unit": "sztuki"
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "Obrać i zetrzeć ziemniaki na tarce"
    },
    {
      "stepNumber": 2,
      "instruction": "Dodać jajka i wymieszać"
    }
  ],
  "servings": 4,
  "nutritionPerServing": {
    "calories": 450,
    "protein": 12,
    "fat": 15,
    "carbs": 60,
    "fiber": 6,
    "salt": 1.5
  },
  "prepTimeMinutes": 30,
  "isPublic": false,
  "tagIds": ["uuid1", "uuid2"]
}
```

**Validation**:

- `title`: Required, 1-255 characters
- `description`: Optional, text
- `ingredients`: Required, array of objects with `name` (string), `amount` (number), `unit` (string)
- `steps`: Required, array of objects with `stepNumber` (number), `instruction` (string)
- `servings`: Required, integer > 0
- `nutritionPerServing`: Required, object with required fields: `calories`, `protein`, `fat`, `carbs`, `fiber`, `salt` (all numbers)
- `prepTimeMinutes`: Optional, integer > 0
- `isPublic`: Optional, boolean (default: false)
- `tagIds`: Optional, array of valid tag UUIDs

**Response** (201 Created):

```json
{
  "success": true,
  "recipe": {
    "id": "uuid",
    "userId": "uuid",
    "title": "Placki ziemniaczane",
    "description": "Tradycyjne polskie placki",
    "ingredients": [...],
    "steps": [...],
    "servings": 4,
    "nutritionPerServing": {...},
    "prepTimeMinutes": 30,
    "isPublic": false,
    "featured": false,
    "createdAt": "2025-10-11T12:00:00Z",
    "updatedAt": "2025-10-11T12:00:00Z"
  }
}
```

**Error Responses**:

- 400 Bad Request: Validation failed
- 401 Unauthorized: Not authenticated

#### GET /api/recipes/{recipeId}

**Description**: Get recipe details (must be owner or recipe must be public)

**Authentication**: Required

**Response** (200 OK):

```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "Placki ziemniaczane",
  "description": "Tradycyjne polskie placki",
  "ingredients": [
    {
      "name": "ziemniaki",
      "amount": 1000,
      "unit": "g"
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "Obrać i zetrzeć ziemniaki na tarce"
    }
  ],
  "servings": 4,
  "nutritionPerServing": {
    "calories": 450,
    "protein": 12,
    "fat": 15,
    "carbs": 60,
    "fiber": 6,
    "salt": 1.5
  },
  "prepTimeMinutes": 30,
  "isPublic": false,
  "featured": false,
  "tags": [
    {
      "id": "uuid",
      "name": "Obiad",
      "slug": "obiad"
    }
  ],
  "createdAt": "2025-10-11T12:00:00Z",
  "updatedAt": "2025-10-11T12:00:00Z"
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: Recipe is private and user is not the owner
- 404 Not Found: Recipe not found

#### PUT /api/recipes/{recipeId}

**Description**: Update recipe (must be owner)

**Authentication**: Required

**Request Payload**: Same as POST /api/recipes

**Response** (200 OK): Same structure as POST response

**Error Responses**:

- 400 Bad Request: Validation failed
- 401 Unauthorized: Not authenticated
- 403 Forbidden: User is not the owner
- 404 Not Found: Recipe not found

#### DELETE /api/recipes/{recipeId}

**Description**: Delete recipe (must be owner)

**Authentication**: Required

**Response** (204 No Content)

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: User is not the owner
- 404 Not Found: Recipe not found

---

### 2.5 Recipe Modifications (AI)

#### POST /api/recipes/{recipeId}/modifications

**Description**: Create AI-powered recipe modification

**Authentication**: Required

**Rate Limiting**: 10 requests per minute per user

**Request Payload**:

```json
{
  "modificationType": "reduce_calories",
  "parameters": {
    "targetCalories": 350
  }
}
```

**Modification Types and Parameters**:

1. `reduce_calories`: `{ targetCalories: number }` or `{ reductionPercentage: number }`
2. `increase_calories`: `{ targetCalories: number }` or `{ increasePercentage: number }`
3. `increase_protein`: `{ targetProtein: number }` or `{ increasePercentage: number }`
4. `increase_fiber`: `{ targetFiber: number }` or `{ increasePercentage: number }`
5. `portion_size`: `{ newServings: number }`
6. `ingredient_substitution`: `{ originalIngredient: string, preferredSubstitute?: string }`

**Validation**:

- `modificationType`: One of: "reduce_calories", "increase_calories", "increase_protein", "increase_fiber", "portion_size", "ingredient_substitution"
- `parameters`: Object matching the modification type requirements

**Response** (201 Created):

```json
{
  "success": true,
  "modification": {
    "id": "uuid",
    "originalRecipeId": "uuid",
    "userId": "uuid",
    "modificationType": "reduce_calories",
    "modifiedData": {
      "ingredients": [...],
      "steps": [...],
      "nutritionPerServing": {
        "calories": 350,
        "protein": 12,
        "fat": 10,
        "carbs": 50,
        "fiber": 6,
        "salt": 1.2
      },
      "servings": 4,
      "modificationNotes": "Zmniejszono kalorie przez zastąpienie masła oliwą z oliwek i zmniejszenie ilości ziemniaków"
    },
    "createdAt": "2025-10-11T12:00:00Z"
  }
}
```

**Error Responses**:

- 400 Bad Request: Invalid modification type or parameters
- 401 Unauthorized: Not authenticated
- 403 Forbidden: Recipe is not accessible to user
- 404 Not Found: Recipe not found
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: AI processing failed
- 504 Gateway Timeout: AI processing took longer than 5 seconds

#### GET /api/recipes/{recipeId}/modifications

**Description**: List all modifications for a recipe

**Authentication**: Required

**Query Parameters**:

- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20)

**Response** (200 OK):

```json
{
  "modifications": [
    {
      "id": "uuid",
      "originalRecipeId": "uuid",
      "modificationType": "reduce_calories",
      "modifiedData": {
        "nutritionPerServing": {...},
        "modificationNotes": "..."
      },
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: Recipe is not accessible to user
- 404 Not Found: Recipe not found

#### GET /api/modifications/{modificationId}

**Description**: Get specific modification details

**Authentication**: Required

**Response** (200 OK):

```json
{
  "id": "uuid",
  "originalRecipeId": "uuid",
  "modificationType": "reduce_calories",
  "modifiedData": {
    "ingredients": [...],
    "steps": [...],
    "nutritionPerServing": {...},
    "servings": 4,
    "modificationNotes": "..."
  },
  "originalRecipe": {
    "id": "uuid",
    "title": "Placki ziemniaczane",
    "nutritionPerServing": {...}
  },
  "createdAt": "2025-10-11T12:00:00Z"
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: Modification belongs to another user
- 404 Not Found: Modification not found

#### DELETE /api/modifications/{modificationId}

**Description**: Delete modification

**Authentication**: Required

**Response** (204 No Content)

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: Modification belongs to another user
- 404 Not Found: Modification not found

---

### 2.6 Ingredient Substitutions

#### GET /api/ingredient-substitutions

**Description**: Get ingredient substitution suggestions

**Authentication**: Required

**Query Parameters**:

- `ingredient` (string): Required, ingredient name to find substitutions for
- `healthierOnly` (boolean): Only show healthier alternatives (default: false)

**Validation**:

- `ingredient`: Required, 1-100 characters, trimmed
- `healthierOnly`: Optional, boolean (parsed from string "true"/"false", default: false)

  **Response** (200 OK):

```json
{
  "originalIngredient": "masło",
  "substitutions": [
    {
      "id": "uuid",
      "substituteIngredient": "oliwa z oliwek",
      "nutritionComparison": {
        "original": {
          "calories": 717,
          "protein": 0.9,
          "fat": 81,
          "carbs": 0.1
        },
        "substitute": {
          "calories": 884,
          "protein": 0,
          "fat": 100,
          "carbs": 0
        }
      },
      "healthier": true,
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ]
}
```

**Error Responses**:

- 400 Bad Request: Missing ingredient parameter
- 401 Unauthorized: Not authenticated
- 404 Not Found: No substitutions found (will trigger AI fallback)

---

### 2.7 Favorites

#### GET /api/favorites

**Description**: List user's favorite recipes

**Authentication**: Required

**Query Parameters**:

- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20)

**Validation**:

- `page`: Optional, positive integer (min: 1, default: 1)
- `limit`: Optional, positive integer (min: 1, max: 100, default: 20)

**Response** (200 OK):

```json
{
  "favorites": [
    {
      "recipeId": "uuid",
      "recipe": {
        "id": "uuid",
        "title": "Placki ziemniaczane",
        "description": "...",
        "nutritionPerServing": {...},
        "prepTimeMinutes": 30
      },
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated

#### POST /api/favorites

**Description**: Add recipe to favorites

**Authentication**: Required

**Request Payload**:

```json
{
  "recipeId": "uuid"
}
```

**Validation**:

- `recipeId`: Required, valid UUID

**Response** (201 Created):

```json
{
  "success": true,
  "favorite": {
    "recipeId": "uuid",
    "createdAt": "2025-10-11T12:00:00Z"
  }
}
```

**Error Responses**:

- 400 Bad Request: Invalid recipe ID
- 401 Unauthorized: Not authenticated
- 403 Forbidden: Recipe belongs to another user
- 404 Not Found: Recipe not found or not accessible
- 409 Conflict: Recipe already in favorites

#### DELETE /api/favorites/{recipeId}

**Description**: Remove recipe from favorites

**Authentication**: Required

**Response** (204 No Content)

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: Recipe belongs to another user
- 404 Not Found: Recipe not found or not accessible
- 404 Not Found: Recipe not in favorites

---

### 2.8 Collections

#### GET /api/collections

**Description**: List user's collections

**Authentication**: Required

**Response** (200 OK):

```json
{
  "collections": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "Szybkie kolacje",
      "recipeCount": 8,
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ]
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated

#### POST /api/collections

**Description**: Create new collection

**Authentication**: Required

**Request Payload**:

```json
{
  "name": "Szybkie kolacje"
}
```

**Validation**:

- `name`: Required, 1-100 characters, unique per user

**Response** (201 Created):

```json
{
  "success": true,
  "collection": {
    "id": "uuid",
    "userId": "uuid",
    "name": "Szybkie kolacje",
    "recipeCount": 0,
    "createdAt": "2025-10-11T12:00:00Z"
  }
}
```

**Error Responses**:

- 400 Bad Request: Invalid name
- 401 Unauthorized: Not authenticated
- 409 Conflict: Collection with this name already exists

#### GET /api/collections/{collectionId}

**Description**: Get collection with recipes

**Authentication**: Required

**Query Parameters**:

- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20)

**Validation**:

- `page`: Optional, positive integer (min: 1, default: 1)
- `limit`: Optional, positive integer (min: 1, max: 100, default: 20)

**Response** (200 OK):

```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Szybkie kolacje",
  "recipes": [
    {
      "recipeId": "uuid",
      "recipe": {
        "id": "uuid",
        "title": "Placki ziemniaczane",
        "description": "...",
        "nutritionPerServing": {...}
      },
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1
  },
  "createdAt": "2025-10-11T12:00:00Z"
}
```

**Error Responses**:

- 400 Bad Request: Invalid query parameters
- 401 Unauthorized: Not authenticated
- 403 Forbidden: Collection belongs to another user
- 404 Not Found: Collection not found

#### PUT /api/collections/{collectionId}

**Description**: Update collection name

**Authentication**: Required

**Request Payload**:

```json
{
  "name": "Szybkie i zdrowe kolacje"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "collection": {
    "id": "uuid",
    "name": "Szybkie i zdrowe kolacje",
    "updatedAt": "2025-10-11T12:30:00Z"
  }
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: Collection belongs to another user
- 404 Not Found: Collection not found
- 409 Conflict: Collection with this name already exists

#### DELETE /api/collections/{collectionId}

**Description**: Delete collection

**Authentication**: Required

**Response** (204 No Content)

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: Collection belongs to another user
- 404 Not Found: Collection not found

#### POST /api/collections/{collectionId}/recipes

**Description**: Add recipe to collection

**Authentication**: Required

**Request Payload**:

```json
{
  "recipeId": "uuid"
}
```

**Validation**:

- `recipeId`: Required, valid UUID

**Response** (201 Created):

```json
{
  "success": true,
  "collectionRecipe": {
    "collectionId": "uuid",
    "recipeId": "uuid",
    "createdAt": "2025-10-11T12:00:00Z"
  }
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: Collection belongs to another user
- 404 Not Found: Collection or recipe not found
- 409 Conflict: Recipe already in collection

#### DELETE /api/collections/{collectionId}/recipes/{recipeId}

**Description**: Remove recipe from collection

**Authentication**: Required

**Response** (204 No Content)

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: Collection belongs to another user
- 404 Not Found: Recipe not in collection

---

### 2.9 Recipe Ratings

#### GET /api/recipes/{recipeId}/rating

**Description**: Get current user's rating for a recipe

**Authentication**: Required

**Response** (200 OK):

```json
{
  "id": "uuid",
  "userId": "uuid",
  "recipeId": "uuid",
  "rating": 5,
  "didCook": true,
  "createdAt": "2025-10-11T12:00:00Z",
  "updatedAt": "2025-10-11T12:00:00Z"
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 404 Not Found: User has not rated this recipe

#### POST /api/recipes/{recipeId}/rating

**Description**: Create or update rating for a recipe (upsert)

**Authentication**: Required

**Request Payload**:

```json
{
  "rating": 5,
  "didCook": true
}
```

**Validation**:

- `rating`: Required, integer 1-5
- `didCook`: Required, boolean

**Response** (200 OK or 201 Created):

```json
{
  "success": true,
  "rating": {
    "id": "uuid",
    "userId": "uuid",
    "recipeId": "uuid",
    "rating": 5,
    "didCook": true,
    "createdAt": "2025-10-11T12:00:00Z",
    "updatedAt": "2025-10-11T12:00:00Z"
  }
}
```

**Error Responses**:

- 400 Bad Request: Invalid rating value
- 401 Unauthorized: Not authenticated
- 404 Not Found: Recipe not found or not accessible

#### DELETE /api/recipes/{recipeId}/rating

**Description**: Delete rating

**Authentication**: Required

**Response** (204 No Content)

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: Rating belongs to another user
- 404 Not Found: Rating not found

#### GET /api/recipes/{recipeId}/ratings/stats

**Description**: Get aggregate rating statistics for a recipe

**Authentication**: Required

**Response** (200 OK):

```json
{
  "recipeId": "uuid",
  "totalRatings": 15,
  "averageRating": 4.2,
  "ratingDistribution": {
    "1": 0,
    "2": 1,
    "3": 2,
    "4": 5,
    "5": 7
  },
  "cookCount": 12,
  "cookPercentage": 80.0
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated

---

### 2.10 Meal Planning

#### GET /api/meal-plans

**Description**: Get meal plans for a date range

**Authentication**: Required

**Query Parameters**:

- `startDate` (string): ISO date (default: start of current week)
- `endDate` (string): ISO date (default: end of current week)
- `mealType` (string): Filter by meal type: "breakfast" | "lunch" | "dinner" | "snack"

**Validation**:

- `startDate`: Optional, valid ISO date (default: start of current week)
- `endDate`: Optional, valid ISO date (default: end of current week)
- `mealType`: Optional, one of: "breakfast", "lunch", "dinner", "snack"

**Response** (200 OK):

```json
{
  "mealPlans": [
    {
      "id": "uuid",
      "userId": "uuid",
      "recipeId": "uuid",
      "recipe": {
        "id": "uuid",
        "title": "Owsianka z owocami",
        "nutritionPerServing": {...}
      },
      "plannedDate": "2025-10-12",
      "mealType": "breakfast",
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ]
}
```

**Error Responses**:

- 400 Bad Request: Invalid query parameters
- 401 Unauthorized: Not authenticated

#### POST /api/meal-plans

**Description**: Add recipe to meal plan

**Authentication**: Required

**Request Payload**:

```json
{
  "recipeId": "uuid",
  "plannedDate": "2025-10-12",
  "mealType": "breakfast"
}
```

**Validation**:

- `recipeId`: Required, valid UUID
- `plannedDate`: Required, ISO date string
- `mealType`: Required, one of: "breakfast", "lunch", "dinner", "snack"
- Unique constraint: (userId, recipeId, plannedDate, mealType)

**Response** (201 Created):

```json
{
  "success": true,
  "mealPlan": {
    "id": "uuid",
    "userId": "uuid",
    "recipeId": "uuid",
    "plannedDate": "2025-10-12",
    "mealType": "breakfast",
    "createdAt": "2025-10-11T12:00:00Z"
  }
}
```

**Error Responses**:

- 400 Bad Request: Invalid data
- 401 Unauthorized: Not authenticated
- 404 Not Found: Recipe not found or not accessible
- 409 Conflict: Recipe already planned for this date and meal type

#### PUT /api/meal-plans/{id}

**Description**: Update meal plan entry (change date or meal type)

**Authentication**: Required

**Request Payload**:

```json
{
  "plannedDate": "2025-10-13",
  "mealType": "lunch"
}
```

**Validation**:

- `plannedDate`: Required, ISO date string
- `mealType`: Required, one of: "breakfast", "lunch", "dinner", "snack"

**Response** (200 OK):

```json
{
  "success": true,
  "mealPlan": {
    "id": "uuid",
    "plannedDate": "2025-10-13",
    "mealType": "lunch",
    "updatedAt": "2025-10-11T12:30:00Z"
  }
}
```

**Error Responses**:

- 400 Bad Request: Invalid data
- 401 Unauthorized: Not authenticated
- 403 Forbidden: Meal plan belongs to another user
- 404 Not Found: Meal plan not found
- 409 Conflict: Another recipe already planned for new date/meal type

#### DELETE /api/meal-plans/{id}

**Description**: Remove recipe from meal plan

**Authentication**: Required

**Response** (204 No Content)

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: Meal plan belongs to another user
- 404 Not Found: Meal plan not found

---

### 2.11 Admin Dashboard

All admin endpoints require admin role verification.

#### GET /api/admin/stats/users

**Description**: Get user statistics (uses materialized view `mv_user_statistics`)

**Authentication**: Required (Admin only)

**Response** (200 OK):

```json
{
  "totalUsers": 1250,
  "usersWithPreferences": 1125,
  "preferenceCompletionRate": 90.0,
  "newUsersLast7Days": 45,
  "newUsersLast30Days": 180,
  "lastUpdated": "2025-10-11T00:00:00Z"
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: User is not admin

#### GET /api/admin/stats/recipes

**Description**: Get recipe statistics (uses materialized view `mv_recipe_statistics`)

**Authentication**: Required (Admin only)

**Response** (200 OK):

```json
{
  "totalRecipes": 3450,
  "publicRecipes": 890,
  "totalModifications": 5620,
  "avgModificationsPerRecipe": 1.63,
  "modificationsByType": [
    {
      "modificationType": "reduce_calories",
      "count": 2340
    },
    {
      "modificationType": "increase_protein",
      "count": 1890
    },
    {
      "modificationType": "portion_size",
      "count": 890
    },
    {
      "modificationType": "increase_fiber",
      "count": 340
    },
    {
      "modificationType": "increase_calories",
      "count": 120
    },
    {
      "modificationType": "ingredient_substitution",
      "count": 40
    }
  ],
  "lastUpdated": "2025-10-11T00:00:00Z"
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: User is not admin

#### GET /api/admin/stats/ratings

**Description**: Get rating statistics (uses materialized view `mv_rating_statistics`)

**Authentication**: Required (Admin only)

**Response** (200 OK):

```json
{
  "totalRatings": 2340,
  "averageRating": 4.15,
  "recipesCooked": 1870,
  "cookPercentage": 79.91,
  "positiveRatings": 1980,
  "negativeRatings": 120,
  "lastUpdated": "2025-10-11T00:00:00Z"
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: User is not admin

#### POST /api/admin/stats/refresh

**Description**: Manually refresh materialized views

**Authentication**: Required (Admin only)

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Statistics refreshed successfully",
  "refreshedAt": "2025-10-11T12:00:00Z"
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: User is not admin

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

**Primary Authentication**: Supabase Auth with JWT tokens

**Implementation**:

1. Client uses Supabase Auth SDK for signup, login, password reset, and logout
2. Supabase issues JWT access tokens stored in HTTP-only cookies
3. API routes verify JWT using Supabase middleware
4. User identity extracted from `context.locals.supabase.auth.getUser()`

**Token Management**:

- Access tokens expire after 1 hour
- Refresh tokens valid for 30 days
- Automatic token refresh handled by Supabase client

### 3.2 Authorization Levels

**Public Endpoints** (No authentication required):

- GET /api/tags
- GET /api/allergens

**Authenticated Endpoints** (Requires valid JWT):

- All /api/profile/\* endpoints
- All /api/recipes/\* endpoints
- All /api/favorites/\* endpoints
- All /api/collections/\* endpoints
- All /api/meal-plans/\* endpoints
- All /api/modifications/\* endpoints
- GET /api/ingredient-substitutions

**Admin Endpoints** (Requires admin role):

- All /api/admin/\* endpoints

### 3.3 Row-Level Security (RLS)

Database security is enforced through PostgreSQL RLS policies:

1. **User Isolation**: Users can only access their own data (profiles, favorites, collections, meal plans, ratings, modifications)

2. **Recipe Visibility**:
   - Users can view: public recipes OR their own recipes
   - Users can modify: only their own recipes

3. **Reference Data**: Tags, allergens, and ingredient substitutions are readable by all authenticated users

4. **Admin Access**: Admin statistics views require `is_admin()` function check

### 3.4 Admin Role Verification

Admin role is stored in Supabase Auth user metadata:

```typescript
// Check admin role
const isAdmin = (auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin'
```

API endpoints check admin status before allowing access to `/api/admin/*` routes.

---

## 4. Validation and Business Logic

### 4.1 Input Validation

All API endpoints use **Zod schemas** for request validation:

**Profile Validation**:

```typescript
const ProfileSchema = z.object({
  weight: z.number().min(40).max(200).optional(),
  age: z.number().int().min(13).max(100).optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  activityLevel: z
    .enum(["sedentary", "lightly_active", "moderately_active", "very_active", "extremely_active"])
    .optional(),
  dietType: z.enum(["high_protein", "keto", "vegetarian", "weight_gain", "weight_loss", "balanced"]).optional(),
  targetGoal: z.enum(["lose_weight", "gain_weight", "maintain_weight"]).optional(),
  targetValue: z.number().optional(),
});
```

**Recipe Validation**:

```typescript
const IngredientSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  unit: z.string().min(1).max(20),
});

const StepSchema = z.object({
  stepNumber: z.number().int().positive(),
  instruction: z.string().min(1),
});

const NutritionSchema = z.object({
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fiber: z.number().nonnegative(),
  salt: z.number().nonnegative(),
});

const RecipeSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  ingredients: z.array(IngredientSchema).min(1),
  steps: z.array(StepSchema).min(1),
  servings: z.number().int().positive(),
  nutritionPerServing: NutritionSchema,
  prepTimeMinutes: z.number().int().positive().optional(),
  isPublic: z.boolean().default(false),
  tagIds: z.array(z.string().uuid()).optional(),
});
```

**Rating Validation**:

```typescript
const RatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  didCook: z.boolean(),
});
```

**Meal Plan Validation**:

```typescript
const MealPlanSchema = z.object({
  recipeId: z.string().uuid(),
  plannedDate: z.string().date(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
});
```

### 4.2 Business Logic Rules

#### Recipe Search with Polish Language

- Full-text search uses PostgreSQL `tsvector` with Polish language configuration
- Search vector is auto-generated from title (weight 'A') and description (weight 'B')
- GIN index on `search_vector` column optimizes search performance
- Handles Polish diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż) correctly

#### AI Modification Processing

1. **Input Validation**: Validate recipe exists and user has access
2. **AI Call**: For now we gonna use a mock function simulating AI response
3. **Timeout**: Hard limit of 5 seconds for AI response (PRD requirement)
4. **Response Validation**: Verify AI response contains valid recipe structure
5. **Nutrition Calculation**: Validate nutrition values are recalculated correctly
6. **Storage**: Save modification with reference to original recipe

**AI Prompt Structure** (example for calorie reduction):

```
You are a nutrition expert. Modify the following recipe to reduce calories to {targetCalories}.

Original Recipe:
Title: {title}
Ingredients: {ingredients}
Steps: {steps}
Nutrition per serving: {nutrition}

Requirements:
- Maintain recipe feasibility and taste
- Provide healthier ingredient substitutions
- Recalculate nutrition accurately
- Provide modification notes in Polish

Return JSON format:
{
  "ingredients": [...],
  "steps": [...],
  "nutritionPerServing": {...},
  "modificationNotes": "..."
}
```

#### Allergen Filtering (Application Logic)

When browsing recipes, optionally filter out recipes containing user's allergens:

- Compare recipe ingredients against user's allergen list
- This is application-level logic (not enforced by database)
- Provide warning UI if user tries to add allergenic recipe to meal plan

#### Portion Size Adjustment

- Simple mathematical proportion: `newAmount = originalAmount * (newServings / originalServings)`
- Nutrition values remain per-serving, not recalculated
- Can be done client-side without AI

#### Rating Upsert Behavior

- Single user can have only one rating per recipe (unique constraint)
- POST /api/recipes/{id}/rating performs upsert:
  - If rating exists: UPDATE
  - If rating doesn't exist: INSERT
- Returns 200 OK for update, 201 Created for insert

#### Meal Plan Date Defaults

- GET /api/meal-plans without dates returns current week (Monday-Sunday)
- Week calculation based on ISO 8601 (week starts Monday)

#### Admin Statistics Refresh

- Materialized views refresh daily at midnight (via scheduled job)
- Manual refresh available via POST /api/admin/stats/refresh
- Concurrent refresh prevents blocking reads during refresh

### 4.3 Error Handling

**Standard Error Response Format**:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "weight",
        "message": "Weight must be between 40 and 200 kg"
      }
    ]
  }
}
```

**Error Codes**:

- `VALIDATION_ERROR` (400): Input validation failed
- `UNAUTHORIZED` (401): Not authenticated
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Duplicate resource or constraint violation
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error
- `TIMEOUT` (504): Request timeout (e.g., AI processing)

### 4.4 Performance Optimizations

1. **Pagination**: All list endpoints support pagination (default: 20 items, max: 100)
2. **Database Indexes**: Comprehensive indexing strategy defined in db-plan.md
3. **Caching**:
   - Reference data (tags, allergens): Cache for 1 hour
   - User profile: Cache for 5 minutes
   - Recipe lists: No cache (frequently updated)
4. **Rate Limiting**:
   - AI endpoints: 10 requests/minute per user
   - Other endpoints: 100 requests/minute per user
5. **Query Optimization**:
   - Use database joins to avoid N+1 queries
   - Select only needed fields (avoid `SELECT *`)
   - Use composite indexes for multi-column filters

### 4.5 Data Consistency

1. **Cascading Deletes**: User deletion triggers cascade delete of all related data (GDPR compliance)
2. **Referential Integrity**: Foreign key constraints prevent orphaned records
3. **Unique Constraints**: Enforce business rules (e.g., one rating per user per recipe)
4. **Transaction Management**: Multi-step operations wrapped in database transactions
5. **Auto-Timestamps**: `updated_at` automatically updated via trigger function

---

## 5. API Versioning

**Current Version**: v1 (implicit, no version in URL)

**Future Versioning Strategy**:

- When breaking changes needed: Introduce `/api/v2/` prefix
- Maintain v1 for 6 months minimum after v2 release
- Use `Accept-Version` header for minor version negotiation

---

## 6. Rate Limiting

**Per-User Limits**:

- AI modification endpoints: 10 requests/minute
- Recipe creation: 20 requests/minute
- Other authenticated endpoints: 100 requests/minute
- Public endpoints: 30 requests/minute per IP

**Headers**:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1696934400
```

**Rate Limit Exceeded Response** (429):

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 42
  }
}
```

---

## 7. Monitoring and Logging

**Metrics to Track**:

1. API response times (P50, P95, P99)
2. Error rates by endpoint
3. AI modification success/failure rate
4. AI modification processing time
5. Rate limit hits

**Logging Requirements**:

1. All errors with stack traces
2. AI requests and responses (for quality monitoring)
3. Authentication failures
4. Rate limit violations
