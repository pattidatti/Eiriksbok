import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Award, Gamepad2, Target } from 'lucide-react';
import {
    aktivitetNavn,
    formatDagKort,
    formatTall,
    summerDagsfelt,
    type DagPunkt,
    type RaaStats,
    type SideRad,
} from '../statsModel';
import { Stolpeliste, Trendgraf } from '../charts';
import { SERIE_1, fagFarge } from '../chartTokens';
import { Kort, Nokkeltall } from '../ui';

interface Props {
    raa: RaaStats;
    serie: DagPunkt[];
    dager: string[];
    siderader: SideRad[];
    vindu: number;
}

export const Aktivitet: React.FC<Props> = ({ raa, serie, dager, siderader, vindu }) => {
    const utsnitt = useMemo(() => serie.slice(-vindu), [serie, vindu]);
    const dagerNaa = useMemo(() => dager.slice(-vindu), [dager, vindu]);

    const totalt = useMemo(
        () =>
            Object.entries(raa.activity)
                .map(([kind, verdi]) => ({ navn: aktivitetNavn(kind), verdi }))
                .sort((a, b) => b.verdi - a.verdi),
        [raa.activity]
    );

    const iPerioden = useMemo(() => {
        const f = summerDagsfelt(raa, dagerNaa, 'kinds');
        return Object.entries(f)
            .map(([kind, verdi]) => ({ navn: aktivitetNavn(kind), verdi }))
            .sort((a, b) => b.verdi - a.verdi);
    }, [raa, dagerNaa]);

    // Quiz sortert på snitt: nederst ligger de spørsmålene elevene sliter med.
    const quizrader = useMemo(
        () =>
            siderader
                .filter((r) => r.quizForsok > 0)
                .sort((a, b) => (a.quizSnitt ?? 1) - (b.quizSnitt ?? 1)),
        [siderader]
    );

    const hangman = useMemo(() => {
        const runder = Object.values(raa.hangman).filter((h) => h?.outcome);
        const seire = runder.filter((h) => h.outcome === 'won').length;
        return {
            runder: runder.length,
            seire,
            andel: runder.length > 0 ? Math.round((seire / runder.length) * 100) : 0,
        };
    }, [raa.hangman]);

    const xpIPerioden = utsnitt.reduce((s, d) => s + d.xp, 0);
    const fullfortIPerioden = utsnitt.reduce((s, d) => s + d.aktiviteter, 0);
    const quizSnittTotalt =
        quizrader.length > 0
            ? quizrader.reduce((s, r) => s + (r.quizSnitt ?? 0) * r.quizForsok, 0) /
              quizrader.reduce((s, r) => s + r.quizForsok, 0)
            : null;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Nokkeltall
                    etikett="Fullført"
                    verdi={formatTall(fullfortIPerioden)}
                    under={`oppgaver siste ${vindu} dager`}
                    serie={utsnitt.map((d) => d.aktiviteter)}
                    ikon={<Target className="h-4 w-4" />}
                />
                <Nokkeltall
                    etikett="XP delt ut"
                    verdi={formatTall(xpIPerioden)}
                    under={`siste ${vindu} dager`}
                    serie={utsnitt.map((d) => d.xp)}
                    ikon={<Award className="h-4 w-4" />}
                />
                <Nokkeltall
                    etikett="Quiz-snitt"
                    verdi={quizSnittTotalt !== null ? `${Math.round(quizSnittTotalt * 100)} %` : '-'}
                    under={`${quizrader.reduce((s, r) => s + r.quizForsok, 0)} fullførte quizer`}
                />
                <Nokkeltall
                    etikett="Hengemann"
                    verdi={`${hangman.andel} %`}
                    under={`${hangman.runder} runder spilt`}
                    ikon={<Gamepad2 className="h-4 w-4" />}
                />
            </div>

            <Kort tittel="Fullførte oppgaver per dag" hjelp={`Siste ${vindu} dager`}>
                <Trendgraf
                    etiketter={utsnitt.map((d) => formatDagKort(d.dag))}
                    serier={[
                        { navn: 'Fullført', farge: SERIE_1, verdier: utsnitt.map((d) => d.aktiviteter) },
                    ]}
                    hoyde={180}
                />
            </Kort>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Kort tittel="Hva blir gjort" hjelp="Alle fullføringer siden målingen startet">
                    <Stolpeliste rader={totalt} tomTekst="Ingen fullføringer målt ennå" />
                </Kort>

                <Kort tittel="I perioden" hjelp={`Fullføringer siste ${vindu} dager`}>
                    <Stolpeliste rader={iPerioden} tomTekst="Ingenting fullført i perioden" />
                </Kort>
            </div>

            <Kort
                tittel="Quiz-resultater"
                hjelp="Vanskeligst først. Lav score over mange forsøk betyr som regel at artikkelen ikke svarer på spørsmålet."
            >
                <div className="max-h-[480px] overflow-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-3 font-medium">Artikkel</th>
                                <th className="px-4 py-3 text-right font-medium">Forsøk</th>
                                <th className="px-4 py-3 text-right font-medium">Full pott</th>
                                <th className="px-4 py-3 text-right font-medium">Snitt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {quizrader.map((r) => {
                                const snitt = r.quizSnitt ?? 0;
                                const perfekte = raa.quiz[r.noekkel]?.perfekte ?? 0;
                                return (
                                    <tr key={r.noekkel} className="hover:bg-slate-50/60">
                                        <td className="px-4 py-3">
                                            <Link to={r.sti} className="flex items-center gap-2.5 hover:text-indigo-600">
                                                <span
                                                    className="h-2 w-2 shrink-0 rounded-full"
                                                    style={{ background: fagFarge(r.fagId) }}
                                                />
                                                <span className="min-w-0">
                                                    <span className="block truncate font-medium text-slate-900">
                                                        {r.tittel}
                                                    </span>
                                                    <span className="block truncate text-xs text-slate-400">
                                                        {r.fagTittel}
                                                    </span>
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-sm text-slate-600">
                                            {r.quizForsok}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-sm text-slate-500">
                                            {perfekte}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            snitt >= 0.8
                                                                ? 'bg-emerald-500'
                                                                : snitt >= 0.5
                                                                  ? 'bg-amber-500'
                                                                  : 'bg-rose-500'
                                                        }`}
                                                        style={{ width: snitt > 0 ? `${Math.max(2, snitt * 100)}%` : '0%' }}
                                                    />
                                                </div>
                                                <span className="w-10 text-right font-mono text-sm font-semibold text-slate-900">
                                                    {Math.round(snitt * 100)} %
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {quizrader.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-10 text-center text-sm text-slate-400">
                                        Ingen quizer fullført ennå.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Kort>
        </div>
    );
};
