// Epilogen (blueprint §4 og §8): Nordvik i år 1100.
//
// Kampanjen har fem kapitler, og alle fem har begynt med at eleven har noe å
// gjøre. Dette klippet er det eneste stedet der hun ikke har det. Kameraet
// stiger over den samme gården hun har sett i 793, 872, 995, 1030 - og den er
// kristen, den har rader med kors der ingen hadde det, og hun ser den ovenfra
// for første og eneste gang.
//
// Reglene fra §8 holder:
//
//   - **Ingen fakta bare her.** Klippet forteller ingenting om gravskikk eller
//     om kirkebygging. Det viser to hauger og fire rader med kors, og alt om
//     hva det betyr, står på landemerkene hun kan gå bort og lese.
//   - **Maks 40 sekunder.** Dette ligger på 33.
//   - **Vis handling.** Den eneste replikken er den siste, og den er et
//     spørsmål eleven bærer med seg inn i det som kommer etter.
//
// `stig` er ny for dette klippet. «Kamera stiger over Nordvik» står i §4, og
// uten den er stigningen bare en panorering langs bakken - altså det samme
// grepet som `stranda` i 793 alt bruker. Her skal hun se hele gården, og det
// krever at kameraet trekker seg ut.

import type { KlippDef } from '../../types';

export const EPILOG: KlippDef = {
    id: 'epilog',
    steg: [
        { art: 'letterbox', pa: true },
        { art: 'stille' },
        { art: 'toning', inn: true, ms: 1200 },
        // Vi begynner nede ved haugene: det siste eleven så av Nordvik, var
        // Åsas haug ved naustet i 1030.
        { art: 'kamera', til: [14, 38], ms: 100 },
        { art: 'vent', ms: 700 },
        { art: 'tanke', tekst: 'Nordvik. Trettifire år etter at Orm dro.' },
        { art: 'stig', til: 0.62, ms: 3200 },
        { art: 'vent', ms: 400 },
        // Opp over tunet, og videre til kirken i lia. Det er den samme stien
        // opp som hovet hadde.
        { art: 'kamera', til: [22, 26], ms: 2400 },
        { art: 'tanke', tekst: 'Det står to hauger nede ved naustet. Ingen her vet hvem som ligger i dem.' },
        { art: 'kamera', til: [30, 17], ms: 2600 },
        { art: 'vent', ms: 500 },
        { art: 'tanke', tekst: 'Kirken har fått rader nedenfor seg. Fire av dem, med hodet mot vest.' },
        { art: 'vent', ms: 700 },
        { art: 'musikk', rot: 220, modus: 0 },
        { art: 'tanke', tekst: 'Alt du gjorde, ble til dette. Og ingen av dem kan si hva du het.' },
        { art: 'vent', ms: 900 },
        { art: 'stig', til: null, ms: 1600 },
        { art: 'letterbox', pa: false },
    ],
};

export const EPILOG_KLIPP: Record<string, KlippDef> = {
    [EPILOG.id]: EPILOG,
};
