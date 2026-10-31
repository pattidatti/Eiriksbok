import { useEffect, useState } from 'react';
import { animate, AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Vippa: unge (under 20) på den ene siden, eldre (over 65) på den andre. Fram til 2032
 * veier de unge mest. I 2032 vipper den over. Antall figurer er en skisse, ikke tall.
 */

const B = 1600;
const H = 900;
const PX = 800;
const PY = 560;
const ARM = 470;
const SNOR = 120;

const UNGE = '#2563eb';
const ELDRE = '#ea580c';

function Person({ x, y, farge, gammel }: { x: number; y: number; farge: string; gammel?: boolean }) {
    return (
        <g>
            <circle cx={x} cy={y - 62} r={17} fill={gammel ? '#e2e8f0' : '#fcd9b6'} stroke={farge} strokeWidth={5} />
            <rect x={x - 18} y={y - 42} width={36} height={42} rx={14} fill={farge} />
        </g>
    );
}

/** Vinkelen glir mot målet. Endepunktene regnes ut i stedet for å rotere en <g>. */
function useVinkel(maal: number) {
    const [v, setV] = useState(0);
    useEffect(() => {
        const c = animate(v, maal, {
            type: 'spring',
            stiffness: 40,
            damping: 9,
            onUpdate: setV,
        });
        return () => c.stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maal]);
    return v;
}

function Aar({ beat }: { beat: number }) {
    const maal = beat >= 2 ? 2032 : 2026;
    const [aar, setAar] = useState(2026);
    useEffect(() => {
        const c = animate(2026, maal, {
            duration: maal === 2026 ? 0 : 2,
            onUpdate: (x) => setAar(Math.round(x)),
        });
        return () => c.stop();
    }, [maal]);
    return <>{aar}</>;
}

export function EldrebolgenVekt({ beat }: VisualProps) {
    // Positiv vinkel: høyre side (eldre) går ned.
    const vinkel = useVinkel(beat >= 2 ? 9 : -9);
    const r = (vinkel * Math.PI) / 180;
    const vx = PX - Math.cos(r) * ARM;
    const vy = PY - Math.sin(r) * ARM;
    const hx = PX + Math.cos(r) * ARM;
    const hy = PY + Math.sin(r) * ARM;
    const antallEldre = beat >= 2 ? 6 : 4;

    const skal = (x: number, y: number, n: number, farge: string, gammel: boolean) => {
        const bunn = y + SNOR;
        return (
            <g>
                <line x1={x} y1={y} x2={x - 130} y2={bunn} stroke="#475569" strokeWidth={4} />
                <line x1={x} y1={y} x2={x + 130} y2={bunn} stroke="#475569" strokeWidth={4} />
                <rect x={x - 160} y={bunn} width={320} height={22} rx={11} fill="#334155" />
                {Array.from({ length: n }, (_, i) => {
                    const kol = i % 4;
                    const rad = Math.floor(i / 4);
                    const bredde = Math.min(n - rad * 4, 4);
                    const px = x - ((bredde - 1) * 62) / 2 + kol * 62;
                    return <Person key={i} x={px} y={bunn - rad * 92} farge={farge} gammel={gammel} />;
                })}
            </g>
        );
    };

    const tittel =
        beat === 0
            ? 'En framskriving: en beregning av framtiden'
            : beat === 1
              ? 'Født, døde og flyttet'
              : beat === 2
                ? 'Flere over 65 enn under 20'
                : 'Aldri før i Norge';

    return (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #fff7ed 0%, #fde7c8 100%)' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <AnimatePresence mode="wait">
                    <motion.text
                        key={tittel}
                        x={800}
                        y={90}
                        textAnchor="middle"
                        fontSize={52}
                        fontWeight={900}
                        fill="#0f172a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {tittel}
                    </motion.text>
                </AnimatePresence>

                {/* Årstallet */}
                <text
                    x={800}
                    y={220}
                    textAnchor="middle"
                    fontSize={110}
                    fontWeight={900}
                    fill={beat >= 2 ? ELDRE : '#334155'}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                    <Aar beat={beat} />
                </text>

                {/* Foten */}
                <polygon points={`${PX},${PY} ${PX - 70},${H - 40} ${PX + 70},${H - 40}`} fill="#475569" />
                <line x1={vx} y1={vy} x2={hx} y2={hy} stroke="#1e293b" strokeWidth={18} strokeLinecap="round" />
                <circle cx={PX} cy={PY} r={16} fill="#f8fafc" stroke="#1e293b" strokeWidth={6} />

                {skal(vx, vy, 5, UNGE, false)}
                {skal(hx, hy, antallEldre, ELDRE, true)}

                <text x={vx} y={vy + SNOR + 80} textAnchor="middle" fontSize={40} fontWeight={900} fill={UNGE}>
                    under 20 år
                </text>
                <text x={hx} y={hy + SNOR + 80} textAnchor="middle" fontSize={40} fontWeight={900} fill={ELDRE}>
                    over 65 år
                </text>

                {/* Beat 1: det framskrivingen bygger på */}
                {beat === 1 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        {['født', 'dør', 'flytter'].map((t, i) => (
                            <g key={t}>
                                <rect x={560 + i * 170} y={270} width={150} height={60} rx={30} fill="#ffffff" stroke="#cbd5e1" strokeWidth={3} />
                                <text x={635 + i * 170} y={312} textAnchor="middle" fontSize={34} fontWeight={800} fill="#334155">
                                    {t}
                                </text>
                            </g>
                        ))}
                    </motion.g>
                )}
                {beat === 1 && (
                    <motion.text
                        x={800}
                        y={380}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#64748b"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        SSB, juni 2026
                    </motion.text>
                )}
                {beat === 0 && (
                    <motion.text
                        x={800}
                        y={300}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#64748b"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        I dag veier de unge mest
                    </motion.text>
                )}
                {beat >= 3 && (
                    <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
                        <rect x={560} y={262} width={480} height={74} rx={37} fill="#0f172a" />
                        <text x={800} y={312} textAnchor="middle" fontSize={38} fontWeight={900} fill="#fde68a">
                            første gang i Norge
                        </text>
                    </motion.g>
                )}
            </svg>
        </div>
    );
}
