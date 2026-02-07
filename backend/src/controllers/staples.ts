import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Staple from '../models/staple';
import GroceryList from '../models/groceryList';
import User from '../models/user';
import { notifyHouseholdAdminsOfGroceryItems } from '../services/notificationService';
import { getList as getGroceryList } from '../services/groceryListService';

/**
 * Build query that includes household staples (including legacy staples from members).
 */
async function buildStaplesAccessQuery(
  userId: string,
  householdId?: mongoose.Types.ObjectId
): Promise<any> {
  if (householdId) {
    // Get all household member IDs to include legacy staples
    const members = await User.find({ householdId }).select('_id');
    const memberIds = members.map((m) => m._id);

    return {
      $or: [
        { userId: { $in: memberIds } },  // Legacy staples from household members
        { householdId },                  // New staples with explicit householdId
      ],
    };
  }
  return { userId };
}

// GET /api/staples
export const getStaples = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const query = await buildStaplesAccessQuery(req.userId!, user.householdId);
    const staples = await Staple.find(query).sort({ usageCount: -1 });
    res.json(staples);
  } catch (error) {
    console.error('Error fetching staples:', error);
    res.status(500).json({ error: 'Failed to fetch staples' });
  }
};

// POST /api/staples - Create or update a staple (upsert by name)
// If user is in a household, creates household-shared staples
export const upsertStaple = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, quantity, category } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: 'Staple name is required' });
      return;
    }

    const user = req.user!;
    const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegex = new RegExp(`^${escapedName}$`, 'i');

    // Build query to find existing staple (household-aware)
    let findQuery: any;
    if (user.householdId) {
      // For household users, check if staple exists in household (by any member or with householdId)
      const members = await User.find({ householdId: user.householdId }).select('_id');
      const memberIds = members.map((m) => m._id);

      findQuery = {
        name: { $regex: nameRegex },
        $or: [
          { userId: { $in: memberIds } },  // Legacy staples from household members
          { householdId: user.householdId },  // New staples with explicit householdId
        ],
      };
    } else {
      findQuery = { userId: req.userId, name: { $regex: nameRegex } };
    }

    // Try to find existing staple
    const existingStaple = await Staple.findOne(findQuery);

    if (existingStaple) {
      // Update existing staple
      existingStaple.name = name.trim();
      if (quantity !== undefined) existingStaple.quantity = quantity;
      if (category) existingStaple.category = category;
      existingStaple.lastUsedAt = new Date();
      existingStaple.usageCount += 1;
      await existingStaple.save();
      res.status(200).json(existingStaple);
    } else {
      // Create new staple
      const newStaple = new Staple({
        userId: req.userId,
        householdId: user.householdId || undefined,
        addedBy: req.userId,
        name: name.trim(),
        quantity: quantity || '',
        category: category || 'Other',
        lastUsedAt: new Date(),
        usageCount: 1,
      });
      await newStaple.save();
      res.status(201).json(newStaple);
    }
  } catch (error: any) {
    console.error('Error upserting staple:', error);
    res.status(500).json({ error: 'Failed to save staple' });
  }
};

// DELETE /api/staples/:id
// Only admins can delete staples (enforced by middleware for household users)
export const deleteStaple = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const query = await buildStaplesAccessQuery(req.userId!, user.householdId);

    // Add the _id to the query
    const deleted = await Staple.findOneAndDelete({ _id: req.params.id, ...query });
    if (!deleted) {
      res.status(404).json({ error: 'Staple not found' });
      return;
    }
    res.json({ message: 'Staple deleted' });
  } catch (error) {
    console.error('Error deleting staple:', error);
    res.status(500).json({ error: 'Failed to delete staple' });
  }
};

// DELETE /api/staples - Clear all staples
// Only admins can clear staples (enforced by middleware for household users)
export const clearStaples = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const query = await buildStaplesAccessQuery(req.userId!, user.householdId);
    const result = await Staple.deleteMany(query);
    res.json({ message: 'All staples cleared', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error clearing staples:', error);
    res.status(500).json({ error: 'Failed to clear staples' });
  }
};

// POST /api/grocery-lists/:id/staples - Bulk-add staples to a grocery list
export const addStaplesToGroceryList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stapleIds } = req.body;
    if (!Array.isArray(stapleIds) || stapleIds.length === 0) {
      res.status(400).json({ error: 'stapleIds array is required' });
      return;
    }

    const user = req.user!;
    const householdId = user.householdId;

    const list = await getGroceryList(req.params.id, req.userId!, householdId);
    if (!list) {
      res.status(404).json({ error: 'Grocery list not found' });
      return;
    }

    // Query staples with household awareness
    const staplesQuery = await buildStaplesAccessQuery(req.userId!, householdId);
    const staples = await Staple.find({ _id: { $in: stapleIds }, ...staplesQuery });
    if (staples.length === 0) {
      res.status(400).json({ error: 'No valid staples found' });
      return;
    }

    const addedItemNames: string[] = [];
    for (const staple of staples) {
      list.items.push({
        name: staple.name,
        quantity: staple.quantity || '',
        category: staple.category as any,
        recipeIds: [],
        recipeNames: [],
        isChecked: false,
        originalTexts: [],
        addedBy: new mongoose.Types.ObjectId(req.userId!),
        addedAt: new Date(),
      });
      addedItemNames.push(staple.name);

      // Update staple usage
      await Staple.updateOne(
        { _id: staple._id },
        { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } }
      );
    }

    await list.save();

    // Notify household admins if a member added staples
    if (householdId && user.role === 'member') {
      try {
        await notifyHouseholdAdminsOfGroceryItems(
          householdId,
          list._id.toString(),
          list.name,
          user.name,
          addedItemNames
        );
      } catch (notifyErr) {
        console.error('Notification failed (non-blocking):', notifyErr);
      }
    }

    res.json(list);
  } catch (error) {
    console.error('Error adding staples to grocery list:', error);
    res.status(500).json({ error: 'Failed to add staples' });
  }
};
