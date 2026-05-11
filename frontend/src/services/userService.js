import api from './api';

const userService = {
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  updateUser: async (id, data) => {
    const response = await api.put(`/users/${id}`, data, data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  createUser: async (data) => {
    const response = await api.post('/users', data, data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined);
    return response.data;
  }
};

export default userService;
