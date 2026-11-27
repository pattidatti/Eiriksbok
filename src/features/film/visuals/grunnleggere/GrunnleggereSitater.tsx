import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Ordene i grunnleggerfilmen, i to modus:
 * - streken: islams strek mellom Gud og menneskene, og Muhammad på menneskesiden.
 * - like: fem råd fra fem tradisjoner side om side, og hvor like de er.
 */

type Modus = 'streken' | 'like';

const OVERSKRIFT: Record<Modus, string[]> = {
    streken: [
        'Islam: en strek',
        'Muhammad: Guds siste profet',
        'Å tilbe ham er forbudt',
        'På menneskesiden',
    ],
    like: ['Fem tradisjoner', 'Rådene', 'Rådene', 'Nesten samme setning'],
};

const SITATER = [
    {
        tradisjon: 'Kristendom',
        person: 'Jesus',
        tekst: 'Gjør mot andre det du vil at de skal gjøre mot deg',
        farge: '#6366f1',
        fra: 1,
    },
    {
        tradisjon: 'Jødedom',
        person: 'Toraen',
        tekst: 'Elsk din neste som deg selv',
        farge: '#3b82f6',
        fra: 1,
    },
    {
        tradisjon: 'Buddhisme',
        person: 'Buddha',
        tekst: 'Sett deg i den andres sted, og ikke drep',
        farge: '#f59e0b',
        fra: 2,
    },
    {
        tradisjon: 'Mormonisme',
        person: 'Joseph Smith',
        tekst: 'Gjør godt mot alle mennesker',
        farge: '#8b5cf6',
        fra: 2,
    },
    {
        tradisjon: "Bahá'í",
        person: "Bahá'u'lláh",
        tekst: 'Jorden er ett land',
        farge: '#14b8a6',
        fra: 2,
    },
];

function Tittel({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-x-0 text-center font-display font-black text-slate-900"
                style={{ top: 18, fontSize: 38 }}
            >
                {tekst}
            </motion.div>
        </AnimatePresence>
    );
}

function Streken({ beat }: { beat: number }) {
    return (
        <>
            <div
                className="absolute inset-x-0"
                style={{ top: 80, height: 150, background: 'linear-gradient(#fef3c7, #fde68a)' }}
            />
            <div
                className="absolute inset-x-0 text-center font-display font-black"
                style={{ top: 118, fontSize: 52, color: '#92400e' }}
            >
                Gud
            </div>
            <motion.div
                className="absolute bg-slate-900"
                style={{
                    left: 0,
                    top: 228,
                    height: 6,
                    width: 1000,
                    transformOrigin: 'left center',
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute inset-x-0"
                style={{ top: 234, bottom: 0 }}
                initial={false}
                animate={{ background: beat >= 3 ? '#d1fae5' : '#f1f5f9' }}
                transition={{ duration: 0.8 }}
            />
            <div
                className="absolute font-black text-slate-500"
                style={{ right: 30, bottom: 20, fontSize: 24 }}
            >
                menneskene
            </div>
            {beat >= 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute flex flex-col items-center"
                    style={{ left: 60, top: 262, width: 260 }}
                >
                    <svg width={90} height={110} viewBox="0 0 90 110">
                        <circle cx={45} cy={26} r={22} fill="#10b981" />
                        <rect x={15} y={54} width={60} height={56} rx={26} fill="#10b981" />
                    </svg>
                    <div className="text-3xl font-black text-slate-900 mt-1">Muhammad</div>
                    <div className="text-xl font-bold text-emerald-800 text-center leading-tight">
                        Guds største og siste profet
                    </div>
                </motion.div>
            )}
            {beat === 2 && (
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="absolute rounded-3xl bg-white shadow-2xl px-6 py-5"
                    style={{ left: 380, top: 268, width: 580 }}
                >
                    <div className="flex items-center gap-3">
                        <span
                            className="flex items-center justify-center rounded-full bg-red-600 text-white font-black shrink-0"
                            style={{ width: 40, height: 40, fontSize: 26 }}
                        >
                            ✕
                        </span>
                        <span className="text-2xl font-black text-red-700">
                            å tilbe ham: strengt forbudt
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-4 leading-snug">
                        «Si: Jeg er bare et vanlig menneske som dere.»
                    </div>
                    <div className="text-lg font-bold text-slate-500 mt-2">Koranen 18,110</div>
                </motion.div>
            )}
            {beat >= 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="absolute rounded-3xl bg-white shadow-2xl px-6 py-5"
                    style={{ left: 380, top: 300, width: 580 }}
                >
                    <div className="text-2xl font-bold text-slate-700">
                        Han står i trosbekjennelsen,
                    </div>
                    <div className="text-3xl font-black text-emerald-800 mt-1">
                        men under streken
                    </div>
                </motion.div>
            )}
        </>
    );
}

function Like({ beat }: { beat: number }) {
    return (
        <>
            <div className="absolute flex" style={{ left: 26, top: 90, gap: 12 }}>
                {SITATER.map((s, i) => {
                    const vis = beat >= s.fra;
                    const ny = beat === s.fra;
                    return (
                        <motion.div
                            key={s.tradisjon}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: beat === 0 ? 0.2 + i * 0.25 : 0 }}
                            className="rounded-2xl bg-white shadow-xl flex flex-col overflow-hidden"
                            style={{
                                width: 180,
                                height: 340,
                                outline: ny || beat >= 3 ? `5px solid ${s.farge}` : 'none',
                            }}
                        >
                            <div className="px-3 py-2 text-white" style={{ background: s.farge }}>
                                <div className="text-xl font-black leading-tight">
                                    {s.tradisjon}
                                </div>
                                <div className="text-base font-bold opacity-90">{s.person}</div>
                            </div>
                            <div className="flex-1 flex items-center px-3">
                                {vis ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.6, delay: 0.2 + (i % 3) * 0.3 }}
                                        className="font-bold text-slate-900 leading-snug"
                                        style={{ fontSize: 23 }}
                                    >
                                        {s.tekst}
                                    </motion.div>
                                ) : (
                                    <div className="w-full flex flex-col gap-3">
                                        {[0, 1, 2].map((k) => (
                                            <div
                                                key={k}
                                                className="rounded bg-slate-200"
                                                style={{ height: 14, width: `${90 - k * 20}%` }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            {beat >= 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: 458 }}
                >
                    <div className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-2xl font-black">
                        Ulike tider, nesten samme setning
                    </div>
                </motion.div>
            )}
        </>
    );
}

export function GrunnleggereSitater({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'like';
    const linjer = OVERSKRIFT[modus];
    return (
        <Flate bakgrunn="#f3efe6">
            {modus === 'streken' ? <Streken beat={beat} /> : <Like beat={beat} />}
            <Tittel tekst={linjer[Math.min(beat, linjer.length - 1)]} />
        </Flate>
    );
}
