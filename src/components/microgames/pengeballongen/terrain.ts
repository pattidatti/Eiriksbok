// Tida, veien og fjellene. Hele terrenget lages når runden starter (seedet), så sim og
// nettleser får samme fjell. Ingen spillregler her - bare geometri og oppslag.

import {
    BRETT,
    brettFor,
    FORMER,
    FUNN,
    SLETTE,
    UTGIFTER,
    ÅPNE_VEISKILLER,
    type FunnId,
} from './levels';
import { TUNING } from './tuning';

const T = TUNING;

// ---------- tid <-> år <-> vei ----------

const Å = T.år;
/** Spilltid når det første ekte valget kommer (tida bytter fart her). */
const T_SKIFTE = (Å.skifte - Å.start) * Å.førValg;

/** Spilltid når riksretten er over og roret er ditt (tida går sakte herfra). */
const T_ROR = T_SKIFTE + (Å.rorFra - Å.skifte) * Å.etterValg;

export const tidFor = (år: number) =>
    år <= Å.skifte
        ? (år - Å.start) * Å.førValg
        : år <= Å.rorFra
          ? T_SKIFTE + (år - Å.skifte) * Å.etterValg
          : T_ROR + (år - Å.rorFra) * Å.rorTempo;
export const årFor = (t: number) =>
    t <= T_SKIFTE
        ? Å.start + t / Å.førValg
        : t <= T_ROR
          ? Å.skifte + (t - T_SKIFTE) / Å.etterValg
          : Å.rorFra + (t - T_ROR) / Å.rorTempo;

/** Hele runden i sekunder (1815 til landingen). */
export const RUNDE = tidFor(Å.slutt);

const T1 = tidFor(T.fart.tilÅr);
const K = (T.fart.til - T.fart.fra) / T1;

/** Farten fram (px/s) ved spilltid t. */
export const fartVed = (t: number) => (t < T1 ? T.fart.fra + K * t : T.fart.til);

/** Hvor langt ballongen har kommet (px) ved spilltid t. Samme fart for alle spillere. */
export function veiVed(t: number): number {
    if (t < T1) return T.fart.fra * t + (K * t * t) / 2;
    return T.fart.fra * T1 + (K * T1 * T1) / 2 + T.fart.til * (t - T1);
}

export const veiForÅr = (år: number) => veiVed(tidFor(år));

/** Spilltid når ballongen er kommet til x. */
export function tidForVei(x: number): number {
    const x1 = veiVed(T1);
    if (x >= x1) return T1 + (x - x1) / T.fart.til;
    // f t + K t²/2 = x
    return (-T.fart.fra + Math.sqrt(T.fart.fra * T.fart.fra + 2 * K * x)) / K;
}

// ---------- terrenget ----------

export interface Knaus {
    x0: number;
    x1: number;
    topp: number;
    bunn: number;
    år: number;
    /** Kongens veiskille (før 1882): kam under, kongeveien over gir en flosshatt. */
    konge: boolean;
    /** Hvilken vei ballongen tok (settes når den er forbi midten). */
    valgt: 'over' | 'under' | null;
}

export interface Funn {
    id: FunnId;
    x: number;
    y: number;
    tatt: boolean;
}

export interface Utgift {
    x: number;
    y: number;
    navn: string | null;
}

/** En stemme som henger lavt i en dal i rorstrekket (bare roret når ned dit i tide). */
export interface Stemme {
    x: number;
    y: number;
    tatt: boolean;
}

export interface Valgsted {
    år: number;
    x: number;
    /** Fra 1833: bøndene teller pengene. */
    ekte: boolean;
}

export interface Terreng {
    xs: number[];
    ys: number[];
    knauser: Knaus[];
    funn: Funn[];
    utgifter: Utgift[];
    valg: Valgsted[];
    stemmer: Stemme[];
    /** Steder der eleven får et nytt valg (rygger, valg, funn, veiskiller). */
    valgpunkter: number[];
    lengde: number;
}

type Rng = () => number;
const mellom = (rng: Rng, [a, b]: [number, number]) => a + (b - a) * rng();

export function lagTerreng(rng: Rng): Terreng {
    const xs: number[] = [];
    const ys: number[] = [];
    const valgpunkter: number[] = [];
    const utgifter: Utgift[] = [];
    const knauser: Knaus[] = [];
    const stemmer: Stemme[] = [];
    const lengde = veiForÅr(Å.slutt) + 1200;
    const punkt = (x: number, y: number) => {
        xs.push(x);
        ys.push(y);
    };
    const slette = { x0: veiForÅr(SLETTE.fra), x1: veiForÅr(SLETTE.til) };
    const vs = T.veiskille;
    const F = T.form;
    const x33 = veiForÅr(Å.skifte);

    // Rolig start: ballongen henger over en flat dal i ca. 3 sekunder.
    let x = 0;
    punkt(-400, 485);
    punkt(x + 420, 485);
    x += 420;

    // 1815-1833: tilfeldige rygger etter brettet (opptrappingen).
    while (x < x33) {
        const år = årFor(tidForVei(x));
        const b = BRETT[brettFor(år)];
        const fart = fartVed(tidForVei(x));
        const dalY = mellom(rng, b.dal);
        const bredde = mellom(rng, b.mellom) * fart;

        // Den høye sletta før 1833-valget.
        if (x < slette.x1 && slette.x0 < x + bredde) {
            const x0 = Math.max(x + 160, slette.x0);
            punkt(x + 40, dalY);
            punkt(x0, SLETTE.y);
            punkt(slette.x1, SLETTE.y);
            punkt(slette.x1 + 180, dalY);
            valgpunkter.push(x0);
            x = slette.x1 + 180;
            continue;
        }
        // Rekker ikke en hel rygg før 1833: flat dal fram til valget.
        if (x + bredde > x33 + 60) {
            punkt(x + 40, dalY);
            x = Math.max(x + 40, x33);
            break;
        }

        // En vanlig rygg: dal, stigning, kam, fall.
        const topp = mellom(rng, b.topp);
        const kam = mellom(rng, b.kam) * bredde;
        const dal = bredde * 0.22;
        const opp = (bredde - kam - dal) * 0.5;
        const xb = x + dal + opp;
        const xc = xb + kam;
        punkt(x + dal, dalY);
        punkt(xb, topp);
        if (kam > 40) punkt(xc, topp + (rng() - 0.5) * 6);
        valgpunkter.push(xb);
        x = xc + opp;
    }

    // Fra 1833: én form per valgperiode (tind, skrapedal, veiskille), og hver blir litt
    // høyere enn den forrige. Etter riksretten: finalen med åpne veiskiller.
    for (let p = 0; ; p++) {
        const år0 = Å.skifte + p * T.penger.hvert;
        if (år0 >= Å.slutt) break;
        const xa = Math.max(x, veiForÅr(år0));
        const xe = Math.min(lengde, veiForÅr(år0 + T.penger.hvert));
        const W = xe - xa;
        const dalY = mellom(rng, BRETT[brettFor(år0 + 1.5)].dal);
        const f = 1 + F.økning * p;
        const finale = ÅPNE_VEISKILLER.some((å) => å >= år0 && å < år0 + T.penger.hvert);

        if (finale) {
            // Dalen fram til Løvebakken, med åpne knauser over (bommen er borte).
            const dy = vs.dalY;
            punkt(xa + 120, dy);
            for (const år of ÅPNE_VEISKILLER) {
                const cx = veiForÅr(år);
                const bunn = dy - vs.gap;
                knauser.push({
                    x0: cx - vs.bredde / 2,
                    x1: cx + vs.bredde / 2,
                    bunn,
                    topp: bunn - vs.tykkelse,
                    år,
                    konge: false,
                    valgt: null,
                });
                valgpunkter.push(cx - vs.bredde / 2);
            }
            // Rorstrekket: bratte, dype daler med en stemme i bunnen. Uten roret synker
            // ballongen for sakte til å nå dem før neste kam.
            const R = T.ror;
            const xr = veiForÅr(Å.rorFra);
            const xl = veiForÅr(Å.slutt);
            const x1 = xr + 200;
            const w = (xl - 160 - x1) / R.daler;
            punkt(xr - 20, dy);
            for (let i = 0; i <= R.daler; i++) {
                const xk = x1 + i * w;
                punkt(xk - 40, R.kamY);
                punkt(xk + 40, R.kamY);
                if (i < R.daler) {
                    // Bratt ned rett etter kammen, slakt opp igjen: stemmen henger tett under
                    // kanten, så bare den som styrer ned med roret når den.
                    const xd = xk + 40 + R.bratt;
                    punkt(xd, R.dalY);
                    punkt(xd + 30, R.dalY);
                    stemmer.push({ x: xd + 10, y: R.dalY - R.stemmeOver, tatt: false });
                    valgpunkter.push(xk);
                }
            }
            punkt(xl - 40, dy);
            punkt(lengde, dy);
            x = lengde;
            break;
        }

        const form = FORMER[p % FORMER.length];
        if (form === 'tind') {
            const top = dalY - F.tind * f * (0.92 + 0.16 * rng());
            const nv = UTGIFTER.find((u) => u.år >= år0 && u.år < år0 + T.penger.hvert);
            punkt(xa + W * 0.16, dalY);
            if (nv) {
                // Kongens brå utgift: en spiss topp midt på kammen.
                const xb = xa + W * 0.36;
                const xc = xa + W * 0.58;
                const xm = (xb + xc) / 2;
                const spiss = top - 40 - rng() * 20;
                punkt(xb, top);
                punkt(xm - 50, top - 4);
                punkt(xm, spiss);
                punkt(xm + 50, top - 4);
                punkt(xc, top);
                utgifter.push({ x: xm, y: spiss, navn: nv.navn });
                valgpunkter.push(xb);
            } else {
                punkt(xa + W * 0.4, top);
                punkt(xa + W * 0.52, top + (rng() - 0.5) * 6);
                valgpunkter.push(xa + W * 0.4);
            }
            punkt(xa + W * 0.8, dalY);
        } else if (form === 'skrapedal') {
            // Bølgende åser: følg kammen tett, så vokser gangeren helt til ×5.
            const n = F.åser * 2;
            for (let i = 1; i < n; i++) {
                const ås = i % 2 === 1;
                punkt(xa + (W * i) / n, ås ? dalY - mellom(rng, F.bølge) * f : dalY);
                if (ås) valgpunkter.push(xa + (W * i) / n);
            }
        } else {
            // Kongens veiskille: kam med en knaus over. Under = lav, smal og billig.
            // Over = kongeveien: trygg, men dyr, og en flosshatt til.
            const cx = (xa + xe) / 2;
            const kamY = dalY - Math.min(F.kamMaks, F.kam * f * mellom(rng, F.kamSpenn));
            const halv = vs.bredde / 2 + vs.flate;
            punkt(cx - halv - F.skrå, dalY);
            punkt(cx - halv, kamY);
            punkt(cx + halv, kamY);
            punkt(cx + halv + F.skrå, dalY);
            const bunn = kamY - vs.gapLav;
            knauser.push({
                x0: cx - vs.bredde / 2,
                x1: cx + vs.bredde / 2,
                bunn,
                topp: bunn - vs.tykkelse,
                år: årFor(tidForVei(cx)),
                konge: true,
                valgt: null,
            });
            valgpunkter.push(cx - halv - F.skrå, cx - vs.bredde / 2);
        }
        x = xe;
    }
    punkt(lengde + 2000, 470);

    // Sorter (veiskillene kan legge punkter litt bakover) og fjern dubletter.
    const idx = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b]);
    const sx: number[] = [];
    const sy: number[] = [];
    for (const i of idx) {
        if (sx.length && xs[i] - sx[sx.length - 1] < 1) continue;
        sx.push(xs[i]);
        sy.push(ys[i]);
    }

    const ter: Terreng = {
        xs: sx,
        ys: sy,
        knauser,
        funn: [],
        utgifter,
        valg: [],
        stemmer,
        valgpunkter,
        lengde,
    };

    // Funnene henger lavt i den dypeste dalen nær året sitt.
    for (const f of FUNN) {
        const x0 = veiForÅr(f.år);
        let best = x0;
        for (let dx = -220; dx <= 220; dx += 10)
            if (bakke(ter, x0 + dx) > bakke(ter, best)) best = x0 + dx;
        ter.funn.push({ id: f.id, x: best, y: bakke(ter, best) - (f.over ?? T.funn.overBakken), tatt: false });
        ter.valgpunkter.push(best);
    }

    // Valgene: hvert tredje år, på en kolle.
    for (let år = T.penger.førsteValg; år <= T.penger.sisteValg; år += T.penger.hvert) {
        const x = veiForÅr(år);
        ter.valg.push({ år, x, ekte: år >= T.penger.førsteEkteValg });
        if (år >= T.penger.førsteEkteValg) ter.valgpunkter.push(x - 700);
    }
    ter.valgpunkter.sort((a, b) => a - b);
    return ter;
}

/** Overflaten (y) på bakken ved x. Myk kurve mellom punktene. */
export function bakke(ter: Terreng, x: number): number {
    const { xs, ys } = ter;
    let lo = 0;
    let hi = xs.length - 1;
    if (x <= xs[0]) return ys[0];
    if (x >= xs[hi]) return ys[hi];
    while (hi - lo > 1) {
        const m = (lo + hi) >> 1;
        if (xs[m] <= x) lo = m;
        else hi = m;
    }
    const u = (x - xs[lo]) / (xs[hi] - xs[lo]);
    const s = (1 - Math.cos(u * Math.PI)) / 2;
    return ys[lo] + (ys[hi] - ys[lo]) * s;
}

/** Høyeste faste hinder ved x (bakken). Knausene har luft under seg, se knausVed. */
export const fastTopp = (ter: Terreng, x: number): number => bakke(ter, x);

/** Knausen over x, om det er en. */
export function knausVed(ter: Terreng, x: number): Knaus | null {
    for (const k of ter.knauser) if (x >= k.x0 && x <= k.x1) return k;
    return null;
}
