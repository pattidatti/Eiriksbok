import { AnimatePresence, motion } from 'framer-motion';
import {
    Baby,
    BookOpen,
    Clock,
    Coins,
    EyeOff,
    HeartPulse,
    Hospital,
    Moon,
    Route,
    School,
    Smile,
    Users,
    Wind,
    type LucideIcon,
} from 'lucide-react';
import type { VisualProps } from '../../types';

/**
 * BNP som et termometer til venstre, og det det ser eller ikke ser til høyre.
 * «blind»: alt BNP ikke får med seg, og tolv timers arbeidsdag. «termometer»: hvorfor BNP
 * likevel er nyttig, og hva det aldri kan måle.
 */

type Modus = 'blind' | 'termometer';

function Termometer({ niva, feber }: { niva: number; feber: boolean }) {
    const topp = 80;
    const bunn = 680;
    const h = (bunn - topp) * niva;
    return (
        <svg viewBox="0 0 300 860" className="h-full" style={{ maxHeight: '92%' }}>
            <rect x={110} y={topp - 30} width={80} height={bunn - topp + 60} rx={40} fill="#fff" stroke="#334155" strokeWidth={8} />
            <circle cx={150} cy={760} r={80} fill={feber ? '#dc2626' : '#2563eb'} stroke="#334155" strokeWidth={8} />
            <motion.rect
                x={128}
                width={44}
                rx={22}
                fill={feber ? '#dc2626' : '#2563eb'}
                initial={{ y: bunn, height: 0 }}
                animate={{ y: bunn - h, height: h + 40 }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            />
            {[0.2, 0.4, 0.6, 0.8].map((f) => (
                <line key={f} x1={200} x2={235} y1={bunn - (bunn - topp) * f} y2={bunn - (bunn - topp) * f} stroke="#334155" strokeWidth={6} />
            ))}
            <text x={150} y={772} textAnchor="middle" fontSize={44} fontWeight={900} fill="#fff">
                BNP
            </text>
        </svg>
    );
}

function Rute({
    Ikon,
    tekst,
    farge,
    skjult = false,
    delay = 0,
    bredde = 190,
}: {
    Ikon: LucideIcon;
    tekst: string;
    farge: string;
    skjult?: boolean;
    delay?: number;
    bredde?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: 'spring', stiffness: 220, damping: 22 }}
            className="relative flex flex-col items-center gap-2 px-4 py-4 rounded-2xl bg-white shadow-lg"
            style={{ width: bredde }}
        >
            <Ikon size={60} style={{ color: farge, opacity: skjult ? 0.45 : 1 }} />
            <div className="text-xl font-bold text-slate-800 text-center leading-tight">{tekst}</div>
            {skjult && (
                <div className="absolute rounded-full bg-slate-900 text-white p-2" style={{ top: -12, right: -12 }}>
                    <EyeOff size={26} />
                </div>
            )}
        </motion.div>
    );
}

function Overskrift({ children }: { children: React.ReactNode }) {
    return <div className="text-4xl font-black text-slate-900 mb-5">{children}</div>;
}

function Blind({ beat }: { beat: number }) {
    return (
        <AnimatePresence mode="wait">
            {beat <= 1 && (
                <motion.div key="ser" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Overskrift>Dette ser ikke BNP</Overskrift>
                    <div className="grid grid-cols-4 gap-4">
                        <Rute Ikon={Coins} tekst="hvordan pengene er fordelt" farge="#ca8a04" skjult bredde={160} />
                        {beat >= 1 && (
                            <>
                                <Rute Ikon={Clock} tekst="hvor mye fritid folk har" farge="#2563eb" skjult delay={0.2} bredde={160} />
                                <Rute Ikon={HeartPulse} tekst="om folk er friske" farge="#dc2626" skjult delay={0.6} bredde={160} />
                                <Rute Ikon={Wind} tekst="om lufta er ren" farge="#0d9488" skjult delay={1} bredde={160} />
                            </>
                        )}
                    </div>
                </motion.div>
            )}
            {beat >= 2 && (
                <motion.div key="tolv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">
                    <div className="flex items-center gap-6 px-6 py-4 rounded-3xl bg-white shadow-xl">
                        <Clock size={110} className="text-slate-800" strokeWidth={1.6} />
                        <div>
                            <div className="text-5xl font-black text-slate-900">12 timer</div>
                            <div className="text-2xl font-bold text-slate-600">jobb hver dag, for alle</div>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="px-6 py-4 rounded-3xl bg-teal-50 border-4 border-teal-500 text-center">
                            <div className="text-2xl font-bold text-slate-600">BNP</div>
                            <div className="text-5xl font-black text-teal-600">trolig ↑</div>
                        </div>
                        {beat >= 3 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="px-6 py-4 rounded-3xl bg-red-50 border-4 border-red-500 text-center"
                            >
                                <div className="text-2xl font-bold text-slate-600">Et bedre liv?</div>
                                <div className="text-5xl font-black text-red-600">neppe</div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function Nyttig({ beat }: { beat: number }) {
    return (
        <AnimatePresence mode="wait">
            {beat === 0 && (
                <motion.div key="ubrukelig" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
                    <div className="text-7xl font-black text-slate-400">Ubrukelig?</div>
                    <motion.div
                        initial={{ opacity: 0, scale: 2 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.9, type: 'spring', stiffness: 260, damping: 14 }}
                        className="absolute px-6 py-2 rounded-2xl border-8 border-teal-600 text-teal-600 text-7xl font-black bg-white/80"
                        style={{ right: 20, top: 90, transform: 'rotate(-8deg)' }}
                    >
                        NEI
                    </motion.div>
                </motion.div>
            )}
            {beat === 1 && (
                <motion.div key="godt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Overskrift>Høyt BNP går ofte sammen med</Overskrift>
                    <div className="flex gap-5">
                        <Rute Ikon={HeartPulse} tekst="folk lever lenger" farge="#dc2626" />
                        <Rute Ikon={BookOpen} tekst="flere kan lese" farge="#2563eb" delay={0.4} />
                        <Rute Ikon={Baby} tekst="færre barn dør" farge="#db2777" delay={0.8} />
                    </div>
                </motion.div>
            )}
            {beat === 2 && (
                <motion.div key="penger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Overskrift>Penger til</Overskrift>
                    <div className="flex gap-5">
                        <Rute Ikon={Hospital} tekst="sykehus" farge="#dc2626" />
                        <Rute Ikon={School} tekst="skoler" farge="#ca8a04" delay={0.4} />
                        <Rute Ikon={Route} tekst="veier" farge="#475569" delay={0.8} />
                    </div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.4 }}
                        className="mt-5 text-2xl font-bold text-slate-700"
                    >
                        Land med fattigdom: viktig å få BNP til å vokse
                    </motion.div>
                </motion.div>
            )}
            {beat >= 3 && (
                <motion.div key="feber" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="px-6 py-4 rounded-3xl bg-white shadow-xl mb-6">
                        <div className="text-4xl font-black text-red-600">Har du feber?</div>
                        <div className="text-2xl font-bold text-slate-600">Det svarer termometeret på.</div>
                    </div>
                    {beat >= 4 && (
                        <div className="flex gap-5">
                            <Rute Ikon={Smile} tekst="Er du glad?" farge="#ca8a04" skjult />
                            <Rute Ikon={Users} tekst="Har du venner?" farge="#2563eb" skjult delay={0.4} />
                            <Rute Ikon={Moon} tekst="Sover du godt?" farge="#7c3aed" skjult delay={0.8} />
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function BnpTermometer({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'termometer';
    const niva = modus === 'blind' ? (beat >= 2 ? 0.85 : 0.55) : beat >= 3 ? 0.9 : 0.6;
    return (
        <div className="absolute inset-0 flex items-center gap-10 px-12" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #e0f2fe 100%)' }}>
            <div className="h-full flex items-center justify-center" style={{ width: 220 }}>
                <Termometer niva={niva} feber={modus === 'termometer' && beat >= 3} />
            </div>
            <div className="flex-1">{modus === 'blind' ? <Blind beat={beat} /> : <Nyttig beat={beat} />}</div>
        </div>
    );
}
