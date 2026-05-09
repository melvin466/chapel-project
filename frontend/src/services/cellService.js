import api from './api';

const cellService = {
  getCells: async () => {
    const response = await api.get('/cells');
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
  }
};

export default cellService;