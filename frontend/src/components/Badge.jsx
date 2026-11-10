import React from 'react';

export const RoleBadge = ({ role }) => {
  const styles = {
    owner: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-600/10',
    admin: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/10',
    member: 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-600/10',
  };

  const labels = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
  };

  const style = styles[role?.toLowerCase()] || styles.member;
  const label = labels[role?.toLowerCase()] || role;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style}`}
    >
      {label}
    </span>
  );
};

export const PlanBadge = ({ plan }) => {
  const styles = {
    free: 'bg-slate-100 text-slate-800 border-slate-300',
    pro: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    business: 'bg-amber-50 text-amber-800 border-amber-300',
  };

  const style = styles[plan?.toLowerCase()] || styles.free;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border ${style}`}
    >
      {plan || 'Free'}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    canceled: 'bg-rose-50 text-rose-700 border-rose-200',
    expired: 'bg-slate-100 text-slate-600 border-slate-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const cleanStatus = status?.toLowerCase()?.replace('-', '_');
  const style = styles[cleanStatus] || 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${style}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {status?.replace('_', ' ')}
    </span>
  );
};
