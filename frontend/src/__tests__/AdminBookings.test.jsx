import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminBookings from '../pages/AdminBookings';
import bookingService from '../services/bookingService';
import userService from '../services/userService';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isAdmin: true,
    hasAdminPower: true,
  }),
}));

vi.mock('../services/bookingService', () => ({
  default: {
    getManageBookings: vi.fn(),
    createBooking: vi.fn(),
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
    bookingService.createBooking.mockResolvedValue({ success: true });
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

  it('approves a booking with a reason shown to the member', async () => {
    render(<AdminBookings />);

    expect(await screen.findByText('Wedding planning meeting')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Reason shown to the member/i), {
      target: { value: 'Approved for the counselling room at 10 AM.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Approve/i }));

    await waitFor(() => {
      expect(bookingService.updateManagedBooking).toHaveBeenCalledWith('booking-1', {
        status: 'approved',
        reviewReason: 'Approved for the counselling room at 10 AM.',
      });
    });
    expect(await screen.findByText(/Booking approved/i)).toBeInTheDocument();
  });

  it('lets an admin create a booking request', async () => {
    const { container } = render(<AdminBookings />);

    expect(await screen.findByText('Make a Booking')).toBeInTheDocument();

    fireEvent.change(container.querySelector('select[name="bookingType"]'), {
      target: { value: 'facility' },
    });
    fireEvent.change(container.querySelector('input[name="requestedDate"]'), {
      target: { value: '2026-08-12' },
    });
    fireEvent.change(container.querySelector('input[name="requestedTime"]'), {
      target: { value: '14:00' },
    });
    fireEvent.change(container.querySelector('input[name="numberOfPeople"]'), {
      target: { value: '20' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Purpose for this booking/i), {
      target: { value: 'Admin facility reservation' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Booking/i }));

    await waitFor(() => {
      expect(bookingService.createBooking).toHaveBeenCalledWith({
        bookingType: 'facility',
        requestedDate: '2026-08-12',
        requestedTime: '14:00',
        numberOfPeople: 20,
        purpose: 'Admin facility reservation',
        specialRequests: '',
      });
    });
    expect(await screen.findByText(/Booking request created/i)).toBeInTheDocument();
  });
});
