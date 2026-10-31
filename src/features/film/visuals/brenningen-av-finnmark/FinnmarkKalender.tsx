import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';

/**
 * Oktober 1944 som et kalenderark. Til venstre fylles kalenderen dag for dag (frivillig
 * flytting i begynnelsen av måneden (uten egne datoer), Terboven i Troms den 26., Hitlers ordre den 28.).
 * Til høyre står det som skjer på hver replikk.
 */

const BLEKK = '#0f172a';
const ROD = '#b91c1c';
const GUL = '#d97706';
const BLA = '#2563eb';

/** 1. oktober 1944 var en søndag. Uka starter på mandag, så dag 1 står i sjuende kolonne. */
const FORSTE_KOLONNE = 6;
const CELLE_B = 92;
const CELLE_H = 80;
const X0 = 130;
const Y0 = 300;

function dagPos(dag: number) {
    const i = dag - 1 + FORSTE_KOLONNE;
    return { x: X0 + (i % 7) * CELLE_B, y: Y0 + Math.floor(i / 7) * CELLE_H };
}

function Kalender({ beat }: { beat: number }) {
    const ukedager = ['ma', 'ti', 'on', 'to', 'fr', 'lø', 'sø'];
    return (
        <g>
            <rect x={100} y={110} width={704} height={720} rx={24} fill="#f8f3e6" />
            <rect x={100} y={110} width={704} height={110} rx={24} fill={ROD} />
            <rect x={100} y={180} width={704} height={40} fill={ROD} />
            <text x={452} y={188} textAnchor="middle" fontSize={56} fontWeight={900} fill="#ffffff" letterSpacing={6}>
                OKTOBER 1944
            </text>
            {ukedager.map((d, i) => (
                <text
                    key={d}
                    x={X0 + i * CELLE_B + CELLE_B / 2 - 4}
                    y={268}
                    textAnchor="middle"
                    fontSize={26}
                    fontWeight={800}
                    fill="#64748b"
                >
                    {d}
                </text>
            ))}
            {Array.from({ length: 31 }, (_, k) => {
                const dag = k + 1;
                const { x, y } = dagPos(dag);
                                const terboven = dag === 26 && beat >= 2;
                const ordre = dag === 28 && beat >= 4;
                const fyll = ordre ? ROD : terboven ? GUL : '#ffffff';
                const tekst = ordre || terboven ? '#ffffff' : BLEKK;
                return (
                    <g key={dag}>
                        <motion.rect
                            x={x}
                            y={y}
                            width={CELLE_B - 10}
                            height={CELLE_H - 10}
                            rx={10}
                            animate={{ fill: fyll }}
                            transition={{ duration: 0.6 }}
                            stroke="#e2dccb"
                            strokeWidth={2}
                        />
                        <text
                            x={x + (CELLE_B - 10) / 2}
                            y={y + 48}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill={tekst}
                        >
                            {dag}
                        </text>
                    </g>
                );
            })}
            {beat >= 4 && (
                <motion.circle
                    cx={dagPos(28).x + 41}
                    cy={dagPos(28).y + 35}
                    r={58}
                    fill="none"
                    stroke={ROD}
                    strokeWidth={7}
                    initial={{ opacity: 0, scale: 1.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                    style={{ transformOrigin: `${dagPos(28).x + 41}px ${dagPos(28).y + 35}px` }}
                />
            )}
        </g>
    );
}

function Kort({
    y,
    h,
    farge,
    linjer,
    delay = 0,
}: {
    y: number;
    h: number;
    farge: string;
    linjer: { tekst: string; storrelse: number; farge?: string }[];
    delay?: number;
}) {
    const ys = linjer.reduce<number[]>(
        (acc, l) => [...acc, (acc.length ? acc[acc.length - 1] : y + 20) + l.storrelse * 1.3],
        []
    );
    return (
        <motion.g
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay, type: 'spring', stiffness: 160, damping: 20 }}
        >
            <rect x={880} y={y} width={640} height={h} rx={22} fill="#ffffff" />
            <rect x={880} y={y} width={16} height={h} rx={6} fill={farge} />
            {linjer.map((l, i) => (
                <text key={i} x={930} y={ys[i]} fontSize={l.storrelse} fontWeight={900} fill={l.farge ?? BLEKK}>
                    {l.tekst}
                </text>
            ))}
        </motion.g>
    );
}

/** Små folk som går ut av bildet: de som reiste frivillig. */
function Folk() {
    return (
        <g>
            {Array.from({ length: 8 }, (_, i) => (
                <motion.g
                    key={i}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.12 }}
                >
                    <circle cx={950 + i * 64} cy={350} r={13} fill={BLA} />
                    <rect x={936 + i * 64} y={366} width={26} height={34} rx={10} fill={BLA} />
                </motion.g>
            ))}
        </g>
    );
}

export function FinnmarkKalender({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <Kalender beat={beat} />
                <AnimatePresence mode="wait">
                    {beat <= 1 && (
                        <motion.g key="frivillig" exit={{ opacity: 0 }}>
                            <Kort
                                y={120}
                                h={300}
                                farge={BLA}
                                linjer={[{ tekst: 'Begynnelsen av oktober', storrelse: 34, farge: '#475569' }]}
                            />
                            <text x={930} y={258} fontSize={80} fontWeight={900} fill={BLEKK}>
                                ca. <TelleTall verdi={5000} />
                            </text>
                            <text x={930} y={310} fontSize={31} fontWeight={800} fill="#475569">
                                reiser frivillig fra Øst-Finnmark
                            </text>
                            <Folk />
                            {beat >= 1 && (
                                <Kort
                                    y={450}
                                    h={330}
                                    farge={ROD}
                                    linjer={[
                                        { tekst: 'Men de fleste blir', storrelse: 46 },
                                        { tekst: 'De vil ikke forlate', storrelse: 38, farge: '#475569' },
                                    ]}
                                />
                            )}
                            {beat >= 1 &&
                                ['gården', 'båten', 'dyrene'].map((t, i) => (
                                    <motion.g
                                        key={t}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 + i * 0.4 }}
                                    >
                                        <rect x={930 + i * 192} y={640} width={176} height={84} rx={42} fill="#fee2e2" />
                                        <text
                                            x={1018 + i * 192}
                                            y={694}
                                            textAnchor="middle"
                                            fontSize={34}
                                            fontWeight={900}
                                            fill={ROD}
                                        >
                                            {t}
                                        </text>
                                    </motion.g>
                                ))}
                        </motion.g>
                    )}
                    {(beat === 2 || beat === 3) && (
                        <motion.g key="terboven" exit={{ opacity: 0 }}>
                            <Kort
                                y={120}
                                h={290}
                                farge={GUL}
                                linjer={[
                                    { tekst: '26. oktober', storrelse: 34, farge: GUL },
                                    { tekst: 'Terboven i Troms', storrelse: 52 },
                                    { tekst: 'rikskommissær,', storrelse: 36, farge: '#475569' },
                                    { tekst: 'Hitlers mann i Norge', storrelse: 36, farge: '#475569' },
                                ]}
                            />
                            {beat >= 3 && (
                                <Kort
                                    y={450}
                                    h={330}
                                    farge={BLA}
                                    linjer={[
                                        { tekst: 'Han er redd for at', storrelse: 38, farge: '#475569' },
                                        { tekst: 'regjeringen i London', storrelse: 46 },
                                        { tekst: 'skal få kontroll', storrelse: 46 },
                                        { tekst: 'over Finnmark', storrelse: 46 },
                                    ]}
                                />
                            )}
                        </motion.g>
                    )}
                    {beat >= 4 && (
                        <motion.g key="ordre" exit={{ opacity: 0 }}>
                            <Kort
                                y={120}
                                h={660}
                                farge={ROD}
                                linjer={[
                                    { tekst: '28. oktober 1944', storrelse: 36, farge: ROD },
                                    { tekst: 'Ordre fra Hitler', storrelse: 60 },
                                ]}
                            />
                            {[
                                ['Alle øst for Lyngen:', 'flyttes med tvang'],
                                ['Alle hus:', 'brennes'],
                            ].map(([a, b], i) => (
                                <motion.g
                                    key={a}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 + i * 0.9 }}
                                >
                                    <text x={930} y={400 + i * 190} fontSize={40} fontWeight={800} fill="#475569">
                                        {a}
                                    </text>
                                    <text x={930} y={466 + i * 190} fontSize={58} fontWeight={900} fill={ROD}>
                                        {b}
                                    </text>
                                </motion.g>
                            ))}
                        </motion.g>
                    )}
                </AnimatePresence>
            </svg>
        </div>
    );
}
