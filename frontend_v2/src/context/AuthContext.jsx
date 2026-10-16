import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('hb_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('hb_token');
    const savedUserId = localStorage.getItem('userId');
    const savedName = localStorage.getItem('userName');
    if (savedToken && savedUserId) {
      const timer = setTimeout(() => {
        setToken(savedToken);
        setUser({ id: savedUserId, name: savedName });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveToken = (t) => {
    setToken(t);
    localStorage.setItem('hb_token', t);
    window._authToken = t;
  };

  const removeToken = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hb_token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    window._authToken = null;
  };

  const loginAsDemo = () => {
    const demoData = {
      id: '1',
      name: 'Alex Rossi',
      email: 'alex.rossi@hobbybuddy.com',
      token: 'mock-jwt-demo-session-token-2026',
      quizCompleted: true,
      archetype: 'The Catalyst',
    };
    localStorage.setItem('userId', demoData.id);
    localStorage.setItem('userName', demoData.name);
    saveToken(demoData.token);
    setUser({ id: demoData.id, name: demoData.name });
    return demoData;
  };

  const login = async (email, password) => {
    // If user enters demo credentials directly
    if (email.toLowerCase().includes('demo') && password === 'Password123!') {
      return loginAsDemo();
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 429) {
          const retryAfter = errorData.retryAfter || 300;
          const minutes = Math.ceil(retryAfter / 60);
          const err = new Error(`Too many login attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`);
          err.status = 429;
          err.retryAfter = retryAfter;
          err.isRateLimited = true;
          throw err;
        }
        if (res.status === 403 && errorData.error === 'EMAIL_NOT_VERIFIED') {
          const err = new Error(errorData.message || 'Please verify your email before logging in.');
          err.status = 403;
          err.isUnverified = true;
          throw err;
        }
        if (res.status === 404) throw new Error('No account found with this email.');
        if (res.status === 401) throw new Error('Wrong password.');
        const fallbackErr = new Error(errorData.message || 'Login failed');
        fallbackErr.status = res.status;
        throw fallbackErr;
      }
      const data = await res.json();
      localStorage.setItem('userId', data.id);
      localStorage.setItem('userName', data.name);
      if (data.token) saveToken(data.token);
      setUser({ id: data.id, name: data.name });
      return data;
    } catch (err) {
      if (err.isRateLimited || err.isUnverified || err.message === 'Wrong password.' || err.message === 'No account found with this email.') {
        throw err;
      }
      // Network unreachable fallback
      const netErr = new Error('Server is starting up or unreachable. You can continue with Demo Mode.');
      netErr.isNetworkError = true;
      netErr.status = 503;
      throw netErr;
    }
  };

  const register = async (userData) => {
    const res = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      if (res.status === 429) {
        const errorData = await res.json().catch(() => ({}));
        const retryAfter = errorData.retryAfter || 900;
        const minutes = Math.ceil(retryAfter / 60);
        const err = new Error(`Too many registration attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`);
        err.status = 429;
        err.retryAfter = retryAfter;
        err.isRateLimited = true;
        throw err;
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Server Error (${res.status})`);
    }
    const data = await res.json();
    localStorage.setItem('userId', data.id);
    localStorage.setItem('userName', data.name);
    if (data.token) saveToken(data.token);
    setUser({ id: data.id, name: data.name });
    return data;
  };

  const logout = useCallback(() => {
    removeToken();
  }, []);

  const authFetch = useCallback(async (url, options = {}) => {
    // Only set Content-Type for JSON bodies; let the browser set it for FormData
    const isFormData = options.body instanceof FormData;
    const defaultHeaders = isFormData ? {} : { 'Content-Type': 'application/json' };
    const headers = { ...defaultHeaders, ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(url, { ...options, headers });
      if ((res.status === 401 || res.status === 403) && !url.includes('/login') && !url.includes('/register')) {
        // If it's a real 401 on real token, logout; if it's mock token let it degrade gracefully
        if (!token?.startsWith('mock-')) {
          removeToken();
          window.location.href = '/login';
        }
      }
      return res;
    } catch (err) {
      // Return a simulated response if offline/server cold starting so user can explore the UI
      return {
        ok: false,
        status: 503,
        json: async () => ({ error: 'Server starting' }),
      };
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginAsDemo, register, logout, authFetch, saveToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
