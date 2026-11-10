import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import api from '../services/api';
import { PlanBadge } from '../components/Badge';
import {
  History,
  Shield,
  User,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

export const ActivityLogs = () => {
  const { currentOrg } = useTenant();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLimited, setIsLimited] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/activity');
      setLogs(res.logs || []);
      setIsLimited(res.isLimited || false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrg) {
      fetchLogs();
    }
  }, [currentOrg]);

  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Activity Logs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable audit trail of security events, team modifications, and workspace operations.
          </p>
        </div>
        {currentOrg?.plan && <PlanBadge plan={currentOrg.plan} />}
      </div>

      {/* Free Plan Limited Retention Notice */}
      {isLimited && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Free Plan Retention Notice:</span> Activity logs on the
            Free tier are limited to the 10 most recent events. Upgrade to Pro or Business for
            unlimited chronological audit history.
          </div>
        </div>
      )}

      {/* Logs Timeline */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Workspace Events ({logs.length})
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading activity trail...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No audit activities recorded for this workspace.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const hasDetails = log.details && Object.keys(log.details).length > 0;

              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/50 transition">
                  <div className="flex items-start justify-between gap-4 text-xs">
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Shield className="w-3.5 h-3.5" />
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="font-semibold text-slate-900 flex items-center space-x-2">
                          <span className="capitalize">{log.action.replace(/[._]/g, ' ')}</span>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                            {log.action}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 text-slate-500 text-[11px]">
                          <span className="flex items-center space-x-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{log.user?.name || 'System'}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{new Date(log.createdAt).toLocaleString()}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {hasDetails && (
                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="text-[11px] font-medium text-blue-600 hover:text-blue-700 flex items-center space-x-1 flex-shrink-0"
                      >
                        <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Collapsible Details JSON view */}
                  {isExpanded && hasDetails && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] font-mono text-slate-800 overflow-x-auto">
                      <pre>{JSON.stringify(log.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
