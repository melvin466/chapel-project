import api from './api';

const cellService = {
  getCells: async (params = {}) => {
    const response = await api.get('/cells', { params });
    return response.data;
  },

  getManageCells: async () => {
    const response = await api.get('/cells/manage/all');
    return response.data;
  },

  getCellById: async (id) => {
    const response = await api.get(`/cells/${id}`);
    return response.data;
  },

  joinCell: async (id) => {
    const response = await api.post(`/cells/${id}/join`);
    return response.data;
  },

  reviewJoinRequest: async (requestId, data) => {
    const response = await api.put(`/cells/join-requests/${requestId}`, data);
    return response.data;
  },

  leaveCell: async (id) => {
    const response = await api.post(`/cells/${id}/leave`);
    return response.data;
  },

  createCell: async (data) => {
    const response = await api.post('/cells', data);
    return response.data;
  },

  updateCell: async (id, data) => {
    const response = await api.put(`/cells/${id}`, data);
    return response.data;
  },

  deleteCell: async (id) => {
    const response = await api.delete(`/cells/${id}`);
    return response.data;
  },

  assignMember: async (cellId, userId) => {
    const response = await api.post(`/cells/${cellId}/members`, { userId });
    return response.data;
  },

  removeMember: async (cellId, userId) => {
    const response = await api.delete(`/cells/${cellId}/members/${userId}`);
    return response.data;
  }
};

export default cellService;
