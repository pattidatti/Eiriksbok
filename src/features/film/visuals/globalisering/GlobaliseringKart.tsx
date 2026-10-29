import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
    AnimatePresence,
    animate,
    motion,
    useMotionValue,
    useMotionValueEvent,
} from 'framer-motion';
import { geoMercator, geoNaturalEarth1, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { Overskrift } from './felles';
import { tekstFor } from './felles3d';

/**
 * Kartene i Globalisering-filmen, i tre moduser.
 *
 * «tid»: verden med handelslinjer. Beat 0: linjer mellom byer, med prikker som reiser.
 * Beat 1: få, tynne linjer (handel i tusenvis av år). Beat 2: flere og raskere linjer
 * (1800-tallet). Beat 3: alle linjene, raske prikker, og kartet krymper (verden blir
 * «mindre»). Beat 4: landene i det gamle Sovjetunionen lyser opp.
 *
 * «bangladesh»: Sør-Asia med Bangladesh uthevet, og et faktapanel til høyre som fylles ut
 * per beat. Beat 3 zoomer ut og viser Kina.
 *
 * «kjede»: ruta fra Bangladesh gjennom Suezkanalen til Europa. Beat 1: kjeden ryker ved
 * Suez. Beat 2-3: zoom inn på kanalen, skipet på tvers og køen av skip. Beat 4: zoom ut.
 */

type Modus = 'tid' | 'bangladesh' | 'kjede';
type LngLat = [number, number];

const B = 1600;
const H = 900;

const ID = { bangladesh: 50, india: 356, kina: 156, egypt: 818 };
const SOVJET = [643, 804, 112, 398, 860, 795, 417, 762, 268, 51, 31, 498, 440, 428, 233];

const BYER: Record<string, LngLat> = {
    dhaka: [90.4, 23.8],
    shanghai: [121.5, 31.2],
    rotterdam: [4.5, 51.9],
    newYork: [-74, 40.7],
    lagos: [3.4, 6.5],
    saoPaulo: [-46.6, -23.5],
    mumbai: [72.9, 19.1],
    tokyo: [139.7, 35.7],
    losAngeles: [-118.2, 34],
    sydney: [151.2, -33.9],
    oslo: [10.75, 59.9],
    dubai: [55.3, 25.3],
    moskva: [37.6, 55.75],
    almaty: [76.9, 43.2],
};

/** Linjene på verdenskartet, og fra hvilken beat de vises (i «tid»). */
const LINJER: { fra: string; til: string; beat: number[] }[] = [
    { fra: 'dhaka', til: 'rotterdam', beat: [0, 1, 2, 3, 4] },
    { fra: 'shanghai', til: 'losAngeles', beat: [0, 2, 3, 4] },
    { fra: 'rotterdam', til: 'newYork', beat: [0, 1, 2, 3, 4] },
    { fra: 'mumbai', til: 'dubai', beat: [0, 1, 3, 4] },
    { fra: 'lagos', til: 'rotterdam', beat: [0, 2, 3, 4] },
    { fra: 'saoPaulo', til: 'newYork', beat: [0, 2, 3, 4] },
    { fra: 'tokyo', til: 'shanghai', beat: [0, 1, 3, 4] },
    { fra: 'sydney', til: 'tokyo', beat: [0, 3, 4] },
    { fra: 'oslo', til: 'rotterdam', beat: [0, 2, 3, 4] },
    { fra: 'dhaka', til: 'shanghai', beat: [0, 1, 2, 3, 4] },
    { fra: 'dubai', til: 'rotterdam', beat: [0, 2, 3, 4] },
    { fra: 'losAngeles', til: 'newYork', beat: [3, 4] },
    { fra: 'lagos', til: 'saoPaulo', beat: [3, 4] },
    { fra: 'mumbai', til: 'sydney', beat: [3, 4] },
    { fra: 'moskva', til: 'rotterdam', beat: [4] },
    { fra: 'almaty', til: 'shanghai', beat: [4] },
    { fra: 'moskva', til: 'dubai', beat: [4] },
];

/** Ruta for skjorta: Chittagong, rundt India, gjennom Suez, til Rotterdam. */
const RUTE: LngLat[] = [
    [91.8, 22.3],
    [89, 19],
    [84, 10],
    [81, 5.5],
    [76, 6.5],
    [62, 13],
    [50, 12.5],
    [43.4, 12.6],
    [38.5, 19.5],
    [34.6, 26.4],
    [33.6, 27.9],
    [32.57, 29.93],
    [32.34, 30.6],
    [32.3, 31.27],
    [26, 33.6],
    [12, 37.6],
    [-5.6, 35.95],
    [-10, 38.5],
    [-9.6, 43.6],
    [-4.5, 48.6],
    [1.5, 50.5],
    [4.2, 51.95],
];
const SUEZ_INDEKS = 11;
const SUEZ: LngLat = [32.45, 30.45];
const KANAL: LngLat[] = [
    [32.3, 31.27],
    [32.34, 30.6],
    [32.57, 29.93],
];
const EVER_GIVEN: LngLat = [32.57, 30.02];

const UTSNITT: Record<Modus, Utsnitt | undefined> = {
    tid: undefined,
    bangladesh: [
        [60, 0],
        [135, 52],
    ],
    kjede: undefined,
};

function lagProjeksjon(modus: Modus): GeoProjection {
    if (modus === 'tid')
        return geoNaturalEarth1().fitExtent(
            [
                [40, 60],
                [B - 40, H - 40],
            ],
            { type: 'Sphere' } as never
        );
    if (modus === 'bangladesh')
        return geoMercator().fitExtent(
            [
                [30, 40],
                [1000, 870],
            ],
            {
                type: 'MultiPoint',
                coordinates: [
                    [62, 5],
                    [128, 48],
                ],
            } as never
        );
    return geoMercator().fitExtent(
        [
            [60, 150],
            [B - 60, H - 30],
        ],
        {
            type: 'MultiPoint',
            coordinates: [
                [-12, 2],
                [100, 56],
            ],
        } as never
    );
}

/** Zoom-mål per beat: faktor og punktet kartet zoomer mot. */
function zoomFor(modus: Modus, beat: number): { z: number; mot: LngLat } {
    if (modus === 'tid') return { z: beat >= 3 ? 0.8 : 1, mot: [20, 10] };
    if (modus === 'bangladesh')
        return beat === 3 ? { z: 1, mot: [95, 26] } : { z: 3.6, mot: [90.3, 23.6] };
    if (beat === 2 || beat === 3) return { z: 6, mot: SUEZ };
    return { z: 1, mot: SUEZ };
}

function bue(a: [number, number], b: [number, number]) {
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const loft = Math.min(160, l * 0.25);
    // Buen løfter seg alltid oppover på skjermen.
    let nx = -dy / l;
    let ny = dx / l;
    if (ny > 0) {
        nx = -nx;
        ny = -ny;
    }
    return `M ${a[0]} ${a[1]} Q ${mx + nx * loft} ${my + ny * loft} ${b[0]} ${b[1]}`;
}

export function GlobaliseringKart({
    beat,
    playing,
    props,
}: VisualProps<{ modus?: Modus; tekster?: string[]; steder?: string[] }>) {
    const modus: Modus = props?.modus ?? 'tid';
    const { geographies } = useFilmVerden(UTSNITT[modus]);
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];

    const svgRef = useRef<SVGSVGElement>(null);
    useEffect(() => {
        const s = svgRef.current;
        if (!s) return;
        if (playing) s.unpauseAnimations();
        else s.pauseAnimations();
    }, [playing]);

    // Zoomen glir mellom beatene. På pause hopper den rett dit.
    const mål = zoomFor(modus, beat);
    const z = useMotionValue(mål.z);
    const mx = useMotionValue(mål.mot[0]);
    const my = useMotionValue(mål.mot[1]);
    useEffect(() => {
        const m = zoomFor(modus, beat);
        if (!playing) {
            z.set(m.z);
            mx.set(m.mot[0]);
            my.set(m.mot[1]);
            return;
        }
        const opts = { duration: 2.6, ease: 'easeInOut' as const };
        const a = animate(z, m.z, opts);
        const b = animate(mx, m.mot[0], opts);
        const c = animate(my, m.mot[1], opts);
        return () => {
            a.stop();
            b.stop();
            c.stop();
        };
    }, [beat, playing, modus, z, mx, my]);
    const [zv, setZv] = useState(mål.z);
    const [mv, setMv] = useState<LngLat>(mål.mot);
    useMotionValueEvent(z, 'change', setZv);
    useMotionValueEvent(mx, 'change', (x) => setMv((g) => [x, g[1]]));
    useMotionValueEvent(my, 'change', (y) => setMv((g) => [g[0], y]));

    const senter = p(mv);
    // «tid» krymper rundt midten av bildet; de andre zoomer mot et punkt.
    const cx = modus === 'tid' ? B / 2 : senter[0];
    const cy = modus === 'tid' ? H / 2 : senter[1];
    const mal = modus === 'bangladesh' ? [515, 455] : [B / 2, H / 2];
    const tx = mal[0] - cx * zv;
    const ty = mal[1] - cy * zv;
    const kartTransform = `translate(${tx} ${ty}) scale(${zv})`;
    const skjerm = (pt: [number, number]): [number, number] => [tx + pt[0] * zv, ty + pt[1] * zv];

    const tekst = tekstFor(props?.tekster, beat);
    const steder = props?.steder ?? [];

    const uthevet = (id: number) => {
        if (modus === 'tid') return beat >= 4 && SOVJET.includes(id) ? '#fb923c' : null;
        if (modus === 'bangladesh') {
            if (id === ID.bangladesh) return '#16a34a';
            if (id === ID.kina && beat === 3) return '#f87171';
            return null;
        }
        if (id === ID.egypt && beat >= 1) return '#fef3c7';
        return null;
    };

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#cfe3f1' }}>
            <svg
                ref={svgRef}
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <g transform={kartTransform}>
                    {modus === 'tid' && (
                        <path d={sti({ type: 'Sphere' } as never) ?? ''} fill="#bfdbfe" />
                    )}
                    <Land geographies={geographies} sti={sti} />
                    {geographies.map((g, i) => {
                        const f = uthevet(Number(g.id));
                        if (!f) return null;
                        return (
                            <motion.path
                                key={`u-${g.id ?? 'x'}-${i}`}
                                d={sti(g as never) ?? ''}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8 }}
                                fill={f}
                                stroke="#7c6f57"
                                strokeWidth={1.2 / zv}
                            />
                        );
                    })}
                    {modus === 'kjede' && <Kjede beat={beat} p={p} zv={zv} />}
                </g>

                {modus === 'tid' && <Linjer beat={beat} skjerm={(ll) => skjerm(p(ll))} />}

                {modus === 'bangladesh' && (
                    <>
                        <Merke
                            pt={skjerm(p([90.4, 23.8]))}
                            tekst={beat === 3 ? '' : 'Dhaka'}
                            dy={-22}
                            prikk
                        />
                        <Merke
                            pt={skjerm(p([90.2, beat === 3 ? 19.5 : 21.2]))}
                            tekst="Bangladesh"
                            dy={0}
                            farge="#15803d"
                            stor
                        />
                        <Merke pt={skjerm(p([78.5, 21]))} tekst="India" dy={0} farge="#57534e" />
                        {beat === 3 && (
                            <Merke
                                pt={skjerm(p([103, 35]))}
                                tekst="Kina"
                                dy={0}
                                farge="#b91c1c"
                                stor
                            />
                        )}
                    </>
                )}

                {modus === 'kjede' && (
                    <KjedeMerker beat={beat} skjerm={(ll) => skjerm(p(ll))} steder={steder} />
                )}
            </svg>

            {modus === 'bangladesh' ? (
                <Panel tekster={props?.tekster ?? []} beat={beat} />
            ) : (
                <AnimatePresence mode="wait">
                    {tekst && (
                        <Overskrift
                            key={`${modus}-${beat}`}
                            tekst={tekst}
                            tone={modus === 'kjede' && beat === 1 ? 'rod' : 'lys'}
                        />
                    )}
                </AnimatePresence>
            )}
        </div>
    );
}

/** Landene endrer seg aldri, så de tegnes bare én gang. */
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
                    vectorEffect="non-scaling-stroke"
                />
            ))}
        </>
    );
});

function Linjer({ beat, skjerm }: { beat: number; skjerm: (ll: LngLat) => [number, number] }) {
    const gammel = beat === 1;
    const fart = beat >= 3 ? 2.2 : beat === 2 ? 4.5 : 6;
    const farge = gammel ? '#a16207' : beat >= 3 ? '#e11d48' : '#1d4ed8';
    return (
        <>
            {LINJER.map((l, i) => {
                const vis = l.beat.includes(beat);
                const d = bue(skjerm(BYER[l.fra]), skjerm(BYER[l.til]));
                return (
                    <g key={`${l.fra}-${l.til}`}>
                        <motion.path
                            d={d}
                            fill="none"
                            stroke={farge}
                            strokeLinecap="round"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: vis ? (gammel ? 0.55 : 0.85) : 0,
                                strokeWidth: gammel ? 2 : beat >= 3 ? 4 : 3,
                            }}
                            transition={{ duration: 0.8, delay: vis ? i * 0.06 : 0 }}
                        />
                        {vis && !gammel && (
                            <circle
                                r={beat >= 3 ? 7 : 6}
                                fill={farge}
                                stroke="#ffffff"
                                strokeWidth={2}
                            >
                                <animateMotion
                                    dur={`${fart + (i % 3) * 0.6}s`}
                                    repeatCount="indefinite"
                                    path={d}
                                    begin={`-${(i * 0.7) % fart}s`}
                                />
                            </circle>
                        )}
                    </g>
                );
            })}
            {Object.entries(BYER).map(([navn, ll]) => {
                const brukt = LINJER.some(
                    (l) => (l.fra === navn || l.til === navn) && l.beat.includes(beat)
                );
                const [x, y] = skjerm(ll);
                return (
                    <motion.circle
                        key={navn}
                        cx={x}
                        cy={y}
                        r={6}
                        fill="#0f172a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: brukt ? 1 : 0 }}
                    />
                );
            })}
        </>
    );
}

function Kjede({ beat, p, zv }: { beat: number; p: (ll: LngLat) => [number, number]; zv: number }) {
    const d = (punkter: LngLat[]) =>
        punkter.map((ll, i) => `${i === 0 ? 'M' : 'L'} ${p(ll).join(' ')}`).join(' ');
    const helRute = d(RUTE);
    const forSuez = d(RUTE.slice(0, SUEZ_INDEKS + 1));
    const etterSuez = d(RUTE.slice(SUEZ_INDEKS));
    const kanal = d(KANAL);
    const brutt = beat >= 1;
    return (
        <>
            {beat < 4 ? (
                <>
                    <motion.path
                        d={forSuez}
                        fill="none"
                        stroke="#ea580c"
                        strokeWidth={6 / zv}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.2, ease: 'easeInOut' }}
                    />
                    <motion.path
                        d={etterSuez}
                        fill="none"
                        strokeWidth={6 / zv}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, stroke: '#ea580c' }}
                        animate={{ pathLength: 1, stroke: brutt ? '#94a3b8' : '#ea580c' }}
                        transition={{ duration: 2, delay: 2.0, ease: 'easeInOut' }}
                    />
                </>
            ) : (
                <motion.path
                    d={helRute}
                    fill="none"
                    stroke="#78716c"
                    strokeWidth={4}
                    strokeDasharray="14 12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ duration: 1 }}
                />
            )}
            <path
                d={kanal}
                fill="none"
                stroke="#2563eb"
                strokeWidth={Math.max(2, 0.9 * zv) / zv}
                strokeLinecap="round"
                opacity={zv > 3 ? 1 : 0}
            />
        </>
    );
}

/** Køen av skip ved begge endene av kanalen (bare et bilde på køen, ikke et antall). */
const KO: LngLat[] = Array.from({ length: 48 }, (_, i) => {
    const sor = i % 2 === 0;
    const n = Math.floor(i / 2);
    const rad = n % 3;
    const ledd = Math.floor(n / 3);
    // Sør: nedover Suezbukta. Nord: utenfor Port Said i Middelhavet.
    if (sor) return [32.66 + ledd * 0.08 + rad * 0.05, 29.75 - ledd * 0.17 + rad * 0.05] as LngLat;
    return [31.7 + ledd * 0.16, 31.55 + rad * 0.14 + (ledd % 2) * 0.05] as LngLat;
});

function KjedeMerker({
    beat,
    skjerm,
    steder,
}: {
    beat: number;
    skjerm: (ll: LngLat) => [number, number];
    steder: string[];
}) {
    const zoomet = beat === 2 || beat === 3;
    const skip = skjerm(EVER_GIVEN);
    const kanalA = skjerm(KANAL[1]);
    const kanalB = skjerm(KANAL[2]);
    const vinkel = (Math.atan2(kanalB[1] - kanalA[1], kanalB[0] - kanalA[0]) * 180) / Math.PI + 70;
    return (
        <>
            {!zoomet && (
                <>
                    <Merke pt={skjerm(RUTE[0])} tekst={steder[0] ?? ''} dy={34} prikk />
                    <Merke
                        pt={skjerm(RUTE[RUTE.length - 1])}
                        tekst={steder[1] ?? ''}
                        dy={44}
                        prikk
                    />
                </>
            )}
            {beat === 1 && (
                <g transform={`translate(${skjerm(SUEZ).join(' ')})`}>
                    <g stroke="#dc2626" strokeWidth={8} strokeLinecap="round">
                        <line x1={-16} y1={-16} x2={16} y2={16} />
                        <line x1={16} y1={-16} x2={-16} y2={16} />
                    </g>
                    <text
                        x={26}
                        y={52}
                        fontSize={30}
                        fontWeight={900}
                        fill="#b91c1c"
                        stroke="#ffffff"
                        strokeWidth={6}
                        paintOrder="stroke"
                    >
                        {steder[2] ?? ''}
                    </text>
                </g>
            )}
            {zoomet && (
                <>
                    {beat === 3 &&
                        KO.map((ll, i) => {
                            const [x, y] = skjerm(ll);
                            return (
                                <motion.rect
                                    key={i}
                                    x={x - 11}
                                    y={y - 5}
                                    width={22}
                                    height={10}
                                    rx={3}
                                    fill="#334155"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 + i * 0.04 }}
                                />
                            );
                        })}
                    <g transform={`translate(${skip[0]} ${skip[1]}) rotate(${vinkel})`}>
                        <rect
                            x={-46}
                            y={-9}
                            width={92}
                            height={18}
                            rx={6}
                            fill="#b91c1c"
                            stroke="#ffffff"
                            strokeWidth={3}
                        />
                        <rect x={-38} y={-5} width={60} height={10} fill="#f97316" />
                    </g>
                    <Merke
                        pt={[skip[0] + 150, skip[1] + 10]}
                        tekst="Ever Given"
                        dy={0}
                        farge="#b91c1c"
                        stor
                    />
                    <Merke
                        pt={skjerm([32.1, 30.9])}
                        tekst={steder[2] ?? ''}
                        dy={0}
                        farge="#1d4ed8"
                    />
                </>
            )}
        </>
    );
}

function Merke({
    pt,
    tekst,
    dy,
    farge = '#0f172a',
    prikk = false,
    stor = false,
}: {
    pt: [number, number];
    tekst: string;
    dy: number;
    farge?: string;
    prikk?: boolean;
    stor?: boolean;
}) {
    return (
        <g transform={`translate(${pt[0]} ${pt[1]})`}>
            {prikk && <circle r={9} fill="#0f172a" stroke="#ffffff" strokeWidth={3} />}
            <text
                y={dy}
                textAnchor="middle"
                fontSize={stor ? 38 : 30}
                fontWeight={900}
                fill={farge}
                stroke="#ffffff"
                strokeWidth={7}
                paintOrder="stroke"
            >
                {tekst}
            </text>
        </g>
    );
}

/** Faktapanelet til høyre i «bangladesh»: én linje per beat, den nyeste uthevet. */
function Panel({ tekster, beat }: { tekster: string[]; beat: number }) {
    return (
        <div
            className="absolute flex flex-col gap-2"
            style={{ right: '3%', top: '8%', width: '34%' }}
        >
            {tekster.map((t, i) => {
                const vis = i <= beat;
                const na = i === beat;
                return (
                    <motion.div
                        key={t}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: vis ? (na ? 1 : 0.85) : 0, x: vis ? 0 : 30 }}
                        transition={{ duration: 0.5 }}
                        className="rounded-xl bg-white/95 shadow-lg px-4 py-2 font-bold text-slate-900"
                        style={{
                            fontSize: na ? 22 : 18,
                            borderLeft: `6px solid ${i === 3 ? '#dc2626' : '#16a34a'}`,
                        }}
                    >
                        {t}
                        {i === 4 && vis && (
                            <div
                                className="mt-2 rounded-full bg-slate-200 overflow-hidden"
                                style={{ height: 14 }}
                            >
                                <motion.div
                                    className="h-full bg-green-600"
                                    initial={{ width: '0%' }}
                                    animate={{ width: '82%' }}
                                    transition={{ duration: 1.4, delay: 0.3 }}
                                />
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}
