import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const heroRef = useRef(null);
  const textRef = useRef(null);
  const petalRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Staggered text reveal
      gsap.from('.hero-text-chunk', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: 'power3.out',
        delay: 0.2
      });

      // Subtle parallax on the marigold petal
      gsap.to(petalRef.current, {
        yPercent: 150,
        rotate: 45,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        }
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative w-full h-[100dvh] overflow-hidden flex items-end">
      {/* Background Image: vibrant mandap/ceremony in golden hour */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1544256226-c22faae3d4ea?q=80&w=2600&auto=format&fit=crop" 
          alt="Colorful Indian wedding canopy"
          className="w-full h-full object-cover"
        />
        {/* Heavy Saffron -> Black gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-tbo-saffron/40 to-transparent"></div>
      </div>

      {/* Floating Marigold Petal SVG */}
      <div ref={petalRef} className="absolute right-[20%] top-[40%] z-10 w-12 h-12 text-tbo-saffron opacity-80 pointer-events-none">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 0 C60 30 90 40 100 50 C90 60 60 70 50 100 C40 70 10 60 0 50 C10 40 40 30 50 0 Z" />
        </svg>
      </div>

      {/* Content anchored bottom-left third */}
      <div ref={textRef} className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-24 md:pb-32">
        <div className="max-w-3xl">
          <h1 className="flex flex-col gap-2">
            <span className="hero-text-chunk font-sans font-bold text-3xl md:text-5xl text-white tracking-tight">
              Destination Weddings meet
            </span>
            <span className="hero-text-chunk font-serif italic text-7xl md:text-[8rem] leading-none text-white font-light tracking-tighter">
              Celebration.
            </span>
          </h1>
          
          <p className="hero-text-chunk mt-8 text-lg font-mono text-white/80 max-w-lg">
            AI planning • Branded microsites • Group inventory locking
          </p>

          <div className="hero-text-chunk flex flex-wrap items-center gap-4 mt-12">
            <button className="btn-magnetic bg-tbo-rani text-white px-8 py-4 rounded-full font-sans font-semibold text-lg hover:shadow-[0_0_20px_rgba(231,58,119,0.5)] transition-shadow">
              Start AI Planner
            </button>
            <button className="btn-magnetic border-2 border-tbo-gold text-tbo-gold px-8 py-4 rounded-full font-sans font-semibold text-lg hover:bg-tbo-gold hover:text-tbo-indigo transition-colors relative overflow-hidden btn-slide">
              <span className="slide-bg bg-tbo-gold"></span>
              Request Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
