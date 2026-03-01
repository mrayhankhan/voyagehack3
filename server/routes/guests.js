import { Router } from 'express';
import { prisma } from '../prisma.js';
import { emitGuestUpdate } from '../lib/socket.js';
import { sendEmail } from '../lib/mailer.js';

const router = Router();

// ── GET ALl Guests for an Event
router.get('/:eventId', async (req, res) => {
  try {
    const guests = await prisma.guest.findMany({
      where: { eventId: req.params.eventId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(guests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ── CREATE OR UPDATE Guest RSVP
router.post('/', async (req, res) => {
  try {
    const { eventId, email, name, phone, rsvp, pax, dietary, addons } = req.body;

    if (!eventId || !email || !name) {
      return res.status(400).json({ error: 'eventId, email, and name are required' });
    }

    let guest = await prisma.guest.findFirst({
      where: { email, eventId }
    });

    const dataPayload = {
      name, phone, rsvp, pax: pax || 1, dietary: dietary || 'Vegetarian', 
      addons: addons ? JSON.stringify(addons) : null
    };

    if (guest) {
      guest = await prisma.guest.update({
        where: { id: guest.id },
        data: dataPayload
      });
    } else {
      guest = await prisma.guest.create({
        data: {
          eventId, email, ...dataPayload
        }
      });
    }

    // Fire Real-Time Update to the Dashboard
    emitGuestUpdate(eventId, { ...guest, _flash: true });

    // Handle Mail Confirmation if Confirmed
    if (rsvp === 'CONFIRMED') {
      await sendEmail({
        to: email,
        subject: `Your RSVP to TBO Weddings is Confirmed!`,
        text: `Hi ${name}, your RSVP has been successfully recorded. We look forward to seeing you there!`,
        html: `<p>Hi <b>${name}</b>,</p><p>Your RSVP has been successfully recorded.</p><p>You can manage your travel bookings anytime at the guest microsite.</p>`
      });
    }

    res.status(200).json(guest);

  } catch (err) {
    console.error('[guests/create]', err);
    res.status(500).json({ error: 'Failed to save RSVP' });
  }
});

export default router;
