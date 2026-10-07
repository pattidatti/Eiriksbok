// Tekstene i Gamma: mål, regler, tips og «Dette skjedde». Tonen er alvorlig og saklig.

import type { Årsak } from './game';

export const MÅL = 'Hold familien varm til hjelpen kommer i februar 1945 - uten at tyskerne finner dere.';

export const REGLER = [
    'Gå med piltastene eller A/D. Hent ved nede i bjørkeskogen.',
    'Hold mellomrom inne i gamma for å fyre. Da blir det varmt, men det stiger røyk.',
    'Ser lyset fra båten røyken eller deg, blir dere funnet.',
];

export const TAP_TITTEL: Record<Årsak, string> = {
    funnet: 'Funnet',
    frosset: 'Bålet gikk ut',
};

export const TIPS: Record<Årsak, string> = {
    funnet:
        'Tyskerne lette langs kysten etter folk som hadde gjemt seg, og sendte dem sørover med tvang. Slipp fyringen når du hører båten - røyken henger igjen en stund.',
    frosset:
        'Vinteren i Finnmark er mørk og kald, og de som gjemte seg, hadde bare det de kunne bære. Hent ved mens båten er langt unna, og fyr jevnt.',
};

export const SKJEDDE = {
    funnet: (dato: string) =>
        `${dato}: Lyset fant dere. Rundt 50 000 mennesker ble tvangsevakuert sørover høsten og vinteren 1944-45.`,
    frosset: (dato: string) =>
        `${dato}: Kulda vant. Rundt 23 000 mennesker gjemte seg i huler og gammer i stedet for å la seg flytte.`,
    seier:
        'Februar 1945: 500 mennesker ble hentet over havet til Skottland. Andre holdt ut i fjellet til krigen sluttet i mai.',
};

export const LÆRDOM = {
    brentJord:
        'Brent jord: hæren brente hus, fjøs, skoler og båter så ingen skulle ha tak over hodet eller mat.',
    gjemte:
        'De som gjemte seg, måtte velge mellom varme og å bli sett. Røyk fra et bål kunne avsløre et helt skjulested.',
};
