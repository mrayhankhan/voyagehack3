/**
 * Flights route — Amadeus Flight Offers Search API (FREE tier).
 * Replaces Kiwi Tequila. All API keys stay server-side.
 */
import { Router } from 'express';
import { amadeusGet } from './amadeus-auth.js';

const router = Router();

// ── Airport / City autocomplete ────────────────────────────────────────────
router.get('/autocomplete', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 2) return res.json([]);

    const data = await amadeusGet(
      `/v1/reference-data/locations?subType=AIRPORT&keyword=${encodeURIComponent(query)}&page%5Blimit%5D=8`
    );

    const locations = (data.data || []).map((loc) => ({
      id: loc.id,
      name: loc.name,
      code: loc.iataCode,
      city: loc.address?.cityName || loc.name,
      country: loc.address?.countryCode || '',
      type: loc.subType,
      label: `${loc.address?.cityName || loc.name} (${loc.iataCode})`,
      sublabel: `${loc.name} · ${loc.address?.countryCode || ''}`,
    }));

    res.json(locations);
  } catch (err) {
    console.error('[flights/autocomplete]', err.message);
    if (err.status === 429) {
      return res.status(429).json({ error: 'Flight provider limit reached — try again later' });
    }
    res.status(500).json({ error: 'Failed to fetch airport suggestions' });
  }
});

// ── Flight search ──────────────────────────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const {
      origin, destination, departureDate, returnDate,
      adults = 1, travelClass = 'ECONOMY', max = 20,
    } = req.query;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ error: 'origin, destination, and departureDate are required' });
    }

    let url = `/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${departureDate}&adults=${adults}&travelClass=${travelClass}&max=${max}&currencyCode=USD`;
    if (returnDate) url += `&returnDate=${returnDate}`;

    const data = await amadeusGet(url);

    // Normalize results
    const flights = (data.data || []).map((offer) => {
      const firstSeg = offer.itineraries?.[0]?.segments || [];
      const lastSeg = firstSeg[firstSeg.length - 1];
      const firstDep = firstSeg[0];

      // Duration parsing: PT2H30M → hours, minutes
      const durStr = offer.itineraries?.[0]?.duration || '';
      const hMatch = durStr.match(/(\d+)H/);
      const mMatch = durStr.match(/(\d+)M/);
      const hours = hMatch ? parseInt(hMatch[1]) : 0;
      const minutes = mMatch ? parseInt(mMatch[1]) : 0;

      // Unique airlines
      const airlines = [...new Set(firstSeg.map(s => s.carrierCode))];

      return {
        id: offer.id,
        flyFrom: firstDep?.departure?.iataCode || origin,
        flyTo: lastSeg?.arrival?.iataCode || destination,
        cityFrom: firstDep?.departure?.iataCode || origin,
        cityTo: lastSeg?.arrival?.iataCode || destination,
        departure: firstDep?.departure?.at || '',
        arrival: lastSeg?.arrival?.at || '',
        duration: { total: hours * 3600 + minutes * 60, hours, minutes },
        airlines,
        route: firstSeg.map(s => ({
          flyFrom: s.departure?.iataCode,
          flyTo: s.arrival?.iataCode,
          airline: s.carrierCode,
          flight_no: s.number,
          departure: s.departure?.at,
          arrival: s.arrival?.at,
        })),
        stops: firstSeg.length - 1,
        price: parseFloat(offer.price?.total) || 0,
        currency: offer.price?.currency || 'USD',
        cabin: travelClass,
        offerId: offer.id,
        provider: 'amadeus',
        availability: offer.numberOfBookableSeats || null,
      };
    });

    res.json({
      flights,
      total: flights.length,
      currency: 'USD',
    });
  } catch (err) {
    console.error('[flights/search]', err.message);
    if (err.status === 429) {
      return res.status(429).json({ error: 'Flight provider limit reached — try again later' });
    }
    res.status(500).json({ error: 'Failed to search flights' });
  }
});

export default router;
