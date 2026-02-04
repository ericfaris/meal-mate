import { Router } from 'express';
import {
  getStaples,
  upsertStaple,
  deleteStaple,
  clearStaples,
  addStaplesToGroceryList,
} from '../controllers/staples';
import { requireAdminIfInHousehold } from '../middleware/auth';

const router = Router();

router.get('/', getStaples);
router.post('/', upsertStaple);
// Only admins can delete staples if in a household
router.delete('/:id', requireAdminIfInHousehold, deleteStaple);
router.delete('/', requireAdminIfInHousehold, clearStaples);

export default router;

// Export the grocery list staples handler separately for use in groceryList routes
export { addStaplesToGroceryList };
