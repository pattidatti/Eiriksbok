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
import { sumFormue } from './sparing';

const MANEDER_I_AR = 12;
const TOMME_MILEPAELER: Milepael[] = [];

/**
 * Framskriver formuen `antallAar` år fram. Første punkt er i dag, så en
 * 40-årsframskrivning gir 41 punkter.
 *
 * `innskutt` er pengene eleven selv har lagt inn, `avkastning` er resten.
 * Hver måned er endringen i formue nøyaktig månedens overskudd pluss renta -
 * sparing er bare en flytting mellom egne kontoer - så det holder å summere
 * overskuddet for å vite hvor mye som er egne penger.
 */
export function framskriv(
    tilstand: Tilstand,
    satser: Satser,
    antallAar: number
): FramskrivningPunkt[] {
    const aar = Math.max(0, Math.floor(antallAar));
    const punkter: FramskrivningPunkt[] = new Array(aar + 1);

    const startFormue = sumFormue(tilstand.profil.kontoer);
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
            const ny = tikk(arbeid, satser);
            const maal: Maalepunkt = ny.historikk[ny.historikk.length - 1];
            innskutt += maal.overskudd;
            arbeid = { ...ny, historikk: [maal], milepaeler: TOMME_MILEPAELER };
        }

        const nominelt = sumFormue(arbeid.profil.kontoer);
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
