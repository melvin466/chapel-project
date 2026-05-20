import api from './api';

const eventService = {
  getEvents: async (params = {}) => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  getUpcomingEvents: async (limit = 5) => {
    const response = await api.get(`/events/upcoming?limit=${limit}`);
    return response.data;
  },

  getManageEvents: async (params = {}) => {
    const response = await api.get('/events/manage/all', { params });
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

  cancelRegistration: async (id) => {
    const response = await api.delete(`/events/${id}/register`);
    return response.data;
  },

  addEventFeedback: async (id, feedbackData) => {
    const response = await api.post(`/events/${id}/feedback`, feedbackData);
    return response.data;
  },

  getEventsByMonth: async (params = {}) => {
    const response = await api.get('/events/calendar', { params });
    return response.data;
  },

  getEventStats: async () => {
    const response = await api.get('/events/stats/summary');
    return response.data;
  },

  exportEvents: async () => {
    const response = await api.get('/events/export/all', { responseType: 'blob' });
    return response;
  },

  getEventAttendees: async (id) => {
    const response = await api.get(`/events/${id}/attendees`);
    return response.data;
  },

  checkInAttendee: async (id, attendeeId) => {
    const response = await api.post(`/events/${id}/checkin`, { attendeeId });
    return response.data;
  },

  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData, eventData instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined);
    return response.data;
  },

  updateEvent: async (id, eventData) => {
    const response = await api.put(`/events/${id}`, eventData, eventData instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined);
    return response.data;
  },

  deleteEvent: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  }
};

export default eventService;
