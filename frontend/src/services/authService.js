import api from './api';

export const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      console.log('Register response:', response.data);
      
      // Try multiple possible token locations
      const token = response.data.token || response.data.data?.token;
      const user = response.data.data?.user || response.data.user;
      
      if (token) {
        localStorage.setItem('token', token);
        console.log('✅ Token stored on register');
      }
      
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ User stored on register');
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('📝 Login response:', response.data);
      
      // IMPORTANT: Your backend returns token inside data.token
      const token = response.data.data?.token;
      const user = response.data.data?.user;
      
      if (token) {
        localStorage.setItem('token', token);
        console.log('✅ Token stored successfully');
      } else {
        console.error('❌ No token found in response');
        console.log('Response structure:', Object.keys(response.data));
      }
      
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ User stored:', user.firstName, user.role);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('🔓 Logged out, storage cleared');
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    console.log('🔑 isAuthenticated check:', !!token);
    return !!token;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/me', data, data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined);

    const user = response.data.data?.user;
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }

    return response.data;
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};
