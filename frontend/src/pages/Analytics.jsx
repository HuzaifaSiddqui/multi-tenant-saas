import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import api from '../services/api';
import { StatCard } from '../components/StatCard';
import { PlanBadge } from '../components/Badge';
import {
  BarChart3,
  Users,
  FolderKanban,
  Activity,
  Lock,
  Sparkles,
  TrendingUp,
  PieChart,
} from 'lucide-react';

export const Analytics = () => {
  const { currentOrg, isOwner } = useTenant();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics');
        setData(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentOrg) {
      fetchAnalytics();
    }
  }, [currentOrg]);

  const hasAdvanced = data?.hasAdvancedAnalytics;
  const overview = data?.overview;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Usage & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tenant metrics, capacity utilization, and workspace telemetry.
          </p>
        </div>
        {currentOrg?.plan && <PlanBadge plan={currentOrg.plan} />}
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading analytics...</div>
      ) : (
        <>
          {/* Top Core Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active Members"
              value={overview?.totalMembers || 0}
              icon={Users}
              description={`Capped at ${overview?.maxSeats || 3} members`}
            />
            <StatCard
              title="Available Seats"
              value={overview?.availableSeats || 0}
              icon={Activity}
              description={`${overview?.seatUtilizationPercentage || 0}% utilized`}
            />
            <StatCard
              title="Total Projects"
              value={overview?.totalProjects || 0}
              icon={FolderKanban}
              description="Tenant-isolated items"
            />
            <StatCard
              title="Tenant Tier"
              value={data?.plan?.toUpperCase() || 'FREE'}
              icon={BarChart3}
              description={
                hasAdvanced ? 'Full analytics unlocked' : 'Basic telemetry'
              }
            />
          </div>

          {/* Breakdown Section: Roles & Projects Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Roles Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Team Role Distribution</span>
                </h3>
                <span className="text-xs text-slate-400">RBAC Breakdown</span>
              </div>

              <div className="space-y-3">
                {Object.entries(data?.roles || {}).map(([roleKey, count]) => {
                  const percentage =
                    overview?.totalMembers > 0
                      ? Math.round((count / overview.totalMembers) * 100)
                      : 0;

                  return (
                    <div key={roleKey} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize font-medium text-slate-700">
                          {roleKey}
                        </span>
                        <span className="text-slate-500 font-semibold">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Project Status Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                  <PieChart className="w-4 h-4 text-slate-500" />
                  <span>Project Deliverables by Status</span>
                </h3>
                <span className="text-xs text-slate-400">Tenant Resource State</span>
              </div>

              <div className="space-y-3">
                {Object.entries(data?.projectStatus || {}).map(([statusKey, count]) => {
                  const total = overview?.totalProjects || 1;
                  const percentage = Math.round((count / total) * 100);

                  return (
                    <div key={statusKey} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize font-medium text-slate-700">
                          {statusKey.replace('-', ' ')}
                        </span>
                        <span className="text-slate-500 font-semibold">
                          {count}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${overview?.totalProjects ? percentage : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Advanced Analytics / Entitlement Gate */}
          {hasAdvanced ? (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Advanced Telemetry & Activity Distribution</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Historical metrics available on your Pro/Business subscription plan.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Pro Feature Active
                </span>
              </div>

              {/* Event Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                    Top Activity Events
                  </h4>
                  <div className="space-y-2">
                    {data?.advanced?.activityBreakdown?.map((act) => (
                      <div
                        key={act._id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs"
                      >
                        <span className="font-mono text-slate-700">{act._id}</span>
                        <span className="font-bold text-slate-900">{act.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                    Member Growth Over Time (30 Days)
                  </h4>
                  <div className="space-y-2">
                    {data?.advanced?.memberGrowth?.length === 0 ? (
                      <p className="text-xs text-slate-400">No member joins in the past 30 days.</p>
                    ) : (
                      data?.advanced?.memberGrowth?.map((growth) => (
                        <div
                          key={growth._id}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs"
                        >
                          <span className="font-medium text-slate-700">{growth._id}</span>
                          <span className="font-bold text-blue-600">+{growth.count} new</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Entitlement Banner for Free Plan */
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Advanced Analytics is Locked on Free Plan
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Unlock historical member growth trends, event breakdown analytics, and custom workspace
                telemetry by upgrading to the Pro or Business plan.
              </p>
              {isOwner && (
                <Link
                  to="/billing"
                  className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Upgrade to Pro</span>
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
