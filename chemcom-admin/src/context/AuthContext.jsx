import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const BACKEND_URL = '';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        await fetchProfile(token);
      } else {
        setLoading(false);
      }
    };
    initAuth();
  }, [token]);

  const fetchProfile = async (authToken) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.is_superuser) {
          setUser(userData);
        } else {
          logout();
          alert('Access Denied: Admin privileges required.');
        }
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (username, password) => {
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('adminToken', data.access_token);
        setToken(data.access_token);
        await fetchProfile(data.access_token);
        return { success: true };
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login: loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { BACKEND_URL };
