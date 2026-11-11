import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart. «oslo»: hvor multietnolekten vokste fram, fra Norge og inn til Oslo øst.
 * «verden»: lånordene kommer fra mange språk og samles i ett ungdomsspråk i Oslo.
 * Stedene for språkene er omtrentlige: bare der språkene snakkes, ikke grenser.
 */

type Modus = 'oslo' | 'verden';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const HAV = '#bcd4e4';
const OSLO: LngLat = [10.75, 59.91];
const NORGE_ID = '578';

const TITLER: Record<Modus, string[]> = {
    oslo: ['Hvor vokste den fram?', 'Oslo øst', 'Når?'],
    verden: [
        'Lånord: ord fra andre språk',
        'Urdu og punjabi',
        'Mange språk til',
        'Engelsk overalt',
        'Ett felles ungdomsspråk',
    ],
};

export function EtnolektKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'oslo';
    const titler = TITLER[modus];
    const tittel = titler[Math.min(beat, titler.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: HAV }}>
            {modus === 'oslo' && <OsloKart beat={beat} />}
            {modus === 'verden' && <VerdenKart beat={beat} />}
            <AnimatePresence mode="wait">
                <motion.div
                    key={tittel}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-x-0 top-[4%] flex justify-center pointer-events-none"
                >
                    <div className="px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-display font-black text-4xl shadow-xl whitespace-nowrap">
                        {tittel}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function lagProj(sv: LngLat, no: LngLat): GeoProjection {
    return geoMercator().fitExtent(
        [
            [40, 110],
            [B - 40, H - 30],
        ],
        { type: 'MultiPoint', coordinates: [sv, no] } as never
    );
}

const Land = memo(function Land({
    geographies,
    sti,
    norgeFarge,
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
    norgeFarge?: string;
}) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill={norgeFarge && String(g.id) === NORGE_ID ? norgeFarge : '#ece6d6'}
                    stroke="#a8a08a"
                    strokeWidth={1.5}
                />
            ))}
        </>
    );
});

/* ---------- oslo ---------- */

const NORGE_SV: LngLat = [2, 57.3];
const NORGE_NO: LngLat = [33, 71.3];
const ZOOM: Utsnitt = [
    [8.4, 59.0],
    [13.0, 60.45],
];

function OsloKart({ beat }: { beat: number }) {
    const naer = beat >= 1;
    return (
        <AnimatePresence mode="wait">
            {naer ? (
                <motion.div
                    key="naer"
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <OsloNaer beat={beat} />
                </motion.div>
            ) : (
                <motion.div
                    key="vid"
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                >
                    <NorgeVid />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function NorgeVid() {
    const { geographies } = useFilmVerden();
    const proj = useMemo(() => lagProj(NORGE_SV, NORGE_NO), []);
    const sti = useMemo(() => geoPath(proj), [proj]);
    const [ox, oy] = proj(OSLO) as [number, number];
    const [nx, ny] = proj([8.6, 61.6]) as [number, number];
    return (
        <svg
            viewBox={`0 0 ${B} ${H}`}
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
        >
            <Land geographies={geographies} sti={sti} norgeFarge="#f6dfb8" />
            <motion.circle
                cx={ox}
                cy={oy}
                r={14}
                fill="#dc2626"
                stroke="#ffffff"
                strokeWidth={4}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
            />
            <text
                x={ox - 26}
                y={oy + 12}
                textAnchor="end"
                fontSize={38}
                fontWeight={900}
                fill="#0f172a"
            >
                Oslo
            </text>
            <text x={nx} y={ny} textAnchor="middle" fontSize={40} fontWeight={800} fill="#7c2d12">
                Norge
            </text>
        </svg>
    );
}

function OsloNaer({ beat }: { beat: number }) {
    const { geographies } = useFilmVerden(ZOOM);
    const proj = useMemo(() => lagProj(ZOOM[0], ZOOM[1]), []);
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LngLat) => proj(ll) as [number, number];
    const [ox, oy] = p(OSLO);
    // Oslo øst som et omtrentlig område øst for sentrum.
    const ost = useMemo(() => {
        const pts: string[] = [];
        for (let i = 0; i <= 40; i++) {
            const a = (i / 40) * Math.PI * 2;
            const [x, y] = proj([10.93 + Math.cos(a) * 0.13, 59.93 + Math.sin(a) * 0.055]) as [
                number,
                number,
            ];
            pts.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
        }
        return pts.join(' ') + ' Z';
    }, [proj]);
    const [ex, ey] = p([10.93, 59.93]);
    return (
        <svg
            viewBox={`0 0 ${B} ${H}`}
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
        >
            <Land geographies={geographies} sti={sti} norgeFarge="#f6dfb8" />
            <motion.path
                d={ost}
                fill="#ea580c"
                stroke="#c2410c"
                strokeWidth={5}
                initial={{ fillOpacity: 0 }}
                animate={{ fillOpacity: 0.4 }}
                transition={{ duration: 1, delay: 0.5 }}
            />
            <circle cx={ox} cy={oy} r={14} fill="#0f172a" stroke="#ffffff" strokeWidth={4} />
            <text
                x={ox - 26}
                y={oy + 12}
                textAnchor="end"
                fontSize={38}
                fontWeight={900}
                fill="#0f172a"
            >
                Oslo sentrum
            </text>
            <g>
                <rect
                    x={ex + 140}
                    y={ey - 150}
                    width={420}
                    height={110}
                    rx={22}
                    fill="#ffffff"
                    stroke="#c2410c"
                    strokeWidth={4}
                />
                <text
                    x={ex + 350}
                    y={ey - 100}
                    textAnchor="middle"
                    fontSize={38}
                    fontWeight={900}
                    fill="#c2410c"
                >
                    Oslo øst
                </text>
                <text
                    x={ex + 350}
                    y={ey - 60}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={700}
                    fill="#475569"
                >
                    flerkulturelle bydeler
                </text>
                <line
                    x1={ex + 140}
                    y1={ey - 95}
                    x2={ex + 60}
                    y2={ey - 20}
                    stroke="#c2410c"
                    strokeWidth={4}
                />
            </g>
            {beat >= 2 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <rect x={500} y={680} width={600} height={140} rx={28} fill="#0f172a" />
                    <text
                        x={800}
                        y={745}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        Fra 1990-tallet
                    </text>
                    <text
                        x={800}
                        y={795}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={700}
                        fill="#fde68a"
                    >
                        et ferskt talemål
                    </text>
                </motion.g>
            )}
            <text x={1570} y={880} textAnchor="end" fontSize={34} fontWeight={700} fill="#475569">
                Området er omtrentlig
            </text>
        </svg>
    );
}

/* ---------- verden ---------- */

const VERDEN_SV: LngLat = [-28, 10];
const VERDEN_NO: LngLat = [88, 66];

interface Sprak {
    navn: string;
    ll: LngLat;
    /** Hvor merkelappen står, i skjermpiksler fra punktet. */
    dx: number;
    dy: number;
    farge: string;
    beat: number;
    ord?: string;
}

const SPRAK: Sprak[] = [
    {
        navn: 'urdu og punjabi',
        ll: [71, 30],
        dx: 90,
        dy: -80,
        farge: '#7c3aed',
        beat: 1,
        ord: '«baja», «tært»',
    },
    { navn: 'arabisk', ll: [44, 24], dx: -170, dy: 30, farge: '#b45309', beat: 2 },
    { navn: 'persisk', ll: [54, 32], dx: 10, dy: -60, farge: '#0f766e', beat: 2 },
    { navn: 'berbisk', ll: [-6, 31], dx: -60, dy: 70, farge: '#be123c', beat: 2 },
    { navn: 'spansk', ll: [-4, 40], dx: -150, dy: -10, farge: '#c2410c', beat: 2 },
    { navn: 'Balkan', ll: [21, 43], dx: 60, dy: 60, farge: '#1d4ed8', beat: 2 },
];

function VerdenKart({ beat }: { beat: number }) {
    const { geographies } = useFilmVerden();
    const proj = useMemo(() => lagProj(VERDEN_SV, VERDEN_NO), []);
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LngLat) => proj(ll) as [number, number];
    const [ox, oy] = p(OSLO);
    const bue = (fra: [number, number], til: [number, number]) => {
        const mx = (fra[0] + til[0]) / 2;
        const my = Math.min(fra[1], til[1]) - 120;
        return `M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`;
    };
    const engelsk: [number, number] = [260, 300];
    const samlet = beat >= 4;
    return (
        <svg
            viewBox={`0 0 ${B} ${H}`}
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
        >
            <Land geographies={geographies} sti={sti} />
            {SPRAK.filter((s) => beat >= s.beat).map((s) => {
                const [x, y] = p(s.ll);
                return (
                    <motion.path
                        key={s.navn}
                        d={bue([x, y], [ox, oy])}
                        fill="none"
                        stroke={s.farge}
                        strokeWidth={samlet ? 7 : 5}
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0.9 }}
                        animate={{ pathLength: 1, opacity: 0.9 }}
                        transition={{ duration: 1.4, delay: 0.3 }}
                    />
                );
            })}
            {beat >= 3 && (
                <motion.path
                    d={bue([engelsk[0] + 150, engelsk[1] + 40], [ox, oy])}
                    fill="none"
                    stroke="#0369a1"
                    strokeWidth={samlet ? 7 : 5}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, delay: 0.3 }}
                />
            )}
            {SPRAK.filter((s) => beat >= s.beat).map((s) => {
                const [x, y] = p(s.ll);
                const tekst = s.navn;
                const b = tekst.length * 32 * 0.55 + 36;
                return (
                    <motion.g
                        key={s.navn}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: samlet ? 0.75 : 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <circle
                            cx={x}
                            cy={y}
                            r={11}
                            fill={s.farge}
                            stroke="#ffffff"
                            strokeWidth={3}
                        />
                        <rect
                            x={x + s.dx - b / 2}
                            y={y + s.dy - 28}
                            width={b}
                            height={52}
                            rx={26}
                            fill={s.farge}
                        />
                        <text
                            x={x + s.dx}
                            y={y + s.dy + 10}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill="#ffffff"
                        >
                            {tekst}
                        </text>
                        {s.ord && (
                            <text
                                x={x + s.dx}
                                y={y + s.dy - 46}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={900}
                                fill={s.farge}
                                stroke="#ffffff"
                                strokeWidth={8}
                                paintOrder="stroke"
                            >
                                {s.ord}
                            </text>
                        )}
                    </motion.g>
                );
            })}
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <rect
                        x={engelsk[0] - 200}
                        y={engelsk[1] - 50}
                        width={400}
                        height={130}
                        rx={24}
                        fill="#0369a1"
                    />
                    <text
                        x={engelsk[0]}
                        y={engelsk[1]}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        engelsk
                    </text>
                    <text
                        x={engelsk[0]}
                        y={engelsk[1] + 50}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={700}
                        fill="#e0f2fe"
                    >
                        musikk, spill, videoer
                    </text>
                </motion.g>
            )}
            <motion.circle
                cx={ox}
                cy={oy}
                initial={false}
                animate={{ r: samlet ? 30 : 16 }}
                transition={{ duration: 0.6 }}
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth={5}
            />
            <text x={ox + 30} y={oy - 28} fontSize={38} fontWeight={900} fill="#0f172a">
                Oslo
            </text>
            {samlet && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    <rect x={ox + 60} y={oy + 10} width={520} height={74} rx={37} fill="#0f172a" />
                    <text
                        x={ox + 320}
                        y={oy + 59}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        ett felles ungdomsspråk
                    </text>
                </motion.g>
            )}
            {beat === 0 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <rect
                        x={ox + 60}
                        y={oy + 10}
                        width={470}
                        height={74}
                        rx={37}
                        fill="#ffffff"
                        stroke="#0f172a"
                        strokeWidth={4}
                    />
                    <text
                        x={ox + 295}
                        y={oy + 59}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#0f172a"
                    >
                        Hvor kommer ordene fra?
                    </text>
                </motion.g>
            )}
            <text x={50} y={880} fontSize={34} fontWeight={700} fill="#334155">
                Omtrent der språkene snakkes
            </text>
        </svg>
    );
}
