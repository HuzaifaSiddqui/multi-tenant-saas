import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import api from '../services/api';
import { RoleBadge } from '../components/Badge';
import {
  Mail,
  Building2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  LogIn,
} from 'lucide-react';

export const AcceptInvite = () => {
  const { token } = useParams();
  const { user, refreshUser } = useAuth();
  const { switchOrganization } = useTenant();
  const navigate = useNavigate();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/invitations/${token}`);
        setInvite(res.invitation);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError('');

    try {
      const res = await api.post(`/invitations/${token}/accept`);
      setSuccess(true);
      await refreshUser();
      if (res.organizationId) {
        switchOrganization(res.organizationId);
      }
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-lg mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Workspace Invitation
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Join your team on TenantOS SaaS Platform
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl border border-slate-100 sm:px-10">
          {loading ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Validating invitation token...
            </div>
          ) : error ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Unable to Accept Invitation</h3>
              <p className="text-xs text-rose-600">{error}</p>
              <div className="pt-2">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <span>Return to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Welcome to the Team!</h3>
              <p className="text-xs text-slate-500">
                You have successfully joined {invite?.organizationName}. Redirecting to your dashboard...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-center space-y-2">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-base">
                  {invite?.organizationName?.charAt(0)?.toUpperCase()}
                </div>
                <h2 className="text-base font-bold text-slate-900">{invite?.organizationName}</h2>
                <div className="flex items-center justify-center space-x-2 pt-1">
                  <span className="text-xs text-slate-500">Assigned Role:</span>
                  <RoleBadge role={invite?.role} />
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  Invited by {invite?.invitedBy} for email <strong>{invite?.email}</strong>
                </p>
              </div>

              {user ? (
                <div className="space-y-3">
                  <div className="text-xs text-slate-600 text-center">
                    Signed in as <strong>{user.name}</strong> ({user.email}).
                  </div>
                  <button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{accepting ? 'Joining workspace...' : 'Accept & Join Workspace'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 text-center">
                  <p className="text-xs text-slate-600">
                    Please sign in or create an account to accept this workspace invitation.
                  </p>
                  <Link
                    to={`/login?redirect=/invite/${token}`}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Accept</span>
                  </Link>
                  <Link
                    to={`/register?redirect=/invite/${token}`}
                    className="block text-xs font-semibold text-slate-600 hover:text-slate-900 pt-1"
                  >
                    Or create a new account
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
