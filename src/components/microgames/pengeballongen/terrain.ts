// Tida, veien og fjellene. Hele terrenget lages når runden starter (seedet), så sim og
// nettleser får samme fjell. Ingen spillregler her - bare geometri og oppslag.

import { BRETT, brettFor, FUNN, SLETTE, UTGIFTER, VEISKILLER, type FunnId } from './levels';
import { TUNING } from './tuning';

const T = TUNING;

// ---------- tid <-> år <-> vei ----------

export const årFor = (t: number) => T.år.start + t / T.år.sekunder;
export const tidFor = (år: number) => (år - T.år.start) * T.år.sekunder;

const T1 = (T.fart.tilÅr - T.fart.fraÅr) * T.år.sekunder;
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
    /** Kongens bom stenger dalen under. */
    bom: boolean;
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
    const lengde = veiForÅr(T.år.slutt) + 1200;
    const punkt = (x: number, y: number) => {
        xs.push(x);
        ys.push(y);
    };
    const slette = { x0: veiForÅr(SLETTE.fra), x1: veiForÅr(SLETTE.til) };
    const skiller = VEISKILLER.map((år) => ({ år, x: veiForÅr(år) }));
    const navngitt = UTGIFTER.map((u) => ({ ...u, x: veiForÅr(u.år), brukt: false }));
    const vb = T.veiskille.bredde;

    // Rolig start: ballongen henger over en flat dal i ca. 3,5 sekunder.
    let x = 0;
    punkt(-400, 485);
    punkt(x + 520, 485);
    x += 520;

    while (x < lengde) {
        const år = T.år.start + tidForVei(x) / T.år.sekunder;
        const b = BRETT[brettFor(år)];
        const fart = fartVed(tidForVei(x));
        const dalY = mellom(rng, b.dal);
        const bredde = mellom(rng, b.mellom) * fart;

        // Veiskille før neste rygg ville vært ferdig: flat dal under en knaus.
        const sk = skiller[0];
        if (sk && sk.x - vb / 2 - 140 < x + bredde) {
            const cx = Math.max(sk.x, x + vb / 2 + 160);
            const dy = T.veiskille.dalY;
            punkt(cx - vb / 2 - 120, dy);
            punkt(cx + vb / 2 + 120, dy);
            const bunn = dy - T.veiskille.gap;
            knauser.push({
                x0: cx - vb / 2,
                x1: cx + vb / 2,
                bunn,
                topp: bunn - T.veiskille.tykkelse,
                år: sk.år,
                bom: sk.år < T.veiskille.åpenFra,
            });
            valgpunkter.push(cx - vb / 2);
            skiller.shift();
            x = cx + vb / 2 + 120;
            continue;
        }

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

        // En vanlig rygg: dal, stigning, kam, fall.
        const topp = mellom(rng, b.topp);
        const kam = mellom(rng, b.kam) * bredde;
        const dal = bredde * 0.22;
        const opp = (bredde - kam - dal) * 0.5;
        const xa = x + dal;
        const xb = xa + opp;
        const xc = xb + kam;
        punkt(xa, dalY);
        const nv = navngitt.find((u) => !u.brukt && u.x < xc + opp && u.x >= x);
        if (nv || rng() < b.utgift) {
            // Kongens brå utgift: en spiss topp midt på kammen.
            const xm = (xb + xc) / 2;
            const spiss = topp - 70 - rng() * 30;
            punkt(xb, topp);
            punkt(xm - 50, topp - 4);
            punkt(xm, spiss);
            punkt(xm + 50, topp - 4);
            punkt(xc, topp);
            utgifter.push({ x: xm, y: spiss, navn: nv ? nv.navn : null });
            if (nv) nv.brukt = true;
        } else {
            punkt(xb, topp);
            if (kam > 40) punkt(xc, topp + (rng() - 0.5) * 6);
        }
        valgpunkter.push(xb);
        x = xc + opp;
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
        valgpunkter,
        lengde,
    };

    // Funnene henger lavt i den dypeste dalen nær året sitt.
    for (const f of FUNN) {
        const x0 = veiForÅr(f.år);
        let best = x0;
        for (let dx = -220; dx <= 220; dx += 10)
            if (bakke(ter, x0 + dx) > bakke(ter, best)) best = x0 + dx;
        ter.funn.push({ id: f.id, x: best, y: bakke(ter, best) - T.funn.overBakken, tatt: false });
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

/** Høyeste faste hinder ved x: bakken, eller toppen av en knaus med bom under. */
export function fastTopp(ter: Terreng, x: number): number {
    let y = bakke(ter, x);
    for (const k of ter.knauser) if (k.bom && x >= k.x0 && x <= k.x1) y = Math.min(y, k.topp);
    return y;
}

/** Knausen over x, om det er en. */
export function knausVed(ter: Terreng, x: number): Knaus | null {
    for (const k of ter.knauser) if (x >= k.x0 && x <= k.x1) return k;
    return null;
}
