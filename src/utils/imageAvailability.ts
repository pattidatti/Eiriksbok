/**
 * Bilder som ennå ikke er generert.
 *
 * Artikkel-workflowene (`/plan_article`, `/build_topic`, `/oppgrader_km`) skriver
 * `/images/placeholder.webp` inn i JSON-en som en *markør*: "her skal det et bilde,
 * men det er ikke laget ennå". `/bilde`-workflowen leter etter nettopp den markøren
 * når den skal generere bilder. Markøren er derfor bevisst en fil som IKKE finnes
 * på disk - og et `<img>` som peker på den gir den stygge "bilde mangler"-boksen.
 *
 * Regelen i appen er enkel: et bilde som ikke er der, vises ikke. Markøren blir
 * stående i innholdet til bildet faktisk er generert, og i samme øyeblikk fila
 * legges inn dukker bildet opp av seg selv - ingen JSON må redigeres.
 */

/** Markøren workflowene skriver. Bruk denne konstanten, ikke strengen direkte. */
export const PENDING_IMAGE_SRC = '/images/placeholder.webp';

/**
 * Er dette et bilde som ikke finnes ennå?
 *
 * Sjekken treffer med vilje bare den ene markøren og tom/manglende src - ikke alt
 * som *heter* placeholder. Det finnes ekte bilder på disk med det navnet
 * (`/images/dialekter/placeholder.webp`), og et mønster som fanget dem ville
 * skjult filer som faktisk er der.
 *
 * Alt annet som mangler - skrivefeil i stien, en slettet fil - trenger ingen
 * navneregel: `useImageAvailability` fanger det på `onError` og skrur av
 * visningen på nøyaktig samme måte. Denne funksjonen er bare snarveien som
 * sparer oss for 404-runden i det ene tilfellet vi kan vite om på forhånd.
 */
export const isPendingImage = (src?: string | null): boolean => {
    if (!src) return true;
    const trimmed = src.trim();
    if (!trimmed) return true;
    return trimmed.split(/[?#]/)[0] === PENDING_IMAGE_SRC;
};
