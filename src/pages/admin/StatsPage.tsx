// Bruksstatistikk for /admin.
//
// Dashbordet er delt i faner fordi alt på én side ble en vegg av tall. Første
// fane svarer på «hvordan går det», resten går i dybden på hver sin akse:
// innhold, fag, publikum, søk og aktivitet.
//
// Tallene kommer fra ett abonnement (useStatsData) og er rene funksjoner av
// rådataen (statsModel). Panelene tegner - de regner ikke om på egen hånd.

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Activity,
    ArrowLeft,
    BarChart3,
    FileText,
    Layers,
    Search,
    Users,
} from 'lucide-react';
import { useStatsData } from './stats/useStatsData';
import { Oversikt } from './stats/panels/Oversikt';
import { Innhold } from './stats/panels/Innhold';
import { Fag } from './stats/panels/Fag';
import { Publikum } from './stats/panels/Publikum';
import { Sok } from './stats/panels/Sok';
import { Aktivitet } from './stats/panels/Aktivitet';

type FaneId = 'oversikt' | 'innhold' | 'fag' | 'publikum' | 'sok' | 'aktivitet';

const FANER: { id: FaneId; tekst: string; ikon: React.ReactNode }[] = [
    { id: 'oversikt', tekst: 'Oversikt', ikon: <BarChart3 className="h-4 w-4" /> },
    { id: 'innhold', tekst: 'Innhold', ikon: <FileText className="h-4 w-4" /> },
    { id: 'fag', tekst: 'Fag', ikon: <Layers className="h-4 w-4" /> },
    { id: 'publikum', tekst: 'Publikum', ikon: <Users className="h-4 w-4" /> },
    { id: 'sok', tekst: 'Søk', ikon: <Search className="h-4 w-4" /> },
    { id: 'aktivitet', tekst: 'Aktivitet', ikon: <Activity className="h-4 w-4" /> },
];

const VINDUER = [
    { dager: 7, tekst: '7 dager' },
    { dager: 30, tekst: '30 dager' },
    { dager: 60, tekst: '60 dager' },
];

export const StatsPage: React.FC = () => {
    const { raa, siderader, serie, dager, laster } = useStatsData();
    const [fane, setFane] = useState<FaneId>('oversikt');
    const [vindu, setVindu] = useState(30);

    const dagerNaa = useMemo(() => dager.slice(-vindu), [dager, vindu]);

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 lg:px-8">
            <div className="mx-auto max-w-[1400px] space-y-6">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <Link
                            to="/admin"
                            className="mb-2 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
                        >
                            <ArrowLeft className="h-4 w-4" /> Admin
                        </Link>
                        <h1 className="font-display text-3xl font-bold text-slate-900">Bruksstatistikk</h1>
                        <p className="text-slate-500">
                            Hvordan Eiriksbok faktisk brukes - i sanntid, med historikk.
                        </p>
                    </div>

                    {/* Tidsvindu gjelder alt som måles per dag. Totaler (som
                        «mest lest») er alltid hele historikken, og sier det. */}
                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                        {VINDUER.map((v) => (
                            <button
                                key={v.dager}
                                onClick={() => setVindu(v.dager)}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                    vindu === v.dager
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                {v.tekst}
                            </button>
                        ))}
                    </div>
                </header>

                <nav className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    {FANER.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFane(f.id)}
                            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                fane === f.id
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            {f.ikon}
                            {f.tekst}
                        </button>
                    ))}
                </nav>

                {laster ? (
                    <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-slate-400 shadow-sm">
                        Henter målinger…
                    </div>
                ) : (
                    <>
                        {fane === 'oversikt' && (
                            <Oversikt
                                raa={raa}
                                serie={serie}
                                dager={dager}
                                siderader={siderader}
                                vindu={vindu}
                            />
                        )}
                        {fane === 'innhold' && <Innhold siderader={siderader} />}
                        {fane === 'fag' && (
                            <Fag raa={raa} siderader={siderader} dagerNaa={dagerNaa} vindu={vindu} />
                        )}
                        {fane === 'publikum' && (
                            <Publikum raa={raa} serie={serie} dager={dager} vindu={vindu} />
                        )}
                        {fane === 'sok' && <Sok raa={raa} />}
                        {fane === 'aktivitet' && (
                            <Aktivitet
                                raa={raa}
                                serie={serie}
                                dager={dager}
                                siderader={siderader}
                                vindu={vindu}
                            />
                        )}
                    </>
                )}

                <p className="pb-4 text-center text-xs text-slate-400">
                    Målingene er anonyme og knyttet til enhet, ikke person. Se docs/STATISTIKK.md.
                </p>
            </div>
        </div>
    );
};
