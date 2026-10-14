import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoNaturalEarth1, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';

/**
 * Kart over Indonesia 1949-1967, i seks modus:
 * «oyriket»: øyriket, ressursene, friheten fra Nederland i 1949 og Sukarno.
 * «mellom»: verden delt mellom USA og Sovjet, Indonesia som ikke velger side, PKI og Bandung.
 * «stengt»: vestlige selskaper som vil inn, men møter en stengt dør.
 * «hele-landet»: mørket som sprer seg fra øy til øy etter oktober 1965. Ingen mennesker vises.
 * «apent»: Suharto åpner landet, ressursene flyter ut, gull- og kobbergruva.
 * «jakarta»: ordet Jakarta som advarsel i Chile og Argentina.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'oyriket' | 'mellom' | 'stengt' | 'hele-landet' | 'apent' | 'jakarta';

const INDONESIA = 360;
const USA = 840;
const CHILE = 152;
const ARGENTINA = 32;
const NEDERLAND = 528;
/** Russland og de andre landene som var en del av Sovjetunionen. */
const SOVJET = [643, 804, 112, 398, 860, 795, 417, 762, 268, 51, 31, 440, 428, 233, 498];

const STED = {
    jakarta: [106.8, -6.2] as LngLat,
    bandung: [107.6, -6.9] as LngLat,
    sumatra: [102.5, -1.5] as LngLat,
    kalimantan: [114, 0.5] as LngLat,
    sulawesi: [121, -2] as LngLat,
    øst: [137.2, -4.1] as LngLat,
    usa: [-98, 39] as LngLat,
    sovjet: [70, 58] as LngLat,
    chile: [-71, -33] as LngLat,
    argentina: [-64, -36] as LngLat,
};

/** Punkter mørket brer seg ut over, ordnet fra Jakarta og utover. */
const MØRKE: LngLat[] = [
    [106.8, -6.4],
    [109.5, -7.2],
    [112.5, -7.6],
    [104, -3.5],
    [115.2, -8.4],
    [101, 0.2],
    [98.5, 3.2],
    [113, -1.5],
    [116.5, 1],
    [120.5, -3.5],
    [123.5, 0.6],
    [119.5, -8.7],
    [124, -9.3],
    [129.5, -3.2],
    [134, -2.5],
    [138.5, -4.5],
];

const FARGE = {
    land: '#efe7d6',
    kant: '#b9ad92',
    hav: '#cfe3f0',
    indonesia: '#16a34a',
    mork: '#44403c',
    usa: '#1e3a8a',
    sovjet: '#b91c1c',
    nederland: '#ea580c',
    selskap: '#1e3a8a',
    gull: '#ca8a04',
    advarsel: '#b91c1c',
};

function lagProjeksjon(modus: Modus): GeoProjection {
    if (modus === 'jakarta') {
        return geoNaturalEarth1()
            .rotate([172, 0])
            .fitExtent(
                [
                    [60, 150],
                    [B - 60, H - 30],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [95, 20],
                        [-48, -56],
                        [150, -12],
                    ],
                } as never
            );
    }
    const [a, b]: [LngLat, LngLat] =
        modus === 'mellom'
            ? [
                  [-125, -42],
                  [150, 68],
              ]
            : modus === 'stengt'
              ? [
                    [68, -14],
                    [142, 10],
                ]
              : [
                    [93, -12],
                    [142, 9],
                ];
    return geoNaturalEarth1().fitExtent(
        [
            [70, 160],
            [B - 70, H - 40],
        ],
        { type: 'MultiPoint', coordinates: [a, b] } as never
    );
}

function fargeFor(modus: Modus, beat: number, id: number): string {
    if (modus === 'oyriket') {
        if (id === INDONESIA) return beat === 2 ? '#22c55e' : FARGE.indonesia;
        return FARGE.land;
    }
    if (modus === 'mellom') {
        if (id === USA) return FARGE.usa;
        if (SOVJET.includes(id)) return FARGE.sovjet;
        if (id === INDONESIA) return beat >= 1 ? FARGE.indonesia : '#86efac';
        return FARGE.land;
    }
    if (modus === 'stengt') return id === INDONESIA ? FARGE.indonesia : FARGE.land;
    if (modus === 'hele-landet')
        return id === INDONESIA ? (beat >= 1 ? '#78716c' : '#a8a29e') : FARGE.land;
    if (modus === 'apent') return id === INDONESIA ? '#a3a3a3' : FARGE.land;
    if (id === INDONESIA) return '#57534e';
    if (beat >= 1 && (id === CHILE || id === ARGENTINA)) return FARGE.advarsel;
    if (id === NEDERLAND) return FARGE.land;
    return FARGE.land;
}

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    oyriket: [
        { tekst: 'Indonesia: et hav av øyer' },
        { tekst: 'Olje, gummi og skog' },
        { tekst: '1949: fritt fra Nederland' },
        { tekst: 'Lederen heter Sukarno' },
    ],
    mellom: [
        { tekst: 'En verden delt i to' },
        { tekst: 'Indonesia velger ingen side' },
        { tekst: 'PKI: et av verdens største kommunistpartier' },
        { tekst: 'Bandung 1955: Asia og Afrika møtes' },
        { tekst: 'Vesten blir redd', rod: true },
    ],
    stengt: [
        { tekst: 'Vestlige selskaper vil inn' },
        { tekst: 'Sukarno holder dem ute' },
        { tekst: 'Et problem for Vesten', rod: true },
    ],
    'hele-landet': [
        { tekst: 'Etter oktober 1965', rod: true },
        { tekst: 'Over hele landet', rod: true },
        { tekst: 'Vanlige mennesker', rod: true },
    ],
    apent: [
        { tekst: '1967: Suharto har all makt' },
        { tekst: 'Dørene åpnes for selskapene' },
        { tekst: 'Gull og kobber til Freeport' },
        { tekst: 'Rikdommen flyter ut', rod: true },
    ],
    jakarta: [
        { tekst: 'Jakarta' },
        { tekst: 'Chile og Argentina' },
        { tekst: '«Jakarta» malt på veggene', rod: true },
        { tekst: 'En by ble en metode', rod: true },
    ],
};

export function IndonesiaKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'oyriket';
    const { geographies } = useAtlasWorld();
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const brikke = BRIKKER[modus][Math.min(beat, BRIKKER[modus].length - 1)];
    const nær = modus !== 'mellom' && modus !== 'jakarta';

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

                {nær && modus !== 'hele-landet' && (
                    <Etikett pos={p([110, 4.5])} tekst="Indonesia" farge="#14532d" stor />
                )}

                {modus === 'oyriket' && (
                    <>
                        {beat === 0 && <Puls pos={p([114, -3])} farge={FARGE.indonesia} />}
                        {beat >= 1 && (
                            <>
                                <Ressurs pos={p(STED.sumatra)} type="olje" />
                                <Ressurs pos={p([98.5, 3])} type="gummi" forsinkelse={0.4} />
                                <Ressurs pos={p(STED.kalimantan)} type="skog" forsinkelse={0.8} />
                                <Ressurs pos={p(STED.sulawesi)} type="olje" forsinkelse={1.2} />
                            </>
                        )}
                        {beat >= 2 && (
                            <Frihet fra={[150, 260]} til={p([108, -5])} stempel={p([97, -9.5])} />
                        )}
                        {beat >= 3 && <Prikk pos={p(STED.jakarta)} tekst="Jakarta" />}
                    </>
                )}

                {modus === 'mellom' && (
                    <>
                        <Etikett pos={p([-100, 42])} tekst="USA" farge={FARGE.usa} stor />
                        <Etikett
                            pos={p([95, 57])}
                            tekst="Sovjetunionen"
                            farge={FARGE.sovjet}
                            stor
                        />
                        <Etikett pos={p([118, 4])} tekst="Indonesia" farge="#14532d" dy={-40} />
                        {beat >= 1 && (
                            <>
                                <Pil
                                    fra={p([-80, 30])}
                                    til={p([102, -2])}
                                    farge={FARGE.usa}
                                    bue={-0.12}
                                    stiplet
                                />
                                <Pil
                                    fra={p([90, 52])}
                                    til={p([112, 2])}
                                    farge={FARGE.sovjet}
                                    bue={0.1}
                                    stiplet
                                />
                                {beat === 1 && <Nei pos={p([114, -2])} />}
                            </>
                        )}
                        {beat >= 2 && <Merke pos={p([122, -8])} tekst="PKI" />}
                        {beat >= 3 && (
                            <>
                                {(
                                    [
                                        [20, 12],
                                        [32, 2],
                                        [3, 8],
                                        [36, 20],
                                        [78, 22],
                                        [92, 24],
                                        [68, 30],
                                        [100, 16],
                                    ] as LngLat[]
                                ).map((ll, i) => (
                                    <Pil
                                        key={i}
                                        fra={p(ll)}
                                        til={p(STED.bandung)}
                                        farge="#15803d"
                                        bue={0.08}
                                        tynn
                                        forsinkelse={i * 0.15}
                                    />
                                ))}
                                <Etikett pos={p([20, 0])} tekst="Afrika" farge="#14532d" />
                                <Etikett pos={p([80, 16])} tekst="Asia" farge="#14532d" />
                                <Prikk pos={p(STED.bandung)} tekst="Bandung" under />
                            </>
                        )}
                        {beat >= 4 && <Puls pos={p(STED.usa)} farge="#dc2626" />}
                    </>
                )}

                {modus === 'stengt' && (
                    <>
                        <Ressurs pos={p(STED.sumatra)} type="olje" />
                        <Ressurs pos={p([98.5, 3])} type="gummi" />
                        <Ressurs pos={p(STED.kalimantan)} type="skog" />
                        <Skip pos={p([74, 3])} beat={beat} rad={0} />
                        <Skip pos={p([72, -4])} beat={beat} rad={1} />
                        <Skip pos={p([76, -10])} beat={beat} rad={2} />
                        {beat >= 1 && <Sperre fra={p([91, 7])} til={p([91, -13])} />}
                    </>
                )}

                {modus === 'hele-landet' && (
                    <>
                        <MørkeFlekker punkter={MØRKE.map(p)} beat={beat} />
                    </>
                )}

                {modus === 'apent' && (
                    <>
                        <Ressurs pos={p(STED.sumatra)} type="olje" />
                        <Ressurs pos={p(STED.kalimantan)} type="skog" />
                        {beat >= 1 && (
                            <>
                                <Pil
                                    fra={p([101, -1])}
                                    til={[140, 260]}
                                    farge={FARGE.selskap}
                                    bue={-0.1}
                                />
                                <Pil
                                    fra={p([114, 1])}
                                    til={[520, 190]}
                                    farge={FARGE.selskap}
                                    bue={0.1}
                                    forsinkelse={0.3}
                                />
                                <Pil
                                    fra={p([136, -3])}
                                    til={[1480, 230]}
                                    farge={FARGE.selskap}
                                    bue={-0.12}
                                    forsinkelse={0.6}
                                />
                                <Etikett pos={[1380, 190]} tekst="til USA" farge={FARGE.selskap} />
                                <Etikett
                                    pos={[250, 210]}
                                    tekst="til Vesten"
                                    farge={FARGE.selskap}
                                />
                            </>
                        )}
                        {beat >= 1 && <Gruve pos={p(STED.øst)} />}
                        {beat >= 3 && (
                            <>
                                <Mynter pos={[200, 330]} forsinkelse={0.3} />
                                <Mynter pos={[560, 250]} forsinkelse={0.7} />
                                <Mynter pos={[200, 700]} forsinkelse={1.1} />
                            </>
                        )}
                    </>
                )}

                {modus === 'jakarta' && (
                    <>
                        <Prikk pos={p(STED.jakarta)} tekst="Jakarta" under />
                        {beat === 0 && <Puls pos={p(STED.jakarta)} farge="#57534e" />}
                        {beat >= 1 && (
                            <>
                                <Pil
                                    fra={p(STED.jakarta)}
                                    til={p(STED.chile)}
                                    farge="#7f1d1d"
                                    bue={0.12}
                                    stiplet
                                />
                                <Pil
                                    fra={p(STED.jakarta)}
                                    til={p(STED.argentina)}
                                    farge="#7f1d1d"
                                    bue={0.16}
                                    stiplet
                                    forsinkelse={0.3}
                                />
                                <Etikett pos={p([-98, -30])} tekst="Chile og" farge="#7f1d1d" />
                                <Etikett pos={p([-98, -38])} tekst="Argentina" farge="#7f1d1d" />
                            </>
                        )}
                    </>
                )}
            </svg>

            {modus === 'oyriket' && beat >= 3 && (
                <Kort tittel="Sukarno" tekst="Leder for det frie Indonesia fra 1949" hoyre />
            )}
            {modus === 'apent' && beat === 0 && (
                <Kort tittel="General Suharto" tekst="Tar hele makten i 1967" />
            )}
            {modus === 'hele-landet' && beat >= 2 && <Grupper />}
            {modus === 'jakarta' && beat >= 2 && <Vegg />}

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                        brikke.rod ? 'bg-red-800 text-white' : 'bg-white/95 text-slate-900'
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
                        style={{ transition: 'fill 1.2s ease' }}
                    />
                ))}
            </>
        );
    },
    (a, b) => a.nokkel === b.nokkel && a.geographies === b.geographies && a.sti === b.sti
);

function Etikett({
    pos,
    tekst,
    farge = '#0f172a',
    stor,
    dy = 0,
}: {
    pos: [number, number];
    tekst: string;
    farge?: string;
    stor?: boolean;
    dy?: number;
}) {
    return (
        <motion.text
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            x={pos[0]}
            y={pos[1] + dy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={stor ? 56 : 42}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={9}
            paintOrder="stroke"
        >
            {tekst}
        </motion.text>
    );
}

function Pil({
    fra,
    til,
    farge,
    forsinkelse = 0,
    bue = 0.15,
    stiplet,
    tynn,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    forsinkelse?: number;
    bue?: number;
    stiplet?: boolean;
    tynn?: boolean;
}) {
    const mx = (fra[0] + til[0]) / 2 - (til[1] - fra[1]) * bue;
    const my = (fra[1] + til[1]) / 2 + (til[0] - fra[0]) * bue;
    const vinkel = (Math.atan2(til[1] - my, til[0] - mx) * 180) / Math.PI;
    const s = tynn ? 0.6 : 1;
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`}
                fill="none"
                stroke={farge}
                strokeWidth={8 * s}
                strokeLinecap="round"
                strokeDasharray={stiplet ? '4 18' : undefined}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: forsinkelse, ease: 'easeInOut' }}
            />
            <motion.path
                d={`M ${-22 * s} ${-14 * s} L ${6 * s} 0 L ${-22 * s} ${14 * s} Z`}
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.4 }}
            />
        </g>
    );
}

function Puls({ pos, farge }: { pos: [number, number]; farge: string }) {
    return (
        <motion.circle
            cx={pos[0]}
            cy={pos[1]}
            fill="none"
            stroke={farge}
            strokeWidth={8}
            initial={{ r: 40, opacity: 0.9 }}
            animate={{ r: 260, opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
        />
    );
}

/** Byprikk med navn. */
function Prikk({ pos, tekst, under }: { pos: [number, number]; tekst: string; under?: boolean }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <circle
                cx={pos[0]}
                cy={pos[1]}
                r={13}
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth={5}
            />
            <text
                x={pos[0]}
                y={pos[1] + (under ? 52 : -36)}
                textAnchor="middle"
                fontSize={38}
                fontWeight={800}
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

/** Et ressurssymbol: oljefat, gummidråpe eller tre, med navn under. */
function Ressurs({
    pos,
    type,
    forsinkelse = 0,
}: {
    pos: [number, number];
    type: 'olje' | 'gummi' | 'skog';
    forsinkelse?: number;
}) {
    const [x, y] = pos;
    const navn = { olje: 'olje', gummi: 'gummi', skog: 'skog' }[type];
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 200, damping: 14 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <circle cx={x} cy={y} r={44} fill="#ffffff" stroke="#0f172a" strokeWidth={4} />
            {type === 'olje' && (
                <>
                    <rect x={x - 18} y={y - 24} width={36} height={48} rx={6} fill="#1f2937" />
                    <rect x={x - 18} y={y - 9} width={36} height={4} fill="#9ca3af" />
                    <rect x={x - 18} y={y + 7} width={36} height={4} fill="#9ca3af" />
                </>
            )}
            {type === 'gummi' && (
                <path
                    d={`M ${x} ${y - 28} C ${x + 22} ${y - 2} ${x + 20} ${y + 24} ${x} ${y + 24} C ${x - 20} ${y + 24} ${x - 22} ${y - 2} ${x} ${y - 28} Z`}
                    fill="#f5f5f4"
                    stroke="#78716c"
                    strokeWidth={5}
                />
            )}
            {type === 'skog' && (
                <>
                    <path
                        d={`M ${x} ${y - 30} L ${x + 24} ${y + 12} L ${x - 24} ${y + 12} Z`}
                        fill="#15803d"
                    />
                    <rect x={x - 5} y={y + 12} width={10} height={14} fill="#78350f" />
                </>
            )}
            <text
                x={x}
                y={y + 76}
                textAnchor="middle"
                fontSize={32}
                fontWeight={800}
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth={7}
                paintOrder="stroke"
            >
                {navn}
            </text>
        </motion.g>
    );
}

/** Nederland borte i nordvest: en lenke som ryker, og stempelet «Fritt». */
function Frihet({
    fra,
    til,
    stempel,
}: {
    fra: [number, number];
    til: [number, number];
    stempel: [number, number];
}) {
    const [mx, my] = stempel;
    return (
        <g>
            <text
                x={fra[0]}
                y={fra[1] - 40}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill={FARGE.nederland}
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                Nederland
            </text>
            <motion.line
                x1={fra[0]}
                y1={fra[1]}
                x2={til[0]}
                y2={til[1]}
                stroke={FARGE.nederland}
                strokeWidth={8}
                strokeDasharray="6 16"
                strokeLinecap="round"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0.25 }}
                transition={{ delay: 1, duration: 1 }}
            />
            <motion.g
                initial={{ opacity: 0, scale: 2.5, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: -8 }}
                transition={{ delay: 0.9, type: 'spring', stiffness: 220, damping: 15 }}
                style={{ transformOrigin: `${mx}px ${my}px` }}
            >
                <rect
                    x={mx - 150}
                    y={my - 46}
                    width={300}
                    height={92}
                    rx={10}
                    fill="#ffffff"
                    stroke="#15803d"
                    strokeWidth={8}
                />
                <text
                    x={mx}
                    y={my + 4}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={52}
                    fontWeight={900}
                    fill="#15803d"
                >
                    FRITT 1949
                </text>
            </motion.g>
        </g>
    );
}

/** Et skilt som sier nei til begge stormaktene. */
function Nei({ pos }: { pos: [number, number] }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.6, type: 'spring', stiffness: 200, damping: 14 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            <rect x={pos[0] - 150} y={pos[1] + 30} width={300} height={70} rx={35} fill="#15803d" />
            <text
                x={pos[0]}
                y={pos[1] + 67}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={36}
                fontWeight={900}
                fill="#ffffff"
            >
                Ingen side
            </text>
        </motion.g>
    );
}

/** Rødt merke for kommunistpartiet. */
function Merke({ pos, tekst }: { pos: [number, number]; tekst: string }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 220, damping: 13 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            <circle
                cx={pos[0]}
                cy={pos[1]}
                r={62}
                fill="#b91c1c"
                stroke="#ffffff"
                strokeWidth={8}
            />
            <text
                x={pos[0]}
                y={pos[1] + 3}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={46}
                fontWeight={900}
                fill="#ffffff"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

/** Et lasteskip med flagg «Vestlige selskaper» som seiler mot Indonesia og stopper ved sperra. */
function Skip({ pos, beat, rad }: { pos: [number, number]; beat: number; rad: number }) {
    const x = beat >= 1 ? pos[0] + 120 : pos[0] + 180;
    return (
        <motion.g
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: x - pos[0], opacity: 1 }}
            transition={{ delay: rad * 0.3, duration: 1.8, ease: 'easeOut' }}
        >
            <path
                d={`M ${pos[0] - 70} ${pos[1]} L ${pos[0] + 80} ${pos[1]} L ${pos[0] + 55} ${pos[1] + 34} L ${pos[0] - 55} ${pos[1] + 34} Z`}
                fill={FARGE.selskap}
            />
            <rect x={pos[0] - 40} y={pos[1] - 34} width={60} height={34} fill="#e2e8f0" />
            <rect x={pos[0] + 28} y={pos[1] - 26} width={30} height={26} fill="#94a3b8" />
            {rad === 0 && (
                <text
                    x={pos[0]}
                    y={pos[1] - 56}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill={FARGE.selskap}
                    stroke="#ffffff"
                    strokeWidth={7}
                    paintOrder="stroke"
                >
                    Vestlige selskaper
                </text>
            )}
        </motion.g>
    );
}

/** Sperra Sukarno satte opp: en tykk linje med stoppskilt. */
function Sperre({ fra, til }: { fra: [number, number]; til: [number, number] }) {
    const my = (fra[1] + til[1]) / 2;
    return (
        <g>
            <motion.line
                x1={fra[0]}
                y1={fra[1]}
                x2={til[0]}
                y2={til[1]}
                stroke="#15803d"
                strokeWidth={16}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1 }}
            />
            <motion.g
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: 'spring', stiffness: 220, damping: 14 }}
                style={{ transformOrigin: `${fra[0]}px ${my}px` }}
            >
                <circle
                    cx={fra[0]}
                    cy={my}
                    r={70}
                    fill="#15803d"
                    stroke="#ffffff"
                    strokeWidth={8}
                />
                <text
                    x={fra[0]}
                    y={my + 3}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={40}
                    fontWeight={900}
                    fill="#ffffff"
                >
                    STOPP
                </text>
            </motion.g>
        </g>
    );
}

/** Mørke flekker som dukker opp over hele øyriket, i spredt rekkefølge. Ingen mennesker vises. */
function MørkeFlekker({ punkter, beat }: { punkter: [number, number][]; beat: number }) {
    const vis = punkter.length;
    return (
        <g style={{ mixBlendMode: 'multiply' }}>
            {punkter.map((pt, i) => (
                <motion.circle
                    key={i}
                    cx={pt[0]}
                    cy={pt[1]}
                    fill={FARGE.mork}
                    initial={{ r: 0, opacity: 0 }}
                    animate={i < vis ? { r: 70, opacity: 0.55 } : { r: 0, opacity: 0 }}
                    transition={{
                        delay: beat === 0 ? ((i * 7) % punkter.length) * 0.2 : 0,
                        duration: 1.4,
                    }}
                />
            ))}
        </g>
    );
}

/** Gruva i øst: gull og kobber, med Freeports flagg. */
function Gruve({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 13 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            {[0, 1, 2].map((i) => (
                <ellipse
                    key={i}
                    cx={x}
                    cy={y}
                    rx={90 - i * 26}
                    ry={44 - i * 13}
                    fill={['#d6a35c', '#b7793a', '#8a5525'][i]}
                    stroke="#713f12"
                    strokeWidth={3}
                />
            ))}
            <line
                x1={x + 60}
                y1={y - 20}
                x2={x + 60}
                y2={y - 120}
                stroke="#0f172a"
                strokeWidth={6}
            />
            <rect x={x + 60} y={y - 120} width={150} height={50} fill={FARGE.selskap} />
            <text
                x={x + 135}
                y={y - 88}
                textAnchor="middle"
                fontSize={28}
                fontWeight={900}
                fill="#ffffff"
            >
                Freeport
            </text>
            <text
                x={x - 30}
                y={y + 100}
                textAnchor="middle"
                fontSize={36}
                fontWeight={900}
                fill="#713f12"
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                gull og kobber
            </text>
        </motion.g>
    );
}

function Mynter({ pos, forsinkelse }: { pos: [number, number]; forsinkelse: number }) {
    return (
        <g>
            {Array.from({ length: 5 }, (_, i) => (
                <motion.ellipse
                    key={i}
                    cx={pos[0] + (i % 2 === 0 ? 0 : 6)}
                    cy={pos[1] + 20 - i * 14}
                    rx={40}
                    ry={12}
                    fill="#facc15"
                    stroke="#a16207"
                    strokeWidth={4}
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: forsinkelse + i * 0.15,
                        type: 'spring',
                        stiffness: 260,
                        damping: 18,
                    }}
                />
            ))}
        </g>
    );
}

/** Kort med navn og én linje, til venstre i bildet. */
function Kort({ tittel, tekst, hoyre }: { tittel: string; tekst: string; hoyre?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 160, damping: 18 }}
            className={`absolute ${hoyre ? 'right-[4%]' : 'left-[4%]'} bottom-[8%] w-[22rem] p-5 rounded-3xl bg-white/95 shadow-2xl`}
        >
            <div className="font-display font-black text-3xl text-slate-900">{tittel}</div>
            <div className="mt-1 text-xl font-semibold text-slate-600">{tekst}</div>
        </motion.div>
    );
}

/** De som ble rammet: tre grupper, ikke bare politikere. */
function Grupper() {
    const grupper = ['Bønder', 'Lærere', 'Fagforeningsfolk'];
    return (
        <div className="absolute right-[4%] bottom-[8%] flex flex-col gap-3">
            {grupper.map((g, i) => (
                <motion.div
                    key={g}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                        delay: 0.6 + i * 0.6,
                        type: 'spring',
                        stiffness: 170,
                        damping: 18,
                    }}
                    className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl font-display font-black text-3xl text-stone-800 border-l-8 border-stone-600"
                >
                    {g}
                </motion.div>
            ))}
        </div>
    );
}

/** En murvegg der ordet «Jakarta» står malt som en advarsel. */
function Vegg() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 150, damping: 18 }}
            className="absolute rounded-xl shadow-2xl overflow-hidden"
            style={{
                left: '34%',
                top: '22%',
                width: 416,
                height: 240,
                backgroundColor: '#d6d3d1',
                backgroundImage:
                    'linear-gradient(#a8a29e 2px, transparent 2px), linear-gradient(90deg, #a8a29e 2px, transparent 2px)',
                backgroundSize: '64px 32px',
            }}
        >
            <motion.div
                initial={{ clipPath: 'inset(0 100% 0 0)' }}
                animate={{ clipPath: 'inset(0 0% 0 0)' }}
                transition={{ delay: 1, duration: 1.6, ease: 'easeInOut' }}
                className="absolute inset-0 flex items-center justify-center font-display font-black text-7xl text-red-700 -rotate-6"
                style={{ textShadow: '2px 3px 0 rgba(127,29,29,0.4)' }}
            >
                JAKARTA
            </motion.div>
            <div className="absolute bottom-3 left-0 right-0 text-center text-lg font-bold text-stone-700">
                «Det samme kan skje her»
            </div>
        </motion.div>
    );
}
