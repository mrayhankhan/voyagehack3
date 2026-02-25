import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

const Login = () => {
  const container = useRef(null);
  const navigate = useNavigate();
  const login = useStore(state => state.login);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.login-card', {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: 'power2.out'
      });
    }, container);
    return () => ctx.revert();
  }, []);

  const handleAuth = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login({ name: 'Demo Agent', email: email || 'agent@tbo.com' });
      navigate('/agent/dashboard');
    }, 600);
  };

  return (
    <div ref={container} className="min-h-screen bg-tbo-indigo flex flex-col items-center justify-center p-6 relative font-sans">
      <div className="login-card bg-white p-10 md:p-12 rounded-[2.5rem] shadow-xl w-full max-w-md text-center">
        
        <div className="font-bold text-4xl text-tbo-indigo mb-8 tracking-tight">tbo</div>

        <form onSubmit={handleAuth} className="space-y-5 text-left mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Email</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@tbo.com"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-tbo-indigo outline-none focus:border-tbo-saffron transition-colors"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-tbo-indigo text-white py-4 rounded-full font-bold text-lg mt-4 shadow-lg hover:bg-[#2A1B4E] transition-colors disabled:opacity-70"
          >
            {isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <p className="text-xs text-gray-400 font-mono tracking-widest uppercase">Agent access only</p>
      </div>
    </div>
  );
};

export default Login;
