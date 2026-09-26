import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, CheckCircle2, User } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useToast } from '../components/common/Toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [role, setRole] = useState('coordinator'); // 'kitchen' | 'shelter' | 'volunteer' | 'coordinator'
  const [email, setEmail] = useState('elena.rostova@foodlink.ai');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      addToast({
        title: 'Authentication Successful',
        message: `Welcome back, Elena Rostova (${role.toUpperCase()} Console).`,
        type: 'success',
      });
      navigate('/dashboard');
    }, 600);
  };

  const handleRoleSelect = (selectedRole, defaultEmail) => {
    setRole(selectedRole);
    setEmail(defaultEmail);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Lockup */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-xs">
            F
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Sign in to FOODLINK AI
          </h2>
          <p className="text-xs text-slate-500">
            Enter your organization credentials or choose a pre-configured demo portal.
          </p>
        </div>

        {/* Role Segmented Selector */}
        <div className="bg-slate-100 p-1 rounded-lg grid grid-cols-3 gap-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => handleRoleSelect('coordinator', 'elena.rostova@foodlink.ai')}
            className={`py-2 px-2 rounded-md transition-colors ${
              role === 'coordinator'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Coordinator
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect('kitchen', 'kitchen@grandbistro.com')}
            className={`py-2 px-2 rounded-md transition-colors ${
              role === 'kitchen'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Restaurant
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect('shelter', 'intake@hopeharbor.org')}
            className={`py-2 px-2 rounded-md transition-colors ${
              role === 'shelter'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Shelter
          </button>
        </div>

        {/* Auth Form Card */}
        <Card className="shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Authorized Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.org"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    addToast({
                      title: 'Reset instructions sent',
                      message: 'Check your email for reset instructions.',
                      type: 'info',
                    });
                  }}
                  className="text-xs text-emerald-700 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="remember"
                type="checkbox"
                defaultChecked
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="remember" className="text-xs text-slate-600 select-none">
                Remember this terminal session for 30 days
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="w-full justify-center"
              icon={ArrowRight}
            >
              {loading ? 'Authenticating...' : 'Sign In to Console'}
            </Button>
          </form>

          {/* Verification Badge */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>256-Bit SSL Encrypted Logistics Channel</span>
          </div>
        </Card>

        {/* Quick Demo Access Bar */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setEmail('elena.rostova@foodlink.ai');
              setRole('coordinator');
              navigate('/dashboard');
            }}
            className="text-xs text-slate-500 hover:text-emerald-700 font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Skip to Live Console as Elena Rostova (Lead Coordinator)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
