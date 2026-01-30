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

const router = Router();

router.post('/', createGroceryList);
router.get('/', getGroceryLists);
router.get('/:id', getGroceryList);
router.put('/:id', updateGroceryList);
router.put('/:id/items/:index', updateGroceryItem);
router.post('/:id/items', addGroceryItem);
router.delete('/:id/items/:index', removeGroceryItem);
router.delete('/:id', deleteGroceryList);

export default router;
