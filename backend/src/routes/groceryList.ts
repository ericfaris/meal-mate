import { Router } from 'express';
import {
  createGroceryList,
  getGroceryLists,
  getGroceryList,
  updateGroceryList,
  updateGroceryItem,
  addGroceryItem,
  removeGroceryItem,
  deleteGroceryList,
} from '../controllers/groceryList';
import { addStaplesToGroceryList } from '../controllers/staples';
import { requireAdminIfInHousehold } from '../middleware/auth';

const router = Router();

// Create grocery list - admin only if in household
router.post('/', requireAdminIfInHousehold, createGroceryList);

// Read operations - all household members can view
router.get('/', getGroceryLists);
router.get('/:id', getGroceryList);

// Update operations - all household members can update
router.put('/:id', updateGroceryList);
router.put('/:id/items/:index', updateGroceryItem);

// Add items - all household members can add (triggers notification for members)
router.post('/:id/items', addGroceryItem);
router.post('/:id/staples', addStaplesToGroceryList);

// Remove item - all household members can remove
router.delete('/:id/items/:index', removeGroceryItem);

// Delete grocery list - admin only if in household
router.delete('/:id', requireAdminIfInHousehold, deleteGroceryList);

export default router;
