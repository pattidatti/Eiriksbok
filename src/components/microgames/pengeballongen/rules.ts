// Fagkjernen: pengene er det eneste du styrer. Hold = bevilg penger, ballongen stiger.
// Fjellet = faste utgifter staten må betale. Valget = bøndene teller pengene du brukte.

import { rankFor, nextRank } from '../arcade/save';
import { bakke, fastTopp, knausVed } from './terrain';
import type { Game } from './state';
import { TUNING } from './tuning';

const T = TUNING;
const B = T.ballong;

/** Grep 1: hold eller slipp pengeknappen. */
export function hold(g: Game, på: boolean) {
    if (g.mode !== 'play') return;
    g.hold = på;
}

/**
 * Grep 2, bare etter riksretten: roret styrer ballongen ned. Før 1884 valgte kongen kursen,
 * så tasten gjør ingenting.
 */
export function ror(g: Game, på: boolean) {
    if (g.mode !== 'play') return;
    g.ror = på && g.harRor;
}

/** Synkefart uten varme: tyngre med årene og med hver flosshatt om bord. */
export function synk(g: Game): number {
    const l = T.løft;
    const u = Math.min(1, Math.max(0, (g.år - T.fart.fraÅr) / (T.fart.tilÅr - T.fart.fraÅr)));
    const rolig = Math.min(1, l.rolig.fra + ((1 - l.rolig.fra) * (g.t - g.rolig)) / l.rolig.sekunder);
    return (l.synkFra + (l.synkTil - l.synkFra) * u + g.hatter * l.perHatt) * rolig;
}

/** Stigefart med full varme. Lavere jo høyere opp (tynn luft): å fly høyt koster mer. */
export function stig(y: number): number {
    const alt = Math.min(1, Math.max(0, (540 - y) / 540));
    return T.løft.stigLav + (T.løft.stigHøy - T.løft.stigLav) * Math.pow(alt, T.løft.tynnLuft);
}

export interface Flukt {
    y: number;
    vy: number;
    varme: number;
}

/**
 * Ett fysikksteg: varmen følger knappen litt etter, farten følger varmen. Med roret (etter
 * riksretten) følger ballongen deg raskt, og roret alene styrer den ned. Brukes av spillet og
 * av robotene som spår.
 */
/**
 * Dit roret styrer: et stykke over den høyeste bakken rett foran. Holder du pil ned for
 * lenge, legger ballongen seg langs dalen i stedet for å krasje - roret er tilgivende.
 */
export function rorMål(ter: Game['ter'], x: number): number {
    let min = 540;
    for (let dx = -B.kurvHalv; dx <= T.ror.foran; dx += 10) min = Math.min(min, bakke(ter, x + dx));
    return min - T.ror.over;
}

export function fly(
    f: Flukt,
    holdPå: boolean,
    rorPå: boolean,
    harRor: boolean,
    sy: number,
    dt: number,
    mål_ = Infinity
) {
    const l = T.løft;
    const tau = harRor ? T.ror.varmeTau : l.varmeTau;
    f.varme += ((holdPå ? 1 : 0) - f.varme) * (1 - Math.exp(-dt / tau));
    // Med roret styrer du helt: hold = opp, pil ned = ned mot dalen (`mål_`), ingen = rett fram.
    const mål = harRor
        ? holdPå
            ? -T.ror.stig
            : rorPå
              ? Math.max(-T.ror.stig, Math.min(T.ror.synk, (mål_ - f.y) * 5))
              : 0
        : -stig(f.y) * f.varme + sy * (1 - f.varme);
    const a = harRor
        ? T.ror.akselerasjon
        : mål > f.vy && f.vy >= 0
          ? l.akselerasjonNed
          : l.akselerasjon;
    f.vy += Math.max(-a * dt, Math.min(a * dt, mål - f.vy));
    f.y = Math.max(B.tak + B.høyde, f.y + f.vy * dt);
    if (f.y <= B.tak + B.høyde && f.vy < 0) f.vy = 0;
}

/** Avstand fra kurven til bakken rett under (px). */
export const klaring = (g: Game) => bakke(g.ter, g.x) - g.y;

/**
 * Nærmeste fjell: minste avstand fra kurven ned til bakken litt bak og litt foran. Slik teller
 * også kammen du nettopp gled over, så nedoverbakken etter en topp ikke straffes.
 */
export function nærhet(ter: Game['ter'], x: number, y: number): number {
    const [a, b] = T.ganger.vindu;
    let min = Infinity;
    for (let dx = a; dx <= b; dx += 10) min = Math.min(min, bakke(ter, x + dx));
    return min - y;
}

/** Er Ueland om bord (gangeren og nær-båndet er i spill)? */
export const uelandOm = (g: Game) => g.år >= g.uelandÅr;

/** Er kurven i nær-båndet (Ueland-gangeren vokser)? */
export const iBåndet = (g: Game) =>
    uelandOm(g) && nærhet(g.ter, g.x, g.y) < T.ganger.nær;

/** Hva brenneren koster nå (Spd/s): Ola-boka (bondeflertallet) gjør den billigere. */
export const kostnad = (g: Game) =>
    (g.år < T.penger.førsteEkteValg ? T.penger.førBonde : T.penger.perSek) *
    (g.olaboka ? 1 - T.penger.olaboka : 1);

/** Spart per sekund når du slipper: lite høyt oppe, mye tett over fjellet. */
export function sparing(g: Game): number {
    if (!uelandOm(g)) return T.penger.førUeland;
    const s = iBåndet(g) ? T.penger.perSek * g.ganger : T.penger.utenfor;
    // Rorstrekket går i sakte film (ett år = `rorTempo` s): sparingen følger årene, ikke
    // sekundene, ellers ville det siste halve året gitt mer enn hele resten av runden.
    return g.år >= T.år.rorFra ? (s * T.år.etterValg) / T.år.rorTempo : s;
}

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

/**
 * Grensen ved valget i perioden som slutter i `år`: bøndene teller strengere jo sterkere
 * bondeopposisjonen blir. Fra `penger.grense` i 1833 ned til `penger.grenseSlutt` i 1881.
 */
export function grense(år: number): number {
    const P = T.penger;
    const u = Math.min(1, Math.max(0, (år - P.førsteEkteValg) / (P.sisteValg - P.førsteEkteValg)));
    return P.grense + (P.grenseSlutt - P.grense) * u;
}

/** Grensen for valgperioden ballongen er i nå (neste valg). */
export const grenseNå = (g: Game) => grense(g.ter.valg[g.nesteValg]?.år ?? T.penger.sisteValg);

/** Valggrensen er i spill (fra 1833). */
export const grenseVises = (g: Game) => g.år >= T.penger.førsteEkteValg - 1.2;

/** 0-1: tyngde + fjellhøyde foran + fart + hvor stramt budsjettet er. */
export function press(g: Game): number {
    const p = T.press;
    const n = (v: number, [a, b]: number[]) => Math.min(1, Math.max(0, (v - a) / (b - a)));
    let topp = 540;
    for (let dx = 0; dx <= 700; dx += 20) topp = Math.min(topp, fastTopp(g.ter, g.x + dx));
    // Budsjettet: før 1833 teller ingen, så er det grensen som strammes.
    const budsjett = g.år < T.penger.førsteEkteValg ? 0 : n(grenseNå(g), [T.penger.grense + 2, T.penger.grenseSlutt]);
    return (
        (n(synk(g), p.synk) + n(topp, p.fjell) + n(g.x > 0 ? fartNå(g) : 140, p.fart) + budsjett) / 4
    );
}

function fartNå(g: Game) {
    const u = Math.min(1, Math.max(0, (g.år - T.fart.fraÅr) / (T.fart.tilÅr - T.fart.fraÅr)));
    return T.fart.fra + (T.fart.til - T.fart.fra) * u;
}

export const rang = (spart: number) => rankFor(T.ranger, spart);
export const nesteRang = (spart: number) => nextRank(T.ranger, spart);
