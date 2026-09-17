import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Clock, Eye, Flame, TrendingUp, Users, Zap } from 'lucide-react';
import {
    endring,
    formatDagKort,
    formatTall,
    formatTid,
    byggKlokkegrid,
    summerDagsfelt,
    unikeIPeriode,
    UKEDAGER,
    type DagPunkt,
    type RaaStats,
    type SideRad,
} from '../statsModel';
import { Stolpeliste, Trendgraf, Varmekart } from '../charts';
import { SERIE_1, SERIE_2, fagFarge } from '../chartTokens';
import { Kort, Nokkeltall } from '../ui';
import { getSubjectLabel } from '../../../../utils/subjectColors';

interface Props {
    raa: RaaStats;
    serie: DagPunkt[];
    dager: string[];
    siderader: SideRad[];
    vindu: number;
}

export const Oversikt: React.FC<Props> = ({ raa, serie, dager, siderader, vindu }) => {
    const utsnitt = useMemo(() => serie.slice(-vindu), [serie, vindu]);
    const forrige = useMemo(() => serie.slice(-vindu * 2, -vindu), [serie, vindu]);
    const dagerNaa = useMemo(() => dager.slice(-vindu), [dager, vindu]);
    const dagerFor = useMemo(() => dager.slice(-vindu * 2, -vindu), [dager, vindu]);

    const sum = (rader: DagPunkt[], felt: keyof DagPunkt) =>
        rader.reduce((a, r) => a + (r[felt] as number), 0);

    const visningerNaa = sum(utsnitt, 'visninger');
    const visningerFor = sum(forrige, 'visninger');
    const aktiviteterNaa = sum(utsnitt, 'aktiviteter');
    const aktiviteterFor = sum(forrige, 'aktiviteter');
    const lesetidNaa = sum(utsnitt, 'lesetid');
    const lesokterNaa = sum(utsnitt, 'lesokter');

    const besokNaa = unikeIPeriode(raa, dagerNaa);
    const besokFor = unikeIPeriode(raa, dagerFor);

    const aktiveNaa = Object.keys(raa.activeUsers).length;

    // Fagfordeling i perioden. Sorteres, og hver stolpe er merket med fagnavnet
    // - fargen bekrefter, den bærer aldri identiteten alene.
    const fagrader = useMemo(() => {
        const fordeling = summerDagsfelt(raa, dagerNaa, 'subjects');
        return Object.entries(fordeling)
            .map(([id, verdi]) => ({
                navn: id === 'verktoy' ? 'Verktøy og øving' : getSubjectLabel(id),
                verdi,
                farge: fagFarge(id),
            }))
            .sort((a, b) => b.verdi - a.verdi);
    }, [raa, dagerNaa]);

    const toppsider = useMemo(
        () => [...siderader].sort((a, b) => b.visninger - a.visninger).slice(0, 8),
        [siderader]
    );

    const klokke = useMemo(() => byggKlokkegrid(raa.clock), [raa.clock]);

    const snittLesetid = lesokterNaa > 0 ? lesetidNaa / lesokterNaa : 0;
    const beste = utsnitt.reduce<DagPunkt | null>(
        (best, d) => (!best || d.visninger > best.visninger ? d : best),
        null
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
                <Nokkeltall
                    etikett="Akkurat nå"
                    verdi={aktiveNaa}
                    under="lesere på siden"
                    ikon={<Flame className="h-4 w-4" />}
                />
                <Nokkeltall
                    etikett="Besøkende"
                    verdi={formatTall(besokNaa)}
                    under={`unike enheter, ${vindu} dager`}
                    endring={endring(besokNaa, besokFor)}
                    serie={utsnitt.map((d) => d.besok)}
                    farge={SERIE_2}
                    ikon={<Users className="h-4 w-4" />}
                />
                <Nokkeltall
                    etikett="Sidevisninger"
                    verdi={formatTall(visningerNaa)}
                    under={`siste ${vindu} dager`}
                    endring={endring(visningerNaa, visningerFor)}
                    serie={utsnitt.map((d) => d.visninger)}
                    ikon={<Eye className="h-4 w-4" />}
                />
                <Nokkeltall
                    etikett="Fullført"
                    verdi={formatTall(aktiviteterNaa)}
                    under="quiz, steg, spill"
                    endring={endring(aktiviteterNaa, aktiviteterFor)}
                    serie={utsnitt.map((d) => d.aktiviteter)}
                    ikon={<Activity className="h-4 w-4" />}
                />
                <Nokkeltall
                    etikett="Snitt lesetid"
                    verdi={formatTid(snittLesetid)}
                    under="per side­visning"
                    ikon={<Clock className="h-4 w-4" />}
                />
                <Nokkeltall
                    etikett="Samlet lesetid"
                    verdi={formatTid(lesetidNaa)}
                    under={`siste ${vindu} dager`}
                    ikon={<Zap className="h-4 w-4" />}
                />
            </div>

            <Kort
                tittel="Utvikling"
                ikon={<TrendingUp className="h-4 w-4 text-slate-400" />}
                hjelp={
                    beste && beste.visninger > 0
                        ? `Travleste dag i perioden: ${formatDagKort(beste.dag)} med ${beste.visninger} visninger.`
                        : 'Ingen målinger i perioden ennå.'
                }
            >
                <Trendgraf
                    etiketter={utsnitt.map((d) => formatDagKort(d.dag))}
                    serier={[
                        { navn: 'Sidevisninger', farge: SERIE_1, verdier: utsnitt.map((d) => d.visninger) },
                        { navn: 'Unike besøkende', farge: SERIE_2, verdier: utsnitt.map((d) => d.besok) },
                    ]}
                />
            </Kort>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Kort tittel="Fag" hjelp={`Sidevisninger per fag, siste ${vindu} dager`}>
                    <Stolpeliste rader={fagrader} tomTekst="Ingen fagfordeling målt ennå" />
                </Kort>

                <Kort
                    tittel="Mest lest"
                    hjelp="Totalt, siden målingen startet"
                    handling={
                        <span className="text-xs text-slate-400">Se «Innhold» for hele listen</span>
                    }
                >
                    <ul className="space-y-1">
                        {toppsider.map((s, i) => (
                            <li key={s.noekkel}>
                                <Link
                                    to={s.sti}
                                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                                >
                                    <span className="w-5 shrink-0 font-mono text-xs text-slate-300">{i + 1}</span>
                                    <span
                                        className="h-2 w-2 shrink-0 rounded-full"
                                        style={{ background: fagFarge(s.fagId) }}
                                    />
                                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                                        {s.tittel}
                                    </span>
                                    <span className="shrink-0 font-mono text-sm font-semibold text-slate-900">
                                        {formatTall(s.visninger)}
                                    </span>
                                </Link>
                            </li>
                        ))}
                        {toppsider.length === 0 && (
                            <li className="py-6 text-center text-sm text-slate-400">Ingen visninger ennå</li>
                        )}
                    </ul>
                </Kort>
            </div>

            <Kort
                tittel="Når brukes siden"
                hjelp="Alle visninger fordelt på ukedag og klokketime. Mørkere = mer bruk."
            >
                <Varmekart celler={klokke} ukedager={UKEDAGER} />
            </Kort>
        </div>
    );
};
