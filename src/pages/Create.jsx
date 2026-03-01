import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

// Hooks
import { useAuth } from '../hooks/useAuth';
import { useEvent } from '../hooks/useEvent';
import { useTerminalSimulator } from '../hooks/useTerminalSimulator';

// Services
import {
  WORKFLOW_STEPS,
  validateStep,
  createEventFromForm,
  DEFAULT_ITINERARY,
} from '../services/event.service';
import { calculateCostPerHead } from '../services/contract.service';
import {
  DESTINATION_OPTIONS,
  getDestinationSearchLogs,
  getInventoryLockLogs,
} from '../services/inventory.service';

// UI Components
import StepIndicator from '../components/ui/StepIndicator';
import TerminalLog from '../components/ui/TerminalLog';

const Create = () => {
  const container = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addEvent } = useEvent();
  const { isProcessing, terminalText, simulate } = useTerminalSimulator();

  const [step, setStep] = useState(0);
  const [percent, setPercent] = useState(0);

  const [formData, setFormData] = useState({
    brideName: '',
    groomName: '',
    contact: '',
    budget: 50000,
    headcount: 150,
    dates: '',
    timings: '',
    destination: '',
    eventId: '',
  });

  useEffect(() => {
    if (!user) navigate('/agent/login');
  }, [user, navigate]);

  useEffect(() => {
    setPercent(Math.round((step / (WORKFLOW_STEPS.length - 1)) * 100));
  }, [step]);

  useEffect(() => {
    if (panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out', clearProps: 'all' }
      );
    }
  }, [step]);

  const handleNext = () => {
    if (step === 4 && formData.budget > 0) {
      simulate(getDestinationSearchLogs(formData), () => setStep((s) => s + 1));
      return;
    }
    if (step === 6) {
      simulate(getInventoryLockLogs(formData), () => setStep((s) => s + 1));
      return;
    }
    if (step < WORKFLOW_STEPS.length - 1) setStep((s) => s + 1);
  };

  const handleLaunch = () => {
    const newEvent = createEventFromForm(formData);
    addEvent(newEvent);
    navigate(`/microsite/${newEvent.id}`);
  };

  const isStepValid = () => validateStep(step, formData);

  if (!user) return null;

  return (
    <div ref={container} className="min-h-screen bg-page-bg flex flex-col items-center py-12 px-6 font-sans">

      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full mb-10 flex items-center justify-between">
        <button onClick={() => navigate('/agent/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-tbo-indigo transition-colors font-semibold">
          <ArrowLeft size={18} /> Dashboard
        </button>
        <div className="flex items-center gap-4">
          <div className="font-mono text-sm tracking-widest text-tbo-indigo font-bold uppercase">
            Formulation Engine
          </div>
          {/* SVG Progress Ring */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 text-gray-200">
              <path className="text-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
              <path className="text-tbo-emerald transition-all duration-500 ease-out" strokeDasharray={`${percent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <div className="absolute font-mono text-[10px] font-bold text-tbo-indigo">{percent}%</div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-12">

        {/* Progress Sidebar */}
        <div className="w-full md:w-1/4 hidden md:block">
          <StepIndicator steps={WORKFLOW_STEPS} currentStep={step} />
        </div>

        {/* Active Panel */}
        <div className="w-full md:w-3/4 bg-white border border-gray-100 shadow-xl rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden flex flex-col min-h-[500px]">
          <div ref={panelRef} className="flex-1">

            {/* STEP 0: Client Info */}
            {step === 0 && (
              <div className="space-y-6">
                <h3 className="font-bold text-3xl text-tbo-indigo mb-6 tracking-tight">Client Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 mb-2">Bride Name</label>
                    <input type="text" value={formData.brideName} onChange={e => setFormData({ ...formData, brideName: e.target.value })} placeholder="Jane Doe" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-tbo-indigo outline-none focus:border-tbo-saffron" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 mb-2">Groom Name</label>
                    <input type="text" value={formData.groomName} onChange={e => setFormData({ ...formData, groomName: e.target.value })} placeholder="John Smith" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-tbo-indigo outline-none focus:border-tbo-saffron" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Primary Contact (Email/Phone)</label>
                  <input type="text" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} placeholder="jane@example.com" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-tbo-indigo outline-none focus:border-tbo-saffron" />
                </div>
              </div>
            )}

            {/* STEP 1: Budget */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-bold text-3xl text-tbo-indigo mb-6 tracking-tight">Budget Allocation</h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Total Budget (USD)</label>
                  <input type="number" value={formData.budget} onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-mono text-xl text-tbo-indigo outline-none focus:border-tbo-saffron" />
                </div>
              </div>
            )}

            {/* STEP 2: Headcount & Dates */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="font-bold text-3xl text-tbo-indigo mb-6 tracking-tight">Scale & Timeline</h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Expected Headcount</label>
                  <input type="number" value={formData.headcount} onChange={e => setFormData({ ...formData, headcount: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-mono text-xl text-tbo-indigo outline-none focus:border-tbo-saffron" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Requested Dates (e.g. Oct 12-15)</label>
                  <input type="text" value={formData.dates} onChange={e => setFormData({ ...formData, dates: e.target.value })} placeholder="Enter date range" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-tbo-indigo outline-none focus:border-tbo-saffron" />
                </div>
                <div className="p-5 bg-tbo-indigo/5 rounded-2xl border border-tbo-indigo/10 flex items-center justify-between mt-6">
                  <span className="text-sm font-bold text-tbo-indigo">Live Est. Cost per Head (Computed)</span>
                  <span className="font-mono font-bold text-2xl text-tbo-emerald">
                    ${calculateCostPerHead(formData.budget, formData.headcount).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* STEP 3: Events & Timings */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="font-bold text-3xl text-tbo-indigo mb-6 tracking-tight">Events Selection</h3>
                <label className="block text-sm font-semibold text-gray-500 mb-2">What events are requested?</label>
                <textarea
                  value={formData.timings}
                  onChange={e => setFormData({ ...formData, timings: e.target.value })}
                  placeholder="e.g. Welcome Dinner, Haldi, Sangeet, Wedding, Reception"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-tbo-indigo outline-none focus:border-tbo-saffron min-h-[150px]"
                />
              </div>
            )}

            {/* STEP 4: Destination Selection */}
            {step === 4 && (
              <div className="space-y-6 h-full flex flex-col">
                <h3 className="font-bold text-3xl text-tbo-indigo tracking-tight">Destination Shortlist</h3>
                <p className="text-gray-500 mb-6 font-medium">AI matching based on ${formData.budget} budget and {formData.headcount} pax.</p>
                {isProcessing ? (
                  <TerminalLog
                    lines={terminalText}
                    textColorClass="text-tbo-emerald"
                    pingColorClass="bg-tbo-emerald"
                    label="WSS Connection Active"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {DESTINATION_OPTIONS.map((dest) => (
                      <div
                        key={dest}
                        onClick={() => setFormData({ ...formData, destination: dest })}
                        className={`cursor-pointer border-2 rounded-2xl p-6 transition-all ${formData.destination === dest ? 'border-tbo-saffron bg-tbo-saffron/5 shadow-md' : 'border-gray-100 hover:border-gray-300'
                          }`}
                      >
                        <h4 className="font-bold text-tbo-indigo mb-2">{dest}</h4>
                        <p className="font-mono text-sm text-tbo-emerald font-bold mb-4">Fits Budget</p>
                        <ul className="text-xs text-gray-500 space-y-1">
                          <li>✓ Venue available</li>
                          <li>✓ 4 Flights/day</li>
                          <li>✓ High vendor rating</li>
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: AI Itinerary */}
            {step === 5 && (
              <div className="space-y-6">
                <h3 className="font-bold text-3xl text-tbo-indigo mb-6 tracking-tight">Generated Itinerary</h3>
                <div className="space-y-4">
                  {DEFAULT_ITINERARY.map(item => (
                    <div key={item.d} className="flex gap-6 items-center bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                      <span className="font-mono text-tbo-saffron font-bold text-sm w-12">{item.d}</span>
                      <span className="font-sans font-bold text-tbo-indigo">{item.t}</span>
                      <span className="ml-auto text-xs text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">Auto-Scheduled</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 6: Lock Inventory */}
            {step === 6 && (
              <div className="space-y-6 h-full flex flex-col">
                <h3 className="font-bold text-3xl text-tbo-indigo tracking-tight">Lock Inventory</h3>
                <p className="text-gray-500 mb-6 font-medium">Securing global allocations for {formData.destination}.</p>
                {isProcessing ? (
                  <TerminalLog
                    lines={terminalText}
                    textColorClass="text-tbo-rani"
                    pingColorClass="bg-tbo-rani"
                    label="Inventory Extranet"
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-tbo-emerald/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={40} className="text-tbo-emerald" />
                    </div>
                    <h4 className="font-bold text-2xl text-tbo-indigo mb-2">Blocks Secured</h4>
                    <p className="text-gray-500">Inventory guarantees have been registered.</p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 7: Launch Microsite */}
            {step === 7 && (
              <div className="space-y-6 text-center py-8">
                <h3 className="font-bold text-4xl text-tbo-indigo mb-4 tracking-tight">Ready for Deployment</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-10 text-lg">
                  The workflow is complete. We have generated a unique branded guest portal containing RSVPs, secured itinerary, and booking links.
                </p>
                <div className="inline-block bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8 w-full max-w-sm">
                  <div className="font-mono text-xs text-gray-400 mb-2 uppercase tracking-widest">Event Hash UUID</div>
                  <div className="font-mono text-tbo-indigo font-bold bg-white border border-gray-100 p-2 rounded-lg">
                    {(Math.random() * 100000000).toString(16).toUpperCase()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Persistent Action Bar */}
          <div className="mt-8 pt-8 border-t border-gray-100 flex justify-end">
            {step === 7 ? (
              <button
                onClick={handleLaunch}
                className="btn-magnetic bg-tbo-rani text-white px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
              >
                View Guest Microsite
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!isStepValid() || isProcessing}
                className="bg-tbo-indigo text-white px-10 py-4 rounded-full font-bold shadow-md hover:bg-[#2A1B4E] focus:ring-4 focus:ring-tbo-indigo/20 disabled:opacity-50 transition-all w-full md:w-auto"
              >
                {step === 4 || step === 6 ? 'Initialize Target AI' : 'Save & Continue'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Create;
