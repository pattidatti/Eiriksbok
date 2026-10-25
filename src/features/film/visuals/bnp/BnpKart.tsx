import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { Coins, GraduationCap, HeartPulse, type LucideIcon } from 'lucide-react';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kartet fra Island til India. «hdi»: hva HDI måler, og hvor de to økonomene kom fra.
 * «qatar»: Qatar og Norge har nesten like høy inntekt, men havner langt fra hverandre på
 * HDI-lista. Kortet til høyre viser tallene, kartet viser hvor landene ligger.
 */

type Modus = 'hdi' | 'qatar';

const B = 1600;
const H = 900;
const NORGE = 578;
const ISLAND = 352;
const QATAR = 634;
const PAKISTAN = 586;
const INDIA = 356;

const FARGE: Record<number, string> = {
    [NORGE]: '#dc2626',
    [ISLAND]: '#2563eb',
    [QATAR]: '#7c2d12',
    [PAKISTAN]: '#16a34a',
    [INDIA]: '#ea580c',
};

function merket(modus: Modus, beat: number): number[] {
    if (modus === 'hdi') return beat >= 2 ? [PAKISTAN, INDIA] : [];
    if (beat === 2) return [NORGE, QATAR, ISLAND];
    return [NORGE, QATAR];
}

interface Nal {
    id: number;
    ll: [number, number];
    navn: string;
    dx: number;
    dy: number;
}

const NALER: Nal[] = [
    { id: NORGE, ll: [9, 61], navn: 'Norge', dx: 30, dy: -10 },
    { id: ISLAND, ll: [-19, 65], navn: 'Island', dx: 0, dy: -40 },
    { id: QATAR, ll: [51.2, 25.3], navn: 'Qatar', dx: -40, dy: 60 },
    { id: PAKISTAN, ll: [69, 30], navn: 'Pakistan: Mahbub ul Haq', dx: -30, dy: -30 },
    { id: INDIA, ll: [79, 22], navn: 'India: Amartya Sen', dx: -30, dy: 70 },
];

function Kort({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="absolute rounded-3xl bg-white/95 shadow-2xl px-6 py-5"
            style={{ right: '3%', top: '7%', bottom: '7%', width: '33%' }}
        >
            {children}
        </motion.div>
    );
}

function Soyle({ etikett, verdi, farge, andel, delay }: { etikett: string; verdi: string; farge: string; andel: number; delay: number }) {
    return (
        <div className="mb-3">
            <div className="flex justify-between text-2xl font-bold text-slate-800">
                <span>{etikett}</span>
                <span>{verdi}</span>
            </div>
            <div className="h-7 rounded-full bg-slate-200 overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: farge }}
                    initial={{ width: 0 }}
                    animate={{ width: `${andel * 100}%` }}
                    transition={{ delay, duration: 1 }}
                />
            </div>
        </div>
    );
}

function Pilar({ Ikon, tekst, farge, delay }: { Ikon: LucideIcon; tekst: string; farge: string; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="flex items-center gap-4 mb-4"
        >
            <Ikon size={52} style={{ color: farge }} />
            <span className="text-2xl font-bold text-slate-800">{tekst}</span>
        </motion.div>
    );
}

function HdiKort({ beat }: { beat: number }) {
    return (
        <Kort>
            <div className="text-6xl font-black text-slate-900">HDI</div>
            <div className="text-2xl font-bold text-slate-500 mb-5">indeks for menneskelig utvikling, laget av FN</div>
            {beat === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-2xl font-bold text-slate-800">
                    En indeks er ett samlet tall, satt sammen av flere mål.
                </motion.div>
            )}
            {beat >= 1 && (
                <>
                    <Pilar Ikon={HeartPulse} tekst="hvor lenge folk lever" farge="#dc2626" delay={0.3} />
                    <Pilar Ikon={GraduationCap} tekst="hvor mye skole de får" farge="#2563eb" delay={0.9} />
                    <Pilar Ikon={Coins} tekst="hvor mye penger de har" farge="#ca8a04" delay={1.5} />
                </>
            )}
            {beat >= 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-2 text-2xl font-black text-teal-700">
                    Brukt av FN siden 1990
                </motion.div>
            )}
        </Kort>
    );
}

function QatarKort({ beat }: { beat: number }) {
    return (
        <Kort>
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.div key="to" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="text-4xl font-black text-slate-900 mb-4">To lister</div>
                        <div className="text-3xl font-bold text-amber-700 mb-2">1. Inntekt per innbygger</div>
                        <div className="text-3xl font-bold text-blue-700">2. HDI</div>
                    </motion.div>
                )}
                {beat === 1 && (
                    <motion.div key="inntekt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="text-3xl font-black text-slate-900 mb-1">Inntekt per innbygger</div>
                        <div className="text-xl font-semibold text-slate-500 mb-5">FNs rapport, 2025</div>
                        <Soyle etikett="Norge" verdi="" farge={FARGE[NORGE]} andel={0.9} delay={0.3} />
                        <Soyle etikett="Qatar" verdi="" farge={FARGE[QATAR]} andel={0.86} delay={0.7} />
                        <div className="mt-3 text-2xl font-black text-slate-800">Nesten like høy</div>
                    </motion.div>
                )}
                {beat === 2 && (
                    <motion.div key="hdi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="text-3xl font-black text-slate-900 mb-4">HDI-lista</div>
                        {[
                            { plass: '1.', land: 'Island', farge: FARGE[ISLAND] },
                            { plass: '2.', land: 'Norge', farge: FARGE[NORGE] },
                            { plass: '...', land: '', farge: '#94a3b8' },
                            { plass: '43.', land: 'Qatar', farge: FARGE[QATAR] },
                        ].map((r, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i === 3 ? 1.6 : 0.3 + i * 0.3 }}
                                className="flex items-center gap-4 mb-3"
                            >
                                <span className="text-4xl font-black tabular-nums" style={{ color: r.farge, width: 90 }}>
                                    {r.plass}
                                </span>
                                <span className="text-3xl font-bold text-slate-800">{r.land}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
                {beat >= 3 && (
                    <motion.div key="skole" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="flex items-center gap-3 mb-1">
                            <GraduationCap size={48} className="text-blue-700" />
                            <div className="text-3xl font-black text-slate-900">År på skole</div>
                        </div>
                        <div className="text-xl font-semibold text-slate-500 mb-5">for en voksen, i snitt</div>
                        <Soyle etikett="Norge" verdi="13,1 år" farge={FARGE[NORGE]} andel={13.1 / 14} delay={0.3} />
                        <Soyle etikett="Qatar" verdi="10,8 år" farge={FARGE[QATAR]} andel={10.8 / 14} delay={0.7} />
                        {beat >= 4 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-5 px-4 py-3 rounded-2xl bg-slate-900 text-amber-200 text-2xl font-black"
                            >
                                Penger alene gir ikke en høy plass
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </Kort>
    );
}

export function BnpKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'hdi';
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [30, 40],
                    [990, H - 40],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [-25, 8],
                        [92, 71],
                    ],
                } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const lys = merket(modus, beat);
    const naler = NALER.filter((n) => lys.includes(n.id));

    return (
        <div className="absolute inset-0" style={{ background: '#cfe8f7' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {geographies.map((g, i) => {
                    const id = Number(g.id);
                    const på = lys.includes(id);
                    return (
                        <motion.path
                            key={`${g.id ?? 'x'}-${i}`}
                            d={sti(g as never) ?? undefined}
                            initial={false}
                            animate={{ fill: på ? FARGE[id] : '#f1ede4' }}
                            transition={{ duration: 0.9 }}
                            stroke="#a8a29e"
                            strokeWidth={1}
                        />
                    );
                })}
                {naler.map((n) => {
                    const [x, y] = projeksjon(n.ll) as [number, number];
                    return (
                        <motion.g key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                            <circle
                                cx={x}
                                cy={y}
                                r={n.id === QATAR ? 22 : 14}
                                fill={n.id === QATAR ? FARGE[QATAR] : '#fff'}
                                stroke={n.id === QATAR ? '#fff' : FARGE[n.id]}
                                strokeWidth={6}
                            />
                            <text
                                x={x + n.dx}
                                y={y + n.dy}
                                textAnchor={n.dx > 0 ? 'start' : n.dx < 0 ? 'end' : 'middle'}
                                fontSize={38}
                                fontWeight={900}
                                fill="#0f172a"
                                stroke="#fff"
                                strokeWidth={8}
                                paintOrder="stroke"
                            >
                                {n.navn}
                            </text>
                        </motion.g>
                    );
                })}
            </svg>
            {modus === 'hdi' ? <HdiKort beat={beat} /> : <QatarKort beat={beat} />}
        </div>
    );
}
