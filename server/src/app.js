import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import hotspotRoutes from './routes/hotspotRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import meetupRoutes from './routes/meetupRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import mapRoutes from './routes/mapRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const createApp = () => {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  app.use(
    cors({
      origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { success: false, message: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api/', apiLimiter);

  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      service: 'Connext API',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });


  app.use('/api/auth', authRoutes);
  app.use('/api/hotspots', hotspotRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/meetups', meetupRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/map', mapRoutes);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Endpoint not found: ${req.method} ${req.originalUrl}`
    });
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
};
