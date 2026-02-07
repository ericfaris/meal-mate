import { Request, Response } from 'express';
import * as groceryListService from '../services/groceryListService';
import Staple from '../models/staple';
import { notifyHouseholdAdminsOfGroceryItems } from '../services/notificationService';

// POST /api/grocery-lists - Create grocery list from plans
export const createGroceryList = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { startDate, endDate, name } = req.body;

    if (!startDate || !endDate) {
      res.status(400).json({ error: 'startDate and endDate are required' });
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    if (endDate < startDate) {
      res.status(400).json({ error: 'End date must be on or after start date' });
      return;
    }

    const list = await groceryListService.createFromPlans(userId, startDate, endDate, name);
    res.status(201).json(list);
  } catch (error) {
    console.error('Error creating grocery list:', error);
    res.status(500).json({ error: 'Failed to create grocery list' });
  }
};

// GET /api/grocery-lists - List all grocery lists
export const getGroceryLists = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { status } = req.query;
    const householdId = req.user?.householdId;
    const lists = await groceryListService.getAllLists(userId, status as string | undefined, householdId);
    res.json(lists);
  } catch (error) {
    console.error('Error fetching grocery lists:', error);
    res.status(500).json({ error: 'Failed to fetch grocery lists' });
  }
};

// GET /api/grocery-lists/:id - Get single grocery list
export const getGroceryList = async (req: Request, res: Response): Promise<void> => {
  try {
    const householdId = req.user?.householdId;
    const list = await groceryListService.getList(req.params.id, req.userId!, householdId);
    if (!list) {
      res.status(404).json({ error: 'Grocery list not found' });
      return;
    }
    res.json(list);
  } catch (error) {
    console.error('Error fetching grocery list:', error);
    res.status(500).json({ error: 'Failed to fetch grocery list' });
  }
};

// PUT /api/grocery-lists/:id - Update list name/status
export const updateGroceryList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, status } = req.body;
    const householdId = req.user?.householdId;
    const list = await groceryListService.updateList(req.params.id, req.userId!, { name, status }, householdId);
    if (!list) {
      res.status(404).json({ error: 'Grocery list not found' });
      return;
    }
    res.json(list);
  } catch (error) {
    console.error('Error updating grocery list:', error);
    res.status(500).json({ error: 'Failed to update grocery list' });
  }
};

// PUT /api/grocery-lists/:id/items/:index - Update an item (check/uncheck, edit)
export const updateGroceryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const itemIndex = parseInt(req.params.index, 10);
    if (isNaN(itemIndex) || itemIndex < 0) {
      res.status(400).json({ error: 'Invalid item index' });
      return;
    }

    const { isChecked, quantity, name } = req.body;
    const householdId = req.user?.householdId;
    const list = await groceryListService.updateItem(req.params.id, itemIndex, req.userId!, {
      isChecked,
      quantity,
      name,
    }, householdId);
    if (!list) {
      res.status(404).json({ error: 'Grocery list not found' });
      return;
    }
    res.json(list);
  } catch (error) {
    console.error('Error updating grocery item:', error);
    res.status(500).json({ error: 'Failed to update grocery item' });
  }
};

// POST /api/grocery-lists/:id/items - Add custom item
export const addGroceryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, quantity, category, saveToStaples } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: 'Item name is required' });
      return;
    }

    const user = req.user!;
    const householdId = user.householdId;

    const list = await groceryListService.addCustomItem(req.params.id, req.userId!, {
      name,
      quantity,
      category,
    }, householdId);
    if (!list) {
      res.status(404).json({ error: 'Grocery list not found' });
      return;
    }

    // Auto-save to staples (passive history) — skip if explicitly opted out
    if (saveToStaples !== false) {
      try {
        const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        await Staple.findOneAndUpdate(
          { userId: req.userId, name: { $regex: new RegExp(`^${escapedName}$`, 'i') } },
          {
            $set: {
              name: name.trim(),
              ...(quantity && { quantity }),
              ...(category && { category }),
              lastUsedAt: new Date(),
            },
            $inc: { usageCount: 1 },
            $setOnInsert: { userId: req.userId },
          },
          { upsert: true }
        );
      } catch (stapleErr) {
        console.error('Auto-save staple failed (non-blocking):', stapleErr);
      }
    }

    // Notify household admins if a member added items
    if (householdId && user.role === 'member') {
      try {
        await notifyHouseholdAdminsOfGroceryItems(
          householdId,
          list._id.toString(),
          list.name,
          user.name,
          [name.trim()]
        );
      } catch (notifyErr) {
        console.error('Notification failed (non-blocking):', notifyErr);
      }
    }

    res.json(list);
  } catch (error) {
    console.error('Error adding grocery item:', error);
    res.status(500).json({ error: 'Failed to add grocery item' });
  }
};

// DELETE /api/grocery-lists/:id/items/:index - Remove an item
export const removeGroceryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const itemIndex = parseInt(req.params.index, 10);
    if (isNaN(itemIndex) || itemIndex < 0) {
      res.status(400).json({ error: 'Invalid item index' });
      return;
    }

    const householdId = req.user?.householdId;
    const list = await groceryListService.removeItem(req.params.id, itemIndex, req.userId!, householdId);
    if (!list) {
      res.status(404).json({ error: 'Grocery list not found' });
      return;
    }
    res.json(list);
  } catch (error) {
    console.error('Error removing grocery item:', error);
    res.status(500).json({ error: 'Failed to remove grocery item' });
  }
};

// DELETE /api/grocery-lists/:id - Delete list
export const deleteGroceryList = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await groceryListService.deleteList(req.params.id, req.userId!);
    if (!deleted) {
      res.status(404).json({ error: 'Grocery list not found' });
      return;
    }
    res.json({ message: 'Grocery list deleted successfully' });
  } catch (error) {
    console.error('Error deleting grocery list:', error);
    res.status(500).json({ error: 'Failed to delete grocery list' });
  }
};
