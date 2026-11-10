import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import api from '../services/api';
import { StatCard } from '../components/StatCard';
import { PlanBadge, RoleBadge } from '../components/Badge';
import {
  Users,
  CreditCard,
  FolderKanban,
  Activity,
  UserPlus,
  Settings,
  Sparkles,
  ArrowUpRight,
  Shield,
  Layers,
} from 'lucide-react';

export const Dashboard = () => {
  const { currentOrg, role, isOwner, isAdmin } = useTenant();
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [analyticsRes, logsRes, projectsRes] = await Promise.all([
          api.get('/analytics'),
          api.get('/activity?limit=5'),
          api.get('/projects'),
        ]);

        setStats(analyticsRes);
        setRecentLogs(logsRes.logs || []);
        setRecentProjects(projectsRes.projects?.slice(0, 4) || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentOrg) {
      fetchDashboardData();
    }
  }, [currentOrg]);

  const maxSeats = currentOrg?.planDetails?.maxMembers || 3;
  const usedSeats = currentOrg?.memberCount || 1;
  const availableSeats = Math.max(0, maxSeats - usedSeats);
  const seatPercentage = Math.round((usedSeats / maxSeats) * 100);

  return (
    <div className="space-y-6">
      {/* Top Welcome / Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {currentOrg?.name || 'Workspace Dashboard'}
            </h1>
            {currentOrg?.plan && <PlanBadge plan={currentOrg.plan} />}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tenant slug: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px] text-slate-700">{currentOrg?.slug}</code> • Your role: <strong className="capitalize text-slate-700">{role}</strong>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2.5">
          {isAdmin && (
            <Link
              to="/members"
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-500" />
              <span>Invite Member</span>
            </Link>
          )}
          <Link
            to="/projects"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 rounded-lg text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Manage Projects</span>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Team Members"
          value={usedSeats}
          icon={Users}
          description={`${availableSeats} seats remaining`}
        />
        <StatCard
          title="Active Subscription"
          value={currentOrg?.plan ? currentOrg.plan.toUpperCase() : 'FREE'}
          icon={CreditCard}
          badge={<PlanBadge plan={currentOrg?.plan} />}
          description={
            currentOrg?.plan === 'free'
              ? 'Seats capped at 3 members'
              : 'Enterprise tier enabled'
          }
        />
        <StatCard
          title="Seat Utilization"
          value={`${seatPercentage}%`}
          icon={Activity}
          description={`${usedSeats} of ${maxSeats} seats assigned`}
        />
        <StatCard
          title="Tenant Projects"
          value={stats?.overview?.totalProjects ?? recentProjects.length}
          icon={FolderKanban}
          description="Isolated workspace items"
        />
      </div>

      {/* Seat Meter & Plan Entitlement Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-400/20">
              <Shield className="w-3.5 h-3.5" />
              <span>Multi-Tenant Data Isolation Active</span>
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Organization Capacity: {usedSeats} of {maxSeats} Seats Active
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every request is tenant-validated via strict authorization middleware. Tenant resources are
              isolated by <code className="bg-white/10 px-1 py-0.5 rounded text-blue-300">organizationId</code> to eliminate cross-tenant leakage.
            </p>

            {/* Capacity Bar */}
            <div className="pt-2">
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    seatPercentage >= 90
                      ? 'bg-rose-400'
                      : seatPercentage >= 60
                      ? 'bg-amber-400'
                      : 'bg-blue-400'
                  }`}
                  style={{ width: `${seatPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-3">
            {isOwner && currentOrg?.plan === 'free' && (
              <Link
                to="/billing"
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>Upgrade to Pro (10 Seats)</span>
              </Link>
            )}
            <Link
              to="/members"
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition border border-white/10"
            >
              <Users className="w-4 h-4" />
              <span>Manage Members</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Projects & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workspace Projects */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Workspace Projects</h3>
              <p className="text-xs text-slate-500">Tenant-isolated business resources</p>
            </div>
            <Link
              to="/projects"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No projects created yet in this workspace.
            </div>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between transition"
                >
                  <div className="space-y-0.5 truncate">
                    <span className="block text-xs font-semibold text-slate-900 truncate">
                      {project.name}
                    </span>
                    <span className="block text-[11px] text-slate-500 truncate max-w-xs">
                      {project.description || 'No description provided'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-white rounded border border-slate-200 text-slate-600 flex-shrink-0 ml-3">
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
              <p className="text-xs text-slate-500">Audit trail of workspace operations</p>
            </div>
            <Link
              to="/activity"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center"
            >
              Full log <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No audit activities recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-medium truncate">
                      <span className="font-semibold text-slate-900">
                        {log.user?.name || 'System'}:
                      </span>{' '}
                      {log.action.replace('_', ' ')}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
