import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, User, Sparkles } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useToast } from '../components/common/Toast';
import api from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('Aisha Khan');
  const [email, setEmail] = useState('aisha@example.com');
  const [password, setPassword] = useState('securepass123');
  const [role, setRole] = useState('coordinator');
  const [loading, setLoading] = useState(false);

  const submitLabel = useMemo(() => (isSignup ? 'Create Account' : 'Sign In to Console'), [isSignup]);

  const saveSession = (user, token) => {
    localStorage.setItem('foodlink_user', JSON.stringify(user));
    localStorage.setItem('foodlink_token', token);
    api.setAuthToken(token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = isSignup
        ? { name, email, password, role, organization: 'FoodLink Network' }
        : { email, password };

      const endpoint = isSignup ? '/auth/signup' : '/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || 'Authentication failed.');
      }

      saveSession(result.user, result.token);
      addToast({
        title: isSignup ? 'Account created successfully' : 'Authentication successful',
        message: `Welcome${isSignup ? ' aboard' : ' back'}, ${result.user.name}.`,
        type: 'success',
      });
      navigate('/dashboard');
    } catch (error) {
      addToast({
        title: 'Authentication failed',
        message: error.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-xs">
            F
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {isSignup ? 'Create your FOODLINK account' : 'Sign in to FOODLINK AI'}
          </h2>
          <p className="text-xs text-slate-500">
            {isSignup ? 'Set up your secure portal for food rescue operations.' : 'Access your food rescue workspace and role-based dashboard.'}
          </p>
        </div>

        <div className="bg-slate-100 p-1 rounded-lg grid grid-cols-2 gap-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setIsSignup(false)}
            className={`py-2 px-2 rounded-md transition-colors ${
              !isSignup ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsSignup(true)}
            className={`py-2 px-2 rounded-md transition-colors ${
              isSignup ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        <Card className="shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
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

            {isSignup && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                >
                  <option value="coordinator">Coordinator</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="shelter">Shelter</option>
                  <option value="volunteer">Volunteer</option>
                </select>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="w-full justify-center"
              icon={ArrowRight}
            >
              {loading ? 'Processing...' : submitLabel}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Secure, role-aware access for your rescue operations</span>
          </div>
        </Card>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignup(false);
              setEmail('aisha@example.com');
              setPassword('securepass123');
            }}
            className="text-xs text-slate-500 hover:text-emerald-700 font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Use demo credentials</span>
          </button>
        </div>
      </div>
    </div>
  );
}
