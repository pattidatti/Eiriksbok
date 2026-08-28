// Pengeliv - stegsømmen i klokka.
//
// `tikk` skal ikke vokse til en tusen linjers funksjon som alle domener må
// redigere samtidig. I stedet er hver måned en rekke navngitte steg, og hvert
// domene eier sin egen fil med sitt eget steg. Vil du vite hva som skjer på
// en måned, leser du listene her nedenfor ovenfra og ned.
//
// Et steg er en REN funksjon: det tar en tilstand og gir en ny tilbake, og
// muterer aldri den det fikk. Framskrivningen kjører hele rekka 480 ganger
// uten å røre elevens ekte økonomi, og det er den regelen som gjør det trygt.

import type { Satser, Tilstand } from '../types';
import { stegKarriere } from './karriere';
import { stegHusholdning } from './husholdning';
import { stegBolig } from './bolig';
import { stegLaan } from './laan';
import { stegFond } from './fond';
import { stegBors } from './bors';
import { stegPensjon } from './pensjon';
import { stegHendelser } from './hendelser';

export interface StegKontekst {
    satser: Satser;
    /** Måneden vi går inn i. */
    maaned: number;
    /** Sant den ene måneden i året vi krysser nyttår. */
    arsskifte: boolean;
    /** Nettolønn for denne måneden, etter skatt. */
    nettoManedlig: number;
}

export type Maanedssteg = (tilstand: Tilstand, kontekst: StegKontekst) => Tilstand;

/**
 * Kjøres før lønna regnes ut, fordi de kan endre hva eleven tjener.
 * Et ferdig studium eller en ny jobb skal slå inn på lønnsslippen samme måned.
 */
export const STEG_FOR_LONN: Maanedssteg[] = [stegKarriere];

/**
 * Kjøres etter at lønna er inn på konto, men før budsjettet trekkes. Her bor
 * penger som kommer og går uansett hva eleven ellers velger: barnetrygd inn,
 * felleskostnader og terminbeløp ut. Lån betales før moro, slik det gjør i
 * virkeligheten.
 */
export const STEG_ETTER_LONN: Maanedssteg[] = [stegHusholdning, stegBolig, stegLaan];

/**
 * Kjøres helt til slutt, etter at renta er lagt på. Markedet beveger seg,
 * pensjonen tjenes opp, og livet kan skje.
 */
export const STEG_ETTER_RENTE: Maanedssteg[] = [stegFond, stegBors, stegPensjon, stegHendelser];

export function kjorSteg(
    steg: Maanedssteg[],
    tilstand: Tilstand,
    kontekst: StegKontekst
): Tilstand {
    let t = tilstand;
    for (const s of steg) t = s(t, kontekst);
    return t;
}
