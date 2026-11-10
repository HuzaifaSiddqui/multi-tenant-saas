import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { RoleBadge } from '../components/Badge';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Members = () => {
  const { currentOrg, role, isOwner, isAdmin, refreshOrganization } = useTenant();
  const { user: currentUser } = useAuth();

  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Invite Modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Remove Modal state
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/members');
      setMembers(res.members || []);
      setInvitations(res.invitations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrg) {
      fetchMembers();
    }
  }, [currentOrg]);

  const maxSeats = currentOrg?.planDetails?.maxMembers || 3;
  const isSeatLimitReached = members.length >= maxSeats;

  const handleOpenInvite = () => {
    setInviteEmail('');
    setInviteRole('member');
    setGeneratedInviteLink('');
    setCopied(false);
    setError('');
    setIsInviteOpen(true);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/members/invite', {
        email: inviteEmail,
        role: inviteRole,
      });

      const inviteUrl = `${window.location.origin}/invite/${res.invitation.token}`;
      setGeneratedInviteLink(inviteUrl);
      setSuccess(`Invitation issued to ${inviteEmail}.`);
      await fetchMembers();
      await refreshOrganization();
    } catch (err) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedInviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChangeRole = async (memberId, newRole) => {
    try {
      setError('');
      await api.patch(`/members/${memberId}/role`, { role: newRole });
      setSuccess('Role updated successfully.');
      await fetchMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await api.delete(`/members/${removeTarget.membershipId}`);
      setSuccess(`Removed member from organization.`);
      setRemoveTarget(null);
      await fetchMembers();
      await refreshOrganization();
    } catch (err) {
      setError(err.message);
    } finally {
      setRemoving(false);
    }
  };

  const handleRevokeInvitation = async (inviteId) => {
    try {
      await api.delete(`/members/invitations/${inviteId}`);
      setSuccess('Invitation revoked.');
      await fetchMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Organization Members</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage team access, role assignments, and member invitations for{' '}
            <strong className="text-slate-800">{currentOrg?.name}</strong>.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenInvite}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 rounded-lg text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite New Member</span>
          </button>
        )}
      </div>

      {/* Seat Limit Notification Banner if capped */}
      {isSeatLimitReached && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold">
                Maximum Seat Limit Reached ({members.length}/{maxSeats} seats)
              </p>
              <p className="text-amber-700">
                You have utilized all available seats on the {currentOrg?.plan?.toUpperCase()} plan.
                Upgrade to add more team members.
              </p>
            </div>
          </div>
          {isOwner && (
            <Link
              to="/billing"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex-shrink-0 transition shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade Plan</span>
            </Link>
          )}
        </div>
      )}

      {/* Status Messages */}
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

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Active Members ({members.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {members.length} of {maxSeats} seats assigned
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading members...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Joined Date</th>
                  {isAdmin && <th className="px-5 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => {
                  const isCurrent = member.userId === currentUser?.id;
                  const canModify = isOwner && member.role !== 'owner';
                  const canDelete =
                    isAdmin &&
                    member.role !== 'owner' &&
                    (isOwner || member.role === 'member');

                  return (
                    <tr key={member.membershipId} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-3">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                              <span>{member.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-normal">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500">{member.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        {canModify ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleChangeRole(member.membershipId, e.target.value)
                            }
                            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium capitalize"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                          </select>
                        ) : (
                          <RoleBadge role={member.role} />
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-slate-500">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </td>

                      {isAdmin && (
                        <td className="px-5 py-3.5 text-right">
                          {canDelete && (
                            <button
                              onClick={() => setRemoveTarget(member)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                              title="Remove Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Invitations Section */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center space-x-2">
            <Mail className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Pending Invitations ({invitations.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Invited Email</th>
                  <th className="px-5 py-3">Assigned Role</th>
                  <th className="px-5 py-3">Invited By</th>
                  <th className="px-5 py-3">Expires At</th>
                  {isAdmin && <th className="px-5 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 font-medium text-slate-900">{inv.email}</td>
                    <td className="px-5 py-3">
                      <RoleBadge role={inv.role} />
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {inv.invitedBy?.name || 'A team member'}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/invite/${inv.token}`;
                            navigator.clipboard.writeText(url);
                            setSuccess('Invitation link copied to clipboard.');
                          }}
                          className="px-2 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={() => handleRevokeInvitation(inv.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Revoke Invitation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite New Team Member"
      >
        {generatedInviteLink ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Invitation created successfully! Share the link below with your teammate.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Shareable Invitation Link
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={generatedInviteLink}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Role to Assign
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="member">Member (View & manage permitted workspace items)</option>
                <option value="admin">Admin (Manage members & workspace data)</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inviting || isSeatLimitReached}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs disabled:opacity-50"
              >
                {inviting ? 'Generating invite...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Remove Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveMember}
        loading={removing}
        title="Remove Member from Workspace"
        message={`Are you sure you want to remove "${removeTarget?.name}" (${removeTarget?.email}) from ${currentOrg?.name}? They will lose all access immediately.`}
        confirmText="Remove Member"
      />
    </div>
  );
};
