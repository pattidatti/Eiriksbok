// Rollespillet som data (blueprint §8.3-8.6): fraksjonene, ferdighetene og rangstigen. Systemet som
// teller og lagrer, er graboks/rpg.ts; «Meg»-siden i pausemenyen (ui/Meg.tsx) viser det.
//
// Fraksjonene er fra blueprint §7. Rangstigen (stuejunge, skutedreng, svenn/gesell, husbonde) er
// fortalt av Hanseatiske museum for 1600- og 1700-tallet [V], men om den var slik på 1400-tallet er
// [U] (blueprint §4.2). «Lærling» er fra fortellerbuen (§6). Kravene, lønna og tallene er [S].
import type { Ferdighet, Fraksjon, Krav } from './oppdrag-data';

export interface FraksjonInfo {
    navn: string;
    /** Brukes i setninger: «hos fiskerne». */
    hos: string;
    om: string;
    /** Tailwind-farge til måleren og kortene (lys bakgrunn). */
    farge: string;
    lys: string;
}

export const FRAKSJONER: Record<Fraksjon, FraksjonInfo> = {
    K: {
        navn: 'Kontoret',
        hos: 'Kontoret',
        // [V] SNL Det tyske kontor: egne lover, oldermenn, kjøpmenn fra hansabyene.
        om: 'Det tyske kontor: kjøpmennene fra hansabyene som styrer Bryggen med egne lover. Husbonden din hører til her.',
        farge: 'bg-amber-600',
        lys: 'bg-amber-100 text-amber-900',
    },
    B: {
        navn: 'Bergenhus',
        hos: 'kongens menn',
        // [V] blueprint §4.1: høvedsmannen på Bergenhus er kongens fremste mann i byen.
        om: 'Kongens menn på borgen på Holmen. Høvedsmannen styrer byen for kongen og vil at kongens lov skal gjelde for alle.',
        farge: 'bg-sky-700',
        lys: 'bg-sky-100 text-sky-900',
    },
    N: {
        navn: 'Byfolket',
        hos: 'byfolket',
        // [V] blueprint §3/§5.2: norske borgere og håndverkere, og de tyske skomakerne med eget amt.
        om: 'Norske borgere og håndverkere i Bergen, og skomakerne i Skostredet. De handler med Kontoret, men liker ikke makta det har.',
        farge: 'bg-emerald-700',
        lys: 'bg-emerald-100 text-emerald-900',
    },
    Ki: {
        navn: 'Kirken',
        hos: 'kirken',
        // [V] blueprint §5.2: Mariakirken ble tyskernes kirke i 1408.
        om: 'Prestene og klokkerne i byens kirker. Mariakirken er tyskernes egen kirke.',
        farge: 'bg-violet-700',
        lys: 'bg-violet-100 text-violet-900',
    },
    F: {
        navn: 'Fiskerne',
        hos: 'fiskerne',
        // [V] blueprint §4.3: nordfarergjelden.
        om: 'Fiskerne fra nord som kommer med jektene og tørrfisken. Mange av dem skylder Kontoret penger i årevis.',
        farge: 'bg-teal-700',
        lys: 'bg-teal-100 text-teal-900',
    },
};

export const FRAKSJON_REKKE: Fraksjon[] = ['K', 'B', 'N', 'Ki', 'F'];

export interface FerdighetInfo {
    navn: string;
    /** Hvordan man blir bedre. */
    om: string;
    /** Hva nivået gir. */
    effekt: (nivaa: number) => string;
}

export const FERDIGHETER: Record<Ferdighet, FerdighetInfo> = {
    styrke: {
        navn: 'Bære',
        om: 'Du blir sterkere av å bære bunter og bøtter.',
        effekt: (n) => `Du går ${n * 10} % fortere med en bunt i armene.`,
    },
    slaass: {
        navn: 'Slåss',
        om: 'Du lærer av hvert slag som treffer.',
        effekt: (n) => `Slagene dine gjør ${n * 10} % mer skade.`,
    },
    prute: {
        navn: 'Prute',
        om: 'Du lærer av å snakke om priser og handle med folk.',
        effekt: (n) => `Du får ${n * 20} % mer betalt når du leverer et oppdrag.`,
    },
    ro: {
        navn: 'Ro',
        om: 'Du blir bedre av å ro færingen over Vågen.',
        effekt: (n) => `Færingen går ${n * 7} % fortere for hvert åretak.`,
    },
    regning: {
        navn: 'Regne og veie',
        om: 'Du lærer av å veie riktig og lese tall i bøkene.',
        effekt: () => 'Bismerstanga roer seg fortere, og du kan bomme litt mer når du leser av.',
    },
};

export const FERDIGHET_REKKE: Ferdighet[] = ['styrke', 'slaass', 'prute', 'ro', 'regning'];

/** Øvelser som trengs for hvert nivå (0-5). */
export const NIVAA = [0, 2, 5, 9, 14, 20];

export interface Rang {
    navn: string;
    om: string;
    /** Hva rangen gir. */
    rett: string;
    /** Det som trengs for å nå rangen. `oppdrag` er antall leverte oppdrag. */
    krav: Krav & { oppdrag?: number; senere?: string };
}

export const RANGER: Rang[] = [
    { navn: 'Ny junge', om: 'Du kom med koggen fra Lübeck. Du kjenner ingen, og alt er nytt.', rett: 'Mat og en plass å sove i gården.', krav: {} },
    {
        navn: 'Stuejunge',
        om: 'Du rydder, henter vann og ved og hjelper til i schøtstua.',
        rett: '1 witten ekstra for hvert oppdrag. Tideke kan gi deg nøkkelen til lagerloftet.',
        krav: { oppdrag: 2, rykte: { K: 5 } },
    },
    {
        navn: 'Skutedreng',
        om: 'Du laster og losser skipene ved kaia.',
        rett: '2 witten ekstra for hvert oppdrag.',
        krav: { oppdrag: 5, rykte: { K: 15 }, ferdighet: { styrke: 2 } },
    },
    {
        navn: 'Lærling',
        om: 'Svennen lærer deg å lese, skrive og regne, og du får se i gjeldsboka.',
        rett: '3 witten ekstra for hvert oppdrag.',
        krav: { oppdrag: 8, rykte: { K: 30 }, ferdighet: { regning: 2 } },
    },
    {
        navn: 'Svenn',
        om: 'Du leder arbeidet i gården og lærer opp de yngre guttene.',
        rett: '4 witten ekstra for hvert oppdrag.',
        krav: { oppdrag: 12, rykte: { K: 50 }, ferdighet: { regning: 3, prute: 2 } },
    },
    {
        navn: 'Husbonde',
        om: 'Du styrer en stue i gården og fører gjeldsboka selv.',
        rett: 'Egen stue og egen handel.',
        krav: { senere: 'Kommer senere i historien.' },
    },
];

/** Hva folk synes om gutten, i ord. */
export function rykteOrd(v: number): string {
    if (v <= -50) return 'Hatet';
    if (v <= -15) return 'Mistrodd';
    if (v < 15) return 'Ukjent';
    if (v < 50) return 'Likt';
    return 'Æret';
}
