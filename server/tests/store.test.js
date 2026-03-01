import { vi, describe, beforeEach, it, expect } from 'vitest';
import { reserveUnit } from '../data/store.js';
import { prisma } from '../prisma.js';

vi.mock('../prisma.js', () => ({
  prisma: {
    $transaction: vi.fn(),
    booking: { findUnique: vi.fn() }
  }
}));

describe('Inventory Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bypasses logic if idempotencyKey matches existing booking', async () => {
    const mockExistingBooking = { id: 'booking-1', idempotencyKey: 'key-1' };
    prisma.booking.findUnique.mockResolvedValueOnce(mockExistingBooking);

    const result = await reserveUnit('block-1', 'key-1', { units: 1 });
    expect(result).toEqual(mockExistingBooking);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('calls transaction to reserve unit if key is new', async () => {
    prisma.booking.findUnique.mockResolvedValueOnce(null);
    prisma.$transaction.mockResolvedValueOnce({ id: 'new-booking' });

    const result = await reserveUnit('block-1', 'key-new', { units: 2 });
    expect(prisma.booking.findUnique).toHaveBeenCalledWith({ where: { idempotencyKey: 'key-new' } });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result.id).toBe('new-booking');
  });
});
