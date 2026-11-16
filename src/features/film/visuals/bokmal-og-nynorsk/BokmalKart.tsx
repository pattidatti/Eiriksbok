import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart over hvor de to skriftspråkene hører hjemme.
 *
 *  - union:  Danmark-Norge. Skriften kommer fra København, mens bygdene snakker dialekt
 *  - idag:   der nynorsk står sterkest i dag (Sunnmøre, Vestland utenom Bergen), og tre steder
 *  - norden: Norge mellom Sverige og Danmark: to skriftspråk gjør nabospråkene lettere
 *
 * Dagens grenser. Områdene på Vestlandet er tegnet for hånd og er omtrentlige.
 */

type Modus = 'union' | 'idag' | 'norden';
type LngLat = [number, number];
type XY = [number, number];

const B = 1600;
const H = 900;

const UTSNITT: Record<Modus, Utsnitt> = {
    union: [
        [-4, 54],
        [34, 71.3],
    ],
    idag: [
        [1, 57.9],
        [15.5, 63.5],
    ],
    norden: [
        [0, 53.9],
        [27, 64.2],
    ],
};

const NORGE = '578';
const DANMARK = '208';
const SVERIGE = '752';

const HAV = '#a9cde0';
const LAND = '#ece6d6';
const UNION = '#f2b48a';
const NORSK = '#cfe3b4';

const KOBENHAVN: LngLat = [12.57, 55.68];

/* Omtrentlige områder, tegnet for hånd og klippet etter Norge. */
const VESTLAND: LngLat[] = [
    [4.2, 59.45],
    [5.9, 59.35],
    [6.8, 59.75],
    [7.6, 60.25],
    [8.25, 60.85],
    [8.0, 61.5],
    [7.4, 61.85],
    [6.3, 62.05],
    [4.2, 62.05],
];
const SUNNMORE: LngLat[] = [
    [4.2, 62.05],
    [6.3, 62.05],
    [7.4, 61.85],
    [7.8, 62.3],
    [7.1, 62.65],
    [6.2, 62.75],
    [4.2, 62.6],
];

const STEDER = {
    bergen: [5.32, 60.39] as LngLat,
    volda: [6.07, 62.15] as LngLat,
    voss: [6.42, 60.63] as LngLat,
    oslo: [10.75, 59.91] as LngLat,
};

function lagProjeksjon(u: Utsnitt): GeoProjection {
    return geoMercator().fitExtent(
        [
            [30, 30],
            [B - 30, H - 30],
        ],
        { type: 'MultiPoint', coordinates: [u[0], u[1]] } as never
    );
}

function polygon(p: GeoProjection, pts: LngLat[]) {
    return (
        pts
            .map((ll, i) => {
                const [x, y] = p(ll) as XY;
                return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
            })
            .join(' ') + ' Z'
    );
}

function bue(a: XY, b: XY, boy = 0.2) {
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    return `M ${a[0]} ${a[1]} Q ${mx - dy * boy} ${my + dx * boy} ${b[0]} ${b[1]}`;
}

function fyll(modus: Modus, beat: number, id: string) {
    if (modus === 'union') {
        if (id === DANMARK) return UNION;
        if (id === NORGE) return beat >= 3 ? NORSK : UNION;
    }
    if (modus === 'idag' && id === NORGE) return '#f6f1e3';
    if (modus === 'norden') {
        if (id === NORGE) return '#fde68a';
        if ((id === SVERIGE || id === DANMARK) && beat >= 2) return '#c6e5bf';
    }
    return LAND;
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
                        fill={fyll(modus, beat, id)}
                        stroke="#9a917a"
                        strokeWidth={1.2}
                        style={{ transition: 'fill 1s' }}
                    />
                );
            })}
        </>
    );
});

function Etikett({
    xy,
    tekst,
    storrelse = 40,
    farge = '#1c1917',
    anker = 'middle',
    dx = 0,
    dy = 0,
    synlig = true,
}: {
    xy: XY;
    tekst: string;
    storrelse?: number;
    farge?: string;
    anker?: 'start' | 'middle' | 'end';
    dx?: number;
    dy?: number;
    synlig?: boolean;
}) {
    return (
        <motion.text
            x={xy[0] + dx}
            y={xy[1] + dy}
            textAnchor={anker}
            fontSize={storrelse}
            fontWeight={800}
            fill={farge}
            stroke="white"
            strokeWidth={storrelse / 5}
            strokeLinejoin="round"
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {tekst}
        </motion.text>
    );
}

/** Et lite kort med tekst. Bredden regnes ut fra teksten, så den aldri flyter ut. */
function Lapp({
    xy,
    tekst,
    farge = '#7c2d12',
    bakgrunn = '#fff7ed',
    storrelse = 34,
    forsinkelse = 0,
}: {
    xy: XY;
    tekst: string;
    farge?: string;
    bakgrunn?: string;
    storrelse?: number;
    forsinkelse?: number;
}) {
    const b = Math.round(tekst.length * storrelse * 0.6 + 36);
    const h = Math.round(storrelse * 1.6);
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.5 }}
        >
            <rect
                x={xy[0] - b / 2}
                y={xy[1] - h / 2}
                width={b}
                height={h}
                rx={12}
                fill={bakgrunn}
                stroke={farge}
                strokeWidth={3}
            />
            <text
                x={xy[0]}
                y={xy[1] + storrelse * 0.35}
                textAnchor="middle"
                fontSize={storrelse}
                fontWeight={800}
                fill={farge}
            >
                {tekst}
            </text>
        </motion.g>
    );
}

/** Snakkeboble med en hale ned mot et punkt. */
function Boble({
    xy,
    tekst,
    forsinkelse = 0,
    farge = '#166534',
}: {
    xy: XY;
    tekst: string;
    forsinkelse?: number;
    farge?: string;
}) {
    const fs = 32;
    const b = Math.round(tekst.length * fs * 0.6 + 34);
    const h = 50;
    const [x, y] = xy;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.5 }}
        >
            <path
                d={`M ${x - 10} ${y - 24} L ${x} ${y - 4} L ${x + 12} ${y - 24} Z`}
                fill="white"
                stroke={farge}
                strokeWidth={3}
            />
            <rect
                x={x - b / 2}
                y={y - 24 - h}
                width={b}
                height={h}
                rx={22}
                fill="white"
                stroke={farge}
                strokeWidth={3}
            />
            <rect x={x - 9} y={y - 27} width={20} height={6} fill="white" />
            <text
                x={x}
                y={y - 24 - h / 2 + 10}
                textAnchor="middle"
                fontSize={fs}
                fontWeight={800}
                fill={farge}
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Prikk({ xy, farge = '#1c1917', r = 11 }: { xy: XY; farge?: string; r?: number }) {
    return <circle cx={xy[0]} cy={xy[1]} r={r} fill={farge} stroke="white" strokeWidth={4} />;
}

/* ---------------- union ---------------- */

const SKRIFT = ['lover', 'bøker', 'aviser', 'kirken', 'skolen'];
const SKRIFT_MAL: LngLat[] = [
    [6.2, 59.2],
    [6.0, 61.6],
    [10.4, 60.4],
    [11.2, 63.6],
    [14.6, 66.8],
];
const BYGDER: LngLat[] = [
    [7.0, 59.9],
    [9.4, 62.0],
    [13.4, 65.6],
    [18.6, 69.3],
];

function UnionLag({ beat, pt }: { beat: number; pt: (ll: LngLat) => XY }) {
    const kbh = pt(KOBENHAVN);
    return (
        <>
            {beat >= 1 &&
                beat <= 2 &&
                SKRIFT_MAL.map((m, i) => (
                    <motion.path
                        key={i}
                        d={bue(kbh, pt(m), 0.15)}
                        fill="none"
                        stroke="#b91c1c"
                        strokeWidth={5}
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.75 }}
                        transition={{ duration: 1.1, delay: i * 0.3 }}
                    />
                ))}
            <Prikk xy={kbh} farge="#b91c1c" r={13} />
            <Etikett xy={kbh} tekst="København" storrelse={36} anker="start" dx={24} dy={14} />
            {beat === 1 &&
                SKRIFT.map((s, i) => (
                    <Lapp
                        key={s}
                        xy={pt(SKRIFT_MAL[i])}
                        tekst={s}
                        forsinkelse={0.8 + i * 0.3}
                        farge="#991b1b"
                    />
                ))}
            {beat === 2 && (
                <>
                    <Lapp
                        xy={pt([9.5, 61.0])}
                        tekst="lese og skrive: dansk"
                        storrelse={32}
                        farge="#991b1b"
                    />
                </>
            )}
            {beat >= 3 &&
                BYGDER.map((b, i) => (
                    <Boble key={i} xy={pt(b)} tekst="dialekt" forsinkelse={i * 0.35} />
                ))}
            <Etikett
                xy={pt([10.2, 56.1])}
                tekst="Danmark"
                storrelse={38}
                farge="#7c2d12"
                anker="end"
                dx={-40}
            />
        </>
    );
}

function UnionKort({ beat }: { beat: number }) {
    return (
        <>
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.div
                        key="union"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute rounded-2xl shadow-xl bg-white/95"
                        style={{ left: '4%', top: '8%', padding: '12px 24px' }}
                    >
                        <div
                            className="font-display font-black text-slate-900"
                            style={{ fontSize: 34 }}
                        >
                            Danmark-Norge
                        </div>
                        <div className="font-bold" style={{ fontSize: 22, color: '#9a3412' }}>
                            400 år i union
                        </div>
                    </motion.div>
                )}
                {(beat === 1 || beat === 2) && (
                    <motion.div
                        key="skrift"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute rounded-2xl shadow-xl bg-white/95"
                        style={{ left: '4%', top: '8%', padding: '12px 24px' }}
                    >
                        <div
                            className="font-display font-black"
                            style={{ fontSize: 32, color: '#991b1b' }}
                        >
                            All skrift: dansk
                        </div>
                        {beat === 2 && (
                            <div className="font-bold text-slate-600" style={{ fontSize: 22 }}>
                                språket til de utdannede
                            </div>
                        )}
                    </motion.div>
                )}
                {beat === 3 && (
                    <motion.div
                        key="tale"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute rounded-2xl shadow-xl bg-white/95"
                        style={{ left: '4%', top: '8%', padding: '12px 24px' }}
                    >
                        <div
                            className="font-display font-black"
                            style={{ fontSize: 32, color: '#166534' }}
                        >
                            I bygdene: dialekter
                        </div>
                        <div className="font-bold text-slate-600" style={{ fontSize: 22 }}>
                            norrønt levde videre i talen
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {beat >= 4 && (
                    <motion.div
                        key="dobbelt"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute rounded-2xl shadow-2xl bg-white/95"
                        style={{ left: '3%', top: '8%', padding: '16px 26px', width: '30%' }}
                    >
                        <div
                            className="font-display font-black text-slate-900"
                            style={{ fontSize: 30 }}
                        >
                            Et dobbeltliv
                        </div>
                        <div className="flex items-center" style={{ gap: 12, marginTop: 10 }}>
                            <div
                                className="rounded-full"
                                style={{ width: 22, height: 22, background: '#16a34a' }}
                            />
                            <div className="font-bold" style={{ fontSize: 26, color: '#166534' }}>
                                snakket norsk
                            </div>
                        </div>
                        <div className="flex items-center" style={{ gap: 12, marginTop: 6 }}>
                            <div
                                className="rounded"
                                style={{ width: 22, height: 22, background: '#dc2626' }}
                            />
                            <div className="font-bold" style={{ fontSize: 26, color: '#991b1b' }}>
                                skrev dansk
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------------- idag ---------------- */

function IdagLag({
    beat,
    p,
    pt,
    norgeSti,
}: {
    beat: number;
    p: GeoProjection;
    pt: (ll: LngLat) => XY;
    norgeSti: string;
}) {
    return (
        <>
            <defs>
                <clipPath id="bokmal-norge">
                    <path d={norgeSti} />
                </clipPath>
            </defs>
            <g clipPath="url(#bokmal-norge)">
                <motion.path
                    d={polygon(p, VESTLAND)}
                    fill="#7c3aed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat === 0 ? 0.55 : 0.3 }}
                    transition={{ duration: 1 }}
                />
                <motion.path
                    d={polygon(p, SUNNMORE)}
                    fill="#6d28d9"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat === 0 ? 0.7 : 0.35 }}
                    transition={{ duration: 1, delay: 0.5 }}
                />
            </g>
            <Etikett
                xy={pt([7.6, 62.55])}
                tekst="Sunnmøre"
                storrelse={38}
                farge="#4c1d95"
                anker="start"
                dx={10}
                synlig={beat === 0}
            />
            <Etikett
                xy={pt([8.3, 61.15])}
                tekst="Vestland"
                storrelse={38}
                farge="#4c1d95"
                anker="start"
                dx={10}
                synlig={beat === 0}
            />
            <Prikk xy={pt(STEDER.bergen)} farge="#64748b" />
            <Etikett
                xy={pt(STEDER.bergen)}
                tekst="Bergen: unntaket"
                storrelse={32}
                farge="#475569"
                anker="end"
                dx={-22}
                dy={12}
                synlig={beat === 0}
            />
            {beat >= 2 && (
                <>
                    <Prikk xy={pt(STEDER.volda)} farge="#6d28d9" />
                    <Prikk xy={pt(STEDER.voss)} farge="#6d28d9" />
                    <Etikett
                        xy={pt(STEDER.volda)}
                        tekst="Volda"
                        storrelse={36}
                        anker="end"
                        dx={-22}
                        dy={12}
                    />
                    <Etikett
                        xy={pt(STEDER.voss)}
                        tekst="Voss"
                        storrelse={36}
                        anker="start"
                        dx={22}
                        dy={12}
                    />
                    <Boble
                        xy={pt([6.25, 61.45])}
                        tekst="ligner nynorsk"
                        farge="#5b21b6"
                        forsinkelse={0.4}
                    />
                </>
            )}
            {beat >= 3 && (
                <>
                    <Prikk xy={pt(STEDER.oslo)} farge="#1d4ed8" />
                    <Etikett
                        xy={pt(STEDER.oslo)}
                        tekst="Oslo"
                        storrelse={36}
                        anker="start"
                        dx={22}
                        dy={12}
                    />
                    <Boble
                        xy={pt(STEDER.oslo)}
                        tekst="hjemme i bokmål"
                        farge="#1d4ed8"
                        forsinkelse={0.3}
                    />
                </>
            )}
        </>
    );
}

function IdagKort({ beat }: { beat: number }) {
    return (
        <AnimatePresence mode="wait">
            {beat === 0 && (
                <motion.div
                    key="sterkest"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute rounded-2xl shadow-xl bg-white/95"
                    style={{ right: '4%', bottom: '12%', padding: '12px 24px' }}
                >
                    <div
                        className="font-display font-black"
                        style={{ fontSize: 32, color: '#5b21b6' }}
                    >
                        Nynorsk står sterkest her
                    </div>
                </motion.div>
            )}
            {beat === 1 && (
                <motion.div
                    key="ett"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute rounded-2xl shadow-xl bg-white/95"
                    style={{ right: '4%', bottom: '12%', padding: '12px 24px' }}
                >
                    <div
                        className="font-display font-black text-slate-900"
                        style={{ fontSize: 34 }}
                    >
                        Enklere med ett språk?
                    </div>
                </motion.div>
            )}
            {beat >= 3 && (
                <motion.div
                    key="id"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute rounded-2xl shadow-xl bg-white/95"
                    style={{ right: '4%', bottom: '12%', padding: '12px 24px' }}
                >
                    <div
                        className="font-display font-black text-slate-900"
                        style={{ fontSize: 32 }}
                    >
                        Språk = identitet
                    </div>
                    <div className="font-bold text-slate-600" style={{ fontSize: 22 }}>
                        hvem du er, og hvor du hører til
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* ---------------- norden ---------------- */

function NordenLag({ beat, pt }: { beat: number; pt: (ll: LngLat) => XY }) {
    const norge = pt([8.6, 60.6]);
    const sverige = pt([15.2, 61.4]);
    const danmark = pt([9.3, 56.1]);
    return (
        <>
            {beat === 0 && (
                <>
                    <Lapp
                        xy={[norge[0] - 30, norge[1] - 70]}
                        tekst="hovedmål"
                        farge="#1d4ed8"
                        bakgrunn="#eff6ff"
                    />
                    <Lapp
                        xy={[norge[0] - 30, norge[1] + 10]}
                        tekst="sidemål"
                        farge="#6d28d9"
                        bakgrunn="#f5f3ff"
                        forsinkelse={0.8}
                    />
                </>
            )}
            {beat === 1 && (
                <>
                    {[0, 1, 2].map((i) => (
                        <motion.circle
                            key={i}
                            cx={norge[0]}
                            cy={norge[1]}
                            fill="none"
                            stroke="#b45309"
                            strokeWidth={5}
                            initial={{ r: 16, opacity: 0.9 }}
                            animate={{ r: 110, opacity: 0 }}
                            transition={{ duration: 2.4, delay: i * 0.8, repeat: Infinity }}
                        />
                    ))}
                    <Boble xy={norge} tekst="din egen dialekt" farge="#92400e" />
                </>
            )}
            {beat >= 2 && (
                <>
                    <motion.path
                        d={bue(norge, sverige, -0.25)}
                        fill="none"
                        stroke="#0369a1"
                        strokeWidth={6}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1 }}
                    />
                    <motion.path
                        d={bue(norge, danmark, 0.25)}
                        fill="none"
                        stroke="#0369a1"
                        strokeWidth={6}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.4 }}
                    />
                    <Lapp
                        xy={[norge[0] - 40, norge[1] - 40]}
                        tekst="bokmål + nynorsk"
                        farge="#92400e"
                        bakgrunn="#fffbeb"
                    />
                    <Etikett xy={sverige} tekst="svensk" storrelse={44} farge="#0c4a6e" dy={14} />
                    <Etikett
                        xy={danmark}
                        tekst="dansk"
                        storrelse={44}
                        farge="#0c4a6e"
                        anker="start"
                        dx={70}
                        dy={14}
                    />
                </>
            )}
        </>
    );
}

function NordenKort({ beat }: { beat: number }) {
    const tekst = ['Språk varierer', 'Du hører din egen dialekt', 'Lettere å forstå naboene'][
        Math.min(beat, 2)
    ];
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={tekst}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute rounded-2xl shadow-xl bg-white/95"
                style={{ right: '4%', top: '8%', padding: '12px 24px' }}
            >
                <div className="font-bold text-slate-500" style={{ fontSize: 20 }}>
                    Praktisk argument
                </div>
                <div className="font-display font-black text-slate-900" style={{ fontSize: 32 }}>
                    {tekst}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export function BokmalKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'union';
    const utsnitt = UTSNITT[modus];
    const { geographies } = useFilmVerden(utsnitt);
    const p = useMemo(() => lagProjeksjon(utsnitt), [utsnitt]);
    const sti = useMemo(() => geoPath(p), [p]);
    const pt = (ll: LngLat) => p(ll) as XY;
    const norgeSti = useMemo(() => {
        const n = (geographies as { id?: string | number }[]).find(
            (g) => String(g.id ?? '') === NORGE
        );
        return n ? (sti(n as never) ?? '') : '';
    }, [geographies, sti]);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: HAV }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <Land geographies={geographies} sti={sti} modus={modus} beat={beat} />
                {modus === 'union' && <UnionLag beat={beat} pt={pt} />}
                {modus === 'idag' && <IdagLag beat={beat} p={p} pt={pt} norgeSti={norgeSti} />}
                {modus === 'norden' && <NordenLag beat={beat} pt={pt} />}
            </svg>
            {modus === 'union' && <UnionKort beat={beat} />}
            {modus === 'idag' && <IdagKort beat={beat} />}
            {modus === 'norden' && <NordenKort beat={beat} />}
            <div
                className="absolute rounded-lg bg-white/85 font-bold text-slate-600"
                style={{ right: '2%', bottom: '3%', padding: '3px 12px', fontSize: 16 }}
            >
                {modus === 'idag' ? 'Områdene er omtrentlige. Dagens grenser' : 'Dagens grenser'}
            </div>
        </div>
    );
}
