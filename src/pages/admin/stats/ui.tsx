// Felles kort og nøkkeltall for dashbordet.

import React from 'react';
import { Sparkline } from './charts';

export const Kort: React.FC<{
    tittel: string;
    ikon?: React.ReactNode;
    hjelp?: string;
    handling?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}> = ({ tittel, ikon, hjelp, handling, children, className = '' }) => (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                    {ikon}
                    {tittel}
                </h2>
                {hjelp && <p className="mt-1 text-xs text-slate-400">{hjelp}</p>}
            </div>
            {handling}
        </header>
        <div className="p-5">{children}</div>
    </section>
);

/**
 * Nøkkeltall. Endringen vises bare når forrige periode faktisk hadde tall -
 * «+100 %» fra null sier ingenting.
 */
export const Nokkeltall: React.FC<{
    etikett: string;
    verdi: string | number;
    under?: string;
    endring?: number | null;
    serie?: number[];
    farge?: string;
    ikon?: React.ReactNode;
}> = ({ etikett, verdi, under, endring, serie, farge, ikon }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{etikett}</span>
            {ikon && <span className="text-slate-300">{ikon}</span>}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-slate-900">{verdi}</span>
            {endring !== null && endring !== undefined && (
                <span
                    className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                        endring >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                >
                    {endring >= 0 ? '+' : ''}
                    {endring} %
                </span>
            )}
        </div>
        {under && <div className="mt-0.5 text-xs text-slate-400">{under}</div>}
        {serie && serie.length > 1 && (
            <div className="mt-2">
                <Sparkline verdier={serie} farge={farge} />
            </div>
        )}
    </div>
);

export const Tomt: React.FC<{ tekst: string }> = ({ tekst }) => (
    <p className="py-8 text-center text-sm text-slate-400">{tekst}</p>
);
