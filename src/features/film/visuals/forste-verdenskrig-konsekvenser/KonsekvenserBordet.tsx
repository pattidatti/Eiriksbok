import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Folkeforbundet som et rundt bord sett ovenfra. Stolene fylles med land, snakkebobler går
 * mellom dem i stedet for våpen. Så står tre stoler tomme: USA, Tyskland og Sovjetunionen.
 * Til slutt et tomt felt der en hær skulle stått, og pila videre til FN.
 */

const CX = 800;
const CY = 470;
const R = 250;
const ANTALL = 14;
/** De tre tomme stolene: hvilken plass og fra hvilken beat de vises som tomme. */
const TOMME: Record<number, { navn: string; fra: number }> = {
    0: { navn: 'USA', fra: 2 },
    5: { navn: 'Tyskland', fra: 3 },
    9: { navn: 'Sovjetunionen', fra: 3 },
};
const FARGER = ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#2dd4bf', '#fb923c', '#93c5fd', '#86efac', '#fda4af', '#c4b5fd', '#fcd34d', '#5eead4', '#f9a8d4'];

const STOLER = Array.from({ length: ANTALL }, (_, i) => {
    const a = (i / ANTALL) * Math.PI * 2 - Math.PI / 2;
    return { x: CX + Math.cos(a) * R, y: CY + Math.sin(a) * R, a };
});

export function KonsekvenserBordet({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f1ece2' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <circle cx={CX} cy={CY} r={R - 60} fill="#14532d" stroke="#a16207" strokeWidth={10} />
                <text x={CX} y={CY - 10} textAnchor="middle" fontSize={38} fontWeight={900} fill="#f8fafc">
                    Folkeforbundet
                </text>
                <text x={CX} y={CY + 34} textAnchor="middle" fontSize={26} fontWeight={700} fill="#bbf7d0">
                    {beat >= 5 ? 'forløperen til FN' : 'land møtes og forhandler'}
                </text>

                {STOLER.map((s, i) => {
                    const tom = TOMME[i] && beat >= TOMME[i].fra;
                    return (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + i * 0.12, duration: 0.5 }}
                            style={{ transformOrigin: `${s.x}px ${s.y}px` }}
                        >
                            <circle
                                cx={s.x}
                                cy={s.y}
                                r={40}
                                fill={tom ? '#ffffff' : FARGER[i]}
                                stroke={tom ? '#dc2626' : '#44403c'}
                                strokeWidth={tom ? 6 : 4}
                                strokeDasharray={tom ? '12 8' : undefined}
                                style={{ transition: 'fill 0.8s' }}
                            />
                            {!tom && <circle cx={s.x} cy={s.y} r={16} fill="#44403c" opacity={0.85} />}
                        </motion.g>
                    );
                })}

                {/* Navnelappene på de tomme stolene, utenfor ringen */}
                {Object.entries(TOMME).map(([i, t]) => {
                    if (beat < t.fra) return null;
                    const s = STOLER[Number(i)];
                    const ut = 95;
                    const x = s.x + Math.cos(s.a) * ut;
                    const y = s.y + Math.sin(s.a) * ut;
                    const bredde = t.navn.length * 17 + 36;
                    return (
                        <motion.g key={t.navn} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}>
                            <rect x={x - bredde / 2} y={y - 26} width={bredde} height={48} rx={12} fill="#dc2626" />
                            <text x={x} y={y + 8} textAnchor="middle" fontSize={28} fontWeight={900} fill="#ffffff">
                                {t.navn}
                            </text>
                        </motion.g>
                    );
                })}

                {/* Snakkebobler ved stolene på beat 1: landene snakker sammen */}
                {beat === 1 &&
                    [1, 3, 6, 8, 11, 13].map((i, n) => {
                        const s = STOLER[i];
                        const x = s.x + Math.cos(s.a) * 78;
                        const y = s.y + Math.sin(s.a) * 78;
                        return (
                            <motion.g
                                key={i}
                                initial={{ opacity: 0, scale: 0.4 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + n * 0.4, duration: 0.4 }}
                                style={{ transformOrigin: `${x}px ${y}px` }}
                            >
                                <rect x={x - 34} y={y - 22} width={68} height={44} rx={14} fill="#ffffff" stroke="#44403c" strokeWidth={3} />
                                {[-14, 0, 14].map((dx) => (
                                    <circle key={dx} cx={x + dx} cy={y} r={4.5} fill="#44403c" />
                                ))}
                            </motion.g>
                        );
                    })}
            </svg>

            {beat === 1 && (
                <Kort key="k1" side="hoyre">
                    Snakke og forhandle
                    <div className="text-xl font-bold text-slate-500">i stedet for å krige</div>
                </Kort>
            )}
            {beat === 2 && (
                <Kort key="k2" side="hoyre">
                    Senatet i USA: nei
                    <div className="text-xl font-bold text-slate-500">ville holde seg unna Europa</div>
                </Kort>
            )}
            {beat === 3 && (
                <Kort key="k3" side="hoyre">
                    USA: aldri med
                    <div className="text-xl font-bold text-slate-500">Tyskland og Sovjetunionen: ikke med i begynnelsen</div>
                </Kort>
            )}
            {beat === 4 && (
                <Kort key="k4" side="hoyre">
                    <div className="flex items-center gap-4">
                        <svg viewBox="-50 -50 100 100" style={{ width: 80, height: 80, flexShrink: 0 }}>
                            <path d="M 0 -40 L 34 -26 Q 34 22 0 42 Q -34 22 -34 -26 Z" fill="#94a3b8" stroke="#475569" strokeWidth={4} />
                            <line x1={-38} y1={38} x2={38} y2={-38} stroke="#dc2626" strokeWidth={10} strokeLinecap="round" />
                        </svg>
                        <div>
                            Uten USA, uten egen hær
                            <div className="text-xl font-bold text-slate-500">kunne ikke stoppe angrep i 1930-årene</div>
                        </div>
                    </div>
                </Kort>
            )}
            {beat >= 5 && (
                <Kort key="k5" side="hoyre">
                    Folkeforbundet → FN
                    <div className="text-xl font-bold text-slate-500">forløperen til FN</div>
                </Kort>
            )}
            {beat === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-black text-3xl shadow-xl"
                    style={{ top: '5%', left: '3%' }}
                >
                    Ideen til president Wilson
                </motion.div>
            )}
        </div>
    );
}

function Kort({ children, side }: { children: ReactNode; side: 'venstre' | 'hoyre' }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: side === 'hoyre' ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="absolute rounded-3xl bg-white/95 shadow-2xl px-6 py-4 text-3xl font-black text-slate-900"
            style={{ top: '6%', [side === 'hoyre' ? 'right' : 'left']: '3%', maxWidth: 300 }}
        >
            {children}
        </motion.div>
    );
}
