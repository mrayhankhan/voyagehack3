import React from 'react';

/**
 * StatCard — reusable KPI card extracted from Dashboard.jsx
 * @param {{ label: string, value: string|number, color: string }} props
 */
const StatCard = ({ label, value, color }) => (
    <div className="stat-card bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
        <span className="text-sm font-semibold text-gray-500 mb-4">{label}</span>
        <span className={`font-serif italic text-4xl ${color} mt-auto overflow-hidden`}>{value}</span>
    </div>
);

export default StatCard;
