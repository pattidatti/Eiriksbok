// Broen: hele årsakskjeden eleven nettopp løp gjennom, samlet i ett bilde.
// Dette er belønningen - ikke poengsummen, men strukturen.

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { BookOpen, CloudFog, Flame, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import type { Kjede, KjedeResultat } from '../../../types/kjede';
import type { Rekordbrudd } from './kjedeStats';
import { DRIVKREFTER } from './drivkrefter';

interface Props {
    kjede: Kjede;
    resultat: KjedeResultat;
    rekordbrudd: Rekordbrudd | null;
    onPaaNytt: () => void;
    onNyKjede: () => void;
}

/** Rekordene som ble slått denne runden, i den rekkefølgen de skal feires. */
const rekordlinjer = (r: Rekordbrudd | null): string[] => {
    if (!r) return [];
    const linjer: string[] = [];
    if (r.forsteUbrutte) linjer.push('Første gang du klarer kjeden uten en eneste omvei');
    if (r.forsteFullforing) linjer.push('Første gang du kom helt frem');
    if (r.nyBesteRiktige) linjer.push('Ny rekord: flere riktige på første forsøk enn før');
    if (r.nyBesteStreak) linjer.push('Ny rekord: lengste rekke uten feil');
    return linjer;
};

export const KjedeSummary: React.FC<Props> = ({
    kjede,
    resultat,
    rekordbrudd,
    onPaaNytt,
    onNyKjede,
}) => {
    const reducedMotion = useReducedMotion();
    const perfekt = resultat.fullfort && resultat.riktigeForsteForsok === kjede.ledd.length;

    useEffect(() => {
        if (!resultat.fullfort || reducedMotion) return;
        confetti({
            particleCount: perfekt ? 140 : 70,
            spread: perfekt ? 90 : 60,
            origin: { y: 0.7 },
            colors: ['#d9a02b', '#4f46e5', '#10b981'],
        });
    }, [resultat.fullfort, perfekt, reducedMotion]);

    return (
        <div className="mx-auto max-w-3xl pb-12">
            <div className="mb-6 text-center">
                {resultat.fullfort ? (
                    <Trophy className="mx-auto mb-3 h-12 w-12 text-amber-500" />
                ) : (
                    <CloudFog className="mx-auto mb-3 h-12 w-12 text-slate-400" />
                )}
                <h2 className="font-display text-3xl font-bold text-slate-900">
                    {perfekt
                        ? 'Ubrutt kjede!'
                        : resultat.fullfort
                          ? 'Du kom helt frem'
                          : 'Glemselen tok deg igjen'}
                </h2>
                <p className="mt-2 text-lg text-slate-600">
                    {resultat.fullfort
                        ? kjede.slutt
                        : `Du rakk å bygge ${resultat.ledd.length} av ${kjede.ledd.length} ledd. Se hva du fikk på plass.`}
                </p>
            </div>

            {rekordlinjer(rekordbrudd).length > 0 && (
                <motion.div
                    initial={reducedMotion ? undefined : { opacity: 0, scale: 0.94 }}
                    animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
                    className="mx-auto mb-6 max-w-xl rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4"
                >
                    <div className="mb-1 flex items-center justify-center gap-2 font-display text-lg font-bold text-amber-800">
                        <Sparkles className="h-5 w-5" />
                        Ny rekord
                    </div>
                    <ul className="space-y-0.5 text-center text-slate-700">
                        {rekordlinjer(rekordbrudd).map((linje) => (
                            <li key={linje}>{linje}</li>
                        ))}
                    </ul>
                </motion.div>
            )}

            <div className="mb-6 flex flex-wrap justify-center gap-3">
                <Stat
                    ikon={<Trophy className="h-4 w-4" />}
                    verdi={`${resultat.riktigeForsteForsok} av ${kjede.ledd.length}`}
                    merke="riktig på første forsøk"
                />
                <Stat
                    ikon={<Flame className="h-4 w-4" />}
                    verdi={String(resultat.bestStreak)}
                    merke="lengste rekke"
                />
                {resultat.drivkrefter.map((id) => (
                    <Stat
                        key={id}
                        ikon={null}
                        verdi={DRIVKREFTER[id].navn}
                        merke="drivkraft"
                    />
                ))}
            </div>

            {/* Selve broen */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <BroLedd tekst={kjede.start} start />
                {resultat.ledd.map((ledd, i) => (
                    <motion.div
                        key={ledd.index}
                        initial={reducedMotion ? undefined : { opacity: 0, x: -16 }}
                        animate={reducedMotion ? undefined : { opacity: 1, x: 0 }}
                        transition={{ delay: 0.08 * i }}
                    >
                        <Kjetting />
                        <BroLedd tekst={ledd.tekst} link={ledd.link} riktig={ledd.riktig} />
                        {ledd.valgtFeil && (
                            <div className="ml-8 mt-2 rounded-xl border-l-4 border-rose-300 bg-rose-50 px-4 py-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
                                    Omvei: du valgte først
                                </p>
                                <p className="text-sm font-semibold text-rose-700 line-through decoration-rose-400">
                                    {ledd.valgtFeil.tekst}
                                </p>
                                <p className="text-sm text-slate-700">{ledd.valgtFeil.hvorfor}</p>
                            </div>
                        )}
                    </motion.div>
                ))}
                {!resultat.fullfort && (
                    <>
                        <Kjetting brutt />
                        <p className="pl-2 text-slate-500">
                            Her stoppet kjeden. {kjede.ledd.length - resultat.ledd.length} ledd
                            gjenstår.
                        </p>
                    </>
                )}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                    type="button"
                    onClick={onPaaNytt}
                    className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white shadow-lg shadow-amber-500/25 transition-transform hover:-translate-y-0.5"
                >
                    <RotateCcw className="h-5 w-5" />
                    Løp kjeden om igjen
                </button>
                <button
                    type="button"
                    onClick={onNyKjede}
                    className="rounded-xl border-2 border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-colors hover:border-slate-300"
                >
                    Velg en annen kjede
                </button>
            </div>
        </div>
    );
};

const Stat: React.FC<{ ikon: React.ReactNode; verdi: string; merke: string }> = ({
    ikon,
    verdi,
    merke,
}) => (
    <div className="rounded-xl bg-slate-100 px-4 py-2 text-center">
        <div className="flex items-center justify-center gap-1 font-display text-lg font-bold text-slate-900">
            {ikon}
            {verdi}
        </div>
        <div className="text-xs uppercase tracking-wide text-slate-500">{merke}</div>
    </div>
);

const Kjetting: React.FC<{ brutt?: boolean }> = ({ brutt }) => (
    <div className="ml-8 h-7 w-1.5 rounded-full" aria-hidden>
        <div
            className={`h-full w-full rounded-full ${
                brutt
                    ? 'bg-[repeating-linear-gradient(180deg,#cbd5e1_0_5px,transparent_5px_10px)]'
                    : 'bg-amber-400'
            }`}
        />
    </div>
);

const BroLedd: React.FC<{
    tekst: string;
    link?: string;
    start?: boolean;
    riktig?: boolean;
}> = ({ tekst, link, start, riktig }) => (
    <div
        className={`flex items-start gap-3 rounded-2xl border-2 px-4 py-3 ${
            start
                ? 'border-slate-200 bg-slate-50'
                : riktig
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-amber-200 bg-white'
        }`}
    >
        <p className="flex-1 text-lg font-medium leading-snug text-slate-800">{tekst}</p>
        {link && (
            <Link
                to={link}
                className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
            >
                <BookOpen className="h-4 w-4" />
                Les mer
            </Link>
        )}
    </div>
);
