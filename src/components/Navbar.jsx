import React, { useEffect, useState } from 'react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 rounded-full px-8 py-3.5 flex items-center gap-8 ${
      scrolled ? 'bg-page-bg/60 backdrop-blur-xl border border-gray-200/50 shadow-sm' : 'bg-transparent text-white'
    }`}>
      <div className="font-sans font-bold text-2xl tracking-tight">
        <span className={scrolled ? 'text-tbo-indigo' : 'text-white'}>tbo</span>
      </div>
      
      <div className={`hidden md:flex items-center gap-6 font-sans text-sm font-medium ${scrolled ? 'text-tbo-indigo' : 'text-white/90'}`}>
        <a href="#features" className="hover:text-tbo-saffron transition-colors">Features</a>
        <a href="#protocol" className="hover:text-tbo-saffron transition-colors">Protocol</a>
        <a href="#pricing" className="hover:text-tbo-saffron transition-colors">Pricing</a>
      </div>

      <button className={`btn-magnetic ml-2 md:ml-4 px-6 py-2.5 rounded-full font-sans font-medium text-sm transition-colors ${
        scrolled ? 'bg-tbo-rani text-white hover:bg-tbo-rani/90' : 'bg-tbo-rani text-white hover:bg-white hover:text-tbo-rani'
      }`}>
        Start AI Planner
      </button>
    </nav>
  );
};

export default Navbar;
