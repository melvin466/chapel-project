import api from './api';

const settingService = {
  // Get all settings
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  // Get public settings
  getPublicSettings: async () => {
    const response = await api.get('/settings/public');
    return response.data;
  },

  // Update settings
  updateSettings: async (settings) => {
    const response = await api.put('/settings', settings);
    return response.data;
  },

  // Update single setting
  updateSetting: async (key, value) => {
    const response = await api.put(`/settings/${key}`, { value });
    return response.data;
  }
};

export default settingService;