// Felles byggeklosser for menyene: brytere, glidebrytere, knapper og tastaturstyringen.
// Tastatur først: piltast opp/ned flytter mellom valgene, Enter/mellomrom velger, Esc går tilbake.
import type { ReactNode } from 'react';
import { FOKUS } from './fokus';

export function Bryter({ tekst, hjelp, paa, onBytt, disabled }: { tekst: string; hjelp?: string; paa: boolean; onBytt: (v: boolean) => void; disabled?: boolean }) {
    return (
        <button
            role="switch"
            aria-checked={paa}
            disabled={disabled}
            onClick={() => onBytt(!paa)}
            className={`flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2 text-left hover:bg-slate-100 disabled:opacity-50 ${FOKUS}`}
        >
            <span>
                <span className="block text-[16px] font-semibold text-slate-900">{tekst}</span>
                {hjelp && <span className="block text-[13px] text-slate-600">{hjelp}</span>}
            </span>
            <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${paa ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left] ${paa ? 'left-6' : 'left-1'}`} />
                <span className="sr-only">{paa ? 'på' : 'av'}</span>
            </span>
        </button>
    );
}

export function Glider({
    tekst,
    verdi,
    min = 0,
    max = 1,
    steg = 0.05,
    vis,
    onEndre,
}: {
    tekst: string;
    verdi: number;
    min?: number;
    max?: number;
    steg?: number;
    vis: (v: number) => string;
    onEndre: (v: number) => void;
}) {
    return (
        <label className="block rounded-xl px-3 py-2 hover:bg-slate-100">
            <span className="flex items-baseline justify-between text-[16px] font-semibold text-slate-900">
                {tekst}
                <span className="text-[14px] font-semibold tabular-nums text-slate-600">{vis(verdi)}</span>
            </span>
            <input
                type="range"
                min={min}
                max={max}
                step={steg}
                value={verdi}
                onChange={(e) => onEndre(Number(e.target.value))}
                className={`mt-1.5 h-2 w-full cursor-pointer rounded-full accent-indigo-600 ${FOKUS}`}
            />
        </label>
    );
}

export function Knapp({ children, onClick, farge = 'lys', autoFocus }: { children: ReactNode; onClick: () => void; farge?: 'lys' | 'blaa' | 'rod'; autoFocus?: boolean }) {
    const f = farge === 'blaa' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : farge === 'rod' ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300';
    return (
        <button autoFocus={autoFocus} onClick={onClick} className={`rounded-xl px-4 py-2.5 text-[16px] font-semibold ${f} ${FOKUS}`}>
            {children}
        </button>
    );
}

export function Overskrift({ children }: { children: ReactNode }) {
    return <h3 className="mb-1 mt-4 px-3 text-[13px] font-bold uppercase tracking-widest text-indigo-700 first:mt-0">{children}</h3>;
}
