// Opptrappingen fra designbriefens punkt 11: brettene er kapitler i samme kalender.
// Hvert brett sier hvilke måneder det dekker, hvor fort kalenderen går, og hva som er nytt.

import { TUNING } from './tuning';

export type CampId = 'ILEBU' | 'AKERSHUS' | 'FALSTAD';

export interface Level {
    navn: string;
    /** Første måned (0 = mai 1945) og måneden brettet slutter på. */
    fraMnd: number;
    tilMnd: number;
    /** Sekunder spilltid per måned. */
    sekPerMnd: number;
    leirer: CampId[];
    /** Har brettet rettssal? */
    rettssal: boolean;
    /** Så mange rettssaler åpner brettet. */
    saler: number;
    /** Så mange leirer (fra Ilebu) sender grå saker til forelegg av seg selv. */
    ruter: number;
    /** Andel alvorlige saker (0 = bare grå mapper). */
    alvorlig: number;
    /** Kommer mappene i par med samme saksnummer? */
    par: boolean;
    /** Tykke økonomiske mapper? */
    tykk: boolean;
    /** Sekunder mellom hver ny mappe. null = kurven i TUNING.tilfang. */
    intervall: number | null;
    /** Sinnet kan ikke gå over dette (brett 1 og 2 kan ikke tapes). */
    sinneTak: number;
    /** Linjalen for straffenivå synlig? */
    linjal: boolean;
    /** Én setning på mellomsiden før brettet. */
    protokoll: string;
}

export const LEVELS: Level[] = [
    {
        navn: 'Mai 1945',
        fraMnd: 0,
        tilMnd: 1,
        sekPerMnd: 20,
        leirer: ['ILEBU'],
        // Rettssalen glir inn når den første angiveren kommer (se brett1 i tuning.ts).
        rettssal: true,
        saler: 1,
        ruter: 0,
        alvorlig: 0,
        par: false,
        tykk: false,
        intervall: 2.2,
        sinneTak: 0.6,
        linjal: false,
        protokoll:
            'Mai 1945. Freden er kommet. Tusenvis blir arrestert, og folk i gatene vil se straff.',
    },
    {
        navn: 'Sommeren 1945',
        fraMnd: 1,
        tilMnd: 4,
        sekPerMnd: 10,
        leirer: ['ILEBU', 'AKERSHUS'],
        rettssal: true,
        saler: 1,
        ruter: 0,
        alvorlig: TUNING.tilfang.alvorligAndel,
        par: false,
        tykk: false,
        intervall: null,
        sinneTak: 0.85,
        linjal: false,
        protokoll: 'Sommeren 1945. Akershus fylles. Flere saker enn én rettssal rekker.',
    },
    {
        navn: 'Høsten 1945 til våren 1946',
        fraMnd: 4,
        tilMnd: 10,
        sekPerMnd: 7,
        leirer: ['ILEBU', 'AKERSHUS'],
        rettssal: true,
        saler: 2,
        ruter: 1,
        alvorlig: TUNING.tilfang.alvorligAndel,
        par: true,
        tykk: false,
        intervall: null,
        sinneTak: 1,
        linjal: true,
        protokoll:
            'Høsten 1945. To som gjorde det samme, skal få samme straff. De grovste sakene kan gi dødsdom.',
    },
    {
        navn: 'Mars 1946 til august 1948',
        fraMnd: 10,
        tilMnd: 40,
        sekPerMnd: 4,
        leirer: ['ILEBU', 'AKERSHUS', 'FALSTAD'],
        rettssal: true,
        saler: 5,
        ruter: 3,
        alvorlig: TUNING.tilfang.alvorligAndel,
        par: true,
        tykk: true,
        intervall: null,
        sinneTak: 1,
        linjal: true,
        protokoll:
            'Mars 1946. Falstad åpner. Profittørene kommer: tykke saker som tar lang tid i retten.',
    },
];

export const MONTHS = [
    'januar',
    'februar',
    'mars',
    'april',
    'mai',
    'juni',
    'juli',
    'august',
    'september',
    'oktober',
    'november',
    'desember',
];

/** Måned 0 = mai 1945 -> «mai 1945». */
export function monthName(m: number): string {
    const abs = 4 + Math.floor(m);
    return `${MONTHS[abs % 12]} ${1945 + Math.floor(abs / 12)}`;
}
