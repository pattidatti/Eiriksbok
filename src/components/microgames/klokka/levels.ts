// Brettene og de 20 båtene på Titanic. Hver side har sin egen rekke båter, så det henger
// alltid én båt på babord og én på styrbord. En båt svinger ut når båten før den på samme
// side er nede (eller tapt), men aldri før `klar` (davitene ble gjort klare etter tur).
// frist = klokkeslettet vannet når festet (lunta brenner ned mot det). Styrbord-livbåtene
// kan i tillegg låses av krengningen (se låsGrader i tuning.ts).
// Brettene er fasene i natta: de starter på klokka, ikke når forrige brett er ferdig.

import { kl } from './tuning';

export type Side = 'B' | 'S'; // babord (venstre), styrbord (høyre)
export type Slag = 'livbåt' | 'kutter' | 'sammenleggbar';

export interface BåtData {
    navn: string;
    side: Side;
    slag: Slag;
    plasser: number;
    /** Tidligste tidspunkt båten kan svinge ut. */
    klar: number;
    frist: number;
    /** I 1912 (Sebak 2024). null = tallet er ikke sikkert. */
    i1912: number | null;
}

export interface Brett {
    /** Klokkeslett brettet starter. */
    start: number;
    /** Banneret (2-4 ord). */
    banner: string;
    tittel: string;
    båter: BåtData[];
}

const b = (
    navn: string,
    side: Side,
    slag: Slag,
    klar: string,
    frist: string,
    i1912: number | null = null
): BåtData => ({
    navn,
    side,
    slag,
    plasser: slag === 'kutter' ? 40 : slag === 'sammenleggbar' ? 47 : 65,
    klar: kl(klar),
    frist: kl(frist),
    i1912,
});

export const BRETT: Brett[] = [
    {
        start: kl('00.45'),
        banner: '00.45 BÅTDEKKET',
        tittel: 'Ingen tror at skipet synker',
        båter: [
            b('Båt 7', 'S', 'livbåt', '00.45', '01.04', 28),
            b('Båt 6', 'B', 'livbåt', '00.45', '01.06'),
            b('Båt 5', 'S', 'livbåt', '00.45', '01.10'),
            b('Båt 8', 'B', 'livbåt', '00.45', '01.12'),
        ],
    },
    {
        start: kl('01.00'),
        banner: '01.00 ANDRE KLASSE',
        tittel: 'Flere kommer opp',
        båter: [
            b('Båt 3', 'S', 'livbåt', '00.45', '01.17'),
            b('Båt 10', 'B', 'livbåt', '00.45', '01.19'),
            b('Båt 1', 'S', 'kutter', '00.45', '01.23', 12),
            b('Båt 2', 'B', 'kutter', '00.45', '01.25'),
            b('Båt 9', 'S', 'livbåt', '00.45', '01.30'),
            b('Båt 12', 'B', 'livbåt', '00.45', '01.33'),
        ],
    },
    {
        start: kl('01.30'),
        banner: '01.30 TREDJE KLASSE',
        tittel: 'Porten nede i skipet',
        båter: [
            b('Båt 11', 'S', 'livbåt', '00.45', '01.49'),
            b('Båt 14', 'B', 'livbåt', '00.45', '01.51'),
            b('Båt 13', 'S', 'livbåt', '00.45', '01.53'),
            b('Båt 16', 'B', 'livbåt', '00.45', '01.57'),
            b('Båt 15', 'S', 'livbåt', '00.45', '01.59'),
            b('Båt 4', 'B', 'livbåt', '00.45', '02.03'),
        ],
    },
    {
        start: kl('02.00'),
        banner: '02.00 DE SISTE BÅTENE',
        tittel: 'Sammenleggbare båter',
        båter: [
            b('Sammenleggbar C', 'S', 'sammenleggbar', '02.00', '02.09'),
            b('Sammenleggbar D', 'B', 'sammenleggbar', '02.00', '02.11'),
            b('Sammenleggbar A', 'S', 'sammenleggbar', '02.00', '02.16'),
            b('Sammenleggbar B', 'B', 'sammenleggbar', '02.00', '02.18'),
        ],
    },
];

export const ALLE_BÅTER = BRETT.flatMap((br) => br.båter);
export const PLASSER_TOTALT = ALLE_BÅTER.reduce((s, x) => s + x.plasser, 0); // 1178
