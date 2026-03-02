import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { MapPin, Calculator, Globe } from 'lucide-react';

const Landing = () => {
  const container = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Slow drift animation for abstract shapes
      gsap.to('.shape-saffron', {
        x: 'random(-50, 50)',
        y: 'random(-50, 50)',
        rotation: 'random(-20, 20)',
        duration: 8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      });
      
      gsap.to('.shape-rani', {
        x: 'random(-40, 40)',
        y: 'random(-60, 60)',
        rotation: 'random(-15, 15)',
        duration: 10,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 1 // offset the animation
      });

      // Simple fade-in for content
      gsap.from('.fade-up', {
        y: 30,
        opacity: 0,
        stagger: 0.15,
        duration: 1,
        ease: 'power2.out',
        delay: 0.2
      });
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={container} className="min-h-screen bg-tbo-indigo text-white flex flex-col relative overflow-hidden font-sans">
      
      {/* Background Deep Indigo Gradient + Noise (from index.css) is active globally */}
      <div className="absolute inset-0 bg-gradient-to-b from-tbo-indigo via-[#110a1f] to-tbo-indigo border-none z-0 pointer-events-none"></div>

      {/* Abstract Animated Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40 mix-blend-screen">
        <div className="shape-saffron absolute top-[10%] left-[20%] w-[30vw] h-[30vw] min-w-[300px] min-h-[300px] rounded-full bg-tbo-saffron blur-[100px]"></div>
        <div className="shape-rani absolute top-[40%] right-[10%] w-[40vw] h-[40vw] min-w-[400px] min-h-[400px] rounded-[40%] bg-tbo-rani blur-[120px]"></div>
      </div>

      {/* Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10 py-32">
        <div className="max-w-4xl mx-auto w-full">
           <h1 className="fade-up font-serif italic text-6xl md:text-8xl tracking-tight mb-6 leading-tight">
             Destination Weddings.<br/>
             <span className="font-sans font-bold not-italic text-5xl md:text-7xl">Simplified.</span>
           </h1>
           
           <p className="fade-up text-lg md:text-2xl text-gray-300 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
             Plan your dream destination wedding with AI-powered planning and curated luxury venues.
           </p>

           <div className="fade-up">
              <button 
                onClick={() => navigate('/agent/login')}
                className="bg-white text-tbo-indigo px-10 py-5 rounded-full font-sans font-bold text-lg hover:bg-gray-100 transition-colors shadow-2xl hover:scale-105"
                style={{ transition: 'transform 0.3s ease, background-color 0.2s ease' }}
              >
                Start Planning
              </button>
           </div>
        </div>
      </main>

      {/* Minimal Features Row */}
      <section className="relative z-10 max-w-6xl mx-auto w-full px-6 pb-24 text-center">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="fade-up bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center">
               <MapPin className="text-tbo-saffron mb-4" size={36} strokeWidth={1.5} />
               <h3 className="font-sans font-bold text-xl text-white">Curated Destinations</h3>
            </div>
            
            <div className="fade-up bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center">
               <Calculator className="text-tbo-emerald mb-4" size={36} strokeWidth={1.5} />
               <h3 className="font-sans font-bold text-xl text-white">Smart Budget Planning</h3>
            </div>
            
            <div className="fade-up bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center">
               <Globe className="text-tbo-turquoise mb-4" size={36} strokeWidth={1.5} />
               <h3 className="font-sans font-bold text-xl text-white">Guest Microsite & RSVP</h3>
            </div>
         </div>
      </section>

      {/* Minimal Footer */}
      <footer className="relative z-10 w-full text-center py-12 border-t border-white/10 mt-auto">
        <div className="font-sans font-bold text-2xl mb-2 text-white">saathi</div>
        <p className="font-serif italic text-gray-400">Destination Weddings meet Celebration.</p>
      </footer>
    </div>
  );
};

export default Landing;
