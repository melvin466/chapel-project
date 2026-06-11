import api from './api';

const auditService = {
  getAuditLogs: async (params = {}) => {
    return api.get('/audit-logs', { params });
  },

  filterByUser: async (userId: string, params = {}) => {
    return api.get(`/audit-logs/user/${userId}`, { params });
  },

  filterByAction: async (action: string, params = {}) => {
    return api.get('/audit-logs', { params: { ...params, action } });
  },

  filterByDateRange: async (startDate: string, endDate: string, params = {}) => {
    return api.get('/audit-logs', { params: { ...params, startDate, endDate } });
  },
};

export default auditService;
