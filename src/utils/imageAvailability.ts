/**
 * Bilder som ennå ikke er generert.
 *
 * Artikkel-workflowene (`/plan_article`, `/build_topic`, `/oppgrader_km`) skriver
 * `/images/placeholder.webp` inn i JSON-en som en *markør*: "her skal det et bilde,
 * men det er ikke laget ennå". `/bilde`-workflowen leter etter nettopp den markøren
 * når den skal generere bilder. Markøren er derfor bevisst en fil som IKKE finnes
 * på disk - og et `<img>` som peker på den gir den stygge "bilde mangler"-boksen.
 *
 * Regelen i appen er enkel: et bilde som ikke er der, vises ikke. Markøren
 * blir stående i innholdet til bildet faktisk er generert, og i samme øyeblikk
 * fila legges inn dukker bildet opp av seg selv - ingen JSON må redigeres.
 */

/** Markøren workflowene skriver. Bruk denne konstanten, ikke strengen direkte. */
export const PENDING_IMAGE_SRC = '/images/placeholder.webp';

/**
 * Matcher enhver sti som ender på `placeholder.webp` (eller .png/.jpg/.avif),
 * med eller uten mappe foran og med eller uten `?v=`-hale. Fanger både
 * `/images/placeholder.webp` og eventuelle per-tema-varianter.
 */
const PENDING_PATTERN = /(^|\/)placeholder(-\w+)?\.(webp|png|jpe?g|avif)$/i;

/**
 * Er dette et bilde som ikke finnes ennå?
 *
 * Sant for tom/manglende src og for placeholder-markøren. Sjekken er en ren
 * strengtest - ingen nettverkskall - så en placeholder koster oss aldri en
 * 404-runde og blinker aldri til på skjermen.
 */
export const isPendingImage = (src?: string | null): boolean => {
    if (!src) return true;
    const trimmed = src.trim();
    if (!trimmed) return true;
    return PENDING_PATTERN.test(trimmed.split(/[?#]/)[0]);
};
