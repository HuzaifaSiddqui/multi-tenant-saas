import React from 'react';

export const StatCard = ({ title, value, icon: Icon, description, trend, badge }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {badge}
      </div>
      {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      {trend && <div className="mt-2 text-xs">{trend}</div>}
    </div>
  );
};
