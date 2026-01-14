export interface Recipe {
  _id: string;
  title: string;
  imageUrl?: string;
  sourceUrl?: string;
  ingredientsText?: string;
  directionsText?: string;
  notes?: string;
  tags: string[];
  lastUsedDate?: string;
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
  vegetarianOnly: boolean;
}

export interface Household {
  _id: string;
  name: string;
  members: HouseholdMember[];
  createdAt: string;
}

export interface HouseholdMember {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  profilePicture?: string;
}

export interface RecipeSubmission {
  _id: string;
  householdId: string;
  submittedBy: HouseholdMember;
  recipeUrl: string;
  status: 'pending' | 'approved' | 'denied';
  reviewedBy?: HouseholdMember;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHouseholdRequest {
  name: string;
}

export interface JoinHouseholdRequest {
  token: string;
}

export interface SubmitRecipeRequest {
  recipeUrl: string;
}

export interface ReviewSubmissionRequest {
  action: 'approve' | 'deny';
  reviewNotes?: string;
}

export interface Restaurant {
  _id: string;
  userId: string;
  householdId?: string;
  name: string;
  cuisine?: string;
  priceRange?: 1 | 2 | 3 | 4;
  notes?: string;
  lastVisitedDate?: string;
  visitCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantInput {
  name: string;
  cuisine?: string;
  priceRange?: 1 | 2 | 3 | 4;
  notes?: string;
  isActive?: boolean;
}

export interface RestaurantStats {
  totalRestaurants: number;
  totalVisits: number;
  mostVisited?: Restaurant;
  leastRecent?: Restaurant;
}
