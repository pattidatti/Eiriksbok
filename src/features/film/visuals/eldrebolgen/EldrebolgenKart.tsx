import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Norge: fylkene der det allerede er flere over 65 enn under 20, Oslo som blir sist
 * (innen 2046), unge som flytter fra bygd til by, og andelen eldre i de minst sentrale
 * kommunene (20 prosent i dag, omtrent 25 i 2050).
 */

const B = 1600;
const H = 900;
const NORGE = 578;
const UTSNITT: Utsnitt = [
    [3.5, 57.6],
    [31.5, 71.3],
];
const KART_X1 = 1000;

interface Nal {
    ll: [number, number];
    tekst: string;
    fraBeat: number;
    dx: number;
    dy: number;
    farge: string;
}

const ELDRE = '#ea580c';
const OSLO = '#2563eb';

const NALER: Nal[] = [
    { ll: [10.5, 61.5], tekst: 'Innlandet', fraBeat: 1, dx: 28, dy: -16, farge: ELDRE },
    { ll: [8.5, 59.4], tekst: 'Telemark', fraBeat: 1, dx: -26, dy: 0, farge: ELDRE },
    { ll: [10.1, 59.2], tekst: 'Vestfold', fraBeat: 1, dx: 26, dy: 40, farge: ELDRE },
    { ll: [14.6, 66.9], tekst: 'Nordland', fraBeat: 1, dx: -26, dy: 0, farge: ELDRE },
    { ll: [19.0, 69.4], tekst: 'Troms', fraBeat: 1, dx: -26, dy: -16, farge: ELDRE },
    { ll: [10.75, 59.91], tekst: 'Oslo: innen 2046', fraBeat: 2, dx: 28, dy: 4, farge: OSLO },
];

/** Bygd → by. Pilene er en skisse av flyttestrømmen, ikke målte ruter. */
const FLYTT: { fra: [number, number]; til: [number, number] }[] = [
    { fra: [9.0, 62.3], til: [10.75, 59.95] },
    { fra: [7.0, 61.6], til: [5.4, 60.4] },
    { fra: [11.8, 64.4], til: [10.45, 63.45] },
    { fra: [13.5, 68.2], til: [18.9, 69.6] },
];

const TITLER = [
    'Allerede i noen fylker',
    'Flere over 65 enn under 20',
    'Oslo blir sist',
    'Unge flytter til byene',
    'De minst sentrale kommunene',
];

function Soyle({ etikett, verdi, tekst, forsinkelse }: { etikett: string; verdi: number; tekst: string; forsinkelse: number }) {
    const bredde = 190;
    return (
        <div className="mb-5">
            <div className="text-2xl font-bold text-slate-700 whitespace-nowrap">{etikett}</div>
            <div className="flex items-center gap-4">
                <div className="relative rounded-full bg-slate-200 shrink-0" style={{ height: 26, width: bredde }}>
                    <motion.div
                        className="absolute left-0 top-0 h-full rounded-full"
                        style={{ background: ELDRE }}
                        initial={{ width: 0 }}
                        animate={{ width: (verdi / 30) * bredde }}
                        transition={{ delay: forsinkelse, duration: 1 }}
                    />
                </div>
                <span className="text-3xl font-black text-slate-900 tabular-nums whitespace-nowrap">{tekst}</span>
            </div>
        </div>
    );
}

export function EldrebolgenKart({ beat }: VisualProps) {
    const { geographies } = useFilmVerden(UTSNITT);
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [60, 150],
                    [KART_X1, H - 30],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const tittel = TITLER[Math.min(beat, TITLER.length - 1)];
    const p = (ll: [number, number]) => projeksjon(ll) as [number, number];

    return (
        <div className="absolute inset-0" style={{ background: '#cfe8f7' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {geographies.map((g, i) => (
                    <path
                        key={`${g.id ?? 'x'}-${i}`}
                        d={sti(g as never) ?? undefined}
                        fill={Number(g.id) === NORGE ? '#fdf4e3' : '#e7e5e4'}
                        stroke="#a8a29e"
                        strokeWidth={1}
                    />
                ))}
                {beat >= 3 &&
                    FLYTT.map((f, i) => {
                        const [x1, y1] = p(f.fra);
                        const [x2, y2] = p(f.til);
                        const mx = (x1 + x2) / 2 + (y2 - y1) * 0.25;
                        const my = (y1 + y2) / 2 - (x2 - x1) * 0.25;
                        return (
                            <g key={i}>
                                <motion.path
                                    d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
                                    fill="none"
                                    stroke="#0d9488"
                                    strokeWidth={8}
                                    strokeLinecap="round"
                                    initial={{ pathLength: beat === 3 ? 0 : 1 }}
                                    animate={{ pathLength: 1, opacity: beat >= 4 ? 0.45 : 1 }}
                                    transition={{ duration: 1.4, delay: beat === 3 ? 0.3 + i * 0.25 : 0 }}
                                />
                                <circle cx={x2} cy={y2} r={12} fill="#0d9488" />
                                <circle cx={x1} cy={y1} r={8} fill="#fff" stroke="#0d9488" strokeWidth={4} />
                            </g>
                        );
                    })}
                {NALER.filter((n) => n.fraBeat <= beat).map((n) => {
                    const [x, y] = p(n.ll);
                    const demp = beat >= 3;
                    return (
                        <motion.g
                            key={n.tekst}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: demp ? 0.35 : 1 }}
                            transition={{ delay: n.fraBeat === beat ? 0.4 : 0 }}
                        >
                            <circle cx={x} cy={y} r={15} fill={n.farge} stroke="#fff" strokeWidth={5} />
                            <text
                                x={x + n.dx}
                                y={y + n.dy + 12}
                                textAnchor={n.dx > 0 ? 'start' : 'end'}
                                fontSize={36}
                                fontWeight={900}
                                fill="#0f172a"
                                stroke="#fff"
                                strokeWidth={8}
                                paintOrder="stroke"
                            >
                                {n.tekst}
                            </text>
                        </motion.g>
                    );
                })}
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={tittel}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[4%] left-[3%] px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tittel}
                </motion.div>
            </AnimatePresence>

            {beat <= 2 && (
                <div className="absolute rounded-3xl bg-white/95 shadow-2xl px-6 py-5" style={{ right: '4%', top: '30%', width: '32%' }}>
                    <div className="flex items-center gap-3 text-2xl font-bold text-slate-700 mb-3">
                        <span className="inline-block rounded-full" style={{ width: 26, height: 26, background: ELDRE }} />
                        flere over 65 enn under 20, nå
                    </div>
                    {beat >= 2 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-2xl font-bold text-slate-700">
                            <span className="inline-block rounded-full" style={{ width: 26, height: 26, background: OSLO }} />
                            det siste fylket
                        </motion.div>
                    )}
                </div>
            )}
            {beat === 3 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="absolute rounded-3xl bg-white/95 shadow-2xl px-6 py-5 text-3xl font-black text-teal-700"
                    style={{ right: '4%', top: '34%', width: '32%' }}
                >
                    Unge flytter fra bygda for å studere og jobbe
                </motion.div>
            )}
            {beat >= 4 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute rounded-3xl bg-white/95 shadow-2xl px-6 py-5"
                    style={{ right: '4%', top: '22%', width: '36%' }}
                >
                    <div className="text-xl font-bold text-slate-500 mb-3">andel som er 70 år eller eldre</div>
                    <Soyle etikett="I dag" verdi={20} tekst="20 %" forsinkelse={0.4} />
                    <Soyle etikett="I 2050 kan det bli" verdi={25} tekst="ca. 25 %" forsinkelse={1.2} />
                    <div className="text-2xl font-black text-orange-700">hver fjerde innbygger</div>
                </motion.div>
            )}
        </div>
    );
}
