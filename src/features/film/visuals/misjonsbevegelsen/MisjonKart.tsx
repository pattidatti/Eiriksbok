import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';

/**
 * Kart for misjonsfilmen: Stavanger i 1842, Schreuders lange vei til Zululand, Madagaskar,
 * og krigen i 1940 da pengene fra Norge stoppet. Kartet står til venstre, forklaringene til høyre.
 */

type Modus = 'stavanger' | 'zululand' | 'madagaskar' | 'krig';
type LngLat = [number, number];
type P = (ll: LngLat) => [number, number];

const B = 1600;
const H = 900;
const MISJON = '#0f766e';
const GULL = '#b45309';
const ROD = '#b91c1c';
const BLA = '#1d4ed8';
const LILLA = '#7c3aed';
const LAND = '#f5efe0';
const KANT = '#b9ad92';

const ID = {
    norge: '578',
    sverige: '752',
    madagaskar: '450',
    sorafrika: '710',
    usa: '840',
    tyskland: '276',
};

const STED = {
    stavanger: [5.73, 58.97] as LngLat,
    sogndal: [7.1, 61.23] as LngLat,
    lyngdal: [7.07, 58.14] as LngLat,
    zululand: [31.4, -28.4] as LngLat,
    hongkong: [114.17, 22.3] as LngLat,
    antsirabe: [47.03, -19.87] as LngLat,
    madagaskar: [46.8, -19.5] as LngLat,
    stockholm: [18.07, 59.33] as LngLat,
    usa: [-77, 39] as LngLat,
    oslo: [10.75, 59.91] as LngLat,
};

/** Sjøveien rundt Afrika, grovt tegnet. */
const TIL_ZULULAND: LngLat[] = [
    STED.stavanger,
    [2, 54],
    [-8, 46],
    [-17, 22],
    [-14, 4],
    [4, -14],
    [14, -33],
    [24, -36],
    STED.zululand,
];
// Sjøveien gjennom Det indiske hav og Malakkastredet.
const TIL_HONGKONG: LngLat[] = [STED.zululand, [36, -30], [55, -18], [75, -2], [92, 5], [98.5, 4.2], [104, 1.3], [110, 9], STED.hongkong];
const TILBAKE: LngLat[] = [STED.hongkong, [112, 9], [105, 0.5], [97, 3], [88, -4], [68, -16], [48, -30], [36, -32]];
const TIL_MADAGASKAR: LngLat[] = [STED.oslo, [10, 40], [22, 20], [40, 0], STED.madagaskar];
const SVERIGE_MADAGASKAR: LngLat[] = [STED.stockholm, [30, 40], [44, 10], STED.madagaskar];
const USA_MADAGASKAR: LngLat[] = [STED.usa, [-45, 20], [-10, -10], [20, -30], [40, -24]];

interface Kort {
    tekst: string;
    farge?: string;
}

const KORT: Record<Modus, Kort[][]> = {
    stavanger: [
        [{ tekst: '8. august 1842' }, { tekst: 'Det Norske Misjonsselskap', farge: MISJON }],
        [{ tekst: 'Norges eldste' }, { tekst: 'Hovedkontoret er fortsatt i Stavanger', farge: MISJON }],
        [{ tekst: 'Haugianerne' }, { tekst: 'Folk som fulgte Hans Nielsen Hauge', farge: LILLA }],
        [{ tekst: '1843' }, { tekst: 'Misjonsskole i Stavanger', farge: BLA }],
    ],
    zululand: [
        [{ tekst: 'Hans Schreuder' }, { tekst: 'Født i Sogndal i 1817', farge: MISJON }],
        [{ tekst: '1843' }, { tekst: 'Sendt til Zululand', farge: MISJON }, { tekst: 'I dag en del av Sør-Afrika' }],
        [{ tekst: 'Den første' }, { tekst: 'norske misjonæren i Sør-Afrika', farge: MISJON }, { tekst: 'Arbeidet går tregt', farge: ROD }],
        [{ tekst: '1847' }, { tekst: 'Til Hongkong: misjon i Kina?', farge: GULL }, { tekst: 'Advart. Tilbake til Afrika', farge: ROD }],
        [{ tekst: '1850' }, { tekst: 'Endelig en fast stasjon', farge: MISJON }],
        [
            { tekst: '1866: biskop', farge: MISJON },
            { tekst: 'Uenig om blant annet dåp', farge: ROD },
            { tekst: '1872: egen misjon', farge: GULL },
        ],
    ],
    madagaskar: [
        [{ tekst: 'Madagaskar' }, { tekst: 'En stor øy øst for Afrika', farge: MISJON }],
        [{ tekst: '1866' }, { tekst: 'Kirker', farge: MISJON }, { tekst: 'Skoler', farge: BLA }, { tekst: 'Helsetilbud', farge: ROD }],
        [{ tekst: 'Antsirabe' }, { tekst: 'Jordbruk, helse og skole', farge: MISJON }],
    ],
    krig: [
        [{ tekst: '1940' }, { tekst: 'Tyskland okkuperer Norge', farge: ROD }, { tekst: 'Nazistene tar over Misjonsselskapet', farge: ROD }],
        [{ tekst: 'Pengene stopper' }, { tekst: 'Ingen penger fra Norge', farge: ROD }],
        [{ tekst: 'Arbeidet fortsetter' }, { tekst: 'Støtte fra blant annet Sverige og USA', farge: MISJON }],
    ],
};

/** Utsnittet per modus: hjørnene som skal fylle venstre del av bildet. */
const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    stavanger: [
        [2.5, 57.4],
        [13.5, 63.6],
    ],
    zululand: [
        [-22, -38],
        [118, 74],
    ],
    madagaskar: [
        [31, -27],
        [53, -11],
    ],
    krig: [
        [-112, -30],
        [55, 68],
    ],
};

export function MisjonKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'stavanger';
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

                {modus === 'stavanger' && (
                    <>
                        <Navn ll={[9.6, 61.0]} tekst="NORGE" p={p} />
                        <Navn ll={[4.2, 60.6]} tekst="NORDSJØEN" p={p} farge="#3b82a6" />
                        <Merke ll={STED.stavanger} tekst="Stavanger" p={p} farge={MISJON} stor venstre />
                        {beat >= 1 && <Hus ll={STED.stavanger} p={p} />}
                        {beat === 2 &&
                            HAUGIANERE.map((ll, i) => (
                                <motion.circle
                                    key={i}
                                    cx={p(ll)[0]}
                                    cy={p(ll)[1]}
                                    r={11}
                                    fill={LILLA}
                                    stroke="#ffffff"
                                    strokeWidth={3}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 + i * 0.12 }}
                                    style={{ transformOrigin: `${p(ll)[0]}px ${p(ll)[1]}px` }}
                                />
                            ))}
                        {beat === 2 && (
                            <motion.path
                                d={HAUGIANERE.map((ll) => `M ${p(ll).join(' ')} L ${p(STED.stavanger).join(' ')}`).join(' ')}
                                stroke={LILLA}
                                strokeWidth={3}
                                strokeDasharray="8 8"
                                fill="none"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                transition={{ delay: 1.6 }}
                            />
                        )}
                        {beat >= 3 && <Symbol ll={[7.4, 58.5]} p={p} tegn="skole" forsinkelse={0.2} />}
                    </>
                )}

                {modus === 'zululand' && (
                    <>
                        <Felt d={land(ID.sorafrika)} farge={MISJON} vis={beat >= 1} />
                        {beat >= 1 && <Pil d={linje(TIL_ZULULAND)} farge={MISJON} varighet={beat === 1 ? 3 : 0.01} />}
                        {beat === 3 && <Pil d={linje(TIL_HONGKONG)} farge={GULL} varighet={2.2} />}
                        {beat === 3 && <Pil d={linje(TILBAKE)} farge={ROD} varighet={2} forsinkelse={2.6} stiplet />}
                        {beat === 3 && <Merke ll={STED.hongkong} tekst="Hongkong" p={p} farge={GULL} venstre />}
                        {beat <= 1 && (
                            <Merke ll={beat === 0 ? STED.sogndal : STED.stavanger} tekst={beat === 0 ? 'Sogndal' : 'Stavanger'} p={p} farge={MISJON} hoyre />
                        )}
                        {beat >= 1 && <Merke ll={STED.zululand} tekst="Zululand" p={p} farge={MISJON} hoyre stor={beat >= 4} />}
                        {beat === 4 && <Stasjon ll={STED.zululand} p={p} />}
                    </>
                )}

                {modus === 'madagaskar' && (
                    <>
                        <Navn ll={[36, -14]} tekst="AFRIKA" p={p} />
                        <Felt d={land(ID.madagaskar)} farge={MISJON} vis />
                        {beat >= 1 && (
                            <>
                                <Symbol ll={[48.6, -15.2]} p={p} tegn="kirke" forsinkelse={0.2} />
                                <Symbol ll={[44.6, -20.6]} p={p} tegn="skole" forsinkelse={0.9} />
                                <Symbol ll={[47.6, -23.8]} p={p} tegn="helse" forsinkelse={1.6} />
                            </>
                        )}
                        {beat >= 2 && <Merke ll={STED.antsirabe} tekst="Antsirabe" p={p} farge={GULL} hoyre stor />}
                    </>
                )}

                {modus === 'krig' && (
                    <>
                        <Felt d={land(ID.tyskland)} farge="#44403c" vis />
                        <Felt d={land(ID.norge)} farge={ROD} vis />
                        <Felt d={land(ID.madagaskar)} farge={MISJON} vis />
                        <Felt d={land(ID.sverige)} farge={MISJON} vis={beat >= 2} />
                        <Felt d={land(ID.usa)} farge={MISJON} vis={beat >= 2} />
                        {beat >= 1 && <Pil d={linje(TIL_MADAGASKAR)} farge="#78716c" varighet={1.6} stiplet />}
                        {beat >= 1 && <Kryss ll={[22, 20]} p={p} />}
                        {beat >= 2 && <Pil d={linje(SVERIGE_MADAGASKAR)} farge={MISJON} varighet={2} />}
                        {beat >= 2 && <Pil d={linje(USA_MADAGASKAR)} farge={MISJON} varighet={2.6} />}
                        <Merke ll={STED.oslo} tekst="Norge" p={p} farge={ROD} venstre />
                        {beat >= 2 && <Merke ll={[-98, 38]} tekst="USA" p={p} farge={MISJON} under />}
                        {beat >= 2 && <Merke ll={STED.stockholm} tekst="Sverige" p={p} farge={MISJON} hoyre />}
                        <Merke ll={[46.8, -19.5]} tekst="Madagaskar" p={p} farge={MISJON} hoyre />
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
                                i === 0 && !k.farge
                                    ? 'px-5 py-3 rounded-2xl bg-slate-900 text-white font-black text-3xl md:text-4xl shadow-xl'
                                    : 'px-5 py-3 rounded-2xl bg-white/95 text-slate-900 font-bold text-2xl shadow-xl border-l-[10px]'
                            }
                            style={k.farge ? { borderColor: k.farge } : { borderColor: '#cbd5e1' }}
                        >
                            {k.tekst}
                        </motion.div>
                    ))}
                    {modus === 'zululand' && beat === 4 && (
                        <motion.div key="sju" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-center">
                                <div className="text-6xl font-black text-red-700">
                                    <TelleTall verdi={7} forsinkelse={0.8} />
                                </div>
                                <div className="text-2xl font-bold text-slate-700">år å vente</div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

/** Steder i Sør-Norge der haugianere bodde, tegnet som prikker. Bare for å vise at de var mange. */
const HAUGIANERE: LngLat[] = [
    [6.4, 59.3], [7.1, 58.6], [8.1, 58.3], [9.2, 59.2], [10.3, 59.6], [11.2, 60.3],
    [9.9, 61.1], [7.6, 60.4], [6.1, 60.9], [5.6, 61.6], [8.6, 62.3], [10.6, 62.8],
];

const Land = memo(function Land({ geographies, sti }: { geographies: unknown[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path key={i} d={sti(g as never) ?? ''} fill={LAND} stroke={KANT} strokeWidth={1.5} />
            ))}
        </>
    );
});

function Felt({ d, farge, vis }: { d: string; farge: string; vis: boolean }) {
    if (!d) return null;
    return (
        <motion.path
            d={d}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={1.5}
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 0.55 : 0, fill: farge }}
            transition={{ duration: 1.2 }}
        />
    );
}

function Navn({ ll, tekst, p, farge = '#57534e' }: { ll: LngLat; tekst: string; p: P; farge?: string }) {
    const [x, y] = p(ll);
    return (
        <text x={x} y={y} textAnchor="middle" fontSize={32} fontWeight={900} letterSpacing={5} fill={farge} opacity={0.75}>
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
                y={side ? y + 12 : under ? y + 54 : y - 28}
                textAnchor={venstre ? 'end' : hoyre ? 'start' : 'middle'}
                fontSize={36}
                fontWeight={900}
                fill={farge}
                stroke="#ffffff"
                strokeWidth={8}
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
}: {
    d: string;
    farge: string;
    varighet?: number;
    forsinkelse?: number;
    stiplet?: boolean;
}) {
    const overgang = { duration: varighet, delay: forsinkelse, ease: 'easeInOut' as const };
    return (
        <g>
            <motion.path
                d={d}
                fill="none"
                stroke="#ffffff"
                strokeWidth={15}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={overgang}
            />
            <motion.path
                d={d}
                fill="none"
                stroke={farge}
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={stiplet ? '4 16' : undefined}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={overgang}
            />
            <Spiss d={d} farge={farge} forsinkelse={forsinkelse + varighet} />
        </g>
    );
}

function Spiss({ d, farge, forsinkelse }: { d: string; farge: string; forsinkelse: number }) {
    const tall = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
    if (tall.length < 4) return null;
    const [x1, y1, x2, y2] = tall.slice(-4);
    const vinkel = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.max(0, forsinkelse - 0.2) }}>
            <path
                d="M -4 -18 L 28 0 L -4 18 Z"
                transform={`translate(${x2} ${y2}) rotate(${vinkel})`}
                fill={farge}
                stroke="#ffffff"
                strokeWidth={4}
                strokeLinejoin="round"
            />
        </motion.g>
    );
}

type Tegn = 'skole' | 'helse' | 'kirke';

/** Et lite skilt med et symbol: skole (bok), helse (kors), kirke. */
function Symbol({ ll, p, tegn, forsinkelse }: { ll: LngLat; p: P; tegn: Tegn; forsinkelse: number }) {
    const [x, y] = p(ll);
    const farge = { skole: BLA, helse: ROD, kirke: MISJON }[tegn];
    return (
        <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 180, damping: 15 }}
        >
            <g transform={`translate(${x} ${y})`}>
                <circle r={44} fill="#ffffff" stroke={farge} strokeWidth={6} />
                {tegn === 'helse' && (
                    <path d="M -9 -26 H 9 V -9 H 26 V 9 H 9 V 26 H -9 V 9 H -26 V -9 H -9 Z" fill={farge} />
                )}
                {tegn === 'skole' && (
                    <g fill={farge}>
                        <path d="M -28 -16 Q -14 -24 0 -16 V 22 Q -14 14 -28 22 Z" />
                        <path d="M 28 -16 Q 14 -24 0 -16 V 22 Q 14 14 28 22 Z" opacity={0.75} />
                    </g>
                )}
                {tegn === 'kirke' && (
                    <g fill={farge}>
                        <path d="M -22 26 V -2 L 0 -20 L 22 -2 V 26 Z" />
                        <rect x={-3} y={-34} width={6} height={18} />
                        <rect x={-9} y={-29} width={18} height={5} />
                    </g>
                )}
            </g>
        </motion.g>
    );
}

/** Hovedkontoret: et lite hus ved siden av byen. */
function Hus({ ll, p }: { ll: LngLat; p: P }) {
    const [x, y] = p(ll);
    return (
        <motion.g initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <g transform={`translate(${x + 40} ${y + 30})`}>
                <path d="M 0 60 V 18 L 40 -12 L 80 18 V 60 Z" fill="#ffffff" stroke={MISJON} strokeWidth={5} />
                <rect x={32} y={34} width={16} height={26} fill={MISJON} />
            </g>
        </motion.g>
    );
}

/** Misjonsstasjonen som endelig står: et hus med kors. */
function Stasjon({ ll, p }: { ll: LngLat; p: P }) {
    const [x, y] = p(ll);
    return (
        <motion.g initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} style={{ transformOrigin: `${x}px ${y}px` }}>
            <g transform={`translate(${x - 150} ${y - 40})`}>
                <path d="M 0 70 V 26 L 45 -6 L 90 26 V 70 Z" fill="#ffffff" stroke={MISJON} strokeWidth={5} />
                <rect x={42} y={-30} width={6} height={22} fill={MISJON} />
                <rect x={36} y={-24} width={18} height={5} fill={MISJON} />
            </g>
        </motion.g>
    );
}

function Kryss({ ll, p }: { ll: LngLat; p: P }) {
    const [x, y] = p(ll);
    return (
        <motion.g initial={{ opacity: 0, scale: 2 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.4 }} style={{ transformOrigin: `${x}px ${y}px` }}>
            <circle cx={x} cy={y} r={44} fill="#ffffff" stroke={ROD} strokeWidth={8} />
            <path d={`M ${x - 22} ${y - 22} L ${x + 22} ${y + 22} M ${x + 22} ${y - 22} L ${x - 22} ${y + 22}`} stroke={ROD} strokeWidth={12} strokeLinecap="round" />
        </motion.g>
    );
}
