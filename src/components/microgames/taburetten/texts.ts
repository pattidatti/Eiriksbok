// Tekstene i Taburetten: regler, tips ved tap, ranger og «Dette skjedde».

import type { Årsak } from './state';

export const MÅL =
    'Du er statsrådsstolen. Hendene til Stortinget bærer deg - men bare den flertallet vil ha.';

export const REGLER = [
    {
        ikon: 'stripe',
        tekst: 'Stripa er Stortinget. Har fargen i stolen flertall, bærer hendene deg høyt. Ellers synker du.',
    },
    {
        ikon: 'krone',
        tekst: 'Kongens vern: før dommen i 1884 bærer livgarden en blå regjering. Dommen tar vernet.',
    },
    {
        ikon: 'bytt',
        tekst: 'Bytt (mellomrom) når banneret snur flertallet. Akkurat på banneret = perfekt bytte.',
    },
];

export const KONTROLL =
    'Hold inne (mus, finger eller pil ned) for å lene deg ned bølgene. Slipp på vei opp.';

export const TIPS: Record<Årsak, string> = {
    gata: 'Regjeringen hadde ikke flertallet bak seg. Etter 1884 kan bare den flertallet vil ha, bli sittende. Bytt når banneret snur stripa.',
    hindring:
        'En regjering uten flertall flyr lavt og må dukke for alt. Med flertallet under deg kommer du over.',
    tom: 'Står stolen tom, er det regjeringskrise. Kongen måtte til slutt hente regjeringen fra flertallet.',
};

export const TIPS_APRIL =
    'Schweigaard hadde heller ikke flertallet. Aprilministeriet falt etter under to måneder.';

export const SEIER_TEKST =
    'For første gang har Norge en regjering med flertallet bak seg. 1. juli 1884: Kongen skriver under.';

export const LÆRDOM = [
    'Venstre hadde flertallet på Stortinget lenge før 1884. Det var kongen som holdt Selmer oppe.',
    'Riksretten dømte Selmer og sju statsråder i 1884. Da var kongens vern borte.',
    'Fra 1884 må regjeringen ha flertallet på Stortinget bak seg. Det kalles parlamentarisme.',
];

export const RANGER: [number, string][] = [
    [0, 'Stolpusser'],
    [1500, 'Embetsmann'],
    [3000, 'Opposisjonsmann'],
    [5000, 'Odelstingsmann'],
    [7000, 'Riksrettsdommer'],
    [9000, 'Statsminister'],
    [20000, 'Folkets taburett'],
];

export const PAUSE = 'Stortinget tar en pause. Hendene venter.';
