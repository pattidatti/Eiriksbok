// Førstegangsskjermen i Pengeliv: eleven velger hvem den skal starte som.
//
// Personaen er stillas. Den gir eleven en lønn, et budsjett og en konto å
// begynne med, slik at ingen møter et tomt skjema. Derfor sier skjermen
// eksplisitt fra: fra nå av er dette dine tall, og du kan endre alt.

import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Briefcase, Wallet } from 'lucide-react';
import type { Persona } from '../types';
import { formaterKroner } from './primitives';

interface PersonaVelgerProps {
    personaer: Persona[];
    onVelg: (personaId: string) => void;
    /**
     * Feilmeldingen fra butikken, når det er en.
     *
     * Den ble satt tre steder og lest null steder. Slo hentingen av satsfila
     * feil, fikk eleven denne skjermen som vanlig - og et klikk gjorde
     * bokstavelig talt ingenting, uten et eneste tegn på hvorfor.
     */
    feil?: string | null;
    /** Satsene er lastet, så et valg faktisk starter noe. */
    klar?: boolean;
}

export function PersonaVelger({ personaer, onVelg, feil = null, klar = true }: PersonaVelgerProps) {
    return (
        <div className="mx-auto max-w-5xl px-3 py-6">
            <header className="mb-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                    Pengeliv
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                    Hvem vil du starte som?
                </h1>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                    Velg en person å begynne med. Fra det øyeblikket du har valgt, er dette dine
                    tall: du kan endre lønn, husleie og sparing akkurat som du vil.
                </p>
            </header>

            {feil && (
                <div
                    role="alert"
                    className="mx-auto mb-4 flex max-w-2xl items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3"
                >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-rose-900">
                            Pengeliv fikk ikke tak i skattesatsene
                        </p>
                        <p className="mt-0.5 text-sm leading-snug text-rose-800">{feil}</p>
                    </div>
                </div>
            )}

            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {personaer.map((persona, i) => (
                    <motion.li
                        key={persona.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.3 }}
                    >
                        <motion.button
                            type="button"
                            onClick={() => onVelg(persona.id)}
                            disabled={!klar}
                            whileHover={klar ? { y: -4 } : undefined}
                            whileTap={klar ? { scale: 0.98 } : undefined}
                            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                            className="group flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-white/70 p-4 text-left shadow-sm backdrop-blur transition-colors hover:border-indigo-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-white/70"
                        >
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-lg font-bold text-slate-900">{persona.navn}</h2>
                                <span className="text-sm text-slate-500">{persona.alder} år</span>
                            </div>

                            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                <Briefcase className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                <span className="min-w-0 truncate">{persona.yrke}</span>
                            </p>

                            <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                                {persona.beskrivelse}
                            </p>

                            <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2">
                                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    <Wallet className="h-3 w-3" />
                                    Lønn før skatt
                                </p>
                                <p className="mt-0.5 text-base font-bold tabular-nums text-slate-900">
                                    {formaterKroner(persona.bruttoArslonn)}
                                    <span className="ml-1 text-xs font-normal text-slate-500">
                                        i året
                                    </span>
                                </p>
                                <p className="text-xs tabular-nums text-slate-500">
                                    {formaterKroner(Math.round(persona.bruttoArslonn / 12))} i
                                    måneden, før skatten er trukket
                                </p>
                            </div>

                            <span className="mt-3 flex items-center gap-1 text-sm font-bold text-indigo-600">
                                Start som {persona.navn}
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </span>
                        </motion.button>
                    </motion.li>
                ))}
            </ul>

            <p className="mt-5 text-center text-xs text-slate-500">
                Ingenting her er låst. Du kan bytte person når som helst, og du kan endre hvert
                eneste tall underveis.
            </p>
        </div>
    );
}
