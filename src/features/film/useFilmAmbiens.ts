import { useEffect, useRef } from 'react';
import type { FilmManus, FilmLyd } from './types';

/**
 * Bakgrunnslyden i filmen: svak lyd fra stedet (hav, vind, ild ...) under fortellerstemmen,
 * og et dypt, mykt slag når et nytt kapittel starter. Alt lages i nettleseren med Web
 * Audio (filtrert støy og sinustoner), så det finnes ingen lydfiler å laste eller lisensiere.
 *
 * Lyden settes per scene med `lyd` i manuset og gjelder til en senere scene setter en
 * annen. «stille» skrur den av. Uten `lyd` noe sted får filmen bare kapittelslagene.
 *
 * Nivået er lavt med vilje: stemmen skal alltid være det eleven hører. Lyden følger
 * pause og avspilling, og kan skrus av for seg (knappen i kontrollinja).
 */

const NIVAA = 0.05;
const KAPITTEL_NIVAA = 0.16;
const OVERGANG_S = 1.6;

type Lydmotor = {
    ctx: AudioContext;
    master: GainNode;
    stoy: AudioBuffer;
    aktiv: { lyd: FilmLyd; stopp: (naar: number) => void } | null;
};

/** To sekunder brun støy (dyp, myk) som spilles i løkke. */
function lagStoy(ctx: AudioContext) {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let sist = 0;
    for (let i = 0; i < len; i++) {
        const hvit = Math.random() * 2 - 1;
        sist = (sist + 0.02 * hvit) / 1.02;
        d[i] = sist * 3.5;
    }
    return buf;
}

/** Bygger én lyd og returnerer en funksjon som toner den ut og stopper den. */
function startLyd(m: Lydmotor, lyd: FilmLyd) {
    const { ctx } = m;
    const naa = ctx.currentTime;
    const ut = ctx.createGain();
    ut.gain.setValueAtTime(0, naa);
    ut.gain.linearRampToValueAtTime(1, naa + OVERGANG_S);
    ut.connect(m.master);
    const kilder: AudioScheduledSourceNode[] = [];
    let tikker: ReturnType<typeof setInterval> | null = null;

    const stoy = (filter: BiquadFilterType, frekvens: number, q = 0.7, styrke = 1) => {
        const src = ctx.createBufferSource();
        src.buffer = m.stoy;
        src.loop = true;
        src.loopStart = Math.random();
        const f = ctx.createBiquadFilter();
        f.type = filter;
        f.frequency.value = frekvens;
        f.Q.value = q;
        const g = ctx.createGain();
        g.gain.value = styrke;
        src.connect(f).connect(g).connect(ut);
        src.start(naa, Math.random());
        kilder.push(src);
        return { f, g };
    };
    /** Langsom bølge på en parameter (bølger som slår inn, vindkast). */
    const lfo = (param: AudioParam, hz: number, dybde: number) => {
        const o = ctx.createOscillator();
        o.frequency.value = hz;
        const g = ctx.createGain();
        g.gain.value = dybde;
        o.connect(g).connect(param);
        o.start(naa);
        kilder.push(o);
    };

    switch (lyd) {
        case 'hav': {
            const { g } = stoy('lowpass', 520, 0.5, 0.8);
            lfo(g.gain, 0.11, 0.45);
            stoy('bandpass', 1400, 0.4, 0.12);
            break;
        }
        case 'vind': {
            const { f, g } = stoy('bandpass', 650, 1.4, 1.1);
            lfo(f.frequency, 0.07, 260);
            lfo(g.gain, 0.13, 0.4);
            break;
        }
        case 'storm': {
            const { f, g } = stoy('bandpass', 480, 1.0, 1.6);
            lfo(f.frequency, 0.16, 300);
            lfo(g.gain, 0.21, 0.7);
            stoy('lowpass', 160, 0.7, 1.2);
            break;
        }
        case 'regn':
            stoy('highpass', 2400, 0.5, 0.35);
            stoy('lowpass', 300, 0.5, 0.4);
            break;
        case 'ild': {
            stoy('lowpass', 260, 0.7, 0.9);
            // Knitring: korte, tilfeldige smell av lys støy.
            const knitre = () => {
                const t = ctx.currentTime + Math.random() * 0.2;
                const src = ctx.createBufferSource();
                src.buffer = m.stoy;
                const f = ctx.createBiquadFilter();
                f.type = 'highpass';
                f.frequency.value = 1800 + Math.random() * 1500;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.0001, t);
                g.gain.exponentialRampToValueAtTime(0.5 + Math.random() * 0.6, t + 0.005);
                g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04 + Math.random() * 0.05);
                src.connect(f).connect(g).connect(ut);
                src.start(t, Math.random());
                src.stop(t + 0.12);
            };
            tikker = setInterval(() => {
                if (ctx.state === 'running' && Math.random() < 0.55) knitre();
            }, 140);
            break;
        }
        case 'rom': {
            // Lav, rolig klang: to dype toner og litt luft. Til innendørs og alvor.
            for (const [hz, styrke] of [
                [55, 0.22],
                [82.4, 0.12],
            ] as const) {
                const o = ctx.createOscillator();
                o.frequency.value = hz;
                const g = ctx.createGain();
                g.gain.value = styrke;
                o.connect(g).connect(ut);
                o.start(naa);
                kilder.push(o);
                lfo(g.gain, 0.05 + hz / 2000, styrke * 0.4);
            }
            stoy('lowpass', 400, 0.5, 0.25);
            break;
        }
        case 'stille':
            break;
    }

    return (naar: number) => {
        ut.gain.cancelScheduledValues(naar);
        ut.gain.setValueAtTime(ut.gain.value, naar);
        ut.gain.linearRampToValueAtTime(0, naar + OVERGANG_S);
        if (tikker) clearInterval(tikker);
        for (const k of kilder) {
            try {
                k.stop(naar + OVERGANG_S + 0.1);
            } catch {
                // allerede stoppet
            }
        }
        setTimeout(() => ut.disconnect(), (OVERGANG_S + 0.5) * 1000);
    };
}

/** Et dypt, mykt slag: kapittelskiftet høres, ikke bare ses. */
function kapittelslag(m: Lydmotor) {
    const { ctx } = m;
    const t = ctx.currentTime + 0.05;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(92, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 1.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(KAPITTEL_NIVAA, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 2.3);
}

/** Lyden som gjelder i en scene: den nærmeste `lyd` bakover i manuset. */
export function lydFor(manus: FilmManus, scene: number): FilmLyd | null {
    for (let i = scene; i >= 0; i--) {
        const l = manus.scener[i]?.lyd;
        if (l) return l === 'stille' ? null : l;
    }
    return null;
}

export function useFilmAmbiens({
    manus,
    scene,
    spiller,
    paa,
}: {
    manus: FilmManus;
    scene: number;
    spiller: boolean;
    paa: boolean;
}) {
    const motor = useRef<Lydmotor | null>(null);
    const forrigeScene = useRef<number | null>(null);
    const lyd = lydFor(manus, scene);

    // AudioContext kan bare starte etter et klikk. Avspilling starter alltid med et klikk,
    // så motoren lages første gang filmen spiller.
    useEffect(() => {
        if (!spiller || !paa || motor.current) return;
        const Ctx =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return;
        try {
            const ctx = new Ctx();
            const master = ctx.createGain();
            master.gain.value = NIVAA;
            master.connect(ctx.destination);
            motor.current = { ctx, master, stoy: lagStoy(ctx), aktiv: null };
        } catch {
            // Ingen lyd: filmen virker like fullt.
        }
    }, [spiller, paa]);

    // Pause og av/på: hele motoren stilles, så lyden står nøyaktig der den var.
    useEffect(() => {
        const m = motor.current;
        if (!m) return;
        if (spiller && paa) void m.ctx.resume();
        else void m.ctx.suspend();
    }, [spiller, paa]);

    // Bytt lyd når scenen krever en annen.
    useEffect(() => {
        const m = motor.current;
        if (!m || !spiller || !paa) return;
        if (m.aktiv?.lyd === lyd || (!m.aktiv && !lyd)) return;
        m.aktiv?.stopp(m.ctx.currentTime);
        m.aktiv = lyd ? { lyd, stopp: startLyd(m, lyd) } : null;
    }, [lyd, spiller, paa]);

    // Kapittelslag når avspillingen går inn i et nytt kapittel (ikke ved første scene).
    useEffect(() => {
        const m = motor.current;
        const fra = forrigeScene.current;
        forrigeScene.current = scene;
        if (!m || !spiller || !paa || fra === null || fra === scene) return;
        if (scene > 0 && manus.scener[scene]?.kapittel) kapittelslag(m);
    }, [scene, spiller, paa, manus]);

    useEffect(
        () => () => {
            const m = motor.current;
            motor.current = null;
            m?.aktiv?.stopp(m.ctx.currentTime);
            void m?.ctx.close();
        },
        []
    );
}
