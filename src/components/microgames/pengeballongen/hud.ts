// HUD-en er selve litografibladet: papirmarg med trykkekant, bildeteksten i nedre marg
// (år og sted i kursiv), «Spart» oppe til høyre, tidslinja 1815-1884 (målet), Ueland i et
// ovalt portrett med gangeren, og valgstabelen av krittmynter med grensen som karmin strek.

import { P } from './art';
import type { Fx } from './fx';
import { BRETT } from './levels';
import { grenseVises, iBåndet } from './rules';
import { FONT } from './scene';
import type { Game } from './state';
import { TUNING } from './tuning';

const T = TUNING;
const PAPIR = '#eeebdf';
export const MARG = { side: 10, topp: 10, bunn: 500 };

const spd = (n: number) => Math.floor(n).toLocaleString('nb-NO');

export interface HudValg {
    meny: boolean;
    rekord: number;
    øving: boolean;
}

export function tegnRamme(ctx: CanvasRenderingContext2D, g: Game, meny: boolean) {
    // Papirmargen rundt bildet og trykkekanten.
    ctx.fillStyle = PAPIR;
    ctx.fillRect(0, 0, 960, MARG.topp);
    ctx.fillRect(0, 0, MARG.side, 540);
    ctx.fillRect(960 - MARG.side, 0, MARG.side, 540);
    ctx.fillRect(0, MARG.bunn, 960, 40);
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(MARG.side, MARG.topp, 960 - 2 * MARG.side, MARG.bunn - MARG.topp);
    ctx.globalAlpha = 0.35;
    ctx.strokeRect(4, 4, 952, 532);
    ctx.globalAlpha = 1;
    // Bildeteksten i fin kursiv under bildet, som på bladene fra 1840-tallet.
    ctx.fillStyle = P.kritt;
    ctx.textAlign = 'center';
    ctx.font = `italic 21px ${FONT}`;
    const sted = meny
        ? 'Pengeballongen - Parti af Norge, 1815-1884'
        : BRETT[g.brett].sted.replace(/^\d{4}/, String(Math.floor(g.år)));
    ctx.fillText(sted, 480, 527);
}

export function tegnHud(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, v: HudValg) {
    if (v.meny) return;
    const tid = fx.klokke;

    // Nede til venstre i margen: tasten, så eleven alltid ser grepet.
    ctx.textAlign = 'left';
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = P.kritt;
    const tw = tast(ctx, 16, 508, 'MELLOMROM');
    ctx.textAlign = 'left';
    ctx.fillText('eller mus = penger i brenneren', 16 + tw + 8, 524);
    ctx.textAlign = 'right';
    ctx.font = `italic 14px ${FONT}`;
    ctx.fillText(v.øving ? 'Øving fra 1870 (teller ikke)' : v.rekord ? `Rekord ${spd(v.rekord)} Spd.` : '', 940, 98);

    // Oppe til høyre: Spart, stor og rolig. Spretter når mynter lander.
    const sk = 1 + fx.sprett * 0.18;
    ctx.save();
    ctx.translate(940, 50);
    ctx.scale(sk, sk);
    ctx.textAlign = 'right';
    ctx.fillStyle = P.kritt;
    ctx.font = `italic 15px ${FONT}`;
    ctx.fillText('Spart for bøndene', 0, -24);
    ctx.font = `italic 32px ${FONT}`;
    ctx.fillStyle = fx.sprett > 0.3 ? P.silkeMørk : P.kritt;
    ctx.fillText(`${spd(g.spart)} Spd.`, 0, 6);
    ctx.restore();
    // Hva brenneren koster nå (kongeveiens flosshatter gjør den dyrere).
    ctx.textAlign = 'right';
    ctx.font = `italic 14px ${FONT}`;
    ctx.fillStyle = g.kongeHatter ? P.karmin : P.kritt;
    const pris = T.penger.perSek * (1 + T.veiskille.kongeveiKostnad * g.kongeHatter);
    ctx.fillText(
        `Brenneren: ${pris.toLocaleString('nb-NO', { maximumFractionDigits: 1 })} Spd. i sekundet`,
        940,
        78
    );

    tidslinje(ctx, g);
    if (g.år >= T.ganger.fra - 0.3) portrett(ctx, g, fx, tid);
    if (g.stabel) stabel(ctx, g, fx, tid);

    if (fx.blink > 0) {
        ctx.globalAlpha = fx.blink * 0.5;
        ctx.fillStyle = fx.blinkFarge;
        ctx.fillRect(0, 0, 960, 540);
        ctx.globalAlpha = 1;
    }
}

function tast(ctx: CanvasRenderingContext2D, x: number, y: number, t: string): number {
    ctx.save();
    ctx.font = `bold 12px Georgia, serif`;
    const w = Math.max(ctx.measureText(t).width, t.length * 9.5) + 12;
    ctx.fillStyle = P.hvit;
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.2;
    ctx.fillRect(x, y, w, 21);
    ctx.strokeRect(x, y, w, 21);
    ctx.fillRect(x, y + 19, w, 3);
    ctx.fillStyle = P.kritt;
    ctx.textAlign = 'left';
    ctx.fillText(t, x + 6, y + 15);
    ctx.restore();
    return w;
}

/** Målet: tidslinja 1815-1884 øverst i midten, med valgene som små streker. */
function tidslinje(ctx: CanvasRenderingContext2D, g: Game) {
    const a = 340;
    const b = 620;
    const y = 30;
    const u = (år: number) => a + ((b - a) * (år - T.år.start)) / (T.år.slutt - T.år.start);
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(a, y);
    ctx.lineTo(b, y);
    ctx.stroke();
    for (const v of g.ter.valg) {
        ctx.strokeStyle = v.ekte ? P.karmin : P.halv;
        ctx.beginPath();
        ctx.moveTo(u(v.år), y - 4);
        ctx.lineTo(u(v.år), y + 4);
        ctx.stroke();
    }
    ctx.fillStyle = P.silke;
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1;
    const x = u(Math.min(g.år, T.år.slutt));
    ctx.beginPath();
    ctx.ellipse(x, y - 4, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(x - 2, y + 2, 4, 3);
    ctx.fillStyle = P.kritt;
    ctx.font = `italic 15px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText('1815', a - 8, y + 5);
    ctx.textAlign = 'left';
    ctx.fillText('1884 Løvebakken', b + 8, y + 5);
}

/** Ueland i et ovalt portrett (som i stortingskalenderne), med gangeren under. */
function portrett(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, tid: number) {
    const cx = 62;
    const cy = 62;
    const inn = Math.min(1, (g.år - (T.ganger.fra - 0.3)) / 0.3);
    const s = (0.6 + 0.4 * inn) * (1 + fx.gangerSprett * 0.25);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.globalAlpha = inn;
    ctx.fillStyle = PAPIR;
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Framgang mot neste trinn: en bue rundt ovalen.
    if (g.ganger < T.ganger.maks && iBåndet(g)) {
        ctx.strokeStyle = P.silke;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(
            0,
            0,
            40,
            46,
            0,
            -Math.PI / 2,
            -Math.PI / 2 + (Math.PI * 2 * g.gangerTid) / T.ganger.trinn
        );
        ctx.stroke();
    }
    // Ueland: rundt ansikt, kragebart, lue.
    const jubel = g.ganger > 1 ? Math.sin(tid * 8) * g.ganger * 0.6 : 0;
    ctx.translate(0, jubel * 0.4);
    ctx.fillStyle = '#e8d6bf';
    ctx.beginPath();
    ctx.ellipse(0, -2, 14, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = P.halv;
    ctx.beginPath();
    ctx.moveTo(-14, -2);
    ctx.quadraticCurveTo(-13, 20, 0, 22);
    ctx.quadraticCurveTo(13, 20, 14, -2);
    ctx.quadraticCurveTo(8, 10, 0, 10);
    ctx.quadraticCurveTo(-8, 10, -14, -2);
    ctx.fill();
    ctx.fillStyle = P.kritt;
    ctx.fillRect(-15, -22, 30, 6);
    ctx.beginPath();
    ctx.arc(-5, -4, 1.6, 0, Math.PI * 2);
    ctx.arc(5, -4, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    if (g.ganger > 1) ctx.arc(0, 4, 4, 0, Math.PI);
    else ctx.rect(-4, 4, 8, 1.4);
    ctx.fill();
    ctx.restore();
    // Gangeren på en plakett under.
    ctx.globalAlpha = inn;
    ctx.fillStyle = g.ganger > 1 ? P.silke : P.kritt;
    ctx.textAlign = 'center';
    ctx.font = `italic bold ${28 + fx.gangerSprett * 10}px ${FONT}`;
    ctx.fillText(`×${g.ganger}`, cx + 70, cy + 4);
    ctx.font = `italic 14px ${FONT}`;
    ctx.fillStyle = P.kritt;
    ctx.fillText('Ueland', cx + 70, cy + 22);
    ctx.globalAlpha = 1;
}

/** Pengestabelen siden forrige valg: krittmynter på rad, grensen som karmin strek. */
function stabel(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, tid: number) {
    const x = 24;
    const y = 132;
    const perMynt = 2;
    const grense = T.penger.grense;
    const maks = Math.ceil((grense * 1.35) / perMynt);
    const gap = 8.5;
    const vis = grenseVises(g);
    const andel = g.periode / grense;
    const fare = vis && andel > 0.8;
    // Papirlapp bak.
    const bredde = maks * gap + 64;
    ctx.fillStyle = 'rgba(238,235,223,0.88)';
    ctx.fillRect(x - 10, y - 28, bredde, 66);
    const neste = g.ter.valg[g.nesteValg];
    ctx.fillStyle = P.kritt;
    ctx.font = `italic 15px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(neste ? `Brukt før valget ${neste.år}` : 'Brukt', x, y - 10);
    const fulle = g.periode / perMynt;
    for (let i = 0; i < maks; i++) {
        const fyll = Math.min(1, Math.max(0, fulle - i));
        const mx = x + 5 + i * gap;
        const over = vis && i * perMynt >= grense;
        const dy = fyll > 0 && fyll < 1 ? (1 - fyll) * -8 : 0;
        ctx.strokeStyle = P.kritt;
        ctx.lineWidth = 1.1;
        ctx.globalAlpha = fyll > 0 ? 1 : 0.3;
        ctx.beginPath();
        ctx.arc(mx, y + 6 + dy, 4.6, 0, Math.PI * 2);
        if (fyll > 0) {
            ctx.fillStyle = over ? P.karmin : P.hvit;
            ctx.fill();
        }
        ctx.stroke();
        if (fyll > 0) {
            ctx.beginPath();
            ctx.arc(mx, y + 6 + dy, 2.2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    ctx.globalAlpha = 1;
    if (vis) {
        const gx = x + 5 + (grense / perMynt - 0.5) * gap;
        const puls = fare ? 0.5 + 0.5 * Math.sin(tid * 12) : 0;
        ctx.fillStyle = P.karmin;
        ctx.fillRect(gx - 1.5 - puls, y - 4, 3 + puls * 2, 22);
        ctx.font = `italic 13px ${FONT}`;
        ctx.textAlign = 'right';
        ctx.fillText('bøndenes grense', gx + 3, y + 32);
    }
    ctx.fillStyle = fare ? P.karmin : P.kritt;
    ctx.font = `italic 16px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(g.periode)}`, x + 5 + maks * gap + 2, y + 12);
    if (fx.stabelBlink > 0) {
        ctx.strokeStyle = P.karmin;
        ctx.globalAlpha = fx.stabelBlink;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 10, y - 28, bredde, 66);
        ctx.globalAlpha = 1;
    }
}
