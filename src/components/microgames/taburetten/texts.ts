// Tekstene i Taburetten: regler, lapper, lærings-øyeblikk, tips ved tap, ranger og «Dette skjedde».

import type { Game, Årsak } from './state';

export const MÅL = 'Hendene bærer bare den regjeringen flertallet vil ha.';

/** Tre korte linjer: verbet, anklagen og byttet. */
export const REGLER = [
    'Hold inne ned bølgene, slipp like før toppen - høyt over Stortinget gir mest.',
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
    tomtBytte: 'Ingen kandidat ennå - vent på banneret',
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
        tekst: 'Venstre har over 60 prosent. Trykk A for å anklage regjeringen. Venter du, vokser gapene mellom kongens gullfelt.',
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
    velt: 'Du slapp høyt, men landet på oppsiden av bølgen, og stolen veltet. Hold inne i lufta for å dykke ned på nedsiden. Flertallet bærer deg - du trenger ikke fly høyest hver gang.',
    hindring:
        'En regjering uten flertall flyr lavt og må dukke for alt. Med flertallet under deg kommer du over. Slipp på toppen av bølgen for å hoppe.',
};
export const TIPS_VERN =
    'Kongens vern bar Selmer bare på gullet. Mellom gullfeltene drar Venstre-flertallet stolen ned - få fart og hopp over gapene.';
export const TIPS_HØYT =
    'Du fløy høyt og traff noe. Et høyt slipp gir mye, men over bølgene henger telegraftrådene. Flertallet bærer deg - du trenger ikke fly høyest hele tiden.';
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

/** Tipset på slutt-skjermen: hva som felte eleven, og hvorfor (faglig). */
export function velgTips(g: Game, vunnet: boolean): string {
    if (g.fri) return TIPS[g.årsak ?? 'gata'];
    if (vunnet || !g.årsak) return SEIER_TEKST;
    if (g.stol.navn === 'Schweigaard') return TIPS_APRIL;
    if (g.vern && !g.anklaget && g.rødt >= 69) return TIPS_ANKLAG;
    if (g.årsak === 'hindring' && g.toppY > 5) return TIPS_HØYT;
    if (g.årsak === 'gata' && g.vern) return TIPS_VERN;
    if (g.årsak === 'hindring' && !g.vern && g.stol.farge === 'blå') return TIPS.gata;
    return TIPS[g.årsak];
}

/** Overskriften på tap-skjermen: hver måte å tape på får sin egen setning. */
export function hvorforTap(g: Game): string {
    const navn = g.stol.navn;
    if (g.årsak === 'hindring') return `Smell! ${navn} traff en hindring i gata`;
    if (g.årsak === 'velt') return `${navn} landet skjevt, og stolen veltet`;
    if (g.fri) return `${navn} hadde ikke flertallet - stolen landet i gata`;
    if (navn === 'Schweigaard') return 'Aprilministeriet falt - Schweigaard hadde ikke flertallet';
    if (g.vern) return 'Selmer falt ned mellom gullfeltene - kongens vern rakk ikke fram';
    return `${navn} var uten flertall - stolen landet i gata`;
}
