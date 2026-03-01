/**
 * api.service.js — TBO (Tektravels) API client via backend proxy.
 * In dev, Vite proxies /api → http://localhost:3001
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const request = async (method, path, body = null) => {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw err; // throw object to allow checking err.status (e.g. PENDING_MANUAL_CONFIRM)
  }
  return res.json();
};

export const apiClient = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
};

// ── Flight API (TBO Proxy) ────────────────────────────────────────────

export const flightApi = {
  autocomplete: (query) =>
    apiClient.post('/provider/flights/autocomplete', { query }),

  search: (params) =>
    apiClient.post('/provider/flights/search', params),

  reprice: ({ traceId, resultIndex }) =>
    apiClient.post('/provider/flights/reprice', { traceId, resultIndex }),

  book: (data) =>
    apiClient.post('/provider/flights/book', data),

  cancel: (data) =>
    apiClient.post('/provider/flights/cancel', data),
};

// ── Hotel API (Amadeus Proxy) ──────────────────────────────────────────────

export const hotelApi = {
  autocomplete: (query) =>
    apiClient.post('/provider/hotels/autocomplete', { query }),

  list: (cityCode) =>
    apiClient.post('/provider/hotels/list', { cityCode }),

  offers: (params) =>
    apiClient.post('/provider/hotels/offers', params),
};

// ── Inventory Block API ────────────────────────────────────────────────────

export const inventoryBlockApi = {
  lock: (data) => apiClient.post('/inventory/lock', data),
  getByEvent: (eventId, type = null) =>
    apiClient.get(`/inventory/${eventId}${type ? `?type=${type}` : ''}`),
  release: (blockId) => apiClient.put(`/inventory/${blockId}/release`),
};

// ── Booking API ────────────────────────────────────────────────────────────

export const bookingApi = {
  create: (data) => apiClient.post('/bookings', data),
  getByEvent: (eventId) => apiClient.get(`/bookings/${eventId}`),
  cancel: (bookingId) => apiClient.put(`/bookings/${bookingId}/cancel`),
};

// ── Guest & RSVP API ────────────────────────────────────────────────────────

export const guestApi = {
  upsert: (data) => apiClient.post('/guests', data),
  getByEvent: (eventId) => apiClient.get(`/guests/${eventId}`),
};
