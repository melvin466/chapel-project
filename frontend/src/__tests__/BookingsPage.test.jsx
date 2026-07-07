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

const futureDate = (daysFromNow) => new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
const dateInputValue = (daysFromNow) => futureDate(daysFromNow).split('T')[0];

const existingBookings = [
  {
    _id: 'booking-1',
    bookingType: 'wedding',
    requestedDate: futureDate(7),
    requestedTime: '10:00',
    purpose: 'Wedding ceremony booking',
    numberOfPeople: 80,
    specialRequests: 'Need sound support',
    status: 'approved',
    reviewReason: 'Approved for the main chapel.',
    reviewedBy: { firstName: 'Paul', lastName: 'Chaplain' },
  },
];

const createdBooking = {
  _id: 'booking-2',
  bookingType: 'baptism',
  requestedDate: futureDate(30),
  requestedTime: '09:30',
  purpose: 'Baptism service request',
  numberOfPeople: 5,
  specialRequests: 'Reserve front seats',
  status: 'pending',
};

describe('BookingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get
      .mockResolvedValueOnce({ data: { data: { bookings: existingBookings } } })
      .mockResolvedValue({ data: { data: { bookings: [createdBooking, ...existingBookings] } } });
    api.post.mockResolvedValue({ data: { success: true, data: { booking: createdBooking } } });
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
      target: { value: dateInputValue(30) },
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
        requestedDate: dateInputValue(30),
        requestedTime: '09:30',
        hours: 1,
        numberOfPeople: 5,
        purpose: 'Baptism service request',
        specialRequests: 'Reserve front seats',
        requiresChapel: false,
      });
    });
    expect(await screen.findByText(/booking request has been sent/i)).toBeInTheDocument();
    expect(screen.getByText('Just submitted')).toBeInTheDocument();
    expect(screen.getAllByText('Baptism service request').length).toBeGreaterThan(0);
    expect(document.querySelector('.booking-item-latest')).toBeInTheDocument();
    expect(document.querySelector('.success-message')).not.toBeInTheDocument();
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
