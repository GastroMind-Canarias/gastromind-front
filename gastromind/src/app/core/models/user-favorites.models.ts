export interface IngredientUsed {
  productId: string;
  productName: string;
  quantityUsed: number;
  quantityAvailable: number | null;
}

export interface Recipe {
  id: string;
  title: string;
  instructions: string;
  servings: number;
  prep_time: number;
  appliance_needed: string;
  difficulty: string;
  created_at: string;
  ingredientsUsed: IngredientUsed[];
}

export interface UserFavorite {
  id: string;
  user_id: string;
  recipe: Recipe;
}

export interface CreateRecipePayload {
  title: string;
  instructions: string;
  servings: number;
  prep_time: number;
  appliance_needed: string;
  difficulty: string;
  created_at: string;
}

export interface CreateUserFavoritePayload {
  user_id: string;
  recipe_id: string;
}

export const DIFFICULTY_OPTIONS = ['EASY', 'MEDIUM', 'HARD'] as const;
export type Difficulty = typeof DIFFICULTY_OPTIONS[number];

export const DIFFICULTY_LABELS: Record<string, string> = {
  EASY:   'Fácil',
  MEDIUM: 'Media',
  HARD:   'Difícil',
};
