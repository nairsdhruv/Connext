import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Lock, Mail, ArrowRight, RotateCw, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const { notifySuccess, notifyError } = useNotification();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      notifyError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      notifySuccess('Welcome back!');
      navigate('/explore');
    } catch (err) {
      notifyError(err.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Account Helper
  const handleQuickDemoLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('DemoPassword123!');
    setLoading(true);
    try {
      await login(demoEmail, 'DemoPassword123!');
      notifySuccess(`Logged in as demo user!`);
      navigate('/explore');
    } catch (err) {
      notifyError('Demo account not seeded yet. Please run `npm run seed` in terminal.');
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
        <h2 className="text-2xl font-black text-white tracking-tight">Sign in to your account</h2>
        <p className="mt-2 text-xs text-slate-400">
          Find nearby hotspots and connect with people in the real world.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-dark-900 border border-dark-700/80 py-8 px-6 sm:px-10 rounded-3xl shadow-2xl backdrop-blur-md space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="••••••••"
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
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Picker */}
          <div className="pt-4 border-t border-dark-700/60">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
              {/* <span>One-Click Demo Accounts (College Evaluation)</span> */}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('demo_alex@connext.test')}
                className="py-2 px-2 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-xs text-slate-200 font-semibold truncate"
              >
                Alex (Demo)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('demo_priya@connext.test')}
                className="py-2 px-2 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-xs text-slate-200 font-semibold truncate"
              >
                Priya (Demo)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('demo_sam@connext.test')}
                className="py-2 px-2 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-xs text-slate-200 font-semibold truncate"
              >
                Sam (Demo)
              </button>
            </div>
          </div>

          {/* Switch to Signup */}
          <div className="text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-primary hover:underline font-bold">
              Sign up free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
