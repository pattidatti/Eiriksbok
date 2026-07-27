// Cutscenene i kapittel 1. Én fil, fordi de to hører til samme time.
//
// Reglene fra blueprintens §8 er skrevet inn i innholdet, ikke i motoren:
//
//   - **Ingen fakta bare her.** `sjosettingen` sier ikke ett ord om
//     klinkbygging. Det lærte eleven av å legge bordene, og hun får det igjen
//     som et begrep i minnetreet - ikke som en replikk.
//   - **Maks 40 sekunder.** Begge ligger på 25-30.
//   - **Vis handling.** Orm sier ingenting i `sjosettingen`. Han legger hånda
//     på bordgangen hun la, og det er hele scenen. Tre replikker ville sagt
//     mindre.

import type { KlippDef } from '../../types';

/**
 * Skipet går på vannet for første gang.
 *
 * Den eneste replikken tilhører ikke faren. Den er elevens egen tanke, og den
 * sier noe om ham hun ikke får høre ham si - som er hele poenget med en far som
 * ikke snakker.
 */
export const SJOSETTINGEN: KlippDef = {
    id: 'sjosettingen',
    steg: [
        { art: 'letterbox', pa: true },
        { art: 'stille' },
        { art: 'kamera', til: [6, 41], ms: 1200 },
        { art: 'vent', ms: 400 },
        { art: 'lyd', navn: 'treSprak' },
        { art: 'ryst', ms: 260, styrke: 0.004 },
        { art: 'tanke', tekst: 'Kjølen tar vannet. Skroget setter seg. Det holder.' },
        { art: 'flytt', hvem: 'orm', til: [5, 41] },
        { art: 'vend', hvem: 'orm', retning: 'hoyre' },
        { art: 'gaa', hvem: 'orm', til: [4, 41], ms: 1100 },
        { art: 'vent', ms: 700 },
        // Han legger hånda på bordgangen hun la. Han sier ingenting.
        { art: 'tanke', tekst: 'Faren min legger hånda på bordet jeg la. Han sier ingenting.' },
        { art: 'vent', ms: 900 },
        { art: 'musikk', rot: 196, modus: 0 },
        { art: 'letterbox', pa: false },
    ],
};

/**
 * Kjølen skraper sand ved Lindisfarne.
 *
 * Klosteret ligger der uten mur. Det er den ene opplysningen scenen bærer, og
 * den bæres av bildet: ingen hadde tenkt tanken før 793, så ingen hadde bygget
 * en. Replikken sier ikke det - den lar eleven se det.
 */
export const STRANDA: KlippDef = {
    id: 'stranda',
    steg: [
        { art: 'letterbox', pa: true },
        { art: 'toning', inn: true, ms: 900 },
        { art: 'lyd', navn: 'treSprak' },
        { art: 'tanke', tekst: 'Kjølen skraper sand.' },
        { art: 'taake', tetthet: 0.3, ms: 900 },
        // Kamera stiger opp over stranda og finner klosteret.
        { art: 'kamera', til: [30, 14], ms: 2200 },
        { art: 'vent', ms: 800 },
        { art: 'tanke', tekst: 'Det har ingen mur. Ingen vollgrav. Ingen vakt.' },
        { art: 'vent', ms: 600 },
        { art: 'tanke', tekst: 'Ingen har hatt bruk for en.' },
        { art: 'kamera', til: [10, 30], ms: 1400 },
        { art: 'stille' },
        { art: 'vent', ms: 500 },
        { art: 'letterbox', pa: false },
    ],
};

export const KAPITTEL1_KLIPP: Record<string, KlippDef> = {
    [SJOSETTINGEN.id]: SJOSETTINGEN,
    [STRANDA.id]: STRANDA,
};
