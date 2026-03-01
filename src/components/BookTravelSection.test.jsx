import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import BookTravelSection from './BookTravelSection';
import { inventoryBlockApi } from '../services/api.service';

// Mock dependencies
vi.mock('../services/api.service', () => ({
  inventoryBlockApi: {
    getByEvent: vi.fn(),
  },
  bookingApi: {
    create: vi.fn(),
  }
}));

vi.mock('../lib/socket', () => ({
  socket: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  }
}));

describe('BookTravelSection', () => {
  it('shows loading state initially', () => {
    inventoryBlockApi.getByEvent.mockResolvedValue([]);
    render(<BookTravelSection event={{ id: '1' }} guestName="Test" guestEmail="test@test.com" />);
    expect(screen.getByText(/loading travel options/i)).toBeDefined();
  });

  it('renders hotels when inventory is available', async () => {
    inventoryBlockApi.getByEvent.mockImplementation((id, type) => {
      if (type === 'hotel') return Promise.resolve([{ id: 'h1', supplier: 'Hilton', availableUnits: 5, sellPerUnit: 150 }]);
      return Promise.resolve([]);
    });

    render(<BookTravelSection event={{ id: '1' }} guestName="Test" guestEmail="test@test.com" />);

    await waitFor(() => {
      expect(screen.queryByText(/loading travel options/i)).toBeNull();
    });

    expect(screen.getByText('Hilton')).toBeDefined();
    expect(screen.getByText(/5 rooms available/i)).toBeDefined();
  });
});
