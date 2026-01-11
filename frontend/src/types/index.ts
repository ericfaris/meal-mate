export interface Recipe {
  _id: string;
  title: string;
  imageUrl?: string;
  sourceUrl?: string;
  ingredientsText: string;
  directionsText: string;
  notes?: string;
  tags: string[];
  lastUsedDate?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  isVegetarian?: boolean;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  planCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  _id: string;
  date: string; // YYYY-MM-DD
  recipeId?: Recipe;
  label?: string;
  isConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanUpdate {
  recipeId?: string;
  label?: string;
  isConfirmed?: boolean;
}

export interface SuggestionConstraints {
  startDate: string; // YYYY-MM-DD
  daysToSkip: number[]; // [0=Mon, 1=Tue, ..., 6=Sun]
  avoidRepeats: boolean;
  preferSimple: boolean;
  vegetarianOnly: boolean;
}
