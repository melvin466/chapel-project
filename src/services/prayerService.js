import api from './api';

const prayerService = {
  // Get all prayer requests
  getPrayerRequests: async (params = {}) => {
    const response = await api.get('/prayers', { params });
    return response.data;
  },

  // Get single prayer request
  getPrayerRequestById: async (id) => {
    const response = await api.get(`/prayers/${id}`);
    return response.data;
  },

  // Create prayer request
  createPrayerRequest: async (data) => {
    const response = await api.post('/prayers', data);
    return response.data;
  },

  // Pray for a request
  prayForRequest: async (id) => {
    const response = await api.post(`/prayers/${id}/pray`);
    return response.data;
  },

  // Update prayer status
  updatePrayerStatus: async (id, status) => {
    const response = await api.put(`/prayers/${id}/status`, { status });
    return response.data;
  },

  // Delete prayer request
  deletePrayerRequest: async (id) => {
    const response = await api.delete(`/prayers/${id}`);
    return response.data;
  }
};

export default prayerService;