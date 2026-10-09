// Lydene i Underskriftsrittet, bygd på arkadeskallets synth (Web Audio, felles lydav).
// Hovslag i takt med hesten, pennekrafs for hvert navn, døra som slås opp når en lykt tennes,
// dunket når seglet trykkes, hjerteslag i lyset, og stillheten i epilogen.

import type { ArcadeSynth } from '../arcade/synth';

export function lagLyd(s: ArcadeSynth) {
    return {
        /** Ett hovslag. Hardere i galopp. */
        hov: (galopp: number) => s.noise(0.04, 0.035 + galopp * 0.04, 380 + galopp * 220),
        /** Pennen skraper: høyere og lysere for et dristig navn. */
        navn: (dristig: boolean) => {
            s.noise(0.05, dristig ? 0.07 : 0.045, dristig ? 5200 : 3600);
            if (dristig) s.tone(990, 1320, 0.08, 'triangle', 0.035);
        },
        /** En dør slås opp og en lykt tennes. */
        lykt: () => {
            s.noise(0.12, 0.16, 180);
            s.tone(140, 90, 0.18, 'square', 0.07);
            s.tone(520, 760, 0.14, 'triangle', 0.04, 0.12);
        },
        /** Dragonen: hovtordenen og et horn. */
        dragon: () => {
            s.tone(220, 330, 0.3, 'sawtooth', 0.06);
            s.tone(330, 440, 0.3, 'sawtooth', 0.05, 0.25);
            for (let k = 0; k < 4; k++) s.noise(0.05, 0.1, 300, 0.1 + k * 0.12);
        },
        /** Seglet trykkes: et dypt dunk og en ren tone. */
        segl: () => {
            s.tone(110, 55, 0.3, 'sine', 0.25);
            s.noise(0.08, 0.2, 260);
            s.arp(392, [0, 4, 7], 0.08, 0.06);
        },
        /** Lyset nærmer seg å fange deg. */
        hjerte: () => {
            s.tone(70, 50, 0.12, 'sine', 0.2);
            s.tone(66, 48, 0.1, 'sine', 0.14, 0.16);
        },
        fanget: () => {
            s.noise(0.3, 0.18, 220);
            s.tone(330, 110, 0.9, 'sawtooth', 0.08);
        },
        funn: () => s.arp(523, [0, 7, 12], 0.07, 0.05),
        /** Kommisjonen er satt ned. */
        seier: () => s.arp(262, [0, 4, 7, 12, 16, 19], 0.13, 0.07),
        /** En lykt i epilogen: bare et lite, stille knepp. */
        epilog: () => s.tone(880, 860, 0.06, 'sine', 0.025),
        brett: () => s.arp(196, [0, 7, 12], 0.12, 0.05),
    };
}

export type Lyd = ReturnType<typeof lagLyd>;
