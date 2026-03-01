import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeftRight, Package, TrendingUp, Users, Clock,
    MapPin, CheckCircle2, AlertCircle, Loader2, ChevronRight,
    Sparkles, RefreshCw
} from 'lucide-react';

// Services
import { MOCK_EVENTS } from '../services/event.service';
import { calculateCommission, COMMISSION_RATE } from '../services/exchange.service';

// Components
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/layout/Sidebar';

// ── Exchange-specific helpers ──────────────────────────────────────────────────

/** Surplus = contracted headcount minus confirmed guests */
const getSurplus = (ev) => ev.headcount - ev.confirmedGuests;

/** Fill% used to derive surplus severity badge */
const getFillPct = (ev) => Math.round((ev.confirmedGuests / ev.headcount) * 100);

/**
 * Transfer status for each listing (mock — replace with API state).
 * Seeded from event id for stable demo values.
 */
const seedStatus = (id) => {
    const map = { 'evt-001': 'TRANSFERRED', 'evt-004': 'PENDING', 'evt-002': 'AVAILABLE' };
    return map[id] || 'AVAILABLE';
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
    const cfg = {
        AVAILABLE: {
            icon: CheckCircle2,
            label: 'Available',
            bg: 'bg-emerald-50',
            text: 'text-emerald-700',
            border: 'border-emerald-200',
            dot: 'bg-emerald-500',
        },
        PENDING: {
            icon: Loader2,
            label: 'Transfer Pending',
            bg: 'bg-amber-50',
            text: 'text-amber-700',
            border: 'border-amber-200',
            dot: 'bg-amber-400',
        },
        TRANSFERRED: {
            icon: AlertCircle,
            label: 'Transferred',
            bg: 'bg-gray-50',
            text: 'text-gray-500',
            border: 'border-gray-200',
            dot: 'bg-gray-400',
        },
    }[status] || {};

    const Icon = cfg.icon;
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

const CommissionSplit = ({ commission }) => {
    const agentShare = commission * 0.7;
    const platformShare = commission * 0.3;
    return (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-widest">
                <TrendingUp size={12} />
                Commission Split ({(COMMISSION_RATE * 100).toFixed(0)}% rate)
            </div>
            {/* Split bar */}
            <div className="flex h-2 rounded-full overflow-hidden gap-px">
                <div className="bg-indigo-600 rounded-l-full" style={{ width: '70%' }} />
                <div className="bg-indigo-200 rounded-r-full" style={{ width: '30%' }} />
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider">Your Share (70%)</div>
                    <div className="text-sm font-bold text-indigo-800">
                        ₹{agentShare.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Platform (30%)</div>
                    <div className="text-sm font-bold text-indigo-400">
                        ₹{platformShare.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SurplusFillBar = ({ pct }) => {
    const surplusColor = pct >= 80 ? 'bg-emerald-500' : pct >= 55 ? 'bg-amber-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${surplusColor}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-bold text-gray-500 w-8 text-right tabular-nums">{pct}%</span>
        </div>
    );
};

const RequestTransferButton = ({ status, onRequest }) => {
    if (status === 'TRANSFERRED') {
        return (
            <button
                disabled
                className="flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-400 cursor-not-allowed"
            >
                <ArrowLeftRight size={14} /> Already Transferred
            </button>
        );
    }
    if (status === 'PENDING') {
        return (
            <button
                disabled
                className="flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-50 text-amber-600 border border-amber-200 cursor-not-allowed"
            >
                <Loader2 size={14} className="animate-spin" /> Transfer Pending…
            </button>
        );
    }
    return (
        <button
            onClick={onRequest}
            className="flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl text-sm font-bold bg-tbo-indigo text-white hover:bg-[#2A1B4E] active:scale-95 transition-all shadow-sm"
        >
            <ArrowLeftRight size={14} /> Request Transfer
        </button>
    );
};

const ListingCard = ({ event, index, onRequestTransfer }) => {
    const surplus = getSurplus(event);
    const fillPct = getFillPct(event);
    const commission = calculateCommission(event);
    const [status, setStatus] = useState(seedStatus(event.id));

    const handleTransfer = () => {
        setStatus('PENDING');
        onRequestTransfer(event);
        // Simulate async confirmation after 2.5 s
        setTimeout(() => setStatus('TRANSFERRED'), 2500);
    };

    return (
        <div
            className="exchange-card bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-5 p-6"
            style={{ animationDelay: `${index * 70}ms` }}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="font-bold text-gray-900 text-base leading-tight">{event.clientName}</div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                        <MapPin size={11} /> {event.destination}
                    </div>
                </div>
                <StatusBadge status={status} />
            </div>

            {/* Inventory Fill */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500 capitalize">
                    <span>Inventory Fill</span>
                    <span className="text-gray-700">{event.confirmedGuests} / {event.headcount} pax</span>
                </div>
                <SurplusFillBar pct={fillPct} />
            </div>

            {/* Surplus Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center gap-1">
                    <Package size={14} className="text-indigo-500" />
                    <div className="font-bold text-gray-900 text-sm tabular-nums">{surplus}</div>
                    <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide text-center">Surplus Slots</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center gap-1">
                    <Users size={14} className="text-violet-500" />
                    <div className="font-bold text-gray-900 text-sm tabular-nums">{event.confirmedGuests}</div>
                    <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide text-center">Confirmed</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center gap-1">
                    <Clock size={14} className="text-amber-500" />
                    <div className="font-bold text-gray-900 text-[11px] text-center leading-tight tabular-nums">{event.cutoffDate}</div>
                    <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide text-center">Cutoff</div>
                </div>
            </div>

            {/* Commission Split */}
            <CommissionSplit commission={commission} />

            {/* CTA */}
            <RequestTransferButton status={status} onRequest={handleTransfer} />
        </div>
    );
};

// ── Summary KPI Bar ────────────────────────────────────────────────────────────

const KpiPill = ({ icon: Icon, label, value, accent }) => (
    <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${accent.bg} ${accent.border}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent.iconBg}`}>
            <Icon size={15} className={accent.iconColor} />
        </div>
        <div>
            <div className={`font-bold text-base tabular-nums ${accent.valueColor}`}>{value}</div>
            <div className="text-[11px] text-gray-400 font-medium">{label}</div>
        </div>
    </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────────

const Exchange = () => {
    const container = useRef(null);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [toastMsg, setToastMsg] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    useEffect(() => {
        if (!user) { navigate('/agent/login'); return; }
        const ctx = gsap.context(() => {
            gsap.from('.exchange-card', {
                y: 20, opacity: 0, stagger: 0.08, duration: 0.55, ease: 'power2.out',
            });
            gsap.from('.kpi-bar', {
                y: -10, opacity: 0, duration: 0.4, ease: 'power2.out',
            });
        }, container);
        return () => ctx.revert();
    }, [user, navigate]);

    if (!user) return null;

    // Derive surplus listings from events that have slack inventory
    const surplusEvents = MOCK_EVENTS.filter((ev) => getSurplus(ev) > 0);

    const filteredEvents =
        filterStatus === 'ALL'
            ? surplusEvents
            : surplusEvents.filter((ev) => seedStatus(ev.id) === filterStatus);

    // KPI aggregates
    const totalSurplus = surplusEvents.reduce((a, ev) => a + getSurplus(ev), 0);
    const totalCommissionPool = surplusEvents.reduce((a, ev) => a + calculateCommission(ev), 0);
    const availableCount = surplusEvents.filter((ev) => seedStatus(ev.id) === 'AVAILABLE').length;

    const handleRequestTransfer = (event) => {
        setToastMsg(`Transfer requested for ${event.clientName}`);
        setTimeout(() => setToastMsg(''), 3000);
    };

    const STATUS_FILTERS = ['ALL', 'AVAILABLE', 'PENDING', 'TRANSFERRED'];

    return (
        <div ref={container} className="min-h-screen flex bg-[#F8F9FB] font-sans">
            <Sidebar onNavigate={navigate} onLogout={() => { logout(); navigate('/'); }} />

            <main className="flex-1 ml-64 flex flex-col min-h-screen">

                {/* Page Header */}
                <div className="bg-white border-b border-gray-100 px-10 py-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                    <div>
                        <h1 className="font-bold text-xl text-gray-900 tracking-tight flex items-center gap-2">
                            <ArrowLeftRight size={20} className="text-indigo-500" />
                            Agent Exchange
                        </h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            Trade surplus inventory blocks and split commissions with partner agents.
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors px-4 py-2 rounded-xl hover:bg-gray-100"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>

                <div className="flex-1 p-8 flex flex-col gap-8 overflow-auto">

                    {/* KPI Bar */}
                    <div className="kpi-bar flex flex-wrap gap-3">
                        <KpiPill
                            icon={Package}
                            label="Total Surplus Slots"
                            value={totalSurplus.toLocaleString()}
                            accent={{ bg: 'bg-white', border: 'border-gray-100', iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', valueColor: 'text-gray-900' }}
                        />
                        <KpiPill
                            icon={CheckCircle2}
                            label="Available Listings"
                            value={availableCount}
                            accent={{ bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valueColor: 'text-emerald-700' }}
                        />
                        <KpiPill
                            icon={TrendingUp}
                            label="Commission Pool"
                            value={`₹${totalCommissionPool.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                            accent={{ bg: 'bg-violet-50', border: 'border-violet-100', iconBg: 'bg-violet-100', iconColor: 'text-violet-600', valueColor: 'text-violet-700' }}
                        />
                        <KpiPill
                            icon={Sparkles}
                            label="Commission Rate"
                            value={`${(COMMISSION_RATE * 100).toFixed(0)}%`}
                            accent={{ bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', valueColor: 'text-amber-700' }}
                        />
                    </div>

                    {/* Filter + Section Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-gray-900 text-base">Surplus Inventory Listings</h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {filteredEvents.length} listing{filteredEvents.length !== 1 ? 's' : ''} available
                            </p>
                        </div>
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                            {STATUS_FILTERS.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilterStatus(f)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filterStatus === f
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Listings Grid */}
                    {filteredEvents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                            {filteredEvents.map((ev, i) => (
                                <ListingCard
                                    key={ev.id}
                                    event={ev}
                                    index={i}
                                    onRequestTransfer={handleRequestTransfer}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                                <Package size={24} className="text-gray-400" />
                            </div>
                            <p className="text-sm font-bold text-gray-600">No listings match this filter</p>
                            <p className="text-xs text-gray-400 mt-1">Try selecting a different status above.</p>
                            <button
                                onClick={() => setFilterStatus('ALL')}
                                className="mt-4 flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
                            >
                                View all <ChevronRight size={12} />
                            </button>
                        </div>
                    )}

                </div>
            </main>

            {/* Toast Notification */}
            {toastMsg && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl animate-fadeIn">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    {toastMsg}
                </div>
            )}
        </div>
    );
};

export default Exchange;
