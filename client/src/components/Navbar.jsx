import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Plus, User, LogOut, Compass, Shield, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ onOpenCreateModal }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-dark-900/80 backdrop-blur-md border-b border-dark-700/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Connext
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                Hotspot
              </span>
            </span>
            <span className="text-[11px] text-slate-400 font-medium -mt-1 hidden sm:inline">
              Real-world connection platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/explore"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/explore')
                ? 'bg-dark-800 text-brand-primary border border-dark-600'
                : 'text-slate-300 hover:text-white hover:bg-dark-800/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            Explore Map
          </Link>

          {isAuthenticated && (
            <Link
              to="/profile"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/profile')
                  ? 'bg-dark-800 text-brand-primary border border-dark-600'
                  : 'text-slate-300 hover:text-white hover:bg-dark-800/60'
              }`}
            >
              <User className="w-4 h-4" />
              My Hotspots & Meetups
            </Link>
          )}
        </nav>

        {/* Desktop CTA & Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {onOpenCreateModal && (
                <button
                  onClick={onOpenCreateModal}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold bg-brand-primary hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Create Hotspot</span>
                </button>
              )}

              <div className="flex items-center gap-2 pl-2 border-l border-dark-700">
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg hover:bg-dark-800 text-sm font-medium text-slate-200 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-secondary/30 border border-brand-secondary/40 flex items-center justify-center text-xs font-bold text-brand-secondary">
                    {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.displayName}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-dark-800 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-primary hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated && onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              className="p-2 rounded-lg bg-brand-primary text-black"
              aria-label="Create Hotspot"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-dark-800"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-dark-900 border-b border-dark-700 px-4 pt-2 pb-6 space-y-3">
          <Link
            to="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-slate-200 hover:bg-dark-800"
          >
            <Compass className="w-5 h-5 text-brand-primary" />
            Explore Map
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-slate-200 hover:bg-dark-800"
              >
                <User className="w-5 h-5 text-brand-primary" />
                My Hotspots & Meetups
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="w-5 h-5" />
                Log Out ({user?.displayName})
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg bg-dark-800 text-white font-medium"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg bg-brand-primary text-black font-semibold"
              >
                Sign Up Free
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
