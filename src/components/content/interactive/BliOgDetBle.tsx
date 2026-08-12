import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Sparkles, Ban, Hammer, Clock, Package } from 'lucide-react';

// Bli, og det ble: hva skapelsen koster i islamsk framstilling.
//
// Lyspaere-oyeblikket: eleven leter etter materialer, verktoy og tid, slik man
// ville gjort for a bygge noe. Ingen av delene finnes i teksten. Det eneste
// som gjenstar er ordet - «Bli!» - og da er verden der. Regnskapet nederst
// ender pa null i alle rader, og det er selve poenget: skapelsen koster Gud
// ingenting, og derfor trengs det heller ingen hviledag.

interface Forsok {
    id: string;
    knapp: string;
    ikon: 'materialer' | 'verktoy' | 'tid';
    svar: string;
}

interface BliOgDetBleProps {
    title?: string;
    intro?: string;
    forsok?: Forsok[];
    ordet?: string;
    ordetForklaring?: string;
    sluttekst?: string;
}

const IKON = { materialer: Package, verktoy: Hammer, tid: Clock };

const STANDARD: Forsok[] = [
    {
        id: 'materialer',
        knapp: 'Finn materialer',
        ikon: 'materialer',
        svar: 'Det finnes ingenting å bygge av. Ingen leire, ingen stein, ingen urmasse som ligger klar.',
    },
    {
        id: 'verktoy',
        knapp: 'Finn verktøy',
        ikon: 'verktoy',
        svar: 'Ingen redskaper nevnes. Gud lager ikke verden med hendene.',
    },
    {
        id: 'tid',
        knapp: 'Sett av tid',
        ikon: 'tid',
        svar: 'Teksten sier seks dager, men den sier også at ingen tretthet rørte Gud. Tida koster ingenting.',
    },
];

export function BliOgDetBle({
    title = 'Prøv å skape en verden',
    intro = 'Du skal lage noe. Begynn slik du ville begynt med hva som helst annet.',
    forsok = STANDARD,
    ordet = 'Bli!',
    ordetForklaring = 'I Koranen 2,117 står det at når Gud bestemmer noe, sier han bare til det: «Bli!», og det blir.',
    sluttekst = 'Ingen materialer, ingen verktøy, ingen slitasje. Derfor trenger Koranens skapelsesfortelling heller ingen hviledag.',
}: BliOgDetBleProps) {
    const [provd, setProvd] = useState<string[]>([]);
    const [aapent, setAapent] = useState<string | null>(null);
    const [sagt, setSagt] = useState(false);

    const alleProvd = provd.length === forsok.length;
    const aktivt = forsok.find((f) => f.id === aapent);

    return (
        <div className="my-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <span className="mt-0.5 rounded-lg bg-emerald-100 p-2 text-emerald-700">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-600">{intro}</p>
                </div>
            </div>

            <div className="p-5">
                <div className="flex flex-wrap gap-2">
                    {forsok.map((f) => {
                        const Ikon = IKON[f.ikon];
                        const erProvd = provd.includes(f.id);
                        return (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => {
                                    setAapent(f.id);
                                    setProvd((p) => (p.includes(f.id) ? p : [...p, f.id]));
                                }}
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                    erProvd
                                        ? 'border-slate-200 bg-slate-100 text-slate-500'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'
                                }`}
                            >
                                <Ikon className="h-4 w-4" aria-hidden="true" />
                                {f.knapp}
                                {erProvd && <Ban className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-3 min-h-[64px] rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={aapent || 'start'}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                        >
                            {aktivt ? aktivt.svar : 'Trykk på en av knappene for å begynne.'}
                        </motion.p>
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {alleProvd && !sagt && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
                        >
                            <p className="text-sm text-slate-700">
                                Ingen av dem finnes. Det er bare én ting igjen å prøve.
                            </p>
                            <button
                                type="button"
                                onClick={() => setSagt(true)}
                                className="rounded-full bg-emerald-600 px-6 py-2 font-display text-lg font-bold text-white transition-colors hover:bg-emerald-700"
                            >
                                {ordet}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {sagt && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                            className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-4"
                        >
                            <p className="mb-3 text-sm text-slate-700">{ordetForklaring}</p>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                {[
                                    { l: 'Materialer', v: 'ingen' },
                                    { l: 'Verktøy', v: 'ingen' },
                                    { l: 'Hvile etterpå', v: 'ingen' },
                                ].map((r, i) => (
                                    <motion.div
                                        key={r.l}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.12 * i }}
                                        className="rounded-lg bg-white p-2"
                                    >
                                        <span className="block text-xs text-slate-500">{r.l}</span>
                                        <span className="block font-display text-base font-bold text-emerald-700">
                                            {r.v}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                            <p className="mt-3 text-sm text-slate-700">{sluttekst}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-5 py-2.5">
                <button
                    type="button"
                    onClick={() => {
                        setProvd([]);
                        setAapent(null);
                        setSagt(false);
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
                >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Start på nytt
                </button>
            </div>
        </div>
    );
}
