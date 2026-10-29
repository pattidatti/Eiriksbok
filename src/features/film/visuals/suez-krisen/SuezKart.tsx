import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import { Oversiktskart } from '../../kart/Oversiktskart';
import type { VisualProps } from '../../types';

/**
 * Kartet til Suez-filmen, i fire modus:
 * «snarvei»: den lange sjøveien mot snarveien gjennom kanalen, og oljen som går til Europa.
 * «nasser»: Egypt i 1952, drømmen om én arabisk verden, og de gamle kolonimaktene.
 * «invasjon»: Israel inn i Sinai, britene og franskmennene fra havet, fallskjermjegere ved kanalen.
 * «ungarn»: krigen mot Egypt samtidig med at Sovjetunionen slår ned opprøret i Ungarn.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'snarvei' | 'nasser' | 'invasjon' | 'ungarn';

const EGYPT = 818;
const ISRAEL = 376;
const UNGARN = 348;
const STORBRITANNIA = 826;
const FRANKRIKE = 250;
const ARABISK = [818, 434, 788, 12, 504, 729, 682, 887, 512, 784, 634, 48, 414, 368, 760, 400, 422];
const SOVJET = [643, 804, 112, 233, 428, 440, 498, 268, 51, 31, 398, 795, 860, 417, 762];

const STED = {
    london: [-0.1, 51.5] as LngLat,
    paris: [2.35, 48.85] as LngLat,
    moskva: [37.6, 55.75] as LngLat,
    kairo: [31.2, 30.05] as LngLat,
    suez: [32.4, 30.6] as LngLat,
    portSaid: [32.3, 31.26] as LngLat,
};

const KANAL: LngLat[] = [
    [32.3, 31.26],
    [32.33, 30.9],
    [32.27, 30.6],
    [32.35, 30.4],
    [32.55, 30.0],
    [32.55, 29.93],
];

/** Sjøveien uten kanal: rundt hele Afrika. */
const LANG_VEI: LngLat[] = [
    [-4, 47],
    [-11, 40],
    [-18, 27],
    [-20, 12],
    [-8, 1],
    [6, -12],
    [14, -30],
    [20, -36.5],
    [33, -33],
    [44, -22],
    [52, -6],
    [58, 8],
    [70, 15],
];

/** Snarveien: Middelhavet, kanalen, Rødehavet. */
const KORT_VEI: LngLat[] = [
    [-4, 47],
    [-11, 40],
    [-7, 36],
    [8, 37.6],
    [20, 34.5],
    [32.3, 31.6],
    [32.45, 30.3],
    [33.3, 28],
    [38, 21],
    [43.2, 12.8],
    [52, 13],
    [62, 14],
    [70, 15],
];

/** Oljen: fra Persiabukta, rundt Arabia, gjennom kanalen og til Europa. */
const OLJE_VEI: LngLat[] = [
    [50, 27.5],
    [56.5, 26],
    [59, 21],
    [52, 13.5],
    [43.4, 12.6],
    [38, 21],
    [33.3, 28],
    [32.45, 30.3],
    [32.3, 31.6],
    [20, 34.5],
    [8, 37.6],
    [5, 43.2],
];

const FARGE = {
    land: '#efe7d6',
    kant: '#b9ad92',
    hav: '#cfe3f0',
    egypt: '#15803d',
    egyptLys: '#86efac',
    britisk: '#b91c1c',
    fransk: '#1d4ed8',
    israel: '#7c3aed',
    sovjet: '#7f1d1d',
    ungarn: '#ef4444',
    blek: '#d6d3d1',
    vei: '#64748b',
    snarvei: '#0f766e',
    olje: '#111827',
};

const UTSNITT_INVASJON: Utsnitt = [
    [28.5, 27.6],
    [36.6, 33.6],
];

function lagProjeksjon(modus: Modus): GeoProjection {
    const utsnitt = (a: LngLat, b: LngLat) =>
        geoMercator().fitExtent(
            [
                [60, 140],
                [B - 60, H - 40],
            ],
            { type: 'MultiPoint', coordinates: [a, b] } as never
        );
    switch (modus) {
        case 'snarvei':
            return utsnitt([-22, -38], [78, 58]);
        case 'nasser':
            return utsnitt([-14, 8], [62, 56]);
        case 'invasjon':
            return utsnitt(UTSNITT_INVASJON[0], UTSNITT_INVASJON[1]);
        default:
            return utsnitt([-12, 22], [55, 62]);
    }
}

function fargeFor(modus: Modus, beat: number, id: number): string {
    switch (modus) {
        case 'snarvei':
            if (id === EGYPT && beat >= 3) return FARGE.egypt;
            return FARGE.land;
        case 'nasser':
            if (id === EGYPT) return FARGE.egypt;
            if (beat >= 2 && ARABISK.includes(id)) return FARGE.egyptLys;
            if (beat >= 3 && id === STORBRITANNIA) return FARGE.britisk;
            if (beat >= 3 && id === FRANKRIKE) return FARGE.fransk;
            return FARGE.land;
        case 'invasjon':
            if (id === ISRAEL) return FARGE.israel;
            if (id === EGYPT) return '#f5ead2';
            return FARGE.land;
        case 'ungarn':
            if (id === EGYPT) return FARGE.egypt;
            if (beat === 0 && (id === STORBRITANNIA || id === FRANKRIKE || id === ISRAEL))
                return id === FRANKRIKE ? FARGE.fransk : id === ISRAEL ? FARGE.israel : FARGE.britisk;
            if (beat >= 1 && id === UNGARN) return beat >= 2 ? '#fca5a5' : FARGE.ungarn;
            if (beat >= 1 && SOVJET.includes(id)) return FARGE.sovjet;
            return FARGE.land;
    }
}

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    snarvei: [
        { tekst: 'Før: den lange veien' },
        { tekst: 'Med kanalen: flere tusen km kortere' },
        { tekst: 'To tredjedeler av Europas olje' },
        { tekst: 'Livslinje for Europa. Vestens makt for Egypt.' },
    ],
    nasser: [
        { tekst: '1952: offiserer tar makten i Egypt' },
        { tekst: 'Nasser: Egypt skal bestemme selv' },
        { tekst: 'Drømmen: én arabisk verden' },
        { tekst: 'Fri fra de gamle kolonimaktene' },
    ],
    invasjon: [
        { tekst: '29. oktober 1956: Israel angriper' },
        { tekst: 'Så kommer britene og franskmennene' },
        { tekst: 'Fallskjermjegere ved kanalen' },
        { tekst: 'Militært: suksess. Politisk: katastrofe.', rod: true },
    ],
    ungarn: [
        { tekst: 'Krig mot et utviklingsland' },
        { tekst: 'Samtidig: opprøret i Ungarn slås ned', rod: true },
        { tekst: 'Verden ser mer mot Egypt, mindre mot Ungarn' },
    ],
};

export function SuezKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'snarvei';
    const { geographies } = useFilmVerden(modus === 'invasjon' ? UTSNITT_INVASJON : undefined);
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const linje = (punkter: LngLat[]) =>
        sti({ type: 'LineString', coordinates: punkter } as never) ?? '';
    const brikker = BRIKKER[modus];
    const brikke = brikker[Math.min(beat, brikker.length - 1)];

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.hav }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land
                    geographies={geographies}
                    sti={sti}
                    farge={(id) => fargeFor(modus, beat, id)}
                    nokkel={`${modus}-${beat}`}
                />

                {modus === 'snarvei' && (
                    <>
                        <Rute d={linje(LANG_VEI)} farge={FARGE.vei} bredde={7} dempet={beat >= 1} />
                        {beat >= 1 && <Rute d={linje(KORT_VEI)} farge={FARGE.snarvei} bredde={9} />}
                        {beat >= 2 && <Tankskip d={linje(OLJE_VEI)} />}
                        <Punkt pos={p(STED.suez)} farge="#dc2626" />
                        <Etikett pos={p([42, 33.5])} tekst="Suezkanalen" farge="#991b1b" />
                        <Etikett pos={p([12, 52])} tekst="Europa" farge="#334155" />
                        <Etikett pos={p([66, 26])} tekst="Asia" farge="#334155" />
                        {beat < 3 && <Etikett pos={p([20, 5])} tekst="Afrika" farge="#334155" />}
                        {beat === 2 && (
                            <Etikett pos={p([63, 5])} tekst="Olje" farge={FARGE.olje} forsinkelse={0.6} />
                        )}
                        {beat >= 3 && (
                            <>
                                <Etikett
                                    pos={p([-6, 30])}
                                    tekst="Europa: livslinje"
                                    farge="#0f172a"
                                    linjeTil={p([4, 43])}
                                />
                                <Etikett
                                    pos={p([12, 10])}
                                    tekst="Egypt: Vesten bestemmer"
                                    farge="#ffffff"
                                    mork
                                    forsinkelse={0.6}
                                    linjeTil={p([29.5, 26.5])}
                                />
                            </>
                        )}
                    </>
                )}

                {modus === 'nasser' && (
                    <>
                        <Puls pos={p(STED.kairo)} farge={FARGE.egypt} kort={beat > 0} />
                        <Etikett pos={p([29.5, 25.5])} tekst="Egypt" farge="#ffffff" mork stor />
                        {beat === 1 && (
                            <Etikett
                                pos={p([16, 33])}
                                tekst="Nasser"
                                farge="#14532d"
                                stor
                                linjeTil={p(STED.kairo)}
                            />
                        )}
                        {beat >= 2 && (
                            <Etikett
                                pos={p([-2, 27])}
                                tekst="Den arabiske verden"
                                farge="#14532d"
                                forsinkelse={0.5}
                            />
                        )}
                        {beat >= 3 && (
                            <>
                                <Brutt fra={p(STED.london)} til={p(STED.kairo)} farge={FARGE.britisk} andel={0.35} />
                                <Brutt
                                    fra={p(STED.paris)}
                                    til={p(STED.kairo)}
                                    farge={FARGE.fransk}
                                    forsinkelse={0.4}
                                    andel={0.7}
                                />
                                <Etikett pos={p([-8, 56])} tekst="Storbritannia" farge={FARGE.britisk} />
                                <Etikett pos={p([2, 43])} tekst="Frankrike" farge={FARGE.fransk} />
                            </>
                        )}
                    </>
                )}

                {modus === 'invasjon' && (
                    <>
                        <path
                            d={linje(KANAL)}
                            fill="none"
                            stroke="#1d4ed8"
                            strokeWidth={14}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <Etikett pos={p([30.9, 30.05])} tekst="Suezkanalen" farge="#1e3a8a" />
                        <Etikett pos={p([30.1, 28.6])} tekst="Egypt" farge="#44403c" stor />
                        <Etikett pos={p([33.9, 29.3])} tekst="Sinai" farge="#78350f" stor />
                        <Etikett
                            pos={p([35.9, 30.4])}
                            tekst="Israel"
                            farge="#ffffff"
                            mork
                            linjeTil={p([35, 31])}
                        />
                        <Pil fra={p([34.6, 31.05])} til={p([32.75, 30.45])} farge={FARGE.israel} bue={0.12} />
                        {beat >= 1 && (
                            <>
                                <Pil
                                    fra={p([31.1, 33.15])}
                                    til={p([32.2, 31.45])}
                                    farge={FARGE.britisk}
                                    bue={-0.1}
                                />
                                <Pil
                                    fra={p([33.7, 33.15])}
                                    til={p([32.45, 31.45])}
                                    farge={FARGE.fransk}
                                    bue={0.1}
                                    forsinkelse={0.4}
                                />
                                <Etikett pos={p([30.2, 33.25])} tekst="Storbritannia" farge={FARGE.britisk} />
                                <Etikett
                                    pos={p([34.8, 33.25])}
                                    tekst="Frankrike"
                                    farge={FARGE.fransk}
                                    forsinkelse={0.4}
                                />
                            </>
                        )}
                        {beat >= 2 &&
                            [
                                [31.95, 31.05],
                                [32.75, 30.85],
                                [32.8, 30.2],
                            ].map((ll, i) => (
                                <Fallskjerm key={i} pos={p(ll as LngLat)} forsinkelse={i * 0.4} />
                            ))}
                    </>
                )}

                {modus === 'ungarn' && (
                    <>
                        <Puls pos={p(STED.kairo)} farge="#dc2626" kort={beat === 1} />
                        <Etikett pos={p([28, 24.5])} tekst="Egypt" farge="#ffffff" mork />
                        {beat === 0 && (
                            <>
                                <Pil fra={p(STED.london)} til={p([29, 29])} farge={FARGE.britisk} bue={0.12} />
                                <Pil
                                    fra={p(STED.paris)}
                                    til={p([30, 29.5])}
                                    farge={FARGE.fransk}
                                    bue={0.08}
                                    forsinkelse={0.3}
                                />
                                <Pil
                                    fra={p([35, 31.5])}
                                    til={p([33, 30.2])}
                                    farge={FARGE.israel}
                                    bue={0.3}
                                    forsinkelse={0.6}
                                />
                            </>
                        )}
                        {beat >= 1 && (
                            <>
                                {beat === 1 && <Puls pos={p([19.1, 47.4])} farge={FARGE.ungarn} />}
                                <Etikett
                                    pos={p([10, 45])}
                                    tekst="Ungarn"
                                    farge={beat >= 2 ? '#9ca3af' : '#b91c1c'}
                                    linjeTil={p([18.2, 47.2])}
                                />
                                <Etikett
                                    pos={p([42, 58.5])}
                                    tekst="Sovjetunionen"
                                    farge="#ffffff"
                                    mork
                                />
                            </>
                        )}
                        {beat >= 2 && (
                            <Pil fra={p(STED.moskva)} til={p([32.6, 31.6])} farge={FARGE.sovjet} bue={-0.12} />
                        )}
                    </>
                )}
            </svg>

            {modus === 'invasjon' && (
                <Oversiktskart
                    utsnitt={UTSNITT_INVASJON}
                    omrade={[
                        [-12, 14],
                        [62, 50],
                    ]}
                    plassering="nede-venstre"
                    etikett="Midtøsten"
                />
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                        brikke.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {brikke.tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/** Landene tegnes på nytt bare når fargene endrer seg. CSS glir mellom fargene. */
const Land = memo(
    function Land({
        geographies,
        sti,
        farge,
    }: {
        geographies: { id?: string | number }[];
        sti: GeoPath;
        farge: (id: number) => string;
        nokkel: string;
    }) {
        return (
            <>
                {geographies.map((g, i) => (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={farge(Number(g.id))}
                        stroke={FARGE.kant}
                        strokeWidth={0.8}
                        vectorEffect="non-scaling-stroke"
                        style={{ transition: 'fill 1.1s ease' }}
                    />
                ))}
            </>
        );
    },
    (a, b) => a.nokkel === b.nokkel && a.geographies === b.geographies && a.sti === b.sti
);

function Rute({
    d,
    farge,
    bredde,
    dempet,
}: {
    d: string;
    farge: string;
    bredde: number;
    dempet?: boolean;
}) {
    return (
        <motion.path
            d={d}
            fill="none"
            stroke={farge}
            strokeWidth={bredde}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{ pathLength: 1, opacity: dempet ? 0.35 : 1 }}
            transition={{ pathLength: { duration: 2.4, ease: 'easeInOut' }, opacity: { duration: 0.8 } }}
        />
    );
}

/** Små svarte tankskip som går i sløyfe langs oljeruta. */
function Tankskip({ d }: { d: string }) {
    return (
        <g>
            <path d={d} fill="none" stroke={FARGE.olje} strokeWidth={3} opacity={0.35} />
            {[0, 1, 2, 3, 4].map((i) => (
                <g
                    key={i}
                    style={
                        {
                            offsetPath: `path('${d}')`,
                            offsetRotate: 'auto',
                            animation: `suez-olje 9s linear ${-i * 1.8}s infinite`,
                        } as never
                    }
                >
                    <rect x={-16} y={-7} width={32} height={14} rx={6} fill={FARGE.olje} />
                    <rect x={-12} y={-3} width={14} height={6} rx={2} fill="#f59e0b" />
                </g>
            ))}
            <style>{`@keyframes suez-olje { from { offset-distance: 0%; } to { offset-distance: 100%; } }`}</style>
        </g>
    );
}

/** En stiplet forbindelse som brytes med et rødt kryss på midten. */
function Brutt({
    fra,
    til,
    farge,
    forsinkelse = 0,
    andel = 0.5,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    forsinkelse?: number;
    /** Hvor langs streken krysset står (0-1). */
    andel?: number;
}) {
    const mx = fra[0] + (til[0] - fra[0]) * andel;
    const my = fra[1] + (til[1] - fra[1]) * andel;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
        >
            <line
                x1={fra[0]}
                y1={fra[1]}
                x2={til[0]}
                y2={til[1]}
                stroke={farge}
                strokeWidth={6}
                strokeDasharray="16 12"
                opacity={0.7}
            />
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 0.9 }}
            >
                <circle cx={mx} cy={my} r={30} fill="#ffffff" stroke="#111827" strokeWidth={4} />
                <path
                    d={`M ${mx - 14} ${my - 14} L ${mx + 14} ${my + 14} M ${mx + 14} ${my - 14} L ${mx - 14} ${my + 14}`}
                    stroke="#dc2626"
                    strokeWidth={8}
                    strokeLinecap="round"
                />
            </motion.g>
        </motion.g>
    );
}

function Fallskjerm({ pos, forsinkelse }: { pos: [number, number]; forsinkelse: number }) {
    const [x, y] = pos;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: forsinkelse }}
        >
            <path
                d={`M ${x - 34} ${y - 40} Q ${x} ${y - 90} ${x + 34} ${y - 40} Z`}
                fill="#f8fafc"
                stroke="#334155"
                strokeWidth={4}
            />
            <path
                d={`M ${x - 34} ${y - 40} L ${x} ${y} L ${x + 34} ${y - 40} M ${x} ${y - 40} L ${x} ${y}`}
                stroke="#334155"
                strokeWidth={2.5}
                fill="none"
            />
            <circle cx={x} cy={y + 6} r={9} fill="#334155" />
        </motion.g>
    );
}

function Etikett({
    pos,
    tekst,
    farge = '#0f172a',
    stor,
    mork,
    forsinkelse = 0,
    linjeTil,
}: {
    pos: [number, number];
    tekst: string;
    farge?: string;
    stor?: boolean;
    /** Hvit tekst med mørk kant, til bruk oppå fargede land. */
    mork?: boolean;
    forsinkelse?: number;
    /** Tynn strek fra etiketten til et punkt. */
    linjeTil?: [number, number];
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: forsinkelse }}
        >
            {linjeTil && (
                <>
                    <line
                        x1={pos[0]}
                        y1={pos[1]}
                        x2={linjeTil[0]}
                        y2={linjeTil[1]}
                        stroke="#1f2937"
                        strokeWidth={4}
                    />
                    <circle cx={linjeTil[0]} cy={linjeTil[1]} r={8} fill="#1f2937" />
                </>
            )}
            <text
                x={pos[0]}
                y={pos[1]}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={stor ? 56 : 40}
                fontWeight={900}
                fill={farge}
                stroke={mork ? '#1f2937' : '#ffffff'}
                strokeWidth={9}
                paintOrder="stroke"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Pil({
    fra,
    til,
    farge,
    forsinkelse = 0,
    bue = 0.15,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    forsinkelse?: number;
    bue?: number;
}) {
    const mx = (fra[0] + til[0]) / 2 - (til[1] - fra[1]) * bue;
    const my = (fra[1] + til[1]) / 2 + (til[0] - fra[0]) * bue;
    const vinkel = (Math.atan2(til[1] - my, til[0] - mx) * 180) / Math.PI;
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`}
                fill="none"
                stroke={farge}
                strokeWidth={10}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, delay: forsinkelse, ease: 'easeInOut' }}
            />
            <motion.path
                d="M -26 -17 L 8 0 L -26 17 Z"
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.3 }}
            />
        </g>
    );
}

function Punkt({ pos, farge }: { pos: [number, number]; farge: string }) {
    return <circle cx={pos[0]} cy={pos[1]} r={13} fill={farge} stroke="#ffffff" strokeWidth={5} />;
}

function Puls({ pos, farge, kort }: { pos: [number, number]; farge: string; kort?: boolean }) {
    return (
        <motion.circle
            cx={pos[0]}
            cy={pos[1]}
            fill="none"
            stroke={farge}
            strokeWidth={8}
            initial={{ r: 30, opacity: 0.9 }}
            animate={{ r: kort ? 110 : 200, opacity: 0 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        />
    );
}
