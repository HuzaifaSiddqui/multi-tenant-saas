import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.get('/auth/me');
      setUser(data.user);
      setOrganizations(data.organizations || []);

      // If activeOrgId is not set, or no longer exists in organizations, pick the first one
      const storedOrgId = localStorage.getItem('activeOrgId');
      const hasStoredOrg = data.organizations?.some((org) => org.id === storedOrgId);

      if (!hasStoredOrg && data.organizations?.length > 0) {
        localStorage.setItem('activeOrgId', data.organizations[0].id);
      }
    } catch (err) {
      console.error('Failed to load user session:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('activeOrgId');
      setUser(null);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setOrganizations(data.organizations || []);

    if (data.organizations?.length > 0) {
      localStorage.setItem('activeOrgId', data.organizations[0].id);
    } else {
      localStorage.removeItem('activeOrgId');
    }

    return data;
  };

  const register = async (name, email, password, organizationName) => {
    const data = await api.post('/auth/register', {
      name,
      email,
      password,
      organizationName,
    });

    localStorage.setItem('token', data.token);
    setUser(data.user);

    if (data.organization) {
      const orgItem = {
        id: data.organization._id || data.organization.id,
        name: data.organization.name,
        slug: data.organization.slug,
        role: 'owner',
        plan: data.organization.plan || 'free',
      };
      setOrganizations([orgItem]);
      localStorage.setItem('activeOrgId', orgItem.id);
    } else {
      setOrganizations([]);
      localStorage.removeItem('activeOrgId');
    }

    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('activeOrgId');
    setUser(null);
    setOrganizations([]);
    window.location.href = '/login';
  };

  const updateProfile = async (profileData) => {
    const data = await api.put('/auth/profile', profileData);
    setUser(data.user);
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organizations,
        setOrganizations,
        loading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
