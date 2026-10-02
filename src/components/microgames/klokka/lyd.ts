// Lydene, bygd på arkadeskallets synth (Web Audio, ingen Tone/three).
// Rolige og tunge: tikk når en plass tennes, knirk fra taljene, plask, en klokke for en
// full båt - aldri jubel.

import type { ArcadeSynth } from '../arcade/synth';

export interface Lyd {
    tikk: () => void;
    knirk: () => void;
    plask: () => void;
    klokke: () => void;
    rakett: () => void;
    varsel: () => void;
    tapt: () => void;
    bytt: () => void;
    port: () => void;
    stuert: () => void;
    nesten: () => void;
    trinn: () => void;
    start: () => void;
}

export function lagLyd(s: ArcadeSynth): Lyd {
    let sisteTikk = 0;
    let sisteKnirk = 0;
    const nå = () => performance.now();
    return {
        tikk: () => {
            if (nå() - sisteTikk < 70) return;
            sisteTikk = nå();
            s.tone(1900 + Math.random() * 300, 1700, 0.025, 'triangle', 0.025);
        },
        knirk: () => {
            if (nå() - sisteKnirk < 230) return;
            sisteKnirk = nå();
            s.tone(170 + Math.random() * 40, 120, 0.12, 'sawtooth', 0.018);
            s.noise(0.06, 0.03, 900);
        },
        plask: () => {
            s.noise(0.7, 0.12, 380);
            s.tone(90, 50, 0.5, 'sine', 0.08);
        },
        klokke: () => {
            s.tone(660, 660, 1.6, 'sine', 0.06);
            s.tone(1320, 1320, 1.0, 'sine', 0.025, 0.01);
        },
        rakett: () => {
            s.noise(1.0, 0.05, 2400);
            s.tone(500, 1400, 1.0, 'sine', 0.015);
            s.noise(0.35, 0.09, 700, 1.1);
        },
        varsel: () => {
            s.tone(420, 420, 0.09, 'square', 0.03);
            s.tone(420, 420, 0.09, 'square', 0.03, 0.16);
        },
        tapt: () => {
            s.tone(110, 55, 1.4, 'sawtooth', 0.045);
            s.noise(0.9, 0.08, 300);
        },
        bytt: () => s.tone(280, 220, 0.07, 'triangle', 0.05),
        port: () => {
            s.tone(240, 180, 0.25, 'square', 0.025);
            s.noise(0.3, 0.05, 1200);
        },
        /** Stuerten går: raske skritt nedover. */
        stuert: () => {
            for (let i = 0; i < 4; i++) s.noise(0.05, 0.05, 600 - i * 60, i * 0.14);
            s.tone(520, 390, 0.18, 'triangle', 0.035);
        },
        /** I siste liten: to rolige toner som løser seg. */
        nesten: () => {
            s.tone(440, 440, 0.35, 'sine', 0.05);
            s.tone(587, 587, 0.9, 'sine', 0.05, 0.18);
        },
        /** Et nytt rangtrinn: tre stigende klokketoner. */
        trinn: () => {
            s.tone(523, 523, 0.9, 'sine', 0.05);
            s.tone(659, 659, 0.9, 'sine', 0.05, 0.14);
            s.tone(784, 784, 1.3, 'sine', 0.05, 0.28);
        },
        start: () => s.tone(330, 330, 0.9, 'sine', 0.05),
    };
}
