import * as THREE from 'three';
import { dayPhase, noonElevation, weatherOf, type Game } from './game';

// Miljøet i 3D-scenen - sol, himmel, tåke, storm og bølger - utledet fra spillet
// hvert bilde. Havshaderen, himmelen, skipet og kulissene leser alle det samme
// objektet, så lyset på seilet, fargen i tåka og glitret på bølgene alltid stemmer.
//
// Bølgene er Gerstner-bølger (trokoider): toppene blir spisse og dalene flate, slik
// som ekte havdønninger. Samme formel kjøres i havshaderen (GLSL) og her (JS), så
// skipet flyter på nøyaktig de bølgene eleven ser.

export interface Wave {
    dir: [number, number]; // retning bølgen går (x, z), normalisert
    len: number; // bølgelengde i meter
    amp: number; // amplitude i meter ved storm = 1
    steep: number; // Gerstner-skarphet (0-1)
}

// Dønningene kommer fra vest og sørvest og ruller østover (mot +z), altså
// skrått inn bakfra mens knarren seiler vest.
const raw: Wave[] = [
    { dir: [0.28, 1], len: 78, amp: 2.1, steep: 0.55 },
    { dir: [-0.45, 1], len: 46, amp: 1.1, steep: 0.6 },
    { dir: [0.7, 1], len: 27, amp: 0.55, steep: 0.65 },
    { dir: [-0.1, 1], len: 15, amp: 0.26, steep: 0.7 },
    { dir: [1, 0.35], len: 8.5, amp: 0.1, steep: 0.6 },
];
export const WAVES: Wave[] = raw.map((w) => {
    const l = Math.hypot(w.dir[0], w.dir[1]);
    return { ...w, dir: [w.dir[0] / l, w.dir[1] / l] };
});

export interface Env {
    time: number;
    /** 0 = blikkstille, 1 = full storm. Styrer bølgehøyde, skyer og regn. */
    storm: number;
    fog: number; // 0-1 tåketetthet
    night: number; // 0 dag - 1 natt
    flash: number; // lyn
    sunDir: THREE.Vector3;
    sunColor: THREE.Color;
    sunStrength: number;
    skyTop: THREE.Color;
    skyHorizon: THREE.Color;
    fogColor: THREE.Color;
    fogDensity: number;
    waterDeep: THREE.Color;
    waterShallow: THREE.Color;
    cloud: number; // skydekke 0-1
    /** Bølgeamplitude i meter for storm = 1 blir ganget med denne. */
    waveScale: number;
    /** Hvor skipet er i 3D (x, z) - kulissene plasseres rundt det. */
    shipX: number;
    shipZ: number;
}

export function makeEnv(): Env {
    return {
        time: 0,
        storm: 0.3,
        fog: 0,
        night: 0,
        flash: 0,
        sunDir: new THREE.Vector3(0, 0.3, 1).normalize(),
        sunColor: new THREE.Color('#fff1d6'),
        sunStrength: 1,
        skyTop: new THREE.Color('#3f6f9e'),
        skyHorizon: new THREE.Color('#c9d8e0'),
        fogColor: new THREE.Color('#c9d8e0'),
        fogDensity: 0.0004,
        waterDeep: new THREE.Color('#0b2a3a'),
        waterShallow: new THREE.Color('#2c7d86'),
        cloud: 0.25,
        waveScale: 0.45,
        shipX: 0,
        shipZ: 0,
    };
}

const C = {
    dayTop: new THREE.Color('#2f6ea8'),
    dayHor: new THREE.Color('#d6e4ea'),
    duskTop: new THREE.Color('#2a3a66'),
    duskHor: new THREE.Color('#f0a466'),
    nightTop: new THREE.Color('#050a18'),
    nightHor: new THREE.Color('#1a2638'),
    stormTop: new THREE.Color('#3a4450'),
    stormHor: new THREE.Color('#7d8a92'),
    fogCol: new THREE.Color('#b9c4c8'),
    sunDay: new THREE.Color('#fff4de'),
    sunLow: new THREE.Color('#ffb06a'),
    deep: new THREE.Color('#0a2838'),
    deepStorm: new THREE.Color('#15262c'),
    shallow: new THREE.Color('#2e8c8f'),
    shallowStorm: new THREE.Color('#3f6a66'),
};
const tmp = new THREE.Color();

/**
 * Solas retning i verden: opp i øst (bak skipet, +z), sør ved middag (babord, -x),
 * ned i vest (foran, -z). Middagshøyden følger breddegraden - kommer du nordover,
 * står sola lavere. Det er selve fagkjernen, og eleven kan se det på himmelen.
 */
export function sunDirection(phase: number, y: number, out: THREE.Vector3) {
    const day = 0.92;
    const a = (phase / day) * Math.PI;
    const maxEl = (noonElevation(y) * Math.PI) / 180;
    let el: number;
    if (phase < day) el = Math.sin(a) * maxEl - 0.03;
    else el = -Math.sin(((phase - day) / (1 - day)) * Math.PI) * 0.22 - 0.03;
    const az = phase < day ? a : Math.PI + ((phase - day) / (1 - day)) * Math.PI;
    const h = Math.cos(el);
    out.set(-Math.sin(az) * h, Math.sin(el), Math.cos(az) * h);
    return out;
}

/** Glir miljøet mot det spillet sier nå. Kalles én gang per bilde. */
export function stepEnv(env: Env, g: Game, dt: number, menu: boolean) {
    env.time += dt;
    const w = menu ? 'klart' : weatherOf(g);
    const phase = menu ? 0.8 : dayPhase(g);
    const k = Math.min(1, dt * 0.6);
    const stormT = w === 'storm' ? 1 : w === 'stille' ? 0.05 : w === 'tåke' ? 0.22 : 0.32;
    env.storm += (stormT - env.storm) * k * 0.7;
    const fogT = w === 'tåke' ? 1 : w === 'storm' ? 0.35 : 0;
    env.fog += (fogT - env.fog) * k;
    env.cloud +=
        ((w === 'storm' ? 1 : w === 'tåke' ? 0.9 : w === 'stille' ? 0.08 : 0.3) - env.cloud) * k;
    env.flash = Math.max(0, env.flash - dt * 3.5);
    env.waveScale = 0.22 + env.storm * 0.95;

    sunDirection(phase, menu ? 0 : g.y, env.sunDir);
    const el = env.sunDir.y;
    const dayK = THREE.MathUtils.smoothstep(el, -0.12, 0.12);
    const low = 1 - THREE.MathUtils.smoothstep(el, 0.02, 0.35);
    env.night = 1 - dayK;

    // Himmelen: dag -> skumring -> natt, trukket mot grått i storm og tåke.
    env.skyTop.copy(C.nightTop).lerp(tmp.copy(C.dayTop).lerp(C.duskTop, low * 0.6), dayK);
    env.skyHorizon.copy(C.nightHor).lerp(tmp.copy(C.dayHor).lerp(C.duskHor, low * 0.85), dayK);
    const grey = Math.min(1, Math.max(0, env.cloud - 0.2) * 0.9 + env.fog * 0.4);
    env.skyTop.lerp(tmp.copy(C.stormTop).multiplyScalar(0.25 + 0.75 * dayK), grey * 0.85);
    env.skyHorizon.lerp(tmp.copy(C.stormHor).multiplyScalar(0.25 + 0.75 * dayK), grey * 0.8);
    env.fogColor
        .copy(env.skyHorizon)
        .lerp(tmp.copy(C.fogCol).multiplyScalar(0.3 + 0.7 * dayK), env.fog);
    if (env.flash > 0) {
        env.skyTop.lerp(tmp.set('#dfe8ff'), env.flash * 0.6);
        env.skyHorizon.lerp(tmp.set('#dfe8ff'), env.flash * 0.5);
    }
    env.fogDensity = 0.00022 + env.fog * 0.0105 + env.storm * 0.0011;

    env.sunColor.copy(C.sunDay).lerp(C.sunLow, low);
    env.sunStrength = dayK * (1 - env.cloud * 0.55) * (1 - env.fog * 0.5);

    env.waterDeep
        .copy(C.deep)
        .lerp(C.deepStorm, env.storm)
        .multiplyScalar(0.35 + 0.65 * dayK);
    env.waterShallow
        .copy(C.shallow)
        .lerp(C.shallowStorm, env.storm)
        .multiplyScalar(0.3 + 0.7 * dayK);
}

// --- Bølgehøyde i JS (samme som havshaderen) ---

const G = 9.81;
const K = WAVES.map((w) => (2 * Math.PI) / w.len);
const SPEED = K.map((k) => Math.sqrt(G / k));

/**
 * Havoverflaten i punktet (x, z). Gerstner flytter vannet sidelengs også, så vi
 * gjør to runder med fikspunkt-iterasjon for å finne høyden rett under punktet.
 */
export function waveHeight(x: number, z: number, t: number, scale: number): number {
    let px = x;
    let pz = z;
    for (let it = 0; it < 2; it++) {
        let dx = 0;
        let dz = 0;
        for (let i = 0; i < WAVES.length; i++) {
            const w = WAVES[i];
            const a = w.amp * scale;
            const f = K[i] * (w.dir[0] * px + w.dir[1] * pz - SPEED[i] * t);
            const q = w.steep / (K[i] * a * WAVES.length + 1e-6);
            const c = Math.cos(f) * Math.min(q, 1) * a;
            dx += w.dir[0] * c;
            dz += w.dir[1] * c;
        }
        px = x - dx;
        pz = z - dz;
    }
    let y = 0;
    for (let i = 0; i < WAVES.length; i++) {
        const w = WAVES[i];
        y += w.amp * scale * Math.sin(K[i] * (w.dir[0] * px + w.dir[1] * pz - SPEED[i] * t));
    }
    return y;
}
