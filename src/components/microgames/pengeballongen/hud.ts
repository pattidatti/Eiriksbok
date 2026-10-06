// HUD-en er selve litografibladet: papirmarg med trykkekant, bildeteksten i nedre marg
// (år og sted i kursiv), «Spart» oppe til høyre, tidslinja 1815-1884 (målet), Ueland i et ovalt portrett
// og budsjettbaren ved ballongen. Alt står på solide papirkort, så teksten er skarp.

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

/** Et solid papirkort med mørk kant og skygge: alt i HUD-en står på slike, så teksten er skarp. */
function kort(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = 'rgba(31,35,38,0.28)';
    ctx.fillRect(x + 3, y + 3, w, h);
    ctx.fillStyle = '#f8f4e8';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
}

export function tegnHud(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, v: HudValg) {
    if (v.meny) return;
    const tid = fx.klokke;

    // Nede til venstre i margen: tastene, så eleven alltid ser grepet.
    ctx.textAlign = 'left';
    ctx.font = `14px ${FONT}`;
    ctx.fillStyle = P.kritt;
    const tx = 16 + tast(ctx, 16, 506, 'MELLOMROM');
    ctx.textAlign = 'left';
    if (!g.harRor) ctx.fillText('= penger i brenneren', tx + 8, 522);
    else {
        // Etter riksretten: to taster, kort tekst, så bildeteksten i midten får plass.
        ctx.fillText('= opp', tx + 8, 522);
        const rx = tx + 58;
        const puls = g.ror ? 0 : 0.5 + 0.5 * Math.sin(tid * 6);
        ctx.globalAlpha = 0.75 + 0.25 * puls;
        const rw = tast(ctx, rx, 506, 'PIL NED');
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
        ctx.font = `bold 14px ${FONT}`;
        ctx.fillStyle = P.silkeMørk;
        ctx.fillText('= roret', rx + rw + 8, 522);
    }

    // Oppe til høyre: Spart, stor og rolig på et kort. Spretter når mynter lander.
    // Ett kort: Spart, rekord og sjansene nederst.
    const medSjanser = g.år >= T.penger.førsteEkteValg - 0.5;
    kort(ctx, 776, 16, 168, medSjanser ? 104 : 76);
    ctx.textAlign = 'right';
    ctx.fillStyle = P.kritt;
    ctx.font = `italic 15px ${FONT}`;
    ctx.fillText(v.øving ? 'Spart (øving)' : 'Spart for bøndene', 934, 36);
    const sk = 1 + fx.sprett * 0.18;
    ctx.save();
    ctx.translate(934, 66);
    ctx.scale(sk, sk);
    ctx.font = `bold 30px ${FONT}`;
    ctx.fillStyle = fx.sprett > 0.3 ? P.silkeMørk : P.kritt;
    ctx.fillText(`${spd(g.spart)} Spd.`, 0, 0);
    ctx.restore();
    ctx.font = `14px ${FONT}`;
    ctx.fillStyle = P.kritt;
    ctx.fillText(v.rekord && !v.øving ? `Rekord ${spd(v.rekord)}` : '', 934, 85);
    // Sjansene: små ballonger under kortet (fra det første ekte valget).
    if (medSjanser) sjanser(ctx, g, fx, tid);

    tidslinje(ctx, g);
    if (g.år >= T.ganger.fra - 0.3) portrett(ctx, g, fx, tid);
    if (grenseVises(g) && g.mode === 'play') budsjett(ctx, g, fx, tid);

    if (fx.blink > 0) {
        ctx.globalAlpha = fx.blink * 0.5;
        ctx.fillStyle = fx.blinkFarge;
        ctx.fillRect(0, 0, 960, 540);
        ctx.globalAlpha = 1;
    }
}

/** Sjansene igjen: tre små ballonger. En brukt sjanse er et tomt omriss. */
function sjanser(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, tid: number) {
    const n = T.sjekk.sjanser;
    const x0 = 934 - n * 22;
    ctx.textAlign = 'right';
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillStyle = P.kritt;
    ctx.fillText('Sjanser', x0 - 8, 112);
    for (let i = 0; i < n; i++) {
        const har = i < g.sjanser;
        const cx = x0 + 10 + i * 22;
        const puls = !har && i === g.sjanser ? Math.max(0, fx.blink) : 0;
        ctx.beginPath();
        ctx.ellipse(cx, 103 - puls * 3, 7, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = har ? P.silke : 'transparent';
        if (har) ctx.fill();
        ctx.strokeStyle = har ? P.kritt : P.halv;
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.fillStyle = har ? P.kritt : P.halv;
        ctx.fillRect(cx - 2.5, 112, 5, 3);
    }
    void tid;
}

/**
 * Budsjettet til neste valg: én stående bar rett ved ballongen. Full bar = alt bøndene tillater
 * denne perioden. Den tømmes når du fyrer, og fylles igjen ved hvert valg.
 */
function budsjett(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, tid: number) {
    const B = T.ballong;
    const igjen = Math.max(0, 1 - g.periode / T.penger.grense);
    const fare = igjen < 0.25;
    const inn = Math.min(1, (g.år - (T.penger.førsteEkteValg - 1.2)) / 0.4);
    const w = 16;
    const h = 92;
    const x = B.skjermX - B.halvBredde - 34;
    const y = Math.max(MARG.topp + 34, Math.min(MARG.bunn - h - 8, g.y - B.høyde + 2));
    ctx.save();
    ctx.globalAlpha = inn;
    const rist = fare ? Math.sin(tid * 30) * 1.2 : 0;
    ctx.translate(rist, 0);
    kort(ctx, x - 3, y - 3, w + 6, h + 6);
    // Bondetinget 1833: baren gløder i to år - bøndene har tatt over pengene.
    const bonde = Math.max(0, 1 - (g.år - T.penger.førsteEkteValg) / 2);
    if (bonde > 0 && g.år >= T.penger.førsteEkteValg) {
        ctx.strokeStyle = P.silke;
        ctx.lineWidth = 3 + 3 * Math.sin(tid * 10) ** 2;
        ctx.globalAlpha = inn * bonde;
        ctx.strokeRect(x - 7, y - 7, w + 14, h + 14);
        ctx.globalAlpha = inn;
    }
    // Fyllet: lyst og trygt, karmin når det nesten er tomt.
    const fh = (h - 4) * igjen;
    ctx.fillStyle = fare ? P.karmin : P.silke;
    if (fare) ctx.globalAlpha = inn * (0.65 + 0.35 * Math.sin(tid * 12));
    ctx.fillRect(x + 2, y + 2 + (h - 4 - fh), w - 4, fh);
    ctx.globalAlpha = inn;
    // Myntstreker hver 5. spesidaler.
    ctx.strokeStyle = 'rgba(46,50,54,0.35)';
    ctx.lineWidth = 1;
    for (let k = 5; k < T.penger.grense; k += 5) {
        const ly = y + 2 + (h - 4) * (k / T.penger.grense);
        ctx.beginPath();
        ctx.moveTo(x + 2, ly);
        ctx.lineTo(x + w - 2, ly);
        ctx.stroke();
    }
    if (fx.stabelBlink > 0) {
        ctx.strokeStyle = P.karmin;
        ctx.globalAlpha = fx.stabelBlink;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 5, y - 5, w + 10, h + 10);
        ctx.globalAlpha = inn;
    }
    // Lappen over: når neste valg er.
    const neste = g.ter.valg[g.nesteValg];
    const etikett = bonde > 0.4 && g.år >= T.penger.førsteEkteValg ? 'Bondetinget' : neste ? `Valg ${neste.år}` : 'Budsjett';
    ctx.font = `bold 13px ${FONT}`;
    const ew = ctx.measureText(etikett).width + 12;
    const ex = x + w / 2 - ew / 2;
    kort(ctx, ex, y - 26, ew, 19);
    ctx.fillStyle = fare ? P.karmin : P.kritt;
    ctx.textAlign = 'center';
    ctx.fillText(etikett, x + w / 2, y - 12);
    ctx.restore();
}

function tast(ctx: CanvasRenderingContext2D, x: number, y: number, t: string): number {
    ctx.save();
    ctx.font = `bold 13px Georgia, serif`;
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
    kort(ctx, a - 52, 14, b - a + 182, 30);
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
    ctx.globalAlpha = inn;
    kort(ctx, 16, 14, 160, 98);
    ctx.globalAlpha = 1;
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
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillStyle = P.kritt;
    ctx.fillText('Ueland', cx + 70, cy + 24);
    ctx.font = `italic 13px ${FONT}`;
    ctx.fillText(g.ganger > 1 ? 'sparer mer' : 'gli tett!', cx + 70, cy + 40);
    ctx.globalAlpha = 1;
}
