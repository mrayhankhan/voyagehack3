import { prisma } from '../prisma.js';

// ── InventoryBlock CRUD ────────────────────────────────────────────────────

export const createInventoryBlock = async (data) => {
  return await prisma.inventoryBlock.create({
    data: {
      eventId: data.eventId,
      type: data.type,
      provider: data.provider || 'amadeus',
      supplier: data.supplier || '',
      providerRefId: data.providerRefId || '',
      providerOfferId: data.providerOfferId || '',
      providerData: JSON.stringify(data.providerData || {}),
      lockedUnits: data.lockedUnits || 0,
      allocatedUnits: 0,
      availableUnits: data.lockedUnits || 0,
      costPerUnit: data.costPerUnit || 0,
      sellPerUnit: data.sellPerUnit || 0,
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
      status: 'ACTIVE',
    },
  });
};

export const getBlocksByEvent = async (eventId, type = null) => {
  const where = { eventId, status: { not: 'EXPIRED' } };
  if (type) where.type = type;

  const blocks = await prisma.inventoryBlock.findMany({ where, orderBy: { createdAt: 'desc' } });
  return blocks.map(b => ({
    ...b,
    providerData: b.providerData ? JSON.parse(b.providerData) : (b.metadata ? JSON.parse(b.metadata) : {}),
  }));
};

export const getBlockById = async (id) => {
  const block = await prisma.inventoryBlock.findUnique({ where: { id } });
  if (!block) return null;
  return { ...block, providerData: block.providerData ? JSON.parse(block.providerData) : (block.metadata ? JSON.parse(block.metadata) : {}) };
};

export const releaseBlock = async (id) => {
  return await prisma.inventoryBlock.update({
    where: { id },
    data: { status: 'EXPIRED', availableUnits: 0 },
  });
};

export const deallocateFromBlock = async (blockId, units = 1) => {
  return await prisma.inventoryBlock.update({
    where: { id: blockId },
    data: {
      allocatedUnits: { decrement: units },
      availableUnits: { increment: units },
    },
  });
};

// ── Booking CRUD & Transactional Reservations ──────────────────────────────

export const reserveUnit = async (inventoryBlockId, idempotencyKey, bookingData) => {
  // 1. Idempotency Check
  if (idempotencyKey) {
    const existing = await prisma.booking.findUnique({ where: { idempotencyKey } });
    if (existing) return existing;
  }

  // 2. Transaction with Optimistic Locking
  // SQLite doesn't support SELECT ... FOR UPDATE well in Prisma, so we use versioning.
  return await prisma.$transaction(async (tx) => {
    const block = await tx.inventoryBlock.findUnique({ where: { id: inventoryBlockId } });

    if (!block || block.availableUnits < (bookingData.units || 1) || block.status !== 'ACTIVE') {
      throw new Error('Inventory unavailable or expired');
    }

    const units = bookingData.units || 1;

    // Optimistic lock update
    const updatedBlock = await tx.inventoryBlock.update({
      where: {
        id: inventoryBlockId,
        version: block.version // ensures no concurrent mod occurred
      },
      data: {
        allocatedUnits: { increment: units },
        availableUnits: { decrement: units },
        version: { increment: 1 },
      },
    });

    if (!updatedBlock) {
      throw new Error('Concurrent modification detected. Please retry.');
    }

    // Create the booking record pending provider confirmation
    const booking = await tx.booking.create({
      data: {
        eventId: bookingData.eventId,
        guestId: bookingData.guestId || null,
        guestName: bookingData.guestName || '',
        type: block.type,
        inventoryBlockId: block.id,
        cost: block.costPerUnit * units,
        sellPrice: block.sellPerUnit * units,
        margin: (block.sellPerUnit - block.costPerUnit) * units,
        status: 'PENDING_PROVIDER',
        idempotencyKey: idempotencyKey || null,
      },
    });

    return booking;
  });
};

export const updateBookingStatus = async (id, status, providerBookingId = null) => {
  const data = { status };
  if (providerBookingId) data.providerBookingId = providerBookingId;
  return await prisma.booking.update({ where: { id }, data });
};

export const getBookingsByEvent = async (eventId) => {
  return await prisma.booking.findMany({
    where: { eventId },
    orderBy: { createdAt: 'desc' },
  });
};

export const getBookingById = async (id) => {
  return await prisma.booking.findUnique({ where: { id } });
};

export const cancelBooking = async (id) => {
  const booking = await getBookingById(id);
  if (!booking || booking.status === 'CANCELLED') return null;

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    if (booking.inventoryBlockId) {
      await tx.inventoryBlock.update({
        where: { id: booking.inventoryBlockId },
        data: {
          allocatedUnits: { decrement: 1 },
          availableUnits: { increment: 1 },
        }
      });
    }
  });

  return await getBookingById(id);
};

export const expireBlocks = async () => {
  const now = new Date();

  const expired = await prisma.inventoryBlock.updateMany({
    where: {
      status: 'ACTIVE',
      releaseDate: { lte: now }
    },
    data: {
      status: 'EXPIRED',
      availableUnits: 0,
    }
  });

  return expired.count;
};

export const getEventInventoryStats = async (eventId) => {
  const blocks = await prisma.inventoryBlock.findMany({ where: { eventId, status: { not: 'EXPIRED' } } });
  return {
    totalBlocks: blocks.length,
    hotelBlocks: blocks.filter(b => b.type === 'hotel').length,
    flightBlocks: blocks.filter(b => b.type === 'flight').length,
    totalLocked: blocks.reduce((s, b) => s + b.lockedUnits, 0),
    totalAllocated: blocks.reduce((s, b) => s + b.allocatedUnits, 0),
    totalAvailable: blocks.reduce((s, b) => s + b.availableUnits, 0),
  };
};
