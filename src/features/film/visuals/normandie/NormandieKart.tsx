import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import { Oversiktskart } from '../../kart/Oversiktskart';
import type { VisualProps } from '../../types';

/**
 * Kart til Normandie-filmen.
 *
 *  - avtale: Seinen fra Paris til havet, Rollos land ved utløpet, andre vikinger holdes ute
 *  - verden: normannerne drar ut: England, Sør-Italia, Sicilia, Antiokia
 *  - 1066:   to trinn: Harald Hardråde til Stamford Bridge, Vilhelm til Hastings
 *
 * Landene er dagens. Rollos land og kongeriket Sicilia er tegnet for hånd og er omtrentlige.
 */

type Modus = 'avtale' | 'verden' | '1066';
type LngLat = [number, number];
type Pt = (ll: LngLat) => [number, number];

const B = 1600;
const H = 900;

const UTSNITT: Record<Modus, Utsnitt> = {
    avtale: [
        [-2.6, 47.9],
        [4.2, 50.7],
    ],
    verden: [
        [-12, 31],
        [42, 58],
    ],
    '1066': [
        [-8, 48.4],
        [14, 62],
    ],
};
const FINT: Record<Modus, boolean> = { avtale: true, verden: false, '1066': false };

const SEINEN: LngLat[] = [
    [2.35, 48.86],
    [2.2, 48.92],
    [2.04, 48.93],
    [1.72, 48.99],
    [1.48, 49.09],
    [1.4, 49.24],
    [1.09, 49.44],
    [0.8, 49.42],
    [0.5, 49.47],
    [0.1, 49.46],
];
const PARIS: LngLat = [2.35, 48.86];
/** Rollos land rundt utløpet av Seinen. Omtrentlig, og klippet etter kysten. */
const ROLLOS_LAND: LngLat[] = [
    [-0.3, 49.3],
    [0.0, 49.75],
    [1.2, 50.1],
    [1.75, 49.75],
    [1.75, 49.15],
    [1.3, 48.95],
    [0.6, 49.0],
    [0.0, 49.1],
];
const VIKINGER: LngLat[][] = [
    [
        [-1.6, 50.5],
        [-0.8, 50.0],
        [-0.25, 49.75],
    ],
    [
        [0.4, 50.65],
        [0.5, 50.35],
        [0.55, 50.08],
    ],
];

const NORMANDIE: LngLat = [0.6, 49.2];
const ENGLAND: LngLat = [-1.4, 52.4];
const PUGLIA: LngLat = [16.4, 40.9];
const SICILIA: LngLat = [14.2, 37.5];
const ANTIOKIA: LngLat = [36.16, 36.2];
const SICILIA_RIKE: LngLat[] = [
    [14.0, 42.0],
    [16.0, 42.2],
    [18.6, 40.4],
    [17.0, 38.8],
    [15.6, 37.8],
    [15.3, 36.6],
    [12.3, 37.6],
    [13.0, 38.4],
    [15.5, 38.9],
    [15.6, 40.0],
    [14.0, 40.9],
];
const RUTER: { id: string; pts: LngLat[]; beat: number }[] = [
    { id: 'eng', pts: [NORMANDIE, [-0.6, 50.6], ENGLAND], beat: 1 },
    { id: 'ita', pts: [NORMANDIE, [4.5, 46.5], [10, 44.2], [14.5, 42], PUGLIA], beat: 2 },
    { id: 'sic', pts: [[15.5, 40], [15.6, 38.6], SICILIA], beat: 3 },
    {
        id: 'ant',
        pts: [PUGLIA, [21, 40.6], [27, 40.4], [32.5, 38.5], ANTIOKIA],
        beat: 5,
    },
];

const NORGE_START: LngLat = [5.2, 60.6];
const HARALD: LngLat[] = [
    NORGE_START,
    [3.2, 58.6],
    [1.4, 56.4],
    [0.4, 54.6],
    [-0.2, 54.2],
    [-0.91, 53.99],
];
const STAMFORD: LngLat = [-0.91, 53.99];
const HASTINGS: LngLat = [0.57, 50.86];
const VILHELM: LngLat[] = [
    [0.0, 49.35],
    [0.1, 50.1],
    [0.57, 50.86],
];

const ROD = '#b91c1c';
const BLA = '#1d4ed8';
const GULL = '#b45309';

function lagProjeksjon(u: Utsnitt): GeoProjection {
    return geoMercator().fitExtent(
        [
            [30, 30],
            [B - 30, H - 30],
        ],
        { type: 'MultiPoint', coordinates: [u[0], u[1]] } as never
    );
}

function linje(p: GeoProjection, pts: LngLat[], lukk = false) {
    const d = pts
        .map((ll, i) => {
            const [x, y] = p(ll) as [number, number];
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(' ');
    return lukk ? `${d} Z` : d;
}

function kurve(p: GeoProjection, pts: LngLat[]) {
    const q = pts.map((ll) => p(ll) as [number, number]);
    let d = `M ${q[0][0]} ${q[0][1]}`;
    for (let i = 0; i < q.length - 1; i++) {
        const a = q[Math.max(0, i - 1)];
        const b = q[i];
        const c = q[i + 1];
        const e = q[Math.min(q.length - 1, i + 2)];
        const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
        const c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
        d += ` C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${c[0]} ${c[1]}`;
    }
    return d;
}

const OVERSKRIFT: Record<Modus, string[]> = {
    avtale: ['Avtalen i 911', 'Rollos land', 'Rollos land', 'Rollos land'],
    verden: [
        'Normannerne drar ut',
        'England, 1066',
        'Mot Middelhavet',
        'Sør-Italia og Sicilia',
        'Kongeriket Sicilia',
        'Det første korstoget',
    ],
    '1066': [
        '1066: to trinn',
        'Trinn 1: Harald Hardråde',
        'Trinn 1: Stamford Bridge',
        'Trinn 2: Vilhelm',
        'Trinn 2: Hastings',
    ],
};

export function NormandieKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'avtale';
    const utsnitt = UTSNITT[modus];
    const { geographies } = useFilmVerden(FINT[modus] ? utsnitt : undefined);
    const p = useMemo(() => lagProjeksjon(utsnitt), [utsnitt]);
    const sti = useMemo(() => geoPath(p), [p]);
    const pt: Pt = (ll) => p(ll) as [number, number];
    const frankrike = useMemo(
        () =>
            geographies
                .filter((g) => String((g as { id?: string | number }).id) === '250')
                .map((g) => sti(g as never) ?? '')
                .join(' '),
        [geographies, sti]
    );
    const italia = useMemo(
        () =>
            geographies
                .filter((g) => String((g as { id?: string | number }).id) === '380')
                .map((g) => sti(g as never) ?? '')
                .join(' '),
        [geographies, sti]
    );
    const overskrift = OVERSKRIFT[modus][Math.min(beat, OVERSKRIFT[modus].length - 1)];

    return (
        <div className="absolute inset-0 bg-[#bcd9ea] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <clipPath id="normandie-klipp-fr">
                        <path d={frankrike} />
                    </clipPath>
                    <clipPath id="normandie-klipp-it">
                        <path d={italia} />
                    </clipPath>
                </defs>
                <Land geographies={geographies} sti={sti} />
                {modus === 'avtale' && <Avtale beat={beat} p={p} pt={pt} />}
                {modus === 'verden' && <Verden beat={beat} p={p} pt={pt} />}
                {modus === '1066' && <Aar1066 beat={beat} p={p} pt={pt} />}
            </svg>

            <div className="absolute left-[2.5%] top-[4%] px-5 py-3 rounded-2xl bg-white/90 shadow-lg">
                <motion.div
                    key={overskrift}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-4xl font-display font-black text-slate-900"
                >
                    {overskrift}
                </motion.div>
            </div>
            {modus === 'avtale' && (
                <Oversiktskart
                    utsnitt={utsnitt}
                    omrade={[
                        [-11, 42],
                        [16, 60],
                    ]}
                    etikett="Frankrike"
                    plassering="nede-venstre"
                />
            )}
            <div className="absolute right-[2.5%] bottom-[3%] px-3 py-1 rounded-lg bg-white/85 text-lg font-bold text-slate-600">
                Omtrentlig. Landene er tegnet med dagens grenser
            </div>
        </div>
    );
}

const Land = memo(function Land({ geographies, sti }: { geographies: unknown[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill="#f3eee1"
                    stroke="#a8a08a"
                    strokeWidth={1.2}
                />
            ))}
        </>
    );
});

function Merke({
    xy,
    tekst,
    farge = '#0f172a',
    dx = 0,
    dy = 0,
    storrelse = 40,
    synlig = true,
    anker = 'middle',
}: {
    xy: [number, number];
    tekst: string;
    farge?: string;
    dx?: number;
    dy?: number;
    storrelse?: number;
    synlig?: boolean;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <motion.text
            x={xy[0] + dx}
            y={xy[1] + dy}
            textAnchor={anker}
            dominantBaseline="middle"
            fontSize={storrelse}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={8}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.7 }}
        >
            {tekst}
        </motion.text>
    );
}

function Pil({
    d,
    farge,
    synlig,
    bredde = 10,
}: {
    d: string;
    farge: string;
    synlig: boolean;
    bredde?: number;
}) {
    return (
        <motion.path
            d={d}
            fill="none"
            stroke={farge}
            strokeWidth={bredde}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: synlig ? 1 : 0, opacity: synlig ? 1 : 0 }}
            transition={{ duration: synlig ? 2 : 0.4 }}
        />
    );
}

function Spiss({
    fra,
    til,
    farge,
    synlig,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    synlig: boolean;
}) {
    const v = Math.atan2(til[1] - fra[1], til[0] - fra[0]);
    const s = 32;
    const a = [til[0] - Math.cos(v - 0.5) * s, til[1] - Math.sin(v - 0.5) * s];
    const b = [til[0] - Math.cos(v + 0.5) * s, til[1] - Math.sin(v + 0.5) * s];
    return (
        <motion.polygon
            points={`${til[0]},${til[1]} ${a[0]},${a[1]} ${b[0]},${b[1]}`}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ delay: synlig ? 1.8 : 0, duration: 0.3 }}
        />
    );
}

function Prikk({
    xy,
    farge,
    synlig = true,
    r = 14,
}: {
    xy: [number, number];
    farge: string;
    synlig?: boolean;
    r?: number;
}) {
    return (
        <motion.circle
            cx={xy[0]}
            cy={xy[1]}
            r={r}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={5}
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        />
    );
}

function PilMedSpiss({
    p,
    pts,
    farge,
    synlig,
    bredde,
}: {
    p: GeoProjection;
    pts: LngLat[];
    farge: string;
    synlig: boolean;
    bredde?: number;
}) {
    const q = pts.map((ll) => p(ll) as [number, number]);
    return (
        <>
            <Pil d={kurve(p, pts)} farge={farge} synlig={synlig} bredde={bredde} />
            <Spiss fra={q[q.length - 2]} til={q[q.length - 1]} farge={farge} synlig={synlig} />
        </>
    );
}

/* ---------- avtale ---------- */

function Avtale({ beat, p, pt }: { beat: number; p: GeoProjection; pt: Pt }) {
    return (
        <>
            <motion.path
                d={linje(p, ROLLOS_LAND, true)}
                fill={ROD}
                stroke="#ffffff"
                strokeWidth={4}
                clipPath="url(#normandie-klipp-fr)"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 1 ? 0.45 : 0 }}
                transition={{ duration: 1.2 }}
            />
            <path
                d={kurve(p, SEINEN)}
                fill="none"
                stroke="#2b6cb0"
                strokeWidth={12}
                strokeLinecap="round"
            />
            <Merke xy={pt([1.95, 49.25])} tekst="Seinen" farge="#1e3a8a" storrelse={42} />
            <Prikk xy={pt(PARIS)} farge="#0f172a" />
            <Merke xy={pt(PARIS)} tekst="Paris" dx={24} dy={4} anker="start" storrelse={44} />
            <Merke xy={pt([0.25, 49.42])} tekst="utløpet" dy={44} storrelse={32} farge="#1e3a8a" />
            <Merke
                xy={pt([1.3, 49.62])}
                tekst="Rollos land"
                farge="#7f1d1d"
                storrelse={50}
                synlig={beat >= 1}
            />
            {VIKINGER.map((v, i) => {
                const q = v.map(pt);
                return (
                    <g key={i}>
                        <Pil d={kurve(p, v)} farge="#334155" synlig={beat >= 2} bredde={9} />
                        <Spiss
                            fra={q[q.length - 2]}
                            til={q[q.length - 1]}
                            farge="#334155"
                            synlig={beat >= 2}
                        />
                    </g>
                );
            })}
            <Merke
                xy={pt([-1.6, 50.05])}
                tekst="andre vikinger"
                storrelse={34}
                farge="#334155"
                synlig={beat >= 2}
            />
            {beat >= 3 &&
                VIKINGER.map((v, i) => {
                    const [x, y] = pt(v[v.length - 1]);
                    return (
                        <motion.g
                            key={`skjold${i}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.3 }}
                        >
                            <circle
                                cx={x}
                                cy={y + 30}
                                r={26}
                                fill="#facc15"
                                stroke="#7f1d1d"
                                strokeWidth={6}
                            />
                            <circle cx={x} cy={y + 30} r={7} fill="#7f1d1d" />
                        </motion.g>
                    );
                })}
            <Merke
                xy={pt([0.9, 50.25])}
                tekst="Rollos menn vokter"
                storrelse={36}
                farge="#7f1d1d"
                synlig={beat >= 3}
            />
        </>
    );
}

/* ---------- verden ---------- */

function Verden({ beat, p, pt }: { beat: number; p: GeoProjection; pt: Pt }) {
    return (
        <>
            <motion.path
                d={linje(p, SICILIA_RIKE, true)}
                fill={GULL}
                stroke="#ffffff"
                strokeWidth={4}
                clipPath="url(#normandie-klipp-it)"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 4 ? 0.6 : 0 }}
                transition={{ duration: 1 }}
            />
            {RUTER.map((r) => (
                <PilMedSpiss
                    key={r.id}
                    p={p}
                    pts={r.pts}
                    farge={ROD}
                    synlig={beat >= r.beat}
                    bredde={9}
                />
            ))}
            <Prikk xy={pt(NORMANDIE)} farge={ROD} r={18} />
            <Merke
                xy={pt(NORMANDIE)}
                tekst="Normandie"
                dx={-26}
                dy={30}
                anker="end"
                storrelse={40}
                farge="#7f1d1d"
            />
            <Merke xy={pt(ENGLAND)} tekst="England" dy={-36} storrelse={38} synlig={beat >= 1} />
            <Merke
                xy={pt(ENGLAND)}
                tekst="1066"
                dy={4}
                dx={-80}
                storrelse={32}
                farge={ROD}
                synlig={beat >= 1}
            />
            <Merke
                xy={pt([8.5, 41.5])}
                tekst="leiesoldater"
                storrelse={30}
                farge="#7f1d1d"
                synlig={beat >= 2}
            />
            <Merke
                xy={pt([19.6, 42.6])}
                tekst="Puglia"
                anker="start"
                storrelse={32}
                synlig={beat >= 3}
            />
            <Merke
                xy={pt([17.8, 39.0])}
                tekst="Calabria"
                anker="start"
                storrelse={32}
                synlig={beat >= 3}
            />
            <Merke
                xy={pt([12.6, 36.0])}
                tekst="Sicilia"
                anker="end"
                storrelse={32}
                synlig={beat >= 3}
            />
            <Merke
                xy={pt([14.6, 34.3])}
                tekst="kongeriket Sicilia, 1100-tallet"
                storrelse={30}
                farge={GULL}
                synlig={beat >= 4}
            />
            <Merke
                xy={pt([20, 44.6])}
                tekst="1050-tallet"
                anker="start"
                storrelse={30}
                farge={ROD}
                synlig={beat >= 3 && beat < 4}
            />
            <Prikk xy={pt(ANTIOKIA)} farge={ROD} synlig={beat >= 5} />
            <Merke
                xy={pt(ANTIOKIA)}
                tekst="Antiokia"
                dy={44}
                anker="end"
                storrelse={36}
                synlig={beat >= 5}
            />
            <Merke
                xy={pt([27.5, 41.7])}
                tekst="første korstog"
                storrelse={30}
                farge="#7f1d1d"
                synlig={beat >= 5}
            />
        </>
    );
}

/* ---------- 1066 ---------- */

function Aar1066({ beat, p, pt }: { beat: number; p: GeoProjection; pt: Pt }) {
    const st = pt(STAMFORD);
    const ha = pt(HASTINGS);
    return (
        <>
            <PilMedSpiss p={p} pts={HARALD} farge={BLA} synlig={beat >= 1} />
            <Merke xy={pt([6.5, 61.2])} tekst="Norge" anker="start" storrelse={40} />
            <Merke
                xy={pt([3.0, 57.4])}
                tekst="Harald Hardråde"
                anker="start"
                storrelse={34}
                farge={BLA}
                synlig={beat >= 1}
            />
            <Prikk xy={st} farge={BLA} synlig={beat >= 2} />
            <Merke
                xy={st}
                tekst="Stamford Bridge"
                anker="end"
                dx={-24}
                storrelse={34}
                synlig={beat >= 2}
            />
            <Merke
                xy={st}
                tekst="25. september"
                anker="end"
                dx={-24}
                dy={40}
                storrelse={30}
                farge={BLA}
                synlig={beat >= 2}
            />
            {beat >= 2 && <Kryss xy={st} farge={BLA} />}
            <PilMedSpiss p={p} pts={VILHELM} farge={ROD} synlig={beat >= 3} />
            <Merke
                xy={pt([0.0, 49.35])}
                tekst="Normandie"
                dx={-24}
                anker="end"
                storrelse={36}
                farge="#7f1d1d"
            />
            <Merke
                xy={pt([1.2, 50.5])}
                tekst="Vilhelm fra Normandie"
                anker="start"
                storrelse={32}
                farge={ROD}
                synlig={beat >= 3}
            />
            <Prikk xy={ha} farge={ROD} synlig={beat >= 4} />
            <Merke
                xy={ha}
                tekst="Hastings, 14. oktober"
                anker="end"
                dx={-26}
                dy={-6}
                storrelse={34}
                synlig={beat >= 4}
            />
            <Merke xy={pt([-2.0, 52.0])} tekst="England" storrelse={40} />
        </>
    );
}

function Kryss({ xy, farge }: { xy: [number, number]; farge: string }) {
    const [x, y] = xy;
    const s = 16;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <line
                x1={x - s + 40}
                y1={y - s - 40}
                x2={x + s + 40}
                y2={y + s - 40}
                stroke={farge}
                strokeWidth={7}
                strokeLinecap="round"
            />
            <line
                x1={x + s + 40}
                y1={y - s - 40}
                x2={x - s + 40}
                y2={y + s - 40}
                stroke={farge}
                strokeWidth={7}
                strokeLinecap="round"
            />
        </motion.g>
    );
}
