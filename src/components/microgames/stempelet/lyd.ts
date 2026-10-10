// Lydene i Stempelet, bygd på arkadeskallets synth: tungt dunk når stempelet treffer, mynter
// som klirrer, papir som rives av kalenderen, og en stille, lav tone når noen mister papirene.
// Ingen morsomme lyder: tonen er alvorlig.

import type { ArcadeSynth } from '../arcade/synth';

export function lagLyd(s: ArcadeSynth) {
    const klirr = (n: number, høy: boolean, delay = 0) => {
        for (let i = 0; i < Math.min(n, 8); i++) {
            const f = (høy ? 2600 : 1900) + ((i * 137) % 400);
            s.tone(f, f * 1.02, 0.07, 'triangle', 0.07, delay + i * 0.07);
            s.tone(f * 1.5, f * 1.5, 0.04, 'sine', 0.035, delay + i * 0.07 + 0.01);
        }
    };
    return {
        /** Fullt KLONK: dypt dunk i bordet, et treslag og en klang i nikkel. */
        klonk: () => {
            s.noise(0.09, 0.55, 260);
            s.tone(120, 48, 0.22, 'sine', 0.55);
            s.tone(240, 150, 0.06, 'triangle', 0.18);
            s.tone(1400, 1350, 0.12, 'sine', 0.03, 0.02);
        },
        /** Skjevt slag: lettere og matt. */
        skjevt: () => {
            s.noise(0.07, 0.3, 420);
            s.tone(170, 110, 0.12, 'sine', 0.28);
        },
        /** Stempelet i bordet uten pass. */
        bom: () => {
            s.noise(0.06, 0.22, 200);
            s.tone(95, 70, 0.1, 'sine', 0.2);
        },
        /** Armen løfter stempelet. */
        løft: () => s.tone(180, 260, 0.3, 'sine', 0.03),
        /** Mynter inn i kassa. */
        inn: (n: number) => klirr(n, true, 0.42),
        /** Mynter ut av kassa. */
        ut: (n: number) => klirr(n, false, 0.05),
        /** Husleia: myntene faller ned i hullene på regningen. */
        husleie: (n: number) => klirr(n, false, 0.1),
        /** Gyldig pass eller ikke nok i kassa: en tørr, kort tone. */
        nei: () => s.tone(220, 200, 0.12, 'square', 0.04),
        /** Noen mistet papirene: en stille, lav tone. */
        papirløs: () => {
            s.tone(196, 185, 1.4, 'sine', 0.09);
            s.tone(233, 220, 1.4, 'sine', 0.05, 0.05);
        },
        /** Kalenderen rives av. */
        nyttÅr: () => {
            s.noise(0.22, 0.18, 3200);
            s.tone(523, 523, 0.5, 'sine', 0.05, 0.15);
        },
        /** Frimerkearket kommer eller blir slått. */
        papir: () => s.noise(0.16, 0.14, 2400),
        /** To pass går ut samtidig. */
        dilemma: () => {
            s.tone(660, 660, 0.08, 'sine', 0.07);
            s.tone(660, 660, 0.08, 'sine', 0.07, 0.16);
        },
        /** Bølgen fra Saar: mange pass legges på bordet. */
        bølge: () => {
            for (let i = 0; i < 3; i++) s.noise(0.12, 0.14, 1800, i * 0.18);
        },
        seier: () => s.arp(262, [0, 4, 7, 12, 16], 0.16, 0.08),
        tap: () => {
            s.tone(220, 110, 1.2, 'sine', 0.12);
            s.tone(165, 82, 1.4, 'sine', 0.08, 0.2);
        },
    };
}

export type Lyd = ReturnType<typeof lagLyd>;
