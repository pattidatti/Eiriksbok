// All tekst i spillet: tapene med tips (fagstoff), seieren og brettkortene.

import type { Årsak } from './state';

export const TAP: Record<Årsak, { tittel: string; tekst: string }> = {
    bølgen: {
        tittel: 'De Gaulle vant valget',
        tekst: '30. mai marsjerte de Gaulles tilhengere i Paris, og i juni vant han valget stort. Folk var lei av uroen. Tips: trykk AVSLUTT mens kjeden er lang - når halen blinker blått, byks bølgen fram.',
    },
    frist: {
        tittel: 'Ingen avtale',
        tekst: 'Streiken forhandlet aldri, så den fikk ingen avtale. Tips: trykk GRENELLE - det var presset fra streiken som fikk regjeringen til å love høyere lønn og 40 timers uke.',
    },
    splittet: {
        tittel: 'Streiken ble splittet',
        tekst: 'Studentene og arbeiderne sto ikke sammen. Tips: streiken ble stor fordi den spredte seg fra universitetene til fabrikkene - hold kjeden hel.',
    },
    forLite: {
        tittel: 'For lite press',
        tekst: 'Du avsluttet før streiken var stor nok. Tips: bygg kjeden lenger før du trykker GRENELLE, og hekt på fabrikker mens bølgen kommer.',
    },
    stille: {
        tittel: 'Streiken spredte seg ikke',
        tekst: 'Streiken nådde ikke fram til nok fabrikker i tide. Tips: styr mot de svarte fabrikkene med piltastene, og sving rundt halen - et krasj koster både tid og millioner.',
    },
};

/** Seieren på brett 3 i tre nivåer (6, 8 og 11 millioner, se TUNING.seier). */
export const SEIER = [
    {
        tittel: 'DELVIS SEIER',
        tekst: 'Regjeringen ga litt, men ikke alt. Med 8 millioner i streik får du hele Grenelle-avtalen. I juni vant de Gaulle valget.',
    },
    {
        tittel: 'GRENELLE-AVTALEN',
        tekst: 'Arbeiderne fikk høyere lønn og 40 timers uke. I juni vant de Gaulle likevel valget. Reformer, ikke revolusjon.',
    },
    {
        tittel: 'LANDET STO STILLE',
        tekst: '11 millioner eller mer i streik, mer enn i 1968. Arbeiderne fikk høyere lønn og 40 timers uke, men i juni vant de Gaulle valget. Reformer, ikke revolusjon.',
    },
];

/** Plakaten mellom brettene (etter brett 1 og 2). */
export const BRETT_VUNNET = ['STREIKEN SPRER SEG', 'HØYERE LØNN ER LOVET'];

export const MÅL_TEKST = [
    'Hekt på fabrikker til streiken er 2,5 millioner.',
    'Trykk GRENELLE, og AVSLUTT med minst 4 millioner før bølgen tar hodet.',
    'Trykk GRENELLE før 30. mai, og AVSLUTT med minst 6 millioner. 8 og 11 gir en større seier.',
];

/** Plakatveggen: hver navngitt fabrikk gir en plakat med et slagord fra mai 68. */
export const SLAGORD: [string, string][] = [
    ['Fantasien til makten', "L'imagination au pouvoir"],
    ['Fabrikker, universiteter, sammen', 'Usines, universités, union'],
    ['Kampen fortsetter', 'La lutte continue'],
    ['Det er forbudt å forby', "Il est interdit d'interdire"],
    ['Vær realistiske, krev det umulige', "Soyez réalistes, demandez l'impossible"],
    ['Folkets makt', 'Pouvoir populaire'],
    ['Ta ønskene for virkelighet', 'Prenez vos désirs pour la réalité'],
    ['Jeg deltar, du deltar ... de tjener på det', 'Je participe, tu participes ... ils profitent'],
];

/** Alle navngitte fabrikker i spillet, i rekkefølge (plakatveggen). */
export const PLAKATER = [
    'Citroën',
    'Renault Billancourt',
    'Nanterre',
    'Renault Flins',
    'Renault Cléon',
    'Sud-Aviation Nantes',
    'Verftene i Saint-Nazaire',
    'Gruvene i nord',
    'Jernbanen',
    'Peugeot Sochaux',
    'Berliet Lyon',
    'Rhodiaceta Lyon',
    'Sud-Aviation Toulouse',
    'Havna i Marseille',
];

export const slagordFor = (navn: string) =>
    SLAGORD[Math.max(0, PLAKATER.indexOf(navn)) % SLAGORD.length];

/** Lærings-øyeblikkene (useArcadeText.beatOnce): fagkjernen første gang den spiller inn. */
export const ØYEBLIKK = {
    krasj: {
        tittel: 'Kjeden røk',
        tekst: 'Studenter og arbeidere som ikke holder sammen, mister folk. Alt bak krasjet faller av - sving rundt halen.',
    },
    grenelle: {
        tittel: 'Regjeringen vil forhandle',
        tekst: 'Streiken er så stor at regjeringen lover høyere lønn. Trykk GRENELLE for avtalen - men da kommer motbølgen.',
    },
    bølgen: {
        tittel: 'Motbølgen',
        tekst: 'De Gaulles tilhengere vil ha ro, og folk går hjem. Trykk AVSLUTT før bølgen når hodet.',
    },
};

/** Banner når et brett starter. */
export const BRETT_BANNER = ['SORBONNE, 13. MAI', 'GRENELLE, 27. MAI', 'HELE FRANKRIKE'];
