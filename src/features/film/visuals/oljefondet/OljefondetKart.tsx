import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { School, X } from 'lucide-react';
import { useFilmVerden } from '../../kart/useFilmVerden';
import { rammePunkter } from '../../kart/grenser';
import type { VisualProps } from '../../types';

/**
 * Verdenskartet: oljepengene reiser ut av Norge og blir liggende i selskaper, hus og lån
 * rundt om i verden. Prikkene er eksempler på steder med børser og storbyer, ikke en liste
 * over hva fondet eier. Til slutt kommer en tynn strøm hjem igjen.
 */

const B = 1600;
const H = 900;
const NORGE = 578;
const HJEM: [number, number] = [10, 61];

/** Steder rundt om i verden. Bare for å vise «nesten alle land», uten navn. */
const STEDER: [number, number][] = [
    [-74, 40.7],
    [-79.4, 43.7],
    [-99, 19.4],
    [-46.6, -23.5],
    [-58.4, -34.6],
    [-0.1, 51.5],
    [2.35, 48.85],
    [-3.7, 40.4],
    [13.4, 52.5],
    [28, -26],
    [3.4, 6.5],
    [36.8, -1.3],
    [55.3, 25.2],
    [72.8, 19],
    [103.8, 1.3],
    [121.5, 31.2],
    [127, 37.5],
    [139.7, 35.7],
    [151, -33.9],
    [174.8, -36.8],
    [-122.4, 37.8],
    [-87.6, 41.9],
    [106.8, -6.2],
    [100.5, 13.7],
];

const UT = [0, 3, 5, 9, 13, 15, 17, 18, 20];

function bue(fra: [number, number], til: [number, number], hoyde = 0.25) {
    const mx = (fra[0] + til[0]) / 2;
    const my = (fra[1] + til[1]) / 2;
    const dx = til[0] - fra[0];
    const dy = til[1] - fra[1];
    const k = hoyde;
    return `M ${fra[0]} ${fra[1]} Q ${mx - dy * k} ${my + dx * k} ${til[0]} ${til[1]}`;
}

function Merke({ tekst, x, y, tone }: { tekst: string; x: number; y: number; tone: 'rod' | 'gull' | 'gronn' | 'vanlig' }) {
    const farge = {
        rod: 'border-red-500 text-red-700',
        gull: 'border-amber-500 text-amber-700',
        gronn: 'border-teal-500 text-teal-700',
        vanlig: 'border-slate-300 text-slate-800',
    }[tone];
    return (
        <div
            className="absolute"
            style={{ left: `${(x / B) * 100}%`, top: `${(y / H) * 100}%`, transform: 'translate(-50%, -50%)' }}
        >
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.4 }}
                className={`px-4 py-1.5 rounded-2xl bg-white/95 border-2 shadow-xl font-black text-2xl whitespace-nowrap ${farge}`}
            >
                {tekst}
            </motion.div>
        </div>
    );
}

export function OljefondetKart({ beat }: VisualProps) {
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(
        () =>
            geoNaturalEarth1().fitExtent(
                [
                    [20, 20],
                    [B - 20, H - 20],
                ],
                rammePunkter([-170, -48], [179, 76]) as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const hjem = projeksjon(HJEM) as [number, number];
    const steder = STEDER.map((s) => projeksjon(s) as [number, number]);
    const nordsjoen = projeksjon([3, 58]) as [number, number];
    const skole = projeksjon([10.7, 59.9]) as [number, number];

    return (
        <div className="absolute inset-0" style={{ background: '#cfe8f7' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {geographies.map((g, i) => {
                    const norge = Number(g.id) === NORGE;
                    return (
                        <path
                            key={`${g.id ?? 'x'}-${i}`}
                            d={sti(g as never) ?? undefined}
                            fill={norge ? '#dc2626' : '#f1ede4'}
                            stroke="#a8a29e"
                            strokeWidth={1}
                        />
                    );
                })}

                {/* Steder ute i verden */}
                {steder.map(([x, y], i) => (
                    <motion.circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={9}
                        fill="#eab308"
                        stroke="#fff"
                        strokeWidth={3}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat === 2 ? 0.35 : 1 }}
                        transition={{ delay: beat === 0 ? 0.6 + i * 0.08 : 0 }}
                    />
                ))}

                {/* Pengene ut */}
                {(beat === 0 || beat === 3) &&
                    UT.map((u, i) => (
                        <motion.path
                            key={`ut-${beat}-${u}`}
                            d={bue(hjem, steder[u])}
                            fill="none"
                            stroke="#ca8a04"
                            strokeWidth={beat === 3 ? 5 : 4}
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0.9 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.4, delay: 0.3 + i * 0.15 }}
                        />
                    ))}

                {/* Handelen: vi selger mye ut, kjøper mindre inn */}
                {beat === 1 && (
                    <>
                        <motion.path
                            d={bue(hjem, steder[0], 0.25)}
                            fill="none"
                            stroke="#0d9488"
                            strokeWidth={16}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2 }}
                        />
                        <motion.path
                            d={bue(steder[15], hjem, 0.2)}
                            fill="none"
                            stroke="#64748b"
                            strokeWidth={6}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, delay: 1 }}
                        />
                    </>
                )}

                {/* Omveien: ikke rett fra Nordsjøen til skolen */}
                {beat === 2 && (
                    <motion.line
                        x1={nordsjoen[0]}
                        y1={nordsjoen[1]}
                        x2={skole[0]}
                        y2={skole[1]}
                        stroke="#0f172a"
                        strokeWidth={6}
                        strokeLinecap="round"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    />
                )}

                {/* En liten del kommer hjem */}
                {beat === 3 && (
                    <motion.path
                        d={bue(steder[15], hjem, 0.2)}
                        fill="none"
                        stroke="#16a34a"
                        strokeWidth={3}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.6, delay: 2 }}
                    />
                )}

                <circle cx={hjem[0]} cy={hjem[1]} r={16} fill="#fff" stroke="#dc2626" strokeWidth={6} />
            </svg>

            {/* Utsnitt av omveien: forstørret Norge i hjørnet */}
            <AnimatePresence>
                {beat === 2 && (
                    <motion.div
                        key="omvei"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute flex items-center gap-4 rounded-3xl bg-white/95 shadow-2xl px-6 py-4"
                        style={{ left: '4%', bottom: '8%' }}
                    >
                        <div className="text-3xl font-black text-slate-800">Nordsjøen</div>
                        <div className="relative flex items-center">
                            <div style={{ width: 120, height: 6, background: '#0f172a', borderRadius: 3 }} />
                            <X size={64} strokeWidth={4} className="absolute text-red-600" style={{ left: 28 }} />
                        </div>
                        <School size={48} className="text-amber-700" />
                        <div className="text-3xl font-black text-slate-800">skolen din</div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {beat === 0 && <Merke key="m0" tekst="Selskaper, hus og lån i utlandet" x={800} y={70} tone="gull" />}
                {beat === 1 && <Merke key="m1a" tekst="Vi selger mer til andre land" x={480} y={180} tone="gronn" />}
                {beat === 1 && <Merke key="m1b" tekst="enn vi kjøper" x={1180} y={180} tone="vanlig" />}
                {beat === 1 && <Merke key="m1c" tekst="Overskuddet spares ute" x={1100} y={820} tone="gull" />}
                {beat === 3 && <Merke key="m3a" tekst="Jobber ute i mange år" x={1100} y={820} tone="gull" />}
                {beat === 3 && <Merke key="m3b" tekst="Litt hjem hvert år" x={1080} y={110} tone="gronn" />}
            </AnimatePresence>
        </div>
    );
}
