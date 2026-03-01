/**
 * detail.service.js
 * Mock data generators for all 9 Event Detail tabs.
 * Replace with eventApi.getDetail(id) calls when backend is ready.
 */

import { MOCK_EVENTS } from './event.service';

/** Find a mock event by ID, fallback to first event */
export const getMockEventById = (id) =>
    MOCK_EVENTS.find((e) => e.id === id) || MOCK_EVENTS[0];

// ── 1. OVERVIEW ───────────────────────────────────────────────────────────────
export const getOverviewData = (event) => ({
    milestones: [
        { label: 'Contract Signed', date: 'Apr 15, 2026', status: 'DONE' },
        { label: 'Deposit Paid', date: 'Apr 22, 2026', status: 'DONE' },
        { label: 'Inventory Locked', date: 'Jun 10, 2026', status: 'DONE' },
        { label: 'Guest Portal Live', date: 'Jul 1, 2026', status: 'DONE' },
        { label: 'RSVP Cutoff', date: event.cutoffDate, status: 'PENDING' },
        { label: 'Final Payment', date: 'Nov 1, 2026', status: 'PENDING' },
        { label: 'Event Execution', date: event.dates, status: 'UPCOMING' },
    ],
    summary: {
        agent: 'Demo Agent',
        agentEmail: 'agent@tbo.com',
        hotelPartner: 'The Leela Palace',
        contractValue: `$${(event.budget).toLocaleString()}`,
        inventoryLocked: `${Math.ceil(event.headcount / 2)} rooms`,
        guestPortal: `tbo.com/microsite/${event.id}`,
    },
});

// ── 2. CONTRACT ────────────────────────────────────────────────────────────────
export const getContractData = (event) => ({
    signedDate: 'Apr 15, 2026',
    cutoffDate: event.cutoffDate,
    minPax: Math.floor(event.headcount * 0.7),
    maxPax: Math.ceil(event.headcount * 1.15),
    status: event.contractStatus,
    terms: [
        { item: 'Deluxe Rooms (3 nights)', qty: Math.floor(event.headcount * 0.55), unit: '$280/night', total: Math.floor(event.headcount * 0.55) * 280 * 3 },
        { item: 'Suite Rooms (3 nights)', qty: Math.ceil(event.headcount * 0.12), unit: '$480/night', total: Math.ceil(event.headcount * 0.12) * 480 * 3 },
        { item: 'Catering – Full Board', qty: event.headcount, unit: '$85/pax/day × 3', total: event.headcount * 255 },
        { item: 'AV & Sound Package', qty: 1, unit: 'Flat rate', total: 12000 },
        { item: 'Decor & Florals Bundle', qty: 1, unit: 'Flat rate', total: 18500 },
        { item: 'Airport Transfers', qty: event.headcount, unit: '$35/pax', total: event.headcount * 35 },
    ],
    penalties: [
        { trigger: 'Cancellation > 60 days before event', penalty: '25% of total contract value' },
        { trigger: 'Cancellation 30–60 days before', penalty: '50% of total contract value' },
        { trigger: 'Cancellation < 30 days before', penalty: '100% of total contract value' },
        { trigger: `Min pax breach (< ${Math.floor(event.headcount * 0.7)} guests)`, penalty: '$150/room/night on shortfall' },
    ],
});

// ── 3. INVENTORY ───────────────────────────────────────────────────────────────
export const getInventoryData = (event) => {
    const totalRooms = Math.ceil(event.headcount / 2);
    return {
        roomBlocks: [
            { type: 'Deluxe Room', blocked: Math.floor(totalRooms * 0.55), confirmed: Math.floor(totalRooms * 0.5), available: Math.floor(totalRooms * 0.05), ratePerNight: 280, status: 'LOCKED' },
            { type: 'Superior Suite', blocked: Math.floor(totalRooms * 0.25), confirmed: Math.floor(totalRooms * 0.22), available: Math.floor(totalRooms * 0.03), ratePerNight: 420, status: 'LOCKED' },
            { type: 'Presidential Suite', blocked: Math.floor(totalRooms * 0.10), confirmed: Math.floor(totalRooms * 0.08), available: Math.floor(totalRooms * 0.02), ratePerNight: 850, status: 'LOCKED' },
            { type: 'Garden Cottage', blocked: Math.floor(totalRooms * 0.10), confirmed: Math.floor(totalRooms * 0.05), available: Math.floor(totalRooms * 0.05), ratePerNight: 320, status: 'AT RISK' },
        ],
        venueBlocks: [
            { venue: 'Grand Ballroom', capacity: 500, reserved: event.headcount, events: 'Sangeet + Reception', status: 'CONFIRMED' },
            { venue: 'Palace Lawns', capacity: 800, reserved: event.headcount, events: 'Wedding Ceremony', status: 'CONFIRMED' },
            { venue: 'Poolside Terrace', capacity: 200, reserved: 80, events: 'Welcome Dinner', status: 'CONFIRMED' },
        ],
    };
};

// ── 4. GUESTS ──────────────────────────────────────────────────────────────────
export const getGuestData = (event) => ({
    stats: {
        invited: event.headcount,
        confirmed: event.confirmedGuests,
        declined: Math.floor(event.headcount * 0.05),
        pending: event.headcount - event.confirmedGuests - Math.floor(event.headcount * 0.05),
    },
    guests: [
        { name: 'Priya Sharma', rsvp: 'CONFIRMED', meal: 'Vegetarian', room: 'Deluxe', payment: 'PAID' },
        { name: 'Rohan Mehta', rsvp: 'CONFIRMED', meal: 'Non-Veg', room: 'Suite', payment: 'PAID' },
        { name: 'Ananya Singh', rsvp: 'CONFIRMED', meal: 'Vegan', room: 'Deluxe', payment: 'PENDING' },
        { name: 'Vikram Kapoor', rsvp: 'CONFIRMED', meal: 'Non-Veg', room: 'Deluxe', payment: 'PAID' },
        { name: 'Neha Gupta', rsvp: 'DECLINED', meal: '—', room: '—', payment: '—' },
        { name: 'Arjun Reddy', rsvp: 'PENDING', meal: '—', room: '—', payment: 'PENDING' },
        { name: 'Kavita Nair', rsvp: 'CONFIRMED', meal: 'Vegetarian', room: 'Cottage', payment: 'OVERDUE' },
        { name: 'Siddharth Bose', rsvp: 'PENDING', meal: '—', room: '—', payment: 'PENDING' },
    ],
});

// ── 5. ALLOCATION ──────────────────────────────────────────────────────────────
export const getAllocationData = () => ({
    assignments: [
        { guest: 'Rohan Mehta', roomType: 'Superior Suite', roomNo: '301', checkIn: 'Nov 15', checkOut: 'Nov 18', status: 'ASSIGNED' },
        { guest: 'Priya Sharma', roomType: 'Deluxe Room', roomNo: '214', checkIn: 'Nov 15', checkOut: 'Nov 18', status: 'ASSIGNED' },
        { guest: 'Vikram Kapoor', roomType: 'Deluxe Room', roomNo: '216', checkIn: 'Nov 15', checkOut: 'Nov 18', status: 'ASSIGNED' },
        { guest: 'Ananya Singh', roomType: 'Deluxe Room', roomNo: '220', checkIn: 'Nov 16', checkOut: 'Nov 18', status: 'ASSIGNED' },
        { guest: 'Kavita Nair', roomType: 'Garden Cottage', roomNo: 'C-04', checkIn: 'Nov 15', checkOut: 'Nov 17', status: 'ASSIGNED' },
        { guest: 'Arjun Reddy', roomType: 'Deluxe Room', roomNo: 'TBD', checkIn: 'Nov 15', checkOut: 'Nov 18', status: 'PENDING' },
        { guest: 'Siddharth Bose', roomType: 'TBD', roomNo: 'TBD', checkIn: '—', checkOut: '—', status: 'WAITLIST' },
    ],
});

// ── 6. TRANSPORT ────────────────────────────────────────────────────────────────
export const getTransportData = (initialInventory) => {
    const transportCat = initialInventory?.find(c => c.key === 'transport');
    const items = transportCat ? transportCat.items : [];

    const flights = [];
    const groundTransport = [];

    // Static schedules to merge with dynamic inventory quantities
    const flightSchedules = {
        'AI 443 — BOM→UDR': { datetime: 'Nov 15 · 08:15' },
        '6E 892 — DEL→UDR': { datetime: 'Nov 15 · 11:30' },
        'AI 448 — UDR→BOM': { datetime: 'Nov 18 · 16:40' },
        '6E 897 — UDR→DEL': { datetime: 'Nov 18 · 19:00' },
    };

    items.forEach(item => {
        if (item.name.includes('AI') || item.name.includes('6E')) {
            const parts = item.name.split(' — ');
            flights.push({
                flightNo: parts[0] || item.name,
                route: parts[1] || 'TBD',
                datetime: flightSchedules[item.name]?.datetime || 'TBD',
                seats: item.total,
                confirmed: item.used,
                status: item.locked ? 'CONFIRMED' : 'PENDING'
            });
        } else {
            // Treat as Ground Transport
            groundTransport.push({
                vehicle: item.name,
                qty: item.total,
                route: item.name.includes('Coach') ? 'Airport ↔ Hotel' : 'Hotel ↔ Venues',
                datetime: 'Rolling Schedule',
                status: item.locked ? 'CONFIRMED' : 'ARRANGED'
            });
        }
    });

    // Fallback if inventory is somehow missing
    if (flights.length === 0 && groundTransport.length === 0) {
        return {
            flights: [
                { flightNo: 'AI 443', route: 'BOM → UDR', datetime: 'Nov 15 · 08:15', seats: 45, confirmed: 40, status: 'CONFIRMED' },
                { flightNo: '6E 892', route: 'DEL → UDR', datetime: 'Nov 15 · 11:30', seats: 60, confirmed: 55, status: 'CONFIRMED' },
            ],
            groundTransport: [
                { vehicle: 'Luxury Coach (52-seater)', qty: 3, route: 'Airport → Leela Palace', datetime: 'Nov 15 · Arrival rolling', status: 'ARRANGED' }
            ]
        };
    }

    // Add Baraat and Sedan mock defaults that don't scale by headcount to fill out the UI natively
    if(!groundTransport.find(g => g.vehicle.includes('Sedan'))) {
        groundTransport.push(
            { vehicle: 'VIP Sedan', qty: 8, route: 'Hotel → Ceremony Venue', datetime: 'Nov 16 · 08:00', status: 'ARRANGED' },
            { vehicle: 'Baraat Elephant + Horses', qty: 2, route: 'Ghat Entry Procession', datetime: 'Nov 16 · 09:00', status: 'CONFIRMED' }
        );
    }

    return { flights, groundTransport };
};

// ── 7. VENDORS ──────────────────────────────────────────────────────────────────
export const getVendorData = () => ({
    vendors: [
        { name: 'Shaadi Decor Co.', category: 'Decor & Florals', contact: 'Rahul Jain', amount: 18500, status: 'CONTRACTED', paymentStatus: 'ADVANCE PAID' },
        { name: 'Royal Caterers Pvt. Ltd.', category: 'Catering', contact: 'Suma Iyer', amount: 42000, status: 'CONTRACTED', paymentStatus: 'PARTIALLY PAID' },
        { name: 'Lenz & Light Studios', category: 'Photography & Film', contact: 'Aditya Kumar', amount: 12000, status: 'CONTRACTED', paymentStatus: 'ADVANCE PAID' },
        { name: 'SoundWave AV Systems', category: 'AV & Entertainment', contact: 'Farhan Sheikh', amount: 8500, status: 'CONTRACTED', paymentStatus: 'PENDING' },
        { name: 'Pyrotechnica India', category: 'Fireworks', contact: 'Raj Malhotra', amount: 5000, status: 'NEGOTIATING', paymentStatus: 'NOT PAID' },
        { name: 'WhatsApp RSVP Bot', category: 'Tech Integration', contact: 'TBO Platform', amount: 1200, status: 'ACTIVE', paymentStatus: 'PAID' },
    ],
});

// ── 8. PAYMENTS ─────────────────────────────────────────────────────────────────
export const getPaymentData = (event) => {
    const total = event.budget;
    return {
        schedule: [
            { description: 'Contract Signing Deposit (25%)', amount: total * 0.25, dueDate: 'Apr 15, 2026', paidDate: 'Apr 15, 2026', status: 'PAID' },
            { description: 'Inventory Lock Payment (25%)', amount: total * 0.25, dueDate: 'Jun 10, 2026', paidDate: 'Jun 9, 2026', status: 'PAID' },
            { description: 'Guest Milestone Payment (25%)', amount: total * 0.25, dueDate: 'Sep 1, 2026', paidDate: '—', status: 'PENDING' },
            { description: 'Final Balance (25%)', amount: total * 0.25, dueDate: 'Nov 1, 2026', paidDate: '—', status: 'PENDING' },
            { description: 'Agent Commission (4%)', amount: total * 0.04, dueDate: 'Nov 18, 2026', paidDate: '—', status: 'UPCOMING' },
        ],
        totalValue: total,
        totalPaid: total * 0.5,
        outstanding: total * 0.5,
    };
};

// ── 9. EXECUTION ────────────────────────────────────────────────────────────────
export const getExecutionData = (event) => ({
    days: [
        {
            day: 'Day 1', label: 'Nov 15 — Arrival + Welcome',
            tasks: [
                { time: '08:00–14:00', task: 'Guest Arrivals & Airport Transfers', owner: 'Ground Ops', status: 'PLANNED' },
                { time: '14:00–17:00', task: 'Hotel Check-In & Room Allocation', owner: 'Front Desk', status: 'PLANNED' },
                { time: '18:00', task: 'Decor Setup – Poolside Terrace', owner: 'Shaadi Decor', status: 'PLANNED' },
                { time: '19:30', task: 'Welcome Dinner – Poolside Terrace', owner: 'Royal Caterers', status: 'PLANNED' },
                { time: '22:00', task: 'Night ends / Concierge on standby', owner: 'Hotel Ops', status: 'PLANNED' },
            ],
        },
        {
            day: 'Day 2', label: 'Nov 16 — Baraat + Ceremony',
            tasks: [
                { time: '07:00', task: 'Ceremony Venue Setup & AV Check', owner: 'SoundWave AV', status: 'PLANNED' },
                { time: '08:30', task: 'Baraat Procession — Ghat Entry', owner: 'Ground Ops', status: 'PLANNED' },
                { time: '10:00–13:00', task: 'Wedding Ceremony – Palace Lawns', owner: 'Hotel Ops', status: 'PLANNED' },
                { time: '14:00', task: 'Lunch & Cocktail Hour', owner: 'Royal Caterers', status: 'PLANNED' },
                { time: '20:00', task: 'Sangeet + DJ Night – Grand Ballroom', owner: 'SoundWave AV', status: 'PLANNED' },
                { time: '23:30', task: 'Fireworks Finale', owner: 'Pyrotechnica', status: 'PLANNED' },
            ],
        },
        {
            day: 'Day 3', label: 'Nov 17 — Reception Gala',
            tasks: [
                { time: '12:00', task: 'Brunch & Spa Day', owner: 'Hotel Ops', status: 'PLANNED' },
                { time: '18:00', task: 'Ballroom Setup – Reception Decor', owner: 'Shaadi Decor', status: 'PLANNED' },
                { time: '20:00', task: 'Black-Tie Reception Gala – Grand Ballroom', owner: 'All Vendors', status: 'PLANNED' },
                { time: '00:00', task: 'Post-Event Breakdown & Vendor Sign-Off', owner: 'TBO Agent', status: 'PLANNED' },
            ],
        },
        {
            day: 'Day 4', label: 'Nov 18 — Departures',
            tasks: [
                { time: '08:00–12:00', task: 'Guest Check-Outs & Luggage Co-ordination', owner: 'Front Desk', status: 'PLANNED' },
                { time: '10:00–19:00', task: 'Airport Transfer Runs', owner: 'Ground Ops', status: 'PLANNED' },
                { time: '18:00', task: 'Final Venue Inspection & TBO Handover', owner: 'TBO Agent', status: 'PLANNED' },
            ],
        },
    ],
});
