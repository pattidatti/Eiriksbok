// Minnevokterens hall: hubben.
//
// Formen er en tidslinje du går på (blueprint §3.1). Veien renner gjennom hele
// kartet, og portalene ligger langs den i kronologisk rekkefølge med avstand
// som følger tid. Da lærer eleven kronologi med føttene: at det er lengre fra
// steinalderen til antikken enn fra antikken til vikingtiden blir en kroppslig
// erfaring i stedet for et tall på en akse.
//
// Avstanden er kvadratrota av «hvor lenge siden», ikke årene selv. Med rå
// proporsjon ville de fire siste epokene ligget oppå hverandre i den ene enden
// mens steinalderen lå alene i den andre - fem tusen år er for langt spenn for
// ett kart.
//
// Blueprintens §3.1 foreslo log, og log var feil. Prøvd, målt og forkastet:
// mennesker velger epoker omtrent log-jevnt (hver epoke er en fast andel
// nærmere nå enn den forrige), så log(alder) gjorde avstandene *like* - 240,
// 240, 176, 224, 256, 240 piksler. Veien ble en liste, og nettopp den
// forskjellen den skulle lære bort var borte.
//
// Kvadratrota komprimerer dyp tid nok til at alt får plass, og lar likevel
// steget fra steinalderen til antikken være fem ganger så langt som steget fra
// industrialiseringen til krigen. Det er sant, og det kjennes i beina.
//
// Fire av epokene har ikke noe årstall: språk, tro, samfunn og musikk er ikke
// tider. De står i lunden sør for veien. Det er ikke en unnskyldning for at de
// ikke passer - det er en påstand om at ikke alt hører hjemme på en akse, og
// den er verdt å vise.

import { EPOKER_I_TID, EPOKER_UTEN_TID } from './epoker';
import type { LandmarkDef, PortalDef, Tema } from '../types';

export const HUB_SIZE = { bredde: 104, hoyde: 36 };

/** Året vi måler «hvor lenge siden» fra. */
const NAA = 2026;

/** Veien går fra vest til øst mellom disse rutene. */
const VEI_START = 9;
const VEI_SLUTT = 95;

/**
 * Veien bukter seg svakt. Rett strek leser som en korridor; en vei som svinger
 * leser som et landskap - og eleven ser aldri hele tidslinjen på én gang, som
 * hun heller ikke gjør i tid.
 */
export function veiY(x: number): number {
    return 15 + Math.sin(x * 0.085) * 2.6 + Math.sin(x * 0.031) * 1.4;
}

/** Lunden sør for veien, der de tidløse epokene står. */
export const LUND = { x: 43, y: 25, bredde: 26, hoyde: 6 };

/** Der sidestien tar av fra hovedveien og ned til lunden. */
export const LUND_AVKJORING = 56;

/** Hvor langt tilbake, målt slik veien måler: kvadratrota av årene. */
const avstand = (aar: number) => Math.sqrt(Math.max(1, NAA - aar));

/**
 * Rute på veien for et årstall. Eldst lengst vest.
 *
 * Regnes ut, ikke skrives ned: legger noen til en epoke i `epoker.ts`, finner
 * den sin egen plass på tidslinjen uten at et eneste tall her endres.
 */
function veiRute(aar: number): [number, number] {
    const alle = EPOKER_I_TID.map((e) => avstand(e.aar ?? NAA));
    const eldst = Math.max(...alle);
    const yngst = Math.min(...alle);
    const spenn = Math.max(0.001, eldst - yngst);
    const andel = (eldst - avstand(aar)) / spenn;
    const x = Math.round(VEI_START + andel * (VEI_SLUTT - VEI_START));
    // Portalen står nord for veien, så eleven går forbi den og ikke gjennom.
    return [x, Math.round(veiY(x)) - 2];
}

export const HUB_PORTALER: PortalDef[] = [
    ...EPOKER_I_TID.map((e): PortalDef => ({
        tile: veiRute(e.aar ?? NAA),
        maal: { art: 'epoke', epokeId: e.id },
    })),
    ...EPOKER_UTEN_TID.map((e, i): PortalDef => {
        // To og to i lunden, med god luft mellom. Fire portaler på rekke ville
        // sett ut som fire til på veien.
        const kol = i % 2;
        const rad = Math.floor(i / 2);
        return {
            tile: [LUND.x + 5 + kol * 15, LUND.y + 1 + rad * 4],
            maal: { art: 'epoke', epokeId: e.id },
        };
    }),
];

export const HUB_SPAWN: [number, number] = [6, Math.round(veiY(6))];

/** Bålet og varden står ved veiens begynnelse, der eleven kommer inn. */
export const BAAL_RUTE: [number, number] = [5, Math.round(veiY(5)) + 3];
export const VARDE_RUTE: [number, number] = [8, Math.round(veiY(8)) + 3];

export const HUB_LANDEMERKER: LandmarkDef[] = [
    {
        id: 'hall-baal',
        kind: 'baal',
        tile: BAAL_RUTE,
        title: 'Bålet',
        text:
            'Bålet har brent her lenge før deg, og det kommer til å brenne etterpå. ' +
            'Det er varmen du kommer tilbake til når en tid har vært hard mot deg.\n\n' +
            'Veien østover er tiden selv. Går du langs den, går du framover i år: ' +
            'steinalderen ligger her ved bålet, og det nærmeste århundret ligger ' +
            'lengst borte. Legg merke til hvor langt det er mellom de første ' +
            'portalene, og hvor tett de siste ligger. Slik er tid: det nære er ' +
            'oppstykket, det fjerne er ett eneste sveip.',
    },
    {
        id: 'hall-skilt',
        kind: 'skilt',
        tile: [11, Math.round(veiY(11)) + 2],
        title: 'Veiviseren',
        text:
            'VEIEN ØSTOVER ER ÅRENE.\n\n' +
            'Hver portal er en tid du kan gå inn i. Står den mørk, er den ikke ' +
            'åpnet ennå.\n\n' +
            'STIEN SØROVER ER NOE ANNET.\n\n' +
            'I lunden står de som ikke har noe årstall: språket, troen, ' +
            'samfunnet og musikken. De hører ikke hjemme på en tidslinje, for de ' +
            'skjer hele veien.',
    },
];

/**
 * Hallens palett. Skumring: den er verken dag eller natt, for den ligger ikke i
 * noen tid. Mose og våt stein, og en himmel som lyser svakt fiolett - da får
 * portalfargene noe å stå imot.
 */
export const HUB_TEMA: Tema = {
    gress: '#3f5f4a',
    stein: '#8a8fa0',
    vann: '#2a4a68',
    himmel: '#b8aed8',
    sand: '#b8ae90',
    jord: '#6a5f52',
    aker: '#5a5a46',
    tommer: '#5f5040',
    tak: '#4a4258',
    lov: '#4a7a58',
};
