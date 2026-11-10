import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { ProtectedLayout } from './components/Layout';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { OrgSetup } from './pages/OrgSetup';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Members } from './pages/Members';
import { Analytics } from './pages/Analytics';
import { ActivityLogs } from './pages/ActivityLogs';
import { Billing } from './pages/Billing';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { AcceptInvite } from './pages/AcceptInvite';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TenantProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/invite/:token" element={<AcceptInvite />} />

            {/* Protected Workspace Routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/members" element={<Members />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/activity" element={<ActivityLogs />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/organizations/new" element={<OrgSetup />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
