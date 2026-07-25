import type { ZoneDef } from '../types';

// Verdenskartet. Nordvik er ferdig bygget; de andre sonene er synlige på
// kartet, men merket «kommer». Spørsmålsbanken har allerede innhold til alle
// sammen (se scripts/generate-quest-bank.mjs), så resten er byggearbeid - ikke
// innholdsarbeid.

export const ZONES: ZoneDef[] = [
    {
        id: 'nordvik',
        title: 'Nordvik',
        era: 'Vikingtiden',
        pitch: 'En fjordbygd der tåka har begynt å spise navnene på folk.',
        krevesNiva: 1,
        spillbar: true,
        tema: { gress: '#4d7c45', stein: '#7d8590', vann: '#2c5f8a', himmel: '#8fb8d8' },
    },
    {
        id: 'gryet',
        title: 'Gryet',
        era: 'Steinalder og de første byene',
        pitch: 'Der alt begynte. Ild, korn og de første streker på en vegg.',
        krevesNiva: 4,
        spillbar: false,
        tema: { gress: '#7a7043', stein: '#8d8272', vann: '#3f7a8a', himmel: '#d8c9a0' },
    },
    {
        id: 'marmortorget',
        title: 'Marmortorget',
        era: 'Antikken',
        pitch: 'Søyler, torg og folk som krangler høylytt om hvem som skal styre.',
        krevesNiva: 6,
        spillbar: false,
        tema: { gress: '#8a9a5b', stein: '#e0dcd0', vann: '#3f8fa8', himmel: '#f0dfc0' },
    },
    {
        id: 'steinborg',
        title: 'Steinborg',
        era: 'Middelalderen',
        pitch: 'Borg, kirke og pest. Noen vokter porten - og sannheten.',
        krevesNiva: 8,
        spillbar: false,
        tema: { gress: '#3f6b48', stein: '#6f7280', vann: '#28506e', himmel: '#9aa8b8' },
    },
    {
        id: 'lysbyen',
        title: 'Lysbyen',
        era: 'Renessanse og revolusjoner',
        pitch: 'Trykkpresser, plakater og folk som nekter å bøye seg.',
        krevesNiva: 10,
        spillbar: false,
        tema: { gress: '#5a7a4a', stein: '#c8b89a', vann: '#3a6f8a', himmel: '#e8d8b8' },
    },
    {
        id: 'dampbyen',
        title: 'Dampbyen',
        era: 'Industrialiseringen',
        pitch: 'Sot, samlebånd og en klokke som aldri slutter å tikke.',
        krevesNiva: 12,
        spillbar: false,
        tema: { gress: '#4a4f3c', stein: '#5d5a55', vann: '#3a4a52', himmel: '#a89880' },
    },
    {
        id: 'skyggeaaret',
        title: 'Skyggeåret',
        era: 'Krig og kald krig',
        pitch: 'Propaganda i høyttalerne. Her er løgnen bevæpnet.',
        krevesNiva: 14,
        spillbar: false,
        tema: { gress: '#3d4a3a', stein: '#55585c', vann: '#2a3a48', himmel: '#7d8590' },
    },
    {
        id: 'ordheimen',
        title: 'Ordheimen',
        era: 'Språk og litteratur',
        pitch: 'Et bibliotek som er større på innsiden. Ordene flytter på seg.',
        krevesNiva: 5,
        spillbar: false,
        tema: { gress: '#4a6a5a', stein: '#8a7a68', vann: '#3a6a7a', himmel: '#c8b8d0' },
    },
    {
        id: 'tempelhagen',
        title: 'Tempelhagen',
        era: 'Tro og tanke',
        pitch: 'Sju stier, sju svar. Ingen av dem er en snarvei.',
        krevesNiva: 7,
        spillbar: false,
        tema: { gress: '#5a8a5a', stein: '#d8d0c0', vann: '#4a9a9a', himmel: '#f0e8d0' },
    },
    {
        id: 'radhusplassen',
        title: 'Rådhusplassen',
        era: 'Samfunn og demokrati',
        pitch: 'Her stemmer folk. Noen prøver å telle feil.',
        krevesNiva: 9,
        spillbar: false,
        tema: { gress: '#4a7a5a', stein: '#b0b8c0', vann: '#3a6a9a', himmel: '#c0d8e8' },
    },
    {
        id: 'klangdalen',
        title: 'Klangdalen',
        era: 'Musikk',
        pitch: 'Dalen svarer når du spiller riktig. Og tier når du bommer.',
        krevesNiva: 11,
        spillbar: false,
        tema: { gress: '#5a7a6a', stein: '#9a8ab0', vann: '#4a6a9a', himmel: '#d0c0e0' },
    },
];

export const ZONE_BY_ID: Record<string, ZoneDef> = Object.fromEntries(ZONES.map((z) => [z.id, z]));
