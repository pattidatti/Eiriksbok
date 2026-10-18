import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart over Frankrike under Ludvig 14.:
 * - fronden: opprøret i Paris, flukten til St. Germain, Condé og Spania
 * - tro: ediktet i Nantes, og hugenottene som flykter ut av landet
 * - krig: landene Ludvig vant, det han mistet, og hvem som betalte
 * Kartet står til venstre, forklaringene til høyre.
 */

type Modus = 'fronden' | 'tro' | 'krig';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const KONGE = '#1d4ed8';
const ROD = '#b91c1c';
const GULL = '#ca8a04';
const HUGENOTT = '#7c3aed';

const PARIS: LngLat = [2.35, 48.86];
const NANTES: LngLat = [-1.55, 47.22];
const STRASBOURG: LngLat = [7.75, 48.58];

const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    fronden: [
        [-9.5, 39.5],
        [10, 51.5],
    ],
    krig: [
        [-4.8, 42.3],
        [9.5, 51.6],
    ],
    tro: [
        [-10, 41.5],
        [12.5, 55.5],
    ],
};

/** Grove omriss for områdene Ludvig vant. Klippes mot landene. */
const FLANDERN: LngLat[] = [
    [2.1, 50.2],
    [4.3, 50.2],
    [4.3, 51.15],
    [2.5, 51.15],
];
const FRANCHE_COMTE: LngLat[] = [
    [5.25, 46.3],
    [6.9, 46.4],
    [7.1, 47.6],
    [6.2, 47.95],
    [5.3, 47.6],
];

interface Kort {
    tekst: string;
    farge?: string;
}

const KORT: Record<Modus, Kort[][]> = {
    fronden: [
        [{ tekst: '1648-1653' }, { tekst: 'Fronden: en rekke opprør', farge: ROD }],
        [{ tekst: 'Paris' }, { tekst: 'Barrikader i gatene', farge: ROD }],
        [{ tekst: 'Flukt' }, { tekst: 'Hoffet flykter fra Paris til St. Germain', farge: KONGE }],
        [
            { tekst: 'Krig' },
            { tekst: 'Prinsen av Condé mot kongens hær', farge: ROD },
            { tekst: 'Støtte fra Spania', farge: GULL },
        ],
        [{ tekst: 'Kongens side vinner' }, { tekst: 'Opprørerne var uenige', farge: KONGE }],
    ],
    tro: [
        [{ tekst: 'Hugenotter' }, { tekst: 'Protestanter i Frankrike', farge: HUGENOTT }],
        [{ tekst: '1598' }, { tekst: 'Ediktet i Nantes: lov om å tro fritt', farge: '#15803d' }],
        [{ tekst: '1685' }, { tekst: 'Ludvig tar bort ediktet', farge: ROD }],
        [{ tekst: 'Flukt' }, { tekst: 'Flere hundre tusen flykter', farge: HUGENOTT }],
        [{ tekst: 'Tapet' }, { tekst: 'Frankrike mister dyktige håndverkere', farge: ROD }],
    ],
    krig: [
        [{ tekst: 'Krig' }, { tekst: 'nesten hele tiden', farge: ROD }],
        [{ tekst: '1667-1668' }, { tekst: 'Vinner deler av Flandern', farge: GULL }],
        [
            { tekst: 'Mer land' },
            { tekst: 'Franche-Comté, etter krigen mot Nederland', farge: GULL },
            { tekst: '1681-1683: Strasbourg', farge: GULL },
        ],
        [{ tekst: '1688-1697' }, { tekst: 'Lykken snur: Frankrike mister noe', farge: ROD }],
        [
            { tekst: '1701' },
            { tekst: 'Ny stor krig', farge: ROD },
            { tekst: 'Økonomien er ødelagt', farge: ROD },
        ],
        [
            { tekst: 'Hvem betalte?' },
            { tekst: 'Adelen: slapp mye skatt', farge: '#7c3aed' },
            { tekst: 'Kirken: slapp mye skatt', farge: '#7c3aed' },
            { tekst: 'Vanlige folk: betalte mest', farge: ROD },
        ],
    ],
};

/** Hugenotter spredt i Frankrike (bare illustrasjon, ikke steder). */
const HUGENOTTER: LngLat[] = [
    [-0.6, 44.8],
    [0.3, 46.2],
    [-1.2, 46.2],
    [3.9, 43.6],
    [4.4, 44.1],
    [2.3, 43.9],
    [1.4, 43.6],
    [-0.4, 43.3],
    [4.8, 45.7],
    [1.9, 47.9],
    [0.1, 49.4],
    [5.4, 43.3],
    [3.1, 45.8],
    [-1.6, 47.2],
    [2.35, 48.86],
    [6.1, 44.6],
    [0.7, 45.2],
    [3.0, 44.4],
];
const MÅL: { ll: LngLat; navn: string }[] = [
    { ll: [5.3, 52.2], navn: 'Nederland' },
    { ll: [-1.5, 52.4], navn: 'England' },
    { ll: [8.2, 46.9], navn: 'Sveits' },
    { ll: [-9.7, 46], navn: 'Amerika' },
];

export function SolkongenKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'fronden';
    const { geographies } = useFilmVerden();

    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [50, 40],
                    [990, 860],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT[modus] } as never
            ),
        [modus]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const poly = (pts: LngLat[]) => pts.map((ll) => p(ll).join(',')).join(' ');

    const frankrike = useMemo(
        () => geographies.find((g) => String((g as { id?: unknown }).id) === '250'),
        [geographies]
    );
    const spania = useMemo(
        () => geographies.find((g) => String((g as { id?: unknown }).id) === '724'),
        [geographies]
    );

    const frankrikeFarge =
        modus === 'fronden'
            ? beat >= 4
                ? '#bfdbfe'
                : beat >= 1
                  ? '#fecaca'
                  : '#fde68a'
            : modus === 'krig' && beat >= 3
              ? '#fecaca'
              : '#fde68a';
    const kort = KORT[modus][Math.min(beat, KORT[modus].length - 1)] ?? [];
    const [px, py] = p(PARIS);

    return (
        <div className="absolute inset-0 bg-[#cfe3ef] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <clipPath id="solkongen-land">
                        {geographies.map((g, i) => (
                            <path key={i} d={sti(g as never) ?? ''} />
                        ))}
                    </clipPath>
                </defs>
                <Land geographies={geographies} sti={sti} />
                {frankrike && (
                    <motion.path
                        d={sti(frankrike as never) ?? ''}
                        animate={{ fill: frankrikeFarge }}
                        transition={{ duration: 1 }}
                        stroke="#92400e"
                        strokeWidth={3}
                    />
                )}
                {modus === 'fronden' && spania && (
                    <motion.path
                        d={sti(spania as never) ?? ''}
                        animate={{ fill: beat === 3 ? '#fcd34d' : '#f5efe0' }}
                        transition={{ duration: 1 }}
                        stroke="#b9ad92"
                        strokeWidth={1.5}
                    />
                )}
                <Navn ll={modus === 'tro' ? [3.6, 45.3] : [1.0, 46.9]} tekst="FRANKRIKE" p={p} />

                {/* ------- Fronden ------- */}
                {modus === 'fronden' && (
                    <>
                        {beat >= 1 &&
                            beat <= 3 &&
                            [0, 1, 2, 3, 4, 5].map((i) => {
                                const a = (i / 6) * Math.PI * 2;
                                return (
                                    <motion.g
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.3 }}
                                        animate={{ opacity: 1, scale: [1, 1.25, 1] }}
                                        transition={{
                                            delay: i * 0.15,
                                            scale: { duration: 1.4, repeat: Infinity },
                                        }}
                                        style={{
                                            transformOrigin: `${px + Math.cos(a) * 62}px ${py + Math.sin(a) * 62}px`,
                                        }}
                                    >
                                        <Flamme
                                            x={px + Math.cos(a) * 62}
                                            y={py + Math.sin(a) * 62}
                                        />
                                    </motion.g>
                                );
                            })}
                        {beat === 2 && <Lupe px={px} py={py} />}
                        {beat === 3 && (
                            <>
                                <Pil fra={p([-3.7, 40.6])} til={p([1.2, 48.4])} farge={GULL} />
                                <Sverd
                                    x={p([5.6, 49.9])[0]}
                                    y={p([5.6, 49.9])[1]}
                                    farge={ROD}
                                    tekst="Condé"
                                />
                                <Sverd
                                    x={p([-0.6, 48.9])[0]}
                                    y={p([-0.6, 48.9])[1]}
                                    farge={KONGE}
                                    tekst="Kongens hær"
                                />
                            </>
                        )}
                        {beat >= 4 && (
                            <motion.g
                                initial={{ opacity: 0, scale: 0.4 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ transformOrigin: `${px}px ${py}px` }}
                            >
                                <Krone x={px} y={py - 70} />
                            </motion.g>
                        )}
                        <Punkt pos={[px, py]} tekst="Paris" />
                    </>
                )}

                {/* ------- Tro ------- */}
                {modus === 'tro' && (
                    <>
                        {HUGENOTTER.map((ll, i) => {
                            const [x, y] = p(ll);
                            const mål = p(MÅL[i % MÅL.length].ll);
                            const flykter = beat >= 3;
                            return (
                                <motion.circle
                                    key={i}
                                    r={13}
                                    stroke="#ffffff"
                                    strokeWidth={3}
                                    initial={{ cx: x, cy: y, opacity: 0 }}
                                    animate={{
                                        cx: flykter ? mål[0] : x,
                                        cy: flykter ? mål[1] : y,
                                        opacity: flykter ? (beat >= 4 ? 0.9 : 1) : 1,
                                        fill: beat === 1 ? '#16a34a' : beat >= 2 ? ROD : HUGENOTT,
                                    }}
                                    transition={{
                                        duration: flykter ? 2.6 : 0.8,
                                        delay: flykter ? (i % 6) * 0.25 : i * 0.04,
                                    }}
                                />
                            );
                        })}
                        {beat >= 3 &&
                            MÅL.map((m) => (
                                <Pil
                                    key={m.navn}
                                    fra={p([2.3, 46.8])}
                                    til={p(m.ll)}
                                    farge={HUGENOTT}
                                />
                            ))}
                        {beat >= 3 &&
                            MÅL.map((m) => (
                                <Punkt
                                    key={m.navn}
                                    pos={p(m.ll)}
                                    tekst={m.navn}
                                    farge={HUGENOTT}
                                    under
                                />
                            ))}
                        {beat >= 1 && (
                            <g>
                                <Punkt
                                    pos={p(NANTES)}
                                    tekst="Nantes"
                                    farge={beat >= 2 ? ROD : '#15803d'}
                                />
                                {beat >= 2 && (
                                    <motion.g
                                        initial={{ opacity: 0, scale: 2 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        style={{
                                            transformOrigin: `${p(NANTES)[0]}px ${p(NANTES)[1]}px`,
                                        }}
                                        stroke={ROD}
                                        strokeWidth={10}
                                        strokeLinecap="round"
                                    >
                                        <line
                                            x1={p(NANTES)[0] - 30}
                                            y1={p(NANTES)[1] - 30}
                                            x2={p(NANTES)[0] + 30}
                                            y2={p(NANTES)[1] + 30}
                                        />
                                        <line
                                            x1={p(NANTES)[0] + 30}
                                            y1={p(NANTES)[1] - 30}
                                            x2={p(NANTES)[0] - 30}
                                            y2={p(NANTES)[1] + 30}
                                        />
                                    </motion.g>
                                )}
                            </g>
                        )}
                    </>
                )}

                {/* ------- Krig ------- */}
                {modus === 'krig' && (
                    <>
                        <g clipPath="url(#solkongen-land)">
                            <motion.polygon
                                points={poly(FLANDERN)}
                                animate={{
                                    fill: GULL,
                                    opacity: beat >= 1 ? 0.75 : 0,
                                }}
                                transition={{ duration: 1 }}
                                stroke="#78350f"
                                strokeWidth={3}
                            />
                            <motion.polygon
                                points={poly(FRANCHE_COMTE)}
                                animate={{ opacity: beat >= 2 ? 0.75 : 0 }}
                                transition={{ duration: 1 }}
                                fill={GULL}
                                stroke="#78350f"
                                strokeWidth={3}
                            />
                        </g>
                        {beat >= 1 && (
                            <Navn ll={[3.1, 50.95]} tekst="Flandern" p={p} liten farge="#78350f" />
                        )}
                        {beat >= 2 && (
                            <>
                                <Navn
                                    ll={[6.0, 45.9]}
                                    tekst="Franche-Comté"
                                    p={p}
                                    liten
                                    farge="#78350f"
                                />
                                <Punkt pos={p(STRASBOURG)} tekst="Strasbourg" farge={GULL} />
                            </>
                        )}
                        {beat >= 4 &&
                            [0, 1, 2, 3, 4].map((i) => {
                                const ll: LngLat = [-0.6 + i * 1.5, 44.0 + (i % 2) * 0.7];
                                const [x, y] = p(ll);
                                return (
                                    <motion.g
                                        key={i}
                                        initial={{ opacity: 0, y: -30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.2 }}
                                    >
                                        <Mynt x={x} y={y} />
                                    </motion.g>
                                );
                            })}
                        <Punkt pos={[px, py]} tekst="Paris" />
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
    liten = false,
    farge = '#57534e',
}: {
    ll: LngLat;
    tekst: string;
    p: (ll: LngLat) => [number, number];
    liten?: boolean;
    farge?: string;
}) {
    const [x, y] = p(ll);
    return (
        <text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={liten ? 32 : 40}
            fontWeight={900}
            letterSpacing={liten ? 1 : 8}
            fill={farge}
            opacity={liten ? 1 : 0.75}
            stroke="#ffffff"
            strokeWidth={liten ? 7 : 0}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}

function Punkt({
    pos,
    tekst,
    farge = '#0f172a',
    under = false,
}: {
    pos: [number, number];
    tekst: string;
    farge?: string;
    under?: boolean;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            <circle cx={pos[0]} cy={pos[1]} r={13} fill={farge} stroke="#ffffff" strokeWidth={4} />
            <text
                x={pos[0]}
                y={pos[1] + (under ? 52 : -26)}
                textAnchor="middle"
                fontSize={32}
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

function Pil({ fra, til, farge }: { fra: [number, number]; til: [number, number]; farge: string }) {
    const midt: [number, number] = [(fra[0] + til[0]) / 2, (fra[1] + til[1]) / 2 - 40];
    const d = `M ${fra.join(' ')} Q ${midt.join(' ')} ${til.join(' ')}`;
    return (
        <motion.path
            d={d}
            fill="none"
            stroke={farge}
            strokeWidth={8}
            strokeDasharray="14 10"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ duration: 2.2, ease: 'easeInOut' }}
        />
    );
}

function Flamme({ x, y }: { x: number; y: number }) {
    return (
        <path
            d={`M ${x} ${y - 20} Q ${x + 14} ${y - 4} ${x + 8} ${y + 10} Q ${x} ${y + 16} ${x - 8} ${y + 10} Q ${x - 14} ${y - 4} ${x} ${y - 20} Z`}
            fill="#ef4444"
            stroke="#7f1d1d"
            strokeWidth={3}
        />
    );
}

function Krone({ x, y }: { x: number; y: number }) {
    return (
        <path
            d={`M ${x - 40} ${y + 18} L ${x - 46} ${y - 22} L ${x - 22} ${y} L ${x} ${y - 32} L ${x + 22} ${y} L ${x + 46} ${y - 22} L ${x + 40} ${y + 18} Z`}
            fill="#f5b301"
            stroke="#78350f"
            strokeWidth={5}
            strokeLinejoin="round"
        />
    );
}

function Sverd({ x, y, farge, tekst }: { x: number; y: number; farge: string; tekst: string }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.6 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <circle cx={x} cy={y} r={30} fill={farge} stroke="#ffffff" strokeWidth={4} />
            <g stroke="#ffffff" strokeWidth={6} strokeLinecap="round">
                <line x1={x - 14} y1={y - 14} x2={x + 14} y2={y + 14} />
                <line x1={x + 14} y1={y - 14} x2={x - 14} y2={y + 14} />
            </g>
            <text
                x={x}
                y={y + 66}
                textAnchor="middle"
                fontSize={30}
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

/** Forstørrelse av området rundt Paris: hoffet flykter vestover til St. Germain. */
function Lupe({ px, py }: { px: number; py: number }) {
    const cx = 300;
    const cy = 250;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
            <line
                x1={px}
                y1={py}
                x2={cx + 120}
                y2={cy + 90}
                stroke="#0f172a"
                strokeWidth={4}
                strokeDasharray="8 8"
            />
            <circle cx={cx} cy={cy} r={170} fill="#fffbeb" stroke="#0f172a" strokeWidth={6} />
            <circle cx={cx + 80} cy={cy + 10} r={16} fill="#0f172a" />
            <text
                x={cx + 80}
                y={cy + 66}
                textAnchor="middle"
                fontSize={34}
                fontWeight={900}
                fill="#0f172a"
            >
                Paris
            </text>
            <circle cx={cx - 90} cy={cy - 20} r={16} fill={KONGE} />
            <text
                x={cx - 90}
                y={cy - 46}
                textAnchor="middle"
                fontSize={30}
                fontWeight={900}
                fill={KONGE}
            >
                St. Germain
            </text>
            <motion.path
                d={`M ${cx + 60} ${cy + 4} Q ${cx} ${cy + 40} ${cx - 70} ${cy - 14}`}
                fill="none"
                stroke={KONGE}
                strokeWidth={9}
                strokeDasharray="14 10"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.8, delay: 0.5 }}
            />
        </motion.g>
    );
}

function Mynt({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <circle cx={x} cy={y} r={24} fill="#eab308" stroke="#713f12" strokeWidth={4} />
            <circle cx={x} cy={y} r={13} fill="none" stroke="#713f12" strokeWidth={3} />
        </g>
    );
}
