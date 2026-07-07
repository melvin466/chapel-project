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

const futureDate = (daysFromNow) => new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
const pastDate = (daysAgo) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
const dateInputValue = (daysFromNow) => futureDate(daysFromNow).split('T')[0];

const bookings = [
  {
    _id: 'booking-1',
    bookingType: 'wedding',
    requestedDate: futureDate(7),
    requestedTime: '10:00',
    endDateTime: futureDate(7),
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
  {
    _id: 'booking-2',
    bookingType: 'facility',
    requestedDate: futureDate(9),
    requestedTime: '15:00',
    endDateTime: futureDate(9),
    purpose: 'Approved fellowship setup',
    numberOfPeople: 20,
    status: 'approved',
    user: {
      firstName: 'John',
      lastName: 'Leader',
      email: 'john@example.com',
    },
  },
  {
    _id: 'booking-3',
    bookingType: 'appointment',
    requestedDate: pastDate(3),
    requestedTime: '08:00',
    endDateTime: pastDate(3),
    purpose: 'Old appointment',
    numberOfPeople: 1,
    status: 'pending',
    user: {
      firstName: 'Past',
      lastName: 'Member',
      email: 'past@example.com',
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
    expect(screen.getByText('Approved fellowship setup')).toBeInTheDocument();
    expect(screen.getByText('Past Bookings')).toBeInTheDocument();
    expect(screen.getByText('Old appointment')).toBeInTheDocument();
    expect(screen.getByText('Pending Bookings')).toBeInTheDocument();
    expect(screen.getByText('Approved Bookings')).toBeInTheDocument();
    expect(screen.getByText('Mary Student')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Complete/i })).not.toBeInTheDocument();
    expect(bookingService.getManageBookings).toHaveBeenCalledWith({
      scope: 'all',
      status: undefined,
      type: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });

    const assignmentSelect = screen.getAllByLabelText(/Assigned to/i)[0];
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

    fireEvent.change(screen.getAllByPlaceholderText(/Reason shown to the member/i)[0], {
      target: { value: 'Approved for the counselling room at 10 AM.' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Approve/i })[0]);

    await waitFor(() => {
      expect(bookingService.updateManagedBooking).toHaveBeenCalledWith('booking-1', {
        status: 'approved',
        reviewReason: 'Approved for the counselling room at 10 AM.',
      });
    });
    expect(await screen.findByText(/Booking approved/i)).toBeInTheDocument();
  });

  it('filters bookings by requested date range', async () => {
    render(<AdminBookings />);

    expect(await screen.findByText('Booking Management')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('From'), {
      target: { value: '2026-08-01' },
    });
    fireEvent.change(screen.getByLabelText('To'), {
      target: { value: '2026-08-31' },
    });

    await waitFor(() => {
      expect(bookingService.getManageBookings).toHaveBeenLastCalledWith({
        scope: 'all',
        status: undefined,
        type: undefined,
        dateFrom: '2026-08-01',
        dateTo: '2026-08-31',
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /Clear dates/i }));

    await waitFor(() => {
      expect(bookingService.getManageBookings).toHaveBeenLastCalledWith({
        scope: 'all',
        status: undefined,
        type: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      });
    });
  });

  it('lets an admin create a booking request', async () => {
    const { container } = render(<AdminBookings />);

    expect(await screen.findByText('Make a Booking')).toBeInTheDocument();

    fireEvent.change(container.querySelector('select[name="bookingType"]'), {
      target: { value: 'facility' },
    });
    fireEvent.change(container.querySelector('input[name="requestedDate"]'), {
      target: { value: dateInputValue(30) },
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
        requestedDate: dateInputValue(30),
        requestedTime: '14:00',
        hours: 1,
        numberOfPeople: 20,
        purpose: 'Admin facility reservation',
        specialRequests: '',
        requiresChapel: true,
      });
    });
    expect(await screen.findByText(/Booking request created/i)).toBeInTheDocument();
  });
});
