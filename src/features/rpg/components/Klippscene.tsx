// Laget som ligger oppå lerretet mens en cutscene går: bjelkene, replikken og
// veien ut.
//
// Bjelkene tegnes her og ikke i Phaser med vilje. Scenen zoomer 3-4 ganger, så
// en bjelke på 24 piksler ville blitt 96 høy og dekket halve bildet - og
// teksten ville blitt en grøt av store piksler. Det samme valget er tatt for
// himmeltonen og blodkanten.

import { useEffect } from 'react';
import { tilSpill } from '../engine/bridge';

interface Props {
    /** Kjører det en cutscene nå? */
    pa: boolean;
    /** Har eleven sett denne før? Da kan hun hoppe over (blueprint §8, regel 2). */
    kanHoppes: boolean;
    /** Replikken. `hvem: null` er elevens egen tanke, og settes i kursiv. */
    tekst: { hvem: string | null; tekst: string } | null;
}

export function Klippscene({ pa, kanHoppes, tekst }: Props) {
    // Mellomrom, E og Enter fører videre; Esc hopper over. Lytteren henger på
    // window fordi eleven ikke skal måtte klikke på lerretet først - hun holder
    // allerede hendene på tastaturet, det er derfra hun kom.
    useEffect(() => {
        if (!pa) return;
        const lytt = (e: KeyboardEvent) => {
            if (e.repeat) return;
            if (e.key === 'Escape') {
                if (kanHoppes) tilSpill.emit('klippHoppOver', {});
                return;
            }
            if (e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
                tilSpill.emit('klippVidere', {});
            }
        };
        window.addEventListener('keydown', lytt);
        return () => window.removeEventListener('keydown', lytt);
    }, [pa, kanHoppes]);

    if (!pa) return null;

    return (
        <div
            className="absolute inset-0 z-40"
            onClick={() => tilSpill.emit('klippVidere', {})}
            role="presentation"
        >
            {/* Bjelkene. De glir inn, de blinker ikke. */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[11vh] origin-top animate-[klippBjelke_420ms_ease-out] bg-black" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[11vh] origin-bottom animate-[klippBjelke_420ms_ease-out] bg-black" />

            {kanHoppes && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        tilSpill.emit('klippHoppOver', {});
                    }}
                    className="absolute right-4 top-[calc(11vh+0.75rem)] rounded-full bg-slate-900/85 px-4 py-1.5 text-xs font-semibold text-slate-200 ring-1 ring-white/20 transition hover:bg-slate-800"
                >
                    Hopp over
                    <span className="ml-2 rounded bg-white/10 px-1 text-[10px] text-slate-400">
                        Esc
                    </span>
                </button>
            )}

            {tekst && (
                <div className="pointer-events-none absolute inset-x-0 bottom-[calc(11vh+1.25rem)] flex justify-center px-4">
                    <div className="w-full max-w-2xl rounded-xl border border-amber-300/25 bg-slate-950/90 px-5 py-4 shadow-2xl">
                        {tekst.hvem && (
                            <p className="mb-1 text-xs font-bold uppercase tracking-[0.25em] text-amber-300/90">
                                {tekst.hvem}
                            </p>
                        )}
                        <p
                            className={`text-[17px] leading-relaxed sm:text-lg ${
                                tekst.hvem ? 'text-slate-100' : 'italic text-slate-300'
                            }`}
                        >
                            {tekst.tekst}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
