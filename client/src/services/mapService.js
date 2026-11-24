import L from 'leaflet';
import api from './api';

// Calculate Great Circle Distance in meters between two lat/lng points
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

// Format distance nicely: "450 m" or "3.2 km"
export const formatDistance = (meters) => {
  if (meters === null || meters === undefined || isNaN(meters)) return '';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

// Format duration in minutes / hours
export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '';
  const mins = Math.round(seconds / 60);
  if (mins < 60) {
    return `${mins} min${mins === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours} hr ${remainingMins} min`;
};

// Category metadata: labels, badge colors, icon SVGs
export const CATEGORY_CONFIG = {
  cafes: { label: 'Cafés & Coffee', color: '#f59e0b', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  parks: { label: 'Parks & Nature', color: '#10b981', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  college: { label: 'College Hangouts', color: '#3b82f6', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  libraries: { label: 'Libraries & Quiet', color: '#8b5cf6', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  walking_running: { label: 'Walking & Running', color: '#06b6d4', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  study_groups: { label: 'Study Groups', color: '#6366f1', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  board_games: { label: 'Board Games', color: '#ec4899', bg: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  music: { label: 'Music & Jamming', color: '#f43f5e', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  food: { label: 'Food & Dining', color: '#eab308', bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  casual_chat: { label: 'Casual Chat', color: '#14b8a6', bg: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  sports: { label: 'Sports & Active', color: '#22c55e', bg: 'bg-green-500/20 text-green-300 border-green-500/30' },
  other: { label: 'Other Social', color: '#94a3b8', bg: 'bg-slate-500/20 text-slate-300 border-slate-500/30' }
};

// Search places using server proxy with fallback
export const searchPlaces = async (query) => {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await api.get(`/map/search?q=${encodeURIComponent(query)}`);
    if (res.data?.success && res.data.results) {
      return res.data.results;
    }
  } catch (err) {
    console.warn('[MapSearch] Proxy search fallback to direct nominatim:', err.message);
  }

  // Direct fallback
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`, {
      headers: { 'Accept-Language': 'en' }
    });
    const data = await res.json();
    return data.map((item) => ({
      placeId: item.place_id,
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon)
    }));
  } catch (e) {
    throw new Error('Unable to search locations right now. Please select on map directly.');
  }
};

// Calculate real route using server proxy with direct OSRM fallback
export const calculateRoute = async (profile = 'driving', startCoords, endCoords) => {
  // startCoords: [lng, lat], endCoords: [lng, lat]
  const [startLng, startLat] = startCoords;
  const [endLng, endLat] = endCoords;

  try {
    const res = await api.get('/map/route', {
      params: {
        profile,
        startLng,
        startLat,
        endLng,
        endLat
      }
    });
    if (res.data?.success && res.data.route) {
      return res.data.route;
    }
  } catch (err) {
    console.warn('[MapRoute] Server proxy failed, trying direct OSRM:', err.message);
  }

  // Direct fallback to OSRM
  const url = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data || data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('No route found between these locations.');
  }

  const primary = data.routes[0];
  const steps = [];
  if (primary.legs?.length) {
    for (const leg of primary.legs) {
      for (const step of leg.steps || []) {
        steps.push({
          instruction: step.maneuver?.instruction || step.name || 'Continue',
          type: step.maneuver?.type || 'turn',
          modifier: step.maneuver?.modifier || '',
          distance: Math.round(step.distance),
          duration: Math.round(step.duration),
          location: step.maneuver?.location || []
        });
      }
    }
  }

  return {
    distanceMeters: Math.round(primary.distance),
    durationSeconds: Math.round(primary.duration),
    geometry: primary.geometry,
    steps,
    profile
  };
};

// Leaflet DivIcons
export const createHotspotIcon = (category, type, isSelected = false) => {
  const conf = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  const isMeetup = type === 'meetup';
  const size = isSelected ? 40 : 32;
  const glow = isSelected ? `box-shadow: 0 0 20px ${conf.color};` : 'box-shadow: 0 4px 10px rgba(0,0,0,0.5);';
  const border = isSelected ? 'border: 3px solid #ffffff;' : 'border: 2px solid #0f141c;';
  const badge = isMeetup ? `<span style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;background:#6366f1;border:2px solid #090b0e;border-radius:50%;"></span>` : '';

  return L.divIcon({
    className: 'custom-hotspot-marker',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;background:${conf.color};border-radius:50%;display:flex;align-items:center;justify-content:center;${border}${glow}transition:all 0.2s ease;">
        <span style="font-size:${isSelected ? '18px' : '14px'};line-height:1;">📍</span>
        ${badge}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

export const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `<div class="user-marker-pulse"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

export const createDestinationIcon = () => {
  return L.divIcon({
    className: 'custom-destination-marker',
    html: `
      <div style="position:relative;width:36px;height:36px;background:#10b981;border:3px solid #ffffff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px rgba(16,185,129,0.8);">
        <span style="font-size:16px;">🏁</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

export const createNewPinIcon = () => {
  return L.divIcon({
    className: 'custom-new-pin-marker',
    html: `
      <div style="position:relative;width:34px;height:34px;background:#06b6d4;border:3px solid #ffffff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 15px rgba(6,182,212,0.8);animation:bounce 1s infinite alternate;">
        <span style="font-size:16px;">➕</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
};
