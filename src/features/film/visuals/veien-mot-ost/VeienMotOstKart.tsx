import { memo, useMemo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart over vikingenes vei mot øst.
 *
 *  - ruter:     Østersjøen og elvene. Ruta over Ladoga og Onega til Volga og Bulgar, og
 *               ruta langs Dnjepr til Svartehavet og Bysants.
 *  - navn:      Roslagen, Ruotsi og rus. Til slutt lyser Russland og Belarus.
 *  - gardarike: Holmgard og Kønugard, riket med borgene, og slaverne rundt.
 *  - harald:    Harald Hardråde i Miklagard, slagene på Sicilia og i Bulgaria, og byttet
 *               som ble sendt til Jaroslav i Gardarike.
 *
 * Elvene, rutene og riket er tegnet for hånd og er omtrentlige. Landene under er dagens.
 */

type Modus = 'ruter' | 'navn' | 'gardarike' | 'harald';
type LngLat = [number, number];
type Pt = (ll: LngLat) => [number, number];

const B = 1600;
const H = 900;

const UTSNITT: Record<Modus, Utsnitt> = {
    ruter: [
        [12, 35],
        [52, 61.5],
    ],
    navn: [
        [6, 45],
        [52, 67],
    ],
    gardarike: [
        [18, 46],
        [44, 61.5],
    ],
    harald: [
        [6, 35],
        [44, 62],
    ],
};

const SVERIGE = '752';
const FINLAND = '246';
const RUSSLAND = '643';
const BELARUS = '112';
const UKRAINA = '804';
const TYRKIA = '792';
const BULGARIA = '100';
const NORGE = '578';

const VOLGA: LngLat[] = [
    [33.0, 57.2],
    [36.0, 57.6],
    [38.6, 57.7],
    [40.6, 57.6],
    [43.8, 56.3],
    [47.0, 56.0],
    [49.1, 55.6],
    [49.4, 54.0],
    [48.2, 52.2],
    [46.2, 49.8],
    [46.4, 48.2],
    [47.8, 46.4],
];
const DNJEPR: LngLat[] = [
    [33.2, 55.9],
    [32.0, 54.8],
    [30.6, 53.6],
    [30.5, 51.6],
    [30.5, 50.45],
    [32.0, 49.4],
    [34.6, 48.5],
    [35.0, 47.6],
    [34.0, 47.0],
    [32.6, 46.6],
];
const DON: LngLat[] = [
    [38.1, 53.9],
    [39.2, 52.0],
    [39.6, 50.4],
    [41.0, 49.1],
    [42.6, 48.2],
    [40.8, 47.6],
    [39.3, 47.1],
];

/** Ruta over Ladoga og Onega til Volga og Bulgar. */
const RUTE_VOLGA: LngLat[] = [
    [18.6, 59.7],
    [22.5, 59.8],
    [27.5, 60.0],
    [30.4, 60.0],
    [31.4, 60.7],
    [33.5, 61.0],
    [35.2, 61.5],
    [36.2, 60.4],
    [37.2, 58.6],
    [38.6, 57.7],
    [40.6, 57.6],
    [43.8, 56.3],
    [47.0, 56.0],
    [49.1, 55.0],
];
/** Ruta langs Dnjepr til Svartehavet og Konstantinopel. */
const RUTE_DNJEPR: LngLat[] = [
    [18.6, 59.5],
    [23.0, 59.4],
    [28.0, 59.8],
    [30.4, 59.9],
    [31.6, 60.4],
    [31.6, 59.2],
    [31.3, 58.5],
    [31.3, 57.0],
    [31.9, 55.4],
    [30.6, 53.6],
    [30.5, 51.6],
    [30.5, 50.45],
    [32.0, 49.4],
    [34.6, 48.5],
    [34.0, 47.0],
    [32.0, 46.0],
    [30.4, 44.0],
    [29.2, 41.6],
    [28.97, 41.01],
];

const LADOGA: LngLat = [31.5, 60.85];
const ONEGA: LngLat = [35.4, 61.6];
const BULGAR: LngLat = [49.06, 54.98];
const KONSTANTINOPEL: LngLat = [28.97, 41.01];
const NOVGOROD: LngLat = [31.27, 58.52];
const KYIV: LngLat = [30.52, 50.45];
const ROSLAGEN: LngLat = [18.7, 59.95];
const SICILIA: LngLat = [14.2, 37.5];
const BULGARIA_SLAG: LngLat = [25.3, 42.8];

/** Gardarike, omtrentlig: et bånd langs elvene fra Ladoga til Kyiv. */
const GARDARIKE: LngLat[] = [
    [28.5, 60.4],
    [32.6, 60.6],
    [34.8, 58.6],
    [34.6, 55.6],
    [33.6, 52.6],
    [32.6, 49.6],
    [29.6, 49.6],
    [28.4, 51.8],
    [28.8, 54.8],
    [27.6, 57.4],
];

const ROD = '#b91c1c';
const GULL = '#b45309';
const ELV = '#3b82c4';

function lagProjeksjon(u: Utsnitt): GeoProjection {
    return geoMercator().fitExtent(
        [
            [40, 40],
            [B - 40, H - 40],
        ],
        { type: 'MultiPoint', coordinates: [u[0], u[1]] } as never
    );
}

/** Planar sti gjennom projiserte punkter. */
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
    let d = `M ${q[0][0].toFixed(1)} ${q[0][1].toFixed(1)}`;
    for (let i = 0; i < q.length - 1; i++) {
        const a = q[Math.max(0, i - 1)];
        const b = q[i];
        const c = q[i + 1];
        const e = q[Math.min(q.length - 1, i + 2)];
        const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
        const c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
        d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`;
    }
    return d;
}

export function VeienMotOstKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'ruter';
    const utsnitt = UTSNITT[modus];
    const { geographies } = useFilmVerden();
    const p = useMemo(() => lagProjeksjon(utsnitt), [utsnitt]);
    const sti = useMemo(() => geoPath(p), [p]);
    const pt: Pt = (ll) => p(ll) as [number, number];

    return (
        <div className="absolute inset-0 bg-[#bcd9ea] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land geographies={geographies} sti={sti} modus={modus} beat={beat} />
                {modus === 'ruter' && <RuterLag beat={beat} p={p} pt={pt} />}
                {modus === 'navn' && <NavnLag beat={beat} pt={pt} />}
                {modus === 'gardarike' && <GardarikeLag beat={beat} p={p} pt={pt} />}
                {modus === 'harald' && <HaraldLag beat={beat} p={p} pt={pt} />}
            </svg>

            <Kort modus={modus} beat={beat} />
            <div className="absolute right-[2.5%] bottom-[3%] px-3 py-1 rounded-lg bg-white/85 text-lg font-bold text-slate-600">
                Omtrentlig. Landene er tegnet med dagens grenser
            </div>
        </div>
    );
}

function landFarge(id: string, modus: Modus, beat: number) {
    if (modus === 'navn') {
        if (id === SVERIGE && beat >= 0) return '#f2d6a2';
        if (id === FINLAND && beat >= 1) return '#cfe0c3';
        if ((id === RUSSLAND || id === BELARUS) && beat >= 3) return '#e7a3a3';
    }
    if (modus === 'ruter' && id === SVERIGE) return '#f2d6a2';
    if (modus === 'ruter' && id === TYRKIA && beat >= 3) return '#e9d3a8';
    if (modus === 'gardarike' && (id === RUSSLAND || id === UKRAINA || id === BELARUS))
        return '#efe6d2';
    if (modus === 'harald') {
        if (id === TYRKIA) return '#e9d3a8';
        if (id === BULGARIA && beat >= 3) return '#e7a3a3';
        if (id === NORGE) return '#f2d6a2';
    }
    return '#f3eee1';
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
                return (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={landFarge(id, modus, beat)}
                        stroke="#a8a08a"
                        strokeWidth={1.2}
                        style={{ transition: 'fill 1s' }}
                    />
                );
            })}
        </>
    );
});

function Merke({
    xy,
    tekst,
    farge = '#0f172a',
    dy = 0,
    dx = 0,
    storrelse = 40,
    synlig = true,
    anker = 'middle',
    kursiv = false,
}: {
    xy: [number, number];
    tekst: string;
    farge?: string;
    dy?: number;
    dx?: number;
    storrelse?: number;
    synlig?: boolean;
    anker?: 'start' | 'middle' | 'end';
    kursiv?: boolean;
}) {
    return (
        <motion.text
            x={xy[0] + dx}
            y={xy[1] + dy}
            textAnchor={anker}
            dominantBaseline="middle"
            fontSize={storrelse}
            fontWeight={900}
            fontStyle={kursiv ? 'italic' : 'normal'}
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

function Strek({
    d,
    farge,
    synlig,
    bredde = 10,
    varighet = 2.4,
}: {
    d: string;
    farge: string;
    synlig: boolean;
    bredde?: number;
    varighet?: number;
}) {
    return (
        <motion.path
            d={d}
            fill="none"
            stroke={farge}
            strokeWidth={bredde}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: synlig ? 1 : 0, opacity: synlig ? 1 : 0 }}
            transition={{ duration: synlig ? varighet : 0.4 }}
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

/** Innsjø som en enkel ellipse (innsjøene finnes ikke i landkartet). */
function Sjo({ xy, rx, ry }: { xy: [number, number]; rx: number; ry: number }) {
    return (
        <ellipse
            cx={xy[0]}
            cy={xy[1]}
            rx={rx}
            ry={ry}
            fill="#bcd9ea"
            stroke="#8fb8d4"
            strokeWidth={2}
        />
    );
}

/** En borg: en liten mur med tårn. */
function Borg({
    xy,
    synlig,
    forsinkelse = 0,
}: {
    xy: [number, number];
    synlig: boolean;
    forsinkelse?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6, delay: synlig ? forsinkelse : 0 }}
        >
            <g transform={`translate(${xy[0]} ${xy[1]})`}>
                <rect
                    x={-30}
                    y={-22}
                    width={60}
                    height={34}
                    fill="#78350f"
                    stroke="#fff"
                    strokeWidth={4}
                />
                <rect
                    x={-36}
                    y={-40}
                    width={18}
                    height={52}
                    fill="#92400e"
                    stroke="#fff"
                    strokeWidth={4}
                />
                <rect
                    x={18}
                    y={-40}
                    width={18}
                    height={52}
                    fill="#92400e"
                    stroke="#fff"
                    strokeWidth={4}
                />
            </g>
        </motion.g>
    );
}

/* ---------- ruter ---------- */

function RuterLag({ beat, p, pt }: { beat: number; p: GeoProjection; pt: Pt }) {
    return (
        <>
            <Sjo xy={pt(LADOGA)} rx={34} ry={46} />
            <Sjo xy={pt(ONEGA)} rx={26} ry={44} />
            <Strek d={kurve(p, VOLGA)} farge={ELV} synlig bredde={7} />
            <Strek d={kurve(p, DNJEPR)} farge={ELV} synlig bredde={7} />
            <Strek d={kurve(p, DON)} farge={ELV} synlig bredde={7} />
            <Merke
                xy={pt([46.6, 51.2])}
                tekst="Volga"
                farge="#1e3a8a"
                storrelse={36}
                kursiv
                dx={36}
                anker="start"
            />
            <Merke
                xy={pt([30.5, 52.4])}
                tekst="Dnjepr"
                farge="#1e3a8a"
                storrelse={36}
                kursiv
                dx={-22}
                anker="end"
            />
            <Merke
                xy={pt([39.9, 50.2])}
                tekst="Don"
                farge="#1e3a8a"
                storrelse={36}
                kursiv
                dx={22}
                anker="start"
            />
            <Merke xy={pt([19.4, 57.4])} tekst="Østersjøen" farge="#1e3a8a" storrelse={36} kursiv />
            <Merke
                xy={pt([37.0, 43.2])}
                tekst="Svartehavet"
                farge="#1e3a8a"
                storrelse={36}
                kursiv
            />
            <Merke xy={pt([15.6, 61.2])} tekst="Sverige" farge="#78350f" storrelse={36} />

            <Strek
                d={kurve(p, RUTE_VOLGA)}
                farge={ROD}
                synlig={beat >= 1}
                bredde={12}
                varighet={3}
            />
            <Merke
                xy={pt(LADOGA)}
                tekst="Ladoga"
                storrelse={30}
                dx={-46}
                anker="end"
                synlig={beat >= 1}
            />
            <Merke
                xy={pt(ONEGA)}
                tekst="Onega"
                storrelse={30}
                dx={34}
                dy={40}
                anker="start"
                synlig={beat >= 1}
            />
            <Prikk xy={pt(BULGAR)} farge={ROD} synlig={beat >= 1} r={16} />
            <Merke
                xy={pt(BULGAR)}
                tekst="Bulgar"
                farge="#7f1d1d"
                storrelse={38}
                dy={-40}
                synlig={beat >= 1}
            />

            <Strek
                d={kurve(p, RUTE_DNJEPR)}
                farge={GULL}
                synlig={beat >= 2}
                bredde={12}
                varighet={3}
            />
            <Prikk xy={pt(KONSTANTINOPEL)} farge={GULL} synlig={beat >= 3} r={20} />
            <Merke
                xy={pt(KONSTANTINOPEL)}
                tekst="Konstantinopel"
                farge="#78350f"
                storrelse={40}
                dx={34}
                anker="start"
                synlig={beat >= 3}
            />
            <Merke
                xy={pt([33.5, 39.6])}
                tekst="Bysants"
                farge="#78350f"
                storrelse={46}
                synlig={beat >= 3}
            />
        </>
    );
}

/* ---------- navn ---------- */

function NavnLag({ beat, pt }: { beat: number; pt: Pt }) {
    return (
        <>
            <Merke xy={pt([15.2, 63.0])} tekst="Sverige" farge="#78350f" storrelse={42} />
            <Merke
                xy={pt([25.8, 63.4])}
                tekst="Finland"
                farge="#166534"
                storrelse={38}
                synlig={beat >= 1}
            />
            <Merke
                xy={pt([25.8, 62.0])}
                tekst="Ruotsi = Sverige"
                farge="#166534"
                storrelse={34}
                synlig={beat >= 1}
            />
            <Prikk xy={pt(ROSLAGEN)} farge={ROD} synlig={beat >= 2} r={16} />
            <Merke
                xy={pt(ROSLAGEN)}
                tekst="Roslagen"
                farge="#7f1d1d"
                storrelse={36}
                dx={-26}
                dy={50}
                anker="end"
                synlig={beat >= 2}
            />
            <Merke
                xy={pt([10.5, 56.0])}
                tekst="Roden: roflotilje"
                farge="#7f1d1d"
                storrelse={32}
                anker="start"
                synlig={beat >= 2}
            />
            <Merke
                xy={pt([42.0, 57.0])}
                tekst="Russland"
                farge="#7f1d1d"
                storrelse={56}
                synlig={beat >= 3}
            />
            <Merke
                xy={pt([27.9, 53.4])}
                tekst="Belarus"
                farge="#7f1d1d"
                storrelse={44}
                synlig={beat >= 3}
            />
            <Merke
                xy={pt([36.0, 52.0])}
                tekst="rus"
                farge="#0f172a"
                storrelse={60}
                kursiv
                synlig={beat === 0}
            />
        </>
    );
}

/* ---------- gardarike ---------- */

function GardarikeLag({ beat, p, pt }: { beat: number; p: GeoProjection; pt: Pt }) {
    const slavisk = beat >= 4;
    return (
        <>
            <Sjo xy={pt(LADOGA)} rx={46} ry={64} />
            <Strek d={kurve(p, DNJEPR)} farge={ELV} synlig bredde={9} />
            <motion.path
                d={linje(p, GARDARIKE, true)}
                fill={slavisk ? '#7c3aed' : ROD}
                stroke="#ffffff"
                strokeWidth={5}
                strokeLinejoin="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 2 ? 0.32 : 0 }}
                transition={{ duration: 1 }}
            />
            <Borg xy={pt([29.2, 56.2])} synlig={beat >= 0} />
            <Borg xy={pt([31.4, 53.6])} synlig={beat >= 0} forsinkelse={0.3} />
            <Borg xy={pt([31.0, 52.0])} synlig={beat >= 0} forsinkelse={0.6} />
            <Prikk xy={pt(NOVGOROD)} farge={ROD} synlig={beat >= 1} r={20} />
            <Merke
                xy={pt(NOVGOROD)}
                tekst="Holmgard"
                farge="#7f1d1d"
                storrelse={42}
                dx={34}
                dy={-10}
                anker="start"
                synlig={beat >= 1}
            />
            <Merke
                xy={pt(NOVGOROD)}
                tekst="i dag Novgorod"
                farge="#334155"
                storrelse={30}
                dx={34}
                dy={32}
                anker="start"
                synlig={beat >= 1}
            />
            <Prikk xy={pt(KYIV)} farge={ROD} synlig={beat >= 1} r={beat >= 2 ? 28 : 20} />
            <Merke
                xy={pt(KYIV)}
                tekst="Kønugard"
                farge="#7f1d1d"
                storrelse={42}
                dx={40}
                dy={-10}
                anker="start"
                synlig={beat >= 1}
            />
            <Merke
                xy={pt(KYIV)}
                tekst={beat >= 2 ? 'i dag Kyiv, hovedstaden' : 'i dag Kyiv'}
                farge="#334155"
                storrelse={30}
                dx={40}
                dy={32}
                anker="start"
                synlig={beat >= 1}
            />
            <Merke
                xy={pt([38.6, 55.0])}
                tekst="Gardarike"
                farge="#7f1d1d"
                storrelse={58}
                synlig={beat >= 2 && !slavisk}
            />
            <Merke
                xy={pt([38.6, 54.0])}
                tekst="riket med borgene"
                farge="#7f1d1d"
                storrelse={32}
                synlig={beat >= 2 && !slavisk}
            />
            <Merke
                xy={pt([38.6, 55.0])}
                tekst="Slavisk språk"
                farge="#5b21b6"
                storrelse={52}
                synlig={slavisk}
            />
            <Merke
                xy={pt([38.6, 54.0])}
                tekst="og slavisk kultur"
                farge="#5b21b6"
                storrelse={34}
                synlig={slavisk}
            />
        </>
    );
}

/* ---------- harald ---------- */

function HaraldLag({ beat, p, pt }: { beat: number; p: GeoProjection; pt: Pt }) {
    const k = pt(KONSTANTINOPEL);
    return (
        <>
            <Prikk xy={k} farge={GULL} r={beat >= 2 ? 26 : 20} />
            <Merke
                xy={k}
                tekst="Miklagard"
                farge="#78350f"
                storrelse={44}
                dx={36}
                dy={-6}
                anker="start"
            />
            <Merke
                xy={k}
                tekst="Konstantinopel"
                farge="#334155"
                storrelse={28}
                dx={36}
                dy={34}
                anker="start"
            />
            <Merke xy={pt([9.5, 61.0])} tekst="Norge" farge="#78350f" storrelse={40} />
            <motion.circle
                cx={k[0]}
                cy={k[1]}
                fill="none"
                stroke={GULL}
                strokeWidth={6}
                initial={{ r: 20, opacity: 0 }}
                animate={{ r: beat >= 1 ? 70 : 20, opacity: beat >= 1 && beat <= 2 ? 0.9 : 0 }}
                transition={{ duration: 1 }}
            />
            <Merke
                xy={k}
                tekst="Harald Hardråde"
                farge="#0f172a"
                storrelse={40}
                dy={-96}
                synlig={beat <= 2}
            />
            <Merke
                xy={k}
                tekst="leder for væringene"
                farge="#7f1d1d"
                storrelse={34}
                dy={84}
                dx={-40}
                anker="end"
                synlig={beat === 2}
            />

            <Strek
                d={kurve(p, [KONSTANTINOPEL, [22.0, 39.0], [17.6, 37.4], SICILIA])}
                farge={ROD}
                synlig={beat >= 3}
                bredde={9}
            />
            <Strek
                d={kurve(p, [KONSTANTINOPEL, [27.0, 42.2], BULGARIA_SLAG])}
                farge={ROD}
                synlig={beat >= 3}
                bredde={9}
            />
            <Prikk xy={pt(SICILIA)} farge={ROD} synlig={beat >= 3} />
            <Merke
                xy={pt(SICILIA)}
                tekst="Sicilia"
                farge="#7f1d1d"
                storrelse={36}
                dy={-38}
                synlig={beat >= 3}
            />
            <Prikk xy={pt(BULGARIA_SLAG)} farge={ROD} synlig={beat >= 3} />
            <Merke
                xy={pt(BULGARIA_SLAG)}
                tekst="Bulgaria"
                farge="#7f1d1d"
                storrelse={36}
                dy={-38}
                synlig={beat >= 3}
            />

            <Strek
                d={kurve(p, [KONSTANTINOPEL, [30.0, 44.5], [32.0, 46.6], KYIV])}
                farge={GULL}
                synlig={beat >= 4}
                bredde={12}
            />
            <Prikk xy={pt(KYIV)} farge={GULL} synlig={beat >= 4} r={18} />
            <Merke
                xy={pt(KYIV)}
                tekst="Gardarike"
                farge="#78350f"
                storrelse={40}
                dx={30}
                anker="start"
                synlig={beat >= 4}
            />
            <Merke
                xy={pt(KYIV)}
                tekst="fyrst Jaroslav"
                farge="#334155"
                storrelse={28}
                dx={30}
                dy={38}
                anker="start"
                synlig={beat >= 4}
            />
        </>
    );
}

function Kort({ modus, beat }: { modus: Modus; beat: number }) {
    let innhold: { tittel: string; tekst?: string } | null = null;
    if (modus === 'ruter') {
        if (beat === 0) innhold = { tittel: 'Elvene i øst', tekst: 'en motorvei av vann' };
        if (beat === 1)
            innhold = { tittel: 'Rute 1: til Volga', tekst: 'over Ladoga og Onega til Bulgar' };
        if (beat === 2) innhold = { tittel: 'Rute 2: langs Dnjepr', tekst: 'ned til Svartehavet' };
        if (beat >= 3)
            innhold = { tittel: 'Målet: Bysants', tekst: 'riket til keiseren i Konstantinopel' };
    }
    if (modus === 'navn') {
        if (beat === 0) innhold = { tittel: 'De kalte seg rus' };
        if (beat === 1)
            innhold = { tittel: 'Trolig fra Ruotsi', tekst: 'det finske navnet på Sverige' };
        if (beat === 2) innhold = { tittel: 'Roslagen', tekst: 'het før Roden: roflotilje' };
        if (beat >= 3) innhold = { tittel: 'Rus lever videre', tekst: 'i Russland og Belarus' };
    }
    if (modus === 'gardarike') {
        if (beat === 0) innhold = { tittel: 'Befestede byer', tekst: 'borger langs elvene' };
        if (beat === 1) innhold = { tittel: 'Holmgard og Kønugard', tekst: 'Novgorod og Kyiv' };
        if (beat === 2) innhold = { tittel: 'Gardarike', tekst: 'riket med borgene' };
        if (beat === 3)
            innhold = { tittel: 'Trolig midt på 800-tallet', tekst: 'grunnlagt av skandinaver' };
        if (beat >= 4)
            innhold = { tittel: 'På 900-tallet', tekst: 'slukt av den slaviske befolkningen' };
    }
    if (modus === 'harald') {
        if (beat === 0)
            innhold = { tittel: 'Harald Hardråde', tekst: 'kom til Miklagard i 1034 eller 1035' };
        if (beat === 1)
            innhold = { tittel: 'Kriger av kongelig slekt', tekst: 'en rask vei oppover' };
        if (beat === 2) innhold = { tittel: 'Trolig øverste leder', tekst: 'for væringene' };
        if (beat === 3)
            innhold = { tittel: '18 større slag', tekst: 'blant annet på Sicilia og i Bulgaria' };
        if (beat >= 4)
            innhold = {
                tittel: 'Byttet sendt i forveien',
                tekst: 'til fyrst Jaroslav i Gardarike',
            };
    }
    if (!innhold) return null;
    return (
        <Boks key={innhold.tittel} hoyre={modus === 'ruter' || modus === 'harald'}>
            <div className="text-3xl font-black text-stone-900">{innhold.tittel}</div>
            {innhold.tekst && (
                <div className="text-xl font-semibold text-stone-500">{innhold.tekst}</div>
            )}
        </Boks>
    );
}

function Boks({ children, hoyre = false }: { children: ReactNode; hoyre?: boolean }) {
    return (
        <div
            className="absolute flex justify-start pointer-events-none"
            style={hoyre ? { top: '4%', right: '3%' } : { top: '4%', left: '3%' }}
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
