// Tekstene i Rederens kart: mål, regler, tips og «Dette skjedde». Tonen er alvorlig og saklig.

import type { Årsak } from './game';

export const MÅL =
    'Du er rederen. Send hvalbåtene ut og hold selskapet i live til 1968 - uten å tømme havet.';

export const REGLER = [
    'Dra en båt ut til en flokk med blå prikker. Båten tar hval, og fatene ruller hjem til tønna.',
    'Ringen rundt flokken er grønn når den vokser og rød når båtene tar mer enn det blir født.',
    'Hver båt koster olje hvert år, også når den ligger i havna. Tom tønne betyr konkurs.',
];

export const TAP_TITTEL: Record<Årsak, string> = {
    tomt: 'Havet er tomt',
    konkurs: 'Konkurs',
};

export const TIPS: Record<Årsak, string> = {
    tomt: 'En blåhvalhunn får bare én unge hvert andre eller tredje år. Tar du flere hval enn det blir født, krymper flokken - og en liten flokk får færre unger. Flytt båtene bort når ringen blir rød.',
    konkurs:
        'Hver båt koster olje hvert år, enten den fanger eller ligger i havna. Spre båtene på mange flokker, så tar hver av dem lite.',
};

export const SKJEDDE = {
    tomt: (år: number) =>
        `${år}: Havet ble tomt. I Finnmark ble det tatt rundt 3500 blåhval før fangsten ble forbudt i 1904.`,
    konkurs: (år: number) =>
        `${år}: Selskapet gikk konkurs. Båtene kostet penger hvert år, enten de fanget eller ikke.`,
    seier: 'Norge sluttet i Antarktis i 1968 fordi hvalen var nesten borte. Du holdt havet i live.',
};

export const LÆRDOM = {
    fødsler:
        'En blåhvalhunn får bare én unge hvert andre eller tredje år. Derfor tåler en flokk bare at det blir tatt litt om gangen.',
    teknikk:
        'Ny teknikk som dampbåter, granatharpun og kokerier gjorde at fangstfolkene kunne tømme havet fortere.',
    rekord:
        'Sesongen 1930-1931 ble den største noensinne: over 40 000 hval på én sesong.',
};

export const NYTT_BÅT = 'Ny båt i havna. Den koster olje hvert år.';
export const HINT_RØD = 'Rød ring: flokken krymper. Flytt båten.';
