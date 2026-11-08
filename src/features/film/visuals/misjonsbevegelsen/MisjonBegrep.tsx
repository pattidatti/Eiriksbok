import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Hva misjon er, tegnet som et skjema: et budskap som spres etter en plan, ytremisjon over
 * havet og indremisjon i bygda hjemme, alt det andre misjonærene drev med (skole, helse,
 * hjelp), og Norge som sendte ut svært mange. Skjemaet står til venstre, forklaringene til høyre.
 */

const B = 1600;
const H = 900;
const MISJON = '#0f766e';
const GULL = '#b45309';
const ROD = '#b91c1c';
const BLA = '#1d4ed8';
const LILLA = '#7c3aed';
const MORK = '#0f172a';
const GRA = '#94a3b8';

interface Kort {
    tekst: string;
    farge?: string;
}

const KORT: Kort[][] = [
    [
        { tekst: 'Misjon' },
        { tekst: 'Spre et religiøst budskap, på en planlagt måte', farge: MISJON },
    ],
    [{ tekst: 'Misjon' }, { tekst: 'Kristendommen spredte seg i stor grad slik', farge: MISJON }],
    [{ tekst: 'Ytremisjon' }, { tekst: 'Reise dit folk ikke er kristne', farge: GULL }],
    [{ tekst: 'Indremisjon' }, { tekst: 'Styrke troen der folk alt er kristne', farge: LILLA }],
    [
        { tekst: 'Mer enn tro' },
        { tekst: 'Skoler', farge: BLA },
        { tekst: 'Helsearbeid', farge: ROD },
        { tekst: 'Hjelp til fattige', farge: GULL },
    ],
    [
        { tekst: 'Norge' },
        { tekst: 'Blant landene med flest misjonærer per innbygger', farge: MISJON },
    ],
];

type Fase = 'budskap' | 'typer' | 'mer' | 'norge';
const faseFor = (beat: number): Fase =>
    beat <= 1 ? 'budskap' : beat <= 3 ? 'typer' : beat === 4 ? 'mer' : 'norge';

/** Midten av skjemaet (venstre del av bildet). */
const MX = 520;
const MY = 470;

export function MisjonBegrep({ beat }: VisualProps) {
    const fase = faseFor(beat);
    const kort = KORT[Math.min(beat, KORT.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <AnimatePresence mode="wait">
                    {fase === 'budskap' && (
                        <motion.g
                            key="budskap"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Budskap beat={beat} />
                        </motion.g>
                    )}
                    {fase === 'typer' && (
                        <motion.g
                            key="typer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Typer beat={beat} />
                        </motion.g>
                    )}
                    {fase === 'mer' && (
                        <motion.g
                            key="mer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <MerEnnTro />
                        </motion.g>
                    )}
                    {fase === 'norge' && (
                        <motion.g
                            key="norge"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Utsendte />
                        </motion.g>
                    )}
                </AnimatePresence>
            </svg>

            <div className="absolute right-[3%] top-0 bottom-0 w-[36%] flex flex-col justify-center gap-4">
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
                                    ? 'px-5 py-3 rounded-2xl bg-slate-900 text-white font-black text-3xl md:text-4xl shadow-xl'
                                    : 'px-5 py-3 rounded-2xl bg-white/95 text-slate-900 font-bold text-2xl shadow-xl border-l-[10px]'
                            }
                            style={{ borderColor: k.farge ?? '#cbd5e1' }}
                        >
                            {k.tekst}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

/** Ei åpen bok: budskapet. */
function Bok({
    x,
    y,
    s = 1,
    farge = MISJON,
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <circle r={78} fill="#ffffff" stroke={farge} strokeWidth={8} />
            <path d="M -46 -26 Q -23 -40 0 -26 V 36 Q -23 22 -46 36 Z" fill={farge} />
            <path d="M 46 -26 Q 23 -40 0 -26 V 36 Q 23 22 46 36 Z" fill={farge} opacity={0.75} />
            <rect x={-3} y={-58} width={6} height={24} fill={farge} />
            <rect x={-11} y={-51} width={22} height={6} fill={farge} />
        </g>
    );
}

/** Et lite hus, med kors når folk der er kristne. */
function Hus({
    x,
    y,
    farge,
    kors,
    s = 1,
}: {
    x: number;
    y: number;
    farge: string;
    kors?: boolean;
    s?: number;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path
                d="M -34 40 V 2 L 0 -26 L 34 2 V 40 Z"
                fill="#ffffff"
                stroke={farge}
                strokeWidth={6}
            />
            <rect x={-8} y={16} width={16} height={24} fill={farge} />
            {kors && (
                <>
                    <rect x={-3} y={-52} width={6} height={26} fill={farge} />
                    <rect x={-10} y={-45} width={20} height={6} fill={farge} />
                </>
            )}
        </g>
    );
}

/** Tre planlagte mål. Så en mengde punkter som tennes utover: troen sprer seg. */
const MAL: [number, number][] = [
    [190, 230],
    [860, 250],
    [330, 780],
    [780, 740],
];

function Budskap({ beat }: { beat: number }) {
    // Et tett, utellbart felt av punkter i ringer rundt boka.
    const punkter: { x: number; y: number; r: number }[] = [];
    for (let ring = 1; ring <= 7; ring++) {
        const n = 10 + ring * 7;
        for (let i = 0; i < n; i++) {
            const v = (i / n) * Math.PI * 2 + ring * 0.37;
            const rx = 60 + ring * 58;
            punkter.push({
                x: MX + Math.cos(v) * rx * 1.15,
                y: MY + Math.sin(v) * rx * 0.95,
                r: ring,
            });
        }
    }
    const synlig = punkter.filter((p) => p.x > 30 && p.x < 1000 && p.y > 90 && p.y < 880);
    return (
        <g>
            {beat === 0 &&
                MAL.map(([x, y], i) => (
                    <g key={i}>
                        <motion.path
                            d={`M ${MX} ${MY} L ${x} ${y}`}
                            stroke={MISJON}
                            strokeWidth={7}
                            strokeLinecap="round"
                            fill="none"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.5 + i * 0.5, duration: 1 }}
                        />
                        <motion.g
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.3 + i * 0.5 }}
                            style={{ transformOrigin: `${x}px ${y}px` }}
                        >
                            <circle
                                cx={x}
                                cy={y}
                                r={40}
                                fill="#ffffff"
                                stroke={MISJON}
                                strokeWidth={6}
                            />
                            {/* En person: hode og kropp */}
                            <circle cx={x} cy={y - 10} r={10} fill={MISJON} />
                            <path
                                d={`M ${x - 16} ${y + 22} Q ${x} ${y - 6} ${x + 16} ${y + 22} Z`}
                                fill={MISJON}
                            />
                        </motion.g>
                    </g>
                ))}
            {beat >= 1 &&
                synlig.map((p, i) => (
                    <motion.circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={11}
                        initial={{ fill: '#e2e8f0' }}
                        animate={{ fill: MISJON }}
                        transition={{ delay: 0.3 + p.r * 0.35, duration: 0.6 }}
                    />
                ))}
            <Bok x={MX} y={MY} />
            {beat === 0 && (
                <motion.text
                    x={MX}
                    y={MY + 130}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill={MORK}
                    stroke="#ffffff"
                    strokeWidth={10}
                    paintOrder="stroke"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    Budskapet
                </motion.text>
            )}
        </g>
    );
}

/** Ytremisjon øverst (over havet), indremisjon nederst (i bygda hjemme). */
function Typer({ beat }: { beat: number }) {
    const indre = beat >= 3;
    return (
        <g>
            {/* Ytremisjon */}
            <motion.g animate={{ opacity: indre ? 0.35 : 1 }} transition={{ duration: 0.8 }}>
                <text x={60} y={130} fontSize={40} fontWeight={900} fill={GULL}>
                    YTREMISJON
                </text>
                {/* Hjemme */}
                <rect
                    x={50}
                    y={170}
                    width={230}
                    height={200}
                    rx={30}
                    fill="#d9f99d"
                    opacity={0.6}
                />
                <Hus x={165} y={270} farge={MISJON} kors />
                <text
                    x={165}
                    y={355}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={800}
                    fill={MORK}
                >
                    Hjemme
                </text>
                {/* Havet */}
                <rect x={290} y={170} width={400} height={200} fill="#bfdbfe" opacity={0.7} />
                {[0, 1, 2].map((i) => (
                    <path
                        key={i}
                        d={`M ${310 + i * 10} ${215 + i * 55} q 30 -18 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0`}
                        stroke="#60a5fa"
                        strokeWidth={5}
                        fill="none"
                    />
                ))}
                {/* Langt borte */}
                <rect
                    x={700}
                    y={170}
                    width={300}
                    height={200}
                    rx={30}
                    fill="#fde68a"
                    opacity={0.6}
                />
                <Hus x={790} y={270} farge={GRA} />
                <Hus x={910} y={270} farge={GRA} />
                <text
                    x={850}
                    y={355}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={800}
                    fill={MORK}
                >
                    Langt borte
                </text>
                <motion.path
                    d="M 220 230 Q 490 90 760 230"
                    stroke={GULL}
                    strokeWidth={9}
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.6, duration: 1.6 }}
                />
                <motion.path
                    d="M 745 200 L 770 236 L 728 240 Z"
                    fill={GULL}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.1 }}
                />
            </motion.g>

            {/* Indremisjon */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: indre ? 1 : 0.25 }}
                transition={{ duration: 0.8 }}
            >
                <text x={60} y={480} fontSize={40} fontWeight={900} fill={LILLA}>
                    INDREMISJON
                </text>
                <rect
                    x={50}
                    y={510}
                    width={950}
                    height={340}
                    rx={30}
                    fill="#d9f99d"
                    opacity={0.6}
                />
                {[
                    [180, 640],
                    [330, 760],
                    [470, 620],
                    [640, 750],
                    [790, 630],
                    [900, 770],
                ].map(([x, y], i) => (
                    <Hus key={i} x={x} y={y} farge={LILLA} kors s={0.9} />
                ))}
                {indre &&
                    [0, 1, 2].map((i) => (
                        <motion.ellipse
                            key={i}
                            cx={525}
                            cy={690}
                            fill="none"
                            stroke={LILLA}
                            strokeWidth={6}
                            initial={{ rx: 30, ry: 18, opacity: 0.9 }}
                            animate={{ rx: 440, ry: 150, opacity: 0 }}
                            transition={{ duration: 2.6, delay: i * 0.85, repeat: Infinity }}
                        />
                    ))}
                <text
                    x={525}
                    y={835}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={800}
                    fill={MORK}
                >
                    Hjemme i Norge
                </text>
            </motion.g>
        </g>
    );
}

/** Misjonshuset i midten, og skole, helse og hjelp rundt det. */
function MerEnnTro() {
    const ting = [
        { x: 220, y: 260, farge: BLA, tegn: 'skole' as const },
        { x: 820, y: 260, farge: ROD, tegn: 'helse' as const },
        { x: 520, y: 760, farge: GULL, tegn: 'hjelp' as const },
    ];
    return (
        <g>
            {ting.map((t, i) => (
                <motion.path
                    key={`l${i}`}
                    d={`M ${MX} ${MY} L ${t.x} ${t.y}`}
                    stroke={t.farge}
                    strokeWidth={8}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.3 + i * 0.6, duration: 0.8 }}
                />
            ))}
            <Hus x={MX} y={MY + 10} farge={MISJON} kors s={2.2} />
            {ting.map((t, i) => (
                <motion.g
                    key={i}
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        delay: 0.8 + i * 0.6,
                        type: 'spring',
                        stiffness: 180,
                        damping: 14,
                    }}
                    style={{ transformOrigin: `${t.x}px ${t.y}px` }}
                >
                    <g transform={`translate(${t.x} ${t.y})`}>
                        <circle r={90} fill="#ffffff" stroke={t.farge} strokeWidth={10} />
                        {t.tegn === 'helse' && (
                            <path
                                d="M -18 -52 H 18 V -18 H 52 V 18 H 18 V 52 H -18 V 18 H -52 V -18 H -18 Z"
                                fill={t.farge}
                            />
                        )}
                        {t.tegn === 'skole' && (
                            <g fill={t.farge}>
                                <path d="M -56 -32 Q -28 -48 0 -32 V 44 Q -28 28 -56 44 Z" />
                                <path
                                    d="M 56 -32 Q 28 -48 0 -32 V 44 Q 28 28 56 44 Z"
                                    opacity={0.75}
                                />
                            </g>
                        )}
                        {t.tegn === 'hjelp' && (
                            <path
                                d="M -52 8 Q -52 -20 -24 -16 L 0 0 L 24 -16 Q 52 -20 52 8 L 0 52 Z"
                                fill={t.farge}
                            />
                        )}
                    </g>
                </motion.g>
            ))}
        </g>
    );
}

/** Norge, og en strøm av misjonærer ut i verden: mange, men ikke tellbart. */
function Utsendte() {
    const strommer = [
        { d: 'M 440 260 Q 680 160 960 220', n: 10 },
        { d: 'M 440 340 Q 700 420 960 470', n: 10 },
        { d: 'M 420 450 Q 600 680 900 820', n: 10 },
        { d: 'M 280 560 Q 260 720 360 850', n: 6 },
    ];
    return (
        <g>
            <rect x={130} y={190} width={300} height={260} rx={40} fill={MISJON} opacity={0.18} />
            <Hus x={280} y={320} farge={MISJON} kors s={1.8} />
            <text
                x={280}
                y={510}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill={MISJON}
                letterSpacing={4}
            >
                NORGE
            </text>
            {strommer.map((s, j) => (
                <g key={j}>
                    <path
                        d={s.d}
                        stroke={MISJON}
                        strokeWidth={4}
                        strokeDasharray="6 12"
                        fill="none"
                        opacity={0.4}
                    />
                    {Array.from({ length: s.n }, (_, i) => (
                        <circle key={i} r={10} fill={MISJON}>
                            <animateMotion
                                dur="4s"
                                begin={`-${(i / s.n) * 4 + j * 0.3}s`}
                                repeatCount="indefinite"
                                path={s.d}
                                fill="freeze"
                            />
                        </circle>
                    ))}
                </g>
            ))}
        </g>
    );
}
