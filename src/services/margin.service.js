/**
 * margin.service.js
 * Margin intelligence simulations for the Agent Margin Panel.
 * All functions are pure / deterministic given an EventRecord.
 * Ready for backend swap: replace return values with API calls when real
 * pricing data is available.
 */

import { COMMISSION_RATE } from './exchange.service';

// ── Constants ──────────────────────────────────────────────────────────────────

/** Target agent margin percentage (configurable per agency). */
export const TARGET_MARGIN_PCT = 8;

/** Minimum inventory fill % before early-release is triggered. */
export const EARLY_RELEASE_THRESHOLD_PCT = 60;

/** Days before cutoff that the release window opens. */
export const EARLY_RELEASE_WINDOW_DAYS = 21;

// ── Helper utilities ───────────────────────────────────────────────────────────

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Returns the cost-per-head assumed as (budget × 0.78) / headcount.
 * The 0.78 factor represents gross cost before agent margin.
 */
const costPerHead = (event) =>
    round2((event.budget * 0.78) / (event.headcount || 1));

/**
 * Returns the sell-price-per-head = budget / headcount.
 */
const sellPerHead = (event) =>
    round2(event.budget / (event.headcount || 1));

// ── 1. Cost vs Sell ────────────────────────────────────────────────────────────

/**
 * Computes cost-per-head vs sell-price-per-head gap and a mini sparkline.
 *
 * @param {import('./event.service').EventRecord} event
 * @returns {{
 *   cost: number,
 *   sell: number,
 *   gapPct: number,
 *   gapAbs: number,
 *   trend: number[],   // 6-point sparkline (cost %, upward simulated)
 *   status: 'HEALTHY'|'TIGHT'|'NEGATIVE'
 * }}
 */
export const getCostVsSell = (event) => {
    const cost = costPerHead(event);
    const sell = sellPerHead(event);
    const gapAbs = round2(sell - cost);
    const gapPct = round2((gapAbs / sell) * 100);

    // Simulated 6-week cost trend (% of sell) — stable near current gapPct
    const seed = event.budget % 97;
    const trend = Array.from({ length: 6 }, (_, i) => {
        const noise = ((seed * (i + 1) * 31) % 7) - 3; // –3 to +3
        return Math.max(0, Math.min(100, Math.round(gapPct + noise)));
    });

    const status =
        gapPct >= 6 ? 'HEALTHY'
            : gapPct >= 2 ? 'TIGHT'
                : 'NEGATIVE';

    return { cost, sell, gapPct, gapAbs, trend, status };
};

// ── 2. Utilization Velocity ───────────────────────────────────────────────────

/**
 * Estimates the RSVP fill rate per day and projects the final fill % by cutoff.
 *
 * @param {import('./event.service').EventRecord} event
 * @returns {{
 *   currentFillPct: number,
 *   rsvpsPerDay: number,       // current pace
 *   daysLeft: number,
 *   projectedFillPct: number,  // at current pace by cutoff
 *   velocityLabel: 'FAST'|'ON_TRACK'|'SLOW'|'CRITICAL',
 *   projectedShortfall: number // headcount slots likely unfilled
 * }}
 */
export const getUtilizationVelocity = (event) => {
    const currentFillPct = Math.round(
        ((event.confirmedGuests || 0) / (event.headcount || 1)) * 100
    );

    // Simulate days since created = (budget % 60) + 10 (10–70 days elapsed)
    const daysElapsed = (event.budget % 60) + 10;
    const rsvpsPerDay = round2((event.confirmedGuests || 0) / daysElapsed);

    // Days to cutoff: parse from cutoffDate string length variation
    // We simulate days left from headcount parity
    const daysLeft = Math.max(5, 90 - daysElapsed);

    const projectedGuests = Math.min(
        event.headcount,
        (event.confirmedGuests || 0) + rsvpsPerDay * daysLeft
    );
    const projectedFillPct = Math.round(
        (projectedGuests / (event.headcount || 1)) * 100
    );
    const projectedShortfall = Math.max(0, event.headcount - Math.round(projectedGuests));

    const velocityLabel =
        projectedFillPct >= 95 ? 'FAST'
            : projectedFillPct >= 75 ? 'ON_TRACK'
                : projectedFillPct >= 55 ? 'SLOW'
                    : 'CRITICAL';

    return {
        currentFillPct,
        rsvpsPerDay,
        daysLeft,
        projectedFillPct,
        velocityLabel,
        projectedShortfall,
    };
};

// ── 3. Suggested Price Increase ────────────────────────────────────────────────

/**
 * Calculates the price uplift (per head) needed to hit TARGET_MARGIN_PCT.
 *
 * @param {import('./event.service').EventRecord} event
 * @returns {{
 *   currentMarginPct: number,
 *   targetMarginPct: number,
 *   upliftPct: number,           // % increase on sell price
 *   upliftPerHead: number,       // absolute ₹ per head
 *   totalUpliftRevenue: number,  // for remaining unconfirmed guests
 *   newSellPerHead: number,
 *   breakEvenHeads: number,      // guests needed to break even at current price
 * }}
 */
export const getSuggestedPriceIncrease = (event) => {
    const currentMarginPct = event.marginPct || 0;
    const cost = costPerHead(event);
    const sell = sellPerHead(event);

    // Required sell to hit target margin: cost / (1 – targetMargin/100)
    const requiredSell = round2(cost / (1 - TARGET_MARGIN_PCT / 100));
    const upliftPerHead = round2(Math.max(0, requiredSell - sell));
    const upliftPct = round2((upliftPerHead / sell) * 100);
    const newSellPerHead = round2(sell + upliftPerHead);

    const remaining = Math.max(0, event.headcount - (event.confirmedGuests || 0));
    const totalUpliftRevenue = round2(upliftPerHead * remaining);

    const breakEvenHeads = Math.ceil(
        (event.budget * 0.78) / sell
    );

    return {
        currentMarginPct,
        targetMarginPct: TARGET_MARGIN_PCT,
        upliftPct,
        upliftPerHead,
        totalUpliftRevenue,
        newSellPerHead,
        breakEvenHeads,
    };
};

// ── 4. Bundle Suggestions ─────────────────────────────────────────────────────

/**
 * Returns 3 curated add-on bundle suggestions with revenue + margin impact.
 *
 * @param {import('./event.service').EventRecord} event
 * @returns {Array<{
 *   name: string,
 *   description: string,
 *   upliftPerHead: number,
 *   marginDeltaPct: number,
 *   icon: string,
 *   tag: 'HIGH_VALUE'|'QUICK_WIN'|'PREMIUM'
 * }>}
 */
export const getBundleSuggestions = (event) => {
    const sell = sellPerHead(event);

    return [
        {
            name: 'Experiences Bundle',
            description: 'Spa access, couple portrait session + drone reel',
            upliftPerHead: round2(sell * 0.06),
            marginDeltaPct: round2(6 * (1 - COMMISSION_RATE)),
            icon: 'Sparkles',
            tag: 'HIGH_VALUE',
        },
        {
            name: 'Premium F&B Upgrade',
            description: 'Live grill station, premium beverages & dessert cart',
            upliftPerHead: round2(sell * 0.04),
            marginDeltaPct: round2(4 * (1 - COMMISSION_RATE)),
            icon: 'UtensilsCrossed',
            tag: 'QUICK_WIN',
        },
        {
            name: 'Signature Transport Pack',
            description: 'Vintage cars baraat + Rolls-Royce couple transfer',
            upliftPerHead: round2(sell * 0.08),
            marginDeltaPct: round2(8 * (1 - COMMISSION_RATE)),
            icon: 'Car',
            tag: 'PREMIUM',
        },
    ];
};

// ── 5. Early Release Warning ───────────────────────────────────────────────────

/**
 * Checks whether inventory is at risk of early release (hotel releases
 * unsold rooms back to open market EARLY_RELEASE_WINDOW_DAYS before cutoff).
 *
 * @param {import('./event.service').EventRecord} event
 * @returns {{
 *   triggered: boolean,
 *   fillPct: number,
 *   daysUntilWindow: number,
 *   slotsAtRisk: number,
 *   severity: 'NONE'|'WATCH'|'WARNING'|'CRITICAL',
 *   action: string
 * }}
 */
export const getEarlyReleaseWarning = (event) => {
    const fillPct = Math.round(
        ((event.confirmedGuests || 0) / (event.headcount || 1)) * 100
    );
    // Simulate days until window from budget entropy
    const daysUntilWindow = Math.max(0, (event.budget % 45) + 3);
    const slotsAtRisk = Math.max(0, event.headcount - (event.confirmedGuests || 0));

    const triggered = fillPct < EARLY_RELEASE_THRESHOLD_PCT;

    const severity =
        !triggered ? 'NONE'
            : daysUntilWindow <= 7 ? 'CRITICAL'
                : daysUntilWindow <= 14 ? 'WARNING'
                    : 'WATCH';

    const action =
        severity === 'CRITICAL'
            ? 'Immediate outreach required — negotiate extension with property'
            : severity === 'WARNING'
                ? 'Contact hotel inventory manager to defer release window'
                : severity === 'WATCH'
                    ? 'Monitor closely and accelerate guest outreach'
                    : 'Inventory fill is healthy — no action needed';

    return { triggered, fillPct, daysUntilWindow, slotsAtRisk, severity, action };
};

// ── 6. Flight / Hotel Margin ───────────────────────────────────────────────────

/**
 * Compute margin data for inventory blocks of a given type.
 * @param {Array} blocks — inventory blocks (from API or mock)
 * @param {'hotel'|'flight'} type
 */
const computeBlockTypeMargin = (blocks, type) => {
    const filtered = blocks.filter(b => b.type === type && b.status === 'ACTIVE');
    if (filtered.length === 0) {
        return {
            type,
            totalBlocks: 0,
            totalLocked: 0,
            totalAllocated: 0,
            totalCost: 0,
            totalRevenue: 0,
            marginAbs: 0,
            marginPct: 0,
            avgCostPerUnit: 0,
            avgSellPerUnit: 0,
        };
    }
    const totalLocked = filtered.reduce((s, b) => s + b.lockedUnits, 0);
    const totalAllocated = filtered.reduce((s, b) => s + b.allocatedUnits, 0);
    const totalCost = filtered.reduce((s, b) => s + b.costPerUnit * b.lockedUnits, 0);
    const totalRevenue = filtered.reduce((s, b) => s + b.sellPerUnit * b.allocatedUnits, 0);
    const potentialRevenue = filtered.reduce((s, b) => s + b.sellPerUnit * b.lockedUnits, 0);
    const marginAbs = potentialRevenue - totalCost;
    const marginPct = totalCost > 0 ? round2((marginAbs / potentialRevenue) * 100) : 0;
    return {
        type,
        totalBlocks: filtered.length,
        totalLocked,
        totalAllocated,
        totalCost: round2(totalCost),
        totalRevenue: round2(totalRevenue),
        potentialRevenue: round2(potentialRevenue),
        marginAbs: round2(marginAbs),
        marginPct,
        avgCostPerUnit: round2(totalCost / Math.max(1, totalLocked)),
        avgSellPerUnit: round2(potentialRevenue / Math.max(1, totalLocked)),
    };
};

export const getFlightMarginData = (blocks) => computeBlockTypeMargin(blocks, 'flight');
export const getHotelMarginData = (blocks) => computeBlockTypeMargin(blocks, 'hotel');

/**
 * Combined per-head travel margin across hotels + flights.
 */
export const getCombinedTravelMargin = (blocks, headcount) => {
    const flight = getFlightMarginData(blocks);
    const hotel = getHotelMarginData(blocks);
    const totalCost = flight.totalCost + hotel.totalCost;
    const totalPotentialRev = (flight.potentialRevenue || 0) + (hotel.potentialRevenue || 0);
    const marginAbs = totalPotentialRev - totalCost;
    const marginPct = totalPotentialRev > 0 ? round2((marginAbs / totalPotentialRev) * 100) : 0;
    const costPerHead = round2(totalCost / Math.max(1, headcount));
    const revenuePerHead = round2(totalPotentialRev / Math.max(1, headcount));
    const breakEvenFillPct = totalPotentialRev > 0 ? round2((totalCost / totalPotentialRev) * 100) : 0;
    return {
        flight, hotel,
        totalCost: round2(totalCost),
        totalPotentialRevenue: round2(totalPotentialRev),
        marginAbs: round2(marginAbs),
        marginPct,
        costPerHead,
        revenuePerHead,
        breakEvenFillPct,
    };
};

// ── Aggregator ────────────────────────────────────────────────────────────────

/**
 * Returns the full margin intelligence report for one event.
 * inventoryBlocks is optional — pass [] if not fetched yet.
 */
export const getMarginReport = (event, inventoryBlocks = []) => ({
    costVsSell: getCostVsSell(event),
    velocity: getUtilizationVelocity(event),
    priceIncrease: getSuggestedPriceIncrease(event),
    bundles: getBundleSuggestions(event),
    earlyRelease: getEarlyReleaseWarning(event),
    flightMargin: getFlightMarginData(inventoryBlocks),
    hotelMargin: getHotelMarginData(inventoryBlocks),
    combinedTravel: getCombinedTravelMargin(inventoryBlocks, event.headcount),
});
