import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Shuffler = () => {
  const [cards, setCards] = useState([
    { id: 1, title: 'Taj Lake Palace', block: '50 Rooms', rate: 'Locked: $450/nt', incl: 'Breakfast, Spa' },
    { id: 2, title: 'Oberoi Udaivilas', block: '45 Rooms', rate: 'Locked: $520/nt', incl: 'Airport Transfer' },
    { id: 3, title: 'Leela Palace', block: '60 Rooms', rate: 'Locked: $410/nt', incl: 'Welcome Dinner' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCards(prev => {
        const newArr = [...prev];
        const last = newArr.pop();
        newArr.unshift(last);
        return newArr;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-72 w-full flex items-center justify-center">
      {cards.map((card, i) => (
        <div 
          key={card.id}
          className="absolute w-full max-w-[280px] p-6 rounded-[2rem] bg-card-bg border border-gray-100 shadow-xl transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            transform: `translateY(${i * 12}px) scale(${1 - i * 0.05})`,
            zIndex: 10 - i,
            opacity: 1 - i * 0.2
          }}
        >
          <h3 className="font-sans font-bold text-lg text-tbo-indigo mb-4">{card.title}</h3>
          <div className="space-y-2">
            <p className="font-serif italic text-[0.95rem] text-gray-500 flex justify-between">
              <span>Room Block</span> <span className="text-gray-900 not-italic font-mono text-xs mt-1">{card.block}</span>
            </p>
            <p className="font-serif italic text-[0.95rem] text-gray-500 flex justify-between">
              <span>Rates</span> <span className="text-tbo-emerald not-italic font-mono text-xs mt-1">{card.rate}</span>
            </p>
            <p className="font-serif italic text-[0.95rem] text-gray-500 flex justify-between">
              <span>Inclusions</span> <span className="text-gray-900 not-italic font-mono text-xs mt-1">{card.incl}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

const TYPEWRITER_MESSAGES = ["Analyzing budget...", "Scoring destinations...", "Locking allotments..."];

const Typewriter = () => {
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (subIndex === TYPEWRITER_MESSAGES[index].length + 1 && !reverse) {
      const t = setTimeout(() => setReverse(true), 2000);
      return () => clearTimeout(t);
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % TYPEWRITER_MESSAGES.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 50 : 80);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  useEffect(() => {
    setText(TYPEWRITER_MESSAGES[index].substring(0, subIndex));
  }, [subIndex, index]);
  
  return (
    <div className="h-72 p-6 bg-[#0f172a] rounded-[2rem] w-full border border-gray-800 shadow-xl flex flex-col items-start relative overflow-hidden">
       <div className="flex items-center gap-2 mb-6">
         <div className="relative w-2 h-2 rounded-full bg-tbo-emerald flex items-center justify-center">
           <div className="absolute inset-0 bg-tbo-emerald rounded-full animate-ping opacity-75"></div>
         </div>
         <span className="text-tbo-emerald text-xs font-mono uppercase tracking-widest pl-2">Live Feed</span>
       </div>
       <div className="text-white/80 font-mono text-sm leading-loose">
         &gt; System initialized.<br/>
         &gt; Connect AI planner via WSS.<br/>
         &gt; <span className="text-tbo-turquoise">{text}</span>
         <span className="inline-block w-2 bg-tbo-turquoise h-4 ml-1 mb-[-2px] animate-pulse"></span>
       </div>
    </div>
  );
};

const Scheduler = () => {
  const cursorRef = useRef(null);
  const saveBtnRef = useRef(null);
  const dayRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
      
      tl.to(cursorRef.current, { x: 120, y: 70, duration: 1, ease: 'power2.inOut' })
        .to(dayRef.current, { backgroundColor: 'var(--tbo-saffron)', color: '#fff', duration: 0.2 })
        .to(cursorRef.current, { x: 180, y: 150, duration: 1, ease: 'power2.inOut', delay: 0.5 })
        .to(saveBtnRef.current, { scale: 0.95, duration: 0.1 })
        .to(saveBtnRef.current, { scale: 1, backgroundColor: 'var(--tbo-indigo)', color: '#fff', duration: 0.1 })
        .to(cursorRef.current, { x: 40, y: 220, duration: 1, ease: 'power2.inOut', delay: 0.5 })
        .to(saveBtnRef.current, { backgroundColor: '#f3f4f6', color: '#1e1b4b', duration: 0 })
        .to(dayRef.current, { backgroundColor: 'transparent', color: '#1e1b4b', duration: 0 })
        .to(cursorRef.current, { x: 0, y: 0, duration: 0.5, ease: 'power2.inOut' });
        
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative h-72 p-6 bg-white rounded-[2rem] border border-gray-100 shadow-xl pointer-events-none select-none">
       <div className="font-sans font-bold text-tbo-indigo mb-4">Event Flow</div>
       <div className="grid grid-cols-7 gap-2 mb-6">
         {['S','M','T','W','T','F','S'].map((d, i) => (
           <div key={i} className="text-center font-mono text-xs text-gray-400">{d}</div>
         ))}
         {Array.from({length: 14}).map((_, i) => (
           <div 
             key={i} 
             ref={i === 9 ? dayRef : null}
             className="aspect-square rounded-lg flex items-center justify-center text-xs font-sans text-tbo-indigo bg-gray-50"
           >
             {i + 1}
           </div>
         ))}
       </div>
       <div className="flex justify-between items-center px-2">
         <div className="font-serif italic text-sm text-gray-500">Launch Microsite &rarr;</div>
         <button ref={saveBtnRef} className="px-4 py-1.5 bg-gray-100 text-tbo-indigo rounded-full text-xs font-sans font-medium">
           Save
         </button>
       </div>

       {/* Custom SVG Cursor */}
       <div 
         ref={cursorRef} 
         className="absolute top-4 left-4 z-20 w-6 h-6 drop-shadow-md"
         style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.2))' }}
       >
         <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-black">
           <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.42c.45 0 .67-.54.35-.85L5.85 2.86a.5.5 0 00-.35-.15h0A.5.5 0 005.5 3.21z" fill="currentColor" stroke="white" strokeWidth="1.5"/>
         </svg>
       </div>
    </div>
  );
};

const Features = () => {
  const container = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.feature-card', {
        y: 60,
        opacity: 0,
        stagger: 0.15,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: container.current,
          start: 'top 75%',
        }
      });
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={container} className="w-full max-w-7xl mx-auto px-6 py-32 z-10 relative">
      <div className="text-center mb-20">
        <h2 className="font-sans font-bold text-4xl text-tbo-indigo mb-4">Functional Artifacts</h2>
        <p className="font-serif italic text-2xl text-gray-500">Designed for group synchronization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="feature-card flex flex-col items-center">
          <Shuffler />
          <h4 className="mt-8 font-sans font-bold text-xl text-tbo-indigo">Group Inventory Management</h4>
          <p className="mt-2 font-mono text-sm text-gray-500 text-center px-4">Live tracking of locked room blocks and negotiated rates.</p>
        </div>
        
        <div className="feature-card flex flex-col items-center">
          <Typewriter />
          <h4 className="mt-8 font-sans font-bold text-xl text-tbo-indigo">AI Planner & Itinerary</h4>
          <p className="mt-2 font-mono text-sm text-gray-500 text-center px-4">Algorithmic scoring and budget matching for seamless logistics.</p>
        </div>

        <div className="feature-card flex flex-col items-center">
          <Scheduler />
          <h4 className="mt-8 font-sans font-bold text-xl text-tbo-indigo">Branded Microsite Flow</h4>
          <p className="mt-2 font-mono text-sm text-gray-500 text-center px-4">Publish itineraries instantly to a customized guest portal.</p>
        </div>
      </div>
    </section>
  );
};

export default Features;
