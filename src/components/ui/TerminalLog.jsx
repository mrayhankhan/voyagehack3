import React from 'react';

/**
 * TerminalLog — reusable animated terminal display extracted from Create.jsx
 * Renders log lines with a blinking cursor, styled per the step variant.
 *
 * @param {{ lines: string[], textColorClass: string, pingColorClass: string, label: string }} props
 */
const TerminalLog = ({
    lines,
    textColorClass = 'text-tbo-emerald',
    pingColorClass = 'bg-tbo-emerald',
    label = 'WSS Connection Active',
}) => (
    <div
        className={`flex-1 bg-tbo-indigo rounded-2xl p-6 font-mono text-sm ${textColorClass} flex flex-col shadow-inner`}
    >
        <div className="flex items-center gap-2 mb-4">
            <div className={`w-2 h-2 rounded-full ${pingColorClass} animate-ping opacity-75`} />
            <span className="text-white text-xs uppercase tracking-widest">{label}</span>
        </div>
        {lines.map((txt, idx) => (
            <div key={idx} className="mb-2 opacity-90">
                &gt; {txt}
            </div>
        ))}
        <div className={`animate-pulse ${pingColorClass} w-2 h-4 mt-1`} />
    </div>
);

export default TerminalLog;
