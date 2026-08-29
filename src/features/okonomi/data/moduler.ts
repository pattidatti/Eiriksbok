// Sidemenyen i Pengeliv: elleve moduler i tre grupper.
//
// Alt er åpent fra start. Rekkefølgen her er rekkefølgen i menyen, og gruppene
// kommer i den rekkefølgen de dukker opp i lista.
//
// Alle elleve er bygget. Legges det en tolvte id i `ModulId`, krever
// `MODUL_KOMPONENTER` i PengelivPage.tsx en komponent for den, og `tsc` sier
// fra - bedre enn et «snart»-merke eleven ikke kan gjøre noe med.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md (seksjon 6)

import type { ModulDefinisjon, ModulGruppe } from '../types';

/** Gruppene i den rekkefølgen sidemenyen skal vise dem. */
export const MODUL_GRUPPER: ModulGruppe[] = ['Økonomien din', 'Sparing og investering', 'Livet'];

export const MODULER: ModulDefinisjon[] = [
    // --- Økonomien din -----------------------------------------------------
    {
        id: 'oversikt',
        navn: 'Oversikt',
        gruppe: 'Økonomien din',
        ikon: 'layout-dashboard',
    },
    {
        id: 'lonn-og-skatt',
        navn: 'Lønn og skatt',
        gruppe: 'Økonomien din',
        ikon: 'receipt',
    },
    {
        id: 'budsjett',
        navn: 'Budsjett',
        gruppe: 'Økonomien din',
        ikon: 'wallet',
    },
    {
        id: 'laan-og-gjeld',
        navn: 'Lån og gjeld',
        gruppe: 'Økonomien din',
        ikon: 'credit-card',
    },

    // --- Sparing og investering -------------------------------------------
    {
        id: 'sparing',
        navn: 'Sparing',
        gruppe: 'Sparing og investering',
        ikon: 'piggy-bank',
    },
    {
        id: 'fond',
        navn: 'Fond',
        gruppe: 'Sparing og investering',
        ikon: 'pie-chart',
    },
    {
        id: 'bors',
        navn: 'Børs',
        gruppe: 'Sparing og investering',
        ikon: 'trending-up',
    },
    {
        id: 'pensjon',
        navn: 'Pensjon',
        gruppe: 'Sparing og investering',
        ikon: 'hourglass',
    },

    // --- Livet -------------------------------------------------------------
    {
        id: 'karriere',
        navn: 'Karriere',
        gruppe: 'Livet',
        ikon: 'briefcase',
    },
    {
        id: 'bolig',
        navn: 'Bolig',
        gruppe: 'Livet',
        ikon: 'house',
    },
    {
        id: 'husholdning',
        navn: 'Husholdning',
        gruppe: 'Livet',
        ikon: 'users',
    },
];
