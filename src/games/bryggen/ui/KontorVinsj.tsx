import { motion } from 'framer-motion';
import type { VinsjHud } from '../graboks/kontor-vinsj';
import { ETIKETT, FARGE, GRONN, HJELP, LIN, PANEL, ROD, VARM } from './stil';
import { useNaa } from './useNaa';

// Vinsjen sett fra siden: gavlen med loftsdøra til høyre, bjelken med trinsa øverst, tauet og bunten
// som svinger, og sveiven nede på kaia. Tegnet med blekk på lin som resten av UI-et (stil.ts): døra lyser
// gull når bunten henger stille ved den, og får seglrød kant når den svinger; bunten blir rød når den
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
                <span className="text-[14px] text-[#5c4630]">
                    <motion.span key={h.bunter} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className={`mr-3 inline-block font-bold tabular-nums ${GRONN}`}>
                        {h.bunter} / {h.av} bunter
                    </motion.span>
                    {h.smell > 0 && <span className={`font-semibold ${ROD}`}>{h.smell} smell</span>}
                </span>
            </div>

            <motion.svg viewBox={`0 0 ${W} ${HH}`} className={`mt-1 aspect-[56/25] w-full rounded-xl ${LIN}`} animate={smell ? { x: [0, -6, 5, -3, 0] } : { x: 0 }} transition={{ duration: 0.3 }}>
                {/* Vågen og kaia. */}
                <rect x={140} y={HH - 22} width={W - 140} height={22} fill="#a88a5c" />
                <line x1={140} y1={HH - 22} x2={W} y2={HH - 22} stroke={FARGE.tjaere} strokeWidth={2} />
                {[0, 1, 2].map((i) => (
                    <path key={i} d={`M 6 ${HH - 16 + i * 6} q 11 -4 22 0 t 22 0 t 22 0 t 22 0 t 22 0 t 22 0`} stroke={FARGE.svak} strokeWidth={1.6} fill="none" opacity={0.75 - i * 0.2} />
                ))}
                {/* Gavlen med loftsdøra. */}
                <rect x={VEGG_X} y={10} width={W - VEGG_X} height={HH - 32} fill="#6b4f3a" />
                {Array.from({ length: 12 }, (_, i) => (
                    <line key={i} x1={VEGG_X} y1={20 + i * 18} x2={W} y2={20 + i * 18} stroke="#57402f" strokeWidth={2} />
                ))}
                <rect x={VEGG_X - 2} y={dorY - 26} width={46} height={52} fill={ved && stille ? FARGE.gull : '#1c1410'} stroke={ved && !stille ? FARGE.segl : 'none'} strokeWidth={4} />
                <text x={VEGG_X + 50} y={dorY + 5} fontSize={13} fill="#fef3c7" fontWeight={700}>loftsdøra</text>
                {/* Bjelken og trinsa. */}
                <rect x={TRINSE_X - 10} y={ty - 12} width={VEGG_X - TRINSE_X + 12} height={9} fill="#44342a" />
                <circle cx={TRINSE_X} cy={ty} r={7} fill="#292524" />
                {/* Tauet og bunten. */}
                <line x1={TRINSE_X} y1={ty} x2={bx} y2={byy} stroke="#8a5a12" strokeWidth={2.5} />
                <line x1={TRINSE_X + 4} y1={ty} x2={TRINSE_X + 4} y2={HH - 40} stroke="#8a5a12" strokeWidth={2} opacity={0.4} />
                <g transform={`translate(${bx} ${byy}) rotate(${(-h.vinkel * 180) / Math.PI})`}>
                    <rect x={-22} y={0} width={44} height={26} rx={4} fill={smell ? '#d98c7a' : '#e7d8b0'} stroke="#8a6d3b" strokeWidth={2} />
                    <line x1={-8} y1={0} x2={-8} y2={26} stroke="#8a6d3b" strokeWidth={2} />
                    <line x1={8} y1={0} x2={8} y2={26} stroke="#8a6d3b" strokeWidth={2} />
                </g>
                {/* Sveiven nede på kaia. */}
                <g transform={`translate(${TRINSE_X + 4} ${HH - 40})`}>
                    <circle r={14} fill={FARGE.tjaere} />
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
                                stroke={FARGE.svak}
                                strokeWidth={3}
                                fill="none"
                                transform={h.vind < 0 ? `scale(-1 1) translate(${-W / 2} 0)` : undefined}
                            />
                        ))}
                        <text x={20} y={30} fontSize={15} fontWeight={800} fill={FARGE.blekk}>
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
                        className={`flex h-11 w-11 items-center justify-center rounded-xl text-[20px] font-black ${h.neste === t && !h.holder ? 'bg-[#9a2a1c] text-white' : 'bg-[#e2d2b0] text-[#7a6650]'}`}
                    >
                        {t}
                    </motion.div>
                ))}
                <div className="text-[15px] leading-snug text-[#2b1d10]">
                    {glipp ? (
                        <span className={`font-bold ${ROD}`}>Glipp! Tauet slurer.</span>
                    ) : h.holder ? (
                        <span className={`font-semibold ${VARM}`}>Du holder igjen i tauet.</span>
                    ) : h.slipper ? (
                        <span className={`font-semibold ${VARM}`}>Du slipper litt tau. Bunten går ned.</span>
                    ) : h.h > h.dor + 0.48 ? (
                        <span className={`font-semibold ${ROD}`}>For høyt! Hold W og slipp litt tau.</span>
                    ) : ved ? (
                        stille ? <span className={`font-bold ${GRONN}`}>Den henger stille. E: dra den inn!</span> : <span className={`font-semibold ${VARM}`}>Ved døra, men den svinger. Hold S.</span>
                    ) : (
                        h.tekst || 'Sveiv: A, D, A, D ...'
                    )}
                </div>
            </div>
            {h.fase !== 'heis' && h.tekst && <p className="mt-1 text-[15px] font-semibold text-[#2b1d10]">{h.tekst}</p>}
            <p className={`mt-1 ${HJELP}`}>
                {h.fase === 'klar' ? 'Mellomrom: begynn · Q: gå' : h.fase === 'slutt' ? 'Mellomrom: ferdig' : 'A og D etter tur: sveiv · S: hold igjen · W: slipp tau · E: dra inn ved døra'}
            </p>
        </div>
    );
}
