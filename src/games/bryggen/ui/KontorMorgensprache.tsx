import { AnimatePresence, motion } from 'framer-motion';
import type { MorgenspracheHud } from '../graboks/kontor-morgensprache';
import { ETIKETT, PANEL } from './stil';
import { useNaa } from './useNaa';

// Morgensprache: replikkene skrives fram, reglene står som kort med straffen under, og slagene telles
// med et rødt gjenskinn over skjermen. Alvorlig og stille: ingen lyd- eller bildespøk.

const TEGN_PER_MS = 0.042;

export function KontorMorgensprache({ h }: { h: MorgenspracheHud }) {
    const naa = useNaa();
    const b = h.bilde;
    const vis = h.ferdigSkrevet ? b.tekst : b.tekst.slice(0, Math.max(0, Math.floor((naa - h.start) * TEGN_PER_MS)));
    const sidenSlag = naa - h.slagTid;
    const roed = b.slag && h.slagt > 0 ? Math.max(0, 1 - sidenSlag / 700) : 0;
    const slagFerdig = b.slag ? h.slagt >= b.slag : false;
    return (
        <>
            {roed > 0 && (
                <div
                    className="pointer-events-none absolute inset-0 z-[1090]"
                    style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(127,29,29,${0.55 * roed}) 100%)` }}
                />
            )}
            <div className={`pointer-events-none absolute bottom-6 left-1/2 z-[1100] w-[min(620px,94vw)] -translate-x-1/2 px-6 pb-4 pt-4 ${PANEL}`}>
                <div className="flex items-baseline justify-between">
                    <span className={ETIKETT}>{h.tittel}</span>
                    <span className="text-[13px] tabular-nums text-[#7a6650]">
                        {h.nr} / {h.av}
                    </span>
                </div>
                {b.hvem && <div className="mt-2 text-[15px] font-bold text-[#2b1d10]">{b.hvem}</div>}

                <AnimatePresence mode="wait">
                    {b.regel && (
                        <motion.div
                            key={b.regel.nr}
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                            className="mt-2 flex gap-3 rounded-xl border border-stone-300 bg-stone-50 px-3 py-2"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-800 text-[20px] font-black text-stone-50">
                                {b.regel.nr}
                            </div>
                            <div>
                                <div className="text-[16px] font-bold text-stone-900">{b.regel.tittel}</div>
                                <div className="text-[15px] font-semibold text-rose-800">Straff: {b.regel.straff}</div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="mt-2 min-h-[48px] text-[16px] leading-snug text-[#2b1d10]">{vis}</p>

                {b.slag ? (
                    <div className="mt-2 flex items-center justify-center gap-3">
                        {Array.from({ length: b.slag }, (_, i) => (
                            <motion.div
                                key={i}
                                animate={i < h.slagt ? { scale: [1.5, 1], backgroundColor: '#7f1d1d' } : { scale: 1, backgroundColor: '#e7e5e4' }}
                                transition={{ duration: 0.35 }}
                                className="flex h-11 w-11 items-center justify-center rounded-full text-[18px] font-black text-white"
                            >
                                {i < h.slagt ? i + 1 : ''}
                            </motion.div>
                        ))}
                    </div>
                ) : null}

                {b.regel && (
                    <p className="mt-2 text-[13px] italic text-[#7a6650]">
                        Vi vet ikke hvilke straffer Kontoret brukte i 1420-årene. «Fem harde slag over ryggen» er fra museets fortelling om livet på Bryggen
                        flere hundre år senere.
                    </p>
                )}

                {b.valg && h.ferdigSkrevet && (
                    <div className="mt-2 flex flex-col gap-1">
                        {b.valg.map((v, i) => (
                            <div key={v} className="rounded-lg bg-[#f6e3d8] px-3 py-1.5 text-[15px] font-semibold text-[#9a2a1c]">
                                {i + 1}: {v}
                            </div>
                        ))}
                    </div>
                )}

                <p className="mt-2 text-[13px] text-[#7a6650]">
                    {b.slag ? (slagFerdig ? 'Mellomrom: videre' : '') : b.valg ? (h.ferdigSkrevet ? 'Svar med 1 eller 2' : 'Mellomrom: vis hele') : 'Mellomrom eller E: videre'}
                </p>
            </div>
        </>
    );
}
