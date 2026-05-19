import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminDonations from '../pages/AdminDonations';
import donationService from '../services/donationService';

vi.mock('../services/donationService', () => ({
  default: {
    getManageDonations: vi.fn(),
    getDonationStats: vi.fn(),
    updateManagedDonation: vi.fn(),
  },
}));

const donations = [
  {
    _id: 'donation-1',
    amount: 15000,
    currency: 'UGX',
    donationType: 'offering',
    paymentMethod: 'mobile_money',
    status: 'pending',
    phoneNumber: '256700000000',
    transactionId: 'TX-001',
    createdAt: '2026-05-18T12:00:00.000Z',
    receiptSent: false,
    donor: {
      firstName: 'Grace',
      lastName: 'Member',
      email: 'grace@example.com',
    },
  },
];

describe('AdminDonations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    donationService.getManageDonations.mockResolvedValue({ data: { donations } });
    donationService.getDonationStats.mockResolvedValue({
      data: {
        totalAmount: 15000,
        totalCount: 1,
      },
    });
    donationService.updateManagedDonation.mockResolvedValue({ success: true });
  });

  it('loads donation records and saves receipt details', async () => {
    render(<AdminDonations />);

    expect(screen.getByText(/Loading donations/i)).toBeInTheDocument();
    expect(await screen.findByText('Donation Management')).toBeInTheDocument();
    expect(screen.getByText('Grace Member')).toBeInTheDocument();
    expect(screen.getAllByText('UGX 15,000').length).toBeGreaterThanOrEqual(1);

    fireEvent.change(screen.getByPlaceholderText(/RCP-2026-001/i), {
      target: { value: 'RCP-TEST-001' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(donationService.updateManagedDonation).toHaveBeenCalledWith('donation-1', {
        receiptNumber: 'RCP-TEST-001',
        receiptSent: true,
      });
    });
    expect(await screen.findByText(/Receipt details saved/i)).toBeInTheDocument();
  });
});
