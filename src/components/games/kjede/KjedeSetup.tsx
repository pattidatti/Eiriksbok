// Startskjermen: velg kjede og lær reglene på fem sekunder.

import React from 'react';
import { motion } from 'framer-motion';
import { CloudFog, Link2, MousePointerClick, Sparkles, Trophy } from 'lucide-react';
import type { KjedeIndexEntry } from '../../../types/kjede';
import { DRIVKREFTER, DRIVKRAFT_IDS } from './drivkrefter';
import type { KjedeStats } from './kjedeStats';

interface Props {
    kjeder: KjedeIndexEntry[];
    laster: boolean;
    feil: string | null;
    stats: KjedeStats;
    onStart: (id: string) => void;
}

const REGLER = [
    {
        icon: Link2,
        tittel: 'Steinen under deg er årsaken',
        tekst: 'Foran deg svever tre påstander. Bare én av dem fulgte faktisk av det som står i steinen.',
    },
    {
        icon: MousePointerClick,
        tittel: 'Velg med 1, 2 eller 3',
        tekst: 'Du får tid til å lese alle tre, og tåka står stille mens du tenker. Det er å ta feil som koster.',
    },
    {
        icon: CloudFog,
        tittel: 'Glemselen kommer bakfra',
        tekst: 'Den suger fargen ut av alt den passerer. Riktige svar gir deg fart, og fart er det eneste som holder deg foran den.',
    },
];

export const KjedeSetup: React.FC<Props> = ({ kjeder, laster, feil, stats, onStart }) => (
    <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
            <h1 className="mb-3 font-display text-4xl font-bold text-slate-900 md:text-5xl">
                Kjedereaksjonen
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-slate-600">
                Historie henger sammen. Løp gjennom årsakskjeden og velg riktig virkning, ledd for
                ledd, før Glemselen tar deg igjen.
            </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
            {REGLER.map((regel, i) => (
                <motion.div
                    key={regel.tittel}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <regel.icon className="mb-3 h-7 w-7 text-amber-600" />
                    <h3 className="mb-1 font-display text-lg font-bold text-slate-900">
                        {regel.tittel}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600">{regel.tekst}</p>
                </motion.div>
            ))}
        </div>

        {feil && (
            <p className="mb-4 rounded-xl bg-rose-50 p-4 text-center font-medium text-rose-700">
                {feil}
            </p>
        )}

        <h2 className="mb-3 font-display text-2xl font-bold text-slate-900">Velg en kjede</h2>
        {laster && <p className="text-slate-500">Henter kjeder ...</p>}
        <div className="grid gap-3 sm:grid-cols-2">
            {kjeder.map((k) => {
                const rekord = stats.kjeder[k.id];
                return (
                    <button
                        key={k.id}
                        type="button"
                        onClick={() => onStart(k.id)}
                        className={`group rounded-2xl border-2 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
                            rekord?.ubrutt
                                ? 'border-amber-400 hover:border-amber-500'
                                : 'border-slate-200 hover:border-amber-400'
                        }`}
                    >
                        <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold uppercase tracking-wide text-amber-600">
                                {k.epoke}
                            </span>
                            {rekord?.ubrutt && (
                                <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                                    <Trophy className="h-3.5 w-3.5" />
                                    Ubrutt kjede
                                </span>
                            )}
                        </div>
                        <div className="font-display text-2xl font-bold text-slate-900 group-hover:text-amber-700">
                            {k.title}
                        </div>
                        <p className="mt-1 text-slate-600">{k.ingress}</p>
                        <p className="mt-3 text-sm text-slate-500">
                            {k.antallLedd} ledd
                            {rekord?.forsok
                                ? ` · beste: ${rekord.besteRiktige} av ${k.antallLedd}`
                                : ' · ikke spilt ennå'}
                        </p>
                    </button>
                );
            })}
        </div>

        {/* Drivkraft-samlingen: noe å fylle opp på tvers av runder */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                <h3 className="font-display text-lg font-bold text-slate-900">
                    Drivkrefter du har brukt
                </h3>
                <span className="text-sm text-slate-500">
                    {stats.drivkrefter.length} av {DRIVKRAFT_IDS.length}
                </span>
            </div>
            <div className="flex flex-wrap gap-2">
                {DRIVKRAFT_IDS.map((id) => {
                    const brukt = stats.drivkrefter.includes(id);
                    return (
                        <span
                            key={id}
                            title={brukt ? DRIVKREFTER[id].effekt : 'Ikke brukt ennå'}
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${
                                brukt
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'border border-dashed border-slate-300 text-slate-400'
                            }`}
                        >
                            {brukt ? DRIVKREFTER[id].navn : '?'}
                        </span>
                    );
                })}
            </div>
        </div>
    </div>
);
