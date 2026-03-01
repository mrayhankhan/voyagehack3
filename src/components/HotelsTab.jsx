/**
 * HotelsTab — Agent hotel search using Amadeus Self-Service API.
 * Amadeus-only. No Kiwi. No RapidAPI. No affiliate.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Bed, Star, Package, CheckCircle2,
  Loader2, X,
} from 'lucide-react';
import { hotelApi, inventoryBlockApi } from '../services/api.service';
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
    <div className="w-16 h-16 rounded-xl bg-gray-200" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
    <div className="w-20 h-8 bg-gray-200 rounded-lg" />
  </div>
);

const HotelsTab = ({ event }) => {
  const [selectedCity, setSelectedCity] = useState(null);
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [searching, setSearching] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [searchDone, setSearchDone] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Lock modal
  const [lockModal, setLockModal] = useState(null);
  const [lockUnits, setLockUnits] = useState(10);
  const [sellPrice, setSellPrice] = useState(0);
  const [releaseDate, setReleaseDate] = useState('');
  const [locking, setLocking] = useState(false);
  const [lockSuccess, setLockSuccess] = useState(null);

  // Locked inventory
  const [lockedBlocks, setLockedBlocks] = useState([]);

  useEffect(() => { fetchBlocks(); }, [event.id]);

  const fetchBlocks = async () => {
    try {
      const blocks = await inventoryBlockApi.getByEvent(event.id, 'hotel');
      setLockedBlocks(blocks);
    } catch { setLockedBlocks([]); }
  };

  // Autocomplete fetcher
  const fetchCitySuggestions = useCallback(async (query) => {
    const results = await hotelApi.autocomplete(query);
    return results.map(r => ({
      ...r,
      label: r.label || `${r.name} (${r.code})`,
      sublabel: `${r.country} · ${r.type}`,
    }));
  }, []);

  const handleSearch = async () => {
    if (!selectedCity || !checkin || !checkout) return;
    setSearching(true);
    setSearchDone(false);
    setSearchError(null);
    try {
      const result = await hotelApi.search({
        cityCode: selectedCity.cityCode || selectedCity.code,
        checkin, checkout,
      });
      setHotels(result.hotels || []);
      if (result.error) setSearchError(result.error);
    } catch (err) {
      setSearchError(err.message);
      setHotels([]);
    } finally {
      setSearching(false);
      setSearchDone(true);
    }
  };

  const handleLockConfirm = async () => {
    if (!lockModal) return;
    setLocking(true);
    try {
      await inventoryBlockApi.lock({
        eventId: event.id,
        type: 'hotel',
        provider: 'amadeus',
        supplier: lockModal.name,
        providerRefId: String(lockModal.hotelId),
        providerOfferId: lockModal.offerId || '',
        providerData: lockModal,
        lockedUnits: lockUnits,
        costPerUnit: lockModal.pricePerNight || lockModal.price || 0,
        sellPerUnit: sellPrice || Math.round((lockModal.pricePerNight || lockModal.price || 100) * 1.15),
        releaseDate: releaseDate || null,
      });
      setLockSuccess(lockModal.name);
      setLockModal(null);
      fetchBlocks();
      setTimeout(() => setLockSuccess(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLocking(false);
    }
  };

  const openLockModal = (hotel) => {
    setLockModal(hotel);
    setLockUnits(10);
    setSellPrice(Math.round((hotel.pricePerNight || hotel.price || 100) * 1.15));
    setReleaseDate('');
  };

  const totalLocked = lockedBlocks.reduce((s, b) => s + b.lockedUnits, 0);
  const totalAllocated = lockedBlocks.reduce((s, b) => s + b.allocatedUnits, 0);
  const totalAvailable = lockedBlocks.reduce((s, b) => s + b.availableUnits, 0);

  return (
    <div>
      {lockSuccess && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl animate-pulse">
          <CheckCircle2 size={18} />
          <span className="font-semibold text-sm">Locked rooms at {lockSuccess}</span>
        </div>
      )}

      {/* Lock Modal */}
      {lockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 mx-4">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
                  <Bed size={22} className="text-violet-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-base">Lock Rooms for Event</div>
                  <div className="text-xs text-gray-400">{event.clientName}</div>
                </div>
              </div>
              <button onClick={() => setLockModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-900">{lockModal.name}</div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-100 text-violet-700">
                  {lockModal.provider || 'Amadeus'}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {lockModal.pricePerNight > 0 ? `$${lockModal.pricePerNight}/night` : 'Price on request'}
                {lockModal.roomType && ` · ${lockModal.roomType}`}
                {lockModal.rating && ` · ⭐ ${lockModal.rating}`}
              </div>

            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-1">Number of Rooms</label>
                <input type="number" min="1" max="200" value={lockUnits}
                  onChange={e => setLockUnits(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-1">Sell Price / Night</label>
                <input type="number" min="0" value={sellPrice}
                  onChange={e => setSellPrice(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-violet-400" />
                {lockModal.pricePerNight > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    Margin: ${sellPrice - lockModal.pricePerNight}/night ({(((sellPrice - lockModal.pricePerNight) / Math.max(1, sellPrice)) * 100).toFixed(1)}%)
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-1">Release Date</label>
                <input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-violet-400" />
              </div>
            </div>

            {locking ? (
              <div className="flex flex-col items-center py-4">
                <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-3" />
                <div className="text-sm text-gray-500">Locking rooms...</div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setLockModal(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleLockConfirm} className="flex-1 py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 flex items-center justify-center gap-2">
                  <Package size={15} /> Lock {lockUnits} Rooms
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Kpi label="Hotel Blocks" value={lockedBlocks.length} sub="Active suppliers" />
        <Kpi label="Rooms Locked" value={totalLocked} sub="Total capacity" color="text-violet-700" />
        <Kpi label="Allocated" value={totalAllocated} sub="Guest bookings" color="text-emerald-700" />
        <Kpi label="Available" value={totalAvailable} sub="Remaining" color="text-amber-600" />
      </div>

      {/* Search Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Search size={16} className="text-violet-600" />
          <h3 className="font-bold text-gray-900 text-sm">Search Hotels</h3>
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-50 text-violet-600 ml-auto">Powered by Amadeus</span>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <SmartAutocomplete
            placeholder="e.g. Udaipur, Jaipur..."
            fetchSuggestions={fetchCitySuggestions}
            onSelect={(item) => setSelectedCity(item)}
            accentColor="violet"
            providerBadge="Amadeus"
          />
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Check-in</label>
            <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-400" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Check-out</label>
            <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-400" />
          </div>
          <div className="flex items-end">
            <button onClick={handleSearch} disabled={!selectedCity || !checkin || !checkout || searching}
              className="w-full bg-violet-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {searching ? 'Searching...' : 'Search Hotels'}
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
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

      {/* Results */}
      {searchDone && !searching && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">{hotels.length} Hotels Found</h3>
          </div>

          {hotels.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Bed size={32} className="text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No hotels found. Try a different city or dates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 divide-y divide-gray-50">
              {hotels.map((hotel, idx) => (
                <div key={hotel.hotelId || idx} className="flex items-center gap-5 px-6 py-4 hover:bg-gray-50/60 transition-colors group">
                  <div className="w-14 h-14 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <Bed size={20} className="text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm truncate">{hotel.name}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 flex-shrink-0">
                        Amadeus
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {hotel.rating && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-bold">
                          <Star size={12} /> {hotel.rating}
                        </span>
                      )}
                      {hotel.roomType && <span className="text-xs text-gray-400">{hotel.roomType}</span>}
                      {hotel.cancellation && <span className="text-xs text-gray-400">· {hotel.cancellation}</span>}
                    </div>

                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="text-right">
                      {hotel.pricePerNight > 0 ? (
                        <>
                          <div className="font-bold text-lg text-gray-900">${hotel.pricePerNight}</div>
                          <div className="text-[10px] text-gray-400">per night</div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400">Price on request</div>
                      )}
                    </div>
                    <button onClick={() => openLockModal(hotel)}
                      className="flex items-center gap-1.5 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-600 hover:text-white px-3 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Package size={11} /> Lock Rooms
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Locked Inventory */}
      {lockedBlocks.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">Event-Locked Hotel Inventory</h3>
            <p className="text-xs text-gray-400 mt-0.5">{lockedBlocks.length} supplier(s) · Powered by Amadeus</p>
          </div>
          <div className="divide-y divide-gray-50">
            {lockedBlocks.map((block) => {
              const usePct = block.lockedUnits > 0 ? Math.round((block.allocatedUnits / block.lockedUnits) * 100) : 0;
              const barColor = usePct >= 80 ? 'bg-emerald-500' : usePct >= 50 ? 'bg-amber-500' : 'bg-red-500';
              return (
                <div key={block.id} className="px-6 py-4 flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <Bed size={18} className="text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm truncate">{block.supplier}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[140px]">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${usePct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{block.allocatedUnits}/{block.lockedUnits} rooms</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-bold text-gray-900">${block.sellPerUnit}/night</span>
                    <span className="text-[10px] text-gray-400">Cost: ${block.costPerUnit}</span>
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

export default HotelsTab;
