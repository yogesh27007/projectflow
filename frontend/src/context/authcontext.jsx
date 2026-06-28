import React, { createContext, useContext, useState, useEffect } from 'react';

// createContext makes a "box" that any component in the app can read from,
// without us having to pass props down manually through every level.
const AuthContext = createContext(null);

const API = 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  // We start by checking localStorage, so a page refresh doesn't log the user out.
  const [token, setToken] = useState(() => localStorage.getItem('pf_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pf_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // On first load, if we have a token, double check it's still valid
  // by asking the backend "who am I?" via GET /api/auth/me
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Invalid session');
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        // Token is bad/expired - clear everything so the user gets sent to login
        logout();
        setLoading(false);
      });
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('pf_token', data.token);
    localStorage.setItem('pf_user', JSON.stringify(data.user));
  };

  const signup = async (name, email, password) => {
    const res = await fetch(`${API}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('pf_token', data.token);
    localStorage.setItem('pf_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pf_token');
    localStorage.removeItem('pf_user');
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// This is a small custom hook so any component can just call useAuth()
// instead of importing AuthContext and useContext separately every time.
export function useAuth() {
  return useContext(AuthContext);
}