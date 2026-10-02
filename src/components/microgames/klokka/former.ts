// Små byggeklosser for tegningen: silhuetter, målelinjer og tastetegn.

import { P, TALL, etikett, strek } from './papir';

export interface TegneValg {
    lav: boolean;
    /** Menyen og slutt-skjermen: ingen HUD-hint. */
    spiller: boolean;
}

// ---------- Små byggeklosser ----------

/** En silhuett uten ansikt: hode og kropp (frakk, kjole eller barn). */
export function figur(
    c: CanvasRenderingContext2D,
    x: number,
    fot: number,
    h: number,
    art: number,
    kant = false
) {
    if (art === 2) h *= 0.72;
    const r = h * 0.13;
    c.beginPath();
    c.arc(x, fot - h + r, r, 0, Math.PI * 2);
    if (kant) c.stroke();
    c.fill();
    const skulder = fot - h + r * 2.1;
    const b = h * 0.17;
    c.beginPath();
    if (art === 1) {
        // Kjole: smal øverst, vid nederst.
        c.moveTo(x - b * 0.8, skulder);
        c.lineTo(x + b * 0.8, skulder);
        c.lineTo(x + b * 1.5, fot);
        c.lineTo(x - b * 1.5, fot);
    } else {
        // Frakk.
        c.moveTo(x - b, skulder);
        c.lineTo(x + b, skulder);
        c.lineTo(x + b * 1.1, fot - h * 0.12);
        c.lineTo(x + b * 0.4, fot - h * 0.12);
        c.lineTo(x + b * 0.4, fot);
        c.lineTo(x - b * 0.4, fot);
        c.lineTo(x - b * 0.4, fot - h * 0.12);
        c.lineTo(x - b * 1.1, fot - h * 0.12);
    }
    c.closePath();
    if (kant) c.stroke();
    c.fill();
}

export const artAv = (n: number) => {
    const v = (Math.sin(n * 12.9898) * 43758.5453) % 1;
    const f = v < 0 ? v + 1 : v;
    return f < 0.42 ? 0 : f < 0.86 ? 1 : 2;
};

/** Målelinje med piler i begge ender og tallet i midten. */
export function målelinje(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    tekst: string,
    farge: string
) {
    c.font = `700 17px ${TALL}`;
    const tw = c.measureText(tekst).width / 2 + 7;
    strek(
        c,
        () => {
            c.moveTo(x - w / 2, y);
            c.lineTo(x - tw, y);
            c.moveTo(x + tw, y);
            c.lineTo(x + w / 2, y);
            c.moveTo(x - w / 2 + 6, y - 3);
            c.lineTo(x - w / 2, y);
            c.lineTo(x - w / 2 + 6, y + 3);
            c.moveTo(x + w / 2 - 6, y - 3);
            c.lineTo(x + w / 2, y);
            c.lineTo(x + w / 2 - 6, y + 3);
            c.moveTo(x - w / 2, y - 6);
            c.lineTo(x - w / 2, y + 6);
            c.moveTo(x + w / 2, y - 6);
            c.lineTo(x + w / 2, y + 6);
        },
        1,
        farge,
        0.85
    );
    c.fillStyle = farge;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(tekst, x, y + 1);
}

/** Et tastetegn (A, D, ←, →). */
export function tast(c: CanvasRenderingContext2D, x: number, y: number, t: string, aktiv = false) {
    const w = Math.max(18, t.length * 8 + 8);
    c.fillStyle = aktiv ? P.gul : P.papir;
    c.fillRect(x - w / 2, y - 9, w, 18);
    strek(c, () => c.rect(x - w / 2, y - 9, w, 18), 1.2, P.hvit, 0.9);
    etikett(c, t, x, y + 1, 11, aktiv ? P.papir : P.hvit, 'center');
}
