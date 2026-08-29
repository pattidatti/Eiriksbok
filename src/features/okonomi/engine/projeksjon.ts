// Pengeliv - framskrivningen. «Hvor havner du med dagens valg?»
//
// Kjører klokka framover på en kopi og samler ett punkt per år. To linjer
// tegnes av dette: den nominelle, som er tallet som faktisk vil stå på kontoen,
// og dagens kroner, som er hva det samme beløpet er verdt når prisene har
// steget. Avstanden mellom dem er sin egen lærdom.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md

import type { FramskrivningPunkt, Maalepunkt, Milepael, Satser, Tilstand } from '../types';
import { kalenderAar, tikk } from './klokke';
import { nokkeltall } from './nokkeltall';

const MANEDER_I_AR = 12;
const TOMME_MILEPAELER: Milepael[] = [];

/**
 * Formuen grafen tegner: alt eleven eier, boligen inkludert, minus gjelda.
 *
 * Tidligere var dette summen av kontoene alene. Da falt kurven gjennom gulvet
 * i det øyeblikket eleven kjøpte bolig - pengene forsvant fra konto, lånet ble
 * borte fra regnestykket, og huset fantes ikke. Nettoformuen er det tallet som
 * faktisk beskriver hvordan det går.
 */
function nettoformue(tilstand: Tilstand, satser: Satser): number {
    return nokkeltall(tilstand, satser).netto;
}

/**
 * Framskriver formuen `antallAar` år fram. Første punkt er i dag, så en
 * 40-årsframskrivning gir 41 punkter.
 *
 * `innskutt` er pengene eleven selv har lagt inn, `avkastning` er resten.
 *
 * Regnestykket hviler på én identitet: endringen i nettoformue på en måned er
 * nøyaktig månedens overskudd pluss avkastningen. Overføringer mellom elevens
 * egne kontoer teller ikke - sparing og IPS flytter penger, de bruker dem
 * ikke - og terminbeløp på lån teller bare én gang, som utgift. Derfor holder
 * det å summere overskuddet for å vite hvor mye som er egne penger.
 *
 * Identiteten holdt ikke før: `utgifter` talte bare budsjettpostene, så
 * terminbeløpene manglet, `innskutt` vokste fortere enn formuen, og
 * `avkastning` ble negativ. Grafen påsto at renta tok penger fra eleven.
 * Det er `nokkeltall.ts` som holder identiteten i hevd nå, og testen
 * `projeksjon.test.ts` som passer på at den fortsetter å gjøre det.
 */
export function framskriv(
    tilstand: Tilstand,
    satser: Satser,
    antallAar: number
): FramskrivningPunkt[] {
    const aar = Math.max(0, Math.floor(antallAar));
    const punkter: FramskrivningPunkt[] = new Array(aar + 1);

    const startFormue = nettoformue(tilstand, satser);
    let innskutt = startFormue;

    punkter[0] = {
        aar: kalenderAar(tilstand, tilstand.maaned),
        alder: tilstand.profil.alder,
        nominelt: startFormue,
        dagensKroner: startFormue,
        innskutt: startFormue,
        avkastning: 0,
    };

    // Dette kjøres på nytt hver gang eleven flytter en krone i budsjettet, på
    // en Chromebook. `tikk` legger et målepunkt i historikken for hver måned,
    // og hadde vi latt den vokse ville de 480 tikkene kopiert en stadig lengre
    // liste. Vi leser siste målepunkt og kaster resten - grafen trenger bare
    // årstallene, ikke elevens ekte historikk.
    let arbeid: Tilstand = {
        ...tilstand,
        historikk: tilstand.historikk.slice(-1),
        milepaeler: TOMME_MILEPAELER,
    };

    for (let i = 1; i <= aar; i++) {
        for (let m = 0; m < MANEDER_I_AR; m++) {
            const foerGjeld = arbeid.historikk[arbeid.historikk.length - 1].gjeld;
            const ny = tikk(arbeid, satser);
            const maal: Maalepunkt = ny.historikk[ny.historikk.length - 1];

            // Avdraget er elevens egne penger, ikke avkastning.
            //
            // Terminbeløpet teller i sin helhet som utgift, og det er riktig:
            // hele regningen forlater brukskontoen, og det er det tallet
            // budsjettet skal vise. Men bare rentene og gebyret er borte for
            // godt. Avdraget flyttes fra konto til mindre gjeld, og
            // nettoformuen står stille. Talte vi det ikke med her, ville hver
            // krone eleven betaler ned på lånet sitt dukket opp som «lagt på
            // av renta» i grafen.
            //
            // Gjelda kan bare falle inne i en framskrivning - ingen av
            // månedsstegene tar opp nye lån, det gjør bare elevens egne
            // handlinger - så differansen er avdraget. Gulvet på null er der
            // for at et framtidig steg som låner, aldri skal kunne gjøre
            // `innskutt` mindre.
            const avdrag = Math.max(0, foerGjeld - maal.gjeld);
            innskutt += maal.overskudd + avdrag;

            arbeid = { ...ny, historikk: [maal], milepaeler: TOMME_MILEPAELER };
        }

        const nominelt = nettoformue(arbeid, satser);
        const prisvekst = Math.pow(1 + satser.inflasjon, i);

        punkter[i] = {
            aar: kalenderAar(arbeid, arbeid.maaned),
            alder: arbeid.profil.alder,
            nominelt,
            dagensKroner: nominelt / prisvekst,
            innskutt,
            avkastning: nominelt - innskutt,
        };
    }

    return punkter;
}
