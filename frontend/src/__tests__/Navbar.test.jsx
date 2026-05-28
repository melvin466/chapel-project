import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { firstName: 'Jane', role: 'admin' },
    isAuthenticated: true,
    logout: vi.fn(),
    isAdmin: true,
    isChaplain: false,
  }),
}));

describe('Navbar', () => {
  it('renders navigation items for an authenticated admin user', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Chapel' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Announcements' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('link', { name: 'Sermons' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Admin' })).toBeInTheDocument();

    const eventsLinks = screen.getAllByRole('link', { name: 'Events' });
    expect(eventsLinks.length).toBeGreaterThanOrEqual(1);
    const announcementsLinks = screen.getAllByRole('link', { name: 'Announcements' });
    expect(announcementsLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('toggles the mobile menu when the toggle button is clicked', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const toggleButton = screen.getByRole('button', { name: /toggle navigation/i });
    expect(toggleButton).toBeInTheDocument();
    fireEvent.click(toggleButton);
    expect(screen.getByText('Close')).toBeInTheDocument();
    fireEvent.click(toggleButton);
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('toggles dropdown menus from the button state', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const moreButton = screen.getByRole('button', { name: 'More' });
    const adminButton = screen.getByRole('button', { name: 'Admin' });

    expect(moreButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(moreButton);
    expect(moreButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(adminButton);
    expect(moreButton).toHaveAttribute('aria-expanded', 'false');
    expect(adminButton).toHaveAttribute('aria-expanded', 'true');
  });
});
