// Tekstene i Gamma: mål, regler, tips og «Dette skjedde». Tonen er alvorlig og saklig.

import type { Årsak } from './game';

export const MÅL = 'Hold familien varm til hjelpen kommer i februar 1945 - uten at tyskerne finner dere.';

export const REGLER = [
    'Gå med piltastene eller A/D. Hent ved nede i bjørkeskogen.',
    'Trykk mellomrom inne i gamma for å legge en kubbe på bålet. Den gir varme, men det stiger røyk - og den brenner ferdig.',
    'Ser lyset fra båten røyken eller deg, blir dere funnet.',
];

export const TAP_TITTEL: Record<Årsak, string> = {
    funnet: 'Funnet',
    frosset: 'Bålet gikk ut',
};

export const TIPS: Record<Årsak, string> = {
    funnet:
        'Tyskerne lette langs kysten etter folk som hadde gjemt seg. Ikke legg på ved når du hører båten - røyken henger igjen en stund.',
    frosset: 'De som gjemte seg, hadde bare det de kunne bære. Hent ved mens båten er borte, og fyr jevnt.',
};

export const SKJEDDE = {
    funnet: (dato: string) =>
        `${dato}: Lyset fant dere. Tyskerne tvang rundt 50 000 mennesker til å flytte sørover.`,
    frosset: (dato: string) =>
        `${dato}: Bålet gikk ut. Rundt 23 000 mennesker gjemte seg i huler og gammer denne vinteren.`,
    seier:
        'Februar 1945: 500 mennesker ble hentet over havet til Skottland. Andre holdt ut i fjellet til krigen sluttet i mai.',
};

export const LÆRDOM = {
    brentJord:
        'Brent jord: soldatene brente hus, fjøs og båter, så ingen skulle kunne bo der.',
    gjemte:
        'De som gjemte seg, måtte velge mellom varme og å bli sett. Røyk fra bålet kunne avsløre dem.',
};

/** Lappene: maks sju ord, står ved tingen de handler om. */
export const LAPP = {
    båt: 'En båt! Ikke legg på mer ved.',
    bær: 'Bær veden opp til gamma.',
    tom: 'Tom for ved! Hent mer i skogen.',
    legg: 'Bålet går ut - legg på ved!',
    kaldt: 'Kaldt, og ingen ved - skynd deg!',
    såVidt: 'Det gikk så vidt.',
    forbi: 'Lyset gikk forbi. Røyken var borte.',
};

/** Lærings-øyeblikket: første båt, når lyset stanser rett under gamma. */
export const BEAT = {
    lyset: {
        tittel: 'Lyset ser røyken',
        tekst: 'Når lyset treffer røyken over gamma, finner tyskerne dere. Ikke legg på ved når båten kommer.',
    },
};
