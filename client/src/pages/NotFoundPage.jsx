import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-slate-100">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-dark-900 border border-dark-700 flex items-center justify-center text-4xl mb-6 shadow-2xl">
          🧭
        </div>
        <h1 className="text-4xl font-black text-white mb-2">404 - Off the Map</h1>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          The page or hotspot coordinate you're searching for doesn't exist or has expired.
        </p>
        <Link
          to="/explore"
          className="px-6 py-3 rounded-xl bg-brand-primary hover:bg-cyan-400 text-black font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Discovery Map</span>
        </Link>
      </div>
    </div>
  );
};
