import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, CalendarDays, Users, Bed, Plane, Star, Clock, CheckCircle2,
  ArrowRight, ShieldCheck, ChevronRight, ChevronLeft, MousePointer2
} from 'lucide-react';

import BookTravelSection from '../components/BookTravelSection';
import { joinEventRoom } from '../lib/socket';

import {
  DIETARY_OPTIONS, ADDON_CATALOGUE,
} from '../services/guest.service';
import { MOCK_EVENTS } from '../services/event.service';

const ITINERARY = [
  { day: 'Day 1', time: 'Nov 15 · Arrival', title: 'The Royal Welcome', desc: 'Check-in at The Leela Palace followed by sunset cocktails by the Lake Pichola. Meet-and-greet with the royal ensemble.', icon: '👑' },
  { day: 'Day 1', time: 'Nov 15 · 8 PM', title: 'Shahi Dastarkhawan', desc: 'A curated 7-course royal feast at the Jharokha Terrace featuring live Sufi performances.', icon: '🍽️' },
  { day: 'Day 2', time: 'Nov 16 · 10 AM', title: 'Rang-e-Mehendi', desc: 'Vibrant Rajasthani mehendi ceremony amidst the blooming palace gardens with live folk music.', icon: '🌸' },
  { day: 'Day 2', time: 'Nov 16 · 7 PM', title: 'Jashn-e-Sangeet', desc: 'A grand evening of dance and melody at the illuminated ballroom with global performers.', icon: '🎶' },
  { day: 'Day 3', time: 'Nov 17 · Noon', title: 'Haldi Utsav', desc: 'Traditional haldi ceremony followed by a festive pool party with themed cocktails and games.', icon: '💛' },
  { day: 'Day 3', time: 'Nov 17 · 8 PM', title: 'The Grand Vivaha', desc: 'The royal baraat procession followed by the wedding ceremony under the starlit Udaipur sky.', icon: '💍' },
  { day: 'Day 4', time: 'Nov 18 · Morning', title: 'Farewell Brunch', desc: 'A leisurely farewell brunch with panoramic palace views before your grand departure.', icon: '☀️' },
];

const OVERVIEW_TILES = [
  { icon: <MapPin size={28} />, label: 'Venue' },
  { icon: <CalendarDays size={28} />, label: 'Dates' },
  { icon: <Users size={28} />, label: 'Guests' },
  { icon: <Bed size={28} />, label: 'Stay' },
  { icon: <Plane size={28} />, label: 'Travel' },
  { icon: <Star size={28} />, label: 'Vibe' },
];

const Microsite = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // RSVP State
  const [step, setStep] = useState('form'); // 'form', 'addons', 'payment', 'done'
  const [form, setForm] = useState({ name: '', email: '', phone: '', attending: '', pax: '1', dietary: 'vegetarian', addons: [] });
  const [errors, setErrors] = useState({});

  const event = MOCK_EVENTS.find(e => e.id === id) || MOCK_EVENTS[0];
  const itineraryRef = useRef(null);

  const days = [...new Set(ITINERARY.map(i => i.day))];

  useEffect(() => {
    if (id) joinEventRoom(id);
    window.scrollTo(0, 0);
  }, [id, isOpen]);

  const handleOpen = () => {
    const tl = gsap.timeline();
    tl.to('.envelope-top', { rotateX: -180, duration: 0.8, ease: 'power2.inOut' })
      .to('.invitation-card', { y: -100, scale: 1.05, duration: 0.8, ease: 'power2.out' }, '-=0.2')
      .to('.envelope-wrapper', { opacity: 0, scale: 1.1, duration: 0.6, display: 'none' })
      .set('.main-content', { display: 'block', opacity: 0 })
      .to('.main-content', { opacity: 1, duration: 1, onComplete: () => setIsOpen(true) });
  };

  const scrollItinerary = (direction) => {
    if (itineraryRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      itineraryRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const field = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleRsvpSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name) errs.name = '* Required';
    if (!form.email) errs.email = '* Required';
    if (!form.attending) errs.attending = '* Selection required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (form.attending === 'no') {
      setStep('done');
    } else {
      setStep('addons');
    }
  };

  const toggleAddon = (aid) => setForm(f => ({
    ...f,
    addons: f.addons.includes(aid) ? f.addons.filter(x => x !== aid) : [...f.addons, aid]
  }));

  const addonTotal = form.addons.reduce((sum, aid) => {
    const item = ADDON_CATALOGUE.find(a => a.id === aid);
    return sum + (item ? item.price : 0);
  }, 0);

  const overviewValues = [
    event.destination || 'Udaipur, Rajasthan',
    event.dates || 'Nov 15-18, 2026',
    `${event.headcount} Noble Guests`,
    'Leela Palace Sanctuary',
    'VIP Airport Transfers',
    'Imperial Experience'
  ];

  return (
    <div className="min-h-screen bg-[#451125] font-sans text-amber-50 relative selection:bg-amber-500/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=La+Belle+Aurore&family=Outfit:wght@300;400;600&display=swap');
        
        .font-royal { font-family: Cinzel Decorative, serif; }
        .font-serif { font-family: Playfair Display, serif; }
        .font-script { font-family: La Belle Aurore, cursive; }
        .font-sans { font-family: Outfit, sans-serif; }

        .gold-border {
          border: 2px solid transparent;
          border-image: linear-gradient(to bottom right, #D4AF37, #F9D976, #D4AF37) 1;
        }
        
        .gold-text {
          background: linear-gradient(to right, #D4AF37, #F9D976, #D4AF37);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .envelope-top { transform-origin: top; perspective: 1000px; }
        
        .bg-palace {
          background: linear-gradient(to bottom, rgba(69, 17, 37, 0.8), rgba(69, 17, 37, 0.95)), url('/assets/royal_palace_clean.png');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
        }

        @keyframes gold-shimmer {
          from { background-position: -200% center; }
          to { background-position: 200% center; }
        }
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), transparent);
          background-size: 200% 100%;
          animation: gold-shimmer 3s infinite linear;
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(-120px) translateX(30px) scale(0.5); opacity: 0.8; }
          90% { opacity: 0.2; }
          100% { transform: translateY(-250px) translateX(-20px) scale(0); opacity: 0; }
        }
        .gold-particle {
          position: absolute;
          width: 4px; height: 4px;
          background: radial-gradient(circle, #F9D976, #D4AF37);
          border-radius: 50%;
          pointer-events: none;
          animation: float-particle 4s infinite ease-in-out;
        }

        @keyframes gentle-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.15), 0 0 60px rgba(212, 175, 55, 0.05); }
          50% { box-shadow: 0 0 40px rgba(212, 175, 55, 0.3), 0 0 80px rgba(212, 175, 55, 0.1); }
        }
        .glow-pulse { animation: gentle-glow 3s infinite ease-in-out; }

        @keyframes wax-seal-hover {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-3deg) scale(1.05); }
          75% { transform: rotate(3deg) scale(1.05); }
        }
        .wax-seal:hover { animation: wax-seal-hover 0.6s ease-in-out; }

        @keyframes name-reveal {
          from { opacity: 0; transform: translateY(20px); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .name-reveal { animation: name-reveal 1.2s ease-out forwards; }

        .ornament-corner {
          position: absolute;
          width: 60px; height: 60px;
          border-color: rgba(212, 175, 55, 0.3);
          pointer-events: none;
        }
        .ornament-tl { top: 12px; left: 12px; border-top: 2px solid; border-left: 2px solid; border-top-left-radius: 8px; }
        .ornament-tr { top: 12px; right: 12px; border-top: 2px solid; border-right: 2px solid; border-top-right-radius: 8px; }
        .ornament-bl { bottom: 12px; left: 12px; border-bottom: 2px solid; border-left: 2px solid; border-bottom-left-radius: 8px; }
        .ornament-br { bottom: 12px; right: 12px; border-bottom: 2px solid; border-right: 2px solid; border-bottom-right-radius: 8px; }
      `}</style>

      {/* ── ENVELOPE OPENING EXPERIENCE ─────────────────────────────── */}
      {!isOpen && (
        <div className="envelope-wrapper fixed inset-0 z-[100] bg-[#290916] flex items-center justify-center p-6 text-center">
          {/* Floating Gold Particles Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="gold-particle" style={{
                left: `${Math.random() * 100}%`,
                bottom: `${Math.random() * 30}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 3}s`,
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
              }} />
            ))}
          </div>

          <div className="relative w-full max-w-sm flex flex-col items-center">

            {/* Envelope Flap */}
            <div className="envelope-top w-full bg-gradient-to-br from-[#8B1A3A] to-[#5D0A25] rounded-t-2xl border-2 border-b-0 border-amber-500/20 glow-pulse overflow-hidden relative" style={{ height: '160px' }}>
              <div className="absolute inset-4 border border-amber-500/10 rounded-t-xl" />
              <div className="ornament-corner ornament-tl" />
              <div className="ornament-corner ornament-tr" style={{ top: 12, right: 12 }} />
              <img src="/assets/gold_lotus.png" alt="" className="absolute inset-0 m-auto w-14 h-14 opacity-40 mix-blend-screen" />
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#5D0A25] to-transparent" />
              {/* Wax Seal */}
              <div className="wax-seal absolute -bottom-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-[#C41E3A] via-[#8B0000] to-[#5C0015] border-2 border-amber-400/40 flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.6)] z-20 cursor-pointer">
                <span className="text-amber-300/90 text-lg">✦</span>
              </div>
            </div>

            {/* Invitation Card */}
            <div className="invitation-card w-full bg-gradient-to-br from-[#FDF9F0] via-[#F8F0DC] to-[#F0E4CC] pt-12 pb-10 px-10 text-[#451125] rounded-b-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border-2 border-t-0 border-[#D4AF37]/40 text-center overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('/assets/gold_lotus.png')] bg-repeat opacity-[0.03] animate-[spin_120s_linear_infinite] pointer-events-none" />
              <div className="ornament-corner ornament-bl" style={{ borderColor: 'rgba(139, 26, 58, 0.2)', width: 36, height: 36, bottom: 10, left: 10 }} />
              <div className="ornament-corner ornament-br" style={{ borderColor: 'rgba(139, 26, 58, 0.2)', width: 36, height: 36, bottom: 10, right: 10 }} />

              <div className="relative z-10">
                <div className="font-royal text-base md:text-lg mb-3 tracking-wider uppercase shimmer -mx-10 py-2 border-y border-[#D4AF37]/20 bg-[#D4AF37]/10">Marriage Celebration</div>
                <div className="font-serif italic text-sm mb-3 mt-4 text-[#800000]/70">The Royal Ensemble of</div>
                <div className="font-script text-4xl md:text-5xl mb-8 text-[#451125] drop-shadow-sm transform -rotate-1 leading-snug">{event.clientName}</div>
                <button onClick={handleOpen} className="group overflow-hidden bg-gradient-to-r from-[#451125] via-[#800000] to-[#451125] bg-[length:200%_auto] hover:bg-right text-amber-50 px-8 py-3 rounded-full font-sans text-xs tracking-[0.3em] uppercase font-bold hover:shadow-[0_0_40px_rgba(212,175,55,0.5)] border border-[#D4AF37]/50 transition-all duration-700 flex items-center gap-3 mx-auto hover:scale-105">
                  <span className="flex items-center gap-2">Open Invitation <MousePointer2 size={14} className="animate-bounce text-[#D4AF37]" /></span>
                </button>
              </div>
            </div>

            <div className="mt-8 font-sans text-amber-500/50 text-[10px] uppercase tracking-[0.4em] animate-pulse">
              Click 'Open Invitation' to begin
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN MICROSITE CONTENT (VERTICAL SCROLL) ────────────────── */}
      <div className={`main-content ${!isOpen ? 'hidden' : ''} bg-palace min-h-screen`}>

        {/* Header */}
        <div className="fixed top-0 inset-x-0 z-50 bg-[#290916]/80 backdrop-blur-md border-b border-amber-500/10 px-6 py-4 flex items-center justify-between">
          <div className="font-royal text-amber-400 text-sm tracking-tighter">Event OS</div>
          <button onClick={() => navigate(`/agent/event/${event.id}`)} className="text-[10px] font-sans font-bold uppercase tracking-widest text-amber-500/60 hover:text-amber-300 border border-amber-500/20 px-3 py-1 rounded-full">Agent View</button>
        </div>

        {/* Hero Section */}
        <section className="relative pt-48 pb-32 px-6 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-[#451125] to-transparent pointer-events-none" />
          {/* Ambient floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="gold-particle" style={{
                left: `${10 + Math.random() * 80}%`,
                bottom: `${Math.random() * 40}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${4 + Math.random() * 4}s`,
                width: `${2 + Math.random() * 3}px`,
                height: `${2 + Math.random() * 3}px`,
              }} />
            ))}
          </div>

          <img src="/assets/gold_lotus.png" alt="" className="w-16 h-16 md:w-24 md:h-24 mix-blend-screen opacity-50 mb-10 animate-pulse" />

          <div className="font-royal text-amber-500/80 text-[10px] md:text-xs tracking-[0.5em] uppercase mb-8">You are cordially invited to</div>

          <h1 className="font-royal text-[3rem] md:text-[5rem] lg:text-[7rem] leading-none mb-4 gold-text">The Grand Wedding Celebration</h1>

          <div className="font-serif italic text-xl md:text-3xl text-amber-200/90 mb-12">of</div>

          {/* Names - Clean centered layout */}
          <div className="relative w-full max-w-4xl mx-auto">
            <div className="name-reveal font-script text-[4.5rem] md:text-[6.5rem] lg:text-[8rem] leading-[0.8] mb-12 text-amber-100">
              {event.clientName.split(' ')[0]}
              <span className="block text-[2rem] md:text-[3rem] font-serif italic text-amber-500/50 my-4">♥</span>
              {event.clientName.split(' ')[2]}
            </div>
          </div>

          <div className="max-w-xl p-8 gold-border bg-[#451125]/20 backdrop-blur-sm relative glow-pulse rounded-sm">
            <div className="absolute inset-0 shimmer opacity-10" />
            <div className="ornament-corner ornament-tl" style={{ width: 30, height: 30, top: 6, left: 6 }} />
            <div className="ornament-corner ornament-tr" style={{ width: 30, height: 30, top: 6, right: 6 }} />
            <div className="ornament-corner ornament-bl" style={{ width: 30, height: 30, bottom: 6, left: 6 }} />
            <div className="ornament-corner ornament-br" style={{ width: 30, height: 30, bottom: 6, right: 6 }} />
            <div className="font-sans text-sm md:text-base tracking-widest text-amber-200 uppercase mb-4 relative z-10">{event.dates}</div>
            <div className="w-12 h-px bg-amber-500/40 mx-auto mb-4" />
            <div className="font-serif text-lg md:text-2xl italic text-amber-100 relative z-10">{event.destination || 'Udaipur, Rajasthan'}</div>
          </div>

          <div className="mt-16 animate-bounce">
            <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-amber-500/40">Scroll to Explore</span>
          </div>
        </section>

        {/* Wedding Overview */}
        <section className="bg-[#290916]/80 px-6 py-24 relative overflow-hidden">
          <img src="/assets/gold_lotus.png" alt="" className="absolute -left-20 top-20 w-64 h-64 opacity-5 mix-blend-screen rotate-45" />
          <img src="/assets/gold_lotus.png" alt="" className="absolute -right-20 bottom-20 w-64 h-64 opacity-5 mix-blend-screen -rotate-12" />

          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-8 relative z-10">
            {OVERVIEW_TILES.map((tile, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="text-amber-500 transform hover:scale-110 transition-transform mb-6">{tile.icon}</div>
                <div className="font-sans text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-amber-500/40 mb-2">{tile.label}</div>
                <div className="font-serif text-lg md:text-xl text-amber-50/90">{overviewValues[i]}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Horizontal Itinerary Carousel */}
        <section id="itinerary-section" className="max-w-7xl mx-auto px-0 py-32 overflow-hidden">
          <div className="text-center mb-16 px-6">
            <div className="font-royal text-amber-500/60 text-xs tracking-widest uppercase mb-4">Festivities</div>
            <h2 className="font-royal gold-text text-[2.5rem] md:text-[4.5rem] mb-6 tracking-tight">Royal Timeline</h2>
            <div className="w-24 h-px bg-amber-500/20 mx-auto mb-8" />
            <div className="flex justify-center gap-4">
              <button onClick={() => scrollItinerary('left')} className="p-3 border border-amber-500/30 rounded-full text-amber-400 hover:bg-amber-500/20 transition-colors bg-[#451125]/50 backdrop-blur-sm"><ChevronLeft size={24} /></button>
              <button onClick={() => scrollItinerary('right')} className="p-3 border border-amber-500/30 rounded-full text-amber-400 hover:bg-amber-500/20 transition-colors bg-[#451125]/50 backdrop-blur-sm"><ChevronRight size={24} /></button>
            </div>
          </div>

          {/* Horizontal Scroll Container */}
          <div ref={itineraryRef} className="flex overflow-x-auto no-scrollbar px-6 md:px-16 pb-12 gap-6 snap-x snap-mandatory scroll-smooth w-full">
            {ITINERARY.map((item, i) => (
              <div key={i} className="shrink-0 w-[85vw] md:w-[450px] bg-gradient-to-br from-[#800000]/80 to-[#451125]/90 border border-amber-500/30 p-10 flex flex-col relative overflow-hidden group snap-center rounded-sm backdrop-blur-md shadow-xl">
                <div className="absolute top-0 right-0 p-6 text-7xl opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700 pointer-events-none select-none filter blur-[1px]">
                  {item.icon}
                </div>
                <div className="mb-auto">
                  <div className="inline-flex items-center gap-2 bg-[#290916]/40 px-3 py-1.5 rounded-full border border-amber-500/20 mb-6 shadow-inner">
                    <Clock size={12} className="text-amber-500" />
                    <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-amber-200">{item.time}</span>
                  </div>
                  <h3 className="font-serif italic text-2xl md:text-[2rem] text-amber-100 mb-4 leading-tight">{item.title}</h3>
                  <p className="font-sans text-amber-50/70 text-sm leading-relaxed">{item.desc}</p>
                </div>
                <div className="mt-10 pt-6 border-t border-amber-500/10 flex justify-between items-center text-amber-500/40 font-royal text-xs tracking-widest uppercase">
                  <span>{item.day}</span>
                  <span>Event 0{i + 1}</span>
                </div>
              </div>
            ))}
            {/* Spacer for end of scroll */}
            <div className="shrink-0 w-8 md:w-16" />
          </div>
        </section>

        {/* Fixed RSVP Card Experience */}
        <section id="rsvp-section" className="px-6 py-32 bg-[#290916]/80 border-t border-amber-500/10 flex flex-col items-center">

          <div className="text-center mb-16">
            <div className="font-royal text-amber-500/60 text-xs tracking-widest uppercase mb-4">You're Invited</div>
            <h2 className="font-royal gold-text text-[2.5rem] md:text-[4.5rem] tracking-tight">RSVP</h2>
          </div>

          <div className="w-full max-w-2xl bg-[#fcf8f0] rounded shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] text-[#451125] p-8 md:p-12 relative overflow-hidden gold-border border-2">
            <img src="/assets/gold_lotus.png" alt="" className="absolute -top-10 -right-10 w-48 h-48 opacity-[0.03] select-none pointer-events-none" />

            {step !== 'done' && (
              <div className="flex justify-center gap-3 mb-10">
                {['form', 'addons', 'payment'].map((s, idx) => (
                  <div key={s} className={`w-2 h-2 rounded-full ${step === s ? 'bg-[#800000]' : (step === 'addons' && idx === 0) || (step === 'payment' && idx < 2) ? 'bg-amber-500' : 'bg-[#451125]/20'}`} />
                ))}
              </div>
            )}

            {step === 'form' && (
              <form onSubmit={handleRsvpSubmit} className="space-y-6 animate-in fade-in duration-500">
                <div className="text-center mb-8">
                  <h2 className="font-royal text-3xl md:text-4xl text-[#800000] mb-2">Répondez</h2>
                  <p className="font-script text-xl text-[#800000]/60">S'il vous plaît</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input value={form.name} onChange={e => field('name', e.target.value)} placeholder="Name of Honored Guest" className={`w-full bg-transparent border-b ${errors.name ? 'border-red-500' : 'border-[#451125]/20'} py-3 font-serif text-lg outline-none focus:border-[#800000] placeholder-[#451125]/30`} />
                    {errors.name && <span className="absolute right-0 top-3 text-[10px] text-red-500 font-sans uppercase font-bold">{errors.name}</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <input type="email" value={form.email} onChange={e => field('email', e.target.value)} placeholder="Email Address" className={`w-full bg-transparent border-b ${errors.email ? 'border-red-500' : 'border-[#451125]/20'} py-3 font-serif text-lg outline-none focus:border-[#800000] placeholder-[#451125]/30`} />
                    </div>
                    <input type="tel" value={form.phone} onChange={e => field('phone', e.target.value)} placeholder="Phone Number" className="w-full bg-transparent border-b border-[#451125]/20 py-3 font-serif text-lg outline-none focus:border-[#800000] placeholder-[#451125]/30" />
                  </div>
                </div>

                <div className="pt-4">
                  <div className="font-sans text-[10px] uppercase tracking-widest font-bold text-[#800000]/60 mb-3 text-center">Will you join us?</div>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => field('attending', 'yes')} className={`py-4 border text-[10px] font-bold uppercase tracking-widest transition-colors ${form.attending === 'yes' ? 'bg-[#800000] text-amber-50 border-[#800000]' : 'border-[#451125]/20 text-[#800000] hover:border-[#800000]'}`}>Graciously Accepts</button>
                    <button type="button" onClick={() => field('attending', 'no')} className={`py-4 border text-[10px] font-bold uppercase tracking-widest transition-colors ${form.attending === 'no' ? 'bg-[#800000] text-amber-50 border-[#800000]' : 'border-[#451125]/20 text-[#800000] hover:border-[#800000]'}`}>Regretfully Declines</button>
                  </div>
                  {errors.attending && <div className="text-center text-[10px] text-red-500 font-sans uppercase font-bold mt-2">{errors.attending}</div>}
                </div>

                {form.attending === 'yes' && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <select value={form.pax} onChange={e => field('pax', e.target.value)} className="w-full bg-transparent border-b border-[#451125]/20 py-3 font-serif text-lg outline-none text-[#451125]">
                      <option value="1">1 Guest</option>
                      <option value="2">2 Guests</option>
                      <option value="3">3 Guests</option>
                    </select>
                    <select value={form.dietary} onChange={e => field('dietary', e.target.value)} className="w-full bg-transparent border-b border-[#451125]/20 py-3 font-serif text-lg outline-none text-[#451125]">
                      {DIETARY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                )}

                <div className="pt-6">
                  <button type="submit" className="w-full bg-[#800000] text-amber-50 py-5 font-sans text-xs font-bold uppercase tracking-[0.3em] hover:bg-[#580a25] transition-colors shadow-lg flex justify-center items-center gap-2">
                    {form.attending === 'no' ? 'Submit Response' : 'Continue Details'} <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {step === 'addons' && (
              <div className="animate-in slide-in-from-right duration-500">
                <div className="text-center mb-8">
                  <h2 className="font-royal text-2xl md:text-3xl text-[#800000] mb-2">Enhance Your Experience</h2>
                  <p className="font-serif italic text-lg text-[#800000]/60">Select bespoke services for your stay</p>
                </div>

                <div className="space-y-3 mb-8">
                  {ADDON_CATALOGUE.map(addon => {
                    const isSelected = form.addons.includes(addon.id);
                    return (
                      <div key={addon.id} onClick={() => toggleAddon(addon.id)} className={`flex items-center gap-4 p-4 border rounded cursor-pointer transition-all ${isSelected ? 'border-[#800000] bg-[#800000]/5 shadow-md transform scale-[1.02]' : 'border-[#451125]/10 hover:border-[#800000]/50'}`}>
                        <div className="text-2xl text-[#800000] opacity-80">{addon.icon}</div>
                        <div className="flex-1">
                          <div className="font-serif font-bold text-lg text-[#451125]">{addon.name}</div>
                          <div className="font-sans text-xs text-[#451125]/60 mt-0.5">{addon.desc}</div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="font-sans font-bold text-[#800000]">$ {addon.price}</div>
                          <div className={`mt-2 w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#800000] bg-[#800000] text-white' : 'border-[#451125]/20'}`}>
                            {isSelected && <CheckCircle2 size={12} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep('form')} className="px-6 font-sans text-xs font-bold uppercase tracking-widest text-[#800000]/60 hover:text-[#800000]">Back</button>
                  <button onClick={() => setStep('payment')} className="flex-1 bg-[#800000] text-amber-50 py-4 font-sans text-xs font-bold uppercase tracking-[0.3em] hover:bg-[#580a25] transition-colors shadow-lg">Confirm Extras</button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="animate-in slide-in-from-right duration-500">
                <div className="text-center mb-8">
                  <h2 className="font-royal text-2xl md:text-3xl text-[#800000] mb-2">Finalization</h2>
                  <p className="font-serif italic text-lg text-[#800000]/60">Review your royal itinerary</p>
                </div>

                <div className="bg-[#451125]/5 border border-[#451125]/10 p-6 rounded-sm mb-8">
                  <div className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#800000] mb-4 border-b border-[#800000]/20 pb-2">Contribution Summary</div>

                  <div className="flex justify-between items-center mb-3">
                    <span className="font-serif text-[#451125]">Core Booking, Events & Meals (Pax: {form.pax})</span>
                    <span className="font-sans font-bold text-emerald-700">Covered</span>
                  </div>

                  {form.addons.map(aid => {
                    const item = ADDON_CATALOGUE.find(a => a.id === aid);
                    return item ? (
                      <div key={aid} className="flex justify-between items-center mb-2 text-sm text-[#451125]/80">
                        <span className="font-serif">{item.name}</span>
                        <span className="font-sans">${item.price}</span>
                      </div>
                    ) : null;
                  })}

                  <div className="border-t border-[#800000]/20 mt-4 pt-4 flex justify-between items-center text-xl text-[#800000]">
                    <span className="font-serif italic font-bold">Total Additional</span>
                    <span className="font-sans font-bold">${addonTotal}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep('addons')} className="px-6 font-sans text-xs font-bold uppercase tracking-widest text-[#800000]/60 hover:text-[#800000]">Back</button>
                  <button onClick={() => {
                    window.guestApi?.upsert({ eventId: event.id, name: form.name, email: form.email, phone: form.phone, pax: parseInt(form.pax) || 1, dietary: form.dietary, addons: form.addons, rsvp: 'CONFIRMED' }).catch(console.error);
                    setStep('done');
                  }} className="flex-1 bg-[#022c22] text-amber-50 py-4 font-sans text-xs font-bold uppercase tracking-[0.3em] hover:bg-[#064e3b] transition-colors shadow-lg flex justify-center items-center gap-2">
                    <ShieldCheck size={16} /> Complete via Stripe
                  </button>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className="py-12 text-center animate-in zoom-in duration-500">
                <div className="w-24 h-24 mx-auto border border-[#800000]/20 rounded-full flex items-center justify-center mb-8">
                  <Clock size={40} className="text-[#800000]/60" />
                </div>
                <h2 className="font-royal text-3xl md:text-4xl text-[#800000] mb-4">
                  {form.attending === 'no' ? 'Acknowledgement Sent' : 'Confirmation Granted'}
                </h2>
                <p className="font-serif text-xl italic text-[#800000]/80 leading-relaxed max-w-sm mx-auto mb-10">
                  {form.attending === 'no'
                    ? 'Your regrets have been conveyed. We shall miss your grand presence.'
                    : 'Your place is secured in the royal records. A detailed dispatch has been sent to your email.'}
                </p>
                <button onClick={() => { setForm({ name: '', email: '', phone: '', attending: '', pax: '1', dietary: 'vegetarian', addons: [] }); setStep('form'); }} className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#800000] border-b border-[#800000] pb-1 hover:text-[#580a25]">
                  Submit Another Card
                </button>
              </div>
            )}
          </div>

          {/* Post-RSVP Travel Section seamlessly appended beneath */}
          {step === 'done' && form.attending === 'yes' && (
            <div className="w-full max-w-2xl mt-8">
              <BookTravelSection event={event} guestName={form.name} guestEmail={form.email} />
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="py-24 text-center border-t border-amber-500/10">
          <div className="font-royal text-amber-500/40 text-[10px] tracking-[0.5em] uppercase mb-6">Designed for Excellence</div>
          <div className="font-royal text-2xl text-amber-400 tracking-tighter mb-2">Saathi EVENT OS</div>
          <div className="font-sans text-[10px] text-amber-500/40 uppercase tracking-widest">© {new Date().getFullYear()} Imperial Edition</div>
        </footer>

      </div>
    </div>
  );
};

export default Microsite;
