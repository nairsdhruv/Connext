import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Compass,
  MapPin,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  SlidersHorizontal,
  X,
  AlertCircle
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { MapView } from '../components/MapView';
import { HotspotCard } from '../components/HotspotCard';
import { HotspotDetailModal } from '../components/HotspotDetailModal';
import { LiveNavigationModal } from '../components/LiveNavigationModal';
import { ChatRoomModal } from '../components/ChatRoomModal';
import { CreateHotspotModal } from '../components/CreateHotspotModal';
import { ReportModal } from '../components/ReportModal';
import { CATEGORY_CONFIG, calculateHaversineDistance } from '../services/mapService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';

export const DiscoveryPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { notifySuccess, notifyError, notifyInfo } = useNotification();

  // Data & Filter States
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'hangout', 'meetup'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'distance', 'upcoming'

  // Map and Geolocation States
  const [userLocation, setUserLocation] = useState(null); // { lat, lng, accuracy }
  const [activeRouteGeometry, setActiveRouteGeometry] = useState(null);
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  // Pin dropping for new hotspot
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [pendingPin, setPendingPin] = useState(null); // { lat, lng }

  // Modal States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNavModal, setShowNavModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Responsive Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch Hotspots from Server
  const fetchHotspots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        search: searchQuery.trim() || undefined,
        sort: sortBy
      };

      const res = await api.get('/hotspots', { params });
      if (res.data?.success && res.data.hotspots) {
        setHotspots(res.data.hotspots);
      }
    } catch (err) {
      console.error('[Fetch Hotspots Error]', err);
      setError(err.response?.data?.message || 'Could not load hotspots. Check database connection.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedType, searchQuery, sortBy]);

  useEffect(() => {
    fetchHotspots();
  }, [fetchHotspots]);

  // Request user location with browser geolocation
  const handleLocateUser = useCallback(() => {
    if (!navigator.geolocation) {
      notifyError('Browser Geolocation is not supported by your browser.');
      return;
    }

    notifyInfo('Detecting your location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        setUserLocation(loc);
        notifySuccess('Location centered on map!');
      },
      (err) => {
        console.warn('[Location permission denied or timed out]', err.message);
        notifyError('Location permission denied. You can still browse and select hotspots.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }, [notifySuccess, notifyError, notifyInfo]);

  // Handle map selection for creating a new hotspot
  const handleStartMapSelection = () => {
    setShowCreateModal(false);
    setIsSelectingLocation(true);
    notifyInfo('Click on the map where your hotspot is located.');
  };

  const handleLocationSelected = (coords) => {
    // coords: { lat, lng }
    setPendingPin(coords);
    setIsSelectingLocation(false);
    setShowCreateModal(true);
    notifySuccess('Location picked! Complete the hotspot details.');
  };

  // Hotspot Clicked
  const handleSelectHotspot = (spot) => {
    setSelectedHotspot(spot);
    setShowDetailModal(true);
  };

  // Start Navigation from Detail Modal
  const handleStartNavigationFromDetail = (spot) => {
    setShowDetailModal(false);
    setSelectedHotspot(spot);
    setShowNavModal(true);
  };

  // Open Chat from Detail Modal
  const handleOpenChatFromDetail = (spot) => {
    if (!isAuthenticated) {
      notifyError('Please log in to join temporary chat rooms.');
      return;
    }
    setShowDetailModal(false);
    setSelectedHotspot(spot);
    setShowChatModal(true);
  };

  // Open Report Modal
  const handleOpenReportFromDetail = (spot) => {
    if (!isAuthenticated) {
      notifyError('Please log in to submit a report.');
      return;
    }
    setSelectedHotspot(spot);
    setShowReportModal(true);
  };

  // Hotspot Updated / Deleted
  const handleHotspotUpdated = (updatedSpot, wasDeleted) => {
    if (wasDeleted) {
      setHotspots((prev) => prev.filter((s) => s._id !== selectedHotspot?._id));
      setSelectedHotspot(null);
    } else if (updatedSpot) {
      setHotspots((prev) =>
        prev.map((s) => (s._id === updatedSpot._id ? updatedSpot : s))
      );
      setSelectedHotspot(updatedSpot);
    }
  };

  // Distance computation for sorting
  const sortedAndFilteredHotspots = useMemo(() => {
    let list = [...hotspots];

    if (userLocation) {
      list = list.map((spot) => {
        const d = calculateHaversineDistance(
          userLocation.lat,
          userLocation.lng,
          spot.location.coordinates[1],
          spot.location.coordinates[0]
        );
        return { ...spot, distanceMeters: d };
      });

      if (sortBy === 'distance') {
        list.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
      }
    }

    return list;
  }, [hotspots, userLocation, sortBy]);

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-950 overflow-hidden">
      {/* Navbar */}
      <Navbar onOpenCreateModal={() => setShowCreateModal(true)} />

      {/* Main Split Cockpit */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Left Sidebar: Filters & Hotspot Cards List */}
        <div
          className={`absolute sm:relative z-20 h-full w-full sm:w-[420px] lg:w-[460px] bg-dark-900 border-r border-dark-700/80 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:-translate-x-full'
          }`}
        >
          {/* Top Search & Filter Bar */}
          <div className="p-4 bg-dark-950/80 border-b border-dark-700/70 space-y-3 flex-shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search spots, addresses, activities..."
                className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type Filter Buttons */}
            <div className="flex p-1 bg-dark-800 rounded-xl border border-dark-700 text-xs font-bold">
              <button
                onClick={() => setSelectedType('all')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  selectedType === 'all' ? 'bg-dark-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Spots
              </button>
              <button
                onClick={() => setSelectedType('hangout')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  selectedType === 'hangout' ? 'bg-emerald-500 text-black shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hangouts
              </button>
              <button
                onClick={() => setSelectedType('meetup')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  selectedType === 'meetup' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Meetups
              </button>
            </div>

            {/* Category Chips Scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold flex-shrink-0 transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-brand-primary text-black'
                    : 'bg-dark-800 text-slate-300 hover:bg-dark-700 border border-dark-700'
                }`}
              >
                All Categories
              </button>
              {Object.entries(CATEGORY_CONFIG).map(([key, conf]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 transition-colors border ${
                    selectedCategory === key
                      ? 'bg-brand-primary text-black border-transparent font-bold'
                      : `${conf.bg} hover:brightness-125`
                  }`}
                >
                  {conf.label}
                </button>
              ))}
            </div>

            {/* Sort & Count Header */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>
                Found <span className="font-bold text-white">{sortedAndFilteredHotspots.length}</span> spots
              </span>

              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-slate-300 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="newest" className="bg-dark-900 text-white">Newest First</option>
                  <option value="distance" className="bg-dark-900 text-white">Nearest Distance</option>
                  <option value="upcoming" className="bg-dark-900 text-white">Upcoming Time</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hotspots Card Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
                <RotateCw className="w-6 h-6 animate-spin text-brand-primary" />
                <span>Loading hotspots from database...</span>
              </div>
            ) : error ? (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs text-center space-y-2">
                <AlertCircle className="w-6 h-6 mx-auto text-rose-400" />
                <p>{error}</p>
                <button
                  onClick={fetchHotspots}
                  className="px-3 py-1 rounded-lg bg-rose-800 hover:bg-rose-700 text-white font-semibold"
                >
                  Retry Connection
                </button>
              </div>
            ) : sortedAndFilteredHotspots.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center p-4">
                <div className="w-14 h-14 rounded-2xl bg-dark-800 border border-dark-700 flex items-center justify-center text-2xl mb-3">
                  🔍
                </div>
                <h4 className="text-white font-bold text-base mb-1">No hotspots match filters</h4>
                <p className="text-xs text-slate-400 max-w-xs mb-4">
                  Try clearing your search or category filters, or be the first to create one!
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-xl bg-brand-primary text-black font-bold text-xs"
                >
                  Create Hotspot Here
                </button>
              </div>
            ) : (
              sortedAndFilteredHotspots.map((spot) => (
                <HotspotCard
                  key={spot._id || spot.id}
                  hotspot={spot}
                  isSelected={selectedHotspot?._id === spot._id}
                  onSelect={handleSelectHotspot}
                  userLocation={userLocation}
                />
              ))
            )}
          </div>
        </div>

        {/* Floating Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 left-4 z-30 p-2.5 rounded-xl bg-dark-900/95 hover:bg-dark-800 text-white border border-dark-700 shadow-2xl backdrop-blur-md hidden sm:flex items-center justify-center transition-transform active:scale-95"
          style={{ transform: sidebarOpen ? 'translateX(415px)' : 'translateX(0)' }}
          aria-label="Toggle hotspots sidebar"
        >
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        {/* Mobile View Toggle Button (Toggle between Map and List) */}
        <div className="sm:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="px-4 py-2.5 rounded-full bg-dark-900/95 text-white font-bold text-xs border border-dark-700 shadow-2xl backdrop-blur-md flex items-center gap-2"
          >
            {sidebarOpen ? <Compass className="w-4 h-4 text-brand-primary" /> : <Layers className="w-4 h-4 text-brand-primary" />}
            <span>{sidebarOpen ? 'Show Map' : 'Show List'}</span>
          </button>
        </div>

        {/* Right Section: Real Leaflet Interactive Map */}
        <div className="flex-1 h-full w-full relative">
          <MapView
            hotspots={sortedAndFilteredHotspots}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={handleSelectHotspot}
            userLocation={userLocation}
            activeRoute={activeRouteGeometry}
            isSelectingLocation={isSelectingLocation}
            pendingPin={pendingPin}
            onLocationSelected={handleLocationSelected}
            onLocateUser={handleLocateUser}
          />
        </div>
      </div>

      {/* Modals */}
      {showDetailModal && selectedHotspot && (
        <HotspotDetailModal
          hotspot={selectedHotspot}
          onClose={() => setShowDetailModal(false)}
          onStartNavigation={handleStartNavigationFromDetail}
          onOpenChat={handleOpenChatFromDetail}
          onOpenReport={handleOpenReportFromDetail}
          onHotspotUpdated={handleHotspotUpdated}
        />
      )}

      {showNavModal && selectedHotspot && (
        <LiveNavigationModal
          hotspot={selectedHotspot}
          onClose={() => {
            setShowNavModal(false);
            setActiveRouteGeometry(null);
          }}
          onOpenChat={handleOpenChatFromDetail}
          onUpdateActiveRoute={setActiveRouteGeometry}
          onUpdateUserLocation={setUserLocation}
        />
      )}

      {showChatModal && selectedHotspot && (
        <ChatRoomModal
          hotspot={selectedHotspot}
          onClose={() => setShowChatModal(false)}
        />
      )}

      {showCreateModal && (
        <CreateHotspotModal
          onClose={() => {
            setShowCreateModal(false);
            setPendingPin(null);
          }}
          onHotspotCreated={(newSpot) => {
            setHotspots((prev) => [newSpot, ...prev]);
            setSelectedHotspot(newSpot);
            setPendingPin(null);
          }}
          onStartMapSelection={handleStartMapSelection}
          selectedCoordinates={pendingPin ? [pendingPin.lng, pendingPin.lat] : null}
        />
      )}

      {showReportModal && selectedHotspot && (
        <ReportModal
          targetType="hotspot"
          targetId={selectedHotspot._id || selectedHotspot.id}
          targetName={selectedHotspot.name}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};
