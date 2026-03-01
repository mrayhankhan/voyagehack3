import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck, PackageCheck, Users, TrendingUp, ShieldAlert,
  AlertTriangle, AlertCircle, MapPin, ExternalLink, Plus, ChevronRight, Briefcase
} from 'lucide-react';

// Hooks
import { useAuth } from '../hooks/useAuth';

// Services
import { MOCK_EVENTS, getContractStatusStyle, getRiskAlerts, getInventoryUsagePct } from '../services/event.service';
import { getCommandCenterMetrics } from '../services/exchange.service';

// Components
import Sidebar from '../components/layout/Sidebar';
import StatCard from '../components/ui/StatCard';
// import EventTable from '../components/Dashboard/EventTable'; // This was commented out in the thought process, but not explicitly in the instruction. I will only add StatCard.

// ── Sub-components ─────────────────────────────────────────────────────────────

const ContractBadge = ({ status }) => {
  const s = getContractStatusStyle(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
};

const InventoryBar = ({ pct }) => {
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 55 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2.5 min-w-[110px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold tabular-nums text-gray-600 w-8 text-right">{pct}%</span>
    </div>
  );
};

const RiskAlert = ({ alert }) => {
  const isHigh = alert.severity === 'high';
  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${isHigh ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
      {isHigh
        ? <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
        : <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
      }
      <div>
        <div className="text-sm font-bold text-gray-800 mb-0.5">{alert.event.clientName}</div>
        <div className="text-xs text-gray-500 leading-relaxed">{alert.message}</div>
        <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
          <MapPin size={11} /> {alert.event.destination}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────────

const Dashboard = () => {
  const container = useRef(null);
  const navigate = useNavigate();
  const { user, logout, canSeeFinance, canSeeMargin } = useAuth();

  const events = MOCK_EVENTS;
  const metrics = getCommandCenterMetrics(events);
  const riskAlerts = getRiskAlerts(events);

  const [filter, setFilter] = useState('ALL');
  const filtered = filter === 'ALL' ? events : events.filter(e => e.contractStatus === filter);

  useEffect(() => {
    if (!user) { navigate('/agent/login'); return; }
    const ctx = gsap.context(() => {
      gsap.from('.metric-card', { y: 16, opacity: 0, stagger: 0.07, duration: 0.5, ease: 'power2.out' });
      gsap.from('.table-row', { y: 10, opacity: 0, stagger: 0.05, duration: 0.4, ease: 'power2.out', delay: 0.3 });
      gsap.from('.alert-panel', { x: 16, opacity: 0, duration: 0.5, ease: 'power2.out', delay: 0.4 });
    }, container);
    return () => ctx.revert();
  }, [user, navigate]);

  if (!user) return null;

  const TOP_METRICS = [
    {
      icon: CalendarCheck, label: 'Total Events',
      value: metrics.totalEvents,
      sub: 'Active portfolio',
      accent: { iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', valueColor: 'text-gray-900' },
    },
    {
      icon: PackageCheck, label: 'Locked Inventory Value',
      value: `$${(metrics.lockedInventoryValue / 1000).toFixed(0)}K`,
      sub: 'Confirmed blocks total',
      accent: { iconBg: 'bg-teal-50', iconColor: 'text-teal-600', valueColor: 'text-teal-700' },
    },
    {
      icon: Users, label: 'Confirmed Guests',
      value: metrics.confirmedGuests.toLocaleString(),
      sub: 'Across all active events',
      accent: { iconBg: 'bg-violet-50', iconColor: 'text-violet-600', valueColor: 'text-violet-700' },
    },
    {
      icon: TrendingUp, label: 'Avg. Margin',
      value: `${metrics.avgMarginPct}%`,
      sub: 'Weighted across portfolio',
      accent: { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', valueColor: 'text-emerald-700' },
    },
    {
      icon: ShieldAlert, label: 'Contracts At Risk',
      value: metrics.contractsAtRisk,
      sub: 'Need immediate action',
      accent: {
        iconBg: metrics.contractsAtRisk > 0 ? 'bg-red-50' : 'bg-gray-50',
        iconColor: metrics.contractsAtRisk > 0 ? 'text-red-600' : 'text-gray-400',
        valueColor: metrics.contractsAtRisk > 0 ? 'text-red-700' : 'text-gray-400',
      },
    },
  ];

  const FILTER_TABS = ['ALL', 'SAFE', 'RISK', 'BREACH'];

  return (
    <div ref={container} className="min-h-screen flex bg-[#F8F9FB] font-sans">
      <Sidebar onNavigate={navigate} onLogout={() => { logout(); navigate('/'); }} />

      <main className="flex-1 ml-64 flex flex-col min-h-screen">

        {/* Page Header */}
        <div className="bg-white border-b border-gray-100 px-10 py-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="font-bold text-xl text-gray-900 tracking-tight">Event Command Center</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => navigate('/agent/create')}
            className="flex items-center gap-2 bg-tbo-indigo text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#2A1B4E] transition-colors shadow-sm"
          >
            <Plus size={16} /> New Event
          </button>
        </div>

        <div className="flex flex-1 gap-0">

          {/* Left: Metrics + Table */}
          <div className="flex-1 p-8 flex flex-col gap-8 overflow-auto">

            {/* Top 5 Metric Cards */}
            {/* Replaced with new StatCard block */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <StatCard icon={CalendarCheck} label="Active Events" value={MOCK_EVENTS.length} subtext="+2 this week" />
              <StatCard icon={Users} label="Total Pax Managed" value="1,240" subtext="Across all events" color="text-indigo-600" />

              {canSeeFinance ? (
                <StatCard icon={Briefcase} label="Locked Inventory Value" value="$2.4M" subtext="In active contracts" color="text-emerald-600" />
              ) : (
                <StatCard icon={Briefcase} label="Room Blocks" value="450" subtext="Total locked rooms" color="text-emerald-600" />
              )}

              {canSeeMargin ? (
                <StatCard icon={TrendingUp} label="Avg. Margin" value="6.2%" subtext="+0.4% from last quarter" color="text-amber-600" />
              ) : (
                <StatCard icon={TrendingUp} label="Fill Rate" value="84%" subtext="Overall utilization" color="text-amber-600" />
              )}
            </div>


            {/* Master Event Tracker */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="font-bold text-gray-900 text-base">Master Event Tracker</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{events.length} events in portfolio</p>
                </div>
                {/* Filter tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  {FILTER_TABS.map(tab => (
                    <button
                      key={tab}
                      onClick={() => setFilter(tab)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filter === tab
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Event Name', 'Location', 'Dates', 'Contract Status', 'Inventory Usage', 'Margin', ''].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((ev) => {
                      const usagePct = getInventoryUsagePct(ev);
                      return (
                        <tr key={ev.id} className="table-row hover:bg-gray-50/60 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900 text-sm">{ev.clientName}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{ev.headcount} pax contracted</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                              {ev.destination}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 font-medium">{ev.dates}</div>
                            <div className="text-xs text-gray-400 mt-0.5">Cutoff: {ev.cutoffDate}</div>
                          </td>
                          <td className="px-6 py-4">
                            <ContractBadge status={ev.contractStatus} />
                          </td>
                          <td className="px-6 py-4">
                            <InventoryBar pct={usagePct} />
                            <div className="text-xs text-gray-400 mt-1">
                              {ev.confirmedGuests} / {ev.headcount} confirmed
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-gray-900">{ev.marginPct}%</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              ${Math.round((ev.confirmedGuests / ev.headcount) * ev.budget * (ev.marginPct / 100)).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => navigate(`/agent/event/${ev.id}`)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-tbo-indigo bg-indigo-50 hover:bg-tbo-indigo hover:text-white px-3 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                              Manage <ExternalLink size={11} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                          No events match this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Risk Panel */}
          <div className="alert-panel w-72 flex-shrink-0 border-l border-gray-100 bg-white p-6 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-gray-900 text-sm">Risk Alerts</h2>
              {riskAlerts.length > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {riskAlerts.length}
                </span>
              )}
            </div>

            {riskAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                  <ShieldAlert size={20} className="text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-gray-600">All Clear</p>
                <p className="text-xs text-gray-400 mt-1">No contracts currently at risk.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {riskAlerts.map((alert, i) => <RiskAlert key={i} alert={alert} />)}
              </div>
            )}

            {/* Divider + Summary */}
            <div className="mt-auto pt-4 border-t border-gray-100">
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest mb-3">Portfolio Health</p>
              {['SAFE', 'RISK', 'BREACH'].map(status => {
                const count = events.filter(e => e.contractStatus === status).length;
                const s = getContractStatusStyle(status);
                const pct = Math.round((count / events.length) * 100);
                return (
                  <div key={status} className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                      <span className="text-xs text-gray-600 font-medium">{status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.dot}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Link */}
            <button
              onClick={() => navigate('/agent/create')}
              className="flex items-center justify-center gap-2 w-full bg-tbo-indigo text-white py-3 rounded-xl text-sm font-bold hover:bg-[#2A1B4E] transition-colors mt-2"
            >
              <Plus size={15} /> New Event <ChevronRight size={14} />
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
