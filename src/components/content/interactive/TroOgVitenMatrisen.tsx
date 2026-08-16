import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Lightbulb, RotateCcw, HelpCircle, Eye } from 'lucide-react';

// Lyspære: ateisme og agnostisme svarer på TO ulike spørsmål. Ateisme handler om
// hva du tror. Agnostisme handler om hva mennesker kan vite. Derfor er de ikke to
// punkter på samme linje, og derfor kan du være begge deler samtidig.

interface TroOgVitenMatrisenProps {
    title?: string;
}

type Belief = 'tror' | 'tror-ikke';
type Knowledge = 'kan-vites' | 'kan-ikke-vites';

interface Cell {
    belief: Belief;
    knowledge: Knowledge;
    label: string;
    body: string;
}

const CELLS: Cell[] = [
    {
        belief: 'tror',
        knowledge: 'kan-vites',
        label: 'Sikker troende',
        body: 'Du tror at det finnes en gud, og du mener at mennesker kan vite det sikkert. Mange gjennom historien har ment nettopp dette.',
    },
    {
        belief: 'tror',
        knowledge: 'kan-ikke-vites',
        label: 'Troende agnostiker',
        body: 'Du tror at det finnes en gud, men mener at ingen kan vite det sikkert. Da er troen din et valg du tar, ikke noe du kan bevise for andre.',
    },
    {
        belief: 'tror-ikke',
        knowledge: 'kan-vites',
        label: 'Sikker ateist',
        body: 'Du tror ikke at det finnes noen gud, og du mener vi kan vite det. Dette er det strengeste ateist-standpunktet, og det er ikke det vanligste.',
    },
    {
        belief: 'tror-ikke',
        knowledge: 'kan-ikke-vites',
        label: 'Agnostisk ateist',
        body: 'Du tror ikke at det finnes noen gud, men mener at ingen kan vite det sikkert. Kjente ateister som Bertrand Russell og Richard Dawkins svarer omtrent slik: det lar seg ikke bevise, men de mener sjansen er så liten at de lever som om ingen gud finnes.',
    },
];

const BELIEFS: { value: Belief; label: string }[] = [
    { value: 'tror', label: 'Ja, jeg tror' },
    { value: 'tror-ikke', label: 'Nei, jeg tror ikke' },
];

const KNOWLEDGES: { value: Knowledge; label: string }[] = [
    { value: 'kan-vites', label: 'Ja, det kan vi vite' },
    { value: 'kan-ikke-vites', label: 'Nei, ingen kan vite det' },
];

export function TroOgVitenMatrisen({
    title = 'Tro og viten: to spørsmål, ikke ett',
}: TroOgVitenMatrisenProps) {
    const [belief, setBelief] = useState<Belief | null>(null);
    const [knowledge, setKnowledge] = useState<Knowledge | null>(null);

    const complete = belief !== null && knowledge !== null;
    const match = complete
        ? (CELLS.find((c) => c.belief === belief && c.knowledge === knowledge) ?? null)
        : null;

    const handleReset = () => {
        setBelief(null);
        setKnowledge(null);
    };

    const cellState = (c: Cell): 'active' | 'row' | 'idle' => {
        if (complete) return c.belief === belief && c.knowledge === knowledge ? 'active' : 'idle';
        if (belief !== null && c.belief === belief) return 'row';
        if (knowledge !== null && c.knowledge === knowledge) return 'row';
        return 'idle';
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Compass className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Svar på begge spørsmålene, og se hvor du havner i rutenettet.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 space-y-5">
                {/* Spørsmål 1: tro */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <HelpCircle className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-semibold text-slate-700">
                            1. Tror du at det finnes en gud?
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {BELIEFS.map((b) => (
                            <motion.button
                                key={b.value}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setBelief(b.value)}
                                className={`rounded-xl border px-4 py-2.5 text-sm font-medium text-left transition-colors ${
                                    belief === b.value
                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-md'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {b.label}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Spørsmål 2: viten */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-semibold text-slate-700">
                            2. Kan mennesker vite sikkert om det finnes en gud?
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {KNOWLEDGES.map((k) => (
                            <motion.button
                                key={k.value}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setKnowledge(k.value)}
                                className={`rounded-xl border px-4 py-2.5 text-sm font-medium text-left transition-colors ${
                                    knowledge === k.value
                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-md'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {k.label}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Rutenettet */}
                <div>
                    <div className="grid grid-cols-[auto_1fr_1fr] gap-2 items-stretch">
                        <div />
                        {KNOWLEDGES.map((k) => (
                            <div
                                key={k.value}
                                className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 text-center pb-1"
                            >
                                {k.value === 'kan-vites' ? 'Vi kan vite' : 'Ingen kan vite'}
                            </div>
                        ))}

                        {BELIEFS.map((b) => (
                            <div key={b.value} className="contents">
                                <div className="flex items-center pr-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    {b.value === 'tror' ? 'Tror' : 'Tror ikke'}
                                </div>
                                {KNOWLEDGES.map((k) => {
                                    const cell = CELLS.find(
                                        (c) => c.belief === b.value && c.knowledge === k.value
                                    )!;
                                    const state = cellState(cell);
                                    return (
                                        <motion.div
                                            key={k.value}
                                            animate={{
                                                scale: state === 'active' ? 1.03 : 1,
                                            }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 320,
                                                damping: 20,
                                            }}
                                            className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                                                state === 'active'
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-md'
                                                    : state === 'row'
                                                      ? 'bg-indigo-50/60 border-indigo-200 text-indigo-700'
                                                      : 'bg-slate-50 border-slate-200 text-slate-400'
                                            }`}
                                        >
                                            {cell.label}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {match ? (
                        <motion.div
                            key={`${belief}-${knowledge}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm leading-relaxed"
                        >
                            <span className="font-bold">{match.label}. </span>
                            {match.body}
                            <span className="block mt-2 flex items-start gap-2 text-emerald-900">
                                <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>
                                    Du svarte på to forskjellige spørsmål. Det første handlet om hva
                                    du tror. Det andre handlet om hva mennesker kan vite. Derfor er
                                    ateisme og agnostisme ikke to punkter på samme linje.
                                </span>
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tomt"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            {belief === null && knowledge === null
                                ? 'Velg ett svar på hvert spørsmål. Ingen svar er feil her.'
                                : 'Ett spørsmål igjen. Se hvordan rutene lyser opp underveis.'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                    Ingen svar blir lagret. Du kan prøve alle fire rutene.
                </span>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
