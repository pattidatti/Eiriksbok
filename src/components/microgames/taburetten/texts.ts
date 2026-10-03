// Tekstene i Taburetten: regler, lapper, lærings-øyeblikk, tips ved tap, ranger og «Dette skjedde».

import type { Årsak } from './state';

export const MÅL = 'Hendene bærer bare den regjeringen flertallet vil ha.';

/** Tre korte linjer: verbet, anklagen og byttet. */
export const REGLER = [
    'Hold inne ned bølgene, slipp på toppen.',
    'Anklag! (A) virker først når Venstre har over 60 prosent.',
    'Bytt (mellomrom) bare når kandidaten har flertallet.',
];

/** Lappene ved tingen (maks 7 ord). */
export const LAPP = {
    hold: 'Hold inne nedover, slipp på toppen',
    vern: 'Kongens nei: livgarden bærer Selmer på gull',
    rød: 'Over 60 prosent! Trykk A: Anklag!',
    bom: 'Gapene vokser! Trykk A før du synker',
    ikkeAnklag: 'For tidlig! Venstre trenger over 60 prosent',
    tomtBytte: 'Ingen kandidat å bytte med - x1',
    gap: 'Uten vern drar flertallet deg ned',
    valg: 'Venstre fikk over 60 prosent',
    schweigaard: 'Kongen setter inn Schweigaard - uten flertall',
    sverdrup: 'Venstre har flertallet. Bytt på banneret!',
    feil: 'Feil farge! Stolen synker',
    unødvendig: 'Unødvendig bytte - x1',
    fri: 'Snur valget flertallet? Bytt bare da',
};

/** Lærings-øyeblikkene (sakte film). Maks tre per runde. */
export const ØYEBLIKK = {
    anklag: {
        tittel: 'Odelstinget kan anklage',
        tekst: 'Venstre har over 60 prosent. Trykk A for å anklage regjeringen. Venter du, blir bonusen større - men gapene vokser.',
    },
    dom: {
        tittel: 'Kongens vern er borte',
        tekst: 'Riksretten dømte Selmer. Kongen satte inn Schweigaard, men han har ikke flertallet - stolen synker.',
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
    'Kongens vern bar Selmer bare på gullet. Mellom gullfeltene drar Venstre-flertallet stolen ned - få fart og hopp over gapene.';
export const TIPS_STILLE =
    'Stolen lå stille, og livgarden slapp. Hold inne ned bølgene og slipp på toppen. Venstre hadde flertallet - bare kongens vern holdt Selmer oppe.';
export const TIPS_ANKLAG =
    'Odelstinget måtte anklage regjeringen før riksretten kunne dømme den. Trykk A (Anklag!) når stripa er over 60 prosent rød - venter du for lenge, vokser gapene.';
export const TIPS_APRIL =
    'Schweigaard hadde heller ikke flertallet. Aprilministeriet falt etter under to måneder. Bytt til Sverdrup (Venstre) når banneret treffer.';

export const SEIER_TEKST =
    'For første gang har Norge en regjering med flertallet bak seg. 1. juli 1884: Kongen skriver under.';

/** «Dette skjedde»: knyttet til det eleven gjorde. Nøkkel -> tekst. */
export const LÆRDOM = {
    vern: 'Fra 1872 ville Stortinget ha statsrådene inn i salen. Kongen sa nei, og vernet hans holdt Selmer oppe selv om Venstre hadde flertallet.',
    valg: 'Valget i 1882 ga Venstre over 60 prosent av stemmene. Stripa ble enda rødere.',
    anklag: 'Du trykket Anklag!. 23. april 1883 anklaget Odelstinget alle statsrådene for riksrett.',
    dom: 'Riksretten dømte Selmer og sju statsråder i 1884. Da var kongens vern borte.',
    april: 'Etter dommen satte kongen inn Schweigaard. Aprilministeriet hadde heller ikke flertallet og falt etter under to måneder.',
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
