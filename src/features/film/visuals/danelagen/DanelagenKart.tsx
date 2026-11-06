import { memo, useMemo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart over England i vikingtiden.
 *
 *  - erobring: hæren kommer til East Anglia, tre kongeriker faller, Wessex holder stand
 *  - deling:   grensen fra rundt 880: Wessex i sørvest, Danelagen i nordøst, Jorvik
 *  - nordsjo:  Knut den mektige: England, Danmark og Norge
 *  - slutt:    1066: Stamford Bridge og Hastings
 *
 * Kongerikene og grensen er tegnet for hånd og er omtrentlige. Landene under er dagens.
 */

type Modus = 'erobring' | 'deling' | 'nordsjo' | 'slutt';
type LngLat = [number, number];
type Pt = (ll: LngLat) => [number, number];

const B = 1600;
const H = 900;

const ENGLAND_UTSNITT: Utsnitt = [
    [-7.5, 49.8],
    [4.5, 56.2],
];
const UTSNITT: Record<Modus, Utsnitt> = {
    erobring: ENGLAND_UTSNITT,
    deling: ENGLAND_UTSNITT,
    slutt: ENGLAND_UTSNITT,
    nordsjo: [
        [-7, 49.5],
        [17, 63.5],
    ],
};

const STORBRITANNIA = '826';
const DANMARK = '208';
const NORGE = '578';

/* Kongerikene rundt 865. Omtrentlige, og klippet etter kystlinja. */
const NORTHUMBRIA: LngLat[] = [
    [-3.4, 56.0],
    [-1.6, 56.2],
    [0.5, 55.0],
    [1.2, 54.0],
    [0.6, 53.6],
    [-0.5, 53.55],
    [-1.5, 53.5],
    [-2.2, 53.4],
    [-3.3, 53.45],
    [-4.0, 54.2],
    [-3.8, 55.0],
];
const EAST_ANGLIA: LngLat[] = [
    [0.6, 53.6],
    [2.4, 53.4],
    [2.4, 51.8],
    [1.3, 51.75],
    [0.4, 51.9],
    [0.0, 52.1],
    [-0.2, 52.6],
    [0.2, 52.95],
];
const MERCIA: LngLat[] = [
    [-0.5, 53.55],
    [0.6, 53.6],
    [0.2, 52.95],
    [-0.2, 52.6],
    [0.0, 52.1],
    [-0.4, 51.75],
    [-1.4, 51.7],
    [-2.2, 51.75],
    [-2.7, 52.0],
    [-3.1, 52.4],
    [-3.1, 53.0],
    [-3.3, 53.45],
    [-2.2, 53.4],
    [-1.5, 53.5],
];
const WESSEX_865: LngLat[] = [
    [-6.5, 49.7],
    [-5.2, 51.3],
    [-3.1, 51.55],
    [-2.7, 51.62],
    [-2.2, 51.75],
    [-1.4, 51.7],
    [-0.4, 51.75],
    [0.4, 51.85],
    [1.3, 51.75],
    [2.0, 51.3],
    [1.6, 50.6],
    [-2.0, 50.2],
];

/* Grensen fra rundt 880: Themsen, elva Lea, Bedford og den gamle veien mot nordvest. */
const GRENSE: LngLat[] = [
    [1.0, 51.5],
    [0.0, 51.52],
    [-0.05, 51.8],
    [-0.47, 52.13],
    [-1.2, 52.4],
    [-1.9, 52.7],
    [-2.5, 53.0],
    [-3.05, 53.3],
];
const DANELAGEN: LngLat[] = [
    ...GRENSE,
    [-3.4, 53.5],
    [-4.0, 54.2],
    [-3.8, 55.0],
    [-3.4, 56.0],
    [-1.6, 56.2],
    [0.8, 55.0],
    [2.6, 53.4],
    [2.5, 51.7],
];
const WESSEX_880: LngLat[] = [
    [1.0, 51.5],
    [2.0, 51.3],
    [1.6, 50.6],
    [-2.0, 50.2],
    [-6.5, 49.7],
    [-5.2, 51.3],
    [-3.1, 51.55],
    [-2.7, 51.62],
    [-3.1, 52.4],
    [-3.1, 53.0],
    ...[...GRENSE].reverse().slice(0, -1),
];
/** Hele England: yttersiden av Danelagen og Wessex. */
const ENGLAND: LngLat[] = [...DANELAGEN.slice(GRENSE.length - 1), ...WESSEX_880.slice(1, 10)];

const YORK: LngLat = [-1.08, 53.96];
const STAMFORD: LngLat = [-0.91, 53.99];
const HASTINGS: LngLat = [0.57, 50.86];
const HAVET: LngLat[] = [
    [4.0, 53.6],
    [3.0, 53.2],
    [1.9, 52.8],
    [1.2, 52.6],
];

const RIKER = [
    { id: 'n', navn: 'Northumbria', pts: NORTHUMBRIA, merke: [-1.6, 54.7] as LngLat, beat: 2 },
    { id: 'e', navn: 'East Anglia', pts: EAST_ANGLIA, merke: [1.15, 52.35] as LngLat, beat: 2 },
    { id: 'm', navn: 'Mercia', pts: MERCIA, merke: [-1.8, 52.75] as LngLat, beat: 2 },
];

const ROD = '#b91c1c';
const BLA = '#1d4ed8';

function lagProjeksjon(u: Utsnitt): GeoProjection {
    return geoMercator().fitExtent(
        [
            [40, 40],
            [B - 40, H - 40],
        ],
        { type: 'MultiPoint', coordinates: [u[0], u[1]] } as never
    );
}

/** Planar sti gjennom projiserte punkter. Unngår vindingsfeil i d3 for egne polygoner. */
function linje(p: GeoProjection, pts: LngLat[], lukk = false) {
    const d = pts
        .map((ll, i) => {
            const [x, y] = p(ll) as [number, number];
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(' ');
    return lukk ? `${d} Z` : d;
}

/** Myk kurve gjennom punktene (Catmull-Rom til Bézier). */
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

export function DanelagenKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'erobring';
    const utsnitt = UTSNITT[modus];
    const { geographies } = useFilmVerden(utsnitt);
    const p = useMemo(() => lagProjeksjon(utsnitt), [utsnitt]);
    const sti = useMemo(() => geoPath(p), [p]);
    const pt: Pt = (ll) => p(ll) as [number, number];
    const britannia = useMemo(
        () =>
            geographies
                .filter((g) => String((g as { id?: string | number }).id) === STORBRITANNIA)
                .map((g) => sti(g as never) ?? '')
                .join(' '),
        [geographies, sti]
    );
    const klipp = `danelagen-klipp-${modus}`;

    return (
        <div className="absolute inset-0 bg-[#bcd9ea] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <clipPath id={klipp}>
                        <path d={britannia} />
                    </clipPath>
                </defs>
                <Land geographies={geographies} sti={sti} modus={modus} beat={beat} />
                <g clipPath={`url(#${klipp})`}>
                    {modus === 'erobring' && <ErobringFlater beat={beat} p={p} />}
                    {modus === 'deling' && <DelingFlater beat={beat} p={p} />}
                    {modus === 'nordsjo' && (
                        <motion.path
                            d={linje(p, ENGLAND, true)}
                            fill={ROD}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: beat >= 0 ? 0.55 : 0 }}
                            transition={{ duration: 1.2 }}
                        />
                    )}
                    {modus === 'slutt' && (
                        <path d={linje(p, ENGLAND, true)} fill="#e7d9b8" opacity={0.7} />
                    )}
                </g>

                {modus === 'erobring' && <ErobringLag beat={beat} p={p} pt={pt} />}
                {modus === 'deling' && <DelingLag beat={beat} p={p} pt={pt} />}
                {modus === 'nordsjo' && <NordsjoLag beat={beat} pt={pt} />}
                {modus === 'slutt' && <SluttLag beat={beat} pt={pt} />}
            </svg>

            <Kort modus={modus} beat={beat} />
            <div className="absolute right-[2.5%] bottom-[3%] px-3 py-1 rounded-lg bg-white/85 text-lg font-bold text-slate-600">
                {modus === 'nordsjo'
                    ? 'Omtrentlig. Landene er tegnet med dagens grenser'
                    : 'Omtrentlige grenser, tegnet for hånd'}
            </div>
        </div>
    );
}

const Land = memo(function Land({
    geographies,
    sti,
    modus,
    beat,
}: {
    geographies: unknown[];
    sti: GeoPath;
    modus: Modus;
    beat: number;
}) {
    return (
        <>
            {geographies.map((g, i) => {
                const id = String((g as { id?: string | number }).id ?? '');
                let fill = '#f3eee1';
                if (modus === 'nordsjo') {
                    if (id === DANMARK && beat >= 2) fill = '#e7a3a3';
                    if (id === NORGE && beat >= 3) fill = '#e7a3a3';
                }
                return (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={fill}
                        stroke="#a8a08a"
                        strokeWidth={1.2}
                        style={{ transition: 'fill 1s' }}
                    />
                );
            })}
        </>
    );
});

function Flate({
    d,
    farge,
    synlig,
    styrke = 0.5,
}: {
    d: string;
    farge: string;
    synlig: boolean;
    styrke?: number;
}) {
    return (
        <motion.path
            d={d}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={4}
            strokeLinejoin="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? styrke : 0 }}
            transition={{ duration: 1 }}
        />
    );
}

function Merke({
    xy,
    tekst,
    farge = '#0f172a',
    dy = 0,
    storrelse = 40,
    synlig = true,
    anker = 'middle',
}: {
    xy: [number, number];
    tekst: string;
    farge?: string;
    dy?: number;
    storrelse?: number;
    synlig?: boolean;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <motion.text
            x={xy[0]}
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
    const s = 30;
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

/* ---------- erobring ---------- */

function ErobringFlater({ beat, p }: { beat: number; p: GeoProjection }) {
    return (
        <>
            {RIKER.map((r) => (
                <Flate
                    key={r.id}
                    d={linje(p, r.pts, true)}
                    farge={beat >= r.beat ? ROD : '#94a3b8'}
                    synlig
                    styrke={beat >= r.beat ? 0.55 : 0.25}
                />
            ))}
            <Flate
                d={linje(p, WESSEX_865, true)}
                farge={beat >= 3 ? BLA : '#94a3b8'}
                synlig
                styrke={beat >= 3 ? 0.55 : 0.25}
            />
        </>
    );
}

function ErobringLag({ beat, p, pt }: { beat: number; p: GeoProjection; pt: Pt }) {
    const hav = HAVET.map(pt);
    return (
        <>
            <Pil d={kurve(p, HAVET)} farge="#0f172a" synlig />
            <Spiss fra={hav[hav.length - 2]} til={hav[hav.length - 1]} farge="#0f172a" synlig />
            <Merke xy={pt([3.6, 54.15])} tekst="Hæren, 865" storrelse={36} />

            {RIKER.map((r) => (
                <Merke
                    key={r.id}
                    xy={pt(r.merke)}
                    tekst={r.navn}
                    farge={beat >= r.beat ? '#7f1d1d' : '#334155'}
                    storrelse={beat >= r.beat ? 42 : 34}
                />
            ))}
            <Merke
                xy={pt([-2.6, 51.0])}
                tekst="Wessex"
                farge={beat >= 3 ? '#1e3a8a' : '#334155'}
                storrelse={beat >= 3 ? 52 : 34}
            />
            <Merke
                xy={pt([-2.6, 50.62])}
                tekst="kong Alfred"
                farge="#1e3a8a"
                storrelse={30}
                synlig={beat >= 3}
            />
        </>
    );
}

/* ---------- deling ---------- */

function DelingFlater({ beat, p }: { beat: number; p: GeoProjection }) {
    return (
        <>
            <Flate d={linje(p, WESSEX_880, true)} farge={BLA} synlig={beat >= 1} />
            <Flate d={linje(p, DANELAGEN, true)} farge={ROD} synlig={beat >= 2} />
        </>
    );
}

function DelingLag({ beat, p, pt }: { beat: number; p: GeoProjection; pt: Pt }) {
    return (
        <>
            <motion.path
                d={linje(p, GRENSE)}
                fill="none"
                stroke="#0f172a"
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.2 }}
            />
            <Merke xy={pt([-1.3, 52.15])} tekst="Grensen" storrelse={32} dy={34} anker="end" />
            <Merke
                xy={pt([-3.0, 51.0])}
                tekst="Wessex"
                farge="#1e3a8a"
                storrelse={56}
                synlig={beat >= 1}
            />
            <Merke
                xy={pt([-3.0, 50.6])}
                tekst="engelsk styre"
                farge="#1e3a8a"
                storrelse={30}
                synlig={beat >= 1}
            />
            <Merke
                xy={pt([-0.2, 53.4])}
                tekst="Danelagen"
                farge="#7f1d1d"
                storrelse={60}
                synlig={beat >= 2}
            />
            <Merke
                xy={pt([-0.2, 53.05])}
                tekst="dansk og norsk lov"
                farge="#7f1d1d"
                storrelse={30}
                synlig={beat >= 2}
            />
            <Prikk xy={pt(YORK)} farge="#7f1d1d" synlig={beat >= 2} />
            <Merke
                xy={pt(YORK)}
                tekst="Jorvik"
                farge="#7f1d1d"
                storrelse={32}
                dy={-34}
                synlig={beat >= 2}
            />
            {beat >= 3 &&
                (
                    [
                        [-1.6, 55.2],
                        [-2.5, 53.9],
                        [1.2, 52.45],
                    ] as LngLat[]
                ).map((ll, i) => <Lovrull key={i} xy={pt(ll)} forsinkelse={i * 0.3} />)}
        </>
    );
}

/** En lovrull: egne lover og skikker. */
function Lovrull({ xy, forsinkelse }: { xy: [number, number]; forsinkelse: number }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
        >
            <g transform={`translate(${xy[0]} ${xy[1]})`}>
                <rect
                    x={-26}
                    y={-32}
                    width={52}
                    height={64}
                    rx={6}
                    fill="#fef3c7"
                    stroke="#78350f"
                    strokeWidth={4}
                />
                <rect x={-32} y={-38} width={64} height={12} rx={6} fill="#b45309" />
                <rect x={-32} y={26} width={64} height={12} rx={6} fill="#b45309" />
                {[-14, -2, 10].map((y) => (
                    <rect key={y} x={-16} y={y} width={32} height={4} fill="#92400e" />
                ))}
            </g>
        </motion.g>
    );
}

/* ---------- nordsjo ---------- */

function NordsjoLag({ beat, pt }: { beat: number; pt: Pt }) {
    const fra = pt([10.0, 55.7]);
    const midt = pt([3.2, 55.2]);
    const til = pt([-0.6, 53.4]);
    const midtRike = pt([4.2, 57.2]);
    return (
        <>
            <Merke xy={pt([-2.0, 52.4])} tekst="England" farge="#7f1d1d" storrelse={46} />
            <Merke
                xy={pt([-2.0, 51.4])}
                tekst="1016"
                farge="#7f1d1d"
                storrelse={38}
                synlig={beat >= 2}
            />
            <Merke
                xy={pt([9.4, 56.1])}
                tekst="Danmark"
                farge={beat >= 2 ? '#7f1d1d' : '#334155'}
                storrelse={40}
                dy={-10}
            />
            <Merke
                xy={pt([9.4, 55.2])}
                tekst="1018"
                farge="#7f1d1d"
                storrelse={38}
                synlig={beat >= 2}
            />
            <Merke
                xy={pt([9.0, 61.6])}
                tekst="Norge"
                farge={beat >= 3 ? '#7f1d1d' : '#334155'}
                storrelse={40}
            />
            <Merke
                xy={pt([9.0, 60.7])}
                tekst="1028"
                farge="#7f1d1d"
                storrelse={38}
                synlig={beat >= 3}
            />
            <Merke
                xy={pt([4.4, 54.1])}
                tekst="Svein, så Knut"
                farge="#0f172a"
                storrelse={32}
                synlig={beat === 1}
            />
            <Merke
                xy={pt([2.6, 57.9])}
                tekst="Nordsjøen"
                anker="middle"
                farge="#1e3a8a"
                storrelse={38}
            />
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${midt[0]} ${midt[1] - 60} ${til[0]} ${til[1]}`}
                fill="none"
                stroke="#0f172a"
                strokeWidth={10}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2 }}
            />
            <Spiss fra={midt} til={til} farge="#0f172a" synlig />
            <motion.ellipse
                cx={midtRike[0]}
                cy={midtRike[1]}
                rx={600}
                ry={380}
                fill="none"
                stroke="#b91c1c"
                strokeWidth={8}
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 4 ? 0.9 : 0 }}
                transition={{ duration: 1 }}
            />
        </>
    );
}

/* ---------- slutt ---------- */

function SluttLag({ beat, pt }: { beat: number; pt: Pt }) {
    return (
        <>
            <Merke xy={pt([-1.6, 52.4])} tekst="England" farge="#334155" storrelse={42} />
            <Prikk xy={pt(STAMFORD)} farge="#0f172a" synlig={beat >= 1} r={18} />
            <Merke
                xy={pt(STAMFORD)}
                tekst="Stamford Bridge"
                storrelse={38}
                dy={-42}
                synlig={beat >= 1}
            />
            <Merke
                xy={pt(STAMFORD)}
                tekst="25. september 1066"
                farge="#7f1d1d"
                storrelse={32}
                dy={48}
                synlig={beat >= 1}
            />
            <Prikk xy={pt(HASTINGS)} farge="#0f172a" synlig={beat >= 3} r={18} />
            <Merke xy={pt(HASTINGS)} tekst="Hastings" storrelse={38} dy={-42} synlig={beat >= 3} />
            <Merke
                xy={pt(HASTINGS)}
                tekst="14. oktober 1066"
                farge="#1e3a8a"
                storrelse={32}
                dy={48}
                synlig={beat >= 3}
            />
        </>
    );
}

function Kort({ modus, beat }: { modus: Modus; beat: number }) {
    let innhold: { tittel: string; tekst?: string } | null = null;
    if (modus === 'erobring') {
        if (beat === 0)
            innhold = { tittel: 'Den store hedenske hæren', tekst: 'The Great Heathen Army' };
        if (beat === 1)
            innhold = {
                tittel: 'Ivar Beinlause',
                tekst: 'hevn for faren, Ragnar Lodbrok (sagaene)',
            };
        if (beat === 2) innhold = { tittel: 'Tre kongeriker faller' };
        if (beat >= 3) innhold = { tittel: 'Bare Wessex holder stand' };
    }
    if (modus === 'deling') {
        if (beat === 0) innhold = { tittel: 'Freden rundt 880', tekst: 'England deles i to' };
        if (beat === 1) innhold = { tittel: 'Wessex i sørvest' };
        if (beat === 2) innhold = { tittel: 'Danelagen i nordøst' };
        if (beat >= 3) innhold = { tittel: 'Egne skikker og egne lover' };
    }
    if (modus === 'nordsjo') {
        if (beat === 0)
            innhold = { tittel: 'Tidlig på 1000-tallet', tekst: 'danske konger tar hele England' };
        if (beat === 1)
            innhold = { tittel: 'Svein Tjugeskjegg', tekst: 'og sønnen Knut den mektige' };
        if (beat === 2) innhold = { tittel: 'Knut: England og Danmark' };
        if (beat === 3) innhold = { tittel: 'Og Norge', tekst: 'konge i alle tre til 1035' };
        if (beat >= 4) innhold = { tittel: 'Et rike rundt Nordsjøen' };
    }
    if (modus === 'slutt') {
        if (beat === 0) innhold = { tittel: '1066' };
        if (beat === 1) innhold = { tittel: 'Harald Hardråde faller' };
        if (beat === 2) innhold = { tittel: 'Slutten på vikingtiden?' };
        if (beat >= 3) innhold = { tittel: 'Normannerne vinner ved Hastings' };
    }
    if (!innhold) return null;
    return (
        <Boks key={innhold.tittel}>
            <div className="text-3xl font-black text-stone-900">{innhold.tittel}</div>
            {innhold.tekst && (
                <div className="text-xl font-semibold text-stone-500">{innhold.tekst}</div>
            )}
        </Boks>
    );
}

function Boks({ children }: { children: ReactNode }) {
    return (
        <div
            className="absolute flex justify-start pointer-events-none"
            style={{ top: '4%', left: '3%' }}
        >
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="px-7 py-3 rounded-2xl bg-white/95 shadow-xl border-b-4 border-red-800"
            >
                {children}
            </motion.div>
        </div>
    );
}
