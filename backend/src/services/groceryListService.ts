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
  endDate: string,
  name?: string
): Promise<IGroceryList> {

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

  // Build grocery list name from dates
  const formatShort = (d: string) => {
    const [y, m, day] = d.split('-').map(Number);
    const date = new Date(y, m - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const listName = name || `${formatShort(startDate)} – ${formatShort(endDate)}`;
  const groceryList = new GroceryList({
    userId,
    // Set householdId if user is in a household (enables shared access)
    householdId: user.householdId || undefined,
    createdBy: userId,
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
      // Items from initial creation don't need addedBy tracking
    })),
  });

  await groceryList.save();
  return groceryList;
}

/**
 * Get a single grocery list.
 * If user is in a household, they can access any list in that household.
 */
export async function getList(
  listId: string,
  userId: string,
  householdId?: mongoose.Types.ObjectId
): Promise<IGroceryList | null> {
  // If user is in a household, allow access to any household list
  if (householdId) {
    return GroceryList.findOne({
      _id: listId,
      $or: [{ userId }, { householdId }],
    });
  }
  return GroceryList.findOne({ _id: listId, userId });
}

/**
 * Get all grocery lists.
 * If user is in a household, returns all household lists.
 */
export async function getAllLists(
  userId: string,
  status?: string,
  householdId?: mongoose.Types.ObjectId
): Promise<IGroceryList[]> {
  let query: any;

  // If user is in a household, show all household lists
  if (householdId) {
    query = { $or: [{ userId }, { householdId }] };
  } else {
    query = { userId };
  }

  if (status) query.status = status;
  return GroceryList.find(query).sort({ createdAt: -1 });
}

/**
 * Update a grocery list (name or status).
 * Household members can update any household list.
 */
export async function updateList(
  listId: string,
  userId: string,
  updates: { name?: string; status?: string },
  householdId?: mongoose.Types.ObjectId
): Promise<IGroceryList | null> {
  const query: any = { _id: listId };
  if (householdId) {
    query.$or = [{ userId }, { householdId }];
  } else {
    query.userId = userId;
  }

  return GroceryList.findOneAndUpdate(
    query,
    { $set: updates },
    { new: true, runValidators: true }
  );
}

/**
 * Update a grocery item (check/uncheck, edit quantity/name).
 * Household members can update items in any household list.
 */
export async function updateItem(
  listId: string,
  itemIndex: number,
  userId: string,
  updates: { isChecked?: boolean; quantity?: string; name?: string },
  householdId?: mongoose.Types.ObjectId
): Promise<IGroceryList | null> {
  const setFields: any = {};
  if (updates.isChecked !== undefined) setFields[`items.${itemIndex}.isChecked`] = updates.isChecked;
  if (updates.quantity !== undefined) setFields[`items.${itemIndex}.quantity`] = updates.quantity;
  if (updates.name !== undefined) setFields[`items.${itemIndex}.name`] = updates.name;

  const query: any = { _id: listId };
  if (householdId) {
    query.$or = [{ userId }, { householdId }];
  } else {
    query.userId = userId;
  }

  return GroceryList.findOneAndUpdate(
    query,
    { $set: setFields },
    { new: true }
  );
}

/**
 * Add a custom item to a grocery list.
 * Tracks who added the item for notification purposes.
 * Household members can add items to any household list.
 */
export async function addCustomItem(
  listId: string,
  userId: string,
  item: { name: string; quantity?: string; category?: string },
  householdId?: mongoose.Types.ObjectId
): Promise<IGroceryList | null> {
  const query: any = { _id: listId };
  if (householdId) {
    query.$or = [{ userId }, { householdId }];
  } else {
    query.userId = userId;
  }

  return GroceryList.findOneAndUpdate(
    query,
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
          addedBy: new mongoose.Types.ObjectId(userId),
          addedAt: new Date(),
        },
      },
    },
    { new: true }
  );
}

/**
 * Remove an item from a grocery list.
 * Household members can remove items from any household list.
 */
export async function removeItem(
  listId: string,
  itemIndex: number,
  userId: string,
  householdId?: mongoose.Types.ObjectId
): Promise<IGroceryList | null> {
  const query: any = { _id: listId };
  if (householdId) {
    query.$or = [{ userId }, { householdId }];
  } else {
    query.userId = userId;
  }

  const list = await GroceryList.findOne(query);
  if (!list) return null;

  list.items.splice(itemIndex, 1);
  await list.save();
  return list;
}

/**
 * Delete a grocery list.
 * Only the creator (admin) can delete lists - enforced at controller level.
 * Falls back to userId for backwards compatibility with lists created before createdBy was added.
 */
export async function deleteList(
  listId: string,
  userId: string
): Promise<boolean> {
  // Try to delete by createdBy first, then fall back to userId for older lists
  const result = await GroceryList.findOneAndDelete({
    _id: listId,
    $or: [
      { createdBy: userId },
      { createdBy: { $exists: false }, userId: userId }
    ]
  });
  return !!result;
}
