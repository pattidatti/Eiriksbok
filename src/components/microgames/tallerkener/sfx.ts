// Lyden i Elleve år: syngende metall når en tallerken snurres, mynter i kista,
// tinnklokka til parlamentet, trommer og torden når skottene kommer.

import { buzz, type ArcadeSynth } from '../arcade/synth';

export interface Sfx {
    /** Tallerkenen synger: høyere tone jo mer snurr (0-1,3). */
    sing: (spin: number, n: number) => void;
    kombo: (n: number) => void;
    coin: () => void;
    crash: () => void;
    clang: () => void;
    reddet: () => void;
    tittel: () => void;
    side: () => void;
    tinNed: () => void;
    parlament: () => void;
    sekk: () => void;
    protest: () => void;
    aar: () => void;
    torden: () => void;
    tromme: () => void;
    seier: () => void;
    tap: () => void;
    start: () => void;
    nyStang: () => void;
}

export function makeSfx(s: ArcadeSynth): Sfx {
    let coinAt = 0;
    const now = () => performance.now();
    // En klokke: grunntone pluss de skjeve overtonene som gir metallklang.
    const bell = (f: number, dur: number, vol: number, delay = 0) => {
        s.tone(f, f * 1.003, dur, 'sine', vol, delay);
        s.tone(f * 2.76, f * 2.77, dur * 0.6, 'sine', vol * 0.35, delay);
        s.tone(f * 5.4, f * 5.42, dur * 0.3, 'sine', vol * 0.15, delay);
    };
    return {
        sing: (spin, n) => {
            const f = 520 + Math.min(1.3, spin) * 420 + n * 40;
            bell(f, 0.55, 0.05);
            s.tone(f * 1.5, f * 1.52, 0.35, 'triangle', 0.015, 0.02);
        },
        kombo: (n) => {
            const steps = [0, 4, 7, 12, 16, 19].slice(0, Math.min(6, n + 1));
            s.arp(660, steps, 0.05, 0.035);
        },
        coin: () => {
            // Høyst tolv klirr i sekundet, ellers blir det støy.
            if (now() - coinAt < 80) return;
            coinAt = now();
            const f = 2400 + Math.random() * 900;
            s.tone(f, f * 0.96, 0.06, 'triangle', 0.018);
        },
        crash: () => {
            s.noise(0.35, 0.22, 2600);
            s.tone(330, 120, 0.3, 'triangle', 0.06);
            bell(410, 0.25, 0.03, 0.02);
            buzz(40);
        },
        clang: () => {
            bell(740, 0.5, 0.06);
            s.noise(0.25, 0.12, 4000);
            buzz(30);
        },
        reddet: () => {
            bell(990, 0.4, 0.05);
            bell(1320, 0.5, 0.04, 0.08);
        },
        tittel: () => {
            bell(880, 0.6, 0.04);
            bell(1175, 0.7, 0.035, 0.1);
        },
        side: () => s.tone(300, 360, 0.18, 'triangle', 0.03),
        tinNed: () => {
            // Tinn: matt og lav, uten gullets glans. Tauet knirker.
            s.noise(0.5, 0.05, 500);
            bell(196, 1.1, 0.05, 0.1);
        },
        parlament: () => {
            bell(147, 1.6, 0.08);
            bell(110, 1.8, 0.06, 0.25);
            s.noise(0.6, 0.08, 300, 0.1);
            buzz([40, 60, 40]);
        },
        sekk: () => {
            s.noise(0.12, 0.12, 400);
            s.tone(120, 70, 0.12, 'sine', 0.06);
        },
        protest: () => {
            s.tone(220, 208, 0.5, 'sawtooth', 0.03);
            s.tone(233, 220, 0.5, 'sawtooth', 0.025);
            s.noise(0.4, 0.05, 900);
        },
        aar: () => bell(587, 0.8, 0.035),
        torden: () => {
            s.noise(1.4, 0.18, 220);
            s.noise(0.3, 0.12, 1800);
        },
        tromme: () => {
            s.tone(90, 50, 0.18, 'sine', 0.09);
            s.noise(0.08, 0.05, 600);
        },
        seier: () => {
            s.arp(523, [0, 4, 7, 12], 0.12, 0.05);
            bell(1046, 1.4, 0.05, 0.5);
        },
        tap: () => {
            bell(392, 1.2, 0.05);
            bell(311, 1.4, 0.05, 0.35);
            bell(262, 1.8, 0.05, 0.7);
        },
        start: () => {
            s.noise(0.9, 0.05, 700);
            bell(784, 0.8, 0.04, 0.3);
        },
        nyStang: () => {
            s.tone(180, 260, 0.25, 'triangle', 0.035);
        },
    };
}
