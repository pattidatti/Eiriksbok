import { motion } from 'framer-motion';
import { fmt, type PruteHud, type Stemning } from '../graboks/kontor-prute';
import { ETIKETT, PANEL } from './stil';

// Prutingen med Sølve: en skala fra 4 til 10 kilo rug for en kilo fisk med budet ditt, det Sølve ber
// om, og husbondens grense. Tålmodigheten hans står som fem prikker; tegnene han gir står i kursiv.

const MIN = 4;
const MAKS = 10;
const x = (v: number) => `${((v - MIN) / (MAKS - MIN)) * 100}%`;

const STEMNING: Record<Stemning, { tekst: string; farge: string }> = {
    rolig: { tekst: 'venter', farge: 'text-[#5c4630]' },
    noler: { tekst: 'nøler', farge: 'text-amber-700' },
    sur: { tekst: 'sur', farge: 'text-orange-700' },
    sint: { tekst: 'sint', farge: 'text-rose-700' },
};

export function KontorPrute({ h }: { h: PruteHud }) {
    const ferdig = h.fase === 'enig' || h.fase === 'tvunget';
    const st = STEMNING[h.stemning];
    return (
        <div className={`pointer-events-none relative w-[min(620px,94vw)] px-5 pb-3 pt-3 ${PANEL}`}>
            <div className="flex items-baseline justify-between">
                <span className={ETIKETT}>Prute med Sølve</span>
                <span className="flex items-center gap-1.5 text-[14px] text-[#5c4630]">
                    Tålmodighet
                    {Array.from({ length: h.maks }, (_, i) => (
                        <motion.span
                            key={i}
                            animate={{ scale: i < h.taalmodighet ? 1 : 0.7, opacity: i < h.taalmodighet ? 1 : 0.35 }}
                            className={`inline-block h-3 w-3 rounded-full ${i < h.taalmodighet ? 'bg-[#9a2a1c]' : 'bg-[#cdb68a]'}`}
                        />
                    ))}
                    <span className={`ml-1 font-semibold ${st.farge}`}>{st.tekst}</span>
                </span>
            </div>

            <motion.p key={h.sier} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-[16px] font-semibold leading-snug text-[#2b1d10]">
                Sølve: «{h.sier}»
            </motion.p>
            <p className="text-[15px] italic text-[#5c4630]">{h.tegn}</p>

            {/* Skalaen. */}
            <div className="relative mx-2 mb-1 mt-9 h-3 rounded-full bg-gradient-to-r from-amber-200 via-stone-200 to-emerald-200">
                {Array.from({ length: MAKS - MIN + 1 }, (_, i) => (
                    <span key={i} className="absolute top-4 -translate-x-1/2 text-[13px] tabular-nums text-[#7a6650]" style={{ left: x(MIN + i) }}>
                        {MIN + i}
                    </span>
                ))}
                <div className="absolute -top-2 h-7 w-0.5 bg-amber-700" style={{ left: x(h.husbonden) }} />
                <span className="absolute -top-8 -translate-x-1/2 whitespace-nowrap text-[13px] font-bold text-amber-800" style={{ left: x(h.husbonden) }}>
                    Husbonden
                </span>
                <motion.div className="absolute -top-2 h-7 w-1 rounded bg-rose-600" animate={{ left: x(h.ber) }} transition={{ type: 'spring', stiffness: 200, damping: 20 }} />
                <motion.span
                    className="absolute -top-8 -translate-x-1/2 whitespace-nowrap text-[13px] font-bold text-rose-700"
                    animate={{ left: x(Math.min(h.ber, 9.35)) }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                    Sølve: {fmt(h.ber)}
                </motion.span>
                <motion.div
                    className="absolute -top-3 h-9 w-9 -translate-x-1/2 rounded-full border-4 border-white bg-[#9a2a1c] shadow-lg"
                    animate={{ left: x(ferdig ? h.pris : h.bud) }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                />
            </div>

            <div className="mt-7 flex items-baseline justify-between">
                <span className="text-[15px] text-[#5c4630]">
                    Ditt bud:{' '}
                    <motion.span key={h.bud} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="inline-block text-[22px] font-black tabular-nums text-[#9a2a1c]">
                        {fmt(ferdig ? h.pris : h.bud)}
                    </motion.span>{' '}
                    kilo rug for 1 kilo fisk
                </span>
                <span className="text-[13px] text-[#7a6650]">Rundt år 1500: ca. 8</span>
            </div>

            {h.logg.length > 0 && !ferdig && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                    {h.logg.map((l, i) => (
                        <span key={i} className={`rounded-md px-2 py-0.5 text-[13px] ${l.stemning === 'sint' ? 'bg-rose-50 text-rose-800' : l.stemning === 'sur' ? 'bg-orange-50 text-orange-800' : 'bg-[#efe3c8] text-[#5c4630]'}`}>
                            {fmt(l.bud)}: {l.svar}
                        </span>
                    ))}
                </div>
            )}

            {ferdig && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`mt-2 rounded-xl px-3 py-2 text-[15px] ${h.fase === 'tvunget' ? 'bg-stone-100 text-stone-800' : 'bg-emerald-50 text-emerald-900'}`}>
                    <div className="font-bold">
                        Handel: {fmt(h.pris)} kilo rug for 1 kilo fisk. Grensen hans var {fmt(h.grense)}.
                    </div>
                    {h.fase === 'tvunget' && <div>Han ville gå, men ble stående. Ingen andre på Bryggen kjøper fisken hans. Det var ikke du som vant. Det var Kontoret.</div>}
                    <div className="text-[13px]">Gå til husbonden i bua.</div>
                </motion.div>
            )}

            <p className="mt-1 text-[13px] text-[#7a6650]">
                {h.fase === 'klar' ? 'Mellomrom: begynn å prute' : ferdig ? 'Mellomrom: ferdig' : 'A/D (eller 1/2): endre budet · Mellomrom: by · Q: gå'}
            </p>
        </div>
    );
}
