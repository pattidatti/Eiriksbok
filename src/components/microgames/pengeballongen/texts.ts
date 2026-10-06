// All tekst i Pengeballongen. Lapper maks 7 ord, lærings-øyeblikk én setning (maks ~20 ord),
// bannere 2-4 ord.

import type { Årsak } from './state';

export const MÅL = 'Få ballongen fra 1815 til 1884. Bruk så lite penger som mulig.';

export const REGLER = [
    'Hold MELLOMROM (eller musa): du betaler, og ballongen stiger.',
    'Fjellene må betales. Treffer du et fjell, er det over.',
    'Fra 1833: bruker du over streken før valget, stemmer bøndene deg ut.',
];

export const LAPP = {
    hold: 'Hold MELLOMROM: betal for løft',
    stabel: 'Pengene du bruker hoper seg her',
    grense: 'Over streken = bøndene stemmer deg ut',
    ganger: 'Skrap lavt: Ueland sparer mer',
    bom: 'Kongens bom: du må over',
    vinker: 'Bøndene stemmer ennå på embetsmenn',
};

export const BEAT = {
    valg: {
        tittel: 'Valget i 1833',
        tekst: 'Nå teller bøndene pengene du har brukt. Går stabelen over streken, stemmer de deg ut.',
    },
    ueland: {
        tittel: 'Ueland om bord',
        tekst: 'Ole Gabriel Ueland ville spare. Fly tett over kammen uten å fyre, så sparer du mye mer.',
    },
    roret: {
        tittel: 'Riksretten 1884',
        tekst: 'Nå må regjeringen ha Stortinget med seg. Lav ballong tar den billige dalen under knausen.',
    },
};

/** Tipset på dødskortet: fagstoff, ikke bare «prøv igjen». */
export const TIPS: Record<Årsak, string> = {
    fjell: 'Staten fikk ikke betalt prestene. Selv Ueland ga regjeringen penger når den virkelig trengte dem - fyr før ryggen, ikke på den.',
    valg: 'Bøndene stemte på bønder som ville spare. Stortinget bestemte skatten, og velgerne bestemte Stortinget. Skrap over de lave åsene og spar til de høye.',
};

export const TAP_TITTEL: Record<Årsak, string> = {
    fjell: 'Rett i fjellet',
    valg: 'Stemt ut',
};

export const LÆRDOM = {
    fjell: 'Fjellene var de faste utgiftene: prester, dommere, festninger og veier. Dem måtte Stortinget betale.',
    valg: 'Fra 1833 stemte bøndene på bønder som ville spare. Den som brukte for mye, mistet plassen.',
    styre: 'Kongen valgte regjeringen og kursen. Stortinget styrte bare pengene - derfor kunne du aldri svinge.',
    ueland: 'Ueland sparte der det gikk, men ga regjeringen penger når den måtte ha dem.',
    hatter: 'Embetsverket vokste: fra 1900 embetsmenn i 1825 til 2300 i 1875. Ballongen ble tyngre.',
    seier: 'I 1884 måtte regjeringen ha flertallet i Stortinget med seg. Det kalles parlamentarisme.',
};
