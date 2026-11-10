import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { RoleBadge, PlanBadge } from './Badge';
import { LogOut, Bell, ExternalLink } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { currentOrg, role } = useTenant();

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Current Tenant Breadcrumb */}
      <div className="flex items-center space-x-3">
        <span className="text-xs text-slate-400 font-medium">Workspace</span>
        <span className="text-xs text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-800 tracking-tight">
          {currentOrg?.name || 'Loading...'}
        </span>
        {currentOrg?.plan && <PlanBadge plan={currentOrg.plan} />}
        {role && <RoleBadge role={role} />}
      </div>

      {/* Right User Actions */}
      <div className="flex items-center space-x-4">
        {/* User Info & Avatar */}
        <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-200">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-xs">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="hidden sm:block text-left leading-tight">
            <span className="block text-xs font-semibold text-slate-800">{user?.name}</span>
            <span className="block text-[11px] text-slate-400 truncate max-w-[140px]">
              {user?.email}
            </span>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
