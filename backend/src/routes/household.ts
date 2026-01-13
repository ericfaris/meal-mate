import express from 'express';
import * as householdController from '../controllers/household';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All household routes require authentication
router.use(authenticate);

// Create household
router.post('/', householdController.createHousehold);

// Get household details
router.get('/', householdController.getHousehold);

// Generate invitation link
router.post('/invite', householdController.generateInviteLink);

// Join household via invitation
router.post('/join', householdController.joinHousehold);

// Leave household
router.post('/leave', householdController.leaveHousehold);

// Remove a member (admin only)
router.delete('/members/:memberId', householdController.removeMember);

// Delete household (admin only)
router.delete('/', householdController.deleteHousehold);

export default router;