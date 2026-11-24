import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Navigation,
  X,
  Compass,
  ArrowUp,
  ArrowUpRight,
  ArrowUpLeft,
  CornerUpRight,
  CornerUpLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  LocateFixed,
  Car,
  Footprints,
  Bike,
  MessageSquare
} from 'lucide-react';
import {
  calculateRoute,
  calculateHaversineDistance,
  formatDistance,
  formatDuration
} from '../services/mapService';

// Turn instruction icon picker
const getTurnIcon = (type, modifier) => {
  const mod = (modifier || '').toLowerCase();
  const t = (type || '').toLowerCase();

  if (t === 'arrive' || mod.includes('reach')) return <CheckCircle2 className="w-8 h-8 text-emerald-400" />;
  if (mod.includes('slight right') || mod.includes('right')) return <ArrowUpRight className="w-8 h-8 text-brand-primary" />;
  if (mod.includes('slight left') || mod.includes('left')) return <ArrowUpLeft className="w-8 h-8 text-brand-primary" />;
  if (mod.includes('sharp right')) return <CornerUpRight className="w-8 h-8 text-brand-primary" />;
  if (mod.includes('sharp left')) return <CornerUpLeft className="w-8 h-8 text-brand-primary" />;
  if (mod.includes('uturn')) return <RotateCw className="w-8 h-8 text-brand-primary" />;
  return <ArrowUp className="w-8 h-8 text-brand-primary" />;
};

export const LiveNavigationModal = ({
  hotspot,
  onClose,
  onOpenChat,
  onUpdateActiveRoute, // informs MapView to draw polyline
  onUpdateUserLocation // informs MapView to update user marker
}) => {
  const [profile, setProfile] = useState('driving'); // 'driving', 'walking', 'cycling'
  const [route, setRoute] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);

  // Live Navigation State
  const [isNavigating, setIsNavigating] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [remainingDistance, setRemainingDistance] = useState(0);
  const [remainingDuration, setRemainingDuration] = useState(0);
  const [isArrived, setIsArrived] = useState(false);
  const [isRerouting, setIsRerouting] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [manualOriginMode, setManualOriginMode] = useState(false);
  const [manualAddress, setManualAddress] = useState('');

  const watchIdRef = useRef(null);
  const lastRerouteTimeRef = useRef(0);
  const consecutiveOffRouteCountRef = useRef(0);

  const destCoords = hotspot?.location?.coordinates; // [lng, lat]

  // Cleanup geolocation watcher on unmount
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTracking();
      if (onUpdateActiveRoute) onUpdateActiveRoute(null);
    };
  }, [stopTracking, onUpdateActiveRoute]);

  // Fetch initial route when origin is determined
  const fetchRoute = useCallback(
    async (startLng, startLat, travelMode = profile) => {
      if (!destCoords || destCoords.length !== 2) {
        setRouteError('Invalid destination coordinates.');
        return;
      }

      setLoadingRoute(true);
      setRouteError(null);

      try {
        const calculated = await calculateRoute(travelMode, [startLng, startLat], destCoords);
        setRoute(calculated);
        setRemainingDistance(calculated.distanceMeters);
        setRemainingDuration(calculated.durationSeconds);
        setCurrentStepIndex(0);

        if (onUpdateActiveRoute) {
          onUpdateActiveRoute(calculated.geometry);
        }
      } catch (err) {
        setRouteError(err.message || 'Could not find a route to this destination.');
        if (onUpdateActiveRoute) onUpdateActiveRoute(null);
      } finally {
        setLoadingRoute(false);
      }
    },
    [destCoords, profile, onUpdateActiveRoute]
  );

  // Detect initial location and calculate route
  const acquireLocationAndPreview = useCallback(
    (travelMode = profile) => {
      if (!navigator.geolocation) {
        setLocationError('Browser Geolocation is not supported on this device.');
        setManualOriginMode(true);
        return;
      }

      setLocationError(null);
      setLoadingRoute(true);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed
          };
          setUserLocation(loc);
          if (onUpdateUserLocation) onUpdateUserLocation(loc);

          // Calculate initial route
          fetchRoute(loc.lng, loc.lat, travelMode);
        },
        (err) => {
          console.warn('[Geolocation Error]', err.message);
          let msg = 'Location access was denied or timed out.';
          if (err.code === 1) msg = 'Location permission was denied. Please allow location access or select a starting point.';
          if (err.code === 2) msg = 'Location position unavailable. Check GPS or network connection.';
          setLocationError(msg);
          setLoadingRoute(false);
          setManualOriginMode(true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    },
    [profile, fetchRoute, onUpdateUserLocation]
  );

  // Initial load
  useEffect(() => {
    acquireLocationAndPreview(profile);
  }, [acquireLocationAndPreview, profile]);

  // Mode change
  const handleModeChange = (newMode) => {
    setProfile(newMode);
    if (userLocation) {
      fetchRoute(userLocation.lng, userLocation.lat, newMode);
    }
  };

  // Start Live Navigation Watcher
  const handleStartLiveNavigation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported.');
      return;
    }

    setIsNavigating(true);
    setIsArrived(false);
    consecutiveOffRouteCountRef.current = 0;

    // Start watchPosition
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const curLoc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed
        };
        setUserLocation(curLoc);
        if (onUpdateUserLocation) onUpdateUserLocation(curLoc);

        // 1. Arrival Check: within 25m of destination
        const distToDest = calculateHaversineDistance(
          curLoc.lat,
          curLoc.lng,
          destCoords[1],
          destCoords[0]
        );

        setRemainingDistance(distToDest);

        if (distToDest <= 25 && curLoc.accuracy <= 60) {
          setIsArrived(true);
          setIsNavigating(false);
          stopTracking();
          return;
        }

        // 2. Advance Step Indicator
        if (route?.steps?.length && currentStepIndex < route.steps.length) {
          const currentStep = route.steps[currentStepIndex];
          if (currentStep.location?.length === 2) {
            const distToStep = calculateHaversineDistance(
              curLoc.lat,
              curLoc.lng,
              currentStep.location[1],
              currentStep.location[0]
            );
            if (distToStep < 20 && currentStepIndex < route.steps.length - 1) {
              setCurrentStepIndex((prev) => prev + 1);
            }
          }
        }

        // 3. Dynamic Deviation & Rerouting Check
        // Check if user is meaningfully far from route geometry
        if (route?.geometry?.coordinates?.length) {
          const minDistanceToRoute = route.geometry.coordinates.reduce((min, [lng, lat]) => {
            const d = calculateHaversineDistance(curLoc.lat, curLoc.lng, lat, lng);
            return Math.min(min, d);
          }, Infinity);

          const now = Date.now();
          if (minDistanceToRoute > 45 && curLoc.accuracy < 40) {
            consecutiveOffRouteCountRef.current += 1;
            // Require 2 consecutive deviations before re-requesting route
            if (
              consecutiveOffRouteCountRef.current >= 2 &&
              now - lastRerouteTimeRef.current > 12000
            ) {
              console.log('[LiveNav] Meaningful route deviation detected. Re-routing...');
              lastRerouteTimeRef.current = now;
              consecutiveOffRouteCountRef.current = 0;
              setIsRerouting(true);
              fetchRoute(curLoc.lng, curLoc.lat, profile).finally(() => {
                setIsRerouting(false);
              });
            }
          } else {
            consecutiveOffRouteCountRef.current = 0;
          }
        }
      },
      (err) => {
        console.warn('[LiveNav Watch Error]', err.message);
        setLocationError(`GPS update issue: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000
      }
    );
  };

  const handleEndNavigation = () => {
    stopTracking();
    setIsNavigating(false);
  };

  // Turn step data
  const currentStep = route?.steps?.[currentStepIndex] || route?.steps?.[0];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between pointer-events-none p-3 sm:p-5">
      {/* Top Turn-by-Turn Guidance Banner */}
      <div className="pointer-events-auto max-w-xl w-full mx-auto bg-dark-900/95 border border-dark-700/90 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md transition-all">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-primary">
            <Navigation className="w-4 h-4 animate-pulse" />
            <span>{isNavigating ? 'Live Turn-by-Turn Navigation' : 'Route Guidance Preview'}</span>
          </div>

          <button
            onClick={() => {
              handleEndNavigation();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-dark-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isRerouting && (
          <div className="mb-2 py-1 px-3 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-300 text-xs flex items-center gap-2">
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
            <span>Off-route detected. Calculating new route...</span>
          </div>
        )}

        {/* Big Turn Instruction Display */}
        {route ? (
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-dark-800 border border-dark-600 flex items-center justify-center flex-shrink-0 shadow-inner">
              {getTurnIcon(currentStep?.type, currentStep?.modifier)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xl sm:text-2xl font-black text-white leading-tight truncate">
                {currentStep?.instruction || 'Head towards destination'}
              </div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2">
                <span>In {formatDistance(currentStep?.distance || remainingDistance)}</span>
                <span>•</span>
                <span className="truncate">Destination: {hotspot?.name}</span>
              </div>
            </div>
          </div>
        ) : loadingRoute ? (
          <div className="py-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
            <RotateCw className="w-4 h-4 animate-spin text-brand-primary" />
            <span>Calculating optimal route via OSRM...</span>
          </div>
        ) : routeError ? (
          <div className="py-2 text-rose-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{routeError}</span>
          </div>
        ) : null}
      </div>

      {/* Arrival Celebration Card */}
      {isArrived && (
        <div className="pointer-events-auto max-w-md w-full mx-auto my-auto bg-dark-900 border-2 border-emerald-500 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-center animate-bounce-once">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-white mb-1">You Have Arrived!</h3>
          <p className="text-sm text-slate-300 mb-5">
            Welcome to <span className="font-bold text-white">{hotspot?.name}</span>. Look around, say hello, and jump into the temporary chat!
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => {
                onClose();
                if (onOpenChat) onOpenChat(hotspot);
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-brand-primary hover:bg-cyan-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Open Temporary Chat</span>
            </button>
            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-200 font-semibold text-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Bottom Telemetry HUD */}
      {!isArrived && (
        <div className="pointer-events-auto max-w-xl w-full mx-auto bg-dark-900/95 border border-dark-700/90 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
          {/* Mode Selector */}
          {!isNavigating && (
            <div className="flex items-center justify-between gap-2 mb-4 p-1 rounded-xl bg-dark-800 border border-dark-700">
              <button
                onClick={() => handleModeChange('driving')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  profile === 'driving' ? 'bg-brand-primary text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>Driving</span>
              </button>
              <button
                onClick={() => handleModeChange('walking')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  profile === 'walking' ? 'bg-brand-primary text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Footprints className="w-4 h-4" />
                <span>Walking</span>
              </button>
              <button
                onClick={() => handleModeChange('cycling')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  profile === 'cycling' ? 'bg-brand-primary text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Cycling</span>
              </button>
            </div>
          )}

          {/* Telemetry Metrics */}
          <div className="grid grid-cols-3 gap-2 py-2 mb-4 border-y border-dark-700/60 text-center">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Remaining Dist</div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {formatDistance(remainingDistance)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Est. Duration</div>
              <div className="text-xl sm:text-2xl font-black text-brand-primary">
                {formatDuration(remainingDuration)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Est. Arrival</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400">
                {new Date(Date.now() + remainingDuration * 1000).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>

          {/* Location permission error / fallback message */}
          {locationError && (
            <div className="mb-3 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{locationError}</span>
            </div>
          )}

          {/* Main Controls: Start Navigation or End Navigation */}
          <div className="flex items-center gap-3">
            {isNavigating ? (
              <button
                onClick={handleEndNavigation}
                className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
                <span>End Navigation</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleStartLiveNavigation}
                  disabled={loadingRoute || !route}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-brand-primary hover:bg-cyan-400 disabled:opacity-50 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 transition-all active:scale-95"
                >
                  <Navigation className="w-5 h-5 stroke-[2.5]" />
                  <span>Start Live Navigation</span>
                </button>
                <button
                  onClick={() => acquireLocationAndPreview(profile)}
                  title="Recenter & update GPS"
                  className="p-3.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-brand-primary border border-dark-600 transition-colors"
                >
                  <LocateFixed className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
