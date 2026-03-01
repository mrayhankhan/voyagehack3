import { useState } from 'react';

/**
 * useTerminalSimulator — encapsulates the fake terminal log animation.
 * Extracted from Create.jsx so pages stay free of timer/state logic.
 */
export const useTerminalSimulator = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [terminalText, setTerminalText] = useState([]);

    /**
     * @param {string[]} logs - array of log line strings
     * @param {Function} onComplete - callback after final log is shown
     */
    const simulate = (logs, onComplete) => {
        setIsProcessing(true);
        setTerminalText([]);
        let i = 0;
        const interval = setInterval(() => {
            setTerminalText((prev) => [...prev, logs[i]]);
            i++;
            if (i === logs.length) {
                clearInterval(interval);
                setTimeout(() => {
                    setIsProcessing(false);
                    if (onComplete) onComplete();
                }, 800);
            }
        }, 1200);
    };

    return { isProcessing, terminalText, simulate };
};
