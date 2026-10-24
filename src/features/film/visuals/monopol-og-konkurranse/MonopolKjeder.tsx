import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * De få store. «oligopol»: tre store butikker der én setter ned prisen og de andre følger
 * etter med en gang. «andeler»: dagligvaremarkedet i Norge som én lang handlelapp delt
 * mellom de tre kjedene. «prisjeger»: prisjegerne som skanner prislappene hos hverandre.
 */

type Modus = 'oligopol' | 'andeler' | 'prisjeger';

const OVERSKRIFT: Record<Modus, string[]> = {
    oligopol: [
        'Noen få store selger nesten alt',
        'Oligo = få',
        'Én setter ned prisen',
        'De andre følger etter med en gang',
        'Kamp med reklame, ikke med pris',
    ],
    andeler: [
        'Dagligvaremarkedet i Norge',
        'NorgesGruppen',
        'Coop og Rema 1000',
        'Til sammen: over 96 prosent',
        'Vanskelig for nye å komme inn',
    ],
    prisjeger: [
        'Hva tar de andre for varene?',
        '2010 til 2012: døra står åpen',
        'Prisjegeren skanner prislappene',
        'Priser i stor skala',
        'Prisene står jo på hylla',
        'De andre følger etter med en gang',
    ],
};

const FARGER = ['#ea580c', '#2563eb', '#7c3aed'];
const BUTIKK_X = [330, 800, 1270];
const GULV = 770;

function Butikk({ x, farge, navn, s = 1 }: { x: number; farge: string; navn: string; s?: number }) {
    return (
        <g transform={`translate(${x} ${GULV}) scale(${s})`}>
            <rect x={-150} y={-250} width={300} height={250} rx={10} fill="#fff" stroke="#334155" strokeWidth={6} />
            <rect x={-150} y={-250} width={300} height={70} rx={10} fill={farge} />
            <text x={0} y={-198} textAnchor="middle" fontSize={44} fontWeight={900} fill="#fff">
                {navn}
            </text>
            <rect x={-110} y={-150} width={110} height={90} fill="#e0f2fe" stroke="#334155" strokeWidth={4} />
            <rect x={30} y={-150} width={80} height={150} fill="#cbd5e1" stroke="#334155" strokeWidth={4} />
        </g>
    );
}

/** Prislapp over butikken som kan gå ned. */
function Prislapp({ x, ned, forsinkelse = 0 }: { x: number; ned: boolean; forsinkelse?: number }) {
    return (
        <motion.g initial={false} animate={{ y: ned ? 90 : 0 }} transition={{ duration: 0.9, delay: forsinkelse }}>
            <rect x={x - 90} y={330} width={180} height={80} rx={14} fill="#fff" stroke={ned ? '#0d9488' : '#334155'} strokeWidth={6} />
            <text x={x} y={384} textAnchor="middle" fontSize={40} fontWeight={900} fill={ned ? '#0d9488' : '#0f172a'}>
                {ned ? 'pris ↓' : 'pris'}
            </text>
        </motion.g>
    );
}

function Kunder({ x, n, farge }: { x: number; n: number; farge: string }) {
    return (
        <g>
            {Array.from({ length: n }, (_, i) => (
                <circle key={i} cx={x - 100 + (i % 6) * 40} cy={810 + Math.floor(i / 6) * 34} r={13} fill={farge} opacity={0.85} />
            ))}
        </g>
    );
}

function Oligopol({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            {BUTIKK_X.map((x, i) => (
                <motion.g key={x} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.3 }}>
                    <Butikk x={x} farge={FARGER[i]} navn={['A', 'B', 'C'][i]} />
                    <Kunder x={x} n={12} farge={FARGER[i]} />
                </motion.g>
            ))}
            {beat === 1 && (
                <motion.g initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} style={{ originX: '800px', originY: '330px' }}>
                    <rect x={480} y={240} width={640} height={170} rx={26} fill="#fff" stroke="#0f172a" strokeWidth={6} />
                    <text x={800} y={345} textAnchor="middle" fontSize={84} fontWeight={900} fill="#0f172a">
                        OLIGO = få
                    </text>
                </motion.g>
            )}
            {beat >= 2 && beat <= 3 &&
                BUTIKK_X.map((x, i) => <Prislapp key={x} x={x} ned={i === 0 || beat >= 3} forsinkelse={i === 0 ? 0 : 0.15 * i} />)}
            {/* B og C følger med på A */}
            {beat === 2 &&
                [1, 2].map((i) => (
                    <motion.path
                        key={i}
                        d={`M ${BUTIKK_X[i]} 315 Q ${(BUTIKK_X[i] + BUTIKK_X[0]) / 2} ${200 - i * 30} ${BUTIKK_X[0] + 40} 320`}
                        stroke={FARGER[i]}
                        strokeWidth={6}
                        strokeDasharray="14 12"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                    />
                ))}
            {beat === 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                    <rect x={90} y={150} width={480} height={150} rx={18} fill="#fff7ed" stroke={FARGER[0]} strokeWidth={5} />
                    <text x={330} y={210} textAnchor="middle" fontSize={36} fontWeight={800} fill="#0f172a">
                        A: ingen nye kunder,
                    </text>
                    <text x={330} y={262} textAnchor="middle" fontSize={36} fontWeight={800} fill="#0f172a">
                        bare mindre per vare
                    </text>
                </motion.g>
            )}
            {beat >= 4 &&
                BUTIKK_X.map((x, i) => (
                    <motion.g
                        key={x}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={playing ? { opacity: 1, scale: [1, 1.06, 1] } : { opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.4, scale: { duration: 1.2, repeat: Infinity, delay: i * 0.4 } }}
                        style={{ originX: `${x}px`, originY: '380px' }}
                    >
                        <rect x={x - 140} y={300} width={280} height={150} rx={16} fill={FARGER[i]} stroke="#0f172a" strokeWidth={5} />
                        <text x={x} y={365} textAnchor="middle" fontSize={44} fontWeight={900} fill="#fff">
                            REKLAME
                        </text>
                        <text x={x} y={420} textAnchor="middle" fontSize={32} fontWeight={700} fill="#fff">
                            {['Best i byen!', 'Velg oss!', 'Alltid her!'][i]}
                        </text>
                    </motion.g>
                ))}
        </>
    );
}

const ANDELER = [
    { navn: 'NorgesGruppen', prosent: 43.5, start: 0, tekst: '43,5 %', fraBeat: 1 },
    { navn: 'Coop', prosent: 29.2, start: 43.5, tekst: '29,2 %', fraBeat: 2 },
    { navn: 'Rema 1000', prosent: 23.9, start: 72.7, tekst: '23,9 %', fraBeat: 2 },
];
const SX = 150;
const SB = 1300;
const SY = 360;
const SH = 190;

function Andeler({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            <text x={SX} y={SY - 40} fontSize={36} fontWeight={800} fill="#475569">
                Hele markedet, 2024
            </text>
            <rect x={SX} y={SY} width={SB} height={SH} rx={18} fill="#e2e8f0" stroke="#334155" strokeWidth={5} />
            {ANDELER.map((a, i) => {
                const x = SX + (a.start / 100) * SB;
                const b = (a.prosent / 100) * SB;
                const vist = beat >= a.fraBeat;
                return (
                    <g key={a.navn}>
                        <motion.rect
                            x={x}
                            y={SY}
                            height={SH}
                            fill={FARGER[i]}
                            initial={{ width: 0 }}
                            animate={{ width: vist ? b : 0 }}
                            transition={{ duration: 1.2, delay: i === 2 ? 1.2 : 0 }}
                        />
                        {vist && (
                            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i === 2 ? 2 : 0.9 }}>
                                <text x={x + b / 2} y={SY + 112} textAnchor="middle" fontSize={i === 0 ? 64 : 56} fontWeight={900} fill="#fff">
                                    {a.tekst}
                                </text>
                                <text x={x + b / 2} y={SY + SH + 60} textAnchor="middle" fontSize={38} fontWeight={800} fill={FARGER[i]}>
                                    {a.navn}
                                </text>
                            </motion.g>
                        )}
                    </g>
                );
            })}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <path
                        d={`M ${SX} ${SY + SH + 100} L ${SX} ${SY + SH + 130} L ${SX + 0.966 * SB} ${SY + SH + 130} L ${SX + 0.966 * SB} ${SY + SH + 100}`}
                        stroke="#0f172a"
                        strokeWidth={6}
                        fill="none"
                    />
                    <text x={SX + 0.483 * SB} y={SY + SH + 200} textAnchor="middle" fontSize={56} fontWeight={900} fill="#0f172a">
                        over 96 prosent
                    </text>
                    <text x={SX + SB - 4} y={SY - 40} textAnchor="end" fontSize={32} fontWeight={700} fill="#64748b">
                        alle andre ↓
                    </text>
                </motion.g>
            )}
            {beat >= 4 && (
                <motion.g
                    initial={{ x: 0 }}
                    animate={playing ? { x: [24, 0, 24] } : { x: 0 }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                >
                    <rect x={1462} y={SY + 50} width={100} height={90} rx={8} fill="#fff" stroke="#16a34a" strokeWidth={5} />
                    <text x={1512} y={SY + 108} textAnchor="middle" fontSize={30} fontWeight={900} fill="#16a34a">
                        ny
                    </text>
                </motion.g>
            )}
        </>
    );
}

/** Punkter langs buen fra a til b (kvadratisk Bézier), som nøkkelbilder for cx og cy. */
function langs(xa: number, høy: number, xb: number) {
    const mx = (xa + xb) / 2;
    const t = Array.from({ length: 11 }, (_, i) => i / 10);
    return {
        cx: t.map((u) => (1 - u) ** 2 * xa + 2 * (1 - u) * u * mx + u * u * xb),
        cy: t.map((u) => (1 - u) ** 2 * 500 + 2 * (1 - u) * u * høy + u * u * 500),
    };
}

function Prisjeger({ beat, playing }: { beat: number; playing: boolean }) {
    const navn = ['NorgesGruppen', 'Coop', 'Rema 1000'];
    return (
        <>
            {BUTIKK_X.map((x, i) => (
                <g key={x}>
                    <Butikk x={x} farge={FARGER[i]} navn="" s={0.95} />
                    <text x={x} y={GULV - 198} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fff">
                        {navn[i]}
                    </text>
                </g>
            ))}
            {beat === 0 &&
                BUTIKK_X.map((x, i) => (
                    <motion.text
                        key={x}
                        x={x}
                        y={420}
                        textAnchor="middle"
                        fontSize={110}
                        fontWeight={900}
                        fill={FARGER[i]}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 + i * 0.3 }}
                    >
                        ?
                    </motion.text>
                ))}
            {/* Pilene: hver kjede slipper de andres prisjegere inn */}
            {(beat === 1 || beat === 3) &&
                [
                    [0, 1],
                    [1, 2],
                    [2, 0],
                ].map(([a, b], k) => {
                    const høy = k === 2 ? 210 : 380;
                    const d = `M ${BUTIKK_X[a]} 500 Q ${(BUTIKK_X[a] + BUTIKK_X[b]) / 2} ${høy} ${BUTIKK_X[b]} 500`;
                    return (
                        <g key={k}>
                            <motion.path
                                d={d}
                                stroke={FARGER[a]}
                                strokeWidth={7}
                                fill="none"
                                strokeDasharray="16 12"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1, delay: k * 0.4 }}
                            />
                            {beat === 3 &&
                                [0, 1, 2, 3, 4].map((n) => (
                                    <motion.circle
                                        key={n}
                                        r={11}
                                        fill={FARGER[a]}
                                        initial={{ cx: BUTIKK_X[a], cy: 500 }}
                                        animate={playing ? langs(BUTIKK_X[a], høy, BUTIKK_X[b]) : {}}
                                        transition={{ duration: 2.2, repeat: Infinity, delay: n * 0.44, ease: 'linear' }}
                                    />
                                ))}
                        </g>
                    );
                })}
            {beat === 2 && <Skanner playing={playing} />}
            {beat === 4 && (
                <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <rect x={500} y={190} width={600} height={260} rx={18} fill="#fff" stroke="#334155" strokeWidth={6} />
                    {[0, 1, 2].map((r) => (
                        <g key={r}>
                            <line x1={520} y1={270 + r * 70} x2={1080} y2={270 + r * 70} stroke="#94a3b8" strokeWidth={6} />
                            {[0, 1, 2, 3, 4].map((c) => (
                                <rect key={c} x={540 + c * 108} y={236 + r * 70} width={80} height={30} rx={5} fill="#fde047" stroke="#334155" strokeWidth={3} />
                            ))}
                        </g>
                    ))}
                    <text x={800} y={500} textAnchor="middle" fontSize={36} fontWeight={800} fill="#334155">
                        alle kan se prislappene
                    </text>
                </motion.g>
            )}
            {beat >= 5 && BUTIKK_X.map((x, i) => <Prislapp key={x} x={x} ned forsinkelse={i === 0 ? 0 : 0.5 + i * 0.1} />)}
        </>
    );
}

/** Prisjegeren med håndholdt skanner foran en hylle. */
function Skanner({ playing }: { playing: boolean }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <rect x={470} y={150} width={660} height={300} rx={20} fill="#f8fafc" stroke="#334155" strokeWidth={6} />
            {[0, 1].map((r) => (
                <g key={r}>
                    <line x1={490} y1={300 + r * 120} x2={1110} y2={300 + r * 120} stroke="#94a3b8" strokeWidth={6} />
                    {[0, 1, 2, 3].map((c) => (
                        <rect key={c} x={760 + c * 85} y={262 + r * 120} width={64} height={32} rx={5} fill="#fde047" stroke="#334155" strokeWidth={3} />
                    ))}
                </g>
            ))}
            {/* Personen */}
            <circle cx={590} cy={250} r={34} fill="#e8b48c" />
            <rect x={545} y={290} width={90} height={160} rx={30} fill="#0f766e" />
            <rect x={640} y={318} width={70} height={30} rx={8} fill="#1f2937" />
            <motion.path
                d="M 710 333 L 900 280 L 900 300 Z"
                fill="#ef4444"
                opacity={0.6}
                animate={playing ? { d: ['M 710 333 L 760 278 L 760 300 Z', 'M 710 333 L 1060 278 L 1060 300 Z', 'M 710 333 L 760 278 L 760 300 Z'] } : {}}
                transition={{ duration: 2.4, repeat: Infinity }}
            />
            <text x={800} y={495} textAnchor="middle" fontSize={36} fontWeight={800} fill="#334155">
                en prisjeger i en konkurrents butikk
            </text>
        </motion.g>
    );
}

export function MonopolKjeder({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'oligopol';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-slate-50 to-slate-200">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'oligopol' && <Oligopol beat={beat} playing={playing} />}
                {modus === 'andeler' && <Andeler beat={beat} playing={playing} />}
                {modus === 'prisjeger' && <Prisjeger beat={beat} playing={playing} />}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
            {modus === 'andeler' && beat >= 4 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="absolute left-1/2 -translate-x-1/2 bottom-[5%] flex gap-4"
                >
                    {['Høyere priser', 'Mindre utvalg'].map((t) => (
                        <div key={t} className="px-4 py-2 rounded-2xl bg-red-600 text-white text-2xl font-bold shadow-xl whitespace-nowrap">
                            {t}
                        </div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
