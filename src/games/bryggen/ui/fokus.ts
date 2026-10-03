// Tastaturstyringen i menyene: piltast opp/ned flytter mellom valgene, og fokus synes godt.
import type { KeyboardEvent } from 'react';

// Seglrød ring med lys kant (stil.css, .bry-fokus): synes på pergament og over spillet.
export const FOKUS = 'bry-fokus';

const FOKUSERBAR = 'button:not([disabled]), input:not([disabled]), [tabindex="0"]';

/** Flytter fokus til forrige/neste valg inne i `rot`. */
export function flyttFokus(rot: HTMLElement | null, retning: 1 | -1): void {
    if (!rot) return;
    const alle = [...rot.querySelectorAll<HTMLElement>(FOKUSERBAR)];
    if (!alle.length) return;
    const i = alle.indexOf(document.activeElement as HTMLElement);
    const neste = i < 0 ? (retning > 0 ? 0 : alle.length - 1) : (i + retning + alle.length) % alle.length;
    alle[neste].focus();
}

/** Piltast opp/ned mellom valgene i et panel. Glidebryterne beholder venstre/høyre. */
export function pilNav(e: KeyboardEvent<HTMLElement>): void {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    flyttFokus(e.currentTarget, e.key === 'ArrowDown' ? 1 : -1);
}
