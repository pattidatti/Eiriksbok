// Minnetreet: det eleven kan fordi hun har gjort det (blueprint §7.4).
//
// Seks begreper ble delt ut gjennom kapittel 1 - og eleven kunne ikke slå dem
// opp noe sted. Hun så et varsel som forsvant etter fire sekunder, og så var
// kunnskapen borte fra grensesnittet. Det er det denne skjermen retter.
//
// Tre tilstander, og forskjellen mellom dem er hele poenget:
//
//   **ukjent**    Tåkelagt. Ingen navn, ingen forklaring, ingen oppskrift. Å
//                 vise hva som mangler ville gjort treet til en huskeliste, og
//                 da er det en oppskrift på XP og ikke et bilde av det hun kan.
//   **hørt**      Noen har sagt ordet. Navnet står, forklaringen ikke - men
//                 linja som sier hva som skal til, står. Det er invitasjonen.
//   **forstått**  Hun har gjort det. Da får hun forklaringen *og* replikken hun
//                 kan bruke, for et begrep du kan si høyt, er et begrep du eier.
//
// Skjermen deler ikke ut noe. Den viser. Alt som løfter en node ligger der
// arbeidet ligger - i scenen, i puzzlet, på bordet.

import { motion } from 'framer-motion';
import { BEGREPER } from '../data/begreper';
import { useRpgStore } from '../store/useRpgStore';
import type { BegrepDef, Forstaaelse } from '../types';

export function Minnetre({ onLukk }: { onLukk: () => void }) {
    const begreper = useRpgStore((s) => s.begreper);
    const forstatt = BEGREPER.filter((b) => begreper[b.id] === 'forstatt').length;

    return (
        <div
            className="absolute inset-0 z-50 overflow-y-auto bg-[#12180f]/97 px-3 py-5 backdrop-blur-sm"
            data-prove="minnetre"
        >
            <div className="mx-auto w-full max-w-5xl">
                <header className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-300/70">
                            Minnetreet
                        </p>
                        <h2 className="font-display text-2xl font-bold text-emerald-50">
                            Det du kan fordi du har gjort det
                        </h2>
                    </div>
                    <p
                        data-prove="minnetre-teller"
                        className="font-display text-lg font-bold text-emerald-200"
                    >
                        {forstatt} av {BEGREPER.length} forstått
                    </p>
                </header>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {BEGREPER.map((b, i) => (
                        <Node
                            key={b.id}
                            begrep={b}
                            niva={begreper[b.id] ?? 'ukjent'}
                            forsinkelse={i * 0.05}
                        />
                    ))}
                </div>

                <p className="mt-4 text-center text-xs leading-relaxed text-emerald-100/40">
                    Ingen node åpnes av et riktig svar. Hvert ord her står for noe du har gjort.
                </p>

                <button
                    type="button"
                    onClick={onLukk}
                    className="mt-4 w-full rounded-lg border border-emerald-100/15 px-4 py-2 text-sm text-emerald-100/60 transition hover:bg-emerald-100/5"
                >
                    Lukk (Esc)
                </button>
            </div>
        </div>
    );
}

/**
 * Én node.
 *
 * Den tåkelagte har samme høyde som de andre. Det er med vilje: eleven skal se
 * at det finnes noe der, uten å få vite hva - nøyaktig som det tomme feltet på
 * kildebordet er like stort som de to som har kort på seg.
 */
function Node({
    begrep,
    niva,
    forsinkelse,
}: {
    begrep: BegrepDef;
    niva: Forstaaelse;
    forsinkelse: number;
}) {
    const kjent = niva !== 'ukjent';
    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: forsinkelse }}
            data-prove={`begrep-${begrep.id}`}
            data-niva={niva}
            className={`flex min-h-[10rem] flex-col rounded-xl border p-3.5 ${
                niva === 'forstatt'
                    ? 'border-emerald-400/45 bg-emerald-400/10'
                    : niva === 'hort'
                    ? 'border-emerald-100/20 bg-emerald-100/5'
                    : 'border-dashed border-emerald-100/10 bg-black/25'
            }`}
        >
            <div className="flex items-baseline justify-between gap-2">
                <h3
                    className={`font-display text-lg font-bold ${
                        niva === 'forstatt'
                            ? 'text-emerald-100'
                            : kjent
                            ? 'text-emerald-100/70'
                            : 'text-emerald-100/25'
                    }`}
                >
                    {kjent ? begrep.navn : 'Ukjent'}
                </h3>
                <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                        niva === 'forstatt'
                            ? 'bg-emerald-400/20 text-emerald-200'
                            : niva === 'hort'
                            ? 'bg-amber-300/15 text-amber-200/90'
                            : 'bg-white/5 text-emerald-100/30'
                    }`}
                >
                    {niva === 'forstatt' ? 'Forstått' : niva === 'hort' ? 'Hørt' : 'Tåke'}
                </span>
            </div>

            {niva === 'forstatt' && (
                <>
                    <p className="mt-2 text-[14px] leading-relaxed text-emerald-50/90">
                        {begrep.forklaring}
                    </p>
                    <p className="mt-auto pt-3 text-[13px] italic leading-snug text-emerald-200/80">
                        «{begrep.replikk}»
                    </p>
                </>
            )}

            {niva === 'hort' && (
                <>
                    <p className="mt-2 text-[14px] leading-relaxed text-emerald-100/50">
                        Du har hørt ordet. Du har ikke gjort det.
                    </p>
                    <p className="mt-auto pt-3 text-[13px] leading-snug text-amber-200/70">
                        {begrep.forstasVed}
                    </p>
                </>
            )}

            {niva === 'ukjent' && (
                <p className="mt-2 text-[14px] leading-relaxed text-emerald-100/25">
                    Et ord ingen har sagt til deg ennå.
                </p>
            )}
        </motion.article>
    );
}
