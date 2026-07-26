// Skjermkontroll og atmosfære - de to tingene som ligger oppå Phaser-lerretet
// i stedet for inni det.
//
// Kontrollen fantes ikke før: spillet tok bare tastatur og håndkontroll, så på
// et nettbrett eller en Chromebook i tablet-modus var det uspillbart.
//
// Atmosfæren ligger her og ikke i Phaser fordi kameraet har heltallszoom.
// Et lag inne i scenen ville blitt skalert 3x sammen med alt annet; her blir
// vignetten skarp uansett skjermoppløsning.

import { useCallback, useEffect, useRef, useState } from 'react';
import { tilSpill } from '../engine/bridge';

/** Himmeltone og vignett. Fargen kommer fra sonens tema. */
export function Atmosfare({ himmel }: { himmel: string | null }) {
    if (!himmel) return null;
    return (
        <div className="pointer-events-none absolute inset-0 z-10">
            <div className="absolute inset-0 mix-blend-multiply" style={{ background: himmel, opacity: 0.1 }} />
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse at center, rgba(11,16,24,0) 42%, rgba(11,16,24,0.34) 100%)',
                }}
            />
        </div>
    );
}

const STIKKE_R = 52;

/**
 * Styrestikke og knapper. Stikka gir analogt utslag, så eleven kan snike seg
 * fram like godt som å løpe.
 */
export function Skjermkontroll({ gardOppe }: { gardOppe: boolean }) {
    const [aktiv, setAktiv] = useState(false);
    const [knott, setKnott] = useState({ x: 0, y: 0 });
    const baseRef = useRef<HTMLDivElement | null>(null);
    const pekerId = useRef<number | null>(null);

    const send = useCallback((x: number, y: number) => {
        tilSpill.emit('styring', { x, y });
    }, []);

    useEffect(() => () => tilSpill.emit('styring', { x: 0, y: 0 }), []);

    const flytt = (e: React.PointerEvent) => {
        if (pekerId.current !== e.pointerId) return;
        const base = baseRef.current?.getBoundingClientRect();
        if (!base) return;
        const cx = base.left + base.width / 2;
        const cy = base.top + base.height / 2;
        let dx = e.clientX - cx;
        let dy = e.clientY - cy;
        const lengde = Math.hypot(dx, dy);
        if (lengde > STIKKE_R) {
            dx = (dx / lengde) * STIKKE_R;
            dy = (dy / lengde) * STIKKE_R;
        }
        setKnott({ x: dx, y: dy });
        send(dx / STIKKE_R, dy / STIKKE_R);
    };

    const slipp = (e: React.PointerEvent) => {
        if (pekerId.current !== e.pointerId) return;
        pekerId.current = null;
        setAktiv(false);
        setKnott({ x: 0, y: 0 });
        send(0, 0);
    };

    return (
        <div className="pointer-events-none absolute inset-0 z-20 select-none">
            <div
                ref={baseRef}
                onPointerDown={(e) => {
                    pekerId.current = e.pointerId;
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    setAktiv(true);
                    flytt(e);
                }}
                onPointerMove={flytt}
                onPointerUp={slipp}
                onPointerCancel={slipp}
                className="pointer-events-auto absolute bottom-6 left-6 grid h-32 w-32 touch-none place-items-center rounded-full border-2 border-white/20 bg-slate-900/40 backdrop-blur-sm"
                aria-label="Styrestikke"
            >
                <div
                    className={`h-14 w-14 rounded-full border-2 transition-colors ${
                        aktiv ? 'border-amber-300/80 bg-amber-300/30' : 'border-white/30 bg-white/15'
                    }`}
                    style={{ transform: `translate(${knott.x}px, ${knott.y}px)` }}
                />
            </div>

            {/*
                Garden er en veksling her, ikke et hold: tommelen kan ikke holde
                skjoldet og slå samtidig. Og fordi paraden *er* reisningen, blir
                trykket nøyaktig den samme ferdigheten som på tastatur - «trykk i
                det slaget kommer». Med skjoldet oppe blir «Slå» våpenets manøver.
            */}
            <div className="pointer-events-auto absolute bottom-6 right-6 flex items-end gap-3">
                <Knapp navn="bruk" tekst="Snakk" farge="sky" />
                <Knapp navn="rull" tekst="Rull" farge="slate" />
                <Knapp navn="gard" tekst="Skjold" farge="tre" nede={gardOppe} />
                <Knapp navn="angrep" tekst={gardOppe ? 'Manøver' : 'Slå'} farge="amber" stor />
            </div>
        </div>
    );
}

function Knapp({
    navn,
    tekst,
    farge,
    stor,
    nede,
}: {
    navn: 'angrep' | 'rull' | 'bruk' | 'gard';
    tekst: string;
    farge: 'amber' | 'slate' | 'sky' | 'tre';
    stor?: boolean;
    /** Vekslingsknapper viser om de står på. Tilstanden kommer fra scenen. */
    nede?: boolean;
}) {
    const stil =
        farge === 'amber'
            ? 'border-amber-300/70 bg-amber-400/25 text-amber-100'
            : farge === 'sky'
              ? 'border-sky-300/60 bg-sky-400/20 text-sky-100'
              : farge === 'tre'
                ? 'border-[#c9a86a]/70 bg-[#c9a86a]/20 text-[#f0dcb0]'
                : 'border-white/25 bg-white/10 text-slate-100';
    return (
        <button
            type="button"
            aria-pressed={nede}
            onPointerDown={(e) => {
                e.preventDefault();
                tilSpill.emit('knapp', { navn });
            }}
            className={`grid touch-none place-items-center rounded-full border-2 font-display font-bold backdrop-blur-sm active:scale-95 ${stil} ${
                stor ? 'h-20 w-20 text-sm' : 'h-14 w-14 text-xs'
            } ${nede ? 'scale-95 ring-2 ring-amber-200/80' : ''}`}
        >
            {tekst}
        </button>
    );
}
