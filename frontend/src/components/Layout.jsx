import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const ProtectedLayout = () => {
  const { user, organizations, loading } = useAuth();
  const { loadingOrg } = useTenant();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user has zero organizations, redirect to workspace setup
  if (!organizations || organizations.length === 0) {
    if (window.location.pathname !== '/organizations/new') {
      return <Navigate to="/organizations/new" replace />;
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {loadingOrg ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Switching workspace context...</span>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};
