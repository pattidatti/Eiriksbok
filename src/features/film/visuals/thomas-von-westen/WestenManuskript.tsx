import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Kildene: hvordan vet vi hva samene trodde på? Misjonærenes rapporter hoper seg opp,
 * Nærøymanuskriptet forklarer figurene på en tromme, en påstand blir stemplet som feil,
 * og til slutt legger det seg et farget glass over alt: misjonærens blikk.
 */

const BLEKK = '#3f2a1d';
const ROD = '#b91c1c';
const GULL = '#b45309';

/** Arket står til venstre. Linjene er «håndskrift». */
const ARK = { x: 170, y: 120, b: 620, h: 700 };

const KORT: { tekst: string; farge?: string; stor?: boolean }[][] = [
    [{ tekst: 'Hvordan vet vi', stor: true }, { tekst: 'hva samene trodde på?', stor: true }],
    [{ tekst: 'Skrevet av misjonærene' }, { tekst: 'for å bekjempe troen', farge: ROD }],
    [{ tekst: 'Nærøy, januar 1723' }, { tekst: 'Von Westen besøker Johan Randulf', farge: GULL }, { tekst: 'Nærøymanuskriptet', farge: GULL }],
    [{ tekst: 'Figurene på en tromme' }, { tekst: 'En viktig kilde til samisk tro', farge: '#1d4ed8' }],
    [{ tekst: 'Les kritisk!' }, { tekst: '«stekte små djevler»', farge: ROD }, { tekst: 'Aldri en samisk skikk', farge: ROD }],
    [{ tekst: 'Misjonærens blikk' }, { tekst: 'Samenes egne tekster: nesten ingen', farge: ROD }],
];

export function WestenManuskript({ beat }: VisualProps) {
    const kort = KORT[Math.min(beat, KORT.length - 1)];
    return (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-200 via-stone-100 to-amber-100 overflow-hidden">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {/* Bordplata */}
                <rect x={0} y={0} width={1600} height={900} fill="#8a6a4a" opacity={0.18} />

                {/* Beat 0: et stort spørsmålstegn over en tromme i omriss */}
                <AnimatePresence>
                    {beat === 0 && (
                        <motion.g key="sporsmal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <ellipse cx={480} cy={470} rx={230} ry={290} fill="none" stroke={BLEKK} strokeWidth={10} strokeDasharray="22 18" />
                            <motion.text
                                x={480}
                                y={560}
                                textAnchor="middle"
                                fontSize={300}
                                fontWeight={900}
                                fill={GULL}
                                initial={{ scale: 0.4, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 120, damping: 10, delay: 0.4 }}
                                style={{ transformOrigin: '480px 470px' }}
                            >
                                ?
                            </motion.text>
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* Beat 1: rapportene hoper seg opp */}
                <AnimatePresence>
                    {beat === 1 &&
                        Array.from({ length: 9 }, (_, i) => (
                            <motion.g
                                key={`r${i}`}
                                initial={{ opacity: 0, y: -60 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: i * 0.3, type: 'spring', stiffness: 160, damping: 18 }}
                            >
                                <g transform={`translate(${260 + (i % 3) * 30} ${560 - i * 42}) rotate(${(i % 2 ? 1 : -1) * (2 + i)})`}>
                                    <rect x={0} y={0} width={420} height={160} rx={6} fill="#fffaf0" stroke="#a8a29e" strokeWidth={3} />
                                    {[0, 1, 2].map((l) => (
                                        <line key={l} x1={30} x2={380 - l * 50} y1={40 + l * 36} y2={40 + l * 36} stroke={BLEKK} strokeWidth={5} strokeLinecap="round" opacity={0.6} />
                                    ))}
                                </g>
                            </motion.g>
                        ))}
                </AnimatePresence>

                {/* Beat 2-5: manuskriptet */}
                <AnimatePresence>
                    {beat >= 2 && (
                        <motion.g
                            key="ark"
                            initial={{ opacity: 0, y: 40, rotate: -3 }}
                            animate={{ opacity: 1, y: 0, rotate: -1.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                            style={{ transformOrigin: '480px 470px' }}
                        >
                            <rect x={ARK.x + 10} y={ARK.y + 12} width={ARK.b} height={ARK.h} rx={8} fill="#000000" opacity={0.15} />
                            <rect x={ARK.x} y={ARK.y} width={ARK.b} height={ARK.h} rx={8} fill="#fbf3dc" stroke="#c8b48a" strokeWidth={4} />
                            <text x={ARK.x + ARK.b / 2} y={ARK.y + 70} textAnchor="middle" fontSize={40} fontStyle="italic" fontWeight={700} fontFamily="Georgia, serif" fill={BLEKK}>
                                Nærøy, 1723
                            </text>
                            {Array.from({ length: 5 }, (_, l) => (
                                <motion.line
                                    key={l}
                                    x1={ARK.x + 50}
                                    x2={ARK.x + ARK.b - 50 - (l % 2) * 80}
                                    y1={ARK.y + 130 + l * 38}
                                    y2={ARK.y + 130 + l * 38}
                                    stroke={BLEKK}
                                    strokeWidth={5}
                                    strokeLinecap="round"
                                    opacity={0.65}
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ delay: 0.5 + l * 0.3, duration: 0.6 }}
                                />
                            ))}
                            {/* Den stemplede linja */}
                            <line
                                x1={ARK.x + 50}
                                x2={ARK.x + ARK.b - 120}
                                y1={ARK.y + 340}
                                y2={ARK.y + 340}
                                stroke={beat === 4 ? ROD : BLEKK}
                                strokeWidth={beat === 4 ? 9 : 5}
                                strokeLinecap="round"
                                opacity={0.75}
                            />
                            {/* Trommen og figurene, tegnet av */}
                            {beat >= 3 && <TrommeTegning />}
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* Beat 4: stempelet */}
                <AnimatePresence>
                    {beat === 4 && (
                        <motion.g
                            key="stempel"
                            initial={{ opacity: 0, scale: 2.2 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.9, type: 'spring', stiffness: 260, damping: 16 }}
                            style={{ transformOrigin: '480px 460px' }}
                        >
                            <g transform="rotate(-12 480 460)">
                                <rect x={300} y={400} width={360} height={120} rx={14} fill="#ffffff" fillOpacity={0.8} stroke={ROD} strokeWidth={10} />
                                <text x={480} y={485} textAnchor="middle" fontSize={78} fontWeight={900} fill={ROD} letterSpacing={8}>
                                    FEIL
                                </text>
                            </g>
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* Beat 5: misjonærens farge over alt */}
                <AnimatePresence>
                    {beat === 5 && (
                        <motion.g key="blikk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4 }}>
                            <ellipse cx={480} cy={470} rx={420} ry={330} fill={ROD} opacity={0.22} />
                            <ellipse cx={480} cy={470} rx={420} ry={330} fill="none" stroke="#44403c" strokeWidth={16} />
                            <path d="M 900 470 L 1010 470" stroke="#44403c" strokeWidth={16} strokeLinecap="round" />
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
                            transition={{ delay: i * 0.5, type: 'spring', stiffness: 160, damping: 20 }}
                            className={
                                k.stor
                                    ? 'px-5 py-3 rounded-2xl bg-slate-900 text-white font-black text-3xl md:text-4xl shadow-xl'
                                    : i === 0 && !k.farge
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

/** Trommen tegnet av med blekk nederst på arket, og streker fra figurene til teksten. */
function TrommeTegning() {
    const cx = ARK.x + ARK.b / 2;
    const cy = ARK.y + 540;
    const fig = [
        [cx - 70, cy - 70],
        [cx + 70, cy - 70],
        [cx, cy + 10],
        [cx - 80, cy + 80],
        [cx + 80, cy + 80],
    ];
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <ellipse cx={cx} cy={cy} rx={150} ry={130} fill="none" stroke={BLEKK} strokeWidth={6} />
            <line x1={cx - 150} x2={cx + 150} y1={cy - 30} y2={cy - 30} stroke={BLEKK} strokeWidth={4} />
            <path d={`M ${cx} ${cy - 22} L ${cx + 26} ${cy + 4} L ${cx} ${cy + 30} L ${cx - 26} ${cy + 4} Z`} fill="none" stroke={BLEKK} strokeWidth={5} />
            {fig.map(([x, y], i) => (
                <motion.g key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.3 }} style={{ transformOrigin: `${x}px ${y}px` }}>
                    {i !== 2 && (
                        <>
                            <circle cx={x} cy={y - 14} r={7} fill={BLEKK} />
                            <path d={`M ${x} ${y - 7} L ${x} ${y + 14} M ${x - 11} ${y} L ${x + 11} ${y} M ${x} ${y + 14} L ${x - 8} ${y + 26} M ${x} ${y + 14} L ${x + 8} ${y + 26}`} stroke={BLEKK} strokeWidth={4} />
                        </>
                    )}
                    <circle cx={x + 24} cy={y - 24} r={15} fill={GULL} />
                    <text x={x + 24} y={y - 17} textAnchor="middle" fontSize={20} fontWeight={900} fill="#ffffff">
                        {i + 1}
                    </text>
                </motion.g>
            ))}
            {/* Streker fra tallene opp til teksten */}
            {fig.slice(0, 3).map(([x, y], i) => (
                <motion.path
                    key={`s${i}`}
                    d={`M ${x + 24} ${y - 40} Q ${x + 60} ${ARK.y + 300} ${ARK.x + ARK.b - 70} ${ARK.y + 130 + i * 76}`}
                    fill="none"
                    stroke={GULL}
                    strokeWidth={3}
                    strokeDasharray="6 8"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.6 + i * 0.3, duration: 0.8 }}
                />
            ))}
        </motion.g>
    );
}
