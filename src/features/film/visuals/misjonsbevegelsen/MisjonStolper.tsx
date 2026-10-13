import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Teller, TelleTall } from '../shared';

/**
 * Hvor stor bevegelsen ble, og hvor liten den er i dag.
 * - `topp`: foreningene i 1882, 1904 og 1940 som stolper, medlemstallet i 1940, og et
 *   stiplet tillegg for at tallet kan ha vært høyere.
 * - `idag`: små foreninger som forsvinner, Misjonsselskapets foreninger i 2006 og 2017,
 *   misjonærene som blir færre, gjenbruksbutikkene og pengene fra Norad.
 */

type Modus = 'topp' | 'idag';

const KVINNE = '#c2410c';
const MANN = '#1d4ed8';
const ALLE = '#0f766e';
const GRA = '#94a3b8';
const ROD = '#b91c1c';

export function MisjonStolper({ beat, props }: VisualProps<{ modus: Modus }>) {
    return props.modus === 'idag' ? <IDag beat={beat} /> : <Topp beat={beat} />;
}

/** Høyde i prosent av diagramflaten. */
const hoyde = (n: number, maks: number) => `${(n / maks) * 100}%`;

function Stolpe({
    deler,
    maks,
    aar,
    etikett,
    forsinkelse = 0,
    ekstra,
}: {
    deler: { verdi: number; farge: string; navn?: string }[];
    maks: number;
    aar: string;
    etikett: string;
    forsinkelse?: number;
    ekstra?: boolean;
}) {
    const sum = deler.reduce((s, d) => s + d.verdi, 0);
    return (
        <div className="flex flex-col items-center justify-end h-full w-[22%]">
            <div className="relative w-full flex-1 flex flex-col justify-end">
                {ekstra && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: '16%' }}
                        transition={{ delay: 0.5, duration: 1.2 }}
                        className="w-full border-4 border-dashed rounded-t-xl flex items-center justify-center text-4xl font-black"
                        style={{ borderColor: ALLE, color: ALLE }}
                    >
                        ?
                    </motion.div>
                )}
                {deler.map((d, i) => (
                    <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: hoyde(d.verdi, maks) }}
                        transition={{ delay: forsinkelse + i * 0.6, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                        className={`w-full flex items-center justify-center text-white font-black text-2xl ${i === deler.length - 1 && !ekstra ? 'rounded-t-xl' : ''}`}
                        style={{ background: d.farge }}
                    >
                        {d.navn && (
                            <span className="px-2 text-center leading-tight text-xl">
                                <TelleTall verdi={d.verdi} forsinkelse={forsinkelse + i * 0.6} />
                                <br />
                                {d.navn}
                            </span>
                        )}
                    </motion.div>
                ))}
            </div>
            <div className="mt-2 text-3xl font-black text-slate-900">{aar}</div>
            <div className="text-lg font-semibold text-slate-500 text-center leading-tight h-12">
                {deler.length === 1 ? (
                    <>
                        <TelleTall verdi={sum} forsinkelse={forsinkelse} /> {etikett}
                    </>
                ) : (
                    etikett
                )}
            </div>
        </div>
    );
}

function Topp({ beat }: { beat: number }) {
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-50 to-teal-50">
            <div className="absolute left-[5%] top-[5%] text-4xl font-black text-slate-800">Misjonsforeninger i Norge</div>
            <div className="absolute left-[5%] right-[42%] top-[17%] bottom-[5%] flex items-end justify-around border-b-4 border-slate-300">
                <Stolpe
                    aar="1882"
                    etikett="kvinner og menn"
                    maks={5200}
                    deler={[
                        { verdi: 1700, farge: KVINNE, navn: 'kvinner' },
                        { verdi: 830, farge: MANN, navn: 'menn' },
                    ]}
                />
                <Stolpe aar="1904" etikett="kvinneforeninger" maks={5200} deler={[{ verdi: 3500, farge: KVINNE }]} forsinkelse={0.4} />
                <Stolpe aar="1940" etikett="foreninger" maks={5200} deler={[{ verdi: 4500, farge: ALLE }]} forsinkelse={1.2} ekstra={beat >= 2} />
            </div>
            <div className="absolute right-[4%] top-0 bottom-0 w-[34%] flex flex-col justify-center gap-5">
                <AnimatePresence mode="popLayout">
                    {beat >= 1 && (
                        <motion.div key="medlemmer" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3">
                            <Teller verdi={112500} etikett="medlemmer i 1940" prefiks="ca. " />
                            <div className="grid grid-cols-10 gap-1.5 w-full">
                                {Array.from({ length: 40 }, (_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.8 + i * 0.03 }}
                                        className="aspect-square rounded-full"
                                        style={{ background: ALLE }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                    {beat >= 2 && (
                        <motion.div
                            key="kanskje"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="px-5 py-3 rounded-2xl bg-white shadow-xl border-l-[10px] text-2xl font-bold text-slate-900"
                            style={{ borderColor: ALLE }}
                        >
                            Kanskje enda flere. Det kommer an på hvordan man teller.
                        </motion.div>
                    )}
                    {beat === 0 && (
                        <motion.div key="vokser" exit={{ opacity: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-3xl font-black shadow-xl">
                            Bevegelsen vokser
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function IDag({ beat }: { beat: number }) {
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-50 to-stone-100">
            <div className="absolute left-[14%] top-[5%] text-4xl font-black text-slate-800">
                {beat === 0 ? 'Små foreninger forsvinner' : 'Misjonsselskapet'}
            </div>
            {/* Venstre: foreningene */}
            <div className="absolute left-[5%] right-[50%] top-[17%] bottom-[5%]">
                <AnimatePresence mode="wait">
                    {beat === 0 ? (
                        <motion.div key="hus" exit={{ opacity: 0 }} className="grid grid-cols-6 gap-4 h-full content-center">
                            {Array.from({ length: 24 }, (_, i) => {
                                const borte = [1, 4, 6, 9, 10, 13, 15, 17, 20, 22].includes(i);
                                const slaatt = [2, 7, 14, 19].includes(i);
                                return (
                                    <motion.svg
                                        key={i}
                                        viewBox="0 0 40 40"
                                        initial={{ opacity: 1, scale: 1 }}
                                        animate={borte ? { opacity: 0.12, scale: 0.7 } : slaatt ? { x: -24, opacity: 0.5 } : { opacity: 1 }}
                                        transition={{ delay: 0.8 + (i % 7) * 0.25, duration: 1 }}
                                    >
                                        <path d="M 4 38 V 18 L 20 4 L 36 18 V 38 Z" fill={KVINNE} />
                                        <rect x={16} y={24} width={8} height={14} fill="#fff7ed" />
                                    </motion.svg>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.div key="stolper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end justify-around h-full border-b-4 border-slate-300">
                            <Stolpe aar="2006" etikett="lokale foreninger" maks={3200} deler={[{ verdi: 2800, farge: ALLE }]} />
                            <Stolpe aar="2017" etikett="lokale foreninger" maks={3200} deler={[{ verdi: 1500, farge: GRA }]} forsinkelse={1.2} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {/* Høyre: misjonærer, butikkene, Norad */}
            <div className="absolute right-[4%] top-[12%] bottom-[5%] w-[40%] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    {beat === 2 && (
                        <motion.div key="misj" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                            <div className="text-3xl font-black text-slate-800">Misjonærer</div>
                            <div className="grid grid-cols-10 gap-2">
                                {Array.from({ length: 100 }, (_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ background: ALLE }}
                                        animate={{ background: i < 40 ? ALLE : '#e2e8f0' }}
                                        transition={{ delay: 1.2 + (99 - i) * 0.02 }}
                                        className="aspect-square rounded-full"
                                    />
                                ))}
                            </div>
                            <div className="flex gap-6 text-2xl font-bold text-slate-700">
                                <span>2006: ca. 100</span>
                                <span style={{ color: ROD }}>2017: 40</span>
                            </div>
                        </motion.div>
                    )}
                    {beat === 3 && (
                        <motion.div key="butikk" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                            <svg viewBox="0 0 200 150" className="w-[70%]">
                                <rect x={20} y={50} width={160} height={95} fill="#ffffff" stroke={ALLE} strokeWidth={6} />
                                <path d="M 10 50 L 30 15 H 170 L 190 50 Z" fill={ALLE} />
                                <rect x={40} y={70} width={60} height={50} fill="#ccfbf1" />
                                <rect x={120} y={80} width={36} height={65} fill={ALLE} />
                                <path d="M 52 108 L 60 86 L 78 100 Z" fill={KVINNE} />
                                <circle cx={86} cy={106} r={8} fill={MANN} />
                            </svg>
                            <div className="px-5 py-3 rounded-2xl bg-white shadow-xl text-3xl font-black text-slate-900 text-center">
                                Gjenbruksbutikker
                                <div className="text-2xl font-bold" style={{ color: ALLE }}>
                                    siden 1998
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {beat === 4 && (
                        <motion.div key="norad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                            <div className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-3xl font-black shadow-xl text-center">Penger fra staten (Norad)</div>
                            <div className="flex items-stretch gap-3">
                                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="flex-1 px-4 py-5 rounded-2xl bg-white shadow-lg border-t-[10px] text-2xl font-bold text-center" style={{ borderColor: ALLE }}>
                                    ✓ Helse og utvikling
                                </motion.div>
                                <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 1.4 }} className="w-3 rounded bg-slate-500" />
                                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.8 }} className="flex-1 px-4 py-5 rounded-2xl bg-white/70 shadow-lg border-t-[10px] text-2xl font-bold text-center text-slate-500" style={{ borderColor: ROD }}>
                                    ✕ Preken om troen
                                </motion.div>
                            </div>
                            <div className="text-xl font-semibold text-slate-600 text-center">holdes atskilt</div>
                        </motion.div>
                    )}
                    {beat <= 1 && (
                        <motion.div key="tom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 1 }} className="px-5 py-3 rounded-2xl bg-white shadow-xl border-l-[10px] text-3xl font-black text-slate-900" style={{ borderColor: GRA }}>
                            {beat === 0 ? 'Slått sammen eller lagt ned' : 'Nesten halvert på elleve år'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
