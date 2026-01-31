import { Router } from 'express';
import {
  getStaples,
  upsertStaple,
  deleteStaple,
  clearStaples,
  addStaplesToGroceryList,
} from '../controllers/staples';

const router = Router();

router.get('/', getStaples);
router.post('/', upsertStaple);
router.delete('/:id', deleteStaple);
router.delete('/', clearStaples);

export default router;

// Export the grocery list staples handler separately for use in groceryList routes
export { addStaplesToGroceryList };
