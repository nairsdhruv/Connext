import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Users,
  Navigation,
  MessageSquare,
  ShieldAlert,
  Trash2,
  Share2,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { CATEGORY_CONFIG, formatDistance } from '../services/mapService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';

export const HotspotDetailModal = ({
  hotspot,
  onClose,
  onStartNavigation,
  onOpenChat,
  onHotspotUpdated,
  onOpenReport
}) => {
  const { user, isAuthenticated } = useAuth();
  const { notifySuccess, notifyError } = useNotification();
  const [loadingAction, setLoadingAction] = useState(false);

  if (!hotspot) return null;

  const cat = CATEGORY_CONFIG[hotspot.category] || CATEGORY_CONFIG.other;
  const isMeetup = hotspot.type === 'meetup';
  const isCreator = user && (hotspot.creator?._id === user.id || hotspot.creator?.id === user.id || hotspot.creator === user.id);
  const isAttending = user && hotspot.attendees?.some((a) => (a.user?._id || a.user?.id || a.user) === user.id);

  // RSVP / Join Meetup Handler
  const handleRsvp = async () => {
    if (!isAuthenticated) {
      notifyError('Please log in to join this meetup.');
      return;
    }
    setLoadingAction(true);
    try {
      const res = await api.post(`/meetups/${hotspot._id || hotspot.id}/rsvp`);
      if (res.data?.success) {
        notifySuccess('You are registered for this meetup! Temporary chat joined.');
        if (onHotspotUpdated) onHotspotUpdated(res.data.hotspot);
      }
    } catch (err) {
      notifyError(err.response?.data?.message || 'Could not join meetup.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Leave Meetup Handler
  const handleLeaveRsvp = async () => {
    setLoadingAction(true);
    try {
      const res = await api.post(`/meetups/${hotspot._id || hotspot.id}/cancel-rsvp`);
      if (res.data?.success) {
        notifySuccess('You have left this meetup.');
        if (onHotspotUpdated) {
          // Update attendees count locally
          const updated = {
            ...hotspot,
            attendees: hotspot.attendees.filter((a) => (a.user?._id || a.user?.id || a.user) !== user.id)
          };
          onHotspotUpdated(updated);
        }
      }
    } catch (err) {
      notifyError(err.response?.data?.message || 'Could not leave meetup.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Delete Hotspot Handler
  const handleDeleteHotspot = async () => {
    if (!window.confirm('Are you sure you want to delete this hotspot and close its chat room?')) return;
    setLoadingAction(true);
    try {
      const res = await api.delete(`/hotspots/${hotspot._id || hotspot.id}`);
      if (res.data?.success) {
        notifySuccess('Hotspot deleted.');
        onClose();
        if (onHotspotUpdated) onHotspotUpdated(null, true);
      }
    } catch (err) {
      notifyError(err.response?.data?.message || 'Could not delete hotspot.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-dark-900 border border-dark-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image or Gradient Banner */}
        <div className="relative h-44 sm:h-52 w-full bg-gradient-to-r from-dark-800 to-dark-700 overflow-hidden flex-shrink-0">
          {hotspot.imageUrl ? (
            <img
              src={hotspot.imageUrl}
              alt={hotspot.name}
              className="w-full h-full object-cover brightness-75"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-dark-800">
              <span className="text-6xl">📍</span>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-dark-950/80 hover:bg-dark-950 text-white backdrop-blur-md border border-dark-600 transition-transform active:scale-90"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges Overlay */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-lg ${cat.bg}`}>
              {cat.label}
            </span>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border shadow-lg ${
                isMeetup
                  ? 'bg-indigo-500/80 text-white border-indigo-400'
                  : 'bg-emerald-500/80 text-white border-emerald-400'
              }`}
            >
              {isMeetup ? 'Scheduled Meetup' : 'Public Hangout'}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Title & Creator */}
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight leading-snug mb-2">
              {hotspot.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Organized by</span>
              <span className="font-semibold text-slate-200">
                {hotspot.creator?.displayName || 'Community Member'}
              </span>
              <span>•</span>
              <span>
                {new Date(hotspot.createdAt || Date.now()).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-dark-800/60 border border-dark-700/60 rounded-2xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              About this spot
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {hotspot.description}
            </p>
          </div>

          {/* Date & Location Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-dark-800/40 border border-dark-700/40">
              <MapPin className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                  Location
                </div>
                <div className="text-slate-200 font-medium leading-tight">
                  {hotspot.address}
                </div>
              </div>
            </div>

            {isMeetup && hotspot.startDateTime && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-dark-800/40 border border-dark-700/40">
                <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                    Date & Time
                  </div>
                  <div className="text-slate-200 font-medium leading-tight">
                    {new Date(hotspot.startDateTime).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Participants / Attendees */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-dark-800/40 border border-dark-700/40">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-indigo-400" />
              <div>
                <div className="text-sm font-semibold text-white">
                  {hotspot.attendees?.length || 1} participant
                  {(hotspot.attendees?.length || 1) === 1 ? '' : 's'}
                </div>
                {hotspot.capacity && (
                  <div className="text-xs text-slate-400">
                    Capacity limit: {hotspot.capacity} people
                  </div>
                )}
              </div>
            </div>

            {isMeetup && (
              <div>
                {isAttending ? (
                  <button
                    onClick={handleLeaveRsvp}
                    disabled={loadingAction}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium px-3 py-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 transition-colors"
                  >
                    Leave Meetup
                  </button>
                ) : (
                  <button
                    onClick={handleRsvp}
                    disabled={loadingAction}
                    className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors shadow-md shadow-indigo-600/30"
                  >
                    Join Meetup
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          {hotspot.tags?.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {hotspot.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs text-slate-400 bg-dark-800 px-2.5 py-1 rounded-md border border-dark-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions Bar */}
        <div className="p-4 sm:p-5 bg-dark-950/80 border-t border-dark-700/60 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => onStartNavigation(hotspot)}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-brand-primary hover:bg-cyan-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Navigation className="w-4 h-4 stroke-[2.5]" />
            <span>Get Directions / Live Nav</span>
          </button>

          <button
            onClick={() => onOpenChat(hotspot)}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-100 font-bold text-sm border border-dark-600 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4 text-brand-primary" />
            <span>Temporary Chat</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isCreator && (
              <button
                onClick={handleDeleteHotspot}
                disabled={loadingAction}
                title="Delete this hotspot"
                className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                aria-label="Delete hotspot"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => onOpenReport(hotspot)}
              title="Report safety or moderation concern"
              className="p-3 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-amber-400 border border-dark-600 transition-colors"
              aria-label="Report"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
