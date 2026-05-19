import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotificationsPage from '../pages/NotificationsPage';
import notificationService from '../services/notificationService';

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('../services/notificationService', () => ({
  default: {
    getNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

const notifications = [
  {
    _id: 'notification-1',
    type: 'announcement',
    title: 'Chapel update',
    message: 'New published announcement',
    isRead: false,
    createdAt: '2026-07-01T10:00:00.000Z',
    data: { announcementId: 'announcement-1' },
  },
  {
    _id: 'notification-2',
    type: 'booking',
    title: 'Booking approved',
    message: 'Approved for room 2',
    isRead: true,
    createdAt: '2026-07-02T10:00:00.000Z',
    data: { bookingId: 'booking-1' },
  },
];

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigate.mockClear();
    notificationService.getNotifications.mockResolvedValue({
      data: { notifications, unreadCount: 1 },
    });
    notificationService.markAsRead.mockResolvedValue({ success: true });
    notificationService.markAllAsRead.mockResolvedValue({ success: true });
  });

  it('loads notifications and opens announcement notifications', async () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Chapel update')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Chapel update'));

    await waitFor(() => {
      expect(notificationService.markAsRead).toHaveBeenCalledWith('notification-1');
      expect(navigate).toHaveBeenCalledWith('/announcements/announcement-1');
    });
  });

  it('opens booking notifications on the bookings page', async () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Booking approved')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Booking approved'));

    expect(navigate).toHaveBeenCalledWith('/bookings');
  });
});
