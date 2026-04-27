import api from './api';
import Cookies from 'js-cookie';

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      Cookies.set('token', response.data.token, { httpOnly: true });
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      Cookies.set('token', response.data.token, { httpOnly: true });
    }
    return response.data;
  },

  logout: () => {
    Cookies.remove('token');
  },

  isAuthenticated: () => {
    return !!Cookies.get('token');
  },

  getCurrentUser: () => {
    const token = Cookies.get('token');
    if (!token) return null;
    // Decode token to get user data (e.g., using jwt-decode)
    return token;
  },
};