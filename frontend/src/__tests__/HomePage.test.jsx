import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';

const eventsMock = [
  {
    _id: 'event-1',
    title: 'Campus Worship Night',
    description: 'A special evening of praise and fellowship.',
    startDate: '2026-06-01T18:00:00.000Z',
    location: 'Main Chapel',
  },
];

const announcementsMock = [
  {
    _id: 'announcement-1',
    title: 'Chapel Retreat Registration Open',
    summary: 'Register now for the annual chapel retreat.',
    publishDate: '2026-05-20T12:00:00.000Z',
    priority: 'high',
  },
];

vi.mock('../services/eventService', () => ({
  default: {
    getEvents: vi.fn(() => Promise.resolve({ data: { events: eventsMock } })),
  },
}));

vi.mock('../services/announcementService', () => ({
  default: {
    getAnnouncements: vi.fn(() => Promise.resolve({ data: { announcements: announcementsMock } })),
  },
}));

describe('HomePage', () => {
  it('renders the homepage hero and loads events and announcements', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Worship, community, and care in one living system/i)).toBeInTheDocument();
    expect(screen.getByText(/Loading events/i)).toBeInTheDocument();
    expect(screen.getByText(/Loading announcements/i)).toBeInTheDocument();

    expect(await screen.findByText(eventsMock[0].title)).toBeInTheDocument();
    expect(await screen.findByText(announcementsMock[0].title)).toBeInTheDocument();

    expect(screen.queryByText(/Loading events/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Loading announcements/i)).not.toBeInTheDocument();
    expect(screen.getByText(/View Events/i)).toBeInTheDocument();
    expect(screen.getByText(/Request Prayer/i)).toBeInTheDocument();
  });
});
