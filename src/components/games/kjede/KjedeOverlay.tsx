// DOM-laget over kanvaset. Alt som må være skarpt og lesbart på projektor bor
// her, ikke i kanvaset: tastehint, forklaringen i feilsporet og drivkraft-valget.

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownCircle, Sparkles } from 'lucide-react';
import type { DrivkraftId, KjedeFeil } from '../../../types/kjede';
import { DRIVKREFTER } from './drivkrefter';

interface Props {
    fase: string;
    tenkeandel: number;
    arsak: string;
    valg: string[];
    aktivFeil: KjedeFeil | null;
    tilbudte: DrivkraftId[] | null;
    onVelgDrivkraft: (id: DrivkraftId) => void;
}

export const KjedeOverlay: React.FC<Props> = ({
    fase,
    tenkeandel,
    arsak,
    valg,
    aktivFeil,
    tilbudte,
    onVelgDrivkraft,
}) => (
    <>
        {/*
          Hele spillet er tegnet i kanvas, så årsaken og de tre påstandene er
          usynlige for skjermlesere. Her speiles de i DOM-en. Teksten endrer seg
          bare når et nytt ledd dukker opp, ikke for hver ramme, så aria-live
          leser opp én gang per valg.
        */}
        <div className="sr-only" role="status" aria-live="polite">
            {fase === 'tenk' && valg.length > 0 && (
                <p>
                    {`Du står på: ${arsak} Hva skjedde så? ${valg.join('. ')}`}
                </p>
            )}
            {(fase === 'feilspor' || fase === 'klatre') && aktivFeil && (
                <p>{`Feil. ${aktivFeil.tekst} ${aktivFeil.hvorfor}`}</p>
            )}
        </div>

        <AnimatePresence>
            {fase === 'tenk' && (
                <motion.div
                    key="hint"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    // Øvre venstre er det eneste hjørnet som aldri kolliderer med
                    // verken valgsteinene (høyre) eller årsak-steinen (nede til venstre)
                    className="pointer-events-none absolute left-4 top-4 flex items-center gap-3 rounded-full bg-slate-900/85 px-5 py-2.5 text-white shadow-lg"
                >
                    <span className="font-semibold">
                        Hva skjedde så? Trykk <kbd className="font-mono">1</kbd>,{' '}
                        <kbd className="font-mono">2</kbd> eller <kbd className="font-mono">3</kbd>
                    </span>
                    <span className="h-2 w-24 overflow-hidden rounded-full bg-white/25">
                        <span
                            className="block h-full rounded-full bg-amber-400"
                            style={{ width: `${Math.round(tenkeandel * 100)}%` }}
                        />
                    </span>
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {(fase === 'feilspor' || fase === 'klatre') && aktivFeil && (
                <motion.div
                    key="feilspor"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="pointer-events-none absolute top-4 left-1/2 w-[min(92%,700px)] -translate-x-1/2 rounded-2xl border-2 border-rose-200 bg-white/95 p-5 shadow-xl backdrop-blur"
                >
                    <p className="mb-1 text-base font-semibold text-rose-700 line-through decoration-rose-400">
                        {aktivFeil.tekst}
                    </p>
                    <p className="text-xl font-medium leading-snug text-slate-800">
                        {aktivFeil.hvorfor}
                    </p>
                    <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                        <ArrowDownCircle className="h-4 w-4" />
                        Trykk mellomrom for å klatre opp igjen
                    </p>
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {fase === 'drivkraft' && tilbudte && (
                <motion.div
                    key="drivkraft"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.94, y: 16 }}
                        animate={{ scale: 1, y: 0 }}
                        className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl"
                    >
                        <div className="mb-1 flex items-center gap-2 text-amber-600">
                            <Sparkles className="h-5 w-5" />
                            <span className="font-semibold uppercase tracking-wide">Drivkraft</span>
                        </div>
                        <h3 className="mb-1 font-display text-2xl font-bold text-slate-900">
                            Hva driver historien videre?
                        </h3>
                        <p className="mb-5 text-slate-600">
                            Velg én. Den følger deg resten av kjeden.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {tilbudte.map((id) => {
                                const d = DRIVKREFTER[id];
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => onVelgDrivkraft(id)}
                                        className="group rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-left transition-all hover:-translate-y-1 hover:border-indigo-400 hover:bg-white hover:shadow-lg"
                                    >
                                        <div className="font-display text-xl font-bold text-slate-900 group-hover:text-indigo-700">
                                            {d.navn}
                                        </div>
                                        <p className="mt-1 text-sm font-medium text-slate-700">
                                            {d.effekt}
                                        </p>
                                        <p className="mt-2 text-sm italic text-slate-500">
                                            {d.begrunnelse}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </>
);
