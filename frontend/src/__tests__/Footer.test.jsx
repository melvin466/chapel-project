import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../components/Footer';

describe('Footer', () => {
  it('renders footer content and navigation links', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getByText('Chapel Community')).toBeInTheDocument();
    expect(screen.getByText('Stay connected with chapel life.')).toBeInTheDocument();
    expect(screen.getByText('Latest Updates')).toBeInTheDocument();
    expect(screen.getByText('Give Online')).toBeInTheDocument();
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Prayer Requests')).toBeInTheDocument();
  });
});
