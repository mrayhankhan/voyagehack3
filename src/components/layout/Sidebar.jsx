import React from 'react';
import { LayoutDashboard, PlusCircle, Globe, LogOut, ArrowLeftRight, BarChart2 } from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';

/**
 * Sidebar — agent dashboard left nav, extracted from Dashboard.jsx
 */
const Sidebar = ({ onNavigate, onLogout }) => {
    const { user, canSeeMargin } = useAuth();

    return (
        <aside className="w-64 bg-tbo-indigo text-white flex flex-col p-8 fixed h-full z-20">
            <div className="font-bold text-4xl tracking-tight mb-16">tbo</div>

            <nav className="flex-1 space-y-1 mt-6">
                <button
                    onClick={() => onNavigate('/agent/dashboard')}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl bg-tbo-saffron/10 text-tbo-saffron font-bold"
                >
                    <LayoutDashboard size={20} /> Master Tracker
                </button>
                <button
                    onClick={() => onNavigate('/agent/create')}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                    <PlusCircle size={20} /> New RFP
                </button>
                <button className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors relative group">
                    <Globe size={20} /> Deploy Microsite
                    <span className="absolute right-4 text-[9px] font-bold bg-gray-800 text-gray-300 px-2 py-0.5 rounded-md hidden group-hover:block">CMD+D</span>
                </button>

                {canSeeMargin && (
                    <>
                        <button
                            onClick={() => onNavigate('/agent/exchange')}
                            className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <ArrowLeftRight size={20} /> Exchange
                        </button>
                        <button
                            onClick={() => onNavigate('/agent/margin')}
                            className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <BarChart2 size={20} /> Margin Intelligence
                        </button>
                    </>
                )}
            </nav>

            <button
                onClick={onLogout}
                className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors mt-auto"
            >
                <LogOut size={20} /> Logout
            </button>
        </aside>
    );
};

export default Sidebar;
