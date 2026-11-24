import express from 'express';
import { rsvpMeetup, cancelRsvpMeetup, cancelMeetup } from '../controllers/meetupController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/:id/rsvp', requireAuth, rsvpMeetup);
router.post('/:id/cancel-rsvp', requireAuth, cancelRsvpMeetup);
router.post('/:id/cancel', requireAuth, cancelMeetup);

export default router;
