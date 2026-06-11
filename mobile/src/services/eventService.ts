import api from './api';

export interface Event {
  _id: string;
  title: string;
  description: string;
  location?: string;
  startDate: string;
  endDate?: string;
  status?: 'published' | 'draft';
  featuredImage?: string;
  category?: string;
  registrationOpen?: boolean;
}

export interface GetEventsResponse {
  success: boolean;
  message?: string;
  data: {
    events: Event[];
    pagination?: {
      total: number;
      limit: number;
      page: number;
      pages: number;
    };
  };
}

const eventService = {
  getEvents: async (params = {}): Promise<GetEventsResponse> => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  getUpcomingEvents: async (limit = 5): Promise<GetEventsResponse> => {
    const response = await api.get(`/events/upcoming?limit=${limit}`);
    return response.data;
  },

  getEventById: async (id: string): Promise<{ success: boolean; data: Event }> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  createEvent: async (data: Partial<Event>): Promise<any> => {
    const response = await api.post('/events', data);
    return response.data;
  },

  updateEvent: async (id: string, data: Partial<Event>): Promise<any> => {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
  },

  deleteEvent: async (id: string): Promise<any> => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  publishEvent: async (id: string): Promise<any> => {
    const response = await api.put(`/events/${id}/publish`);
    return response.data;
  },

  registerForEvent: async (id: string): Promise<any> => {
    const response = await api.post(`/events/${id}/register`);
    return response.data;
  },

  cancelRegistration: async (id: string): Promise<any> => {
    const response = await api.delete(`/events/${id}/register`);
    return response.data;
  },

  addEventFeedback: async (id: string, feedbackData: any): Promise<any> => {
    const response = await api.post(`/events/${id}/feedback`, feedbackData);
    return response.data;
  },
};

export default eventService;
