import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

interface ChoiceButtonProps {
    selected: boolean;
    onClick: () => void;
    label: string;
    icon?: LucideIcon;
    subtext?: string;
}

export const ChoiceButton: React.FC<ChoiceButtonProps> = React.memo(({
    selected,
    onClick,
    label,
    icon: Icon,
    subtext
}) => (
    <button
        onClick={onClick}
        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${selected
            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md ring-1 ring-indigo-400'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
            }`}
    >
        <div className="flex items-center justify-between">
            <span className={`font-bold text-lg ${selected ? 'text-white' : 'text-slate-900'}`}>{label}</span>
            {Icon && <Icon className={`h-6 w-6 ${selected ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`} />}
        </div>
        {subtext && <p className={`text-xs mt-1 ${selected ? 'text-indigo-100' : 'text-slate-500'}`}>{subtext}</p>}
    </button>
));

ChoiceButton.displayName = 'ChoiceButton';
