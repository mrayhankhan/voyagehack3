/**
 * guest.service.js
 * RSVP validation, creation, and attendance aggregation.
 * Ready for backend swap: replace with API calls from api.service.js
 */

export const MEAL_OPTIONS = [
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'nonveg', label: 'Non-Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
];

export const ATTENDANCE_OPTIONS = [
    { value: 'yes', label: 'Joyfully Accepts' },
    { value: 'no', label: 'Regretfully Declines' },
];

/**
 * Validates an RSVP form state.
 * @param {{ name: string, willAttend: string }} rsvpState
 * @returns {boolean}
 */
export const validateRSVP = (rsvpState) => {
    return !!(rsvpState.name && rsvpState.willAttend);
};

/**
 * Creates a normalized RSVP record with metadata.
 * @param {object} rsvpState
 * @returns {object}
 */
export const createRSVP = (rsvpState) => ({
    ...rsvpState,
    timestamp: new Date().toISOString(),
    id: Date.now().toString(),
});

/**
 * Computes attendance stats for an event.
 * @param {object} event
 * @returns {{ total: number, confirmed: number, declined: number, pending: number }}
 */
export const getAttendanceStats = (event) => {
    const total = event.headcount || 150;
    const rsvps = event.rsvps || [];
    const confirmed = event.confirmedGuests || 0;
    const declined = rsvps.filter((r) => r.willAttend === 'no').length;
    const pending = total - rsvps.length;
    return { total, confirmed, declined, pending };
};

// ── Live Guest Feed System ─────────────────────────────────────────────────────
// Provides per-guest structured records with real-time simulation.
// Replace with WebSocket / polling from backend when live.

const DIETARY_TAGS = ['Vegetarian', 'Non-Veg', 'Vegan', 'Jain', 'Halal', 'Gluten-Free'];
const RSVP_STATUSES = ['CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'PENDING', 'DECLINED'];
const ROOM_STATUSES = ['ASSIGNED', 'ASSIGNED', 'PENDING', 'WAITLIST'];
const PAY_STATUSES = ['PAID', 'PAID', 'PENDING', 'OVERDUE'];

const FIRST_NAMES = [
    'Priya', 'Rohan', 'Ananya', 'Vikram', 'Neha', 'Arjun', 'Kavita', 'Siddharth', 'Ruchi', 'Devesh',
    'Meera', 'Aakash', 'Swati', 'Nikhil', 'Tanvi', 'Rahul', 'Pooja', 'Amit', 'Shreya', 'Varun',
    'Divya', 'Kiran', 'Sunita', 'Rajan', 'Aarti', 'Deepak', 'Ishaan', 'Nisha', 'Kunal', 'Anjali',
];
const LAST_NAMES = [
    'Sharma', 'Mehta', 'Singh', 'Kapoor', 'Gupta', 'Reddy', 'Nair', 'Bose', 'Shah', 'Patel',
    'Rao', 'Verma', 'Iyer', 'Joshi', 'Agarwal', 'Chaudhary', 'Mishra', 'Kumar', 'Jain', 'Pillai',
];

/**
 * Seeded PRNG to produce deterministic data per event.
 */
const seededRand = (seed) => {
    let s = seed;
    return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0x100000000; };
};

/**
 * Generates the full live guest feed for an event.
 * @param {import('./event.service').EventRecord} event
 * @returns {GuestRecord[]}
 */
export const getGuestFeed = (event) => {
    const rand = seededRand(event.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
    const pick = (arr) => arr[Math.floor(rand() * arr.length)];

    return Array.from({ length: Math.min(event.headcount, 30) }, (_, i) => {
        const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
        const lastName = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
        const rsvp = i < event.confirmedGuests * 30 / event.headcount ? 'CONFIRMED' : pick(RSVP_STATUSES);
        const dietary = pick(DIETARY_TAGS);
        const pnr = rsvp === 'CONFIRMED' ? `AI${String(300 + i).padStart(3, '0')}${String(Math.floor(rand() * 900) + 100)}` : null;
        return {
            id: `guest-${event.id}-${i}`,
            name: `${firstName} ${lastName}`,
            pax: Math.random() > 0.7 ? 2 : 1,   // companion flag
            rsvp,
            dietary,
            pnr,
            roomStatus: rsvp === 'CONFIRMED' ? pick(ROOM_STATUSES) : 'UNASSIGNED',
            payStatus: rsvp === 'CONFIRMED' ? pick(PAY_STATUSES) : 'PENDING',
            arrivedAt: rsvp === 'CONFIRMED' && i % 5 !== 0 ? `Nov ${15 + (i % 3)}, 2026 · ${8 + (i % 12)}:${i % 2 === 0 ? '00' : '30'} IST` : null,
            updatedAt: new Date(Date.now() - Math.floor(rand() * 3_600_000)).toISOString(),
        };
    });
};

/**
 * Filter guest list by RSVP, dietary tag, payment, room status, or search string.
 * @param {GuestRecord[]} guests
 * @param {{ rsvp: string, dietary: string, payment: string, room: string, search: string }} filters
 */
export const filterGuests = (guests, filters) => {
    const { rsvp, dietary, payment, room, search } = filters;
    return guests.filter((g) => {
        if (rsvp && rsvp !== 'ALL' && g.rsvp !== rsvp) return false;
        if (dietary && dietary !== 'ALL' && g.dietary !== dietary) return false;
        if (payment && payment !== 'ALL' && g.payStatus !== payment) return false;
        if (room && room !== 'ALL' && g.roomStatus !== room) return false;
        if (search && !`${g.name} ${g.pnr || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });
};

/**
 * Calculates F&B cover breakdown from current dietary tags.
 * @param {GuestRecord[]} guests
 * @returns {{ [dietary: string]: number }}
 */
export const computeFnBBreakdown = (guests) => {
    const confirmed = guests.filter((g) => g.rsvp === 'CONFIRMED');
    const counts = {};
    confirmed.forEach((g) => { counts[g.dietary] = (counts[g.dietary] || 0) + g.pax; });
    return counts;
};

/**
 * Simulates a real-time "arriving" update on a random confirmed guest.
 * Call on an interval to simulate live updates.
 * @param {GuestRecord[]} guests
 * @returns {GuestRecord[]} new immutable array with one guest updated
 */
export const simulateGuestUpdate = (guests) => {
    const confirmedIdxs = guests.map((g, i) => g.rsvp === 'CONFIRMED' ? i : -1).filter((i) => i >= 0);
    if (confirmedIdxs.length === 0) return guests;
    const idx = confirmedIdxs[Math.floor(Math.random() * confirmedIdxs.length)];
    const next = [...guests];
    const g = { ...next[idx] };
    // Toggle payment or room status on random refresh
    if (g.payStatus === 'PENDING') g.payStatus = 'PAID';
    if (g.roomStatus === 'PENDING') g.roomStatus = 'ASSIGNED';
    g.updatedAt = new Date().toISOString();
    g._flash = true;  // UI flash trigger
    next[idx] = g;
    return next;
};

// ── Microsite Public RSVP & Add-Ons ───────────────────────────────────────────

export const DIETARY_OPTIONS = [
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'nonveg', label: 'Non-Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'jain', label: 'Jain' },
    { value: 'halal', label: 'Halal' },
    { value: 'glutenfree', label: 'Gluten-Free' },
];

/**
 * Catalogue of add-ons guests can select on the microsite.
 * Replace with backend fetch when API is ready.
 */
export const ADDON_CATALOGUE = [
    { id: 'addon-01', name: 'Airport Pickup & Drop', price: 45, icon: '✈️', desc: 'Dedicated AC vehicle from the nearest airport' },
    { id: 'addon-02', name: 'Spa & Wellness Package', price: 120, icon: '💆', desc: 'Full-day couples or solo spa access at the resort' },
    { id: 'addon-03', name: 'Mehendi Artist Session', price: 80, icon: '🌸', desc: 'Private traditional Rajasthani mehendi session' },
    { id: 'addon-04', name: 'City Heritage Tour', price: 60, icon: '🏰', desc: 'Guided tour of Udaipur forts & palaces' },
    { id: 'addon-05', name: 'Photography Package', price: 200, icon: '📸', desc: 'Dedicated candid photographer for the full event' },
    { id: 'addon-06', name: 'Special Cake & Decor', price: 95, icon: '🎂', desc: 'Personalised celebration cake & room decoration' },
];

/**
 * Validates a full microsite RSVP form submission.
 */
export const validateMicrositeRSVP = (form) =>
    !!(form.name && form.email && form.phone && form.attending);

/**
 * Normalizes a microsite RSVP into a record ready for backend posting.
 */
export const createMicrositeRSVP = (form, eventId) => ({
    id: `rsvp-${Date.now()}`,
    eventId,
    name: form.name,
    email: form.email,
    phone: form.phone,
    attending: form.attending,
    pax: parseInt(form.pax, 10) || 1,
    dietary: form.dietary || 'vegetarian',
    addons: form.addons || [],
    totalAddOnValue: (form.addons || []).reduce((s, id) => {
        const a = ADDON_CATALOGUE.find(x => x.id === id);
        return s + (a ? a.price : 0);
    }, 0),
    submittedAt: new Date().toISOString(),
});
