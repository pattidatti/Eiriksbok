// Profilstripa (båtoversikten), tittelfeltet (klokka, reddet mot målet) og tastefeltet.

import { BRETT, type Side } from './levels';
import { brukt, klokke, nesteTrinn, tomme, vannDekk } from './rules';
import type { Game } from './state';
import { TUNING } from './tuning';
import { MIDT } from './geom';

import { P, SKRIFT, TALL, etikett, strek } from './papir';

import { tast, type Melding } from './former';

// ---------- Profilstripa og tittelfeltet ----------

/**
 * De 16 vanntette rommene i profilen: hvor mange som er fulle (med brøk for det som fylles nå).
 * Bare visning, knyttet til vannet i tuning.ts: fire er fulle når runden starter, det femte
 * fylles like etter, og det siste når skipet er borte.
 */
const VANN_START = vannDekk(TUNING.start);
const VANN_SLUTT = TUNING.vann[TUNING.vann.length - 1].dekk;
export const ROM = 16;
export const fulleRom = (t: number) =>
    4 + 12 * Math.max(0, Math.min(1, (vannDekk(t) - VANN_START) / (VANN_SLUTT - VANN_START)));
/** Da det femte rommet ble fullt (spilltid). */
const FEMTE = (() => {
    for (let t = TUNING.start; t <= TUNING.slutt; t += 0.1) if (fulleRom(t) >= 5) return t;
    return Infinity;
})();
const ROM_LAPP_SEK = 7;

/** Rommene i skrogets ramme i profilen (bauen til høyre, rom 1 lengst fram). */
function rom(c: CanvasRenderingContext2D, t: number, L: number) {
    const n = fulleRom(t);
    const x1 = L - 4;
    const x0 = -L + 10;
    const rw = (x1 - x0) / ROM;
    const topp = -3;
    const bunn = 11;
    for (let i = 0; i < ROM; i++) {
        const fyll = Math.max(0, Math.min(1, n - i));
        if (fyll <= 0) break;
        const xr = x1 - i * rw;
        const hh = (bunn - topp) * fyll;
        c.fillStyle = '#3f6db0';
        c.globalAlpha = 0.9;
        c.fillRect(xr - rw + 0.6, bunn - hh, rw - 1.2, hh);
    }
    c.globalAlpha = 1;
    // Skotten: veggene gikk ikke helt opp til dekket, så vannet rant over.
    for (let i = 1; i < ROM; i++) {
        const x = x1 - i * rw;
        const grense = i === 4;
        c.strokeStyle = grense ? P.rød : P.blyant;
        c.lineWidth = grense ? 1.4 : 0.8;
        c.beginPath();
        c.moveTo(x, bunn);
        c.lineTo(x, topp + (grense ? -4 : 1));
        c.stroke();
    }
}

export function profil(c: CanvasRenderingContext2D, g: Game) {
    const cx = MIDT;
    const cy = 42;
    const trim = (vannDekk(g.t) / 7) * 0.09;
    c.save();
    c.beginPath();
    c.rect(272, 10, 416, 54);
    c.clip();
    // Havet i profilen.
    const wy = 56 - (vannDekk(g.t) / 7) * 5;
    c.fillStyle = P.dyp;
    c.globalAlpha = 0.8;
    c.fillRect(272, wy, 416, 30);
    c.globalAlpha = 1;
    c.translate(cx, cy);
    c.rotate(trim);
    const L = 170;
    strek(
        c,
        () => {
            c.moveTo(-L, -6);
            c.lineTo(L - 10, -6);
            c.lineTo(L + 6, -10);
            c.lineTo(L - 4, 12);
            c.lineTo(-L + 10, 12);
            c.lineTo(-L - 4, 4);
            c.closePath();
            c.moveTo(-L + 30, -6);
            c.lineTo(-L + 30, -12);
            c.lineTo(L - 50, -12);
            c.lineTo(L - 50, -6);
        },
        1.2,
        P.hvit,
        0.9
    );
    rom(c, g.t, L);
    // Fire skorsteiner.
    for (let i = 0; i < 4; i++) {
        const x = -96 + i * 62;
        strek(c, () => c.rect(x, -24, 11, 12), 1, P.hvit, 0.8);
    }
    // De 20 båtplassene: babord øverst, styrbord nederst.
    const sider: Side[] = ['B', 'S'];
    for (const side of sider) {
        const liste = g.båter.filter((b) => b.side === side);
        liste.forEach((b, i) => {
            const x = -L + 40 + i * 25 + (i >= 5 ? 22 : 0);
            const y = side === 'B' ? -21 : -16;
            const fill =
                b.tilstand === 'nede'
                    ? P.gul
                    : b.tilstand === 'tapt'
                      ? P.rød
                      : b.tilstand === 'venter'
                        ? null
                        : P.hvit;
            c.strokeStyle = b.tilstand === 'venter' ? P.blyant : P.hvit;
            c.lineWidth = 0.8;
            c.beginPath();
            c.moveTo(x - 7, y);
            c.quadraticCurveTo(x, y + 4, x + 7, y);
            c.stroke();
            if (fill && b.tilstand !== 'henger') {
                const andel = b.tilstand === 'nede' ? b.folk / b.plasser : 1;
                c.fillStyle = fill;
                c.fillRect(x - 6, y - 3 + 3 * (1 - andel), 12, 3 * andel);
            }
            if (b.tilstand === 'henger' || b.tilstand === 'fires') {
                c.globalAlpha = 0.5 + 0.5 * Math.sin(g.t * 6);
                c.fillStyle = P.hvit;
                c.fillRect(x - 6, y - 3, 12, 3);
                c.globalAlpha = 1;
            }
        });
    }
    c.restore();
    etikett(c, 'BABORD = VENSTRE', 262, 20, 10, P.blyant, 'right');
    etikett(c, 'STYRBORD = HØYRE', 262, 31, 10, P.blyant, 'right');
    etikett(c, 'PROFIL', 698, 21, 10, P.blyant, 'left');
    // De vanntette rommene: hvor mange som er fulle.
    const fulle = Math.floor(fulleRom(g.t));
    etikett(c, 'VANNTETTE ROM', 698, 37, 10, P.blyant, 'left');
    etikett(c, `${fulle} AV ${ROM} FULLE`, 698, 50, 11, fulle > 4 ? P.rød : P.hvit, 'left', 800);
    // Lappen når det femte rommet er fullt.
    const siden = g.t - FEMTE;
    if (siden >= 0 && siden < ROM_LAPP_SEK) {
        const tekst = 'SKIPET TÅLTE BARE 4 FULLE ROM';
        c.font = `800 12px ${SKRIFT}`;
        const tw = c.measureText(tekst).width;
        c.globalAlpha = siden > ROM_LAPP_SEK - 1 ? ROM_LAPP_SEK - siden : 1;
        c.fillStyle = P.papir;
        c.fillRect(MIDT - tw / 2 - 8, 68, tw + 16, 18);
        strek(c, () => c.rect(MIDT - tw / 2 - 8, 68, tw + 16, 18), 1.1, P.rød, 0.9);
        etikett(c, tekst, MIDT, 77.5, 12, P.rød, 'center', 800);
        c.globalAlpha = 1;
    }
    strek(c, () => c.rect(272, 10, 416, 54), 0.8, P.blyant, 0.5);
}

export function tittelfelt(c: CanvasRenderingContext2D, g: Game) {
    const x = 800;
    const y = 396;
    const w = 150;
    const h = 136;
    c.fillStyle = P.papir;
    c.globalAlpha = 0.92;
    c.fillRect(x, y, w, h);
    c.globalAlpha = 1;
    strek(
        c,
        () => {
            c.rect(x, y, w, h);
            c.moveTo(x, y + 30);
            c.lineTo(x + w, y + 30);
            c.moveTo(x, y + 70);
            c.lineTo(x + w, y + 70);
            c.moveTo(x, y + 112);
            c.lineTo(x + w, y + 112);
        },
        1.1,
        P.hvit,
        0.85
    );
    etikett(c, 'HARLAND OG WOLFF', x + w / 2, y + 10, 10, P.blyant, 'center');
    etikett(c, 'TITANIC - SPANT 80', x + w / 2, y + 22, 10, P.hvit, 'center');
    c.fillStyle = P.hvit;
    c.font = `800 34px ${TALL}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(klokke(g.t), x + w / 2, y + 51);
    // Reddet mot målet: flere enn i 1912.
    const r = brukt(g);
    const slått = r > TUNING.seier;
    etikett(c, 'REDDET', x + 5, y + 79, 10, P.blyant, 'left');
    etikett(c, String(r), x + w - 5, y + 80, 15, slått ? P.gul : P.hvit, 'right', 800);
    const bx = x + 5;
    const bw = w - 10;
    const maks = 1000;
    strek(c, () => c.rect(bx, y + 88, bw, 4), 0.8, P.hvit, 0.7);
    c.fillStyle = P.gul;
    c.fillRect(bx, y + 88, (bw * Math.min(r, maks)) / maks, 4);
    // Rangtrinnene som streker på stolpen: den første (1912) er målet.
    TUNING.ranger.forEach(([grense], i) => {
        const mx = bx + (bw * grense) / maks;
        strek(
            c,
            () => {
                c.moveTo(mx, y + (i === 0 ? 85 : 87));
                c.lineTo(mx, y + (i === 0 ? 95 : 93));
            },
            i === 0 ? 1.4 : 1,
            r > grense ? P.gul : P.hvit,
            1
        );
    });
    const neste = nesteTrinn(r);
    etikett(
        c,
        !slått ? `MÅL: OVER ${TUNING.seier}` : neste ? `NESTE: OVER ${neste[0]}` : 'ØVERSTE TRINN',
        x + 5,
        y + 104,
        10,
        slått ? P.gul : P.hvit,
        'left'
    );
    // TOMME like stort som REDDET: tomme plasser er borte for alltid.
    const tom = tomme(g);
    etikett(c, 'TOMME', x + 5, y + 124, 10, P.blyant, 'left');
    etikett(c, String(tom), x + w - 5, y + 125, 15, tom > 0 ? P.rød : P.hvit, 'right', 800);
}

/** Fase-boksen nede til venstre: hit bytter fase og meldinger fra natta, så skroget er fritt. */
export const FASE_BOKS = { x: 10, y: 466, w: 210, h: 64 };

export function tasteFelt(c: CanvasRenderingContext2D, g: Game, m: Melding | null | undefined) {
    // Fasen (eller en ny melding) og sidebyttet: A, D og S står ved båtene og porten.
    const { x, y, w, h } = FASE_BOKS;
    const alder = m ? g.t - m.t0 : Infinity;
    const aktiv = !!m && alder >= 0 && alder < m.sek;
    c.fillStyle = P.papir;
    c.globalAlpha = 0.92;
    c.fillRect(x, y, w, h);
    c.globalAlpha = 1;
    if (aktiv && m) {
        // Blink i fargen de første sekundene, så en svak tone resten av tiden.
        const blink = alder < 1.2 ? 0.5 + 0.5 * Math.sin(alder * 14) : 0.4;
        c.fillStyle = m.farge;
        c.globalAlpha = 0.12 + 0.18 * blink;
        c.fillRect(x, y, w, 40);
        c.globalAlpha = 1;
    }
    strek(
        c,
        () => {
            c.rect(x, y, w, h);
            c.moveTo(x, y + 40);
            c.lineTo(x + w, y + 40);
        },
        aktiv ? 1.6 : 1.1,
        aktiv && m ? m.farge : P.hvit,
        0.85
    );
    const br = BRETT[g.brett];
    if (aktiv && m) {
        // Ny melding: stor nok til å se fra øyekroken, krymper om teksten er lang.
        let px = 15;
        c.font = `800 ${px}px ${SKRIFT}`;
        while (px > 10 && c.measureText(m.tekst).width > w - 16) {
            px--;
            c.font = `800 ${px}px ${SKRIFT}`;
        }
        const pop = alder < 0.25 ? 1 + (0.25 - alder) * 0.8 : 1;
        c.save();
        c.translate(x + 8, y + 20);
        c.scale(pop, pop);
        etikett(c, m.tekst, 0, 0, px, m.farge, 'left', 800);
        c.restore();
    } else {
        etikett(c, br.banner, x + 8, y + 13, 12, P.hvit, 'left', 800);
        etikett(c, br.tittel.toUpperCase(), x + 8, y + 28, 10, P.blyant, 'left');
    }
    tast(c, x + 20, y + 52, '←');
    tast(c, x + 42, y + 52, '→');
    etikett(c, 'BYTT SIDE', x + 58, y + 53, 10, P.hvit, 'left');
}
