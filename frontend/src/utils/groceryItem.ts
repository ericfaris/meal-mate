import { GroceryItem } from '../types';

/**
 * The small line under a grocery item in Store Mode: which dinners need it
 * ("Fajitas · Chili · Pot roast") or, for items added by hand, who added it.
 */
export function itemSourceLine(item: Pick<GroceryItem, 'recipeNames' | 'addedBy'>): string {
  if (item.recipeNames?.length) return item.recipeNames.join(' · ');
  if (item.addedBy && typeof item.addedBy === 'object' && item.addedBy.name) {
    return `Added by ${item.addedBy.name.trim().split(/\s+/)[0]}`;
  }
  return '';
}

/** Checked / total, for the Store Mode progress bar. */
export function listProgress(items: Pick<GroceryItem, 'isChecked'>[]): { done: number; total: number; ratio: number } {
  const total = items.length;
  const done = items.filter((i) => i.isChecked).length;
  return { done, total, ratio: total ? done / total : 0 };
}
