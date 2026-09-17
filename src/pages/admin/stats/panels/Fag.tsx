import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EyeOff, Layers } from 'lucide-react';
import {
    byggSideregister,
    formatTall,
    formatTid,
    summerDagsfelt,
    type RaaStats,
    type SideRad,
} from '../statsModel';
import { Stolpeliste } from '../charts';
import { fagFarge } from '../chartTokens';
import { Kort } from '../ui';
import { useManifest } from '../../../../hooks/useManifest';
import { getSubjectLabel } from '../../../../utils/subjectColors';

interface Props {
    raa: RaaStats;
    siderader: SideRad[];
    dagerNaa: string[];
    vindu: number;
}

interface FagRad {
    id: string;
    tittel: string;
    visninger: number;
    lesetid: number;
    aktiviteter: number;
    lesteSider: number;
    antallSider: number;
    dekning: number;
}

export const Fag: React.FC<Props> = ({ raa, siderader, dagerNaa, vindu }) => {
    const { data: manifest } = useManifest();

    // Hvor mye innhold som finnes per fag - nevneren i dekningsgraden.
    const antallSider = useMemo(() => {
        const reg = byggSideregister(manifest);
        const ut: Record<string, number> = {};
        for (const info of Object.values(reg)) {
            if (info.type !== 'leksjon') continue;
            ut[info.fagId] = (ut[info.fagId] ?? 0) + 1;
        }
        return ut;
    }, [manifest]);

    const fagrader = useMemo<FagRad[]>(() => {
        const per: Record<string, FagRad> = {};

        const hent = (id: string): FagRad =>
            (per[id] ??= {
                id,
                tittel: id === 'verktoy' ? 'Verktøy og øving' : getSubjectLabel(id),
                visninger: 0,
                lesetid: 0,
                aktiviteter: 0,
                lesteSider: 0,
                antallSider: antallSider[id] ?? 0,
                dekning: 0,
            });

        for (const r of siderader) {
            const f = hent(r.fagId);
            f.visninger += r.visninger;
            f.lesetid += r.totalTid;
            if (r.visninger > 0 && r.type === 'leksjon') f.lesteSider += 1;
        }

        const aktivitet = summerDagsfelt(raa, dagerNaa, 'fagAktivitet');
        for (const [id, n] of Object.entries(aktivitet)) hent(id).aktiviteter += n;

        return Object.values(per)
            .map((f) => ({
                ...f,
                dekning: f.antallSider > 0 ? f.lesteSider / f.antallSider : 0,
            }))
            .sort((a, b) => b.visninger - a.visninger);
    }, [siderader, raa, dagerNaa, antallSider]);

    // Artikler ingen har åpnet. Den mest konkrete arbeidslisten i hele
    // dashbordet: innhold som finnes, men som ingen finner fram til.
    // Listen bygges fra manifestet, ikke fra siderader: en artikkel som aldri
    // er åpnet har ingen målinger, og finnes derfor ikke i siderader i det
    // hele tatt.
    const aldriApnet = useMemo(() => {
        const reg = byggSideregister(manifest);
        const malt = new Set(siderader.filter((r) => r.visninger > 0).map((r) => r.noekkel));
        return Object.entries(reg)
            .filter(([noekkel, info]) => info.type === 'leksjon' && !malt.has(noekkel))
            .map(([, info]) => info)
            .sort((a, b) => a.fagTittel.localeCompare(b.fagTittel, 'nb') || a.tittel.localeCompare(b.tittel, 'nb'));
    }, [manifest, siderader]);

    return (
        <div className="space-y-6">
            <Kort
                tittel="Fag side om side"
                ikon={<Layers className="h-4 w-4 text-slate-400" />}
                hjelp="Dekning = hvor stor andel av artiklene i faget som er åpnet minst én gang."
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs uppercase tracking-wide text-slate-500">
                            <tr className="border-b border-slate-100">
                                <th className="py-2 pr-4 font-medium">Fag</th>
                                <th className="px-4 py-2 text-right font-medium">Visninger</th>
                                <th className="px-4 py-2 text-right font-medium">Lesetid</th>
                                <th className="px-4 py-2 text-right font-medium">Fullført</th>
                                <th className="px-4 py-2 text-right font-medium">Artikler</th>
                                <th className="py-2 pl-4 font-medium">Dekning</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {fagrader.map((f) => (
                                <tr key={f.id}>
                                    <td className="py-3 pr-4">
                                        <span className="flex items-center gap-2 font-medium text-slate-900">
                                            <span
                                                className="h-2.5 w-2.5 rounded-full"
                                                style={{ background: fagFarge(f.id) }}
                                            />
                                            {f.tittel}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-slate-900">
                                        {formatTall(f.visninger)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-600">
                                        {formatTid(f.lesetid)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-600">
                                        {f.aktiviteter || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-500">
                                        {f.antallSider > 0 ? `${f.lesteSider} / ${f.antallSider}` : '-'}
                                    </td>
                                    <td className="py-3 pl-4">
                                        {f.antallSider > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: f.dekning > 0 ? `${Math.max(2, f.dekning * 100)}%` : '0%',
                                                            background: fagFarge(f.id),
                                                        }}
                                                    />
                                                </div>
                                                <span className="font-mono text-xs text-slate-500">
                                                    {Math.round(f.dekning * 100)} %
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-300">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {fagrader.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-sm text-slate-400">
                                        Ingen fagdata ennå.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Kort>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Kort tittel="Aktivitet per fag" hjelp={`Fullførte oppgaver siste ${vindu} dager`}>
                    <Stolpeliste
                        rader={fagrader
                            .filter((f) => f.aktiviteter > 0)
                            .map((f) => ({ navn: f.tittel, verdi: f.aktiviteter, farge: fagFarge(f.id) }))}
                        tomTekst="Ingen fullførte oppgaver målt i perioden"
                    />
                </Kort>

                <Kort
                    tittel="Aldri åpnet"
                    ikon={<EyeOff className="h-4 w-4 text-slate-400" />}
                    hjelp={`${aldriApnet.length} artikler har ingen registrerte visninger`}
                >
                    <ul className="max-h-[320px] space-y-1 overflow-y-auto">
                        {aldriApnet.slice(0, 200).map((a) => (
                            <li key={a.sti}>
                                <Link
                                    to={a.sti}
                                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                                >
                                    <span
                                        className="h-2 w-2 shrink-0 rounded-full"
                                        style={{ background: fagFarge(a.fagId) }}
                                    />
                                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                                        {a.tittel}
                                    </span>
                                    <span className="shrink-0 text-xs text-slate-400">{a.fagTittel}</span>
                                </Link>
                            </li>
                        ))}
                        {aldriApnet.length === 0 && (
                            <li className="py-8 text-center text-sm text-slate-400">
                                Alt innhold er åpnet minst én gang.
                            </li>
                        )}
                    </ul>
                </Kort>
            </div>
        </div>
    );
};
