import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Set Flask backend base URL
  axios.defaults.baseURL = 'http://127.0.0.1:5000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    console.log('🔍 AuthContext: Token exists:', !!token);
    console.log('🔍 AuthContext: User string:', userStr);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('🔍 AuthContext: Parsed user:', user);
        
        if (user && user.id && user.name) {
          setCurrentUser(user);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('✅ AuthContext: User authenticated successfully');
        } else {
          console.log('❌ AuthContext: Invalid user data, clearing localStorage');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('❌ AuthContext: Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/login', { email, password });
      const { access_token, user } = response.data;
      if (!access_token || !user) {
        // Backend did not return expected data
        return {
          success: false,
          message: 'Login failed: Invalid server response.'
        };
      }
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setCurrentUser(user);
      return { success: true };
    } catch (error) {
      // Improved error feedback
      let message = 'Login failed';
      if (error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
      }
      return {
        success: false,
        message
      };
    }
  };

  const loginWithGoogle = async (idToken) => {
    try {
      const response = await axios.post('/api/login/google', { id_token: idToken });
      const { access_token, user } = response.data;
      if (!access_token || !user) {
        return { success: false, message: 'Google login failed: Invalid server response.' };
      }
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setCurrentUser(user);
      return { success: true };
    } catch (error) {
      let message = 'Google login failed';
      if (error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
      }
      return { success: false, message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post('/api/register', { name, email, password });
      if (response.status !== 201) {
        return {
          success: false,
          message: response.data.message || 'Registration failed: Unexpected server response.'
        };
      }
      return { success: true };
    } catch (error) {
      // Improved error feedback
      let message = 'Registration failed';
      if (error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
      }
      return {
        success: false,
        message
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    loginWithGoogle,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
