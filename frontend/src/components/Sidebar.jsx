import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import { OrgSwitcher } from './OrgSwitcher';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  BarChart3,
  History,
  CreditCard,
  Settings,
  User,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const Sidebar = () => {
  const { currentOrg, role, isOwner } = useTenant();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Team Members', href: '/members', icon: Users },
    { name: 'Usage & Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Activity Logs', href: '/activity', icon: History },
    { name: 'Billing & Plans', href: '/billing', icon: CreditCard },
    { name: 'Workspace Settings', href: '/settings', icon: Settings },
    { name: 'My Profile', href: '/profile', icon: User },
  ];

  const planMax = currentOrg?.planDetails?.maxMembers || 3;
  const memberCount = currentOrg?.memberCount || 1;
  const seatPercentage = Math.min(100, Math.round((memberCount / planMax) * 100));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 flex-shrink-0">
      <div>
        {/* Workspace Brand / Header */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-slate-900 font-bold tracking-tight text-base mb-3">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>TenantOS SaaS</span>
          </div>
          <OrgSwitcher />
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Seat Usage & Current Role Badge */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="bg-white rounded-lg p-3 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Seats Capacity</span>
            <span className="font-semibold text-slate-800">
              {memberCount} / {planMax}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                seatPercentage >= 90
                  ? 'bg-rose-500'
                  : seatPercentage >= 70
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${seatPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400 capitalize">
              Role: <strong className="text-slate-700">{role}</strong>
            </span>
            {currentOrg?.plan === 'free' && isOwner && (
              <NavLink
                to="/billing"
                className="inline-flex items-center text-[11px] font-semibold text-blue-600 hover:text-blue-700"
              >
                <Sparkles className="w-3 h-3 mr-0.5" />
                Upgrade
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
