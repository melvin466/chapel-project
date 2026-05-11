import api from './api';

const donationService = {
  createDonation: async (data) => {
    const response = await api.post('/donations', data);
    return response.data;
  },

  getDonationOptions: async () => {
    const response = await api.get('/donations/options');
    return response.data;
  },

  getDonations: async () => {
    const response = await api.get('/donations');
    return response.data;
  },

  getDonationStats: async () => {
    const response = await api.get('/donations/stats');
    return response.data;
  }
};

export default donationService;
