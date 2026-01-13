import express from 'express';
import * as submissionController from '../controllers/recipeSubmission';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Submit a recipe for approval
router.post('/', submissionController.submitRecipe);

// Get user's own submissions
router.get('/my', submissionController.getMySubmissions);

// Get pending submissions (admin only)
router.get('/pending', submissionController.getPendingSubmissions);

// Review a submission (admin only)
router.post('/:submissionId/review', submissionController.reviewSubmission);

export default router;