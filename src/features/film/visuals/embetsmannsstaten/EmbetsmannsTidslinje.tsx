import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { BLEKK, BONDE, EMBETSMANN } from './farger';

/** Veien fra Grunnloven i 1814 til stemmerett for alle kvinner i 1913, steg for steg. */

const FRA = 1814;
const TIL = 1913;
const X0 = 140;
const X1 = 1460;
const aarTilX = (aar: number) => X0 + ((aar - FRA) / (TIL - FRA)) * (X1 - X0);

const MERKER: { aar: number; tekst: string; fraBeat: number; over: boolean }[] = [
    { aar: 1814, tekst: 'Grunnloven', fraBeat: 1, over: false },
    { aar: 1833, tekst: 'Bøndene vinner\nStortinget', fraBeat: 1, over: true },
    { aar: 1837, tekst: 'Bygdene styrer\nseg selv', fraBeat: 2, over: false },
    { aar: 1884, tekst: 'Regjeringen må ha\nStortinget med seg', fraBeat: 2, over: true },
    { aar: 1898, tekst: 'Alle menn\nfår stemme', fraBeat: 3, over: false },
    { aar: 1913, tekst: 'Alle kvinner\nfår stemme', fraBeat: 3, over: true },
];

const B = 270;

export function EmbetsmannsTidslinje({ beat }: VisualProps) {
    const x1884 = aarTilX(1884);
    return (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-green-50">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <text x={800} y={90} textAnchor="middle" fontSize={54} fontWeight={900} fill={BLEKK}>
                    Steg for steg
                </text>

                {/* Tidsaksen: embetsmannsstaten i blått, tiden etter i grønt */}
                <rect x={X0} y={440} width={X1 - X0} height={64} rx={32} fill="#e2e8f0" />
                <motion.rect
                    x={X0}
                    y={440}
                    height={64}
                    rx={32}
                    fill={EMBETSMANN}
                    initial={{ width: 0 }}
                    animate={{ width: x1884 - X0 }}
                    transition={{ duration: 1.6, ease: 'easeOut' }}
                />
                <motion.rect
                    x={x1884}
                    y={440}
                    height={64}
                    rx={32}
                    fill={BONDE}
                    initial={{ width: 0 }}
                    animate={{ width: beat >= 2 ? X1 - x1884 : 0 }}
                    transition={{ duration: 1.4, ease: 'easeOut' }}
                />
                <text x={(aarTilX(1840) + x1884) / 2} y={484} textAnchor="middle" fontSize={32} fontWeight={900} fill="#fff">
                    Embetsmannsstaten
                </text>

                {MERKER.map((m) => {
                    if (beat < m.fraBeat) return null;
                    const x = aarTilX(m.aar);
                    const kx = Math.min(Math.max(x, B / 2 + 20), 1600 - B / 2 - 20);
                    const ky = m.over ? 190 : 590;
                    const ny = beat === m.fraBeat;
                    return (
                        <motion.g
                            key={m.aar}
                            initial={{ opacity: 0, y: m.over ? -20 : 20 }}
                            animate={{ opacity: ny ? 1 : 0.75, y: 0 }}
                            transition={{ delay: ny ? (m.over ? 0.9 : 0.3) : 0, type: 'spring', stiffness: 140, damping: 18 }}
                        >
                            <line
                                x1={x}
                                y1={m.over ? ky + 200 : 504}
                                x2={x}
                                y2={m.over ? 440 : ky}
                                stroke={BLEKK}
                                strokeWidth={4}
                            />
                            <circle cx={x} cy={472} r={14} fill="#fff" stroke={BLEKK} strokeWidth={5} />
                            <rect
                                x={kx - B / 2}
                                y={ky}
                                width={B}
                                height={200}
                                rx={22}
                                fill="#fff"
                                stroke={ny ? BLEKK : '#e2e8f0'}
                                strokeWidth={ny ? 6 : 3}
                            />
                            <text x={kx} y={ky + 68} textAnchor="middle" fontSize={52} fontWeight={900} fill={m.aar >= 1884 ? BONDE : EMBETSMANN}>
                                {m.aar}
                            </text>
                            {m.tekst.split('\n').map((l, i) => (
                                <text key={i} x={kx} y={ky + 120 + i * 36} textAnchor="middle" fontSize={28} fontWeight={800} fill="#334155">
                                    {l}
                                </text>
                            ))}
                        </motion.g>
                    );
                })}
            </svg>
        </div>
    );
}
