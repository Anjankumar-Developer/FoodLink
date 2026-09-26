import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';

export default function PublicLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Bar Contract: 3 zones */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Zone 1: Single text element wordmark */}
          <NavLink to="/" className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
              F
            </span>
            <span>FOODLINK AI</span>
          </NavLink>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button
              onClick={() => {
                navigate('/');
                setTimeout(() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' }), 50);
              }}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Rescue Workflow
            </button>
            <button
              onClick={() => {
                navigate('/');
                setTimeout(() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }), 50);
              }}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => {
                navigate('/');
                setTimeout(() => document.getElementById('agents')?.scrollIntoView({ behavior: 'smooth' }), 50);
              }}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              AI Multi-Agents
            </button>
            <button
              onClick={() => {
                navigate('/');
                setTimeout(() => document.getElementById('impact')?.scrollIntoView({ behavior: 'smooth' }), 50);
              }}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Impact Network
            </button>
            <button
              onClick={() => {
                navigate('/');
                setTimeout(() => document.getElementById('responsible-ai')?.scrollIntoView({ behavior: 'smooth' }), 50);
              }}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Responsible AI
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/login')}
              variant="secondary"
              size="sm"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="primary"
              size="sm"
            >
              Open Console
            </Button>
          </div>
        </div>
      </header>

      {/* Main Page Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
              F
            </div>
            <span className="text-sm font-semibold text-slate-800">FOODLINK AI</span>
            <span className="text-xs text-slate-400">· Autonomous Food Rescue Infrastructure</span>
          </div>

          <p className="text-xs text-slate-500">
            Compliant with Good Samaritan Food Donation Act & HACCP Guidelines.
          </p>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <NavLink to="/dashboard" className="hover:text-slate-900">Live Network</NavLink>
            <NavLink to="/agents" className="hover:text-slate-900">Agents</NavLink>
            <NavLink to="/donations/new" className="hover:text-slate-900">Donate Food</NavLink>
          </div>
        </div>
      </footer>
    </div>
  );
}
