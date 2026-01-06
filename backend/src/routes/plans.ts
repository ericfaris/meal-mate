import { Router } from 'express';
import {
  getPlans,
  getPlanByDate,
  updatePlanByDate,
  deletePlanByDate,
  deleteAllPlans,
} from '../controllers/plans';

const router = Router();

router.get('/', getPlans);
router.get('/:date', getPlanByDate);
router.put('/:date', updatePlanByDate);
router.delete('/', deleteAllPlans);
router.delete('/:date', deletePlanByDate);

export default router;
