import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full bg-[#1e1b4b] rounded-t-[4rem] text-white pt-24 pb-12 px-6 mt-20 relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="font-sans font-bold text-3xl tracking-tight text-white mb-6">tbo</div>
          <p className="font-mono text-sm text-gray-400">
            Digitize destination wedding planning.
          </p>
        </div>
        
        {/* Navigation */}
        <div className="flex flex-col gap-4 font-sans text-sm text-gray-300">
          <h4 className="text-white font-bold mb-2">Platform</h4>
          <a href="#ai-planner" className="hover:text-tbo-saffron transition-colors">AI Planner</a>
          <a href="#features" className="hover:text-tbo-saffron transition-colors">Microsites</a>
          <a href="#features" className="hover:text-tbo-saffron transition-colors">Group Inventory</a>
          <a href="#pricing" className="hover:text-tbo-saffron transition-colors">Pricing</a>
        </div>
        
        {/* Legal */}
        <div className="flex flex-col gap-4 font-sans text-sm text-gray-300">
          <h4 className="text-white font-bold mb-2">Legal</h4>
          <a href="#" className="hover:text-tbo-saffron transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-tbo-saffron transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-tbo-saffron transition-colors">Security</a>
        </div>

        {/* System Operational Tile */}
        <div className="md:col-span-1 flex items-start md:justify-end">
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 cursor-default">
            <div className="relative w-2 h-2 rounded-full bg-tbo-emerald flex items-center justify-center">
              <div className="absolute inset-0 bg-tbo-emerald rounded-full animate-ping opacity-75"></div>
            </div>
            <span className="font-mono text-xs text-tbo-emerald uppercase tracking-widest">System Operational</span>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 text-center font-serif flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="italic text-gray-400 text-sm">© {new Date().getFullYear()} tbo Inc. All rights reserved.</span>
        <span className="italic text-gray-400 text-sm">Destination Weddings meet Celebration.</span>
      </div>
    </footer>
  );
};

export default Footer;
