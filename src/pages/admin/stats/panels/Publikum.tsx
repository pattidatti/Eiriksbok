import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Laptop, Radio, Repeat, Users } from 'lucide-react';
import {
    byggBrukersegment,
    endring,
    formatDagKort,
    formatTall,
    unikeIPeriode,
    type DagPunkt,
    type RaaStats,
} from '../statsModel';
import { Stolpeliste, Trendgraf } from '../charts';
import { SERIE_1, SERIE_2 } from '../chartTokens';
import { Kort, Nokkeltall } from '../ui';

interface Props {
    raa: RaaStats;
    serie: DagPunkt[];
    dager: string[];
    vindu: number;
}

const ENHET_NAVN: Record<string, string> = {
    chromebook: 'Chromebook',
    datamaskin: 'PC / Mac',
    mobil: 'Mobil',
    nettbrett: 'Nettbrett',
};

export const Publikum: React.FC<Props> = ({ raa, serie, dager, vindu }) => {
    const utsnitt = useMemo(() => serie.slice(-vindu), [serie, vindu]);
    const dagerNaa = useMemo(() => dager.slice(-vindu), [dager, vindu]);
    const dagerFor = useMemo(() => dager.slice(-vindu * 2, -vindu), [dager, vindu]);

    const segment = useMemo(() => byggBrukersegment(raa.uniqueUsers), [raa.uniqueUsers]);
    const besokNaa = unikeIPeriode(raa, dagerNaa);
    const besokFor = unikeIPeriode(raa, dagerFor);

    const enheter = useMemo(
        () =>
            Object.entries(raa.devices)
                .map(([id, verdi]) => ({ navn: ENHET_NAVN[id] ?? id, verdi }))
                .sort((a, b) => b.verdi - a.verdi),
        [raa.devices]
    );

    const nettlesere = useMemo(
        () =>
            Object.entries(raa.browsers)
                .map(([navn, verdi]) => ({ navn, verdi }))
                .sort((a, b) => b.verdi - a.verdi),
        [raa.browsers]
    );

    // Hvem er inne akkurat nå, og hvor. Tilstedeværelsen ryddes av
    // onDisconnect, så listen er fersk.
    const paaSiden = useMemo(
        () =>
            Object.entries(raa.activeUsers)
                .map(([id, v]) => ({ id, sti: v.path ?? '/', sist: v.lastActive ?? 0 }))
                .sort((a, b) => b.sist - a.sist),
        [raa.activeUsers]
    );

    const returandel =
        segment.totalt > 0 ? Math.round((segment.tilbakevendende / segment.totalt) * 100) : 0;

    const snittPerDag =
        utsnitt.length > 0
            ? Math.round(utsnitt.reduce((s, d) => s + d.besok, 0) / utsnitt.length)
            : 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <Nokkeltall
                    etikett="Inne nå"
                    verdi={paaSiden.length}
                    under="aktive lesere"
                    ikon={<Radio className="h-4 w-4" />}
                />
                <Nokkeltall
                    etikett="Unike enheter"
                    verdi={formatTall(besokNaa)}
                    under={`siste ${vindu} dager`}
                    endring={endring(besokNaa, besokFor)}
                    serie={utsnitt.map((d) => d.besok)}
                    farge={SERIE_2}
                    ikon={<Users className="h-4 w-4" />}
                />
                <Nokkeltall
                    etikett="Snitt per dag"
                    verdi={snittPerDag}
                    under="unike enheter"
                />
                <Nokkeltall
                    etikett="Kommer tilbake"
                    verdi={`${returandel} %`}
                    under={`${segment.tilbakevendende} av ${segment.totalt} enheter`}
                    ikon={<Repeat className="h-4 w-4" />}
                />
                <Nokkeltall
                    etikett="Aktive siste 30 d"
                    verdi={formatTall(segment.aktiveSiste30)}
                    under={`${segment.aktiveSiste7} siste uke`}
                />
            </div>

            <Kort tittel="Unike besøkende per dag" hjelp={`Én enhet teller én gang per døgn. Siste ${vindu} dager.`}>
                <Trendgraf
                    etiketter={utsnitt.map((d) => formatDagKort(d.dag))}
                    serier={[
                        { navn: 'Unike besøkende', farge: SERIE_1, verdier: utsnitt.map((d) => d.besok) },
                    ]}
                    hoyde={180}
                />
            </Kort>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Kort
                    tittel="Enheter"
                    ikon={<Laptop className="h-4 w-4 text-slate-400" />}
                    hjelp="Talt én gang per enhet per dag"
                >
                    <Stolpeliste rader={enheter} tomTekst="Ingen enhetsdata ennå" />
                </Kort>

                <Kort tittel="Nettlesere" hjelp="Hva klasserommet faktisk kjører">
                    <Stolpeliste rader={nettlesere} tomTekst="Ingen nettleserdata ennå" />
                </Kort>

                <Kort tittel="Inne akkurat nå" hjelp="Oppdateres i sanntid">
                    <ul className="max-h-[260px] space-y-1 overflow-y-auto">
                        {paaSiden.map((p) => (
                            <li key={p.id}>
                                <Link
                                    to={p.sti}
                                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                                >
                                    <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-600">
                                        {p.sti}
                                    </span>
                                </Link>
                            </li>
                        ))}
                        {paaSiden.length === 0 && (
                            <li className="py-8 text-center text-sm text-slate-400">Ingen inne nå</li>
                        )}
                    </ul>
                </Kort>
            </div>
        </div>
    );
};
