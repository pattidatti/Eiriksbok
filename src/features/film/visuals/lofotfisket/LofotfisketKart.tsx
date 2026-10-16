import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';

/**
 * Kart til Lofotfisket. «skrei»: skreien svømmer fra Barentshavet til Lofoten, og eggene
 * driver tilbake. «handel»: tørrfisken går med jekter til Bergen og videre ut i Europa.
 * «atlanter»: Vestfjorden mot Newfoundland, der torsken ble fisket for hardt.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'skrei' | 'handel' | 'atlanter';

const LOFOTEN: LngLat = [14.2, 68.25];
const VESTFJORDEN: LngLat = [14.6, 67.85];
const BERGEN: LngLat = [5.32, 60.39];
const HAUGESUND: LngLat = [5.27, 59.41];
const NEWFOUNDLAND: LngLat = [-52, 46.8];

/** Kysten fra Haugesund til Finnmark, litt ute i sjøen. */
const KYST: LngLat[] = [
    [4.6, 59.4],
    [4.4, 60.4],
    [4.5, 61.5],
    [5.0, 62.3],
    [6.2, 62.9],
    [8.2, 63.7],
    [10.0, 64.7],
    [11.7, 65.7],
    [12.7, 66.7],
    [13.4, 67.6],
    [14.0, 68.6],
    [16.0, 69.3],
    [17.8, 69.9],
    [19.7, 70.35],
    [21.6, 70.6],
    [23.6, 71.0],
    [25.6, 71.3],
];

const VANDRING: LngLat[] = [
    [38, 73.6],
    [30, 72.4],
    [24, 71.6],
    [19, 70.7],
    [15.6, 69.4],
    [14.6, 67.9],
];

const DRIFT: LngLat[] = [
    [13.2, 68.0],
    [13.6, 69.8],
    [18.0, 71.8],
    [27.0, 73.6],
    [37.0, 74.6],
];

const JEKTRUTE: LngLat[] = [
    [13.2, 68.0],
    [12.4, 66.7],
    [11.2, 65.6],
    [9.6, 64.7],
    [7.6, 63.6],
    [5.6, 62.7],
    [4.6, 61.6],
    [4.4, 60.6],
    [5.0, 60.4],
];

function langs(liste: LngLat[], andel: number): LngLat {
    const a = Math.min(0.9999, Math.max(0, andel)) * (liste.length - 1);
    const i = Math.floor(a);
    const k = a - i;
    return [
        liste[i][0] + (liste[i + 1][0] - liste[i][0]) * k,
        liste[i][1] + (liste[i + 1][1] - liste[i][1]) * k,
    ];
}

/** Fast «tilfeldig» spredning per fisk. */
const spre = (i: number, s: number): [number, number] => [
    Math.sin(i * 12.9898) * s,
    Math.cos(i * 78.233) * s * 0.6,
];

const ANTALL_FISK = 36;

const OVERSKRIFT: Record<Modus, string[]> = {
    skrei: [
        'Barentshavet: her lever skreien',
        'Mot sør for å gyte',
        'Fra Haugesund til Finnmark',
        'Vestfjorden, februar og mars',
        'Eggene driver tilbake',
        'En gave hver vinter',
    ],
    handel: [
        'Tørrfisk tåler lange reiser',
        '1300-tallet: over 80 % av alt Norge solgte',
        'All handel gjennom Bergen',
        'Jektene',
        'Over 200 jekter',
        'Hanseatene, fram til 1754',
    ],
    atlanter: [
        'Vestfjorden: skreien kommer igjen',
        'Newfoundland',
        'Mer fisk tatt enn født',
        'Regler for et felles hav',
    ],
};

export function LofotfisketKart({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'skrei';
    const { geographies } = useAtlasWorld();

    const projeksjon: GeoProjection = useMemo(() => {
        const utsnitt: Record<Modus, [LngLat, LngLat]> = {
            skrei: [
                [3, 58.4],
                [46, 75.6],
            ],
            handel: [
                [-2, 52.5],
                [24, 69.2],
            ],
            atlanter: [
                [-62, 37],
                [26, 71],
            ],
        };
        return geoMercator().fitExtent(
            [
                [70, 130],
                [B - 70, H - 30],
            ],
            { type: 'MultiPoint', coordinates: utsnitt[modus] } as never
        );
    }, [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const linje = (liste: LngLat[]) => `M ${liste.map((ll) => p(ll).join(' ')).join(' L ')}`;

    const varighet = playing ? 1 : 0;
    const overskrift = OVERSKRIFT[modus][Math.min(beat, OVERSKRIFT[modus].length - 1)];

    /** Hvor fisk nr. i skal være på denne beaten (skrei-kartet). */
    const fiskPos = (i: number): [number, number] => {
        const [dx, dy] = spre(i, 1);
        if (beat === 0) {
            const [x, y] = p([36 + dx * 6, 73.8 + dy * 2]);
            return [x, y];
        }
        if (beat === 1) {
            const [x, y] = p(langs(VANDRING, 0.35 + (i / ANTALL_FISK) * 0.65));
            return [x + dx * 18, y + dy * 18];
        }
        if (beat === 2) {
            // De fleste ved Lofoten og Vesterålen, noen spredt langs hele kysten.
            const iLofoten = i % 3 !== 0;
            const ll = iLofoten ? [14.3 + dx * 1.2, 68.3 + dy * 0.9] : langs(KYST, i / ANTALL_FISK);
            return p(ll as LngLat);
        }
        const [x, y] = p([VESTFJORDEN[0] + dx * 1.4, VESTFJORDEN[1] - 0.35 + dy * 0.7]);
        return [x, y];
    };

    return (
        <div className="absolute inset-0 bg-[#cfe3f0] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land geographies={geographies} sti={sti} />

                {modus === 'skrei' && (
                    <>
                        <Etikett
                            tekst="Barentshavet"
                            x={p([25, 74.6])[0]}
                            dy={p([25, 74.6])[1]}
                            farge="#1e3a5f"
                        />
                        {beat === 2 && (
                            <motion.path
                                d={linje(KYST)}
                                fill="none"
                                stroke="#d97706"
                                strokeWidth={22}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity={0.5}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2.5 * varighet }}
                            />
                        )}
                        {beat === 2 && (
                            <>
                                <Punkt
                                    ll={HAUGESUND}
                                    p={p}
                                    tekst="Haugesund"
                                    anker="start"
                                    dx={22}
                                />
                                <Punkt ll={[25.6, 70.9]} p={p} tekst="Finnmark" dy={-26} />
                            </>
                        )}
                        {beat >= 3 && (
                            <motion.ellipse
                                cx={p(VESTFJORDEN)[0]}
                                cy={p(VESTFJORDEN)[1] + 14}
                                rx={70}
                                ry={40}
                                fill="#f59e0b"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0.15, 0.35, 0.15] }}
                                transition={{ duration: 2.4, repeat: Infinity }}
                            />
                        )}
                        {beat === 4 && (
                            <>
                                <motion.path
                                    d={linje(DRIFT)}
                                    fill="none"
                                    stroke="#0f766e"
                                    strokeWidth={6}
                                    strokeDasharray="14 12"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 3 * varighet }}
                                />
                                {Array.from({ length: 18 }, (_, i) => {
                                    const fra = p(langs(DRIFT, 0));
                                    const til = p(langs(DRIFT, 0.3 + (i / 18) * 0.7));
                                    const [dx, dy] = spre(i + 7, 14);
                                    return (
                                        <motion.circle
                                            key={i}
                                            r={7}
                                            fill="#facc15"
                                            stroke="#a16207"
                                            strokeWidth={2}
                                            initial={{ cx: fra[0], cy: fra[1], opacity: 0 }}
                                            animate={{
                                                cx: til[0] + dx,
                                                cy: til[1] + dy,
                                                opacity: 1,
                                            }}
                                            transition={{
                                                duration: 5 * varighet,
                                                delay: (i / 18) * 1.5 * varighet,
                                            }}
                                        />
                                    );
                                })}
                                <Etikett
                                    tekst="egg og larver"
                                    x={p([22, 73.2])[0]}
                                    dy={p([22, 73.2])[1] - 22}
                                    farge="#0f766e"
                                />
                            </>
                        )}
                        {beat === 5 &&
                            KYST.map((ll, i) => {
                                const [x, y] = p([ll[0] + 0.9, ll[1] + 0.1]);
                                return (
                                    <motion.g
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.15 * varighet }}
                                    >
                                        <Hus x={x} y={y} />
                                    </motion.g>
                                );
                            })}
                        {Array.from({ length: ANTALL_FISK }, (_, i) => {
                            const [x, y] = fiskPos(i);
                            return (
                                <motion.g
                                    key={i}
                                    initial={false}
                                    animate={{ x, y }}
                                    transition={{
                                        duration: (beat === 1 ? 6 : 2.5) * varighet,
                                        delay: beat === 1 ? (i / ANTALL_FISK) * 1.5 * varighet : 0,
                                        ease: 'easeInOut',
                                    }}
                                >
                                    <Fisk vend={beat >= 1} skala={1.7} />
                                </motion.g>
                            );
                        })}
                        <Punkt ll={LOFOTEN} p={p} tekst="Lofoten" dx={26} anker="start" dy={-12} />
                        {beat >= 3 && (
                            <Etikett
                                tekst="Vestfjorden"
                                x={p(VESTFJORDEN)[0] - 30}
                                dy={p(VESTFJORDEN)[1] + 74}
                                anker="end"
                                farge="#b45309"
                            />
                        )}
                    </>
                )}

                {modus === 'handel' && (
                    <>
                        <Punkt ll={LOFOTEN} p={p} tekst="Lofoten" dx={24} anker="start" />
                        {beat >= 2 && (
                            <Punkt ll={BERGEN} p={p} tekst="Bergen" dx={26} anker="start" stor />
                        )}
                        {beat >= 2 && (
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8 * varighet }}
                            >
                                <line
                                    x1={p([-2, 61.1])[0]}
                                    y1={p([-2, 61.1])[1]}
                                    x2={p([5.6, 61.1])[0]}
                                    y2={p([5.6, 61.1])[1]}
                                    stroke="#dc2626"
                                    strokeWidth={8}
                                    strokeDasharray="18 10"
                                />
                                <Etikett
                                    tekst="Utlendinger: ikke lenger nord"
                                    x={p([2.2, 61.1])[0]}
                                    dy={p([3.4, 61.1])[1] + 46}
                                    anker="end"
                                    farge="#b91c1c"
                                />
                            </motion.g>
                        )}
                        {beat >= 3 && (
                            <path
                                d={linje(JEKTRUTE)}
                                fill="none"
                                stroke="#78350f"
                                strokeWidth={4}
                                strokeDasharray="10 10"
                                opacity={0.6}
                            />
                        )}
                        {beat === 3 && (
                            <motion.g
                                initial={{ x: p(JEKTRUTE[0])[0], y: p(JEKTRUTE[0])[1] }}
                                animate={{
                                    x: JEKTRUTE.map((ll) => p(ll)[0]),
                                    y: JEKTRUTE.map((ll) => p(ll)[1]),
                                }}
                                transition={{ duration: 7 * varighet, ease: 'linear' }}
                            >
                                <Jekt skala={2.4} />
                            </motion.g>
                        )}
                        {beat >= 4 &&
                            Array.from({ length: 20 }, (_, i) => {
                                const [x, y] = p(langs(JEKTRUTE, (i / 19) * 0.86));
                                const [dx, dy] = spre(i, 16);
                                return (
                                    <motion.g
                                        key={i}
                                        initial={{ opacity: 0, x: x + dx, y: y + dy }}
                                        animate={{ opacity: 1, x: x + dx, y: y + dy }}
                                        transition={{
                                            delay: (beat === 4 ? i * 0.12 : 0) * varighet,
                                        }}
                                    >
                                        <Jekt skala={1.6} />
                                    </motion.g>
                                );
                            })}
                        {beat === 5 && (
                            <>
                                {(
                                    [
                                        [8.6, 54.4],
                                        [2.6, 53.4],
                                    ] as LngLat[]
                                ).map((mål, i) => (
                                    <motion.path
                                        key={i}
                                        d={`M ${p(BERGEN).join(' ')} Q ${p([3, 57.5]).join(' ')} ${p(mål).join(' ')}`}
                                        fill="none"
                                        stroke="#0f172a"
                                        strokeWidth={7}
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{
                                            duration: 2.4 * varighet,
                                            delay: i * 0.5 * varighet,
                                        }}
                                    />
                                ))}
                                <Etikett
                                    tekst="Europa"
                                    x={p([5.6, 54.6])[0]}
                                    dy={p([5.6, 54.6])[1]}
                                />
                            </>
                        )}
                        {beat <= 1 && <Eksport beat={beat} />}
                    </>
                )}

                {modus === 'atlanter' && (
                    <>
                        {beat >= 3 && (
                            <motion.g
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                    originX: `${p(VESTFJORDEN)[0]}px`,
                                    originY: `${p(VESTFJORDEN)[1]}px`,
                                }}
                            >
                                <rect
                                    x={p(VESTFJORDEN)[0] - 160}
                                    y={p(VESTFJORDEN)[1] + 80}
                                    width={380}
                                    height={70}
                                    rx={16}
                                    fill="#16a34a"
                                />
                                <text
                                    x={p(VESTFJORDEN)[0] + 30}
                                    y={p(VESTFJORDEN)[1] + 127}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={900}
                                    fill="#ffffff"
                                >
                                    Lov, kvoter, oppsyn
                                </text>
                            </motion.g>
                        )}
                        <Punkt ll={VESTFJORDEN} p={p} tekst="Vestfjorden" dx={22} anker="start" />
                        {Array.from({ length: 14 }, (_, i) => {
                            const [dx, dy] = spre(i, 26);
                            const [x, y] = p(VESTFJORDEN);
                            return (
                                <motion.g
                                    key={i}
                                    initial={{ x: x + dx - 40, y: y + dy + 20 }}
                                    animate={{
                                        x: x + dx - 40,
                                        y: y + dy + 20,
                                        opacity: [0.7, 1, 0.7],
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                                >
                                    <Fisk vend skala={1.5} />
                                </motion.g>
                            );
                        })}
                        {beat >= 1 && (
                            <>
                                <Punkt ll={NEWFOUNDLAND} p={p} tekst="Newfoundland" dy={-34} />
                                {Array.from({ length: 24 }, (_, i) => {
                                    const [dx, dy] = spre(i + 3, 40);
                                    const [x, y] = p(NEWFOUNDLAND);
                                    const igjen = beat < 2 || i % 8 === 0;
                                    return (
                                        <motion.g
                                            key={i}
                                            initial={{ x: x + dx + 10, y: y + dy + 40, opacity: 0 }}
                                            animate={{
                                                x: x + dx + 10,
                                                y: y + dy + 40,
                                                opacity: igjen ? 1 : 0.08,
                                            }}
                                            transition={{
                                                duration: 0.8 * varighet,
                                                delay:
                                                    (beat === 2 ? i * 0.18 : i * 0.04) * varighet,
                                            }}
                                        >
                                            <Fisk
                                                skala={1.5}
                                                farge={igjen ? '#64748b' : '#94a3b8'}
                                            />
                                        </motion.g>
                                    );
                                })}
                            </>
                        )}
                        {beat >= 2 && (
                            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <text
                                    x={p(NEWFOUNDLAND)[0] + 90}
                                    y={p(NEWFOUNDLAND)[1] + 70}
                                    textAnchor="start"
                                    fontSize={40}
                                    fontWeight={900}
                                    fill="#dc2626"
                                    stroke="#fff"
                                    strokeWidth={8}
                                    paintOrder="stroke"
                                >
                                    Torsken blir borte
                                </text>
                            </motion.g>
                        )}
                    </>
                )}
            </svg>
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

/** Ti varer Norge solgte: åtte av dem blir tørrfisk på beat 1. */
function Eksport({ beat }: { beat: number }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transform="translate(-30 -200) scale(1.25)"
        >
            <rect x={80} y={520} width={520} height={330} rx={24} fill="#ffffff" opacity={0.95} />
            <text x={340} y={580} textAnchor="middle" fontSize={32} fontWeight={800} fill="#0f172a">
                Ti varer Norge solgte
            </text>
            {Array.from({ length: 10 }, (_, i) => {
                const x = 120 + (i % 5) * 92;
                const y = 610 + Math.floor(i / 5) * 92;
                const torrfisk = beat >= 1 && i < 8;
                return (
                    <motion.rect
                        key={i}
                        x={x}
                        y={y}
                        width={76}
                        height={76}
                        rx={12}
                        initial={false}
                        animate={{ fill: torrfisk ? '#d97706' : '#cbd5e1' }}
                        transition={{ delay: torrfisk ? i * 0.15 : 0 }}
                    />
                );
            })}
            <text
                x={340}
                y={830}
                textAnchor="middle"
                fontSize={30}
                fontWeight={800}
                fill={beat >= 1 ? '#b45309' : '#64748b'}
            >
                {beat >= 1 ? 'Åtte av ti: tørrfisk' : 'Hvor mange var fisk?'}
            </text>
        </motion.g>
    );
}

function Fisk({
    vend = false,
    skala = 1,
    farge = '#475569',
}: {
    vend?: boolean;
    skala?: number;
    farge?: string;
}) {
    return (
        <g transform={`scale(${vend ? -skala : skala} ${skala})`}>
            <ellipse cx={0} cy={0} rx={14} ry={6} fill={farge} stroke="#fff" strokeWidth={2} />
            <path d="M 12 0 L 22 -7 L 22 7 Z" fill={farge} stroke="#fff" strokeWidth={2} />
        </g>
    );
}

function Jekt({ skala }: { skala: number }) {
    return (
        <g transform={`scale(${skala})`}>
            <path
                d="M -16 0 L 16 0 L 11 8 L -11 8 Z"
                fill="#78350f"
                stroke="#fff"
                strokeWidth={2}
            />
            <rect x={-1.5} y={-26} width={3} height={26} fill="#3b2a1c" />
            <rect
                x={-11}
                y={-24}
                width={22}
                height={18}
                fill="#f5efe0"
                stroke="#78350f"
                strokeWidth={2}
            />
        </g>
    );
}

function Hus({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect
                x={-10}
                y={-8}
                width={20}
                height={14}
                fill="#a3302a"
                stroke="#fff"
                strokeWidth={2}
            />
            <path d="M -13 -8 L 0 -19 L 13 -8 Z" fill="#334155" stroke="#fff" strokeWidth={2} />
        </g>
    );
}

function Punkt({
    ll,
    p,
    tekst,
    dx = 0,
    dy = -24,
    anker = 'middle',
    stor = false,
}: {
    ll: LngLat;
    p: (ll: LngLat) => [number, number];
    tekst: string;
    dx?: number;
    dy?: number;
    anker?: 'middle' | 'end' | 'start';
    stor?: boolean;
}) {
    const [x, y] = p(ll);
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle r={stor ? 14 : 10} fill="#0f172a" stroke="#fff" strokeWidth={4} />
            <Etikett tekst={tekst} x={dx} dy={anker === 'middle' ? dy : 10} anker={anker} />
        </g>
    );
}

const Land = memo(function Land({ geographies, sti }: { geographies: unknown[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill="#f5efe0"
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
