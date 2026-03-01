/**
 * FlightsTab — Agent flight search using TBO (Tektravels) UAT API.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plane, Clock, Package, CheckCircle2,
  Loader2, X, ArrowRight, User, ChevronDown,
} from 'lucide-react';
import { flightApi, inventoryBlockApi } from '../services/api.service';
import SmartAutocomplete from './SmartAutocomplete';

const Kpi = ({ label, value, sub, color = 'text-gray-900' }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-1">
    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
    <span className={`text-2xl font-bold tracking-tight ${color}`}>{value}</span>
    {sub && <span className="text-xs text-gray-400">{sub}</span>}
  </div>
);

const SkeletonCard = () => (
  <div className="flex items-center gap-5 px-6 py-5 animate-pulse">
    <div className="w-12 h-12 rounded-xl bg-gray-200" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
    <div className="w-20 h-8 bg-gray-200 rounded-lg" />
  </div>
);

const TBOBadge = () => (
  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 ml-auto">
    TBO
  </span>
);

const CABIN_OPTIONS = [
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'PREMIUM_ECONOMY', label: 'Prem. Economy' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'FIRST', label: 'First Class' },
];

const TITLE_OPTIONS = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'];

const defaultPassenger = () => ({
  Title: 'Mr', FirstName: '', LastName: '',
  DateOfBirth: '', PassportNo: '', Nationality: 'IN',
  Email: '', ContactNo: '',
});

const FlightsTab = ({ event }) => {
  const [selectedFrom, setSelectedFrom] = useState(null);
  const [selectedTo, setSelectedTo] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [cabin, setCabin] = useState('ECONOMY');
  const [adults, setAdults] = useState(1);
  const [searching, setSearching] = useState(false);
  const [flights, setFlights] = useState([]);
  const [currentTraceId, setCurrentTraceId] = useState(null);
  const [searchDone, setSearchDone] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Lock modal
  const [lockModal, setLockModal] = useState(null);
  const [lockUnits, setLockUnits] = useState(30);
  const [sellPrice, setSellPrice] = useState(0);
  const [releaseDate, setReleaseDate] = useState('');
  const [passengers, setPassengers] = useState([defaultPassenger()]);
  const [locking, setLocking] = useState(false);
  const [lockSuccess, setLockSuccess] = useState(null);
  const [showPassengerForm, setShowPassengerForm] = useState(false);

  // Locked inventory
  const [lockedBlocks, setLockedBlocks] = useState([]);

  useEffect(() => { fetchBlocks(); }, [event.id]);

  const fetchBlocks = async () => {
    try {
      const blocks = await inventoryBlockApi.getByEvent(event.id, 'flight');
      setLockedBlocks(blocks);
    } catch { setLockedBlocks([]); }
  };

  const fetchAirportSuggestions = useCallback(async (query) => {
    const results = await flightApi.autocomplete(query);
    return results.map(r => ({
      ...r,
      label: r.label || `${r.city || r.name} (${r.code})`,
      sublabel: r.sublabel || `${r.name} · ${r.country}`,
    }));
  }, []);

  const handleSearch = async () => {
    if (!selectedFrom || !selectedTo || !dateFrom) return;
    setSearching(true);
    setSearchDone(false);
    setSearchError(null);
    try {
      const result = await flightApi.search({
        origin: selectedFrom.code,
        destination: selectedTo.code,
        departureDate: dateFrom,
        returnDate: dateTo || undefined,
        travelClass: cabin,
        adults,
      });
      // TBO returns { flights, traceId }
      setFlights(result.flights || []);
      setCurrentTraceId(result.traceId || null);
    } catch (err) {
      setSearchError(err.message || 'Flight search failed. Check TBO UAT connectivity.');
      setFlights([]);
    } finally {
      setSearching(false);
      setSearchDone(true);
    }
  };

  const openLockModal = (flight) => {
    setLockModal(flight);
    setLockUnits(30);
    setSellPrice(Math.round(flight.price * 1.12));
    setReleaseDate('');
    setPassengers([defaultPassenger()]);
    setShowPassengerForm(false);
  };

  const updatePassenger = (idx, field, value) => {
    setPassengers(ps => ps.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handleLockConfirm = async () => {
    if (!lockModal) return;
    setLocking(true);
    try {
      const traceId = lockModal.traceId || currentTraceId;
      await inventoryBlockApi.lock({
        eventId: event.id,
        type: 'flight',
        provider: 'tbo',
        supplier: `${lockModal.airlines.join('+')} — ${lockModal.flyFrom}→${lockModal.flyTo} (${lockModal.flightNumber})`,
        providerRefId: lockModal.resultIndex || lockModal.id,
        providerOfferId: lockModal.id,
        providerData: {
          ...lockModal,
          traceId,
          passengerTemplate: passengers[0], // lead passenger template for booking
        },
        lockedUnits: lockUnits,
        costPerUnit: lockModal.price,
        sellPerUnit: sellPrice || Math.round(lockModal.price * 1.12),
        releaseDate: releaseDate || null,
      });
      setLockSuccess(`${lockModal.flyFrom}→${lockModal.flyTo}`);
      setLockModal(null);
      fetchBlocks();
      setTimeout(() => setLockSuccess(null), 3000);
    } catch (err) {
      console.error('Lock failed:', err);
    } finally {
      setLocking(false);
    }
  };

  const totalLocked = lockedBlocks.reduce((s, b) => s + b.lockedUnits, 0);
  const totalAllocated = lockedBlocks.reduce((s, b) => s + b.allocatedUnits, 0);
  const totalAvailable = lockedBlocks.reduce((s, b) => s + b.availableUnits, 0);

  return (
    <div>
      {lockSuccess && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl animate-pulse">
          <CheckCircle2 size={18} />
          <span className="font-semibold text-sm">Locked: {lockSuccess}</span>
        </div>
      )}

      {/* ── Lock Modal ─────────────────────────────────────────── */}
      {lockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 mx-4">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center">
                  <Plane size={22} className="text-sky-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-base">Lock Seats for Event</div>
                  <div className="text-xs text-gray-400">{event.clientName}</div>
                </div>
              </div>
              <button onClick={() => setLockModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {/* Flight summary */}
            <div className="bg-sky-50 rounded-2xl p-4 mb-5 border border-sky-100">
              <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                <span>{lockModal.flyFromCity || lockModal.flyFrom}</span>
                <ArrowRight size={14} className="text-gray-400" />
                <span>{lockModal.flyToCity || lockModal.flyTo}</span>
                <TBOBadge />
              </div>
              <div className="text-xs text-gray-500 mt-1.5 flex flex-wrap gap-3">
                <span>{lockModal.airlines.join(', ')}</span>
                <span>·</span>
                <span>₹{lockModal.price.toLocaleString('en-IN')}/seat</span>
                <span>·</span>
                <span>{lockModal.duration.hours}h {lockModal.duration.minutes}m</span>
                <span>·</span>
                <span>{lockModal.stops === 0 ? 'Direct' : `${lockModal.stops} stop(s)`}</span>
                {lockModal.flightNumber && <><span>·</span><span>{lockModal.flightNumber}</span></>}
              </div>
              {lockModal.departure && (
                <div className="text-xs text-gray-400 mt-1">
                  Departs: {new Date(lockModal.departure).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              )}
            </div>

            {/* Lock settings */}
            <div className="space-y-4 mb-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">Number of Seats</label>
                  <input type="number" min="1" max="300" value={lockUnits}
                    onChange={e => setLockUnits(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-400 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">Sell Price / Seat (₹)</label>
                  <input type="number" min="0" value={sellPrice}
                    onChange={e => setSellPrice(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-400 text-sm" />
                  <div className="text-xs text-gray-400 mt-1">
                    Margin: ₹{(sellPrice - lockModal.price).toLocaleString('en-IN')}/seat
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-1">Release Date</label>
                <input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-400 text-sm" />
              </div>
            </div>

            {/* Passenger template (collapsible) */}
            <button
              onClick={() => setShowPassengerForm(v => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-sky-600 mb-3 hover:text-sky-800 transition-colors w-full"
            >
              <User size={15} />
              Lead Passenger Template (for TBO booking)
              <ChevronDown size={14} className={`ml-auto transition-transform ${showPassengerForm ? 'rotate-180' : ''}`} />
            </button>

            {showPassengerForm && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Title</label>
                    <select value={passengers[0].Title} onChange={e => updatePassenger(0, 'Title', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                      {TITLE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">First Name</label>
                    <input value={passengers[0].FirstName} onChange={e => updatePassenger(0, 'FirstName', e.target.value)}
                      placeholder="John" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Last Name</label>
                    <input value={passengers[0].LastName} onChange={e => updatePassenger(0, 'LastName', e.target.value)}
                      placeholder="Doe" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date of Birth</label>
                    <input type="date" value={passengers[0].DateOfBirth} onChange={e => updatePassenger(0, 'DateOfBirth', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Passport No</label>
                    <input value={passengers[0].PassportNo} onChange={e => updatePassenger(0, 'PassportNo', e.target.value)}
                      placeholder="A1234567" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                    <input type="email" value={passengers[0].Email} onChange={e => updatePassenger(0, 'Email', e.target.value)}
                      placeholder="guest@example.com" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Contact No</label>
                    <input value={passengers[0].ContactNo} onChange={e => updatePassenger(0, 'ContactNo', e.target.value)}
                      placeholder="9876543210" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                  </div>
                </div>
              </div>
            )}

            {locking ? (
              <div className="flex flex-col items-center py-4">
                <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mb-3" />
                <div className="text-sm text-gray-500">Locking seats via TBO...</div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setLockModal(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleLockConfirm} className="flex-1 py-3 rounded-xl bg-sky-600 text-white text-sm font-bold hover:bg-sky-700 flex items-center justify-center gap-2">
                  <Package size={15} /> Lock {lockUnits} Seats
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── KPI Bar ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Kpi label="Flight Blocks" value={lockedBlocks.length} sub="Active routes" />
        <Kpi label="Seats Locked" value={totalLocked} sub="Total capacity" color="text-sky-700" />
        <Kpi label="Allocated" value={totalAllocated} sub="Guest bookings" color="text-emerald-700" />
        <Kpi label="Available" value={totalAvailable} sub="Remaining" color="text-amber-600" />
      </div>

      {/* ── Search Panel ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Search size={16} className="text-sky-600" />
          <h3 className="font-bold text-gray-900 text-sm">Search Flights</h3>
          <TBOBadge />
        </div>

        <div className="grid grid-cols-5 gap-4 mb-4">
          <SmartAutocomplete placeholder="From (e.g. Mumbai)" fetchSuggestions={fetchAirportSuggestions} onSelect={setSelectedFrom} accentColor="sky" providerBadge="IATA" />
          <SmartAutocomplete placeholder="To (e.g. Udaipur)" fetchSuggestions={fetchAirportSuggestions} onSelect={setSelectedTo} accentColor="sky" providerBadge="IATA" />
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Departure</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-sky-400" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Return (opt)</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-sky-400" />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Adults</label>
              <input type="number" min="1" max="9" value={adults} onChange={e => setAdults(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-sky-400" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {CABIN_OPTIONS.map(c => (
              <button key={c.value} onClick={() => setCabin(c.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${cabin === c.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {c.label}
              </button>
            ))}
          </div>
          <button onClick={handleSearch} disabled={!selectedFrom || !selectedTo || !dateFrom || searching}
            className="ml-auto bg-sky-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-sky-700 disabled:opacity-50 flex items-center gap-2">
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {searching ? 'Searching TBO...' : 'Search Flights'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {searching && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      )}

      {/* Error */}
      {searchError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 mb-6 text-sm text-amber-700 font-medium">
          ⚠️ {searchError}
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────── */}
      {searchDone && !searching && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <h3 className="font-bold text-gray-900 text-sm">{flights.length} Flights Found</h3>
            {currentTraceId && <span className="text-[10px] text-gray-400 font-mono">TraceId: {currentTraceId}</span>}
            <TBOBadge />
          </div>

          {flights.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Plane size={32} className="text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No flights found. Try different dates or route.</p>
              <p className="text-xs text-gray-400 mt-1">TBO UAT may have limited routes — try DEL↔BOM or DEL↔GOI.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {flights.map((flight) => (
                <div key={flight.id} className="flex items-center gap-5 px-6 py-4 hover:bg-gray-50/60 transition-colors group">
                  {/* Airline badge */}
                  <div className="w-14 h-14 rounded-xl bg-sky-50 border border-sky-100 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-sky-700 font-black text-[11px] leading-tight text-center">{flight.airlineCode || flight.airlines[0]?.slice(0, 2)}</span>
                    <span className="text-sky-400 text-[9px]">{flight.flightNumber?.slice(-4) || ''}</span>
                  </div>

                  {/* Route info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                      <span>{flight.flyFrom}</span>
                      <ArrowRight size={14} className="text-gray-400" />
                      <span>{flight.flyTo}</span>
                      <span className={`ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${flight.stops === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {flight.stops === 0 ? 'Direct' : `${flight.stops} stop(s)`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {flight.duration.hours}h {flight.duration.minutes}m
                      </span>
                      {flight.departure && (
                        <span>{new Date(flight.departure).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                      {flight.baggage && <span>· Baggage: {flight.baggage}</span>}
                      {flight.availability && <span className="text-sky-600 font-medium">· {flight.availability}</span>}
                    </div>
                  </div>

                  {/* Price + actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-900">₹{flight.price.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-gray-400">per seat · INR</div>
                    </div>
                    <button onClick={() => openLockModal(flight)}
                      className="flex items-center gap-1.5 text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-600 hover:text-white px-3 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 border border-sky-200">
                      <Package size={11} /> Lock Seats
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Locked Inventory ─────────────────────────────────────── */}
      {lockedBlocks.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <h3 className="font-bold text-gray-900 text-sm">Event-Locked Flight Inventory</h3>
            <TBOBadge />
            <span className="text-xs text-gray-400">{lockedBlocks.length} route(s)</span>
          </div>
          <div className="divide-y divide-gray-50">
            {lockedBlocks.map((block) => {
              const usePct = block.lockedUnits > 0 ? Math.round((block.allocatedUnits / block.lockedUnits) * 100) : 0;
              const barColor = usePct >= 80 ? 'bg-emerald-500' : usePct >= 50 ? 'bg-amber-500' : 'bg-sky-400';
              return (
                <div key={block.id} className="px-6 py-4 flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                    <Plane size={18} className="text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{block.supplier}</div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[140px]">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${usePct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{block.allocatedUnits}/{block.lockedUnits} seats</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-bold text-gray-900">₹{block.sellPerUnit?.toLocaleString('en-IN')}/seat</span>
                    <span className="text-[10px] text-gray-400">Cost: ₹{block.costPerUnit?.toLocaleString('en-IN')}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${block.status === 'ACTIVE' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-gray-500 bg-gray-100'}`}>
                      {block.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightsTab;
