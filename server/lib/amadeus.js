/**
 * Amadeus Provider Wrapper
 * Handles OAuth, GET/POST requests, and parsing for the proxy endpoints.
 */
import { getAmadeusToken, amadeusGet } from '../routes/amadeus-auth.js';

const AMADEUS_BASE = 'https://test.api.amadeus.com';

export async function amadeusPost(path, payload) {
  const token = await getAmadeusToken();
  const res = await fetch(`${AMADEUS_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  const data = await res.json();
  if (!res.ok) {
    const errMsg = data.errors?.[0]?.detail || data.error_description || 'Amadeus API error';
    const err = new Error(errMsg);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ── Flights ──────────────────────────────────────────────────────────────

export async function autocompleteLocations(query, subType = 'AIRPORT') {
  if (!query || query.length < 2) return [];
  const data = await amadeusGet(`/v1/reference-data/locations?subType=${subType}&keyword=${encodeURIComponent(query)}&page%5Blimit%5D=8`);
  return data.data || [];
}

export async function flightSearch(params) {
  const { origin, destination, departureDate, returnDate, adults = 1, travelClass = 'ECONOMY' } = params;
  let url = `/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${departureDate}&adults=${adults}&travelClass=${travelClass}&max=20&currencyCode=USD`;
  if (returnDate) url += `&returnDate=${returnDate}`;
  const data = await amadeusGet(url);
  return data.data || [];
}

export async function createFlightOrder(payload) {
  // Sandbox payload for flight-orders
  return await amadeusPost('/v1/booking/flight-orders', { data: payload });
}

// ── Hotels ───────────────────────────────────────────────────────────────

export async function hotelList(cityCode) {
  const data = await amadeusGet(`/v1/reference-data/locations/hotels/by-city?cityCode=${encodeURIComponent(cityCode)}&radius=30&radiusUnit=KM&hotelSource=ALL`);
  return data.data || [];
}

export async function hotelOffers(hotelIds, checkin, checkout, adults = 2, rooms = 1) {
  if (!hotelIds) return [];
  const ids = hotelIds.split(',').slice(0, 20).join(',');
  const data = await amadeusGet(`/v3/shopping/hotel-offers?hotelIds=${ids}&checkInDate=${checkin}&checkOutDate=${checkout}&adults=${adults}&roomQuantity=${rooms}&currency=USD&bestRateOnly=true`);
  return data.data || [];
}

export async function createHotelBooking(payload) {
  // sandbox usually blocks real hotel bookings unless test identifiers are used
  // Wrapping here but likely falls back to PENDING_MANUAL_CONFIRM in route
  return await amadeusPost('/v1/booking/hotel-bookings', { data: payload });
}
