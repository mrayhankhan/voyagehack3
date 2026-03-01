/**
 * BookTravelSection — Guest booking from event-locked inventory.
 * Powered by TBO (Tektravels) UAT. No affiliate redirects.
 */
import React, { useState, useEffect } from 'react';
import {
  Bed, Plane, CheckCircle2, Loader2,
  Package, X, CreditCard,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { inventoryBlockApi, bookingApi } from '../services/api.service';
import { socket } from '../lib/socket';

const BookTravelSection = ({ event, guestName, guestEmail }) => {
  const [hotelBlocks, setHotelBlocks] = useState([]);
  const [flightBlocks, setFlightBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('hotels');

  const [bookModal, setBookModal] = useState(null);
  const [booking, setBooking] = useState(false);
  const [bookingDone, setBookingDone] = useState(null);

  // Auto-switch to flights tab if only flights are available
  useEffect(() => {
    if (tab === 'hotels' && hotelBlocks.length === 0 && flightBlocks.length > 0) {
      setTab('flights');
    }
  }, [hotelBlocks.length, flightBlocks.length, tab]);

  useEffect(() => {
    fetchInventory();

    // Listen for live inventory updates
    const handleUpdate = () => {
      fetchInventory();
    };
    socket.on('inventory:update', handleUpdate);
    socket.on('inventory:expired', handleUpdate);

    return () => {
      socket.off('inventory:update', handleUpdate);
      socket.off('inventory:expired', handleUpdate);
    };
  }, [event.id]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [h, f] = await Promise.all([
        inventoryBlockApi.getByEvent(event.id, 'hotel'),
        inventoryBlockApi.getByEvent(event.id, 'flight'),
      ]);
      setHotelBlocks(h.filter(b => b.availableUnits > 0));
      setFlightBlocks(f.filter(b => b.availableUnits > 0));
    } catch {
      setHotelBlocks([]);
      setFlightBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!bookModal) return;
    setBooking(true);
    try {
      const idempotencyKey = uuidv4();
      const result = await bookingApi.create({
        eventId: event.id,
        guestId: guestEmail,
        guestName: guestName,
        type: bookModal.type,
        inventoryBlockId: bookModal.block.id,
        cost: bookModal.block.costPerUnit,
        sellPrice: bookModal.block.sellPerUnit,
        units: 1,
        idempotencyKey,
      });
      if (!result) {
        setBookModal(null);
        return;
      }

      // If status is PENDING_MANUAL_CONFIRM, inform the user
      if (result.status === 'PENDING_MANUAL_CONFIRM') {
        alert('Booking received, but provider confirmation is pending. An admin will reconcile this shortly.');
      }
      setBookingDone(result);
      setBookModal(null);
      fetchInventory();
      setTimeout(() => setBookingDone(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setBooking(false);
    }
  };

  const totalHotelAvail = hotelBlocks.reduce((s, b) => s + b.availableUnits, 0);
  const totalFlightAvail = flightBlocks.reduce((s, b) => s + b.availableUnits, 0);
  const hasInventory = totalHotelAvail > 0 || totalFlightAvail > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center py-12">
        <Loader2 size={28} className="text-violet-400 animate-spin mb-3" />
        <p className="text-white/40 text-sm">Loading travel options...</p>
      </div>
    );
  }

  if (!hasInventory) return null;

  return (
    <div className="mt-10">
      {bookingDone && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-pulse">
          <CheckCircle2 size={18} />
          <div>
            <div className="font-bold text-sm">Booking Confirmed!</div>
            <div className="text-xs text-emerald-100">Ref: {bookingDone.id}</div>
          </div>
        </div>
      )}

      {/* Modal */}
      {bookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-8 mx-4 text-white">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bookModal.type === 'hotel' ? 'bg-violet-500/20' : 'bg-sky-500/20'}`}>
                  {bookModal.type === 'hotel' ? <Bed size={22} className="text-violet-400" /> : <Plane size={22} className="text-sky-400" />}
                </div>
                <div>
                  <div className="font-bold text-base">Confirm Booking</div>
                  <div className="text-xs text-white/40">{guestName}</div>
                </div>
              </div>
              <button onClick={() => setBookModal(null)} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>

            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{bookModal.block.supplier}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">TBO</span>
              </div>
              <div className="text-xs text-white/40 mt-1">
                {bookModal.block.availableUnits} {bookModal.type === 'hotel' ? 'rooms' : 'seats'} remaining
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Price</span>
                <span className="font-bold">${bookModal.block.sellPerUnit}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/10 pt-3">
                <span className="text-white/60 font-bold">Total</span>
                <span className="font-bold text-emerald-400">${bookModal.block.sellPerUnit}</span>
              </div>
            </div>

            {booking ? (
              <div className="flex flex-col items-center py-4">
                <div className="w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full animate-spin mb-3" />
                <div className="text-sm text-white/60">Processing...</div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setBookModal(null)}
                  className="flex-1 py-3 rounded-xl border border-white/20 text-sm font-bold text-white/60 hover:bg-white/5">Cancel</button>
                <button onClick={handleBook}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold shadow-xl hover:shadow-violet-500/30 flex items-center justify-center gap-2">
                  <CreditCard size={15} /> Confirm & Pay
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-white font-serif italic text-3xl mb-2">Book Your Travel</h2>
        <p className="text-white/40 text-sm max-w-md mx-auto">
          Select your room and flights from options curated for this event.
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex justify-center mb-6">
        <div className="flex gap-1 bg-white/5 rounded-2xl p-1 border border-white/10">
          {totalHotelAvail > 0 && (
            <button onClick={() => setTab('hotels')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'hotels' ? 'bg-violet-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}>
              <Bed size={15} /> Hotels ({totalHotelAvail})
            </button>
          )}
          {totalFlightAvail > 0 && (
            <button onClick={() => setTab('flights')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'flights' ? 'bg-sky-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}>
              <Plane size={15} /> Flights ({totalFlightAvail})
            </button>
          )}
        </div>
      </div>

      {/* Hotel cards */}
      {tab === 'hotels' && (
        <div className="grid grid-cols-1 gap-4 max-w-xl mx-auto">
          {hotelBlocks.map((block) => (
            <div key={block.id} className="bg-white/[0.05] border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:bg-white/[0.08] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Bed size={18} className="text-violet-400" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm">{block.supplier}</span>
                    <div className="text-[11px] text-white/40 mt-0.5">{block.availableUnits} rooms available</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white text-lg">${block.sellPerUnit}</div>
                  <div className="text-[10px] text-white/40">per night</div>
                </div>
              </div>
              <div className="mb-4">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.round((block.allocatedUnits / block.lockedUnits) * 100)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-white/30 mt-1">
                  <span>{block.allocatedUnits} booked</span><span>{block.availableUnits} remaining</span>
                </div>
              </div>
              <button onClick={() => setBookModal({ block, type: 'hotel' })}
                className="w-full py-2.5 rounded-xl bg-violet-600/80 text-white text-sm font-bold hover:bg-violet-500 transition-colors flex items-center justify-center gap-2">
                <Package size={14} /> Book Room
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Flight cards */}
      {tab === 'flights' && (
        <div className="grid grid-cols-1 gap-4 max-w-xl mx-auto">
          {flightBlocks.map((block) => (
            <div key={block.id} className="bg-white/[0.05] border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:bg-white/[0.08] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                    <Plane size={18} className="text-sky-400" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm">{block.supplier}</span>
                    <div className="text-[11px] text-white/40 mt-0.5">{block.availableUnits} seats available</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white text-lg">${block.sellPerUnit}</div>
                  <div className="text-[10px] text-white/40">per seat</div>
                </div>
              </div>
              <div className="mb-4">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${Math.round((block.allocatedUnits / block.lockedUnits) * 100)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-white/30 mt-1">
                  <span>{block.allocatedUnits} booked</span><span>{block.availableUnits} remaining</span>
                </div>
              </div>
              <button onClick={() => setBookModal({ block, type: 'flight' })}
                className="w-full py-2.5 rounded-xl bg-sky-600/80 text-white text-sm font-bold hover:bg-sky-500 transition-colors flex items-center justify-center gap-2">
                <Package size={14} /> Book Seat
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookTravelSection;
