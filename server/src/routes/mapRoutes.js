import express from 'express';
import { osmService } from '../services/osmService.js';

const router = express.Router();

// Place search using Nominatim
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, results: [] });
    }
    const results = await osmService.searchPlace(q, Number(limit));
    res.json({ success: true, results });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: err.message || 'Geocoding service unavailable'
    });
  }
});

// Reverse geocoding
router.get('/reverse', async (req, res) => {
  try {
    const { lng, lat } = req.query;
    if (!lng || !lat) {
      return res.status(400).json({ success: false, message: 'lng and lat required' });
    }
    const result = await osmService.reverseGeocode(Number(lng), Number(lat));
    res.json({ success: true, result });
  } catch (err) {
    res.status(503).json({ success: false, message: err.message });
  }
});

// Route calculation using OSRM
router.get('/route', async (req, res) => {
  try {
    const { profile = 'driving', startLng, startLat, endLng, endLat } = req.query;
    if (!startLng || !startLat || !endLng || !endLat) {
      return res.status(400).json({
        success: false,
        message: 'startLng, startLat, endLng, and endLat are required.'
      });
    }

    const startCoords = [Number(startLng), Number(startLat)];
    const endCoords = [Number(endLng), Number(endLat)];

    const route = await osmService.calculateRoute(profile, startCoords, endCoords);
    res.json({ success: true, route });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'Could not calculate route.'
    });
  }
});

export default router;
