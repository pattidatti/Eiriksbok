// Koggen: hansaens typiske lasteskip [V SNL «kogge»]. Flat bunn, høye, rette sider (U-formet
// midtskips), rette stavner som heller kraftig ut, én mast med råseil, roret på akterstevnen og
// kasteller forut og akter [V SNL «kogge»]. Mastekurven (utkikkskurven) i masta er også nevnt
// der [V].
//
// Målene: SNL sier at de største koggene kan ha vært 80-100 fot lange, med forhold mellom bredde
// og lengde på ca. 1:3 til 1:4 [V]. Denne er 23 m lang og 7,2 m bred [S], innenfor det. Høyden på
// masta, kastellene og fribordet er valgt for spillet [S]; hvordan en kogge i Vågen i 1420-årene
// var bygget i detalj, er ikke funnet [K]. SNL nevner også at store skip på 1400-tallet kan ha
// fått flere master [U]; spillet bruker én.
import * as THREE from 'three';
import type { MeshKit, Tint } from './meshkit';
import { V3, dekk, flate, hoyder, mast, punkt, raa, ror, skrog, stavner, tau, vant, vedHoyde, type SkrogSpec } from './skrog';

export const KOGGE: SkrogSpec = {
    L: 11.5,
    B: 3.6,
    bunn: 2.6,
    dyp: 2.3,
    ripe: 2.7,
    spring: 0.9,
    rakeF: 4.6,
    rakeA: 2.0,
    rund: false,
    fyldig: 2.3,
    bord: 10,
    stavnOver: 0.5,
};

const TJAERE: Tint = { top: 0.5, bottom: 0.32, hue: [1.0, 0.92, 0.82] };
const INNE: Tint = { top: 0.78, bottom: 0.6, hue: [1.05, 0.97, 0.88] };
const DEKK: Tint = { top: 1.1, bottom: 1.1, hue: [1.02, 0.98, 0.92] };
const KASTELL: Tint = { top: 0.62, bottom: 0.48, hue: [1.02, 0.94, 0.84] };
const LYST: Tint = { top: 1.0, bottom: 1.0, hue: [1.04, 0.98, 0.9] };

const DEKK_Y = 1.5;
const MAST_Z = 0.6;
const MAST_H = 24;

export interface SkipInfo {
    /** Pullerter (punkter på ripa) som fortøyningene går fra, i skipets rom. */
    fortoy: THREE.Vector3[];
    /** Klyssgatt forut, der ankertauet går ut. */
    baug: THREE.Vector3;
}

/**
 * Et kastell: skrogsidene fortsetter opp fra ripa til et dekk i høyden `topp`, med en brystning
 * (0,9 m) rundt. `u0..u1` langs skipet; `vegg` er enden som vender inn mot midtskips.
 */
function kastell(k: MeshKit, sp: SkrogSpec, u0: number, u1: number, topp: number, vegg: number): void {
    const M = 10;
    const rad: { x: number; z: number; ripe: number }[] = [];
    for (let i = 0; i <= M; i++) {
        const u = u0 + ((u1 - u0) * i) / M;
        const ripe = hoyder(sp, u).ripe;
        const v = vedHoyde(sp, u, ripe - 0.04);
        if (v) rad.push({ x: v.x + 0.07, z: v.z, ripe });
    }
    const n = rad.length - 1;
    const BRYST = 0.9;
    const midt = (p: THREE.Vector3) => V3(0, p.y, p.z);
    for (const side of [-1, 1]) {
        // Utsida: bordkledd fra ripa til toppen av brystningen. Innsida bare over dekket.
        k.withTint(KASTELL, () =>
            flate(
                k, 'raatre', n, 1,
                (i, j) => V3(side * rad[i].x, j === 0 ? rad[i].ripe - 0.05 : topp + BRYST, rad[i].z),
                (i, j) => [j === 0 ? rad[i].ripe : topp + BRYST, rad[i].z],
                (_i, j) => (j === 0 ? KASTELL.bottom : KASTELL.top),
                midt
            )
        );
        k.withTint(INNE, () =>
            flate(
                k, 'raatre', n, 1,
                (i, j) => V3(side * (rad[i].x - 0.06), j === 0 ? topp : topp + BRYST, rad[i].z),
                (i, j) => [j === 0 ? topp : topp + BRYST, rad[i].z],
                () => INNE.top,
                midt,
                true
            )
        );
        // Handlist på brystningen og en list der kastellet møter skroget.
        k.withTint(LYST, () => {
            for (let i = 0; i < n; i++) {
                k.log('raatre', V3(side * (rad[i].x - 0.03), topp + BRYST, rad[i].z), V3(side * (rad[i + 1].x - 0.03), topp + BRYST, rad[i + 1].z), 0.07, 5, false);
                // Utvendig list der kastelldekket ligger, og en ved ripa.
                for (const y of [topp - 0.08, rad[i].ripe + 0.05]) {
                    k.log('raatre', V3(side * (rad[i].x + 0.03), y, rad[i].z), V3(side * (rad[i + 1].x + 0.03), y, rad[i + 1].z), 0.06, 5, false);
                }
            }
        });
    }
    // Dekket i kastellet.
    k.withTint(DEKK, () =>
        flate(
            k, 'raatre', n, 1,
            (i, j) => V3(j === 0 ? -rad[i].x : rad[i].x, topp, rad[i].z),
            (i, j) => [j === 0 ? -rad[i].x : rad[i].x, rad[i].z],
            () => DEKK.top,
            (p) => V3(p.x, p.y - 1, p.z)
        )
    );
    // Veggen mot midtskips: fra hoveddekket opp til brystningen, med en dør (mørk åpning) i
    // akterkastellet og et åpent rom under dekket forut.
    const e = vegg === u1 ? rad[n] : rad[0];
    const dir = vegg === u1 ? 1 : -1;
    const w = e.x * 2;
    k.withTint(KASTELL, () => {
        k.box('raatre', 0, (DEKK_Y + topp + BRYST) / 2, e.z + dir * 0.05, w, topp + BRYST - DEKK_Y, 0.1);
        // Bjelkehoder under kastelldekket.
        for (let x = -e.x + 0.4; x < e.x - 0.2; x += 0.7) k.box('raatre', x, topp - 0.12, e.z + dir * 0.18, 0.16, 0.16, 0.3);
    });
    k.withTint({ top: 1, bottom: 1 }, () => {
        const dz = e.z + dir * 0.11;
        k.box('mork', 0, DEKK_Y + 0.95, dz, 0.95, 1.9, 0.02);
        k.box('mork', -e.x * 0.6, topp - 0.55, dz, 0.45, 0.4, 0.02);
        k.box('mork', e.x * 0.6, topp - 0.55, dz, 0.45, 0.4, 0.02);
    });
    // Stolper i hjørnene og midt på brystningen.
    k.withTint(KASTELL, () => {
        for (const sx of [-1, 1]) k.log('raatre', V3(sx * (e.x - 0.08), DEKK_Y, e.z + dir * 0.1), V3(sx * (e.x - 0.08), topp + BRYST + 0.15, e.z + dir * 0.1), 0.11, 6, true);
    });
}

/** Lasteluke på hoveddekket: en lav karm med luker. */
function luke(k: MeshKit, z: number, w: number, d: number): void {
    k.withTint(KASTELL, () => k.box('raatre', 0, DEKK_Y + 0.15, z, w, 0.3, d, { skip: ['bottom'] }));
    k.withTint(DEKK, () => {
        for (let x = -w / 2 + 0.3; x < w / 2; x += 0.62) k.box('raatre', x, DEKK_Y + 0.33, z, 0.58, 0.06, d - 0.1, { skip: ['bottom'] });
    });
}

/** Tønne på dekket. */
function tonne(k: MeshKit, x: number, z: number, y: number): void {
    k.withTint({ top: 0.95, bottom: 0.95, hue: [1.05, 0.95, 0.82] }, () => k.log('raatre', V3(x, y, z), V3(x, y + 0.85, z), 0.3, 9, true, 0.28));
    k.withTint({ top: 0.35, bottom: 0.35 }, () => {
        k.log('raatre', V3(x, y + 0.15, z), V3(x, y + 0.21, z), 0.31, 9, false);
        k.log('raatre', V3(x, y + 0.64, z), V3(x, y + 0.7, z), 0.3, 9, false);
    });
}

/** Bygger koggen i `k` (skipets rom). */
export function lagKogge(k: MeshKit): SkipInfo {
    const sp = KOGGE;
    skrog(k, sp, TJAERE, INNE, 3);
    stavner(k, sp, 0.16, TJAERE);
    dekk(k, sp, DEKK_Y, -0.96, 0.96, DEKK);

    // Akterkastellet er stort og høyt, forkastellet mindre (som på kogger fra 1300-tallet [S]).
    const uA = -6.6 / sp.L;
    kastell(k, sp, -0.985, uA, hoyder(sp, -1).ripe + 1.7, uA);
    const uF = 7.4 / sp.L;
    kastell(k, sp, uF, 0.975, hoyder(sp, 1).ripe + 0.9, uF);

    // Hoveddekket: luker, ankerspill og noen tønner.
    luke(k, -3.3, 2.6, 2.2);
    luke(k, 3.6, 2.4, 2.0);
    k.withTint(KASTELL, () => {
        k.log('raatre', V3(-1.6, DEKK_Y + 0.55, 6.4), V3(1.6, DEKK_Y + 0.55, 6.4), 0.24, 8, true);
        for (const x of [-1.75, 1.75]) k.box('raatre', x, DEKK_Y + 0.4, 6.4, 0.2, 0.8, 0.5);
    });
    tonne(k, -2.2, -0.9, DEKK_Y);
    tonne(k, -1.6, -1.5, DEKK_Y);
    tonne(k, 2.1, 1.9, DEKK_Y);

    // Masta, mastekurven, råa med beslått seil, og riggen.
    mast(k, V3(0, DEKK_Y, MAST_Z), MAST_H, 0.34, 0.18, LYST);
    const kurvY = MAST_H - 4.2;
    k.withTint(KASTELL, () => {
        k.log('raatre', V3(0, kurvY, MAST_Z), V3(0, kurvY + 1.0, MAST_Z), 0.8, 10, true, 0.85);
        k.log('raatre', V3(0, kurvY + 0.95, MAST_Z), V3(0, kurvY + 1.08, MAST_Z), 0.9, 10, false);
    });
    raa(k, MAST_Z + 0.4, kurvY - 2.2, 8.6, LYST, 0.48);
    vant(k, sp, MAST_Z, kurvY - 0.1, 4, 0.95);
    const baug = punkt(sp, 1, 1, 1);
    baug.x = 0;
    const stavnTopp = baug.clone().add(V3(0, sp.stavnOver * 0.9, sp.stavnOver * 0.5));
    tau(k, V3(0, kurvY + 0.1, MAST_Z + 0.3), stavnTopp, 0.04); // forstaget
    // Fallet og braser fra råa ned mot dekket.
    tau(k, V3(0, kurvY - 1.9, MAST_Z + 0.5), V3(0.3, DEKK_Y + 0.2, MAST_Z + 2.4), 0.025);
    for (const sx of [-1, 1]) tau(k, V3(sx * 8.3, kurvY - 2.2, MAST_Z + 0.4), V3(sx * 2.4, hoyder(sp, -0.62).ripe + 1.8, -7.1), 0.02, 0.3);

    ror(k, sp, 1.4, TJAERE);

    const fortoy: THREE.Vector3[] = [];
    for (const z of [-5.2, 6.6]) {
        const v = vedHoyde(sp, z / sp.L, hoyder(sp, z / sp.L).ripe - 0.05);
        if (v) fortoy.push(V3(v.x - 0.1, hoyder(sp, z / sp.L).ripe + 0.1, z));
    }
    return { fortoy, baug: baug.add(V3(0, -0.3, -0.4)) };
}
