// Lydene: fabrikkfløyta og silketrykk-klasket for hvert ledd, krasjet, GRENELLE-fanfaren,
// bølgens varsel og byks, og slutten. Bygget på arkadeskallets synth (felles lydav).

import type { ArcadeSynth } from '../arcade/synth';

export interface Sfx {
    hekt: (n: number, x2: boolean) => void;
    krasj: () => void;
    grenelle: () => void;
    varsel: () => void;
    byks: () => void;
    spist: () => void;
    avslutt: () => void;
    seier: () => void;
    tap: () => void;
    brett: () => void;
    start: () => void;
}

export function lagSfx(sy: ArcadeSynth): Sfx {
    return {
        // Fløyta stiger litt for hver fabrikk på rad, så en lang kjede høres ut som en sang.
        hekt: (n, x2) => {
            const f = 660 * Math.pow(2, Math.min(12, n) / 24);
            sy.tone(f, f * 1.5, 0.09, 'triangle', 0.09);
            sy.tone(f * 1.5, f * 1.42, 0.16, 'sine', 0.07, 0.08);
            sy.noise(0.07, 0.22, 1400);
            if (x2) sy.arp(f, [0, 7, 12], 0.05, 0.06);
        },
        krasj: () => {
            sy.tone(320, 80, 0.32, 'sawtooth', 0.09);
            sy.noise(0.22, 0.3, 500);
        },
        grenelle: () => sy.arp(392, [0, 4, 7, 12], 0.09, 0.09),
        varsel: () => {
            sy.tone(220, 220, 0.07, 'square', 0.05);
            sy.tone(220, 220, 0.07, 'square', 0.05, 0.16);
        },
        byks: () => {
            sy.noise(0.3, 0.22, 260);
            sy.tone(150, 60, 0.32, 'triangle', 0.12);
        },
        spist: () => sy.tone(300, 240, 0.05, 'triangle', 0.035),
        avslutt: () => {
            sy.noise(0.12, 0.3, 900);
            sy.arp(523, [0, 4, 7], 0.07, 0.08);
        },
        seier: () => sy.arp(523, [0, 4, 7, 12, 16, 19], 0.09, 0.1),
        tap: () => {
            sy.tone(330, 110, 0.7, 'triangle', 0.1);
            sy.tone(247, 82, 0.7, 'sine', 0.06, 0.12);
        },
        brett: () => {
            sy.noise(0.18, 0.25, 1000);
            sy.arp(440, [0, 5, 9], 0.08, 0.07);
        },
        start: () => sy.tone(260, 520, 0.14, 'triangle', 0.09),
    };
}
