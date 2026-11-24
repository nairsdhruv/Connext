import express from 'express';
import { z } from 'zod';
import {
  createHotspot,
  getHotspots,
  getNearbyHotspots,
  getHotspotById,
  updateHotspot,
  deleteHotspot,
  getMyHotspots
} from '../controllers/hotspotController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const createHotspotSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(100),
    description: z.string().min(10).max(1500),
    category: z.enum([
      'cafes',
      'parks',
      'college',
      'libraries',
      'walking_running',
      'study_groups',
      'board_games',
      'music',
      'food',
      'casual_chat',
      'sports',
      'other'
    ]),
    type: z.enum(['hangout', 'meetup']).default('hangout'),
    coordinates: z.array(z.number()).length(2),
    address: z.string().min(3).max(300),
    capacity: z.number().min(2).max(500).optional(),
    startDateTime: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)).optional(),
    endDateTime: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)).optional(),
    imageUrl: z.string().url().or(z.literal('')).optional(),
    tags: z.array(z.string()).or(z.string()).optional()
  })
});

router.get('/', optionalAuth, getHotspots);
router.get('/nearby', optionalAuth, getNearbyHotspots);
router.get('/my', requireAuth, getMyHotspots);
router.get('/:id', optionalAuth, getHotspotById);
router.post('/', requireAuth, validate(createHotspotSchema), createHotspot);
router.patch('/:id', requireAuth, updateHotspot);
router.delete('/:id', requireAuth, deleteHotspot);

export default router;
