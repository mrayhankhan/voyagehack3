import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { MapPin, CalendarDays, Plane, Bed, CheckCircle2, ChevronDown } from 'lucide-react';

const Microsite = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, addRSVP } = useStore();
  const containerRef = useRef(null);

  const [isAdminView, setIsAdminView] = useState(false);
  const [rsvpState, setRsvpState] = useState({ name: '', willAttend: '', meal: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const ev = events.find(e => e.id === id);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.stagger-fade', {
        y: 30,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: 'power3.out'
      });
    }, containerRef);
    return () => ctx.revert();
  }, [ev]);

  const handleRSVPSubmit = (e) => {
    e.preventDefault();
    if (!rsvpState.name || !rsvpState.willAttend) return;
    
    addRSVP(ev.id, rsvpState);
    setIsSubmitted(true);
    
    // Success animation
    gsap.fromTo('.success-msg', 
      { scale: 0.8, opacity: 0 }, 
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
    );
  };

  if (!ev) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-6 bg-tbo-indigo text-white font-sans">
        <div>
           <h1 className="font-serif italic text-4xl mb-4">Microsite not deployed.</h1>
           <button onClick={() => navigate('/agent/dashboard')} className="text-tbo-gold font-bold transition-colors hover:text-white">
             Return to Dashboard &rarr;
           </button>
        </div>
      </div>
    );
  }

  // Derived mock agent data
  const totalCapacity = ev.headcount || 150;
  const confirmed = ev.confirmedGuests || 0;
  const remainingInventory = totalCapacity - confirmed;
  const estCommission = Math.round((confirmed * (ev.budget / totalCapacity)) * 0.04);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FDFBF7] text-tbo-indigo relative font-sans overflow-x-hidden">
      
      {/* Admin Toggle Banner (Demo Only) */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md px-6 py-3 flex justify-between items-center text-white border-b border-white/10 shadow-sm">
        <div className="font-mono text-[10px] tracking-widest uppercase opacity-80 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-tbo-emerald animate-ping opacity-80"></div>
          Demo Environment
        </div>
        <button 
          onClick={() => setIsAdminView(!isAdminView)} 
          className="text-xs font-bold font-mono tracking-wide px-4 py-1.5 rounded-full border border-white/20 hover:bg-white/10 transition-colors"
        >
          {isAdminView ? 'View as Guest' : 'Switch to Agent View'}
        </button>
      </div>

      {isAdminView && (
        <div className="bg-tbo-indigo text-white p-6 md:p-10 shadow-xl relative z-40 border-b-4 border-tbo-saffron">
          <div className="max-w-5xl mx-auto">
             <h2 className="font-sans font-bold text-2xl mb-6">Agent Inventory Overview</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                  <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider block mb-2">Confirmed Guests</span>
                  <div className="font-serif italic text-4xl text-white">{confirmed} <span className="text-xl text-gray-400 font-sans not-italic">/ {totalCapacity}</span></div>
                </div>
                <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                  <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider block mb-2">Remaining Room Blocks</span>
                  <div className="font-serif italic text-4xl text-tbo-turquoise">{remainingInventory}</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                  <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider block mb-2">Est. Commission (4%)</span>
                  <div className="font-serif italic text-4xl text-tbo-gold">${estCommission.toLocaleString()}</div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative pt-32 pb-40 px-6 flex items-center justify-center text-center overflow-hidden">
         {/* Background Elements */}
         <div className="absolute top-0 left-0 w-full h-[85%] bg-tbo-indigo rounded-b-[4rem] -z-10 shadow-2xl"></div>
         <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] bg-tbo-gold/20 rounded-full blur-[100px] -z-10 mix-blend-screen pointer-events-none"></div>
         
         <div className="relative z-10 text-white max-w-4xl mx-auto">
            <h1 className="stagger-fade font-serif italic text-6xl md:text-[8rem] leading-[0.9] tracking-tight mb-8 drop-shadow-lg">
              {ev.clientName}
            </h1>
            
            <div className="stagger-fade flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 font-sans text-lg tracking-widest uppercase text-tbo-gold/90 font-semibold mb-12">
               <span className="flex items-center gap-3"><MapPin size={20} className="text-tbo-saffron"/> {ev.destination || 'Udaipur, Rajasthan'}</span>
               <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-tbo-saffron"></span>
               <span className="flex items-center gap-3"><CalendarDays size={20} className="text-tbo-saffron"/> {ev.dates || 'The Weekend'}</span>
            </div>
            
            <div className="stagger-fade">
              <button 
                onClick={() => document.getElementById('rsvp').scrollIntoView({ behavior: 'smooth' })}
                className="bg-tbo-saffron text-white px-10 py-5 rounded-full font-bold shadow-xl hover:-translate-y-1 transition-transform flex items-center gap-3 mx-auto"
              >
                RSVP Now <ChevronDown size={20} />
              </button>
            </div>
         </div>
      </div>

      {/* Itinerary Timeline */}
      <div className="max-w-4xl mx-auto px-6 py-24">
         <div className="text-center mb-16">
           <h2 className="stagger-fade font-sans font-bold text-4xl text-tbo-indigo mb-4">Celebration Itinerary</h2>
           <div className="stagger-fade w-12 h-1 bg-tbo-saffron mx-auto rounded-full"></div>
         </div>
         
         <div className="relative border-l-2 border-tbo-gold/30 ml-4 md:ml-12 space-y-12 pb-12">
           {[ 
             { title: 'Welcome Sangeet', time: 'Friday, 7:00 PM', desc: 'Join us for evening cocktails, dinner, and dancing under the stars to kick off the weekend.' },
             { title: 'The Baraat & Ceremony', time: 'Saturday, 9:00 AM', desc: 'The traditional groom processional followed by the wedding ceremonies.' },
             { title: 'Reception Gala', time: 'Saturday, 8:00 PM', desc: 'A black-tie celebration concluding the weekend festivities.' }
           ].map((item, i) => (
             <div key={i} className="stagger-fade relative pl-8 md:pl-16">
               <div className="absolute top-0 left-[-9px] w-4 h-4 rounded-full bg-tbo-saffron ring-4 ring-white shadow-sm"></div>
               <div className="bg-white rounded-[2rem] p-8 shadow-md border border-gray-100 hover:shadow-xl transition-shadow">
                 <div className="font-mono text-xs font-bold text-tbo-emerald mb-2 tracking-widest uppercase">{item.time}</div>
                 <h4 className="font-serif italic text-3xl text-tbo-indigo mb-3">{item.title}</h4>
                 <p className="font-sans text-gray-600 leading-relaxed">{item.desc}</p>
               </div>
             </div>
           ))}
         </div>
      </div>

      {/* Booking Section */}
      <div className="bg-white py-24 border-y border-gray-100 relative">
        <div className="absolute inset-0 bg-tbo-indigo/5 pointer-events-none"></div>
        <div className="max-w-5xl mx-auto px-6 relative z-10">
           <div className="text-center mb-16">
             <h2 className="stagger-fade font-sans font-bold text-4xl text-tbo-indigo mb-4">Travel & Accommodation</h2>
             <p className="stagger-fade text-gray-500 max-w-xl mx-auto font-medium">We have secured pre-negotiated inventory blocks. Please book through our agent portal to guarantee your placement.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="stagger-fade bg-white rounded-[2.5rem] p-8 md:p-10 shadow-lg border border-gray-100 flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-tbo-saffron/10 text-tbo-saffron rounded-full flex items-center justify-center mb-6">
                 <Bed size={32} />
               </div>
               <h3 className="font-serif italic text-3xl text-tbo-indigo mb-2">Partner Hotels</h3>
               <p className="text-gray-500 mb-8 font-sans">Access our negotiated group rates at The Leela Palace and surrounding partner properties.</p>
               <button className="w-full mt-auto border-2 border-tbo-indigo text-tbo-indigo py-4 rounded-full font-bold hover:bg-tbo-indigo hover:text-white transition-colors">
                 View Room Blocks
               </button>
             </div>

             <div className="stagger-fade bg-white rounded-[2.5rem] p-8 md:p-10 shadow-lg border border-gray-100 flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-tbo-turquoise/10 text-tbo-turquoise rounded-full flex items-center justify-center mb-6">
                 <Plane size={32} />
               </div>
               <h3 className="font-serif italic text-3xl text-tbo-indigo mb-2">Charter Flights</h3>
               <p className="text-gray-500 mb-8 font-sans">Secure seats on the group chartered transit from major hubs direct to {ev.destination || 'the destination'}.</p>
               <button className="w-full mt-auto border-2 border-tbo-indigo text-tbo-indigo py-4 rounded-full font-bold hover:bg-tbo-indigo hover:text-white transition-colors">
                 View Transit Options
               </button>
             </div>
           </div>
        </div>
      </div>

      {/* RSVP Section */}
      <div id="rsvp" className="max-w-xl mx-auto px-6 py-32">
         <div className="stagger-fade bg-tbo-indigo rounded-[3rem] p-10 md:p-12 shadow-2xl relative overflow-hidden text-center text-white">
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-tbo-rani/20 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

            {isSubmitted ? (
              <div className="success-msg flex flex-col items-center justify-center py-10">
                <CheckCircle2 size={64} className="text-tbo-gold mb-6" />
                <h3 className="font-serif italic text-4xl mb-4">Thank You!</h3>
                <p className="font-sans text-gray-300">Your RSVP has been securely recorded in our manifest.</p>
              </div>
            ) : (
              <>
                <h2 className="font-sans font-bold text-3xl mb-8">RSVP</h2>
                <form onSubmit={handleRSVPSubmit} className="space-y-6 text-left">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Guest Name(s)</label>
                    <input 
                      type="text" 
                      required
                      value={rsvpState.name}
                      onChange={e => setRsvpState({...rsvpState, name: e.target.value})}
                      className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-gray-400 outline-none focus:border-tbo-gold transition-colors"
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Will you be attending?</label>
                    <select 
                      required
                      value={rsvpState.willAttend}
                      onChange={e => setRsvpState({...rsvpState, willAttend: e.target.value})}
                      className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white outline-none focus:border-tbo-gold transition-colors appearance-none"
                    >
                      <option value="" disabled className="text-gray-800">Please Select</option>
                      <option value="yes" className="text-gray-800">Joyfully Accepts</option>
                      <option value="no" className="text-gray-800">Regretfully Declines</option>
                    </select>
                  </div>

                  {rsvpState.willAttend === 'yes' && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Meal Preference</label>
                      <select 
                        value={rsvpState.meal}
                        onChange={e => setRsvpState({...rsvpState, meal: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white outline-none focus:border-tbo-gold transition-colors appearance-none"
                      >
                        <option value="" disabled className="text-gray-800">Optional selection</option>
                        <option value="vegetarian" className="text-gray-800">Vegetarian</option>
                        <option value="nonveg" className="text-gray-800">Non-Vegetarian</option>
                        <option value="vegan" className="text-gray-800">Vegan</option>
                      </select>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-tbo-gold text-tbo-indigo py-4 rounded-full font-bold text-lg mt-8 shadow-lg hover:bg-white transition-colors"
                  >
                    Confirm Attendance
                  </button>
                </form>
              </>
            )}
         </div>
      </div>
    </div>
  );
};

export default Microsite;
