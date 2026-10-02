// Brettene: de 20 båtene på Titanic i den rekkefølgen de henger klare på davitene.
// frist = klokkeslettet vannet når festet (forreste båter først). Styrbord-livbåtene
// kan i tillegg låses av krengningen (se låsGrader i tuning.ts).

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
            b('Båt 7', 'S', 'livbåt', '01.42', 28),
            b('Båt 5', 'S', 'livbåt', '01.44'),
            b('Båt 3', 'S', 'livbåt', '01.46'),
        ],
    },
    {
        tittel: '01.10. Begge sider.',
        tekst: 'To båter henger klare. Mens du firer den ene, venter køen.',
        båter: [
            b('Båt 1', 'S', 'kutter', '01.50', 12),
            b('Båt 6', 'B', 'livbåt', '01.48'),
            b('Båt 9', 'S', 'livbåt', '01.52'),
            b('Båt 8', 'B', 'livbåt', '01.50'),
            b('Båt 11', 'S', 'livbåt', '01.54'),
            b('Båt 10', 'B', 'livbåt', '01.52'),
            b('Båt 2', 'B', 'kutter', '01.54'),
        ],
    },
    {
        tittel: '01.40. Fra tredje klasse.',
        tekst: 'Skipet krenger mot babord. Folk fra tredje klasse er på vei opp.',
        båter: [
            b('Båt 13', 'S', 'livbåt', '02.06'),
            b('Båt 12', 'B', 'livbåt', '02.01'),
            b('Båt 15', 'S', 'livbåt', '02.08'),
            b('Båt 14', 'B', 'livbåt', '02.03'),
            b('Båt 16', 'B', 'livbåt', '02.05'),
            b('Båt 4', 'B', 'livbåt', '02.07'),
        ],
    },
    {
        tittel: '02.05. De siste båtene.',
        tekst: 'De sammenleggbare skyves rett av dekket.',
        båter: [
            b('Sammenleggbar C', 'S', 'sammenleggbar', '02.12'),
            b('Sammenleggbar D', 'B', 'sammenleggbar', '02.13'),
            b('Sammenleggbar A', 'S', 'sammenleggbar', '02.16'),
            b('Sammenleggbar B', 'B', 'sammenleggbar', '02.18'),
        ],
    },
];

export const ALLE_BÅTER = BRETT.flatMap((br) => br.båter);
export const PLASSER_TOTALT = ALLE_BÅTER.reduce((s, x) => s + x.plasser, 0); // 1178
