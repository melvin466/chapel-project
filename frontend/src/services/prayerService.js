import api from './api';

export const prayerService = {
  getPrayerRequests: async () => {
    const response = await api.get('/prayers');
    return response.data;
  },

  createPrayerRequest: async (data) => {
    const response = await api.post('/prayers', data);
    return response.data;
  },

  prayForRequest: async (id) => {
    const response = await api.post(`/prayers/${id}/pray`);
    return response.data;
  }
};