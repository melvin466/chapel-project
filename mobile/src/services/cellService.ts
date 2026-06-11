import api from './api';
import cacheService from './cacheService';

export interface Cell {
  _id: string;
  name: string;
  description?: string;
  leader?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  location?: string;
  zone?: string;
  meetingVenue?: string;
  meetingDay?: string;
  meetingTime?: string;
  memberCount?: number;
  maxCapacity?: number;
  viewerStatus?: 'member' | 'pending' | 'none';
}

export interface GetCellsResponse {
  success: boolean;
  message?: string;
  isCached?: boolean;
  data: {
    cells: Cell[];
    viewer?: {
      cellId?: string;
      pendingCellId?: string;
    };
    pagination?: {
      total: number;
      limit: number;
      page: number;
      pages: number;
    };
  };
}

const cellService = {
  getCells: async (params = {}): Promise<GetCellsResponse> => {
    const cacheKey = `cells_${JSON.stringify(params)}`;
    try {
      const response = await api.get('/cells', { params });
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

  getCellById: async (id: string): Promise<{ success: boolean; isCached?: boolean; data: Cell }> => {
    const cacheKey = `cell_${id}`;
    try {
      const response = await api.get(`/cells/${id}`);
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

  createCell: async (data: Partial<Cell>): Promise<any> => {
    const response = await api.post('/cells', data);
    return response.data;
  },

  updateCell: async (id: string, data: Partial<Cell>): Promise<any> => {
    const response = await api.put(`/cells/${id}`, data);
    return response.data;
  },

  deleteCell: async (id: string): Promise<any> => {
    const response = await api.delete(`/cells/${id}`);
    return response.data;
  },

  joinCell: async (id: string): Promise<any> => {
    const response = await api.post(`/cells/${id}/join`);
    return response.data;
  },

  leaveCell: async (id: string): Promise<any> => {
    const response = await api.post(`/cells/${id}/leave`);
    return response.data;
  }
};

export default cellService;
