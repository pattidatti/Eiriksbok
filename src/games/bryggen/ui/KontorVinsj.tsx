import { motion } from 'framer-motion';
import type { VinsjHud } from '../graboks/kontor-vinsj';
import { ETIKETT, PANEL } from './stil';
import { useNaa } from './useNaa';

// Vinsjen sett fra siden: gavlen med loftsdøra til høyre, bjelken med trinsa øverst, tauet og bunten
// som svinger, og sveiven nede på kaia. Grønt felt ved døra når bunten er høyt nok; rødt blink når den
// smeller. Neste tast (A eller D) står stort ved sveiven.

const W = 560;
const HH = 250;
const VEGG_X = 380;
const TRINSE_X = 330;
const m = (h: number, topp: number) => HH - 24 - (h / topp) * (HH - 44);

export function KontorVinsj({ h }: { h: VinsjHud }) {
    const naa = useNaa();
    const ty = m(h.topp, h.topp) + 6;
    const by = m(h.h, h.topp);
    const L = by - ty;
    const bx = TRINSE_X + Math.sin(h.vinkel) * L;
    const byy = ty + Math.cos(h.vinkel) * L;
    const dorY = m(h.dor, h.topp);
    const ved = Math.abs(h.h - h.dor) < 0.48;
    const stille = Math.abs(h.vinkel) < 0.14;
    const smell = naa - h.smellTid < 350;
    const glipp = naa - h.glippTid < 400;
    const sveivVinkel = h.tak * 90;
    return (
        <div className={`pointer-events-none absolute bottom-6 left-1/2 z-[1100] w-[min(600px,94vw)] -translate-x-1/2 px-5 pb-3 pt-3 ${PANEL}`}>
            <div className="flex items-baseline justify-between">
                <span className={ETIKETT}>Vinsjen i gavlen</span>
                <span className="text-[14px] text-slate-700">
                    <motion.span key={h.bunter} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="mr-3 inline-block font-bold tabular-nums text-emerald-700">
                        {h.bunter} / {h.av} bunter
                    </motion.span>
                    {h.smell > 0 && <span className="font-semibold text-rose-700">{h.smell} smell</span>}
                </span>
            </div>

            <motion.svg viewBox={`0 0 ${W} ${HH}`} className="mt-1 aspect-[56/25] w-full rounded-xl bg-sky-50" animate={smell ? { x: [0, -6, 5, -3, 0] } : { x: 0 }} transition={{ duration: 0.3 }}>
                {/* Vågen og kaia. */}
                <rect x={0} y={HH - 22} width={W} height={22} fill="#a8a29e" />
                <rect x={0} y={HH - 10} width={140} height={10} fill="#7dd3fc" />
                {/* Gavlen med loftsdøra. */}
                <rect x={VEGG_X} y={10} width={W - VEGG_X} height={HH - 32} fill="#6b4f3a" />
                {Array.from({ length: 12 }, (_, i) => (
                    <line key={i} x1={VEGG_X} y1={20 + i * 18} x2={W} y2={20 + i * 18} stroke="#57402f" strokeWidth={2} />
                ))}
                <rect x={VEGG_X - 2} y={dorY - 26} width={46} height={52} fill={ved ? (stille ? '#22c55e' : '#f59e0b') : '#1c1410'} opacity={ved ? 0.85 : 1} />
                <text x={VEGG_X + 50} y={dorY + 5} fontSize={13} fill="#fef3c7" fontWeight={700}>loftsdøra</text>
                {/* Bjelken og trinsa. */}
                <rect x={TRINSE_X - 10} y={ty - 12} width={VEGG_X - TRINSE_X + 12} height={9} fill="#44342a" />
                <circle cx={TRINSE_X} cy={ty} r={7} fill="#292524" />
                {/* Tauet og bunten. */}
                <line x1={TRINSE_X} y1={ty} x2={bx} y2={byy} stroke="#a16207" strokeWidth={2.5} />
                <line x1={TRINSE_X + 4} y1={ty} x2={TRINSE_X + 4} y2={HH - 40} stroke="#a16207" strokeWidth={2} opacity={0.4} />
                <g transform={`translate(${bx} ${byy}) rotate(${(-h.vinkel * 180) / Math.PI})`}>
                    <rect x={-22} y={0} width={44} height={26} rx={4} fill={smell ? '#fca5a5' : '#e7d8b0'} stroke="#8a6d3b" strokeWidth={2} />
                    <line x1={-8} y1={0} x2={-8} y2={26} stroke="#8a6d3b" strokeWidth={2} />
                    <line x1={8} y1={0} x2={8} y2={26} stroke="#8a6d3b" strokeWidth={2} />
                </g>
                {/* Sveiven nede på kaia. */}
                <g transform={`translate(${TRINSE_X + 4} ${HH - 40})`}>
                    <circle r={14} fill="#57534e" />
                    <g transform={`rotate(${sveivVinkel})`}>
                        <line x1={0} y1={0} x2={22} y2={0} stroke="#292524" strokeWidth={5} />
                        <circle cx={22} cy={0} r={4} fill="#292524" />
                    </g>
                </g>
                {/* Vinden. */}
                {(h.vind !== 0 || h.varsel) && (
                    <g opacity={h.varsel ? 0.5 : 0.9}>
                        {[0, 1, 2].map((i) => (
                            <path
                                key={i}
                                d={`M ${70 + ((naa / 4 + i * 60) % 180)} ${50 + i * 30} q 20 -8 40 0`}
                                stroke="#64748b"
                                strokeWidth={3}
                                fill="none"
                                transform={h.vind < 0 ? `scale(-1 1) translate(${-W / 2} 0)` : undefined}
                            />
                        ))}
                        <text x={20} y={30} fontSize={15} fontWeight={800} fill="#334155">
                            {h.varsel ? 'Vindkast på vei!' : 'Vindkast!'}
                        </text>
                    </g>
                )}
            </motion.svg>

            <div className="mt-2 flex items-center gap-3">
                {(['A', 'D'] as const).map((t) => (
                    <motion.div
                        key={t}
                        animate={h.neste === t && h.fase === 'heis' && !h.holder ? { scale: [1, 1.12, 1] } : { scale: 0.9 }}
                        transition={{ repeat: h.neste === t ? Infinity : 0, duration: 0.6 }}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl text-[20px] font-black ${h.neste === t && !h.holder ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}
                    >
                        {t}
                    </motion.div>
                ))}
                <div className="text-[15px] leading-snug text-slate-800">
                    {glipp ? (
                        <span className="font-bold text-rose-700">Glipp! Tauet slurer.</span>
                    ) : h.holder ? (
                        <span className="font-semibold text-sky-800">Du holder igjen i tauet.</span>
                    ) : h.slipper ? (
                        <span className="font-semibold text-sky-800">Du slipper litt tau. Bunten går ned.</span>
                    ) : h.h > h.dor + 0.48 ? (
                        <span className="font-semibold text-rose-700">For høyt! Hold W og slipp litt tau.</span>
                    ) : ved ? (
                        stille ? <span className="font-bold text-emerald-700">Den henger stille. E: dra den inn!</span> : <span className="font-semibold text-amber-700">Ved døra, men den svinger. Hold S.</span>
                    ) : (
                        h.tekst || 'Sveiv: A, D, A, D ...'
                    )}
                </div>
            </div>
            {h.fase !== 'heis' && h.tekst && <p className="mt-1 text-[15px] font-semibold text-slate-900">{h.tekst}</p>}
            <p className="mt-1 text-[13px] text-slate-500">
                {h.fase === 'klar' ? 'Mellomrom: begynn · Q: gå' : h.fase === 'slutt' ? 'Mellomrom: ferdig' : 'A og D etter tur: sveiv · S: hold igjen · W: slipp tau · E: dra inn ved døra'}
            </p>
        </div>
    );
}
