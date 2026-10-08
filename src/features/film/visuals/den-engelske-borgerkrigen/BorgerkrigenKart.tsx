import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Kart over De britiske øyer: skipsskatten som sprer seg fra kysten til hele landet,
 * opprøret i Skottland, slagene i borgerkrigen og Cromwells krig i Irland.
 * Kartet står til venstre, forklaringene til høyre.
 */

type Modus = 'skipsskatt' | 'skottland' | 'krig' | 'seire' | 'irland';
type LngLat = [number, number];
type Type = 'by' | 'kongen-vinner' | 'parlamentet-vinner' | 'flagg' | 'massakre';

interface Markor {
    ll: LngLat;
    tekst: string;
    type: Type;
    fraBeat: number;
    under?: boolean;
    /** Navnet til venstre for merket, når to merker står tett. */
    venstre?: boolean;
}

const B = 1600;
const H = 900;
const KONGE = '#7e22ce';
const PARLAMENT = '#0f766e';
const ROD = '#b91c1c';

const LONDON: LngLat = [-0.13, 51.51];
const EDINBURGH: LngLat = [-3.19, 55.95];

const MARKORER: Record<Modus, Markor[]> = {
    skipsskatt: [{ ll: LONDON, tekst: 'London', type: 'by', fraBeat: 0 }],
    skottland: [
        { ll: LONDON, tekst: 'London', type: 'by', fraBeat: 0 },
        { ll: EDINBURGH, tekst: 'Edinburgh', type: 'by', fraBeat: 2 },
    ],
    krig: [
        { ll: LONDON, tekst: 'London', type: 'by', fraBeat: 0, under: true },
        { ll: [-1.15, 52.95], tekst: 'Nottingham, august 1642', type: 'flagg', fraBeat: 0 },
        {
            ll: [-1.48, 52.13],
            tekst: 'Edgehill, oktober 1642',
            type: 'kongen-vinner',
            fraBeat: 2,
            under: true,
        },
    ],
    seire: [
        { ll: [-1.27, 53.96], tekst: 'Marston Moor, 1644', type: 'parlamentet-vinner', fraBeat: 0 },
        {
            ll: [-0.99, 52.4],
            tekst: 'Naseby, 1645',
            type: 'parlamentet-vinner',
            fraBeat: 0,
            under: true,
        },
        {
            ll: [-2.7, 53.76],
            tekst: 'Preston, 1648',
            type: 'parlamentet-vinner',
            fraBeat: 3,
            venstre: true,
        },
    ],
    irland: [
        { ll: [-6.35, 53.72], tekst: 'Drogheda', type: 'massakre', fraBeat: 1 },
        { ll: [-6.46, 52.34], tekst: 'Wexford', type: 'massakre', fraBeat: 1, under: true },
    ],
};

/** Byer ved kysten (betalte skipsskatt før) og inne i landet (måtte betale nå). */
const KYSTBYER: LngLat[] = [
    [1.31, 51.13],
    [-2.59, 51.45],
    [-4.14, 50.37],
    [-0.33, 53.74],
    [-1.61, 54.97],
    [-1.4, 50.9],
    [1.73, 52.61],
    [-2.98, 53.41],
    [-1.09, 50.8],
    [0.6, 51.5],
    [-3.53, 50.72],
    [-5.05, 50.15],
    [1.15, 52.06],
    [-0.4, 54.28],
];
const INNLANDSBYER: LngLat[] = [
    [-1.26, 51.75],
    [-1.08, 53.96],
    [-1.9, 52.48],
    [0.12, 52.2],
    [-1.13, 52.63],
    [-1.51, 52.41],
    [-2.22, 52.19],
    [-2.24, 51.86],
    [-0.54, 53.23],
    [-1.48, 52.92],
    [1.29, 52.63],
    [-2.75, 52.71],
    [-1.79, 51.07],
    [-0.97, 51.45],
    [-0.9, 52.24],
    [-2.93, 54.89],
    [-1.47, 53.38],
    [-2.24, 53.48],
    [-0.48, 52.14],
    [-2.72, 52.06],
    [-1.55, 53.8],
    [-2.36, 51.38],
    [-1.15, 52.95],
    [-0.25, 52.57],
    [-3.0, 51.85],
];

/** Grovt omriss nord for grensen mot Skottland. Klippes mot landomrisset. */
const SKOTTLAND: LngLat[] = [
    [-9, 61],
    [1, 61],
    [1, 55.8],
    [-2.0, 55.8],
    [-3.05, 54.98],
    [-5.0, 54.6],
    [-5.4, 55.2],
    [-6.1, 55.7],
    [-9, 55.9],
];
const ENGLAND: LngLat[] = [
    [-6, 49.5],
    [2.5, 49.5],
    [2.5, 55.8],
    [-2.0, 55.8],
    [-3.05, 54.98],
    [-5.0, 54.6],
    [-6, 54.3],
];

interface Kort {
    tekst: string;
    farge?: string;
}

/** Forklaringskortene til høyre, ett sett per beat. */
const KORT: Record<Modus, Kort[][]> = {
    skipsskatt: [
        [{ tekst: '1629-1640' }, { tekst: 'Kongen styrer alene', farge: KONGE }],
        [
            { tekst: 'Elleve års tyranni' },
            { tekst: 'Tyrann: en hersker som misbruker makta', farge: ROD },
        ],
        [{ tekst: 'Skipsskatt' }, { tekst: 'Før: bare byene ved kysten', farge: '#a16207' }],
        [{ tekst: 'Skipsskatt' }, { tekst: 'Nå: hele landet', farge: '#a16207' }],
    ],
    skottland: [
        [{ tekst: 'Tro' }],
        [{ tekst: 'Puritanere' }, { tekst: 'Strenge protestanter', farge: PARLAMENT }],
        [{ tekst: '1637' }, { tekst: 'Den engelske bønneboka tvinges på skottene', farge: KONGE }],
        [{ tekst: '1639 og 1640' }, { tekst: 'Skottene gjør opprør', farge: ROD }],
    ],
    krig: [
        [{ tekst: 'August 1642' }, { tekst: 'Kongen reiser fanen sin', farge: KONGE }],
        [
            { tekst: 'Rojalistene: kongens side', farge: KONGE },
            { tekst: 'Parlamentet og puritanerne', farge: PARLAMENT },
        ],
        [{ tekst: 'Edgehill' }, { tekst: 'Kongens side vinner', farge: KONGE }],
    ],
    seire: [
        [
            { tekst: 'Parlamentets seire' },
            { tekst: 'Marston Moor 1644, Naseby 1645', farge: PARLAMENT },
        ],
        [{ tekst: '1647' }, { tekst: 'Karl overgir seg', farge: KONGE }],
        [{ tekst: 'Hemmelig avtale' }, { tekst: 'Karl og skottene: ny krig', farge: ROD }],
        [{ tekst: 'Preston, 1648' }, { tekst: 'Karl taper igjen', farge: PARLAMENT }],
        [],
    ],
    irland: [
        [{ tekst: '1649 og 1650' }, { tekst: 'Cromwell fører krig i Irland', farge: PARLAMENT }],
        [
            { tekst: 'Svært brutale metoder' },
            { tekst: 'Massakrer i Drogheda og Wexford', farge: ROD },
        ],
    ],
};

export function BorgerkrigenKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'krig';
    const { geographies } = useAtlasWorld();

    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [60, 40],
                    [1000, 860],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [-10.5, 50],
                        [1.8, 58.7],
                    ],
                } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const poly = (pts: LngLat[]) => pts.map((ll) => p(ll).join(',')).join(' ');

    const storbritannia = useMemo(
        () => geographies.find((g) => String((g as { id?: unknown }).id) === '826'),
        [geographies]
    );
    const irland = useMemo(
        () => geographies.find((g) => String((g as { id?: unknown }).id) === '372'),
        [geographies]
    );

    const skottlandFarge =
        modus === 'skottland' && beat >= 3 ? ROD : modus === 'seire' && beat === 2 ? ROD : null;
    const englandFarge =
        modus === 'skipsskatt' && beat <= 1
            ? KONGE
            : modus === 'skottland' && beat === 1
              ? PARLAMENT
              : null;
    const markorer = MARKORER[modus].filter((m) => beat >= m.fraBeat);
    const kort = KORT[modus][Math.min(beat, KORT[modus].length - 1)] ?? [];
    const doede = modus === 'seire' && beat >= 4;

    return (
        <div className="absolute inset-0 bg-[#cfe3ef] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <clipPath id="borgerkrigen-uk">
                        {storbritannia && <path d={sti(storbritannia as never) ?? ''} />}
                    </clipPath>
                </defs>
                <Land geographies={geographies} sti={sti} />

                {/* Skottland og England fargelegges ved å klippe et grovt felt mot landet */}
                <g clipPath="url(#borgerkrigen-uk)">
                    <motion.polygon
                        points={poly(SKOTTLAND)}
                        animate={{
                            fill: skottlandFarge ?? '#f5efe0',
                            opacity: skottlandFarge ? 0.75 : 0,
                        }}
                        transition={{ duration: 1 }}
                    />
                    <motion.polygon
                        points={poly(ENGLAND)}
                        animate={{
                            fill: englandFarge ?? '#f5efe0',
                            opacity: englandFarge ? 0.4 : 0,
                        }}
                        transition={{ duration: 1 }}
                    />
                </g>
                {irland && (
                    <motion.path
                        d={sti(irland as never) ?? ''}
                        animate={{ fill: modus === 'irland' ? '#fecaca' : '#f5efe0' }}
                        transition={{ duration: 1 }}
                        stroke="#b9ad92"
                        strokeWidth={1.5}
                    />
                )}

                {modus === 'skottland' && (
                    <>
                        <Navn ll={[-4.2, 57.2]} tekst="SKOTTLAND" p={p} />
                        <Navn ll={[-1.6, 52.6]} tekst="ENGLAND" p={p} />
                    </>
                )}
                {modus === 'irland' && <Navn ll={[-8.0, 53.2]} tekst="IRLAND" p={p} />}

                {/* Skipsskatten: gull ved kysten, så over hele landet */}
                {modus === 'skipsskatt' &&
                    [
                        ...KYSTBYER.map((ll) => ({ ll, fra: 2 })),
                        ...INNLANDSBYER.map((ll) => ({ ll, fra: 3 })),
                    ].map(({ ll, fra }, i) => {
                        const [x, y] = p(ll);
                        const vis = beat >= fra;
                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r={11}
                                fill="#eab308"
                                stroke="#713f12"
                                strokeWidth={3}
                                style={{
                                    opacity: vis ? 1 : 0,
                                    transformOrigin: `${x}px ${y}px`,
                                    transform: vis ? 'scale(1)' : 'scale(0.2)',
                                    transition: `opacity 400ms ease ${(i % 14) * 90}ms, transform 500ms ease ${(i % 14) * 90}ms`,
                                }}
                            />
                        );
                    })}

                {/* Bønneboka reiser fra London til Edinburgh */}
                {modus === 'skottland' && beat === 2 && (
                    <Reise fra={p(LONDON)} til={p(EDINBURGH)} farge={KONGE} ikon="bok" />
                )}
                {/* Den hemmelige avtalen: skottene kommer sørover */}
                {modus === 'seire' && beat === 2 && (
                    <Reise fra={p(EDINBURGH)} til={p([-2.7, 53.76])} farge={ROD} ikon="pil" />
                )}
                {/* Cromwell over til Irland */}
                {modus === 'irland' && (
                    <Reise
                        fra={p([-3.0, 53.3])}
                        til={p([-6.3, 53.3])}
                        farge={PARLAMENT}
                        ikon="pil"
                    />
                )}

                {markorer.map((m) => (
                    <MarkorTegning key={m.tekst} m={m} pos={p(m.ll)} />
                ))}
            </svg>

            {/* Forklaringer til høyre */}
            <div className="absolute right-[3%] top-0 bottom-0 w-[38%] flex flex-col justify-center gap-4">
                <AnimatePresence mode="popLayout">
                    {kort.map((k, i) => (
                        <motion.div
                            key={`${beat}-${k.tekst}`}
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
                    {doede && (
                        <motion.div
                            key="doede"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-start gap-3"
                        >
                            <Teller
                                verdi={200000}
                                etikett="døde av krigene"
                                prefiks="ca. "
                                tone="rod"
                            />
                            <div className="px-4 py-2 rounded-xl bg-white/90 text-slate-700 font-bold text-lg md:text-2xl">
                                i kamp, eller av sult og sykdom
                            </div>
                        </motion.div>
                    )}
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
        <text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={34}
            fontWeight={900}
            letterSpacing={6}
            fill="#57534e"
            opacity={0.8}
        >
            {tekst}
        </text>
    );
}

function MarkorTegning({ m, pos }: { m: Markor; pos: [number, number] }) {
    const farge =
        m.type === 'kongen-vinner'
            ? KONGE
            : m.type === 'parlamentet-vinner'
              ? PARLAMENT
              : m.type === 'massakre'
                ? ROD
                : '#0f172a';
    const slag = m.type === 'kongen-vinner' || m.type === 'parlamentet-vinner';
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            <g transform={`translate(${pos[0]} ${pos[1]})`}>
                {slag ? (
                    <>
                        <circle r={26} fill={farge} stroke="#ffffff" strokeWidth={4} />
                        <g stroke="#ffffff" strokeWidth={5} strokeLinecap="round">
                            <line x1={-12} y1={-12} x2={12} y2={12} />
                            <line x1={12} y1={-12} x2={-12} y2={12} />
                        </g>
                    </>
                ) : m.type === 'flagg' ? (
                    <>
                        <line x1={0} y1={0} x2={0} y2={-70} stroke="#0f172a" strokeWidth={5} />
                        <motion.path
                            d="M 0 -70 L 52 -58 L 0 -44 Z"
                            fill={KONGE}
                            stroke="#ffffff"
                            strokeWidth={3}
                            animate={{ skewY: [0, -6, 0] }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <circle r={8} fill="#0f172a" />
                    </>
                ) : m.type === 'massakre' ? (
                    <circle r={16} fill={farge} stroke="#ffffff" strokeWidth={4} />
                ) : (
                    <circle r={11} fill="#0f172a" stroke="#ffffff" strokeWidth={3} />
                )}
                <text
                    x={m.venstre ? -36 : m.type === 'flagg' ? 30 : 0}
                    y={m.venstre ? 10 : m.under ? 62 : m.type === 'flagg' ? -86 : -38}
                    textAnchor={m.venstre ? 'end' : 'middle'}
                    fontSize={30}
                    fontWeight={900}
                    fill={farge}
                    stroke="#ffffff"
                    strokeWidth={7}
                    paintOrder="stroke"
                >
                    {m.tekst}
                </text>
            </g>
        </motion.g>
    );
}

/** En prikket bane som tegnes fram, med et ikon som følger med. */
function Reise({
    fra,
    til,
    farge,
    ikon,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    ikon: 'bok' | 'pil';
}) {
    const midt: [number, number] = [(fra[0] + til[0]) / 2 + 70, (fra[1] + til[1]) / 2];
    const d = `M ${fra.join(' ')} Q ${midt.join(' ')} ${til.join(' ')}`;
    return (
        <g>
            <motion.path
                d={d}
                fill="none"
                stroke={farge}
                strokeWidth={7}
                strokeDasharray="12 10"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.4, ease: 'easeInOut' }}
            />
            <motion.g
                initial={{ x: fra[0], y: fra[1], opacity: 0 }}
                animate={{ x: til[0], y: til[1], opacity: 1 }}
                transition={{ duration: 2.4, ease: 'easeInOut' }}
            >
                {ikon === 'bok' ? (
                    <g transform="translate(-26 -40)">
                        <rect
                            width={52}
                            height={40}
                            rx={5}
                            fill={farge}
                            stroke="#ffffff"
                            strokeWidth={4}
                        />
                        <line x1={26} y1={4} x2={26} y2={36} stroke="#ffffff" strokeWidth={3} />
                    </g>
                ) : (
                    <circle r={14} fill={farge} stroke="#ffffff" strokeWidth={4} />
                )}
            </motion.g>
        </g>
    );
}
