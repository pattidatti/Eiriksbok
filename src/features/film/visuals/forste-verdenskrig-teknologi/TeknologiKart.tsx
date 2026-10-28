import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart over krigen i fire moduser:
 * - paris: Vestfronten, kanonene bak tyske linjer og buen fra Paris-kanonen til Paris.
 * - ypres: gassangrepet ved Ypres i 1915. Vinden bærer skyen over de allierte linjene.
 * - london: Zeppelinere over Nordsjøen mot London.
 * - ubat: ubåtene vest for Storbritannia, og konvoiene som svaret.
 */

type Modus = 'paris' | 'ypres' | 'london' | 'ubat';
type LngLat = [number, number];

const B = 1600;
const H = 900;

const UTSNITT: Record<Modus, Utsnitt | undefined> = {
    paris: [
        [-0.6, 47.6],
        [7.6, 51.7],
    ],
    ypres: [
        [1.6, 50.35],
        [4.4, 51.35],
    ],
    london: [
        [-5.5, 49.6],
        [11.5, 56.4],
    ],
    ubat: undefined,
};

/** Rammen kartet tilpasses, når den er en annen enn utsnittet. */
const RAMME: Record<Modus, Utsnitt> = {
    paris: UTSNITT.paris!,
    ypres: UTSNITT.ypres!,
    london: UTSNITT.london!,
    ubat: [
        [-24, 45],
        [12, 60],
    ],
};

/** Vestfronten, omtrent, fra kysten til Sveits. */
const FRONT: LngLat[] = [
    [2.72, 51.15],
    [2.88, 50.85],
    [2.85, 50.55],
    [2.78, 50.29],
    [2.75, 50.02],
    [2.95, 49.62],
    [3.35, 49.4],
    [4.0, 49.27],
    [4.8, 49.2],
    [5.38, 49.18],
    [5.55, 48.92],
    [6.05, 48.9],
    [6.6, 48.6],
    [7.0, 48.25],
    [7.05, 47.85],
];

const PARIS: LngLat = [2.35, 48.86];
const PARISKANON: LngLat = [3.5, 49.58];
const YPRES: LngLat = [2.885, 50.85];
const LONDON: LngLat = [-0.12, 51.5];
const LUFTSKIPHAVN: LngLat = [8.4, 53.6];

/** Kanoner bak den tyske linja (ikoner, ikke et antall). */
const KANONER: LngLat[] = [
    [3.55, 50.55],
    [3.4, 50.05],
    [4.1, 49.6],
    [5.0, 49.5],
    [6.0, 49.2],
];

const TEKST: Record<Modus, string[]> = {
    paris: ['Kanonene vokser', 'Tykke Bertha', 'Paris-kanonen', 'Langt fra fronten'],
    ypres: ['Stillstand ved fronten', 'Ypres, april 1915', 'Klorgass', 'Nye gasser'],
    london: ['Luftskip: Zeppelinere', 'Mot London', 'Krigen kommer hjem'],
    ubat: ['Den britiske marinen', 'Ubåtene angriper', '1917: lite mat', 'Svaret: konvoier'],
};

export function TeknologiKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus: Modus = props?.modus ?? 'paris';
    const { geographies } = useFilmVerden(UTSNITT[modus]);
    const ramme = RAMME[modus];
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [30, 30],
                    [B - 30, H - 30],
                ],
                { type: 'MultiPoint', coordinates: [ramme[0], ramme[1]] } as never
            ),
        [ramme]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const linje = (pts: LngLat[]) => 'M ' + pts.map((q) => p(q).join(' ')).join(' L ');
    const tekster = TEKST[modus];
    const tittel = tekster[Math.min(beat, tekster.length - 1)];

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#cfe2ef' }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <marker id="tk-pil" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f172a" />
                    </marker>
                    <radialGradient id="tk-gass">
                        <stop offset="0%" stopColor="#d9f99d" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#a3e635" stopOpacity={0} />
                    </radialGradient>
                    <radialGradient id="tk-sennep">
                        <stop offset="0%" stopColor="#facc15" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#ca8a04" stopOpacity={0} />
                    </radialGradient>
                </defs>
                <Land geographies={geographies} sti={sti} />
                {modus === 'paris' && <ParisLag beat={beat} p={p} linje={linje} />}
                {modus === 'ypres' && <YpresLag beat={beat} p={p} linje={linje} />}
                {modus === 'london' && <LondonLag beat={beat} p={p} />}
                {modus === 'ubat' && <UbatLag beat={beat} p={p} />}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tittel}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-black text-3xl shadow-xl whitespace-nowrap"
                    style={{ top: '4%', left: '3%' }}
                >
                    {tittel}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

type P = (ll: LngLat) => [number, number];

function Merke({
    x,
    y,
    tekst,
    anker = 'middle',
    farge = '#0f172a',
    str = 34,
}: {
    x: number;
    y: number;
    tekst: string;
    anker?: 'start' | 'middle' | 'end';
    farge?: string;
    str?: number;
}) {
    return (
        <text x={x} y={y} textAnchor={anker} fontSize={str} fontWeight={900} fill={farge} stroke="#ffffff" strokeWidth={7} paintOrder="stroke">
            {tekst}
        </text>
    );
}

function Landnavn({ p, navn }: { p: P; navn: { t: string; ll: LngLat; str?: number }[] }) {
    return (
        <>
            {navn.map((l) => {
                const [x, y] = p(l.ll);
                return (
                    <text key={l.t} x={x} y={y} textAnchor="middle" fontSize={l.str ?? 36} fontWeight={900} letterSpacing={4} fill="#64748b" opacity={0.85}>
                        {l.t}
                    </text>
                );
            })}
        </>
    );
}

function Front({ d, tykk = 11 }: { d: string; tykk?: number }) {
    return (
        <motion.path
            d={d}
            fill="none"
            stroke="#7c2d12"
            strokeWidth={tykk}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
        />
    );
}

function Kanon({ x, y, s }: { x: number; y: number; s: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-26} y={-8} width={62} height={14} rx={6} fill="#1f2937" transform="rotate(-25)" />
            <circle cx={-10} cy={10} r={12} fill="#374151" />
            <circle cx={14} cy={10} r={12} fill="#374151" />
        </g>
    );
}

function ParisLag({ beat, p, linje }: { beat: number; p: P; linje: (pts: LngLat[]) => string }) {
    const paris = p(PARIS);
    const kanon = p(PARISKANON);
    const midt: [number, number] = [(paris[0] + kanon[0]) / 2 - 60, Math.min(paris[1], kanon[1]) - 220];
    return (
        <>
            <Landnavn
                p={p}
                navn={[
                    { t: 'FRANKRIKE', ll: [0.9, 48.3] },
                    { t: 'TYSKLAND', ll: [7.0, 50.7] },
                    { t: 'BELGIA', ll: [4.6, 50.8], str: 30 },
                ]}
            />
            <Front d={linje(FRONT)} />
            {KANONER.map((k, i) => {
                const [x, y] = p(k);
                return (
                    <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: beat >= 2 ? 0.4 : 1 }} transition={{ delay: 0.4 + i * 0.2 }}>
                        <Kanon x={x} y={y} s={beat === 0 ? 1.6 : 1.2} />
                    </motion.g>
                );
            })}
            <AnimatePresence>
                {beat === 1 && (
                    <motion.g key="bertha" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Kanon x={p([4.4, 50.1])[0]} y={p([4.4, 50.1])[1]} s={3} />
                        <Merke x={p([4.4, 50.1])[0] + 70} y={p([4.4, 50.1])[1] + 90} tekst="tunge granater mot festninger" anker="start" />
                    </motion.g>
                )}
            </AnimatePresence>
            <circle cx={paris[0]} cy={paris[1]} r={14} fill="#1d4ed8" stroke="#fff" strokeWidth={4} />
            <Merke x={paris[0] - 24} y={paris[1] + 12} tekst="Paris" anker="end" farge="#1d4ed8" str={40} />
            {beat >= 2 && (
                <>
                    <Kanon x={kanon[0]} y={kanon[1]} s={2} />
                    <motion.path
                        d={`M ${kanon[0]} ${kanon[1]} Q ${midt[0]} ${midt[1]} ${paris[0]} ${paris[1]}`}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth={8}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.2, delay: 0.4 }}
                    />
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
                        <Merke x={midt[0]} y={midt[1] + 70} tekst="over 100 km" farge="#b91c1c" str={44} />
                    </motion.g>
                </>
            )}
            {beat >= 3 && <Merke x={paris[0] - 30} y={paris[1] - 50} anker="end" tekst="langt fra fronten" farge="#b91c1c" />}
            {beat >= 3 &&
                [0, 1, 2].map((i) => (
                    <motion.circle
                        key={i}
                        cx={paris[0]}
                        cy={paris[1]}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth={5}
                        initial={{ r: 14, opacity: 0.9 }}
                        animate={{ r: 90, opacity: 0 }}
                        transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.7 }}
                    />
                ))}
        </>
    );
}

function YpresLag({ beat, p, linje }: { beat: number; p: P; linje: (pts: LngLat[]) => string }) {
    const ypres = p(YPRES);
    const skyer = useMemo(
        () =>
            Array.from({ length: 9 }, (_, i) => ({
                ll: [3.15 + (i % 3) * 0.08, 50.62 + i * 0.05] as LngLat,
                r: 70 + (i % 4) * 22,
            })),
        []
    );
    const sennep = beat >= 3;
    return (
        <>
            <Landnavn
                p={p}
                navn={[
                    { t: 'BELGIA', ll: [3.7, 51.05] },
                    { t: 'FRANKRIKE', ll: [2.4, 50.45] },
                ]}
            />
            <Front d={linje(FRONT)} tykk={16} />
            <Merke x={p([2.25, 50.7])[0]} y={p([2.25, 50.7])[1]} tekst="de allierte" farge="#1d4ed8" />
            <Merke x={p([3.75, 50.75])[0]} y={p([3.75, 50.75])[1]} tekst="tyskerne" farge="#334155" />
            {beat >= 2 &&
                skyer.map((s, i) => {
                    const [x, y] = p(s.ll);
                    return (
                        <motion.circle
                            key={i}
                            cy={y}
                            r={s.r}
                            fill={sennep ? 'url(#tk-sennep)' : 'url(#tk-gass)'}
                            initial={{ cx: x, opacity: 0 }}
                            animate={{ cx: x - 300, opacity: 0.95 }}
                            transition={{ duration: 7, delay: i * 0.2, ease: 'easeOut' }}
                        />
                    );
                })}
            {beat >= 1 && (
                <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} style={{ originX: `${ypres[0]}px`, originY: `${ypres[1]}px` }}>
                    <circle cx={ypres[0]} cy={ypres[1]} r={16} fill="#0f172a" stroke="#fff" strokeWidth={5} />
                    <Merke x={ypres[0] - 28} y={ypres[1] - 22} tekst="Ypres" anker="end" str={44} />
                </motion.g>
            )}
            {beat === 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    <path d={`M ${p([3.9, 50.48])[0]} ${p([3.9, 50.48])[1]} L ${p([3.25, 50.48])[0]} ${p([3.25, 50.48])[1]}`} stroke="#0f172a" strokeWidth={12} markerEnd="url(#tk-pil)" />
                    <Merke x={p([3.6, 50.48])[0]} y={p([3.6, 50.48])[1] + 60} tekst="vinden" />
                </motion.g>
            )}
            {sennep && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                    <rect x={980} y={640} width={560} height={200} rx={20} fill="#ffffff" stroke="#ca8a04" strokeWidth={5} />
                    <text x={1260} y={700} textAnchor="middle" fontSize={40} fontWeight={900} fill="#854d0e">
                        Sennepsgass
                    </text>
                    <text x={1260} y={750} textAnchor="middle" fontSize={32} fontWeight={800} fill="#334155">
                        lungene · brannsår på huden
                    </text>
                    <text x={1260} y={800} textAnchor="middle" fontSize={32} fontWeight={800} fill="#334155">
                        kunne gjøre blind
                    </text>
                </motion.g>
            )}
        </>
    );
}

function LondonLag({ beat, p }: { beat: number; p: P }) {
    const london = p(LONDON);
    const havn = p(LUFTSKIPHAVN);
    const midt: [number, number] = [(london[0] + havn[0]) / 2, (london[1] + havn[1]) / 2 - 120];
    const d = `M ${havn[0]} ${havn[1]} Q ${midt[0]} ${midt[1]} ${london[0]} ${london[1]}`;
    // Luftskipet står der det er kommet på kurven for denne beaten.
    const t = beat === 0 ? 0.08 : beat === 1 ? 0.92 : 0.98;
    const bez = (a: number, b: number, c: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
    const lx = bez(havn[0], midt[0], london[0]);
    const ly = bez(havn[1], midt[1], london[1]);
    return (
        <>
            <Landnavn
                p={p}
                navn={[
                    { t: 'STORBRITANNIA', ll: [-2.6, 53.2], str: 34 },
                    { t: 'TYSKLAND', ll: [10.2, 51.3] },
                    { t: 'FRANKRIKE', ll: [1.2, 49.9] },
                ]}
            />
            <text x={p([3.6, 54.9])[0]} y={p([3.6, 54.9])[1]} textAnchor="middle" fontSize={36} fontStyle="italic" fontWeight={700} fill="#1e3a5f">
                Nordsjøen
            </text>
            <motion.path
                d={d}
                fill="none"
                stroke="#334155"
                strokeWidth={6}
                strokeDasharray="4 14"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 1 ? 0.8 : 0 }}
                transition={{ duration: 1 }}
            />
            <motion.g initial={false} animate={{ x: lx, y: ly }} transition={{ duration: beat === 1 ? 7 : 1.5, ease: 'easeInOut' }}>
                <ellipse cx={0} cy={0} rx={90} ry={24} fill="#9ca3af" stroke="#4b5563" strokeWidth={4} />
                <path d="M 70 -20 L 100 -40 L 100 40 L 70 20 Z" fill="#6b7280" />
                <rect x={-20} y={22} width={36} height={14} rx={4} fill="#374151" />
            </motion.g>
            <circle cx={havn[0]} cy={havn[1]} r={12} fill="#334155" stroke="#fff" strokeWidth={4} />
            <circle cx={london[0]} cy={london[1]} r={14} fill="#1d4ed8" stroke="#fff" strokeWidth={4} />
            <Merke x={london[0]} y={london[1] + 66} tekst="London" farge="#1d4ed8" str={40} />
            {beat >= 2 && (
                <>
                    {[0, 1, 2].map((i) => (
                        <motion.circle
                            key={i}
                            cx={london[0]}
                            cy={london[1]}
                            fill="none"
                            stroke="#dc2626"
                            strokeWidth={5}
                            initial={{ r: 14, opacity: 0.9 }}
                            animate={{ r: 110, opacity: 0 }}
                            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8 }}
                        />
                    ))}
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                        <rect x={960} y={700} width={580} height={130} rx={20} fill="#ffffff" stroke="#dc2626" strokeWidth={5} />
                        <text x={1250} y={755} textAnchor="middle" fontSize={38} fontWeight={900} fill="#991b1b">
                            Første gang: krigen rammer
                        </text>
                        <text x={1250} y={805} textAnchor="middle" fontSize={38} fontWeight={900} fill="#991b1b">
                            folk som ikke er soldater
                        </text>
                    </motion.g>
                </>
            )}
        </>
    );
}

/** Handelsruter inn mot Storbritannia fra Atlanterhavet. */
const RUTER: LngLat[][] = [
    [
        [-23, 47],
        [-12, 49],
        [-5.5, 50.2],
    ],
    [
        [-23, 52],
        [-13, 52.5],
        [-6, 53.3],
    ],
    [
        [-23, 57],
        [-12, 56.3],
        [-6.5, 55.4],
    ],
];

const UBATER: LngLat[] = [
    [-14, 50],
    [-10.5, 51.6],
    [-15.5, 54.5],
    [-9.5, 56.6],
    [-8.5, 48.6],
];

function UbatLag({ beat, p }: { beat: number; p: P }) {
    const linje = (pts: LngLat[]) => {
        const [a, b, c] = pts.map(p);
        return `M ${a[0]} ${a[1]} Q ${b[0]} ${b[1]} ${c[0]} ${c[1]}`;
    };
    const konvoi = beat >= 3;
    return (
        <>
            <Landnavn
                p={p}
                navn={[
                    { t: 'STORBRITANNIA', ll: [-1.8, 53.3], str: 30 },
                    { t: 'TYSKLAND', ll: [10, 51.4], str: 30 },
                ]}
            />
            <text x={p([-17, 48.5])[0]} y={p([-17, 48.5])[1]} textAnchor="middle" fontSize={38} fontStyle="italic" fontWeight={700} fill="#1e3a5f" opacity={konvoi ? 0 : 1}>
                Atlanterhavet
            </text>
            {/* Den britiske marinen: store skip rundt øyene */}
            {beat === 0 &&
                [
                    [1.8, 55.6],
                    [3.0, 54.6],
                    [0.6, 56.6],
                ].map((ll, i) => {
                    const [x, y] = p(ll as LngLat);
                    return (
                        <motion.g key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.3 }}>
                            <path d={`M ${x - 46} ${y} L ${x + 46} ${y} L ${x + 34} ${y + 16} L ${x - 38} ${y + 16} Z`} fill="#334155" />
                            <rect x={x - 12} y={y - 18} width={22} height={18} fill="#334155" />
                        </motion.g>
                    );
                })}
            {beat === 0 && <Merke x={p([2.0, 57.6])[0]} y={p([2.0, 57.6])[1]} tekst="sterk britisk marine" />}
            {/* Rutene og handelsskipene */}
            {RUTER.map((r, i) => (
                <path key={i} d={linje(r)} fill="none" stroke="#475569" strokeWidth={5} strokeDasharray="6 12" opacity={konvoi && i !== 0 ? 0.15 : 0.6} />
            ))}
            {!konvoi &&
                RUTER.map((r, i) => {
                    const [a, , c] = r.map(p);
                    return [0, 1].map((k) => (
                        <motion.circle
                            key={`${i}-${k}`}
                            r={12}
                            fill="#b45309"
                            stroke="#fff"
                            strokeWidth={3}
                            animate={{ cx: [a[0], c[0]], cy: [a[1], c[1]] }}
                            transition={{ duration: 9, repeat: Infinity, delay: k * 4.5 + i, ease: 'linear' }}
                        />
                    ));
                })}
            {beat >= 1 &&
                UBATER.map((u, i) => {
                    const [x, y] = p(u);
                    return (
                        <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: konvoi ? 0.5 : 1 }} transition={{ delay: 0.3 + i * 0.25 }}>
                            <ellipse cx={x} cy={y} rx={30} ry={9} fill="#0f172a" />
                            <rect x={x - 6} y={y - 18} width={12} height={12} fill="#0f172a" />
                        </motion.g>
                    );
                })}
            {beat === 1 && <Merke x={p([-15.5, 53.4])[0]} y={p([-15.5, 53.4])[1]} tekst="tyske ubåter" />}
            {beat === 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <rect x={980} y={690} width={560} height={130} rx={20} fill="#ffffff" stroke="#dc2626" strokeWidth={5} />
                    <text x={1260} y={745} textAnchor="middle" fontSize={38} fontWeight={900} fill="#991b1b">
                        Storbritannia: farlig
                    </text>
                    <text x={1260} y={795} textAnchor="middle" fontSize={38} fontWeight={900} fill="#991b1b">
                        nær tom for mat
                    </text>
                </motion.g>
            )}
            {konvoi && (() => {
                const [a, , c] = RUTER[0].map(p);
                return (
                    <motion.g
                        initial={{ x: 0, y: 0 }}
                        animate={{ x: (c[0] - a[0]) * 0.6, y: (c[1] - a[1]) * 0.6 }}
                        transition={{ duration: 10, ease: 'linear' }}
                    >
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <circle key={i} cx={a[0] + (i % 3) * 30} cy={a[1] - 20 + Math.floor(i / 3) * 34} r={12} fill="#b45309" stroke="#fff" strokeWidth={3} />
                        ))}
                        {[
                            [-40, -40],
                            [110, -40],
                            [-40, 50],
                            [110, 50],
                        ].map(([dx, dy], i) => (
                            <path key={i} d={`M ${a[0] + dx - 22} ${a[1] + dy} L ${a[0] + dx + 22} ${a[1] + dy} L ${a[0] + dx + 14} ${a[1] + dy + 10} L ${a[0] + dx - 16} ${a[1] + dy + 10} Z`} fill="#334155" />
                        ))}
                        {[0, 1].map((i) => (
                            <motion.circle
                                key={i}
                                cx={a[0] + 35}
                                cy={a[1]}
                                fill="none"
                                stroke="#0284c7"
                                strokeWidth={4}
                                initial={{ r: 30, opacity: 0.8 }}
                                animate={{ r: 150, opacity: 0 }}
                                transition={{ duration: 2.2, repeat: Infinity, delay: i * 1.1 }}
                            />
                        ))}
                    </motion.g>
                );
            })()}
            {konvoi && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    <rect x={820} y={40} width={720} height={130} rx={20} fill="#ffffff" stroke="#0284c7" strokeWidth={5} />
                    <text x={1180} y={95} textAnchor="middle" fontSize={36} fontWeight={900} fill="#0f172a">
                        handelsskip samlet, krigsskip rundt
                    </text>
                    <text x={1180} y={145} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0369a1">
                        hydrofoner lytter etter ubåter
                    </text>
                </motion.g>
            )}
        </>
    );
}

/** Landene endrer seg aldri, så de tegnes bare én gang. */
const Land = memo(function Land({ geographies, sti }: { geographies: unknown[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path key={i} d={sti(g as never) ?? ''} fill="#f3eddf" stroke="#b9ad92" strokeWidth={1.5} />
            ))}
        </>
    );
});
