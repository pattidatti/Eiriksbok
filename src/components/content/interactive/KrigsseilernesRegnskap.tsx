import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor, Coins, Clock3, RotateCcw } from 'lucide-react';

interface KrigsseilernesRegnskapProps {
    title?: string;
}

type Phase = 'idle' | 'active' | 'complete';

// Lyspære-øyeblikket: eleven skal kjenne på avstanden mellom det krigsseilerne
// risikerte og det de fikk igjen. Slideren er hele interaksjonen: dra på
// fartstiden, se utbetalingen fra 1972 telle opp, og oppdag at selv full
// fartstid stoppet på 10 800 kroner - 27 år etter krigen.
const KRONER_PER_MAANED = 180; // Stortinget 1972, ex gratia (Hjeltnes, 2016)
const MAKS_KRONER = 10800; // full fartstid (Hjeltnes, 2016)

const MILEPAELER = [
    {
        aar: '1945',
        tekst: 'Krigen er slutt. Pengene fra fondet blir liggende hos staten, ikke hos sjøfolkene.',
    },
    {
        aar: '1954',
        tekst: 'Sjøfolkene saksøker staten for å få fondet utbetalt. De taper i Høyesterett.',
    },
    {
        aar: '1968',
        tekst: 'Tilleggsloven: seks måneder til sjøs holder for krigspensjon. Nå får tusenvis hjelp.',
    },
    {
        aar: '1972',
        tekst: 'Stortinget bevilger 155 millioner kroner. 180 kroner for hver måned til sjøs.',
    },
];

export function KrigsseilernesRegnskap({
    title = 'Krigsseilernes regnskap',
}: KrigsseilernesRegnskapProps) {
    const [maaneder, setMaaneder] = useState(0);
    const [phase, setPhase] = useState<Phase>('idle');

    const kroner = Math.min(MAKS_KRONER, maaneder * KRONER_PER_MAANED);
    const aar = Math.floor(maaneder / 12);
    const restMaaneder = maaneder % 12;
    const fartstid =
        maaneder === 0
            ? 'ingen tid til sjøs ennå'
            : `${aar > 0 ? `${aar} år` : ''}${aar > 0 && restMaaneder > 0 ? ' og ' : ''}${
                  restMaaneder > 0 ? `${restMaaneder} måneder` : ''
              } til sjøs`;

    const handleChange = (v: number) => {
        setMaaneder(v);
        if (phase === 'idle' && v > 0) setPhase('active');
        if (phase === 'complete') setPhase('active');
    };

    const handleReset = () => {
        setMaaneder(0);
        setPhase('idle');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Anchor className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Dra på hvor lenge sjømannen seilte, og se hva Norge betalte tilbake i 1972.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6">
                <label
                    htmlFor="fartstid-slider"
                    className="flex items-baseline justify-between mb-2"
                >
                    <span className="text-sm font-semibold text-slate-700">Måneder til sjøs</span>
                    <span className="text-sm font-bold text-indigo-600 tabular-nums">
                        {maaneder} mnd
                    </span>
                </label>
                <input
                    id="fartstid-slider"
                    type="range"
                    min={0}
                    max={60}
                    step={1}
                    value={maaneder}
                    onChange={(e) => handleChange(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                />

                {/* Månedsblokker - én rute per måned til sjøs */}
                <div className="mt-4 grid grid-cols-[repeat(30,minmax(0,1fr))] gap-[2px]">
                    {Array.from({ length: 60 }, (_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                backgroundColor: i < maaneder ? '#4f46e5' : '#e2e8f0',
                                scale: i === maaneder - 1 ? 1.25 : 1,
                            }}
                            transition={{ duration: 0.18 }}
                            className="h-3 rounded-sm"
                        />
                    ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">{fartstid}</p>

                {/* To kort: risikoen og oppgjøret */}
                <div className="grid sm:grid-cols-2 gap-3 mt-5">
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock3 className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-bold uppercase tracking-wide text-blue-700">
                                Risikoen om bord
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900 tabular-nums">
                            omtrent 1 av 8
                        </p>
                        <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                            Rundt 3700 av de omtrent 30 000 sjøfolkene i uteflåten kom aldri hjem.
                        </p>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Coins className="w-4 h-4 text-amber-600" />
                            <span className="text-xs font-bold uppercase tracking-wide text-amber-700">
                                Utbetalt i 1972
                            </span>
                        </div>
                        <motion.p
                            key={kroner}
                            initial={{ opacity: 0.4, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18 }}
                            className="text-2xl font-bold text-amber-900 tabular-nums"
                        >
                            {kroner.toLocaleString('nb-NO')} kr
                        </motion.p>
                        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                            180 kroner for hver måned til sjøs. Full fartstid stoppet på 10 800
                            kroner.
                        </p>
                    </div>
                </div>
            </div>

            {/* Feedback-sone - alltid i DOM-et */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {phase === 'idle' && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm"
                        >
                            Dra i spaken for å velge hvor lenge sjømannen seilte.
                        </motion.div>
                    )}
                    {phase === 'active' && (
                        <motion.div
                            key="active"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            {maaneder >= 60
                                ? 'Fem år til sjøs. Men utbetalingen stopper likevel på 10 800 kroner.'
                                : 'Legg til flere måneder, og trykk på knappen for å se hvor lang tid oppgjøret tok.'}
                        </motion.div>
                    )}
                    {phase === 'complete' && (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg bg-emerald-50 border border-emerald-200 p-4"
                        >
                            <p className="text-sm font-semibold text-emerald-800 mb-3">
                                Det tok 27 år fra freden til pengene kom.
                            </p>
                            <ol className="space-y-2">
                                {MILEPAELER.map((m, i) => (
                                    <motion.li
                                        key={m.aar}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.18, type: 'spring', stiffness: 220, damping: 20 }}
                                        className="flex gap-3 items-start"
                                    >
                                        <span className="text-xs font-bold text-emerald-700 bg-white border border-emerald-200 rounded-full px-2 py-0.5 tabular-nums flex-shrink-0">
                                            {m.aar}
                                        </span>
                                        <span className="text-sm text-emerald-900 leading-snug">
                                            {m.tekst}
                                        </span>
                                    </motion.li>
                                ))}
                            </ol>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                <button
                    onClick={() => setPhase('complete')}
                    disabled={maaneder === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    Hva skjedde etterpå?
                </button>
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
