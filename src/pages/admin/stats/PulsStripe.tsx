// Puls-stripe øverst på /admin.
//
// Bevisst nøysom: den henter bare tilstedeværelse og de siste sju dagsbøttene,
// ikke hele måle-treet slik dashbordet gjør. Poenget er å se om det er liv på
// siden uten å måtte klikke seg videre.

import React, { useEffect, useMemo, useState } from 'react';
import { ref, onValue, query, orderByKey, startAt } from 'firebase/database';
import { db } from '../../../lib/firebase';
import { dagsnokkel, formatTall, formatTid, sisteDager, type DagRad } from './statsModel';
import { Sparkline } from './charts';
import { SERIE_1, SERIE_2 } from './chartTokens';

interface Tall {
    etikett: string;
    verdi: string | number;
    under: string;
    serie?: number[];
    farge?: string;
    puls?: boolean;
}

export const PulsStripe: React.FC = () => {
    const [aktive, setAktive] = useState(0);
    const [daglig, setDaglig] = useState<Record<string, DagRad>>({});

    useEffect(() => {
        const fra = new Date();
        fra.setDate(fra.getDate() - 7);

        const av1 = onValue(ref(db, 'analytics/active_users'), (snap) => setAktive(snap.size));
        const av2 = onValue(
            query(ref(db, 'analytics/daily'), orderByKey(), startAt(dagsnokkel(fra))),
            (snap) => setDaglig((snap.val() as Record<string, DagRad>) ?? {})
        );

        return () => {
            av1();
            av2();
        };
    }, []);

    const tall = useMemo<Tall[]>(() => {
        const dager = sisteDager(7);
        const rader = dager.map((d) => daglig[d] ?? {});
        const iDag = rader[rader.length - 1] ?? {};

        const sum = (velg: (r: DagRad) => number) => rader.reduce((s, r) => s + velg(r), 0);
        const unike = new Set<string>();
        for (const r of rader) for (const id of Object.keys(r.besok ?? {})) unike.add(id);

        const lesMs = sum((r) => r.readMs ?? 0);
        const lesOkter = sum((r) => r.readSessions ?? 0);

        return [
            {
                etikett: 'Inne nå',
                verdi: aktive,
                under: 'lesere på siden',
                puls: true,
            },
            {
                etikett: 'I dag',
                verdi: formatTall(iDag.views ?? 0),
                under: `${Object.keys(iDag.besok ?? {}).length} unike enheter`,
            },
            {
                etikett: 'Siste 7 dager',
                verdi: formatTall(sum((r) => r.views ?? 0)),
                under: `${unike.size} unike enheter`,
                serie: rader.map((r) => r.views ?? 0),
                farge: SERIE_1,
            },
            {
                etikett: 'Fullført',
                verdi: formatTall(sum((r) => r.activities ?? 0)),
                under: 'oppgaver siste uke',
                serie: rader.map((r) => r.activities ?? 0),
                farge: SERIE_2,
            },
            {
                etikett: 'Lesetid',
                verdi: formatTid(lesMs),
                under: lesOkter > 0 ? `snitt ${formatTid(lesMs / lesOkter)} per side` : 'siste uke',
            },
        ];
    }, [aktive, daglig]);

    return (
        <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-5">
            {tall.map((t) => (
                <div key={t.etikett} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        {t.puls && <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />}
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            {t.etikett}
                        </span>
                    </div>
                    <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{t.verdi}</div>
                    <div className="text-xs text-slate-400">{t.under}</div>
                    {t.serie && t.serie.some((v) => v > 0) && (
                        <div className="mt-2">
                            <Sparkline verdier={t.serie} farge={t.farge} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
