// All tekst i Stempelet: mål, regler, lapper, lærings-øyeblikk, tap, seier og «Dette skjedde».
// Tonen er alvorlig: saklig, ingen vitser.

import { PERSONER } from './levels';
import type { Årsak } from './state';

/** Menyen har bare denne ene setningen. Resten viser spillet når det trengs, ett år om gangen. */
export const MÅL = 'Slå stempelet på passet før båndet går tomt, og hold kontoret åpent til 1938.';

/** Merkelappene på bordet (maks 7 ord). */
export const BORDLAPP = {
    kasse: (n: number) => `Kassa: ${n}`,
    husleie: (n: number, sek: number) => `Husleie ${n} · nyttår om ${sek} s`,
    hylle: (n: number, maks: number) => `Uten papirer: ${n} av ${maks}`,
    kart: (n: number) => `Passene har nådd ${n} land`,
    /** Prisen ved lomma: kan personen betale, eller hjelper du gratis? */
    lomme: (pris: number) =>
        pris > 0 ? `Betaler +${pris}` : pris <= -3 ? `Grå sak ${pris}` : `Gratis ${pris}`,
};

/** Det passet ga: personen reiser videre over en grense. */
export const GRENSE = {
    tittel: 'Reist videre med passet',
    under: 'Nansenpasset ble godtatt i over 50 land',
    reist: (person: number) => `${navn(person)} reiser til ${REISEMÅL[person % REISEMÅL.length]}`,
    avvist: 'Avvist ved grensen',
};

/** Hvor personene reiser videre (land som godtok Nansenpasset). */
export const REISEMÅL = [
    'Frankrike',
    'Belgia',
    'Jugoslavia',
    'Libanon',
    'Tsjekkoslovakia',
    'Bulgaria',
    'Sveits',
    'Norge',
    'Hellas',
    'Nederland',
    'Sverige',
    'Danmark',
    'Syria',
];

/** Avisa på bordet: én overskrift per år (rommet forandrer seg med årene). */
export const AVIS: string[] = [
    'Nansenkontoret åpner i Genève',
    'Krisen: millioner uten arbeid',
    'Hitler tar makten i Tyskland',
    'Saar skal stemme om framtida',
    'Saar blir tysk. Mange flykter',
    'Borgerkrig i Spania',
    'Nansenhjelpen starter i Oslo',
    'Tyskland tar Østerrike',
];
/** Telegrammet som kommer sent i 1938. */
export const TELEGRAM = 'Nobels fredspris til Nansenkontoret';

/** Korte lapper festet til tingen (maks 7 ord). */
export const LAPP = {
    første: 'Klikk: stempelet fyller båndet',
    penger: 'Nytt i 1932: gebyr og kassa',
    leie: 'Nytt i 1933: husleie ved nyttår',
    redning: 'I siste liten!',
    tom: 'Kan ikke betale. Gratis koster kassa 2.',
    dilemma: 'Begge går ut nå. Hvem tar du?',
    ghost: 'Røde mynter: det slaget koster',
    frimerke: 'Slå arket: +4 i kassa',
    gyldig: 'Gyldig ennå - ta et kortere bånd',
    tomKasse: 'Kassa har ikke nok',
    grå: 'Grå sak: tre mynter ut av kassa',
    husleie: 'Husleia er betalt',
};

/** Lærings-øyeblikkene: første gang fagkjernen spiller inn. */
export const ØYEBLIKK = {
    utløpt: {
        tittel: 'Papirløs igjen',
        tekst: 'Passet gikk ut. Et Nansenpass var ikke et statsborgerskap, så personen står uten papirer igjen.',
    },
    tom: {
        tittel: 'Tom pengepung',
        tekst: 'Denne personen kan ikke betale gebyret. Du kan hjelpe gratis, men da betaler kontoret to mynter fra kassa.',
    },
    frimerke: {
        tittel: 'Nansen-frimerkene',
        tekst: 'Norge og Frankrike solgte egne Nansen-frimerker, og pengene gikk til kontoret. Slå arket før det glir bort.',
    },
};

/** Den historiske bølgen i 1935. */
export const BØLGE = {
    banner: 'FLYKTNINGER FRA SAAR',
    lærdom:
        'I 1935 ble Saar en del av Tyskland igjen. Folk som flyktet derfra, fikk også Nansenpass.',
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
    mistet: (navnene: string) =>
        `${navnene} mistet papirene mens du satt ved bordet. Uten gyldig pass kunne de bli sendt ut av landet.`,
    ingenMistet:
        'Ingen mistet papirene mens du satt ved bordet. Det klarte ikke det virkelige kontoret: i 1939 trengte rundt 500 000 fortsatt hjelp.',
};

/** Arkivkortene: én setning om hva passet lot personen gjøre (oppdiktede personer). */
export const ARKIV: string[] = [
    'Sergej fikk arbeid som sjåfør i Paris.',
    'Anahit fikk lov til å jobbe som syerske i Marseille.',
    'Olga kunne reise til Beograd og undervise i fiolin.',
    'Aram fikk bo i Beirut og åpne et skomakerverksted.',
    'Nikolaj fikk visum til Praha og studerte til ingeniør.',
    'Siranush fikk reise til Sofia og finne igjen broren sin.',
    'Vera fikk arbeid på et sykehus i Brussel.',
    'Armen fikk lov til å arbeide i en silkefabrikk i Lyon.',
    'Boris fikk arbeid i gruvene i Nord-Frankrike.',
    'Tatjana fikk bo i Oslo og jobbe som sykepleier.',
];

/** «Olga (1934), Aram (1936) og Vera (1937)» */
export function navneliste(liste: { person: number; år: number }[]): string {
    const deler = liste.map((m) => `${navn(m.person)} (${m.år})`);
    if (deler.length <= 1) return deler.join('');
    return `${deler.slice(0, -1).join(', ')} og ${deler[deler.length - 1]}`;
}

export function navn(person: number): string {
    const n = PERSONER[person]?.navn ?? 'NOEN';
    return n.charAt(0) + n.slice(1).toLowerCase();
}

/** «Sak nr. 000 214» */
export function saksnummer(n: number): string {
    const s = String(n).padStart(6, '0');
    return `${s.slice(0, 3)} ${s.slice(3)}`;
}
