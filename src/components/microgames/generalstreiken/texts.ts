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

export const SEIER = {
    tittel: 'LANDET STO STILLE',
    tekst: 'Arbeiderne fikk høyere lønn og 40 timers uke. I juni vant de Gaulle likevel valget. Reformer, ikke revolusjon.',
};

/** Plakaten mellom brettene (etter brett 1 og 2). */
export const BRETT_VUNNET = ['STREIKEN SPRER SEG', 'AVTALEN ER I HUS'];

export const MÅL_TEKST = [
    'Hekt på fabrikker til streiken er 1 million.',
    'Trykk GRENELLE, og AVSLUTT med minst 3 millioner før bølgen tar hodet.',
    'Trykk GRENELLE før 30. mai, og AVSLUTT med minst 8 millioner.',
];
