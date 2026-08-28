// Pengeliv - startverdiene for de delene av profilen og tilstanden som kom
// med fase 4-10.
//
// Alt her er «ingenting ennå»: eleven eier ingen fond, skylder ingen penger,
// eier ingen bolig. Modulene fyller dem etter hvert som eleven tar valg.
// Grunnen til at det ligger samlet i én fil er at både persona-oppstarten og
// migrering av gamle lagringer må bli enige om nøyaktig samme startpunkt.

import type { Marked, Pensjon, ProfilUtvidelse, TilstandUtvidelse } from '../types';

/**
 * Frøet markedet regnes ut fra. Det utledes av persona-id-en i stedet for å
 * trekkes tilfeldig, fordi framskrivningen kjører markedet på nytt hver gang
 * eleven drar i en skyveknapp. Uten et fast frø ville grafen gitt et nytt
 * svar for hvert museklikk, og da måler eleven flaks i stedet for valg.
 */
export function froFra(personaId: string): number {
    let h = 2166136261;
    for (let i = 0; i < personaId.length; i++) {
        h ^= personaId.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return Math.abs(h) % 100000;
}

/**
 * Innskuddspensjon fra jobb. 2 % av lønn er lovens minstekrav, og det er det
 * de fleste unge i sin første jobb faktisk har.
 */
const MINSTE_INNSKUDDSSATS = 0.02;

export function tomPensjon(): Pensjon {
    return {
        innskuddssats: MINSTE_INNSKUDDSSATS,
        innskuddspensjon: 0,
        folketrygdPerAar: 0,
    };
}

export function tomtMarked(personaId: string): Marked {
    // Kursene er tomme og seedes av fond- og børssteget første gang de kjører,
    // slik at universet kan vokse i datafilene uten å røre denne fila.
    return { fro: froFra(personaId), kurs: {}, krakkIgjen: 0 };
}

export function tomProfilUtvidelse(): ProfilUtvidelse {
    return {
        beholdninger: [],
        yrkeId: null,
        aarIYrke: 0,
        utdanningsniva: 'ingen',
        studererId: null,
        studiumFerdigMaaned: null,
    };
}

export function tomTilstandUtvidelse(personaId: string): TilstandUtvidelse {
    return {
        marked: tomtMarked(personaId),
        skyggeregnskap: { utsattSkatt: 0, urealisertGevinst: 0 },
        laan: [],
        pensjon: tomPensjon(),
        bolig: null,
        boligmarked: { prisindeks: 1 },
        fullforteUtfordringer: [],
        aktivHendelse: null,
    };
}
