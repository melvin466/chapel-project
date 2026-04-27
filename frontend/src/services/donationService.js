import api from './api';

export const donationService = {
  createDonation: async (data) => {
    const response = await api.post('/donations', data);
    return response.data;
  },

  getDonations: async () => {
    const response = await api.get('/donations');
    return response.data;
  }
};