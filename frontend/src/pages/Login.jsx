import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogIn, AlertCircle, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(isExpired ? 'Your session expired. Please sign in again.' : '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-lg mb-4">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
        <p className="mt-1 text-sm text-slate-500">
          Multi-Tenant B2B Cloud Platform with Role-Based Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl border border-slate-100 sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          {/* Seed Test Accounts Quick-Fill */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
              Quick Test Accounts (Password: Password123!)
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('alex.owner@acme.com')}
                className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-md text-left transition font-medium"
              >
                <span className="block font-semibold">Alex Vance</span>
                <span className="text-[11px] text-slate-500">Acme Owner</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('sarah.admin@acme.com')}
                className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-md text-left transition font-medium"
              >
                <span className="block font-semibold">Sarah Connor</span>
                <span className="text-[11px] text-slate-500">Acme Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('mike.member@acme.com')}
                className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-md text-left transition font-medium"
              >
                <span className="block font-semibold">Mike Ross</span>
                <span className="text-[11px] text-slate-500">Acme Member</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('elena.partner@startup.io')}
                className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-md text-left transition font-medium"
              >
                <span className="block font-semibold">Elena Rostova</span>
                <span className="text-[11px] text-slate-500">Multi-Tenant (Apex Owner)</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
