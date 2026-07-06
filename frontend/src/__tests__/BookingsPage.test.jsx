import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BookingsPage from '../pages/BookingsPage';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const existingBookings = [
  {
    _id: 'booking-1',
    bookingType: 'wedding',
    requestedDate: '2026-07-11T00:00:00.000Z',
    requestedTime: '10:00',
    purpose: 'Wedding ceremony booking',
    numberOfPeople: 80,
    specialRequests: 'Need sound support',
    status: 'approved',
    reviewReason: 'Approved for the main chapel.',
    reviewedBy: { firstName: 'Paul', lastName: 'Chaplain' },
  },
];

describe('BookingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { data: { bookings: existingBookings } } });
    api.post.mockResolvedValue({ data: { success: true } });
    api.put.mockResolvedValue({ data: { success: true } });
  });

  it('loads existing bookings and submits a new booking request', async () => {
    const { container } = render(<BookingsPage />);

    expect(screen.getByText(/Loading bookings/i)).toBeInTheDocument();
    expect(await screen.findByText('Wedding ceremony booking')).toBeInTheDocument();
    expect(screen.getByText('Approved for the main chapel.')).toBeInTheDocument();

    fireEvent.change(container.querySelector('select[name="bookingType"]'), {
      target: { value: 'baptism' },
    });
    fireEvent.change(container.querySelector('input[name="requestedDate"]'), {
      target: { value: '2026-08-02' },
    });
    fireEvent.change(container.querySelector('input[name="requestedTime"]'), {
      target: { value: '09:30' },
    });
    fireEvent.change(container.querySelector('input[name="numberOfPeople"]'), {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Tell us what you need/i), {
      target: { value: 'Baptism service request' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Special requests/i), {
      target: { value: 'Reserve front seats' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Booking/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/bookings', {
        bookingType: 'baptism',
        requestedDate: '2026-08-02',
        requestedTime: '09:30',
        hours: 1,
        numberOfPeople: 5,
        purpose: 'Baptism service request',
        specialRequests: 'Reserve front seats',
        requiresChapel: false,
      });
    });
    expect(await screen.findByText(/booking request has been sent/i)).toBeInTheDocument();
  });

  it('cancels a pending booking request', async () => {
    render(<BookingsPage />);

    expect(await screen.findByText('Wedding ceremony booking')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/bookings/booking-1/cancel');
    });
    expect(await screen.findByText(/Booking cancelled/i)).toBeInTheDocument();
  });
});
