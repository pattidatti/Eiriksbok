// Kapitlene i vikingtiden. Samme gård, fem ganger, over 273 år.
//
// Ett kapittel er ikke et kart - det er hvem eleven er, hvilket år det er, og
// hva hun skal få gjort før året er omme. Kartene ligger i `steder.ts`, og et
// kapittel kan bruke flere av dem: kapittel 1 spilles i Nordvik og på
// Lindisfarne.
//
// Bare kapittel 1 er bygget. De fire andre står her med rolle og år fordi
// listen skal si sant om hva spillet skal bli - men uten steg, for et steg
// ingen har bygget er et løfte vi ikke kan holde.
//
// Se docs/Design documents/minnevokteren-nordvik-blueprint.md §2 og §4.

import type { KapittelDef } from '../types';

/** Steg-id-ene i kapittel 1. Samlet her så ingen skriver dem feil. */
export const K1 = {
    ravn: 'k1-ravn',
    skroget: 'k1-skroget',
    sjosettingen: 'k1-sjosettingen',
    navigasjonen: 'k1-navigasjonen',
    stranda: 'k1-stranda',
    motstanden: 'k1-motstanden',
    byttet: 'k1-byttet',
    hjem: 'k1-hjem',
} as const;

/**
 * Steg-id-ene i kapittel 2.
 *
 * Bare de som er bygget står her. Et steg ingen har bygget, er et løfte vi
 * ikke kan holde - og i oppdragsloggen leser det som noe eleven har gått glipp
 * av.
 */
export const K2 = {
    noklene: 'k2-noklene',
} as const;

/** Flagg kapittel 1 setter, og som mellomspillet og kapittel 5 leser. */
export const K1_FLAGG = {
    /** Brente hun skriptoriet? Da står det tomt der kilden skulle vært. */
    brenteSkriptoriet: 'k1-brente-skriptoriet',
    /** Tok hun bøkene med hjem? Verdiløse for henne, uerstattelige for dem. */
    tokBokene: 'k1-tok-bokene',
    /** Tok hun relikvieskrinet? Det ligger i graven hennes i kapittel 5. */
    tokSkrinet: 'k1-tok-skrinet',
    /** Tok hun guttene? Mest verdt av alt, og det spillet aldri kommenterer. */
    tokGuttene: 'k1-tok-guttene',
    /** Bygget hun skroget riktig første gang? Orm husker det. */
    skrogetHeltFint: 'k1-skroget-helt-fint',
} as const;

export const KAPITLER: KapittelDef[] = [
    {
        id: 'k1',
        nr: 1,
        aar: 793,
        tittel: 'Skroget og stranda',
        rolle: { navn: 'Torstein Ormsson', alder: 17, stand: 'karl', kjonn: 'mann' },
        aettId: 'nordvik',
        opptakt: {
            tittel: 'Nordvik, våren 793',
            tekst:
                'Du er sytten vintrer. Faren din bygger et skip nede i naustet, og han er sur på deg. ' +
                'Ravn ler av måten du holder skjoldet på. Ingen her har hørt om et kloster, og ingen ' +
                'vet ennå at det finnes noe å hente vestover.',
        },
        steg: [
            {
                id: K1.ravn,
                tittel: 'Ravn ler av deg',
                mal: 'Snakk med Ravn ved tunet. Han skal lære deg skjoldet.',
                krever: [],
            },
            {
                id: K1.skroget,
                tittel: 'Bordene i skroget',
                mal: 'Hjelp Orm i naustet. Legg bordene, og legg dem riktig.',
                krever: [],
            },
            {
                id: K1.sjosettingen,
                tittel: 'Skipet på vannet',
                mal: 'Skipet skal på sjøen. Orm sier ingenting.',
                krever: [K1.skroget],
            },
            {
                id: K1.navigasjonen,
                tittel: 'Vestover',
                mal: 'Gå om bord i knarren ved brygga, og hold breddegraden vestover.',
                krever: [K1.sjosettingen, K1.ravn],
            },
            {
                id: K1.stranda,
                tittel: 'Kjølen skraper sand',
                mal: 'Klosteret ligger der. Det har ingen mur.',
                krever: [K1.navigasjonen],
            },
            {
                id: K1.motstanden,
                tittel: 'Øyas menn',
                mal: 'De slåss for alvor. Det gjør du også.',
                krever: [K1.stranda],
            },
            {
                id: K1.byttet,
                tittel: 'Det som er igjen',
                mal: 'Ta det du vil ha. Eller la være.',
                krever: [K1.motstanden],
            },
            {
                id: K1.hjem,
                tittel: 'Hjem til Nordvik',
                mal: 'Seil hjem. Faren din spør hva du tok med.',
                krever: [K1.byttet],
            },
        ],
        mellomspillEtter: 'mellomspill-1',
    },
    {
        id: 'k2',
        nr: 2,
        aar: 872,
        tittel: 'Nøklene',
        rolle: { navn: 'Åsa Torsteinsdotter', alder: 34, stand: 'hauld', kjonn: 'kvinne' },
        aettId: 'nordvik',
        opptakt: {
            tittel: 'Nordvik, 872',
            tekst:
                'Det er 79 år siden Torstein la bordene i skroget selv. Nå ligger han i haugen sør for tunet, og du er datteren hans.\n\n' +
                'I vår dro hver mann som kunne bære skjold sørover, til Hafrsfjord, der Harald Hårfagre slåss for å legge hele landet under seg. De tok skipet med. Igjen står en gammel mann, to kvinner og en trell.\n\n' +
                'Nøklene til bua henger i beltet ditt. Det er ikke pynt. Det er hvem som avgjør hvem som spiser i vinter.',
        },
        steg: [
            {
                id: K2.noklene,
                tittel: 'Nøklene i beltet',
                mal: 'Snakk med Torgeir på tunet. Han vet hva som er igjen.',
                krever: [],
            },
        ],
        // 872 er kapittelet der de sosiale systemene *er* spillet: forrådet
        // styres gjennom året, og æren kan gjøre at forsvarskampen ikke skjer.
        systemer: { aere: true, aarshjul: true },
        mellomspillEtter: 'mellomspill-2',
    },
    {
        id: 'k3',
        nr: 3,
        aar: 995,
        tittel: 'Blot eller dåp',
        rolle: { navn: 'Torgils', alder: 19, stand: 'karl', kjonn: 'mann' },
        aettId: 'nordvik',
        opptakt: {
            tittel: 'Nordvik, 995',
            tekst: 'En knarr glir inn i fjorden. Tolv menn i brynje. Én i hvit kjortel.',
        },
        steg: [],
        mellomspillEtter: 'mellomspill-3',
    },
    {
        id: 'k4',
        nr: 4,
        aar: 1030,
        tittel: 'Stiklestad',
        rolle: { navn: 'Halvard', alder: 41, stand: 'karl', kjonn: 'mann' },
        aettId: 'nordvik',
        opptakt: {
            tittel: 'Verdalen, 1030',
            tekst: 'Du er bonde. Du står i bondehæren. Mot kongen.',
        },
        steg: [],
        mellomspillEtter: 'mellomspill-4',
    },
    {
        id: 'k5',
        nr: 5,
        aar: 1066,
        tittel: 'Den som ikke kommer hjem',
        rolle: { navn: 'Orm den yngre', alder: 22, stand: 'karl', kjonn: 'mann' },
        aettId: 'nordvik',
        opptakt: {
            tittel: 'Stamford Bridge, 1066',
            tekst: 'Brynjene ligger igjen på skipene, i sola, urørt.',
        },
        steg: [],
        mellomspillEtter: 'mellomspill-5',
    },
];

export const KAPITTEL_BY_NR: Record<number, KapittelDef> = Object.fromEntries(
    KAPITLER.map((k) => [k.nr, k])
);

/**
 * Kapittelet eleven står i, med kapittel 1 som fall.
 *
 * Fallet er ikke slurv: et lagret spill kan peke på et kapittel nummer som er
 * fjernet, og da skal hun begynne forfra i 793 - ikke møte en tom skjerm.
 */
export function kapittelNr(nr: number): KapittelDef {
    return KAPITTEL_BY_NR[nr] ?? KAPITLER[0];
}

/**
 * Stegene eleven kan se nå: de som er ferdige, og de som er åpne.
 *
 * Et steg med uoppfylte krav vises ikke i det hele tatt. Eleven skal ikke få
 * lese at hun skal seile vestover før det finnes et skip å seile i - den slags
 * liste er en oppskrift, og oppskriften tar spenningen ut av kapittelet.
 */
export function synligeSteg(kapittel: KapittelDef, gjort: string[]) {
    return kapittel.steg
        .filter((s) => s.krever.every((k) => gjort.includes(k)))
        .map((s) => ({ ...s, ferdig: gjort.includes(s.id) }));
}
