import { memo, useMemo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import { Oversiktskart } from '../../kart/Oversiktskart';
import type { VisualProps } from '../../types';

/**
 * Kart over Norden og Frankerriket rundt år 800.
 *
 *  - karl:    Danmark, Frankerriket i sør og sakserne rett imellom
 *  - flukt:   flyktninger fra sakserne mot Danmark, og trusselen fra sør
 *  - ejderen: Jylland nært: Dannevirke og elva Ejderen, grensen fra 811
 *  - tokt:    angrepene: Lindisfarne, opp Seinen mot Paris og langs kysten av England
 *
 * Frankerriket og Sachsen er tegnet for hånd og er omtrentlige. Landene under er dagens.
 */

type Modus = 'karl' | 'flukt' | 'ejderen' | 'tokt';
type LngLat = [number, number];

const B = 1600;
const H = 900;

const UTSNITT: Record<Modus, Utsnitt> = {
    karl: [
        [-6, 41],
        [24, 60],
    ],
    flukt: [
        [1, 47],
        [19, 58.5],
    ],
    ejderen: [
        [6.6, 53.4],
        [13.2, 57.6],
    ],
    tokt: [
        [-7, 47.5],
        [16, 60],
    ],
};

/** Frankerriket mot slutten av 700-tallet, uten Sachsen. Omtrentlig. */
const FRANKERRIKET: LngLat[] = [
    [-1.8, 43.3],
    [-1.2, 46.2],
    [-4.5, 47.9],
    [-1.6, 49.7],
    [1.6, 50.9],
    [4.2, 51.7],
    [6.6, 53.2],
    [7.2, 52.1],
    [8.4, 50.6],
    [11.0, 50.3],
    [12.8, 49.5],
    [13.8, 48.5],
    [16.0, 48.2],
    [15.0, 46.6],
    [13.7, 45.6],
    [13.4, 43.6],
    [12.5, 42.0],
    [11.0, 42.4],
    [10.2, 43.9],
    [8.0, 44.2],
    [7.0, 43.6],
    [4.5, 43.4],
    [3.2, 42.0],
    [1.5, 41.3],
    [0.5, 42.3],
];

/** Sachsen, sør for Danmark i dagens Nord-Tyskland. Omtrentlig. */
const SACHSEN: LngLat[] = [
    [7.2, 52.1],
    [6.6, 53.2],
    [8.5, 53.6],
    [9.4, 54.0],
    [10.9, 53.9],
    [11.6, 53.0],
    [12.0, 52.0],
    [11.5, 51.3],
    [10.0, 50.9],
    [8.4, 50.6],
];

const DANNEVIRKE: LngLat[] = [
    [9.33, 54.45],
    [9.42, 54.47],
    [9.5, 54.49],
    [9.57, 54.5],
];
const EJDEREN: LngLat[] = [
    [8.85, 54.28],
    [9.08, 54.37],
    [9.35, 54.3],
    [9.67, 54.3],
    [9.85, 54.25],
    [10.05, 54.2],
];

const NORDEN: LngLat = [8.4, 57.6];
const LINDISFARNE: LngLat = [-1.8, 55.68];
const PARIS: LngLat = [2.35, 48.86];
const TIL_LINDISFARNE: LngLat[] = [NORDEN, [4.5, 57.2], [1.0, 56.4], [-1.4, 55.8]];
const TIL_PARIS: LngLat[] = [
    NORDEN,
    [6.5, 56.3],
    [3.4, 53.0],
    [1.7, 51.1],
    [0.1, 49.6],
    [1.0, 49.3],
    [1.9, 49.0],
    PARIS,
];
const ENGLANDSKYSTEN: LngLat[] = [
    [1.9, 52.6],
    [1.6, 51.5],
    [0.4, 50.8],
    [-1.6, 50.6],
    [-3.4, 50.4],
];
const FLYKT: LngLat[][] = [
    [
        [9.0, 53.0],
        [9.3, 54.2],
        [9.2, 55.4],
    ],
    [
        [10.4, 52.8],
        [10.0, 54.1],
        [9.8, 55.3],
    ],
    [
        [8.0, 52.6],
        [8.6, 54.0],
        [8.8, 55.6],
    ],
];

const DANMARK = '208';
const NORDISKE = new Set(['208', '578', '752']);

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

export function HypotesenKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'karl';
    const utsnitt = UTSNITT[modus];
    const { geographies } = useFilmVerden(modus === 'ejderen' ? utsnitt : undefined);
    const p = useMemo(() => lagProjeksjon(utsnitt), [utsnitt]);
    const sti = useMemo(() => geoPath(p), [p]);
    const pt = (ll: LngLat) => p(ll) as [number, number];

    const frankerriket = linje(p, FRANKERRIKET, true);
    const sachsen = linje(p, SACHSEN, true);

    const visRiket = (modus === 'karl' && beat >= 1) || modus === 'flukt' || modus === 'tokt';
    const visSachsen = (modus === 'karl' && beat >= 3) || modus === 'flukt';

    return (
        <div className="absolute inset-0 bg-[#bcd9ea] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land
                    geographies={geographies}
                    sti={sti}
                    utheve={modus === 'ejderen' ? new Set([DANMARK]) : NORDISKE}
                />

                {modus !== 'ejderen' && (
                    <>
                        <motion.path
                            d={frankerriket}
                            fill="#b91c1c"
                            stroke="#7f1d1d"
                            strokeWidth={3}
                            strokeLinejoin="round"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: visRiket ? (modus === 'tokt' ? 0.22 : 0.42) : 0,
                            }}
                            transition={{ duration: 1.2 }}
                        />
                        <motion.path
                            d={sachsen}
                            fill="#ea580c"
                            stroke="#9a3412"
                            strokeWidth={3}
                            strokeLinejoin="round"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: visSachsen ? 0.6 : 0 }}
                            transition={{ duration: 1 }}
                        />
                    </>
                )}

                {modus === 'karl' && <KarlLag beat={beat} pt={pt} />}
                {modus === 'flukt' && <FluktLag beat={beat} p={p} pt={pt} />}
                {modus === 'ejderen' && <EjderLag beat={beat} p={p} pt={pt} />}
                {modus === 'tokt' && <ToktLag beat={beat} p={p} pt={pt} />}
            </svg>

            {modus === 'ejderen' && (
                <Oversiktskart
                    utsnitt={utsnitt}
                    omrade={[
                        [-8, 42],
                        [26, 63],
                    ]}
                    etikett="Jylland"
                    plassering="nede-venstre"
                />
            )}
            <Kort modus={modus} beat={beat} />
            {modus !== 'ejderen' && (
                <div className="absolute right-[2.5%] bottom-[3%] px-3 py-1 rounded-lg bg-white/85 text-lg font-bold text-slate-600">
                    Omtrentlige grenser rundt år 800
                </div>
            )}
        </div>
    );
}

const Land = memo(function Land({
    geographies,
    sti,
    utheve,
}: {
    geographies: unknown[];
    sti: GeoPath;
    utheve: Set<string>;
}) {
    return (
        <>
            {geographies.map((g, i) => {
                const id = String((g as { id?: string | number }).id ?? '');
                const ut = utheve.has(id);
                return (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={ut ? '#dbe7c9' : '#f3eee1'}
                        stroke="#a8a08a"
                        strokeWidth={1.2}
                    />
                );
            })}
        </>
    );
});

type Pt = (ll: LngLat) => [number, number];

function Merke({
    xy,
    tekst,
    farge = '#0f172a',
    dy = -22,
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
    bredde = 9,
    forsinkelse = 0,
}: {
    d: string;
    farge: string;
    synlig: boolean;
    bredde?: number;
    forsinkelse?: number;
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
            transition={{ duration: synlig ? 2.4 : 0.4, delay: synlig ? forsinkelse : 0 }}
        />
    );
}

/** Pilspiss i enden av en rute, rettet langs siste stykke. */
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
    const s = 26;
    const a: [number, number] = [til[0] - Math.cos(v - 0.5) * s, til[1] - Math.sin(v - 0.5) * s];
    const b: [number, number] = [til[0] - Math.cos(v + 0.5) * s, til[1] - Math.sin(v + 0.5) * s];
    return (
        <motion.polygon
            points={`${til[0]},${til[1]} ${a[0]},${a[1]} ${b[0]},${b[1]}`}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ delay: synlig ? 2.2 : 0, duration: 0.3 }}
        />
    );
}

function Kirke({ xy, synlig = true }: { xy: [number, number]; synlig?: boolean }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            <g transform={`translate(${xy[0]} ${xy[1]})`}>
                <circle r={24} fill="#ffffff" stroke="#0f172a" strokeWidth={4} />
                <rect x={-3.5} y={-15} width={7} height={30} fill="#0f172a" />
                <rect x={-11} y={-7} width={22} height={7} fill="#0f172a" />
            </g>
        </motion.g>
    );
}

/** Gull ved klosteret: rikdom uten vern. */
function Skatt({ xy, synlig }: { xy: [number, number]; synlig: boolean }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            <g transform={`translate(${xy[0] + 70} ${xy[1] + 10})`}>
                {[
                    [0, 0],
                    [22, 4],
                    [11, -14],
                    [-20, 6],
                    [-8, -10],
                ].map(([x, y], i) => (
                    <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={13}
                        fill="#facc15"
                        stroke="#a16207"
                        strokeWidth={4}
                    />
                ))}
                <text
                    y={52}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={900}
                    fill="#a16207"
                    stroke="#ffffff"
                    strokeWidth={7}
                    paintOrder="stroke"
                >
                    Ingen vakter
                </text>
            </g>
        </motion.g>
    );
}

function KarlLag({ beat, pt }: { beat: number; pt: Pt }) {
    return (
        <>
            <Merke xy={pt([9.6, 56.1])} tekst="Danmark" farge="#166534" dy={0} />
            <Merke
                xy={pt([1.0, 45.6])}
                tekst="Frankerriket"
                farge="#7f1d1d"
                dy={0}
                storrelse={52}
                synlig={beat >= 1}
            />
            <Merke
                xy={pt([9.6, 52.4])}
                tekst="Sakserne"
                farge="#9a3412"
                dy={0}
                synlig={beat >= 3}
            />
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 2 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
            >
                <g transform={`translate(${pt([7.6, 47.8]).join(' ')})`}>
                    <circle r={44} fill="#ffffff" stroke="#7f1d1d" strokeWidth={5} />
                    <rect x={-6} y={-28} width={12} height={56} fill="#7f1d1d" />
                    <rect x={-20} y={-14} width={40} height={11} fill="#7f1d1d" />
                </g>
            </motion.g>
        </>
    );
}

function FluktLag({ beat, p, pt }: { beat: number; p: GeoProjection; pt: Pt }) {
    return (
        <>
            <Merke xy={pt([12.6, 56.2])} tekst="Danmark" farge="#166534" dy={0} anker="start" />
            <Merke xy={pt([10.6, 52.0])} tekst="Sakserne" farge="#9a3412" dy={0} />
            <Merke
                xy={pt([6.0, 48.3])}
                tekst="Frankerriket"
                farge="#7f1d1d"
                dy={0}
                storrelse={48}
            />
            <g transform={`translate(${pt([9.6, 55.9]).join(' ')})`}>
                <circle r={16} fill="#166534" stroke="#ffffff" strokeWidth={4} />
            </g>
            <Merke
                xy={pt([10.3, 55.75])}
                tekst="Du er her"
                farge="#166534"
                dy={0}
                storrelse={30}
                anker="start"
            />
            {FLYKT.map((rute, i) => {
                const q = rute.map(pt);
                return (
                    <g key={i}>
                        <Pil
                            d={kurve(p, rute)}
                            farge="#1e3a8a"
                            synlig={beat >= 1}
                            bredde={7}
                            forsinkelse={i * 0.4}
                        />
                        <Spiss
                            fra={q[q.length - 2]}
                            til={q[q.length - 1]}
                            farge="#1e3a8a"
                            synlig={beat >= 1}
                        />
                    </g>
                );
            })}
            <Merke
                xy={pt([12.5, 54.6])}
                tekst="Flyktninger"
                farge="#1e3a8a"
                dy={0}
                storrelse={36}
                synlig={beat >= 1}
                anker="start"
            />
            <Pil
                d={kurve(p, [
                    [4.6, 49.6],
                    [6.4, 51.4],
                    [7.6, 53.0],
                ])}
                farge="#7f1d1d"
                synlig={beat >= 2}
                bredde={16}
            />
            <Spiss fra={pt([6.4, 51.4])} til={pt([7.6, 53.0])} farge="#7f1d1d" synlig={beat >= 2} />
            <Merke
                xy={pt([4.0, 51.9])}
                tekst="Trussel fra sør"
                farge="#7f1d1d"
                dy={0}
                storrelse={34}
                synlig={beat >= 2}
                anker="end"
            />
        </>
    );
}

function EjderLag({ beat, p, pt }: { beat: number; p: GeoProjection; pt: Pt }) {
    return (
        <>
            <Merke xy={pt([9.2, 56.3])} tekst="Danmark" farge="#166534" dy={0} storrelse={48} />
            <Merke
                xy={pt([11.9, 53.85])}
                tekst="Frankerriket"
                farge="#7f1d1d"
                dy={0}
                storrelse={44}
            />
            <path
                d={linje(p, DANNEVIRKE)}
                fill="none"
                stroke="#78350f"
                strokeWidth={14}
                strokeLinecap="round"
            />
            <Merke
                xy={pt([9.45, 54.49])}
                tekst="Dannevirke"
                farge="#78350f"
                dy={-30}
                storrelse={38}
            />
            <Pil d={kurve(p, EJDEREN)} farge="#1d4ed8" synlig={beat >= 1} bredde={12} />
            <Merke
                xy={pt([9.0, 54.3])}
                tekst="Ejderen: grensen fra 811"
                farge="#1d4ed8"
                dy={-34}
                storrelse={36}
                synlig={beat >= 1}
                anker="middle"
            />
        </>
    );
}

function ToktLag({ beat, p, pt }: { beat: number; p: GeoProjection; pt: Pt }) {
    const tilL = TIL_LINDISFARNE.map(pt);
    const tilP = TIL_PARIS.map(pt);
    const eng = ENGLANDSKYSTEN.map(pt);
    return (
        <>
            <Merke xy={pt([13.4, 56.6])} tekst="Norden" farge="#166534" dy={0} storrelse={44} />
            <Merke
                xy={pt([7.5, 48.6])}
                tekst="Frankerriket"
                farge="#7f1d1d"
                dy={0}
                storrelse={40}
            />
            <Pil d={kurve(p, TIL_LINDISFARNE)} farge="#0f172a" synlig />
            <Spiss fra={tilL[tilL.length - 2]} til={tilL[tilL.length - 1]} farge="#0f172a" synlig />
            <Kirke xy={pt(LINDISFARNE)} />
            <Merke
                xy={pt(LINDISFARNE)}
                tekst="Lindisfarne 793"
                dy={-40}
                storrelse={34}
                anker="end"
            />
            <Skatt xy={pt(LINDISFARNE)} synlig={beat === 1 || beat === 2} />
            <Pil d={kurve(p, TIL_PARIS)} farge="#0f172a" synlig={beat >= 3} />
            <Spiss
                fra={tilP[tilP.length - 2]}
                til={tilP[tilP.length - 1]}
                farge="#0f172a"
                synlig={beat >= 3}
            />
            <Merke xy={pt(PARIS)} tekst="Paris" dy={52} storrelse={36} synlig={beat >= 3} />
            <Merke
                xy={pt([0.0, 49.3])}
                tekst="Seinen"
                farge="#1e3a8a"
                dy={0}
                storrelse={40}
                synlig={beat >= 3}
                anker="end"
            />
            <Pil
                d={kurve(p, ENGLANDSKYSTEN)}
                farge="#0f172a"
                synlig={beat >= 3}
                forsinkelse={0.8}
                bredde={7}
            />
            <Spiss
                fra={eng[eng.length - 2]}
                til={eng[eng.length - 1]}
                farge="#0f172a"
                synlig={beat >= 3}
            />
            <Merke xy={pt([-1.6, 52.6])} tekst="England" dy={0} storrelse={40} />
        </>
    );
}

function Kort({ modus, beat }: { modus: Modus; beat: number }) {
    let innhold: { tittel: string; tekst?: string } | null = null;
    if (modus === 'karl') {
        if (beat === 0) innhold = { tittel: 'Sør for Danmark' };
        if (beat === 1)
            innhold = { tittel: 'Karl den Store', tekst: 'samler store deler av Europa' };
        if (beat === 2) innhold = { tittel: 'Et kristent rike', tekst: 'styrt etter Guds lover' };
        if (beat >= 3) innhold = { tittel: 'Sakserne', tekst: 'nekter å bli kristne' };
    }
    if (modus === 'flukt') {
        if (beat === 0) innhold = { tittel: 'Rykter fra sør' };
        if (beat === 1)
            innhold = { tittel: 'Skrekkhistorier', tekst: 'om Hvitekrist og sverdet hans' };
        if (beat >= 2) innhold = { tittel: 'En krigserklæring?' };
    }
    if (modus === 'ejderen') {
        if (beat === 0) innhold = { tittel: 'Kampen endte uavgjort' };
        if (beat >= 1) innhold = { tittel: 'Avtalen i 811', tekst: 'Ejderen blir grensen' };
    }
    if (modus === 'tokt') {
        if (beat === 0) innhold = { tittel: 'Et stikk mot kristendommen?' };
        if (beat === 1)
            innhold = { tittel: 'Klostrene', tekst: 'rikdom uten vern, sentre for troen' };
        if (beat === 2) innhold = { tittel: 'Beskjeden: Guden deres kan ikke beskytte dere' };
        if (beat >= 3) innhold = { tittel: 'Opp Seinen og langs England' };
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
            className="absolute inset-x-0 flex justify-center pointer-events-none"
            style={{ top: '4%' }}
        >
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="px-7 py-3 rounded-2xl bg-white/95 shadow-xl text-center border-b-4 border-red-800"
            >
                {children}
            </motion.div>
        </div>
    );
}
