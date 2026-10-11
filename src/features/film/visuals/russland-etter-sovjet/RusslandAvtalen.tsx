import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Brikke } from './felles';

/**
 * Putins makt som bilder i SVG, i to modus:
 * «avtale»: Jeltsin går av, Putin kommer, og den stilltiende avtalen som en vekt:
 *   orden, lønn og stolthet på den ene siden, folkets plass i politikken på den andre.
 * «tv»: oljepengene strømmer inn, TV-skjermene viser det samme, kritikerne forsvinner,
 *   snakkeboblene slukner én etter én.
 */

type Modus = 'avtale' | 'tv';
const BAK = '#eef2f7';
const MORK = '#1e293b';
const ROD = '#b91c1c';

export function RusslandAvtalen({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'avtale';
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: BAK }}>
            <svg viewBox="0 0 1600 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {modus === 'avtale' ? <Avtale beat={beat} /> : <Tv beat={beat} />}
            </svg>
            <AnimatePresence>
                {modus === 'avtale' && beat === 0 && <Brikke key="a0" tekst="Nyttårsaften 1999" />}
                {modus === 'avtale' && beat === 1 && <Brikke key="a1" tekst="Mars 2000: Putin vinner valget" />}
                {modus === 'avtale' && beat === 2 && <Brikke key="a2" tekst="Avtalen: dette får dere" />}
                {modus === 'avtale' && beat === 3 && <Brikke key="a3" tekst="Prisen: hold dere unna politikken" farge="rod" />}
                {modus === 'tv' && beat === 0 && <Brikke key="t0" tekst="Oljeprisen stiger" />}
                {modus === 'tv' && beat === 1 && <Brikke key="t1" tekst="Mange får det bedre" />}
                {modus === 'tv' && beat === 2 && <Brikke key="t2" tekst="Staten tar TV-kanalene" farge="rod" />}
                {modus === 'tv' && beat === 3 && <Brikke key="t3" tekst="Kritikerne: eksil eller fengsel" farge="mork" />}
                {modus === 'tv' && beat === 4 && <Brikke key="t4" tekst="Den frie debatten forsvinner" farge="rod" />}
            </AnimatePresence>
        </div>
    );
}

function Tekst({
    x,
    y,
    children,
    str = 40,
    farge = MORK,
    forsinkelse = 0.3,
}: {
    x: number;
    y: number;
    children: React.ReactNode;
    str?: number;
    farge?: string;
    forsinkelse?: number;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={str}
            fontWeight={800}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse }}
        >
            {children}
        </motion.text>
    );
}

function Figur({ x, y, farge, skala = 1, ukjent }: { x: number; y: number; farge: string; skala?: number; ukjent?: boolean }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <circle cx={0} cy={-170} r={42} fill={ukjent ? '#94a3b8' : '#fcd9b6'} stroke={MORK} strokeWidth={5} />
            <path d="M -75 0 L -75 -85 Q -75 -125 -30 -125 L 30 -125 Q 75 -125 75 -85 L 75 0 Z" fill={farge} stroke={MORK} strokeWidth={5} />
            {!ukjent && <path d="M -8 -125 L 0 -60 L 8 -125 Z" fill={ROD} />}
            {ukjent && (
                <text x={0} y={-152} textAnchor="middle" fontSize={56} fontWeight={900} fill="#ffffff">
                    ?
                </text>
            )}
        </g>
    );
}

/* ---------- Avtalen ---------- */

const GIR = ['Orden', 'Lønn i tide', 'Et land som reiser seg'];

function Avtale({ beat }: { beat: number }) {
    if (beat <= 1) {
        return (
            <g>
                {/* Gulvet i en stor sal */}
                <rect x={0} y={700} width={1600} height={200} fill="#cbd5e1" />
                <motion.g initial={false} animate={{ x: beat === 0 ? 0 : -260, opacity: beat === 0 ? 1 : 0.35 }} transition={{ duration: 1.4 }}>
                    <Figur x={520} y={700} farge="#475569" />
                    <Tekst x={520} y={780} str={40}>
                        Boris Jeltsin
                    </Tekst>
                </motion.g>
                {beat === 0 && (
                    <motion.path
                        d="M 620 560 Q 800 470 960 540"
                        fill="none"
                        stroke={MORK}
                        strokeWidth={8}
                        strokeDasharray="16 12"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 1.2, duration: 1 }}
                    />
                )}
                <motion.g initial={false} animate={{ x: beat === 0 ? 0 : -160 }} transition={{ duration: 1.4 }}>
                    <Figur x={1080} y={700} farge="#0f172a" ukjent={beat === 0} />
                    <Tekst x={1080} y={780} str={40} forsinkelse={beat === 0 ? 1.6 : 0.6}>
                        {beat === 0 ? 'Nesten ukjent' : 'Vladimir Putin'}
                    </Tekst>
                    {beat === 1 && (
                        <Tekst x={1080} y={830} str={32} farge="#475569" forsinkelse={1.2}>
                            tidligere offiser i KGB
                        </Tekst>
                    )}
                </motion.g>
                {beat === 1 && (
                    <motion.g initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }}>
                        <rect x={1180} y={480} width={200} height={170} rx={10} fill="#ffffff" stroke={MORK} strokeWidth={6} />
                        <rect x={1240} y={470} width={80} height={14} fill={MORK} />
                        <motion.rect
                            x={1250}
                            width={60}
                            height={80}
                            fill="#fef3c7"
                            stroke={MORK}
                            strokeWidth={4}
                            initial={{ y: 340 }}
                            animate={{ y: 420 }}
                            transition={{ delay: 2.4, duration: 0.8 }}
                        />
                        <text x={1280} y={580} textAnchor="middle" fontSize={34} fontWeight={900} fill={MORK}>
                            VALG
                        </text>
                    </motion.g>
                )}
            </g>
        );
    }
    // beat 2-3: vekta
    const vipp = beat === 2 ? -9 : 9;
    return (
        <g>
            <rect x={780} y={300} width={40} height={460} fill={MORK} />
            <path d="M 680 780 L 920 780 L 870 740 L 730 740 Z" fill={MORK} />
            <motion.g initial={false} animate={{ rotate: vipp }} transition={{ type: 'spring', stiffness: 40, damping: 9 }} style={{ transformOrigin: '800px 300px' }}>
                <rect x={260} y={288} width={1080} height={24} rx={12} fill="#334155" />
                {/* Venstre skål: det folket får */}
                <line x1={320} y1={300} x2={320} y2={430} stroke="#334155" strokeWidth={5} />
                <line x1={540} y1={300} x2={540} y2={430} stroke="#334155" strokeWidth={5} />
                <path d="M 230 430 L 630 430 Q 610 500 430 500 Q 250 500 230 430 Z" fill="#0d9488" stroke={MORK} strokeWidth={5} />
                {/* Høyre skål: det folket gir */}
                <line x1={1060} y1={300} x2={1060} y2={430} stroke="#334155" strokeWidth={5} />
                <line x1={1280} y1={300} x2={1280} y2={430} stroke="#334155" strokeWidth={5} />
                <path d="M 970 430 L 1370 430 Q 1350 500 1170 500 Q 990 500 970 430 Z" fill={ROD} stroke={MORK} strokeWidth={5} />
                <text x={1170} y={480} textAnchor="middle" fontSize={34} fontWeight={900} fill="#ffffff">
                    PRISEN
                </text>
                <text x={430} y={480} textAnchor="middle" fontSize={34} fontWeight={900} fill="#ffffff">
                    DERE FÅR
                </text>
            </motion.g>
            {/* Det folket får, som etiketter under vekta */}
            {GIR.map((t, i) => (
                <motion.g key={t} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: beat === 2 ? 0.6 + i * 0.6 : 0 }}>
                    <rect x={130} y={570 + i * 90} width={520} height={72} rx={16} fill="#ffffff" stroke="#0d9488" strokeWidth={5} />
                    <text x={390} y={619 + i * 90} textAnchor="middle" fontSize={40} fontWeight={800} fill={MORK}>
                        {t}
                    </text>
                </motion.g>
            ))}
            {beat === 3 && (
                <motion.g initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                    <rect x={950} y={570} width={540} height={162} rx={16} fill="#ffffff" stroke={ROD} strokeWidth={5} />
                    <text x={1220} y={635} textAnchor="middle" fontSize={40} fontWeight={800} fill={MORK}>
                        Bland dere ikke
                    </text>
                    <text x={1220} y={690} textAnchor="middle" fontSize={40} fontWeight={800} fill={MORK}>
                        i politikken
                    </text>
                </motion.g>
            )}
        </g>
    );
}

/* ---------- Oljepenger og TV ---------- */

const SKJERMFARGER = ['#38bdf8', '#a3e635', '#f472b6', '#fb923c', '#c084fc', '#2dd4bf'];

function Tv({ beat }: { beat: number }) {
    if (beat <= 1) {
        return (
            <g>
                <line x1={200} y1={760} x2={1420} y2={760} stroke={MORK} strokeWidth={5} />
                <line x1={200} y1={760} x2={200} y2={180} stroke={MORK} strokeWidth={5} />
                <Tekst x={800} y={820} str={36}>
                    2000-tallet
                </Tekst>
                <motion.path
                    d="M 200 700 C 500 690 700 600 900 470 S 1250 260 1400 220"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth={14}
                    strokeLinecap="round"
                    initial={{ pathLength: beat === 0 ? 0 : 1 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.4, duration: 2.6 }}
                />
                <Tekst x={1260} y={190} str={40} forsinkelse={beat === 0 ? 2.6 : 0}>
                    Oljeprisen
                </Tekst>
                {beat === 1 && (
                    <>
                        <motion.path
                            d="M 200 730 C 500 720 760 650 950 560 S 1250 420 1400 380"
                            fill="none"
                            stroke="#0d9488"
                            strokeWidth={14}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.4, duration: 2.2 }}
                        />
                        <Tekst x={1250} y={560} str={40} farge="#0f766e" forsinkelse={2.4}>
                            Levestandarden
                        </Tekst>
                    </>
                )}
                {/* Pengene renner inn i statskassen */}
                <rect x={300} y={240} width={240} height={170} rx={14} fill="#fef3c7" stroke={MORK} strokeWidth={6} />
                <text x={420} y={340} textAnchor="middle" fontSize={34} fontWeight={900} fill={MORK}>
                    Statskassen
                </text>
                {Array.from({ length: 6 }, (_, i) => (
                    <motion.circle
                        key={i}
                        cx={420}
                        r={18}
                        fill="#facc15"
                        stroke="#a16207"
                        strokeWidth={4}
                        initial={{ cy: 120, opacity: 0 }}
                        animate={{ cy: [120, 260], opacity: [0, 1, 0] }}
                        transition={{ delay: 0.6 + i * 0.5, duration: 1.1 }}
                    />
                ))}
            </g>
        );
    }
    if (beat === 2) {
        return (
            <g>
                {SKJERMFARGER.map((f, i) => {
                    const x = 260 + (i % 3) * 380;
                    const y = 180 + Math.floor(i / 3) * 310;
                    return (
                        <g key={i}>
                            <rect x={x} y={y} width={320} height={230} rx={18} fill="#0f172a" />
                            <motion.rect
                                x={x + 16}
                                y={y + 16}
                                width={288}
                                height={198}
                                rx={8}
                                initial={{ fill: f }}
                                animate={{ fill: '#991b1b' }}
                                transition={{ delay: 0.8 + i * 0.45, duration: 0.4 }}
                            />
                            <motion.path
                                d={`M ${x + 160} ${y + 60} l 14 30 32 3 -24 21 8 32 -30 -17 -30 17 8 -32 -24 -21 32 -3 Z`}
                                fill="#facc15"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 + i * 0.45 }}
                            />
                            <rect x={x + 130} y={y + 230} width={60} height={20} fill="#0f172a" />
                        </g>
                    );
                })}
                <Tekst x={800} y={850} str={40} forsinkelse={3.6}>
                    Alle kanalene viser det samme
                </Tekst>
            </g>
        );
    }
    if (beat === 3) {
        return (
            <g>
                <rect x={0} y={700} width={1600} height={200} fill="#cbd5e1" />
                <motion.g initial={{ x: 0 }} animate={{ x: 520 }} transition={{ delay: 0.8, duration: 3.5, ease: 'easeIn' }}>
                    <Figur x={520} y={700} farge="#2563eb" skala={0.9} />
                    <rect x={590} y={600} width={90} height={70} rx={8} fill="#92400e" stroke={MORK} strokeWidth={4} />
                    <Tekst x={520} y={780} str={36}>
                        Medieeier
                    </Tekst>
                </motion.g>
                <Tekst x={1300} y={300} str={40} farge="#2563eb" forsinkelse={2.6}>
                    ut av landet
                </Tekst>
                <Figur x={240} y={700} farge="#0f172a" skala={0.9} />
                <Tekst x={240} y={780} str={36}>
                    Oligark
                </Tekst>
                <motion.g initial={{ opacity: 0, y: -200 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, type: 'spring', stiffness: 120, damping: 16 }}>
                    <rect x={120} y={460} width={240} height={250} fill="none" stroke="#475569" strokeWidth={8} />
                    {[0, 1, 2, 3, 4].map((i) => (
                        <line key={i} x1={150 + i * 45} y1={460} x2={150 + i * 45} y2={710} stroke="#475569" strokeWidth={8} />
                    ))}
                </motion.g>
                <Tekst x={240} y={420} str={40} farge={ROD} forsinkelse={2.2}>
                    fengsel
                </Tekst>
            </g>
        );
    }
    // beat 4: snakkeboblene slukner
    return (
        <g>
            <rect x={0} y={700} width={1600} height={200} fill="#cbd5e1" />
            {Array.from({ length: 6 }, (_, i) => {
                const x = 220 + i * 230;
                return (
                    <g key={i}>
                        <Figur x={x} y={700} farge="#64748b" skala={0.7} />
                        <motion.g initial={{ opacity: 1, scale: 1 }} animate={{ opacity: 0, scale: 0.6 }} transition={{ delay: 0.8 + i * 0.55, duration: 0.6 }} style={{ transformOrigin: `${x}px 440px` }}>
                            <rect x={x - 80} y={360} width={160} height={100} rx={30} fill="#ffffff" stroke={MORK} strokeWidth={5} />
                            <path d={`M ${x - 20} ${458} L ${x} ${500} L ${x + 15} ${458}`} fill="#ffffff" stroke={MORK} strokeWidth={5} />
                            <circle cx={x - 35} cy={410} r={10} fill={MORK} />
                            <circle cx={x} cy={410} r={10} fill={MORK} />
                            <circle cx={x + 35} cy={410} r={10} fill={MORK} />
                        </motion.g>
                    </g>
                );
            })}
            <Tekst x={800} y={250} str={56} farge={ROD} forsinkelse={4.2}>
                Bit for bit
            </Tekst>
        </g>
    );
}
