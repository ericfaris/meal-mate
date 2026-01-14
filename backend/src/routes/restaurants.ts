import { Router } from 'express';
import {
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  recordVisit,
  getStats,
  spin,
} from '../controllers/restaurants';

const router = Router();

// Static routes must come BEFORE parameterized routes
router.get('/stats', getStats);
router.post('/spin', spin);

router.get('/', getRestaurants);
router.get('/:id', getRestaurant);
router.post('/', createRestaurant);
router.put('/:id', updateRestaurant);
router.delete('/:id', deleteRestaurant);
router.post('/:id/visit', recordVisit);

export default router;