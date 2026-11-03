import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Makten i Roma. «graf»: artikkelens anslag over hvor mye makt senatet hadde (44 fvt. til
 * 14 evt.), ett punkt om gangen. «titler»: fra konge (som romerne hatet) til Augustus.
 * «pris»: vekta mellom fred og frihet, og borgere som blir undersåtter.
 */

type Modus = 'graf' | 'titler' | 'pris';

interface Notat {
    tittel: string;
    tekst: string;
}

export function AugustusMakt({
    beat,
    props,
}: VisualProps<{ modus?: Modus; antall?: number[]; notater?: (Notat | null)[] }>) {
    const modus = props.modus ?? 'graf';
    if (modus === 'titler') return <Titler beat={beat} />;
    if (modus === 'pris') return <Pris beat={beat} />;
    const antall = props.antall ?? [5];
    return (
        <Graf
            antall={antall[Math.min(beat, antall.length - 1)]}
            notat={props.notater?.[beat] ?? null}
        />
    );
}

// ---------------------------------------------------------------- graf

/** Punktene fra artikkelens graf «Maktbalansen i Roma». */
const PUNKTER = [
    { ar: -44, makt: 80, aar: '44 fvt.', tekst: 'Før Cæsar dør' },
    { ar: -43, makt: 40, aar: '43 fvt.', tekst: 'Tre menn deler makten' },
    { ar: -31, makt: 20, aar: '31 fvt.', tekst: 'Actium: Octavius tar kontrollen' },
    { ar: -27, makt: 10, aar: '27 fvt.', tekst: 'Augustus beholder all makt' },
    { ar: 14, makt: 5, aar: '14 evt.', tekst: 'Senatet gir i praksis bare råd' },
];

const X0 = 230;
const X1 = 1430;
const Y0 = 770; // 0 %
const Y1 = 210; // 100 %
const gx = (ar: number) => X0 + ((ar + 44) / 58) * (X1 - X0);
const gy = (m: number) => Y0 - (m / 100) * (Y0 - Y1);

function Graf({ antall, notat }: { antall: number; notat: Notat | null }) {
    const vis = PUNKTER.slice(0, antall);
    const siste = vis[vis.length - 1];
    const kort: Notat = notat
        ? notat
        : siste
          ? { tittel: siste.aar, tekst: siste.tekst }
          : { tittel: '15. mars 44 fvt.', tekst: 'Cæsar blir drept i senatet' };
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#fbf7ef' }}>
            <svg
                viewBox="0 0 1600 900"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <text
                    x={800}
                    y={92}
                    textAnchor="middle"
                    fontSize={50}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    Hvor mye makt hadde senatet?
                </text>
                <text
                    x={800}
                    y={140}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={600}
                    fill="#64748b"
                >
                    Et anslag fra artikkelen, ikke målt
                </text>
                {/* Akser */}
                {[0, 50, 100].map((m) => (
                    <g key={m}>
                        <line
                            x1={X0}
                            x2={X1}
                            y1={gy(m)}
                            y2={gy(m)}
                            stroke="#e2d8c3"
                            strokeWidth={2}
                        />
                        <text
                            x={X0 - 22}
                            y={gy(m) + 10}
                            textAnchor="end"
                            fontSize={28}
                            fontWeight={700}
                            fill="#64748b"
                        >
                            {m} %
                        </text>
                    </g>
                ))}
                <line x1={X0} x2={X1} y1={Y0} y2={Y0} stroke="#475569" strokeWidth={4} />
                <text
                    x={X0}
                    y={Y0 + 50}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={800}
                    fill="#475569"
                >
                    44 fvt.
                </text>
                <text
                    x={X1}
                    y={Y0 + 50}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={800}
                    fill="#475569"
                >
                    14 evt.
                </text>

                {/* Linja tegnes fram ett stykke om gangen */}
                {vis.slice(1).map((q, i) => {
                    const a = vis[i];
                    return (
                        <motion.line
                            key={q.ar}
                            x1={gx(a.ar)}
                            y1={gy(a.makt)}
                            x2={gx(q.ar)}
                            y2={gy(q.makt)}
                            stroke="#7c2d12"
                            strokeWidth={8}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, ease: 'easeInOut' }}
                        />
                    );
                })}
                {vis.map((q, i) => (
                    <motion.g
                        key={q.ar}
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            delay: i === vis.length - 1 && i > 0 ? 1 : 0,
                            type: 'spring',
                            stiffness: 220,
                            damping: 16,
                        }}
                        style={{ transformOrigin: `${gx(q.ar)}px ${gy(q.makt)}px` }}
                    >
                        <circle
                            cx={gx(q.ar)}
                            cy={gy(q.makt)}
                            r={16}
                            fill={q === siste ? '#b91c1c' : '#7c2d12'}
                            stroke="#fff"
                            strokeWidth={4}
                        />
                        <text
                            x={gx(q.ar) + (i === 0 ? -26 : 26)}
                            y={gy(q.makt) - 22}
                            textAnchor={i === 0 ? 'end' : 'start'}
                            fontSize={34}
                            fontWeight={900}
                            fill="#7c2d12"
                        >
                            {q.makt} %
                        </text>
                    </motion.g>
                ))}
            </svg>
            {/* Forklaringen til det nyeste punktet, eller dagen Cæsar ble drept */}
            <div
                className="absolute inset-0 flex items-center justify-end pointer-events-none"
                style={{ paddingRight: '6%' }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={kort.tittel + kort.tekst}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            delay: siste ? 0.8 : 0,
                            type: 'spring',
                            stiffness: 160,
                            damping: 20,
                        }}
                        className="rounded-2xl bg-white shadow-2xl px-6 py-4 border-l-[10px]"
                        style={{ borderColor: '#b91c1c', maxWidth: '36%' }}
                    >
                        <div className="text-3xl font-black text-red-700">{kort.tittel}</div>
                        <div className="text-2xl font-bold text-slate-800 mt-1">{kort.tekst}</div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------- titler

const TITLER = [
    { navn: 'KONGE', betyr: 'Ordet romerne hatet', nei: true },
    { navn: 'PRINCEPS SENATUS', betyr: 'senatets førstemann' },
    { navn: 'PRINSIPATET', betyr: 'den første tiden med keisere' },
    { navn: 'AUGUSTUS', betyr: 'den opphøyde, januar 27 fvt.' },
];

function Titler({ beat }: { beat: number }) {
    const nå = TITLER[Math.min(beat, TITLER.length - 1)];
    return (
        <Flate bakgrunn="#1c1917">
            <div className="absolute inset-x-0 flex justify-center" style={{ top: 110 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={nå.navn}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 150, damping: 18 }}
                        className="flex flex-col items-center"
                    >
                        <div className="flex items-center" style={{ gap: 28 }}>
                            <div
                                className="font-black text-amber-200"
                                style={{
                                    fontSize: nå.navn.length > 12 ? 62 : 84,
                                    letterSpacing: 6,
                                    fontFamily: 'Georgia, serif',
                                }}
                            >
                                {nå.navn}
                            </div>
                            {nå.nei && <Kryss />}
                        </div>
                        <div
                            className="font-bold text-stone-200"
                            style={{ fontSize: 32, marginTop: 14 }}
                        >
                            {nå.betyr}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
            {/* Veien fra konge til Augustus */}
            <div
                className="absolute inset-x-0 flex justify-center items-center"
                style={{ bottom: 70, gap: 14 }}
            >
                {TITLER.map((t, i) => (
                    <div key={t.navn} className="flex items-center" style={{ gap: 14 }}>
                        {i > 0 && (
                            <motion.div
                                className="text-amber-300 font-black"
                                style={{ fontSize: 30 }}
                                initial={false}
                                animate={{ opacity: beat >= i ? 1 : 0 }}
                            >
                                →
                            </motion.div>
                        )}
                        <motion.div
                            initial={false}
                            animate={{
                                opacity: beat >= i ? (beat === i ? 1 : 0.6) : 0,
                                y: beat >= i ? 0 : 12,
                            }}
                            className="rounded-xl font-black flex items-center"
                            style={{
                                fontSize: 20,
                                padding: '8px 14px',
                                gap: 8,
                                background: beat === i ? '#fbbf24' : '#44403c',
                                color: beat === i ? '#1c1917' : '#e7e5e4',
                            }}
                        >
                            {t.navn}
                            {t.nei && <span style={{ color: '#ef4444' }}>✕</span>}
                        </motion.div>
                    </div>
                ))}
            </div>
        </Flate>
    );
}

function Kryss() {
    return (
        <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 14 }}
            className="rounded-full bg-red-600 flex items-center justify-center text-white font-black"
            style={{ width: 84, height: 84, fontSize: 56 }}
        >
            ✕
        </motion.div>
    );
}

// ---------------------------------------------------------------- pris

const VEKT_X = 430;
const VEKT_Y = 300;
const ARM = 230;

function Pris({ beat }: { beat: number }) {
    // Fred veier tyngst: armen vippes ned på fred-siden.
    const vinkel = (14 * Math.PI) / 180;
    const vx = VEKT_X - ARM * Math.cos(vinkel);
    const vy = VEKT_Y + ARM * Math.sin(vinkel);
    const hx = VEKT_X + ARM * Math.cos(vinkel);
    const hy = VEKT_Y - ARM * Math.sin(vinkel);
    const undersatt = beat >= 2;
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f5efe3' }}>
            <svg
                viewBox="0 0 1600 900"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Vekta */}
                <rect x={VEKT_X - 12} y={VEKT_Y} width={24} height={420} fill="#78350f" />
                <rect x={VEKT_X - 120} y={720} width={240} height={28} rx={8} fill="#78350f" />
                <motion.line
                    initial={{ x1: VEKT_X - ARM, y1: VEKT_Y, x2: VEKT_X + ARM, y2: VEKT_Y }}
                    animate={{ x1: vx, y1: vy, x2: hx, y2: hy }}
                    transition={{ delay: 0.8, duration: 1.6, ease: 'easeInOut' }}
                    stroke="#78350f"
                    strokeWidth={14}
                    strokeLinecap="round"
                />
                <circle cx={VEKT_X} cy={VEKT_Y} r={18} fill="#ca8a04" />
                <Skal
                    fraX={VEKT_X - ARM}
                    fraY={VEKT_Y}
                    tilX={vx}
                    tilY={vy}
                    tekst="FRED"
                    farge="#ca8a04"
                />
                <Skal
                    fraX={VEKT_X + ARM}
                    fraY={VEKT_Y}
                    tilX={hx}
                    tilY={hy}
                    tekst="FRIHET"
                    farge="#2563eb"
                    tom
                />

                {/* Folket */}
                <text
                    x={1150}
                    y={150}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill={undersatt ? '#7c2d12' : '#1d4ed8'}
                >
                    {beat >= 2 ? 'Undersåtter' : beat >= 1 ? 'Borgere' : ''}
                </text>
                <text
                    x={1150}
                    y={196}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={700}
                    fill="#475569"
                >
                    {beat >= 2
                        ? 'gjør det keiseren bestemmer'
                        : beat >= 1
                          ? 'med på å styre seg selv'
                          : ''}
                </text>
                {undersatt && (
                    <motion.g
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <Laurbaer x={1150} y={300} />
                    </motion.g>
                )}
                {beat >= 1 &&
                    [0, 1, 2, 3, 4, 5].map((i) => (
                        <Person
                            key={i}
                            x={900 + i * 100}
                            y={640}
                            bukker={undersatt}
                            forsinkelse={i * 0.1}
                        />
                    ))}
            </svg>
        </div>
    );
}

function Skal({
    fraX,
    fraY,
    tilX,
    tilY,
    tekst,
    farge,
    tom,
}: {
    fraX: number;
    fraY: number;
    tilX: number;
    tilY: number;
    tekst: string;
    farge: string;
    tom?: boolean;
}) {
    return (
        <motion.g
            initial={{ x: fraX, y: fraY }}
            animate={{ x: tilX, y: tilY }}
            transition={{ delay: 0.8, duration: 1.6, ease: 'easeInOut' }}
        >
            <line x1={-70} y1={110} x2={0} y2={0} stroke="#78350f" strokeWidth={4} />
            <line x1={70} y1={110} x2={0} y2={0} stroke="#78350f" strokeWidth={4} />
            <path d="M -95 110 L 95 110 Q 70 160 0 160 Q -70 160 -95 110 Z" fill="#a16207" />
            <motion.g
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: tom ? -40 : 0 }}
                transition={{ delay: 0.4, duration: 1.2 }}
            >
                <rect x={-80} y={52} width={160} height={58} rx={12} fill={farge} />
                <text
                    x={0}
                    y={94}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={900}
                    fill="#ffffff"
                >
                    {tekst}
                </text>
            </motion.g>
        </motion.g>
    );
}

function Person({
    x,
    y,
    bukker,
    forsinkelse,
}: {
    x: number;
    y: number;
    bukker: boolean;
    forsinkelse: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, x, y: y + 20 }}
            animate={{ opacity: 1, x, y }}
            transition={{ delay: forsinkelse }}
        >
            <rect
                x={-24}
                y={-90}
                width={48}
                height={110}
                rx={20}
                fill={bukker ? '#a8a29e' : '#2563eb'}
            />
            <motion.circle
                initial={false}
                animate={{ y: bukker ? 26 : 0, x: bukker ? 10 : 0 }}
                cx={0}
                cy={-118}
                r={26}
                fill="#d6a77a"
            />
            {/* Armen: rakt opp når de stemmer, ned når de bøyer seg */}
            <motion.line
                initial={false}
                animate={{ x2: bukker ? 30 : 34, y2: bukker ? 0 : -170 }}
                x1={18}
                y1={-70}
                stroke={bukker ? '#a8a29e' : '#2563eb'}
                strokeWidth={14}
                strokeLinecap="round"
            />
        </motion.g>
    );
}

function Laurbaer({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            {[-1, 1].map((s) =>
                [0, 1, 2, 3, 4].map((i) => {
                    const a = (Math.PI / 2) * (0.25 + i * 0.32);
                    return (
                        <ellipse
                            key={`${s}${i}`}
                            cx={s * Math.cos(a) * 70}
                            cy={Math.sin(a) * 40 - 10}
                            rx={22}
                            ry={10}
                            fill="#4d7c0f"
                            transform={`rotate(${s * (60 - i * 25)} ${s * Math.cos(a) * 70} ${Math.sin(a) * 40 - 10})`}
                        />
                    );
                })
            )}
            <text y={100} textAnchor="middle" fontSize={34} fontWeight={900} fill="#4d7c0f">
                Keiseren
            </text>
        </g>
    );
}
