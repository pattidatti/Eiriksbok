// Epokene. Én epoke er en innholdsmodul: eget regelsett, egne steder, én portal
// i hubben. Vikingtiden er ferdig bygget; de andre er synlige på verdenskartet,
// men merket «kommer». Spørsmålsbanken har allerede innhold til alle sammen (se
// scripts/generate-quest-bank.mjs), så resten er byggearbeid - ikke
// innholdsarbeid.
//
// Merk skillet mot `steder.ts`: Nordvik er et *sted* i epoken «vikingtiden», og
// Lindisfarne blir et annet. Epoken eier regelsettet og fagstoffet, stedet eier
// kartet. Før dette het epoken «nordvik», og da fantes det ikke noe sted å
// henge kapittel 1 sitt andre kart.
//
// Temaet er hele paletten. Terreng, trær, tømmer og tak leses alle herfra, så
// en ny epoke får sin egen identitet uten ny grafikk.
//
// Listen er et utkast, ikke et løfte. Se blueprintens §12.

import type { EpokeDef, Regelsett, Tema } from '../types';
import { VIKING_REGELSETT } from './regelsett/viking';

const tema = (t: Tema): Tema => t;

export const EPOKER: EpokeDef[] = [
    {
        id: 'vikingtiden',
        aar: 793,
        title: 'Vikingtiden',
        era: '793-1066',
        pitch: 'En fjordbygd der tåka har begynt å spise navnene på folk.',
        krevesNiva: 1,
        spillbar: true,
        regelsett: VIKING_REGELSETT,
        bankSone: 'nordvik',
        tema: tema({
            gress: '#4d7c45',
            stein: '#7d8590',
            vann: '#2c5f8a',
            himmel: '#8fb8d8',
            sand: '#d8c89a',
            jord: '#8a7355',
            aker: '#7a6236',
            tommer: '#6b5335',
            tak: '#3d5c30',
            lov: '#3d7a42',
        }),
    },
    {
        id: 'gryet',
        aar: -3000,
        title: 'Gryet',
        era: 'Steinalder og de første byene',
        pitch: 'Der alt begynte. Ild, korn og de første streker på en vegg.',
        krevesNiva: 4,
        spillbar: false,
        bankSone: 'gryet',
        tema: tema({
            gress: '#7a7043',
            stein: '#8d8272',
            vann: '#3f7a8a',
            himmel: '#d8c9a0',
            sand: '#e0cfa0',
            jord: '#9a8258',
            aker: '#8a7440',
            tommer: '#8a6a45',
            tak: '#9a8a5a',
            lov: '#6f8a48',
        }),
    },
    {
        id: 'marmortorget',
        aar: -450,
        title: 'Marmortorget',
        era: 'Antikken',
        pitch: 'Søyler, torg og folk som krangler høylytt om hvem som skal styre.',
        krevesNiva: 5,
        spillbar: false,
        bankSone: 'marmortorget',
        tema: tema({
            gress: '#8a9a5b',
            stein: '#e0dcd0',
            vann: '#3f8fa8',
            himmel: '#f0dfc0',
            sand: '#e8dcb8',
            jord: '#b0a480',
            aker: '#9a8a50',
            tommer: '#c8bca0',
            tak: '#b05a3a',
            lov: '#6f9a55',
        }),
    },
    {
        id: 'steinborg',
        aar: 1300,
        title: 'Steinborg',
        era: 'Middelalderen',
        pitch: 'Borg, kirke og pest. Noen vokter porten - og sannheten.',
        krevesNiva: 7,
        spillbar: false,
        bankSone: 'steinborg',
        tema: tema({
            gress: '#3f6b48',
            stein: '#6f7280',
            vann: '#28506e',
            himmel: '#9aa8b8',
            sand: '#b8ac8a',
            jord: '#6f5f48',
            aker: '#6a5a38',
            tommer: '#5a4a38',
            tak: '#4a4048',
            lov: '#356a3c',
        }),
    },
    {
        id: 'lysbyen',
        aar: 1650,
        title: 'Lysbyen',
        era: 'Renessanse og revolusjoner',
        pitch: 'Trykkpresser, plakater og folk som nekter å bøye seg.',
        krevesNiva: 9,
        spillbar: false,
        bankSone: 'lysbyen',
        tema: tema({
            gress: '#5a7a4a',
            stein: '#c8b89a',
            vann: '#3a6f8a',
            himmel: '#e8d8b8',
            sand: '#d8c8a0',
            jord: '#9a8460',
            aker: '#8a7040',
            tommer: '#8a6a48',
            tak: '#8a4a3a',
            lov: '#4f8a48',
        }),
    },
    {
        id: 'dampbyen',
        aar: 1850,
        title: 'Dampbyen',
        era: 'Industrialiseringen',
        pitch: 'Sot, samlebånd og en klokke som aldri slutter å tikke.',
        krevesNiva: 11,
        spillbar: false,
        bankSone: 'dampbyen',
        tema: tema({
            gress: '#4a4f3c',
            stein: '#5d5a55',
            vann: '#3a4a52',
            himmel: '#a89880',
            sand: '#8a8070',
            jord: '#5a5248',
            aker: '#585040',
            tommer: '#4a423a',
            tak: '#3a3632',
            lov: '#43563a',
        }),
    },
    {
        id: 'skyggeaaret',
        aar: 1940,
        title: 'Skyggeåret',
        era: 'Krig og kald krig',
        pitch: 'Propaganda i høyttalerne. Her er løgnen bevæpnet.',
        krevesNiva: 12,
        spillbar: false,
        bankSone: 'skyggeaaret',
        tema: tema({
            gress: '#3d4a3a',
            stein: '#55585c',
            vann: '#2a3a48',
            himmel: '#7d8590',
            sand: '#7a7668',
            jord: '#4f4a40',
            aker: '#4a4638',
            tommer: '#42403c',
            tak: '#33383c',
            lov: '#385040',
        }),
    },
    {
        id: 'ordheimen',
        aar: null,
        title: 'Ordheimen',
        era: 'Språk og litteratur',
        pitch: 'Et bibliotek som er større på innsiden. Ordene flytter på seg.',
        krevesNiva: 3,
        spillbar: false,
        bankSone: 'ordheimen',
        tema: tema({
            gress: '#4a6a5a',
            stein: '#8a7a68',
            vann: '#3a6a7a',
            himmel: '#c8b8d0',
            sand: '#c0b098',
            jord: '#7a6a58',
            aker: '#6a6048',
            tommer: '#6a5648',
            tak: '#5a4a58',
            lov: '#4a8a6a',
        }),
    },
    {
        id: 'tempelhagen',
        aar: null,
        title: 'Tempelhagen',
        era: 'Tro og tanke',
        pitch: 'Sju stier, sju svar. Ingen av dem er en snarvei.',
        krevesNiva: 6,
        spillbar: false,
        bankSone: 'tempelhagen',
        tema: tema({
            gress: '#5a8a5a',
            stein: '#d8d0c0',
            vann: '#4a9a9a',
            himmel: '#f0e8d0',
            sand: '#e0d4b0',
            jord: '#a89878',
            aker: '#98884c',
            tommer: '#b09878',
            tak: '#c07a4a',
            lov: '#5a9a58',
        }),
    },
    {
        id: 'radhusplassen',
        aar: null,
        title: 'Rådhusplassen',
        era: 'Samfunn og demokrati',
        pitch: 'Her stemmer folk. Noen prøver å telle feil.',
        krevesNiva: 8,
        spillbar: false,
        bankSone: 'radhusplassen',
        tema: tema({
            gress: '#4a7a5a',
            stein: '#b0b8c0',
            vann: '#3a6a9a',
            himmel: '#c0d8e8',
            sand: '#c8c0a8',
            jord: '#8a8478',
            aker: '#7a7450',
            tommer: '#8a8078',
            tak: '#6a7078',
            lov: '#4a8a5a',
        }),
    },
    {
        id: 'klangdalen',
        aar: null,
        title: 'Klangdalen',
        era: 'Musikk',
        pitch: 'Dalen svarer når du spiller riktig. Og tier når du bommer.',
        krevesNiva: 10,
        spillbar: false,
        bankSone: 'klangdalen',
        tema: tema({
            gress: '#5a7a6a',
            stein: '#9a8ab0',
            vann: '#4a6a9a',
            himmel: '#d0c0e0',
            sand: '#c8bcb8',
            jord: '#7a7080',
            aker: '#6a6870',
            tommer: '#6a5a70',
            tak: '#5a4a70',
            lov: '#5a9a7a',
        }),
    },
];

export const EPOKE_BY_ID: Record<string, EpokeDef> = Object.fromEntries(
    EPOKER.map((e) => [e.id, e])
);

/**
 * Epoken en ny elev fører regnskapet sitt i.
 *
 * Ikke det samme som stedet hun begynner å gå på - hun begynner i hubben, og
 * den ligger utenfor alle epoker. Utledes av lista, så den dagen en annen epoke
 * blir ferdig først, følger dette med.
 */
export const START_EPOKE = (EPOKER.find((e) => e.spillbar) ?? EPOKER[0]).id;

/**
 * Epokene som står på tidslinjeveien, eldst først, og de som ikke gjør det.
 *
 * Språk, tro, samfunn og musikk har ingen plass på en tidsakse. De står i
 * lunden ved siden av veien i stedet for å bli klemt inn på et årstall noen
 * måtte finne på.
 */
export const EPOKER_I_TID = EPOKER.filter((e) => e.aar !== null).sort(
    (a, b) => (a.aar ?? 0) - (b.aar ?? 0)
);
export const EPOKER_UTEN_TID = EPOKER.filter((e) => e.aar === null);

/**
 * Verb-kontrakten til en epoke, med vikingtiden som fallback.
 *
 * Fallbacken er ikke en generalitet vi later som vi har: den er der for at et
 * halvferdig sted med feilstavet `epokeId` skal være spillbart i stedet for å
 * krasje i første bilde. Bygger noen epoke nummer to, skal stedet peke på den.
 */
export function regelsettFor(epokeId: string | null): Regelsett {
    return EPOKE_BY_ID[epokeId ?? '']?.regelsett ?? VIKING_REGELSETT;
}

/** Sonen i spørsmålsbanken epoken henter fagstoff fra. */
export function bankSoneFor(epokeId: string | null): string {
    return EPOKE_BY_ID[epokeId ?? '']?.bankSone ?? epokeId ?? '';
}
