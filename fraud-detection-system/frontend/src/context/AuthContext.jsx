/**
 * AuthContext.jsx
 * -----------------
 * Holds the logged-in analyst's session (JWT + profile) in React context
 * so any component can check `isAuthenticated` or `admin.role` without
 * prop-drilling. Persists to localStorage so a page refresh doesn't log
 * the analyst out.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('sentry_admin');
    return stored ? JSON.parse(stored) : null;
  });  

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login(email, password);
    localStorage.setItem('sentry_token', data.token);
    localStorage.setItem('sentry_admin', JSON.stringify(data.admin));
    setAdmin(data.admin);
    return data.admin;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sentry_token');
    localStorage.removeItem('sentry_admin');
    setAdmin(null);
  }, []);

  const value = {
    admin,
    isAuthenticated: !!admin,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
