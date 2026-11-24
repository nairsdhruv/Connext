import express from 'express';
import { getRoom, joinRoom, leaveRoom, getRoomMessages } from '../controllers/roomController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/:id', requireAuth, getRoom);
router.post('/:id/join', requireAuth, joinRoom);
router.post('/:id/leave', requireAuth, leaveRoom);
router.get('/:id/messages', requireAuth, getRoomMessages);

export default router;
