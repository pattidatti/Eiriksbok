import { memo, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import { rammePunkter } from '../../kart/grenser';
import type { VisualProps } from '../../types';

/**
 * Kart over det vestlige Middelhavet: Roma mot Kartago, Hannibals marsj over Alpene,
 * Zama og Romas hav, og til slutt Italia der Sulla marsjerer mot Roma.
 */

type Modus = 'rivaler' | 'hannibal' | 'zama' | 'sulla';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const ROD = '#b91c1c';
const BLA = '#1d4ed8';
const HAV = '#cfe3ef';

const ROMA: LngLat = [12.5, 41.9];
const KARTAGO: LngLat = [10.32, 36.85];
const SPANIA: LngLat = [-0.98, 37.6];
const ZAMA: LngLat = [9.4, 36.1];
const SOR_ITALIA: LngLat = [16.0, 40.6];

/** Hannibals vei: fra Spania over Pyreneene og gjennom Sør-Frankrike (del 1), over Alpene (del 2). */
const RUTE_1: LngLat[] = [SPANIA, [0.2, 39.6], [1.0, 41.1], [2.6, 42.5], [3.9, 43.5], [4.7, 43.9]];
const RUTE_2: LngLat[] = [
    [4.7, 43.9],
    [5.6, 44.6],
    [6.6, 45.1],
    [7.6, 45.1],
    [8.8, 45.2],
];

/** Sjørutene fra Kartago. Alle går over åpent hav. */
const SJORUTER: LngLat[][] = [
    [KARTAGO, [6, 37.6], [1.5, 37.3], [-0.6, 37.5]],
    [KARTAGO, [9.6, 38.2], [9.0, 39.0]],
    [KARTAGO, [11.7, 37.6], [13.2, 38.3]],
    [KARTAGO, [6.5, 38.4], [3.0, 39.4]],
];

/** Sjøen som Roma styrer etter punerkrigene (land tegnes over, så bare havet blir rødt). */
const VESTHAVET: LngLat[] = [
    [-5.6, 35.9],
    [-5.6, 36.3],
    [-1, 38.8],
    [3.5, 43.6],
    [8.8, 44.6],
    [10.5, 43.3],
    [12.5, 41.2],
    [15.6, 40.2],
    [15.6, 38.0],
    [12.4, 37.4],
    [11.2, 36.9],
    [10.3, 37.4],
    [8.5, 36.9],
    [3, 36.8],
    [-2, 35.1],
    [-5.6, 35.9],
];

const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    rivaler: [
        [-8, 33.5],
        [20, 47],
    ],
    hannibal: [
        [-8, 33.5],
        [20, 47],
    ],
    zama: [
        [-8, 33.5],
        [20, 47],
    ],
    sulla: [
        [6.5, 37.2],
        [19.5, 46.3],
    ],
};

interface Kort {
    topp: string;
    tekst: string;
    farge?: string;
}

const KORT: Record<Modus, Kort[]> = {
    rivaler: [
        { topp: 'Roma vokser', tekst: 'Først naboene i Italia', farge: ROD },
        { topp: 'Rivalen', tekst: 'Kartago i Nord-Afrika', farge: BLA },
        { topp: 'Kartago', tekst: 'En sjømakt som styrer handelen', farge: BLA },
        { topp: 'Punerkrigene', tekst: '264-146 fvt.: godt over 100 år' },
    ],
    hannibal: [
        { topp: 'Andre punerkrig', tekst: '218-201 fvt.' },
        { topp: 'Hannibal', tekst: 'Ikke fra sjøen', farge: BLA },
        { topp: 'Marsjen', tekst: 'Spania, Pyreneene, Sør-Frankrike', farge: BLA },
        { topp: 'Over Alpene', tekst: 'Med krigselefanter', farge: BLA },
        { topp: 'Prisen', tekst: 'Mange soldater og de fleste elefantene', farge: ROD },
    ],
    zama: [
        { topp: 'Romas styrke', tekst: 'Romerne nekter å gi seg', farge: ROD },
        { topp: 'Hvert år', tekst: 'Nye legioner', farge: ROD },
        { topp: 'Hannibal', tekst: 'Må hjem for å forsvare Kartago', farge: BLA },
        { topp: 'Zama, 202 fvt.', tekst: 'Scipio slår Hannibal', farge: ROD },
        { topp: 'Etter punerkrigene', tekst: 'Roma styrer det vestlige Middelhavet', farge: ROD },
    ],
    sulla: [
        { topp: 'Generalene', tekst: 'Hær mot hær', farge: ROD },
        { topp: 'Soldatene', tekst: 'Lojale mot generalen som betaler', farge: ROD },
        { topp: 'Folkeforsamlingen', tekst: 'Kommandoen går til Marius', farge: BLA },
        { topp: 'Sulla', tekst: 'Marsjerer mot Roma', farge: ROD },
        { topp: 'Etter borgerkrigen', tekst: 'Sulla blir diktator', farge: ROD },
    ],
};

export function RomaKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'rivaler';
    const utsnitt = UTSNITT[modus];
    const { geographies } = useFilmVerden(modus === 'sulla' ? utsnitt : undefined);
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 40],
                    [B - 40, H - 40],
                ],
                rammePunkter(utsnitt[0], utsnitt[1]) as never
            ),
        [utsnitt]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const linje = (pts: LngLat[]) =>
        pts.map((ll, i) => `${i === 0 ? 'M' : 'L'} ${p(ll).join(' ')}`).join(' ');

    const kort = KORT[modus][Math.min(beat, KORT[modus].length - 1)];

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: HAV }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'zama' && (
                    <motion.path
                        d={linje(VESTHAVET) + ' Z'}
                        fill={ROD}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat >= 4 ? 0.28 : 0 }}
                        transition={{ duration: 1.6 }}
                    />
                )}
                <Land geographies={geographies} sti={sti} />
                {modus === 'rivaler' && <Rivaler beat={beat} p={p} linje={linje} />}
                {modus === 'hannibal' && <Hannibal beat={beat} p={p} linje={linje} />}
                {modus === 'zama' && <Zama beat={beat} p={p} />}
                {modus === 'sulla' && <Sulla beat={beat} p={p} />}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${kort.topp}`}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                    className="absolute left-[3%] top-[5%] rounded-2xl bg-white/95 shadow-xl px-5 py-3"
                    style={{ maxWidth: '42%' }}
                >
                    <div className="text-lg md:text-xl font-bold uppercase tracking-wide text-slate-500">
                        {kort.topp}
                    </div>
                    <div
                        className="text-2xl md:text-3xl font-black leading-tight"
                        style={{ color: kort.farge ?? '#0f172a' }}
                    >
                        {kort.tekst}
                    </div>
                </motion.div>
            </AnimatePresence>
            <div className="absolute right-[2%] bottom-[3%] rounded-lg bg-white/80 px-3 py-1 text-base font-semibold text-slate-600">
                Dagens kystlinjer. Plasseringene er omtrentlige.
            </div>
        </div>
    );
}

type P = (ll: LngLat) => [number, number];

/** Landene endrer seg aldri i en modus, så de tegnes bare én gang. */
const Land = memo(function Land({ geographies, sti }: { geographies: unknown[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill="#f3ead6"
                    stroke="#b8a888"
                    strokeWidth={1.2}
                />
            ))}
        </>
    );
});

function By({
    p,
    ll,
    navn,
    farge = '#0f172a',
    dx = 0,
    dy = -24,
    synlig = true,
    anker = 'middle',
}: {
    p: P;
    ll: LngLat;
    navn: string;
    farge?: string;
    dx?: number;
    dy?: number;
    synlig?: boolean;
    anker?: 'start' | 'middle' | 'end';
}) {
    const [x, y] = p(ll);
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: synlig ? 1 : 0 }}>
            <circle cx={x} cy={y} r={11} fill={farge} stroke="#ffffff" strokeWidth={4} />
            <Tekst x={x + dx} y={y + dy} farge={farge} anker={anker}>
                {navn}
            </Tekst>
        </motion.g>
    );
}

function Tekst({
    x,
    y,
    children,
    farge = '#0f172a',
    storrelse = 36,
    anker = 'middle',
}: {
    x: number;
    y: number;
    children: string;
    farge?: string;
    storrelse?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={storrelse}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={7}
            paintOrder="stroke"
        >
            {children}
        </text>
    );
}

/** Et lite skip (sett ovenfra) som seiler fram og tilbake langs en sjørute. */
function Skip({ punkter, p, forsinkelse }: { punkter: LngLat[]; p: P; forsinkelse: number }) {
    const xs = punkter.map((ll) => p(ll)[0]);
    const ys = punkter.map((ll) => p(ll)[1]);
    return (
        <motion.g
            initial={{ x: xs[0], y: ys[0], opacity: 0 }}
            animate={{ x: xs, y: ys, opacity: 1 }}
            transition={{
                duration: 6,
                delay: forsinkelse,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
            }}
        >
            <path
                d="M -18 -7 L 12 -7 L 22 0 L 12 7 L -18 7 Z"
                fill={BLA}
                stroke="#ffffff"
                strokeWidth={3}
            />
        </motion.g>
    );
}

function Rivaler({ beat, p, linje }: { beat: number; p: P; linje: (pts: LngLat[]) => string }) {
    const [rx, ry] = p(ROMA);
    // Romas område vokser utover halvøya fra byen (symbolsk, ikke en grense).
    const [sx, sy] = p([15.6, 40.3]);
    const midt: [number, number] = [(rx + sx) / 2, (ry + sy) / 2];
    const vinkel = (Math.atan2(sy - ry, sx - rx) * 180) / Math.PI;
    const lengde = Math.hypot(sx - rx, sy - ry);
    return (
        <>
            <g transform={`translate(${midt[0]} ${midt[1]}) rotate(${vinkel})`}>
                <motion.ellipse
                    rx={lengde * 0.75}
                    ry={lengde * 0.28}
                    fill={ROD}
                    initial={{ opacity: 0, scale: 0.2 }}
                    animate={{ opacity: 0.32, scale: 1 }}
                    transition={{ duration: 2.4, ease: 'easeOut' }}
                />
            </g>
            <By p={p} ll={ROMA} navn="Roma" farge={ROD} dx={-20} dy={-22} anker="end" />
            <By p={p} ll={KARTAGO} navn="Kartago" farge={BLA} dy={52} synlig={beat >= 1} />
            {beat >= 1 && (
                <motion.circle
                    cx={p(KARTAGO)[0]}
                    cy={p(KARTAGO)[1]}
                    fill="none"
                    stroke={BLA}
                    strokeWidth={4}
                    initial={{ r: 12, opacity: 0.9 }}
                    animate={{ r: 60, opacity: 0 }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                />
            )}
            {beat >= 2 &&
                SJORUTER.map((r, i) => (
                    <g key={i}>
                        <motion.path
                            d={linje(r)}
                            fill="none"
                            stroke={BLA}
                            strokeWidth={4}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5, delay: i * 0.3 }}
                            opacity={0.6}
                        />
                        <Skip punkter={r} p={p} forsinkelse={1 + i * 0.5} />
                    </g>
                ))}
            {beat >= 3 && <Tidsbjelke />}
        </>
    );
}

/** Tidslinje for punerkrigene, oppe til høyre i bildet. */
function Tidsbjelke() {
    const x0 = 880;
    const x1 = 1480;
    const y = 190;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <rect
                x={x0 - 30}
                y={y - 74}
                width={x1 - x0 + 60}
                height={112}
                rx={20}
                fill="#ffffff"
                opacity={0.92}
            />
            <line
                x1={x0}
                y1={y}
                x2={x1}
                y2={y}
                stroke="#cbd5e1"
                strokeWidth={16}
                strokeLinecap="round"
            />
            <motion.line
                x1={x0}
                y1={y}
                x2={x1}
                y2={y}
                stroke={ROD}
                strokeWidth={16}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.4, delay: 0.4, ease: 'easeInOut' }}
            />
            <Tekst x={x0} y={y - 26} anker="start">
                264 fvt.
            </Tekst>
            <Tekst x={x1} y={y - 26} anker="end">
                146 fvt.
            </Tekst>
        </motion.g>
    );
}

function Elefant({ x, y, skala = 1 }: { x: number; y: number; skala?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <ellipse
                cx={0}
                cy={0}
                rx={30}
                ry={20}
                fill="#64748b"
                stroke="#ffffff"
                strokeWidth={3}
            />
            <circle cx={28} cy={-12} r={14} fill="#64748b" stroke="#ffffff" strokeWidth={3} />
            <path
                d="M 38 -6 Q 48 10 40 24"
                stroke="#64748b"
                strokeWidth={7}
                fill="none"
                strokeLinecap="round"
            />
            <rect x={-22} y={12} width={9} height={18} fill="#64748b" />
            <rect x={12} y={12} width={9} height={18} fill="#64748b" />
        </g>
    );
}

function Fjell({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path d="M -30 18 L 0 -28 L 30 18 Z" fill="#94a3b8" stroke="#ffffff" strokeWidth={3} />
            <path d="M -10 -12 L 0 -28 L 10 -12 Z" fill="#ffffff" />
        </g>
    );
}

function Hannibal({ beat, p, linje }: { beat: number; p: P; linje: (pts: LngLat[]) => string }) {
    const [kx, ky] = p(KARTAGO);
    const [ix, iy] = p([12.2, 39.5]);
    const alpene = p([6.8, 45.0]);
    const pyr = p([1.6, 42.6]);
    const hode =
        beat >= 3
            ? p(RUTE_2[RUTE_2.length - 1])
            : beat >= 2
              ? p(RUTE_1[RUTE_1.length - 1])
              : p(SPANIA);
    return (
        <>
            <By p={p} ll={ROMA} navn="Roma" farge={ROD} dx={22} dy={10} anker="start" />
            <By p={p} ll={KARTAGO} navn="Kartago" farge={BLA} dy={52} />
            <By p={p} ll={SPANIA} navn="Spania" farge={BLA} dy={52} synlig={beat >= 2} />
            {beat === 1 && (
                <g>
                    <motion.path
                        d={`M ${kx} ${ky} Q ${(kx + ix) / 2 + 40} ${(ky + iy) / 2} ${ix} ${iy}`}
                        fill="none"
                        stroke={BLA}
                        strokeWidth={5}
                        strokeDasharray="14 12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                    />
                    <motion.g
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8, type: 'spring' }}
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                    >
                        <g stroke={ROD} strokeWidth={10} strokeLinecap="round">
                            <line
                                x1={(kx + ix) / 2 - 2}
                                y1={(ky + iy) / 2 - 38}
                                x2={(kx + ix) / 2 + 74}
                                y2={(ky + iy) / 2 + 38}
                            />
                            <line
                                x1={(kx + ix) / 2 + 74}
                                y1={(ky + iy) / 2 - 38}
                                x2={(kx + ix) / 2 - 2}
                                y2={(ky + iy) / 2 + 38}
                            />
                        </g>
                    </motion.g>
                </g>
            )}
            {beat >= 2 && (
                <motion.path
                    d={linje(RUTE_1)}
                    fill="none"
                    stroke={BLA}
                    strokeWidth={9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 3.5, ease: 'easeInOut' }}
                />
            )}
            {beat >= 2 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                >
                    <Fjell x={pyr[0]} y={pyr[1] - 10} />
                    <Tekst x={pyr[0] - 40} y={pyr[1] + 56} anker="end" storrelse={32}>
                        Pyreneene
                    </Tekst>
                </motion.g>
            )}
            {beat >= 3 && (
                <>
                    <motion.path
                        d={linje(RUTE_2)}
                        fill="none"
                        stroke={BLA}
                        strokeWidth={9}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 3, ease: 'easeInOut' }}
                    />
                    <Fjell x={alpene[0] - 40} y={alpene[1] - 40} />
                    <Fjell x={alpene[0] + 10} y={alpene[1] - 60} />
                    <Fjell x={alpene[0] + 60} y={alpene[1] - 44} />
                    <Tekst x={alpene[0] + 10} y={alpene[1] - 104} storrelse={34}>
                        Alpene
                    </Tekst>
                </>
            )}
            {beat >= 2 && (
                <motion.g
                    initial={false}
                    animate={{ x: hode[0], y: hode[1], opacity: 1 }}
                    transition={{ duration: 3.2, ease: 'easeInOut' }}
                >
                    <motion.g
                        animate={{ scale: beat >= 4 ? 0.55 : 1 }}
                        transition={{ duration: 1.6 }}
                    >
                        <Elefant x={0} y={40} skala={beat >= 4 ? 0.8 : 1.1} />
                    </motion.g>
                </motion.g>
            )}
            {beat >= 4 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <Tekst
                        x={p(RUTE_2[RUTE_2.length - 1])[0] + 10}
                        y={p(RUTE_2[RUTE_2.length - 1])[1] + 110}
                        farge={ROD}
                        storrelse={34}
                    >
                        Store tap
                    </Tekst>
                </motion.g>
            )}
        </>
    );
}

/** Legionene som Roma setter opp, én etter én, rundt byen. */
function Legioner({ p }: { p: P }) {
    const [antall, setAntall] = useState(0);
    const plasser = useMemo(
        () =>
            (
                [
                    [12.9, 42.9],
                    [13.9, 42.2],
                    [14.9, 41.5],
                    [11.6, 43.4],
                    [15.9, 40.9],
                    [13.0, 43.7],
                ] as LngLat[]
            ).map((ll) => p(ll)),
        [p]
    );
    useEffect(() => {
        const id = window.setInterval(() => setAntall((a) => Math.min(a + 1, 6)), 700);
        return () => window.clearInterval(id);
    }, []);
    return (
        <>
            {plasser.slice(0, antall).map(([x, y], i) => (
                <motion.rect
                    key={i}
                    x={x - 22}
                    y={y - 16}
                    width={44}
                    height={32}
                    rx={4}
                    fill={ROD}
                    stroke="#ffffff"
                    strokeWidth={3}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />
            ))}
        </>
    );
}

function Zama({ beat, p }: { beat: number; p: P }) {
    const hannibalPos = beat >= 2 ? p([10.2, 36.4]) : p(SOR_ITALIA);
    const [zx, zy] = p(ZAMA);
    return (
        <>
            <By p={p} ll={ROMA} navn="Roma" farge={ROD} dx={-22} dy={12} anker="end" />
            <By p={p} ll={KARTAGO} navn="Kartago" farge={BLA} dx={22} dy={-14} anker="start" />
            {beat >= 1 && <Legioner p={p} />}
            {beat >= 2 && (
                <motion.path
                    d={`M ${p(SOR_ITALIA).join(' ')} Q ${p([14.2, 37.0]).join(' ')} ${p([10.6, 37.0]).join(' ')}`}
                    fill="none"
                    stroke={BLA}
                    strokeWidth={5}
                    strokeDasharray="14 12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.75 }}
                    transition={{ duration: 0.8 }}
                />
            )}
            <motion.g
                initial={false}
                animate={{ x: hannibalPos[0], y: hannibalPos[1], opacity: beat >= 3 ? 0.35 : 1 }}
                transition={{ duration: 3, ease: 'easeInOut' }}
            >
                <rect
                    x={-24}
                    y={-17}
                    width={48}
                    height={34}
                    rx={4}
                    fill={BLA}
                    stroke="#ffffff"
                    strokeWidth={3}
                />
            </motion.g>
            <Tekst
                x={p(SOR_ITALIA)[0] + 40}
                y={p(SOR_ITALIA)[1] + 66}
                farge={BLA}
                anker="start"
                storrelse={32}
            >
                {beat >= 2 ? '' : 'Hannibal'}
            </Tekst>
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring' }}
                >
                    <g stroke={ROD} strokeWidth={9} strokeLinecap="round">
                        <line x1={zx - 26} y1={zy - 26} x2={zx + 26} y2={zy + 26} />
                        <line x1={zx + 26} y1={zy - 26} x2={zx - 26} y2={zy + 26} />
                    </g>
                    <Tekst x={zx} y={zy + 72} farge={ROD}>
                        Zama
                    </Tekst>
                </motion.g>
            )}
        </>
    );
}

function Mynt({ x, y, forsinkelse }: { x: number; y: number; forsinkelse: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: [-20, 6, 0] }}
            transition={{ duration: 0.8, delay: forsinkelse }}
        >
            <circle cx={x} cy={y} r={24} fill="#facc15" stroke="#854d0e" strokeWidth={5} />
        </motion.g>
    );
}

function Sulla({ beat, p }: { beat: number; p: P }) {
    const [rx, ry] = p(ROMA);
    const mariusPos = p([13.6, 42.9]);
    const sullaFra = p([14.9, 40.85]);
    const sullaPos = beat >= 3 ? [rx + 56, ry + 44] : sullaFra;
    return (
        <>
            <By p={p} ll={ROMA} navn="Roma" dx={-22} dy={12} anker="end" synlig />
            {/* To hærer: Marius (blå) og Sulla (rød). Plasseringene er symbolske. */}
            <motion.g
                initial={false}
                animate={{ x: mariusPos[0], y: mariusPos[1], opacity: beat >= 3 ? 0.4 : 1 }}
            >
                <rect
                    x={-34}
                    y={-24}
                    width={68}
                    height={48}
                    rx={6}
                    fill={BLA}
                    stroke="#ffffff"
                    strokeWidth={4}
                />
                <Tekst x={0} y={-40} farge={BLA}>
                    Marius
                </Tekst>
            </motion.g>
            {beat === 2 && (
                <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <rect
                        x={mariusPos[0] + 90}
                        y={mariusPos[1] - 50}
                        width={340}
                        height={110}
                        rx={14}
                        fill="#ffffff"
                        stroke={BLA}
                        strokeWidth={4}
                    />
                    <Tekst x={mariusPos[0] + 260} y={mariusPos[1] - 6} farge={BLA} storrelse={34}>
                        Hærkommandoen
                    </Tekst>
                    <Tekst x={mariusPos[0] + 260} y={mariusPos[1] + 38} storrelse={32}>
                        til Marius
                    </Tekst>
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.path
                    d={`M ${sullaFra[0]} ${sullaFra[1]} Q ${(sullaFra[0] + rx) / 2 + 60} ${(sullaFra[1] + ry) / 2} ${rx + 56} ${ry + 44}`}
                    fill="none"
                    stroke={ROD}
                    strokeWidth={14}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 3.2, ease: 'easeInOut' }}
                    opacity={0.9}
                />
            )}
            <motion.g
                initial={false}
                animate={{ x: sullaPos[0], y: sullaPos[1] }}
                transition={{ duration: 3.2, ease: 'easeInOut' }}
            >
                <rect
                    x={-34}
                    y={-24}
                    width={68}
                    height={48}
                    rx={6}
                    fill={ROD}
                    stroke="#ffffff"
                    strokeWidth={4}
                />
                <Tekst x={0} y={66} farge={ROD}>
                    {beat >= 4 ? 'Diktator Sulla' : 'Sulla'}
                </Tekst>
            </motion.g>
            {beat === 1 && (
                <>
                    <Mynt x={mariusPos[0] + 100} y={mariusPos[1] - 40} forsinkelse={0} />
                    <Mynt x={mariusPos[0] + 150} y={mariusPos[1] - 40} forsinkelse={0.9} />
                    <Mynt x={sullaFra[0] + 100} y={sullaFra[1] - 40} forsinkelse={0.4} />
                    <Mynt x={sullaFra[0] + 150} y={sullaFra[1] - 40} forsinkelse={1.3} />
                </>
            )}
        </>
    );
}
