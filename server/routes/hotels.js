/**
 * Hotels route — Amadeus Self-Service API (FREE tier).
 * Uses shared OAuth from amadeus-auth.js.
 * No RapidAPI. No affiliate fallback.
 */
import { Router } from 'express';
import { amadeusGet } from './amadeus-auth.js';

const router = Router();

// ── City autocomplete ──────────────────────────────────────────────────────
router.get('/autocomplete', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 2) return res.json([]);

    const data = await amadeusGet(
      `/v1/reference-data/locations?subType=CITY&keyword=${encodeURIComponent(query)}&page%5Blimit%5D=8`
    );

    const locations = (data.data || []).map((loc) => ({
      id: loc.id,
      name: loc.name,
      code: loc.iataCode,
      cityCode: loc.address?.cityCode || loc.iataCode,
      country: loc.address?.countryCode || '',
      type: loc.subType,
      label: `${loc.name}${loc.iataCode ? ` (${loc.iataCode})` : ''}, ${loc.address?.countryCode || ''}`,
      sublabel: `${loc.address?.countryCode || ''} · City`,
    }));

    res.json(locations);
  } catch (err) {
    console.error('[hotels/autocomplete]', err.message);
    if (err.status === 429) {
      return res.status(429).json({ error: 'Hotel provider limit reached — try again later' });
    }
    res.status(500).json({ error: 'Failed to fetch city suggestions' });
  }
});

// ── Hotel list by city ─────────────────────────────────────────────────────
router.get('/list', async (req, res) => {
  try {
    const { cityCode } = req.query;
    if (!cityCode) return res.status(400).json({ error: 'cityCode required' });

    const data = await amadeusGet(
      `/v1/reference-data/locations/hotels/by-city?cityCode=${encodeURIComponent(cityCode)}&radius=30&radiusUnit=KM&hotelSource=ALL`
    );

    const hotels = (data.data || []).slice(0, 30).map((h) => ({
      hotelId: h.hotelId,
      name: h.name,
      cityCode: h.iataCode,
      latitude: h.geoCode?.latitude,
      longitude: h.geoCode?.longitude,
      countryCode: h.address?.countryCode || '',
    }));

    res.json({ hotels, total: hotels.length });
  } catch (err) {
    console.error('[hotels/list]', err.message);
    if (err.status === 429) {
      return res.status(429).json({ error: 'Hotel provider limit reached — try again later' });
    }
    res.status(500).json({ error: 'Failed to fetch hotel list' });
  }
});

// ── Hotel offers (pricing) ─────────────────────────────────────────────────
router.get('/offers', async (req, res) => {
  try {
    const { hotelIds, checkin, checkout, adults = 2, rooms = 1 } = req.query;
    if (!hotelIds || !checkin || !checkout) {
      return res.status(400).json({ error: 'hotelIds, checkin, checkout required' });
    }

    const ids = hotelIds.split(',').slice(0, 20).join(',');
    const nights = daysBetween(checkin, checkout);

    const data = await amadeusGet(
      `/v3/shopping/hotel-offers?hotelIds=${ids}&checkInDate=${checkin}&checkOutDate=${checkout}&adults=${adults}&roomQuantity=${rooms}&currency=USD&bestRateOnly=true`
    );

    const offers = (data.data || []).map((hotel) => {
      const offer = hotel.offers?.[0] || {};
      const price = offer.price || {};
      const room = offer.room || {};
      const policies = offer.policies || {};
      return {
        hotelId: hotel.hotel?.hotelId,
        name: hotel.hotel?.name || 'Unknown Hotel',
        cityCode: hotel.hotel?.cityCode,
        rating: hotel.hotel?.rating || null,
        offerId: offer.id,
        price: parseFloat(price.total) || 0,
        currency: price.currency || 'USD',
        pricePerNight: Math.round((parseFloat(price.total) || 0) / Math.max(1, nights)),
        roomType: room.typeEstimated?.category || room.description?.text || 'Standard',
        bedType: room.typeEstimated?.bedType || '',
        beds: room.typeEstimated?.beds || 1,
        cancellation: policies.cancellations?.[0]?.description?.text ||
          (policies.cancellations?.[0]?.type === 'FULL_STAY' ? 'Non-refundable' : 'Free cancellation'),
        checkin, checkout,
        provider: 'amadeus',
      };
    });

    res.json({ hotels: offers, total: offers.length, currency: 'USD' });
  } catch (err) {
    console.error('[hotels/offers]', err.message);
    if (err.status === 429) {
      return res.status(429).json({ error: 'Hotel provider limit reached — try again later' });
    }
    res.status(500).json({ error: 'Failed to fetch hotel offers' });
  }
});

// ── Combined search (list + offers) ────────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const { cityCode, checkin, checkout, adults = 2, rooms = 1 } = req.query;
    if (!cityCode || !checkin || !checkout) {
      return res.status(400).json({ error: 'cityCode, checkin, checkout required' });
    }

    // Step 1: Get hotels in city
    const listData = await amadeusGet(
      `/v1/reference-data/locations/hotels/by-city?cityCode=${encodeURIComponent(cityCode)}&radius=25&radiusUnit=KM&hotelSource=ALL`
    );
    const hotelList = (listData.data || []).slice(0, 15);
    if (hotelList.length === 0) {
      return res.json({ hotels: [], total: 0, currency: 'USD' });
    }

    // Step 2: Get offers for those hotels
    const ids = hotelList.map(h => h.hotelId).join(',');
    const nights = daysBetween(checkin, checkout);

    const offersData = await amadeusGet(
      `/v3/shopping/hotel-offers?hotelIds=${ids}&checkInDate=${checkin}&checkOutDate=${checkout}&adults=${adults}&roomQuantity=${rooms}&currency=USD&bestRateOnly=true`
    );

    const offers = (offersData.data || []).map((hotel) => {
      const offer = hotel.offers?.[0] || {};
      const price = offer.price || {};
      const room = offer.room || {};
      return {
        hotelId: hotel.hotel?.hotelId,
        name: hotel.hotel?.name || 'Unknown Hotel',
        rating: hotel.hotel?.rating || null,
        offerId: offer.id,
        price: parseFloat(price.total) || 0,
        currency: price.currency || 'USD',
        pricePerNight: Math.round((parseFloat(price.total) || 0) / Math.max(1, nights)),
        roomType: room.typeEstimated?.category || 'Standard',
        bedType: room.typeEstimated?.bedType || '',
        cancellation: offer.policies?.cancellations?.[0]?.type === 'FULL_STAY'
          ? 'Non-refundable' : 'Free cancellation',
        checkin, checkout,
        provider: 'amadeus',
      };
    });

    res.json({ hotels: offers, total: offers.length, currency: 'USD' });
  } catch (err) {
    console.error('[hotels/search]', err.message);
    if (err.status === 429) {
      return res.status(429).json({ error: 'Hotel provider limit reached — try again later' });
    }
    res.status(500).json({ error: 'Failed to search hotels' });
  }
});

// ── Helper ─────────────────────────────────────────────────────────────────
function daysBetween(d1, d2) {
  const a = new Date(d1);
  const b = new Date(d2);
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

export default router;
