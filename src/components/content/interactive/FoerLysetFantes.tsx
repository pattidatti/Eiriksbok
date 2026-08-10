import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
    Cloud,
    Clock,
    Droplets,
    Globe,
    Landmark,
    Layers,
    Moon,
    Mountain,
    RefreshCw,
    RotateCcw,
    Sparkles,
    Sun,
    Wind,
} from 'lucide-react';

interface FoerLysetFantesProps {
    title?: string;
}

interface Ting {
    id: string;
    navn: string;
    ikon: LucideIcon;
}

type Phase = 'fjerner' | 'klar' | 'ferdig';

const TING: Ting[] = [
    { id: 'jord', navn: 'Jorda', ikon: Globe },
    { id: 'himmel', navn: 'Himmelen', ikon: Cloud },
    { id: 'sol', navn: 'Sola', ikon: Sun },
    { id: 'maane', navn: 'Månen', ikon: Moon },
    { id: 'dag-natt', navn: 'Dag og natt', ikon: Clock },
    { id: 'luft', navn: 'Luft', ikon: Wind },
    { id: 'vann', navn: 'Vann', ikon: Droplets },
    { id: 'verdensdeler', navn: 'Verdensdeler', ikon: Mountain },
    { id: 'underverden', navn: 'Underverdener', ikon: Layers },
    { id: 'guder', navn: 'Guder', ikon: Landmark },
    { id: 'gjenfodsel', navn: 'Gjenfødsel', ikon: RefreshCw },
];

export function FoerLysetFantes({ title = 'Før lyset fantes' }: FoerLysetFantesProps) {
    const [borte, setBorte] = useState<string[]>([]);
    const [phase, setPhase] = useState<Phase>('fjerner');
    const [rister, setRister] = useState(false);

    const igjen = TING.length - borte.length;

    const fjern = (id: string) => {
        if (phase !== 'fjerner' || borte.includes(id)) return;
        const nye = [...borte, id];
        setBorte(nye);
        if (nye.length === TING.length) setPhase('klar');
    };

    const trykkHukam = () => {
        if (phase === 'klar') {
            setPhase('ferdig');
            setBorte([]);
            return;
        }
        if (phase === 'fjerner') {
            setRister(true);
            window.setTimeout(() => setRister(false), 600);
        }
    };

    const tilbakestill = () => {
        setBorte([]);
        setPhase('fjerner');
        setRister(false);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden not-prose">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <motion.div
                    animate={
                        phase === 'ferdig'
                            ? { rotate: 360, backgroundColor: '#fef3c7' }
                            : { rotate: 0, backgroundColor: '#eef2ff' }
                    }
                    transition={{ duration: 0.7 }}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                >
                    {phase === 'ferdig' ? (
                        <Sun className="w-5 h-5 text-amber-500" />
                    ) : (
                        <Moon className="w-5 h-5 text-indigo-500" />
                    )}
                </motion.div>
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Trykk bort alt som ikke fantes før skapelsen. Én ting blir igjen.
                    </p>
                </div>
            </div>

            <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {TING.map((ting, i) => {
                        const erBorte = borte.includes(ting.id);
                        const Ikon = ting.ikon;
                        return (
                            <div
                                key={ting.id}
                                className="relative h-[68px] rounded-xl border border-dashed border-slate-200 bg-slate-50"
                            >
                                <AnimatePresence>
                                    {!erBorte && (
                                        <motion.button
                                            type="button"
                                            onClick={() => fjern(ting.id)}
                                            initial={{ opacity: 0, scale: 0.4 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5, filter: 'blur(4px)' }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 320,
                                                damping: 20,
                                                delay: phase === 'ferdig' ? i * 0.06 : 0,
                                            }}
                                            whileHover={{ y: -2 }}
                                            whileTap={{ scale: 0.93 }}
                                            className="absolute inset-0 w-full rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-1 px-1"
                                        >
                                            <Ikon className="w-5 h-5 text-indigo-500" />
                                            <span className="text-[11px] leading-tight font-medium text-slate-700 text-center">
                                                {ting.navn}
                                            </span>
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}

                    <motion.button
                        type="button"
                        onClick={trykkHukam}
                        animate={
                            rister
                                ? { x: [0, -7, 7, -5, 5, 0] }
                                : phase === 'klar'
                                  ? { scale: [1, 1.06, 1] }
                                  : { x: 0, scale: 1 }
                        }
                        transition={
                            phase === 'klar' && !rister
                                ? { duration: 1.1, repeat: Infinity }
                                : { duration: 0.5 }
                        }
                        whileTap={{ scale: 0.95 }}
                        className={`h-[68px] rounded-xl border-2 flex flex-col items-center justify-center gap-1 px-1 shadow-sm ${
                            phase === 'klar'
                                ? 'border-amber-400 bg-amber-50'
                                : 'border-indigo-300 bg-indigo-50'
                        }`}
                    >
                        <Sparkles
                            className={`w-5 h-5 ${
                                phase === 'klar' ? 'text-amber-500' : 'text-indigo-600'
                            }`}
                        />
                        <span className="text-[11px] leading-tight font-semibold text-slate-800 text-center">
                            Hukam
                        </span>
                    </motion.button>
                </div>
            </div>

            <div className="mx-5 mb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={rister ? 'rister' : phase}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${
                            phase === 'ferdig'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : rister
                                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                                  : phase === 'klar'
                                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                                    : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                    >
                        {phase === 'ferdig' ? (
                            <span>
                                Ett trykk, og alt var der igjen. Slik forteller Guru Nanak det: da
                                Gud ville det, ble hele verden til.
                            </span>
                        ) : rister ? (
                            <span>
                                Hukam kan ikke tas bort. Guds vilje er det eneste som fantes før
                                verden.
                            </span>
                        ) : phase === 'klar' ? (
                            <span>
                                Bare hukam er igjen, altså Guds vilje. Trykk på den og se hva som
                                skjer.
                            </span>
                        ) : (
                            <span>
                                {igjen} ting igjen. Ingen av dem fantes ennå i utallige tidsaldre.
                            </span>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="px-5 pb-5 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Guru Granth Sahib, side 1035-1036</p>
                <button
                    type="button"
                    onClick={tilbakestill}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
