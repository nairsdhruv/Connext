import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Lock, Mail, User, ArrowRight, RotateCw, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export const SignupPage = () => {
  const { register } = useAuth();
  const { notifySuccess, notifyError } = useNotification();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (displayName.trim().length < 2) {
      notifyError('Display name must be at least 2 characters.');
      return;
    }
    if (password.length < 6) {
      notifyError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(displayName.trim(), email.trim(), password, bio.trim());
      notifySuccess('Account created! Welcome to Connext.');
      navigate('/explore');
    } catch (err) {
      notifyError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-brand-primary/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">Connext</span>
        </Link>
        <h2 className="text-2xl font-black text-white tracking-tight">Join the Community</h2>
        <p className="mt-2 text-xs text-slate-400">
          Create a free account to discover hotspots, join meetups, and chat.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-dark-900 border border-dark-700/80 py-8 px-6 sm:px-10 rounded-3xl shadow-2xl backdrop-blur-md space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={50}
                  placeholder="e.g. Maya Patel"
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Bio / Interests (Optional)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={300}
                  placeholder="What brings you here? (e.g. coffee walks, board games, quiet study...)"
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-brand-primary hover:bg-cyan-400 disabled:opacity-50 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              {loading ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="pt-3 border-t border-dark-700/60 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-primary hover:underline font-bold">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
