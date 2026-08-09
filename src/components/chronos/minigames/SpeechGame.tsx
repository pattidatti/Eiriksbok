import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import { MiniGameHeader } from './MiniGameHeader';
import type { ChronosEffect } from '../../../data/chronos/types';

interface SpeechResult {
    combo: string;
    effects?: ChronosEffect;
    setsFlag?: string;
}

interface SpeechGameProps {
    config: {
        onComplete: { nextNodeId: string };
        columns: Array<{
            label: string;
            options: Array<{
                id: string;
                text: string;
            }>;
        }>;
        outcomes: Array<{
            combo: string;
            feedback: string;
            effects?: ChronosEffect;
            setsFlag?: string;
        }>;
    };
    onComplete: (results: SpeechResult) => void;
}

export const SpeechGame: React.FC<SpeechGameProps> = ({ config, onComplete }) => {
    const [selections, setSelections] = useState<(string | null)[]>(
        config.columns.map(() => null)
    );
    const [submitted, setSubmitted] = useState(false);
    const [outcome, setOutcome] = useState<(typeof config.outcomes)[0] | null>(null);
    const [resultData, setResultData] = useState<SpeechResult | null>(null);

    const allSelected = selections.every((s) => s !== null);

    const handleSelect = (colIdx: number, optionId: string) => {
        setSelections((prev) => {
            const next = [...prev];
            next[colIdx] = optionId;
            return next;
        });
    };

    const getSpeechText = () =>
        selections
            .map((sel, i) => {
                const opt = config.columns[i].options.find((o) => o.id === sel);
                return opt?.text ?? '...';
            })
            .join(' · ');

    const handleSubmit = () => {
        const combo = selections.join('_');
        const found =
            config.outcomes.find((o) => o.combo === combo) ??
            config.outcomes[config.outcomes.length - 1];
        setOutcome(found);
        setResultData({ combo, effects: found?.effects, setsFlag: found?.setsFlag });
        setSubmitted(true);
    };

    if (submitted && outcome) {
        return (
            <div className="flex flex-col items-center p-8 bg-stone-100 rounded-3xl border border-stone-200 gap-4">
                <Mic className="text-stone-600" size={40} />
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
                        Din tale:
                    </p>
                    <p className="text-sm font-serif italic text-stone-700">&quot;{getSpeechText()}&quot;</p>
                </div>
                <div className="w-full max-w-sm bg-white rounded-2xl p-4 border border-stone-200">
                    <p className="text-sm text-stone-700 leading-relaxed">{outcome.feedback}</p>
                    {outcome.effects && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {Object.entries(outcome.effects).map(([k, v]) => (
                                <span
                                    key={k}
                                    className={`text-[10px] font-black uppercase tracking-wider ${v > 0 ? 'text-emerald-600' : 'text-red-600'}`}
                                >
                                    {v > 0 ? '+' : ''}
                                    {v} {k}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    onClick={() => resultData && onComplete(resultData)}
                    className="w-full py-3 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-colors"
                >
                    Fortsett
                </button>
            </div>
        );
    }

    return (
        <div className="bg-stone-100 rounded-3xl border border-stone-200 overflow-hidden">
            <MiniGameHeader icon={Mic} title="Talekonstruktøren" />

            <div className="p-4">
                {/* Speech preview */}
                <div className="bg-white rounded-2xl p-4 border border-stone-200 mb-4 min-h-[60px] flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">
                        Din tale:
                    </p>
                    <p className="text-sm font-serif italic text-stone-600">
                        {allSelected ? `"${getSpeechText()}"` : 'Velg fra kolonnene nedenfor...'}
                    </p>
                </div>

                {/* Columns */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {config.columns.map((col, colIdx) => (
                        <div key={colIdx}>
                            <div className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 text-center">
                                {col.label}
                            </div>
                            <div className="space-y-2">
                                {col.options.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleSelect(colIdx, opt.id)}
                                        className={`w-full p-2 rounded-xl text-xs text-center font-medium border transition-all ${
                                            selections[colIdx] === opt.id
                                                ? 'bg-stone-800 text-white border-stone-800 shadow-md'
                                                : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400 hover:shadow-sm'
                                        }`}
                                    >
                                        {opt.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!allSelected}
                    className="w-full py-3 bg-stone-900 text-white font-bold rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-800 transition-colors"
                >
                    {allSelected ? 'Hold talen' : 'Velg ett fra hver kolonne'}
                </button>
            </div>
        </div>
    );
};
