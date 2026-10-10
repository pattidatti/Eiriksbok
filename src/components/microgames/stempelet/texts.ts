// All tekst i Stempelet: mål, regler, lapper, lærings-øyeblikk, tap, seier og «Dette skjedde».
// Tonen er alvorlig: saklig, ingen vitser.

import { PERSONER } from './levels';
import type { Årsak } from './state';

export const MÅL = 'Forny Nansenpassene før de går ut, og hold kontoret åpent til nyttår 1938.';

/** De tre reglene på lappen ved bordkanten. */
export const REGLER = [
    'Båndet krymper. Er det tomt, er personen papirløs igjen.',
    'Hold inne og slipp i det lyse feltet: fullt slag fyller hele båndet.',
    'Mynt gir 1 til kassa. Tom lomme koster 2. Husleia betales hvert nyttår.',
];

export const TASTER = 'Mus: før stempelet, hold inne, slipp · Tab: neste pass · Mellomrom: slå';

/** Korte lapper festet til tingen (maks 7 ord). */
export const LAPP = {
    første: 'Hold inne, slipp i det lyse feltet',
    slippNå: 'Slipp nå!',
    tom: 'Tom lomme: koster 2 fra kassa',
    frimerke: 'Slå arket: +4 i kassa',
    gyldig: 'Gyldig ennå - ta et kortere bånd',
    tomKasse: 'Kassa har ikke nok',
    grå: 'Grå sak: koster 3 å fornye',
    husleie: 'Husleia er betalt',
};

/** Lærings-øyeblikkene: første gang fagkjernen spiller inn. */
export const ØYEBLIKK = {
    utløpt: {
        tittel: 'Papirløs igjen',
        tekst: 'Passet gikk ut. Et Nansenpass var ikke et statsborgerskap, så personen står uten papirer igjen.',
    },
    tom: {
        tittel: 'Tom lomme',
        tekst: 'Denne personen kan ikke betale gebyret. Kontoret fornyer likevel, men det koster to mynter fra kassa.',
    },
    frimerke: {
        tittel: 'Nansen-frimerkene',
        tekst: 'Norge og Frankrike solgte egne Nansen-frimerker, og pengene gikk til kontoret. Slå arket før det glir bort.',
    },
};

export const TAP: Record<Årsak, { tittel: string; tekst: string }> = {
    papirløse: {
        tittel: 'For mange uten papirer',
        tekst: 'Seks mennesker står uten papirer. Et Nansenpass var ikke et statsborgerskap. Det måtte fornyes før det gikk ut, ellers var personen papirløs igjen. Slå passet med kortest bånd først.',
    },
    stengt: {
        tittel: 'Kontoret må stenge',
        tekst: 'Kassa var tom da husleia skulle betales. Nansenkontoret levde av gebyrene på passet og av salg av Nansen-frimerker. Stemple passene med mynt først når kassa er lav, og slå frimerkearket når det ligger på bordet.',
    },
};

export const SEIER = {
    tittel: 'Nansenkontoret får Nobels fredspris for 1938.',
    tekst: 'Det virkelige kontoret behandlet rundt 800 000 saker. Da det ble lagt ned i 1939, trengte rundt 500 000 flyktninger fortsatt hjelp.',
};

export const LÆRDOM = {
    papirløs:
        'Et Nansenpass var ikke et statsborgerskap. Det gikk ut og måtte fornyes, ellers var personen papirløs igjen.',
    gebyr: 'Kontoret levde av gebyret på passet. De som ikke kunne betale, fikk hjelp likevel, men det kostet kassa.',
    frimerke: 'Norge og Frankrike solgte Nansen-frimerker for å holde kontoret i gang.',
    reist: (person: number) =>
        `${navn(person)} reiste videre med gyldig pass. Passet ga lov til å reise og arbeide.`,
};

export function navn(person: number): string {
    const n = PERSONER[person] ?? 'NOEN';
    return n.charAt(0) + n.slice(1).toLowerCase();
}

/** «Sak nr. 000 214» */
export function saksnummer(n: number): string {
    const s = String(n).padStart(6, '0');
    return `${s.slice(0, 3)} ${s.slice(3)}`;
}
