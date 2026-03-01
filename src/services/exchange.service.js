/**
 * exchange.service.js
 * Commission and margin calculations for the Agent Exchange.
 * Ready for backend swap: replace with API calls for real pricing data.
 */

export const COMMISSION_RATE = 0.04;

/**
 * Calculates commission earned for a single event.
 * @param {object} event
 * @returns {number}
 */
export const calculateCommission = (event) => {
    const costPerHead = (event.budget || 0) / (event.headcount || 1);
    const confirmed = event.confirmedGuests || 0;
    return confirmed * costPerHead * COMMISSION_RATE;
};

/**
 * Calculates estimated commission shown on the microsite agent panel.
 * @param {object} event
 * @returns {number}
 */
export const calculateEstCommission = (event) => {
    const totalCapacity = event.headcount || 150;
    const confirmed = event.confirmedGuests || 0;
    return Math.round((confirmed * (event.budget / totalCapacity)) * COMMISSION_RATE);
};

/**
 * Calculates total commission across all events.
 * @param {object[]} events
 * @returns {number}
 */
export const calculateTotalCommission = (events) =>
    events.reduce((acc, ev) => acc + calculateCommission(ev), 0);

/**
 * Computes all four KPIs shown on the Agent Dashboard.
 * @param {object[]} events
 * @returns {{ activeWeddings, lockedInventory, pendingRSVPs, totalCommission }}
 */
export const calculateDashboardStats = (events) => {
    const activeWeddings = events.length;
    const lockedInventory = events.reduce(
        (acc, ev) => acc + ((ev.headcount || 150) - (ev.confirmedGuests || 0)),
        0
    );
    const pendingRSVPs = events.reduce(
        (acc, ev) => acc + ((ev.headcount || 150) - (ev.rsvps?.length || 0)),
        0
    );
    const totalCommission = calculateTotalCommission(events);
    return { activeWeddings, lockedInventory, pendingRSVPs, totalCommission };
};

/**
 * Computes the 5 top-row KPIs for the Event Command Center.
 * @param {import('./event.service').EventRecord[]} events
 * @returns {{ totalEvents, lockedInventoryValue, confirmedGuests, avgMarginPct, contractsAtRisk }}
 */
export const getCommandCenterMetrics = (events) => {
    const totalEvents = events.length;
    const confirmedGuests = events.reduce((acc, ev) => acc + (ev.confirmedGuests || 0), 0);
    const lockedInventoryValue = events.reduce(
        (acc, ev) => acc + Math.round((ev.confirmedGuests / ev.headcount) * ev.budget),
        0
    );
    const avgMarginPct =
        events.length > 0
            ? (events.reduce((acc, ev) => acc + (ev.marginPct || 0), 0) / events.length).toFixed(1)
            : '0.0';
    const contractsAtRisk = events.filter(
        (ev) => ev.contractStatus === 'RISK' || ev.contractStatus === 'BREACH'
    ).length;

    return { totalEvents, lockedInventoryValue, confirmedGuests, avgMarginPct, contractsAtRisk };
};

