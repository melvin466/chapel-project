import api from './api';

export interface Booking {
  _id: string;
  bookingType: 'counselling' | 'wedding' | 'baptism' | 'facility' | 'appointment';
  requestedDate: string;
  requestedTime: string;
  numberOfPeople: number;
  purpose: string;
  specialRequests?: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  reviewReason?: string;
  reviewedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface GetBookingsResponse {
  success: boolean;
  message?: string;
  data: {
    bookings: Booking[];
    pagination?: {
      total: number;
      limit: number;
      page: number;
      pages: number;
    };
  };
}

const bookingService = {
  getMyBookings: async (params = {}): Promise<GetBookingsResponse> => {
    const response = await api.get('/bookings', { params });
    return response.data;
  },

  getManageBookings: async (params = {}): Promise<GetBookingsResponse> => {
    const response = await api.get('/bookings/manage', { params });
    return response.data;
  },

  createBooking: async (data: Partial<Booking>): Promise<any> => {
    const response = await api.post('/bookings', data);
    return response.data;
  },

  cancelBooking: async (id: string): Promise<any> => {
    const response = await api.put(`/bookings/${id}/cancel`);
    return response.data;
  },

  approveBooking: async (id: string, reviewReason?: string): Promise<any> => {
    const response = await api.put(`/bookings/${id}/approve`, { reviewReason });
    return response.data;
  },

  denyBooking: async (id: string, reviewReason?: string): Promise<any> => {
    const response = await api.put(`/bookings/${id}/deny`, { reviewReason });
    return response.data;
  },

  addReview: async (id: string, reviewReason: string): Promise<any> => {
    const response = await api.put(`/bookings/${id}/review`, { reviewReason });
    return response.data;
  }
};

export default bookingService;
