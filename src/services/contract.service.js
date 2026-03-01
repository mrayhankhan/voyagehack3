/**
 * contract.service.js
 * Min/max enforcement, budget logic, and contract summaries.
 * Ready for backend swap: enforce server-side contract rules via API.
 */

/**
 * Calculates cost per head from total budget and headcount.
 * @param {number} budget
 * @param {number} headcount
 * @returns {number}
 */
export const calculateCostPerHead = (budget, headcount) => {
    if (!headcount || headcount === 0) return 0;
    return Math.round(budget / headcount);
};

/**
 * Validates budget constraints and returns warnings.
 * @param {number} budget
 * @param {number} headcount
 * @returns {{ isValid: boolean, costPerHead: number, warnings: string[] }}
 */
export const validateBudgetConstraints = (budget, headcount) => {
    const costPerHead = calculateCostPerHead(budget, headcount);
    const warnings = [];
    if (costPerHead < 500) warnings.push('Budget may be too low for a destination wedding.');
    if (headcount < 10) warnings.push('Minimum recommended headcount is 10.');
    return { isValid: budget > 0 && headcount > 0, costPerHead, warnings };
};

/**
 * Returns a structured contract summary for an event.
 * @param {object} event
 * @returns {object}
 */
export const getContractSummary = (event) => ({
    clientName: event.clientName,
    budget: event.budget,
    headcount: event.headcount,
    destination: event.destination,
    costPerHead: calculateCostPerHead(event.budget, event.headcount),
    status: event.status,
});

// ── Programmable Digital Contract (PDC) ────────────────────────────────────────
// All logic runs client-side (simulated). Swap with server-side contract engine.

/**
 * Full Programmable Digital Contract data model.
 * @param {import('./event.service').EventRecord} event
 */
export const getDigitalContractData = (event) => {
    const minUnits = Math.floor(event.headcount * 0.70);
    const maxUnits = Math.ceil(event.headcount * 1.15);
    const ratePerUnit = Math.round(event.budget / event.headcount);
    const penaltyPct = 30;

    return {
        meta: {
            contractId: `TBO-PDC-${event.id.toUpperCase()}`,
            version: '2.1.0',
            effectiveDate: 'Apr 15, 2026',
            signedDate: 'Apr 15, 2026',
            jurisdiction: 'India — FHRAI Terms',
        },
        commercialTerms: {
            ratePerUnit,               // $/pax
            minUnits,                  // minimum pax commitment
            maxUnits,                  // maximum allowed pax
            cutoffDate: event.cutoffDate,
            penaltyPct,                // % of total value if breached
            totalCommitmentValue: minUnits * ratePerUnit,
            maxValue: maxUnits * ratePerUnit,
        },
        inclusions: {
            breakfast: { included: true, label: 'Full Breakfast Buffet', pax: event.headcount, value: '$28/pax/day' },
            transfers: { included: true, label: 'Airport ↔ Hotel (Both Ways)', pax: event.headcount, value: '$35/pax' },
            addOns: [
                { name: 'Welcome Dinner (Night 1)', included: true, rate: '$45/pax', notes: 'Poolside Terrace, Day 1 evening' },
                { name: 'Sangeet Sound & Lighting', included: true, rate: 'Flat $8,500', notes: 'SoundWave AV, Grand Ballroom' },
                { name: 'Ceremony Decor + Florals', included: true, rate: 'Flat $18,500', notes: 'Shaadi Decor Co., Palace Lawns' },
                { name: 'Baraat — Horse & Elephant', included: true, rate: 'Flat $3,200', notes: 'Licensed handler, Ghat route' },
                { name: 'Fireworks Finale Package', included: false, rate: '$5,000', notes: 'Optional add-on — pending approval' },
                { name: 'Spa Day Package (Guest)', included: false, rate: '$120/pax', notes: 'Available at Leela Spa on request' },
            ],
        },
        automationRules: [
            {
                id: 'PDC-RULE-001',
                name: 'Minimum Pax Alert',
                priority: 'HIGH',
                status: 'ACTIVE',
                trigger: `Confirmed guest count falls below ${minUnits} pax`,
                action: 'Notify agent + hotel partner · Auto-calculate penalty exposure · Lock amendment window',
            },
            {
                id: 'PDC-RULE-002',
                name: 'Over-Allocation Guard',
                priority: 'HIGH',
                status: 'ACTIVE',
                trigger: `Booking attempt exceeds ${maxUnits} pax`,
                action: 'Block additional RSVPs · Prompt agent for manual override · Log attempt',
            },
            {
                id: 'PDC-RULE-003',
                name: 'Auto Release After Cutoff',
                priority: 'MEDIUM',
                status: 'SCHEDULED',
                trigger: `After ${event.cutoffDate} 00:00 IST`,
                action: 'Release unconfirmed blocks to hotel open inventory · Freeze contract terms',
            },
            {
                id: 'PDC-RULE-004',
                name: 'Payment Milestone Reminder',
                priority: 'MEDIUM',
                status: 'ACTIVE',
                trigger: '7 days before each payment due date',
                action: 'Auto-email agent + client · Escalate at 3 days · Suspend portal at overdue',
            },
            {
                id: 'PDC-RULE-005',
                name: 'Penalty Auto-Calculate',
                priority: 'HIGH',
                status: 'ACTIVE',
                trigger: `Contract breached OR cancellation triggered`,
                action: `Calculate ${penaltyPct}% of $${Math.round(minUnits * ratePerUnit).toLocaleString()} = $${Math.round(minUnits * ratePerUnit * penaltyPct / 100).toLocaleString()} · Raise invoice`,
            },
        ],
    };
};

/**
 * Compute live health metrics from event + PDC data.
 * @param {object} event
 * @param {ReturnType<typeof getDigitalContractData>} pdc
 */
export const computeContractHealth = (event, pdc) => {
    const { minUnits, maxUnits, cutoffDate } = pdc.commercialTerms;
    const filled = event.confirmedGuests;
    const fillPct = Math.round((filled / minUnits) * 100);
    const remainingToMin = Math.max(0, minUnits - filled);
    const overByPax = Math.max(0, filled - maxUnits);
    const isOverAllocated = filled > maxUnits;
    const isBelowMin = filled < minUnits;

    // Countdown: diff from now (Mar 1 2026) to cutoff
    const cutoffMs = new Date(cutoffDate).getTime();
    const nowMs = Date.now();
    const diffMs = Math.max(0, cutoffMs - nowMs);
    const daysLeft = Math.floor(diffMs / 86_400_000);
    const hoursLeft = Math.floor((diffMs % 86_400_000) / 3_600_000);
    const minsLeft = Math.floor((diffMs % 3_600_000) / 60_000);

    return {
        fillPct: Math.min(100, fillPct),
        remainingToMin,
        isOverAllocated,
        overByPax,
        isBelowMin,
        daysLeft,
        hoursLeft,
        minsLeft,
        contractStatus: event.contractStatus,
    };
};

