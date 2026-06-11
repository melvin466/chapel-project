import api from './api';

const reportService = {
  getAttendanceReport: async (params = {}) => {
    return api.get('/reports/attendance', { params });
  },

  getDonationReport: async (params = {}) => {
    return api.get('/reports/donations', { params });
  },

  getEventReport: async (params = {}) => {
    return api.get('/reports/events', { params });
  },

  getUserEngagement: async (params = {}) => {
    return api.get('/reports/engagement', { params });
  },

  exportData: async (format: 'csv' | 'pdf' = 'csv', params = {}) => {
    return api.get(`/reports/export?format=${format}`, { params });
  },
};

export default reportService;
