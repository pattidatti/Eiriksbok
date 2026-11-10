import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart over Sør-Norge (og Europa for skarre-r). «buss»: bussen fra Bergen mot Drammen, og
 * hvor språket skifter. «hovedgrense»: skillet mellom østnorsk og vestnorsk langs Langfjella.
 * «palatal»: grensen for den myke j-lyden, som krysser hovedgrensen. «skarre»: skarre-r fra
 * Paris til Kristiansand og Bergen, og beltet som vokser fra Risør. Linjene er omtrentlige.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'buss' | 'hovedgrense' | 'palatal' | 'skarre';

const BERGEN: LngLat = [5.32, 60.39];
const DRAMMEN: LngLat = [10.2, 59.74];
const OSLO: LngLat = [10.75, 59.91];
const KRISTIANSAND: LngLat = [7.99, 58.15];
const RISOR: LngLat = [9.23, 58.72];
const PARIS: LngLat = [2.35, 48.86];

/** Bussveien, grovt: Voss, over fjellet, Hallingdal, Hønefoss og ned til Drammen. */
const BUSSVEI: LngLat[] = [
    BERGEN,
    [5.8, 60.47],
    [6.42, 60.63],
    [7.1, 60.6],
    [7.7, 60.58],
    [8.21, 60.53],
    [8.94, 60.7],
    [9.6, 60.42],
    [10.26, 60.17],
    [10.25, 59.95],
    DRAMMEN,
];

/** Skillet mellom østnorsk og vestnorsk, omtrentlig. */
const HOVEDGRENSE: LngLat[] = [
    [9.72, 59.02],
    [9.15, 59.25],
    [8.4, 59.42],
    [7.75, 59.8],
    [7.6, 60.3],
    [7.85, 60.9],
    [8.2, 61.4],
    [8.4, 61.9],
    [8.15, 62.4],
    [7.7, 62.78],
    [7.3, 62.98],
];

/** Grensen for den myke j-lyden, som en skisse: sør til Hedmark, mellom Valdres og Gudbrandsdalen. */
const PALATAL: LngLat[] = [
    [9.0, 61.38],
    [9.45, 61.3],
    [10.0, 61.05],
    [10.8, 60.72],
    [11.6, 60.52],
    [12.45, 60.45],
];

/** Kysten fra Risør mot Bergen, der skarre-beltet vokser. */
const KYST: LngLat[] = [
    RISOR,
    [8.77, 58.46],
    [8.4, 58.3],
    KRISTIANSAND,
    [7.46, 58.03],
    [6.66, 58.28],
    [6.0, 58.45],
    [5.73, 58.97],
    [5.27, 59.41],
    [5.3, 59.9],
    BERGEN,
];

/** En tenkt isogloss (ikke et ekte trekk), bare for å vise at linjer flytter seg. */
const TENKT: LngLat[] = [
    [8.3, 58.7],
    [8.45, 59.2],
    [8.35, 59.7],
    [8.6, 60.2],
    [8.5, 60.6],
];

/** Fjell langs Langfjella (bare symboler). */
const FJELL: LngLat[] = [
    [7.6, 59.75],
    [7.4, 60.1],
    [7.9, 60.45],
    [7.6, 60.75],
    [8.2, 61.0],
    [8.0, 61.35],
    [8.6, 61.55],
    [8.3, 61.85],
    [8.7, 62.15],
    [8.2, 62.35],
];

const SKANDINAVIA: [[number, number], [number, number]] = [
    [3.5, 57],
    [13.5, 64.5],
];

interface Utsnitt {
    sv: LngLat;
    no: LngLat;
}
const SOR_NORGE: Utsnitt = { sv: [4.4, 57.6], no: [12.9, 64.5] };
const BUSS: Utsnitt = { sv: [4.6, 59.2], no: [11.4, 61.2] };
const EUROPA: Utsnitt = { sv: [-3, 46.6], no: [14, 63.6] };
const SORKYST: Utsnitt = { sv: [4.4, 57.3], no: [10.4, 61.5] };

function utsnittFor(modus: Modus, beat: number): Utsnitt {
    if (modus === 'buss') return BUSS;
    if (modus === 'skarre') {
        if (beat === 0) return SORKYST;
        if (beat <= 2) return EUROPA;
        return SORKYST;
    }
    return SOR_NORGE;
}

interface Vindu {
    x: number;
    y: number;
    w: number;
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    buss: ['Bergen: «eg»', 'Drammen: «jæi»', 'Hvor skiftet språket?', 'Her går grensen?'],
    hovedgrense: [
        'Folk måtte reise for å møtes',
        'Østnorsk og vestnorsk',
        'Grensen følger Langfjella',
        'Fjellene skilte bygdene',
    ],
    palatal: [
        'Den myke j-lyden: «mannj»',
        'Grensen går mellom Valdres og Gudbrandsdalen',
        'Grensene følger ikke hverandre',
        'Et nett av linjer',
    ],
    skarre: [
        'Isoglosser flytter seg',
        'Skarre-r: Paris, 1600-tallet',
        'Rundt år 1800',
        'Fra 1950-tallet: fra Risør mot Bergen',
        'Grensen ligger et annet sted i dag',
    ],
};

export function GeolektKart({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'buss';
    // Det fine kartet bare for Sør-Skandinavia. Hele Europa i fint kart gjorde hver omtegning
    // så tung at avspillingen frøs. Europa-bildet (skarre, beat 1-2) bruker det grove kartet.
    const europa = modus === 'skarre' && beat >= 1 && beat <= 2;
    const { geographies } = useFilmVerden(europa ? undefined : SKANDINAVIA);

    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [0, 0],
                    [B, H],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [-4, 46],
                        [16, 64],
                    ],
                } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LngLat) => proj(ll) as [number, number];

    const vinduFor = (u: Utsnitt): Vindu => {
        const a = p(u.sv);
        const b = p(u.no);
        const w = Math.max(Math.abs(b[0] - a[0]), (Math.abs(b[1] - a[1]) * B) / H);
        return { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, w };
    };

    const mål = vinduFor(utsnittFor(modus, beat));
    const [vindu, setVindu] = useState<Vindu>(mål);
    const naa = useRef(vindu);
    useEffect(() => {
        const fra = naa.current;
        if (fra.x === mål.x && fra.y === mål.y && fra.w === mål.w) return;
        const c = animate(0, 1, {
            duration: playing ? 2.4 : 0.01,
            ease: 'easeInOut',
            onUpdate: (k) => {
                const w = Math.exp(Math.log(fra.w) + (Math.log(mål.w) - Math.log(fra.w)) * k);
                const ny = { x: fra.x + (mål.x - fra.x) * k, y: fra.y + (mål.y - fra.y) * k, w };
                naa.current = ny;
                setVindu(ny);
            },
        });
        return () => c.stop();
    }, [mål.x, mål.y, mål.w, playing]);

    const kk = B / vindu.w;
    const kartTransform = `translate(${B / 2} ${H / 2}) scale(${kk}) translate(${-vindu.x} ${-vindu.y})`;
    const skjerm = (ll: LngLat): [number, number] => {
        const [x, y] = p(ll);
        return [B / 2 + (x - vindu.x) * kk, H / 2 + (y - vindu.y) * kk];
    };
    const flytt = (ll: LngLat) => `translate(${skjerm(ll).join(' ')})`;
    const linje = (pts: LngLat[]) => `M ${pts.map((ll) => p(ll).join(' ')).join(' L ')}`;

    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];

    return (
        <div className="absolute inset-0 bg-[#bcd4e4] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
                style={{ willChange: 'transform' }}
            >
                <g transform={kartTransform}>
                    <defs>
                        <linearGradient
                            id="geolekt-skarre"
                            gradientUnits="userSpaceOnUse"
                            x1={p(RISOR)[0]}
                            y1={p(RISOR)[1]}
                            x2={p(BERGEN)[0]}
                            y2={p(BERGEN)[1]}
                        >
                            <stop offset="0" stopColor="#dc2626" />
                            <stop offset="0.45" stopColor="#dc2626" />
                            <stop offset="1" stopColor="#dc2626" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Land geographies={geographies} sti={sti} kk={Math.round(kk * 4) / 4} />
                    {modus === 'buss' && (
                        <path
                            d={linje(BUSSVEI)}
                            fill="none"
                            stroke="#475569"
                            strokeWidth={6 / kk}
                            strokeDasharray={`${14 / kk} ${10 / kk}`}
                            strokeLinecap="round"
                        />
                    )}
                    {(modus === 'hovedgrense' || modus === 'palatal') && (
                        <Hovedgrense
                            linje={linje(HOVEDGRENSE)}
                            kk={kk}
                            beat={beat}
                            dempet={modus === 'palatal' && beat <= 1}
                            tegnes={modus === 'hovedgrense'}
                            playing={playing}
                        />
                    )}
                    {modus === 'palatal' && beat >= 1 && (
                        <motion.path
                            d={linje(PALATAL)}
                            fill="none"
                            stroke="#7c3aed"
                            strokeWidth={9 / kk}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: beat === 1 ? 0 : 1 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: playing ? 2.4 : 0 }}
                        />
                    )}
                    {modus === 'skarre' && beat === 0 && (
                        <motion.path
                            d={linje(TENKT)}
                            fill="none"
                            stroke="#0f766e"
                            strokeWidth={8 / kk}
                            strokeLinecap="round"
                            strokeDasharray={`${16 / kk} ${12 / kk}`}
                            initial={{ x: 0 }}
                            animate={playing ? { x: [0, 10, 0] } : { x: 5 }}
                            transition={{
                                duration: 4,
                                repeat: playing ? Infinity : 0,
                                ease: 'easeInOut',
                            }}
                        />
                    )}
                    {modus === 'skarre' && beat >= 4 && (
                        <path
                            d={linje(KYST.slice(3))}
                            fill="none"
                            stroke="#475569"
                            strokeWidth={6 / kk}
                            strokeDasharray={`${14 / kk} ${10 / kk}`}
                            transform={`translate(0 ${-22 / kk})`}
                        />
                    )}
                    {modus === 'skarre' && beat >= 3 && (
                        <motion.path
                            d={linje(KYST)}
                            fill="none"
                            stroke="url(#geolekt-skarre)"
                            strokeOpacity={0.55}
                            strokeWidth={34 / kk}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: beat === 3 ? 0 : 1 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: playing ? 3.2 : 0, delay: playing ? 1 : 0 }}
                        />
                    )}
                </g>
            </svg>
            {/* Merker og bussen i et eget lag, så det store kartet ikke tegnes på nytt når bussen kjører. */}
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                {modus === 'buss' && <Buss beat={beat} playing={playing} skjerm={skjerm} />}
                {modus === 'hovedgrense' && (
                    <HovedgrenseMerker beat={beat} flytt={flytt} skjermFra={skjerm} />
                )}
                {modus === 'palatal' && <PalatalMerker beat={beat} flytt={flytt} />}
                {modus === 'skarre' && (
                    <SkarreMerker beat={beat} playing={playing} skjerm={skjerm} flytt={flytt} />
                )}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={overskrift}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-x-0 top-[5%] flex justify-center pointer-events-none"
                >
                    <div className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap">
                        {overskrift}
                    </div>
                </motion.div>
            </AnimatePresence>
            {modus !== 'buss' && !(modus === 'skarre' && beat <= 2) && (
                <div className="absolute left-[2.5%] bottom-[4%] px-3 py-1.5 rounded-xl bg-white/85 text-slate-600 font-semibold text-lg">
                    Linjene er tegnet omtrentlig
                </div>
            )}
        </div>
    );
}

const Land = memo(function Land({
    geographies,
    sti,
    kk,
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
    kk: number;
}) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill={String(g.id) === '578' ? '#f3ead6' : '#e6e1d2'}
                    stroke="#a8a08a"
                    strokeWidth={1.5 / kk}
                />
            ))}
        </>
    );
});

function Hovedgrense({
    linje,
    kk,
    beat,
    dempet,
    tegnes,
    playing,
}: {
    linje: string;
    kk: number;
    beat: number;
    dempet: boolean;
    tegnes: boolean;
    playing: boolean;
}) {
    if (tegnes && beat === 0) return null;
    // Beat 1: første del (Langesundsfjorden til Telemark), beat 2: resten.
    const lengde = tegnes ? (beat === 1 ? 0.32 : 1) : 1;
    return (
        <motion.path
            d={linje}
            fill="none"
            stroke={dempet ? '#94a3b8' : '#b91c1c'}
            strokeWidth={(dempet ? 7 : 10) / kk}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: tegnes ? (beat === 1 ? 0 : 0.32) : 1 }}
            animate={{ pathLength: lengde }}
            transition={{ duration: playing ? 2.6 : 0 }}
        />
    );
}

function Buss({
    beat,
    playing,
    skjerm,
}: {
    beat: number;
    playing: boolean;
    skjerm: (ll: LngLat) => [number, number];
}) {
    const mål = beat === 0 ? 0 : beat === 1 ? 1 : 0.48;
    const [andel, setAndel] = useState(mål);
    const naa = useRef(andel);
    useEffect(() => {
        const c = animate(naa.current, mål, {
            duration: playing ? 2.4 : 0.01,
            ease: 'easeInOut',
            onUpdate: (k) => {
                naa.current = k;
                setAndel(k);
            },
        });
        return () => c.stop();
    }, [mål, playing]);

    const pts = BUSSVEI.map(skjerm);
    const lengder = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
    const total = lengder.reduce((a, b) => a + b, 0);
    let igjen = andel * total;
    let pos = pts[0];
    for (let i = 0; i < lengder.length; i++) {
        if (igjen <= lengder[i]) {
            const k = lengder[i] ? igjen / lengder[i] : 0;
            pos = [
                pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k,
                pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k,
            ];
            break;
        }
        igjen -= lengder[i];
        pos = pts[i + 1];
    }

    const bergen = skjerm(BERGEN);
    const drammen = skjerm(DRAMMEN);
    const oslo = skjerm(OSLO);
    const fjell = skjerm([7.75, 60.58]);
    const tunnel = skjerm([6.9, 60.62]);

    return (
        <g>
            <By xy={bergen} navn="Bergen" anker="middle" dx={0} dy={56} />
            <By xy={drammen} navn="Drammen" anker="start" dx={24} dy={40} />
            <By xy={oslo} navn="Oslo" anker="start" dx={22} dy={-8} />
            {beat === 0 && (
                <Boble xy={[bergen[0] + 40, bergen[1] - 150]} tekst="«eg»" farge="#1d4ed8" />
            )}
            {beat === 1 && (
                <Boble xy={[drammen[0] - 120, drammen[1] - 170]} tekst="«jæi»" farge="#b45309" />
            )}
            {beat === 2 && (
                <>
                    <Sporsmal xy={fjell} tekst="Fjellet?" />
                    <Sporsmal xy={tunnel} tekst="Tunnelen?" dy={150} />
                </>
            )}
            {beat >= 3 &&
                [6.3, 7.9, 9.4].map((lng, i) => {
                    const [x, y] = skjerm([lng, 60.55]);
                    return (
                        <motion.g
                            key={lng}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.5 }}
                        >
                            <line
                                x1={x}
                                y1={y - 190}
                                x2={x}
                                y2={y + 190}
                                stroke="#b91c1c"
                                strokeWidth={6}
                                strokeDasharray="16 12"
                            />
                            <text
                                x={x}
                                y={y + 240}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={900}
                                fill="#b91c1c"
                                stroke="#fff"
                                strokeWidth={8}
                                paintOrder="stroke"
                            >
                                Her?
                            </text>
                        </motion.g>
                    );
                })}
            <g transform={`translate(${pos[0]} ${pos[1]})`}>
                <rect
                    x={-46}
                    y={-26}
                    width={92}
                    height={46}
                    rx={10}
                    fill="#dc2626"
                    stroke="#fff"
                    strokeWidth={5}
                />
                <rect x={-34} y={-18} width={20} height={16} rx={3} fill="#e0f2fe" />
                <rect x={-8} y={-18} width={20} height={16} rx={3} fill="#e0f2fe" />
                <rect x={18} y={-18} width={18} height={16} rx={3} fill="#e0f2fe" />
                <circle cx={-26} cy={22} r={9} fill="#1e293b" />
                <circle cx={26} cy={22} r={9} fill="#1e293b" />
            </g>
        </g>
    );
}

function By({
    xy,
    navn,
    anker,
    dx,
    dy = 12,
}: {
    xy: [number, number];
    navn: string;
    anker: 'start' | 'end' | 'middle';
    dx: number;
    dy?: number;
}) {
    return (
        <g transform={`translate(${xy[0]} ${xy[1]})`}>
            <circle r={12} fill="#0f172a" stroke="#fff" strokeWidth={4} />
            <Etikett tekst={navn} x={dx} dy={dy} anker={anker} />
        </g>
    );
}

function Boble({ xy, tekst, farge }: { xy: [number, number]; tekst: string; farge: string }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 200, damping: 16 }}
            style={{ transformOrigin: `${xy[0]}px ${xy[1]}px` }}
        >
            <rect
                x={xy[0] - 110}
                y={xy[1] - 55}
                width={220}
                height={100}
                rx={28}
                fill="#fff"
                stroke={farge}
                strokeWidth={6}
            />
            <path
                d={`M ${xy[0] - 30} ${xy[1] + 44} L ${xy[0] - 60} ${xy[1] + 90} L ${xy[0]} ${xy[1] + 44} Z`}
                fill="#fff"
                stroke={farge}
                strokeWidth={6}
                strokeLinejoin="round"
            />
            <rect x={xy[0] - 34} y={xy[1] + 38} width={36} height={10} fill="#fff" />
            <text
                x={xy[0]}
                y={xy[1] + 18}
                textAnchor="middle"
                fontSize={56}
                fontWeight={900}
                fill={farge}
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Sporsmal({ xy, tekst, dy = -110 }: { xy: [number, number]; tekst: string; dy?: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <line
                x1={xy[0]}
                y1={xy[1]}
                x2={xy[0]}
                y2={xy[1] + dy * 0.55}
                stroke="#0f172a"
                strokeWidth={4}
            />
            <circle cx={xy[0]} cy={xy[1]} r={10} fill="#0f172a" />
            <Etikett tekst={tekst} x={xy[0]} dy={xy[1] + dy * 0.7} farge="#0f172a" stor />
        </motion.g>
    );
}

function HovedgrenseMerker({
    beat,
    flytt,
    skjermFra,
}: {
    beat: number;
    flytt: (ll: LngLat) => string;
    skjermFra: (ll: LngLat) => [number, number];
}) {
    return (
        <g>
            {beat !== 1 &&
                FJELL.map((ll, i) => (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transform={flytt(ll)}
                    >
                        <path
                            d="M -26 14 L 0 -28 L 26 14 Z"
                            fill={beat === 3 ? '#57534e' : '#78716c'}
                            stroke="#fff"
                            strokeWidth={3}
                        />
                        <path d="M -8 -15 L 0 -28 L 8 -15 Z" fill="#fff" />
                    </motion.g>
                ))}
            {(beat === 0 || beat === 3) && (
                <>
                    {[
                        [6.0, 61.6],
                        [6.3, 60.0],
                        [10.2, 61.6],
                        [10.6, 60.3],
                    ].map((ll, i) => (
                        <g key={i} transform={flytt(ll as LngLat)}>
                            <Hus />
                        </g>
                    ))}
                    {[
                        [
                            [6.0, 61.6],
                            [10.2, 61.6],
                        ],
                        [
                            [6.3, 60.0],
                            [10.6, 60.3],
                        ],
                    ].map(([a, b], i) => {
                        const pa = skjermFra(a as LngLat);
                        const pb = skjermFra(b as LngLat);
                        return (
                            <motion.path
                                key={i}
                                d={`M ${pa[0] + 20} ${pa[1]} Q ${(pa[0] + pb[0]) / 2} ${pa[1] - 80} ${pb[0] - 20} ${pb[1]}`}
                                fill="none"
                                stroke="#475569"
                                strokeWidth={5}
                                strokeDasharray="12 10"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 + i * 0.4 }}
                            />
                        );
                    })}
                    {beat === 0 && (
                        <g transform={flytt([8.0, 59.05])}>
                            <Etikett
                                tekst="lang og tung vei over fjellet"
                                x={0}
                                dy={0}
                                farge="#334155"
                            />
                        </g>
                    )}
                </>
            )}
            {beat >= 1 && (
                <>
                    <g transform={flytt([9.72, 59.02])}>
                        <circle r={10} fill="#b91c1c" stroke="#fff" strokeWidth={3} />
                        <Etikett tekst="Langesundsfjorden" x={22} dy={34} anker="start" />
                    </g>
                    <g transform={flytt([8.4, 59.42])}>
                        <Etikett tekst="Telemark" x={-26} dy={56} anker="end" farge="#475569" />
                    </g>
                </>
            )}
            {beat >= 2 && (
                <>
                    <g transform={flytt([8.7, 61.85])}>
                        <Etikett tekst="Langfjella" x={30} dy={0} anker="start" farge="#57534e" />
                    </g>
                    <g transform={flytt([7.16, 62.74])}>
                        <circle r={9} fill="#0f172a" stroke="#fff" strokeWidth={3} />
                        <Etikett tekst="Romsdal" x={-20} dy={34} anker="end" />
                    </g>
                    <g transform={flytt([7.9, 63.1])}>
                        <circle r={9} fill="#0f172a" stroke="#fff" strokeWidth={3} />
                        <Etikett tekst="Nordmøre" x={20} dy={34} anker="start" />
                    </g>
                </>
            )}
            {beat >= 1 && (
                <>
                    <g transform={flytt([5.5, 61.35])}>
                        <Etikett tekst="VESTNORSK" x={0} dy={0} farge="#1d4ed8" stor />
                    </g>
                    <g transform={flytt([10.6, 60.85])}>
                        <Etikett tekst="ØSTNORSK" x={0} dy={0} farge="#b45309" stor />
                    </g>
                </>
            )}
        </g>
    );
}

function PalatalMerker({ beat, flytt }: { beat: number; flytt: (ll: LngLat) => string }) {
    return (
        <g>
            {beat === 0 && (
                <g transform={flytt([10.7, 61.7])}>
                    <rect
                        x={-150}
                        y={-60}
                        width={300}
                        height={100}
                        rx={28}
                        fill="#fff"
                        stroke="#7c3aed"
                        strokeWidth={6}
                    />
                    <text y={12} textAnchor="middle" fontSize={56} fontWeight={900} fill="#7c3aed">
                        «mannj»
                    </text>
                </g>
            )}
            {beat >= 1 && (
                <>
                    <g transform={flytt([9.23, 60.99])}>
                        <circle r={10} fill="#0f172a" stroke="#fff" strokeWidth={3} />
                        <Etikett tekst="Valdres" x={-20} dy={44} anker="end" />
                    </g>
                    <g transform={flytt([9.6, 61.75])}>
                        <circle r={10} fill="#0f172a" stroke="#fff" strokeWidth={3} />
                        <Etikett tekst="Gudbrandsdalen" x={0} dy={-26} />
                    </g>
                    <g transform={flytt([11.7, 61.25])}>
                        <Etikett tekst="Hedmark" x={0} dy={0} farge="#475569" />
                    </g>
                    <g transform={flytt([10.6, 62.75])}>
                        <Etikett tekst="myk j-lyd" x={0} dy={0} farge="#7c3aed" stor />
                    </g>
                </>
            )}
            {beat >= 2 && (
                <>
                    <g transform={flytt([6.7, 60.0])}>
                        <Etikett tekst="Langfjella" x={0} dy={0} farge="#64748b" />
                    </g>
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <g transform={flytt([9.23, 60.99])}>
                            <circle r={26} fill="none" stroke="#16a34a" strokeWidth={6} />
                        </g>
                        <g transform={flytt([9.6, 61.75])}>
                            <circle r={26} fill="none" stroke="#16a34a" strokeWidth={6} />
                        </g>
                    </motion.g>
                </>
            )}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <rect
                        x={1020}
                        y={640}
                        width={520}
                        height={170}
                        rx={24}
                        fill="#fff"
                        fillOpacity={0.96}
                    />
                    <line
                        x1={1060}
                        y1={700}
                        x2={1140}
                        y2={700}
                        stroke="#b91c1c"
                        strokeWidth={10}
                        strokeLinecap="round"
                    />
                    <text x={1160} y={712} fontSize={34} fontWeight={800} fill="#0f172a">
                        østnorsk og vestnorsk
                    </text>
                    <line
                        x1={1060}
                        y1={770}
                        x2={1140}
                        y2={770}
                        stroke="#7c3aed"
                        strokeWidth={10}
                        strokeLinecap="round"
                    />
                    <text x={1160} y={782} fontSize={34} fontWeight={800} fill="#0f172a">
                        myk j-lyd
                    </text>
                </motion.g>
            )}
        </g>
    );
}

function SkarreMerker({
    beat,
    playing,
    skjerm,
    flytt,
}: {
    beat: number;
    playing: boolean;
    skjerm: (ll: LngLat) => [number, number];
    flytt: (ll: LngLat) => string;
}) {
    return (
        <g>
            {beat === 0 && (
                <g transform={flytt([8.7, 59.8])}>
                    <Etikett
                        tekst="en tenkt isogloss som flytter seg"
                        x={40}
                        dy={0}
                        anker="start"
                        farge="#0f766e"
                    />
                </g>
            )}
            {beat >= 1 && beat <= 2 && (
                <g transform={flytt(PARIS)}>
                    <motion.circle
                        r={34}
                        fill="#dc2626"
                        fillOpacity={0.25}
                        animate={playing ? { scale: [1, 1.5, 1] } : { scale: 1.2 }}
                        transition={{ duration: 2, repeat: playing ? Infinity : 0 }}
                    />
                    <circle r={14} fill="#dc2626" stroke="#fff" strokeWidth={4} />
                    <Etikett tekst="Paris" x={26} dy={12} anker="start" />
                </g>
            )}
            {beat === 2 &&
                [KRISTIANSAND, BERGEN].map((ll, i) => {
                    const til = skjerm(ll);
                    return (
                        <g key={i}>
                            <motion.circle
                                cx={til[0]}
                                cy={til[1]}
                                r={30}
                                fill="#dc2626"
                                fillOpacity={0.25}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{
                                    duration: playing ? 1 : 0,
                                    delay: playing ? 0.6 + i * 0.5 : 0,
                                }}
                            />
                            <circle
                                cx={til[0]}
                                cy={til[1]}
                                r={13}
                                fill="#dc2626"
                                stroke="#fff"
                                strokeWidth={4}
                            />
                            <Etikett
                                tekst={i === 0 ? 'Kristiansand' : 'Bergen'}
                                x={til[0] + 22}
                                dy={til[1] + 12}
                                anker="start"
                            />
                        </g>
                    );
                })}
            {beat >= 3 && (
                <>
                    {[KRISTIANSAND, BERGEN].map((ll, i) => (
                        <g key={i} transform={flytt(ll)}>
                            <circle r={13} fill="#dc2626" stroke="#fff" strokeWidth={4} />
                            <Etikett
                                tekst={i === 0 ? 'Kristiansand' : 'Bergen'}
                                x={i === 0 ? 0 : 24}
                                dy={i === 0 ? 56 : 12}
                                anker={i === 0 ? 'middle' : 'start'}
                            />
                        </g>
                    ))}
                    <g transform={flytt(RISOR)}>
                        <circle r={13} fill="#0f172a" stroke="#fff" strokeWidth={4} />
                        <Etikett tekst="Risør" x={24} dy={12} anker="start" />
                    </g>
                    <g transform={flytt([6.9, 58.55])}>
                        <Etikett tekst="skarre-beltet" x={0} dy={0} farge="#b91c1c" stor />
                    </g>
                </>
            )}
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <rect
                        x={1010}
                        y={170}
                        width={520}
                        height={190}
                        rx={24}
                        fill="#fff"
                        fillOpacity={0.96}
                    />
                    <text
                        x={1270}
                        y={246}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Da bestemor var ung:
                    </text>
                    <text
                        x={1270}
                        y={310}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={700}
                        fill="#b91c1c"
                    >
                        grensen lå et annet sted
                    </text>
                </motion.g>
            )}
        </g>
    );
}

function Hus() {
    return (
        <g>
            <rect
                x={-12}
                y={-8}
                width={24}
                height={16}
                fill="#7a4a2a"
                stroke="#fff"
                strokeWidth={2}
            />
            <path d="M -15 -8 L 0 -20 L 15 -8 Z" fill="#4d5a3a" stroke="#fff" strokeWidth={2} />
        </g>
    );
}

function Etikett({
    tekst,
    dy,
    x = 0,
    farge = '#0f172a',
    anker = 'middle',
    stor = false,
}: {
    tekst: string;
    dy: number;
    x?: number;
    farge?: string;
    anker?: 'middle' | 'end' | 'start';
    stor?: boolean;
}) {
    return (
        <text
            x={x}
            y={dy}
            textAnchor={anker}
            fontSize={stor ? 44 : 34}
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
