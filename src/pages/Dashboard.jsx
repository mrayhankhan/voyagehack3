import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { LayoutDashboard, PlusCircle, Globe, LogOut } from 'lucide-react';

const Dashboard = () => {
  const container = useRef(null);
  const navigate = useNavigate();
  const { user, events, logout } = useStore();

  useEffect(() => {
    if (!user) {
      navigate('/agent/login');
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from('.stat-card', {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power3.out'
      });
    }, container);
    return () => ctx.revert();
  }, [user, navigate]);

  if (!user) return null;

  const activeWeddings = events.length;
  const lockedInventory = events.reduce((acc, ev) => acc + ((ev.headcount || 150) - (ev.confirmedGuests || 0)), 0);
  const pendingRSVPs = events.reduce((acc, ev) => acc + ((ev.headcount || 150) - (ev.rsvps?.length || 0)), 0);
  
  const totalCommission = events.reduce((acc, ev) => {
    const costPerHead = (ev.budget || 0) / (ev.headcount || 1);
    const confirmed = ev.confirmedGuests || 0;
    return acc + (confirmed * costPerHead * 0.04);
  }, 0);

  const STATS = [
    { label: 'Active Weddings', value: activeWeddings, color: 'text-tbo-rani' },
    { label: 'Locked Inventory', value: `${lockedInventory} Blocks`, color: 'text-tbo-turquoise' },
    { label: 'Pending Guest RSVPs', value: pendingRSVPs, color: 'text-tbo-saffron' },
    { label: 'Total Commission Earned', value: `$${Math.round(totalCommission).toLocaleString()}`, color: 'text-tbo-emerald' }
  ];

  return (
    <div ref={container} className="min-h-screen flex bg-page-bg font-sans">
      
      {/* Sidebar Focus (Deep Indigo) */}
      <aside className="w-64 bg-tbo-indigo text-white flex flex-col p-8 fixed h-full z-20">
        <div className="font-bold text-4xl tracking-tight mb-16">tbo</div>
        
        <nav className="flex-1 space-y-4">
           <button className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl bg-white/10 text-white font-semibold">
              <LayoutDashboard size={20} /> Weddings
           </button>
           <button onClick={() => navigate('/agent/create')} className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <PlusCircle size={20} /> Create New Wedding
           </button>
           <button className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <Globe size={20} /> Microsites
           </button>
        </nav>

        <button 
          onClick={() => { logout(); navigate('/'); }} 
          className="flex items-center gap-3 text-tbo-saffron hover:text-white transition-colors px-4"
        >
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-12 overflow-y-auto">
        
        <div className="flex justify-between items-end mb-12 border-b border-gray-200 pb-6">
           <div>
             <h1 className="font-bold text-4xl text-tbo-indigo mb-2">Destination Weddings Dashboard</h1>
             <p className="font-mono text-sm text-tbo-emerald font-bold bg-tbo-emerald/10 inline-block px-3 py-1 rounded-md">
               Commission Model: 4% per booking
             </p>
           </div>
           
           <button 
             onClick={() => navigate('/agent/create')}
             className="bg-tbo-indigo text-white px-8 py-3 rounded-full font-semibold shadow-md hover:bg-[#2A1B4E] transition-colors"
           >
             Create New Wedding
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {STATS.map((stat, i) => (
             <div key={i} className="stat-card bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
               <span className="text-sm font-semibold text-gray-500 mb-4">{stat.label}</span>
               <span className={`font-serif italic text-4xl ${stat.color} mt-auto overflow-hidden`}>{stat.value}</span>
             </div>
           ))}
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
