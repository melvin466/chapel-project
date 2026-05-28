import api from './api';

const authStorage = sessionStorage;

export const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const token = response.data.token || response.data.data?.token;
      const user = response.data.data?.user || response.data.user;

      if (token) {
        authStorage.setItem('token', token);
      }

      if (user) {
        authStorage.setItem('user', JSON.stringify(user));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const token = response.data.data?.token;
      const user = response.data.data?.user;

      if (token) {
        authStorage.setItem('token', token);
      }

      if (user) {
        authStorage.setItem('user', JSON.stringify(user));
      }

      return response.data;
    } catch (error) {
      throw {
        ...(error.response?.data || { message: 'Login failed' }),
        status: error.response?.status,
      };
    }
  },

  logout: () => {
    authStorage.removeItem('token');
    authStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated: () => {
    const token = authStorage.getItem('token');
    return !!token;
  },

  getToken: () => {
    return authStorage.getItem('token');
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    const user = response.data.data?.user;
    if (user) {
      authStorage.setItem('user', JSON.stringify(user));
    }
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/me', data, data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
    } : undefined);

    const user = response.data.data?.user;
    if (user) {
      authStorage.setItem('user', JSON.stringify(user));
    }

    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await api.post('/auth/verify-email', { token });
    const authToken = response.data.data?.token;
    const user = response.data.data?.user;

    if (authToken) {
      authStorage.setItem('token', authToken);
    }

    if (user) {
      authStorage.setItem('user', JSON.stringify(user));
    }

    return response.data;
  },

  resendVerification: async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, password) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  getCurrentUser: () => {
    const token = authStorage.getItem('token');
    if (!token) {
      authStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
    const user = authStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};
