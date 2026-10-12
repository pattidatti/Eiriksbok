import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Kuppet som et teaterstykke. Foran: gata i Teheran, der folkemengden, avisene, offiserene og
 * bøllene dukker opp én etter én, hver gang en seddel flyr ut av CIA-kofferten. På siste beat
 * blir kulissene gjennomsiktige: en hånd over scenen holder trådene til alle sammen.
 * «kupp»: seks beats, som over. «pris»: den tomme kofferten og prislappen.
 */

type Modus = 'kupp' | 'pris';

const GULV = 740;
const KOFFERT = { x: 120, y: 600 };
const HÅND = { x: 860, y: 70 };

/** Hvor hver gruppe står, og hvor tråden fester seg. */
const GRUPPER = {
    folk: { x: 690, y: 385, fraBeat: 1 },
    avis: { x: 990, y: 480, fraBeat: 2 },
    offiser: { x: 1210, y: 510, fraBeat: 3 },
    bolle: { x: 1390, y: 525, fraBeat: 3 },
} as const;

const TEKST: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    kupp: [
        { tekst: 'Kermit Roosevelt, CIA' },
        { tekst: 'Falske opptøyer, betalt av CIA' },
        { tekst: 'Løgner i avisene' },
        { tekst: 'Bestukne offiserer og betalte bøller' },
        { tekst: 'Det skal se ut som folkets vilje' },
        { tekst: 'Bak kulissene: CIA', rod: true },
    ],
    pris: [{ tekst: 'Prisen for et kupp' }, { tekst: 'En hel regjering byttet ut', rod: true }],
};

export function AjaxTeateret({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'kupp';
    const t = TEKST[modus][Math.min(beat, TEKST[modus].length - 1)];
    const avslørt = modus === 'kupp' && beat >= 5;
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f3e7cf' }}>
            <svg viewBox="0 0 1600 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* Bakteppet: Teheran */}
                <Byen dempet={avslørt} />
                {/* Teppet på sidene */}
                <path d="M 0 0 L 150 0 Q 110 300 60 900 L 0 900 Z" fill="#7f1d1d" />
                <path d="M 1600 0 L 1450 0 Q 1490 300 1540 900 L 1600 900 Z" fill="#7f1d1d" />
                <rect x={0} y={0} width={1600} height={46} fill="#991b1b" />
                {/* Scenegulvet */}
                <rect x={0} y={GULV} width={1600} height={160} fill="#92633a" />
                <rect x={0} y={GULV} width={1600} height={10} fill="#5b3a1e" />

                {modus === 'kupp' ? (
                    <Kupp beat={beat} avslørt={avslørt} />
                ) : (
                    <Pris beat={beat} />
                )}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute bottom-[4%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                        t.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {t.tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function Kupp({ beat, avslørt }: { beat: number; avslørt: boolean }) {
    const mål = Object.values(GRUPPER).filter((g) => g.fraBeat === beat);
    return (
        <>
            <Koffert x={KOFFERT.x} y={KOFFERT.y} åpen tom={false} />
            <Figur x={KOFFERT.x + 290} y={GULV} farge="#6b7280" hatt />
            <Navneskilt x={KOFFERT.x + 290} y={GULV - 280} tekst="Kermit Roosevelt" vis={beat === 0} />

            {/* Sedlene flyr fra kofferten til gruppen som kommer på denne beaten */}
            {beat === 0 &&
                [0, 1, 2, 3, 4].map((i) => (
                    <Seddel key={`s0-${i}`} fra={[KOFFERT.x + 100, KOFFERT.y]} til={[KOFFERT.x + 60 + i * 70, KOFFERT.y - 330 - (i % 2) * 60]} forsinkelse={0.4 + i * 0.15} />
                ))}
            {mål.map((g, gi) =>
                [0, 1, 2].map((i) => (
                    <Seddel key={`s${beat}-${gi}-${i}`} fra={[KOFFERT.x + 100, KOFFERT.y]} til={[g.x, g.y - 30]} forsinkelse={0.2 + gi * 0.4 + i * 0.18} />
                ))
            )}

            {beat >= 1 && <Folkemengde x={GRUPPER.folk.x} y={GULV} navn={!avslørt} />}
            {beat >= 2 && <Avis x={GRUPPER.avis.x} y={GULV} />}
            {beat >= 3 && <Offiserer x={GRUPPER.offiser.x} y={GULV} navn={!avslørt} />}
            {beat >= 3 && <Boller x={GRUPPER.bolle.x} y={GULV} navn={!avslørt} />}

            {beat === 4 && <Banner />}

            {avslørt && (
                <>
                    {Object.values(GRUPPER).map((g, i) => (
                        <motion.line
                            key={i}
                            x1={HÅND.x}
                            y1={HÅND.y + 70}
                            x2={g.x}
                            y2={g.y}
                            stroke="#111827"
                            strokeWidth={4}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1, delay: 0.6 + i * 0.25 }}
                        />
                    ))}
                    <Hånd />
                </>
            )}
        </>
    );
}

function Pris({ beat }: { beat: number }) {
    return (
        <>
            <Koffert x={260} y={560} åpen tom />
            <motion.g
                initial={{ opacity: 0, rotate: -12, y: -40 }}
                animate={{ opacity: 1, rotate: -6, y: 0 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 160, damping: 12 }}
                style={{ transformOrigin: '820px 300px' }}
            >
                <path d="M 560 180 L 1080 180 L 1140 300 L 1080 420 L 560 420 Z" fill="#fef3c7" stroke="#a16207" strokeWidth={8} />
                <circle cx={1080} cy={300} r={16} fill="#f3e7cf" stroke="#a16207" strokeWidth={6} />
                <text x={820} y={265} textAnchor="middle" fontSize={56} fontWeight={800} fill="#78350f">
                    Under én
                </text>
                <text x={820} y={355} textAnchor="middle" fontSize={84} fontWeight={900} fill="#78350f">
                    million dollar
                </text>
            </motion.g>
            {beat >= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    <Regjering x={1000} y={GULV} krysset />
                    <motion.path
                        d="M 1120 600 Q 1230 520 1300 600"
                        fill="none"
                        stroke="#b91c1c"
                        strokeWidth={10}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 1, duration: 0.8 }}
                    />
                    <path d="M 1284 578 L 1306 606 L 1272 612 Z" fill="#b91c1c" />
                    <Regjering x={1380} y={GULV} />
                </motion.g>
            )}
        </>
    );
}

function Byen({ dempet }: { dempet: boolean }) {
    const hus: [number, number, number][] = [
        [180, 180, 260],
        [360, 140, 330],
        [500, 200, 220],
        [700, 160, 300],
        [860, 220, 250],
        [1080, 150, 320],
        [1230, 190, 260],
        [1400, 160, 300],
    ];
    return (
        <motion.g animate={{ opacity: dempet ? 0.25 : 1 }} transition={{ duration: 1.2 }}>
            {hus.map(([x, b, h], i) => (
                <g key={i}>
                    <rect x={x} y={GULV - h} width={b} height={h} fill={i % 2 ? '#e2c89c' : '#d6b88a'} />
                    {Array.from({ length: 3 }, (_, r) =>
                        Array.from({ length: Math.floor(b / 60) }, (_, c) => (
                            <rect key={`${r}-${c}`} x={x + 20 + c * 60} y={GULV - h + 30 + r * 70} width={26} height={38} rx={13} fill="#a07b4f" />
                        ))
                    )}
                </g>
            ))}
            {/* Kuppel og minaret */}
            <path d="M 760 440 Q 830 330 900 440 Z" fill="#2f7d8a" />
            <rect x={950} y={330} width={22} height={170} fill="#c9a676" />
            <path d="M 945 330 L 961 290 L 977 330 Z" fill="#2f7d8a" />
        </motion.g>
    );
}

function Koffert({ x, y, åpen, tom }: { x: number; y: number; åpen: boolean; tom: boolean }) {
    return (
        <g>
            {åpen && (
                <path d={`M ${x} ${y} L ${x + 30} ${y - 120} L ${x + 230} ${y - 120} L ${x + 200} ${y} Z`} fill="#7c4a1e" stroke="#3f2410" strokeWidth={6} />
            )}
            <rect x={x} y={y} width={200} height={130} rx={12} fill="#92582a" stroke="#3f2410" strokeWidth={6} />
            {!tom &&
                [0, 1, 2, 3].map((i) => (
                    <rect key={i} x={x + 16 + i * 44} y={y - 16} width={36} height={24} rx={3} fill="#4ade80" stroke="#166534" strokeWidth={3} />
                ))}
            <rect x={x + 80} y={y + 54} width={40} height={18} rx={4} fill="#facc15" />
        </g>
    );
}

function Seddel({ fra, til, forsinkelse }: { fra: [number, number]; til: [number, number]; forsinkelse: number }) {
    return (
        <motion.g
            initial={{ x: fra[0], y: fra[1], opacity: 0, rotate: 0 }}
            animate={{ x: til[0], y: til[1], opacity: [0, 1, 1, 0.9], rotate: 200 }}
            transition={{ duration: 1.3, delay: forsinkelse, ease: 'easeOut' }}
        >
            <rect x={-26} y={-14} width={52} height={28} rx={4} fill="#4ade80" stroke="#166534" strokeWidth={3} />
            <text x={0} y={8} textAnchor="middle" fontSize={20} fontWeight={900} fill="#166534">
                $
            </text>
        </motion.g>
    );
}

function Figur({ x, y, farge, lue, skilt, hatt }: { x: number; y: number; farge: string; lue?: boolean; skilt?: boolean; hatt?: boolean }) {
    return (
        <g transform={`translate(${x} ${y}) scale(1.45) translate(${-x} ${-y})`}>
            {hatt && (
                <>
                    <rect x={x - 30} y={y - 152} width={60} height={8} rx={4} fill="#1f2937" />
                    <rect x={x - 18} y={y - 172} width={36} height={22} rx={5} fill="#1f2937" />
                </>
            )}
            <rect x={x - 20} y={y - 110} width={40} height={78} rx={16} fill={farge} />
            <rect x={x - 16} y={y - 36} width={12} height={36} fill="#334155" />
            <rect x={x + 4} y={y - 36} width={12} height={36} fill="#334155" />
            <circle cx={x} cy={y - 132} r={20} fill="#c08a5b" />
            {lue && (
                <>
                    <rect x={x - 24} y={y - 160} width={48} height={14} rx={4} fill="#3f4a2b" />
                    <rect x={x - 28} y={y - 150} width={56} height={6} rx={3} fill="#2a3220" />
                    <circle cx={x - 8} cy={y - 90} r={5} fill="#facc15" />
                    <circle cx={x + 6} cy={y - 90} r={5} fill="#facc15" />
                </>
            )}
            {skilt && (
                <>
                    <rect x={x + 16} y={y - 210} width={8} height={110} fill="#6b4423" />
                    <rect x={x - 22} y={y - 250} width={84} height={52} rx={4} fill="#ffffff" stroke="#111827" strokeWidth={4} />
                    <text x={x + 20} y={y - 212} textAnchor="middle" fontSize={34} fontWeight={900} fill="#b91c1c">
                        !!!
                    </text>
                </>
            )}
        </g>
    );
}

function Inn({ children, forsinkelse = 0.9 }: { children: ReactNode; forsinkelse?: number }) {
    return (
        <motion.g initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: forsinkelse, type: 'spring', stiffness: 160, damping: 16 }}>
            {children}
        </motion.g>
    );
}

function Folkemengde({ x, y, navn }: { x: number; y: number; navn: boolean }) {
    const folk: [number, string, boolean][] = [
        [-120, '#475569', true],
        [-40, '#0f766e', false],
        [40, '#9a3412', true],
        [120, '#1e40af', false],
    ];
    return (
        <Inn>
            {folk.map(([dx, f, s], i) => (
                <Figur key={i} x={x + dx} y={y} farge={f} skilt={s} />
            ))}
            <Navneskilt x={x} y={y - 390} tekst="Betalte demonstranter" vis={navn} />
        </Inn>
    );
}

function Avis({ x, y }: { x: number; y: number }) {
    return (
        <Inn>
            <g transform={`rotate(-4 ${x} ${y - 120})`}>
                <rect x={x - 110} y={y - 260} width={220} height={250} fill="#ffffff" stroke="#111827" strokeWidth={5} />
                <rect x={x - 90} y={y - 240} width={180} height={34} fill="#111827" />
                <text x={x} y={y - 214} textAnchor="middle" fontSize={26} fontWeight={900} fill="#ffffff">
                    AVISEN
                </text>
                <text x={x} y={y - 166} textAnchor="middle" fontSize={34} fontWeight={900} fill="#b91c1c">
                    LØGNER
                </text>
                {[0, 1, 2, 3, 4].map((i) => (
                    <rect key={i} x={x - 90} y={y - 140 + i * 24} width={i % 2 ? 140 : 180} height={10} fill="#94a3b8" />
                ))}
            </g>
        </Inn>
    );
}

function Offiserer({ x, y, navn }: { x: number; y: number; navn: boolean }) {
    return (
        <Inn>
            <Figur x={x - 50} y={y} farge="#4d5a33" lue />
            <Figur x={x + 50} y={y} farge="#4d5a33" lue />
            <Navneskilt x={x} y={y - 260} tekst="Offiserer" vis={navn} />
        </Inn>
    );
}

function Boller({ x, y, navn }: { x: number; y: number; navn: boolean }) {
    return (
        <Inn forsinkelse={1.4}>
            <Figur x={x - 50} y={y} farge="#1f2937" />
            <Figur x={x + 50} y={y} farge="#1f2937" />
            <Navneskilt x={x} y={y - 260} tekst="Bøller" vis={navn} />
        </Inn>
    );
}

function Banner() {
    return (
        <motion.g initial={{ y: -260 }} animate={{ y: 0 }} transition={{ delay: 0.3, type: 'spring', stiffness: 90, damping: 14 }}>
            <line x1={480} y1={46} x2={480} y2={120} stroke="#111827" strokeWidth={4} />
            <line x1={1120} y1={46} x2={1120} y2={120} stroke="#111827" strokeWidth={4} />
            <rect x={420} y={110} width={760} height={120} rx={10} fill="#fffbeb" stroke="#92400e" strokeWidth={6} />
            <text x={800} y={192} textAnchor="middle" fontSize={68} fontWeight={900} fill="#92400e">
                FOLKETS VILJE?
            </text>
        </motion.g>
    );
}

function Hånd() {
    return (
        <motion.g initial={{ y: -200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 90, damping: 14 }}>
            <rect x={HÅND.x - 32} y={0} width={64} height={60} fill="#1f2937" />
            <path
                d={`M ${HÅND.x - 70} ${HÅND.y + 10} Q ${HÅND.x - 70} ${HÅND.y - 20} ${HÅND.x - 30} ${HÅND.y - 14} L ${HÅND.x + 40} ${HÅND.y - 14} Q ${HÅND.x + 80} ${HÅND.y - 10} ${HÅND.x + 76} ${HÅND.y + 30} L ${HÅND.x + 70} ${HÅND.y + 70} L ${HÅND.x - 64} ${HÅND.y + 70} Z`}
                fill="#e0b48a"
                stroke="#7c4a1e"
                strokeWidth={5}
            />
            <rect x={HÅND.x - 110} y={HÅND.y + 64} width={220} height={14} rx={7} fill="#5b3a1e" />
            <rect x={HÅND.x + 100} y={HÅND.y - 20} width={110} height={56} rx={10} fill="#111827" />
            <text x={HÅND.x + 155} y={HÅND.y + 18} textAnchor="middle" fontSize={34} fontWeight={900} fill="#ffffff">
                CIA
            </text>
        </motion.g>
    );
}

function Regjering({ x, y, krysset }: { x: number; y: number; krysset?: boolean }) {
    return (
        <g>
            <path d={`M ${x - 110} ${y - 200} L ${x} ${y - 270} L ${x + 110} ${y - 200} Z`} fill="#e5e7eb" stroke="#475569" strokeWidth={5} />
            <rect x={x - 100} y={y - 200} width={200} height={200} fill="#f8fafc" stroke="#475569" strokeWidth={5} />
            {[0, 1, 2, 3].map((i) => (
                <rect key={i} x={x - 82 + i * 48} y={y - 180} width={20} height={170} fill="#cbd5e1" />
            ))}
            {krysset && (
                <g stroke="#b91c1c" strokeWidth={16} strokeLinecap="round">
                    <line x1={x - 90} y1={y - 240} x2={x + 90} y2={y - 20} />
                    <line x1={x + 90} y1={y - 240} x2={x - 90} y2={y - 20} />
                </g>
            )}
        </g>
    );
}

function Navneskilt({ x, y, tekst, vis }: { x: number; y: number; tekst: string; vis: boolean }) {
    if (!vis) return null;
    return (
        <motion.text
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={38}
            fontWeight={900}
            fill="#0f172a"
            stroke="#ffffff"
            strokeWidth={9}
            paintOrder="stroke"
        >
            {tekst}
        </motion.text>
    );
}
