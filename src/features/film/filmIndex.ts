import type { FilmManus } from './types';

/**
 * Filmene finnes automatisk: et manus i `manus/<fag>/<emne>/<leksjon>.json` hører til
 * artikkelen `/<fag>/<emne>/<leksjon>` og spilles av på `/film/<fag>/<emne>/<leksjon>`.
 * Manusene lastes først når filmen åpnes.
 */
const MANUS = import.meta.glob<{ default: FilmManus }>('./manus/**/*.json');

function nokkel(artikkelSti: string) {
    return `./manus${artikkelSti.replace(/\/$/, '')}.json`;
}

/** Lenke til filmen for en artikkel, eller null hvis den ikke har film. */
export function filmLenke(artikkelSti: string): string | null {
    return MANUS[nokkel(artikkelSti)] ? `/film${artikkelSti.replace(/\/$/, '')}` : null;
}

export async function hentManus(artikkelSti: string): Promise<FilmManus | null> {
    const last = MANUS[nokkel(artikkelSti)];
    return last ? (await last()).default : null;
}
