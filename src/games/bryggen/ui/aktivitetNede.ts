// Står et aktivitetspanel nederst i midten nå? Hud.tsx løfter E-teksten når ingenting står der.
// Holdes i takt med `Aktiviteter` i Aktiviteter.tsx (eget filnavn: komponentfilene eksporterer bare komponenter).
import type { MesseHud } from '../graboks/messe';

const NEDE = ['syrytme', 'terning', 'kontor-morgensprache', 'kontor-sortering', 'kontor-prute', 'kontor-gjeldsbok', 'kontor-vinsj', 'kontor-koggen', 'kontor-veiing'];

export function aktivitetNede(system: Record<string, unknown>): boolean {
    const messe = system.messe as MesseHud | null | undefined;
    return (!!messe && messe.flamme === null) || NEDE.some((n) => system[n] != null);
}

