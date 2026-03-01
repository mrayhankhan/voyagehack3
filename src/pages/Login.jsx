import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Shield, Users, Building2 } from 'lucide-react';

const Login = () => {
  const container = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loadingRole, setLoadingRole] = useState(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.login-card', {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: 'power2.out'
      });
      gsap.from('.role-btn', {
        opacity: 0,
        y: 10,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.2
      });
    }, container);
    return () => ctx.revert();
  }, []);

  const handleAuth = (roleConfig) => {
    setLoadingRole(roleConfig.id);
    setTimeout(() => {
      login({ name: roleConfig.name, email: roleConfig.email, role: roleConfig.role });
      navigate('/agent/dashboard');
    }, 600);
  };

  const roles = [
    {
      id: 'agent',
      role: 'AGENT',
      name: 'Sarah (Agent)',
      email: 'agent@tbo.com',
      icon: Shield,
      title: 'Agent',
      desc: 'Full access to financials, margins, and contracts.',
      iconColor: 'text-gray-400'
    },
    {
      id: 'planner',
      role: 'PLANNER',
      name: 'James (Planner)',
      email: 'planner@tbo.com',
      icon: Users,
      title: 'Planner',
      desc: 'Manages guests, RSVPs, and room allocations. No financials.',
      iconColor: 'text-gray-500'
    },
    {
      id: 'supplier',
      role: 'SUPPLIER',
      name: 'Taj Hotels (Supplier)',
      email: 'supplier@taj.com',
      icon: Building2,
      title: 'Supplier',
      desc: 'Manages inventory and fulfillment. No margins or contract edits.',
      iconColor: 'text-gray-600'
    }
  ];

  return (
    <div ref={container} className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative font-sans">

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-black rounded-b-[4rem] shadow-xl z-0" />

      <div className="login-card bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-lg text-center z-10">

        <div className="font-bold text-5xl text-black mb-2 tracking-tight">tbo</div>
        <div className="text-sm font-semibold text-gray-400 tracking-widest uppercase mb-8">Role Simulation</div>

        <div className="space-y-4 text-left">
          {roles.map((r) => {
            const Icon = r.icon;
            const isLoading = loadingRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleAuth(r)}
                disabled={loadingRole !== null}
                className={`role-btn w-full p-5 rounded-2xl flex items-start gap-4 transition-all duration-200 border-2 disabled:opacity-50 disabled:cursor-not-allowed 
                  ${r.id === 'agent' ? 'bg-black border-black text-white hover:bg-gray-900 hover:border-gray-900' : ''}
                  ${r.id === 'planner' ? 'bg-white border-gray-200 text-black hover:bg-gray-50 hover:border-gray-400' : ''}
                  ${r.id === 'supplier' ? 'bg-white border-gray-200 text-black hover:bg-gray-50 hover:border-gray-400' : ''}
                  ${loadingRole === r.id ? 'scale-95' : 'hover:scale-[1.02]'}
                `}
              >
                <div className={`mt-1 p-2 rounded-xl bg-gray-100 ${r.iconColor}`}>
                  {isLoading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Icon size={20} />}
                </div>
                <div className="flex-1">
                  <div className={`font-bold text-lg ${r.id !== 'agent' ? 'text-black' : ''}`}>{r.title}</div>
                  <div className={`text-xs mt-1 leading-relaxed ${r.id === 'agent' ? 'text-gray-300' : 'text-gray-500'}`}>
                    {r.desc}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

      </div>
    </div>
  );
};

export default Login;
