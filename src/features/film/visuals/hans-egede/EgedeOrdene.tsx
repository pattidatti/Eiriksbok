import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Ordene mellom Egede og inuittene: presten som ikke kunne språket, sønnen Poul som
 * oversatte, svaret som kanskje betydde «jeg vet ikke», og brødet som ble til sel.
 * Egede står til venstre, inuittene til høyre.
 */

type Modus = 'poul' | 'brod';

const PREST = '#1f2937';
const INUIT = '#1d4ed8';
const GRONN = '#15803d';
const ROD = '#b91c1c';
const GULL = '#b45309';

const TEKST: Record<Modus, string[]> = {
    poul: [
        'Folket han kom for, fantes ikke',
        'Nytt mål: gjøre inuittene kristne',
        'Han lærte aldri språket skikkelig',
        'Sønnen Poul lærte grønlandsk',
        'Bare noen få barn ble døpt',
    ],
    brod: ['Det Egede trodde han hørte', 'Det historikere i dag tror de sa', 'Ingen korn, ingen brød', 'Vårt daglige sel'],
};

export function EgedeOrdene({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'poul';
    const liste = TEKST[modus];
    const b = Math.min(beat, liste.length - 1);
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-[#e0edf6] to-[#f5efe0] overflow-hidden">
            <svg viewBox="0 0 1600 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* Bakke og fjell i bakgrunnen */}
                <path d="M 0 610 L 220 470 L 380 560 L 600 430 L 820 560 L 1040 450 L 1260 560 L 1450 470 L 1600 540 L 1600 900 L 0 900 Z" fill="#cbd5e1" opacity={0.6} />
                <path d="M 0 720 L 1600 720 L 1600 900 L 0 900 Z" fill="#e7e2d3" />

                <motion.text
                    key={`${modus}-${b}`}
                    x={800}
                    y={110}
                    textAnchor="middle"
                    fontSize={56}
                    fontWeight={900}
                    fill="#0f172a"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    {liste[b]}
                </motion.text>

                <Prest x={300} />

                {modus === 'poul' && <Poul beat={b} />}
                {modus === 'brod' && <Brod beat={b} />}
            </svg>
        </div>
    );
}

function Poul({ beat }: { beat: number }) {
    return (
        <>
            {beat === 0 && (
                <>
                    <Boble x={300} y={270} b={170} tekst="?" farge={GULL} stor />
                    <motion.text x={1150} y={560} textAnchor="middle" fontSize={44} fontWeight={800} fill="#64748b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                        Ingen nordboere
                    </motion.text>
                </>
            )}
            {beat >= 1 && beat <= 3 && <Inuitter x={1240} antall={3} />}
            {beat === 1 && (
                <>
                    <Boble x={300} y={270} b={170} farge={PREST}>
                        <Kors x={300} y={270} />
                    </Boble>
                    <Pil x1={460} x2={1060} y={420} farge={PREST} />
                </>
            )}
            {beat === 2 && (
                <>
                    <Boble x={300} y={270} b={300} tekst="Gu... tr...?" farge={ROD} />
                    <motion.path
                        d="M 460 420 L 620 420 M 700 420 L 860 420 M 940 420 L 1060 420"
                        stroke={ROD}
                        strokeWidth={10}
                        strokeLinecap="round"
                        strokeDasharray="4 22"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, delay: 0.4 }}
                    />
                    <motion.text x={780} y={470} textAnchor="middle" fontSize={120} fontWeight={900} fill={ROD} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
                        ×
                    </motion.text>
                </>
            )}
            {beat === 3 && (
                <>
                    <Person x={780} farge="#7c2d12" liten />
                    <motion.text x={780} y={815} textAnchor="middle" fontSize={40} fontWeight={900} fill="#7c2d12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        Poul
                    </motion.text>
                    <Pil x1={440} x2={680} y={430} farge={PREST} />
                    <Pil x1={880} x2={1080} y={430} farge={GRONN} forsinkelse={1.2} />
                    <Etikett x={560} y={380} tekst="dansk" farge={PREST} />
                    <Etikett x={980} y={380} tekst="grønlandsk" farge={GRONN} forsinkelse={1.2} />
                </>
            )}
            {beat === 4 && <Dop />}
        </>
    );
}

function Brod({ beat }: { beat: number }) {
    return (
        <>
            {beat <= 1 && <Inuitter x={1240} antall={2} />}
            {beat <= 1 && <Boble x={300} y={270} b={330} tekst="Finnes Gud?" farge={PREST} />}
            {beat <= 1 && (
                <Boble x={1240} y={270} b={300} tekst={beat === 0 ? '«...»' : 'Jeg vet ikke'} farge={beat === 0 ? '#64748b' : GULL} key={beat} />
            )}
            {beat <= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                    <rect x={680} y={330} width={240} height={110} rx={55} fill="#ffffff" stroke={GRONN} strokeWidth={6} />
                    <text x={800} y={402} textAnchor="middle" fontSize={56} fontWeight={900} fill={GRONN}>
                        Ja!
                    </text>
                    <text x={800} y={480} textAnchor="middle" fontSize={30} fontWeight={700} fill="#475569">
                        hørte Egede
                    </text>
                    {beat === 1 && (
                        <motion.path
                            d="M 690 340 L 910 430"
                            stroke={ROD}
                            strokeWidth={12}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 1.2, duration: 0.5 }}
                        />
                    )}
                </motion.g>
            )}
            {beat === 2 && (
                <>
                    <Brodet x={800} y={430} />
                    <Korn x={1180} y={470} />
                    <motion.path
                        d="M 620 300 L 980 560 M 980 300 L 620 560"
                        stroke={ROD}
                        strokeWidth={16}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 1, duration: 0.6 }}
                    />
                </>
            )}
            {beat >= 3 && (
                <>
                    <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <rect x={560} y={210} width={900} height={200} rx={20} fill="#fffbeb" stroke="#a8a29e" strokeWidth={5} />
                        <text x={1010} y={300} textAnchor="middle" fontSize={44} fontWeight={800} fill="#292524">
                            Gi oss i dag vårt daglige
                        </text>
                        <text x={900} y={370} textAnchor="middle" fontSize={52} fontWeight={900} fill="#a8a29e">
                            brød
                        </text>
                        <motion.path d="M 840 355 L 960 355" stroke={ROD} strokeWidth={8} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.8 }} />
                        <motion.text x={1100} y={372} textAnchor="middle" fontSize={64} fontWeight={900} fill={INUIT} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
                            sel
                        </motion.text>
                    </motion.g>
                    <Sel x={1060} y={600} />
                </>
            )}
        </>
    );
}

/** Egede i prestekjole med hvit krage. */
function Prest({ x }: { x: number }) {
    return (
        <g transform={`translate(${x} 0)`}>
            <path d="M -70 760 L -50 520 Q 0 490 50 520 L 70 760 Z" fill={PREST} />
            <ellipse cx={0} cy={515} rx={52} ry={18} fill="#ffffff" stroke="#cbd5e1" strokeWidth={3} />
            <circle cx={0} cy={460} r={44} fill="#f1d3b3" />
            <path d="M -46 452 Q -40 400 0 404 Q 40 400 46 452 Q 30 430 0 430 Q -30 430 -46 452 Z" fill="#e5e7eb" />
            <text x={0} y={815} textAnchor="middle" fontSize={40} fontWeight={900} fill={PREST}>
                Egede
            </text>
        </g>
    );
}

function Person({ x, farge, liten, forsinkelse = 0 }: { x: number; farge: string; liten?: boolean; forsinkelse?: number }) {
    const s = liten ? 0.75 : 1;
    return (
        <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: forsinkelse, duration: 0.6 }}>
            <g transform={`translate(${x} ${760 - 760 * s}) scale(${s})`}>
                <path d="M -58 760 L -46 540 Q 0 510 46 540 L 58 760 Z" fill={farge} />
                <circle cx={0} cy={480} r={40} fill="#d9a77a" />
                <path d="M -48 486 Q -50 420 0 418 Q 50 420 48 486 Q 40 446 0 444 Q -40 446 -48 486 Z" fill={farge} opacity={0.85} />
            </g>
        </motion.g>
    );
}

function Inuitter({ x, antall }: { x: number; antall: number }) {
    const plass = antall === 3 ? [-130, 0, 130] : [-70, 70];
    return (
        <g>
            {plass.map((dx, i) => (
                <Person key={dx} x={x + dx} farge={i % 2 ? '#0e7490' : INUIT} liten={i !== Math.floor(antall / 2)} forsinkelse={0.2 + i * 0.2} />
            ))}
            <text x={x} y={815} textAnchor="middle" fontSize={40} fontWeight={900} fill={INUIT}>
                Inuitter
            </text>
        </g>
    );
}

function Boble({
    x,
    y,
    b,
    tekst,
    farge,
    stor,
    children,
}: {
    x: number;
    y: number;
    b: number;
    tekst?: string;
    farge: string;
    stor?: boolean;
    children?: ReactNode;
}) {
    const h = stor ? 150 : 120;
    return (
        <motion.g initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 220, damping: 15 }} style={{ transformOrigin: `${x}px ${y}px` }}>
            <path d={`M ${x - 18} ${y + h / 2 - 4} L ${x} ${y + h / 2 + 50} L ${x + 22} ${y + h / 2 - 4} Z`} fill="#ffffff" stroke={farge} strokeWidth={5} />
            <rect x={x - b / 2} y={y - h / 2} width={b} height={h} rx={h / 2} fill="#ffffff" stroke={farge} strokeWidth={6} />
            <rect x={x - 20} y={y + h / 2 - 8} width={40} height={12} fill="#ffffff" />
            {tekst && (
                <text x={x} y={y + (stor ? 36 : 18)} textAnchor="middle" fontSize={stor ? 110 : 50} fontWeight={900} fill={farge}>
                    {tekst}
                </text>
            )}
            {children}
        </motion.g>
    );
}

function Kors({ x, y }: { x: number; y: number }) {
    return <path d={`M ${x} ${y - 40} L ${x} ${y + 40} M ${x - 28} ${y - 14} L ${x + 28} ${y - 14}`} stroke={PREST} strokeWidth={14} strokeLinecap="round" />;
}

function Pil({ x1, x2, y, farge, forsinkelse = 0.5 }: { x1: number; x2: number; y: number; farge: string; forsinkelse?: number }) {
    return (
        <g>
            <motion.path d={`M ${x1} ${y} L ${x2} ${y}`} stroke={farge} strokeWidth={10} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: forsinkelse, duration: 0.9 }} />
            <motion.path d={`M ${x2 - 6} ${y - 24} L ${x2 + 30} ${y} L ${x2 - 6} ${y + 24} Z`} fill={farge} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: forsinkelse + 0.8 }} />
        </g>
    );
}

function Etikett({ x, y, tekst, farge, forsinkelse = 0.5 }: { x: number; y: number; tekst: string; farge: string; forsinkelse?: number }) {
    return (
        <motion.text x={x} y={y} textAnchor="middle" fontSize={42} fontWeight={900} fill={farge} stroke="#ffffff" strokeWidth={6} paintOrder="stroke" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: forsinkelse + 0.4 }}>
            {tekst}
        </motion.text>
    );
}

/** Mange barn, og bare noen få er døpt (merket med en dråpe). */
function Dop() {
    const barn = Array.from({ length: 14 }, (_, i) => i);
    const dopt = new Set([3, 8, 11]);
    return (
        <g>
            {barn.map((i) => {
                const x = 560 + (i % 7) * 140;
                const y = i < 7 ? 440 : 640;
                const d = dopt.has(i);
                return (
                    <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.05 }}>
                        <circle cx={x} cy={y - 70} r={26} fill={d ? '#d9a77a' : '#cbd5e1'} />
                        <path d={`M ${x - 34} ${y + 40} L ${x - 26} ${y - 36} Q ${x} ${y - 50} ${x + 26} ${y - 36} L ${x + 34} ${y + 40} Z`} fill={d ? INUIT : '#cbd5e1'} />
                        {d && (
                            <motion.path
                                d={`M ${x} ${y - 160} Q ${x + 18} ${y - 132} ${x} ${y - 122} Q ${x - 18} ${y - 132} ${x} ${y - 160} Z`}
                                fill="#38bdf8"
                                stroke="#ffffff"
                                strokeWidth={3}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.2 }}
                            />
                        )}
                    </motion.g>
                );
            })}
        </g>
    );
}

function Brodet({ x, y }: { x: number; y: number }) {
    return (
        <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }} style={{ transformOrigin: `${x}px ${y}px` }}>
            <path d={`M ${x - 160} ${y + 60} Q ${x - 180} ${y - 90} ${x} ${y - 100} Q ${x + 180} ${y - 90} ${x + 160} ${y + 60} Z`} fill="#d6a058" stroke="#92400e" strokeWidth={6} />
            {[-80, -20, 40, 100].map((dx) => (
                <path key={dx} d={`M ${x + dx - 20} ${y - 40} Q ${x + dx} ${y - 70} ${x + dx + 20} ${y - 40}`} stroke="#92400e" strokeWidth={6} fill="none" />
            ))}
        </motion.g>
    );
}

function Korn({ x, y }: { x: number; y: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <path d={`M ${x} ${y + 140} L ${x} ${y - 60}`} stroke="#a16207" strokeWidth={6} />
            {[0, 1, 2, 3].map((i) => (
                <g key={i}>
                    <ellipse cx={x - 16} cy={y - 40 + i * 34} rx={10} ry={18} fill="#ca8a04" transform={`rotate(-25 ${x - 16} ${y - 40 + i * 34})`} />
                    <ellipse cx={x + 16} cy={y - 40 + i * 34} rx={10} ry={18} fill="#ca8a04" transform={`rotate(25 ${x + 16} ${y - 40 + i * 34})`} />
                </g>
            ))}
            <path d={`M ${x - 60} ${y - 80} L ${x + 60} ${y + 160} M ${x + 60} ${y - 80} L ${x - 60} ${y + 160}`} stroke={ROD} strokeWidth={10} strokeLinecap="round" />
        </motion.g>
    );
}

function Sel({ x, y }: { x: number; y: number }) {
    return (
        <AnimatePresence>
            <motion.g initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6, duration: 0.8 }}>
                <path
                    d={`M ${x - 170} ${y + 40} Q ${x - 120} ${y - 60} ${x + 40} ${y - 50} Q ${x + 130} ${y - 46} ${x + 150} ${y + 10} Q ${x + 160} ${y + 50} ${x + 100} ${y + 56} L ${x - 140} ${y + 60} Q ${x - 200} ${y + 70} ${x - 220} ${y + 30} Q ${x - 190} ${y + 50} ${x - 170} ${y + 40} Z`}
                    fill="#64748b"
                />
                <circle cx={x + 110} cy={y - 6} r={7} fill="#0f172a" />
                <path d={`M ${x + 10} ${y + 50} Q ${x + 40} ${y + 90} ${x - 20} ${y + 90}`} stroke="#475569" strokeWidth={14} fill="none" strokeLinecap="round" />
                <path d={`M ${x + 140} ${y + 16} L ${x + 180} ${y + 6} M ${x + 140} ${y + 22} L ${x + 182} ${y + 26}`} stroke="#334155" strokeWidth={3} />
            </motion.g>
        </AnimatePresence>
    );
}
