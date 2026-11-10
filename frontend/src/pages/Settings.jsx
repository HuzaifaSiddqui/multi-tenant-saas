import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PlanBadge } from '../components/Badge';
import {
  Settings as SettingsIcon,
  Building,
  Globe,
  Palette,
  Trash2,
  AlertCircle,
  CheckCircle,
  Lock,
} from 'lucide-react';

export const Settings = () => {
  const { currentOrg, role, isOwner, isAdmin, refreshOrganization } = useTenant();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    ssoEnabled: false,
    customBranding: '',
    supportEmail: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (currentOrg) {
      setFormData({
        name: currentOrg.name || '',
        domain: currentOrg.domain || '',
        ssoEnabled: Boolean(currentOrg.ssoEnabled),
        customBranding: currentOrg.settings?.customBranding || '',
        supportEmail: currentOrg.settings?.supportEmail || '',
      });
    }
  }, [currentOrg]);

  const isBusinessPlan = currentOrg?.plan === 'business';

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('Only Admins or Owners can update workspace settings.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.put(`/organizations/${currentOrg.id}`, {
        name: formData.name,
        domain: formData.domain,
        ssoEnabled: formData.ssoEnabled,
        settings: {
          customBranding: formData.customBranding,
          supportEmail: formData.supportEmail,
        },
      });

      setSuccess('Organization settings successfully updated.');
      await refreshOrganization();
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!isOwner) return;
    setDeleting(true);
    try {
      await api.delete(`/organizations/${currentOrg.id}`);
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setIsDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure organization profile, domain federation, and custom branding for{' '}
            <strong className="text-slate-800">{currentOrg?.name}</strong>.
          </p>
        </div>
        {currentOrg?.plan && <PlanBadge plan={currentOrg.plan} />}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              General Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Workspace Name *
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Workspace Identifier (Slug)
              </label>
              <input
                type="text"
                readOnly
                value={currentOrg?.slug || ''}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Enterprise SSO & Domain Foundation (Section 3) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Globe className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Corporate Domain & SSO Foundation
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Verified Corporate Domain
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="e.g. acme.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Domain foundation used for routing and future Google OAuth / SAML 2.0 single sign-on integration.
              </p>
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={formData.ssoEnabled}
                  onChange={(e) => setFormData({ ...formData, ssoEnabled: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 disabled:opacity-50"
                />
                <span className="text-xs font-medium text-slate-700">
                  Enforce Single Sign-On (SSO) login for domain accounts
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Custom Branding & Settings (Business Entitlement) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Palette className="w-4 h-4 text-slate-500" />
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Custom Workspace Branding
              </h2>
            </div>
            {!isBusinessPlan && (
              <span className="inline-flex items-center space-x-1 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                <Lock className="w-3 h-3 mr-0.5" />
                Business Tier Feature
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Custom Portal Label
              </label>
              <input
                type="text"
                disabled={!isBusinessPlan || !isAdmin}
                value={formData.customBranding}
                onChange={(e) => setFormData({ ...formData, customBranding: e.target.value })}
                placeholder={isBusinessPlan ? "e.g. Acme Enterprise Cloud" : "Available on Business plan"}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Support Routing Email
              </label>
              <input
                type="email"
                disabled={!isBusinessPlan || !isAdmin}
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                placeholder={isBusinessPlan ? "help@acme.com" : "Available on Business plan"}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-40"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        {isAdmin && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              {saving ? 'Saving changes...' : 'Save Settings'}
            </button>
          </div>
        )}
      </form>

      {/* Danger Zone: Delete Organization (Owner Only) */}
      {isOwner && (
        <div className="bg-white rounded-xl border border-rose-200 p-6 shadow-xs mt-8">
          <div className="flex items-center space-x-2 text-rose-700 pb-2">
            <Trash2 className="w-5 h-5 flex-shrink-0" />
            <h2 className="text-sm font-bold">Danger Zone: Delete Organization</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            Permanently delete this organization, along with all associated memberships, projects,
            invitations, and activity logs. This operation cannot be reversed.
          </p>

          <div className="mt-4 pt-4 border-t border-rose-100 flex justify-end">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              Delete Entire Workspace
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteOrganization}
        loading={deleting}
        title="Permanently Delete Workspace"
        message={`Are you absolutely sure you want to permanently delete "${currentOrg?.name}"? All tenant data and records will be immediately erased.`}
        confirmText="Yes, Permanently Delete"
      />
    </div>
  );
};
