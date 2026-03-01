import React, { useState, useRef, useEffect, useMemo } from 'react';
import gsap from 'gsap';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, LayoutDashboard, FileText, Package, Users, Grid3x3,
    Plane, ShoppingBag, CreditCard, CheckSquare, ExternalLink, Download,
    MapPin, Mail, Globe, Plus, Clock, ChevronRight,
    Zap, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Timer,
    Bed
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { getContractStatusStyle } from '../services/event.service';
import {
    getMockEventById, getOverviewData,
    getTransportData, getVendorData,
    getPaymentData, getExecutionData,
} from '../services/detail.service';
import { getGuestFeed, filterGuests, computeFnBBreakdown } from '../services/guest.service';
import { getEventInventory, getInventorySummary, decrementInventoryItem, lockInventoryItem, getRoomUnitGrid, getAllocationStats, assignGuestToRoom, releaseRoom, recomputeContractHealthAfterAssign } from '../services/inventory.service';
import { getDigitalContractData, computeContractHealth } from '../services/contract.service';
import { socket, joinEventRoom } from '../lib/socket';
import { guestApi } from '../services/api.service';

import Sidebar from '../components/layout/Sidebar';
import HotelsTab from '../components/HotelsTab';
import FlightsTab from '../components/FlightsTab';
import { exportToCSV, exportToPDF } from '../lib/export';

// ── Shared Micro-Components ─────────────────────────────────────────────────

const Badge = ({ label }) => {
    const map = {
        CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        SAFE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        LOCKED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        ARRANGED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        CONTRACTED: 'bg-blue-50   text-blue-700   border-blue-200',
        ASSIGNED: 'bg-blue-50   text-blue-700   border-blue-200',
        PLANNED: 'bg-blue-50   text-blue-700   border-blue-200',
        PAID: 'bg-teal-50   text-teal-700   border-teal-200',
        RISK: 'bg-amber-50  text-amber-700  border-amber-200',
        PENDING: 'bg-amber-50  text-amber-700  border-amber-200',
        UPCOMING: 'bg-amber-50  text-amber-700  border-amber-200',
        'AT RISK': 'bg-amber-50  text-amber-700  border-amber-200',
        WAITLIST: 'bg-amber-50  text-amber-700  border-amber-200',
        NEGOTIATING: 'bg-amber-50 text-amber-700  border-amber-200',
        'ADVANCE PAID': 'bg-teal-50  text-teal-700  border-teal-200',
        'PARTIALLY PAID': 'bg-amber-50 text-amber-700 border-amber-200',
        BREACH: 'bg-red-50    text-red-700    border-red-200',
        DECLINED: 'bg-red-50    text-red-700    border-red-200',
        OVERDUE: 'bg-red-50    text-red-700    border-red-200',
        'NOT PAID': 'bg-red-50    text-red-700    border-red-200',
        neutral: 'bg-gray-100  text-gray-600   border-gray-200',
    };
    const cls = map[label] || map.neutral;
    return (
        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border whitespace-nowrap ${cls}`}>
            {label}
        </span>
    );
};

const Th = ({ children }) => (
    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 border-b border-gray-100 whitespace-nowrap">
        {children}
    </th>
);
const Td = ({ children, className = '' }) => (
    <td className={`px-4 py-3 text-sm text-gray-700 border-b border-gray-50 ${className}`}>
        {children}
    </td>
);
const Panel = ({ title, action, children }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
                {action}
            </div>
        )}
        {children}
    </div>
);
const Btn = ({ icon: Icon, label, variant = 'outline', onClick }) => {
    const cls = variant === 'primary'
        ? 'bg-tbo-indigo text-white hover:bg-[#2A1B4E]'
        : 'border border-gray-200 text-gray-700 hover:border-gray-400 bg-white';
    return (
        <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${cls}`}>
            {Icon && <Icon size={13} />} {label}
        </button>
    );
};
const Kpi = ({ label, value, sub, color = 'text-gray-900' }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
        <span className={`text-3xl font-bold tracking-tight ${color}`}>{value}</span>
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
);

// ── Tab Definitions ──────────────────────────────────────────────────────────
const TABS = [
    { key: 'overview', label: 'Overview', Icon: LayoutDashboard },
    { key: 'contract', label: 'Contract', Icon: FileText },
    { key: 'inventory', label: 'Inventory', Icon: Package },
    { key: 'hotels', label: 'Hotels', Icon: Bed },
    { key: 'flights', label: 'Flights', Icon: Plane },
    { key: 'guests', label: 'Guests', Icon: Users },
    { key: 'allocation', label: 'Allocation', Icon: Grid3x3 },
    { key: 'transport', label: 'Transport', Icon: Plane },
    { key: 'vendors', label: 'Vendors', Icon: ShoppingBag },
    { key: 'payments', label: 'Payments', Icon: CreditCard },
    { key: 'execution', label: 'Execution', Icon: CheckSquare },
];

// ── Tab Panels ────────────────────────────────────────────────────────────────

const OverviewTab = ({ event, handleEmailBlast, handleExportReport, globalInventory }) => {
    const d = getOverviewData(event);
    const cs = getContractStatusStyle(event.contractStatus);
    const { canSeeFinance, canSeeMargin } = useAuth();

    // Dynamically calculate Rooms Blocked from live inventory array
    const roomsBlocked = globalInventory.find(cat => cat.key === 'accommodation')?.total || 0;

    return (
        <div>
            <div className="grid grid-cols-4 gap-4 mb-6">
                {canSeeFinance ? (
                    <Kpi label="Total Budget" value={`$${(event.budget / 1000).toFixed(0)}K`} sub="Contract value" color="text-tbo-indigo" />
                ) : (
                    <Kpi label="Rooms Blocked" value={roomsBlocked} sub="Standard units" color="text-tbo-indigo" />
                )}

                <Kpi label="Contracted Pax" value={event.headcount} sub="Max headcount" />
                <Kpi label="Confirmed Guests" value={event.confirmedGuests} sub={`${Math.round(event.confirmedGuests / event.headcount * 100)}% filled`} color="text-emerald-700" />

                {canSeeMargin ? (
                    <Kpi label="Agent Margin" value={`${event.marginPct}%`} sub="Net margin rate" color="text-tbo-turquoise" />
                ) : (
                    <Kpi label="Status" value={event.contractStatus} sub="Current phase" color="text-indigo-600" />
                )}
            </div>
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                    <Panel title="Event Timeline">
                        <table className="w-full"><tbody>
                            {d.milestones.map((m, i) => (
                                <tr key={i} className="border-b border-gray-50 last:border-0">
                                    <Td><span className="font-semibold text-gray-800">{m.label}</span></Td>
                                    <Td className="text-gray-500">{m.date}</Td>
                                    <Td><Badge label={m.status} /></Td>
                                </tr>
                            ))}
                        </tbody></table>
                    </Panel>
                </div>
                <div>
                    <Panel title="Event Summary">
                        <div className="p-5 space-y-3">
                            {Object.entries(d.summary).map(([k, v]) => (
                                <div key={k} className="flex flex-col gap-0.5">
                                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{k.replace(/([A-Z])/g, ' $1')}</span>
                                    <span className="text-sm text-gray-800 font-medium break-all">{v}</span>
                                </div>
                            ))}
                            <div className="pt-3 border-t border-gray-100 flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${cs.dot}`} />
                                <span className={`text-xs font-bold ${cs.text}`}>{event.contractStatus}</span>
                            </div>
                        </div>
                    </Panel>
                    <Panel>
                        <div className="p-5 flex flex-col gap-2">
                            <Btn icon={Globe} label="View Guest Microsite" variant="outline" onClick={() => window.open(`/microsite/${event.id}`, '_blank')} />
                            <Btn icon={Mail} label="Email Blast to Guests" variant="outline" onClick={handleEmailBlast} />
                            <Btn icon={Download} label="Export Event Report" variant="outline" onClick={handleExportReport} />
                        </div>
                    </Panel>
                </div>
            </div>
        </div>
    );
};

const ContractTab = ({ event }) => {
    const pdc = useMemo(() => getDigitalContractData(event), [event]);
    const [health, setHealth] = useState(computeContractHealth(event, pdc));
    const { commercialTerms: ct, inclusions, automationRules } = pdc;
    const { canEditContract } = useAuth();

    // Live countdown updater
    useEffect(() => {
        const tick = () => setHealth(computeContractHealth(event, pdc));
        const id = setInterval(tick, 60000); // update every minute
        return () => clearInterval(id);
    }, [event, pdc]);

    const cs = getContractStatusStyle(event.contractStatus);
    const PRIORITY_STYLE = {
        HIGH: 'bg-red-50    text-red-700    border-red-200',
        MEDIUM: 'bg-amber-50  text-amber-700  border-amber-200',
        LOW: 'bg-gray-100  text-gray-600   border-gray-200',
    };
    const RULE_STATUS_STYLE = {
        ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        SCHEDULED: 'bg-blue-50    text-blue-700   border-blue-200',
        TRIGGERED: 'bg-red-50     text-red-700    border-red-200',
    };

    return (
        <div>
            {/* PDC Header — dark terminal-style banner */}
            <div className="bg-tbo-indigo rounded-2xl p-5 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Zap size={20} className="text-tbo-gold" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="text-white font-bold text-base">Programmable Digital Contract</span>
                            <span className="bg-tbo-gold/20 text-tbo-gold border border-tbo-gold/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                v{pdc.meta.version}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-0.5">
                            <span className="font-mono text-xs text-white/50">{pdc.meta.contractId}</span>
                            <span className="text-white/30">·</span>
                            <span className="text-xs text-white/50">Signed {pdc.meta.signedDate}</span>
                            <span className="text-white/30">·</span>
                            <span className="text-xs text-white/50">{pdc.meta.jurisdiction}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Btn icon={Download} label="Export PDF" />
                    <Btn icon={ExternalLink} label="Audit Log" />
                </div>
            </div>

            {/* Main 2-col layout: sections + live health */}
            <div className="grid grid-cols-3 gap-6">

                {/* Left: 3 sections */}
                <div className="col-span-2 space-y-6">

                    {/* 1. Commercial Terms */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <FileText size={15} className="text-tbo-indigo" />
                                <h3 className="font-bold text-gray-900 text-sm">Commercial Terms</h3>
                            </div>
                            <Badge label={event.contractStatus} />
                        </div>
                        <div className="grid grid-cols-3 divide-x divide-gray-100">
                            {[
                                { label: 'Rate Per Unit', value: `$${ct.ratePerUnit.toLocaleString()}`, sub: 'per confirmed pax' },
                                { label: 'Min Units', value: ct.minUnits, sub: '70% of contracted headcount' },
                                { label: 'Max Units', value: ct.maxUnits, sub: '115% cap — hard ceiling' },
                                { label: 'Cutoff Date', value: ct.cutoffDate, sub: 'No amendments after' },
                                { label: 'Penalty Rate', value: `${ct.penaltyPct}%`, sub: 'of total committed value' },
                                { label: 'Penalty Exposure', value: `$${Math.round(ct.totalCommitmentValue * ct.penaltyPct / 100).toLocaleString()}`, sub: 'if fully breached' },
                            ].map(({ label, value, sub }) => (
                                <div key={label} className="p-5 flex flex-col gap-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
                                    <span className="font-bold text-lg text-gray-900">{value}</span>
                                    <span className="text-xs text-gray-400">{sub}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. Inclusions */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                            <ShieldCheck size={15} className="text-emerald-600" />
                            <h3 className="font-bold text-gray-900 text-sm">Inclusions</h3>
                        </div>
                        <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b border-gray-100">
                            {[inclusions.breakfast, inclusions.transfers].map((inc, i) => (
                                <div key={i} className="flex items-start gap-3 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                    <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">{inc.label}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{inc.pax} pax · {inc.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <table className="w-full">
                            <thead><tr><Th>Add-On / Service</Th><Th>Rate</Th><Th>Notes</Th><Th>Included</Th></tr></thead>
                            <tbody>
                                {inclusions.addOns.map((a, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <Td><span className="font-medium text-gray-900">{a.name}</span></Td>
                                        <Td className="font-mono">{a.rate}</Td>
                                        <Td className="text-gray-400 text-xs">{a.notes}</Td>
                                        <Td>
                                            {a.included
                                                ? <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold"><CheckCircle2 size={13} /> YES</span>
                                                : <span className="inline-flex items-center gap-1 text-gray-400 text-xs"><XCircle size={13} /> Optional</span>
                                            }
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 3. Automation Rules */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Zap size={15} className="text-tbo-saffron" />
                                <h3 className="font-bold text-gray-900 text-sm">Automation Rules</h3>
                                <span className="ml-1 bg-tbo-saffron/10 text-tbo-saffron border border-tbo-saffron/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {automationRules.filter(r => r.status === 'ACTIVE').length} ACTIVE
                                </span>
                            </div>
                            <span className="text-xs text-gray-400 font-mono">Contract Engine v2.1</span>
                        </div>
                        <table className="w-full">
                            <thead><tr><Th>Rule ID</Th><Th>Name</Th><Th>Priority</Th><Th>Status</Th><Th>Trigger Condition</Th><Th>Automated Action</Th></tr></thead>
                            <tbody>
                                {automationRules.map((r, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <Td><span className="font-mono text-xs text-gray-400">{r.id}</span></Td>
                                        <Td><span className="font-semibold text-gray-900 text-sm">{r.name}</span></Td>
                                        <Td>
                                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${PRIORITY_STYLE[r.priority]}`}>
                                                {r.priority}
                                            </span>
                                        </Td>
                                        <Td>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${RULE_STATUS_STYLE[r.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                {r.status}
                                            </span>
                                        </Td>
                                        <Td className="text-xs text-gray-500 max-w-[220px]">{r.trigger}</Td>
                                        <Td className="text-xs text-gray-500 max-w-[240px]">{r.action}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Live Contract Health Panel */}
                <div className="space-y-4 sticky top-36 self-start">
                    {/* Status Badge */}
                    <div className={`rounded-2xl border p-5 ${health.contractStatus === 'SAFE' ? 'bg-emerald-50 border-emerald-200' : health.contractStatus === 'BREACH' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Contract Health</div>
                        <div className={`flex items-center gap-2 text-xl font-bold ${cs.text}`}>
                            <span className={`w-3 h-3 rounded-full ${cs.dot} animate-pulse`} />
                            {health.contractStatus}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {health.contractStatus === 'SAFE' ? 'All thresholds satisfied.' :
                                health.contractStatus === 'BREACH' ? 'Contract minimum violated.' :
                                    'Approaching risk threshold.'}
                        </div>
                    </div>

                    {/* Countdown to Cutoff */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Timer size={14} className="text-tbo-rani" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cutoff Countdown</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { v: health.daysLeft, l: 'DAYS' },
                                { v: health.hoursLeft, l: 'HRS' },
                                { v: health.minsLeft, l: 'MINS' },
                            ].map(({ v, l }) => (
                                <div key={l} className="bg-tbo-indigo rounded-xl p-3 text-center">
                                    <div className="text-2xl font-bold text-white font-mono">{String(v).padStart(2, '0')}</div>
                                    <div className="text-[9px] font-bold tracking-widest text-white/40 mt-0.5">{l}</div>
                                </div>
                            ))}
                        </div>
                        <div className="text-xs text-gray-400 text-center mt-2">Until {ct.cutoffDate}</div>
                    </div>

                    {/* Fill vs Minimum */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={14} className="text-indigo-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Fill vs Minimum</span>
                        </div>
                        <div className="flex items-end justify-between mb-1.5">
                            <span className="text-2xl font-bold text-gray-900">{event.confirmedGuests}</span>
                            <span className="text-sm text-gray-400">/ {ct.minUnits} min</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                            <div
                                className={`h-full rounded-full transition-all ${health.fillPct >= 100 ? 'bg-emerald-500' : health.fillPct >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${health.fillPct}%` }}
                            />
                        </div>
                        {health.remainingToMin > 0 ? (
                            <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold">
                                <AlertTriangle size={12} /> {health.remainingToMin} more pax needed to meet minimum
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                                <CheckCircle2 size={12} /> Minimum commitment met
                            </div>
                        )}
                    </div>

                    {/* Over-Allocation Warning */}
                    <div className={`rounded-2xl border p-5 ${health.isOverAllocated ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-100'
                        }`}>
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle size={14} className={health.isOverAllocated ? 'text-red-600' : 'text-gray-400'} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Over-Allocation Guard</span>
                        </div>
                        {health.isOverAllocated ? (
                            <>
                                <div className="text-sm font-bold text-red-700">⚠ Over by {health.overByPax} pax</div>
                                <div className="text-xs text-red-500 mt-1">Exceeds max {ct.maxUnits} unit cap. New RSVPs blocked.</div>
                            </>
                        ) : (
                            <>
                                <div className="text-sm font-bold text-gray-600">Guard Active</div>
                                <div className="text-xs text-gray-400 mt-1">Max {ct.maxUnits} pax. {ct.maxUnits - event.confirmedGuests} slots remaining.</div>
                            </>
                        )}
                    </div>

                    {/* Quick actions */}
                    {canEditContract && (
                        <div className="flex flex-col gap-2">
                            <Btn icon={FileText} label="Request Amendment" variant="outline" />
                            <Btn icon={Download} label="Download Signed Copy" variant="outline" />
                            <Btn icon={Zap} label="Simulate Rule Trigger" variant="outline" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Icon map for category cards
const CAT_ICONS = {
    Building2: ({ size, className }) => (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="2" width="18" height="20" rx="2" /><path d="M9 22V12h6v10" /><path d="M9 7h.01M12 7h.01M15 7h.01M9 12h.01" />
        </svg>
    ),
    Sparkles: ({ size, className }) => (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    ),
    UtensilsCrossed: ({ size, className }) => (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" /><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7" /><path d="m2.1 21.8 6.4-6.3" />
        </svg>
    ),
};
const CatIcon = ({ name, size, className }) => {
    if (CAT_ICONS[name]) { const C = CAT_ICONS[name]; return <C size={size} className={className} />; }
    if (name === 'Plane') return <Plane size={size} className={className} />;
    if (name === 'ShoppingBag') return <ShoppingBag size={size} className={className} />;
    return <Plus size={size} className={className} />;
};


const InventoryTab = ({ event, globalInventory, setGlobalInventory }) => {
    const inventory = globalInventory;
    const setInventory = setGlobalInventory;
    const [expanded, setExpanded] = useState(null);
    const [lockModal, setLockModal] = useState(null); // { catKey, itemIdx, itemName }
    const [locking, setLocking] = useState(false);
    const [lockSuccess, setLockSuccess] = useState(null);
    const summary = getInventorySummary(inventory);

    const handleDecrement = (catKey, itemIdx) => {
        setInventory(prev => decrementInventoryItem(prev, catKey, itemIdx));
    };
    const handleLockConfirm = () => {
        if (!lockModal) return;
        setLocking(true);
        setTimeout(() => {
            setInventory(prev => lockInventoryItem(prev, lockModal.catKey, lockModal.itemIdx));
            setLocking(false);
            setLockSuccess(lockModal.itemName);
            setLockModal(null);
            setTimeout(() => setLockSuccess(null), 3000);
        }, 1400); // simulate API call delay
    };

    return (
        <div>
            {/* Success toast */}
            {lockSuccess && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl animate-pulse">
                    <CheckCircle2 size={18} />
                    <span className="font-semibold text-sm">Locked: {lockSuccess}</span>
                </div>
            )}

            {/* Lock Inventory Modal */}
            {lockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 mx-4">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-12 h-12 rounded-2xl bg-tbo-indigo flex items-center justify-center">
                                <Package size={22} className="text-white" />
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 text-base">Lock Inventory</div>
                                <div className="text-xs text-gray-400">Calls TBO PreBook API · Irreversible</div>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Item to Lock</div>
                            <div className="font-semibold text-gray-900">{lockModal.itemName}</div>
                            <div className="text-xs text-gray-400 mt-1">Category: {lockModal.catLabel}</div>
                            <div className="text-xs text-gray-400">Event: {event.clientName}</div>
                        </div>
                        {locking ? (
                            <div className="flex flex-col items-center py-4">
                                <div className="w-8 h-8 border-4 border-tbo-indigo border-t-transparent rounded-full animate-spin mb-3" />
                                <div className="text-sm text-gray-500 font-medium">Calling TBO PreBook API...</div>
                                <div className="text-xs text-gray-400 mt-1 font-mono">POST /inventory/lock · {lockModal.catKey}</div>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setLockModal(null)}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLockConfirm}
                                    className="flex-1 py-3 rounded-xl bg-tbo-indigo text-white text-sm font-bold hover:bg-[#2A1B4E] transition-colors flex items-center justify-center gap-2"
                                >
                                    <Package size={15} /> Confirm Lock
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Summary bar */}
            <div className="grid grid-cols-5 gap-4 mb-6">
                <Kpi label="Categories" value={summary.totalCategories} sub="Tracked scopes" />
                <Kpi label="Locked" value={summary.lockedCategories} sub="Of 6 categories" color="text-emerald-700" />
                <Kpi label="Total Units" value={summary.totalUnits.toLocaleString()} sub="Across all categories" />
                <Kpi label="Used Units" value={summary.usedUnits.toLocaleString()} sub="Confirmed / allocated" color="text-tbo-indigo" />
                <Kpi label="Avg Usage" value={`${summary.avgUsagePct}%`} sub="All categories avg" color={summary.avgUsagePct >= 80 ? 'text-emerald-700' : 'text-amber-600'} />
            </div>

            {/* Category cards grid */}
            <div className="grid grid-cols-2 gap-5">
                {inventory.map((cat) => {
                    const usagePct = Math.min(100, Math.round((cat.used / cat.total) * 100));
                    const remaining = cat.total - cat.used;
                    const isExpanded = expanded === cat.key;
                    const barColor = usagePct >= 90 ? 'bg-emerald-500' : usagePct >= 65 ? 'bg-amber-500' : 'bg-red-500';

                    return (
                        <div key={cat.key} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${cat.color.border}`}>
                            {/* Card header */}
                            <div className={`${cat.color.bg} px-5 pt-5 pb-4 border-b ${cat.color.border}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center`}>
                                            <CatIcon name={cat.icon} size={18} className={cat.color.text} />
                                        </div>
                                        <div>
                                            <div className={`font-bold text-sm ${cat.color.text}`}>{cat.label}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">{cat.supplier}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {cat.locked
                                            ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full"><Package size={10} /> LOCKED</span>
                                            : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full"><AlertTriangle size={10} /> OPEN</span>
                                        }
                                    </div>
                                </div>

                                {/* 3-col stats */}
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    <div className="bg-white/60 rounded-xl p-3 text-center">
                                        <div className="text-lg font-bold text-gray-900">{cat.total}</div>
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Total</div>
                                    </div>
                                    <div className="bg-white/60 rounded-xl p-3 text-center">
                                        <div className={`text-lg font-bold ${cat.color.text}`}>{cat.used}</div>
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Used</div>
                                    </div>
                                    <div className="bg-white/60 rounded-xl p-3 text-center">
                                        <div className={`text-lg font-bold ${remaining === 0 ? 'text-gray-400' : 'text-gray-900'}`}>{remaining}</div>
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Remaining</div>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${usagePct}%` }} />
                                    </div>
                                    <span className={`text-xs font-bold tabular-nums ${cat.color.text}`}>{usagePct}%</span>
                                </div>

                                {/* Contract ref */}
                                <div className="mt-2 flex items-center gap-1">
                                    <FileText size={10} className="text-gray-400" />
                                    <span className="font-mono text-[9px] text-gray-400">{cat.contractRef}</span>
                                </div>
                            </div>

                            {/* Expand toggle */}
                            <button
                                onClick={() => setExpanded(isExpanded ? null : cat.key)}
                                className="w-full flex items-center justify-between px-5 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                                <span>{isExpanded ? 'Hide' : 'View'} {cat.items.length} line items</span>
                                <ChevronRight size={13} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Expandable item rows */}
                            {isExpanded && (
                                <div className="border-t border-gray-100">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <Th>Item</Th><Th>Total</Th><Th>Used</Th><Th>Rem.</Th><Th>Lock</Th><Th>Action</Th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cat.items.map((item, i) => {
                                                const itemRem = item.total - item.used;
                                                return (
                                                    <tr key={i} className="hover:bg-gray-50 border-b border-gray-50 last:border-0">
                                                        <Td><span className="font-medium text-gray-800 text-xs">{item.name}</span></Td>
                                                        <Td className="text-xs">{item.total}</Td>
                                                        <Td>
                                                            <span className={`text-xs font-bold ${cat.color.text}`}>{item.used}</span>
                                                        </Td>
                                                        <Td className="text-xs">{itemRem}</Td>
                                                        <Td>
                                                            {item.locked
                                                                ? <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">LOCKED</span>
                                                                : <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">OPEN</span>
                                                            }
                                                        </Td>
                                                        <Td>
                                                            <div className="flex gap-1">
                                                                {!item.locked && (
                                                                    <button
                                                                        onClick={() => setLockModal({ catKey: cat.key, catLabel: cat.label, itemIdx: i, itemName: item.name })}
                                                                        className="text-[10px] font-bold bg-tbo-indigo text-white px-2 py-1 rounded-md hover:bg-[#2A1B4E] transition-colors flex items-center gap-1"
                                                                    >
                                                                        <Package size={9} /> Lock
                                                                    </button>
                                                                )}
                                                                {item.used > 0 && (
                                                                    <button
                                                                        onClick={() => handleDecrement(cat.key, i)}
                                                                        className="text-[10px] font-bold border border-gray-200 text-gray-500 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                                                                        title="Decrement usage (simulate release)"
                                                                    >
                                                                        −1
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </Td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const GuestsTab = ({ event, globalGuests, fnbBreakdown, lastUpdate, handleDietaryChange }) => {
    const guests = globalGuests;
    const [filters, setFilters] = useState({ rsvp: 'ALL', dietary: 'ALL', payment: 'ALL', room: 'ALL', search: '' });

    const visible = filterGuests(guests, filters);
    const confirmed = guests.filter(g => g.rsvp === 'CONFIRMED').length;
    const declined = guests.filter(g => g.rsvp === 'DECLINED').length;
    const pending = guests.filter(g => g.rsvp === 'PENDING').length;

    const RSVP_COLOR = { CONFIRMED: 'text-emerald-700 bg-emerald-50 border-emerald-200', PENDING: 'text-amber-700 bg-amber-50 border-amber-200', DECLINED: 'text-red-700 bg-red-50 border-red-200' };
    const ROOM_COLOR = { ASSIGNED: 'text-emerald-700 bg-emerald-50 border-emerald-200', PENDING: 'text-amber-700 bg-amber-50 border-amber-200', WAITLIST: 'text-blue-700 bg-blue-50 border-blue-200', UNASSIGNED: 'text-gray-500 bg-gray-100 border-gray-200' };
    const PAY_COLOR = { PAID: 'text-teal-700 bg-teal-50 border-teal-200', PENDING: 'text-amber-700 bg-amber-50 border-amber-200', OVERDUE: 'text-red-700 bg-red-50 border-red-200' };
    const DIETARY_TAGS = ['Vegetarian', 'Non-Veg', 'Vegan', 'Jain', 'Halal', 'Gluten-Free'];
    const DIETARY_COLOR = { Vegetarian: 'bg-green-100 text-green-700', 'Non-Veg': 'bg-red-100 text-red-700', Vegan: 'bg-emerald-100 text-emerald-700', Jain: 'bg-yellow-100 text-yellow-700', Halal: 'bg-sky-100 text-sky-700', 'Gluten-Free': 'bg-purple-100 text-purple-700' };

    const FnBItem = ({ tag }) => (
        <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${DIETARY_COLOR[tag] || 'bg-gray-100 text-gray-600'}`}>{tag}</span>
            <span className="text-sm font-bold text-gray-900 tabular-nums">{fnbBreakdown[tag] || 0} <span className="text-xs font-normal text-gray-400">covers</span></span>
        </div>
    );

    return (
        <div>
            {/* Header: KPIs + Live indicator */}
            <div className="flex items-start gap-4 mb-6">
                <div className="flex-1 grid grid-cols-4 gap-4">
                    <Kpi label="Total in Feed" value={guests.length} sub={`of ${event.headcount} headcount`} />
                    <Kpi label="Confirmed" value={confirmed} sub="Attending" color="text-emerald-700" />
                    <Kpi label="Declined" value={declined} sub="Not attending" color="text-red-600" />
                    <Kpi label="Awaiting RSVP" value={pending} sub="No response yet" color="text-amber-600" />
                </div>
                {/* Live status pill */}
                <div className={`flex flex-col items-end gap-1 shrink-0 pt-1`}>
                    <button
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default`}
                    >
                        <span className={`w-2 h-2 rounded-full bg-emerald-500 animate-pulse`} />
                        LIVE
                    </button>
                    {lastUpdate && <span className="text-[10px] text-gray-400">Updated {lastUpdate}</span>}
                </div>
            </div>

            <div className="grid grid-cols-4 gap-5">
                {/* Main feed (3/4 width) */}
                <div className="col-span-3">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Filter bar */}
                        <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2 bg-gray-50">
                            {/* Search */}
                            <input
                                value={filters.search}
                                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                                placeholder="Search name / PNR…"
                                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:border-tbo-indigo bg-white"
                            />
                            {/* RSVP filter */}
                            {['ALL', 'CONFIRMED', 'PENDING', 'DECLINED'].map(v => (
                                <button key={v} onClick={() => setFilters(f => ({ ...f, rsvp: v }))}
                                    className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${filters.rsvp === v ? 'bg-tbo-indigo text-white border-tbo-indigo' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                                    {v === 'ALL' ? 'All RSVP' : v}
                                </button>
                            ))}
                            <span className="text-gray-300">|</span>
                            {/* Dietary filter */}
                            <select value={filters.dietary} onChange={e => setFilters(f => ({ ...f, dietary: e.target.value }))}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-tbo-indigo bg-white text-gray-700">
                                <option value="ALL">All Dietary</option>
                                {DIETARY_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            {/* Payment filter */}
                            <select value={filters.payment} onChange={e => setFilters(f => ({ ...f, payment: e.target.value }))}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-tbo-indigo bg-white text-gray-700">
                                <option value="ALL">All Payment</option>
                                {['PAID', 'PENDING', 'OVERDUE'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            {/* Room filter */}
                            <select value={filters.room} onChange={e => setFilters(f => ({ ...f, room: e.target.value }))}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-tbo-indigo bg-white text-gray-700">
                                <option value="ALL">All Rooms</option>
                                {['ASSIGNED', 'PENDING', 'WAITLIST', 'UNASSIGNED'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <span className="ml-auto text-[10px] font-bold text-gray-400">{visible.length} / {guests.length} guests</span>
                        </div>

                        {/* Guest table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr>
                                        <Th>Guest Name</Th>
                                        <Th>Pax</Th>
                                        <Th>Arrival PNR</Th>
                                        <Th>Dietary Tag</Th>
                                        <Th>Room Status</Th>
                                        <Th>Payment</Th>
                                        <Th>Action</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.length === 0 && (
                                        <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">No guests match the current filters.</td></tr>
                                    )}
                                    {visible.map((g) => (
                                        <tr key={g.id}
                                            className={`border-b border-gray-50 last:border-0 transition-colors ${g._flash ? 'bg-emerald-50 animate-pulse' : 'hover:bg-gray-50'}`}
                                        >
                                            {/* Name */}
                                            <Td>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-tbo-indigo/10 flex items-center justify-center text-[11px] font-bold text-tbo-indigo shrink-0">
                                                        {g.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 text-sm">{g.name}</div>
                                                        {g.arrivedAt && <div className="text-[10px] text-gray-400">Arr: {g.arrivedAt}</div>}
                                                    </div>
                                                </div>
                                            </Td>
                                            {/* Pax */}
                                            <Td>
                                                <span className="font-bold text-gray-900">{g.pax}</span>
                                                {g.pax > 1 && <span className="ml-1 text-[10px] text-gray-400">+1</span>}
                                            </Td>
                                            {/* PNR */}
                                            <Td>
                                                {g.pnr
                                                    ? <span className="font-mono text-xs font-bold text-tbo-indigo bg-indigo-50 px-2 py-0.5 rounded-md">{g.pnr}</span>
                                                    : <span className="text-gray-300 text-xs">—</span>
                                                }
                                            </Td>
                                            {/* Dietary Tag — editable select */}
                                            <Td>
                                                <select
                                                    value={g.dietary}
                                                    onChange={e => handleDietaryChange(g.id, e.target.value)}
                                                    className={`text-[11px] font-bold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-tbo-indigo/20 ${DIETARY_COLOR[g.dietary] || 'bg-gray-100 text-gray-600'}`}
                                                >
                                                    {DIETARY_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </Td>
                                            {/* Room Status */}
                                            <Td>
                                                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${ROOM_COLOR[g.roomStatus] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                    {g.roomStatus}
                                                </span>
                                            </Td>
                                            {/* Payment */}
                                            <Td>
                                                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${PAY_COLOR[g.payStatus] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                    {g.payStatus}
                                                </span>
                                            </Td>
                                            {/* Action */}
                                            <Td>
                                                <Btn icon={ChevronRight} label="View" />
                                            </Td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right panel: F&B Auto-Count + RSVP summary */}
                <div className="space-y-4">
                    {/* F&B Live Count */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <div className="font-bold text-gray-900 text-sm">F&amp;B Cover Count</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">Auto-syncs with dietary tags</div>
                            </div>
                            <span className={`w-2 h-2 rounded-full bg-emerald-500 animate-pulse`} />
                        </div>
                        <div className="px-5 py-3">
                            {DIETARY_TAGS.map(tag => <FnBItem key={tag} tag={tag} />)}
                            <div className="pt-3 flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500">Total Covers</span>
                                <span className="text-base font-bold text-tbo-indigo">
                                    {Object.values(fnbBreakdown).reduce((a, b) => a + b, 0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RSVP Donut summary */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="font-bold text-gray-900 text-sm mb-3">RSVP Breakdown</div>
                        {[
                            { label: 'Confirmed', count: confirmed, color: 'bg-emerald-500' },
                            { label: 'Pending', count: pending, color: 'bg-amber-400' },
                            { label: 'Declined', count: declined, color: 'bg-red-400' },
                        ].map(({ label, count, color }) => (
                            <div key={label} className="flex items-center gap-3 mb-2.5">
                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.round(count / guests.length * 100)}%` }} />
                                </div>
                                <span className="text-xs font-bold text-gray-700 tabular-nums w-8 text-right">{count}</span>
                            </div>
                        ))}

                        <div className="mt-4 flex flex-col gap-2">
                            <Btn icon={Download} label="Export CSV" variant="outline" />
                            <Btn icon={Mail} label="Send Reminders" variant="primary" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const AllocationTab = ({ event, globalUnits, setGlobalUnits, handleInventoryUsageChange }) => {
    // ── State ──────────────────────────────────────────────────────────────────
    const units = globalUnits;
    const setUnits = setGlobalUnits;
    const [guests, setGuests] = useState(() =>
        getGuestFeed(event)
            .filter(g => g.rsvp === 'CONFIRMED')
            .map(g => ({ ...g, roomStatus: g.roomStatus }))
    );
    const [selectedGuest, setGuest] = useState(null);
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [lastAction, setLastAction] = useState(null); // { guestName, roomNo, type }
    const [contractHealth, setCH] = useState({
        filledUnits: event.confirmedGuests,
        minUnits: Math.ceil(event.headcount * 0.70),
        maxUnits: Math.ceil(event.headcount * 1.15),
    });

    const stats = getAllocationStats(units);
    const ROOM_TYPES_LIST = ['ALL', 'Deluxe Room', 'Superior Suite', 'Presidential Suite', 'Garden Cottage'];
    const visibleUnits = typeFilter === 'ALL' ? units : units.filter(u => u.type === typeFilter);

    // ── Assign handler ────────────────────────────────────────────────────────
    const handleAssign = (unit) => {
        if (unit.status !== 'FREE' || !selectedGuest) return;
        const { units: next } = assignGuestToRoom(units, unit.id, selectedGuest.name);
        setUnits(next);
        setGuests(prev => prev.map(g =>
            g.id === selectedGuest.id ? { ...g, roomStatus: 'ASSIGNED', assignedRoom: unit.roomNo } : g
        ));
        setCH(prev => recomputeContractHealthAfterAssign(prev, 1));
        setLastAction({ guestName: selectedGuest.name, roomNo: unit.roomNo, type: unit.type, action: 'ASSIGNED' });
        setGuest(null);
        
        // Sync Inventory
        handleInventoryUsageChange(unit.type, 1);
    };

    // ── Release handler ───────────────────────────────────────────────────────
    const handleRelease = (unit) => {
        const next = releaseRoom(units, unit.id);
        setUnits(next);
        setGuests(prev => prev.map(g =>
            g.assignedRoom === unit.roomNo ? { ...g, roomStatus: 'PENDING', assignedRoom: null } : g
        ));
        setCH(prev => recomputeContractHealthAfterAssign(prev, -1));
        setLastAction({ guestName: unit.assignedTo, roomNo: unit.roomNo, type: unit.type, action: 'RELEASED' });
        
        // Sync Inventory
        handleInventoryUsageChange(unit.type, -1);
    };

    const healthColor = contractHealth.status === 'SAFE' ? { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
        : contractHealth.status === 'RISK' ? { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' }
            : { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };

    const CELL_STYLE = {
        FREE: 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200 cursor-pointer',
        OCCUPIED: 'bg-gray-100   border-gray-200   text-gray-500   cursor-default',
        BLOCKED: 'bg-amber-50   border-amber-200  text-amber-700  cursor-not-allowed opacity-70',
    };

    const unassignedGuests = guests.filter(g => g.roomStatus !== 'ASSIGNED');
    const assignedGuests = guests.filter(g => g.roomStatus === 'ASSIGNED');
    const { canSeeFinance } = useAuth();

    return (
        <div>
            {/* Top stats row */}
            <div className="grid grid-cols-5 gap-4 mb-5">
                <Kpi label="Total Rooms" value={stats.total} sub="In property block" />
                <Kpi label="Free" value={stats.free} sub="Available to assign" color="text-emerald-700" />
                <Kpi label="Occupied" value={stats.occupied} sub="Assigned to guests" color="text-tbo-indigo" />
                <Kpi label="Blocked" value={stats.blocked} sub="Held by hotel" color="text-amber-600" />
                {canSeeFinance ? (
                    <Kpi label="Room Revenue" value={`$${(stats.revenue / 1000).toFixed(0)}K`} sub="3-night locked value" color="text-tbo-indigo" />
                ) : (
                    <Kpi label="Pending Guests" value={unassignedGuests.length} sub="Awaiting assignment" color="text-indigo-600" />
                )}
            </div>

            {/* Last action toast */}
            {lastAction && (
                <div className={`mb-4 flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium ${lastAction.action === 'ASSIGNED' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}>
                    {lastAction.action === 'ASSIGNED' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>
                        {lastAction.action === 'ASSIGNED'
                            ? <><strong>{lastAction.guestName}</strong> assigned to <strong>{lastAction.roomNo}</strong> ({lastAction.type})</>
                            : <><strong>{lastAction.roomNo}</strong> ({lastAction.type}) released — <strong>{lastAction.guestName}</strong> unassigned</>
                        }
                    </span>
                    <button onClick={() => setLastAction(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={14} /></button>
                </div>
            )}

            {/* Two-panel layout */}
            <div className="grid grid-cols-3 gap-5">

                {/* Left: Guest List */}
                <div className="col-span-1 space-y-3">
                    {/* Contract Health Mini-Panel */}
                    <div className={`rounded-2xl border p-4 ${healthColor.bg} ${healthColor.border}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Contract Health</span>
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${healthColor.bg} ${healthColor.text} ${healthColor.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${healthColor.dot}`} />
                                {contractHealth.status}
                            </span>
                        </div>
                        <div className="flex items-end gap-1 mb-2">
                            <span className={`text-2xl font-bold ${healthColor.text}`}>{contractHealth.filledUnits}</span>
                            <span className="text-xs text-gray-400 mb-0.5">/ {contractHealth.minUnits} min · {contractHealth.maxUnits} max</span>
                        </div>
                        <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${healthColor.dot}`}
                                style={{ width: `${Math.min(100, Math.round(contractHealth.filledUnits / contractHealth.maxUnits * 100))}%` }}
                            />
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                            {contractHealth.overAllocated ? '⚠ Over-allocation — PDC-RULE-002 triggered' : `${contractHealth.maxUnits - contractHealth.filledUnits} units to max cap`}
                        </div>
                    </div>

                    {/* Guest select panel */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <span className="text-xs font-bold text-gray-700">Unassigned Guests</span>
                            <span className="text-[10px] bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded-full">{unassignedGuests.length}</span>
                        </div>
                        <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                            {unassignedGuests.length === 0 && (
                                <div className="px-4 py-6 text-center text-sm text-gray-400">All guests assigned ✓</div>
                            )}
                            {unassignedGuests.map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => setGuest(prev => prev?.id === g.id ? null : g)}
                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${selectedGuest?.id === g.id ? 'bg-tbo-indigo/5 border-l-2 border-tbo-indigo' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-tbo-indigo/10 flex items-center justify-center text-[11px] font-bold text-tbo-indigo shrink-0">
                                        {g.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-semibold text-gray-900 text-sm truncate">{g.name}</div>
                                        <div className="text-[10px] text-gray-400">{g.dietary} · {g.pnr || 'No PNR'}</div>
                                    </div>
                                    {selectedGuest?.id === g.id && (
                                        <span className="ml-auto text-[10px] font-bold text-tbo-indigo bg-indigo-50 px-2 py-0.5 rounded-md shrink-0">SELECTED</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Assigned guests */}
                    {assignedGuests.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-emerald-50">
                                <span className="text-xs font-bold text-emerald-700">Assigned</span>
                                <span className="text-[10px] bg-emerald-200 text-emerald-700 font-bold px-2 py-0.5 rounded-full">{assignedGuests.length}</span>
                            </div>
                            <div className="max-h-40 overflow-y-auto divide-y divide-gray-50">
                                {assignedGuests.map(g => (
                                    <div key={g.id} className="px-4 py-2.5 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700 shrink-0">
                                            {g.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-gray-900 text-xs truncate">{g.name}</div>
                                            <div className="text-[10px] text-gray-400">{g.assignedRoom}</div>
                                        </div>
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md shrink-0">✓</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Room Unit Grid */}
                <div className="col-span-2">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Grid header + filter */}
                        <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2 bg-gray-50">
                            <span className="text-xs font-bold text-gray-700 mr-1">Room Grid</span>
                            {ROOM_TYPES_LIST.map(t => (
                                <button key={t} onClick={() => setTypeFilter(t)}
                                    className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${typeFilter === t ? 'bg-tbo-indigo text-white border-tbo-indigo' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                                        }`}>
                                    {t === 'ALL' ? 'All Types' : t.split(' ')[0]}
                                </button>
                            ))}
                            <span className="ml-auto text-[10px] text-gray-400">
                                {visibleUnits.filter(u => u.status === 'FREE').length} FREE of {visibleUnits.length}
                            </span>
                        </div>

                        {/* Legend */}
                        <div className="px-5 py-2 border-b border-gray-50 flex items-center gap-4 text-[10px] font-bold">
                            {[{ color: 'bg-emerald-200 border-emerald-300', label: 'FREE — click to assign' },
                            { color: 'bg-gray-200 border-gray-300', label: 'OCCUPIED' },
                            { color: 'bg-amber-100 border-amber-300', label: 'BLOCKED' },
                            { color: 'bg-blue-100 border-blue-300', label: 'ASSIGNED (this session)' },
                            ].map(l => (
                                <span key={l.label} className="flex items-center gap-1.5">
                                    <span className={`w-3 h-3 rounded border ${l.color}`} />
                                    {l.label}
                                </span>
                            ))}
                            {selectedGuest && (
                                <span className="ml-auto text-tbo-indigo animate-pulse font-bold">
                                    → Click a FREE room to assign {selectedGuest.name.split(' ')[0]}
                                </span>
                            )}
                        </div>

                        {/* Unit cells */}
                        <div className="p-5 max-h-[520px] overflow-y-auto">
                            {ROOM_TYPES_LIST.filter(t => t !== 'ALL').map(roomType => {
                                const typeUnits = visibleUnits.filter(u => u.type === roomType);
                                if (typeUnits.length === 0) return null;
                                return (
                                    <div key={roomType} className="mb-5">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{roomType}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {typeUnits.map(unit => {
                                                const isNewAssign = unit.status === 'OCCUPIED' && unit.assignedTo && !unit.assignedTo.startsWith('Guest-');
                                                const cellCls = isNewAssign
                                                    ? 'bg-blue-100 border-blue-300 text-blue-800 cursor-pointer hover:bg-blue-200'
                                                    : CELL_STYLE[unit.status] || CELL_STYLE.FREE;
                                                return (
                                                    <div
                                                        key={unit.id}
                                                        onClick={() => unit.status === 'FREE' ? handleAssign(unit) : isNewAssign ? handleRelease(unit) : null}
                                                        title={unit.status === 'FREE'
                                                            ? (selectedGuest ? `Assign ${selectedGuest.name} to ${unit.roomNo}` : 'Select a guest first')
                                                            : unit.assignedTo ? `Assigned to: ${unit.assignedTo}${isNewAssign ? ' · Click to release' : ''}` : 'Blocked by hotel'
                                                        }
                                                        className={`relative flex flex-col items-center justify-center w-16 h-14 rounded-xl border-2 text-center transition-all duration-150 select-none ${cellCls} ${unit.status === 'FREE' && selectedGuest ? 'ring-2 ring-offset-1 ring-tbo-indigo shadow-sm scale-105' : ''
                                                            }`}
                                                    >
                                                        <div className="font-mono text-[10px] font-bold leading-tight">{unit.roomNo}</div>
                                                        <div className="text-[9px] opacity-70 leading-none mt-0.5">
                                                            ${unit.ratePerNight}
                                                        </div>
                                                        {isNewAssign && (
                                                            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-tbo-indigo rounded-full border-2 border-white" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const TransportTab = ({ globalInventory }) => {
    const d = getTransportData(globalInventory);
    return (
        <div>
            <Panel title="Flight Manifest" action={<Btn icon={Plus} label="Add Flight" variant="primary" />}>
                <table className="w-full">
                    <thead><tr><Th>Flight No.</Th><Th>Route</Th><Th>Date / Time</Th><Th>Seats Blocked</Th><Th>Confirmed</Th><Th>Status</Th></tr></thead>
                    <tbody>
                        {d.flights.map((f, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                                <Td><span className="font-bold font-mono text-tbo-indigo">{f.flightNo}</span></Td>
                                <Td className="font-semibold">{f.route}</Td>
                                <Td className="text-gray-500">{f.datetime}</Td>
                                <Td>{f.seats}</Td>
                                <Td><span className="font-bold text-emerald-700">{f.confirmed}</span></Td>
                                <Td><Badge label={f.status} /></Td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Panel>
            <Panel title="Ground Transport" action={<Btn icon={Plus} label="Add Vehicle" variant="primary" />}>
                <table className="w-full">
                    <thead><tr><Th>Vehicle</Th><Th>Qty</Th><Th>Route</Th><Th>Schedule</Th><Th>Status</Th><Th>Action</Th></tr></thead>
                    <tbody>
                        {d.groundTransport.map((g, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                                <Td><span className="font-semibold text-gray-900">{g.vehicle}</span></Td>
                                <Td>{g.qty}</Td>
                                <Td className="text-gray-500">{g.route}</Td>
                                <Td className="text-gray-500">{g.datetime}</Td>
                                <Td><Badge label={g.status} /></Td>
                                <Td><Btn icon={FileText} label="Edit" /></Td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Panel>
        </div>
    );
};

const VendorsTab = () => {
    const d = getVendorData();
    const total = d.vendors.reduce((s, v) => s + v.amount, 0);
    return (
        <Panel title="Vendor Registry" action={<Btn icon={Plus} label="Add Vendor" variant="primary" />}>
            <table className="w-full">
                <thead><tr><Th>Vendor Name</Th><Th>Category</Th><Th>Contact</Th><Th>Amount</Th><Th>Status</Th><Th>Payment</Th><Th>Action</Th></tr></thead>
                <tbody>
                    {d.vendors.map((v, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                            <Td><span className="font-semibold text-gray-900">{v.name}</span></Td>
                            <Td className="text-gray-500">{v.category}</Td>
                            <Td className="text-gray-500">{v.contact}</Td>
                            <Td className="font-mono font-bold">${v.amount.toLocaleString()}</Td>
                            <Td><Badge label={v.status} /></Td>
                            <Td><Badge label={v.paymentStatus} /></Td>
                            <Td><Btn icon={ExternalLink} label="Contract" /></Td>
                        </tr>
                    ))}
                    <tr className="bg-gray-50">
                        <Td colSpan={3}><span className="font-bold text-gray-800">Total Vendor Spend</span></Td>
                        <Td><span className="font-bold font-mono text-tbo-indigo">${total.toLocaleString()}</span></Td>
                        <Td colSpan={3} />
                    </tr>
                </tbody>
            </table>
        </Panel>
    );
};

const PaymentsTab = ({ event, handleExportInvoice }) => {
    const d = getPaymentData(event);
    return (
        <div>
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Kpi label="Total Contract Value" value={`$${(d.totalValue / 1000).toFixed(0)}K`} sub="Gross event value" color="text-tbo-indigo" />
                <Kpi label="Amount Paid" value={`$${(d.totalPaid / 1000).toFixed(0)}K`} sub="50% collected" color="text-emerald-700" />
                <Kpi label="Outstanding Balance" value={`$${(d.outstanding / 1000).toFixed(0)}K`} sub="Due before event" color="text-red-600" />
            </div>
            <Panel title="Payment Schedule" action={<Btn icon={Download} label="Download Invoice" onClick={handleExportInvoice} />}>
                <table className="w-full">
                    <thead><tr><Th>Description</Th><Th>Amount</Th><Th>Due Date</Th><Th>Paid Date</Th><Th>Status</Th><Th>Action</Th></tr></thead>
                    <tbody>
                        {d.schedule.map((p, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                                <Td><span className="font-medium text-gray-900">{p.description}</span></Td>
                                <Td className="font-mono font-bold">${p.amount.toLocaleString()}</Td>
                                <Td className="text-gray-500">{p.dueDate}</Td>
                                <Td className="text-gray-500">{p.paidDate}</Td>
                                <Td><Badge label={p.status} /></Td>
                                <Td>
                                    {p.status !== 'PAID' && <Btn icon={CreditCard} label="Pay Now" variant="primary" />}
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Panel>
        </div>
    );
};

const ExecutionTab = ({ event }) => {
    // 1. Wrap the initial static data in state so we can mutate it
    const [executionData, setExecutionData] = useState(() => getExecutionData(event));
    
    // 2. Handlers to update specific tasks
    const handleMarkDone = (dayIndex, taskIndex) => {
        setExecutionData(prev => {
            const next = { ...prev };
            const nextDays = [...next.days];
            const nextTasks = [...nextDays[dayIndex].tasks];
            
            nextTasks[taskIndex] = { ...nextTasks[taskIndex], status: 'DONE' };
            nextDays[dayIndex] = { ...nextDays[dayIndex], tasks: nextTasks };
            return { ...next, days: nextDays };
        });
    };

    const handleMarkDelay = (dayIndex, taskIndex) => {
        setExecutionData(prev => {
            const next = { ...prev };
            const nextDays = [...next.days];
            const nextTasks = [...nextDays[dayIndex].tasks];
            
            nextTasks[taskIndex] = { ...nextTasks[taskIndex], status: 'DELAYED' };
            nextDays[dayIndex] = { ...nextDays[dayIndex], tasks: nextTasks };
            return { ...next, days: nextDays };
        });
    };

    const handleMarkAllDone = (dayIndex) => {
        setExecutionData(prev => {
            const next = { ...prev };
            const nextDays = [...next.days];
            const nextTasks = nextDays[dayIndex].tasks.map(t => ({ ...t, status: 'DONE' }));
            
            nextDays[dayIndex] = { ...nextDays[dayIndex], tasks: nextTasks };
            return { ...next, days: nextDays };
        });
    };

    return (
        <div className="space-y-6">
            {executionData.days.map((day, di) => (
                <Panel key={di} title={`${day.day} — ${day.label}`} action={<Btn icon={CheckSquare} label="Mark All Done" onClick={() => handleMarkAllDone(di)} />}>
                    <table className="w-full">
                        <thead><tr><Th>Time</Th><Th>Task</Th><Th>Owner</Th><Th>Status</Th><Th>Action</Th></tr></thead>
                        <tbody>
                            {day.tasks.map((t, i) => (
                                <tr key={i} className={`hover:bg-gray-50 transition-colors ${t.status === 'DONE' ? 'opacity-50' : ''}`}>
                                    <Td><span className="font-mono text-xs text-tbo-saffron font-bold whitespace-nowrap">{t.time}</span></Td>
                                    <Td><span className={`font-medium ${t.status === 'DONE' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{t.task}</span></Td>
                                    <Td className="text-gray-500 text-xs">{t.owner}</Td>
                                    <Td><Badge label={t.status} /></Td>
                                    <Td>
                                        <div className="flex gap-1.5">
                                            {t.status !== 'DONE' && (
                                                <>
                                                    <Btn icon={CheckSquare} label="Done" onClick={() => handleMarkDone(di, i)} />
                                                    <Btn icon={Clock} label="Delay" onClick={() => handleMarkDelay(di, i)} />
                                                </>
                                            )}
                                        </div>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Panel>
            ))}
        </div>
    );
};

// ── Main EventDetail Component ───────────────────────────────────────────────

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const containerRef = useRef(null);
    const [activeTab, setActiveTab] = useState('overview');

    const event = getMockEventById(id);
    const cs = getContractStatusStyle(event.contractStatus);

    // ── Lifted State for Inventory & Allocation Sync ──────────────────────────
    const [globalInventory, setGlobalInventory] = useState(() => getEventInventory(event));
    const [globalUnits, setGlobalUnits] = useState(() => {
        const initInv = getEventInventory(event);
        return getRoomUnitGrid(event, initInv);
    });

    const [globalGuests, setGlobalGuests] = useState([]);
    const [fnbBreakdown, setFnbBreakdown] = useState({});
    const [lastUpdate, setLastUpdate] = useState(null);

    // Fetch initial list and setup socket listener for Guests
    useEffect(() => {
        const fetchState = async () => {
            try {
                let res = await guestApi.getByEvent(id || event.id);
                if (!res || res.length === 0) {
                    res = getGuestFeed(event);
                }
                setGlobalGuests(res);
                setFnbBreakdown(computeFnBBreakdown(res));
                setLastUpdate(new Date().toLocaleTimeString());
            } catch (err) {
                console.error('Failed to load guests', err);
                const res = getGuestFeed(event);
                setGlobalGuests(res);
                setFnbBreakdown(computeFnBBreakdown(res));
                setLastUpdate(new Date().toLocaleTimeString());
            }
        };

        if (event) fetchState();

        const handleGuestUpdate = (updatedGuest) => {
            setGlobalGuests(prev => {
                const exists = prev.some(g => g.email === updatedGuest.email);
                let newList;
                if (exists) {
                    newList = prev.map(g => g.email === updatedGuest.email ? updatedGuest : g);
                } else {
                    newList = [updatedGuest, ...prev];
                }
                setFnbBreakdown(computeFnBBreakdown(newList));
                setLastUpdate(new Date().toLocaleTimeString());
                return newList;
            });
        };

        socket.on('guest:update', handleGuestUpdate);
        return () => {
            socket.off('guest:update', handleGuestUpdate);
        };
    }, [id, event]);

    const handleDietaryChange = (guestId, newTag) => {
        setGlobalGuests(prev => {
            const updated = prev.map(g => g.id === guestId ? { ...g, dietary: newTag, _flash: true } : g);
            setFnbBreakdown(computeFnBBreakdown(updated));
            return updated;
        });
    };

    // Derived live event state for sync consistent UI
    const liveEvent = useMemo(() => ({
        ...event,
        confirmedGuests: globalGuests.filter(g => g.rsvp === 'CONFIRMED').length
    }), [event, globalGuests]);

    // Sync handler: when an allocation changes, update the inventory used count
    const handleInventoryUsageChange = (roomType, delta) => {
        setGlobalInventory(prev => {
            const accIndex = prev.findIndex(cat => cat.key === 'accommodation');
            if (accIndex === -1) return prev;
            
            const next = [...prev];
            const accCat = { ...next[accIndex], items: [...next[accIndex].items] };
            
            // Map Room Type strings to Inventory Item Names
            const typeMap = {
                'Deluxe Room': 'Deluxe Rooms',
                'Superior Suite': 'Superior Suites',
                'Presidential Suite': 'Presidential Suite',
                'Garden Cottage': 'Garden Cottages'
            };
            const targetItemName = typeMap[roomType];
            
            const itemIdx = accCat.items.findIndex(it => it.name === targetItemName);
            if (itemIdx >= 0) {
                const updatedItem = { ...accCat.items[itemIdx] };
                updatedItem.used = Math.max(0, updatedItem.used + delta);
                accCat.items[itemIdx] = updatedItem;
                
                // Recalculate category total used
                accCat.used = accCat.items.reduce((s, it) => s + it.used, 0);
                next[accIndex] = accCat;
            }
            return next;
        });
    };

    useEffect(() => {
        if (!user) { navigate('/agent/login'); return; }
        const ctx = gsap.context(() => {
            gsap.from('.detail-header', { y: -10, opacity: 0, duration: 0.4, ease: 'power2.out' });
            gsap.from('.tab-content', { y: 12, opacity: 0, duration: 0.35, ease: 'power2.out', delay: 0.1 });
        }, containerRef);
        return () => ctx.revert();
    }, [user, navigate]);

    useEffect(() => {
        if (id) joinEventRoom(id);
    }, [id]);

    useEffect(() => {
        if (containerRef.current) {
            gsap.from('.tab-content', { y: 8, opacity: 0, duration: 0.3, ease: 'power2.out' });
        }
    }, [activeTab]);

    if (!user) return null;

    const handleEmailBlast = () => {
        alert("Email blast has been queued for sending to all confirmed guests.");
    };

    const handleExportReport = () => {
        try {
            const columns = ["Metric", "Value"];
            const rows = Object.entries(event.summary).map(([k, v]) => [
                k.replace(/([A-Z])/g, ' $1').toUpperCase(),
                String(v)
            ]);
            exportToPDF(columns, rows, `${event.clientName} - Event Execution Report`, `${event.clientName.replace(/\s+/g, '_')}_Report.pdf`);
        } catch(err) {
            console.error(err);
        }
    };

    const handleExportCSV = async () => {
        try {
            let freshGuests = await guestApi.getByEvent(event.id);
            if (!freshGuests || freshGuests.length === 0) {
                freshGuests = getGuestFeed(event);
            }
            const data = freshGuests.map(g => ({
                'Name': g.name,
                'Email': g.email,
                'Phone': g.phone,
                'RSVP': g.rsvp,
                'Dietary': g.dietary,
                'Addons': Array.isArray(g.addons) ? g.addons.join(", ") : g.addons,
                'Created At': g.createdAt ? new Date(g.createdAt).toLocaleString() : 'N/A'
            }));
            exportToCSV(data, `${event.clientName}_Guests.csv`);
        } catch (err) {
            console.error(err);
            // Fallback gracefully on API catch
            const freshGuests = getGuestFeed(event);
            const data = freshGuests.map(g => ({
                'Name': g.name,
                'Email': g.email,
                'Phone': g.phone,
                'RSVP': g.rsvp,
                'Dietary': g.dietary,
                'Addons': Array.isArray(g.addons) ? g.addons.join(", ") : g.addons,
                'Created At': g.createdAt ? new Date(g.createdAt).toLocaleString() : 'N/A'
            }));
            exportToCSV(data, `${event.clientName}_Guests.csv`);
        }
    };

    const handleExportPDF = async () => {
        try {
            let freshGuests = await guestApi.getByEvent(event.id);
            if (!freshGuests || freshGuests.length === 0) {
                freshGuests = getGuestFeed(event);
            }
            const columns = ['Name', 'Email', 'Phone', 'RSVP', 'Dietary'];
            const rows = freshGuests.map(g => [
                g.name,
                g.email,
                g.phone,
                g.rsvp,
                g.dietary
            ]);
            exportToPDF(columns, rows, `${event.clientName} - Guest Manifest`, `${event.clientName.replace(/\s+/g, '_')}_Manifest.pdf`);
        } catch (err) {
            console.error(err);
            // Fallback gracefully on API catch
            const freshGuests = getGuestFeed(event);
            const columns = ['Name', 'Email', 'Phone', 'RSVP', 'Dietary'];
            const rows = freshGuests.map(g => [
                g.name,
                g.email,
                g.phone,
                g.rsvp,
                g.dietary
            ]);
            exportToPDF(columns, rows, `${event.clientName} - Guest Manifest`, `${event.clientName.replace(/\s+/g, '_')}_Manifest.pdf`);
        }
    };
    const handleExportInvoice = () => {
        try {
            const d = getPaymentData(event);
            const columns = ['Description', 'Amount', 'Due Date', 'Paid Date', 'Status'];
            const rows = d.schedule.map(p => [
                p.description,
                `$${p.amount.toLocaleString()}`,
                p.dueDate,
                p.paidDate,
                p.status
            ]);
            exportToPDF(columns, rows, `${event.clientName} - Invoice`, `${event.clientName.replace(/\s+/g, '_')}_Invoice.pdf`);
        } catch (err) {
            console.error(err);
        }
    };

    const tabProps = { 
        event: liveEvent, 
        handleEmailBlast, 
        handleExportReport,
        handleExportCSV,
        handleExportPDF,
        handleExportInvoice,
        // Pass down lifted state and handlers
        globalInventory, setGlobalInventory,
        globalUnits, setGlobalUnits,
        handleInventoryUsageChange,
        globalGuests, setGlobalGuests,
        fnbBreakdown, setFnbBreakdown,
        lastUpdate, handleDietaryChange
    };

    const renderTab = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab {...tabProps} />;
            case 'contract': return <ContractTab {...tabProps} />;
            case 'inventory': return <InventoryTab {...tabProps} />;
            case 'hotels': return <HotelsTab {...tabProps} />;
            case 'flights': return <FlightsTab {...tabProps} />;
            case 'guests': return <GuestsTab {...tabProps} />;
            case 'allocation': return <AllocationTab {...tabProps} />;
            case 'transport': return <TransportTab {...tabProps} />;
            case 'vendors': return <VendorsTab {...tabProps} />;
            case 'payments': return <PaymentsTab {...tabProps} />;
            case 'execution': return <ExecutionTab {...tabProps} />;
            default: return null;
        }
    };



    return (
        <div ref={containerRef} className="min-h-screen flex bg-[#F8F9FB] font-sans">
            <Sidebar onNavigate={navigate} onLogout={() => { logout(); navigate('/'); }} />

            <main className="flex-1 ml-64 flex flex-col">

                {/* Sticky Page Header */}
                <div className="detail-header bg-white border-b border-gray-100 px-8 py-5 sticky top-0 z-20 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/agent/dashboard')}
                                className="flex items-center gap-1.5 text-gray-400 hover:text-tbo-indigo text-sm font-semibold transition-colors"
                            >
                                <ArrowLeft size={16} /> Dashboard
                            </button>
                            <span className="text-gray-200">|</span>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="font-bold text-lg text-gray-900">{liveEvent.clientName}</h1>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cs.bg} ${cs.text} ${cs.border}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${cs.dot}`} /> {liveEvent.contractStatus}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                                    <span className="flex items-center gap-1"><MapPin size={11} /> {liveEvent.destination}</span>
                                    <span>·</span>
                                    <span>{liveEvent.dates}</span>
                                    <span>·</span>
                                    <span>Cutoff: {liveEvent.cutoffDate}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Btn icon={Globe} label="View Microsite" onClick={() => navigate(`/microsite/${event.id}`)} />
                            <Btn icon={Download} label="Export CSV" onClick={handleExportCSV} />
                            <Btn icon={Download} label="Export PDF" onClick={handleExportPDF} />
                        </div>
                    </div>

                    {/* Tab Bar */}
                    <div className="flex gap-1 mt-4 overflow-x-auto pb-px">
                        {TABS.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === key
                                    ? 'bg-tbo-indigo text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="tab-content flex-1 p-8 overflow-y-auto">
                    {renderTab()}
                </div>
            </main>
        </div>
    );
};

export default EventDetail;
