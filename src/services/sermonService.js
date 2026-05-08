import api from './api';

export const sermonService = {
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
  }
};