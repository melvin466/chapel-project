import api from './api';

const cellMessageService = {
  getCellDetail: (cellId) => api.get(`/cells/${cellId}/detail`),

  getCellMembers: (cellId) => api.get(`/cells/${cellId}/members`),

  getCellMessages: (cellId, limit = 50, offset = 0) =>
    api.get(`/cells/${cellId}/messages`, { params: { limit, offset } }),

  sendMessage: (cellId, data) => api.post(`/cells/${cellId}/messages`, data),
};

export default cellMessageService;
