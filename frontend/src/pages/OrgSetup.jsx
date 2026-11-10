import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import api from '../services/api';
import { Building2, ArrowRight, AlertCircle } from 'lucide-react';

export const OrgSetup = () => {
  const { refreshUser } = useAuth();
  const { switchOrganization } = useTenant();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide an organization name.');
      return;
    }

    setLoading(true);

    try {
      const data = await api.post('/organizations', {
        name: name.trim(),
        domain: domain.trim(),
      });

      await refreshUser();
      switchOrganization(data.organization.id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
          <Building2 className="w-6 h-6" />
        </div>

        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create a New Organization</h1>
        <p className="text-sm text-slate-500 mt-1">
          Set up a new isolated multi-tenant workspace for your team or client.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Organization Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corporation, Stark Industries"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Corporate Domain (Optional Placeholder)
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. acme.com (for future SSO / SAML routing)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Provides the domain baseline for enterprise SSO configuration.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
            >
              <span>{loading ? 'Creating...' : 'Create Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
