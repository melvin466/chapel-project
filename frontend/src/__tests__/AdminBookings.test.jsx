import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminBookings from '../pages/AdminBookings';
import bookingService from '../services/bookingService';
import userService from '../services/userService';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isAdmin: true,
  }),
}));

vi.mock('../services/bookingService', () => ({
  default: {
    getManageBookings: vi.fn(),
    updateManagedBooking: vi.fn(),
  },
}));

vi.mock('../services/userService', () => ({
  default: {
    getUsers: vi.fn(),
  },
}));

const bookings = [
  {
    _id: 'booking-1',
    bookingType: 'wedding',
    requestedDate: '2026-07-11T00:00:00.000Z',
    requestedTime: '10:00',
    purpose: 'Wedding planning meeting',
    numberOfPeople: 4,
    specialRequests: 'Needs counselling room',
    status: 'pending',
    user: {
      firstName: 'Mary',
      lastName: 'Student',
      email: 'mary@example.com',
      phoneNumber: '256700000000',
    },
  },
];

describe('AdminBookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bookingService.getManageBookings.mockResolvedValue({ data: { bookings } });
    bookingService.updateManagedBooking.mockResolvedValue({ success: true });
    userService.getUsers.mockResolvedValue({
      data: {
        users: [
          { _id: 'staff-1', firstName: 'Paul', lastName: 'Chaplain', role: 'chaplain' },
          { _id: 'member-1', firstName: 'Regular', lastName: 'Member', role: 'member' },
        ],
      },
    });
  });

  it('loads booking requests and allows an admin to assign staff', async () => {
    render(<AdminBookings />);

    expect(screen.getByText(/Loading booking requests/i)).toBeInTheDocument();
    expect(await screen.findByText('Booking Management')).toBeInTheDocument();
    expect(screen.getByText('Wedding planning meeting')).toBeInTheDocument();
    expect(screen.getByText('Mary Student')).toBeInTheDocument();

    const assignmentSelect = screen.getAllByRole('combobox').at(-1);
    fireEvent.change(assignmentSelect, { target: { value: 'staff-1' } });

    await waitFor(() => {
      expect(bookingService.updateManagedBooking).toHaveBeenCalledWith('booking-1', {
        assignedTo: 'staff-1',
      });
    });
    expect(await screen.findByText(/Booking assignment updated/i)).toBeInTheDocument();
  });
});
