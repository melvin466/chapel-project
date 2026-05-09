import api from './api';

const sermonService = {
  getSermons: async () => {
    const response = await api.get('/sermons');
    return response.data;
  },

  getSermonById: async (id) => {
    const response = await api.get(`/sermons/${id}`);
    return response.data;
  },

  likeSermon: async (id) => {
    const response = await api.post(`/sermons/${id}/like`);
    return response.data;
  },

  createSermon: async (data) => {
    const response = await api.post('/sermons', data);
    return response.data;
  },

  updateSermon: async (id, data) => {
    const response = await api.put(`/sermons/${id}`, data);
    return response.data;
  },

  deleteSermon: async (id) => {
    const response = await api.delete(`/sermons/${id}`);
    return response.data;
  }
};

export default sermonService;