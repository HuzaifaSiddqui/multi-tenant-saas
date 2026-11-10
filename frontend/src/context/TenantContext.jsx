import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const TenantContext = createContext(null);

export const TenantProvider = ({ children }) => {
  const { user, organizations, setOrganizations } = useAuth();
  const [activeOrgId, setActiveOrgId] = useState(() => localStorage.getItem('activeOrgId') || null);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [error, setError] = useState(null);

  // Sync activeOrgId with organizations list
  useEffect(() => {
    if (organizations && organizations.length > 0) {
      const stored = localStorage.getItem('activeOrgId');
      const exists = organizations.some((org) => org.id === stored);
      if (!stored || !exists) {
        const defaultOrg = organizations[0].id;
        localStorage.setItem('activeOrgId', defaultOrg);
        setActiveOrgId(defaultOrg);
      } else if (stored !== activeOrgId) {
        setActiveOrgId(stored);
      }
    } else if (!user) {
      setActiveOrgId(null);
      setCurrentOrg(null);
    }
  }, [organizations, user]);

  const fetchOrganizationDetails = useCallback(async () => {
    if (!activeOrgId || !user) {
      setCurrentOrg(null);
      setLoadingOrg(false);
      return;
    }

    setLoadingOrg(true);
    setError(null);

    try {
      const data = await api.get(`/organizations/${activeOrgId}`);
      setCurrentOrg(data.organization);
    } catch (err) {
      console.error('Failed to load organization details:', err);
      setError(err.message);
      // If unauthorized for this org, switch to another valid org if available
      if (organizations.length > 0 && organizations[0].id !== activeOrgId) {
        switchOrganization(organizations[0].id);
      }
    } finally {
      setLoadingOrg(false);
    }
  }, [activeOrgId, user, organizations]);

  useEffect(() => {
    if (activeOrgId) {
      fetchOrganizationDetails();
    } else {
      setLoadingOrg(false);
    }
  }, [activeOrgId, fetchOrganizationDetails]);

  const switchOrganization = (orgId) => {
    localStorage.setItem('activeOrgId', orgId);
    setActiveOrgId(orgId);
  };

  const role = currentOrg?.currentUserRole || 'member';
  const isOwner = role === 'owner';
  const isAdmin = role === 'admin' || role === 'owner';
  const isMember = role === 'member';

  return (
    <TenantContext.Provider
      value={{
        activeOrgId,
        currentOrg,
        loadingOrg,
        error,
        role,
        isOwner,
        isAdmin,
        isMember,
        switchOrganization,
        refreshOrganization: fetchOrganizationDetails,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
