import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoNaturalEarth1, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';

/**
 * Kart over kuppet i Guatemala, i fire modus:
 * «land»: Guatemala i Mellom-Amerika, USA i nord, bananene som går nordover og selskapet som kommer sørover.
 * «kaldkrig»: USA mot Sovjetunionen, Guatemala malt som kommunistisk, en påstått tråd til Moskva
 * som aldri ble bevist, og den hemmelige operasjonen fra Washington.
 * «che»: Che Guevara reiser fra Argentina til Guatemala, og ringer sprer seg ut i verden.
 * «monster»: samme mønster i Iran, Chile og Guatemala, med stiplede piler fra USA.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'land' | 'kaldkrig' | 'che' | 'monster';

const GUATEMALA = 320;
const USA = 840;
const ARGENTINA = 32;
const IRAN = 364;
const CHILE = 152;
/** Sovjetunionens republikker, tegnet som dagens land. */
const SOVJET = [643, 804, 112, 398, 860, 795, 417, 762, 268, 51, 31, 498, 428, 440, 233];

const STED = {
    guatemala: [-90.3, 15.6] as LngLat,
    washington: [-77, 38.9] as LngLat,
    usa: [-98, 39] as LngLat,
    moskva: [37.6, 55.7] as LngLat,
    argentina: [-64, -34] as LngLat,
    iran: [53.5, 32.5] as LngLat,
    chile: [-71, -30] as LngLat,
};

const FARGE = {
    land: '#efe7d6',
    kant: '#b9ad92',
    hav: '#cfe3f0',
    guatemala: '#15803d',
    usa: '#1e3a8a',
    sovjet: '#b91c1c',
    rodmalt: '#dc2626',
    argentina: '#60a5fa',
    offer: '#16a34a',
    banan: '#ca8a04',
};

function lagProjeksjon(modus: Modus): GeoProjection {
    const [a, b]: [LngLat, LngLat] =
        modus === 'kaldkrig' || modus === 'monster'
            ? [
                  [-128, -45],
                  [140, 66],
              ]
            : modus === 'che'
              ? [
                    [-118, -56],
                    [-40, 34],
                ]
              : [
                    [-122, 2],
                    [-62, 48],
                ];
    return geoNaturalEarth1().fitExtent(
        [
            [70, 150],
            [B - 70, H - 40],
        ],
        { type: 'MultiPoint', coordinates: [a, b] } as never
    );
}

function fargeFor(modus: Modus, beat: number, id: number): string {
    if (modus === 'land') {
        if (id === GUATEMALA) return FARGE.guatemala;
        if (beat >= 1 && id === USA) return FARGE.usa;
        return FARGE.land;
    }
    if (modus === 'kaldkrig') {
        if (id === USA) return FARGE.usa;
        if (SOVJET.includes(id)) return FARGE.sovjet;
        if (id === GUATEMALA) return beat >= 1 ? FARGE.rodmalt : FARGE.guatemala;
        return FARGE.land;
    }
    if (modus === 'che') {
        if (id === GUATEMALA) return FARGE.guatemala;
        if (id === ARGENTINA) return FARGE.argentina;
        return FARGE.land;
    }
    if (id === USA && beat >= 1) return FARGE.usa;
    if (id === IRAN || id === CHILE) return FARGE.offer;
    if (id === GUATEMALA) return beat >= 2 ? '#ca8a04' : FARGE.offer;
    return FARGE.land;
}

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    land: [
        { tekst: 'Guatemala: et lite land i Mellom-Amerika' },
        { tekst: 'USA: den store naboen i nord' },
        { tekst: 'Bananrepublikk: lever av én vare' },
        { tekst: 'Styrt av et utenlandsk selskap', rod: true },
    ],
    kaldkrig: [
        { tekst: 'Den kalde krigen' },
        { tekst: 'Árbenz malt som kommunist', rod: true },
        { tekst: 'Bånd til Sovjet? Aldri bevist' },
        { tekst: 'August 1953: en hemmelig operasjon', rod: true },
    ],
    che: [
        { tekst: 'Desember 1953: Che Guevara kommer' },
        { tekst: 'Ni måneder i Guatemala' },
        { tekst: 'Ett kupp, spor i hele verden' },
    ],
    monster: [
        { tekst: 'Iran. Chile. Guatemala.' },
        { tekst: 'Folkevalgte ledere, fjernet', rod: true },
        { tekst: 'Guatemala: et selskap styrte' },
        { tekst: '1999: «Det var feil»' },
    ],
};

export function GuatemalaKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'land';
    const { geographies } = useAtlasWorld();
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const brikke = BRIKKER[modus][Math.min(beat, BRIKKER[modus].length - 1)];

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

                {modus === 'land' && (
                    <>
                        <Etikett pos={p([-97, 11])} tekst="Guatemala" farge="#14532d" stor />
                        {beat === 0 && <Puls pos={p(STED.guatemala)} farge={FARGE.guatemala} />}
                        {beat >= 1 && (
                            <Etikett pos={p([-100, 40])} tekst="USA" farge={FARGE.usa} stor />
                        )}
                        {beat >= 2 && (
                            <>
                                <Banan pos={p([-86, 16])} />
                                <Pil
                                    fra={p([-89, 18])}
                                    til={p([-82, 36])}
                                    farge={FARGE.banan}
                                    bue={-0.15}
                                    forsinkelse={0.5}
                                />
                            </>
                        )}
                        {beat >= 3 && (
                            <>
                                <Pil
                                    fra={p([-98, 33])}
                                    til={p([-92, 17.5])}
                                    farge={FARGE.usa}
                                    bue={-0.2}
                                    stiplet
                                />
                                <Skilt pos={p([-108, 26])} tekst="United Fruit" />
                            </>
                        )}
                    </>
                )}

                {modus === 'kaldkrig' && (
                    <>
                        <Etikett pos={p([-100, 40])} tekst="USA" farge={FARGE.usa} stor />
                        <Etikett pos={p([90, 50])} tekst="Sovjetunionen" farge="#7f1d1d" stor />
                        {beat >= 1 && (
                            <Etikett
                                pos={p(STED.guatemala)}
                                tekst="«Kommunist!»"
                                farge="#b91c1c"
                                dy={50}
                            />
                        )}
                        {beat === 1 && <Puls pos={p(STED.guatemala)} farge={FARGE.rodmalt} />}
                        {beat === 2 && (
                            <>
                                <Pil
                                    fra={p(STED.guatemala)}
                                    til={p(STED.moskva)}
                                    farge="#7f1d1d"
                                    bue={-0.12}
                                    stiplet
                                    utenHode
                                />
                                <Bevis pos={p([-25, 52])} />
                            </>
                        )}
                        {beat >= 3 && (
                            <>
                                <Pil
                                    fra={p(STED.washington)}
                                    til={p(STED.guatemala)}
                                    farge={FARGE.usa}
                                    bue={0.25}
                                    stiplet
                                />
                                <Skilt pos={p([-35, 26])} tekst="2,7 millioner dollar" />
                            </>
                        )}
                    </>
                )}

                {modus === 'che' && (
                    <>
                        <Etikett pos={p([-98, 12])} tekst="Guatemala" farge="#14532d" stor />
                        <Etikett pos={p([-80, -38])} tekst="Argentina" farge="#1e40af" />
                        <Pil
                            fra={p(STED.argentina)}
                            til={p(STED.guatemala)}
                            farge="#1e40af"
                            bue={0.2}
                        />
                        {beat >= 1 && <Kalender pos={p([-28, 2])} />}
                        {beat >= 2 && (
                            <>
                                <Puls pos={p(STED.guatemala)} farge={FARGE.guatemala} />
                                <Puls
                                    pos={p(STED.guatemala)}
                                    farge={FARGE.guatemala}
                                    forsinkelse={1.1}
                                />
                            </>
                        )}
                    </>
                )}

                {modus === 'monster' && (
                    <>
                        <Etikett pos={p([54, 25])} tekst="Iran" farge="#14532d" dy={40} />
                        <Etikett pos={p([-90, -33])} tekst="Chile" farge="#14532d" />
                        <Etikett
                            pos={p([-98, 9])}
                            tekst="Guatemala"
                            farge={beat >= 2 ? '#854d0e' : '#14532d'}
                        />
                        {beat === 0 && (
                            <>
                                <Puls pos={p(STED.iran)} farge={FARGE.offer} />
                                <Puls pos={p(STED.chile)} farge={FARGE.offer} />
                                <Puls pos={p(STED.guatemala)} farge={FARGE.offer} />
                            </>
                        )}
                        {beat >= 1 && (
                            <>
                                <Etikett pos={p([-100, 40])} tekst="USA" farge={FARGE.usa} />
                                {[STED.iran, STED.chile, STED.guatemala].map((s, i) => (
                                    <Pil
                                        key={i}
                                        fra={p(STED.washington)}
                                        til={p(s)}
                                        farge={FARGE.usa}
                                        bue={[-0.12, 0.15, 0.25][i]}
                                        forsinkelse={i * 0.4}
                                        stiplet
                                    />
                                ))}
                            </>
                        )}
                        {beat >= 2 && <Banan pos={p([-70, 14])} />}
                        {beat >= 3 && <Skilt pos={p([-100, 54])} tekst="Bill Clinton" />}
                    </>
                )}
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
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
            fontSize={stor ? 56 : 44}
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
    utenHode,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    forsinkelse?: number;
    bue?: number;
    stiplet?: boolean;
    utenHode?: boolean;
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
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={stiplet ? '4 18' : undefined}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, delay: forsinkelse, ease: 'easeInOut' }}
            />
            {!utenHode && (
                <motion.path
                    d="M -22 -14 L 6 0 L -22 14 Z"
                    fill={farge}
                    transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: forsinkelse + 1.5 }}
                />
            )}
        </g>
    );
}

/** En gul bananklase. */
function Banan({ pos }: { pos: [number, number] }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 12 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            {[-16, 0, 16].map((dx, i) => (
                <path
                    key={i}
                    d={`M ${pos[0] + dx - 10} ${pos[1] - 34} Q ${pos[0] + dx + 26} ${pos[1] - 4} ${pos[0] + dx - 6} ${pos[1] + 34}`}
                    fill="none"
                    stroke="#facc15"
                    strokeWidth={16}
                    strokeLinecap="round"
                />
            ))}
            <circle cx={pos[0] - 4} cy={pos[1] - 36} r={7} fill="#3f6212" />
        </motion.g>
    );
}

/** Et skilt med tekst på blå bunn. */
function Skilt({ pos, tekst }: { pos: [number, number]; tekst: string }) {
    const b = tekst.length * 24 + 50;
    return (
        <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, type: 'spring', stiffness: 160, damping: 16 }}
        >
            <rect
                x={pos[0] - b / 2}
                y={pos[1] - 36}
                width={b}
                height={72}
                rx={14}
                fill={FARGE.usa}
                stroke="#ffffff"
                strokeWidth={5}
            />
            <text
                x={pos[0]}
                y={pos[1] + 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={40}
                fontWeight={900}
                fill="#ffffff"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

/** Et stempel som sier at påstanden aldri ble bevist. */
function Bevis({ pos }: { pos: [number, number] }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 1.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.6, type: 'spring', stiffness: 220, damping: 14 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            <g transform={`rotate(-8 ${pos[0]} ${pos[1]})`}>
                <rect
                    x={pos[0] - 230}
                    y={pos[1] - 48}
                    width={460}
                    height={96}
                    rx={10}
                    fill="#ffffff"
                    stroke="#b91c1c"
                    strokeWidth={8}
                />
                <text
                    x={pos[0]}
                    y={pos[1] + 3}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={50}
                    fontWeight={900}
                    fill="#b91c1c"
                    letterSpacing={3}
                >
                    ALDRI BEVIST
                </text>
            </g>
        </motion.g>
    );
}

/** Kalender med ni måneder som krysses av. */
function Kalender({ pos }: { pos: [number, number] }) {
    return (
        <g>
            <motion.rect
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                x={pos[0] - 190}
                y={pos[1] - 120}
                width={380}
                height={260}
                rx={20}
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth={4}
            />
            <text
                x={pos[0]}
                y={pos[1] - 80}
                textAnchor="middle"
                fontSize={38}
                fontWeight={900}
                fill="#0f172a"
            >
                Ni måneder
            </text>
            {Array.from({ length: 9 }, (_, i) => {
                const x = pos[0] - 120 + (i % 3) * 120;
                const y = pos[1] - 20 + Math.floor(i / 3) * 56;
                return (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + i * 0.25 }}
                        style={{ transformOrigin: `${x}px ${y}px` }}
                    >
                        <rect x={x - 46} y={y - 22} width={92} height={44} rx={8} fill="#dcfce7" />
                        <path
                            d={`M ${x - 16} ${y} L ${x - 4} ${y + 12} L ${x + 18} ${y - 12}`}
                            fill="none"
                            stroke="#15803d"
                            strokeWidth={7}
                            strokeLinecap="round"
                        />
                    </motion.g>
                );
            })}
        </g>
    );
}

/** Pulserende ring rundt et område. */
function Puls({
    pos,
    farge,
    forsinkelse = 0,
}: {
    pos: [number, number];
    farge: string;
    forsinkelse?: number;
}) {
    return (
        <motion.circle
            cx={pos[0]}
            cy={pos[1]}
            fill="none"
            stroke={farge}
            strokeWidth={8}
            initial={{ r: 30, opacity: 0.9 }}
            animate={{ r: 260, opacity: 0 }}
            transition={{ duration: 2.2, delay: forsinkelse, repeat: Infinity, ease: 'easeOut' }}
        />
    );
}
