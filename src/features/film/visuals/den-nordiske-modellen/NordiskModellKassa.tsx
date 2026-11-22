import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    BedDouble,
    Building2,
    Factory,
    GraduationCap,
    HeartPulse,
    Landmark,
    PiggyBank,
    ShieldCheck,
    ShoppingCart,
    Stethoscope,
    User,
    Wallet,
    X,
} from 'lucide-react';
import { Flate } from '../shared';
import type { VisualProps } from '../../types';
import { FARGE, Overskrift, Vis } from './felles';
import { overskriftFor } from './hjelp';

/**
 * Felleskassa. Tre moduser:
 * - felles: alle går inn i samme sykehus og skole (universell mot behovsprøvd), så skatten
 *   som renner inn i kassa og tjenestene som går likt ut.
 * - omstilling: en gammeldags bedrift legges ned, en god vokser, og velferden hjelper
 *   den som mister jobben over til den nye.
 * - sirkel: kassa som bare virker når folk jobber, de onde sirklene, og flere eldre.
 */

type Modus = 'felles' | 'omstilling' | 'sirkel';

const OVERSKRIFT: Record<Modus, string[]> = {
    felles: [
        'Velferd som gjelder alle',
        'Universell eller behovsprøvd?',
        'Nesten alle bruker, nesten alle betaler',
        'Hvordan betales det?',
        'Hvem betaler mest?',
        'Penger flyttes',
    ],
    omstilling: [
        'Den tredje søylen: økonomien',
        'Små lønnsforskjeller',
        'Noen legges ned, andre vokser',
        'Hjelp videre',
        'Mindre farlig å endre seg',
    ],
    sirkel: [
        'Kassa trenger folk i jobb',
        'Onde sirkler',
        'Onde sirkler',
        'Flere i Norden',
        'Flere eldre',
    ],
};

const PERSONER = [
    { navn: 'Lav inntekt', pose: 18, farge: '#64748b' },
    { navn: 'Middels inntekt', pose: 28, farge: '#475569' },
    { navn: 'Høy inntekt', pose: 42, farge: '#1e293b' },
];

function Person({
    navn,
    farge,
    pose,
    visPose = false,
    merke,
}: {
    navn: string;
    farge: string;
    pose: number;
    visPose?: boolean;
    merke?: ReactNode;
}) {
    return (
        <div className="flex items-center gap-2" style={{ height: 82 }}>
            <div
                className="relative flex items-center justify-center rounded-full bg-white shadow"
                style={{ width: 64, height: 64 }}
            >
                <User size={40} color={farge} />
            </div>
            <div className="font-bold text-slate-800" style={{ fontSize: 21, width: 160 }}>
                {navn}
            </div>
            {visPose && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                    className="flex items-center justify-center"
                    style={{ width: 50 }}
                >
                    <Wallet size={pose} color={FARGE.gull} strokeWidth={2.4} />
                </motion.div>
            )}
            {visPose && (
                <div className="font-black text-amber-800" style={{ fontSize: 22, width: 56 }}>
                    {pose < 20 ? 'litt' : pose < 30 ? 'mer' : 'mest'}
                </div>
            )}
            {merke}
        </div>
    );
}

// ---------- felles ----------

function Bygning({ tekst }: { tekst: string }) {
    return (
        <div
            className="rounded-3xl bg-white shadow-xl flex flex-col items-center px-4 py-4"
            style={{ width: 280 }}
        >
            <div className="flex gap-3">
                <HeartPulse size={54} color={FARGE.rod} />
                <GraduationCap size={54} color={FARGE.bla} />
            </div>
            <div className="font-black text-slate-900 mt-2 text-center" style={{ fontSize: 24 }}>
                Sykehus og skole
            </div>
            <div
                className="font-bold mt-1 text-center"
                style={{ fontSize: 19, color: FARGE.norge }}
            >
                {tekst}
            </div>
        </div>
    );
}

function Felles({ beat }: { beat: number }) {
    if (beat <= 2) {
        return (
            <>
                <div className="absolute" style={{ left: 24, top: 130 }}>
                    {PERSONER.map((p) => (
                        <Person key={p.navn} {...p} />
                    ))}
                    {beat >= 2 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-1 inline-block rounded-lg bg-amber-100 px-3 py-1 font-bold text-amber-800"
                            style={{ fontSize: 22 }}
                        >
                            Høy inntekt: bruker det også
                        </motion.div>
                    )}
                </div>
                {/* Piler fra alle tre inn i bygningen */}
                <svg
                    className="absolute"
                    style={{ left: 262, top: 130, width: 120, height: 246 }}
                    viewBox="0 0 120 246"
                >
                    {[41, 123, 205].map((y, i) => (
                        <motion.path
                            key={y}
                            d={`M 10 ${y} C 60 ${y}, 60 123, 110 123`}
                            fill="none"
                            stroke={FARGE.norge}
                            strokeWidth={5}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 * i }}
                        />
                    ))}
                </svg>
                <div className="absolute" style={{ left: 390, top: 160 }}>
                    <Bygning tekst={beat >= 1 ? 'Universell: for alle' : 'Samme rett for alle'} />
                </div>
                <Vis
                    nar={beat === 1}
                    className="absolute"
                    style={{ left: 696, top: 120, width: 284 }}
                >
                    <div
                        className="rounded-3xl bg-white shadow-xl px-4 py-3"
                        style={{ border: '4px dashed #94a3b8' }}
                    >
                        <div className="font-black text-slate-900" style={{ fontSize: 22 }}>
                            Det motsatte:
                        </div>
                        <div className="font-black" style={{ fontSize: 22, color: FARGE.bla }}>
                            Behovsprøvd
                        </div>
                        <div className="font-semibold text-slate-700 mt-1" style={{ fontSize: 21 }}>
                            Hjelp bare hvis inntekten er lav nok
                        </div>
                        <div
                            className="mt-2 flex flex-col gap-1 font-bold"
                            style={{ fontSize: 21 }}
                        >
                            <span className="text-teal-700">Lav inntekt: ja</span>
                            <span className="text-red-700">Middels inntekt: nei</span>
                            <span className="text-red-700">Høy inntekt: nei</span>
                        </div>
                    </div>
                </Vis>
                <Vis
                    nar={beat >= 2}
                    className="absolute"
                    style={{ left: 390, top: 420, width: 580 }}
                >
                    <div
                        className="flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-white font-black shadow-xl"
                        style={{ fontSize: 22 }}
                    >
                        <PiggyBank size={32} /> Nesten alle bruker det, så nesten alle vil betale
                    </div>
                </Vis>
            </>
        );
    }
    // Kassa: skatten inn, tjenestene ut.
    return (
        <>
            <div
                className="absolute flex justify-center gap-3"
                style={{ left: 200, width: 600, top: 72 }}
            >
                {[
                    { ikon: <Wallet size={24} />, tekst: 'inntekt' },
                    { ikon: <ShoppingCart size={24} />, tekst: 'det vi kjøper' },
                    { ikon: <Building2 size={24} />, tekst: 'formue (det du eier)' },
                ].map((k, i) => (
                    <motion.div
                        key={k.tekst}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 * i }}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-100 px-3 py-1.5 font-bold text-amber-900 whitespace-nowrap"
                        style={{ fontSize: 17 }}
                    >
                        {k.ikon} {k.tekst}
                    </motion.div>
                ))}
            </div>
            {/* Kassa i midten */}
            <div
                className="absolute flex flex-col items-center"
                style={{ left: 400, width: 200, top: 170 }}
            >
                <div
                    className="flex items-center justify-center rounded-3xl shadow-xl"
                    style={{ width: 170, height: 150, background: FARGE.gull }}
                >
                    <Landmark size={84} color="#ffffff" />
                </div>
                <div className="font-black text-slate-900 mt-2" style={{ fontSize: 24 }}>
                    Felleskassa
                </div>
            </div>
            {/* Inn: de tre betaler ulikt */}
            <Vis nar={beat >= 4} className="absolute" style={{ left: 16, top: 150 }}>
                <div className="font-black text-slate-700 mb-1" style={{ fontSize: 18 }}>
                    Betaler inn
                </div>
                {PERSONER.map((p) => (
                    <Person key={p.navn} {...p} visPose />
                ))}
            </Vis>
            <Vis nar={beat >= 4} className="absolute" style={{ left: 652, top: 150 }}>
                <div className="font-black text-slate-700 mb-1" style={{ fontSize: 18 }}>
                    Får omtrent det samme
                </div>
                {PERSONER.map((p) => (
                    <div key={p.navn} className="flex items-center gap-2" style={{ height: 70 }}>
                        <Stethoscope size={30} color={FARGE.rod} />
                        <GraduationCap size={30} color={FARGE.bla} />
                        <div className="font-bold text-slate-800 ml-2" style={{ fontSize: 19 }}>
                            {p.navn}
                        </div>
                    </div>
                ))}
            </Vis>
            <Vis nar={beat >= 4} className="absolute" style={{ left: 600, top: 260 }}>
                <ArrowRight size={60} color={FARGE.norge} />
            </Vis>
            <Vis
                nar={beat >= 5}
                className="absolute inset-x-0 flex justify-center"
                style={{ top: 420 }}
            >
                <div
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-white font-black shadow-xl text-center"
                    style={{ fontSize: 22 }}
                >
                    Fra dem som har mye, til dem som har lite
                    <div className="font-bold text-teal-300" style={{ fontSize: 19 }}>
                        Mindre forskjeller i inntekt
                    </div>
                </div>
            </Vis>
        </>
    );
}

// ---------- omstilling ----------

function Omstilling({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <div className="absolute inset-x-0 flex justify-center gap-6" style={{ top: 180 }}>
                {['Frihandel med andre land', 'En stabil politikk', 'Flest mulig i jobb'].map(
                    (t, i) => (
                        <motion.div
                            key={t}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 * i }}
                            className="rounded-3xl bg-white shadow-xl px-5 py-6 font-black text-slate-900 text-center"
                            style={{
                                width: 260,
                                fontSize: 26,
                                borderTop: `10px solid ${FARGE.gull}`,
                            }}
                        >
                            {t}
                        </motion.div>
                    )
                )}
            </div>
        );
    }
    const nedlagt = beat >= 2;
    const flyttet = beat >= 3;
    return (
        <>
            {/* Den gamle bedriften */}
            <motion.div
                className="absolute flex flex-col items-center"
                style={{ left: 60, top: 120, width: 280 }}
                initial={false}
                animate={{ opacity: nedlagt ? 0.5 : 1 }}
            >
                <div className="relative">
                    <Factory size={150} color="#78716c" strokeWidth={1.3} />
                    {nedlagt && (
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                        >
                            <X size={150} color={FARGE.rod} strokeWidth={2.5} />
                        </motion.div>
                    )}
                </div>
                <div className="font-black text-slate-800 text-center" style={{ fontSize: 22 }}>
                    Gammeldags arbeid
                </div>
                <div className="font-semibold text-slate-600 text-center" style={{ fontSize: 18 }}>
                    {nedlagt ? 'Legges ned' : 'Lønner seg dårlig'}
                </div>
            </motion.div>
            <Vis nar={beat === 1} className="absolute" style={{ left: 380, top: 160, width: 240 }}>
                <div className="rounded-2xl bg-white shadow-xl px-4 py-3 text-center">
                    <div className="font-black text-slate-900" style={{ fontSize: 22 }}>
                        Små lønnsforskjeller
                    </div>
                    <div className="font-bold mt-1" style={{ fontSize: 19, color: FARGE.rod }}>
                        Små lønnsforskjeller gjør den dyr å drive
                    </div>
                </div>
            </Vis>
            {/* Den gode bedriften */}
            <motion.div
                className="absolute flex flex-col items-center"
                style={{ left: 660, top: 140, width: 280, transformOrigin: '50% 100%' }}
                initial={false}
                animate={{ scale: nedlagt ? 1.25 : 0.85 }}
                transition={{ type: 'spring', stiffness: 90, damping: 15 }}
            >
                <Building2 size={130} color={FARGE.norge} strokeWidth={1.4} />
                <div className="font-black text-slate-800 text-center" style={{ fontSize: 24 }}>
                    God bedrift
                </div>
                <div className="font-semibold text-slate-600 text-center" style={{ fontSize: 20 }}>
                    {nedlagt ? 'Vokser' : 'Går godt'}
                </div>
            </motion.div>
            {/* Nettet mellom dem */}
            <Vis nar={beat >= 3} className="absolute" style={{ left: 250, top: 400, width: 500 }}>
                <svg viewBox="0 0 500 60" style={{ width: 500, height: 60 }}>
                    <path
                        d="M 10 10 Q 250 70 490 10"
                        fill="none"
                        stroke={FARGE.norge}
                        strokeWidth={6}
                    />
                    <path
                        d="M 10 10 Q 250 40 490 10"
                        fill="none"
                        stroke={FARGE.norge}
                        strokeWidth={3}
                        strokeDasharray="8 8"
                    />
                </svg>
                <div
                    className="flex items-center justify-center gap-2 font-black"
                    style={{ fontSize: 20, color: FARGE.norge }}
                >
                    <ShieldCheck size={26} /> Velferd og hjelp til å finne ny jobb
                </div>
            </Vis>
            {/* Arbeideren som går over */}
            {beat >= 1 && (
                <motion.div
                    className="absolute flex flex-col items-center"
                    style={{ top: 330, left: 0 }}
                    initial={false}
                    animate={{ x: flyttet ? 760 : 180 }}
                    transition={{ duration: 1.6, ease: 'easeInOut' }}
                >
                    <div
                        className="flex items-center justify-center rounded-full bg-white shadow"
                        style={{ width: 54, height: 54 }}
                    >
                        <User size={34} color={FARGE.blekk} />
                    </div>
                </motion.div>
            )}
            <Vis
                nar={beat >= 4}
                className="absolute inset-x-0 flex justify-center"
                style={{ top: 506 }}
            >
                <div
                    className="rounded-2xl bg-slate-900 px-5 py-2 text-white font-black shadow-xl"
                    style={{ fontSize: 22 }}
                >
                    Velferden gjør det mindre farlig å endre seg
                </div>
            </Vis>
        </>
    );
}

// ---------- sirkel ----------

const LEDD = [
    'Samarbeidet blir svakere',
    'Flere uten jobb',
    'Større forskjeller',
    'Mer press på velferden',
];

function Sirkel({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <>
                <div className="absolute" style={{ left: 60, top: 150 }}>
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-2" style={{ height: 70 }}>
                            <div
                                className="flex items-center justify-center rounded-full bg-white shadow"
                                style={{ width: 54, height: 54 }}
                            >
                                <User size={34} color={FARGE.blekk} />
                            </div>
                            <Wallet size={30} color={FARGE.gull} />
                        </div>
                    ))}
                    <div
                        className="font-bold text-slate-700 mt-1"
                        style={{ fontSize: 19, width: 220 }}
                    >
                        Folk som jobber og betaler skatt
                    </div>
                </div>
                <motion.div
                    className="absolute"
                    style={{ left: 300, top: 200 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <ArrowRight size={90} color={FARGE.gull} />
                </motion.div>
                <div
                    className="absolute flex flex-col items-center"
                    style={{ left: 420, top: 150 }}
                >
                    <div
                        className="flex items-center justify-center rounded-3xl shadow-xl"
                        style={{ width: 200, height: 170, background: FARGE.gull }}
                    >
                        <Landmark size={96} color="#ffffff" />
                    </div>
                    <div className="font-black text-slate-900 mt-2" style={{ fontSize: 24 }}>
                        Velferden
                    </div>
                </div>
                <div
                    className="absolute rounded-2xl bg-white shadow-xl px-4 py-3"
                    style={{ left: 680, top: 190, width: 280 }}
                >
                    <div className="font-black text-slate-900" style={{ fontSize: 22 }}>
                        Virker bare så lenge nok folk jobber
                    </div>
                </div>
            </>
        );
    }
    if (beat <= 2) {
        const cx = 500;
        const cy = 300;
        const r = 185;
        return (
            <>
                <svg
                    className="absolute"
                    style={{ left: 0, top: 0, width: 1000, height: 562 }}
                    viewBox="0 0 1000 562"
                >
                    <motion.circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke={beat >= 2 ? FARGE.rod : '#94a3b8'}
                        strokeWidth={8}
                        strokeDasharray="30 16"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    />
                </svg>
                {LEDD.map((t, i) => {
                    const a = -Math.PI / 2 + (i * Math.PI) / 2;
                    const x = cx + Math.cos(a) * r;
                    const y = cy + Math.sin(a) * r;
                    return (
                        <div
                            key={t}
                            className="absolute flex justify-center"
                            style={{ left: x - 120, top: y - 28, width: 240 }}
                        >
                            <motion.div
                                initial={false}
                                animate={{
                                    backgroundColor: beat >= 2 ? '#fee2e2' : '#ffffff',
                                    scale: beat >= 2 ? 1 : 0.92,
                                }}
                                transition={{ delay: beat >= 2 ? 0.4 * i : 0 }}
                                className="rounded-2xl shadow-lg px-3 py-2 font-black text-slate-900 text-center"
                                style={{
                                    fontSize: 19,
                                    border: `3px solid ${beat >= 2 ? FARGE.rod : '#cbd5e1'}`,
                                }}
                            >
                                {t}
                            </motion.div>
                        </div>
                    );
                })}
                <div
                    className="absolute flex flex-col items-center"
                    style={{ left: cx - 90, top: cy - 40, width: 180 }}
                >
                    <div
                        className="font-black text-center"
                        style={{ fontSize: 24, color: beat >= 2 ? FARGE.rod : FARGE.gra }}
                    >
                        Onde sirkler
                    </div>
                    <div
                        className="font-semibold text-slate-600 text-center"
                        style={{ fontSize: 19 }}
                    >
                        Fafo advarer
                    </div>
                </div>
            </>
        );
    }
    return (
        <>
            <div
                className="absolute flex justify-center gap-6"
                style={{ left: 0, right: 0, top: 90 }}
            >
                <motion.div
                    className="rounded-3xl bg-white shadow-xl px-6 py-4 text-center"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ width: 380 }}
                >
                    <div className="font-bold text-slate-600" style={{ fontSize: 19 }}>
                        Fram mot 2030
                    </div>
                    <div
                        className="font-black whitespace-nowrap"
                        style={{ fontSize: 38, color: FARGE.norge }}
                    >
                        minst 3 millioner
                    </div>
                    <div className="font-bold text-slate-700" style={{ fontSize: 19 }}>
                        flere i Norden enn før
                    </div>
                </motion.div>
                <motion.div
                    className="rounded-3xl bg-white shadow-xl px-6 py-4 text-center"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    style={{ width: 380 }}
                >
                    <div className="font-bold text-slate-600" style={{ fontSize: 19 }}>
                        I 2030
                    </div>
                    <div
                        className="font-black whitespace-nowrap"
                        style={{ fontSize: 38, color: FARGE.blekk }}
                    >
                        nesten 30 millioner
                    </div>
                    <div className="font-bold text-slate-700" style={{ fontSize: 19 }}>
                        folk i Norden i alt
                    </div>
                </motion.div>
            </div>
            <div
                className="absolute text-center font-semibold text-slate-500"
                style={{ left: 0, right: 0, top: 300, fontSize: 16 }}
            >
                Forskernes utregning (Fafo, 2014)
            </div>
            <Vis
                nar={beat >= 4}
                className="absolute flex justify-center items-center gap-5"
                style={{ left: 0, right: 0, top: 360 }}
            >
                <div
                    className="flex items-center gap-3 rounded-2xl bg-white shadow-xl px-5 py-3 font-black text-slate-900"
                    style={{ fontSize: 24 }}
                >
                    Særlig flere eldre
                </div>
                <ArrowRight size={44} color={FARGE.gull} />
                <div
                    className="flex items-center gap-3 rounded-2xl bg-amber-100 shadow-xl px-5 py-3 font-black text-amber-900"
                    style={{ fontSize: 24 }}
                >
                    <PiggyBank size={30} /> Pensjon
                    <BedDouble size={30} /> Pleie
                </div>
            </Vis>
        </>
    );
}

export function NordiskModellKassa({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'felles';
    return (
        <Flate bakgrunn={FARGE.bakgrunn}>
            {modus === 'felles' && <Felles beat={beat} />}
            {modus === 'omstilling' && <Omstilling beat={beat} />}
            {modus === 'sirkel' && <Sirkel beat={beat} />}
            <Overskrift tekst={overskriftFor(OVERSKRIFT[modus], beat)} />
        </Flate>
    );
}
