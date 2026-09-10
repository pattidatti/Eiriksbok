import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, ArrowLeftRight, Sparkles, Check } from 'lucide-react';

interface KonsonantKodenProps {
    title?: string;
    sentences?: string[];
}

type Phase = 'skjult' | 'snudd' | 'lest';

const VOKALER = 'AEIOUYÆØÅ';

const STANDARD_SETNINGER = [
    'SKIPET FRA TYROS BAR PURPUR OG SEDERTRE',
    'KJØPMANNEN TELTE TJUE KRUKKER MED VIN',
    'GREKERNE LÅNTE TEGNENE OG LA TIL VOKALER',
];

interface Bokstav {
    key: string;
    tegn: string;
    vokal: boolean;
}

interface Ord {
    key: string;
    bokstaver: Bokstav[];
}

function tilOrd(setning: string): Ord[] {
    return setning.split(' ').map((ord, wi) => ({
        key: `o${wi}`,
        bokstaver: [...ord].map((tegn, bi) => ({
            key: `o${wi}b${bi}`,
            tegn,
            vokal: VOKALER.includes(tegn),
        })),
    }));
}

const FORKLARING: Record<Phase, { tittel: string; tekst: string }> = {
    skjult: {
        tittel: 'Slik så en fønikisk innskrift ut',
        tekst: 'Alfabetet hadde 22 tegn, og alle sto for en konsonant. Vokalene ble ikke skrevet i det hele tatt, og teksten gikk fra høyre mot venstre.',
    },
    snudd: {
        tittel: 'Nå leser du samme vei som i dag',
        tekst: 'Bokstavene står i riktig rekkefølge, men vokalene mangler fortsatt. Leseren måtte gjette dem ut fra sammenhengen. Det gikk greit for en kjøpmann som kjente ordene fra før.',
    },
    lest: {
        tittel: 'Grekerne løste problemet',
        tekst: 'Rundt 900 fvt lånte grekerne de fønikiske tegnene og gjorde noen av dem om til vokaler. Da kunne hvem som helst lese teksten, også ord de aldri hadde sett før.',
    },
};

export function KonsonantKoden({
    title = 'Les som en føniker',
    sentences = STANDARD_SETNINGER,
}: KonsonantKodenProps) {
    const [valgt, setValgt] = useState(0);
    const [phase, setPhase] = useState<Phase>('skjult');

    const setning = sentences[valgt] ?? sentences[0] ?? '';

    const visning = useMemo(() => {
        const ord = tilOrd(setning);
        if (phase === 'lest') return ord;
        const utenVokaler = ord.map((o) => ({
            ...o,
            bokstaver: o.bokstaver.filter((b) => !b.vokal),
        }));
        if (phase === 'snudd') return utenVokaler;
        return [...utenVokaler]
            .reverse()
            .map((o) => ({ ...o, bokstaver: [...o.bokstaver].reverse() }));
    }, [setning, phase]);

    const byttSetning = (i: number) => {
        setValgt(i);
        setPhase('skjult');
    };

    const handleReset = () => setPhase('skjult');

    const forklaring = FORKLARING[phase];

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <ScrollText className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Fønikerne skrev uten vokaler, fra høyre mot venstre. Klarer du å knekke
                        koden?
                    </p>
                </div>
            </div>

            {/* Setningsvelger */}
            <div className="px-6 pt-5 flex flex-wrap gap-2">
                {sentences.map((s, i) => (
                    <button
                        key={s}
                        onClick={() => byttSetning(i)}
                        className={`text-xs font-medium rounded-full px-3 py-1.5 border transition-colors ${
                            i === valgt
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        Innskrift {i + 1}
                    </button>
                ))}
            </div>

            {/* Primær interaksjonsflate */}
            <div className="px-6 py-5">
                <div
                    className={`rounded-xl border px-4 py-6 sm:px-6 transition-colors ${
                        phase === 'lest'
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-amber-50 border-amber-200'
                    }`}
                >
                    <div className="flex flex-wrap justify-center gap-x-5 gap-y-3">
                        {visning.map((ord) => (
                            <motion.div key={ord.key} layout className="flex gap-0.5">
                                {ord.bokstaver.map((b) => (
                                    <motion.span
                                        key={b.key}
                                        layout
                                        initial={{ opacity: 0, scale: 0.4, y: -6 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 420,
                                            damping: 26,
                                        }}
                                        className={`font-display text-2xl sm:text-3xl font-bold tracking-wide ${
                                            b.vokal ? 'text-emerald-600' : 'text-stone-700'
                                        }`}
                                    >
                                        {b.tegn}
                                    </motion.span>
                                ))}
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-4 text-center text-xs font-medium uppercase tracking-wider text-stone-500">
                        {phase === 'skjult'
                            ? 'Leseretning: høyre mot venstre'
                            : phase === 'snudd'
                              ? 'Leseretning: venstre mot høyre'
                              : 'Med vokaler'}
                    </div>
                </div>
            </div>

            {/* Feedback-sone */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={phase}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mx-6 mb-4 px-4 py-3 rounded-lg border text-sm ${
                        phase === 'lest'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}
                >
                    <div className="flex items-start gap-2">
                        {phase === 'lest' ? (
                            <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                        ) : (
                            <ScrollText className="w-4 h-4 mt-0.5 shrink-0" />
                        )}
                        <div>
                            <p className="font-semibold">{forklaring.tittel}</p>
                            <p className="mt-1 leading-relaxed">{forklaring.tekst}</p>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                {phase === 'skjult' && (
                    <button
                        onClick={() => setPhase('snudd')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors inline-flex items-center gap-2"
                    >
                        <ArrowLeftRight className="w-4 h-4" />
                        Snu leseretningen
                    </button>
                )}
                {phase === 'snudd' && (
                    <button
                        onClick={() => setPhase('lest')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors inline-flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        Sett inn vokalene
                    </button>
                )}
                {phase === 'lest' && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700"
                    >
                        <Check className="w-4 h-4" />
                        Du leste innskriften
                    </motion.div>
                )}
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors shrink-0"
                >
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
