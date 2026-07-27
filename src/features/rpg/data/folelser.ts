// Følelseshjulet.
//
// Det eneste elevene kan si til hverandre i hallen. Ingen fritekst-chat
// (blueprint §4.4): fritekst mellom mindreårige uten konto og uten moderasjon
// er ikke noe dette produktet skal ha, og et fast hjul kan ikke misbrukes til
// noe annet enn det det er.
//
// Åtte er nok. Med fjorten begynner hjulet å kreve at man leter, og da slutter
// det å være noe man gjør i forbifarten.

export interface Folelse {
    id: string;
    emoji: string;
    /** Ordet under ikonet. Et hjul med bare bilder må gjettes på. */
    ord: string;
}

export const FOLELSER: Folelse[] = [
    { id: 'hei', emoji: '👋', ord: 'Hei' },
    { id: 'blid', emoji: '😀', ord: 'Blid' },
    { id: 'oi', emoji: '😮', ord: 'Oi' },
    { id: 'humor', emoji: '😂', ord: 'He-he' },
    { id: 'bra', emoji: '👍', ord: 'Bra' },
    { id: 'hjerte', emoji: '❤️', ord: 'Hjerte' },
    { id: 'baal', emoji: '🔥', ord: 'Bål' },
    { id: 'tenker', emoji: '🤔', ord: 'Tenker' },
];

/**
 * Ikonene som er lov å vise.
 *
 * Prøves på det som kommer *inn* fra nettet. Reglene i `database.rules.json`
 * kan bare måle lengden - en tekststreng på to tegn kan de ikke skille fra en
 * annen - så det er her det avgjøres at hallen bare viser disse åtte.
 */
const LOVLIGE = new Set(FOLELSER.map((f) => f.emoji));

/** Ikonet en gjest sendte, eller null hvis det ikke er ett av våre. */
export function trygtIkon(raatt: unknown): string | null {
    return typeof raatt === 'string' && LOVLIGE.has(raatt) ? raatt : null;
}

/** Hvor lenge en følelse henger over hodet før den løser seg opp. */
export const FOLELSE_MS = 4000;
