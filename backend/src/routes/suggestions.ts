import express from 'express';
import {
  generateSuggestions,
  getAlternative,
  approveSuggestions,
} from '../controllers/suggestions';

const router = express.Router();

// Generate a week of meal suggestions
router.post('/generate', generateSuggestions);

// Get an alternative recipe for a specific date
router.post('/alternative', getAlternative);

// Approve and save suggestions as plans
router.post('/approve', approveSuggestions);

export default router;
