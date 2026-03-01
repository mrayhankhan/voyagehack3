/**
 * inventory.service.js
 * Room block calculations, destination data, and inventory locking terminal logs.
 * Ready for backend swap: replace with TBO PreBook API calls via api.service.js
 */

export const DESTINATION_OPTIONS = [
    'Udaipur, Rajasthan',
    'Jaipur, Rajasthan',
    'Goa, India',
];

/**
 * Returns the number of room blocks needed for a given headcount.
 * @param {number} headcount
 * @returns {number}
 */
export const calculateRoomBlocksNeeded = (headcount) => Math.ceil(headcount / 2);

/**
 * Returns remaining unconfirmed inventory for an event.
 * @param {object} event
 * @returns {number}
 */
export const calculateRemainingInventory = (event) => {
    const totalCapacity = event.headcount || 150;
    const confirmed = event.confirmedGuests || 0;
    return totalCapacity - confirmed;
};

/**
 * Terminal log lines for destination AI search step.
 * @param {object} formData
 * @returns {string[]}
 */
export const getDestinationSearchLogs = (formData) => [
    'Analyzing budget parameters constraints...',
    'Fetching real-time global inventory locks...',
    `Matching capacity for ${formData.headcount} guests...`,
    `Curating destinations < $${Math.round(formData.budget / formData.headcount)}/hd...`,
    'Complete. Rendering shortlist.',
];

/**
 * Terminal log lines for the inventory lock step.
 * @param {object} formData
 * @returns {string[]}
 */
export const getInventoryLockLogs = (formData) => [
    `Checking ${formData.destination || 'Taj Lake Palace'} availability...`,
    `Locking ${calculateRoomBlocksNeeded(formData.headcount)} rooms...`,
    'Securing charter flights and transits...',
    'Reserving vendor slots (Decor, Catering, Setup)...',
    'Inventory locked successfully.',
];

// ── Event-Scoped Inventory System ─────────────────────────────────────────────
// Each event owns its own inventory blocks. No shared global pool.
// Replace with TBO PreBook + Lock API when backend is ready.

/**
 * Category icon keys (mapped to lucide icons in the UI component)
 * @typedef {'accommodation'|'transport'|'resources'|'fnb'|'vendor'|'addons'} CategoryKey
 */

/**
 * Returns the full 6-category event-scoped inventory for an event.
 * All totals are derived from event.headcount so they are event-specific.
 * @param {import('./event.service').EventRecord} event
 * @returns {InventoryCategory[]}
 */
export const getEventInventory = (event) => {
    const h = event.headcount;
    const rooms = Math.ceil(h / 2);

    return [
        {
            key: 'accommodation',
            label: 'Accommodation',
            icon: 'Building2',
            color: { bg: 'bg-indigo-50', border: 'border-indigo-100', accent: 'bg-indigo-600', text: 'text-indigo-700', light: 'text-indigo-400' },
            contractRef: `TBO-PDC-${event.id.toUpperCase()} § 2.1`,
            supplier: 'The Leela Palace, Udaipur',
            unit: 'rooms',
            total: rooms,
            used: Math.round(rooms * (event.confirmedGuests / h)),
            locked: true,
            items: [
                { name: 'Deluxe Rooms', total: Math.floor(rooms * 0.55), used: Math.round(rooms * 0.50), locked: true },
                { name: 'Superior Suites', total: Math.floor(rooms * 0.25), used: Math.round(rooms * 0.22), locked: true },
                { name: 'Presidential Suite', total: Math.floor(rooms * 0.10), used: Math.round(rooms * 0.08), locked: true },
                { name: 'Garden Cottages', total: Math.floor(rooms * 0.10), used: Math.round(rooms * 0.05), locked: false },
            ],
        },
        {
            key: 'transport',
            label: 'Transport',
            icon: 'Plane',
            color: { bg: 'bg-sky-50', border: 'border-sky-100', accent: 'bg-sky-500', text: 'text-sky-700', light: 'text-sky-400' },
            contractRef: `TBO-FLIGHT-${event.id.toUpperCase()}`,
            supplier: 'Air India + IndiGo Block Seats',
            unit: 'seats',
            total: Math.round(h * 1.1),
            used: Math.round(h * 0.87),
            locked: true,
            items: [
                { name: 'AI 443 — BOM→UDR', total: 45, used: 40, locked: true },
                { name: '6E 892 — DEL→UDR', total: 60, used: 55, locked: true },
                { name: 'AI 448 — UDR→BOM', total: 45, used: 38, locked: true },
                { name: '6E 897 — UDR→DEL', total: 60, used: 48, locked: false },
                { name: 'Ground Coaches', total: 3, used: 3, locked: true },
            ],
        },
        {
            key: 'resources',
            label: 'Event Resources',
            icon: 'Sparkles',
            color: { bg: 'bg-violet-50', border: 'border-violet-100', accent: 'bg-violet-500', text: 'text-violet-700', light: 'text-violet-400' },
            contractRef: `TBO-VENUE-${event.id.toUpperCase()}`,
            supplier: 'Hotel Events Dept + Shaadi Decor',
            unit: 'venue-days',
            total: 9,
            used: 9,
            locked: true,
            items: [
                { name: 'Grand Ballroom (3 days)', total: 3, used: 3, locked: true },
                { name: 'Palace Lawns (1 day)', total: 1, used: 1, locked: true },
                { name: 'Poolside Terrace (1 day)', total: 1, used: 1, locked: true },
                { name: 'AV Rig (3 days)', total: 3, used: 3, locked: true },
                { name: 'Baraat Route Permit', total: 1, used: 1, locked: true },
            ],
        },
        {
            key: 'fnb',
            label: 'F&B',
            icon: 'UtensilsCrossed',
            color: { bg: 'bg-orange-50', border: 'border-orange-100', accent: 'bg-orange-500', text: 'text-orange-700', light: 'text-orange-400' },
            contractRef: `TBO-CATERING-${event.id.toUpperCase()}`,
            supplier: 'Royal Caterers Pvt. Ltd.',
            unit: 'covers',
            total: h * 3,           // 3 meals/day × headcount
            used: event.confirmedGuests * 3,
            locked: true,
            items: [
                { name: 'Day 1 — Welcome Dinner', total: h, used: Math.round(h * 0.93), locked: true },
                { name: 'Day 2 — Ceremony Lunch', total: h, used: Math.round(h * 0.90), locked: true },
                { name: 'Day 2 — Sangeet Dinner', total: h, used: Math.round(h * 0.88), locked: true },
                { name: 'Day 3 — Brunch', total: h, used: Math.round(h * 0.85), locked: false },
                { name: 'Day 3 — Reception Gala', total: h, used: Math.round(h * 0.91), locked: true },
            ],
        },
        {
            key: 'vendor',
            label: 'Vendor Slots',
            icon: 'ShoppingBag',
            color: { bg: 'bg-emerald-50', border: 'border-emerald-100', accent: 'bg-emerald-500', text: 'text-emerald-700', light: 'text-emerald-400' },
            contractRef: `TBO-VENDOR-${event.id.toUpperCase()}`,
            supplier: 'TBO Vendor Network',
            unit: 'contracts',
            total: 6,
            used: 5,
            locked: false,
            items: [
                { name: 'Decor & Florals', total: 1, used: 1, locked: true },
                { name: 'Photography & Film', total: 1, used: 1, locked: true },
                { name: 'AV & Sound', total: 1, used: 1, locked: true },
                { name: 'Entertainment / DJ', total: 1, used: 1, locked: true },
                { name: 'Fireworks', total: 1, used: 1, locked: false },
                { name: 'Spa Partner', total: 1, used: 0, locked: false },
            ],
        },
        {
            key: 'addons',
            label: 'Add-Ons',
            icon: 'Plus',
            color: { bg: 'bg-rose-50', border: 'border-rose-100', accent: 'bg-rose-500', text: 'text-rose-700', light: 'text-rose-400' },
            contractRef: `TBO-ADDON-${event.id.toUpperCase()}`,
            supplier: 'Various',
            unit: 'units',
            total: 5,
            used: 3,
            locked: false,
            items: [
                { name: 'Welcome Gift Bags', total: h, used: Math.round(h * 0.90), locked: true },
                { name: 'Couple Portraits Session', total: 1, used: 1, locked: true },
                { name: 'Mehndi Artist (2 days)', total: 2, used: 2, locked: true },
                { name: 'Fireworks Finale', total: 1, used: 0, locked: false },
                { name: 'Drone Videography', total: 1, used: 0, locked: false },
            ],
        },
    ];
};

/**
 * Simulates decrementing a category's used count by 1.
 * In production: call TBO PreBook API then update database record.
 * @param {InventoryCategory[]} inventory
 * @param {CategoryKey} categoryKey
 * @param {number} itemIndex
 * @returns {InventoryCategory[]} new array (immutable)
 */
export const decrementInventoryItem = (inventory, categoryKey, itemIndex) =>
    inventory.map((cat) => {
        if (cat.key !== categoryKey) return cat;
        const newItems = cat.items.map((item, i) => {
            if (i !== itemIndex) return item;
            const newUsed = Math.max(0, item.used - 1);
            return { ...item, used: newUsed };
        });
        const newUsed = newItems.reduce((s, it) => s + it.used, 0);
        return { ...cat, items: newItems, used: newUsed };
    });

/**
 * Simulates locking an item (marks it as locked: true).
 * In production: calls TBO PreBook/Lock API.
 * @param {InventoryCategory[]} inventory
 * @param {CategoryKey} categoryKey
 * @param {number} itemIndex
 * @returns {InventoryCategory[]}
 */
export const lockInventoryItem = (inventory, categoryKey, itemIndex) =>
    inventory.map((cat) => {
        if (cat.key !== categoryKey) return cat;
        const newItems = cat.items.map((item, i) =>
            i === itemIndex ? { ...item, locked: true } : item
        );
        const allLocked = newItems.every((it) => it.locked);
        return { ...cat, items: newItems, locked: allLocked };
    });

/**
 * Returns summary statistics across all categories for a given inventory.
 * @param {InventoryCategory[]} inventory
 */
export const getInventorySummary = (inventory) => ({
    totalCategories: inventory.length,
    lockedCategories: inventory.filter((c) => c.locked).length,
    totalUnits: inventory.reduce((s, c) => s + c.total, 0),
    usedUnits: inventory.reduce((s, c) => s + c.used, 0),
    avgUsagePct: Math.round(
        inventory.reduce((s, c) => s + (c.used / c.total) * 100, 0) / inventory.length
    ),
});

// ── Allocation Engine ──────────────────────────────────────────────────────────
// Provides the per-unit room grid for the Allocation tab.
// Each unit is either FREE, OCCUPIED, or BLOCKED.
// Replace with backend room mapping API when ready.

const ROOM_TYPES = [
    { type: 'Deluxe Room', prefix: 'DLX', floors: [1, 2, 3], perFloor: 10, ratePerNight: 280, nights: 3 },
    { type: 'Superior Suite', prefix: 'SUI', floors: [4, 5], perFloor: 6, ratePerNight: 520, nights: 3 },
    { type: 'Presidential Suite', prefix: 'PRS', floors: [6], perFloor: 3, ratePerNight: 1200, nights: 3 },
    { type: 'Garden Cottage', prefix: 'GDN', floors: [0], perFloor: 8, ratePerNight: 380, nights: 3 },
];

/**
 * Generates the full room unit grid for an event.
 * Returns an array of unit objects with occupancy state.
 * @param {object} event
 * @returns {RoomUnit[]}
 */
export const getRoomUnitGrid = (event) => {
    const seed = event.id.split('').reduce((a, c) => a + c.charCodeAt(0), 42);
    let s = seed;
    const rnd = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0x100000000; };

    const units = [];
    ROOM_TYPES.forEach((rt) => {
        rt.floors.forEach((floor) => {
            for (let n = 1; n <= rt.perFloor; n++) {
                const roomNo = floor === 0
                    ? `${rt.prefix}-${String(n).padStart(2, '0')}`
                    : `${rt.prefix}-${floor}${String(n).padStart(2, '0')}`;
                const r = rnd();
                const status = r < 0.72 ? 'OCCUPIED' : r < 0.82 ? 'BLOCKED' : 'FREE';
                units.push({
                    id: roomNo,
                    roomNo,
                    type: rt.type,
                    prefix: rt.prefix,
                    floor: floor || 'G',
                    ratePerNight: rt.ratePerNight,
                    value: rt.ratePerNight * rt.nights,
                    status,
                    assignedTo: status === 'OCCUPIED' ? `Guest-${Math.floor(rnd() * 200)}` : null,
                });
            }
        });
    });
    return units;
};

/**
 * Returns aggregate counts for the allocation grid.
 * @param {RoomUnit[]} units
 */
export const getAllocationStats = (units) => ({
    total: units.length,
    free: units.filter(u => u.status === 'FREE').length,
    occupied: units.filter(u => u.status === 'OCCUPIED').length,
    blocked: units.filter(u => u.status === 'BLOCKED').length,
    revenue: units.filter(u => u.status === 'OCCUPIED').reduce((s, u) => s + u.value, 0),
});

/**
 * Assigns a guest to a room unit.
 * Returns the new unit grid (immutable) with the unit marked OCCUPIED.
 * @param {RoomUnit[]} units    current unit grid
 * @param {string}     roomId   unit.id to assign
 * @param {string}     guestId  guest identifier
 * @returns {{ units: RoomUnit[], assignedUnit: RoomUnit }}
 */
export const assignGuestToRoom = (units, roomId, guestId) => {
    let assignedUnit = null;
    const next = units.map((u) => {
        if (u.id !== roomId) return u;
        assignedUnit = { ...u, status: 'OCCUPIED', assignedTo: guestId };
        return assignedUnit;
    });
    return { units: next, assignedUnit };
};

/**
 * Releases a room (OCCUPIED → FREE).
 * @param {RoomUnit[]} units
 * @param {string}     roomId
 * @returns {RoomUnit[]}
 */
export const releaseRoom = (units, roomId) =>
    units.map((u) => u.id === roomId ? { ...u, status: 'FREE', assignedTo: null } : u);

/**
 * Computes a simulated contract health update after a new assignment.
 * Reflects the increased fill count against the minimum pax threshold.
 * @param {{ filledUnits: number, minUnits: number, maxUnits: number }} prev
 * @param {number} delta  +1 for assign, -1 for release
 * @returns {{ filledUnits, status, fillPct, overAllocated }}
 */
export const recomputeContractHealthAfterAssign = (prev, delta) => {
    const filledUnits = Math.max(0, prev.filledUnits + delta);
    const fillPct = Math.round((filledUnits / prev.minUnits) * 100);
    const status = filledUnits >= prev.maxUnits ? 'BREACH'
        : filledUnits < prev.minUnits ? 'RISK'
            : 'SAFE';
    return { filledUnits, status, fillPct, overAllocated: filledUnits > prev.maxUnits };
};
