import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowDown,
    ArrowUp,
    Fish,
    GraduationCap,
    Hammer,
    HardHat,
    Hospital,
    Palmtree,
    Route,
    Stethoscope,
    Wrench,
    type LucideIcon,
} from 'lucide-react';
import type { VisualProps } from '../../types';
import { OljefondetFlate } from './Flate';

/**
 * Hvorfor oljepengene ikke brukes hjemme, som en mekanisme.
 * - press: mange oljepenger, de samme arbeiderne. Prosjektene slåss om dem, og lønninger og
 *   priser stiger.
 * - krone: kronen blir sterkere, og fisk, metall og turistreiser blir dyre for utlendinger.
 */

type Modus = 'press' | 'krone';

const PROSJEKTER: { navn: string; Ikon: LucideIcon; farge: string }[] = [
    { navn: 'Skoler', Ikon: GraduationCap, farge: '#b45309' },
    { navn: 'Veier', Ikon: Route, farge: '#475569' },
    { navn: 'Sykehus', Ikon: Hospital, farge: '#dc2626' },
];

const ARBEIDERE: { navn: string; Ikon: LucideIcon }[] = [
    { navn: 'Snekker', Ikon: Hammer },
    { navn: 'Sykepleier', Ikon: Stethoscope },
    { navn: 'Ingeniør', Ikon: HardHat },
    { navn: 'Snekker', Ikon: Hammer },
    { navn: 'Sykepleier', Ikon: Stethoscope },
    { navn: 'Ingeniør', Ikon: HardHat },
];

const VARER: { navn: string; Ikon: LucideIcon; farge: string }[] = [
    { navn: 'Fisk', Ikon: Fish, farge: '#0369a1' },
    { navn: 'Metall', Ikon: Wrench, farge: '#475569' },
    { navn: 'Turistreiser', Ikon: Palmtree, farge: '#15803d' },
];

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                style={{ top: 24 }}
            >
                {tekst}
            </motion.div>
        </AnimatePresence>
    );
}

/** Myntbunken. `mengde` 0-1 styrer hvor høy den er. */
function Myntbunke({ mengde }: { mengde: number }) {
    const antall = Math.round(4 + mengde * 14);
    return (
        <div className="flex flex-col items-center">
            <div className="flex flex-col-reverse items-center" style={{ height: 230, justifyContent: 'flex-start' }}>
                {Array.from({ length: 18 }, (_, i) => (
                    <motion.div
                        key={i}
                        initial={false}
                        animate={{ opacity: i < antall ? 1 : 0, y: i < antall ? 0 : -30 }}
                        transition={{ delay: i < antall ? i * 0.05 : 0, duration: 0.35 }}
                        className="rounded-full border-2 border-amber-700"
                        style={{
                            width: 120 - (i % 2) * 8,
                            height: 13,
                            marginTop: -1,
                            background: 'linear-gradient(#fde047, #ca8a04)',
                            transform: `translateX(${((i * 7) % 5) - 2}px)`,
                        }}
                    />
                ))}
            </div>
            <div className="mt-2 text-2xl font-black text-amber-700">Oljepenger</div>
        </div>
    );
}

function Maaler({ navn, fraBeat, beat }: { navn: string; fraBeat: number; beat: number }) {
    const opp = beat >= fraBeat;
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative rounded-2xl bg-slate-200 overflow-hidden" style={{ width: 70, height: 260 }}>
                <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-red-500"
                    initial={{ height: 50 }}
                    animate={{ height: opp ? 245 : 50 }}
                    transition={{ duration: 2.2, ease: 'easeOut' }}
                />
                {opp && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="absolute inset-x-0 top-3 flex justify-center text-white"
                    >
                        <ArrowUp size={40} strokeWidth={3} />
                    </motion.div>
                )}
            </div>
            <div className="text-2xl font-black text-slate-800">{navn}</div>
        </div>
    );
}

function Press({ beat }: { beat: number }) {
    const slass = beat >= 2;
    return (
        <>
            <div className="absolute flex flex-col items-center" style={{ left: 30, top: 170 }}>
                <Myntbunke mengde={beat >= 1 ? 1 : 0.15} />
            </div>

            {/* Prosjektene */}
            <div className="absolute flex gap-5" style={{ left: 225, top: 110 }}>
                {PROSJEKTER.map((p, i) => (
                    <motion.div
                        key={p.navn}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.35 }}
                        className="flex flex-col items-center justify-center rounded-3xl bg-white shadow-xl"
                        style={{ width: 150, height: 130, borderBottom: `8px solid ${p.farge}` }}
                    >
                        <p.Ikon size={56} style={{ color: p.farge }} />
                        <div className="text-2xl font-black text-slate-900 mt-1">{p.navn}</div>
                    </motion.div>
                ))}
            </div>

            {/* Pilene: alle prosjektene vil ha de samme folka */}
            {slass && (
                <div className="absolute flex gap-5" style={{ left: 225, top: 255 }}>
                    {PROSJEKTER.map((p, i) => (
                        <motion.div
                            key={p.navn}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: [0, 8, 0] }}
                            transition={{ delay: i * 0.2, y: { repeat: Infinity, duration: 0.9 } }}
                            className="flex justify-center"
                            style={{ width: 150, color: p.farge }}
                        >
                            <ArrowDown size={54} strokeWidth={3} />
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Arbeiderne: like mange som før */}
            <AnimatePresence>
                {beat >= 1 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute"
                        style={{ left: 200, top: 340, width: 530 }}
                    >
                        <div className="flex justify-between">
                            {ARBEIDERE.map((a, i) => (
                                <motion.div
                                    key={i}
                                    animate={slass ? { x: [0, -5, 5, 0] } : { x: 0 }}
                                    transition={slass ? { repeat: Infinity, duration: 0.5, delay: i * 0.07 } : {}}
                                    className="flex flex-col items-center"
                                    style={{ width: 86 }}
                                >
                                    <div
                                        className="rounded-full bg-teal-600 text-white flex items-center justify-center"
                                        style={{ width: 66, height: 66 }}
                                    >
                                        <a.Ikon size={36} />
                                    </div>
                                    <div className="text-base font-bold text-slate-700 mt-1">{slass ? a.navn : ''}</div>
                                </motion.div>
                            ))}
                        </div>
                        <div className="text-center text-2xl font-black text-slate-800 mt-1">
                            Like mange arbeidere som før
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Lønninger og priser */}
            <div className="absolute flex gap-6" style={{ right: 24, top: 150 }}>
                <Maaler navn="Lønninger" fraBeat={3} beat={beat} />
                <Maaler navn="Priser" fraBeat={3} beat={beat} />
            </div>
        </>
    );
}

function Krone({ beat }: { beat: number }) {
    return (
        <>
            {/* Kronen vokser */}
            <div className="absolute flex flex-col items-center" style={{ left: 50, top: 140, width: 260 }}>
                <motion.div
                    initial={{ scale: 0.55 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 2.2, ease: 'easeOut' }}
                    className="rounded-full flex items-center justify-center border-8 border-amber-700 shadow-2xl"
                    style={{ width: 210, height: 210, background: 'radial-gradient(circle at 35% 30%, #fef08a, #ca8a04)' }}
                >
                    <span className="font-display font-black text-amber-900" style={{ fontSize: 64 }}>
                        NOK
                    </span>
                </motion.div>
                <div className="mt-4 text-3xl font-black text-slate-900">Sterkere krone</div>
            </div>

            {/* Varene som selges til andre land */}
            <div className="absolute flex flex-col gap-4" style={{ left: 360, top: 120 }}>
                {VARER.map((vare, i) => (
                    <motion.div
                        key={vare.navn}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: beat >= 1 ? 1 : 0, x: beat >= 1 ? 0 : -20 }}
                        transition={{ delay: beat >= 1 ? 0.2 + i * 0.4 : 0 }}
                        className="flex items-center gap-4 rounded-3xl bg-white shadow-xl px-5"
                        style={{ width: 590, height: 110 }}
                    >
                        <vare.Ikon size={54} style={{ color: vare.farge }} />
                        <div className="text-3xl font-black text-slate-900" style={{ width: 200 }}>
                            {vare.navn}
                        </div>
                        <div className="flex flex-col gap-1" style={{ width: 300 }}>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-slate-500" style={{ width: 120 }}>
                                    Pris ute
                                </span>
                                <div className="flex-1 h-5 rounded-full bg-slate-200 overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        initial={{ width: '40%' }}
                                        animate={{ width: beat >= 2 ? '92%' : '40%', background: beat >= 2 ? '#dc2626' : '#64748b' }}
                                        transition={{ duration: 1.6, delay: i * 0.25 }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-slate-500" style={{ width: 120 }}>
                                    Salg
                                </span>
                                <div className="flex-1 h-5 rounded-full bg-slate-200 overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        initial={{ width: '80%' }}
                                        animate={{ width: beat >= 2 ? '30%' : '80%', background: beat >= 2 ? '#f59e0b' : '#0d9488' }}
                                        transition={{ duration: 1.6, delay: 0.8 + i * 0.25 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    press: ['Bruke alt hjemme?', 'Mye mer penger, like mange folk', 'Alle vil ha de samme folka', 'Lønninger og priser stiger'],
    krone: ['Bruker vi mer oljepenger, blir kronen sterkere', 'Bedrifter som selger til andre land', 'Dyrere for utlendinger, mindre salg'],
};

export function OljefondetPress({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'press';
    const linjer = OVERSKRIFT[modus];
    return (
        <OljefondetFlate bakgrunn="linear-gradient(#f8fafc, #e2e8f0)">
            {modus === 'press' ? <Press beat={beat} /> : <Krone beat={beat} />}
            <Overskrift tekst={linjer[Math.min(beat, linjer.length - 1)]} />
        </OljefondetFlate>
    );
}
