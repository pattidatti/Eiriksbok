import { memo, useMemo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart til filmen om de germanske språkene. Fire moduser:
 *  - urhjem:    folket nord for Svartehavet for rundt 5000 år siden, og spredningen
 *  - island:    norrønt i Norge, bosettingen av Island, og språket som holdt seg
 *  - hoytysk:   lydforskyvningen i sør og øst i det tyske språkområdet
 *  - danelagen: vikingtiden og Danelagen i England
 *
 * Områder for språk har ingen skarpe grenser, så de er tegnet som uskarpe skyer. Landene er
 * dagens.
 */

type Modus = 'urhjem' | 'island' | 'hoytysk' | 'danelagen';
type LngLat = [number, number];
type XY = [number, number];

const B = 1600;
const H = 900;

const UTSNITT: Record<Modus, Utsnitt | undefined> = {
    urhjem: undefined,
    island: [
        [-38, 51],
        [24, 71],
    ],
    hoytysk: [
        [-8, 44],
        [24, 61],
    ],
    danelagen: [
        [-7.5, 50],
        [12.5, 60.5],
    ],
};
const RAMME: Record<Modus, [LngLat, LngLat]> = {
    urhjem: [
        [-12, 20],
        [92, 68],
    ],
    island: [
        [-38, 51],
        [24, 71],
    ],
    hoytysk: [
        [-8, 44],
        [24, 61],
    ],
    danelagen: [
        [-7.5, 50],
        [12.5, 60.5],
    ],
};

const ID = {
    ukraina: '804',
    norge: '578',
    island: '352',
    irland: '372',
    storbritannia: '826',
    tyskland: '276',
    osterrike: '040',
    sveits: '756',
    nederland: '528',
    danmark: '208',
    sverige: '752',
};

const ENDRET = '#7c3aed';
const NORD = '#2563eb';
const VEST = '#ea580c';
const HOY = '#dc2626';

function lagProjeksjon(modus: Modus): GeoProjection {
    const [a, b] = RAMME[modus];
    return geoMercator().fitExtent(
        [
            [30, 30],
            [B - 30, H - 30],
        ],
        { type: 'MultiPoint', coordinates: [a, b] } as never
    );
}

function idAv(g: unknown) {
    return String((g as { id?: string | number }).id ?? '');
}

export function GermanskKart({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'urhjem';
    const { geographies } = useFilmVerden(UTSNITT[modus]);
    const p = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(p), [p]);
    const pt = (ll: LngLat) => p(ll) as XY;
    const landSti = (ider: string[]) =>
        geographies
            .filter((g) => ider.includes(idAv(g)))
            .map((g) => sti(g as never) ?? '')
            .join(' ');

    return (
        <div className="absolute inset-0 bg-[#bcd9ea] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <filter id="gs-sky" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation={34} />
                    </filter>
                </defs>
                <Land geographies={geographies} sti={sti} modus={modus} beat={beat} />
                {modus === 'urhjem' && <Urhjem beat={beat} pt={pt} playing={playing} />}
                {modus === 'island' && <Island beat={beat} pt={pt} />}
                {modus === 'hoytysk' && (
                    <Hoytysk
                        beat={beat}
                        pt={pt}
                        klipp={landSti([ID.tyskland, ID.osterrike, ID.sveits])}
                    />
                )}
                {modus === 'danelagen' && (
                    <Danelagen beat={beat} pt={pt} klipp={landSti([ID.storbritannia])} />
                )}
            </svg>
            <Kort modus={modus} beat={beat} />
            <div className="absolute right-[2.5%] bottom-[3%] px-3 py-1 rounded-lg bg-white/85 text-lg font-bold text-slate-600">
                {modus === 'danelagen'
                    ? 'Omtrentlig, tegnet for hånd. Landene er dagens'
                    : modus === 'urhjem'
                      ? 'Omtrentlig. Landene er dagens'
                      : 'Omtrentlige språkområder. Landene er dagens'}
            </div>
        </div>
    );
}

function landFarge(modus: Modus, beat: number, id: string): string {
    const grunn = '#f3eee1';
    if (modus === 'urhjem') return id === ID.ukraina ? '#fde68a' : grunn;
    if (modus === 'island') {
        if (id === ID.norge) return beat >= 3 ? '#ddd6fe' : '#fcd34d';
        if (id === ID.island && beat >= 2) return '#fcd34d';
        return grunn;
    }
    if (modus === 'danelagen') {
        if (id === ID.norge || id === ID.danmark) return beat <= 1 ? '#bfdbfe' : '#e2e8f0';
        return grunn;
    }
    return grunn;
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
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill={landFarge(modus, beat, idAv(g))}
                    stroke="#a8a08a"
                    strokeWidth={1.2}
                    style={{ transition: 'fill 1.2s' }}
                />
            ))}
        </>
    );
});

function Merke({
    xy,
    tekst,
    farge = '#0f172a',
    storrelse = 40,
    synlig = true,
    anker = 'middle',
    dy = 0,
}: {
    xy: XY;
    tekst: string;
    farge?: string;
    storrelse?: number;
    synlig?: boolean;
    anker?: 'start' | 'middle' | 'end';
    dy?: number;
}) {
    if (!synlig) return null;
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
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
        >
            {tekst}
        </motion.text>
    );
}

function Pil({
    fra,
    til,
    farge,
    synlig,
    bue = 0.25,
    forsinkelse = 0,
}: {
    fra: XY;
    til: XY;
    farge: string;
    synlig: boolean;
    bue?: number;
    forsinkelse?: number;
}) {
    if (!synlig) return null;
    const dx = til[0] - fra[0];
    const dy = til[1] - fra[1];
    const k: XY = [(fra[0] + til[0]) / 2 + dy * bue, (fra[1] + til[1]) / 2 - dx * bue];
    const v = Math.atan2(til[1] - k[1], til[0] - k[0]);
    const s = 30;
    const a: XY = [til[0] - Math.cos(v - 0.5) * s, til[1] - Math.sin(v - 0.5) * s];
    const b: XY = [til[0] - Math.cos(v + 0.5) * s, til[1] - Math.sin(v + 0.5) * s];
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${k[0]} ${k[1]} ${til[0]} ${til[1]}`}
                fill="none"
                stroke={farge}
                strokeWidth={10}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.8, delay: forsinkelse }}
            />
            <motion.polygon
                points={`${til[0]},${til[1]} ${a[0]},${a[1]} ${b[0]},${b[1]}`}
                fill={farge}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.7, duration: 0.3 }}
            />
        </g>
    );
}

/** Et uskarpt område, klippet etter landene det ligger i. */
function Sky({
    id,
    klipp,
    xy,
    rx,
    ry,
    farge,
    synlig,
    roter = 0,
}: {
    id: string;
    klipp?: string;
    xy: XY;
    rx: number;
    ry: number;
    farge: string;
    synlig: boolean;
    roter?: number;
}) {
    return (
        <>
            {klipp && (
                <defs>
                    <clipPath id={id}>
                        <path d={klipp} />
                    </clipPath>
                </defs>
            )}
            <g clipPath={klipp ? `url(#${id})` : undefined}>
                <motion.ellipse
                    cx={xy[0]}
                    cy={xy[1]}
                    rx={rx}
                    ry={ry}
                    fill={farge}
                    filter="url(#gs-sky)"
                    transform={`rotate(${roter} ${xy[0]} ${xy[1]})`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: synlig ? 0.6 : 0 }}
                    transition={{ duration: 1.4 }}
                />
            </g>
        </>
    );
}

/* ---------- urhjem ---------- */

const URHJEM: LngLat = [33, 48.5];

function Urhjem({ beat, pt, playing }: { beat: number; pt: (ll: LngLat) => XY; playing: boolean }) {
    const c = pt(URHJEM);
    return (
        <>
            {/* Spredningen: ringer som går utover fra urhjemmet. */}
            {beat >= 2 &&
                [0, 1, 2].map((i) => (
                    <circle
                        key={i}
                        cx={c[0]}
                        cy={c[1]}
                        r={playing ? 40 : 160 + i * 150}
                        fill="none"
                        stroke="#b45309"
                        strokeWidth={6}
                        opacity={playing ? 0.8 : 0.55 - i * 0.12}
                    >
                        {playing && (
                            <>
                                <animate
                                    attributeName="r"
                                    from="40"
                                    to="620"
                                    dur="4.5s"
                                    begin={`${i * 1.5}s`}
                                    repeatCount="indefinite"
                                />
                                <animate
                                    attributeName="opacity"
                                    from="0.8"
                                    to="0"
                                    dur="4.5s"
                                    begin={`${i * 1.5}s`}
                                    repeatCount="indefinite"
                                />
                            </>
                        )}
                    </circle>
                ))}
            <motion.circle
                cx={c[0]}
                cy={c[1]}
                r={70}
                fill="#f59e0b"
                filter="url(#gs-sky)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.85 }}
                transition={{ duration: 1.2 }}
            />
            <circle cx={c[0]} cy={c[1]} r={14} fill="#b45309" stroke="#fff" strokeWidth={5} />
            {beat === 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <rect
                        x={c[0] + 30}
                        y={c[1] - 150}
                        width={110}
                        height={90}
                        rx={40}
                        fill="#ffffff"
                        stroke="#78350f"
                        strokeWidth={5}
                    />
                    <path
                        d={`M ${c[0] + 50} ${c[1] - 62} L ${c[0] + 22} ${c[1] - 22} L ${c[0] + 78} ${c[1] - 62}`}
                        fill="#ffffff"
                        stroke="#78350f"
                        strokeWidth={5}
                    />
                    <text
                        x={c[0] + 85}
                        y={c[1] - 103}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={64}
                        fontWeight={900}
                        fill="#78350f"
                    >
                        ?
                    </text>
                </motion.g>
            )}
            <Merke xy={pt([33, 51.3])} tekst="dagens Ukraina" storrelse={34} farge="#78350f" />
            <Merke xy={pt([34.5, 43.2])} tekst="Svartehavet" storrelse={30} farge="#1e3a8a" />
            <Merke
                xy={pt([6, 49])}
                tekst="Europa"
                storrelse={56}
                farge="#475569"
                synlig={beat >= 2}
            />
            <Merke
                xy={pt([75, 46])}
                tekst="Asia"
                storrelse={56}
                farge="#475569"
                synlig={beat >= 2}
            />
        </>
    );
}

/* ---------- island ---------- */

const ISLAND: LngLat = [-18.5, 64.9];
const NORGE: LngLat = [9.5, 61.5];

function Island({ beat, pt }: { beat: number; pt: (ll: LngLat) => XY }) {
    return (
        <>
            {/* Islands kyst blir litt tydeligere når bosettingen begynner. */}
            {beat >= 2 && (
                <motion.circle
                    cx={pt(ISLAND)[0]}
                    cy={pt(ISLAND)[1]}
                    r={130}
                    fill="#fcd34d"
                    filter="url(#gs-sky)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 4 ? 0.5 : 0.25 }}
                    transition={{ duration: 1 }}
                />
            )}
            <Merke
                xy={pt(NORGE)}
                tekst="Norge"
                storrelse={48}
                farge={beat >= 3 ? ENDRET : '#78350f'}
            />
            <Merke
                xy={pt([9.5, 60.3])}
                tekst="forandret seg mye"
                storrelse={32}
                farge="#4c1d95"
                synlig={beat >= 3}
            />
            <Pil fra={pt([4.8, 61.6])} til={pt([-13.2, 64.6])} farge="#0f172a" synlig={beat >= 2} />
            <Pil
                fra={pt([-7.4, 57.6])}
                til={pt([-14.6, 63.5])}
                farge="#0f172a"
                synlig={beat >= 2}
                bue={-0.2}
                forsinkelse={0.4}
            />
            <Pil
                fra={pt([-8.6, 54.4])}
                til={pt([-17.5, 63.3])}
                farge="#0f172a"
                synlig={beat >= 2}
                bue={-0.15}
                forsinkelse={0.8}
            />
            <Merke xy={pt([-8.0, 53.2])} tekst="Irland" storrelse={34} synlig={beat >= 2} />
            <Merke
                xy={pt([-9.0, 57.6])}
                tekst="Hebridene"
                storrelse={34}
                anker="end"
                synlig={beat >= 2}
            />
            <Merke xy={pt([-6.5, 64.6])} tekst="870 til 920" storrelse={40} synlig={beat === 2} />
            <Merke
                xy={pt([-18.6, 66.9])}
                tekst="Island"
                storrelse={48}
                farge="#78350f"
                synlig={beat >= 2}
            />
            <Merke
                xy={pt([-18.6, 63.0])}
                tekst="nær norrønt"
                storrelse={32}
                farge="#78350f"
                synlig={beat >= 3}
            />
            {beat >= 4 && <Bok xy={pt([-12.2, 65.9])} />}
            {beat >= 3 && (
                <g>
                    <Forklaring
                        xy={[60, 760]}
                        rader={[
                            { farge: '#fcd34d', tekst: 'norrønt' },
                            { farge: '#ddd6fe', tekst: 'forandret' },
                        ]}
                    />
                </g>
            )}
            {beat < 3 && (
                <Forklaring xy={[60, 800]} rader={[{ farge: '#fcd34d', tekst: 'norrønt' }]} />
            )}
        </>
    );
}

function Forklaring({ xy, rader }: { xy: XY; rader: { farge: string; tekst: string }[] }) {
    return (
        <g transform={`translate(${xy[0]} ${xy[1]})`}>
            <rect
                x={0}
                y={0}
                width={290}
                height={rader.length * 54 + 20}
                rx={14}
                fill="#ffffff"
                opacity={0.92}
            />
            {rader.map((r, i) => (
                <g key={r.tekst} transform={`translate(22 ${32 + i * 54})`}>
                    <rect
                        x={0}
                        y={-16}
                        width={34}
                        height={32}
                        rx={6}
                        fill={r.farge}
                        stroke="#78716c"
                    />
                    <text
                        x={50}
                        y={2}
                        dominantBaseline="middle"
                        fontSize={32}
                        fontWeight={800}
                        fill="#1c1917"
                    >
                        {r.tekst}
                    </text>
                </g>
            ))}
        </g>
    );
}

/** En åpen bok: islendinger leser norrøne tekster. */
function Bok({ xy }: { xy: XY }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <g transform={`translate(${xy[0]} ${xy[1]})`}>
                <path
                    d="M 0 0 Q -50 -18 -100 -6 L -100 64 Q -50 52 0 70 Z"
                    fill="#fffbeb"
                    stroke="#78350f"
                    strokeWidth={5}
                />
                <path
                    d="M 0 0 Q 50 -18 100 -6 L 100 64 Q 50 52 0 70 Z"
                    fill="#fffbeb"
                    stroke="#78350f"
                    strokeWidth={5}
                />
                {[12, 26, 40].map((y) => (
                    <g key={y}>
                        <line
                            x1={-82}
                            y1={y}
                            x2={-18}
                            y2={y + 4}
                            stroke="#92400e"
                            strokeWidth={4}
                        />
                        <line x1={18} y1={y + 4} x2={82} y2={y} stroke="#92400e" strokeWidth={4} />
                    </g>
                ))}
            </g>
        </motion.g>
    );
}

/* ---------- hoytysk ---------- */

function Hoytysk({ beat, pt, klipp }: { beat: number; pt: (ll: LngLat) => XY; klipp: string }) {
    const sor = pt([11.5, 48.4]);
    const a = pt([5.8, 52.2]);
    const b = pt([-2.0, 53.6]);
    const c = pt([9.2, 59.4]);
    return (
        <>
            <Sky
                id="gs-hoy"
                klipp={klipp}
                xy={pt([12.0, 48.4])}
                rx={330}
                ry={170}
                roter={-12}
                farge={HOY}
                synlig
            />
            <Merke xy={sor} tekst="høytysk" farge="#7f1d1d" storrelse={50} dy={-56} />
            <Merke
                xy={sor}
                tekst={beat >= 2 ? 'Wasser' : 'machen'}
                farge={HOY}
                storrelse={44}
                dy={6}
                synlig={beat >= 1}
            />
            <Sky
                id="gs-nedertysk"
                klipp={klipp}
                xy={pt([9.5, 53.2])}
                rx={260}
                ry={110}
                farge={NORD}
                synlig={beat === 1}
            />
            <Merke
                xy={pt([10.2, 52.4])}
                tekst="maken"
                farge={NORD}
                storrelse={44}
                synlig={beat === 1}
            />
            <Merke
                xy={pt([10.2, 52.4])}
                tekst="nedertysk"
                farge="#1e3a8a"
                storrelse={28}
                dy={40}
                synlig={beat === 1}
            />
            {beat >= 2 && (
                <>
                    {beat >= 3 && (
                        <motion.path
                            d={`M ${b[0]} ${b[1]} L ${a[0]} ${a[1]} L ${c[0]} ${c[1]} Z`}
                            fill="#16a34a"
                            fillOpacity={0.12}
                            stroke="#15803d"
                            strokeWidth={6}
                            strokeDasharray="18 12"
                            strokeLinejoin="round"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.9 }}
                        />
                    )}
                    <Merke xy={a} tekst="water" farge="#15803d" storrelse={44} dy={-8} />
                    <Merke xy={a} tekst="nederlandsk" farge="#334155" storrelse={28} dy={36} />
                    <Merke xy={b} tekst="water" farge="#15803d" storrelse={44} dy={-8} />
                    <Merke xy={b} tekst="engelsk" farge="#334155" storrelse={28} dy={36} />
                    <Merke xy={c} tekst="vann" farge="#15803d" storrelse={44} dy={-8} />
                    <Merke xy={c} tekst="norsk" farge="#334155" storrelse={28} dy={36} />
                </>
            )}
        </>
    );
}

/* ---------- danelagen ---------- */

/** Danelagen, omtrentlig: Northumbria, East Anglia og den østlige delen av Mercia. */
const DANELAGEN: LngLat[] = [
    [-3.6, 56.0],
    [-1.4, 56.1],
    [0.6, 54.6],
    [2.6, 53.2],
    [2.4, 51.8],
    [0.6, 51.55],
    [-0.1, 51.7],
    [-0.6, 52.2],
    [-1.4, 52.5],
    [-2.2, 52.9],
    [-3.1, 53.35],
    [-3.9, 54.3],
];
const LINDISFARNE: LngLat = [-1.8, 55.68];

function Danelagen({ beat, pt, klipp }: { beat: number; pt: (ll: LngLat) => XY; klipp: string }) {
    const d = DANELAGEN.map((ll, i) => {
        const [x, y] = pt(ll);
        return `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
    const li = pt(LINDISFARNE);
    return (
        <>
            {beat <= 1 && (
                <>
                    <Merke xy={pt([8.6, 59.6])} tekst="norsk" farge={NORD} storrelse={46} />
                    <Merke xy={pt([8.6, 59.0])} tekst="nordgermansk" farge={NORD} storrelse={30} />
                    <Merke xy={pt([-1.6, 52.4])} tekst="engelsk" farge={VEST} storrelse={46} />
                    <Merke xy={pt([-1.6, 51.7])} tekst="vestgermansk" farge={VEST} storrelse={30} />
                </>
            )}
            {(beat === 1 || beat === 2) && (
                <Pil
                    fra={pt([6.0, 58.6])}
                    til={pt([0.6, 55.0])}
                    farge="#0f172a"
                    synlig
                    bue={0.15}
                />
            )}
            {beat >= 3 && (
                <>
                    <defs>
                        <clipPath id="gs-dane">
                            <path d={klipp} />
                        </clipPath>
                    </defs>
                    <g clipPath="url(#gs-dane)">
                        <motion.path
                            d={`${d} Z`}
                            fill="#b91c1c"
                            stroke="#ffffff"
                            strokeWidth={4}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.45 }}
                            transition={{ duration: 1 }}
                        />
                    </g>
                    <Merke
                        xy={pt([-1.9, 54.8])}
                        tekst="Northumbria"
                        farge="#7f1d1d"
                        storrelse={34}
                    />
                    <Merke
                        xy={pt([1.1, 52.45])}
                        tekst="East Anglia"
                        farge="#7f1d1d"
                        storrelse={30}
                    />
                    <Merke
                        xy={pt([-1.3, 53.2])}
                        tekst="deler av Mercia"
                        farge="#7f1d1d"
                        storrelse={28}
                    />
                </>
            )}
            {beat >= 2 && (
                <>
                    <circle
                        cx={li[0]}
                        cy={li[1]}
                        r={14}
                        fill="#0f172a"
                        stroke="#fff"
                        strokeWidth={5}
                    />
                    {beat === 2 && (
                        <>
                            <Merke
                                xy={li}
                                tekst="Lindisfarne"
                                storrelse={36}
                                anker="end"
                                dy={-14}
                            />
                            <Merke
                                xy={pt([-6.4, 55.68])}
                                tekst="793"
                                storrelse={34}
                                farge="#7f1d1d"
                                dy={28}
                            />
                        </>
                    )}
                </>
            )}
            {beat >= 4 && <Snakk norront={pt([1.2, 54.9])} engelsk={pt([-3.4, 51.3])} />}
        </>
    );
}

/** To snakkebobler som overlapper: norrønt og engelsk side om side. */
function Snakk({ norront, engelsk }: { norront: XY; engelsk: XY }) {
    const boble = (x: number, farge: string, tekst: string, kant: string) => (
        <g transform={`translate(${x} 0)`}>
            <rect
                x={-95}
                y={-40}
                width={190}
                height={70}
                rx={30}
                fill={farge}
                stroke={kant}
                strokeWidth={5}
            />
            <path d={`M -20 28 L -32 58 L 6 30`} fill={farge} stroke={kant} strokeWidth={5} />
            <text
                x={0}
                y={-4}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={32}
                fontWeight={900}
                fill={kant}
            >
                {tekst}
            </text>
        </g>
    );
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <g transform={`translate(${norront[0] + 90} ${norront[1] - 50})`}>
                {boble(0, '#dbeafe', 'norrønt', '#1e3a8a')}
            </g>
            <g transform={`translate(${engelsk[0]} ${engelsk[1]})`}>
                {boble(0, '#ffedd5', 'engelsk', '#9a3412')}
            </g>
        </motion.g>
    );
}

/* ---------- kortet øverst til venstre ---------- */

function kortFor(
    modus: Modus,
    beat: number
): { tittel: string; tekst?: string; brikker?: string[]; jones?: boolean } {
    if (modus === 'urhjem') {
        if (beat <= 0)
            return {
                tittel: 'For rundt 5000 år siden',
                tekst: 'i elvedalene nord for Svartehavet',
            };
        if (beat === 1) return { tittel: 'Proto-indoeuropeisk', tekst: 'stamfaren ingen har hørt' };
        if (beat === 2)
            return {
                tittel: 'Utover Europa og Asia',
                tekst: 'språket endret seg i hver sin retning',
            };
        if (beat === 3)
            return {
                tittel: 'Nye greiner',
                brikker: ['germansk', 'italisk', 'slavisk', 'keltisk', 'og mange flere'],
            };
        if (beat === 4)
            return {
                tittel: '1786: William Jones',
                brikker: ['sanskrit', 'gresk', 'latin'],
                jones: true,
            };
        return {
            tittel: 'Et gjennombrudd',
            tekst: 'i språkvitenskapen',
            brikker: ['sanskrit', 'gresk', 'latin'],
            jones: true,
        };
    }
    if (modus === 'island') {
        if (beat <= 0) return { tittel: 'Norrønt', tekst: 'språket i Norge fra år 700 til 1350' };
        if (beat === 1)
            return { tittel: 'Skrevet med', brikker: ['runer', 'så latinske bokstaver'] };
        if (beat === 2) return { tittel: 'Island blir bosatt', tekst: 'mellom 870 og 920' };
        if (beat === 3)
            return {
                tittel: 'Språket på fastlandet forandret seg',
                tekst: 'islandsk forandret seg mye mindre',
            };
        return { tittel: 'Islendinger kan lese', tekst: 'norrøne tekster i dag' };
    }
    if (modus === 'hoytysk') {
        if (beat <= 0) return { tittel: 'Lydforskyvningen', tekst: 'slo gjennom i sør og øst' };
        if (beat === 1) return { tittel: 'Nord: maken', tekst: 'sør: machen' };
        if (beat === 2)
            return {
                tittel: 'Ikke med på endringen',
                brikker: ['nederlandsk', 'engelsk', 'nordisk'],
            };
        return { tittel: 'Ligner mer på hverandre', tekst: 'enn på tysk' };
    }
    if (beat <= 0) return { tittel: 'Ulike greiner', tekst: 'men likevel så like?' };
    if (beat === 1) return { tittel: 'To grunner', brikker: ['felles opphav', 'vikingene'] };
    if (beat === 2) return { tittel: 'Vikingtiden', tekst: 'fra 793 til rundt 1050' };
    if (beat === 3) return { tittel: 'Danelagen', tekst: 'dansk og norsk lov' };
    return { tittel: 'Side om side', tekst: 'i generasjoner' };
}

function Kort({ modus, beat }: { modus: Modus; beat: number }) {
    const k = kortFor(modus, beat);
    return (
        <div className="absolute pointer-events-none" style={{ top: '4%', left: '3%' }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${k.tittel}-${k.tekst ?? ''}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                    className="px-7 py-3 rounded-2xl bg-white/95 shadow-xl border-b-4 border-amber-600"
                    style={{ fontFamily: 'Outfit, Inter, sans-serif', maxWidth: 560 }}
                >
                    <div className="text-3xl font-black text-stone-900">{k.tittel}</div>
                    {k.tekst && (
                        <div className="text-xl font-semibold text-stone-500">{k.tekst}</div>
                    )}
                    {k.brikker && <Brikker brikker={k.brikker} jones={!!k.jones} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function Brikker({ brikker, jones }: { brikker: string[]; jones: boolean }): ReactNode {
    return (
        <div className="flex flex-wrap items-center gap-2 mt-2">
            {brikker.map((b, i) => (
                <motion.span
                    key={b}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.25 }}
                    className="flex items-center gap-2"
                >
                    {jones && i > 0 && (
                        <span className="text-2xl font-black text-amber-600">≈</span>
                    )}
                    <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-900 text-2xl font-bold">
                        {b}
                    </span>
                </motion.span>
            ))}
        </div>
    );
}
