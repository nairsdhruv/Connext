import axios from 'axios';

// Simple in-memory cache to avoid repeated public OSM API calls
const geocodeCache = new Map();
const routeCache = new Map();
const CACHE_MAX_SIZE = 200;

const USER_AGENT = 'ConnextPlatform/1.0 (FullStack Educational Project; contact@connext.local)';

export const osmService = {
  /**
   * Search places using Nominatim with caching and rate compliance
   */
  async searchPlace(query, limit = 5) {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed.length < 3) {
      return [];
    }

    const cacheKey = `${trimmed}_${limit}`;
    const cached = geocodeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 3600 * 1000) {
      return cached.data;
    }

    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: trimmed,
          format: 'json',
          addressdetails: 1,
          limit,
          featuretype: 'settlement'
        },
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'en'
        },
        timeout: 6000
      });

      const formatted = response.data.map((item) => ({
        placeId: item.place_id,
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type,
        importance: item.importance,
        address: item.address
      }));

      // Cache result
      if (geocodeCache.size >= CACHE_MAX_SIZE) {
        const firstKey = geocodeCache.keys().next().value;
        geocodeCache.delete(firstKey);
      }
      geocodeCache.set(cacheKey, { timestamp: Date.now(), data: formatted });

      return formatted;
    } catch (error) {
      console.warn(`[Nominatim Warning] Geocoding request failed: ${error.message}`);
      throw new Error('Geocoding service is temporarily unreachable. Please enter or pick location manually.');
    }
  },

  /**
   * Reverse geocode coordinates to an address description
   */
  async reverseGeocode(lng, lat) {
    const cacheKey = `${lng.toFixed(4)},${lat.toFixed(4)}`;
    const cached = geocodeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 3600 * 1000) {
      return cached.data;
    }

    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat,
          lon: lng,
          format: 'json',
          addressdetails: 1
        },
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'en'
        },
        timeout: 6000
      });

      const result = {
        displayName: response.data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        address: response.data.address || {}
      };

      if (geocodeCache.size >= CACHE_MAX_SIZE) {
        const firstKey = geocodeCache.keys().next().value;
        geocodeCache.delete(firstKey);
      }
      geocodeCache.set(cacheKey, { timestamp: Date.now(), data: result });

      return result;
    } catch (error) {
      return { displayName: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, address: {} };
    }
  },

  /**
   * Calculate route using public OSRM routing engine
   * Coordinates in [lng, lat] order!
   */
  async calculateRoute(profile = 'driving', startCoords, endCoords) {
    // profile: 'driving', 'walking', 'cycling'
    // startCoords: [lng, lat], endCoords: [lng, lat]
    const [startLng, startLat] = startCoords;
    const [endLng, endLat] = endCoords;

    const cacheKey = `${profile}_${startLng.toFixed(4)},${startLat.toFixed(4)}_${endLng.toFixed(4)},${endLat.toFixed(4)}`;
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 600 * 1000) {
      return cached.data;
    }

    // OSRM expects coordinates in lng,lat;lng,lat format
    const url = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}`;

    try {
      const response = await axios.get(url, {
        params: {
          overview: 'full',
          geometries: 'geojson',
          steps: true
        },
        headers: {
          'User-Agent': USER_AGENT
        },
        timeout: 8000
      });

      if (!response.data || response.data.code !== 'Ok' || !response.data.routes?.length) {
        throw new Error('No route found between these locations.');
      }

      const primaryRoute = response.data.routes[0];

      // Parse turn steps into clear instructions
      const steps = [];
      if (primaryRoute.legs?.length) {
        for (const leg of primaryRoute.legs) {
          for (const step of leg.steps || []) {
            steps.push({
              instruction: step.maneuver?.instruction || (step.name ? `Head onto ${step.name}` : 'Continue'),
              type: step.maneuver?.type || 'turn',
              modifier: step.maneuver?.modifier || '',
              distance: Math.round(step.distance), // meters
              duration: Math.round(step.duration), // seconds
              location: step.maneuver?.location || [] // [lng, lat]
            });
          }
        }
      }

      const result = {
        distanceMeters: Math.round(primaryRoute.distance),
        durationSeconds: Math.round(primaryRoute.duration),
        geometry: primaryRoute.geometry, // GeoJSON LineString coordinates [[lng, lat], ...]
        steps,
        profile
      };

      if (routeCache.size >= CACHE_MAX_SIZE) {
        const firstKey = routeCache.keys().next().value;
        routeCache.delete(firstKey);
      }
      routeCache.set(cacheKey, { timestamp: Date.now(), data: result });

      return result;
    } catch (error) {
      console.warn(`[OSRM Warning] Route calculation failed: ${error.message}`);
      if (error.message.includes('No route')) {
        throw error;
      }
      throw new Error('Routing service is currently busy or unreachable. Please try again in a few moments.');
    }
  }
};
