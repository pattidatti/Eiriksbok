import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { Flate, TelleTall } from '../shared';

/**
 * Norgeskartet til sentraliseringsfilmen.
 * innvandring: mange har kommet fra Ukraina, og flere bosetter seg utenfor de store byene.
 * fylker: fylkene som har mistet størst andel av skolene, og Oslo og Akershus som har fått flere.
 * distrikt: statlige kontorer flyttet ut av Oslo, Finnmark og Nord-Troms, ferjene og skoletilskuddet.
 *
 * Kartet tegnes i 1600x900 inni en flate på 1000x562, så DOM-merkene kan plasseres med
 * de samme koordinatene ganger 0,625.
 */

type Modus = 'innvandring' | 'fylker' | 'distrikt';

const B = 1600;
const H = 900;
const K = 1000 / B;
const NORGE = 578;
const UKRAINA = 804;

const NORGE_UTSNITT: Utsnitt = [
    [3.5, 57.6],
    [31.5, 71.3],
];
const EUROPA: Utsnitt = [
    [-4, 45],
    [42, 71.5],
];

type LL = [number, number];
const OSLO: LL = [10.75, 59.91];

interface Merke {
    ll: LL;
    tekst: string;
    farge: string;
    side: 'h' | 'v';
    dy?: number;
}

const FYLKER: (Merke & { fraBeat: number })[] = [
    { ll: [25.0, 70.0], tekst: 'Finnmark', farge: '#dc2626', side: 'v', fraBeat: 1 },
    { ll: [14.6, 67.0], tekst: 'Nordland', farge: '#dc2626', side: 'v', fraBeat: 1 },
    { ll: [10.6, 61.5], tekst: 'Innlandet', farge: '#dc2626', side: 'h', fraBeat: 1 },
    {
        ll: [11.0, 59.95],
        tekst: 'Oslo og Akershus',
        farge: '#0d9488',
        side: 'h',
        dy: 26,
        fraBeat: 2,
    },
];

const KONTORER: Merke[] = [
    {
        ll: [12.21, 65.47],
        tekst: 'Brønnøysund: Brønnøysundregistrene',
        farge: '#7c3aed',
        side: 'h',
    },
    {
        ll: [5.85, 61.45],
        tekst: 'Førde: Lotteri- og stiftelsestilsynet',
        farge: '#7c3aed',
        side: 'h',
        dy: -30,
    },
];

/** Ferjesymboler langs kysten. En illustrasjon, ikke bestemte ferjestrekninger. */
const FERJER: LL[] = [
    [5.3, 59.3],
    [5.0, 60.7],
    [5.6, 62.3],
    [8.5, 63.6],
    [12.6, 66.2],
    [14.6, 68.2],
    [17.8, 69.3],
];

function useProjeksjon(utsnitt: Utsnitt, venstre: number, hoyre: number) {
    return useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [venstre, 40],
                    [hoyre, H - 30],
                ],
                { type: 'MultiPoint', coordinates: utsnitt } as never
            ),
        [utsnitt, venstre, hoyre]
    );
}

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute flex justify-center"
                style={{ top: 22, left: 470, right: 20 }}
            >
                <div className="rounded-2xl bg-white px-5 py-2 text-3xl font-display font-black text-slate-900 shadow-lg whitespace-nowrap">
                    {tekst}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

/** Et merke på kartet: prikk i SVG, tekst som DOM ved siden av. */
function MerkeTekst({
    x,
    y,
    m,
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    m: Merke;
    forsinkelse?: number;
}) {
    const left = x * K + (m.side === 'h' ? 22 : -22);
    const top = y * K + (m.dy ?? 0);
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse }}
            className="absolute"
            style={{ left, top, transform: `translate(${m.side === 'h' ? '0' : '-100%'}, -50%)` }}
        >
            <div
                className="rounded-xl bg-white/95 px-3 py-1 text-2xl font-black shadow-lg whitespace-nowrap"
                style={{ color: m.farge, borderLeft: `6px solid ${m.farge}` }}
            >
                {m.tekst}
            </div>
        </motion.div>
    );
}

function Panel({
    children,
    forsinkelse = 0.4,
}: {
    children: React.ReactNode;
    forsinkelse?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: forsinkelse }}
            className="absolute rounded-3xl bg-white/95 px-7 py-5 shadow-2xl"
            style={{ left: 560, top: 150, width: 410 }}
        >
            {children}
        </motion.div>
    );
}

function Kartflate({
    utsnitt,
    fint,
    farge,
    children,
}: {
    utsnitt: Utsnitt;
    fint: boolean;
    farge: (id: number) => string;
    children: (p: (ll: LL) => [number, number]) => React.ReactNode;
}) {
    const { geographies } = useFilmVerden(fint ? utsnitt : undefined);
    const proj = useProjeksjon(utsnitt, 20, 860);
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LL) => proj(ll) as [number, number];
    return (
        <svg
            viewBox={`0 0 ${B} ${H}`}
            className="absolute inset-0"
            style={{ width: 1000, height: 562 }}
        >
            {geographies.map((g, i) => (
                <path
                    key={`${g.id ?? 'x'}-${i}`}
                    d={sti(g as never) ?? undefined}
                    fill={farge(Number(g.id))}
                    stroke="#a8a29e"
                    strokeWidth={1}
                />
            ))}
            {children(p)}
        </svg>
    );
}

/* ---------- innvandring ---------- */

function Innvandring({ beat }: { beat: number }) {
    const proj = useProjeksjon(EUROPA, 20, 860);
    const p = (ll: LL) => proj(ll) as [number, number];
    const [x1, y1] = p([30.5, 50.2]);
    const [x2, y2] = p([10.2, 60.6]);
    const mx = (x1 + x2) / 2 + 40;
    const my = (y1 + y2) / 2 - 110;
    const titler = [
        'Noe bremser sentraliseringen',
        'Mange har kommet fra Ukraina',
        'Hvor bosetter innvandrerne seg?',
    ];
    return (
        <>
            <Kartflate
                utsnitt={EUROPA}
                fint={false}
                farge={(id) =>
                    id === NORGE ? '#fde68a' : id === UKRAINA && beat >= 1 ? '#bfdbfe' : '#e7e5e4'
                }
            >
                {() =>
                    beat >= 1 && (
                        <motion.path
                            d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth={14}
                            strokeLinecap="round"
                            initial={{ pathLength: beat === 1 ? 0 : 1 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.8, delay: 0.3 }}
                        />
                    )
                }
            </Kartflate>
            {beat >= 1 && (
                <>
                    <MerkeTekst
                        x={x1}
                        y={y1 + 50}
                        m={{ ll: [0, 0], tekst: 'Ukraina', farge: '#1d4ed8', side: 'h' }}
                        forsinkelse={0.2}
                    />
                    <MerkeTekst
                        x={x2}
                        y={y2 - 70}
                        m={{ ll: [0, 0], tekst: 'Norge', farge: '#b45309', side: 'v' }}
                        forsinkelse={1.6}
                    />
                </>
            )}
            <Panel>
                <div className="text-4xl font-black text-slate-900">Innvandring</div>
                <div className="text-2xl font-semibold text-slate-600 mt-1">
                    har gjort at sentraliseringen har gått saktere
                </div>
                {beat >= 2 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-4 flex flex-col gap-3"
                    >
                        <div className="rounded-2xl bg-slate-100 px-4 py-2 text-2xl font-bold text-slate-700">
                            De store byene
                        </div>
                        <div className="rounded-2xl bg-amber-100 px-4 py-2 text-2xl font-black text-amber-900">
                            Utenfor de store byene: flere innvandrere enn før
                        </div>
                    </motion.div>
                )}
            </Panel>
            <Overskrift tekst={titler[Math.min(beat, 2)]} />
        </>
    );
}

/* ---------- fylker ---------- */

function Fylker({ beat }: { beat: number }) {
    const proj = useProjeksjon(NORGE_UTSNITT, 20, 860);
    const p = (ll: LL) => proj(ll) as [number, number];
    const titler = [
        'Hvor forsvinner skolene?',
        'Størst andel skoler borte',
        'Flere skoler enn før',
    ];
    return (
        <>
            <Kartflate
                utsnitt={NORGE_UTSNITT}
                fint
                farge={(id) => (id === NORGE ? '#fdf4e3' : '#e7e5e4')}
            >
                {() =>
                    FYLKER.filter((f) => f.fraBeat <= beat).map((f) => {
                        const [x, y] = p(f.ll);
                        return (
                            <motion.circle
                                key={f.tekst}
                                cx={x}
                                cy={y}
                                fill={f.farge}
                                fillOpacity={0.35}
                                stroke={f.farge}
                                strokeWidth={5}
                                initial={{ r: 0 }}
                                animate={{ r: f.fraBeat === 2 ? 34 : 48 }}
                                transition={{ duration: 0.8 }}
                            />
                        );
                    })
                }
            </Kartflate>
            {FYLKER.filter((f) => f.fraBeat <= beat).map((f, i) => {
                const [x, y] = p(f.ll);
                const xx = x + (f.side === 'h' ? 40 : -40);
                return (
                    <MerkeTekst
                        key={f.tekst}
                        x={xx}
                        y={y}
                        m={f}
                        forsinkelse={0.3 + (f.fraBeat === beat ? i * 0.5 : 0)}
                    />
                );
            })}
            {beat >= 1 && (
                <Panel forsinkelse={1.6}>
                    <div className="flex items-center gap-3">
                        <div
                            className="rounded-full"
                            style={{ width: 26, height: 26, background: '#dc2626' }}
                        />
                        <div className="text-2xl font-bold text-slate-800">
                            mistet størst andel av skolene
                        </div>
                    </div>
                    {beat >= 2 && (
                        <div className="flex items-center gap-3 mt-3">
                            <div
                                className="rounded-full"
                                style={{ width: 26, height: 26, background: '#0d9488' }}
                            />
                            <div className="text-2xl font-bold text-slate-800">
                                flere skoler enn for 15 år siden, fordi elevtallet har økt
                            </div>
                        </div>
                    )}
                </Panel>
            )}
            <Overskrift tekst={titler[Math.min(beat, 2)]} />
        </>
    );
}

/* ---------- distrikt ---------- */

function Ferje() {
    return (
        <g>
            <path d="M-16,0 L16,0 L11,9 L-11,9 Z" fill="#0f766e" />
            <rect
                x={-8}
                y={-8}
                width={14}
                height={8}
                fill="#f8fafc"
                stroke="#0f766e"
                strokeWidth={2}
            />
        </g>
    );
}

function Distrikt({ beat }: { beat: number }) {
    const proj = useProjeksjon(NORGE_UTSNITT, 20, 860);
    const p = (ll: LL) => proj(ll) as [number, number];
    const [ox, oy] = p(OSLO);
    const titler = [
        'Distriktspolitikk',
        'Statlige kontorer ut av Oslo',
        'Finnmark og Nord-Troms',
        'Et annet tiltak: ferja',
        'Penger til hver skole',
    ];
    // Finnmark og Nord-Troms som et omtrentlig felt.
    const nordFelt = [
        [20.0, 69.3],
        [22.5, 70.3],
        [25.5, 71.1],
        [29.5, 70.8],
        [31.0, 70.0],
        [29.0, 69.0],
        [25.0, 68.6],
        [21.0, 68.9],
    ].map((ll) => p(ll as LL));
    return (
        <>
            <Kartflate
                utsnitt={NORGE_UTSNITT}
                fint
                farge={(id) => (id === NORGE ? '#fdf4e3' : '#e7e5e4')}
            >
                {() => (
                    <>
                        {beat === 1 &&
                            KONTORER.map((k, i) => {
                                const [x, y] = p(k.ll);
                                const mx = (ox + x) / 2 + (i ? -80 : 110);
                                const my = (oy + y) / 2;
                                return (
                                    <g key={k.tekst}>
                                        <motion.path
                                            d={`M${ox},${oy} Q${mx},${my} ${x},${y}`}
                                            fill="none"
                                            stroke="#7c3aed"
                                            strokeWidth={8}
                                            strokeLinecap="round"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 1.4, delay: 0.4 + i * 1.6 }}
                                        />
                                        <circle cx={x} cy={y} r={13} fill="#7c3aed" />
                                    </g>
                                );
                            })}
                        {beat === 2 && (
                            <motion.path
                                d={`M${nordFelt.map((q) => q.join(',')).join(' L')} Z`}
                                fill="#f59e0b"
                                fillOpacity={0.45}
                                stroke="#b45309"
                                strokeWidth={4}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8 }}
                            />
                        )}
                        {beat === 3 &&
                            FERJER.map((ll, i) => {
                                const [x, y] = p(ll);
                                return (
                                    <motion.g
                                        key={i}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 + i * 0.3 }}
                                    >
                                        <g transform={`translate(${x - 26},${y}) scale(1.6)`}>
                                            <Ferje />
                                        </g>
                                    </motion.g>
                                );
                            })}
                        <circle cx={ox} cy={oy} r={14} fill="#1e293b" />
                    </>
                )}
            </Kartflate>
            <MerkeTekst
                x={ox + 10}
                y={oy + 30}
                m={{ ll: OSLO, tekst: 'Oslo', farge: '#1e293b', side: 'h' }}
            />
            {beat === 1 &&
                KONTORER.map((k, i) => {
                    const [x, y] = p(k.ll);
                    return (
                        <MerkeTekst
                            key={k.tekst}
                            x={x + 6}
                            y={y}
                            m={k}
                            forsinkelse={1.6 + i * 1.6}
                        />
                    );
                })}
            {beat === 0 && (
                <Panel>
                    <div className="text-3xl font-black text-slate-900 leading-tight">
                        Det staten gjør for at folk skal kunne bo godt i hele landet
                    </div>
                    <div className="mt-4 rounded-2xl bg-amber-100 px-4 py-2 text-2xl font-bold text-amber-900">
                        Etter andre verdenskrig: penger, jobber og tilbud fordeles
                    </div>
                </Panel>
            )}
            {beat === 2 && (
                <Panel forsinkelse={0.8}>
                    <div className="text-2xl font-bold text-slate-500">
                        For dem som bor i Finnmark og Nord-Troms
                    </div>
                    <div className="mt-2 text-3xl font-black text-slate-900">Gratis barnehage</div>
                    <div className="text-3xl font-black text-slate-900">
                        Noe av studielånet slettet
                    </div>
                    <div className="mt-2 text-xl font-semibold text-slate-500">
                        Feltet på kartet er omtrentlig
                    </div>
                </Panel>
            )}
            {beat === 3 && (
                <Panel forsinkelse={1}>
                    <div className="text-3xl font-black text-slate-900">
                        Billigere og gratis ferje
                    </div>
                    <div className="mt-2 text-xl font-semibold text-slate-500">
                        Ferjene på kartet er bare en tegning
                    </div>
                </Panel>
            )}
            {beat === 4 && (
                <Panel>
                    <div className="text-2xl font-bold text-slate-600">
                        Tilskudd per kommunal grunnskole
                    </div>
                    <div className="mt-3 flex items-baseline gap-3">
                        <span className="text-2xl font-bold text-slate-500">2022</span>
                        <span className="text-3xl font-black text-slate-700 tabular-nums whitespace-nowrap">
                            <TelleTall verdi={500000} /> kr
                        </span>
                    </div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.4 }}
                        className="mt-2 flex items-baseline gap-3"
                    >
                        <span className="text-2xl font-bold text-slate-500">2026</span>
                        <span className="text-3xl font-black text-red-700 whitespace-nowrap">
                            drøyt 580 000 kr
                        </span>
                    </motion.div>
                </Panel>
            )}
            <Overskrift tekst={titler[Math.min(beat, 4)]} />
        </>
    );
}

export function SentraliseringKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'fylker';
    return (
        <Flate bakgrunn="#cfe8f7">
            {modus === 'innvandring' && <Innvandring beat={beat} />}
            {modus === 'fylker' && <Fylker beat={beat} />}
            {modus === 'distrikt' && <Distrikt beat={beat} />}
        </Flate>
    );
}
