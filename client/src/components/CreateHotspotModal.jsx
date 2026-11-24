import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Users,
  Search,
  CheckCircle,
  AlertCircle,
  RotateCw
} from 'lucide-react';
import { CATEGORY_CONFIG, searchPlaces } from '../services/mapService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';

export const CreateHotspotModal = ({
  onClose,
  onHotspotCreated,
  onStartMapSelection,
  selectedCoordinates // [lng, lat] passed back when picked on map
}) => {
  const { user } = useAuth();
  const { notifySuccess, notifyError } = useNotification();

  const [type, setType] = useState('hangout'); // 'hangout' | 'meetup'
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('cafes');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState(selectedCoordinates || null); // [lng, lat]
  const [capacity, setCapacity] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('');

  // Place Search Dropdown State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sync selectedCoordinates prop if updated externally
  useEffect(() => {
    if (selectedCoordinates) {
      setCoordinates(selectedCoordinates);
    }
  }, [selectedCoordinates]);

  // Handle Geocoding Search
  const handleSearchPlaces = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;

    setSearching(true);
    try {
      const results = await searchPlaces(searchQuery.trim());
      setSearchResults(results);
    } catch (err) {
      notifyError('Geocoding search failed. Please click on map to select coordinates.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    setCoordinates([result.lng, result.lat]); // [lng, lat]
    setAddress(result.displayName);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!coordinates || coordinates.length !== 2) {
      notifyError('Please select a physical location on the map or via place search.');
      return;
    }

    if (!name.trim() || name.trim().length < 3) {
      notifyError('Please enter a name of at least 3 characters.');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      notifyError('Please provide a helpful description of at least 10 characters.');
      return;
    }

    if (type === 'meetup') {
      if (!startDateTime || !endDateTime) {
        notifyError('Meetups require both a start and end time.');
        return;
      }
      if (new Date(endDateTime) <= new Date(startDateTime)) {
        notifyError('Meetup end time must be after the start time.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        category,
        type,
        coordinates, // [lng, lat]
        address: address.trim() || `${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`,
        capacity: capacity ? Number(capacity) : undefined,
        startDateTime: type === 'meetup' ? new Date(startDateTime).toISOString() : undefined,
        endDateTime: type === 'meetup' ? new Date(endDateTime).toISOString() : undefined,
        imageUrl: imageUrl.trim() || undefined,
        tags: tags ? tags.split(',').map((t) => t.trim().toLowerCase()) : []
      };

      const res = await api.post('/hotspots', payload);
      if (res.data?.success && res.data.hotspot) {
        notifySuccess(`"${res.data.hotspot.name}" created! Temporary chat room is ready.`);
        if (onHotspotCreated) onHotspotCreated(res.data.hotspot);
        onClose();
      }
    } catch (err) {
      notifyError(err.response?.data?.message || 'Could not create hotspot.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-dark-900 border border-dark-700/80 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-dark-950/90 border-b border-dark-700/80 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Create a New Hotspot</h3>
            <p className="text-xs text-slate-400">Bring people together in the real world.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-dark-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Type Toggle: Hangout vs Meetup */}
          <div className="flex p-1 bg-dark-800 rounded-xl border border-dark-700">
            <button
              type="button"
              onClick={() => setType('hangout')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                type === 'hangout'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Public Hangout Place
            </button>
            <button
              type="button"
              onClick={() => setType('meetup')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                type === 'meetup'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Scheduled Meetup
            </button>
          </div>

          {/* Location Picker Section */}
          <div className="p-4 rounded-2xl bg-dark-800/50 border border-dark-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-primary" />
                Physical Location (Required)
              </span>
              {coordinates ? (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {coordinates[1].toFixed(4)}, {coordinates[0].toFixed(4)}
                </span>
              ) : (
                <span className="text-xs text-amber-400 font-medium">Location not selected</span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onStartMapSelection) onStartMapSelection();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-dark-700 hover:bg-dark-600 text-xs font-bold text-white flex items-center justify-center gap-2 border border-dark-600 transition-colors"
              >
                <span>📍 Drop Pin on Map</span>
              </button>
            </div>

            {/* Nominatim Search Input */}
            <div className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Or search place name (e.g. Cubbon Park)..."
                  className="flex-1 bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
                />
                <button
                  type="button"
                  onClick={handleSearchPlaces}
                  disabled={searching}
                  className="px-3 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-xs font-semibold text-slate-200 border border-dark-600"
                >
                  {searching ? <RotateCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>

              {/* Dropdown Results */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-dark-950 border border-dark-700 rounded-xl shadow-2xl z-30 max-h-40 overflow-y-auto divide-y divide-dark-800">
                  {searchResults.map((r, i) => (
                    <div
                      key={i}
                      onClick={() => handleSelectSearchResult(r)}
                      className="p-2.5 text-xs text-slate-200 hover:bg-dark-800 cursor-pointer transition-colors"
                    >
                      {r.displayName}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Address description input */}
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address or landmark description (e.g. Bamboo Grove, Entrance Gate)"
              required
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
            />
          </div>

          {/* Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Hotspot Title
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Indiranagar Chess & Coffee"
                required
                minLength={3}
                maxLength={100}
                className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary"
              >
                {Object.entries(CATEGORY_CONFIG).map(([key, conf]) => (
                  <option key={key} value={key}>
                    {conf.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell people what to expect, what to bring, and how to spot each other..."
              required
              minLength={10}
              maxLength={1500}
              className="w-full bg-dark-800 border border-dark-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
            />
          </div>

          {/* If Meetup: Date & Time pickers */}
          {type === 'meetup' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  required={type === 'meetup'}
                  className="w-full bg-dark-900 border border-indigo-500/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  required={type === 'meetup'}
                  className="w-full bg-dark-900 border border-indigo-500/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          )}

          {/* Capacity & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Participant Limit (Optional)
              </label>
              <input
                type="number"
                min={2}
                max={500}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="e.g. 20"
                className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="coffee, books, coding"
                className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Image URL (Optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-brand-primary hover:bg-cyan-400 disabled:opacity-50 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 transition-all active:scale-95"
            >
              {submitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Creating Hotspot & Room...</span>
                </>
              ) : (
                <span>Publish Hotspot & Open Room</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
