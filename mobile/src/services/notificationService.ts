import api from './api';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type?: 'announcement' | 'booking' | 'cell' | 'prayer' | 'general';
  isRead: boolean;
  data?: any;
  createdAt: string;
}

export interface GetNotificationsResponse {
  success: boolean;
  message?: string;
  data: {
    notifications: Notification[];
    unreadCount: number;
  };
}

const notificationService = {
  getNotifications: async (): Promise<GetNotificationsResponse> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: string): Promise<any> => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<any> => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
};

export default notificationService;
