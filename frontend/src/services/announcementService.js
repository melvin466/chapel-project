import api from './api';

const announcementService = {
  getAnnouncements: async (params = {}) => {
    const response = await api.get('/announcements', { params });
    return response.data;
  },

  getAnnouncementById: async (id) => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },

  getManageAnnouncements: async (params = {}) => {
    const response = await api.get('/announcements/manage/all', { params });
    return response.data;
  },

  createAnnouncement: async (data) => {
    const response = await api.post('/announcements', data, data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined);
    return response.data;
  },

  updateAnnouncement: async (id, data) => {
    const response = await api.put(`/announcements/${id}`, data, data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined);
    return response.data;
  },

  deleteAnnouncement: async (id) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  }
};

export default announcementService;
