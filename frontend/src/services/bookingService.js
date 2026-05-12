import api from './api';

const bookingService = {
  getMyBookings: async (params = {}) => {
    const response = await api.get('/bookings', { params });
    return response.data;
  },

  createBooking: async (data) => {
    const response = await api.post('/bookings', data);
    return response.data;
  },

  cancelBooking: async (id) => {
    const response = await api.put(`/bookings/${id}/cancel`);
    return response.data;
  },

  getManageBookings: async (params = {}) => {
    const response = await api.get('/bookings/manage/all', { params });
    return response.data;
  },

  updateManagedBooking: async (id, data) => {
    const response = await api.put(`/bookings/${id}/manage`, data);
    return response.data;
  },
};

export default bookingService;
