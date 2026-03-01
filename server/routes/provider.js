import express from 'express';
import {
  tboAirportSearch,
  tboSearchFlights,
  tboRepriceFlight,
  tboBookFlight,
  tboCancelFlight,
} from '../lib/tbo.js';

const router = express.Router();

// ── Flights (TBO) ─────────────────────────────────────────────────────────────

router.post('/flights/autocomplete', async (req, res) => {
  try {
    const { query } = req.body;
    const results = await tboAirportSearch(query);
    res.json(results);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/flights/search', async (req, res) => {
  try {
    const result = await tboSearchFlights(req.body);
    // result = { flights: [...], traceId }
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/flights/reprice', async (req, res) => {
  try {
    const { traceId, resultIndex } = req.body;
    const result = await tboRepriceFlight({ traceId, resultIndex });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/flights/book', async (req, res) => {
  try {
    const result = await tboBookFlight(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, status: 'PENDING_MANUAL_CONFIRM' });
  }
});

router.post('/flights/cancel', async (req, res) => {
  try {
    const result = await tboCancelFlight(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ── Hotels (Amadeus — unchanged) ──────────────────────────────────────────────

router.post('/hotels/autocomplete', async (req, res) => {
  try {
    const { query } = req.body;
    const { autocompleteLocations } = await import('../lib/amadeus.js');
    const results = await autocompleteLocations(query, 'CITY');
    res.json(results);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/hotels/list', async (req, res) => {
  try {
    const { cityCode } = req.body;
    const { hotelList } = await import('../lib/amadeus.js');
    const results = await hotelList(cityCode);
    res.json(results);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/hotels/offers', async (req, res) => {
  try {
    const { hotelIds, checkin, checkout, adults, rooms } = req.body;
    const { hotelOffers } = await import('../lib/amadeus.js');
    const results = await hotelOffers(hotelIds, checkin, checkout, adults, rooms);
    res.json(results);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/hotels/book', async (req, res) => {
  try {
    const { createHotelBooking } = await import('../lib/amadeus.js');
    const results = await createHotelBooking(req.body);
    res.json(results);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, status: 'PENDING_MANUAL_CONFIRM' });
  }
});

export default router;
