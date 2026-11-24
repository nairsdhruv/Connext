import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  createHotspotIcon,
  createUserLocationIcon,
  createDestinationIcon,
  createNewPinIcon,
  CATEGORY_CONFIG
} from '../services/mapService';
import { Navigation, Target, Layers } from 'lucide-react';

// Subcomponent to handle map center changes smoothly
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || map.getZoom(), { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

// Subcomponent to listen for clicks when picking a new location on the map
const LocationPickerListener = ({ isSelecting, onLocationSelected }) => {
  useMapEvents({
    click(e) {
      if (isSelecting && onLocationSelected) {
        onLocationSelected({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    }
  });
  return null;
};

export const MapView = ({
  hotspots = [],
  selectedHotspot = null,
  onSelectHotspot,
  userLocation = null, // { lat, lng, accuracy }
  activeRoute = null, // GeoJSON LineString coordinates [[lng, lat], ...]
  isSelectingLocation = false,
  pendingPin = null, // { lat, lng }
  onLocationSelected,
  onLocateUser,
  className = ''
}) => {
  const mapRef = useRef(null);

  // Default fallback center: Bengaluru Central
  const defaultCenter = [12.9716, 77.5946];
  const activeCenter = userLocation
    ? [userLocation.lat, userLocation.lng]
    : selectedHotspot
    ? [selectedHotspot.location.coordinates[1], selectedHotspot.location.coordinates[0]]
    : defaultCenter;

  // Convert Route GeoJSON coordinates [lng, lat] to Leaflet polyline format [lat, lng]
  const routePositions =
    activeRoute?.coordinates?.map(([lng, lat]) => [lat, lng]) || [];

  return (
    <div className={`relative w-full h-full min-h-[450px] overflow-hidden ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        ref={mapRef}
      >
        <MapController
          center={
            selectedHotspot
              ? [selectedHotspot.location.coordinates[1], selectedHotspot.location.coordinates[0]]
              : undefined
          }
        />

        <LocationPickerListener
          isSelecting={isSelectingLocation}
          onLocationSelected={onLocationSelected}
        />

        {/* Real OpenStreetMap Tiles Layer */}
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors | <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">Report OSM Issue</a>'
          maxZoom={19}
        />

        {/* Hotspots Markers */}
        {hotspots.map((spot) => {
          const lat = spot.location.coordinates[1];
          const lng = spot.location.coordinates[0];
          const isSelected = selectedHotspot?._id === spot._id || selectedHotspot?.id === spot.id;
          const icon = createHotspotIcon(spot.category, spot.type, isSelected);
          const cat = CATEGORY_CONFIG[spot.category] || CATEGORY_CONFIG.other;

          return (
            <Marker
              key={spot._id || spot.id}
              position={[lat, lng]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectHotspot && onSelectHotspot(spot)
              }}
            >
              <Popup className="custom-dark-popup">
                <div className="p-1 min-w-[200px]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${cat.bg}`}>
                      {cat.label}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize font-medium">
                      • {spot.type}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white leading-tight mb-1">{spot.name}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2 mb-2">{spot.address}</p>
                  <button
                    onClick={() => onSelectHotspot && onSelectHotspot(spot)}
                    className="w-full py-1.5 px-3 rounded-lg bg-brand-primary text-black font-semibold text-xs hover:bg-cyan-400 transition-colors shadow-sm"
                  >
                    View Details & Chat
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* User Current Position Marker */}
        {userLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={createUserLocationIcon()}
              zIndexOffset={1000}
            >
              <Popup>
                <div className="text-xs text-center font-medium">
                  <span className="font-bold text-brand-primary">Your Current Location</span>
                  {userLocation.accuracy && (
                    <div className="text-[10px] text-slate-400">
                      Accuracy: ~{Math.round(userLocation.accuracy)}m
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
            {userLocation.accuracy && (
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={userLocation.accuracy}
                pathOptions={{
                  color: '#06b6d4',
                  fillColor: '#06b6d4',
                  fillOpacity: 0.1,
                  weight: 1
                }}
              />
            )}
          </>
        )}

        {/* Selected Destination Marker */}
        {selectedHotspot && (
          <Marker
            position={[
              selectedHotspot.location.coordinates[1],
              selectedHotspot.location.coordinates[0]
            ]}
            icon={createDestinationIcon()}
            zIndexOffset={900}
          />
        )}

        {/* Pin Drop for Creating a New Hotspot */}
        {pendingPin && (
          <Marker
            position={[pendingPin.lat, pendingPin.lng]}
            icon={createNewPinIcon()}
            zIndexOffset={1100}
          />
        )}

        {/* Real Calculated Route Polyline */}
        {routePositions.length > 0 && (
          <>
            {/* Outer casing */}
            <Polyline
              positions={routePositions}
              pathOptions={{
                color: '#083344',
                weight: 8,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Inner neon track */}
            <Polyline
              positions={routePositions}
              pathOptions={{
                color: '#06b6d4',
                weight: 5,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          </>
        )}
      </MapContainer>

      {/* Floating Map Controls */}
      <div className="absolute bottom-6 right-5 z-20 flex flex-col gap-2">
        {onLocateUser && (
          <button
            onClick={onLocateUser}
            title="Center on My Location"
            className="w-11 h-11 rounded-xl bg-dark-900/90 hover:bg-dark-800 text-brand-primary border border-dark-700/80 shadow-xl backdrop-blur-md flex items-center justify-center transition-all active:scale-95"
            aria-label="Locate me"
          >
            <Navigation className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Picking Location Banner */}
      {isSelectingLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-brand-primary text-black font-semibold text-sm px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <Target className="w-4 h-4" />
          Click anywhere on the map to set hotspot location
        </div>
      )}
    </div>
  );
};
