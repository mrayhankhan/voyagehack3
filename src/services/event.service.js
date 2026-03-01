/**
 * event.service.js
 * Business logic for event creation, step validation, and workflow data.
 * Ready for backend swap: replace with API calls from api.service.js
 */

export const WORKFLOW_STEPS = [
  'Client Info',
  'Budget',
  'Headcount & Dates',
  'Events & Timings',
  'Destination Selection',
  'AI Itinerary',
  'Lock Inventory',
  'Launch Microsite',
];

/**
 * Validates whether the current wizard step has sufficient data to proceed.
 * @param {number} step
 * @param {object} formData
 * @returns {boolean}
 */
export const validateStep = (step, formData) => {
  switch (step) {
    case 0: return !!(formData.brideName && formData.groomName && formData.contact);
    case 1: return formData.budget > 0;
    case 2: return formData.headcount > 0 && !!formData.dates;
    case 3: return formData.timings.length > 0;
    case 4: return !!formData.destination;
    default: return true;
  }
};

/**
 * Creates a normalized event object from wizard form data.
 * @param {object} formData
 * @returns {object} event
 */
export const createEventFromForm = (formData) => ({
  id: Date.now().toString(),
  clientName: `${formData.brideName || 'Bride'} & ${formData.groomName || 'Groom'}`,
  budget: formData.budget,
  headcount: formData.headcount,
  destination: formData.destination || 'Udaipur',
  status: 'Deployed',
  dates: formData.dates,
  timings: formData.timings,
  confirmedGuests: 0,
  rsvps: [],
});

/** Default itinerary shown in AI Itinerary step */
export const DEFAULT_ITINERARY = [
  { d: 'Day 1', t: 'Welcome Dinner' },
  { d: 'Day 2', t: 'Haldi + Sangeet' },
  { d: 'Day 3', t: 'Wedding Ceremony' },
  { d: 'Day 4', t: 'Reception' },
];

/** Itinerary data shown on the guest Microsite */
export const MICROSITE_ITINERARY = [
  {
    title: 'Welcome Sangeet',
    time: 'Friday, 7:00 PM',
    desc: 'Join us for evening cocktails, dinner, and dancing under the stars to kick off the weekend.',
  },
  {
    title: 'The Baraat & Ceremony',
    time: 'Saturday, 9:00 AM',
    desc: 'The traditional groom processional followed by the wedding ceremonies.',
  },
  {
    title: 'Reception Gala',
    time: 'Saturday, 8:00 PM',
    desc: 'A black-tie celebration concluding the weekend festivities.',
  },
];

// ── Dashboard Structured Dummy Data ───────────────────────────────────────────
// Replace with eventApi.getAll() once backend is ready.

/**
 * @typedef {object} EventRecord
 * @property {string} id
 * @property {string} clientName
 * @property {string} destination
 * @property {string} dates
 * @property {number} budget          - total event budget in USD
 * @property {number} headcount       - contracted room/seat blocks
 * @property {number} confirmedGuests - filled blocks (RSVPs confirmed)
 * @property {'SAFE'|'RISK'|'BREACH'} contractStatus
 * @property {number} marginPct       - agent margin in %
 * @property {string} cutoffDate      - contract booking cutoff
 * @property {string} status          - lifecycle: Active | Closed | Draft
 */

/** @type {EventRecord[]} */
export const MOCK_EVENTS = [
  {
    id: 'evt-001',
    clientName: 'Agarwal × Mehta',
    destination: 'Udaipur, Rajasthan',
    dates: 'Nov 15–18, 2026',
    budget: 280000,
    headcount: 220,
    confirmedGuests: 198,
    contractStatus: 'SAFE',
    marginPct: 6.2,
    cutoffDate: 'Oct 30, 2026',
    status: 'Active',
    rsvps: [],
  },
  {
    id: 'evt-002',
    clientName: 'Singhania × Bose',
    destination: 'Jaipur, Rajasthan',
    dates: 'Dec 3–5, 2026',
    budget: 180000,
    headcount: 150,
    confirmedGuests: 87,
    contractStatus: 'RISK',
    marginPct: 4.8,
    cutoffDate: 'Nov 15, 2026',
    status: 'Active',
    rsvps: [],
  },
  {
    id: 'evt-003',
    clientName: 'Kapoor × Sharma',
    destination: 'Goa, India',
    dates: 'Jan 20–23, 2027',
    budget: 320000,
    headcount: 250,
    confirmedGuests: 241,
    contractStatus: 'SAFE',
    marginPct: 7.1,
    cutoffDate: 'Dec 15, 2026',
    status: 'Active',
    rsvps: [],
  },
  {
    id: 'evt-004',
    clientName: 'Reddy × Nair',
    destination: 'Kerala Backwaters',
    dates: 'Feb 8–11, 2027',
    budget: 420000,
    headcount: 300,
    confirmedGuests: 104,
    contractStatus: 'BREACH',
    marginPct: 3.2,
    cutoffDate: 'Jan 5, 2027',
    status: 'Active',
    rsvps: [],
  },
  {
    id: 'evt-005',
    clientName: 'Gupta × Malhotra',
    destination: 'Shimla, Himachal',
    dates: 'Mar 2–5, 2027',
    budget: 210000,
    headcount: 180,
    confirmedGuests: 137,
    contractStatus: 'RISK',
    marginPct: 5.4,
    cutoffDate: 'Feb 10, 2027',
    status: 'Active',
    rsvps: [],
  },
];

/**
 * Returns Tailwind badge classes for a contract status string.
 * @param {'SAFE'|'RISK'|'BREACH'} status
 */
export const getContractStatusStyle = (status) => {
  switch (status) {
    case 'SAFE': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    case 'RISK': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
    case 'BREACH': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' };
    default: return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' };
  }
};

/**
 * Returns events in RISK or BREACH state with a human-readable alert message.
 * @param {EventRecord[]} events
 * @returns {{ event: EventRecord, message: string, severity: 'high'|'medium' }[]}
 */
export const getRiskAlerts = (events) =>
  events
    .filter((ev) => ev.contractStatus === 'RISK' || ev.contractStatus === 'BREACH')
    .map((ev) => ({
      event: ev,
      severity: ev.contractStatus === 'BREACH' ? 'high' : 'medium',
      message:
        ev.contractStatus === 'BREACH'
          ? `Contract breach: only ${Math.round((ev.confirmedGuests / ev.headcount) * 100)}% inventory filled — minimum threshold violated.`
          : `Approaching cutoff on ${ev.cutoffDate}. ${ev.headcount - ev.confirmedGuests} blocks still unconfirmed.`,
    }));

/**
 * Computes inventory fill percentage for an event.
 * @param {EventRecord} event
 * @returns {number} 0–100
 */
export const getInventoryUsagePct = (event) =>
  Math.round((event.confirmedGuests / event.headcount) * 100);

