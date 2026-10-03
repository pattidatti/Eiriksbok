// Felles byggeklosser for menyene: brytere, glidebrytere, knapper og tastaturstyringen.
// Tastatur først: piltast opp/ned flytter mellom valgene, Enter/mellomrom velger, Esc går tilbake.
import type { ReactNode } from 'react';
import { FOKUS } from './fokus';
import { KNAPP, KNAPP_2, KNAPP_FARE } from './stil';

export function Bryter({ tekst, hjelp, paa, onBytt, disabled }: { tekst: string; hjelp?: string; paa: boolean; onBytt: (v: boolean) => void; disabled?: boolean }) {
    return (
        <button
            role="switch"
            aria-checked={paa}
            disabled={disabled}
            onClick={() => onBytt(!paa)}
            className={`flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left hover:bg-[#ead9b4]/60 disabled:opacity-50 ${FOKUS}`}
        >
            <span>
                <span className="block text-[17px] font-bold text-[#2b1d10]">{tekst}</span>
                {hjelp && <span className="block text-[14px] text-[#5c4630]">{hjelp}</span>}
            </span>
            <span className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${paa ? 'border-[#6c190f] bg-[#9a2a1c]' : 'border-[#a5844f] bg-[#d9c7a0]'}`}>
                <span className={`absolute top-[3px] h-5 w-5 rounded-full bg-[#fbf5e6] shadow transition-[left] ${paa ? 'left-6' : 'left-1'}`} />
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
        <label className="block rounded-lg px-3 py-2 hover:bg-[#ead9b4]/60">
            <span className="flex items-baseline justify-between text-[17px] font-bold text-[#2b1d10]">
                {tekst}
                <span className="text-[15px] font-bold tabular-nums text-[#5c4630]">{vis(verdi)}</span>
            </span>
            <input
                type="range"
                min={min}
                max={max}
                step={steg}
                value={verdi}
                onChange={(e) => onEndre(Number(e.target.value))}
                className={`mt-1.5 h-2 w-full cursor-pointer rounded-full accent-[#9a2a1c] ${FOKUS}`}
            />
        </label>
    );
}

export function Knapp({ children, onClick, farge = 'lys', autoFocus }: { children: ReactNode; onClick: () => void; farge?: 'lys' | 'blaa' | 'rod' | 'farlig'; autoFocus?: boolean }) {
    // 'blaa' og 'rod' er begge hovedknappen (seglrød) nå; navnene beholdes for dem som bruker dem.
    // 'farlig' er for det som ikke kan angres (begynne på nytt, avslutte).
    const f = farge === 'lys' ? KNAPP_2 : farge === 'farlig' ? KNAPP_FARE : KNAPP;
    return (
        <button autoFocus={autoFocus} onClick={onClick} className={`${f} py-2.5`}>
            {children}
        </button>
    );
}

export function Overskrift({ children }: { children: ReactNode }) {
    return <h3 className="bry-display mb-1 mt-5 flex items-center gap-3 px-3 text-[21px] leading-none text-[#5a3519] first:mt-0">
            {children}
            <span className="bry-strek flex-1" aria-hidden="true" />
        </h3>;
}
