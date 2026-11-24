import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  MessageSquare,
  ShieldCheck,
  Compass,
  Users,
  ArrowRight,
  Clock,
  Sparkles,
  HeartHandshake,
  CheckCircle2
} from 'lucide-react';
import { Navbar } from '../components/Navbar';

export const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-slate-100 selection:bg-brand-primary selection:text-black">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-primary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-brand-secondary/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-dark-800/80 border border-dark-700/80 text-xs font-semibold text-brand-primary mb-8 shadow-xl backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
            {/* <span>A Complete Loneliness-Reducing Platform</span> */}
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6">
            Break the isolation.
            <br />
            <span className="bg-gradient-to-r from-brand-primary via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
              Discover real-world moments.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Connext replaces endless social-media feeds with real physical hangouts, scheduled neighborhood meetups, built-in turn-by-turn live navigation, and privacy-first temporary chat rooms.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              to="/explore"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-primary hover:bg-cyan-400 text-black font-black text-base shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Compass className="w-5 h-5 stroke-[2.5]" />
              <span>Explore Live Map</span>
            </Link>

            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-dark-800 hover:bg-dark-700 text-white font-bold text-base border border-dark-600 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <span>Join Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Live Platform Highlights Banner */}
          <div className="mt-16 pt-8 border-t border-dark-800/80 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-dark-900/60 border border-dark-800">
              <div className="text-2xl font-black text-brand-primary">₹0 Cost</div>
              <div className="text-xs text-slate-400 mt-1">100% Free Open-Source mapping & local DB</div>
            </div>
            <div className="p-4 rounded-2xl bg-dark-900/60 border border-dark-800">
              <div className="text-2xl font-black text-indigo-400">Live Nav</div>
              <div className="text-xs text-slate-400 mt-1">In-app OSRM routing & live GPS guidance</div>
            </div>
            <div className="p-4 rounded-2xl bg-dark-900/60 border border-dark-800">
              <div className="text-2xl font-black text-emerald-400">Auto-Expire</div>
              <div className="text-xs text-slate-400 mt-1">Temporary chat rooms respect your privacy</div>
            </div>
            <div className="p-4 rounded-2xl bg-dark-900/60 border border-dark-800">
              <div className="text-2xl font-black text-amber-400">Real Meetups</div>
              <div className="text-xs text-slate-400 mt-1">Parks, cafes, libraries, board games & sports</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Pillars */}
      <section className="py-20 bg-dark-900/50 border-y border-dark-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">
              Purpose-Built Architecture
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Four Core Pillars to Reduce Isolation
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Real Hotspot Discovery */}
            <div className="p-6 rounded-3xl bg-dark-900 border border-dark-700/70 hover:border-brand-primary/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center text-brand-primary mb-5">
                  <MapPin className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Real Map Discovery</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Interactive Leaflet map powered by OpenStreetMap. View actual hangout spots, campus circles, cafes, and scheduled meetups with genuine coordinates.
                </p>
              </div>
            </div>

            {/* 2. In-App Live Navigation */}
            <div className="p-6 rounded-3xl bg-dark-900 border border-dark-700/70 hover:border-brand-primary/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5">
                  <Navigation className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Built-in Live Navigation</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real routing via OSRM with driving, walking, and cycling modes. Watch real GPS movement, receive turn-by-turn guidance, and auto-reroute when off track.
                </p>
              </div>
            </div>

            {/* 3. Temporary Real-Time Chat */}
            <div className="p-6 rounded-3xl bg-dark-900 border border-dark-700/70 hover:border-brand-primary/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-5">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Temporary Chat Rooms</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time Socket.IO chat rooms provisioned with each hotspot. Say hello and coordinate arrivals. Rooms auto-expire when meetups conclude.
                </p>
              </div>
            </div>

            {/* 4. Privacy & Safety */}
            <div className="p-6 rounded-3xl bg-dark-900 border border-dark-700/70 hover:border-brand-primary/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Privacy & Public Safety</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your live GPS coordinates are never broadcast to chat rooms. Meetups are hosted in public places with capacity caps, moderation reporting, and user blocking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">
              Simple Journey
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              From Screen to Real Connection in 4 Steps
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="relative p-6 rounded-2xl bg-dark-900/60 border border-dark-800 text-center">
              <div className="w-10 h-10 rounded-full bg-brand-primary text-black font-black flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h4 className="font-bold text-white mb-2">Discover on Map</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Filter nearby cafes, parks, board-game sessions, or create your own hotspot.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-dark-900/60 border border-dark-800 text-center">
              <div className="w-10 h-10 rounded-full bg-brand-primary text-black font-black flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h4 className="font-bold text-white mb-2">Join Temporary Chat</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Check who is attending, say hello, and plan where to meet up at the location.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-dark-900/60 border border-dark-800 text-center">
              <div className="w-10 h-10 rounded-full bg-brand-primary text-black font-black flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h4 className="font-bold text-white mb-2">Start Live Navigation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Get real-time turn guidance and distance to the destination without leaving the app.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-dark-900/60 border border-dark-800 text-center">
              <div className="w-10 h-10 rounded-full bg-brand-primary text-black font-black flex items-center justify-center mx-auto mb-4">
                4
              </div>
              <h4 className="font-bold text-white mb-2">Arrive & Connect</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Meet your peers, have genuine conversations, and cultivate authentic community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Notice Card */}
      <section className="py-12 bg-dark-900 border-t border-dark-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="p-6 rounded-3xl bg-dark-800/80 border border-dark-700 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center text-brand-primary flex-shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white mb-1">In-Person Safety First</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Always meet in well-lit, public spaces (cafes, public libraries, park pavilions). Never share personal banking details or home addresses in temporary chat rooms. If someone violates safety guidelines, use the built-in Report and Block buttons.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-dark-950 border-t border-dark-800/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Connext</span>
            <span>• Built for College Project Demonstration</span>
          </div>
          <div>
            <span>Powered by OpenStreetMap & OSRM • Zero Paid API Keys Required</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
