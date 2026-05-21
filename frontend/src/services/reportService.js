import api from './api';

const reportService = {
  getSummary: async (params = {}) => {
    const response = await api.get('/reports/summary', { params });
    return response.data;
  },

  exportReport: async (type, params = {}) => {
    const response = await api.get(`/reports/export/${type}`, {
      params,
      responseType: 'blob',
    });
    return response;
  },
};

export default reportService;
