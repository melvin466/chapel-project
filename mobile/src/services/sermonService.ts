import api from './api';
import cacheService from './cacheService';

export interface Sermon {
  _id: string;
  title: string;
  speaker: string;
  description: string;
  date: string;
  videoUrl?: string;
  audioUrl?: string;
  thumbnail?: string;
  series?: string;
  serviceType?: string;
  duration?: number;
  likes?: string[];
  views?: number;
  bibleVerses?: string[];
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface GetSermonsResponse {
  success: boolean;
  message?: string;
  isCached?: boolean;
  data: {
    sermons: Sermon[];
    pagination?: {
      total: number;
      limit: number;
      page: number;
      pages: number;
    };
  };
}

const sermonService = {
  getSermons: async (params = {}): Promise<GetSermonsResponse> => {
    const cacheKey = `sermons_${JSON.stringify(params)}`;
    try {
      const response = await api.get('/sermons', { params });
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

  getSermonById: async (id: string): Promise<{ success: boolean; isCached?: boolean; data: { sermon: Sermon } }> => {
    const cacheKey = `sermon_${id}`;
    try {
      const response = await api.get(`/sermons/${id}`);
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

  likeSermon: async (id: string): Promise<any> => {
    const response = await api.post(`/sermons/${id}/like`);
    return response.data;
  }
};

export default sermonService;
