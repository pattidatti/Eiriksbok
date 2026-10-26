import { useMemo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Oljekrisen. «pris»: oljeprisen som stuper fra godt over 100 til under 40 dollar fatet.
 * «kart»: Rogaland, der mye av oljeindustrien ligger, med ledigheten og andelen i jobb.
 * «gapet»: ledigheten kom tilbake til nivået fra før, men andelen i jobb gjorde det ikke.
 * Grafene er skisser: bare tallene som står i artikkelen er merket.
 */

type Modus = 'pris' | 'kart' | 'gapet';
type LngLat = [number, number];

const MORK = '#0f172a';
const GRA = '#64748b';
const ROD = '#dc2626';
const OLJE = '#1e293b';
const JOBB = '#0d9488';

function Inn({ children, forsinkelse = 0 }: { children: ReactNode; forsinkelse?: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, delay: forsinkelse }}>
            {children}
        </motion.g>
    );
}

function Tittel({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.g key={tekst} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <rect x={800 - tekst.length * 17 - 30} y={40} width={tekst.length * 34 + 60} height={86} rx={22} fill="#ffffff" fillOpacity={0.95} />
                <text x={800} y={100} textAnchor="middle" fontSize={56} fontWeight={800} fill={MORK}>
                    {tekst}
                </text>
            </motion.g>
        </AnimatePresence>
    );
}

/* ---------- pris ---------- */

/** Et oljefat. */
function Fat({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-50} y={-70} width={100} height={140} rx={12} fill={OLJE} />
            <ellipse cx={0} cy={-70} rx={50} ry={14} fill="#475569" />
            <line x1={-50} y1={-25} x2={50} y2={-25} stroke="#64748b" strokeWidth={6} />
            <line x1={-50} y1={25} x2={50} y2={25} stroke="#64748b" strokeWidth={6} />
        </g>
    );
}

const PX0 = 260;
const PX1 = 1180;
const PY0 = 780;
/** Dollar til y. */
const py = (d: number) => PY0 - (d / 130) * 560;

function Pris({ beat }: { beat: number }) {
    const linje = `M ${PX0} ${py(110)} C ${PX0 + 200} ${py(112)} ${PX0 + 300} ${py(100)} ${PX0 + 420} ${py(65)} C ${PX0 + 520} ${py(48)} ${PX0 + 640} ${py(62)} ${PX0 + 760} ${py(50)} C ${PX0 + 840} ${py(42)} ${PX0 + 880} ${py(36)} ${PX1} ${py(34)}`;
    return (
        <g>
            <line x1={PX0} y1={PY0} x2={PX1} y2={PY0} stroke={GRA} strokeWidth={4} />
            <line x1={PX0} y1={PY0} x2={PX0} y2={200} stroke={GRA} strokeWidth={4} />
            {[40, 100].map((d) => (
                <g key={d}>
                    <line x1={PX0} y1={py(d)} x2={PX1} y2={py(d)} stroke="#cbd5e1" strokeWidth={2} strokeDasharray="8 8" />
                    <text x={PX0 - 16} y={py(d) + 10} textAnchor="end" fontSize={28} fontWeight={700} fill={GRA}>
                        {d} $
                    </text>
                </g>
            ))}
            <text x={PX0} y={PY0 + 50} textAnchor="middle" fontSize={30} fontWeight={700} fill={MORK}>
                Midten av 2014
            </text>
            <text x={PX1} y={PY0 + 50} textAnchor="middle" fontSize={30} fontWeight={700} fill={MORK}>
                Slutten av 2015
            </text>
            <Fat x={1400} y={330} />
            <text x={PX0} y={885} fontSize={28} fontWeight={700} fill="#334155">
                Skisse: bare tallene som er skrevet, er ekte
            </text>
            <text x={1400} y={450} textAnchor="middle" fontSize={30} fontWeight={700} fill={MORK}>
                Pris per fat olje
            </text>
            {beat >= 1 && (
                <>
                    <motion.path
                        d={linje}
                        stroke={OLJE}
                        strokeWidth={10}
                        fill="none"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.4, ease: 'easeInOut' }}
                    />
                    <Inn forsinkelse={0.2}>
                        <rect x={PX0 + 30} y={py(110) - 100} width={330} height={64} rx={16} fill="#ffffff" stroke={OLJE} strokeWidth={3} />
                        <text x={PX0 + 195} y={py(110) - 56} textAnchor="middle" fontSize={30} fontWeight={800} fill={MORK}>
                            godt over 100 $
                        </text>
                    </Inn>
                    <Inn forsinkelse={2.2}>
                        <rect x={PX1 - 300} y={py(34) + 24} width={260} height={64} rx={16} fill="#ffffff" stroke={ROD} strokeWidth={3} />
                        <text x={PX1 - 170} y={py(34) + 68} textAnchor="middle" fontSize={30} fontWeight={800} fill={ROD}>
                            under 40 $
                        </text>
                    </Inn>
                </>
            )}
            {beat >= 2 && (
                <Inn forsinkelse={0.3}>
                    <rect x={1250} y={540} width={300} height={170} rx={20} fill="#ffffff" stroke={ROD} strokeWidth={5} />
                    <text x={1400} y={605} textAnchor="middle" fontSize={34} fontWeight={900} fill={ROD}>
                        Ledigheten ↑
                    </text>
                    <text x={1400} y={650} textAnchor="middle" fontSize={26} fontWeight={700} fill={MORK}>
                        i noen deler
                    </text>
                    <text x={1400} y={684} textAnchor="middle" fontSize={26} fontWeight={700} fill={MORK}>
                        av landet
                    </text>
                </Inn>
            )}
        </g>
    );
}

/* ---------- kart ---------- */

const UTSNITT: [LngLat, LngLat] = [
    [-0.5, 56.6],
    [12.5, 62.3],
];

/** Rogaland, grovt tegnet. */
const ROGALAND: LngLat[] = [
    [5.05, 59.3],
    [5.2, 59.75],
    [5.9, 59.87],
    [6.5, 59.72],
    [7.05, 59.5],
    [7.2, 59.1],
    [6.85, 58.75],
    [6.6, 58.45],
    [6.15, 58.33],
    [5.65, 58.55],
    [5.5, 58.85],
    [5.3, 59.05],
];
const STAVANGER: LngLat = [5.73, 58.97];
const PLATTFORMER: LngLat[] = [
    [2.3, 58.5],
    [2.9, 59.6],
    [2.1, 60.6],
    [3.2, 57.2],
];

function Plattform({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <line x1={-16} y1={20} x2={-10} y2={-6} stroke="#334155" strokeWidth={4} />
            <line x1={16} y1={20} x2={10} y2={-6} stroke="#334155" strokeWidth={4} />
            <rect x={-20} y={-16} width={40} height={12} fill="#f59e0b" />
            <line x1={8} y1={-16} x2={8} y2={-42} stroke="#334155" strokeWidth={4} />
        </g>
    );
}

function Kart({ beat }: { beat: number }) {
    const { geographies } = useFilmVerden([UTSNITT[0], UTSNITT[1]]);
    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [0, 0],
                    [1600, 900],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LngLat) => proj(ll) as [number, number];
    const rogaland = `M ${ROGALAND.map((ll) => p(ll).join(' ')).join(' L ')} Z`;
    const [sx, sy] = p(STAVANGER);
    return (
        <g>
            <rect x={0} y={0} width={1600} height={900} fill="#bcd4e4" />
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill={String(g.id) === '578' ? '#f1efe6' : '#dcd8cb'}
                    stroke="#9ca3af"
                    strokeWidth={1.2}
                />
            ))}
            <motion.path
                d={rogaland}
                fill={ROD}
                stroke="#991b1b"
                strokeWidth={3}
                initial={{ fillOpacity: 0 }}
                animate={{ fillOpacity: 0.45 }}
                transition={{ duration: 1 }}
            />
            {PLATTFORMER.map((ll, i) => {
                const [x, y] = p(ll);
                return <Plattform key={i} x={x} y={y} />;
            })}
            {(() => {
                const [x, y] = p([0.9, 59.1]);
                return (
                    <text x={x} y={y} textAnchor="middle" fontSize={34} fontWeight={700} fill="#1e3a5f" fontStyle="italic">
                        Nordsjøen
                    </text>
                );
            })()}
            <circle cx={sx} cy={sy} r={9} fill={MORK} />
            <rect x={sx + 70} y={sy - 60} width={250} height={70} rx={16} fill="#ffffff" stroke="#991b1b" strokeWidth={4} />
            <text x={sx + 195} y={sy - 13} textAnchor="middle" fontSize={40} fontWeight={900} fill="#991b1b">
                Rogaland
            </text>
            <AnimatePresence>
                {beat >= 1 && (
                    <Inn key="ledig" forsinkelse={0.2}>
                        <rect x={1080} y={430} width={470} height={150} rx={22} fill="#ffffff" stroke={ROD} strokeWidth={5} />
                        <text x={1315} y={490} textAnchor="middle" fontSize={30} fontWeight={700} fill={MORK}>
                            Ledigheten, topp i 2016
                        </text>
                        <text x={1315} y={555} textAnchor="middle" fontSize={56} fontWeight={900} fill={ROD}>
                            4,5 %
                        </text>
                    </Inn>
                )}
                {beat >= 2 && (
                    <Inn key="jobb" forsinkelse={0.2}>
                        <rect x={1080} y={610} width={470} height={230} rx={22} fill="#ffffff" stroke={JOBB} strokeWidth={5} />
                        <text x={1315} y={665} textAnchor="middle" fontSize={30} fontWeight={700} fill={MORK}>
                            Andelen som har jobb
                        </text>
                        <text x={1200} y={760} textAnchor="middle" fontSize={56} fontWeight={900} fill={JOBB}>
                            71 %
                        </text>
                        <text x={1315} y={758} textAnchor="middle" fontSize={50} fontWeight={900} fill={GRA}>
                            →
                        </text>
                        <text x={1430} y={760} textAnchor="middle" fontSize={56} fontWeight={900} fill={ROD}>
                            67 %
                        </text>
                        <text x={1315} y={815} textAnchor="middle" fontSize={24} fontWeight={600} fill={GRA}>
                            om lag
                        </text>
                    </Inn>
                )}
            </AnimatePresence>
        </g>
    );
}

/* ---------- gapet ---------- */

const GX0 = 200;
const GX1 = 1150;
/** År til x, fra midten av 2014 til slutten av 2019. */
const gx = (aar: number) => GX0 + ((aar - 2014.5) / 5.5) * (GX1 - GX0);
/** Andel i jobb (øvre panel, 64-73 %) og ledighet (nedre panel, skisse). */
const jy = (pst: number) => 470 - ((pst - 64) / 9) * 270;
const LY0 = 800;
const ly = (k: number) => LY0 - k * 190;

function Gapet({ beat }: { beat: number }) {
    const ledig = `M ${gx(2014.5)} ${ly(0.3)} C ${gx(2015.3)} ${ly(0.35)} ${gx(2015.8)} ${ly(0.95)} ${gx(2016.4)} ${ly(1)} C ${gx(2017.2)} ${ly(1)} ${gx(2018.4)} ${ly(0.4)} ${gx(2019.9)} ${ly(0.3)}`;
    const jobb = `M ${gx(2014.5)} ${jy(71)} C ${gx(2015.3)} ${jy(70.6)} ${gx(2015.9)} ${jy(67.4)} ${gx(2016.6)} ${jy(67)} C ${gx(2017.5)} ${jy(66.8)} ${gx(2018.7)} ${jy(67.4)} ${gx(2019.9)} ${jy(67.6)}`;
    return (
        <g>
            {/* Øvre panel: andel i jobb */}
            <text x={GX0} y={180} fontSize={32} fontWeight={800} fill={JOBB}>
                Andel av befolkningen som har jobb
            </text>
            <line x1={GX0} y1={470} x2={GX1} y2={470} stroke={GRA} strokeWidth={3} />
            {/* Nedre panel: ledighet */}
            <text x={GX0} y={530} fontSize={32} fontWeight={800} fill={ROD}>
                Arbeidsledighet
            </text>
            <line x1={GX0} y1={LY0} x2={GX1} y2={LY0} stroke={GRA} strokeWidth={3} />
            {[2015, 2016, 2017, 2018, 2019].map((a) => (
                <text key={a} x={gx(a)} y={LY0 + 42} textAnchor="middle" fontSize={26} fontWeight={700} fill={GRA}>
                    {a}
                </text>
            ))}

            <line x1={gx(2014.5)} y1={ly(0.3)} x2={GX1} y2={ly(0.3)} stroke="#fca5a5" strokeWidth={3} strokeDasharray="10 8" />
            <motion.path
                d={ledig}
                stroke={ROD}
                strokeWidth={8}
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.2 }}
            />
            <text x={gx(2016.4)} y={ly(1) - 18} textAnchor="middle" fontSize={30} fontWeight={900} fill={ROD}>
                4,5 % i 2016
            </text>
            <Inn forsinkelse={1.8}>
                <text x={GX1 + 20} y={ly(0.3) + 10} fontSize={26} fontWeight={800} fill={ROD}>
                    tilbake som før
                </text>
            </Inn>

            {beat >= 1 && (
                <>
                    <line x1={gx(2014.5)} y1={jy(71)} x2={GX1} y2={jy(71)} stroke="#5eead4" strokeWidth={3} strokeDasharray="10 8" />
                    <motion.path
                        d={jobb}
                        stroke={JOBB}
                        strokeWidth={8}
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.2 }}
                    />
                    <text x={gx(2014.5) + 10} y={jy(71) - 16} fontSize={28} fontWeight={900} fill={JOBB}>
                        71 %
                    </text>
                    <text x={gx(2016.6)} y={jy(67) + 44} textAnchor="middle" fontSize={28} fontWeight={900} fill={JOBB}>
                        67 %
                    </text>
                    <Inn forsinkelse={1.8}>
                        <rect x={GX1 - 6} y={jy(71)} width={12} height={jy(67.6) - jy(71)} fill="#f59e0b" />
                        <text x={GX1 + 20} y={jy(69.3) + 10} fontSize={26} fontWeight={800} fill="#b45309">
                            ikke tilbake på 71 %
                        </text>
                    </Inn>
                </>
            )}
            {beat >= 2 && (
                <Inn forsinkelse={0.3}>
                    {[0, 1, 2].map((i) => (
                        <g key={i} transform={`translate(${1390 + i * 60} 330)`}>
                            <circle cx={0} cy={-58} r={18} fill="#e8b48c" />
                            <rect x={-20} y={-38} width={40} height={64} rx={16} fill="#94a3b8" />
                        </g>
                    ))}
                    <text x={1450} y={400} textAnchor="middle" fontSize={30} fontWeight={800} fill={MORK}>
                        Sluttet å lete
                    </text>
                </Inn>
            )}
            {beat >= 3 && (
                <Inn forsinkelse={0.3}>
                    <rect x={1290} y={440} width={300} height={170} rx={20} fill="#ffffff" stroke="#b45309" strokeWidth={4} />
                    <text x={1440} y={500} textAnchor="middle" fontSize={28} fontWeight={800} fill={MORK}>
                        Ikke ledige
                    </text>
                    <text x={1440} y={540} textAnchor="middle" fontSize={28} fontWeight={800} fill={MORK}>
                        men heller
                    </text>
                    <text x={1440} y={580} textAnchor="middle" fontSize={28} fontWeight={800} fill={MORK}>
                        ikke i jobb
                    </text>
                </Inn>
            )}
            <text x={GX0} y={885} fontSize={28} fontWeight={700} fill="#334155">
                Skisse fra Rogaland: bare tallene som er skrevet, er ekte
            </text>
        </g>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    pris: ['Oljeprisen', 'Oljeprisen stuper', 'Folk mister jobben'],
    kart: ['Rogaland', 'Ledigheten stiger', 'Færre har jobb'],
    gapet: ['Ledigheten kom tilbake ned', 'Men ikke andelen i jobb', 'Hvordan henger det sammen?', 'Ute av tellingen'],
};

export function ArbeidsledighetOlje({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'pris';
    const linjer = OVERSKRIFT[modus];
    const tittel = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full bg-slate-50">
            {modus === 'pris' && <Pris beat={beat} />}
            {modus === 'kart' && <Kart beat={beat} />}
            {modus === 'gapet' && <Gapet beat={beat} />}
            <Tittel tekst={tittel} />
        </svg>
    );
}
