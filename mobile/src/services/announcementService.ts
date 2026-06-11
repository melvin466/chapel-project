import api from './api';
import cacheService from './cacheService';

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  featuredImage?: string;
  publishDate?: string;
  createdAt: string;
}

export interface GetAnnouncementsResponse {
  success: boolean;
  message?: string;
  isCached?: boolean;
  data: {
    announcements: Announcement[];
    pagination?: {
      total: number;
      limit: number;
      page: number;
      pages: number;
    };
  };
}

const announcementService = {
  getAnnouncements: async (params = {}): Promise<GetAnnouncementsResponse> => {
    const cacheKey = `announcements_${JSON.stringify(params)}`;
    try {
      const response = await api.get('/announcements', { params });
      await cacheService.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      const cachedData = await cacheService.get<any>(cacheKey);
      if (cachedData) {
        return {
          success: true,
          message: 'Loaded from offline cache',
          isCached: true,
          data: cachedData,
        };
      }
      throw error;
    }
  },

  getAnnouncementById: async (id: string): Promise<{ success: boolean; isCached?: boolean; data: Announcement }> => {
    const cacheKey = `announcement_${id}`;
    try {
      const response = await api.get(`/announcements/${id}`);
      await cacheService.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      const cachedData = await cacheService.get<any>(cacheKey);
      if (cachedData) {
        return {
          success: true,
          isCached: true,
          data: cachedData,
        };
      }
      throw error;
    }
  },

  createAnnouncement: async (data: Partial<Announcement>): Promise<any> => {
    const response = await api.post('/announcements', data);
    return response.data;
  },

  updateAnnouncement: async (id: string, data: Partial<Announcement>): Promise<any> => {
    const response = await api.put(`/announcements/${id}`, data);
    return response.data;
  },

  deleteAnnouncement: async (id: string): Promise<any> => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  },

  publishAnnouncement: async (id: string): Promise<any> => {
    const response = await api.put(`/announcements/${id}/publish`);
    return response.data;
  },
};

export default announcementService;
