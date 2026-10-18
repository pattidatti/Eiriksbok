import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';

/**
 * Kart over Romerrikets verden: krigen i Gallia, borgerkrigen fra Italia til Hellas,
 * Egypt og Spania, og til slutt hvordan navnet Cæsar ble Kaiser og tsar.
 * Kartet står til venstre, forklaringene til høyre.
 */

type Modus = 'gallia' | 'virkelighet' | 'borgerkrig' | 'navnet';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const LILLA = '#7e22ce';
const ROD = '#b91c1c';
const GULL = '#ca8a04';

const ROMA: LngLat = [12.5, 41.9];
const RUBICON: LngLat = [12.4, 44.1];
const GALLIA_MIDT: LngLat = [2.5, 47];
const HELLAS: LngLat = [22.4, 39.6];
const EGYPT: LngLat = [29.9, 31.2];
const SPANIA: LngLat = [-4, 40];
const TYSKLAND: LngLat = [10.5, 51.2];
const RUSSLAND: LngLat = [37.6, 55.75];

const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    gallia: [
        [-6, 36.5],
        [20, 52],
    ],
    virkelighet: [
        [-5.5, 42],
        [9, 51.5],
    ],
    borgerkrig: [
        [-10, 29],
        [33, 49],
    ],
    navnet: [
        [-6, 36],
        [45, 62],
    ],
};

/** Landsbyer i Gallia som brennes i «virkelighet». Bare symbolske plasseringer. */
const LANDSBYER: LngLat[] = [
    [-1.6, 47.2],
    [0.7, 47.4],
    [2.3, 48.8],
    [4.8, 45.8],
    [3.1, 45.8],
    [-0.6, 44.8],
    [1.4, 43.6],
    [5.0, 47.3],
    [3.9, 49.3],
    [-3.0, 48.2],
    [4.4, 50.6],
    [2.9, 50.3],
    [6.2, 48.7],
    [0.1, 49.4],
    [-1.1, 46.2],
    [2.4, 46.9],
];

interface Kort {
    tekst: string;
    farge?: string;
}

const KORT: Record<Modus, Kort[][]> = {
    gallia: [
        [{ tekst: 'Planen' }, { tekst: 'Bli guvernør utenfor Italia', farge: LILLA }],
        [
            { tekst: '58-50 fvt.' },
            { tekst: 'Krig i Gallia: dagens Frankrike og Belgia', farge: ROD },
        ],
        [{ tekst: 'Krig = rikdom' }, { tekst: 'Den raskeste veien til penger', farge: GULL }],
        [{ tekst: 'Til Roma' }, { tekst: 'Gull og slaver', farge: GULL }],
    ],
    virkelighet: [
        [{ tekst: '«De bello Gallico»' }, { tekst: 'Cæsars egen bok om krigen', farge: LILLA }],
        [{ tekst: 'I boka' }, { tekst: 'Alltid smartest, alltid modigst', farge: LILLA }],
        [{ tekst: 'Virkeligheten' }, { tekst: 'Brente landsbyer, utsultede byer', farge: ROD }],
        [
            { tekst: 'Til slutt' },
            { tekst: 'Svært mange gallere drept eller gjort til slaver', farge: ROD },
        ],
    ],
    borgerkrig: [
        [{ tekst: '49-45 fvt.' }, { tekst: 'Borgerkrig i fire år', farge: ROD }],
        [{ tekst: 'Jakten' }, { tekst: 'Italia, Hellas, Egypt, Spania', farge: LILLA }],
        [{ tekst: 'Alle slagene' }, { tekst: 'Cæsar vinner', farge: LILLA }],
        [{ tekst: '45 fvt.' }, { tekst: 'Alene på toppen', farge: GULL }],
    ],
    navnet: [
        [{ tekst: 'Levde i 56 år' }, { tekst: 'Navnet: over 2000 år', farge: GULL }],
        [{ tekst: 'Caesar' }, { tekst: 'uttalt «kaisar»', farge: LILLA }],
        [{ tekst: 'Keiseren' }, { tekst: 'Tyskland: Kaiser. Russland: tsar.', farge: ROD }],
        [{ tekst: 'Caesar' }, { tekst: 'ble en tittel', farge: GULL }],
    ],
};

export function CaesarKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'gallia';
    const { geographies } = useAtlasWorld();

    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 40],
                    [1000, 860],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT[modus] } as never
            ),
        [modus]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const land = (id: string) =>
        geographies.find((g) => String((g as { id?: unknown }).id) === id) as never;

    const gallia =
        (modus === 'gallia' && beat >= 1) || modus === 'virkelighet' ? ['250', '056'] : [];
    const kort = KORT[modus][Math.min(beat, KORT[modus].length - 1)] ?? [];

    // Borgerkrigen: jakten fra Italia til Hellas, Egypt og Spania.
    const jakt: LngLat[] = [ROMA, HELLAS, EGYPT, SPANIA];

    return (
        <div className="absolute inset-0 bg-[#cfe3ef] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land geographies={geographies} sti={sti} />
                {/* Italia lyser i lilla: Romas hjem */}
                {geographies.length > 0 && (
                    <motion.path
                        d={sti(land('380')) ?? ''}
                        initial={false}
                        animate={{ fill: modus === 'navnet' ? '#f5efe0' : '#e9d5ff' }}
                        stroke="#a78bfa"
                        strokeWidth={2}
                    />
                )}
                {gallia.map((id) => (
                    <motion.path
                        key={id}
                        d={sti(land(id)) ?? ''}
                        initial={{ fill: '#f5efe0' }}
                        animate={{
                            fill: modus === 'virkelighet' && beat >= 3 ? '#d6d3d1' : '#fecaca',
                        }}
                        transition={{ duration: 1.2 }}
                        stroke={ROD}
                        strokeWidth={2.5}
                    />
                ))}
                {modus === 'navnet' &&
                    beat >= 2 &&
                    ['276', '643'].map((id) => (
                        <motion.path
                            key={id}
                            d={sti(land(id)) ?? ''}
                            initial={{ fill: '#f5efe0' }}
                            animate={{ fill: '#fde68a' }}
                            transition={{ duration: 1.2 }}
                            stroke={GULL}
                            strokeWidth={2}
                        />
                    ))}

                {modus === 'gallia' && beat >= 1 && <Navn ll={GALLIA_MIDT} tekst="GALLIA" p={p} />}
                {modus === 'virkelighet' && <Navn ll={[2, 46.5]} tekst="GALLIA" p={p} />}

                {/* Hæren marsjerer nord til Gallia */}
                {modus === 'gallia' && beat >= 1 && (
                    <Reise fra={p([11.5, 44.6])} til={p(GALLIA_MIDT)} farge={ROD} />
                )}
                {/* Gull og slaver strømmer til Roma */}
                {modus === 'gallia' && beat >= 3 && <Strom fra={p(GALLIA_MIDT)} til={p(ROMA)} />}

                {/* Landsbyene: lyse i boka, brenner i virkeligheten */}
                {modus === 'virkelighet' &&
                    LANDSBYER.map((ll, i) => {
                        const [x, y] = p(ll);
                        const brenner = beat >= 2;
                        return (
                            <g key={i} transform={`translate(${x} ${y})`}>
                                <rect x={-12} y={-10} width={24} height={18} fill="#78716c" />
                                <path d="M -16 -10 L 0 -24 L 16 -10 Z" fill="#a16207" />
                                <motion.path
                                    d="M -12 -18 Q -6 -48 0 -34 Q 6 -56 12 -18 Z"
                                    fill="#f97316"
                                    initial={false}
                                    animate={{
                                        opacity: brenner && beat < 3 ? 1 : 0,
                                        scaleY: brenner ? [1, 1.2, 1] : 1,
                                    }}
                                    transition={{
                                        opacity: { delay: (i % 8) * 0.25, duration: 0.5 },
                                        scaleY: { repeat: Infinity, duration: 0.8 },
                                    }}
                                    style={{ transformOrigin: '0px -18px' }}
                                />
                            </g>
                        );
                    })}
                {/* Boka i hjørnet av kartet */}
                {modus === 'virkelighet' && beat <= 1 && <Bok x={250} y={760} />}

                {/* Rubicon og jakten */}
                {modus === 'borgerkrig' && (
                    <>
                        <Merke pos={p(RUBICON)} tekst="Rubicon" farge={ROD} over />
                        {beat >= 1 &&
                            jakt
                                .slice(1)
                                .map((ll, i) => (
                                    <Reise
                                        key={i}
                                        fra={p(jakt[i])}
                                        til={p(ll)}
                                        farge={LILLA}
                                        forsinkelse={i * 1.6}
                                    />
                                ))}
                        {beat >= 1 &&
                            [
                                { ll: HELLAS, t: 'Hellas' },
                                { ll: EGYPT, t: 'Egypt' },
                                { ll: SPANIA, t: 'Spania' },
                            ].map((m, i) => (
                                <Merke
                                    key={m.t}
                                    pos={p(m.ll)}
                                    tekst={m.t}
                                    farge={LILLA}
                                    seier={beat >= 2}
                                    forsinkelse={beat === 1 ? 1.6 + i * 1.6 : i * 0.4}
                                />
                            ))}
                    </>
                )}

                {/* Navnet sprer seg fra Roma */}
                {modus === 'navnet' && beat >= 2 && (
                    <>
                        <Reise fra={p(ROMA)} til={p(TYSKLAND)} farge={GULL} />
                        <Reise fra={p(ROMA)} til={p(RUSSLAND)} farge={GULL} forsinkelse={0.8} />
                        <Merke
                            pos={p(TYSKLAND)}
                            tekst="Kaiser"
                            farge={ROD}
                            stor
                            forsinkelse={1.6}
                        />
                        <Merke pos={p(RUSSLAND)} tekst="Tsar" farge={ROD} stor forsinkelse={2.4} />
                    </>
                )}

                {modus !== 'virkelighet' && (
                    <Merke
                        pos={p(ROMA)}
                        tekst={modus === 'navnet' && beat >= 1 ? 'Roma: «Kaisar»' : 'Roma'}
                        farge="#0f172a"
                        under
                        glod={modus === 'borgerkrig' && beat >= 3}
                    />
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
                            transition={{
                                delay: i * 0.5,
                                type: 'spring',
                                stiffness: 160,
                                damping: 20,
                            }}
                            className={
                                i === 0 && !k.farge
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
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill="#f5efe0"
                    stroke="#b9ad92"
                    strokeWidth={1.5}
                />
            ))}
        </>
    );
});

function Navn({
    ll,
    tekst,
    p,
}: {
    ll: LngLat;
    tekst: string;
    p: (ll: LngLat) => [number, number];
}) {
    const [x, y] = p(ll);
    return (
        <motion.text
            x={x}
            y={y}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ duration: 1 }}
            textAnchor="middle"
            fontSize={44}
            fontWeight={900}
            letterSpacing={8}
            fill="#7f1d1d"
        >
            {tekst}
        </motion.text>
    );
}

function Merke({
    pos,
    tekst,
    farge,
    under,
    over,
    stor,
    seier,
    glod,
    forsinkelse = 0,
}: {
    pos: [number, number];
    tekst: string;
    farge: string;
    under?: boolean;
    over?: boolean;
    stor?: boolean;
    seier?: boolean;
    glod?: boolean;
    forsinkelse?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 200, damping: 14 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            <g transform={`translate(${pos[0]} ${pos[1]})`}>
                {glod && (
                    <motion.circle
                        r={40}
                        fill={GULL}
                        animate={{ opacity: [0.2, 0.55, 0.2], scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}
                {seier ? (
                    <>
                        <circle r={24} fill={farge} stroke="#ffffff" strokeWidth={4} />
                        <path
                            d="M -11 0 L -3 9 L 12 -9"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth={5}
                            strokeLinecap="round"
                        />
                    </>
                ) : (
                    <circle r={stor ? 16 : 12} fill={farge} stroke="#ffffff" strokeWidth={3} />
                )}
                <text
                    y={under ? 58 : over ? -34 : -36}
                    textAnchor="middle"
                    fontSize={stor ? 46 : 32}
                    fontWeight={900}
                    fill={farge}
                    stroke="#ffffff"
                    strokeWidth={8}
                    paintOrder="stroke"
                >
                    {tekst}
                </text>
            </g>
        </motion.g>
    );
}

/** En prikket bane som tegnes fram, med en prikk som følger med. */
function Reise({
    fra,
    til,
    farge,
    forsinkelse = 0,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    forsinkelse?: number;
}) {
    const midt: [number, number] = [(fra[0] + til[0]) / 2, (fra[1] + til[1]) / 2 - 60];
    const d = `M ${fra.join(' ')} Q ${midt.join(' ')} ${til.join(' ')}`;
    return (
        <g>
            <motion.path
                d={d}
                fill="none"
                stroke={farge}
                strokeWidth={7}
                strokeDasharray="14 10"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: forsinkelse, duration: 1.6, ease: 'easeInOut' }}
            />
            <motion.circle
                r={13}
                fill={farge}
                stroke="#ffffff"
                strokeWidth={4}
                initial={{ cx: fra[0], cy: fra[1], opacity: 0 }}
                animate={{ cx: til[0], cy: til[1], opacity: 1 }}
                transition={{ delay: forsinkelse, duration: 1.6, ease: 'easeInOut' }}
            />
        </g>
    );
}

/** Gull og slaver som strømmer i en jevn rekke fra Gallia til Roma. */
function Strom({ fra, til }: { fra: [number, number]; til: [number, number] }) {
    return (
        <g>
            {Array.from({ length: 8 }, (_, i) => (
                <motion.g
                    key={i}
                    initial={{ x: fra[0], y: fra[1], opacity: 0 }}
                    animate={{ x: [fra[0], til[0]], y: [fra[1], til[1]], opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 3, delay: i * 0.4, repeat: Infinity, ease: 'linear' }}
                >
                    {i % 2 ? (
                        <circle r={12} fill="#eab308" stroke="#713f12" strokeWidth={3} />
                    ) : (
                        <g>
                            <circle cy={-14} r={7} fill="#57534e" />
                            <rect x={-7} y={-6} width={14} height={20} rx={5} fill="#57534e" />
                        </g>
                    )}
                </motion.g>
            ))}
        </g>
    );
}

function Bok({ x, y }: { x: number; y: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <g transform={`translate(${x} ${y}) rotate(-6)`}>
                <rect
                    x={-150}
                    y={-90}
                    width={300}
                    height={180}
                    rx={12}
                    fill={LILLA}
                    stroke="#ffffff"
                    strokeWidth={6}
                />
                <line x1={0} y1={-84} x2={0} y2={84} stroke="#ffffff" strokeWidth={5} />
                <text x={-75} y={12} textAnchor="middle" fontSize={27} fontWeight={900} fill="#fff">
                    DE BELLO
                </text>
                <text x={75} y={12} textAnchor="middle" fontSize={27} fontWeight={900} fill="#fff">
                    GALLICO
                </text>
            </g>
        </motion.g>
    );
}
