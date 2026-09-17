import React, { useMemo } from 'react';
import { SearchX, Search, Tag } from 'lucide-react';
import { formatTall, type RaaStats } from '../statsModel';
import { Stolpeliste } from '../charts';
import { SERIE_2 } from '../chartTokens';
import { Kort, Nokkeltall } from '../ui';

interface Props {
    raa: RaaStats;
}

export const Sok: React.FC<Props> = ({ raa }) => {
    const logger = useMemo(
        () =>
            Object.values(raa.searches)
                .filter((s) => s && typeof s.query === 'string')
                .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)),
        [raa.searches]
    );

    const topp = useMemo(() => {
        const teller: Record<string, { antall: number; treff: number }> = {};
        for (const l of logger) {
            const n = l.query.toLowerCase().trim();
            if (!n) continue;
            // logger er sortert nyeste først, og treffantallet settes derfor
            // bare den første gangen ordet dukker opp. Bimerket viser da hva
            // søket gir nå - ikke hva det ga aller første gang noen søkte.
            const rad = (teller[n] ??= { antall: 0, treff: l.resultsCount ?? 0 });
            rad.antall += 1;
        }
        return Object.entries(teller)
            .map(([navn, v]) => ({
                navn,
                verdi: v.antall,
                bimerke: `${v.treff} treff`,
            }))
            .sort((a, b) => b.verdi - a.verdi)
            .slice(0, 15);
    }, [logger]);

    const nullTreff = useMemo(
        () =>
            Object.values(raa.zeroHits)
                .filter((z) => z?.query)
                .map((z) => ({ navn: z.query as string, verdi: z.antall ?? 0, farge: SERIE_2 }))
                .sort((a, b) => b.verdi - a.verdi)
                .slice(0, 20),
        [raa.zeroHits]
    );

    const tagSok = logger.filter((l) => l.type === 'tag').length;
    const tomme = logger.filter((l) => (l.resultsCount ?? 0) === 0).length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Nokkeltall
                    etikett="Søk i loggen"
                    verdi={formatTall(logger.length)}
                    under="de nyeste loggførte søkene"
                    ikon={<Search className="h-4 w-4" />}
                />
                <Nokkeltall
                    etikett="Uten treff"
                    verdi={formatTall(tomme)}
                    under={
                        logger.length > 0
                            ? `${Math.round((tomme / logger.length) * 100)} % av søkene i loggen`
                            : '-'
                    }
                    ikon={<SearchX className="h-4 w-4" />}
                />
                <Nokkeltall
                    etikett="Emneklikk"
                    verdi={formatTall(tagSok)}
                    under="søk via tag-lenker"
                    ikon={<Tag className="h-4 w-4" />}
                />
                <Nokkeltall
                    etikett="Ulike søkeord"
                    verdi={formatTall(new Set(logger.map((l) => l.query.toLowerCase())).size)}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Kort tittel="Mest søkt" hjelp="Hva elevene leter etter, i den nyeste delen av loggen">
                    <Stolpeliste rader={topp} tomTekst="Ingen søk loggført ennå" />
                </Kort>

                <Kort
                    tittel="Søk uten treff"
                    ikon={<SearchX className="h-4 w-4 text-slate-400" />}
                    hjelp="Innhold som mangler, sortert etter hvor mange som lette etter det"
                >
                    <Stolpeliste rader={nullTreff} tomTekst="Alle søk har gitt treff" />
                </Kort>
            </div>

            <Kort tittel="Siste søk" hjelp="De 40 nyeste, med antall treff">
                <ul className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto">
                    {logger.slice(0, 40).map((s, i) => (
                        <li key={`${s.timestamp}-${i}`} className="flex items-center gap-3 py-2">
                            <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{s.query}</span>
                            <span
                                className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                                    (s.resultsCount ?? 0) === 0
                                        ? 'bg-rose-50 text-rose-700'
                                        : 'bg-slate-100 text-slate-500'
                                }`}
                            >
                                {s.resultsCount ?? 0} treff
                            </span>
                            <span className="w-24 shrink-0 text-right font-mono text-[11px] text-slate-400">
                                {s.timestamp
                                    ? new Date(s.timestamp).toLocaleString('nb-NO', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                      })
                                    : '-'}
                            </span>
                        </li>
                    ))}
                    {logger.length === 0 && (
                        <li className="py-8 text-center text-sm text-slate-400">Ingen søk ennå</li>
                    )}
                </ul>
            </Kort>
        </div>
    );
};
