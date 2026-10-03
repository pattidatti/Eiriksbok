// Lydene i Taburetten, bygd på arkadeskallets synth (Web Audio, felles lydav).

import type { ArcadeSynth } from '../arcade/synth';

export function lagLyd(s: ArcadeSynth) {
    return {
        /** Hendene kaster stolen: et sus oppover. */
        kast: () => {
            s.noise(0.35, 0.05, 900);
            s.tone(220, 440, 0.25, 'sine', 0.05);
        },
        /** Fin landing: mykt dunk og en klang som stiger med multiplikatoren. */
        fin: (mult: number) => {
            s.noise(0.08, 0.08, 400);
            s.tone(330 * Math.pow(1.06, mult), 660 * Math.pow(1.06, mult), 0.12, 'triangle', 0.08);
        },
        /** Klumsete dunk på oppsiden. */
        dunk: () => {
            s.noise(0.18, 0.18, 180);
            s.tone(140, 70, 0.2, 'square', 0.06);
        },
        /** Avisark: papirrasling. */
        ark: () => {
            s.noise(0.12, 0.07, 3200);
            s.noise(0.1, 0.05, 2400, 0.08);
            s.tone(880, 1320, 0.1, 'sine', 0.05, 0.05);
        },
        /** Et valgbanner ruller inn: tromme. */
        banner: () => {
            s.noise(0.1, 0.14, 120);
            s.noise(0.1, 0.12, 120, 0.16);
            s.tone(196, 196, 0.25, 'triangle', 0.06, 0.16);
        },
        /** Dommen: dyp gong. */
        dom: () => {
            s.tone(98, 92, 1.6, 'sine', 0.22);
            s.tone(147, 140, 1.2, 'triangle', 0.08);
            s.noise(0.5, 0.06, 300);
        },
        /** Perfekt bytte: «Hør, hør!» fra mengden og en stigende fanfare. */
        perfekt: (rekke: number) => {
            s.noise(0.5, 0.12, 700);
            s.arp(523 * Math.pow(1.122, Math.min(rekke - 1, 4)), [0, 4, 7, 12], 0.06, 0.1);
        },
        bytte: () => {
            s.tone(392, 523, 0.15, 'triangle', 0.08);
            s.noise(0.2, 0.06, 900);
        },
        /** Feil eller unødvendig bytte: sur nedtur. */
        feil: () => {
            s.tone(300, 150, 0.4, 'sawtooth', 0.07);
            s.noise(0.3, 0.06, 250);
        },
        /** Smell i en hindring. */
        smell: () => {
            s.noise(0.5, 0.3, 150);
            s.tone(110, 40, 0.5, 'square', 0.1);
        },
        /** Stolen treffer brosteinen. */
        gata: () => {
            s.tone(220, 55, 0.9, 'sawtooth', 0.08);
            s.noise(0.4, 0.15, 160, 0.3);
        },
        seier: () => {
            s.arp(392, [0, 4, 7, 12, 16, 19, 24], 0.09, 0.12);
            s.noise(1.2, 0.08, 700, 0.2);
        },
        klikk: () => s.tone(660, 880, 0.06, 'triangle', 0.05),
    };
}

export type Lyd = ReturnType<typeof lagLyd>;
