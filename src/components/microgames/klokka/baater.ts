// Båtene: på daviten (med lunte og teller), landgangen, båtene som driver ut i mørket,
// plask, «FULL»-stempelet og nødrakettene.

import { type Side } from './levels';
import { frist, høySide, klarBåt, ledig } from './rules';
import type { Båt, Game } from './state';
import { TUNING } from './tuning';
import { ARK, BÅT_H, BÅT_W, DEKK_Y, MIDT, SKROG, båtPos, iVerden, vannY } from './geom';
import { type Fx } from './fx';
import { P, etikett, strek } from './papir';

import { artAv, figur, målelinje, tast, type TegneValg } from './former';

// ---------- Båtene ----------

function båtForm(
    c: CanvasRenderingContext2D,
    b: Båt,
    x: number,
    y: number,
    sving: number,
    fx: Fx,
    t: number
) {
    const w = b.slag === 'kutter' ? BÅT_W * 0.8 : BÅT_W;
    const h = b.slag === 'sammenleggbar' ? BÅT_H * 0.78 : BÅT_H;
    c.save();
    c.translate(x, y);
    c.rotate(sving);
    const skrog = () => {
        c.moveTo(-w / 2, -3);
        c.quadraticCurveTo(0, 3, w / 2, -3);
        c.quadraticCurveTo(w / 2 - 6, h, w / 2 - 18, h);
        c.lineTo(-w / 2 + 18, h);
        c.quadraticCurveTo(-w / 2 + 6, h, -w / 2, -3);
    };
    c.fillStyle = P.papir;
    c.beginPath();
    skrog();
    c.fill();
    strek(c, skrog, 1.8, P.hvit, 0.95);
    // Bordganger.
    c.setLineDash(b.slag === 'sammenleggbar' ? [3, 3] : []);
    strek(
        c,
        () => {
            c.moveTo(-w / 2 + 8, h * 0.62);
            c.quadraticCurveTo(0, h * 0.75, w / 2 - 8, h * 0.62);
        },
        0.7,
        P.blyant,
        0.7
    );
    c.setLineDash([]);
    // Plassene: en rad lanterner per benk.
    const rader = b.plasser > 48 ? 3 : 2;
    const per = Math.ceil(b.plasser / rader);
    const tent = fx.tent[b.nr];
    for (let p = 0; p < b.plasser; p++) {
        const rad = Math.floor(p / per);
        const kol = p % per;
        const innrykk = 12 + rad * 3;
        const px = -w / 2 + innrykk + ((w - innrykk * 2) * (kol + 0.5)) / per;
        const py = 4 + rad * ((h - 9) / Math.max(1, rader - 1)) * 0.85;
        const lt = tent[p];
        if (p < b.folk && lt >= 0) {
            const alder = t - (lt - 0.35);
            const pop = alder < 0.25 ? 1 + 0.8 * Math.sin((alder / 0.25) * Math.PI) : 1;
            c.fillStyle = P.gul;
            c.globalAlpha = 0.22;
            c.beginPath();
            c.arc(px, py, 3.4 * pop, 0, Math.PI * 2);
            c.fill();
            c.globalAlpha = 1;
            c.beginPath();
            c.arc(px, py, 1.7 * pop, 0, Math.PI * 2);
            c.fill();
        } else if (p < b.folk) {
            c.fillStyle = P.gul;
            c.beginPath();
            c.arc(px, py, 1.7, 0, Math.PI * 2);
            c.fill();
        } else {
            c.strokeStyle = P.blyant;
            c.lineWidth = 0.6;
            c.globalAlpha = 0.8;
            c.beginPath();
            c.arc(px, py, 1.5, 0, Math.PI * 2);
            c.stroke();
            c.globalAlpha = 1;
        }
    }
    c.restore();
}

/**
 * Lunta: brenner ned mot fristen (vannet eller krengningen). Tykk og gul; de siste
 * sekundene blir den rød og blinker, og et tall viser sekundene som er igjen.
 */
function lunte(c: CanvasRenderingContext2D, g: Game, b: Båt, x: number, y: number) {
    const igjen = Math.max(0, frist(b).t - g.t);
    const andel = Math.min(1, igjen / 40);
    const w = BÅT_W - 16;
    const fare = igjen < TUNING.varsel;
    const blink = fare ? 0.55 + 0.45 * Math.sin(g.t * (10 + (TUNING.varsel - igjen) * 1.6)) : 1;
    strek(
        c,
        () => {
            c.moveTo(x - w / 2, y);
            c.lineTo(x + w / 2, y);
        },
        3,
        P.blyant,
        0.55
    );
    const ende = x - w / 2 + w * andel;
    c.globalAlpha = blink;
    strek(
        c,
        () => {
            c.moveTo(x - w / 2, y);
            c.lineTo(ende, y);
        },
        fare ? 7 : 5,
        fare ? P.rød : P.gul,
        0.95
    );
    c.globalAlpha = 1;
    if (fare) etikett(c, `${Math.ceil(igjen)} S`, x + w / 2 + 6, y, 11, P.rød, 'left', 800);
    // Gnisten.
    const fl = 0.6 + 0.4 * Math.sin(g.t * 31);
    c.fillStyle = P.hvit;
    c.globalAlpha = fl;
    c.beginPath();
    c.arc(ende, y, fare ? 4 : 3.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = fare ? P.rød : P.gul;
    for (let i = 0; i < 3; i++) {
        const a = g.t * 13 + i * 2.1;
        c.fillRect(ende + Math.cos(a) * 6, y + Math.sin(a) * 5 - 1, 1.6, 1.6);
    }
    c.globalAlpha = 1;
}

export function davitBåt(c: CanvasRenderingContext2D, g: Game, side: Side, fx: Fx, o: TegneValg) {
    const i = g.davit[side];
    if (i === null) return;
    const b = g.båter[i];
    const p = båtPos(g, b);
    const fires = b.tilstand === 'fires';
    const høy = høySide(g.t) === side;
    // Tauet løper ut i små rykk, og båten svinger litt.
    const rykk = fires ? Math.abs(Math.sin(g.t * 17)) * 2.2 : 0;
    const y = p.y - rykk;
    const sving =
        (fires ? Math.sin(g.t * 2.6) * 0.035 : Math.sin(g.t * 1.1 + i) * 0.03) +
        (høy ? (side === 'B' ? 0.03 : -0.03) : 0);
    const fr = frist(b);
    const fare = fr.t - g.t < TUNING.varsel;
    const blink = fare && Math.floor(g.t * 4) % 2 === 0;
    const w = b.slag === 'kutter' ? BÅT_W * 0.8 : BÅT_W;
    // Taljene fra davittoppen til båtens ender.
    strek(
        c,
        () => {
            c.moveTo(p.tip.x - 3, p.tip.y);
            c.lineTo(p.x - w / 2 + 14, y - 2);
            c.moveTo(p.tip.x + 3, p.tip.y);
            c.lineTo(p.x + w / 2 - 14, y - 2);
        },
        1.1,
        blink ? P.rød : P.hvit,
        0.9
    );
    båtForm(c, b, p.x, y, sving, fx, g.t);
    const full = b.folk >= b.plasser;
    const under = y + BÅT_H + 16;
    målelinje(c, p.x, under, w, `${b.folk} / ${b.plasser}`, full ? P.gul : P.hvit);
    if (b.ned === 0) lunte(c, g, b, p.x, under + 15);
    etikett(c, b.navn.toUpperCase(), p.x, under + 29, 10, P.blyant, 'center');
    // Båten fires uten å være full: de tomme plassene følger den ned.
    if (fires && !full)
        etikett(c, `-${b.plasser - b.folk} TOMME`, p.x, under + 44, 13, P.rød, 'center', 800);
    else if (fare && b.ned === 0)
        etikett(
            c,
            fr.årsak === 'lås' ? 'LÅSES SNART' : 'VANNET KOMMER',
            p.x,
            under + 42,
            11,
            blink ? P.rød : P.hvit,
            'center'
        );
    else if (høy && b.ned === 0 && b.slag !== 'sammenleggbar') {
        // Skipet krenger bort fra denne siden: folk går oppover landgangen, og det tar tid.
        etikett(c, 'HØY SIDE:', p.x, under + 41, 10, P.rød, 'center', 800);
        etikett(c, 'LANDGANGEN GÅR TREGT', p.x, under + 53, 10, P.rød, 'center', 800);
    }
    if (o.spiller && b.tilstand === 'henger') {
        const kx = side === 'B' ? p.x - w / 2 - 22 : p.x + w / 2 + 22;
        const holder = g.hold === side;
        tast(c, kx, y + 6, side === 'B' ? 'A' : 'D', holder);
        etikett(c, 'HOLD', kx, y + 26, 10, P.hvit, 'center');
    }
}

/** Båter som er nede, driver ut i mørket med lanternene sine. */
export function driver(c: CanvasRenderingContext2D, g: Game, fx: Fx) {
    const vy = vannY(g.t);
    for (const d of fx.driver) {
        const b = g.båter[d.båt];
        const alder = g.t - d.t0;
        const k = Math.min(1, alder / 6);
        const e = 1 - (1 - k) ** 3;
        const mål = d.side === 'B' ? 236 - d.plass * 13 : 724 + d.plass * 13;
        const x = d.x0 + (mål - d.x0) * e;
        const s = 1 - 0.55 * e - d.plass * 0.025;
        const y =
            vy - 2 - e * (10 + Math.min(d.plass, 5) * 3.5) + Math.sin(g.t * 1.2 + d.båt) * 1.5;
        const w = BÅT_W * s * (b.slag === 'kutter' ? 0.8 : 1);
        c.globalAlpha = 1 - e * 0.35;
        c.fillStyle = P.dyp;
        c.beginPath();
        c.moveTo(x - w / 2, y);
        c.quadraticCurveTo(x, y + 2, x + w / 2, y);
        c.lineTo(x + w / 2 - 6 * s, y + 7 * s);
        c.lineTo(x - w / 2 + 6 * s, y + 7 * s);
        c.closePath();
        c.fill();
        strek(
            c,
            () => {
                c.moveTo(x - w / 2, y);
                c.quadraticCurveTo(x, y + 2, x + w / 2, y);
                c.lineTo(x + w / 2 - 6 * s, y + 7 * s);
                c.lineTo(x - w / 2 + 6 * s, y + 7 * s);
                c.closePath();
            },
            1,
            P.hvit,
            0.75 - e * 0.3
        );
        // Lanternene: én prikk per fem som sitter i båten.
        const prikker = Math.ceil(b.folk / 5);
        c.fillStyle = P.gul;
        for (let i = 0; i < prikker; i++) {
            const px = x - w / 2 + 6 * s + ((w - 12 * s) * (i + 0.5)) / Math.max(1, prikker);
            c.globalAlpha = 0.25;
            c.beginPath();
            c.arc(px, y + 1, 3 * s + 1, 0, Math.PI * 2);
            c.fill();
            c.globalAlpha = 0.95;
            c.fillRect(px - 0.9, y, 1.8, 1.8);
        }
    }
    c.globalAlpha = 1;
}

/** Landgangen fra dekket til båten den peker mot, og folk som går over den. */
export function landgang(c: CanvasRenderingContext2D, g: Game, fx: Fx, a: number) {
    for (const side of ['B', 'S'] as Side[]) {
        const b = klarBåt(g, side);
        if (!b) continue;
        const p = båtPos(g, b);
        const fra = iVerden(side === 'B' ? SKROG.x0 - 10 : SKROG.x1 + 10, DEKK_Y(7) - 1, a);
        const w = b.slag === 'kutter' ? BÅT_W * 0.8 : BÅT_W;
        const til = { x: p.x + (side === 'B' ? w / 2 - 12 : -w / 2 + 12), y: p.y };
        const aktiv = g.landgang === side;
        if (!aktiv) {
            c.setLineDash([3, 5]);
            strek(
                c,
                () => {
                    c.moveTo(fra.x, fra.y);
                    c.lineTo(til.x, til.y);
                },
                1,
                P.blyant,
                0.6
            );
            c.setLineDash([]);
            continue;
        }
        const flyter = g.t >= g.landgangKlar && g.kø.length > 0 && ledig(b) > 0;
        const farge = flyter ? P.gul : P.hvit;
        const dx = til.x - fra.x;
        const dy = til.y - fra.y;
        const l = Math.hypot(dx, dy);
        const nx = -dy / l;
        const ny = dx / l;
        strek(
            c,
            () => {
                c.moveTo(fra.x + nx * 2.5, fra.y + ny * 2.5);
                c.lineTo(til.x + nx * 2.5, til.y + ny * 2.5);
                c.moveTo(fra.x - nx * 2.5, fra.y - ny * 2.5);
                c.lineTo(til.x - nx * 2.5, til.y - ny * 2.5);
                for (let s = 6; s < l; s += 6) {
                    const x = fra.x + (dx * s) / l;
                    const y = fra.y + (dy * s) / l;
                    c.moveTo(x + nx * 2.5, y + ny * 2.5);
                    c.lineTo(x - nx * 2.5, y - ny * 2.5);
                }
            },
            1.3,
            farge,
            0.95
        );
        // Folk som går over.
        c.fillStyle = P.gul;
        for (const wk of fx.gåere) {
            if (wk.side !== side) continue;
            const k = Math.min(1, (g.t - wk.t0) / 0.45);
            const x = fra.x + dx * k;
            const y = fra.y + dy * k - Math.abs(Math.sin(k * Math.PI * 3)) * 1.2;
            figur(c, x, y, 11, artAv(Math.floor(wk.seed * 1000)));
        }
    }
}

export function plask(c: CanvasRenderingContext2D, g: Game, fx: Fx) {
    for (const p of fx.plask) {
        const k = (g.t - p.t0) / 2.5;
        const vy = vannY(g.t);
        c.strokeStyle = P.hvit;
        c.lineWidth = 1;
        for (let r = 0; r < (p.stor ? 3 : 2); r++) {
            const kk = k - r * 0.12;
            if (kk <= 0) continue;
            c.globalAlpha = Math.max(0, 0.8 * (1 - kk));
            c.beginPath();
            c.ellipse(p.x, vy + 2, 14 + kk * 90, 3 + kk * 9, 0, 0, Math.PI * 2);
            c.stroke();
        }
        if (p.stor && k < 0.3) {
            c.globalAlpha = 1 - k / 0.3;
            for (let i = 0; i < 9; i++) {
                const a = Math.PI + (i / 8) * Math.PI;
                const r = 8 + k * 120;
                c.fillStyle = P.hvit;
                c.fillRect(p.x + Math.cos(a) * r * 0.9, vy + Math.sin(a) * r * 0.35, 1.6, 1.6);
            }
        }
    }
    c.globalAlpha = 1;
    for (const s of fx.tapt) {
        const k = (g.t - s.t0) / 3;
        c.globalAlpha = 1 - k;
        etikett(c, 'TAPT', s.x, s.y + 20 + k * 40, 13, P.rød, 'center');
    }
    c.globalAlpha = 1;
}

/** «FULL»-stempelet når en full båt lander. */
export function stempel(c: CanvasRenderingContext2D, g: Game, fx: Fx) {
    for (const s of fx.stempel) {
        const k = (g.t - s.t0) / 2.4;
        const inn = Math.min(1, k * 8);
        const sk = 1.6 - 0.6 * inn;
        c.save();
        c.translate(s.x, vannY(g.t) - 34);
        c.rotate(-0.12);
        c.scale(sk, sk);
        c.globalAlpha = inn * (k > 0.75 ? (1 - k) / 0.25 : 1);
        strek(c, () => c.rect(-28, -11, 56, 22), 2, P.gul, 1);
        etikett(c, 'FULL', 0, 1, 15, P.gul, 'center', 800);
        c.restore();
    }
    c.globalAlpha = 1;
}

/**
 * Tallene som flyter opp fra båten når den treffer vannet: lite, for stort, riktig
 * størrelse, så stiger de og blekner. TOMME er like stort som REDDET - og rødt.
 */
export function flytTall(c: CanvasRenderingContext2D, g: Game, fx: Fx) {
    for (const s of fx.tall) {
        const k = g.t - s.t0;
        if (k < 0) continue;
        const sk =
            k < 0.12 ? 0.4 + (k / 0.12) * 1.0 : k < 0.3 ? 1.4 - ((k - 0.12) / 0.18) * 0.4 : 1;
        const y = vannY(g.t) - 62 - s.rekke * 26 - k * 16;
        const x = Math.max(70, Math.min(ARK.w - 70, s.x));
        c.save();
        c.translate(x, y);
        c.scale(sk, sk);
        c.globalAlpha = k > 1.8 ? Math.max(0, 1 - (k - 1.8) / 0.8) : 1;
        c.shadowColor = P.dyp;
        c.shadowBlur = 6;
        etikett(c, s.tekst, 0, 0, 22, s.rød ? P.rød : P.gul, 'center', 800);
        c.restore();
    }
    c.globalAlpha = 1;
}

export function raketter(c: CanvasRenderingContext2D, g: Game, fx: Fx) {
    for (const r of fx.raketter) {
        const k = g.t - r.t0;
        const top = { x: MIDT + r.dx, y: 92 };
        if (k < 1.1) {
            const e = k / 1.1;
            const y = DEKK_Y(7) - 20 - (DEKK_Y(7) - 20 - top.y) * e;
            const x = MIDT + r.dx * e;
            c.strokeStyle = P.hvit;
            c.lineWidth = 1.2;
            c.globalAlpha = 0.9;
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(MIDT + r.dx * Math.max(0, e - 0.15), y + 26);
            c.stroke();
        } else {
            const s = k - 1.1;
            const n = 16;
            c.fillStyle = P.hvit;
            for (let i = 0; i < n; i++) {
                const a = (i / n) * Math.PI * 2;
                const rr = 8 + s * 34;
                const x = top.x + Math.cos(a) * rr;
                const y = top.y + Math.sin(a) * rr * 0.8 + s * s * 9;
                c.globalAlpha = Math.max(0, 1 - s / 3.2);
                c.fillRect(x - 1, y - 1, 2, 2);
            }
        }
    }
    c.globalAlpha = 1;
}
