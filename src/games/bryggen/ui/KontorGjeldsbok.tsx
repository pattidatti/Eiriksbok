import { AnimatePresence, motion } from 'framer-motion';
import type { GjeldsbokHud } from '../graboks/kontor-gjeldsbok';
import { fmt } from '../graboks/kontor-prute';
import { ETIKETT, PANEL } from './stil';
import { useNaa } from './useNaa';

// Gjeldsboka: en side med linjer, hver med det Sølve fikk eller betalte og summen så langt. Gutten
// skriver summen på linja som er oppe; riktig sum settes med blekk og en hake, feil gir en flekk.

export function KontorGjeldsbok({ h }: { h: GjeldsbokHud }) {
    const naa = useNaa();
    const blink = Math.floor(naa / 450) % 2 === 0;
    const flekk = naa - h.flekkTid < 900;
    const linje = h.linjer[h.nr];
    const fristet = h.fase === 'skriv' && linje?.salt && h.kanHoppe;
    return (
        <div className={`pointer-events-none relative w-[min(620px,94vw)] px-5 pb-3 pt-3 ${PANEL}`}>
            <div className="flex items-baseline justify-between">
                <span className={ETIKETT}>Gjeldsboka</span>
                <span className="text-[14px] text-[#5c4630]">
                    Pris: {fmt(h.pris)} kilo rug per kilo fisk
                    {h.feil > 0 && <span className="ml-3 font-semibold text-rose-700">{h.feil} blekkflekker</span>}
                </span>
            </div>

            <div className="relative mt-2 overflow-hidden rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 font-serif">
                <div className="flex justify-between border-b border-amber-300 pb-1 text-[15px] font-bold text-amber-950">
                    <span>Sølve, fisker fra Vesterålen</span>
                    <span>våger fisk</span>
                </div>
                {h.linjer.map((l, i) => {
                    const ferdig = i < h.skrevet.length;
                    const hoppet = ferdig && h.skrevet[i] === null;
                    const naa_ = i === h.nr && h.fase === 'skriv';
                    if (i > h.nr && h.fase !== 'slutt') return null;
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`grid grid-cols-[1fr_56px_64px] items-center gap-2 border-b border-amber-200/80 py-1 text-[15px] ${naa_ ? 'bg-amber-100/80' : ''} ${hoppet ? 'text-amber-900/40' : 'text-stone-900'}`}
                        >
                            <span className={hoppet ? 'line-through' : ''}>{l.tekst}</span>
                            <span className={`text-right tabular-nums ${l.vaager < 0 ? 'text-emerald-800' : 'text-rose-900'}`}>
                                {i === 0 ? l.vaager : l.vaager > 0 ? `+${l.vaager}` : l.vaager}
                            </span>
                            <span className="text-right text-[18px] font-bold tabular-nums">
                                {ferdig ? (
                                    hoppet ? (
                                        <span className="text-[13px] font-normal italic">hoppet over</span>
                                    ) : (
                                        <motion.span initial={{ scale: 1.6, color: '#1e3a8a' }} animate={{ scale: 1, color: '#1c1917' }} className="inline-block">
                                            {h.skrevet[i]} ✓
                                        </motion.span>
                                    )
                                ) : naa_ ? (
                                    <span className="text-[#9a2a1c]">
                                        {h.tall}
                                        <span className={blink ? 'opacity-100' : 'opacity-0'}>|</span>
                                    </span>
                                ) : (
                                    ''
                                )}
                            </span>
                        </motion.div>
                    );
                })}
                <AnimatePresence>
                    {flekk && (
                        <motion.div
                            key={h.flekkTid}
                            initial={{ scale: 0.2, opacity: 0.9 }}
                            animate={{ scale: 1, opacity: 0.85 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className="absolute right-6 top-1/2 h-14 w-16 -translate-y-1/2 rounded-[45%_55%_60%_40%] bg-slate-900"
                        />
                    )}
                </AnimatePresence>
            </div>

            {fristet && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-[15px] text-sky-950">
                    Sølve ba deg hoppe over denne linja. Ingen så at han tok saltet.
                    <div className="mt-0.5 font-semibold">X: hopp over linja · eller skriv summen som vanlig</div>
                </motion.div>
            )}
            {h.fase !== 'skriv' && <p className="mt-2 text-[16px] font-semibold leading-snug text-[#2b1d10]">{h.tekst}</p>}
            <p className="mt-1 text-[13px] text-[#7a6650]">
                {h.fase === 'klar'
                    ? 'Mellomrom: begynn · Q: gå'
                    : h.fase === 'slutt'
                      ? 'Mellomrom: ferdig'
                      : 'Talltastene: skriv summen så langt · Backspace: rett · Enter: skriv med blekk'}
            </p>
        </div>
    );
}
