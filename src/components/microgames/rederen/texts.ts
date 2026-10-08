// Tekstene i Rederens kart: mål, regler, lapper, lærings-øyeblikk, tips og «Dette skjedde».
// Tonen er alvorlig og saklig. Lapper maks 7 ord, lærings-øyeblikk én setning (maks ~20 ord).

import type { Årsak } from './game';

export const MÅL =
    'Du er rederen. Hold selskapet i live forbi 1968 - uten å tømme havet.';

export const REGLER = [
    'Dra en båt ut til en flokk. Båten tar hval, og fatene ruller hjem til tønna.',
    'Grønn ring: flokken vokser. Rød ring: båtene tar flere hval enn det blir født.',
    'Hvert nyttår koster båtene olje. Ute koster de mye, i havna lite.',
];

/** Lappene ved tingen (maks 7 ord). */
export const LAPP = {
    start: 'Dra båten ut til hvalene',
    tilSalgs: 'Til salgs: dra ut for å kjøpe',
    forDyr: 'For lite olje i tønna',
    død: 'Flokken er borte for godt',
    tom: 'Tønna er snart tom',
    kokeri: 'Kokeriet: en flytende havn',
    taster: 'Piltaster sikter, mellomrom sender',
};

/** Lærings-øyeblikkene (fagkjernen). Maks tre per runde. */
export const ØYEBLIKK = {
    rød: {
        tittel: 'Rød ring: flokken krymper',
        tekst: 'En blåhvalhunn får bare én unge hvert andre eller tredje år. Dra båten bort, så flokken får hvile.',
    },
    nyttår: {
        tittel: 'Nyttår: båtene koster olje',
        tekst: 'Hvert nyttår betaler du for stasjonen og båtene. En båt på havet koster mye, i havna lite.',
    },
    kokeri: {
        tittel: 'Kokeriet',
        tekst: 'Kokeriet kokte hvalen til olje ute på havet. Da kunne fangstfolkene jakte lenger ut, og tømme havet fortere.',
    },
};

export const TAP_TITTEL: Record<Årsak, string> = {
    tomt: 'Havet er tomt',
    konkurs: 'Konkurs',
};

export const TIPS: Record<Årsak, string> = {
    tomt: 'En blåhvalhunn får bare én unge hvert andre eller tredje år. Tar du flere hval enn det blir født, krymper flokken - og en liten flokk får færre unger. Flytt båten når ringen blir rød.',
    konkurs:
        'Fangsten må betale for båtene og stasjonen. Send båtene til flokker med grønn ring, og hent båter uten flokk hjem til havna. Kjøp en ny båt bare når en stor flokk står ledig.',
};

export const SKJEDDE = {
    tomt: (år: number) =>
        `${år}: Havet ble tomt. Slik gikk det med blåhvalen: den ble jaktet nesten helt bort.`,
    konkurs: (år: number) =>
        `${år}: Selskapet gikk konkurs. Båtene kostet penger hvert år, enten de fanget eller ikke.`,
    seier: 'Norge sluttet å fange hval i Antarktis i 1968 fordi hvalen var nesten borte. Du holdt havet i live.',
    drift: (år: number, hval: number) => `Du drev selskapet i ${år} år og tok ${hval} hval.`,
    død: (navn: string, år: number) =>
        `Flokken ${navn} ble borte i ${år}. En liten flokk får for få unger til å vokse igjen.`,
    reddet: 'Du lot en nesten tom flokk være i fred, og den vokste igjen.',
};

export const LÆRDOM = {
    fødsler:
        'En blåhvalhunn får bare én unge hvert andre eller tredje år. Derfor tåler en flokk bare at det blir tatt litt om gangen.',
    finnmark: 'I 1904 ble hvalfangst forbudt i Nord-Norge. Fiskerne mente den ødela fisket.',
    teknikk:
        'Ny teknikk som dampbåter, granatharpun og kokerier gjorde at fangstfolkene kunne tømme havet fortere.',
    rekord: 'Sesongen 1930-1931 ble den største noensinne. Det kom mer olje enn verden ville kjøpe.',
};
