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

/** Artikkel-stiene (uten skråstrek foran) til alle filmer som finnes. Laster ingen manus. */
export function alleFilmer(): string[] {
    return Object.keys(MANUS).map((k) => k.slice('./manus/'.length, -'.json'.length));
}

const SETT_NOKKEL = 'eiriksbok-filmer-sett';

/** Filmene eleven har sett ferdig på denne maskinen. */
export function setteFilmer(): Set<string> {
    try {
        return new Set(JSON.parse(localStorage.getItem(SETT_NOKKEL) || '[]') as string[]);
    } catch {
        return new Set();
    }
}

export function merkSomSett(artikkelSti: string) {
    try {
        const sett = setteFilmer();
        sett.add(artikkelSti.replace(/^\/|\/$/g, ''));
        localStorage.setItem(SETT_NOKKEL, JSON.stringify([...sett]));
    } catch {
        // Privat vindu eller blokkert lagring: filmen virker like fullt.
    }
}
