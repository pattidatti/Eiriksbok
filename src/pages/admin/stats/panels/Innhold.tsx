import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, Download, ExternalLink, Search } from 'lucide-react';
import { formatTall, formatTid, type SideRad } from '../statsModel';
import { fagFarge } from '../chartTokens';
import { Kort } from '../ui';
import { getSubjectLabel } from '../../../../utils/subjectColors';

type SorterPa = 'visninger' | 'snittTid' | 'totalTid' | 'tittel' | 'quizSnitt';

interface Props {
    siderader: SideRad[];
}

const kolonner: { noekkel: SorterPa; tekst: string; hoyre?: boolean }[] = [
    { noekkel: 'tittel', tekst: 'Side' },
    { noekkel: 'visninger', tekst: 'Visninger', hoyre: true },
    { noekkel: 'snittTid', tekst: 'Snitt tid', hoyre: true },
    { noekkel: 'totalTid', tekst: 'Samlet tid', hoyre: true },
    { noekkel: 'quizSnitt', tekst: 'Quiz-snitt', hoyre: true },
];

export const Innhold: React.FC<Props> = ({ siderader }) => {
    const [sok, setSok] = useState('');
    const [fag, setFag] = useState('alle');
    const [sorter, setSorter] = useState<SorterPa>('visninger');
    const [stigende, setStigende] = useState(false);

    const fagliste = useMemo(
        () => [...new Set(siderader.map((r) => r.fagId))].sort(),
        [siderader]
    );

    const rader = useMemo(() => {
        const q = sok.trim().toLowerCase();
        const filtrert = siderader.filter(
            (r) =>
                (fag === 'alle' || r.fagId === fag) &&
                (q === '' || r.tittel.toLowerCase().includes(q) || r.sti.toLowerCase().includes(q))
        );

        const retning = stigende ? 1 : -1;
        return filtrert.sort((a, b) => {
            if (sorter === 'tittel') return a.tittel.localeCompare(b.tittel, 'nb') * retning;
            const av = (a[sorter] as number | null) ?? -1;
            const bv = (b[sorter] as number | null) ?? -1;
            return (av - bv) * retning;
        });
    }, [siderader, sok, fag, sorter, stigende]);

    const byttSortering = (n: SorterPa) => {
        if (n === sorter) setStigende((s) => !s);
        else {
            setSorter(n);
            setStigende(n === 'tittel');
        }
    };

    // Rå tabell ut, for den som vil regne videre i et regneark.
    const lastNedCsv = () => {
        const linjer = [
            ['Tittel', 'Fag', 'Emne', 'Sti', 'Visninger', 'Snitt tid (s)', 'Samlet tid (s)', 'Lese-økter', 'Quiz-forsøk', 'Quiz-snitt %'],
            ...rader.map((r) => [
                r.tittel,
                r.fagTittel,
                r.emne,
                r.sti,
                r.visninger,
                Math.round(r.snittTid / 1000),
                Math.round(r.totalTid / 1000),
                r.okter,
                r.quizForsok,
                r.quizSnitt !== null ? Math.round(r.quizSnitt * 100) : '',
            ]),
        ];
        const csv = linjer
            .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
            .join('\n');
        const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `eiriksbok-innhold-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const totalVisninger = rader.reduce((s, r) => s + r.visninger, 0);

    return (
        <Kort
            tittel="Alt innhold"
            hjelp={`${rader.length} sider · ${formatTall(totalVisninger)} visninger i utvalget`}
            handling={
                <button
                    onClick={lastNedCsv}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                    <Download className="h-3.5 w-3.5" /> CSV
                </button>
            }
        >
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[200px] flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={sok}
                        onChange={(e) => setSok(e.target.value)}
                        placeholder="Søk i titler og stier…"
                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                </div>
                <select
                    value={fag}
                    onChange={(e) => setFag(e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                    <option value="alle">Alle fag</option>
                    {fagliste.map((f) => (
                        <option key={f} value={f}>
                            {f === 'verktoy' ? 'Verktøy og øving' : getSubjectLabel(f)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="max-h-[620px] overflow-auto rounded-xl border border-slate-100">
                <table className="w-full text-left">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            {kolonner.map((k) => (
                                <th
                                    key={k.noekkel}
                                    onClick={() => byttSortering(k.noekkel)}
                                    className={`cursor-pointer select-none px-4 py-3 font-medium hover:bg-slate-100 ${
                                        k.hoyre ? 'text-right' : ''
                                    }`}
                                >
                                    <span className={`inline-flex items-center gap-1.5 ${k.hoyre ? 'flex-row-reverse' : ''}`}>
                                        {k.tekst}
                                        <ArrowUpDown
                                            className={`h-3 w-3 ${
                                                sorter === k.noekkel ? 'text-indigo-600' : 'text-slate-300'
                                            }`}
                                        />
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rader.map((r) => (
                            <tr key={r.noekkel} className="group hover:bg-slate-50/60">
                                <td className="px-4 py-3">
                                    <div className="flex items-start gap-2.5">
                                        <span
                                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                                            style={{ background: fagFarge(r.fagId) }}
                                        />
                                        <div className="min-w-0">
                                            <Link
                                                to={r.sti}
                                                className="flex items-center gap-1 font-medium text-slate-900 hover:text-indigo-600"
                                            >
                                                <span className="truncate">{r.tittel}</span>
                                                <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
                                            </Link>
                                            <div className="mt-0.5 truncate text-xs text-slate-400">
                                                {r.fagTittel} · {r.emne}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-slate-900">
                                    {formatTall(r.visninger)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-sm text-slate-600">
                                    {formatTid(r.snittTid)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-sm text-slate-500">
                                    {formatTid(r.totalTid)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {r.quizSnitt !== null ? (
                                        <span
                                            className={`rounded px-1.5 py-0.5 font-mono text-xs font-semibold ${
                                                r.quizSnitt >= 0.8
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : r.quizSnitt >= 0.5
                                                      ? 'bg-amber-50 text-amber-700'
                                                      : 'bg-rose-50 text-rose-700'
                                            }`}
                                            title={`${r.quizForsok} forsøk`}
                                        >
                                            {Math.round(r.quizSnitt * 100)} %
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-300">-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {rader.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-10 text-center text-sm text-slate-400">
                                    Ingen sider matcher filteret.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Kort>
    );
};
