// Grensesnittet for hallen: hvem er inne, hva kan jeg si, og hvordan blir jeg
// kvitt noen jeg ikke vil se.
//
// Vises bare i hubben. Panelet er lite og lukket til eleven åpner det - de
// andre er ikke oppgaven hennes, de er stemningen, og et navnepanel som fyller
// hjørnet ville sagt det motsatte.
//
// Skjul-knappen er ikke en kuriositet. Rommene er åpne og elevene har ingen
// konto, så det finnes ingen å klage til (blueprint §4.4). Da må hun kunne
// fjerne noen fra sitt eget bilde selv, med ett trykk, uten å be om lov.

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { EyeOff, Eye, Flame, Users } from 'lucide-react';
import { FOLELSER } from '../data/folelser';
import type { HubTilstand } from '../net/useHubRom';

interface Props {
    hub: HubTilstand;
    /** Berøringsskjerm? Da eier styrestikka nedre venstre hjørne. */
    touch: boolean;
}

export function HubHud({ hub, touch }: Props) {
    const [apent, setApent] = useState(false);

    return (
        <div
            className={`pointer-events-none absolute z-20 select-none ${
                touch ? 'left-3 top-40' : 'bottom-3 left-3'
            }`}
        >
            <div className="flex flex-col items-start gap-2">
                <AnimatePresence>
                    {apent && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                            className="pointer-events-auto w-64 rounded-2xl bg-slate-900/90 p-3 ring-1 ring-white/15 backdrop-blur-sm"
                        >
                            <Liste hub={hub} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Følelseshjulet. Alltid framme: det er ett trykk unna, ellers
                    blir det ikke brukt. */}
                <div className="pointer-events-auto flex flex-wrap gap-1.5 rounded-2xl bg-slate-900/85 p-1.5 ring-1 ring-white/15">
                    {FOLELSER.map((f) => (
                        <motion.button
                            key={f.id}
                            type="button"
                            title={f.ord}
                            aria-label={`Send ${f.ord}`}
                            onClick={() => hub.send(f.emoji)}
                            whileTap={{ scale: 0.82 }}
                            whileHover={{ scale: 1.14, y: -2 }}
                            className="grid h-8 w-8 place-items-center rounded-lg text-lg transition hover:bg-white/10"
                        >
                            {f.emoji}
                        </motion.button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => setApent((a) => !a)}
                    aria-expanded={apent}
                    className="pointer-events-auto flex items-center gap-2 rounded-full bg-slate-900/85 px-3 py-1.5 text-sm font-semibold text-slate-200 ring-1 ring-white/15 transition hover:bg-slate-800/90"
                >
                    {hub.tilkoblet ? (
                        <Users size={15} className="text-amber-300" />
                    ) : (
                        <Flame size={15} className="text-slate-500" />
                    )}
                    <span aria-label="I hallen">
                        {hub.tilkoblet ? `I hallen: ${hub.andre.length + 1}` : 'Hallen · alene'}
                    </span>
                </button>
            </div>
        </div>
    );
}

function Liste({ hub }: { hub: HubTilstand }) {
    return (
        <>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-amber-300/80">
                {hub.tilkoblet ? `Rommet ${hub.romId}` : 'Ingen forbindelse'}
            </p>

            {!hub.tilkoblet && hub.andre.length === 0 && (
                <p className="text-xs leading-snug text-slate-400">
                    Du er alene i hallen nå. Bålet brenner uansett - veien østover er den
                    samme.
                </p>
            )}

            {hub.tilkoblet && hub.andre.length === 0 && (
                <p className="text-xs leading-snug text-slate-400">
                    Ingen andre her akkurat nå. Sett deg ved bålet, så kommer det kanskje noen.
                </p>
            )}

            {hub.andre.length > 0 && (
                <ul className="space-y-1">
                    {hub.andre.map((g) => (
                        <li key={g.id} className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm text-slate-200">{g.navn}</span>
                            <button
                                type="button"
                                onClick={() => hub.skjul(g.id)}
                                title={`Skjul ${g.navn} for deg`}
                                aria-label={`Skjul ${g.navn}`}
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-rose-300"
                            >
                                <EyeOff size={14} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {hub.skjulte.length > 0 && (
                <div className="mt-3 border-t border-white/10 pt-2">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                        Skjult av deg
                    </p>
                    <ul className="space-y-1">
                        {hub.skjulte.map((g) => (
                            <li key={g.id} className="flex items-center justify-between gap-2">
                                <span className="truncate text-sm text-slate-500">{g.navn}</span>
                                <button
                                    type="button"
                                    onClick={() => hub.visIgjen(g.id)}
                                    title={`Vis ${g.navn} igjen`}
                                    aria-label={`Vis ${g.navn} igjen`}
                                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-emerald-300"
                                >
                                    <Eye size={14} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}
