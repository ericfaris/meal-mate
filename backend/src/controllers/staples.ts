import { Request, Response } from 'express';
import Staple from '../models/staple';
import GroceryList from '../models/groceryList';

// GET /api/staples
export const getStaples = async (req: Request, res: Response): Promise<void> => {
  try {
    const staples = await Staple.find({ userId: req.userId }).sort({ usageCount: -1 });
    res.json(staples);
  } catch (error) {
    console.error('Error fetching staples:', error);
    res.status(500).json({ error: 'Failed to fetch staples' });
  }
};

// POST /api/staples - Create or update a staple (upsert by name)
export const upsertStaple = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, quantity, category } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: 'Staple name is required' });
      return;
    }

    const staple = await Staple.findOneAndUpdate(
      { userId: req.userId, name: { $regex: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      {
        $set: {
          name: name.trim(),
          ...(quantity !== undefined && { quantity }),
          ...(category && { category }),
          lastUsedAt: new Date(),
        },
        $inc: { usageCount: 1 },
        $setOnInsert: { userId: req.userId },
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json(staple);
  } catch (error: any) {
    console.error('Error upserting staple:', error);
    res.status(500).json({ error: 'Failed to save staple' });
  }
};

// DELETE /api/staples/:id
export const deleteStaple = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await Staple.findOneAndDelete({ _id: req.params.id, userId: req.userId });
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
export const clearStaples = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await Staple.deleteMany({ userId: req.userId });
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

    const list = await GroceryList.findOne({ _id: req.params.id, userId: req.userId });
    if (!list) {
      res.status(404).json({ error: 'Grocery list not found' });
      return;
    }

    const staples = await Staple.find({ _id: { $in: stapleIds }, userId: req.userId });
    if (staples.length === 0) {
      res.status(400).json({ error: 'No valid staples found' });
      return;
    }

    for (const staple of staples) {
      list.items.push({
        name: staple.name,
        quantity: staple.quantity || '',
        category: staple.category as any,
        recipeIds: [],
        recipeNames: [],
        isChecked: false,
        originalTexts: [],
      });

      // Update staple usage
      await Staple.updateOne(
        { _id: staple._id },
        { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } }
      );
    }

    await list.save();
    res.json(list);
  } catch (error) {
    console.error('Error adding staples to grocery list:', error);
    res.status(500).json({ error: 'Failed to add staples' });
  }
};
