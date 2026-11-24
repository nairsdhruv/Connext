import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  FileText,
  Calendar,
  MapPin,
  Trash2,
  MessageSquare,
  Navigation,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  LogOut,
  Sparkles
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { ChatRoomModal } from '../components/ChatRoomModal';
import { LiveNavigationModal } from '../components/LiveNavigationModal';
import api from '../services/api';

export const ProfilePage = () => {
  const { user, updateProfile, deleteAccount, logout } = useAuth();
  const { notifySuccess, notifyError } = useNotification();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [updating, setUpdating] = useState(false);

  const [createdHotspots, setCreatedHotspots] = useState([]);
  const [attendingMeetups, setAttendingMeetups] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Modals for jumping straight to Chat or Navigation
  const [activeChatHotspot, setActiveChatHotspot] = useState(null);
  const [activeNavHotspot, setActiveNavHotspot] = useState(null);

  // Fetch user's hotspots and joined meetups
  useEffect(() => {
    const fetchUserActivities = async () => {
      setLoadingActivities(true);
      try {
        const res = await api.get('/hotspots/my');
        if (res.data?.success) {
          setCreatedHotspots(res.data.created || []);
          setAttendingMeetups(res.data.attending || []);
        }
      } catch (err) {
        console.error('[Fetch My Hotspots Error]', err);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchUserActivities();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateProfile({ displayName, bio });
      notifySuccess('Profile updated successfully!');
    } catch (err) {
      notifyError(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete your account? All your created hotspots, chats, and registrations will be deleted.'
      )
    ) {
      return;
    }

    try {
      await deleteAccount();
      notifySuccess('Your account and associated resources have been removed.');
      navigate('/');
    } catch (err) {
      notifyError(err.response?.data?.message || 'Failed to delete account.');
    }
  };

  const handleDeleteCreatedHotspot = async (id) => {
    if (!window.confirm('Delete this hotspot and close its chat room?')) return;
    try {
      const res = await api.delete(`/hotspots/${id}`);
      if (res.data?.success) {
        notifySuccess('Hotspot deleted.');
        setCreatedHotspots((prev) => prev.filter((h) => (h._id || h.id) !== id));
      }
    } catch (err) {
      notifyError('Failed to delete hotspot.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Header Profile Summary */}
        <div className="p-8 rounded-3xl bg-dark-900 border border-dark-700/80 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-3xl font-black text-black shadow-xl shadow-cyan-500/20 flex-shrink-0">
            {user?.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-white">{user?.displayName}</h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center justify-center md:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{user?.email}</span>
            </p>
            {user?.bio && (
              <p className="text-sm text-slate-300 mt-3 max-w-2xl leading-relaxed">
                "{user.bio}"
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            <Link
              to="/explore"
              className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-cyan-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <MapPin className="w-4 h-4" />
              <span>Explore Map</span>
            </Link>
          </div>
        </div>

        {/* Two Column Grid: Profile Settings + User Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Edit Profile & Safety */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-dark-900 border border-dark-700/80 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-brand-primary" />
                <span>Edit Profile</span>
              </h3>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    minLength={2}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Bio & Interests
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={300}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-xs font-bold text-slate-200 transition-colors"
                >
                  {updating ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>

            {/* Privacy & Safety Information */}
            <div className="p-6 rounded-3xl bg-dark-900/60 border border-dark-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Your Location Privacy</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your precise GPS location is kept strictly local to your browser during navigation. It is never uploaded or broadcast to other chat room participants.
              </p>
            </div>

            {/* Danger Zone: Account Deletion */}
            <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-900/40 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Account Actions</span>
              </h4>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="w-full py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors"
              >
                Delete Account & Data
              </button>
            </div>
          </div>

          {/* Right Column: User's Created Hotspots & Joined Meetups */}
          <div className="lg:col-span-2 space-y-8">
            {/* Joined Meetups */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  <span>Joined Meetups ({attendingMeetups.length})</span>
                </h3>
              </div>

              {loadingActivities ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading meetups...</div>
              ) : attendingMeetups.length === 0 ? (
                <div className="p-6 rounded-2xl bg-dark-900/40 border border-dark-800 text-center text-xs text-slate-400">
                  You haven't joined any meetups yet.{' '}
                  <Link to="/explore" className="text-brand-primary underline font-bold">
                    Discover upcoming meetups on the map
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {attendingMeetups.map((spot) => (
                    <div
                      key={spot._id || spot.id}
                      className="p-4 rounded-2xl bg-dark-900 border border-dark-700/80 space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
                          {spot.category}
                        </div>
                        <h4 className="font-bold text-white text-sm line-clamp-1">{spot.name}</h4>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-1">{spot.address}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-dark-800">
                        <button
                          onClick={() => setActiveChatHotspot(spot)}
                          className="flex-1 py-2 px-3 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-brand-primary" />
                          <span>Chat Room</span>
                        </button>
                        <button
                          onClick={() => setActiveNavHotspot(spot)}
                          className="py-2 px-3 rounded-xl bg-brand-primary/20 hover:bg-brand-primary/30 border border-brand-primary/40 text-xs font-bold text-brand-primary flex items-center justify-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Directions</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Created Hotspots */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-primary" />
                  <span>My Created Hotspots ({createdHotspots.length})</span>
                </h3>
              </div>

              {loadingActivities ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading spots...</div>
              ) : createdHotspots.length === 0 ? (
                <div className="p-6 rounded-2xl bg-dark-900/40 border border-dark-800 text-center text-xs text-slate-400">
                  You haven't created any hotspots yet.{' '}
                  <Link to="/explore" className="text-brand-primary underline font-bold">
                    Create your first spot on the map
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {createdHotspots.map((spot) => (
                    <div
                      key={spot._id || spot.id}
                      className="p-4 rounded-2xl bg-dark-900 border border-dark-700/80 space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                            {spot.category}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">{spot.status}</span>
                        </div>
                        <h4 className="font-bold text-white text-sm line-clamp-1">{spot.name}</h4>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-1">{spot.address}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-dark-800">
                        <button
                          onClick={() => setActiveChatHotspot(spot)}
                          className="flex-1 py-2 px-3 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-brand-primary" />
                          <span>Chat Room</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCreatedHotspot(spot._id || spot.id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          title="Delete hotspot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Quick Launch Modals */}
      {activeChatHotspot && (
        <ChatRoomModal
          hotspot={activeChatHotspot}
          onClose={() => setActiveChatHotspot(null)}
        />
      )}

      {activeNavHotspot && (
        <LiveNavigationModal
          hotspot={activeNavHotspot}
          onClose={() => setActiveNavHotspot(null)}
        />
      )}
    </div>
  );
};
