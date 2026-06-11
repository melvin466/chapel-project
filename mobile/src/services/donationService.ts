import api from './api';
import cacheService from './cacheService';

const donationService = {
  createDonation: async (data: any) => {
    const response = await api.post('/donations', data);
    return response.data;
  },

  getDonationOptions: async () => {
    const cacheKey = 'donation_options';
    try {
      const response = await api.get('/donations/options');
      await cacheService.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
      throw error;
    }
  },

  getDonations: async (params = {}) => {
    const cacheKey = `donations_${JSON.stringify(params)}`;
    try {
      const response = await api.get('/donations', { params });
      await cacheService.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
      throw error;
    }
  },

  getDonationStats: async () => {
    const cacheKey = 'donation_stats';
    try {
      const response = await api.get('/donations/stats');
      await cacheService.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
      throw error;
    }
  },

  getDonationStatusPublic: async (transactionId: string) => {
    const response = await api.get(`/donations/status/${transactionId}`);
    return response.data;
  },

  updateDonation: async (id: string, data: any) => {
    const response = await api.put(`/donations/${id}`, data);
    return response.data;
  }
};

export default donationService;
