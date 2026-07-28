// Ættene rundt Nordvik, og hva et menneske koster.
//
// En ætt er ikke en fraksjon med et rykte-tall. Den er de menneskene som er
// nødt til å ta parti med deg, enten de liker deg eller ikke - og som du er
// nødt til å ta parti med. Det er derfor et drap ikke er en sak mellom to
// personer: det er en sak mellom to slekter, og den fortsetter etter at begge
// er døde. En uoppgjort strid i 793 kan møte eleven i 872.
//
// **Botsatsene er forenklet, og forenklingen er valgt så forholdene stemmer.**
// De gamle landskapslovene, som Gulatingsloven, satte prisen på et liv etter
// hvem den drepte var. En trell hadde ingen egen pris - han var eierens tap,
// og boten gikk til eieren. En hauld, odelsbonden med jord i egen slekt,
// kostet mer enn en vanlig fri karl. Tallene her er runde med vilje: eleven
// skal lese forholdet mellom dem, ikke pugge et beløp som uansett var
// forskjellig fra landsdel til landsdel.

import type { AettDef } from '../types';

export const AETTER: AettDef[] = [
    {
        id: 'nordvik',
        navn: 'Nordvik-ætta',
        medlemmer: [
            'Orm Båtbygger',
            'Torstein Ormsson',
            'Gudrun Husfrue',
            'Åsa Torsteinsdotter',
            'Gudrid',
            'Torgils Ketilsson',
            'Steinar Ketilsson',
        ],
        botsatser: { trell: 12, karl: 50, hauld: 100, jarl: 200 },
    },
    {
        id: 'saebo',
        navn: 'Sæbø-ætta',
        medlemmer: ['Vigdis på Sæbø', 'Kolbein Vigdisson'],
        botsatser: { trell: 12, karl: 50, hauld: 100, jarl: 200 },
    },
    {
        id: 'hovda',
        navn: 'Hovda-ætta',
        medlemmer: ['Gaute Gråkappe', 'Steinar Hovde'],
        botsatser: { trell: 12, karl: 50, hauld: 100, jarl: 200 },
    },
];

export const AETT_BY_ID: Record<string, AettDef> = Object.fromEntries(
    AETTER.map((a) => [a.id, a])
);

/** Ætten med denne id-en, eller elevens egen. Aldri undefined midt i en sak. */
export function aettEller(id: string | undefined): AettDef {
    return AETT_BY_ID[id ?? ''] ?? AETTER[0];
}
