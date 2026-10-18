import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { B, H } from './data';
import { GlideStil, Overskrift, Varer } from './figurer';

/**
 * Handelskrigen mellom USA og Kina: to varestrømmer over havet.
 * Beat 0 USA setter opp tollbom på varer fra Kina, beat 1 Kina svarer med egen bom, beat 2 en
 * avansert databrikke stoppes på vei til Kina, beat 3 ny kald krig? Handelen er fortsatt enorm,
 * ikke som mellom USA og Sovjetunionen.
 */

const TOPP = 290;
const BUNN = 500;
const USA_X = 250;
const KINA_X = 1350;

function Land({ x, navn, farge }: { x: number; navn: string; farge: string }) {
    return (
        <g>
            <rect x={x - 170} y={160} width={340} height={460} rx={36} fill={farge} />
            <text x={x} y={412} textAnchor="middle" fontSize={64} fontWeight={900} fill="#fff">
                {navn}
            </text>
        </g>
    );
}

function Bom({ x, y, nede, tekst }: { x: number; y: number; nede: boolean; tekst: string }) {
    return (
        <g>
            <rect x={x - 22} y={y - 110} width={44} height={70} rx={6} fill="#334155" />
            <motion.rect
                x={x - 8}
                y={y - 100}
                width={16}
                rx={6}
                fill="#dc2626"
                stroke="#fff"
                strokeWidth={4}
                initial={{ height: 0 }}
                animate={{ height: nede ? 170 : 0 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 }}
            />
            <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
                <rect x={x - 70} y={y - 175} width={140} height={54} rx={14} fill="#fff" stroke="#dc2626" strokeWidth={4} />
                <text x={x} y={y - 137} textAnchor="middle" fontSize={32} fontWeight={900} fill="#dc2626">
                    {tekst}
                </text>
            </motion.g>
        </g>
    );
}

const OVERSKRIFT = ['2018: USA legger på toll', 'Kina svarer', 'Stopp for avansert teknologi', 'En ny kald krig?'];

export function VerdensordenToll({ beat, playing }: VisualProps) {
    const b = Math.min(beat, 3);
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#cfe3f0' }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <GlideStil />
                <Land x={USA_X} navn="USA" farge="#2563eb" />
                <Land x={KINA_X} navn="Kina" farge="#dc2626" />
                {/* Varer fra Kina til USA (øverst) og fra USA til Kina (nederst) */}
                <line x1={KINA_X - 170} y1={TOPP} x2={USA_X + 170} y2={TOPP} stroke="#94a3b8" strokeWidth={b === 3 ? 70 : 52} strokeOpacity={0.45} />
                <line x1={USA_X + 170} y1={BUNN} x2={KINA_X - 170} y2={BUNN} stroke="#94a3b8" strokeWidth={b === 3 ? 70 : 52} strokeOpacity={0.45} />
                <g transform={`translate(${KINA_X - 170 + USA_X + 170} 0) scale(-1 1)`}>
                    <Varer x0={KINA_X - 170} x1={USA_X + 170} y={TOPP} farge="#fca5a5" antall={8} tid={7} playing={playing} />
                </g>
                <Varer x0={USA_X + 170} x1={KINA_X - 170} y={BUNN} farge="#93c5fd" antall={8} tid={7} playing={playing} />
                <text x={800} y={TOPP - 50} textAnchor="middle" fontSize={28} fontWeight={700} fill="#334155">
                    ← varer fra Kina
                </text>
                {b !== 2 && (
                    <text x={800} y={BUNN + 100} textAnchor="middle" fontSize={28} fontWeight={700} fill="#334155">
                        varer fra USA →
                    </text>
                )}
                <Bom x={USA_X + 240} y={TOPP} nede={true} tekst="+ toll" />
                {b >= 1 && <Bom x={KINA_X - 240} y={BUNN} nede={true} tekst="+ toll" />}
                {b === 2 && (
                    <motion.g
                        initial={{ x: USA_X + 220, opacity: 0 }}
                        animate={{ x: 760, opacity: 1 }}
                        transition={{ duration: 1.6, ease: 'easeOut', delay: 0.3 }}
                    >
                        <rect x={-40} y={BUNN - 40} width={80} height={80} rx={10} fill="#7c3aed" stroke="#fff" strokeWidth={5} />
                        {[-20, 0, 20].map((d) => (
                            <g key={d}>
                                <rect x={d - 4} y={BUNN - 54} width={8} height={14} fill="#4c1d95" />
                                <rect x={d - 4} y={BUNN + 40} width={8} height={14} fill="#4c1d95" />
                            </g>
                        ))}
                    </motion.g>
                )}
                {b === 2 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
                        <rect x={850} y={BUNN - 90} width={60} height={180} rx={10} fill="#b91c1c" />
                        <text x={880} y={BUNN + 140} textAnchor="middle" fontSize={34} fontWeight={900} fill="#b91c1c">
                            STOPP
                        </text>
                    </motion.g>
                )}
            </svg>

            <Overskrift tekst={OVERSKRIFT[b]} rod={b === 2} />

            <AnimatePresence>
                {b === 0 && (
                    <motion.div
                        key="toll"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 1.4 }}
                        className="absolute left-1/2 -translate-x-1/2 bottom-[5%] px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center whitespace-nowrap"
                    >
                        <span className="text-2xl font-black text-slate-900">Toll</span>
                        <span className="text-2xl font-semibold text-slate-600"> = ekstra avgift på varer fra et annet land</span>
                    </motion.div>
                )}
                {b === 3 && (
                    <motion.div
                        key="kald"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.8 }}
                        className="absolute left-1/2 -translate-x-1/2 bottom-[3%] px-6 py-3 rounded-2xl bg-white/95 shadow-xl"
                    >
                        <div className="flex items-center gap-4 text-xl font-bold text-slate-700">
                            <span className="w-72 whitespace-nowrap">USA og Sovjetunionen</span>
                            <span className="inline-block w-40 h-1 rounded bg-slate-400" />
                            <span className="whitespace-nowrap">lite handel</span>
                        </div>
                        <div className="flex items-center gap-4 text-xl font-bold text-slate-900 mt-2">
                            <span className="w-72 whitespace-nowrap">USA og Kina</span>
                            <span className="inline-block w-40 h-5 rounded bg-amber-500" />
                            <span className="whitespace-nowrap">enormt mye handel</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
