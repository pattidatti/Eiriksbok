import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Verdenskartet. «dalio»: New York, Bridgewater og de tre rikene Dalio studerte mest,
 * med stafetten mellom dem. «dollar»: reservevalutaen som strømmer fra USA ut i verden.
 * «orden»: indre og ytre orden, og verden delt i to leirer i 1945.
 */

type Modus = 'dalio' | 'dollar' | 'orden' | 'idag';

const B = 1600;
const H = 900;

const NEDERLAND = 528;
const STORBRITANNIA = 826;
const USA = 840;
/** De femten sovjetrepublikkene, med ISO-numrene til landene som finnes i dag. */
const SOVJET = [643, 804, 112, 498, 233, 428, 440, 268, 51, 31, 398, 860, 795, 417, 762];

const NEW_YORK: [number, number] = [-74, 40.7];
const AMSTERDAM: [number, number] = [4.9, 52.4];
const LONDON: [number, number] = [-0.1, 51.5];

/** Steder dollaren går til (bare punkter, ingen navn). */
const MAL: [number, number][] = [
    [-0.1, 51.5],
    [13.4, 52.5],
    [139.7, 35.7],
    [-46.6, -23.5],
    [3.4, 6.5],
    [72.8, 19],
    [151.2, -33.9],
    [116.4, 39.9],
    [31.2, 30],
    [-99.1, 19.4],
    [28, -26.2],
    [55.3, 25.3],
];

const OVERSKRIFT: Record<Modus, string[]> = {
    dalio: ['Ray Dalio', 'New York, 1975', 'Tre riker under lupen', 'Samme mønster'],
    dollar: ['Én felles betalingsapp', 'Eieren lager reglene', 'Reservevaluta: dollaren', 'Penger er tillit'],
    orden: ['Indre orden', 'Ytre orden', 'Etter andre verdenskrig', 'Verden delt i to, 1945'],
    idag: ['Hvor er vi i dag?', 'Splittelser og gjeld', 'Makten flytter seg sakte'],
};

function farge(modus: Modus, beat: number, id: number): string | null {
    if (modus === 'dalio') {
        if (beat <= 1) return id === USA ? '#93c5fd' : null;
        if (id === NEDERLAND) return '#f97316';
        if (id === STORBRITANNIA) return '#dc2626';
        if (id === USA) return '#2563eb';
        return null;
    }
    if (modus === 'dollar') return id === USA ? '#16a34a' : null;
    if (modus === 'idag') return id === USA ? (beat === 0 ? '#2563eb' : '#93c5fd') : null;
    if (beat === 0) return id === USA ? '#2563eb' : null;
    if (beat === 3) {
        if (id === USA) return '#2563eb';
        if (SOVJET.includes(id)) return '#dc2626';
    }
    return null;
}

function Kort({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="absolute rounded-3xl bg-white/95 shadow-2xl px-6 py-5"
            style={{ right: '3%', bottom: '8%', width: '31%' }}
        >
            {children}
        </motion.div>
    );
}

function Telefon() {
    return (
        <svg viewBox="0 0 120 200" style={{ width: 90, height: 150 }}>
            <rect x={6} y={4} width={108} height={192} rx={18} fill="#0f172a" />
            <rect x={14} y={22} width={92} height={150} rx={6} fill="#dcfce7" />
            <text x={60} y={115} textAnchor="middle" fontSize={64} fontWeight={900} fill="#166534">
                $
            </text>
        </svg>
    );
}

function KortInnhold({ modus, beat }: { modus: Modus; beat: number }) {
    if (modus === 'dalio') {
        if (beat === 0)
            return (
                <Kort key="d0">
                    <div className="text-4xl font-black text-slate-900">Ray Dalio</div>
                    <div className="text-2xl font-bold text-slate-600 mt-2">fondsforvalter: investerer penger for andre</div>
                </Kort>
            );
        if (beat === 1)
            return (
                <Kort key="d1">
                    <div className="text-5xl font-black text-slate-900">1975</div>
                    <div className="text-2xl font-bold text-slate-600 mt-2">Bridgewater starter i en toroms leilighet</div>
                </Kort>
            );
        return null;
    }
    if (modus === 'dollar') {
        if (beat <= 1)
            return (
                <Kort key={`p${beat}`}>
                    <div className="flex items-center gap-5">
                        <Telefon />
                        <div className="text-2xl font-bold text-slate-800">
                            {beat === 0 ? 'Alle land betaler med samme app' : 'Eieren kan lage mer av sine egne penger'}
                        </div>
                    </div>
                </Kort>
            );
        return (
            <Kort key={`r${beat}`}>
                <div className="text-3xl font-black text-green-800">{beat === 2 ? 'Reservevaluta' : 'Tillit'}</div>
                <div className="text-2xl font-bold text-slate-700 mt-2">
                    {beat === 2 ? 'pengene landene handler med hverandre i' : 'hele verden stoler på dollaren'}
                </div>
            </Kort>
        );
    }
    if (modus === 'idag')
        return (
            <Kort key={`i${beat}`}>
                {beat === 0 && (
                    <>
                        <div className="text-5xl font-black text-slate-900">Fase 5 eller 6?</div>
                        <div className="text-2xl font-bold text-slate-600 mt-2">det mener mange eksperter</div>
                    </>
                )}
                {beat === 1 && (
                    <>
                        <div className="text-3xl font-black text-blue-800">USA</div>
                        <div className="text-2xl font-bold text-slate-700 mt-1">dype splittelser</div>
                        <div className="text-2xl font-bold text-red-700 mt-1">høy gjeld</div>
                        <div className="text-2xl font-bold text-slate-500 mt-3">en ny utfordrer stiger raskt</div>
                    </>
                )}
                {beat >= 2 && (
                    <>
                        <div className="text-3xl font-black text-slate-900">Ingen kollaps over natta</div>
                        <div className="text-2xl font-bold text-slate-600 mt-2">makten flytter seg gradvis</div>
                    </>
                )}
            </Kort>
        );
    if (beat === 0)
        return (
            <Kort key="o0">
                <div className="text-3xl font-black text-blue-800">Indre orden</div>
                <div className="text-2xl font-bold text-slate-700 mt-1">reglene inne i et land, som grunnloven</div>
                <div className="text-xl font-semibold text-slate-500 mt-3">endres oftest av borgerkrig eller revolusjon</div>
            </Kort>
        );
    if (beat <= 2)
        return (
            <Kort key="o1">
                <div className="text-3xl font-black text-amber-700">Ytre orden</div>
                <div className="text-2xl font-bold text-slate-700 mt-1">avtaler mellom land om handel, grenser og allianser</div>
                <div className="text-xl font-semibold text-slate-500 mt-3">endres oftest av krig mellom land</div>
            </Kort>
        );
    return (
        <Kort key="o3">
            <div className="flex items-center gap-3 text-2xl font-bold text-slate-800">
                <span className="inline-block rounded" style={{ width: 28, height: 28, background: '#2563eb' }} />
                demokratiske kapitalister
            </div>
            <div className="flex items-center gap-3 text-2xl font-bold text-slate-800 mt-3">
                <span className="inline-block rounded" style={{ width: 28, height: 28, background: '#dc2626' }} />
                autoritære kommunister
            </div>
        </Kort>
    );
}

export function StoreSykluserKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'dalio';
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(() => {
        const p = geoNaturalEarth1();
        if (modus === 'dalio') {
            return p.fitExtent(
                [
                    [40, 60],
                    [1060, H - 40],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [-125, 22],
                        [30, 62],
                    ],
                } as never
            );
        }
        return p.fitExtent(
            [
                [20, 40],
                [1100, H - 20],
            ],
            { type: 'Sphere' } as never
        );
    }, [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const xy = (ll: [number, number]) => projeksjon(ll) as [number, number];
    const ny = xy(NEW_YORK);

    const piler: [number, number][][] =
        modus === 'dalio' && beat >= 3
            ? [
                  [xy(AMSTERDAM), xy(LONDON)],
                  [xy(LONDON), ny],
              ]
            : [];

    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];

    return (
        <div className="absolute inset-0" style={{ background: '#cfe8f7' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {geographies.map((g, i) => {
                    const f = farge(modus, beat, Number(g.id));
                    return (
                        <motion.path
                            key={`${g.id ?? 'x'}-${i}`}
                            d={sti(g as never) ?? undefined}
                            initial={false}
                            animate={{ fill: f ?? '#f1ede4' }}
                            transition={{ duration: 0.9 }}
                            stroke="#a8a29e"
                            strokeWidth={1}
                        />
                    );
                })}

                {modus === 'dalio' && beat <= 1 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <circle cx={ny[0]} cy={ny[1]} r={16} fill="#fff" stroke="#1d4ed8" strokeWidth={7} />
                        <text x={ny[0] + 26} y={ny[1] + 12} fontSize={40} fontWeight={900} fill="#0f172a" stroke="#fff" strokeWidth={8} paintOrder="stroke">
                            New York
                        </text>
                    </motion.g>
                )}
                {modus === 'dalio' &&
                    beat >= 2 &&
                    [
                        { ll: AMSTERDAM, navn: 'Nederland', dx: 30, dy: -30, farge: '#c2410c' },
                        { ll: LONDON, navn: 'Storbritannia', dx: -40, dy: -60, farge: '#b91c1c' },
                        { ll: [-98, 39] as [number, number], navn: 'USA', dx: 0, dy: 0, farge: '#1e3a8a' },
                    ].map((n, i) => {
                        const [x, y] = xy(n.ll);
                        return (
                            <motion.text
                                key={n.navn}
                                x={x + n.dx}
                                y={y + n.dy}
                                textAnchor={n.dx > 0 ? 'start' : n.dx < 0 ? 'end' : 'middle'}
                                fontSize={42}
                                fontWeight={900}
                                fill={n.farge}
                                stroke="#fff"
                                strokeWidth={8}
                                paintOrder="stroke"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 + i * 0.8 }}
                            >
                                {n.navn}
                            </motion.text>
                        );
                    })}
                {piler.map(([a, b], i) => {
                    const mx = (a[0] + b[0]) / 2;
                    const my = Math.min(a[1], b[1]) - 120 - i * 40;
                    // Pilspissen peker langs tangenten i enden av kurven (fra kontrollpunktet mot b).
                    const vinkel = Math.atan2(b[1] - my, b[0] - mx);
                    const spiss = [0, 0.6, -0.6].map((d, k) => {
                        const r = k === 0 ? 0 : 30;
                        const w = vinkel + Math.PI + d;
                        return `${b[0] + Math.cos(w) * r},${b[1] + Math.sin(w) * r}`;
                    });
                    return (
                        <g key={i}>
                            <motion.path
                                d={`M ${a[0]} ${a[1]} Q ${mx} ${my} ${b[0]} ${b[1]}`}
                                fill="none"
                                stroke="#ca8a04"
                                strokeWidth={9}
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.6, delay: 0.4 + i * 1.8 }}
                            />
                            <motion.polygon
                                points={spiss.join(' ')}
                                fill="#ca8a04"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2 + i * 1.8 }}
                            />
                        </g>
                    );
                })}

                {modus === 'dollar' &&
                    beat >= 1 &&
                    MAL.map((m, i) => {
                        const [x, y] = xy(m);
                        const mx = (ny[0] + x) / 2;
                        const my = Math.min(ny[1], y) - 90;
                        return (
                            <g key={i}>
                                <motion.path
                                    d={`M ${ny[0]} ${ny[1]} Q ${mx} ${my} ${x} ${y}`}
                                    fill="none"
                                    stroke="#16a34a"
                                    strokeWidth={beat >= 3 ? 6 : 4}
                                    strokeOpacity={beat >= 3 ? 0.95 : 0.7}
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: beat >= 2 ? 1 : i < 3 ? 1 : 0 }}
                                    transition={{ duration: 1.4, delay: 0.3 + i * 0.18 }}
                                />
                                {beat >= 2 && (
                                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 + i * 0.18 }}>
                                        <circle cx={x} cy={y} r={20} fill="#dcfce7" stroke="#166534" strokeWidth={4} />
                                        <text x={x} y={y + 10} textAnchor="middle" fontSize={28} fontWeight={900} fill="#166534">
                                            $
                                        </text>
                                    </motion.g>
                                )}
                            </g>
                        );
                    })}

                {modus === 'orden' && (beat === 1 || beat === 2) &&
                    [
                        [
                            [-77, 39],
                            [2.3, 48.9],
                        ],
                        [
                            [2.3, 48.9],
                            [37.6, 55.8],
                        ],
                        [
                            [37.6, 55.8],
                            [116.4, 39.9],
                        ],
                        [
                            [-77, 39],
                            [139.7, 35.7],
                        ],
                        [
                            [2.3, 48.9],
                            [31.2, 30],
                        ],
                    ].map(([a, b], i) => {
                        const pa = xy(a as [number, number]);
                        const pb = xy(b as [number, number]);
                        return (
                            <motion.line
                                key={i}
                                x1={pa[0]}
                                y1={pa[1]}
                                x2={pb[0]}
                                y2={pb[1]}
                                stroke="#b45309"
                                strokeWidth={6}
                                strokeDasharray="14 10"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: beat === 1 ? 1 : 0.35 }}
                                transition={{ delay: 0.4 + i * 0.4 }}
                            />
                        );
                    })}
                {modus === 'orden' && beat === 2 && (
                    <motion.text
                        x={560}
                        y={500}
                        textAnchor="middle"
                        fontSize={200}
                        fontWeight={900}
                        fill="#0f172a"
                        stroke="#fff"
                        strokeWidth={14}
                        paintOrder="stroke"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        1945
                    </motion.text>
                )}
            </svg>
            <AnimatePresence mode="wait">
                <KortInnhold key={`${modus}-${beat}`} modus={modus} beat={beat} />
            </AnimatePresence>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
