// All tekst i spillet: startregler, tap med tips og sluttskjermen.

export const REGLER = [
    'En båt som er nede, kan aldri fylles igjen.',
    'Jo lenger nede i skipet folk bor, jo seinere kommer de opp.',
    'Vannet stiger og dekket heller. En båt som henger for lenge, blir tatt av vannet eller låst mot skroget.',
];

export const STYRING =
    'Dra fra køen til en båt, eller trykk på båten (piltastene går også). Hold på båten for å fire den ned (A for babord, D for styrbord).';

export const TAP = {
    vann: {
        tittel: 'Vannet tok båten',
        tips: 'Klokka 02.05 gikk den siste båten ned fra Titanic. Vannet kom forfra og oppover dekk for dekk. Fir de forreste båtene før vannet er ett dekk unna, også om de ikke er fulle.',
    },
    lås: {
        tittel: 'Krengningen låste båten',
        tips: 'Titanic krenget mens det sank. På den høye siden slo båtene mot skroget og var vanskelige å få ned. Fir båtene på den høye siden først når dekket begynner å helle.',
    },
};

export const SOLAS =
    'Selv med hver plass brukt var det ikke plass til over 1000 av dem om bord. Etter Titanic ble det en regel at livbåtene skal ha plass til alle (SOLAS, 1914).';

export const I1912 = { brukt: 706, tomme: 472 };
