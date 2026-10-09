// Kjerneløkka i Underskriftsrittet: Lofthus rir fra bygd til bygd, samler navn ved å ri
// sakte over tunene, og hvert navn kan tenne en lykt hos fogdens menn. Ren TypeScript:
// komponenten, robotene og simuleringen kjører den samme koden.

import { BRETT, type Brett, type LyktModus } from './levels';
import {
    SISTE_BRETT,
    clamp,
    dist,
    galoppAndel,
    navneFart,
    pressFra,
    ser,
    terreng,
    vinkelDiff,
} from './rules';
import { TUNING } from './tuning';

const T = TUNING;

export type Årsak = 'lys' | 'vinter';

export interface Tun {
    navn: string;
    x: number;
    z: number;
    telemark: boolean;
    modus: LyktModus;
    /** Navn samlet her (desimaltall - hele navn teller). */
    samlet: number;
    segl: boolean;
}

export interface Lykt {
    id: number;
    x: number;
    z: number;
    modus: LyktModus;
    dragon: boolean;
    fart: number;
    /** Retningen dragonen rir (radianer). */
    retning: number;
    alder: number;
    levetid: number;
    /** Leteringen rundt stedet der det sist ble skrevet under. */
    vinkel: number;
    /** Kan fange deg (den første lykta i brett 1 står bare og lyser). */
    farlig: boolean;
    jakter: boolean;
    /** Stedet lykta går mot og leter rundt (der det ble skrevet under da den ble tent). */
    mx: number;
    mz: number;
    /** Sekunder den har lett der. Etter en stund går den videre til nyeste underskrift. */
    lett: number;
}

export type Hendelse =
    | { type: 'navn'; x: number; z: number; dristig: boolean; tun: number }
    | { type: 'lykt'; id: number; dragon: boolean }
    | { type: 'slukk'; id: number }
    | { type: 'segl'; tun: number }
    | { type: 'brett'; brett: number }
    | { type: 'tap'; årsak: Årsak }
    | { type: 'seier' };

export interface Game {
    t: number;
    /** Sekunder i dette brettet (måneden). */
    brettT: number;
    brett: number;
    mode: 'play' | 'won' | 'lost';
    årsak: Årsak | null;
    hest: { x: number; z: number; fart: number; retning: number };
    /** Det eleven holder inne: retning og styrke 0-1 (0 = slipp, hesten skritter). */
    input: { dx: number; dz: number; styrke: number };
    tun: Tun[];
    lykter: Lykt[];
    nesteId: number;
    /** Navn i klagebrevet, og hvor mange av dem som var dristige. */
    navn: number;
    dristige: number;
    segl: number;
    seglTelemark: number;
    poeng: number;
    /** Fangstringen rundt hesten, 0-1. Full = tatt. */
    fangst: number;
    sisteNavn: { x: number; z: number } | null;
    lykterIBrett: number;
    navnTider: number[];
    sisteDragon: number;
    /** Spillfølelse: beslutninger spillet har gitt eleven. */
    valg: number;
    hendelser: Hendelse[];
    rng: () => number;
}

function mulberry(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export const brettAv = (g: Game): Brett => BRETT[g.brett];

function lagTun(b: Brett): Tun[] {
    return b.bygder.map((d) => ({ ...d, samlet: 0, segl: false }));
}

function startBrett(g: Game, brett: number) {
    const b = BRETT[brett];
    g.brett = brett;
    g.brettT = 0;
    g.tun = lagTun(b);
    g.lykter = [];
    g.hest.x = b.start[0];
    g.hest.z = b.start[1];
    g.hest.fart = T.hest.skritt;
    g.hest.retning = -Math.PI / 2;
    g.fangst = 0;
    g.sisteNavn = null;
    g.lykterIBrett = 0;
    g.navnTider = [];
    g.valg += 1;
    g.hendelser.push({ type: 'brett', brett });
}

export function newGame(seed = 1, brett = 0): Game {
    const g: Game = {
        t: 0,
        brettT: 0,
        brett: 0,
        mode: 'play',
        årsak: null,
        hest: { x: 0, z: 0, fart: T.hest.skritt, retning: -Math.PI / 2 },
        input: { dx: 0, dz: 0, styrke: 0 },
        tun: [],
        lykter: [],
        nesteId: 1,
        navn: 0,
        dristige: 0,
        segl: 0,
        seglTelemark: 0,
        poeng: 0,
        fangst: 0,
        sisteNavn: null,
        lykterIBrett: 0,
        navnTider: [],
        sisteDragon: -99,
        valg: 0,
        hendelser: [],
        rng: mulberry(seed),
    };
    startBrett(g, brett);
    return g;
}

/** Grepet: hold en retning (dx, dz) med styrke 0-1, eller slipp (styrke 0). */
export function styr(g: Game, dx: number, dz: number, styrke = 1) {
    const l = Math.hypot(dx, dz);
    if (l < 1e-6 || styrke <= 0) {
        g.input.styrke = 0;
        return;
    }
    g.input.dx = dx / l;
    g.input.dz = dz / l;
    g.input.styrke = clamp(styrke, 0, 1);
}

export const alleSegl = (g: Game) => g.tun.every((t) => t.segl);
export const utÅpen = (g: Game) => alleSegl(g) && g.brett < SISTE_BRETT;
export const månedAndel = (g: Game) => clamp(g.brettT / brettAv(g).sekunder, 0, 1);

function rir(g: Game, dt: number) {
    const h = g.hest;
    const b = brettAv(g);
    const inp = g.input;
    const ga = galoppAndel(h.fart);
    if (inp.styrke > 0) {
        const ønsket = Math.atan2(inp.dz, inp.dx);
        const diff = vinkelDiff(h.retning, ønsket);
        const sving = T.hest.svingSkritt + (T.hest.svingGalopp - T.hest.svingSkritt) * ga;
        h.retning += clamp(diff, -sving * dt, sving * dt);
        const mål = T.hest.skritt + (T.hest.galopp - T.hest.skritt) * inp.styrke;
        h.fart += clamp(mål - h.fart, -T.hest.brems * dt, T.hest.aksel * dt);
        h.fart -= T.hest.svingBrems * Math.min(1.5, Math.abs(diff)) * h.fart * dt;
        h.fart = Math.max(T.hest.skritt * 0.6, h.fart);
    } else {
        h.fart += clamp(T.hest.skritt - h.fart, -T.hest.brems * dt, T.hest.aksel * dt);
    }
    const v = h.fart * terreng(b, h.x, h.z);
    h.x = clamp(h.x + Math.cos(h.retning) * v * dt, -T.grense, T.grense);
    h.z = clamp(h.z + Math.sin(h.retning) * v * dt, -T.grense, T.grense);
}

function tennLykt(g: Game, dragon: boolean, modus: LyktModus) {
    if (g.lykter.length >= T.lykt.maks) return;
    const b = brettAv(g);
    const fra = g.sisteNavn ?? g.hest;
    let x: number;
    let z: number;
    if (dragon) {
        [x, z] = b.vei[0];
    } else {
        const a = g.rng() * Math.PI * 2;
        const d = T.lykt.tennMin + g.rng() * (T.lykt.tennMax - T.lykt.tennMin);
        x = clamp(fra.x + Math.cos(a) * d, -T.grense, T.grense);
        z = clamp(fra.z + Math.sin(a) * d, -T.grense, T.grense);
    }
    const l: Lykt = {
        id: g.nesteId++,
        x,
        z,
        modus,
        dragon,
        fart: dragon ? T.dragon.fart : modus === 'står' ? 0 : b.lyktFart,
        retning: Math.atan2(g.hest.z - z, g.hest.x - x),
        alder: 0,
        levetid: dragon ? T.dragon.levetid : T.lykt.levetid,
        vinkel: g.rng() * Math.PI * 2,
        farlig: !(b.trygt && g.lykterIBrett === 0),
        jakter: false,
        mx: fra.x,
        mz: fra.z,
        lett: 0,
    };
    g.lykterIBrett += 1;
    g.lykter.push(l);
    g.valg += 1;
    g.hendelser.push({ type: 'lykt', id: l.id, dragon });
}

function nyttNavn(g: Game, i: number) {
    const tun = g.tun[i];
    const b = brettAv(g);
    const h = g.hest;
    const k = Math.floor(tun.samlet);
    const dristig = g.lykter.some((l) => dist(l.x, l.z, h.x, h.z) < T.dristig * T.lykt.lys);
    g.navn += 1;
    if (dristig) g.dristige += 1;
    g.poeng += dristig ? T.poeng.dristig : T.poeng.navn;
    g.sisteNavn = { x: h.x, z: h.z };
    g.navnTider.push(g.t);
    g.hendelser.push({ type: 'navn', x: h.x, z: h.z, dristig, tun: i });

    // Fagkjernen: å samle bønder til møter var oppvigleri. Navnene tenner fogdens lykter.
    if (k === b.førsteLykt || (k > b.førsteLykt && (k - b.førsteLykt) % b.navnPerLykt === 0))
        tennLykt(g, false, tun.modus);

    if (b.dragoner) {
        while (g.navnTider.length && g.navnTider[0] < g.t - T.dragon.vindu) g.navnTider.shift();
        if (g.navnTider.length >= T.dragon.navn && g.t - g.sisteDragon > T.dragon.pause) {
            g.sisteDragon = g.t;
            g.navnTider = [];
            tennLykt(g, true, 'leter');
        }
    }

    if (k >= T.tun.seglVed && !tun.segl) {
        tun.segl = true;
        g.segl += 1;
        if (tun.telemark) g.seglTelemark += 1;
        g.poeng += T.poeng.segl;
        g.valg += 1;
        g.hendelser.push({ type: 'segl', tun: i });
        // Fagkjernen: mange bygder fra både Agder og Telemark = kommisjonen.
        if (g.segl >= T.kommisjon.segl && g.seglTelemark >= T.kommisjon.telemark) {
            g.poeng += T.poeng.kommisjon;
            g.mode = 'won';
            g.lykter = [];
            g.hendelser.push({ type: 'seier' });
        }
    }
}

function samler(g: Game, dt: number) {
    const h = g.hest;
    g.tun.forEach((tun, i) => {
        if (tun.segl || g.mode !== 'play') return;
        const r = navneFart(dist(h.x, h.z, tun.x, tun.z), h.fart);
        if (r <= 0) return;
        const før = Math.floor(tun.samlet);
        tun.samlet = Math.min(T.tun.seglVed, tun.samlet + r * dt);
        for (let k = før + 1; k <= Math.floor(tun.samlet) && g.mode === 'play'; k++) {
            tun.samlet = Math.max(tun.samlet, k);
            nyttNavn(g, i);
        }
    });
}

function flytt(l: Lykt, mx: number, mz: number, dt: number) {
    const d = dist(l.x, l.z, mx, mz);
    if (d < 1e-4) return;
    const s = Math.min(d, l.fart * dt);
    l.x += ((mx - l.x) / d) * s;
    l.z += ((mz - l.z) / d) * s;
}

function lykteneGår(g: Game, dt: number) {
    const b = brettAv(g);
    const h = g.hest;
    const nyest = g.sisteNavn ?? h;
    for (const l of g.lykter) {
        const mål = { x: l.mx, z: l.mz };
        l.alder += dt;
        if (l.dragon) {
            // Dragonen rir mot deg når den ser deg, ellers mot siste underskrift. Svinger dårlig.
            l.jakter = ser(b, l.x, l.z, h.x, h.z, T.dragon.ser);
            const tx = l.jakter ? h.x : nyest.x;
            const tz = l.jakter ? h.z : nyest.z;
            const ønsket = Math.atan2(tz - l.z, tx - l.x);
            const diff = vinkelDiff(l.retning, ønsket);
            l.retning += clamp(diff, -T.dragon.sving * dt, T.dragon.sving * dt);
            l.x = clamp(l.x + Math.cos(l.retning) * l.fart * dt, -T.grense, T.grense);
            l.z = clamp(l.z + Math.sin(l.retning) * l.fart * dt, -T.grense, T.grense);
            continue;
        }
        if (l.modus === 'står') continue;
        l.jakter = l.modus === 'leter' && ser(b, l.x, l.z, h.x, h.z, T.lykt.ser);
        if (l.jakter) {
            flytt(l, h.x, h.z, dt);
            continue;
        }
        const d = dist(l.x, l.z, mål.x, mål.z);
        if (d > T.lykt.leteRadius + 0.5 || l.modus === 'går') {
            flytt(l, mål.x, mål.z, dt);
            continue;
        }
        l.lett += dt;
        if (l.lett > T.lykt.leteTid && dist(l.mx, l.mz, nyest.x, nyest.z) > T.lykt.leteRadius) {
            // Ingen her lenger: gå videre dit det sist ble skrevet under.
            l.mx = nyest.x;
            l.mz = nyest.z;
            l.lett = 0;
        }
        // Framme: let i en vid sløyfe rundt stedet.
        // Sløyfen går inn over midten og ut igjen, så ingen plass på tunet er trygg lenge.
        const r = T.lykt.leteRadius * (0.2 + 0.8 * (0.5 + 0.5 * Math.sin(l.alder * T.lykt.sløyfe)));
        l.vinkel += (l.fart / T.lykt.leteRadius) * dt;
        flytt(l, mål.x + Math.cos(l.vinkel) * r, mål.z + Math.sin(l.vinkel) * r, dt);
    }
    const før = g.lykter.length;
    g.lykter = g.lykter.filter((l) => {
        if (l.alder < l.levetid) return true;
        g.hendelser.push({ type: 'slukk', id: l.id });
        return false;
    });
    g.valg += før - g.lykter.length;
}

export function iLyset(g: Game): boolean {
    const h = g.hest;
    return g.lykter.some(
        (l) => l.farlig && dist(l.x, l.z, h.x, h.z) < (l.dragon ? T.dragon.lys : T.lykt.lys)
    );
}

function fangsten(g: Game, dt: number) {
    if (iLyset(g)) g.fangst += dt / brettAv(g).fangTid;
    else g.fangst -= T.fangst.tømming * dt;
    g.fangst = clamp(g.fangst, 0, 1);
    if (g.fangst >= 1) {
        g.mode = 'lost';
        g.årsak = 'lys';
        g.hendelser.push({ type: 'tap', årsak: 'lys' });
    }
}

function måneden(g: Game) {
    const b = brettAv(g);
    const h = g.hest;
    if (utÅpen(g) && dist(h.x, h.z, b.ut[0], b.ut[1]) < 3) {
        startBrett(g, g.brett + 1);
        return;
    }
    if (g.brettT < b.sekunder) return;
    if (g.brett < SISTE_BRETT) startBrett(g, g.brett + 1);
    else {
        g.mode = 'lost';
        g.årsak = 'vinter';
        g.hendelser.push({ type: 'tap', årsak: 'vinter' });
    }
}

export function update(g: Game, dt: number) {
    if (g.mode !== 'play') return;
    g.t += dt;
    g.brettT += dt;
    rir(g, dt);
    samler(g, dt);
    if (g.mode !== 'play') return;
    lykteneGår(g, dt);
    fangsten(g, dt);
    if (g.mode !== 'play') return;
    måneden(g);
}

export function lykterNær(g: Game, r = 15): number {
    return g.lykter.filter((l) => dist(l.x, l.z, g.hest.x, g.hest.z) < r).length;
}

export function press(g: Game): number {
    return pressFra(g.brett, lykterNær(g), g.fangst, månedAndel(g));
}
