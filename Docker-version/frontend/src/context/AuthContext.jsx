import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

const TOKEN_KEY = 'token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on load if a token is present.
  useEffect(() => {
    const restore = async () => {
      if (!localStorage.getItem(TOKEN_KEY)) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/users/profile');
        setUser(res.data);
      } catch (err) {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  // Stores the returned JWT and sets the user profile (without the token).
  const persist = (data) => {
    if (data?.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    const { token, ...profile } = data;
    setUser(profile);
  };

  const login = async (email, password) => {
    const res = await api.post('/users/login', { email, password });
    persist(res.data);
  };

  const register = async (name, email, password) => {
    const res = await api.post('/users/signup', { name, email, password });
    persist(res.data);
  };

  const logout = async () => {
    try {
      await api.post('/users/logout');
    } catch (err) {
      // Logout is client-side for a stateless JWT; ignore server errors.
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);