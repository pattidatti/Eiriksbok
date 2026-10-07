// Lyden i Gamma, bygd på arkadeskallets synth. Motorduren til patruljebåten er en levende
// lyd som skrus opp og ned; resten er korte støt. Lydav i skallet stopper alt.

import type { ArcadeSynth } from '../arcade/synth';

export interface Lyd {
    /** Kubben lander på bålet: dunk og sus. */
    dunk: () => void;
    /** Knitring mens bålet brenner. */
    knitre: () => void;
    /** Ved mot ved: plukke opp eller legge i stabelen. */
    klakk: (høy?: boolean) => void;
    /** Lyskasteren tennes. */
    klikk: () => void;
    /** Lyset gikk rett forbi: et tungt hjerteslag. */
    hjerte: () => void;
    tom: () => void;
    tap: () => void;
    seier: () => void;
    /** Motorduren, 0 = stille, 1 = båten er her. */
    motor: (nivå: number) => void;
    stopp: () => void;
}

interface Motor {
    oscs: OscillatorNode[];
    g: GainNode;
}

export function lagLyd(synth: ArcadeSynth): Lyd {
    let m: Motor | null = null;

    const drep = () => {
        if (!m) return;
        const c = synth.context();
        const t = c ? c.ac.currentTime : 0;
        try {
            m.g.gain.setTargetAtTime(0, t, 0.05);
            m.oscs.forEach((o) => o.stop(t + 0.3));
        } catch {
            // allerede stoppet
        }
        m = null;
    };

    const bygg = (ac: AudioContext, out: AudioNode): Motor => {
        // Dieselmotor: to lave, skjeve toner gjennom et lavpass, med en puls (dunk-dunk).
        const f = ac.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 240;
        const am = ac.createGain();
        am.gain.value = 0.55;
        const g = ac.createGain();
        g.gain.value = 0;
        const o1 = ac.createOscillator();
        o1.type = 'sawtooth';
        o1.frequency.value = 46;
        const o2 = ac.createOscillator();
        o2.type = 'square';
        o2.frequency.value = 69.5;
        const lfo = ac.createOscillator();
        lfo.frequency.value = 6.5;
        const dybde = ac.createGain();
        dybde.gain.value = 0.45;
        lfo.connect(dybde);
        dybde.connect(am.gain);
        o1.connect(f);
        o2.connect(f);
        f.connect(am);
        am.connect(g);
        g.connect(out);
        const t = ac.currentTime;
        o1.start(t);
        o2.start(t);
        lfo.start(t);
        return { oscs: [o1, o2, lfo], g };
    };

    return {
        dunk: () => {
            synth.tone(150, 70, 0.14, 'triangle', 0.32);
            synth.noise(0.45, 0.09, 700, 0.03);
            synth.noise(0.25, 0.05, 2400, 0.08);
        },
        knitre: () => synth.noise(0.04, 0.05 + Math.random() * 0.05, 2500 + Math.random() * 2500),
        klakk: (høy = false) => {
            synth.tone(høy ? 520 : 380, høy ? 420 : 300, 0.05, 'triangle', 0.16);
            synth.tone(høy ? 640 : 460, høy ? 520 : 360, 0.05, 'triangle', 0.12, 0.06);
        },
        klikk: () => {
            synth.noise(0.03, 0.3, 5000);
            synth.tone(1800, 1200, 0.03, 'square', 0.08);
            synth.noise(0.6, 0.05, 300, 0.04);
        },
        hjerte: () => {
            synth.tone(70, 45, 0.16, 'sine', 0.4);
            synth.tone(64, 40, 0.18, 'sine', 0.3, 0.22);
        },
        tom: () => synth.tone(200, 120, 0.12, 'square', 0.08),
        tap: () => {
            synth.tone(220, 110, 0.9, 'triangle', 0.18);
            synth.tone(165, 82, 1.1, 'triangle', 0.14, 0.15);
        },
        seier: () => synth.arp(330, [0, 4, 7, 12], 0.16, 0.06),
        motor: (nivå: number) => {
            const c = synth.context();
            if (!c) {
                drep();
                return;
            }
            if (!m) {
                if (nivå <= 0.01) return;
                m = bygg(c.ac, c.out);
            }
            m.g.gain.setTargetAtTime(Math.max(0, nivå) * 0.16, c.ac.currentTime, 0.25);
        },
        stopp: drep,
    };
}
