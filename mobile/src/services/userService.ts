import api from './api';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: 'admin' | 'chaplain' | 'member' | 'chapel_leader';
  isActive: boolean;
  createdAt: string;
}

const userService = {
  getUsers: async (params = {}) => {
    return api.get('/users', { params });
  },

  createUser: async (data: Partial<User>) => {
    return api.post('/users', data);
  },

  updateUser: async (id: string, data: Partial<User>) => {
    return api.put(`/users/${id}`, data);
  },

  deleteUser: async (id: string) => {
    return api.delete(`/users/${id}`);
  },

  getCurrentUser: async () => {
    return api.get('/users/me');
  },
};

export default userService;
