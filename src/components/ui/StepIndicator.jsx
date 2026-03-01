import React from 'react';
import { CheckCircle2, CircleDashed } from 'lucide-react';

/**
 * StepIndicator — sidebar step tracker extracted from Create.jsx
 * @param {{ steps: string[], currentStep: number }} props
 */
const StepIndicator = ({ steps, currentStep }) => (
    <div className="space-y-4">
        {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-4">
                {i < currentStep ? (
                    <CheckCircle2 size={24} className="text-tbo-emerald flex-shrink-0" />
                ) : i === currentStep ? (
                    <CircleDashed size={24} className="text-tbo-indigo animate-spin-slow flex-shrink-0" />
                ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex-shrink-0" />
                )}
                <div
                    className={`font-sans font-semibold text-sm transition-colors ${i <= currentStep ? 'text-tbo-indigo' : 'text-gray-400'
                        }`}
                >
                    {s}
                </div>
            </div>
        ))}
    </div>
);

export default StepIndicator;
