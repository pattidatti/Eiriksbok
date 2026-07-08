import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, CloudRain, RotateCcw, Sprout, Users, TreePine, Swords, Crown } from 'lucide-react';

interface Pressure {
    id: string;
    label: string;
    drain: number;
    why: string;
    Icon: typeof Users;
}

interface TorkensVippepunktProps {
    title?: string;
}

const DROUGHT_HIT = 50; // en hard tørke tapper 50 av overlevelsesmarginen
const BASE = 100;

const PRESSURES: Pressure[] = [
    {
        id: 'befolkning',
        label: 'For mange mennesker',
        drain: 20,
        why: 'Byene vokste enormt. Det var flere munner å mette enn jorda kunne bære i et dårlig år.',
        Icon: Users,
    },
    {
        id: 'krig',
        label: 'Krig mellom bystatene',
        drain: 22,
        why: 'Mayabyene sloss mot hverandre om makt og land. Krig tapper både folk og matlagre.',
        Icon: Swords,
    },
    {
        id: 'jord',
        label: 'Utpint jord',
        drain: 18,
        why: 'Åkrene ble dyrket for hardt år etter år. Til slutt ga jorda mindre og mindre mat.',
        Icon: Sprout,
    },
    {
        id: 'skog',
        label: 'Avskoging',
        drain: 16,
        why: 'Skogen ble hogd for åker og ved. Uten trær vasket regnet vekk matjorda.',
        Icon: TreePine,
    },
    {
        id: 'elite',
        label: 'Grådige konger',
        drain: 14,
        why: 'Kongene krevde stadig større templer og monumenter. Det tappet folket for arbeid og mat.',
        Icon: Crown,
    },
];

type Phase = 'idle' | 'survived' | 'collapsed';

export function TorkensVippepunkt({ title = 'Tørkeåret som veltet mayaene' }: TorkensVippepunktProps) {
    const [active, setActive] = useState<Set<string>>(new Set());
    const [phase, setPhase] = useState<Phase>('idle');

    const drainSum = useMemo(
        () => PRESSURES.filter((p) => active.has(p.id)).reduce((s, p) => s + p.drain, 0),
        [active]
    );

    // Marginen FØR tørken: hvor mye samfunnet tåler når de kroniske kreftene er trukket fra.
    const beforeDrought = Math.max(0, BASE - drainSum);
    // Marginen ETTER tørken. Kan bli negativ = kollaps.
    const afterDrought = BASE - drainSum - DROUGHT_HIT;

    // Hvilken bredde skal baren ha akkurat nå?
    const shown = phase === 'idle' ? beforeDrought : Math.max(0, afterDrought);
    const collapsed = phase === 'collapsed';

    const toggle = (id: string) => {
        if (phase !== 'idle') setPhase('idle');
        setActive((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const releaseDrought = () => {
        setPhase(afterDrought > 0 ? 'survived' : 'collapsed');
    };

    const reset = () => {
        setActive(new Set());
        setPhase('idle');
    };

    const barColor = collapsed
        ? '#e11d48'
        : shown > 45
          ? '#10b981'
          : shown > 20
            ? '#f59e0b'
            : '#f43f5e';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Landmark className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Slå på kreftene som allerede tynget mayabyene, og utløs så et tørkeår.
                    </p>
                </div>
            </div>

            <div className="p-6 space-y-5">
                {/* Pressures */}
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Krefter som tynget samfunnet
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {PRESSURES.map((p) => {
                            const on = active.has(p.id);
                            const Icon = p.Icon;
                            return (
                                <motion.button
                                    key={p.id}
                                    onClick={() => toggle(p.id)}
                                    whileTap={{ scale: 0.95 }}
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                                        on
                                            ? 'bg-rose-50 border-rose-300 text-rose-700'
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {p.label}
                                    <span className={`tabular-nums text-xs ${on ? 'text-rose-500' : 'text-slate-400'}`}>
                                        -{p.drain}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Buffer bar */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-600">Byens overlevelsesmargin</span>
                        <span className="text-xs font-bold tabular-nums text-slate-700">
                            {phase === 'idle' ? beforeDrought : Math.max(0, afterDrought)} av 100
                        </span>
                    </div>
                    <div className="relative h-7 w-full rounded-full bg-slate-100 overflow-hidden">
                        {/* Kollapslinje ved 0 er hele venstre kant; margin fylles fra venstre */}
                        <motion.div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{ backgroundColor: barColor }}
                            animate={{ width: `${shown}%` }}
                            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                        />
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                        <span>Kollaps</span>
                        <span>Trygt</span>
                    </div>
                </div>

                {/* Trigger */}
                <button
                    onClick={releaseDrought}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-semibold transition-colors"
                >
                    <CloudRain className="w-4 h-4" />
                    Utløs et tørkeår
                </button>
            </div>

            {/* Feedback-sone (alltid i DOM-et) */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {phase === 'idle' ? (
                        <motion.p
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-slate-500 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200"
                        >
                            En hard tørke tapper alltid 50 av marginen. Prøv den samme tørken med få og
                            med mange krefter på - og se når byen tåler den, og når den ikke gjør det.
                        </motion.p>
                    ) : phase === 'survived' ? (
                        <motion.div
                            key="survived"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                        >
                            <span className="font-semibold">Byen holder.</span> Tørken var hard, men
                            samfunnet hadde nok margin igjen til å tåle et dårlig år. Folk sultet, men
                            byen ble ikke forlatt.
                        </motion.div>
                    ) : (
                        <motion.div
                            key="collapsed"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm"
                        >
                            <span className="font-semibold">Byen tømmes.</span> Den samme tørken ble
                            dødelig fordi samfunnet allerede var strukket til bristepunktet. Da flere
                            krefter tynget på én gang, var det siste tørkeåret dyttet som veltet byen.
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Vis hvorfor hver aktiv kraft tapper */}
                {active.size > 0 && (
                    <ul className="mt-2 space-y-1">
                        {PRESSURES.filter((p) => active.has(p.id)).map((p) => (
                            <li key={p.id} className="text-xs text-slate-500 flex gap-1.5">
                                <span className="text-rose-400 font-semibold">-{p.drain}</span>
                                <span>
                                    <span className="font-medium text-slate-600">{p.label}:</span> {p.why}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-end">
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
