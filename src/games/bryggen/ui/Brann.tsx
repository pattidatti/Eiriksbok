import { AnimatePresence, motion } from 'framer-motion';
import type { BrannHud } from '../graboks/brann';
import { ETIKETT, PANEL } from './stil';

// Bøttekjeden: hvor sterk ilden er, kjeden med bøttene på vei fra kaia, og hendene dine ytterst.
// Kast når bøtta er i den grønne sona. Gnister lyser rødt med en klokke som går.

export function Brann({ data }: { data: unknown }) {
    const h = data as BrannHud;
    const aktiv = h.fase === 'kjede' || h.fase === 'ute';
    const ild = Math.round(h.styrke * 100);
    return (
        <div className={`w-[min(600px,94vw)] px-5 py-3 ${PANEL}`}>
            <div className="flex items-baseline justify-between">
                <span className={ETIKETT}>Brann i lagerhuset</span>
                {aktiv && <span className="text-[14px] text-[#5c4630]">Bøtter kastet: <b className="tabular-nums text-[#2b1d10]">{h.kast}</b></span>}
            </div>
            <div className="mt-2 flex items-center gap-3">
                <span className="w-12 text-[14px] font-bold text-red-700">Ilden</span>
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-[#e2d2b0]">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-600"
                        animate={{ width: `${ild}%` }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    />
                </div>
                <span className="w-10 text-right text-[15px] font-black tabular-nums text-[#2b1d10]">{ild}</span>
            </div>
            {aktiv && (
                <div className="relative mt-3 h-14 rounded-xl bg-sky-50 ring-1 ring-sky-200">
                    {/* Kaia til venstre, ilden til høyre. */}
                    <span className="absolute left-2 top-1 text-[13px] text-sky-800">Kaia</span>
                    <span className="absolute right-2 top-1 text-[13px] font-bold text-red-700">Ilden</span>
                    {Array.from({ length: h.ledd + 1 }, (_, i) => (
                        <div
                            key={i}
                            className={`absolute top-6 h-6 w-6 -translate-x-1/2 rounded-full border-2 ${i === h.ledd ? (h.iKjeden ? 'border-[#b8402d] bg-[#f6e3d8]' : 'border-dashed border-[#a5844f] bg-[#fbf5e6]') : 'border-[#a5844f] bg-[#fbf5e6]'}`}
                            style={{ left: `${6 + (i / h.ledd) * 80}%` }}
                        />
                    ))}
                    {/* Sona der kastet treffer. */}
                    <div className="absolute top-5 h-8 rounded-lg bg-emerald-400/30 ring-2 ring-emerald-500" style={{ left: `${6 + ((h.ledd - 0.32) / h.ledd) * 80}%`, width: `${(0.48 / h.ledd) * 80}%` }} />
                    {h.botter.map((s, i) => (
                        <div
                            key={i}
                            className="absolute top-[26px] h-4 w-4 -translate-x-1/2 rounded-sm border-2 border-amber-900 bg-sky-400 shadow"
                            style={{ left: `${6 + (Math.min(s, h.ledd + 0.2) / h.ledd) * 80}%` }}
                        />
                    ))}
                    <span className="absolute bottom-0.5 text-[13px] font-bold text-[#9a2a1c]" style={{ left: `${6 + 80}%`, transform: 'translateX(-50%)' }}>Du</span>
                </div>
            )}
            {h.gnist > 0 && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-[15px] font-bold text-red-800 ring-1 ring-red-300">
                    <span className="animate-pulse">Gnist!</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-red-100">
                        <div className="h-full bg-red-600" style={{ width: `${h.gnist * 100}%` }} />
                    </div>
                </div>
            )}
            <div className="mt-2 flex min-h-[24px] items-center justify-between gap-3">
                <span className="text-[15px] font-semibold leading-snug text-[#2b1d10]">{h.tekst}</span>
                <AnimatePresence mode="popLayout">
                    {h.svar && (
                        <motion.span
                            key={h.svar.n}
                            initial={{ scale: 1.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`shrink-0 text-[15px] font-black ${h.svar.god ? 'text-emerald-700' : 'text-rose-700'}`}
                        >
                            {h.svar.tekst}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
            {h.iKjeden && <p className="mt-1 text-[13px] text-[#7a6650]">Mellomrom / E: kast · Q: gå ut av kjeden</p>}
        </div>
    );
}
