import api from './api';

export interface PrayerRequest {
  _id: string;
  title: string;
  description: string;
  category: 'personal' | 'family' | 'health' | 'academic' | 'financial' | 'spiritual' | 'other';
  urgency: 'normal' | 'urgent' | 'critical';
  visibility: 'community' | 'chaplain';
  isAnonymous: boolean;
  prayerCount?: number;
  viewerHasPrayed?: boolean;
  viewerCanPray?: boolean;
  canViewPrayerCount?: boolean;
  status: 'active' | 'answered' | 'closed';
  adminResponse?: string;
  createdAt: string;
}

export interface GetPrayersResponse {
  success: boolean;
  message?: string;
  data: {
    prayerRequests: PrayerRequest[];
    pagination?: {
      total: number;
      limit: number;
      page: number;
      pages: number;
    };
  };
}

const prayerService = {
  getPrayerRequests: async (params = {}): Promise<GetPrayersResponse> => {
    const response = await api.get('/prayers', { params });
    return response.data;
  },

  getPrayerRequestById: async (id: string): Promise<{ success: boolean; data: { prayerRequest: PrayerRequest } }> => {
    const response = await api.get(`/prayers/${id}`);
    return response.data;
  },

  createPrayerRequest: async (data: Partial<PrayerRequest>): Promise<any> => {
    const response = await api.post('/prayers', data);
    return response.data;
  },

  updatePrayerRequest: async (id: string, data: Partial<PrayerRequest>): Promise<any> => {
    const response = await api.put(`/prayers/${id}`, data);
    return response.data;
  },

  deletePrayerRequest: async (id: string): Promise<any> => {
    const response = await api.delete(`/prayers/${id}`);
    return response.data;
  },

  markAnswered: async (id: string, adminResponse?: string): Promise<any> => {
    const response = await api.put(`/prayers/${id}/status`, { status: 'answered', adminResponse });
    return response.data;
  },

  prayForRequest: async (id: string): Promise<any> => {
    const response = await api.post(`/prayers/${id}/pray`);
    return response.data;
  }
};

export default prayerService;
