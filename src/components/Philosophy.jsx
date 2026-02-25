import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Philosophy = () => {
  const container = useRef(null);
  const bgRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax text background
      gsap.to(bgRef.current, {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: container.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });

      // Word reveal animation
      gsap.from('.reveal-word', {
        opacity: 0,
        y: 20,
        rotateX: -90,
        stagger: 0.05,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: container.current,
          start: 'top 60%',
        }
      });
    }, container);
    return () => ctx.revert();
  }, []);

  const line1 = 'Most event platforms focus on: generic inventory and one-size funnels.';
  const line2Part1 = 'We focus on: ';
  const line2Hi1 = 'locked group inventory';
  const line2Part2 = ', microsite experiences, and ';
  const line2Hi2 = 'AI-first itineraries';
  const line2Part3 = '.';

  const splitText = (text, customClasses = '') => {
    return text.split(' ').map((word, i) => (
      <span key={i} className={`reveal-word inline-block origin-bottom mr-3 ${customClasses}`}>
        {word}
      </span>
    ));
  };

  return (
    <section ref={container} className="relative w-full py-40 bg-tbo-indigo overflow-hidden flex items-center">
      {/* Background Parallax Image */}
      <div className="absolute inset-0 z-0">
        <img 
          ref={bgRef}
          src="https://images.unsplash.com/photo-1620121478247-ec786f913101?q=80&w=2500&auto=format&fit=crop" 
          alt="Dark textured fabric"
          className="w-full h-[130%] object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-tbo-indigo/80"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6">
        <div className="mb-12 font-sans text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed">
          {splitText(line1)}
        </div>
        
        <h2 className="font-serif italic text-4xl md:text-[5rem] leading-[1.1] text-white tracking-tight">
          {splitText(line2Part1)}
          {splitText(line2Hi1, 'text-tbo-gold')}
          {splitText(line2Part2)}
          {splitText(line2Hi2, 'text-tbo-gold')}
          {splitText(line2Part3)}
        </h2>
      </div>
    </section>
  );
};

export default Philosophy;
