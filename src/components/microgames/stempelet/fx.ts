// Delt mellom visningen og komponenten: tidspunkt og sted for slag (animasjon, blekk, risting),
// kameraet (så lapper kan festes til ting på bordet), mynter i lufta og dilemmaet. Ingen React.

import * as THREE from 'three';

export interface Fx {
    /** nå() da siste slag traff, hvor, og om det var fullt. */
    slag: number;
    slagX: number;
    slagZ: number;
    slagFullt: boolean;
    /** Passet som ble truffet (id), for at passet skal dukke seg. */
    slagId: number;
    /** Slag i bordet uten pass (tomt dunk). */
    bom: number;
    /** Kameraet og lerretets størrelse (settes av Kamera i world.tsx). */
    kamera: THREE.Camera | null;
    w: number;
    h: number;
    /** Mynter som flyr nå (stabel, pass, regning). */
    flyg: Flyg[];
    /** Når husleia sist ble betalt (regningen viser myntene en liten stund). */
    betalt: number;
    betaltBeløp: number;
    /** To pass som går ut samtidig: lyses opp til `til`. */
    dilemma: number[];
    dilemmaTil: number;
    /** Pass som nettopp forlot en plass: reiste videre (glir ut over bordkanten) eller gikk ut. */
    borte: Record<number, { type: 'reist' | 'utløpt'; t: number }>;
}

export const nyFx = (): Fx => ({
    slag: -10,
    slagX: 0,
    slagZ: 0,
    slagFullt: true,
    slagId: -1,
    bom: -10,
    kamera: null,
    w: 1000,
    h: 600,
    flyg: [],
    betalt: -10,
    betaltBeløp: 0,
    dilemma: [],
    dilemmaTil: -10,
    borte: {},
});

/** Sekunder en mynt bruker i lufta. */
export const FLYTID = 0.45;
/** Hit-stop: så lenge spillet står stille når stempelet treffer (ekte sekunder). */
export const HIT_STOP = 0.07;

export const nå = () => performance.now() / 1000;

const v = new THREE.Vector3();

/** Et punkt på bordet i piksler i spillvinduet, eller null før kameraet finnes. */
export function tilSkjerm(fx: Fx, x: number, y: number, z: number) {
    if (!fx.kamera) return null;
    v.set(x, y, z).project(fx.kamera);
    if (v.z > 1) return null;
    return { x: (v.x * 0.5 + 0.5) * fx.w, y: (-v.y * 0.5 + 0.5) * fx.h };
}

/** En mynt i lufta: fra et punkt på bordet til et annet (bare visning). */
export interface Flyg {
    fx: number;
    fz: number;
    tx: number;
    tz: number;
    /** Høyden ved målet (toppen av stabelen). */
    ty: number;
    start: number;
    /** Lander mynten i stabelen? Da vises den ikke i stabelen før den er framme. */
    tilStabel: boolean;
}

/** Myntstabelen: søyler på ti, tre søyler i bredden. Midten av mynt nr. i (0 nederst). */
export const STABEL = { søyle: 10, tykk: 0.07, avstand: 0.42, bunn: 0.075 };

export function myntPlass(kx: number, kz: number, i: number) {
    const s = Math.floor(i / STABEL.søyle);
    return {
        x: kx - 0.42 + (s % 3) * STABEL.avstand,
        y: STABEL.bunn + (i % STABEL.søyle) * STABEL.tykk,
        z: kz - Math.floor(s / 3) * 0.42,
    };
}

/** Hullene på regningen: to rader på fem. Midten av hull nr. i. */
export function regningHull(rx: number, rz: number, i: number) {
    return { x: rx - 0.4 + (i % 5) * 0.2, z: rz + 0.02 + Math.floor(i / 5) * 0.2 };
}
