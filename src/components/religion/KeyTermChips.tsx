import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ReligionDimensionTerm } from '../../types';

interface KeyTermChipsProps {
    terms: ReligionDimensionTerm[];
    /** Fargen chipsene tones i - dimensjonens eller religionens */
    accent: string;
    /** Overskrift over chipsene. Sett til null for å utelate den. */
    heading?: string | null;
    compact?: boolean;
}

/**
 * «Ord du bør kunne» - fagbegrepene som chips, med forklaringen skjult til
 * eleven trykker. Lå først bare i religionsprofilen; sammenligningskortene
 * hadde de samme ordene som døde etiketter. Nå deler de oppførsel, så et
 * begrep forklarer seg selv uansett hvor eleven møter det.
 */
export const KeyTermChips: React.FC<KeyTermChipsProps> = ({
    terms,
    accent,
    heading = 'Ord du bør kunne',
    compact = false,
}) => {
    const [openTerm, setOpenTerm] = useState<string | null>(null);
    if (!terms || terms.length === 0) return null;

    const explanation = terms.find((t) => t.term === openTerm)?.explanation;

    return (
        <div>
            {heading && (
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    {heading}
                </h3>
            )}
            <div className="flex flex-wrap gap-1.5">
                {terms.map((term) => {
                    const isOpen = openTerm === term.term;
                    return (
                        <button
                            key={term.term}
                            type="button"
                            onClick={() => setOpenTerm(isOpen ? null : term.term)}
                            aria-expanded={isOpen}
                            className={`rounded-full font-bold transition-all border ${
                                compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-sm'
                            }`}
                            style={{
                                backgroundColor: isOpen ? accent : `${accent}14`,
                                borderColor: isOpen ? accent : `${accent}40`,
                                color: isOpen ? '#ffffff' : '#334155',
                            }}
                        >
                            {term.term}
                        </button>
                    );
                })}
            </div>
            <AnimatePresence mode="wait">
                {openTerm && (
                    <motion.p
                        key={openTerm}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`text-slate-600 leading-relaxed overflow-hidden ${
                            compact ? 'text-xs' : 'text-sm'
                        }`}
                    >
                        <span className="block pt-2.5">{explanation}</span>
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};
