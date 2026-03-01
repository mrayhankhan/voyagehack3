/**
 * Shared Amadeus OAuth2 token flow.
 * Used by both flights.js and hotels.js.
 * Token cached and auto-refreshed.
 */

const AMADEUS_AUTH = 'https://test.api.amadeus.com/v1/security/oauth2/token';
const AMADEUS_BASE = 'https://test.api.amadeus.com';

let tokenCache = { token: null, expiresAt: 0 };

export async function getAmadeusToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.AMADEUS_CLIENT_ID,
    client_secret: process.env.AMADEUS_CLIENT_SECRET,
  });
  const res = await fetch(AMADEUS_AUTH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Amadeus auth failed');
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  console.log('[amadeus] Token acquired, expires in', data.expires_in, 'seconds');
  return tokenCache.token;
}

export async function amadeusGet(path) {
  const token = await getAmadeusToken();
  const res = await fetch(`${AMADEUS_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
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
