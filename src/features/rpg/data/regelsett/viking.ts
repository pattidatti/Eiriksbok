// Vikingtiden: pust, skjold og rull.
//
// Dette er verb-kontrakten fra blueprintens §5, fylt ut for én epoke. Alt her er
// tall som skal justeres av noen som prøvespiller, ikke leses som logikk.
//
// Grunnen til at det er en fil og ikke konstanter i `kamp.ts`: epoke nummer to
// skal kunne skrives uten å røre en eneste linje kode. En soldat i 1916 har
// nerve i stedet for pust og en skyttergrav i stedet for et skjold, men reglene
// om når han blokkerer og når han parerer er de samme.
//
// Vikingtiden er eneste implementasjon nå, og det skal den være. Poenget er
// ikke å ha to regelsett - det er at ingen signatur i motoren har ordet
// «skjold» i seg når det andre kommer.

import type { Regelsett } from '../../types';

export const VIKING_REGELSETT: Regelsett = {
    id: 'viking',
    navn: 'Vikingtiden',

    ressurs: {
        id: 'pust',
        // Verifikasjonsskriptene finner stolpen på dette ordet
        // (`[aria-label="Pust"]` i scripts/verify-rpg-kamp.mjs). Endres det,
        // må de endres i samme åndedrag.
        navn: 'Pust',
        maks: 100,
        gjenvinning: 22,
        pause: 700,
        drenering: 6,
        farge: '#7ad0b0',
        tomFarge: '#e0483f',
        bakgrunn: '#122a24',
    },

    vern: {
        art: 'skjold',
        navn: 'Skjold',
        brutt: 'Bart',
        // Rundskjold, ikke tårnskjold. Angrep fra siden og bakfra går rett
        // gjennom, og det er derfor rekka finnes.
        dekning: 120,
        slitasje: true,
        paradeVindu: 180,
        hvile: 260,
        // Skjoldgang. Skjoldet er tungt, og det skal kjennes i beina.
        fart: 0.45,
        farge: { oppe: '#e8c96a', nede: '#c9a86a', tomt: '#3a2a18' },
        meldinger: {
            brast: 'Skjoldet brast!',
            varsel: 'Skjoldet gikk i to. Nå står du bar.',
        },
    },

    bevegelse: {
        fart: 96,
        rull: true,
        rullFart: 260,
        rullMs: 260,
        rullNedkjoling: 620,
        usarbarMs: 620,
        farkost: true,
    },

    // Sving og skudd. Kastet og støtet står i blueprinten, men ingen har bygget
    // dem - de legges til her når de finnes, ikke før.
    angrepsformer: ['sving', 'skudd'],
};
