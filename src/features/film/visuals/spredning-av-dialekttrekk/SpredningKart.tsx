import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { Ringvann } from './Ringvann';

/**
 * Norgeskartet med fire byer (Oslo, Bergen, Trondheim, Tromsø, de samme som i artikkelens
 * Spredningskart) og bygder imellom. Kartet står til venstre, forklaringen til høyre.
 *
 * «sprang»: trekket hopper fra Oslo til de andre byene, bygdene blir grå.
 * «for»: for hundre år siden. Hvert sted har sin lille ring, og trekket siger sakte fra Oslo.
 * «idag»: linjer for tog, fly og nett mellom alle byene. Byene blir like, bygdene blekner.
 * «begge»: bølger rundt byene og sprang mellom dem, samtidig.
 */

type Modus = 'sprang' | 'for' | 'idag' | 'begge';
type LngLat = [number, number];

const NORGE_ID = 578;
const UTSNITT: Utsnitt = [
    [4, 57.5],
    [31.5, 71.5],
];

const ORANSJE = '#ea580c';
const GRA = '#a8a29e';
const BLEK = '#d6d3d1';
const BLA = '#2563eb';

interface By {
    navn: string;
    p: LngLat;
    /** Hvor navnet står i forhold til prikken. */
    side: 'v' | 'h' | 'u';
}
const OSLO: By = { navn: 'Oslo', p: [10.75, 59.91], side: 'h' };
const BYER: By[] = [
    OSLO,
    { navn: 'Bergen', p: [5.32, 60.39], side: 'u' },
    { navn: 'Trondheim', p: [10.39, 63.43], side: 'v' },
    { navn: 'Tromsø', p: [18.96, 69.65], side: 'v' },
];
const BYGDER: LngLat[] = [
    [9.3, 60.95],
    [8.2, 60.55],
    [6.8, 61.3],
    [9.6, 62.2],
    [8.7, 62.95],
    [11.9, 61.6],
    [7.6, 58.9],
    [11.6, 64.5],
    [13.2, 65.8],
    [15.0, 67.1],
    [17.3, 68.4],
    [6.3, 59.5],
];

function lagProjeksjon(): GeoProjection {
    return geoMercator().fitExtent(
        [
            [20, 24],
            [880, 876],
        ],
        {
            type: 'MultiPoint',
            coordinates: [
                [4.6, 57.9],
                [31.1, 71.2],
            ],
        } as never
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    sprang: [
        'Sprangmodellen',
        'Som regel mellom byer',
        'Mye kontakt',
        'Mye kontakt',
        'Der menneskene møtes',
    ],
    for: ['For hundre år siden', 'Hver i sitt område', 'Bølgen styrte mest'],
    idag: [
        'I dag',
        'Sammen på nett',
        'Kan hoppe på noen få uker',
        'Mange språkforskere mener:',
        'Mange språkforskere mener:',
    ],
    begge: ['Bølger og sprang', 'Bølgen', 'Sprangene', 'Sammen'],
};

/** Linjer i panelet til høyre: [tekst, farge, fraBeat]. */
const PANEL: Record<Modus, [string, string, number, number?][]> = {
    sprang: [
        ['Trekket hopper rett', '#1c1917', 0],
        ['fra sted til sted.', '#1c1917', 0],
        ['Bygdene imellom', GRA, 1],
        ['blir hoppet over.', GRA, 1],
        ['De reiser mellom byene', ORANSJE, 2],
        ['og studerer i dem.', ORANSJE, 2],
        ['Samme TV-programmer,', ORANSJE, 3],
        ['samme folk på nett.', ORANSJE, 3],
    ],
    for: [
        ['Tungt å reise.', '#1c1917', 0],
        ['Folk holdt seg mest', BLA, 1],
        ['til sitt eget område.', BLA, 1],
        ['Trekkene spredte seg', ORANSJE, 2],
        ['sakte, fra nabo til nabo.', ORANSJE, 2],
    ],
    idag: [
        ['Vi flytter oftere.', '#1c1917', 0],
        ['Tog og fly på kryss og tvers.', '#1c1917', 0],
        ['Sammen på nett,', BLA, 1],
        ['uansett hvor vi bor.', BLA, 1],
        ['Fra ungdom i én by', ORANSJE, 2],
        ['til ungdom i en annen.', ORANSJE, 2],
        ['Sprangene er en av grunnene:', '#1c1917', 3],
        ['byfolk snakker likere.', ORANSJE, 3],
        ['Bygdene: en del gamle', GRA, 4],
        ['dialekter blir svakere.', GRA, 4],
    ],
    begge: [
        ['To ting som skjer', '#1c1917', 0],
        ['samtidig.', '#1c1917', 0],
        ['Bølgen: nabobygder ligner.', BLA, 1],
        ['Sprangene: fjerne byer', ORANSJE, 2],
        ['kan dele et trekk.', ORANSJE, 2],
    ],
};

function bueSti(a: [number, number], b: [number, number], loft = 0.28) {
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    // Normal til venstre for retningen, så buen går ut i havet mot vest/øst.
    const cx = mx - dy * loft;
    const cy = my + dx * loft;
    return `M${a[0].toFixed(1)},${a[1].toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
}

export function SpredningKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'sprang';
    const { geographies } = useFilmVerden(UTSNITT);
    const proj = useMemo(() => lagProjeksjon(), []);
    const sti = useMemo(() => geoPath(proj), [proj]);
    const xy = (p: LngLat) => proj(p) as [number, number];
    const byXY = BYER.map((b) => xy(b.p));
    const bygdXY = BYGDER.map(xy);
    const oslo = byXY[0];

    // Hvilke byer er nådd av trekket?
    const byLys = (i: number) => {
        if (modus === 'sprang') return i === 0 || (i === 3 && beat >= 0) || beat >= 1;
        if (modus === 'for') return i === 0 && beat >= 2;
        if (modus === 'idag') return beat >= 2 ? i === 0 || i === 3 || beat >= 3 : false;
        return true;
    };
    // Bygder nådd av en bølge (piksler fra nærmeste lyse by).
    const bolgeR =
        modus === 'for' ? (beat >= 2 ? 120 : 0) : modus === 'begge' ? (beat === 2 ? 0 : 95) : 0;
    const bygdFarge = (p: [number, number]) => {
        if (modus === 'idag' && beat >= 4) return BLEK;
        const kilder = modus === 'for' ? [oslo] : modus === 'begge' ? byXY : [];
        const naer = kilder.some((k) => Math.hypot(k[0] - p[0], k[1] - p[1]) < bolgeR);
        return naer ? ORANSJE : GRA;
    };

    // Buer: fra Oslo til hver av de andre byene, eller mellom alle byene.
    const buer: { d: string; fraBeat: number; nokkel: string }[] = [];
    if (modus === 'sprang') {
        buer.push({ d: bueSti(oslo, byXY[3]), fraBeat: 0, nokkel: 'o-t' });
        buer.push({ d: bueSti(oslo, byXY[1], -0.3), fraBeat: 1, nokkel: 'o-b' });
        buer.push({ d: bueSti(oslo, byXY[2], -0.35), fraBeat: 1, nokkel: 'o-tr' });
    }
    if (modus === 'idag' || (modus === 'begge' && beat !== 1)) {
        const par: [number, number][] = [
            [0, 1],
            [0, 2],
            [0, 3],
            [1, 2],
            [2, 3],
            [1, 3],
        ];
        par.forEach(([a, b]) =>
            buer.push({ d: bueSti(byXY[a], byXY[b], 0.22), fraBeat: 0, nokkel: `${a}-${b}` })
        );
    }

    const tittelListe = OVERSKRIFT[modus];
    const tittel = tittelListe[Math.min(beat, tittelListe.length - 1)];
    const bueFarge = modus === 'idag' && beat < 2 ? BLA : ORANSJE;

    return (
        <div className="absolute inset-0 overflow-hidden bg-[#dcebf5]">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {geographies.map((g, i) => (
                    <path
                        key={`${g.id ?? 'x'}-${i}`}
                        d={sti(g as never) ?? undefined}
                        fill={Number(g.id) === NORGE_ID ? '#f4f1ea' : '#e7e2d6'}
                        stroke={Number(g.id) === NORGE_ID ? '#57534e' : '#c9c2b2'}
                        strokeWidth={Number(g.id) === NORGE_ID ? 1.6 : 1}
                    />
                ))}

                {/* For hundre år siden: hvert sted i sin egen lille ring. */}
                {modus === 'for' &&
                    [...bygdXY, ...byXY].map((p, i) => (
                        <motion.circle
                            key={`omr-${i}`}
                            cx={p[0]}
                            cy={p[1]}
                            fill={BLA}
                            fillOpacity={0.12}
                            stroke={BLA}
                            strokeWidth={2.5}
                            initial={{ r: 0 }}
                            animate={{ r: beat >= 1 ? 34 : 0 }}
                            transition={{ duration: 1, delay: (i % 6) * 0.08 }}
                        />
                    ))}

                {/* Bølger: ringer som brer seg fra byene. */}
                {bolgeR > 0 &&
                    (modus === 'for' ? [oslo] : byXY).map((p, i) =>
                        [0, 1].map((n) => (
                            <Ringvann
                                key={`bolge-${i}-${n}-${beat}`}
                                x={p[0]}
                                y={p[1]}
                                r={bolgeR}
                                farge={modus === 'begge' && beat === 1 ? BLA : ORANSJE}
                                varighet={modus === 'for' ? 4 : 2.6}
                                forsinkelse={n * (modus === 'for' ? 2 : 1.3)}
                            />
                        ))
                    )}

                {/* Buene: sprang mellom byene. */}
                <AnimatePresence>
                    {buer
                        .filter((b) => beat >= b.fraBeat)
                        .map((b, i) => (
                            <motion.path
                                key={`${modus}-${b.nokkel}`}
                                d={b.d}
                                fill="none"
                                stroke={bueFarge}
                                strokeWidth={modus === 'idag' || modus === 'begge' ? 4 : 7}
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0.95 }}
                                animate={{
                                    pathLength: 1,
                                    opacity: modus === 'begge' && beat === 1 ? 0.25 : 0.95,
                                }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.3, delay: 0.2 + i * 0.15 }}
                            />
                        ))}
                </AnimatePresence>

                {/* Nettet: små prikker som går langs linjene. */}
                {modus === 'idag' &&
                    beat === 1 &&
                    bygdXY
                        .concat(byXY)
                        .map((p, i) => (
                            <motion.circle
                                key={`nett-${i}`}
                                cx={p[0]}
                                cy={p[1]}
                                r={16}
                                fill="none"
                                stroke={BLA}
                                strokeWidth={3}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 1, 0.3, 1] }}
                                transition={{ duration: 2, repeat: Infinity, delay: (i % 5) * 0.2 }}
                            />
                        ))}

                {/* Bygdene. */}
                {bygdXY.map((p, i) => (
                    <motion.circle
                        key={`bygd-${i}`}
                        cx={p[0]}
                        cy={p[1]}
                        initial={false}
                        animate={{
                            fill: bygdFarge(p),
                            r: modus === 'idag' && beat >= 4 ? 7 : 10,
                        }}
                        transition={{
                            duration: 0.8,
                            delay: modus === 'for' ? 1.2 + i * 0.05 : 0.3,
                        }}
                        stroke="#ffffff"
                        strokeWidth={3}
                    />
                ))}

                {/* Byene. */}
                {BYER.map((b, i) => {
                    const [x, y] = byXY[i];
                    const lys = byLys(i);
                    return (
                        <g key={b.navn}>
                            <motion.circle
                                cx={x}
                                cy={y}
                                r={17}
                                initial={false}
                                animate={{ fill: lys ? ORANSJE : '#78716c' }}
                                transition={{
                                    duration: 0.8,
                                    delay: modus === 'sprang' && i > 0 ? 1.3 : 0,
                                }}
                                stroke="#ffffff"
                                strokeWidth={4}
                            />
                            <text
                                x={b.side === 'v' ? x - 28 : b.side === 'u' ? x + 10 : x + 28}
                                y={b.side === 'u' ? y + 58 : y + 12}
                                textAnchor={b.side === 'v' ? 'end' : 'start'}
                                fontSize={36}
                                fontWeight={800}
                                fill="#1c1917"
                                stroke="#ffffff"
                                strokeWidth={7}
                                paintOrder="stroke"
                            >
                                {b.navn}
                            </text>
                        </g>
                    );
                })}

                {/* Panelet til høyre. */}
                <AnimatePresence mode="wait">
                    <motion.text
                        key={tittel}
                        x={900}
                        y={140}
                        fontSize={46}
                        fontWeight={900}
                        fill="#1c1917"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {tittel}
                    </motion.text>
                </AnimatePresence>
                {PANEL[modus]
                    .map((l, i) => ({ l, i }))
                    .filter(({ l }) => beat >= l[2] && (modus !== 'idag' || l[2] >= beat - 1))
                    .map(({ l, i }, n) => (
                        <motion.text
                            key={`${modus}-${i}`}
                            x={900}
                            y={230 + n * 54 + groupIndex(PANEL[modus], i) * 22}
                            fontSize={38}
                            fontWeight={700}
                            fill={l[1]}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            {l[0]}
                        </motion.text>
                    ))}
                {modus === 'sprang' && beat >= 4 && (
                    <motion.text
                        x={900}
                        y={790}
                        fontSize={42}
                        fontWeight={900}
                        fill={ORANSJE}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        Ikke langs veien mellom dem.
                    </motion.text>
                )}
                {modus === 'begge' && beat >= 3 && (
                    <motion.text
                        x={900}
                        y={640}
                        fontSize={42}
                        fontWeight={900}
                        fill="#1c1917"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        Sammen: et bedre bilde.
                    </motion.text>
                )}
            </svg>
        </div>
    );
}

/** Hvilken gruppe (fraBeat-blokk) linja hører til, så det blir luft mellom gruppene. */
function groupIndex(liste: [string, string, number, number?][], i: number) {
    const beats = [...new Set(liste.slice(0, i + 1).map((l) => l[2]))];
    return beats.length - 1;
}
