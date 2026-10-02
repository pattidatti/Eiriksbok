// All tekst i spillet: startregler, tap med tips og sluttskjermen.

export const REGLER = [
    'En båt som er nede, kan aldri fylles igjen.',
    'Jo lenger nede i skipet folk bor, jo seinere kommer de opp.',
    'Vannet stiger og dekket heller. En båt som henger for lenge, blir tatt av vannet eller låst mot skroget.',
];

/** Målet, på startskjermen over reglene. */
export const MÅL =
    'I 1912 ble rundt 705 mennesker reddet i livbåtene, og 472 plasser sto tomme. Redd flere enn 705 før natta er over.';

export const STYRING =
    'Landgangen peker mot én båt, og køen går selv om bord. Klikk på landgangen (eller mellomrom/piltastene) for å bytte side. Hold på båten for å fire den ned (A for babord, D for styrbord).';

/** Tap: hvorfor du ikke slo 1912, og et tips. */
export const TAP = {
    tomme: {
        tittel: 'For mange tomme plasser',
        tips: 'Du firte båtene før folk rakk å komme. I 1912 gikk de første båtene halvtomme fordi mange ikke trodde at skipet sank. Vent til lunta er kort før du firer, og ha landgangen mot båten med kortest lunte.',
    },
    tapt: {
        tittel: 'Båtene gikk tapt',
        tips: 'Du ventet for lenge på fulle båter, og vannet eller krengningen tok dem - med folkene i. En halvfull båt på vannet redder flere enn en full båt som aldri kommer ned. Fir når lunta er nesten brent ned.',
    },
};

/** Hvorfor en båt gikk tapt (vises i lista på sluttskjermen). */
export const TAPT_ÅRSAK = {
    vann: 'vannet tok den',
    lås: 'krengningen låste den mot skroget',
};

export const SOLAS =
    'Selv med hver plass brukt var det ikke plass til over 1000 av dem om bord. Etter Titanic ble det en regel at livbåtene skal ha plass til alle (SOLAS, 1914).';

export const I1912 = { reddet: 705, tomme: 472 };
