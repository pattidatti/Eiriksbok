/**
 * Lager persongalleri-sluggen for et personnavn.
 *
 * Den kanoniske sluggen kommer fra filnavnet i `public/content/people/`, og den
 * er ikke alltid lik navnet («smith.json» er Bessie Smith). Derfor registrerer
 * `scripts/generate-people.js` alle translitterasjonsvarianter av navnet som
 * alias-slugger, og `usePerson` slår opp på både kanonisk slug og alias. Da er
 * det trygt å utlede sluggen fra navnet her: alle 224 personer treffer.
 *
 * Denne må holdes i synk med `slugify` i generatoren.
 */
export function personSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/æ/g, 'ae')
        .replace(/ø/g, 'o')
        .replace(/å/g, 'a')
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
