import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useAtlasWorld, type GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { Teller } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Kart over Nansens arbeid. Fem modus:
 * «liv»: Kristiania, Grønland, krigen i Europa, Washington og Folkeforbundet.
 * «fanger»: fangeleirene i Russland og krigsfangene som kommer hjem.
 * «flukt»: flyktningene ut av Russland og kontoret for flyktninger i Genève.
 * «bytte»: utvekslingen mellom Hellas og Tyrkia.
 * «armenia»: reisen til Armenia og planen som aldri ble noe av.
 * Bare steder og retninger, aldri mennesker som skades.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'liv' | 'fanger' | 'flukt' | 'bytte' | 'armenia';

const KRISTIANIA: LngLat = [10.75, 59.91];
const GRONLAND_OST: LngLat = [-40.3, 64.3];
const GRONLAND_VEST: LngLat = [-51.7, 64.2];
const WASHINGTON: LngLat = [-77.04, 38.9];
const GENEVE: LngLat = [6.14, 46.2];
const MOSKVA: LngLat = [37.6, 55.75];
const JEREVAN: LngLat = [44.5, 40.18];

// ISO 3166-1 numerisk, som i verdenskartet.
const RUSSLAND = '643';
const HELLAS = '300';
const TYRKIA = '792';
const ARMENIA = '051';

const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    liv: [
        [-82, 34],
        [42, 74],
    ],
    fanger: [
        [-4, 41],
        [62, 65],
    ],
    flukt: [
        [-4, 41],
        [62, 65],
    ],
    bytte: [
        [18.5, 34.5],
        [37, 42.5],
    ],
    armenia: [
        [2, 34],
        [50, 52],
    ],
};

/** Fangeleirer spredt i Russland (illustrasjon, ikke ekte leirer). */
const LEIRER: LngLat[] = [
    [38, 56],
    [45, 53],
    [50, 58],
    [42, 60],
    [55, 55],
    [33, 52],
    [48, 50],
    [58, 60],
    [40, 48],
    [52, 62],
];
/** Hjem i Europa som pilene ender i (illustrasjon). */
const HJEM: LngLat[] = [
    [13.4, 52.5],
    [16.4, 48.2],
    [19.0, 47.5],
    [14.4, 50.1],
    [21.0, 52.2],
    [10.0, 53.5],
    [24.1, 56.9],
    [12.5, 41.9],
    [8.7, 50.1],
    [17.1, 48.1],
];
/** Retninger flyktningene dro (illustrasjon). */
const FLUKT: LngLat[] = [
    [13.4, 52.5],
    [2.35, 48.85],
    [20.5, 44.8],
    [28.9, 41.0],
    [24.1, 56.9],
    [14.4, 50.1],
    [24.9, 60.2],
    [26.1, 44.4],
];

export function NansenKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'liv';
    const { geographies } = useAtlasWorld();

    const projeksjon: GeoProjection = useMemo(() => {
        const [a, b] = UTSNITT[modus];
        return geoMercator().fitExtent(
            [
                [40, 40],
                [B - 40, H - 40],
            ],
            { type: 'MultiPoint', coordinates: [a, b] } as never
        );
    }, [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];

    const farger: Record<string, string> = {};
    if ((modus === 'fanger' || modus === 'flukt') && beat >= 0) farger[RUSSLAND] = '#e7d3b8';
    if (modus === 'bytte') {
        farger[TYRKIA] = '#fcd9b0';
        farger[HELLAS] = '#cfe0f5';
    }
    if (modus === 'armenia') farger[ARMENIA] = beat >= 2 ? '#d6d3d1' : '#fcd9b0';

    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];

    return (
        <div className="absolute inset-0 bg-[#cfe3f0] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <marker
                        id="nansen-pil"
                        viewBox="0 0 10 10"
                        refX="6"
                        refY="5"
                        markerWidth="4"
                        markerHeight="4"
                        orient="auto-start-reverse"
                    >
                        <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
                    </marker>
                </defs>
                <Land geographies={geographies} sti={sti} farger={farger} />

                {modus === 'liv' && <Liv beat={beat} p={p} />}
                {modus === 'fanger' && <Fanger beat={beat} p={p} />}
                {modus === 'flukt' && <Flukt beat={beat} p={p} />}
                {modus === 'bytte' && <Bytte beat={beat} p={p} />}
                {modus === 'armenia' && <Armenia beat={beat} p={p} />}
            </svg>

            {/* Tellerne */}
            <div className="absolute bottom-[6%] right-[4%] flex gap-4">
                {modus === 'fanger' && beat >= 3 && (
                    <Teller key="fanger" verdi={450000} etikett="krigsfanger hjem" tone="gronn" />
                )}
                {modus === 'bytte' && beat >= 1 && (
                    <>
                        <Teller key="grekere" verdi={1250000} etikett="grekere til Hellas" />
                        <Teller key="tyrkere" verdi={500000} etikett="tyrkere til Tyrkia" forsinkelse={0.4} />
                    </>
                )}
            </div>
            {modus === 'flukt' && beat <= 1 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute bottom-[6%] right-[4%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
                >
                    <div className="text-4xl md:text-5xl font-black text-slate-900">ca. 2 millioner</div>
                    <div className="text-sm md:text-base font-semibold text-slate-500">
                        russere på flukt
                    </div>
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                {overskrift && (
                    <motion.div
                        key={overskrift}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {overskrift}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    liv: [
        'Født 1861',
        '1888: på ski over Grønland',
        '1914: krig i Europa',
        'Washington 1917-1918: mat til Norge',
        'Folkeforbundet',
    ],
    fanger: [
        'Våren 1920: første oppdrag',
        'Fangeleirer i Russland',
        'Lite penger, mye kaos',
        'Halvannet år',
        'Han fikk ting gjort',
    ],
    flukt: ['Flukt fra Russland', 'Statsløse: ingen papirer', 'Juni 1921: høykommissær', 'Et oppdrag fra mange land'],
    bytte: ['1922: Hellas taper krigen', 'Et bytte av folk', 'Hjemmene forlatt', 'En ny start, med hjelp'],
    armenia: ['Armenerne', '1925: Nansen reiser selv', 'Planen blir aldri noe av'],
};

type P = (ll: LngLat) => [number, number];

/** En buet pil fra a til b som tegnes fram. */
function Pil({
    fra,
    til,
    farge,
    bredde = 6,
    boy = 0.2,
    forsinkelse = 0,
    stiplet = false,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    bredde?: number;
    boy?: number;
    forsinkelse?: number;
    stiplet?: boolean;
}) {
    const mx = (fra[0] + til[0]) / 2 - (til[1] - fra[1]) * boy;
    const my = (fra[1] + til[1]) / 2 + (til[0] - fra[0]) * boy;
    return (
        <motion.path
            d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`}
            fill="none"
            stroke={farge}
            strokeWidth={bredde}
            strokeLinecap="round"
            strokeDasharray={stiplet ? '4 14' : undefined}
            markerEnd="url(#nansen-pil)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.6, delay: forsinkelse, ease: 'easeInOut' }}
        />
    );
}

function Punkt({
    pt,
    navn,
    farge = '#0f172a',
    dy = -26,
    anker = 'middle',
    dx = 0,
    r = 12,
}: {
    pt: [number, number];
    navn?: string;
    farge?: string;
    dy?: number;
    anker?: 'middle' | 'start' | 'end';
    dx?: number;
    r?: number;
}) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transform={`translate(${pt[0]} ${pt[1]})`}>
            <circle r={r} fill={farge} stroke="#fff" strokeWidth={4} />
            {navn && <Etikett tekst={navn} x={dx} dy={dy} anker={anker} />}
        </motion.g>
    );
}

function Liv({ beat, p }: { beat: number; p: P }) {
    return (
        <>
            {beat >= 2 && (
                <motion.ellipse
                    cx={p([15, 50])[0]}
                    cy={p([15, 50])[1]}
                    rx={150}
                    ry={110}
                    fill="#dc2626"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat === 2 ? 0.35 : 0.15 }}
                />
            )}
            {beat >= 1 && (
                <>
                    <motion.path
                        d={`M ${p(GRONLAND_OST).join(' ')} L ${p(GRONLAND_VEST).join(' ')}`}
                        stroke="#1d4ed8"
                        strokeWidth={8}
                        strokeDasharray="2 14"
                        strokeLinecap="round"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2 }}
                    />
                    <Etikett tekst="Grønland" x={p([-44, 70])[0]} dy={p([-44, 70])[1]} farge="#1e3a5f" />
                </>
            )}
            {beat >= 3 && <Pil fra={p(KRISTIANIA)} til={p(WASHINGTON)} farge="#0f172a" boy={-0.18} />}
            {beat >= 3 && <Punkt pt={p(WASHINGTON)} navn="Washington" dy={42} />}
            {beat >= 4 && <Punkt pt={p(GENEVE)} navn="Folkeforbundet" farge="#1d4ed8" dy={46} />}
            <Punkt pt={p(KRISTIANIA)} navn="Kristiania (Oslo)" dy={-26} />
        </>
    );
}

function Fanger({ beat, p }: { beat: number; p: P }) {
    return (
        <>
            {beat === 0 && <Pil fra={p(GENEVE)} til={p(MOSKVA)} farge="#1d4ed8" stiplet bredde={7} />}
            {beat >= 1 &&
                LEIRER.map((ll, i) => {
                    const [x, y] = p(ll);
                    const tom = beat >= 3;
                    return (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: tom ? 0.35 : 1, scale: 1 }}
                            transition={{ delay: beat === 1 ? i * 0.1 : 0 }}
                            style={{ originX: `${x}px`, originY: `${y}px` }}
                        >
                            <rect x={x - 16} y={y - 16} width={32} height={32} fill="#78350f" stroke="#fff" strokeWidth={3} />
                            <path
                                d={`M ${x - 16} ${y - 6} H ${x + 16} M ${x - 16} ${y + 6} H ${x + 16}`}
                                stroke="#fde68a"
                                strokeWidth={2}
                            />
                        </motion.g>
                    );
                })}
            {beat === 2 && (
                <motion.rect
                    x={p([30, 64])[0]}
                    y={p([30, 64])[1]}
                    width={p([62, 46])[0] - p([30, 64])[0]}
                    height={p([62, 46])[1] - p([30, 64])[1]}
                    fill="#57534e"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.25 }}
                />
            )}
            {beat >= 3 &&
                LEIRER.map((ll, i) => (
                    <Pil
                        key={i}
                        fra={p(ll)}
                        til={p(HJEM[i])}
                        farge="#0d9488"
                        bredde={6}
                        boy={0.12}
                        forsinkelse={beat === 3 ? i * 0.15 : 0}
                    />
                ))}
            {beat >= 3 &&
                HJEM.map((ll, i) => {
                    const [x, y] = p(ll);
                    return (
                        <motion.path
                            key={i}
                            d={`M ${x - 13} ${y + 10} V ${y - 4} L ${x} ${y - 16} L ${x + 13} ${y - 4} V ${y + 10} Z`}
                            fill="#0d9488"
                            stroke="#fff"
                            strokeWidth={3}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: beat === 3 ? 1.4 + i * 0.15 : 0 }}
                        />
                    );
                })}
            <Punkt pt={p(GENEVE)} navn="Genève" farge="#1d4ed8" dy={44} />
            <Etikett tekst="Russland" x={p([57, 51.5])[0]} dy={p([57, 51.5])[1]} farge="#78350f" />
        </>
    );
}

function Flukt({ beat, p }: { beat: number; p: P }) {
    return (
        <>
            {FLUKT.map((ll, i) => (
                <Pil
                    key={i}
                    fra={p(MOSKVA)}
                    til={p(ll)}
                    farge={beat >= 2 ? '#94a3b8' : '#b45309'}
                    bredde={7}
                    boy={0.1}
                    forsinkelse={beat === 0 ? i * 0.2 : 0}
                />
            ))}
            {beat === 1 &&
                FLUKT.map((ll, i) => {
                    const [x, y] = p(ll);
                    return (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.15 }}
                            style={{ originX: `${x}px`, originY: `${y}px` }}
                        >
                            <rect x={x - 15} y={y - 20} width={30} height={40} rx={4} fill="#fff" stroke="#64748b" strokeWidth={3} />
                            <path
                                d={`M ${x - 22} ${y - 24} L ${x + 22} ${y + 24} M ${x + 22} ${y - 24} L ${x - 22} ${y + 24}`}
                                stroke="#dc2626"
                                strokeWidth={6}
                                strokeLinecap="round"
                            />
                        </motion.g>
                    );
                })}
            {beat >= 3 &&
                FLUKT.map((ll, i) => (
                    <Pil
                        key={`k${i}`}
                        fra={p(GENEVE)}
                        til={p(ll)}
                        farge="#1d4ed8"
                        bredde={4}
                        boy={-0.08}
                        forsinkelse={i * 0.12}
                    />
                ))}
            <Punkt pt={p(MOSKVA)} navn="Russland" farge="#b45309" dy={-26} />
            {beat >= 2 && <Punkt pt={p(GENEVE)} navn="Kontor for flyktninger" farge="#1d4ed8" r={16} dy={52} />}
        </>
    );
}

function Hus({ x, y, farge, forsinkelse = 0, tom = false }: { x: number; y: number; farge: string; forsinkelse?: number; tom?: boolean }) {
    return (
        <motion.path
            d={`M ${x - 28} ${y + 24} V ${y - 6} L ${x} ${y - 34} L ${x + 28} ${y - 6} V ${y + 24} Z`}
            fill={tom ? 'none' : farge}
            stroke={tom ? farge : '#fff'}
            strokeWidth={tom ? 4 : 3}
            strokeDasharray={tom ? '6 6' : undefined}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse }}
            style={{ originX: `${x}px`, originY: `${y}px` }}
        />
    );
}

const I_TYRKIA: LngLat[] = [
    [27.2, 38.4],
    [28.5, 39.6],
    [29.2, 37.6],
    [30.6, 40.1],
    [27.9, 37.2],
    [31.5, 38.6],
];
const I_HELLAS: LngLat[] = [
    [22.4, 39.6],
    [21.8, 38.3],
    [23.0, 40.6],
    [22.0, 37.4],
];

function Bytte({ beat, p }: { beat: number; p: P }) {
    return (
        <>
            {beat === 0 && <Pil fra={p([29, 38.6])} til={p([23.2, 38.4])} farge="#b45309" bredde={10} />}
            {beat >= 1 && (
                <>
                    <Pil fra={p([28.6, 39.2])} til={p([22.8, 39.4])} farge="#1d4ed8" bredde={26} boy={-0.15} />
                    <Pil fra={p([22.6, 40.4])} til={p([28.0, 40.9])} farge="#b45309" bredde={11} boy={-0.15} forsinkelse={0.5} />
                </>
            )}
            {beat >= 2 &&
                I_TYRKIA.slice(0, 4).map((ll, i) => {
                    const [x, y] = p(ll);
                    return <Hus key={`t${i}`} x={x} y={y} farge="#1d4ed8" tom forsinkelse={beat === 2 ? i * 0.15 : 0} />;
                })}
            {beat >= 2 &&
                I_HELLAS.slice(0, 2).map((ll, i) => {
                    const [x, y] = p(ll);
                    return <Hus key={`h${i}`} x={x} y={y} farge="#b45309" tom forsinkelse={beat === 2 ? 0.6 + i * 0.15 : 0} />;
                })}
            {beat >= 3 &&
                I_HELLAS.slice(2).map((ll, i) => {
                    const [x, y] = p(ll);
                    return <Hus key={`nh${i}`} x={x} y={y} farge="#1d4ed8" forsinkelse={i * 0.2} />;
                })}
            {beat >= 3 &&
                I_TYRKIA.slice(4).map((ll, i) => {
                    const [x, y] = p(ll);
                    return <Hus key={`nt${i}`} x={x} y={y} farge="#b45309" forsinkelse={0.4 + i * 0.2} />;
                })}
            <Etikett tekst="Hellas" x={p([21.6, 41.6])[0]} dy={p([21.6, 41.6])[1]} farge="#1e3a8a" />
            <Etikett tekst="Tyrkia" x={p([33.5, 39.5])[0]} dy={p([33.5, 39.5])[1]} farge="#78350f" />
            {beat === 0 && <Etikett tekst="Lilleasia" x={p([30.5, 37.2])[0]} dy={p([30.5, 37.2])[1]} farge="#78350f" />}
        </>
    );
}

function Armenia({ beat, p }: { beat: number; p: P }) {
    const [jx, jy] = p(JEREVAN);
    return (
        <>
            {beat >= 1 && <Pil fra={p(GENEVE)} til={p(JEREVAN)} farge="#1d4ed8" bredde={8} boy={-0.15} stiplet />}
            <Punkt pt={p(GENEVE)} navn="Genève" farge="#1d4ed8" dy={44} />
            <Etikett tekst="Armenia" x={jx} dy={jy - 40} farge="#78350f" />
            {beat >= 1 && (
                <motion.g
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: beat === 1 ? 1.4 : 0 }}
                >
                    <rect x={jx - 170} y={jy + 30} width={150} height={190} rx={8} fill="#fff" stroke="#475569" strokeWidth={4} />
                    {[0, 1, 2, 3, 4].map((i) => (
                        <rect key={i} x={jx - 150} y={jy + 62 + i * 28} width={i === 0 ? 110 : 80 + ((i * 17) % 30)} height={9} rx={4} fill="#94a3b8" />
                    ))}
                    <text x={jx - 95} y={jy + 52} textAnchor="middle" fontSize={22} fontWeight={800} fill="#0f172a">
                        Plan
                    </text>
                </motion.g>
            )}
            {beat >= 2 && (
                <motion.g
                    initial={{ opacity: 0, scale: 1.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ originX: `${jx - 95}px`, originY: `${jy + 125}px` }}
                >
                    <g transform={`rotate(-12 ${jx - 95} ${jy + 125})`}>
                        <rect x={jx - 245} y={jy + 95} width={300} height={62} rx={10} fill="#fff" fillOpacity={0.85} stroke="#dc2626" strokeWidth={6} />
                        <text x={jx - 95} y={jy + 137} textAnchor="middle" fontSize={30} fontWeight={900} fill="#dc2626">
                            LITE STØTTE
                        </text>
                    </g>
                </motion.g>
            )}
        </>
    );
}

const Land = memo(function Land({
    geographies,
    sti,
    farger,
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
    farger: Record<string, string>;
}) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill={farger[String(g.id)] ?? '#f5efe0'}
                    stroke="#b9ad92"
                    strokeWidth={1}
                />
            ))}
        </>
    );
});

function Etikett({
    tekst,
    dy,
    x = 0,
    farge = '#0f172a',
    anker = 'middle',
}: {
    tekst: string;
    dy: number;
    x?: number;
    farge?: string;
    anker?: 'middle' | 'end' | 'start';
}) {
    return (
        <text
            x={x}
            y={dy}
            textAnchor={anker}
            fontSize={32}
            fontWeight={800}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={7}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}
