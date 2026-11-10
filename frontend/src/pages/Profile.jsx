import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleBadge, PlanBadge } from '../components/Badge';
import {
  User,
  KeyRound,
  Building2,
  AlertCircle,
  CheckCircle,
  Shield,
} from 'lucide-react';

export const Profile = () => {
  const { user, organizations, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setSaving(true);

    try {
      const updateData = { name, avatar };
      if (newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      await updateProfile(updateData);
      setSuccess('Profile updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal credentials, profile information, and multi-tenant access.
        </p>
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

      {/* User Information Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <User className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Personal Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                readOnly
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Avatar Image URL (Optional)
              </label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <KeyRound className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Change Password
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 chars"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            {saving ? 'Updating profile...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>

      {/* Associated Organizations */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <Building2 className="w-4 h-4 text-slate-500" />
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Your Organization Memberships ({organizations.length})
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {organizations.map((org) => (
            <div key={org.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center">
                  {org.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{org.name}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">{org.slug}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <PlanBadge plan={org.plan} />
                <RoleBadge role={org.role} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
