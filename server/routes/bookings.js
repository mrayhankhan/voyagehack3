/**
 * Booking routes — create, list, cancel bookings per event.
 */
import { Router } from 'express';
import {
  reserveUnit, getBookingsByEvent, cancelBooking, updateBookingStatus, getBlockById
} from '../data/store.js';
import { emitBookingCreated, emitInventoryUpdate } from '../lib/socket.js';
import { createHotelBooking } from '../lib/amadeus.js';
import { tboBookFlight } from '../lib/tbo.js';

const router = Router();

// ── Create booking ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { eventId, guestId, guestName, type, inventoryBlockId,
      cost, sellPrice, units, idempotencyKey, paymentInfo } = req.body;

    if (!eventId || !type || !inventoryBlockId) {
      return res.status(400).json({
        error: 'eventId, type, and inventoryBlockId are required',
      });
    }

    // 1. Transactional reservation locks local DB
    const booking = await reserveUnit(inventoryBlockId, idempotencyKey, {
      eventId, guestId, guestName, type, units
    });

    // Idempotency: skip external call if already processed
    if (booking.status !== 'PENDING_PROVIDER') {
      return res.status(201).json(booking);
    }

    try {
      // 2. Attempt Provider Booking
      let providerData = null;
      let providerRefId = 'PROV_DUMMY_OK';

      if (type === 'flight') {
        // TBO flow
        const block = await getBlockById(inventoryBlockId);
        if (!block || !block.providerData) throw new Error('Inventory block missing TBO data');

        const pt = block.providerData.passengerTemplate || {};
        // Map simplified UI template to TBO required array
        const passengers = [{
          Title: pt.title || 'Mr',
          FirstName: pt.firstName || guestName.split(' ')[0],
          LastName: pt.lastName || guestName.split(' ')[1] || 'Guest',
          PaxType: 1, // Adult
          DateOfBirth: pt.dob || '1990-01-01',
          PassportNo: pt.passportNo || '',
          Nationality: 'IN',
          ContactNo: pt.contactNo || '9999999999',
          Email: pt.email || guestId || 'guest@example.com'
        }];

        const tboRes = await tboBookFlight({
          traceId: block.providerData.traceId,
          resultIndex: block.providerRefId,
          passengers
        });

        providerData = tboRes.raw;
        providerRefId = tboRes.pnr;

      } else {
        providerData = await createHotelBooking({ /* dummy payload for sandbox */ });
        providerRefId = providerData?.data?.id || 'PROV_DUMMY_OK';
      }

      // 3. Confirm
      await updateBookingStatus(booking.id, 'CONFIRMED', providerRefId);
      booking.status = 'CONFIRMED';

    } catch (apiErr) {
      console.warn('[bookings/provider] Amadeus booking failed tracking status as PENDING_MANUAL_CONFIRM, or rollback required:', apiErr.message);

      // Sandbox fails to book often. Let's fail gracefully to PENDING_MANUAL_CONFIRM for MVP 
      await updateBookingStatus(booking.id, 'PENDING_MANUAL_CONFIRM');
      booking.status = 'PENDING_MANUAL_CONFIRM';

      // If we wanted strict rollback:
      // await cancelBooking(booking.id);
      // return res.status(500).json({ error: 'Provider confirmation failed. Inventory rolled back.' });
    }

    // 4. Broadcast Realtime Updates
    emitBookingCreated(eventId, booking);

    // getBlockById might have already been called, but fetch fresh allocation
    const freshBlock = await getBlockById(inventoryBlockId);
    if (freshBlock) {
      emitInventoryUpdate(eventId, freshBlock.id, freshBlock.availableUnits, freshBlock.allocatedUnits);
    }

    res.status(201).json(booking);
  } catch (err) {
    console.error('[bookings/create]', err.message);
    res.status(500).json({ error: err.message || 'Failed to create booking' });
  }
});

// ── Get bookings for an event ──────────────────────────────────────────────
router.get('/:eventId', async (req, res) => {
  try {
    const bookings = await getBookingsByEvent(req.params.eventId);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Cancel a booking ───────────────────────────────────────────────────────
router.put('/:id/cancel', async (req, res) => {
  try {
    const booking = await cancelBooking(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.inventoryBlockId) {
      const block = await getBlockById(booking.inventoryBlockId);
      if (block) {
        emitInventoryUpdate(booking.eventId, block.id, block.availableUnits, block.allocatedUnits);
      }
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
