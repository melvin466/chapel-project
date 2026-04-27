import api from './api';

export const eventService = {
  getEvents: async (params = {}) => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  getUpcomingEvents: async (limit = 5) => {
    const response = await api.get(`/events/upcoming?limit=${limit}`);
    return response.data;
  },

  getEventById: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  registerForEvent: async (id) => {
    const response = await api.post(`/events/${id}/register`);
    return response.data;
  },

  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  }
};