import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Flame,
    Home,
    Warehouse,
    Fish,
    Store,
    School,
    Church,
    Stethoscope,
    Users,
    Ship,
    Milestone,
    RotateCcw,
    Lightbulb,
    Target,
} from 'lucide-react';

interface BrentJordProps {
    title?: string;
}

type Phase = 'velg' | 'brenner' | 'ferdig';

interface Bygning {
    id: string;
    icon: typeof Home;
    navn: string;
    // Tall fra SSB (Søbye, 1999) for hele Finnmark og Nord-Troms. Tom streng = ingen tall i kildene.
    tall: string;
    militaer: boolean;
}

// militaer = det en hær vanligvis ødelegger for å bremse en fiende som kommer etter
const BYGNINGER: Bygning[] = [
    { id: 'bolig', icon: Home, navn: 'Bolighus', tall: '11 000 bolighus', militaer: false },
    {
        id: 'fjos',
        icon: Warehouse,
        navn: 'Fjøs og uthus',
        tall: '4 700 fjøs og uthus',
        militaer: false,
    },
    { id: 'fiskebruk', icon: Fish, navn: 'Fiskebruk', tall: '306 fiskebruk', militaer: false },
    { id: 'butikk', icon: Store, navn: 'Butikk', tall: '420 butikker', militaer: false },
    { id: 'skole', icon: School, navn: 'Skole', tall: '106 skoler', militaer: false },
    { id: 'kirke', icon: Church, navn: 'Kirke', tall: '27 kirker', militaer: false },
    {
        id: 'sykestue',
        icon: Stethoscope,
        navn: 'Sykestue',
        tall: '21 sykehus og legekontor',
        militaer: false,
    },
    {
        id: 'forsamling',
        icon: Users,
        navn: 'Forsamlingshus',
        tall: '140 forsamlingshus',
        militaer: false,
    },
    { id: 'bat', icon: Ship, navn: 'Fiskebåt', tall: 'nesten alle båtene', militaer: true },
    { id: 'bro', icon: Milestone, navn: 'Bro', tall: 'bruene', militaer: true },
];

export function BrentJord({ title = 'Bygda før og etter ordren' }: BrentJordProps) {
    const [phase, setPhase] = useState<Phase>('velg');
    const [valgt, setValgt] = useState<string[]>([]);
    const timer = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(timer.current), []);

    const toggle = (id: string) => {
        if (phase !== 'velg') return;
        setValgt((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
    };

    const lesOrdren = () => {
        setPhase('brenner');
        // Vent til siste rute har brent ferdig før oppsummeringen kommer
        timer.current = window.setTimeout(() => setPhase('ferdig'), BYGNINGER.length * 180 + 700);
    };

    const handleReset = () => {
        window.clearTimeout(timer.current);
        setPhase('velg');
        setValgt([]);
    };

    const sivileValgt = valgt.filter((id) => !BYGNINGER.find((b) => b.id === id)?.militaer).length;
    const brent = phase !== 'velg';

    let feedback = 'Trykk på rutene du tror en hær ville ødelegge for å stoppe fienden.';
    if (phase === 'velg' && valgt.length > 0) {
        feedback = `Du har merket ${valgt.length} av ${BYGNINGER.length}. Trykk på «Ordren 28. oktober» når du er klar.`;
    }
    if (phase === 'brenner') feedback = 'Ordren er gitt. Bygda brenner ...';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Flame className="w-5 h-5 text-orange-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Merk det du tror en hær som trekker seg tilbake, ville ødelegge. Les så
                        ordren.
                    </p>
                </div>
            </div>

            {/* Bygda */}
            <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
                {BYGNINGER.map((b, i) => {
                    const Icon = b.icon;
                    const merket = valgt.includes(b.id);
                    return (
                        <motion.button
                            key={b.id}
                            type="button"
                            onClick={() => toggle(b.id)}
                            whileTap={phase === 'velg' ? { scale: 0.95 } : undefined}
                            animate={
                                brent
                                    ? {
                                          backgroundColor: ['#ffffff', '#fed7aa', '#e2e8f0'],
                                          scale: [1, 1.06, 1],
                                      }
                                    : {
                                          backgroundColor: merket ? '#eef2ff' : '#ffffff',
                                          scale: 1,
                                      }
                            }
                            transition={{ duration: 0.6, delay: brent ? i * 0.18 : 0 }}
                            className={`relative rounded-xl border p-3 flex flex-col items-center gap-1 text-center min-h-[92px] ${
                                merket
                                    ? 'border-indigo-400 shadow-md'
                                    : 'border-slate-200 shadow-sm'
                            } ${phase === 'velg' ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                            {merket && (
                                <Target className="absolute top-1.5 right-1.5 w-4 h-4 text-indigo-500" />
                            )}
                            <motion.div
                                animate={brent ? { opacity: [1, 1, 0.35] } : { opacity: 1 }}
                                transition={{ duration: 0.6, delay: brent ? i * 0.18 : 0 }}
                            >
                                <Icon
                                    className={`w-7 h-7 ${merket ? 'text-indigo-600' : 'text-slate-600'}`}
                                />
                            </motion.div>
                            <span className="text-sm font-medium text-slate-700">{b.navn}</span>
                            <AnimatePresence>
                                {brent && (
                                    <motion.span
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.18 + 0.4 }}
                                        className="flex items-center gap-1 text-xs text-orange-700"
                                    >
                                        <Flame className="w-3 h-3" /> {b.tall}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>

            {/* Feedback-sone */}
            <AnimatePresence mode="wait">
                {phase === 'ferdig' ? (
                    <motion.div
                        key="ferdig"
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        className="mx-4 sm:mx-6 mb-4 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm space-y-2"
                    >
                        <p className="font-semibold flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" /> Ordren gjaldt alt - ikke bare det
                            militære.
                        </p>
                        <p>
                            Du merket {valgt.length} av {BYGNINGER.length} ruter
                            {sivileValgt > 0
                                ? `, og ${sivileValgt} av dem var vanlige sivile bygg.`
                                : ', og ingen av dem var vanlige hjem, skoler eller kirker.'}{' '}
                            Tyskerne ødela alle ti. Bruer og båter kan en hær ha bruk for. Men et
                            hjem, et fjøs, en skole og en kirke er der folk bor, lærer og ber. Det
                            er dette som kalles brent jord: Fienden skulle verken finne tak over
                            hodet eller hjelp fra folk. Prisen betalte de som bodde der.
                        </p>
                        <p className="text-emerald-700">
                            I Kirkenes sto bare 28 av rundt 900 bygninger igjen.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key={phase + valgt.length}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`mx-4 sm:mx-6 mb-4 px-4 py-3 rounded-lg border text-sm ${
                            phase === 'brenner'
                                ? 'bg-orange-50 border-orange-200 text-orange-800'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {feedback}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-4 sm:px-6 pb-5 flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={lesOrdren}
                    disabled={phase !== 'velg'}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-full px-6 py-2 text-sm font-medium flex items-center gap-2"
                >
                    <Flame className="w-4 h-4" /> Ordren 28. oktober
                </button>
                <button
                    type="button"
                    onClick={handleReset}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
