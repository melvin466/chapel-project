import api from './api';

export const cellService = {
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
  }
};