// Lyden: brennerens sus, myntklirr, skraping mot lyngen, Ueland-trinn, valgjubel, stemt ut,
// krasj, funn og fanfare i 1884. Alt med arkadeskallets synth (felles lydav).

import type { ArcadeSynth } from '../arcade/synth';

export function lagLyd(s: ArcadeSynth) {
    let brenner = 0;
    let skrap = 0;
    return {
        /** Kalles hver ramme: sus mens du holder, knitring når du skraper. */
        løpende(dt: number, holder: boolean, iBånd: boolean, ganger: number, klaring: number) {
            brenner -= dt;
            skrap -= dt;
            if (holder && brenner <= 0) {
                brenner = 0.11;
                s.noise(0.16, 0.05, 520);
            }
            if (iBånd && klaring < 30 && skrap <= 0) {
                skrap = 0.14 - Math.min(0.08, ganger * 0.015);
                s.noise(0.05, 0.035 + ganger * 0.006, 3200 + Math.random() * 1500);
            }
        },
        klirr() {
            const f = 2100 + Math.random() * 600;
            s.tone(f, f * 1.02, 0.05, 'triangle', 0.035);
        },
        spart() {
            s.tone(1700, 2400, 0.07, 'triangle', 0.04);
        },
        ganger(n: number) {
            s.arp(392 + n * 40, [0, 4, 7, 12].slice(0, Math.min(4, n)), 0.05, 0.06);
        },
        gangerNed() {
            s.tone(330, 260, 0.12, 'sine', 0.04);
        },
        valg() {
            s.noise(0.5, 0.06, 1400);
            s.arp(523, [0, 4, 7, 12], 0.07, 0.06);
        },
        vinker() {
            s.tone(440, 520, 0.12, 'triangle', 0.04);
        },
        stemtUt() {
            s.tone(330, 220, 0.25, 'sawtooth', 0.05);
            s.tone(262, 165, 0.4, 'sawtooth', 0.05, 0.2);
        },
        krasj() {
            s.noise(0.45, 0.14, 300);
            s.tone(120, 50, 0.4, 'square', 0.06);
        },
        nesten() {
            s.noise(0.08, 0.05, 5000);
        },
        funn() {
            s.arp(660, [0, 5, 9, 12, 16], 0.06, 0.06);
        },
        hatt() {
            s.tone(200, 150, 0.18, 'square', 0.035);
        },
        under() {
            s.arp(587, [0, 7, 12], 0.05, 0.06);
        },
        seier() {
            s.arp(392, [0, 4, 7, 12, 16, 19, 24], 0.11, 0.08);
            s.noise(0.9, 0.05, 1600, 0.4);
        },
        start() {
            s.tone(260, 520, 0.14, 'triangle', 0.08);
        },
    };
}

export type Lyd = ReturnType<typeof lagLyd>;
