// Profilstripa (båtoversikten), tittelfeltet (klokka, reddet mot målet) og tastefeltet.

import { BRETT, type Side } from './levels';
import { brukt, klokke, tomme, vannDekk } from './rules';
import type { Game } from './state';
import { TUNING } from './tuning';
import { MIDT } from './geom';

import { P, TALL, etikett, strek } from './papir';

import { tast } from './former';

// ---------- Profilstripa og tittelfeltet ----------

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
    etikett(c, 'BB', 262, 20, 10, P.blyant, 'right');
    etikett(c, 'SB', 262, 31, 10, P.blyant, 'right');
    etikett(c, 'PROFIL', 698, 21, 10, P.blyant, 'left');
    strek(c, () => c.rect(272, 10, 416, 54), 0.8, P.blyant, 0.5);
}

export function tittelfelt(c: CanvasRenderingContext2D, g: Game) {
    const x = 800;
    const y = 410;
    const w = 150;
    const h = 120;
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
            c.moveTo(x, y + 96);
            c.lineTo(x + w, y + 96);
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
    const mx = bx + (bw * TUNING.seier) / maks;
    strek(
        c,
        () => {
            c.moveTo(mx, y + 85);
            c.lineTo(mx, y + 95);
        },
        1.4,
        P.hvit,
        1
    );
    etikett(c, `MÅL: OVER ${TUNING.seier}`, x + 5, y + 104, 10, P.hvit, 'left');
    etikett(c, `TOMME ${tomme(g)}`, x + 5, y + 115, 10, P.blyant, 'left');
}

export function tasteFelt(c: CanvasRenderingContext2D, g: Game) {
    const x = 10;
    const y = 410;
    const w = 156;
    const h = 120;
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
        },
        1.1,
        P.hvit,
        0.85
    );
    const br = BRETT[g.brett];
    etikett(c, br.banner, x + 6, y + 10, 10, P.hvit, 'left');
    etikett(c, br.tittel.toUpperCase(), x + 6, y + 22, 10, P.blyant, 'left');
    tast(c, x + 18, y + 44, '←');
    tast(c, x + 40, y + 44, '→');
    etikett(c, 'BYTT SIDE', x + 56, y + 45, 10, P.hvit, 'left');
    tast(c, x + 18, y + 66, 'A', g.hold === 'B');
    etikett(c, 'HOLD: FIR BB', x + 34, y + 67, 10, P.hvit, 'left');
    tast(c, x + 18, y + 88, 'D', g.hold === 'S');
    etikett(c, 'HOLD: FIR SB', x + 34, y + 89, 10, P.hvit, 'left');
    tast(c, x + 22, y + 109, 'ESC');
    etikett(c, 'PAUSE', x + 44, y + 110, 10, P.blyant, 'left');
}
