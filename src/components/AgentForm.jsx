import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

const STEPS = [
  'Client Info',
  'Budget',
  'Headcount & Dates',
  'Events & Timings',
  'Supplier Preferences',
  'Payment Terms'
];

const AgentForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [headcount, setHeadcount] = useState(150);
  const [budget, setBudget] = useState(50000);
  const btnRef = useRef(null);
  
  const percent = Math.round((currentStep / (STEPS.length - 1)) * 100);

  useEffect(() => {
    // Morph button animation slightly on step change
    if (btnRef.current) {
      gsap.fromTo(btnRef.current, 
        { scale: 0.95, opacity: 0.8 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
    // Simulate websocket auto-save ping
    const wsPing = setTimeout(() => {
      console.log(`[WSS] Auto-saved step ${currentStep}: ${STEPS[currentStep]}`);
    }, 500);
    return () => clearTimeout(wsPing);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep((p) => p + 1);
  };

  const getButtonLabel = () => {
    if (currentStep === 0) return 'Start Formulation';
    if (currentStep === STEPS.length - 1) return 'Generate Itinerary';
    return 'Save Draft & Continue';
  };

  return (
    <section id="ai-planner" className="w-full max-w-5xl mx-auto px-6 py-24 z-10 relative">
      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-gray-100 relative overflow-hidden">
        
        {/* Top Header & Progress */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h2 className="font-sans font-bold gap-3 flex items-center text-3xl text-tbo-indigo">
              Agent Flow
              <span className="bg-tbo-indigo text-white text-xs px-3 py-1 rounded-full font-mono font-medium tracking-wide">
                {percent === 100 ? 'READY' : 'DRAFT'}
              </span>
            </h2>
            <p className="font-serif italic text-xl text-gray-500 mt-2">
              Configure parameters to lock inventory.
            </p>
          </div>

          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 text-gray-100">
              <path
                className="text-gray-100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="text-tbo-turquoise transition-all duration-500 ease-out"
                strokeDasharray={`${percent}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute font-mono text-xs font-bold text-tbo-indigo">{percent}%</div>
          </div>
        </div>

        {/* Steps container */}
        <div className="min-h-[300px] font-sans">
          <div className="mb-8 flex gap-2 flex-wrap text-sm font-medium">
            {STEPS.map((step, idx) => (
              <div 
                key={step} 
                className={`px-4 py-2 rounded-full transition-colors ${
                  idx === currentStep ? 'bg-tbo-indigo text-white' : 
                  idx < currentStep ? 'bg-gray-100 text-gray-400' : 'bg-transparent text-gray-300'
                }`}
              >
                {step}
              </div>
            ))}
          </div>

          {/* Render Step Content */}
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            {currentStep === 1 && (
              <div className="space-y-6 max-w-xl">
                 <label className="block text-sm font-bold text-tbo-indigo">Overall Budget Amount</label>
                 <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                   <span className="text-gray-400 font-mono text-lg">$</span>
                   <input 
                     type="number" 
                     value={budget} 
                     onChange={(e)=>setBudget(e.target.value)} 
                     className="bg-transparent border-none outline-none font-mono text-2xl text-tbo-indigo w-full"
                   />
                 </div>
                 
                 <label className="block text-sm font-bold text-tbo-indigo mt-4">Expected Headcount</label>
                 <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                   <input 
                     type="number" 
                     value={headcount} 
                     onChange={(e)=>setHeadcount(Number(e.target.value))} 
                     className="bg-transparent border-none outline-none font-mono text-xl text-tbo-indigo w-full"
                   />
                 </div>

                 <div className="p-4 bg-tbo-indigo/5 rounded-2xl border border-tbo-indigo/10 flex items-center justify-between mt-6">
                   <span className="text-sm font-semibold text-tbo-indigo flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-tbo-turquoise"></span>
                     Est. cost per head
                   </span>
                   <span className="font-mono font-bold text-lg text-tbo-indigo">
                     ${headcount > 0 ? Math.round(budget / headcount) : 0}
                   </span>
                 </div>
              </div>
            )}
            
            {(currentStep !== 1) && (
              <div className="h-48 border-2 border-dashed border-gray-100 rounded-[2rem] flex items-center justify-center flex-col text-gray-400">
                <p className="font-serif italic text-lg mb-2">Simulated Form Component</p>
                <p className="font-mono text-xs uppercase tracking-widest">{STEPS[currentStep]}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Progress CTA */}
        <div className="mt-12 flex justify-end">
          <button 
            ref={btnRef}
            onClick={handleNext}
            className={`btn-magnetic relative overflow-hidden rounded-full font-sans font-semibold text-lg px-8 py-4 transition-all ${
              currentStep === STEPS.length - 1 ? 'bg-tbo-saffron text-white shadow-xl hover:bg-tbo-saffron/90' : 'bg-tbo-indigo text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {getButtonLabel()}
            {currentStep < STEPS.length - 1 && <span className="ml-2 font-mono opacity-50 text-xs">Cmd+Enter</span>}
          </button>
        </div>
      </div>
    </section>
  );
};

export default AgentForm;
