import { Request, Response } from 'express';
import * as groceryListService from '../services/groceryListService';

// POST /api/grocery-lists - Create grocery list from plans
export const createGroceryList = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { startDate, daysCount, name } = req.body;

    if (!startDate || !daysCount) {
      res.status(400).json({ error: 'startDate and daysCount are required' });
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    const list = await groceryListService.createFromPlans(userId, startDate, daysCount, name);
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
    const lists = await groceryListService.getAllLists(userId, status as string | undefined);
    res.json(lists);
  } catch (error) {
    console.error('Error fetching grocery lists:', error);
    res.status(500).json({ error: 'Failed to fetch grocery lists' });
  }
};

// GET /api/grocery-lists/:id - Get single grocery list
export const getGroceryList = async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await groceryListService.getList(req.params.id, req.userId!);
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
    const list = await groceryListService.updateList(req.params.id, req.userId!, { name, status });
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
    const list = await groceryListService.updateItem(req.params.id, itemIndex, req.userId!, {
      isChecked,
      quantity,
      name,
    });
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
    const { name, quantity, category } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: 'Item name is required' });
      return;
    }

    const list = await groceryListService.addCustomItem(req.params.id, req.userId!, {
      name,
      quantity,
      category,
    });
    if (!list) {
      res.status(404).json({ error: 'Grocery list not found' });
      return;
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

    const list = await groceryListService.removeItem(req.params.id, itemIndex, req.userId!);
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
