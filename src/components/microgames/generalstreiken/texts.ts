// All tekst i spillet: tapene med tips (fagstoff), seieren og brettkortene.

import type { Årsak } from './state';

export const TAP: Record<Årsak, { tittel: string; tekst: string }> = {
    bølgen: {
        tittel: 'De Gaulle vant valget',
        tekst: '30. mai marsjerte de Gaulles tilhengere i Paris, og i juni vant han valget stort. Folk var lei av uroen. Tips: ta avtalen mens streiken er stor - se hvor nær bølgen er.',
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
        tekst: 'Ingen fabrikker ble med. Tips: styr mot de svarte fabrikkene med piltastene - hver fabrikk du når, blir med i streiken.',
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
export const BRETT_VUNNET = ['STREIKEN SPRER SEG', 'AVTALEN ER I HUS'];

export const MÅL_TEKST = [
    'Hekt på fabrikker til streiken er 2,5 millioner.',
    'Trykk GRENELLE, og AVSLUTT med minst 2,5 millioner før bølgen tar hodet.',
    'Trykk GRENELLE før 30. mai, og AVSLUTT med minst 6 millioner. 8 og 11 gir en større seier.',
];
