import { useMemo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';
import { Brikke } from './Brikke';

/**
 * Pilegrimsleden i Norge.
 * «intro»: leden tegnes opp gjennom Gudbrandsdalen, og en vandrer går et stykke.
 * «nidaros»: Nidarosdomen sett ovenfra med 28 altere, der 26 blir borte. Så leden igjen,
 * 643 km og opptil 32 dager, og til slutt to kort: Mekka (stedet) mot leden (gåingen).
 * «idag»: Trondheim med tallet 1793, stolper for året før og i fjor, og hvem som går.
 */

type Modus = 'intro' | 'nidaros' | 'idag';

const B = 1600;
const H = 900;
const UTSNITT: Utsnitt = [
    [4.6, 57.9],
    [14.5, 64.3],
];

/** Gudbrandsdalsleden, forenklet: Oslo, opp dalen, over fjellet og ned til Trondheim. */
const LEDEN: [number, number][] = [
    [10.75, 59.91],
    [10.95, 60.4],
    [11.07, 60.79],
    [10.47, 61.12],
    [9.95, 61.5],
    [9.54, 61.77],
    [9.12, 62.07],
    [9.6, 62.25],
    [9.69, 62.59],
    [10.05, 63.0],
    [10.4, 63.43],
];

function punktPaa(linje: [number, number][], f: number): [number, number] {
    const lengder = linje.slice(1).map((p, i) => Math.hypot(p[0] - linje[i][0], p[1] - linje[i][1]));
    const total = lengder.reduce((a, b) => a + b, 0);
    let igjen = Math.max(0, Math.min(1, f)) * total;
    for (let i = 0; i < lengder.length; i++) {
        if (igjen <= lengder[i]) {
            const k = lengder[i] ? igjen / lengder[i] : 0;
            return [
                linje[i][0] + (linje[i + 1][0] - linje[i][0]) * k,
                linje[i][1] + (linje[i + 1][1] - linje[i][1]) * k,
            ];
        }
        igjen -= lengder[i];
    }
    return linje[linje.length - 1];
}

function Vandrer({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle r={26} fill="#f59e0b" stroke="#fff" strokeWidth={5} />
            <circle cx={0} cy={-8} r={6} fill="#fff" />
            <path d="M -7 -1 L 7 -1 L 4 14 L -4 14 Z" fill="#fff" />
            <line x1={10} y1={-12} x2={14} y2={16} stroke="#fff" strokeWidth={3} />
        </g>
    );
}

const TEKST: Record<Modus, string[]> = {
    intro: ['Gudbrandsdalen, på vei mot Trondheim', 'Rundt 20 km om dagen', 'Ingen har bedt dem om det'],
    nidaros: [
        'Reformasjonen: slutt på valfarten til helgenene',
        'Nidarosdomen: 26 av 28 altere fjernet',
        'Gudbrandsdalsleden: 643 km',
        'Opptil 32 dager',
        'Hva er poenget?',
    ],
    idag: [
        'Kirkelige røtter, åpen for alle',
        'Framme ved pilegrimsmottaket i 2025',
        'Fra nesten 40 land',
        'Hvem går?',
    ],
};

function Kort({ children, x, y, w }: { children: ReactNode; x: string; y: string; w: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute rounded-2xl bg-white/95 shadow-xl px-6 py-4"
            style={{ left: x, top: y, width: `${w}%` }}
        >
            {children}
        </motion.div>
    );
}

/** Nidarosdomen ovenfra, forenklet, med 28 altere langs veggene. 26 blir borte. */
function Domen({ fjernet }: { fjernet: boolean }) {
    const altere = useMemo(() => {
        const liste: [number, number][] = [];
        for (let i = 0; i < 7; i++) liste.push([380 + i * 80, 300], [380 + i * 80, 600]);
        for (let i = 0; i < 3; i++) liste.push([860, 160 + i * 60], [860, 620 + i * 60]);
        for (let i = 0; i < 4; i++) liste.push([1000 + i * 90, 330], [1000 + i * 90, 570]);
        liste.push([1320, 400], [1320, 500]);
        return liste;
    }, []);
    const igjen = new Set([20, 26]);
    return (
        <g>
            {/* Skipet, tverrskipet og koret */}
            <path
                d="M 330 270 L 820 270 L 820 120 L 920 120 L 920 270 L 1300 270 Q 1400 450 1300 630 L 920 630 L 920 780 L 820 780 L 820 630 L 330 630 Z"
                fill="#e7e5e4"
                stroke="#57534e"
                strokeWidth={8}
            />
            <text x={575} y={470} textAnchor="middle" fontSize={40} fontWeight={800} fill="#78716c">
                Nidarosdomen
            </text>
            {altere.map(([x, y], i) => {
                const borte = fjernet && !igjen.has(i);
                return (
                    <motion.rect
                        key={i}
                        x={x - 18}
                        y={y - 18}
                        width={36}
                        height={36}
                        rx={6}
                        initial={false}
                        animate={{ opacity: borte ? 0.2 : 1 }}
                        transition={{ duration: 0.6, delay: borte ? (i % 13) * 0.08 : 0 }}
                        fill={borte ? '#a8a29e' : '#d97706'}
                        stroke={borte ? '#78716c' : '#78350f'}
                        strokeWidth={3}
                        strokeDasharray={borte ? '6 5' : undefined}
                    />
                );
            })}
        </g>
    );
}

export function PilegrimLeden({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'intro';
    const { geographies } = useFilmVerden(UTSNITT);
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 40],
                    [860, H - 40],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: [number, number]) => projeksjon(ll) as [number, number];
    const leden = sti({ type: 'LineString', coordinates: LEDEN } as never) ?? '';
    const liste = TEKST[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];

    const domen = modus === 'nidaros' && beat <= 1;
    const visKart = !domen;
    // Hvor langt vandreren har kommet (andel av leden).
    const andel =
        modus === 'intro' ? (beat >= 1 ? 0.35 : 0) : modus === 'nidaros' ? (beat >= 3 ? 1 : 0) : 1;
    const kf = useMemo(() => {
        const n = 16;
        const xs: number[] = [];
        const ys: number[] = [];
        for (let i = 0; i <= n; i++) {
            const [x, y] = p(punktPaa(LEDEN, (andel * i) / n));
            xs.push(x);
            ys.push(y);
        }
        return { xs, ys };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [andel, projeksjon]);
    const oslo = p([10.75, 59.91]);
    const trondheim = p([10.4, 63.43]);
    const dalen = p([9.75, 61.62]);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#cfe3f3' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {visKart && (
                    <g>
                        {geographies.map((g, i) => (
                            <path
                                key={`${g.id ?? 'x'}-${i}`}
                                d={sti(g as never) ?? undefined}
                                fill={Number(g.id) === 578 ? '#e9f0dc' : '#efe9dc'}
                                stroke="#a8a29e"
                                strokeWidth={1.2}
                            />
                        ))}
                        <motion.path
                            key={`${modus}-leden`}
                            d={leden}
                            fill="none"
                            stroke="#b45309"
                            strokeWidth={9}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: modus === 'idag' ? 1 : 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2.2 }}
                        />
                        <circle cx={oslo[0]} cy={oslo[1]} r={12} fill="#0f172a" />
                        <text
                            x={oslo[0] + 20}
                            y={oslo[1] + 12}
                            fontSize={38}
                            fontWeight={900}
                            fill="#0f172a"
                            stroke="#fff"
                            strokeWidth={8}
                            paintOrder="stroke"
                        >
                            Oslo
                        </text>
                        <circle cx={trondheim[0]} cy={trondheim[1]} r={modus === 'idag' ? 20 : 12} fill="#0f172a" />
                        <text
                            x={trondheim[0] + 26}
                            y={trondheim[1] + 12}
                            fontSize={38}
                            fontWeight={900}
                            fill="#0f172a"
                            stroke="#fff"
                            strokeWidth={8}
                            paintOrder="stroke"
                        >
                            Trondheim
                        </text>
                        {modus !== 'idag' && (
                            <text
                                x={dalen[0] + 40}
                                y={dalen[1] + 14}
                                fontSize={32}
                                fontWeight={800}
                                fontStyle="italic"
                                fill="#78350f"
                                stroke="#fff"
                                strokeWidth={7}
                                paintOrder="stroke"
                            >
                                Gudbrandsdalen
                            </text>
                        )}
                        {modus !== 'idag' && (
                            <motion.g
                                key={`${modus}-${andel}`}
                                initial={{ x: kf.xs[0], y: kf.ys[0] }}
                                animate={{ x: kf.xs, y: kf.ys }}
                                transition={{ duration: andel > 0.5 ? 5 : 3, ease: 'linear' }}
                            >
                                <Vandrer x={0} y={0} />
                            </motion.g>
                        )}
                    </g>
                )}
                {domen && <Domen fjernet={beat >= 1} />}
            </svg>

            <AnimatePresence>
                {modus === 'intro' && beat >= 1 && (
                    <Kort key="dag" x="60%" y="30%" w={34}>
                        <div className="text-6xl font-black text-amber-700 tabular-nums">
                            ca. <TelleTall verdi={20} /> km
                        </div>
                        <div className="text-2xl font-semibold text-slate-600">om dagen</div>
                        <div className="mt-3 text-3xl font-bold text-slate-900">i opptil en måned</div>
                    </Kort>
                )}
                {modus === 'intro' && beat >= 2 && (
                    <Kort key="plikt" x="60%" y="64%" w={34}>
                        <div className="text-4xl font-black text-slate-900">Ingen plikt</div>
                    </Kort>
                )}
                {domen && (
                    <Kort key="altre" x="66%" y="74%" w={30}>
                        <div className="text-3xl font-black text-slate-900 tabular-nums">
                            {beat >= 1 ? '26 av 28 fjernet' : '28 altere'}
                        </div>
                        <div className="text-xl font-semibold text-slate-500">
                            Skisse, plasseringen er tenkt
                        </div>
                    </Kort>
                )}
                {modus === 'nidaros' && beat >= 2 && beat <= 3 && (
                    <Kort key="km" x="60%" y="30%" w={34}>
                        <div className="text-6xl font-black text-amber-700 tabular-nums">
                            <TelleTall verdi={643} /> km
                        </div>
                        <div className="text-2xl font-semibold text-slate-600">fra Oslo til Trondheim</div>
                        {beat >= 3 && (
                            <div className="mt-3 text-4xl font-black text-slate-900 tabular-nums">
                                opptil <TelleTall verdi={32} varighet={4} /> dager
                            </div>
                        )}
                    </Kort>
                )}
                {modus === 'nidaros' && beat >= 4 && (
                    <motion.div
                        key="mot"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute flex gap-4"
                        style={{ left: '56%', top: '22%', width: '40%' }}
                    >
                        <div className="flex-1 rounded-2xl bg-white/95 shadow-xl px-4 py-4 text-center">
                            <div className="mx-auto mb-3" style={{ width: 70, height: 84, background: '#111', borderTop: '10px solid #111', boxShadow: 'inset 0 18px 0 #d4a017' }} />
                            <div className="text-3xl font-black text-slate-900">Mekka</div>
                            <div className="text-2xl font-semibold text-slate-600">det som skjer på stedet</div>
                        </div>
                        <div className="flex-1 rounded-2xl bg-white/95 shadow-xl px-4 py-4 text-center">
                            <div className="mx-auto mb-3 flex items-end justify-center gap-2" style={{ height: 84 }}>
                                {[0, 1, 2, 3].map((k) => (
                                    <div
                                        key={k}
                                        className="rounded-full bg-amber-600"
                                        style={{ width: 16, height: 26, marginBottom: k % 2 ? 26 : 0 }}
                                    />
                                ))}
                            </div>
                            <div className="text-3xl font-black text-slate-900">Leden</div>
                            <div className="text-2xl font-semibold text-slate-600">selve gåingen</div>
                        </div>
                    </motion.div>
                )}
                {modus === 'idag' && beat === 0 && (
                    <Kort key="rot" x="58%" y="30%" w={38}>
                        <div className="text-3xl font-black text-slate-900">En satsing fra staten</div>
                        <div className="mt-2 text-2xl font-semibold text-slate-600">
                            Røtter i kirken, men åpen for alle, uansett tro
                        </div>
                    </Kort>
                )}
                {modus === 'idag' && beat === 1 && (
                    <Kort key="tall" x="58%" y="24%" w={38}>
                        <div className="text-6xl font-black text-amber-700 tabular-nums">
                            <TelleTall verdi={1793} />
                        </div>
                        <div className="text-2xl font-semibold text-slate-600">
                            framme ved pilegrimsmottaket i Trondheim i 2025
                        </div>
                        <div className="mt-4 flex items-end gap-6" style={{ height: 180 }}>
                            <div className="flex flex-col items-center justify-end h-full">
                                <div className="rounded-t-lg bg-slate-400" style={{ width: 90, height: 140 }} />
                                <div className="text-xl font-bold text-slate-500 mt-1">året før</div>
                            </div>
                            <div className="flex flex-col items-center justify-end h-full">
                                <motion.div
                                    className="rounded-t-lg bg-amber-600"
                                    initial={{ height: 140 }}
                                    animate={{ height: 158 }}
                                    transition={{ duration: 1.2, delay: 0.6 }}
                                    style={{ width: 90 }}
                                />
                                <div className="text-xl font-bold text-slate-900 mt-1">2025</div>
                            </div>
                            <div className="text-4xl font-black text-amber-700 pb-10 whitespace-nowrap">+13 %</div>
                        </div>
                    </Kort>
                )}
                {modus === 'idag' && beat === 2 && (
                    <Kort key="land" x="58%" y="30%" w={38}>
                        <div className="text-6xl font-black text-amber-700">nesten 40</div>
                        <div className="text-2xl font-semibold text-slate-600">
                            land har vandrerne kommet fra de siste årene
                        </div>
                    </Kort>
                )}
                {modus === 'idag' && beat >= 3 && (
                    <motion.div
                        key="hvem"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute flex flex-col gap-3"
                        style={{ left: '58%', top: '22%', width: '38%' }}
                    >
                        {['Turfolk', 'Kulturinteresserte', 'Dem som søker en indre reise'].map((t, i) => (
                            <motion.div
                                key={t}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.5 }}
                                className="rounded-2xl bg-white/95 shadow-xl px-5 py-3 flex items-center gap-4"
                            >
                                <div className="rounded-full bg-amber-500 shrink-0" style={{ width: 40, height: 40 }} />
                                <div className="text-3xl font-black text-slate-900">{t}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
            <Brikke tekst={tekst} nokkel={`${modus}-${beat}`} />
        </div>
    );
}
