import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoNaturalEarth1, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';

/**
 * Kart over kuppet i Chile, i tre modus:
 * «land»: Chile, det lange smale landet, USA langt mot nord og kobberpengene som går dit.
 * «frykt»: Nixon i USA, Cuba, og Latin-Amerika som tennes land for land: frykten for at flere
 * skulle følge etter.
 * «monster»: samme oppskrift i Chile, Iran og Kongo, med piler fra USA i det skjulte.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'land' | 'frykt' | 'monster';

const CHILE = 152;
const USA = 840;
const CUBA = 192;
const IRAN = 364;
const KONGO = 180;
/** Latin-Amerika, ordnet fra sør til nord så landene tennes som en bølge oppover. */
const LATIN = [
    32, 858, 600, 68, 76, 604, 218, 170, 862, 328, 740, 591, 188, 558, 340, 222, 320, 84, 484,
];

const STED = {
    chile: [-71, -30] as LngLat,
    usa: [-98, 39] as LngLat,
    washington: [-77, 38.9] as LngLat,
    cuba: [-79, 21.8] as LngLat,
    iran: [53.5, 32.5] as LngLat,
    kongo: [23.5, -2.5] as LngLat,
    gruver: [-69.5, -23] as LngLat,
};

const FARGE = {
    land: '#efe7d6',
    kant: '#b9ad92',
    hav: '#cfe3f0',
    chile: '#d52b1e',
    usa: '#1e3a8a',
    usaSint: '#b91c1c',
    cuba: '#f59e0b',
    latin: '#fdba74',
    offer: '#16a34a',
    kobber: '#ea7a2b',
};

function lagProjeksjon(modus: Modus): GeoProjection {
    const [a, b]: [LngLat, LngLat] =
        modus === 'monster'
            ? [
                  [-125, -50],
                  [62, 55],
              ]
            : [
                  [-122, -54],
                  [-38, 46],
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
        if (id === CHILE) return FARGE.chile;
        if (beat >= 1 && id === USA) return FARGE.usa;
        return FARGE.land;
    }
    if (modus === 'frykt') {
        if (id === USA) return beat === 0 ? FARGE.usaSint : FARGE.usa;
        if (id === CHILE) return FARGE.chile;
        if (beat >= 1 && id === CUBA) return FARGE.cuba;
        if (beat >= 2 && LATIN.includes(id)) return FARGE.latin;
        return FARGE.land;
    }
    if (id === CHILE) return FARGE.offer;
    if (beat >= 1 && id === USA) return FARGE.usa;
    if (beat >= 2 && id === IRAN) return FARGE.offer;
    if (beat >= 3 && id === KONGO) return FARGE.offer;
    return FARGE.land;
}

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    land: [
        { tekst: 'Chile: langt og smalt' },
        { tekst: 'USA: den store naboen i nord' },
        { tekst: 'Kobberpengene går nordover', rod: true },
    ],
    frykt: [
        { tekst: 'President Nixon er rasende', rod: true },
        { tekst: '«Et nytt Cuba?»' },
        { tekst: 'Frykten: at flere følger etter' },
        { tekst: 'Latin-Amerika kan få samme idé' },
    ],
    monster: [
        { tekst: 'En folkevalgt leder' },
        { tekst: 'En stormakt, i det skjulte', rod: true },
        { tekst: 'Iran: Operasjon Ajax' },
        { tekst: 'Kongo. Og flere til.' },
    ],
};

export function ChileKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
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
                    bolge={modus === 'frykt' && beat >= 2}
                />

                {modus === 'land' && (
                    <>
                        <Etikett pos={p([-86, -33])} tekst="Chile" farge="#991b1b" stor />
                        {beat === 0 && <Lengde fra={p([-69, -18])} til={p([-71, -54])} />}
                        {beat >= 1 && (
                            <Etikett pos={p([-100, 36])} tekst="USA" farge={FARGE.usa} stor />
                        )}
                        {beat >= 1 && (
                            <Etikett pos={p([-60, -10])} tekst="Sør-Amerika" farge="#57534e" />
                        )}
                        {beat >= 2 && (
                            <>
                                <Kasse pos={p(STED.gruver)} />
                                <Pil
                                    fra={p(STED.gruver)}
                                    til={p(STED.washington)}
                                    farge={FARGE.kobber}
                                    bue={0.12}
                                    forsinkelse={0.6}
                                />
                                <Mynter pos={p([-88, 44])} forsinkelse={2.2} />
                            </>
                        )}
                    </>
                )}

                {modus === 'frykt' && (
                    <>
                        <Etikett pos={p([-100, 36])} tekst="USA" farge={FARGE.usa} stor />
                        <Etikett pos={p([-86, -33])} tekst="Chile" farge="#991b1b" />
                        {beat === 0 && <Puls pos={p(STED.usa)} farge={FARGE.usaSint} />}
                        {beat >= 1 && (
                            <Etikett pos={p([-80, 25])} tekst="Cuba" farge="#92400e" dy={-30} />
                        )}
                        {beat === 1 && (
                            <Pil
                                fra={p(STED.chile)}
                                til={p(STED.cuba)}
                                farge="#92400e"
                                bue={-0.15}
                            />
                        )}
                        {beat >= 3 && (
                            <Etikett
                                pos={p([-58, -5])}
                                tekst="Latin-Amerika"
                                farge="#9a3412"
                                stor
                            />
                        )}
                        {beat >= 3 && <Puls pos={p([-60, -12])} farge="#f97316" />}
                    </>
                )}

                {modus === 'monster' && (
                    <>
                        <Etikett pos={p([-92, -33])} tekst="Chile" farge="#14532d" />
                        {beat === 0 && <Puls pos={p(STED.chile)} farge={FARGE.offer} />}
                        {beat >= 1 && (
                            <Etikett pos={p([-100, 36])} tekst="USA" farge={FARGE.usa} stor />
                        )}
                        {beat >= 1 && (
                            <Pil
                                fra={p(STED.washington)}
                                til={p(STED.chile)}
                                farge={FARGE.usa}
                                bue={0.15}
                                stiplet
                            />
                        )}
                        {beat >= 2 && (
                            <Pil
                                fra={p(STED.washington)}
                                til={p(STED.iran)}
                                farge={FARGE.usa}
                                bue={-0.12}
                                stiplet
                            />
                        )}
                        {beat >= 2 && (
                            <Etikett pos={p([54, 25])} tekst="Iran" farge="#14532d" dy={40} />
                        )}
                        {beat >= 3 && (
                            <Pil
                                fra={p(STED.washington)}
                                til={p(STED.kongo)}
                                farge={FARGE.usa}
                                bue={0.12}
                                stiplet
                            />
                        )}
                        {beat >= 3 && (
                            <Etikett pos={p([22, -12])} tekst="Kongo" farge="#14532d" dy={30} />
                        )}
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
        bolge,
    }: {
        geographies: { id?: string | number }[];
        sti: GeoPath;
        farge: (id: number) => string;
        nokkel: string;
        bolge: boolean;
    }) {
        return (
            <>
                {geographies.map((g, i) => {
                    const id = Number(g.id);
                    const rekke = LATIN.indexOf(id);
                    const forsinkelse = bolge && rekke >= 0 ? rekke * 0.12 : 0;
                    return (
                        <path
                            key={i}
                            d={sti(g as never) ?? ''}
                            fill={farge(id)}
                            stroke={FARGE.kant}
                            strokeWidth={0.8}
                            vectorEffect="non-scaling-stroke"
                            style={{ transition: `fill 1.1s ease ${forsinkelse}s` }}
                        />
                    );
                })}
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
    forsinkelse = 0,
}: {
    pos: [number, number];
    tekst: string;
    farge?: string;
    stor?: boolean;
    dy?: number;
    forsinkelse?: number;
}) {
    return (
        <motion.text
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: forsinkelse }}
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
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    forsinkelse?: number;
    bue?: number;
    stiplet?: boolean;
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
            <motion.path
                d="M -22 -14 L 6 0 L -22 14 Z"
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.5 }}
            />
        </g>
    );
}

/** Klamme langs Chile som viser hvor langt landet er. */
function Lengde({ fra, til }: { fra: [number, number]; til: [number, number] }) {
    const x = Math.max(fra[0], til[0]) + 60;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
        >
            <motion.path
                d={`M ${x - 20} ${fra[1]} L ${x} ${fra[1]} L ${x} ${til[1]} L ${x - 20} ${til[1]}`}
                fill="none"
                stroke="#991b1b"
                strokeWidth={6}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.8, duration: 1.4 }}
            />
            <text
                x={x + 24}
                y={(fra[1] + til[1]) / 2}
                fontSize={36}
                fontWeight={800}
                fill="#991b1b"
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
                dominantBaseline="middle"
            >
                langt
            </text>
        </motion.g>
    );
}

/** En kobberkasse ved gruvene i nord. */
function Kasse({ pos }: { pos: [number, number] }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 180, damping: 12 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            <rect
                x={pos[0] - 34}
                y={pos[1] - 34}
                width={68}
                height={68}
                rx={8}
                fill={FARGE.kobber}
                stroke="#7c2d12"
                strokeWidth={6}
            />
            <text
                x={pos[0]}
                y={pos[1] + 4}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={30}
                fontWeight={900}
                fill="#ffffff"
            >
                Cu
            </text>
        </motion.g>
    );
}

/** En haug med gullmynter som lander i USA. */
function Mynter({ pos, forsinkelse }: { pos: [number, number]; forsinkelse: number }) {
    return (
        <g>
            {Array.from({ length: 6 }, (_, i) => (
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

/** Pulserende ring rundt et område. */
function Puls({ pos, farge }: { pos: [number, number]; farge: string }) {
    return (
        <motion.circle
            cx={pos[0]}
            cy={pos[1]}
            fill="none"
            stroke={farge}
            strokeWidth={8}
            initial={{ r: 40, opacity: 0.9 }}
            animate={{ r: 220, opacity: 0 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        />
    );
}
