import Restaurant from '../models/restaurant';

export function selectWeightedRestaurant(restaurants: any[]): any {
  if (restaurants.length === 0) {
    throw new Error('No restaurants available for selection');
  }

  // Calculate weights based on last visited date
  const weights = restaurants.map(restaurant => calculateWeight(restaurant));

  // Random selection based on weights
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < restaurants.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return restaurants[i];
    }
  }

  // Fallback (should not reach here normally)
  return restaurants[restaurants.length - 1];
}

function calculateWeight(restaurant: any): number {
  // Weight calculation:
  // - Never visited: weight = 10
  // - Visited 30+ days ago: weight = 8
  // - Visited 14-30 days ago: weight = 5
  // - Visited 7-14 days ago: weight = 3
  // - Visited < 7 days ago: weight = 1

  if (!restaurant.lastVisitedDate) {
    return 10;
  }

  const lastVisit = new Date(restaurant.lastVisitedDate);
  const today = new Date();
  const daysSinceVisit = Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceVisit > 30) return 8;
  if (daysSinceVisit > 14) return 5;
  if (daysSinceVisit > 7) return 3;
  return 1;
}