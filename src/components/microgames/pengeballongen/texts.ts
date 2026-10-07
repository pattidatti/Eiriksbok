// All tekst i Pengeballongen. Lapper maks 7 ord, lærings-øyeblikk én setning (maks ~20 ord),
// bannere 2-4 ord.

import type { Årsak } from './state';

export const MÅL = 'Få ballongen fra 1815 til 1884. Bruk så lite penger som mulig.';

export const REGLER = [
    'Hold MELLOMROM eller musa: du betaler, og ballongen stiger.',
    'Budsjettet til valget må holde, ellers stemmer bøndene deg ut.',
    'Gli tett over fjellet: Ueland sparer opptil ×10.',
];

export const SJANSE_LÆRDOM =
    'Valgene kom hvert tredje år. Den som ble stemt ut, kunne prøve igjen ved neste valg.';

export const LAPP = {
    hold: 'Hold MELLOMROM: betal for løft',
    bevilg: 'Lavt under porten: staten bærer deg',
    riksrett: 'Riksrett: ta stemmene, kutt tauene!',
    grense: 'Over streken = bøndene stemmer deg ut',
    ganger: 'Gli tett, men fyr før ryggen',
    banen: 'Jernbanen: lang stigning - fyr tidlig!',
    vinker: 'Bøndene stemmer ennå på embetsmenn',
    ror: 'Pil NED: dykk under fjellet!',
    ola: 'Ola-boka: ta den!',
};

export const BEAT = {
    valg: {
        tittel: 'Valget i 1833',
        tekst: 'Nå teller bøndene pengene du bruker. Er den oransje baren oppe til venstre tom før valget, stemmer de deg ut.',
    },
    ueland: {
        tittel: 'Ueland om bord',
        tekst: 'Ole Gabriel Ueland ville spare. Gli tett over fjellet uten å fyre, så sparer du mye mer.',
    },
    roret: {
        tittel: 'Riksretten 1884',
        tekst: 'Kongens regjering er felt, og Sverdrup tar roret. Nå styrer Stortinget: dykk under fjellene med pil ned.',
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

/** «Dette skjedde»: knyttet til det eleven faktisk gjorde i runden. */
export const SKJEDDE = {
    stemtUt: (år: number, brukt: number) =>
        `Du brukte ${brukt} Spd. før valget i ${år}. Bøndene stemte på bønder som ville spare, og du mistet plassen.`,
    krasj: (år: number) =>
        `I ${år} fikk ikke staten betalt det den måtte: prester, dommere og veier. Fjellene var de faste utgiftene.`,
    porter: (n: number) =>
        `Med roret dykket du under ${n} ${n === 1 ? 'fjell' : 'fjell'} du før måtte betale deg over.`,
    baner: 'Fra 1854 bygde staten jernbaner. Stortinget måtte spare før for å ha råd til de lange stigningene.',
    bevilg: (ja: number, nei: number) =>
        `Du bevilget ${ja} og sa nei til ${nei} av kongens store prosjekter. Stortinget bestemte hva staten fikk penger til.`,
    seier: (spart: number) =>
        `Du kom fram til 1884 og sparte ${spart} Spd. Da måtte kongen la Sverdrup styre: regjeringen måtte ha Stortinget med seg.`,
};

export const LÆRDOM = {
    fjell: 'Fjellene var de faste utgiftene: prester, dommere, festninger og veier. Dem måtte Stortinget betale.',
    valg: 'Fra 1833 stemte bøndene på bønder som ville spare. Den som brukte for mye, mistet plassen.',
    styre: 'Kongen valgte regjeringen og kursen. Stortinget styrte bare pengene - derfor fikk du roret først i 1884.',
    ola: 'Ola-boka fikk bøndene til å stemme på bønder. Fra 1833 hadde bøndene flertall og kuttet utgiftene.',
    ror: 'Etter riksretten i 1884 måtte regjeringen ha flertallet med seg. Da fikk Stortinget roret.',
    ueland: 'Ueland sparte der det gikk, men ga regjeringen penger når den måtte ha dem.',
    hatter: 'Embetsverket vokste: fra 1900 embetsmenn i 1825 til 2300 i 1875. Ballongen ble tyngre.',
    seier: 'I 1884 måtte regjeringen ha flertallet i Stortinget med seg. Det kalles parlamentarisme.',
    bevilg: 'Stortinget bevilget penger: det bestemte hva staten fikk betale for, som telegrafen og jernbanene.',
    riksrett: 'I riksretten 1884 ble statsrådene dømt. Etterpå måtte kongen la Johan Sverdrup danne regjering.',
};
