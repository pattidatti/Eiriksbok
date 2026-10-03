// Tekstene i Taburetten: regler, lapper, lærings-øyeblikk, tips ved tap, ranger og «Dette skjedde».

import type { Årsak } from './state';

export const MÅL = 'Du er statsrådsstolen. Hendene bærer bare den flertallet vil ha.';

export const REGLER = [
    'Hold inne for å dykke ned bølgene. Slipp, så kaster hendene deg opp.',
    'Stripa er Stortinget. Fargen med flertall bærer deg. Før 1884 bærer kongens livgarde en blå regjering - men bare på de gule øyene.',
    'Trykk Bytt når banneret treffer stolen - bare hvis kandidaten har flertallsfargen.',
];

/** Lappene ved tingen (maks 7 ord). */
export const LAPP = {
    hold: 'Hold inne nedover, slipp på toppen',
    vern: 'Livgarden bærer Selmer bare på gule øyer',
    gap: 'Uten vern drar flertallet deg ned',
    valg: 'Venstre fikk over 60 prosent',
    schweigaard: 'Blå kandidat - men stripa er rød',
    sverdrup: 'Venstre har flertallet. Bytt på banneret!',
    feil: 'Feil farge! Stolen synker',
    unødvendig: 'Unødvendig bytte - x1',
    fri: 'Snur valget flertallet? Bytt bare da',
};

/** Lærings-øyeblikkene (sakte film). Maks tre per runde. */
export const ØYEBLIKK = {
    dom: {
        tittel: 'Kongens vern er borte',
        tekst: 'Riksretten dømte Selmer. Nå bærer hendene bare en regjering som har flertall i stripa.',
    },
    sverdrup: {
        tittel: 'Flertallets mann',
        tekst: 'Sverdrup er Venstre, og Venstre har flertallet. Trykk Bytt idet banneret treffer stolen.',
    },
};

export const TIPS: Record<Årsak, string> = {
    gata: 'Regjeringen hadde ikke flertallet bak seg. Etter 1884 kan bare den flertallet vil ha, bli sittende. Bytt når banneret gir flertallets mann.',
    hindring:
        'En regjering uten flertall flyr lavt og må dukke for alt. Med flertallet under deg kommer du over. Slipp på toppen av bølgen for å hoppe.',
};
export const TIPS_VERN =
    'Kongens vern bar Selmer bare på de gule øyene. Mellom dem drar flertallet stolen ned - hopp godt over gapene.';
export const TIPS_APRIL =
    'Schweigaard hadde heller ikke flertallet. Aprilministeriet falt etter under to måneder. La blå kandidater gå forbi når stripa er rød.';

export const SEIER_TEKST =
    'For første gang har Norge en regjering med flertallet bak seg. 1. juli 1884: Kongen skriver under.';

/** «Dette skjedde»: knyttet til det eleven gjorde. Nøkkel -> tekst. */
export const LÆRDOM = {
    vern: 'Venstre hadde flertallet lenge før 1884. Det var kongens vern som holdt Selmer oppe.',
    valg: 'Valget i 1882 ga Venstre over 60 prosent av stemmene. Stripa ble enda rødere.',
    dom: 'Riksretten dømte Selmer og sju statsråder i 1884. Da var kongens vern borte.',
    aprilTatt:
        'Du satte Schweigaard i stolen og sank. Aprilministeriet hadde heller ikke flertallet og falt etter under to måneder.',
    aprilForbi:
        'Du lot Schweigaard gå forbi. Kongens siste forsøk, Aprilministeriet, falt etter under to måneder.',
    sverdrup:
        'Sverdrup fikk danne regjering fordi han hadde flertallet bak seg. Det kalles parlamentarisme.',
    gata: 'Stolen sank uten flertall. Etter 1884 kan bare en regjering flertallet vil ha, bli sittende.',
    snur: 'Når flertallet snur etter et valg, må regjeringen gå. Sverdrup selv gikk av i 1889.',
};

export const RANGER: [number, string][] = [
    [0, 'Stolpusser'],
    [2000, 'Embetsmann'],
    [4000, 'Opposisjonsmann'],
    [6000, 'Odelstingsmann'],
    [8000, 'Riksrettsdommer'],
    [11000, 'Statsminister'],
    [25000, 'Folkets taburett'],
];
export const SEIERS_RANG = 'Parlamentariker';

export const PAUSE = 'Stortinget tar en pause. Hendene venter.';

/** Samlekortene: de ekte statsrådene eleven har båret, med én faktalinje hver. */
export const SAMLEKORT: { navn: string; fakta: string }[] = [
    { navn: 'Selmer', fakta: 'Statsminister til riksretten dømte ham i 1884.' },
    { navn: 'Schweigaard', fakta: 'Aprilministeriet: under to måneder i 1884.' },
    { navn: 'Sverdrup', fakta: 'Første regjering med flertallet bak seg, 1884.' },
];
