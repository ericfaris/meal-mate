import mongoose from 'mongoose';
import GroceryList, { IGroceryList } from '../models/groceryList';
import Plan from '../models/plan';
import User from '../models/user';
import {
  parseIngredientsWithAI,
  parseIngredientsFallback,
  aggregateIngredients,
} from './ingredientParserService';

/**
 * Create a grocery list from planned meals in a date range.
 */
export async function createFromPlans(
  userId: string,
  startDate: string,
  daysCount: number,
  name?: string
): Promise<IGroceryList> {
  // Calculate end date
  const [year, month, day] = startDate.split('-').map(Number);
  const endDateObj = new Date(year, month - 1, day);
  endDateObj.setDate(endDateObj.getDate() + daysCount - 1);
  const endDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;

  // Get user for household context
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // Build plan query (household-aware)
  let planQuery: any = {
    date: { $gte: startDate, $lte: endDate },
    recipeId: { $exists: true, $ne: null },
  };

  if (user.householdId) {
    const members = await User.find({ householdId: user.householdId }).select('_id');
    planQuery.userId = { $in: members.map((m) => m._id) };
  } else {
    planQuery.userId = userId;
  }

  const plans = await Plan.find(planQuery).populate('recipeId');

  // Extract unique recipes
  const recipeMap = new Map<string, any>();
  for (const plan of plans) {
    if (plan.recipeId) {
      const recipe = plan.recipeId as any;
      recipeMap.set(recipe._id.toString(), recipe);
    }
  }
  const recipes = Array.from(recipeMap.values());

  // Parse ingredients: try AI first, fall back to regex
  let parsed = await parseIngredientsWithAI(recipes);
  if (!parsed) {
    parsed = parseIngredientsFallback(recipes);
  }

  const aggregated = aggregateIngredients(parsed);

  // Build grocery list
  const listName = name || `Next ${daysCount} Dinners`;
  const groceryList = new GroceryList({
    userId,
    name: listName,
    status: 'active',
    startDate,
    endDate,
    planIds: plans.map((p) => p._id),
    items: aggregated.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      recipeIds: item.recipeIds.map((id) => new mongoose.Types.ObjectId(id)),
      recipeNames: item.recipeNames,
      isChecked: false,
      originalTexts: item.originalTexts,
    })),
  });

  await groceryList.save();
  return groceryList;
}

export async function getList(
  listId: string,
  userId: string
): Promise<IGroceryList | null> {
  return GroceryList.findOne({ _id: listId, userId });
}

export async function getAllLists(
  userId: string,
  status?: string
): Promise<IGroceryList[]> {
  const query: any = { userId };
  if (status) query.status = status;
  return GroceryList.find(query).sort({ createdAt: -1 });
}

export async function updateList(
  listId: string,
  userId: string,
  updates: { name?: string; status?: string }
): Promise<IGroceryList | null> {
  return GroceryList.findOneAndUpdate(
    { _id: listId, userId },
    { $set: updates },
    { new: true, runValidators: true }
  );
}

export async function updateItem(
  listId: string,
  itemIndex: number,
  userId: string,
  updates: { isChecked?: boolean; quantity?: string; name?: string }
): Promise<IGroceryList | null> {
  const setFields: any = {};
  if (updates.isChecked !== undefined) setFields[`items.${itemIndex}.isChecked`] = updates.isChecked;
  if (updates.quantity !== undefined) setFields[`items.${itemIndex}.quantity`] = updates.quantity;
  if (updates.name !== undefined) setFields[`items.${itemIndex}.name`] = updates.name;

  return GroceryList.findOneAndUpdate(
    { _id: listId, userId },
    { $set: setFields },
    { new: true }
  );
}

export async function addCustomItem(
  listId: string,
  userId: string,
  item: { name: string; quantity?: string; category?: string }
): Promise<IGroceryList | null> {
  return GroceryList.findOneAndUpdate(
    { _id: listId, userId },
    {
      $push: {
        items: {
          name: item.name,
          quantity: item.quantity || '',
          category: item.category || 'Other',
          recipeIds: [],
          recipeNames: [],
          isChecked: false,
          originalTexts: [],
        },
      },
    },
    { new: true }
  );
}

export async function removeItem(
  listId: string,
  itemIndex: number,
  userId: string
): Promise<IGroceryList | null> {
  const list = await GroceryList.findOne({ _id: listId, userId });
  if (!list) return null;

  list.items.splice(itemIndex, 1);
  await list.save();
  return list;
}

export async function deleteList(
  listId: string,
  userId: string
): Promise<boolean> {
  const result = await GroceryList.findOneAndDelete({ _id: listId, userId });
  return !!result;
}
