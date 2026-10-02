// Brettene: de 20 båtene på Titanic i den rekkefølgen de henger klare på davitene.
// frist = klokkeslettet vannet når festet (lunta brenner ned mot det). Fristene er tette:
// venter du på full båt tidlig, mangler tiden for båtene som kommer etter. Styrbord-
// livbåtene kan i tillegg låses av krengningen (se låsGrader i tuning.ts).

import { kl } from './tuning';

export type Side = 'B' | 'S'; // babord (venstre), styrbord (høyre)
export type Slag = 'livbåt' | 'kutter' | 'sammenleggbar';

export interface BåtData {
    navn: string;
    side: Side;
    slag: Slag;
    plasser: number;
    frist: number;
    /** I 1912 (Sebak 2024, British Wreck Commissioner 1912). null = tallet er ikke sikkert. */
    i1912: number | null;
}

export interface Brett {
    tittel: string;
    tekst: string;
    båter: BåtData[];
}

const b = (
    navn: string,
    side: Side,
    slag: Slag,
    frist: string,
    i1912: number | null = null
): BåtData => ({
    navn,
    side,
    slag,
    plasser: slag === 'kutter' ? 40 : slag === 'sammenleggbar' ? 47 : 65,
    frist: kl(frist),
    i1912,
});

export const BRETT: Brett[] = [
    {
        tittel: '00.45. Styrbord.',
        tekst: 'Få folk i båtene. Ingen tror at skipet synker.',
        båter: [
            b('Båt 7', 'S', 'livbåt', '01.02', 28),
            b('Båt 5', 'S', 'livbåt', '01.07'),
            b('Båt 3', 'S', 'livbåt', '01.12'),
        ],
    },
    {
        tittel: '01.10. Begge sider.',
        tekst: 'To båter henger klare. Bytt landgangen mellom dem.',
        båter: [
            b('Båt 1', 'S', 'kutter', '01.18', 12),
            b('Båt 6', 'B', 'livbåt', '01.20'),
            b('Båt 9', 'S', 'livbåt', '01.25'),
            b('Båt 8', 'B', 'livbåt', '01.27'),
            b('Båt 11', 'S', 'livbåt', '01.32'),
            b('Båt 10', 'B', 'livbåt', '01.34'),
            b('Båt 2', 'B', 'kutter', '01.38'),
        ],
    },
    {
        tittel: '01.40. Fra tredje klasse.',
        tekst: 'Skipet krenger mot babord. Folk fra tredje klasse er på vei opp.',
        båter: [
            b('Båt 13', 'S', 'livbåt', '01.51'),
            b('Båt 12', 'B', 'livbåt', '01.48'),
            b('Båt 15', 'S', 'livbåt', '01.57'),
            b('Båt 14', 'B', 'livbåt', '01.54'),
            b('Båt 16', 'B', 'livbåt', '02.00'),
            b('Båt 4', 'B', 'livbåt', '02.04'),
        ],
    },
    {
        tittel: '02.05. De siste båtene.',
        tekst: 'De sammenleggbare skyves rett av dekket.',
        båter: [
            b('Sammenleggbar C', 'S', 'sammenleggbar', '02.09'),
            b('Sammenleggbar D', 'B', 'sammenleggbar', '02.10'),
            b('Sammenleggbar A', 'S', 'sammenleggbar', '02.14'),
            b('Sammenleggbar B', 'B', 'sammenleggbar', '02.17'),
        ],
    },
];

export const ALLE_BÅTER = BRETT.flatMap((br) => br.båter);
export const PLASSER_TOTALT = ALLE_BÅTER.reduce((s, x) => s + x.plasser, 0); // 1178
