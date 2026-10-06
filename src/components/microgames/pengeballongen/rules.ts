// Fagkjernen: pengene er det eneste du styrer. Hold = bevilg penger, ballongen stiger.
// Fjellet = faste utgifter staten må betale. Valget = bøndene teller pengene du brukte.

import { rankFor, nextRank } from '../arcade/save';
import { bakke, fastTopp, knausVed } from './terrain';
import type { Game } from './state';
import { TUNING } from './tuning';

const T = TUNING;
const B = T.ballong;

/** Eneste grep eleven har: hold eller slipp pengeknappen. Ingen tast for retning før 1884. */
export function hold(g: Game, på: boolean) {
    if (g.mode !== 'play') return;
    g.hold = på;
}

/** Synkefart uten varme: tyngre med årene og med hver flosshatt om bord. */
export function synk(g: Game): number {
    const l = T.løft;
    const u = Math.min(1, Math.max(0, (g.år - T.fart.fraÅr) / (T.fart.tilÅr - T.fart.fraÅr)));
    const rolig = Math.min(1, l.rolig.fra + ((1 - l.rolig.fra) * g.t) / l.rolig.sekunder);
    return (l.synkFra + (l.synkTil - l.synkFra) * u + g.hatter * l.perHatt) * rolig;
}

/** Stigefart med full varme. Lavere jo høyere opp (tynn luft): å fly høyt koster mer. */
export function stig(y: number): number {
    const alt = Math.min(1, Math.max(0, (540 - y) / 540));
    return T.løft.stigLav + (T.løft.stigHøy - T.løft.stigLav) * Math.pow(alt, T.løft.tynnLuft);
}

/** Avstand fra kurven til bakken rett under (px). */
export const klaring = (g: Game) => bakke(g.ter, g.x) - g.y;

/** Treffer ballongen fjellet eller en knaus? */
export function krasjer(g: Game): boolean {
    const ter = g.ter;
    for (const dx of [-B.kurvHalv, 0, B.kurvHalv]) if (g.y >= fastTopp(ter, g.x + dx)) return true;
    for (const dx of [-B.halvBredde, B.halvBredde]) {
        const k = knausVed(ter, g.x + dx);
        if (k && g.y > k.topp && g.y - B.høyde < k.bunn) return true;
    }
    return false;
}

/** Valggrensen er i spill (fra 1833). */
export const grenseVises = (g: Game) => g.år >= T.penger.førsteEkteValg - 1.2;

/** 0-1: tyngde + fjellhøyde foran + fart. */
export function press(g: Game): number {
    const p = T.press;
    const n = (v: number, [a, b]: number[]) => Math.min(1, Math.max(0, (v - a) / (b - a)));
    let topp = 540;
    for (let dx = 0; dx <= 700; dx += 20) topp = Math.min(topp, fastTopp(g.ter, g.x + dx));
    return (n(synk(g), p.synk) + n(topp, p.fjell) + n(g.x > 0 ? fartNå(g) : 140, p.fart)) / 3;
}

function fartNå(g: Game) {
    const u = Math.min(1, Math.max(0, (g.år - T.fart.fraÅr) / (T.fart.tilÅr - T.fart.fraÅr)));
    return T.fart.fra + (T.fart.til - T.fart.fra) * u;
}

export const rang = (spart: number) => rankFor(T.ranger, spart);
export const nesteRang = (spart: number) => nextRank(T.ranger, spart);
