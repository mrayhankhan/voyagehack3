import React, { useEffect, useRef, useState, useMemo } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import {
    BarChart2, TrendingUp, TrendingDown, Zap, Package2,
    Car, UtensilsCrossed, Sparkles, AlertTriangle, CheckCircle2,
    ChevronDown, ArrowUpRight, Clock, ShieldAlert, Info,
    DollarSign, Target, Layers, Flame, Bed, Plane
} from 'lucide-react';

// Auth
import { useAuth } from '../hooks/useAuth';

// Data + Services
import { MOCK_EVENTS } from '../services/event.service';
import { getMarginReport, TARGET_MARGIN_PCT } from '../services/margin.service';

// Components
import Sidebar from '../components/layout/Sidebar';
import { inventoryBlockApi } from '../services/api.service';

// ── Utility sub-components ─────────────────────────────────────────────────────

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

const SectionCard = ({ children, className = '' }) => (
    <div className={`insight-card bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5 ${className}`}>
        {children}
    </div>
);

const CardHeader = ({ icon: Icon, title, subtitle, accent = 'text-indigo-600', badge }) => (
    <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50`}>
                <Icon size={18} className={accent} />
            </div>
            <div>
                <div className="font-bold text-gray-900 text-sm">{title}</div>
                {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
            </div>
        </div>
        {badge}
    </div>
);

const StatusChip = ({ label, color }) => {
    const cfg = {
        green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        gray: 'bg-gray-50 text-gray-500 border-gray-200',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        violet: 'bg-violet-50 text-violet-700 border-violet-200',
    }[color] || 'bg-gray-50 text-gray-600 border-gray-200';
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg}`}>
            {label}
        </span>
    );
};

// Sparkline SVG — 6 data points
const Sparkline = ({ data, color = '#6366f1' }) => {
    const max = Math.max(...data, 1);
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 30 - (v / max) * 28;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg viewBox="0 0 100 32" className="w-20 h-8" preserveAspectRatio="none">
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

// ── 1. Cost vs Sell Card ───────────────────────────────────────────────────────

const CostVsSellCard = ({ data }) => {
    const { cost, sell, gapPct, gapAbs, trend, status } = data;
    const costBarW = Math.round((cost / sell) * 100);
    const statusCfg = {
        HEALTHY: { chip: 'green', label: 'Healthy' },
        TIGHT: { chip: 'amber', label: 'Tight' },
        NEGATIVE: { chip: 'red', label: 'Negative' },
    }[status];

    return (
        <SectionCard>
            <CardHeader
                icon={DollarSign}
                title="Cost vs Sell"
                subtitle="Per-head margin gap analysis"
                accent="text-indigo-600"
                badge={<StatusChip label={statusCfg.label} color={statusCfg.chip} />}
            />
            {/* Bar comparison */}
            <div className="flex flex-col gap-3">
                <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1.5">
                        <span>Cost / head</span>
                        <span className="font-bold text-gray-800 tabular-nums">₹{cost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${costBarW}%` }} />
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1.5">
                        <span>Sell / head</span>
                        <span className="font-bold text-gray-800 tabular-nums">₹{sell.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full w-full" />
                    </div>
                </div>
            </div>
            {/* Gap row + sparkline */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div>
                    <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Margin Gap</div>
                    <div className="font-bold text-lg text-gray-900 tabular-nums">₹{gapAbs.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{gapPct}% of sell price</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">6-wk trend</div>
                    <Sparkline data={trend} color={status === 'HEALTHY' ? '#10b981' : status === 'TIGHT' ? '#f59e0b' : '#ef4444'} />
                </div>
            </div>
        </SectionCard>
    );
};

// ── 2. Utilization Velocity Card ───────────────────────────────────────────────

const velocityCfg = {
    FAST: { color: 'text-emerald-600', chip: 'green', bar: 'bg-emerald-500', label: 'Fast' },
    ON_TRACK: { color: 'text-indigo-600', chip: 'indigo', bar: 'bg-indigo-500', label: 'On Track' },
    SLOW: { color: 'text-amber-600', chip: 'amber', bar: 'bg-amber-500', label: 'Slow' },
    CRITICAL: { color: 'text-red-600', chip: 'red', bar: 'bg-red-500', label: 'Critical' },
};

const UtilizationVelocityCard = ({ data }) => {
    const { currentFillPct, rsvpsPerDay, daysLeft, projectedFillPct, velocityLabel, projectedShortfall } = data;
    const cfg = velocityCfg[velocityLabel];

    return (
        <SectionCard>
            <CardHeader
                icon={Zap}
                title="Utilization Velocity"
                subtitle="Projected fill by cutoff date"
                accent="text-violet-600"
                badge={<StatusChip label={cfg.label} color={cfg.chip} />}
            />
            {/* Gauge-style double bar */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                    <span>Current fill</span>
                    <span className="font-bold text-gray-800 tabular-nums">{currentFillPct}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
                    <div className="h-full bg-gray-300 rounded-full" style={{ width: `${currentFillPct}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mt-1">
                    <span>Projected at cutoff</span>
                    <span className={`font-bold tabular-nums ${cfg.color}`}>{projectedFillPct}%</span>
                </div>
                <div className={`h-2.5 bg-gray-100 rounded-full overflow-hidden`}>
                    <div className={`h-full rounded-full ${cfg.bar} transition-all`} style={{ width: `${projectedFillPct}%` }} />
                </div>
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="font-bold text-gray-900 tabular-nums text-sm">{rsvpsPerDay}/day</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide font-semibold">RSVP pace</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className={`font-bold tabular-nums text-sm ${cfg.color}`}>{daysLeft}d</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide font-semibold">Days left</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="font-bold text-gray-900 tabular-nums text-sm">{projectedShortfall}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide font-semibold">Shortfall</div>
                </div>
            </div>
        </SectionCard>
    );
};

// ── 3. Suggested Price Increase Card ──────────────────────────────────────────

const PriceIncreaseCard = ({ data, onAccept }) => {
    const { currentMarginPct, upliftPct, upliftPerHead, totalUpliftRevenue, newSellPerHead, breakEvenHeads } = data;
    const [accepted, setAccepted] = useState(false);

    const handle = () => { setAccepted(true); onAccept(); };

    return (
        <SectionCard>
            <CardHeader
                icon={TrendingUp}
                title="Suggested Price Increase"
                subtitle={`Target margin: ${TARGET_MARGIN_PCT}%`}
                accent="text-emerald-600"
                badge={<StatusChip label={`+${upliftPct}% uplift`} color="indigo" />}
            />
            {/* Current vs Target */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Current Margin</div>
                    <div className="font-bold text-2xl text-gray-800 mt-1 tabular-nums">{currentMarginPct}%</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                    <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Target Margin</div>
                    <div className="font-bold text-2xl text-emerald-700 mt-1 tabular-nums">{TARGET_MARGIN_PCT}%</div>
                </div>
            </div>
            {/* Uplift details */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-medium">New sell price / head</span>
                    <span className="font-bold text-gray-900 tabular-nums">₹{newSellPerHead.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-medium">Additional rev (unsold pax)</span>
                    <span className="font-bold text-emerald-700 tabular-nums">+₹{totalUpliftRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-medium">Break-even guests</span>
                    <span className="font-bold text-gray-900 tabular-nums">{breakEvenHeads} pax</span>
                </div>
            </div>
            {/* CTA */}
            <button
                onClick={handle}
                disabled={accepted}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all
                    ${accepted
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-not-allowed'
                        : 'bg-tbo-indigo text-white hover:bg-[#2A1B4E] active:scale-95 shadow-sm'}`}
            >
                {accepted ? <><CheckCircle2 size={14} /> Suggestion Applied</> : <><ArrowUpRight size={14} /> Accept Suggestion</>}
            </button>
        </SectionCard>
    );
};

// ── 4. Bundle Suggestions Card ─────────────────────────────────────────────────

const bundleIconMap = { Sparkles, UtensilsCrossed, Car };
const bundleTagCfg = {
    HIGH_VALUE: { color: 'violet', label: '★ High Value' },
    QUICK_WIN: { color: 'green', label: '⚡ Quick Win' },
    PREMIUM: { color: 'indigo', label: '◆ Premium' },
};

const BundleSuggestionsCard = ({ data }) => (
    <SectionCard>
        <CardHeader
            icon={Layers}
            title="Bundle Suggestions"
            subtitle="Add-ons to boost per-head revenue"
            accent="text-amber-600"
        />
        <div className="flex flex-col gap-3">
            {data.map((bundle, i) => {
                const Icon = bundleIconMap[bundle.icon] || Sparkles;
                const tagCfg = bundleTagCfg[bundle.tag];
                return (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-amber-50/60 transition-colors group">
                        <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                            <Icon size={16} className="text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-gray-900 truncate">{bundle.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5 truncate">{bundle.description}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="font-bold text-sm text-emerald-700 tabular-nums">
                                +₹{bundle.upliftPerHead.toLocaleString('en-IN')}/hd
                            </span>
                            <StatusChip label={tagCfg.label} color={tagCfg.color} />
                        </div>
                    </div>
                );
            })}
        </div>
        <div className="text-[11px] text-gray-400 flex items-start gap-1.5 mt-1">
            <Info size={12} className="flex-shrink-0 mt-0.5" />
            <span>Bundle margin deltas are post-commission estimates. Final pricing subject to supplier confirmation.</span>
        </div>
    </SectionCard>
);

// ── 5. Early Release Warning Card ─────────────────────────────────────────────

const earlyReleaseSeverityCfg = {
    NONE: { icon: CheckCircle2, iconColor: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', chip: 'green', chipLabel: 'All Clear' },
    WATCH: { icon: Clock, iconColor: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', chip: 'amber', chipLabel: 'Watch' },
    WARNING: { icon: AlertTriangle, iconColor: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', chip: 'amber', chipLabel: 'Warning' },
    CRITICAL: { icon: ShieldAlert, iconColor: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', chip: 'red', chipLabel: 'Critical' },
};

const EarlyReleaseCard = ({ data }) => {
    const { triggered, fillPct, daysUntilWindow, slotsAtRisk, severity, action } = data;
    const cfg = earlyReleaseSeverityCfg[severity];
    const SevIcon = cfg.icon;

    return (
        <SectionCard>
            <CardHeader
                icon={Flame}
                title="Early Release Warning"
                subtitle="Hotel release window monitoring"
                accent="text-red-500"
                badge={<StatusChip label={cfg.chipLabel} color={cfg.chip} />}
            />
            {/* Status banner */}
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                <SevIcon size={18} className={`${cfg.iconColor} flex-shrink-0 mt-0.5`} />
                <div>
                    <div className="text-sm font-bold text-gray-800 mb-0.5">
                        {triggered ? `${slotsAtRisk} slots at risk of release` : 'Inventory fill is healthy'}
                    </div>
                    <div className="text-xs text-gray-500 leading-relaxed">{action}</div>
                </div>
            </div>
            {/* Stat row */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="font-bold text-gray-900 tabular-nums text-sm">{fillPct}%</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide font-semibold">Fill %</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className={`font-bold tabular-nums text-sm ${triggered ? 'text-red-600' : 'text-gray-900'}`}>
                        {daysUntilWindow}d
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide font-semibold">Until window</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className={`font-bold tabular-nums text-sm ${slotsAtRisk > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {slotsAtRisk}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide font-semibold">At risk</div>
                </div>
            </div>
        </SectionCard>
    );
};

// ── Main page ──────────────────────────────────────────────────────────────────

const MarginIntelligence = () => {
    const container = useRef(null);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [selectedId, setSelectedId] = useState(MOCK_EVENTS[0]?.id);
    const [toastMsg, setToastMsg] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const [inventoryBlocks, setInventoryBlocks] = useState([]);

    const selectedEvent = useMemo(
        () => MOCK_EVENTS.find(e => e.id === selectedId) || MOCK_EVENTS[0],
        [selectedId]
    );

    // Fetch inventory blocks for selected event
    useEffect(() => {
        inventoryBlockApi.getByEvent(selectedId).then(setInventoryBlocks).catch(() => setInventoryBlocks([]));
    }, [selectedId]);

    const report = useMemo(() => getMarginReport(selectedEvent, inventoryBlocks), [selectedEvent, inventoryBlocks]);

    useEffect(() => {
        if (!user) { navigate('/agent/login'); return; }
        const ctx = gsap.context(() => {
            gsap.from('.insight-card', {
                y: 22, opacity: 0, stagger: 0.09, duration: 0.55, ease: 'power2.out',
            });
            gsap.from('.kpi-bar', {
                y: -10, opacity: 0, duration: 0.4, ease: 'power2.out',
            });
        }, container);
        return () => ctx.revert();
    }, [user, navigate, selectedId]);

    if (!user) return null;

    const handleAcceptSuggestion = () => {
        setToastMsg(`Price increase applied for ${selectedEvent.clientName}`);
        setTimeout(() => setToastMsg(''), 3500);
    };

    // KPI bar values
    const cvsData = report.costVsSell;
    const velData = report.velocity;

    const kpis = [
        {
            icon: BarChart2,
            label: 'Current Margin',
            value: `${selectedEvent.marginPct}%`,
            accent: {
                bg: 'bg-white', border: 'border-gray-100',
                iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', valueColor: 'text-gray-900',
            },
        },
        {
            icon: DollarSign,
            label: 'Cost / Head',
            value: `₹${cvsData.cost.toLocaleString('en-IN')}`,
            accent: {
                bg: 'bg-red-50', border: 'border-red-100',
                iconBg: 'bg-red-100', iconColor: 'text-red-600', valueColor: 'text-red-700',
            },
        },
        {
            icon: TrendingUp,
            label: 'Sell / Head',
            value: `₹${cvsData.sell.toLocaleString('en-IN')}`,
            accent: {
                bg: 'bg-emerald-50', border: 'border-emerald-100',
                iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valueColor: 'text-emerald-700',
            },
        },
        {
            icon: Zap,
            label: 'Fill Velocity',
            value: velocityCfg[velData.velocityLabel]?.label,
            accent: {
                bg: 'bg-violet-50', border: 'border-violet-100',
                iconBg: 'bg-violet-100', iconColor: 'text-violet-600', valueColor: 'text-violet-700',
            },
        },
        {
            icon: Target,
            label: 'Target Margin',
            value: `${TARGET_MARGIN_PCT}%`,
            accent: {
                bg: 'bg-amber-50', border: 'border-amber-100',
                iconBg: 'bg-amber-100', iconColor: 'text-amber-600', valueColor: 'text-amber-700',
            },
        },
    ];

    // Close dropdown on outside click
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={container} className="min-h-screen flex bg-[#F8F9FB] font-sans">
            <Sidebar onNavigate={navigate} onLogout={() => { logout(); navigate('/'); }} />

            <main className="flex-1 ml-64 flex flex-col min-h-screen">

                {/* Page Header */}
                <div className="bg-white border-b border-gray-100 px-10 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                    <div>
                        <h1 className="font-bold text-xl text-gray-900 tracking-tight flex items-center gap-2">
                            <BarChart2 size={20} className="text-indigo-500" />
                            Margin Intelligence
                        </h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            Pricing analytics, velocity signals, and AI-assisted margin recommendations.
                        </p>
                    </div>

                    {/* Event selector */}
                    <div ref={dropdownRef} className="relative">
                        <button
                            onClick={() => setDropdownOpen(v => !v)}
                            className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors shadow-sm"
                        >
                            <Package2 size={15} className="text-gray-400" />
                            <span className="max-w-[160px] truncate">{selectedEvent.clientName}</span>
                            <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {dropdownOpen && (
                            <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                                {MOCK_EVENTS.map(ev => (
                                    <button
                                        key={ev.id}
                                        onClick={() => { setSelectedId(ev.id); setDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-indigo-50 ${ev.id === selectedId ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-gray-700 font-medium'}`}
                                    >
                                        <div>{ev.clientName}</div>
                                        <div className="text-xs text-gray-400 font-normal mt-0.5">{ev.destination}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 p-8 flex flex-col gap-8 overflow-auto">

                    {/* KPI Bar */}
                    <div className="kpi-bar flex flex-wrap gap-3">
                        {kpis.map(k => <KpiPill key={k.label} {...k} />)}
                    </div>

                    {/* Cards grid — 2 cols on large, 1 on small */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        <CostVsSellCard data={report.costVsSell} />
                        <UtilizationVelocityCard data={report.velocity} />
                        <PriceIncreaseCard data={report.priceIncrease} onAccept={handleAcceptSuggestion} />
                        <EarlyReleaseCard data={report.earlyRelease} />
                        {/* Bundle card spans full width */}
                        <div className="xl:col-span-2">
                            <BundleSuggestionsCard data={report.bundles} />
                        </div>

                        {/* Travel Margin Card (full width) */}
                        {(report.flightMargin.totalBlocks > 0 || report.hotelMargin.totalBlocks > 0) && (
                            <div className="xl:col-span-2">
                                <SectionCard>
                                    <CardHeader icon={Layers} title="Travel Inventory Margins" subtitle="Flight + Hotel block-level margins" accent="text-sky-600" />
                                    <div className="grid grid-cols-2 gap-4">
                                        {report.hotelMargin.totalBlocks > 0 && (
                                            <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Bed size={14} className="text-violet-600" />
                                                    <span className="text-xs font-bold text-violet-700 uppercase tracking-widest">Hotel Margin</span>
                                                </div>
                                                <div className="font-bold text-2xl text-violet-900 tabular-nums">{report.hotelMargin.marginPct}%</div>
                                                <div className="text-xs text-violet-500 mt-1">
                                                    {report.hotelMargin.totalLocked} rooms locked · ${report.hotelMargin.avgCostPerUnit} cost / ${report.hotelMargin.avgSellPerUnit} sell
                                                </div>
                                            </div>
                                        )}
                                        {report.flightMargin.totalBlocks > 0 && (
                                            <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Plane size={14} className="text-sky-600" />
                                                    <span className="text-xs font-bold text-sky-700 uppercase tracking-widest">Flight Margin</span>
                                                </div>
                                                <div className="font-bold text-2xl text-sky-900 tabular-nums">{report.flightMargin.marginPct}%</div>
                                                <div className="text-xs text-sky-500 mt-1">
                                                    {report.flightMargin.totalLocked} seats locked · ${report.flightMargin.avgCostPerUnit} cost / ${report.flightMargin.avgSellPerUnit} sell
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Combined Travel Margin</div>
                                            <div className="font-bold text-lg text-gray-900 tabular-nums">{report.combinedTravel.marginPct}%</div>
                                            <div className="text-xs text-gray-500">Break-even fill: {report.combinedTravel.breakEvenFillPct}%</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Cost per Head</div>
                                            <div className="font-bold text-lg text-gray-900 tabular-nums">${report.combinedTravel.costPerHead}</div>
                                        </div>
                                    </div>
                                </SectionCard>
                            </div>
                        )}
                    </div>

                </div>
            </main>

            {/* Toast */}
            {toastMsg && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    {toastMsg}
                </div>
            )}
        </div>
    );
};

export default MarginIntelligence;
