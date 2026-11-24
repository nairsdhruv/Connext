import express from 'express';
import { z } from 'zod';
import { register, login, logout, getMe, updateProfile, blockUser, deleteAccount } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const registerSchema = z.object({
  body: z.object({
    displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    bio: z.string().max(300).optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.patch('/profile', requireAuth, updateProfile);
router.post('/block', requireAuth, blockUser);
router.delete('/account', requireAuth, deleteAccount);

export default router;
