import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp, Handshake, RotateCcw, Sparkles } from 'lucide-react';

// Lyspære-øyeblikket: eleven tror konfusianismens fem bånd bare handler om å lyde
// oppover. Ved å hente fram plikten som går TILBAKE i hvert bånd, oppdager eleven
// at den som står øverst skylder mest - og at ett av båndene er helt likt.

interface Bond {
    id: string;
    // Den som gir plikten oppover (den eleven forventer noe av).
    from: string;
    // Den som tar imot.
    to: string;
    // Plikten alle regner med: nedenfra og opp.
    known: string;
    // Plikten som går tilbake: ovenfra og ned.
    back: string;
    // Valgfri merknad, f.eks. kritikk av båndet i dag.
    note?: string;
}

interface FemRelasjoneneProps {
    title?: string;
    intro?: string;
    bonds?: Bond[];
    conclusion?: string;
}

const DEFAULT_BONDS: Bond[] = [
    {
        id: 'barn-foreldre',
        from: 'Barnet',
        to: 'Foreldrene',
        known: 'Barnet skal vise hengivenhet og høre på foreldrene sine.',
        back: 'Foreldrene skal ta vare på barnet og lære det opp til å bli et godt menneske.',
    },
    {
        id: 'yngre-eldre',
        from: 'Den yngste broren',
        to: 'Den eldste broren',
        known: 'Den yngste skal vise respekt for den eldste.',
        back: 'Den eldste skal verne den yngste og gå foran som et godt eksempel.',
    },
    {
        id: 'undersatt-fyrste',
        from: 'Undersåtten',
        to: 'Fyrsten',
        known: 'Undersåtten skal være lojal mot fyrsten.',
        back: 'Fyrsten skal styre rettferdig og sørge for at folket har det de trenger.',
    },
    {
        id: 'kone-mann',
        from: 'Kona',
        to: 'Ektemannen',
        known: 'Kona skal føye seg etter mannen.',
        back: 'Mannen skal sørge for kona og behandle henne rett.',
        note: 'Dette båndet er det som blir sterkest kritisert i dag, fordi det gjør kvinnen underordnet.',
    },
    {
        id: 'venn-venn',
        from: 'Vennen',
        to: 'Vennen',
        known: 'Vennen skal være ærlig mot vennen sin.',
        back: 'Og vennen skal være ærlig tilbake. Dette er det eneste båndet der begge to står helt likt.',
    },
];

type Phase = 'idle' | 'active' | 'complete';

export function FemRelasjonene({
    title = 'De fem båndene',
    intro = 'Klikk et bånd for å se hva som går tilbake den andre veien.',
    bonds = DEFAULT_BONDS,
    conclusion = 'Alle fem båndene går begge veier. Konfusianismen krever lydighet nedenfra, men den krever omsorg og rettferdighet ovenfra. Den som har mest makt i et bånd, har også størst ansvar.',
}: FemRelasjoneneProps) {
    const [revealed, setRevealed] = useState<string[]>([]);

    const phase: Phase = useMemo(() => {
        if (revealed.length === 0) return 'idle';
        return revealed.length === bonds.length ? 'complete' : 'active';
    }, [revealed.length, bonds.length]);

    const toggle = (id: string) => {
        setRevealed((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Handshake className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
                <div className="ml-auto shrink-0 text-sm font-semibold text-indigo-600 tabular-nums">
                    {revealed.length} / {bonds.length}
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-4 sm:p-5 space-y-3">
                {bonds.map((bond) => {
                    const open = revealed.includes(bond.id);
                    return (
                        <motion.button
                            key={bond.id}
                            type="button"
                            onClick={() => toggle(bond.id)}
                            whileTap={{ scale: open ? 1 : 0.985 }}
                            aria-expanded={open}
                            className={`w-full text-left rounded-xl border p-3 sm:p-4 transition-shadow ${
                                open
                                    ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                                    : 'bg-slate-50 border-slate-200 shadow-sm hover:shadow-md cursor-pointer'
                            }`}
                        >
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700">
                                    {bond.from}
                                </span>
                                <ArrowUp className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700">
                                    {bond.to}
                                </span>
                                {!open && (
                                    <span className="ml-auto text-xs font-medium text-indigo-600">
                                        Hva går tilbake?
                                    </span>
                                )}
                            </div>

                            <p className="mt-2 text-sm text-slate-600 flex gap-2">
                                <ArrowUp className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <span>{bond.known}</span>
                            </p>

                            <AnimatePresence initial={false}>
                                {open && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.28, ease: 'easeOut' }}
                                        className="overflow-hidden"
                                    >
                                        <p className="mt-2 pt-2 border-t border-emerald-200 text-sm text-emerald-800 flex gap-2">
                                            <ArrowDown className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>{bond.back}</span>
                                        </p>
                                        {bond.note && (
                                            <p className="mt-2 text-xs text-emerald-700/80">
                                                {bond.note}
                                            </p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="mx-4 sm:mx-5 mb-4">
                <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, scale: 0.94, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex gap-2"
                        >
                            <motion.span
                                initial={{ rotate: -25, scale: 0.6 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                            >
                                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            </motion.span>
                            <span>{conclusion}</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={phase}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            {phase === 'idle'
                                ? 'Pilen opp viser plikten alle regner med. Men konfusianismen har en pil til i hvert bånd.'
                                : `Du har funnet ${revealed.length} av ${bonds.length} bånd. Fortsett - ser du et mønster?`}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-4 sm:px-5 pb-4 flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={() => setRevealed(bonds.map((b) => b.id))}
                    disabled={phase === 'complete'}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
                >
                    Vis alle båndene
                </button>
                <button
                    type="button"
                    onClick={() => setRevealed([])}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors flex items-center gap-1.5"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
