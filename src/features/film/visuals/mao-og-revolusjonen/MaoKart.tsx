import { memo, useEffect, useMemo, useState } from 'react';
import {
    AnimatePresence,
    animate,
    motion,
    useMotionValue,
    useMotionValueEvent,
} from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart til Mao-filmen.
 * - «livet»: Shaoshan, Beijing og Shanghai, den lange marsjen og veien til makten i 1949.
 * - «korea»: Koreakrigen 1950. Fronten flytter seg sør og nord, og Kina går inn.
 * - «vapenhvile»: sønnen som døde, og våpenhvilen i 1953 langs den 38. breddegraden.
 */

type Modus = 'livet' | 'korea' | 'vapenhvile';
type LngLat = [number, number];

const B = 1600;
const H = 900;

const SHAOSHAN: LngLat = [112.5, 27.9];
const BEIJING: LngLat = [116.4, 39.9];
const SHANGHAI: LngLat = [121.5, 31.2];
// Skjematisk bue for den lange marsjen: fra sør, vestover og så nordover.
const MARSJEN: LngLat[] = [
    [115.6, 26.2],
    [111, 25.4],
    [106.5, 26.6],
    [103, 29.5],
    [103.4, 33.5],
    [106.5, 36],
    [109.4, 36.6],
];

const KINA = '156';
const NORD_KOREA = '408';
const SOR_KOREA = '410';

const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    livet: [
        [97, 19],
        [128, 44],
    ],
    korea: [
        [116.5, 33],
        [134.5, 45],
    ],
    vapenhvile: [
        [116.5, 33],
        [134.5, 45],
    ],
};

/** Breddegraden der fronten står, per beat. Nord for den er rødt, sør for den er blått. */
function frontFor(modus: Modus, beat: number) {
    if (modus === 'korea') return [38, 36.4, 35.6, 41.2, 38.6][Math.min(beat, 4)];
    if (modus === 'vapenhvile') return beat >= 3 ? 38 : 38.3;
    return 38;
}

export function MaoKart({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'livet';
    const { geographies } = useFilmVerden();

    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 40],
                    [B - 40, H - 40],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT[modus] } as never
            ),
        [modus]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];

    // Fronten glir mot målet for hver beat.
    const front = useMotionValue(frontFor(modus, 0));
    const [fv, setFv] = useState(frontFor(modus, 0));
    useMotionValueEvent(front, 'change', setFv);
    useEffect(() => {
        const mål = frontFor(modus, beat);
        if (!playing) {
            front.set(mål);
            return;
        }
        const a = animate(front, mål, { duration: 3.2, ease: 'easeInOut' });
        return () => a.stop();
    }, [beat, playing, modus, front]);

    const koreaLand = geographies.filter(
        (g) => String(g.id) === NORD_KOREA || String(g.id) === SOR_KOREA
    );
    const frontY = p([127, fv])[1];
    const linje38 = [p([124, 38]), p([130, 38])];

    return (
        <div className="absolute inset-0 bg-[#cfe3ef] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <marker
                        id="mao-pil-rod"
                        viewBox="0 0 10 10"
                        refX="6"
                        refY="5"
                        markerWidth="4"
                        markerHeight="4"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#b91c1c" />
                    </marker>
                    <marker
                        id="mao-pil-bla"
                        viewBox="0 0 10 10"
                        refX="6"
                        refY="5"
                        markerWidth="4"
                        markerHeight="4"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#1d4ed8" />
                    </marker>
                    <clipPath id="mao-korea">
                        {koreaLand.map((g, i) => (
                            <path key={i} d={sti(g as never) ?? ''} />
                        ))}
                    </clipPath>
                </defs>
                <Land geographies={geographies} sti={sti} uthev={KINA} />

                {modus === 'livet' && <Livet beat={beat} p={p} />}

                {modus !== 'livet' && (
                    <>
                        {/* Korea farget etter hvem som holder hvor: rødt i nord, blått i sør. */}
                        <g clipPath="url(#mao-korea)">
                            <rect
                                x={0}
                                y={0}
                                width={B}
                                height={frontY}
                                fill="#ef4444"
                                opacity={0.75}
                            />
                            <rect
                                x={0}
                                y={frontY}
                                width={B}
                                height={H}
                                fill="#3b82f6"
                                opacity={0.75}
                            />
                        </g>
                        <line
                            x1={linje38[0][0] - 40}
                            y1={linje38[0][1]}
                            x2={linje38[1][0] + 40}
                            y2={linje38[1][1]}
                            stroke="#0f172a"
                            strokeWidth={4}
                            strokeDasharray="14 10"
                        />
                        <Tekst
                            x={linje38[1][0] + 60}
                            y={linje38[1][1] + 10}
                            tekst="38. breddegrad"
                            anker="start"
                            synlig={modus === 'vapenhvile' || beat >= 1}
                        />
                        <Tekst
                            x={p([121.2, 42.6])[0]}
                            y={p([121.2, 42.6])[1]}
                            tekst="KINA"
                            stor
                            synlig
                        />
                        {modus === 'korea' && <Korea beat={beat} p={p} />}
                        {modus === 'vapenhvile' && <Vapenhvile beat={beat} p={p} />}
                    </>
                )}
            </svg>
            <Overskrift modus={modus} beat={beat} />
        </div>
    );
}

type Proj = (ll: LngLat) => [number, number];

function Livet({ beat, p }: { beat: number; p: Proj }) {
    const marsj = 'M ' + MARSJEN.map((ll) => p(ll).join(' ')).join(' L ');
    const slutt = p(MARSJEN[MARSJEN.length - 1]);
    const tilBeijing = `M ${slutt.join(' ')} Q ${p([114, 39.5]).join(' ')} ${p(BEIJING).join(' ')}`;
    const bonder = useMemo(
        () =>
            Array.from({ length: 26 }, (_, i) => {
                const k = i / 25;
                const idx = Math.min(MARSJEN.length - 2, Math.floor(k * (MARSJEN.length - 1)));
                const f = k * (MARSJEN.length - 1) - idx;
                const a = MARSJEN[idx];
                const b = MARSJEN[idx + 1];
                return [
                    a[0] + (b[0] - a[0]) * f + Math.sin(i * 3.1) * 0.9,
                    a[1] + (b[1] - a[1]) * f + Math.cos(i * 2.3) * 0.7,
                ] as LngLat;
            }),
        []
    );
    return (
        <>
            {/* Den lange marsjen og bondehæren */}
            <motion.path
                d={marsj}
                fill="none"
                stroke="#b91c1c"
                strokeWidth={7}
                strokeDasharray="1 0"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: beat >= 4 ? 1 : 0, opacity: beat >= 4 ? 1 : 0 }}
                transition={{ duration: 3.5, ease: 'easeInOut' }}
            />
            {bonder.map((ll, i) => {
                const [x, y] = p(ll);
                return (
                    <motion.circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={9}
                        fill="#dc2626"
                        stroke="#fff"
                        strokeWidth={2}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: beat >= 4 ? 1 : 0, scale: beat >= 4 ? 1 : 0 }}
                        transition={{ delay: beat >= 4 ? 0.8 + i * 0.09 : 0, duration: 0.4 }}
                    />
                );
            })}
            {beat >= 4 && (
                <Tekst
                    x={p([104.5, 25])[0]}
                    y={p([104.5, 25])[1] + 40}
                    tekst="Den lange marsjen"
                    farge="#b91c1c"
                    synlig
                />
            )}
            <motion.path
                d={tilBeijing}
                fill="none"
                stroke="#b91c1c"
                strokeWidth={8}
                markerEnd="url(#mao-pil-rod)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: beat >= 5 ? 1 : 0, opacity: beat >= 5 ? 1 : 0 }}
                transition={{ duration: 2.2, ease: 'easeInOut' }}
            />

            <Sted ll={SHAOSHAN} p={p} navn="Shaoshan, Hunan" år="1893" synlig fokus={beat <= 2} />
            {beat === 2 && (
                <Boble
                    x={p(SHAOSHAN)[0]}
                    y={p(SHAOSHAN)[1] + 70}
                    tekst="leste, tenkte, ble rasende"
                />
            )}
            <Sted
                ll={BEIJING}
                p={p}
                navn="Beijing"
                år={beat >= 5 ? '1949' : '1912: keiseren er borte'}
                synlig={beat >= 1}
                fokus={beat === 1 || beat >= 5}
                stjerne={beat >= 5}
            />
            <Sted
                ll={SHANGHAI}
                p={p}
                navn="Shanghai"
                år="1921: partiet stiftes"
                synlig={beat >= 3}
                fokus={beat === 3}
                under
            />
        </>
    );
}

function Korea({ beat, p }: { beat: number; p: Proj }) {
    const nordPil = `M ${p([126.5, 39.6]).join(' ')} L ${p([127.2, 36.4]).join(' ')}`;
    const usaPil = `M ${p([133.5, 34]).join(' ')} Q ${p([131, 36.5]).join(' ')} ${p([129, 36.2]).join(' ')}`;
    const fnPil = `M ${p([127.2, 37]).join(' ')} L ${p([126.4, 40.9]).join(' ')}`;
    const kinaPiler = [
        `M ${p([124.3, 41.7]).join(' ')} L ${p([125.6, 39.2]).join(' ')}`,
        `M ${p([127.4, 42.3]).join(' ')} L ${p([127.6, 39.4]).join(' ')}`,
    ];
    return (
        <>
            <Pil d={nordPil} farge="rod" synlig={beat === 0} />
            <Tekst
                x={p([122.4, 39.1])[0]}
                y={p([122.4, 39.1])[1]}
                tekst="Nord-Korea"
                farge="#991b1b"
                synlig
            />
            <Tekst
                x={p([127.9, 35.4])[0] + 140}
                y={p([127.9, 35.4])[1] + 60}
                tekst="Sør-Korea"
                farge="#1e3a8a"
                synlig
            />
            <Pil d={usaPil} farge="bla" synlig={beat >= 2} />
            <Tekst
                x={p([133.5, 34])[0] + 10}
                y={p([133.5, 34])[1] + 50}
                tekst="USA"
                farge="#1d4ed8"
                stor
                synlig={beat >= 2}
            />
            <Pil d={fnPil} farge="bla" synlig={beat === 3} />
            <Tekst
                x={p([124.5, 41.5])[0]}
                y={p([124.5, 41.5])[1] - 20}
                tekst="FN ved grensen til Kina"
                farge="#1d4ed8"
                synlig={beat === 3}
            />
            {kinaPiler.map((d, i) => (
                <Pil key={i} d={d} farge="rod" synlig={beat >= 4} />
            ))}
        </>
    );
}

function Vapenhvile({ beat, p }: { beat: number; p: Proj }) {
    const [x, y] = p([125.8, 39.7]);
    return (
        <AnimatePresence>
            {beat >= 1 && beat <= 2 && (
                <motion.g
                    key="anying"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                >
                    <circle cx={x} cy={y} r={16} fill="#0f172a" stroke="#fff" strokeWidth={4} />
                    <rect
                        x={x - 600}
                        y={y - 86}
                        width={550}
                        height={170}
                        rx={18}
                        fill="#ffffff"
                        opacity={0.95}
                    />
                    <line x1={x - 50} y1={y} x2={x - 16} y2={y} stroke="#0f172a" strokeWidth={3} />
                    <text x={x - 575} y={y - 28} fontSize={48} fontWeight={900} fill="#0f172a">
                        Mao Anying
                    </text>
                    <text x={x - 575} y={y + 20} fontSize={34} fontWeight={600} fill="#475569">
                        Maos eldste sønn, offiser
                    </text>
                    <text x={x - 575} y={y + 60} fontSize={34} fontWeight={600} fill="#475569">
                        døde i november 1950
                    </text>
                </motion.g>
            )}
        </AnimatePresence>
    );
}

function Overskrift({ modus, beat }: { modus: Modus; beat: number }) {
    let tekst: string | null = null;
    if (modus === 'korea') {
        tekst = [
            '25. juni 1950: Nord-Korea angriper',
            'Grensen: den 38. breddegraden',
            'USA går inn på Sør-Koreas side',
            'FN rykker fram mot Kina',
            'November 1950: ca. 300 000 kinesere går inn',
        ][Math.min(beat, 4)];
    } else if (modus === 'vapenhvile') {
        tekst = [
            'Kina var utslitt etter mange år med krig',
            'Mao sendte sin egen sønn',
            'Mao sa lite',
            '27. juli 1953: våpenhvile',
            'Kina sto imot verdens mektigste militærmakt',
        ][Math.min(beat, 4)];
    }
    return (
        <AnimatePresence mode="wait">
            {tekst && (
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[6%] left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-2xl md:text-4xl font-black text-slate-900 whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function Pil({ d, farge, synlig }: { d: string; farge: 'rod' | 'bla'; synlig: boolean }) {
    return (
        <motion.path
            d={d}
            fill="none"
            stroke={farge === 'rod' ? '#b91c1c' : '#1d4ed8'}
            strokeWidth={14}
            strokeLinecap="round"
            markerEnd={`url(#mao-pil-${farge})`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: synlig ? 1 : 0, opacity: synlig ? 1 : 0 }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
        />
    );
}

function Sted({
    ll,
    p,
    navn,
    år,
    synlig,
    fokus,
    stjerne,
    under,
}: {
    ll: LngLat;
    p: Proj;
    navn: string;
    år: string;
    synlig: boolean;
    fokus: boolean;
    stjerne?: boolean;
    under?: boolean;
}) {
    const [x, y] = p(ll);
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? (fokus ? 1 : 0.55) : 0 }}
            transition={{ duration: 0.8 }}
        >
            {stjerne ? (
                <path
                    transform={`translate(${x} ${y}) scale(2.2)`}
                    d="M0,-10 L2.9,-3.1 L9.5,-3.1 L4.2,1.2 L5.9,8.1 L0,4 L-5.9,8.1 L-4.2,1.2 L-9.5,-3.1 L-2.9,-3.1 Z"
                    fill="#facc15"
                    stroke="#b91c1c"
                    strokeWidth={1.5}
                />
            ) : (
                <circle cx={x} cy={y} r={13} fill="#0f172a" stroke="#fff" strokeWidth={4} />
            )}
            <text
                x={under ? x + 28 : x}
                y={under ? y - 6 : y - 54}
                textAnchor={under ? 'start' : 'middle'}
                fontSize={34}
                fontWeight={900}
                fill="#0f172a"
                stroke="#fff"
                strokeWidth={7}
                paintOrder="stroke"
            >
                {navn}
            </text>
            <text
                x={under ? x + 28 : x}
                y={under ? y + 30 : y - 22}
                textAnchor={under ? 'start' : 'middle'}
                fontSize={28}
                fontWeight={700}
                fill="#b91c1c"
                stroke="#fff"
                strokeWidth={6}
                paintOrder="stroke"
            >
                {år}
            </text>
        </motion.g>
    );
}

function Boble({ x, y, tekst }: { x: number; y: number; tekst: string }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <rect x={x - 230} y={y} width={460} height={64} rx={32} fill="#7f1d1d" />
            <text x={x} y={y + 43} textAnchor="middle" fontSize={30} fontWeight={800} fill="#fff">
                {tekst}
            </text>
        </motion.g>
    );
}

function Tekst({
    x,
    y,
    tekst,
    farge = '#0f172a',
    stor,
    anker = 'middle',
    synlig,
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    stor?: boolean;
    anker?: 'start' | 'middle';
    synlig: boolean;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={stor ? 52 : 32}
            fontWeight={900}
            fill={farge}
            stroke="#fff"
            strokeWidth={7}
            paintOrder="stroke"
            letterSpacing={stor ? 6 : 0}
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.8 }}
        >
            {tekst}
        </motion.text>
    );
}

/** Landene endrer seg aldri, så de tegnes bare én gang. */
const Land = memo(function Land({
    geographies,
    sti,
    uthev,
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
    uthev: string | null;
}) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill={uthev && String(g.id) === uthev ? '#f6dfb8' : '#efe9dc'}
                    stroke="#a8a08a"
                    strokeWidth={1.5}
                />
            ))}
        </>
    );
});
