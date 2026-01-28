import express from 'express';
import { updatePushToken, removePushToken } from '../controllers/user';

const router = express.Router();

// PUT /api/users/push-token - Save push token
router.put('/push-token', updatePushToken);

// DELETE /api/users/push-token - Remove push token (on logout)
router.delete('/push-token', removePushToken);

export default router;
