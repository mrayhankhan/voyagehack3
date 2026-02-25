import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PROTOCOL_STEPS = [
  {
    id: '01',
    title: 'Discover',
    subtitle: 'AI shortlists & budget match.',
    desc: 'Our intelligence engine cross-references millions of combinations to pinpoint destinations and properties that perfectly align with your vision and locked budget.',
    color: 'bg-page-bg text-tbo-indigo',
    icon: (
      <svg className="w-24 h-24 text-tbo-turquoise mb-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
        <path d="M12 8v4l3 3"></path>
        <path d="M16.24 7.76l-1.06 1.06"></path>
        <path d="M7.76 7.76l1.06 1.06"></path>
        <path d="M16.24 16.24l-1.06-1.06"></path>
        <path d="M7.76 16.24l1.06-1.06"></path>
      </svg>
    )
  },
  {
    id: '02',
    title: 'Secure',
    subtitle: 'Rate holds & group allotment.',
    desc: 'Bypass manual negotiations. Instantly secure room blocks, event spaces, and favorable rate holds via our direct supplier endpoints.',
    color: 'bg-tbo-saffron text-white',
    icon: (
      <svg className="w-24 h-24 text-white mb-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <path d="M9 12l2 2 4-4"></path>
      </svg>
    )
  },
  {
    id: '03',
    title: 'Deliver',
    subtitle: 'Microsite & Guest bookings.',
    desc: 'Automatically generate a breathtaking, fully-branded microsite. Let guests book their own rooms against your inventory, while you track the analytics.',
    color: 'bg-tbo-indigo text-white',
    icon: (
      <svg className="w-24 h-24 text-tbo-rani mb-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"></path>
        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
      </svg>
    )
  }
];

const Protocol = () => {
  const containerRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Pinning the whole container
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: `+=${window.innerHeight * 3}`,
        pin: true,
        scrub: true,
        animation: gsap.timeline()
          // Card 1 scales down when card 2 comes up
          .to(cardsRef.current[0], { scale: 0.9, filter: 'blur(10px)', opacity: 0.5, yPercent: -10, duration: 1 }, 0)
          .fromTo(cardsRef.current[1], { yPercent: 100 }, { yPercent: 0, duration: 1 }, 0)
          
          // Card 2 scales down when card 3 comes up
          .to(cardsRef.current[1], { scale: 0.9, filter: 'blur(10px)', opacity: 0.5, yPercent: -10, duration: 1 }, 1)
          .fromTo(cardsRef.current[2], { yPercent: 100 }, { yPercent: 0, duration: 1 }, 1)
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="protocol" ref={containerRef} className="w-full h-screen overflow-hidden relative bg-page-bg">
      {PROTOCOL_STEPS.map((step, index) => (
        <div 
          key={step.id}
          ref={el => cardsRef.current[index] = el}
          className={`absolute inset-0 flex flex-col justify-center items-center w-full h-full p-8 ${step.color}`}
          style={{ zIndex: index + 1 }}
        >
          <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <span className="font-mono text-xl opacity-50 mb-4 block">{step.id} — The Method</span>
              <h2 className="font-sans font-bold text-5xl md:text-7xl mb-6 tracking-tight">{step.title}</h2>
              <h3 className="font-serif italic text-2xl md:text-3xl mb-6 opacity-90">{step.subtitle}</h3>
              <p className="font-sans text-lg md:text-xl opacity-80 leading-relaxed max-w-lg">
                {step.desc}
              </p>
            </div>
            
            <div className="flex-1 flex justify-center items-center">
              <div className="w-64 h-64 md:w-96 md:h-96 rounded-full border border-current/20 flex items-center justify-center relative">
                {/* Decorative rings */}
                <div className="absolute inset-4 rounded-full border border-current/10 animate-[spin_20s_linear_infinite]"></div>
                <div className="absolute inset-12 rounded-full border border-current/10 animate-[spin_15s_linear_infinite_reverse]"></div>
                {step.icon}
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
};

export default Protocol;
