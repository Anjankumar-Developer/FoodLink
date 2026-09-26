import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  PlusCircle,
  Sparkles,
  Home,
  Users,
  MapPin,
  Bot,
  BarChart3,
  UserCheck,
  Globe,
  LogIn,
  Menu,
  X,
  Bell,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import Button from '../components/common/Button';

export default function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // All 12 application routes organized cleanly
  const navigationSections = [
    {
      title: 'Logistics Operations',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Donations', path: '/donations', icon: UtensilsCrossed },
        { name: 'Create Donation', path: '/donations/new', icon: PlusCircle, badge: 'Log' },
        { name: 'Matches', path: '/matches', icon: Sparkles, badge: '2 Hot' },
        { name: 'Shelters', path: '/shelters', icon: Home },
        { name: 'Volunteers', path: '/volunteers', icon: Users },
        { name: 'Rescue Map', path: '/map', icon: MapPin },
      ],
    },
    {
      title: 'Autonomous Intelligence',
      items: [
        { name: 'AI Agents', path: '/agents', icon: Bot },
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
      ],
    },
  ];

  // Flattened array for title lookup
  const allNavItems = navigationSections.flatMap((sec) => sec.items);
  const currentNav = allNavItems.find((item) =>
    item.exact ? location.pathname === item.path : location.pathname === item.path
  );
  const pageTitle = currentNav ? currentNav.name : 'Logistics Console';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Persistent Sidebar (260px) */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/90 shrink-0 sticky top-0 h-screen select-none z-30">
        {/* Brand Area */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-xs group-hover:bg-emerald-700 transition-colors">
              F
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                FOODLINK AI
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                Rescue Logistics
              </span>
            </div>
          </NavLink>
        </div>

        {/* Primary Action Button */}
        <div className="p-4 border-b border-slate-100">
          <Button
            onClick={() => navigate('/donations/new')}
            variant="primary"
            size="sm"
            icon={PlusCircle}
            className="w-full justify-center shadow-xs"
          >
            Log Food Surplus
          </Button>
        </div>

        {/* Navigation Section Groups */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navigationSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </div>

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-150 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <span
                        className={`ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          item.badge === '2 Hot'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Persistent User & System Profile Card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                ER
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 truncate">Elena Rostova</p>
                <p className="text-[11px] text-slate-500 truncate">Lead Coordinator</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors"
              title="Sign Out / Switch Portal"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl z-10 flex flex-col">
            <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
              <NavLink
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-base">
                  F
                </div>
                <span className="text-base font-bold text-slate-900">FOODLINK AI</span>
              </NavLink>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <Button
                onClick={() => {
                  navigate('/donations/new');
                  setMobileMenuOpen(false);
                }}
                variant="primary"
                size="sm"
                icon={PlusCircle}
                className="w-full justify-center"
              >
                Log Food Surplus
              </Button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
              {navigationSections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </div>

                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact
                      ? location.pathname === item.path
                      : location.pathname === item.path;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.exact}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 font-semibold'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-slate-500" />
                        <span>{item.name}</span>
                        {item.badge && (
                          <span className="ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Contextual Breadcrumb Contract */}
            <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
              <NavLink to="/dashboard" className="hover:text-slate-800 transition-colors font-medium">
                FOODLINK AI
              </NavLink>
              <span aria-hidden="true" className="text-slate-300">/</span>
              <span className="font-semibold text-slate-900 truncate">{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Operational Status Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>4 Agents Autonomous</span>
            </div>

            {/* Quick Action Button */}
            <div className="hidden sm:block">
              <Button
                onClick={() => navigate('/donations/new')}
                variant="secondary"
                size="sm"
                icon={PlusCircle}
              >
                Log Surplus
              </Button>
            </div>

            {/* Notifications */}
            <button
              onClick={() => navigate('/matches')}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Urgent Rescue Alerts"
              aria-label="View urgent rescue alerts"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Profile Avatar Button */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 p-1 pl-2 pr-1.5 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-700 bg-white transition-colors"
              title="View Profile Settings"
            >
              <span className="text-xs font-semibold hidden sm:inline">Elena R.</span>
              <div className="w-6 h-6 rounded-md bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                E
              </div>
            </button>
          </div>
        </header>

        {/* Page Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
