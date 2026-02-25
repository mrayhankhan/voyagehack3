import React from 'react';

const Pricing = () => {
  return (
    <section id="pricing" className="w-full max-w-7xl mx-auto px-6 py-40 z-10 relative">
      <div className="text-center mb-20 animate-in slide-in-from-bottom duration-700">
        <h2 className="font-sans font-bold text-4xl text-tbo-indigo mb-4">Membership Tiers</h2>
        <p className="font-serif italic text-2xl text-gray-500">Accelerate your destination agency.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {/* Tier 1 */}
        <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl hover:shadow-2xl transition-shadow text-center">
          <h3 className="font-sans font-bold text-xl text-gray-500 mb-2">Essential</h3>
          <div className="font-serif italic text-5xl text-tbo-indigo mb-6">$49<span className="text-lg text-gray-400 not-italic font-sans">/mo</span></div>
          <ul className="text-left space-y-4 font-sans text-gray-600 mb-8 max-w-xs mx-auto">
            <li className="flex gap-3">✓ Up to 3 active events</li>
            <li className="flex gap-3">✓ Basic Microsites</li>
            <li className="flex gap-3 text-gray-400">✗ Automated Rate Negotiation</li>
          </ul>
          <button className="w-full py-4 border-2 border-gray-200 text-gray-600 rounded-full font-bold transition-colors hover:border-tbo-indigo hover:text-tbo-indigo">
            Start Free Trial
          </button>
        </div>

        {/* Tier 2: Popped */}
        <div className="bg-tbo-saffron text-white rounded-[3rem] p-12 shadow-2xl scale-105 relative z-10 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-tbo-indigo text-white px-4 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase">
            Most Popular
          </div>
          <h3 className="font-sans font-bold text-xl mb-2 text-white/90">Performance</h3>
          <div className="font-serif italic text-6xl mb-6">$149<span className="text-lg text-white/70 not-italic font-sans">/mo</span></div>
          <ul className="text-left space-y-4 font-sans text-white/90 mb-8 max-w-xs mx-auto">
            <li className="flex gap-3">✓ Unlimited active events</li>
            <li className="flex gap-3">✓ Custom Branded Microsites</li>
            <li className="flex gap-3">✓ AI Planner & Smart Routing</li>
            <li className="flex gap-3">✓ Real-time Inventory Locks</li>
          </ul>
          <button className="btn-magnetic w-full py-4 bg-tbo-gold text-tbo-indigo rounded-full font-bold hover:shadow-[0_0_20px_rgba(255,215,0,0.5)] transition-shadow">
            Start AI Planner
          </button>
        </div>

        {/* Tier 3 */}
        <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl hover:shadow-2xl transition-shadow text-center">
          <h3 className="font-sans font-bold text-xl text-gray-500 mb-2">Enterprise</h3>
          <div className="font-serif italic text-5xl text-tbo-indigo mb-6">Custom</div>
          <ul className="text-left space-y-4 font-sans text-gray-600 mb-8 max-w-xs mx-auto">
            <li className="flex gap-3">✓ Everything in Performance</li>
            <li className="flex gap-3">✓ Dedicated API Access</li>
            <li className="flex gap-3">✓ White-label Infrastructure</li>
          </ul>
          <button className="w-full py-4 border-2 border-gray-200 text-gray-600 rounded-full font-bold transition-colors hover:border-tbo-indigo hover:text-tbo-indigo">
            Contact Sales
          </button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
