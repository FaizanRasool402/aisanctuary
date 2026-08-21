import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const publicUser = (payload) => ({
  _id: payload._id,
  name: payload.name,
  email: payload.email,
  role: payload.role,
});

const persistUser = (payload) => {
  const { token, ...rest } = payload;
  const userData = publicUser(rest);
  localStorage.setItem('aisanctuary_token', token);
  localStorage.setItem('aisanctuary_user', JSON.stringify(userData));
  return userData;
};

const readStoredUser = () => {
  const storedUser = localStorage.getItem('aisanctuary_user');
  const token = localStorage.getItem('aisanctuary_token');
  if (!storedUser || !token) return null;
  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsEnrollmentForm, setNeedsEnrollmentForm] = useState(false);

  const refreshStudentProfile = useCallback(async (role) => {
    if (role !== 'student') {
      setNeedsEnrollmentForm(false);
      return;
    }
    try {
      await api.get('/students/me');
      setNeedsEnrollmentForm(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setNeedsEnrollmentForm(true);
      } else {
        setNeedsEnrollmentForm(false);
      }
    }
  }, []);

  const applyEnrollmentFlag = useCallback((role, hasStudentProfile) => {
    if (role !== 'student') {
      setNeedsEnrollmentForm(false);
      return;
    }
    setNeedsEnrollmentForm(!hasStudentProfile);
  }, []);

  const applyStoredSession = useCallback(async (parsed) => {
    setUser(parsed);
    await refreshStudentProfile(parsed.role);
  }, [refreshStudentProfile]);

  const clearSession = useCallback(() => {
    localStorage.removeItem('aisanctuary_token');
    localStorage.removeItem('aisanctuary_user');
    setUser(null);
    setNeedsEnrollmentForm(false);
  }, []);

  useEffect(() => {
    const boot = async () => {
      const parsed = readStoredUser();
      if (parsed) {
        setUser(parsed);
        try {
          const { data } = await api.get('/auth/me');
          const synced = publicUser(data.data);
          localStorage.setItem('aisanctuary_user', JSON.stringify(synced));
          setUser(synced);
          applyEnrollmentFlag(synced.role, data.data.hasStudentProfile);
        } catch {
          clearSession();
        }
      }
      setLoading(false);
    };
    boot();

    const onStorage = (event) => {
      if (event.key && event.key !== 'aisanctuary_token' && event.key !== 'aisanctuary_user') {
        return;
      }
      const next = readStoredUser();
      if (!next) {
        setUser(null);
        setNeedsEnrollmentForm(false);
        return;
      }
      applyStoredSession(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [applyEnrollmentFlag, applyStoredSession, clearSession]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const userData = persistUser(data.data);
    setUser(userData);
    applyEnrollmentFlag(userData.role, data.data.hasStudentProfile);
    return userData;
  }, [applyEnrollmentFlag]);

  const signup = useCallback(async ({ name, email, phone, password }) => {
    const { data } = await api.post('/auth/signup', { name, email, phone, password });
    const userData = persistUser(data.data);
    setUser(userData);
    setNeedsEnrollmentForm(true);
    return userData;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      logout,
      needsEnrollmentForm,
      refreshStudentProfile,
    }),
    [user, loading, login, signup, logout, needsEnrollmentForm, refreshStudentProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
