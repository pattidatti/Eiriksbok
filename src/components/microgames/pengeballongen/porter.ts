// Bevilgningsportene midt i runden: et veiskille med to løp, leselig på ett bilde.
// Nedre løp (karmin, kongens farge) = BEVILG: embetsmennene med pengesekken og prisen, og en
// stiplet gullsti som viser at staten bærer deg over fjellet. Øvre løp (oransje, bøndenes farge)
// = NEI: bøndene med Uelands bonus, og en pil opp over fjellet - der må du fyre selv.
// Delelinja går der midten av ballongen skal være: midten under linja = bevilget.

import { P } from './art';
import { FONT } from './scene';
import type { Game } from './state';
import { bakke } from './terrain';
import { TUNING } from './tuning';

const B = TUNING.ballong;
/** Hvor langt løpene strekker seg foran porten (px vei). Dalen er flat her. */
const LØP = 250;
/** Høyden på det øvre løpet (px). */
const NEI_H = 130;
/** Figurene er dobbelt så store som før, så de leses på et lite filmbilde. */
const SKALA = 1.8;

/** En figur (ca. 44 px) med føttene i (x, y): embetsmann med flosshatt eller bonde med lue. */
function figur(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    slag: 'embetsmann' | 'bonde',
    arm: number
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(SKALA, SKALA);
    const kropp = slag === 'embetsmann' ? P.kritt : '#7a5a3a';
    ctx.fillStyle = kropp;
    ctx.fillRect(-4, -16, 8, 12);
    ctx.fillRect(-3.5, -4, 3, 4);
    ctx.fillRect(0.5, -4, 3, 4);
    ctx.fillStyle = '#e8d6bf';
    ctx.beginPath();
    ctx.arc(0, -20, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    if (slag === 'embetsmann') {
        ctx.fillStyle = P.kritt;
        ctx.fillRect(-3, -31, 6, 8);
        ctx.fillRect(-5, -24, 10, 2);
        // Kongens farge på brystet.
        ctx.fillStyle = P.karmin;
        ctx.fillRect(-1.5, -15, 3, 7);
    } else {
        ctx.fillStyle = P.silke;
        ctx.beginPath();
        ctx.arc(0, -22, 4.2, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(2, -25, 4, 3);
    }
    // Armen: 0 = ned, 1 = rett opp.
    ctx.strokeStyle = kropp;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(3, -14);
    ctx.lineTo(4 + 5 * (1 - arm), -14 - 11 * arm + 4 * (1 - arm));
    ctx.stroke();
    ctx.restore();
}

/** En mynt med tekst (prisen eller bonusen). */
function mynt(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, farge: string, tekst: string) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = farge;
    ctx.fill();
    ctx.strokeStyle = P.hvit;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = P.hvit;
    ctx.font = `bold 17px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(tekst, x, y + 6);
}

/** Stor tekst med mørk kant, så den leses mot både himmel og fjell. */
function skilt(ctx: CanvasRenderingContext2D, tekst: string, x: number, y: number, px: number) {
    ctx.font = `bold ${px}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 5;
    ctx.strokeText(tekst, x, y);
    ctx.fillStyle = P.hvit;
    ctx.fillText(tekst, x, y);
}

/** Piler som glir mot høyre langs et løp: viser retningen uten ord. */
function piler(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, tid: number, farge: string) {
    ctx.save();
    ctx.strokeStyle = farge;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    const steg = 46;
    const fase = (tid * 60) % steg;
    for (let x = x0 + fase; x < x1; x += steg) {
        ctx.globalAlpha = Math.min(1, (x - x0) / 40, (x1 - x) / 40) * 0.9;
        ctx.beginPath();
        ctx.moveTo(x - 7, y - 9);
        ctx.lineTo(x + 3, y);
        ctx.lineTo(x - 7, y + 9);
        ctx.stroke();
    }
    ctx.restore();
}

/**
 * Bevilgningsportene: et veiskille i dalen før et dyrt fjell. Nedre løp = bevilg (prisen fra
 * sekken og en bit av valgbudsjettet, staten bærer deg over fjellet). Øvre løp = nei til kongen:
 * Ueland gir bonus, men du må fyre deg over fjellet selv.
 */
export function tegnBevilg(ctx: CanvasRenderingContext2D, g: Game, tid: number) {
    const x0 = g.x - B.skjermX;
    const BV = TUNING.bevilg;
    for (const b of g.ter.bevilg) {
        const sx = b.x - x0;
        if (sx < -LØP - 200 || sx > 960 + LØP) continue;
        const valgt = b.valgt;
        // Delelinja: der midten av ballongen er når kurven er akkurat på terskelen.
        const yD = b.bunn - BV.åpning - B.høyde / 2;
        const venstre = sx - LØP;
        // Løpene toner ut etter at du har valgt (ting går, de forsvinner ikke brått).
        const forbi = Math.max(0, g.x - b.x);
        const ut = valgt ? Math.max(0, 1 - forbi / 360) : 1;
        ctx.save();

        // Statens vei: en stiplet gullsti fra porten langs fjellet til der staten slipper deg.
        if (valgt !== 'nei') {
            ctx.save();
            ctx.strokeStyle = valgt === 'ja' ? P.silke : 'rgba(214,160,60,0.95)';
            ctx.lineWidth = 4;
            ctx.setLineDash([12, 8]);
            ctx.lineDashOffset = -tid * 30;
            ctx.beginPath();
            const a = Math.max(b.x, x0 - 20);
            const z = Math.min(b.til, x0 + 1000);
            for (let wx = a; wx <= z; wx += 10) {
                const y = Math.min(b.bunn - 40, bakke(g.ter, wx) - 40);
                if (wx === a) ctx.moveTo(wx - x0, y);
                else ctx.lineTo(wx - x0, y);
            }
            ctx.stroke();
            ctx.restore();
        }

        if (ut > 0) {
            // Nedre løp (BEVILG): fra bakken opp til delelinja, kongens farge.
            const aJa = valgt === 'ja' ? 1 : valgt === 'nei' ? 0.35 : 1;
            ctx.globalAlpha = ut * aJa;
            ctx.beginPath();
            ctx.moveTo(venstre, yD);
            ctx.lineTo(sx - 30, yD);
            ctx.lineTo(sx + 10, (yD + b.bunn) / 2);
            for (let x = sx + 10; x >= venstre; x -= 20) {
                ctx.lineTo(x, Math.min(b.bunn, bakke(g.ter, x + x0)));
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(109,47,74,0.42)';
            ctx.fill();
            ctx.strokeStyle = P.karmin;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Øvre løp (NEI): fra delelinja og opp, bøndenes farge, med pila opp over fjellet.
            const aNei = valgt === 'nei' ? 1 : valgt === 'ja' ? 0.35 : 1;
            ctx.globalAlpha = ut * aNei;
            const top = yD - NEI_H;
            ctx.beginPath();
            ctx.moveTo(venstre, yD);
            ctx.lineTo(sx + 20, yD);
            ctx.lineTo(sx + 70, yD - 60);
            ctx.lineTo(sx + 90, yD - 40);
            ctx.lineTo(sx + 110, top - 30);
            ctx.lineTo(sx + 30, top - 10);
            ctx.lineTo(sx + 50, top + 10);
            ctx.lineTo(sx + 10, top);
            ctx.lineTo(venstre, top);
            ctx.closePath();
            ctx.fillStyle = 'rgba(200,105,43,0.36)';
            ctx.fill();
            ctx.strokeStyle = P.silke;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Delelinja: en tykk bjelke som ender i porten.
            ctx.globalAlpha = ut;
            ctx.fillStyle = '#5b4a38';
            ctx.fillRect(venstre - 6, yD - 4, LØP + 30, 8);
            // Porten: en stolpe fra bakken til toppen av det øvre løpet.
            ctx.fillRect(sx + 18, top - 4, 12, b.bunn - top + 4);

            if (!valgt) {
                piler(ctx, venstre + 10, sx - 30, (yD + b.bunn) / 2 + 30, tid, P.hvit);
                piler(ctx, venstre + 10, sx, yD - NEI_H / 2 + 34, tid, P.hvit);
            }

            const mx = venstre + 118;
            // Tekstene på løpene: stort ord, så prisen eller bonusen.
            ctx.globalAlpha = ut * aNei;
            skilt(ctx, valgt === 'nei' ? 'SA NEI!' : 'NEI', mx, yD - NEI_H / 2 + 4, 34);
            if (!valgt) {
                const bonus = BV.nei * Math.max(1, g.ganger);
                mynt(ctx, mx + 84, yD - NEI_H / 2 - 7, 22, P.silke, `+${bonus}`);
            }
            ctx.globalAlpha = ut * aJa;
            skilt(ctx, valgt === 'ja' ? 'BEVILGET' : 'BEVILG', mx, yD + 42, 32);
            ctx.font = `italic bold 16px ${FONT}`;
            ctx.lineWidth = 4;
            ctx.strokeText(b.navn, mx, yD + 66);
            ctx.fillText(b.navn, mx, yD + 66);
            if (!valgt) mynt(ctx, mx + 96, yD + 30, 22, P.karmin, `-${b.pris}`);

            // Bøndene står på bjelken og vinker deg opp (hopper når du sa nei).
            ctx.globalAlpha = ut * aNei;
            for (let i = 0; i < 3; i++) {
                const jubel = valgt === 'nei' ? Math.abs(Math.sin(tid * 9 + i * 1.3)) * 8 : 0;
                const arm = valgt === 'nei' ? 1 : 0.6 + 0.4 * Math.sin(tid * 5 + i);
                figur(ctx, venstre + 16 + i * 24, yD - 4 - jubel, 'bonde', arm);
            }
            // Embetsmennene står på bakken med pengesekken (jubler når du bevilget).
            ctx.globalAlpha = ut * aJa;
            for (let i = 0; i < 2; i++) {
                const ex = venstre + 26 + i * 30;
                const hopp = valgt === 'ja' ? Math.abs(Math.sin(tid * 8 + i)) * 6 : 0;
                const arm = valgt === 'ja' ? 1 : 0.5 + 0.3 * Math.sin(tid * 3 + i);
                figur(ctx, ex, Math.min(b.bunn, bakke(g.ter, ex + x0)) - hopp, 'embetsmann', arm);
            }
            const sekX = venstre + 92;
            ctx.fillStyle = '#b89a6a';
            ctx.beginPath();
            ctx.ellipse(sekX, Math.min(b.bunn, bakke(g.ter, sekX + x0)) - 12, 13, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = P.kritt;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        ctx.restore();
    }
}
