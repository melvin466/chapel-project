import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DonationsPage from '../pages/DonationsPage';
import donationService from '../services/donationService';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
  }),
}));

vi.mock('../services/donationService', () => ({
  default: {
    getDonationOptions: vi.fn(),
    createDonation: vi.fn(),
  },
}));

describe('DonationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    donationService.getDonationOptions.mockResolvedValue({
      data: {
        options: [
          { id: 'tithe', name: 'Tithe' },
          { id: 'missions', name: 'Missions' },
        ],
      },
    });
    donationService.createDonation.mockResolvedValue({ success: true });
  });

  it('submits an authenticated mobile money donation', async () => {
    render(<DonationsPage />);

    expect(screen.getByRole('heading', { name: /Give with clarity/i })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'Missions' })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Amount/i), {
      target: { value: '25000' },
    });
    fireEvent.change(screen.getByLabelText(/Mobile money phone number/i), {
      target: { value: '256700000000' },
    });
    fireEvent.click(screen.getByLabelText(/Donate Anonymously/i));
    fireEvent.click(screen.getByRole('button', { name: /Give Now/i }));

    await waitFor(() => {
      expect(donationService.createDonation).toHaveBeenCalledWith({
        amount: 25000,
        donationType: 'tithe',
        paymentMethod: 'mobile_money',
        provider: 'MTN',
        phoneNumber: '256700000000',
        isAnonymous: true,
      });
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Mobile money prompt sent. Check your phone to approve the payment.');
  });
});
