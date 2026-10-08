// Tekstene i Rederens kart: mål, regler, lapper, lærings-øyeblikk, tips og «Dette skjedde».
// Tonen er alvorlig og saklig. Lapper maks 7 ord, lærings-øyeblikk én setning (maks ~20 ord).

import type { Årsak } from './game';

/** Menyen: én linje. Reglene vises i spillet der de trengs (fargen på hvalen, tønna, oljeprisen). */
export const MÅL = 'Dra båtene ut til hvalene - og hold havet i live til 1968.';

/** Lappene ved tingen (maks 7 ord). */
export const LAPP = {
    start: 'Dra båten ut til hvalene',
    tilSalgs: 'Til salgs: dra ut for å kjøpe',
    forDyr: 'For lite olje i tønna',
    død: 'Flokken er borte for godt',
    kokeri: 'Kokeriet: en flytende havn',
    taster: 'Piltaster sikter, mellomrom sender',
    rød: 'Rød hval: flokken krymper',
    marked: 'For mange fat senker oljeprisen',
    finnmark: 'Fangst forbudt i Finnmark',
    blåhval: 'Blåhvalen er fredet',
    nyFlokk: 'Ny flokk ved Sørøya',
    år1904: '1904: Hvalfangerne flytter til Sør-Georgia',
    år1925: '1925: Kokeriskip tar hval i Sørishavet',
    år1931: '1931: For mye olje - verden kjøper mindre',
    år1946: '1946: Kvote - høyst 12 hval i året',
    kvote: 'Årets kvote er tatt: båtene venter',
    kvoteForHøy: 'Kvoten var for høy: hvalene ble færre',
};

/** Lærings-øyeblikkene (fagkjernen). Maks tre per runde. */
export const ØYEBLIKK = {
    nyttår: {
        tittel: 'Nyttår: båtene koster olje',
        tekst: 'Hvert nyttår betaler du for stasjonen og båtene. En båt på havet koster mye, i havna lite.',
    },
    pris: {
        tittel: 'For mye olje på en gang',
        tekst: 'Verden kjøper bare så mye olje i året. Kom det mer, falt prisen - også på oljen i tønna. Hent noen båter hjem.',
    },
    fredning: {
        tittel: '1966: blåhvalen fredet',
        tekst: 'Blåhvalen var nesten borte i hele Sørishavet. Nå var det forbudt å fange den. Fang finnhval og seihval.',
    },
};

/** Slutt-kortet ved seier: én setning. */
export const SEIER_SETNING = '1968: Du holdt havet i live.';

export const TAP_TITTEL: Record<Årsak, string> = {
    tomt: 'Havet er tomt',
    konkurs: 'Konkurs',
};

export const TIPS: Record<Årsak, string> = {
    tomt: 'En blåhvalhunn får bare én unge hvert andre eller tredje år. Tar du flere hval enn det blir født, krymper flokken - og en liten flokk får færre unger. Flytt båten når hvalen blir rød.',
    konkurs:
        'Fangsten må betale for båtene og stasjonen. Send båtene til grønne hvaler, og hent båter uten flokk hjem til havna. Kjøp en ny båt bare når en stor flokk står ledig.',
};

/** Tipset når prisfallet felte selskapet. */
export const TIPS_PRIS =
    'Verden kjøper bare så mye olje i året, og etter 1931 enda mindre. Står det «Prisen faller snart!» ved tønna, hent noen båter hjem.';

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
    krakk: 'I 1931 kom det så mye hvalolje at prisen falt. Neste sesong ble de fleste norske kokeriene liggende hjemme.',
    fredning: 'I 1966 ble blåhvalen fredet. Da var det nesten ingen igjen i Sørishavet.',
    kvote: 'Fra 1946 fikk hvalfangerne en kvote: så mange hval i året, ikke flere. Kvoten var satt for høyt, så hvalene ble færre likevel.',
    arter: 'Fangstfolkene tok blåhvalen først, fordi den ga mest olje. Da den nesten var borte, tok de finnhval og til slutt den mindre seihvalen.',
};
