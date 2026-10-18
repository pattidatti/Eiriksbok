import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart over samemisjonen: brevet fra Hammerfest, presten fra Trondheim, Misjonskollegiet
 * i København, de uklare grensene i nord, reisene til Øst-Finnmark og trommene som ble
 * sendt fra Rana til København. Kartet står til venstre, forklaringene til høyre.
 */

type Modus = 'brev' | 'prest' | 'kollegiet' | 'grenser' | 'reiser' | 'trommer';
type LngLat = [number, number];
type P = (ll: LngLat) => [number, number];

const B = 1600;
const H = 900;
const MISJON = '#9a3412';
const SAMI = '#1d4ed8';
const GULL = '#b45309';
const ROD = '#b91c1c';
const GRONN = '#15803d';
const LAND = '#f5efe0';
const KANT = '#b9ad92';

const ID = {
    norge: '578',
    sverige: '752',
    danmark: '208',
    finland: '246',
    russland: '643',
    india: '356',
    gronland: '304',
};

const STED = {
    hammerfest: [23.68, 70.66] as LngLat,
    trondheim: [10.4, 63.43] as LngLat,
    kobenhavn: [12.57, 55.68] as LngLat,
    romsdal: [7.2, 62.67] as LngLat,
    tromso: [18.96, 69.65] as LngLat,
    rana: [14.14, 66.31] as LngLat,
    ostfinnmark: [29.6, 70.2] as LngLat,
    india: [78.5, 21] as LngLat,
    gronland: [-45, 66] as LngLat,
    sapmi: [21, 68.4] as LngLat,
};

/** Reisene, grovt tegnet langs kysten: ikke den nøyaktige ruta, men hvor langt de gikk. */
const REISE_1: LngLat[] = [
    STED.trondheim,
    [11.6, 65.0],
    [13.6, 67.2],
    [16.2, 68.8],
    STED.tromso,
    [22.0, 70.6],
    [25.8, 71.1],
    STED.ostfinnmark,
];
const REISE_2: LngLat[] = REISE_1.map(([x, y], i) => [x + (i ? 0.5 : 0), y - (i ? 0.35 : 0)]);
const KYST_SOR: LngLat[] = [STED.tromso, [16.4, 68.6], [14.6, 67.6], [13.4, 66.9], STED.rana];
const TIL_KBH: LngLat[] = [STED.rana, [12.6, 65.0], [10.4, 63.4], [6.6, 62.4], [5.0, 60.0], [5.8, 58.0], [9.5, 57.4], [11.8, 56.6], STED.kobenhavn];
const NORDOVER: LngLat[] = [STED.trondheim, [12.2, 65.6], [15.6, 68.4], [19.8, 70.0], STED.hammerfest];

interface Kort {
    tekst: string;
    farge?: string;
    stor?: boolean;
}

const KORT: Record<Modus, Kort[][]> = {
    brev: [
        [{ tekst: '30. juli 1716' }, { tekst: 'Et brev fra Hammerfest', farge: MISJON }],
        [{ tekst: 'En måned i Finnmark' }, { tekst: 'Det han ser, skremmer ham', farge: ROD }],
        [{ tekst: 'Samene er døpt' }, { tekst: 'De går til nattverd i kirken', farge: SAMI }],
        [
            { tekst: 'Døpt på nytt' },
            { tekst: 'av en noaide: en samisk religiøs leder', farge: GULL },
            { tekst: 'og får et nytt navn', farge: GULL },
        ],
        [{ tekst: '«forskrekkeligt»', stor: true }, { tekst: 'Thomas von Westen', farge: MISJON }],
    ],
    prest: [
        [{ tekst: 'Født 1682' }, { tekst: 'Trondheim', farge: MISJON }, { tekst: 'Teologi i København: læren om Gud', farge: SAMI }],
        [{ tekst: 'Prest i Romsdal' }, { tekst: 'Pietist: et strengt og rent liv', farge: MISJON }],
        [{ tekst: '1713: Syvstjernen' }, { tekst: 'Kirken har sviktet samene', farge: MISJON }],
        [{ tekst: 'Biskopen' }, { tekst: 'Prekenen skal være på dansk', farge: ROD }],
        [{ tekst: 'Et brev til kongen' }, { tekst: 'Frederik 4.', farge: GULL }],
    ],
    kollegiet: [
        [{ tekst: '1714' }, { tekst: 'Misjonskollegiet i København', farge: MISJON }],
        [{ tekst: 'Misjon' }, { tekst: 'å reise ut for å spre en tro', farge: MISJON }],
        [
            { tekst: 'Tre misjoner' },
            { tekst: 'India', farge: GULL },
            { tekst: 'Grønland', farge: SAMI },
            { tekst: 'Samene', farge: GRONN },
        ],
        [{ tekst: '28. februar 1716' }, { tekst: 'Von Westen blir leder', farge: MISJON }, { tekst: 'uten å ha søkt', farge: GULL }],
    ],
    grenser: [
        [{ tekst: 'Avgudsdyrkelse' }, { tekst: 'å tilbe falske guder', farge: ROD }],
        [{ tekst: 'Ikke bare tro' }, { tekst: 'Det handlet også om makt', farge: GULL }],
        [{ tekst: 'Uklare grenser' }, { tekst: 'Hvem eide landet?', farge: GULL }],
        [{ tekst: 'Presten' }, { tekst: 'var også kongens mann', farge: MISJON }, { tekst: 'Samene skulle bli lojale mot kongen', farge: SAMI }],
    ],
    reiser: [
        [{ tekst: '1716 til 1723' }, { tekst: 'Tre lange reiser nordover', farge: MISJON }],
        [{ tekst: 'To ganger' }, { tekst: 'helt til Øst-Finnmark', farge: MISJON }],
        [{ tekst: 'Prekener på samisk' }, { tekst: 'med stor innlevelse', farge: SAMI }],
        [{ tekst: 'Noe nytt' }, { tekst: 'Biskopen: dansk', farge: ROD }, { tekst: 'Von Westen: samisk', farge: SAMI }],
    ],
    trommer: [
        [{ tekst: '1722 og 1723' }, { tekst: 'Den tredje reisen', farge: MISJON }, { tekst: 'fra Tromsø og sørover', farge: MISJON }],
        [{ tekst: 'Rana' }, { tekst: 'Samene må levere trommene', farge: ROD }],
        [{ tekst: 'Til København' }, { tekst: 'Trommene samles inn og sendes bort', farge: ROD }],
    ],
};

/** Utsnittet per modus: hjørnene i kartet som skal fylle venstre del av bildet. */
const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    brev: [
        [6, 60.5],
        [32, 71.4],
    ],
    prest: [
        [3, 54.4],
        [17, 64.4],
    ],
    kollegiet: [
        [-62, 2],
        [92, 76],
    ],
    grenser: [
        [8, 62.5],
        [40, 71.4],
    ],
    reiser: [
        [6, 61.5],
        [32, 71.4],
    ],
    trommer: [
        [3, 54.6],
        [24, 70.2],
    ],
};

export function WestenKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'brev';
    const { geographies } = useFilmVerden();

    const projeksjon = useMemo(() => {
        const [a, b] = UTSNITT[modus];
        return geoMercator().fitExtent(
            [
                [40, 40],
                [1000, 860],
            ],
            { type: 'MultiPoint', coordinates: [a, b] } as never
        );
    }, [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p: P = (ll) => projeksjon(ll) as [number, number];
    const linje = (pts: LngLat[]) => 'M ' + pts.map((ll) => p(ll).join(' ')).join(' L ');
    const land = (id: string) => {
        const g = geographies.find((x) => String((x as { id?: unknown }).id) === id);
        return g ? (sti(g as never) ?? '') : '';
    };

    const kort = KORT[modus][Math.min(beat, KORT[modus].length - 1)] ?? [];

    return (
        <div className="absolute inset-0 bg-[#cfe3ef] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land geographies={geographies} sti={sti} />

                {/* Danmark-Norge: ett rike */}
                {(modus === 'prest' || modus === 'trommer') && (
                    <g opacity={0.2}>
                        <path d={land(ID.norge)} fill={MISJON} />
                        <path d={land(ID.danmark)} fill={MISJON} />
                    </g>
                )}

                {modus === 'brev' && (
                    <>
                        <Navn ll={[27.5, 70.25]} tekst="FINNMARK" p={p} />
                        <Navn ll={[17.5, 66.4]} tekst="SVERIGE" p={p} farge="#a8a29e" />
                        {beat >= 1 && <Pil d={linje(NORDOVER)} farge={MISJON} varighet={2.4} stiplet />}
                        <Merke ll={STED.hammerfest} tekst="Hammerfest" p={p} farge={MISJON} stor />
                        {beat >= 1 && <Merke ll={STED.trondheim} tekst="Trøndelag" p={p} farge={MISJON} under />}
                        {beat === 2 && <Kirke ll={[22.6, 68.7]} p={p} />}
                        {beat === 3 && <Tromme ll={[22.6, 68.7]} p={p} storrelse={1.3} />}
                        {beat >= 4 && <Brevet ll={[23.2, 67.6]} p={p} />}
                    </>
                )}

                {modus === 'prest' && (
                    <>
                        <Navn ll={[7.6, 61.3]} tekst="NORGE" p={p} />
                        <Navn ll={[9.2, 56.2]} tekst="DANMARK" p={p} />
                        <Merke ll={STED.trondheim} tekst="Trondheim" p={p} farge={MISJON} hoyre />
                        {beat === 0 && <Pil d={linje([STED.trondheim, [9.0, 60.2], [10.4, 57.6], STED.kobenhavn])} farge={SAMI} varighet={2} />}
                        <Merke ll={STED.kobenhavn} tekst="København" p={p} farge={SAMI} hoyre />
                        {beat >= 1 && <Merke ll={STED.romsdal} tekst="Romsdal" p={p} farge={MISJON} venstre />}
                        {beat === 2 && <Syvstjernen ll={[5.6, 63.9]} p={p} />}
                        {beat === 3 && (
                            <>
                                <Boble ll={STED.trondheim} p={p} tekst="Dansk!" farge={ROD} dx={150} dy={110} />
                                <Boble ll={STED.romsdal} p={p} tekst="Samisk!" farge={SAMI} dx={-100} dy={-80} />
                            </>
                        )}
                        {beat >= 4 && (
                            <>
                                <Pil d={linje([STED.romsdal, [6.0, 60.0], [7.6, 57.6], STED.kobenhavn])} farge={GULL} varighet={2.2} stiplet />
                                <Krone ll={[14.8, 56.8]} p={p} />
                            </>
                        )}
                    </>
                )}

                {modus === 'kollegiet' && (
                    <>
                        <Merke ll={STED.kobenhavn} tekst="København" p={p} farge={MISJON} stor={beat <= 1} under />
                        {beat >= 2 && (
                            <>
                                <Felt d={land(ID.india)} farge={GULL} />
                                <Pil d={linje([STED.kobenhavn, [40, 40], STED.india])} farge={GULL} varighet={1.6} buet />
                            </>
                        )}
                        {beat >= 2 && (
                            <>
                                <Felt d={land(ID.gronland)} farge={SAMI} forsinkelse={1.2} />
                                <Pil d={linje([STED.kobenhavn, [-20, 66], STED.gronland])} farge={SAMI} varighet={1.6} forsinkelse={1.2} buet />
                            </>
                        )}
                        {beat >= 2 && <Pil d={linje([STED.kobenhavn, [18, 63], STED.sapmi])} farge={GRONN} varighet={1.2} forsinkelse={2.4} />}
                        {beat >= 2 && <Merke ll={STED.india} tekst="India" p={p} farge={GULL} under />}
                        {beat >= 2 && <Merke ll={STED.gronland} tekst="Grønland" p={p} farge={SAMI} under />}
                        {beat >= 2 && <Merke ll={STED.sapmi} tekst="Samene" p={p} farge={GRONN} stor={beat >= 3} hoyre />}
                    </>
                )}

                {modus === 'grenser' && (
                    <>
                        <Felt d={land(ID.norge)} farge={MISJON} vis={beat >= 2} />
                        <Felt d={land(ID.sverige)} farge={GULL} vis={beat >= 2} />
                        <Felt d={land(ID.finland)} farge={GULL} vis={beat >= 2} />
                        <Felt d={land(ID.russland)} farge={SAMI} vis={beat >= 2} />
                        {beat < 2 && <Tromme ll={[22, 68.6]} p={p} storrelse={1.6} />}
                        {beat >= 2 && (
                            <>
                                <Navn ll={[13.2, 66.2]} tekst="DANMARK-NORGE" p={p} farge={MISJON} />
                                <Navn ll={[21.5, 64.4]} tekst="SVERIGE" p={p} farge={GULL} />
                                <Navn ll={[35.5, 66.0]} tekst="RUSSLAND" p={p} farge={SAMI} />
                                <Uklart ll={[25, 69.0]} p={p} />
                            </>
                        )}
                        {beat >= 1 && <Krone ll={[12.6, 64.2]} p={p} />}
                    </>
                )}

                {modus === 'reiser' && (
                    <>
                        <Navn ll={[18.5, 66.0]} tekst="SVERIGE" p={p} farge="#a8a29e" />
                        <Pil d={linje(REISE_1)} farge={MISJON} varighet={3} />
                        {beat >= 1 && <Pil d={linje(REISE_2)} farge={GULL} varighet={3} />}
                        <Merke ll={STED.trondheim} tekst="Trondheim" p={p} farge={MISJON} under />
                        {beat >= 1 && <Merke ll={STED.ostfinnmark} tekst="Øst-Finnmark" p={p} farge={MISJON} stor under />}
                        {beat >= 2 &&
                            [STED.tromso, [14.2, 67.4], [12.4, 65.6]].map((ll, i) => (
                                <Boble key={i} ll={ll as LngLat} p={p} tekst="samisk" farge={SAMI} dx={-110} dy={i === 0 ? 30 : 0} liten forsinkelse={i * 0.4} />
                            ))}
                        {beat >= 3 && <Boble ll={STED.trondheim} p={p} tekst="dansk?" farge={ROD} dx={-120} dy={-40} />}
                    </>
                )}

                {modus === 'trommer' && (
                    <>
                        <Navn ll={[9.6, 61.2]} tekst="NORGE" p={p} />
                        <Navn ll={[9.2, 56.2]} tekst="DANMARK" p={p} />
                        <Pil d={linje(KYST_SOR)} farge={MISJON} varighet={2.4} />
                        <Merke ll={STED.tromso} tekst="Tromsø" p={p} farge={MISJON} hoyre />
                        {beat >= 1 && <Merke ll={STED.rana} tekst="Rana" p={p} farge={ROD} stor venstre />}
                        {beat >= 1 &&
                            [0, 1, 2].map((i) => (
                                <Tromme key={i} ll={[16.6 + i * 1.7, 66.2 - i * 0.25]} p={p} storrelse={0.9} forsinkelse={0.4 + i * 0.35} />
                            ))}
                        {beat >= 2 && <Pil d={linje(TIL_KBH)} farge={ROD} varighet={3} stiplet />}
                        {beat >= 2 && <Merke ll={STED.kobenhavn} tekst="København" p={p} farge={ROD} hoyre />}
                    </>
                )}
            </svg>

            <div className="absolute right-[3%] top-0 bottom-0 w-[36%] flex flex-col justify-center gap-4">
                <AnimatePresence mode="popLayout">
                    {kort.map((k, i) => (
                        <motion.div
                            key={`${modus}-${beat}-${k.tekst}`}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: i * 0.5, type: 'spring', stiffness: 160, damping: 20 }}
                            className={
                                k.stor
                                    ? 'px-5 py-4 rounded-2xl bg-amber-50 text-amber-900 font-black italic text-4xl md:text-5xl shadow-xl font-serif'
                                    : i === 0 && !k.farge
                                      ? 'px-5 py-3 rounded-2xl bg-slate-900 text-white font-black text-2xl md:text-4xl shadow-xl'
                                      : 'px-5 py-3 rounded-2xl bg-white/95 text-slate-900 font-bold text-xl md:text-2xl shadow-xl border-l-[10px]'
                            }
                            style={k.farge ? { borderColor: k.farge } : undefined}
                        >
                            {k.tekst}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

const Land = memo(function Land({ geographies, sti }: { geographies: unknown[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path key={i} d={sti(g as never) ?? ''} fill={LAND} stroke={KANT} strokeWidth={1.5} />
            ))}
        </>
    );
});

function Felt({ d, farge, vis = true, forsinkelse = 0 }: { d: string; farge: string; vis?: boolean; forsinkelse?: number }) {
    return (
        <motion.path
            d={d}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 0.4 : 0 }}
            transition={{ duration: 1.2, delay: forsinkelse }}
        />
    );
}

function Navn({ ll, tekst, p, farge = '#57534e' }: { ll: LngLat; tekst: string; p: P; farge?: string }) {
    const [x, y] = p(ll);
    return (
        <text x={x} y={y} textAnchor="middle" fontSize={30} fontWeight={900} letterSpacing={5} fill={farge} opacity={0.8} stroke="#ffffff" strokeWidth={5} paintOrder="stroke">
            {tekst}
        </text>
    );
}

function Merke({
    ll,
    tekst,
    p,
    farge,
    under,
    venstre,
    hoyre,
    stor,
}: {
    ll: LngLat;
    tekst: string;
    p: P;
    farge: string;
    under?: boolean;
    venstre?: boolean;
    hoyre?: boolean;
    stor?: boolean;
}) {
    const [x, y] = p(ll);
    const side = venstre || hoyre;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <circle cx={x} cy={y} r={stor ? 20 : 13} fill={farge} stroke="#ffffff" strokeWidth={4} />
            <text
                x={venstre ? x - 28 : hoyre ? x + 28 : x}
                y={side ? y + 11 : under ? y + 54 : y - 28}
                textAnchor={venstre ? 'end' : hoyre ? 'start' : 'middle'}
                fontSize={34}
                fontWeight={900}
                fill={farge}
                stroke="#ffffff"
                strokeWidth={7}
                paintOrder="stroke"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

/** En linje som tegnes fram, med en pilspiss til slutt. */
function Pil({
    d,
    farge,
    varighet = 2.2,
    forsinkelse = 0,
    stiplet,
    buet,
}: {
    d: string;
    farge: string;
    varighet?: number;
    forsinkelse?: number;
    stiplet?: boolean;
    buet?: boolean;
}) {
    // En buet linje går gjennom midtpunktet som kontrollpunkt (kvadratisk kurve).
    const tall = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
    const dd = buet && tall.length === 6 ? `M ${tall[0]} ${tall[1]} Q ${tall[2]} ${tall[3]} ${tall[4]} ${tall[5]}` : d;
    const t = { duration: varighet, delay: forsinkelse, ease: 'easeInOut' as const };
    return (
        <g>
            <motion.path d={dd} fill="none" stroke="#ffffff" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={t} />
            <motion.path
                d={dd}
                fill="none"
                stroke={farge}
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={stiplet ? '2 18' : undefined}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={t}
            />
            <Spiss tall={tall} farge={farge} forsinkelse={forsinkelse + varighet} />
        </g>
    );
}

function Spiss({ tall, farge, forsinkelse }: { tall: number[]; farge: string; forsinkelse: number }) {
    if (tall.length < 4) return null;
    const [x1, y1, x2, y2] = tall.slice(-4);
    const vinkel = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: forsinkelse - 0.2 }}>
            <path d="M -4 -20 L 30 0 L -4 20 Z" transform={`translate(${x2} ${y2}) rotate(${vinkel})`} fill={farge} stroke="#ffffff" strokeWidth={4} strokeLinejoin="round" />
        </motion.g>
    );
}

/** En liten kirke: samene er døpt og går i kirken. */
function Kirke({ ll, p }: { ll: LngLat; p: P }) {
    const [x, y] = p(ll);
    return (
        <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <g transform={`translate(${x} ${y})`}>
                <path d="M -60 60 L -60 0 L 0 -40 L 60 0 L 60 60 Z" fill="#ffffff" stroke={SAMI} strokeWidth={6} strokeLinejoin="round" />
                <rect x={-14} y={22} width={28} height={38} fill={SAMI} />
                <path d="M 0 -40 L 0 -100 M -18 -82 L 18 -82" stroke={SAMI} strokeWidth={8} strokeLinecap="round" />
            </g>
        </motion.g>
    );
}

/** Samisk tromme sett ovenfra: oval ramme, skinn og noen enkle figurer. */
function Tromme({ ll, p, storrelse = 1, forsinkelse = 0.3 }: { ll: LngLat; p: P; storrelse?: number; forsinkelse?: number }) {
    const [x, y] = p(ll);
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 180, damping: 14 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <g transform={`translate(${x} ${y}) scale(${storrelse})`}>
                <ellipse cx={0} cy={0} rx={46} ry={58} fill="#8a5a2b" stroke="#ffffff" strokeWidth={5} />
                <ellipse cx={0} cy={0} rx={38} ry={50} fill="#f1dfb8" />
                <path d="M -38 0 L 38 0" stroke="#9f2a1a" strokeWidth={3} />
                <circle cx={0} cy={0} r={10} fill="none" stroke="#9f2a1a" strokeWidth={3.5} />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                    <line key={a} x1={0} y1={0} x2={0} y2={-17} stroke="#9f2a1a" strokeWidth={3} transform={`rotate(${a})`} />
                ))}
                <path d="M -24 -22 L -18 -36 L -12 -22 M -18 -32 L -18 -14" stroke="#9f2a1a" strokeWidth={3} fill="none" />
                <path d="M 12 -30 L 20 -40 L 28 -30 Z" fill="#9f2a1a" />
                <path d="M -20 26 L -14 16 L -8 26 M 10 22 L 18 34 L 26 22" stroke="#9f2a1a" strokeWidth={3} fill="none" />
            </g>
        </motion.g>
    );
}

/** Brevet hjem fra Hammerfest. */
function Brevet({ ll, p }: { ll: LngLat; p: P }) {
    const [x, y] = p(ll);
    return (
        <motion.g initial={{ opacity: 0, rotate: -8 }} animate={{ opacity: 1, rotate: -4 }} style={{ transformOrigin: `${x}px ${y}px` }}>
            <rect x={x - 90} y={y - 110} width={180} height={220} rx={8} fill="#fffbeb" stroke="#a8a29e" strokeWidth={4} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <line key={i} x1={x - 62} x2={x + (i === 5 ? 0 : 62)} y1={y - 70 + i * 28} y2={y - 70 + i * 28} stroke="#a8a29e" strokeWidth={5} strokeLinecap="round" />
            ))}
            <text x={x} y={y + 96} textAnchor="middle" fontSize={22} fontWeight={900} fill={MISJON}>
                T. von Westen
            </text>
        </motion.g>
    );
}

/** Syvstjernen: et lite stjernebilde over Romsdal. */
function Syvstjernen({ ll, p }: { ll: LngLat; p: P }) {
    const [x, y] = p(ll);
    const pkt = [
        [-70, 10],
        [-40, -20],
        [-5, -35],
        [30, -15],
        [60, -40],
        [80, 0],
        [40, 25],
    ];
    return (
        <g>
            <motion.path
                d={'M ' + pkt.map(([a, b]) => `${x + a} ${y + b}`).join(' L ')}
                fill="none"
                stroke={GULL}
                strokeWidth={3}
                strokeDasharray="6 8"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.6 }}
            />
            {pkt.map(([a, b], i) => (
                <motion.path
                    key={i}
                    d="M 0 -16 L 4.5 -5 L 16 -5 L 7 2 L 10 14 L 0 7 L -10 14 L -7 2 L -16 -5 L -4.5 -5 Z"
                    transform={`translate(${x + a} ${y + b})`}
                    fill="#facc15"
                    stroke="#ffffff"
                    strokeWidth={2}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.25 }}
                />
            ))}
        </g>
    );
}

function Boble({
    ll,
    p,
    tekst,
    farge,
    dx,
    dy,
    liten,
    forsinkelse = 0.3,
}: {
    ll: LngLat;
    p: P;
    tekst: string;
    farge: string;
    dx: number;
    dy: number;
    liten?: boolean;
    forsinkelse?: number;
}) {
    const [x, y] = p(ll);
    const b = liten ? 130 : 190;
    const h = liten ? 52 : 70;
    const cx = x + dx;
    const cy = y + dy;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 220, damping: 15 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
            <path d={`M ${x} ${y - 14} L ${cx - 14} ${cy + h / 2 - 2} L ${cx + 14} ${cy + h / 2 - 2} Z`} fill="#ffffff" />
            <rect x={cx - b / 2} y={cy - h / 2} width={b} height={h} rx={h / 2} fill="#ffffff" stroke={farge} strokeWidth={5} />
            <text x={cx} y={cy + (liten ? 10 : 13)} textAnchor="middle" fontSize={liten ? 28 : 38} fontWeight={900} fill={farge}>
                {tekst}
            </text>
        </motion.g>
    );
}

/** Kongens krone. */
function Krone({ ll, p }: { ll: LngLat; p: P }) {
    const [x, y] = p(ll);
    return (
        <motion.g initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, type: 'spring' }}>
            <g transform={`translate(${x} ${y})`}>
                <path d="M -50 30 L -56 -26 L -26 0 L 0 -40 L 26 0 L 56 -26 L 50 30 Z" fill="#facc15" stroke={GULL} strokeWidth={6} strokeLinejoin="round" />
                <rect x={-52} y={30} width={104} height={16} rx={4} fill={GULL} />
            </g>
        </motion.g>
    );
}

/** Et tåkete felt der ingen visste hvor grensa gikk. */
function Uklart({ ll, p }: { ll: LngLat; p: P }) {
    const [x, y] = p(ll);
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 1 }}>
            <ellipse cx={x} cy={y} rx={250} ry={130} fill="#ffffff" fillOpacity={0.55} stroke="#57534e" strokeWidth={5} strokeDasharray="16 14" />
            {[-120, 0, 120].map((dx, i) => (
                <motion.text
                    key={i}
                    x={x + dx}
                    y={y + 30 + (i === 1 ? -20 : 10)}
                    textAnchor="middle"
                    fontSize={84}
                    fontWeight={900}
                    fill="#57534e"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5 }}
                >
                    ?
                </motion.text>
            ))}
        </motion.g>
    );
}
