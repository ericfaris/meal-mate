import { Request, Response } from 'express';
import Store from '../models/store';

const DEFAULT_STORES = [
  { name: 'Aldi', sortOrder: 0, categoryOrder: ['Produce', 'Bakery', 'Dairy & Eggs', 'Meat & Seafood', 'Pantry', 'Frozen', 'Household', 'Other'] },
  { name: 'Costco', sortOrder: 1, categoryOrder: ['Produce', 'Bakery', 'Meat & Seafood', 'Dairy & Eggs', 'Pantry', 'Frozen', 'Household', 'Other'] },
  { name: 'Kroger', sortOrder: 2, categoryOrder: ['Produce', 'Bakery', 'Dairy & Eggs', 'Meat & Seafood', 'Frozen', 'Pantry', 'Household', 'Other'] },
  { name: 'Meijer', sortOrder: 3, categoryOrder: ['Produce', 'Bakery', 'Dairy & Eggs', 'Meat & Seafood', 'Frozen', 'Pantry', 'Household', 'Other'] },
  { name: "Sam's Club", sortOrder: 4, categoryOrder: ['Produce', 'Bakery', 'Meat & Seafood', 'Dairy & Eggs', 'Pantry', 'Frozen', 'Household', 'Other'] },
  { name: "Trader Joe's", sortOrder: 5, categoryOrder: ['Produce', 'Dairy & Eggs', 'Meat & Seafood', 'Bakery', 'Frozen', 'Pantry', 'Household', 'Other'] },
  { name: 'Walmart', sortOrder: 6, categoryOrder: ['Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Bakery', 'Frozen', 'Pantry', 'Household', 'Other'] },
  { name: 'Whole Foods', sortOrder: 7, categoryOrder: ['Produce', 'Bakery', 'Meat & Seafood', 'Dairy & Eggs', 'Pantry', 'Frozen', 'Household', 'Other'] },
];

// GET /api/stores
export const getStores = async (req: Request, res: Response): Promise<void> => {
  try {
    let stores = await Store.find({ userId: req.userId }).sort({ sortOrder: 1, name: 1 });

    // Seed defaults on first access
    if (stores.length === 0) {
      const docs = DEFAULT_STORES.map((s) => ({ ...s, userId: req.userId })) as any[];
      await Store.insertMany(docs);
      stores = await Store.find({ userId: req.userId }).sort({ sortOrder: 1, name: 1 });
    }

    res.json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
};

// POST /api/stores
export const createStore = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, categoryOrder, imageUrl } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: 'Store name is required' });
      return;
    }

    // Get max sortOrder to place new store at end
    const maxStore = await Store.findOne({ userId: req.userId }).sort({ sortOrder: -1 });
    const sortOrder = maxStore ? maxStore.sortOrder + 1 : 0;

    const store = await Store.create({
      userId: req.userId,
      name: name.trim(),
      categoryOrder: categoryOrder || ['Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Pantry', 'Frozen', 'Bakery', 'Household', 'Other'],
      imageUrl: imageUrl || undefined,
      sortOrder,
    });

    res.status(201).json(store);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'A store with that name already exists' });
      return;
    }
    console.error('Error creating store:', error);
    res.status(500).json({ error: 'Failed to create store' });
  }
};

// PUT /api/stores/:id
export const updateStore = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, categoryOrder, isDefault, imageUrl } = req.body;
    const update: any = {};
    if (name !== undefined) update.name = name.trim();
    if (categoryOrder !== undefined) update.categoryOrder = categoryOrder;
    if (isDefault !== undefined) update.isDefault = isDefault;
    if (imageUrl !== undefined) update.imageUrl = imageUrl || null;

    // If setting as default, unset other defaults first
    if (isDefault) {
      await Store.updateMany({ userId: req.userId, _id: { $ne: req.params.id } }, { isDefault: false });
    }

    const store = await Store.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!store) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }

    res.json(store);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'A store with that name already exists' });
      return;
    }
    console.error('Error updating store:', error);
    res.status(500).json({ error: 'Failed to update store' });
  }
};

// DELETE /api/stores/:id
export const deleteStore = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await Store.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }
    res.json({ message: 'Store deleted' });
  } catch (error) {
    console.error('Error deleting store:', error);
    res.status(500).json({ error: 'Failed to delete store' });
  }
};

// PUT /api/stores/reorder
export const reorderStores = async (req: Request, res: Response): Promise<void> => {
  try {
    const { storeIds } = req.body;
    if (!Array.isArray(storeIds)) {
      res.status(400).json({ error: 'storeIds must be an array' });
      return;
    }

    // Update each store's sortOrder based on position in array
    const updates = storeIds.map((id: string, index: number) =>
      Store.updateOne({ _id: id, userId: req.userId }, { $set: { sortOrder: index } })
    );
    await Promise.all(updates);

    // Return updated stores
    const stores = await Store.find({ userId: req.userId }).sort({ sortOrder: 1, name: 1 });
    res.json(stores);
  } catch (error) {
    console.error('Error reordering stores:', error);
    res.status(500).json({ error: 'Failed to reorder stores' });
  }
};
