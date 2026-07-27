// Ære og ætt (blueprint §7.1).
//
// Æren er ikke en moralmåler. Den måler én ting: om folk regner med deg. Et
// samfunn uten stat har ingen andre å be om hjelp enn dem som kjenner deg, og
// da er ryktet ditt den eneste forsikringen som finnes. Det er derfor æren
// styrer priser, oppdrag, vitner på tinget - og i kapittel 2 om naboætten
// stiller seg foran tunet ditt eller lar deg stå der alene.
//
// To tall, og de er ikke det samme:
//
//   **Ære** er personlig. Den dør med personen, og hvert kapittel begynner på
//   nytt.
//   **Ætt-ære** arves. `startAere = 30 + aettAere / 2` er hele ættesamfunnet i
//   én linje: du begynner med et forsprang du ikke har gjort deg fortjent til,
//   fordi bestefaren din holdt ord.
//
// Ren modul. Ingen store, ingen scene.

import type { AettTilstand } from '../types';

export const AERE_MAKS = 100;

/**
 * Grunnene æren flytter seg av.
 *
 * De er ikke «gode» og «onde» handlinger. De er handlinger som gjør deg til en
 * folk kan stole på, og handlinger som gjør deg til en de ikke kan. Å gi en
 * gave er ikke snillhet - det er å binde noen til deg, og alle vet det.
 */
export const AERE_GRUNNER = {
    'holdt-ord': { delta: 8, tekst: 'Du holdt ordet ditt.' },
    gave: { delta: 6, tekst: 'Du ga uten å bli bedt.' },
    'talte-sak': { delta: 10, tekst: 'Du talte en annens sak.' },
    'gjorde-opp': { delta: 12, tekst: 'Du gjorde opp for deg.' },
    'sto-imot': { delta: 10, tekst: 'Du sto der da det gjaldt.' },
    'brot-ord': { delta: -14, tekst: 'Du brøt ordet ditt. Det snakkes om.' },
    'tok-uten-a-gi': { delta: -10, tekst: 'Du tok uten å gi noe tilbake.' },
    'brot-tingfred': { delta: -20, tekst: 'Du brøt tingfreden.' },
    'drap-ulyst': { delta: -25, tekst: 'Du drepte og lyste det ikke. Det er mord.' },
    'lot-folk-sulte': { delta: -12, tekst: 'Du lot dine egne sulte.' },
} as const;

export type AereGrunn = keyof typeof AERE_GRUNNER;

/**
 * Trinnene. Navnet er ikke en karakter - det er hva folk i bygda gjør når du
 * kommer gående.
 */
export const AERE_TRINN = [
    { fra: 0, id: 'utstott', navn: 'Utstøtt', folk: 'Folk snur seg vekk når du kommer.' },
    { fra: 20, id: 'uten-ord', navn: 'Uten ord', folk: 'Ingen regner med deg.' },
    { fra: 40, id: 'en-av-oss', navn: 'En av oss', folk: 'Du hilses. Ikke mer.' },
    { fra: 62, id: 'aktet', navn: 'Aktet', folk: 'Folk hører etter når du sier noe.' },
    { fra: 82, id: 'holdt-hoyt', navn: 'Holdt høyt', folk: 'De kommer når du kaller.' },
] as const;

export type AereTrinn = (typeof AERE_TRINN)[number];

export function trinnFor(aere: number): AereTrinn {
    let trinn: AereTrinn = AERE_TRINN[0];
    for (const t of AERE_TRINN) if (aere >= t.fra) trinn = t;
    return trinn;
}

export function klampAere(aere: number): number {
    return Math.min(AERE_MAKS, Math.max(0, Math.round(aere)));
}

/**
 * Æren en ny person begynner med.
 *
 * Halve ætt-æren, og aldri under tretti. Gulvet er det som gjør at et kapittel
 * kan spilles av en elev som gjorde det dårlig i det forrige - hun skal ha noe
 * å stige fra, ikke en gjeld.
 */
export function startAere(aettAere: number): number {
    return klampAere(30 + aettAere / 2);
}

/**
 * Ætt-æren personen etterlater seg.
 *
 * Det som blir igjen av et liv er ikke hele æren, men det folk gadd å fortelle
 * videre. Tre firedeler, lagt oppå det ætten hadde fra før, og med tak.
 */
export function arvetAere(aettAere: number, sluttAere: number): number {
    return klampAere((aettAere + sluttAere * 0.75) / 1.5);
}

/**
 * Hva Bera tar for varene sine.
 *
 * Lav ære er dyrt. Ikke fordi kremmeren er ond, men fordi hun ikke vet om hun
 * får se deg igjen. 1,25 nederst, 0,75 øverst - og nøyaktig 1,0 på femti, som
 * er der alle begynner. Kurven er lagt slik med vilje: et kapittel uten
 * ærespill skal ikke få andre priser enn før bare fordi systemet finnes.
 */
export function prisfaktor(aere: number): number {
    return Number((1.25 - (klampAere(aere) / AERE_MAKS) * 0.5).toFixed(2));
}

/** Prisen eleven faktisk betaler. Ett sted, så bod og kjøp aldri er uenige. */
export function prisFor(pris: number, aere: number): number {
    return Math.max(1, Math.round(pris * prisfaktor(aere)));
}

/** Hører ætten på deg? Under null vil de deg noe. */
export const TOM_AETT: AettTilstand = { velvilje: 0, uoppgjort: 0 };

export function aettTilstand(
    aetter: Record<string, AettTilstand>,
    aettId: string
): AettTilstand {
    return aetter[aettId] ?? TOM_AETT;
}

/**
 * Stiller ætten opp for deg?
 *
 * To krav, og begge må være der: de må skylde deg noe *og* du må være verdt å
 * stå ved siden av. Blueprintens §16.1 er hele grunnen - kampen som ikke skjer
 * skal være noe eleven vet at hun kjøpte, ellers leser den som at spillet
 * hoppet over innhold.
 */
export function stillerOpp(aere: number, aett: AettTilstand): boolean {
    return aere >= 62 && aett.velvilje >= 40;
}
