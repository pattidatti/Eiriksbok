// Lydene i Tinghuset, laget med arkadeskallets synth (ingen lydfiler). Papir, blyant,
// stempeldunk og skrivemaskin - dempet og alvorlig. Lyden bekrefter, den dominerer ikke.

import type { ArcadeSynth } from '../arcade/synth';

export function makeSfx(s: ArcadeSynth) {
    let lastScratch = 0;
    return {
        /** Mappa løftes. */
        pick: () => s.noise(0.04, 0.05, 2600),
        /** Blyanten skraper mens streken dras (strupet). */
        scratch: (now: number) => {
            if (now - lastScratch < 0.07) return;
            lastScratch = now;
            s.noise(0.05, 0.025, 5200 + Math.random() * 1500);
        },
        /** Streken er satt, mappa glir. */
        send: () => {
            s.noise(0.16, 0.05, 1800);
            s.tone(320, 210, 0.16, 'triangle', 0.03);
        },
        /** Stempelet slår ned. */
        thud: (heavy = false) => {
            s.tone(heavy ? 110 : 150, 48, heavy ? 0.18 : 0.12, 'sine', heavy ? 0.3 : 0.22);
            s.noise(0.05, heavy ? 0.14 : 0.1, 700);
        },
        /** Dommen er skrevet i protokollen: skrivemaskinens klokke. */
        bell: () => s.tone(1760, 1760, 0.22, 'sine', 0.04, 0.06),
        /** En tast på skrivemaskinen. */
        key: () => s.noise(0.018, 0.035, 2400 + Math.random() * 800),
        /** Jevnt par: en rolig, ren klang som stiger med multiplikatoren. */
        even: (mult: number) =>
            s.arp(392 * Math.pow(2, Math.min(9, mult - 1) / 12), [0, 4, 7], 0.07, 0.05),
        /** Ulikt par: to toner som skurrer. */
        uneven: () => {
            s.tone(233, 220, 0.4, 'square', 0.035);
            s.tone(247, 240, 0.4, 'square', 0.03, 0.02);
            s.tone(130, 50, 0.16, 'sine', 0.25, 0.22);
        },
        /** Forelegg på en alvorlig sak: en lav, rå tone. */
        mild: () => {
            s.tone(98, 70, 0.45, 'sawtooth', 0.06);
            s.noise(0.3, 0.06, 300, 0.05);
        },
        /** En sak uten lov avvises: et lyst, tørt stempel og en mumling utenfra. */
        dismiss: () => {
            s.tone(660, 520, 0.12, 'triangle', 0.035);
            s.noise(0.5, 0.025, 320, 0.08);
        },
        /** Kalenderbladet rives av. */
        tear: () => s.noise(0.12, 0.05, 4200),
        /** Straffenivået faller ett trinn. */
        step: () => {
            s.tone(330, 320, 0.5, 'triangle', 0.05);
            s.tone(140, 55, 0.14, 'sine', 0.2);
        },
        /** Kortene legges fram. */
        cards: () => {
            s.noise(0.08, 0.05, 3000);
            s.tone(520, 620, 0.1, 'triangle', 0.04, 0.05);
        },
        /** Murringen i gatene når sinnet er høyt. */
        crowd: (level: number) => s.noise(0.9, 0.012 + level * 0.03, 260 + level * 120),
        /** Ny side i protokollen. */
        page: () => s.noise(0.2, 0.05, 2200),
        win: () => s.arp(262, [0, 4, 7, 12, 16], 0.14, 0.06),
        lose: () => {
            s.tone(196, 98, 0.9, 'triangle', 0.08);
            s.noise(0.8, 0.05, 260, 0.1);
        },
    };
}

export type Sfx = ReturnType<typeof makeSfx>;
