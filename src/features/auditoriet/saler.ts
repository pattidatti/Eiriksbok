// Universitetet og salene. Én sal per fag, hver med sin faste foreleser.
//
// Salene er det eneste stedet fag kobles til forelesere. Automanuset (automanus.ts)
// lar foreleseren presentere seg med navnet herfra, og skrevne manus i
// public/content/forelesninger/ skal bruke samme navn.

export const UNIVERSITET = 'Eiriksbok universitet';

export type HarFasong = 'knute' | 'kort' | 'langt';

export interface Utseende {
    hud: string;
    har: string;
    harFasong: HarFasong;
    jakke: string;
    bukse: string;
    briller: boolean;
    skjegg: boolean;
}

export interface Sal {
    id: string;
    fag: string;
    navn: string;
    /** Farge på dørskilt og detaljer i gangen. */
    farge: string;
    foreleser: { navn: string; rolle: string; utseende: Utseende };
}

export const SALER: Sal[] = [
    {
        id: 'historie',
        fag: 'historie',
        navn: 'Historiesalen',
        farge: '#b45309',
        foreleser: {
            navn: 'Ingrid',
            rolle: 'historiker',
            utseende: { hud: '#f1c6a1', har: '#8a3b1f', harFasong: 'knute', jakke: '#2f5d62', bukse: '#334155', briller: true, skjegg: false },
        },
    },
    {
        id: 'norsk',
        fag: 'norsk',
        navn: 'Norsksalen',
        farge: '#be123c',
        foreleser: {
            navn: 'Jon',
            rolle: 'norsklektor',
            utseende: { hud: '#e8b48f', har: '#4a2e1a', harFasong: 'kort', jakke: '#a16207', bukse: '#3f3f46', briller: false, skjegg: true },
        },
    },
    {
        id: 'samfunnskunnskap',
        fag: 'samfunnskunnskap',
        navn: 'Samfunnssalen',
        farge: '#1d4ed8',
        foreleser: {
            navn: 'Erik',
            rolle: 'samfunnsforsker',
            utseende: { hud: '#f3cfb0', har: '#9ca3af', harFasong: 'kort', jakke: '#1e3a8a', bukse: '#1f2937', briller: true, skjegg: false },
        },
    },
    {
        id: 'krle',
        fag: 'krle',
        navn: 'KRLE-salen',
        farge: '#7e22ce',
        foreleser: {
            navn: 'Amina',
            rolle: 'religionsviter',
            utseende: { hud: '#b77b55', har: '#1c1917', harFasong: 'langt', jakke: '#6b2f5b', bukse: '#292524', briller: false, skjegg: false },
        },
    },
    {
        id: 'musikk',
        fag: 'musikk',
        navn: 'Musikksalen',
        farge: '#047857',
        foreleser: {
            navn: 'Sofie',
            rolle: 'musiker',
            utseende: { hud: '#f5d0b0', har: '#d9b26a', harFasong: 'langt', jakke: '#c2410c', bukse: '#334155', briller: false, skjegg: false },
        },
    },
];

export const salFor = (id: string | undefined) => SALER.find((s) => s.id === id);
export const salForFag = (fag: string) => SALER.find((s) => s.fag === fag);
