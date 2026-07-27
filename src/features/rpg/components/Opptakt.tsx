// Opptakten: skjermen som sier hvem eleven er nå.
//
// Et kapittelskifte er ikke et nivå. Det er en ny person, i et annet år, på
// den samme gården - og hvis spillet bare bytter kart, leser det som at hun
// fikk nye oppdrag. Derfor står dette stille i ett øyeblikk før hun får gå:
// navnet, alderen, standen og året.
//
// Bare kapitler som begynner *underveis* har en opptakt. Kapittel 1 begynner
// med karakterskaperen, og to åpningsskjermer etter hverandre er én for mye.

import { motion } from 'framer-motion';
import type { KapittelDef } from '../types';

const STAND: Record<string, string> = {
    trell: 'ufri',
    karl: 'fri bonde',
    hauld: 'odelsbonde',
    jarl: 'jarl',
};

export function Opptakt({ kapittel, onFerdig }: { kapittel: KapittelDef; onFerdig: () => void }) {
    const { rolle } = kapittel;
    return (
        <div
            data-prove="opptakt"
            className="absolute inset-0 z-[60] grid place-items-center bg-[#0d0b08] px-4 py-8"
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.1 }}
                className="w-full max-w-2xl"
            >
                <p className="text-[11px] uppercase tracking-[0.4em] text-amber-300/60">
                    Kapittel {kapittel.nr}
                </p>
                <h2 className="mt-1 font-display text-4xl font-bold text-amber-50">
                    {kapittel.tittel}
                </h2>
                <p className="mt-3 border-l-2 border-amber-300/40 pl-3 font-display text-lg text-amber-200">
                    {rolle.navn}, {rolle.alder} vintrer · {STAND[rolle.stand] ?? rolle.stand}
                </p>

                <div className="mt-6">
                    {kapittel.opptakt.tekst.split('\n\n').map((avsnitt, i) => (
                        <motion.p
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.6 + i * 0.5 }}
                            className="mt-3 text-[16px] leading-relaxed text-amber-50/85"
                        >
                            {avsnitt}
                        </motion.p>
                    ))}
                </div>

                {/*
                    Knappen kommer sist, og med vilje sent. Står den framme fra
                    første bilde, trykker eleven på den før første avsnitt er
                    lest - og da har kapittelet ingen åpning.
                */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                        duration: 0.6,
                        delay: 0.9 + kapittel.opptakt.tekst.split('\n\n').length * 0.5,
                    }}
                    type="button"
                    autoFocus
                    onClick={onFerdig}
                    className="mt-8 w-full rounded-xl bg-amber-400 px-5 py-3 font-display text-base font-bold text-[#2b2018] transition hover:bg-amber-300"
                >
                    {kapittel.opptakt.tittel}
                </motion.button>
            </motion.div>
        </div>
    );
}
