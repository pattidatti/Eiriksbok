// Bevilgningsportene midt i runden: tømmerporten, kongens krok, den stiplede gullstien over
// fjellet som viser hvor staten bærer deg om du går under. Under/over leses av bildet: nede i
// åpningen står kongens embetsmenn med pengesekken og prisen (rød mynt), oppe på skiltet står
// bøndene med Uelands bonus (oransje mynt).

import { P } from './art';
import { FONT } from './scene';
import type { Game } from './state';
import { bakke } from './terrain';
import { TUNING } from './tuning';

const B = TUNING.ballong;

/** En liten figur (ca. 24 px) med føttene i (x, y): embetsmann med flosshatt eller bonde med lue. */
function figur(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    slag: 'embetsmann' | 'bonde',
    arm: number
) {
    const kropp = slag === 'embetsmann' ? P.kritt : '#8a7a5c';
    ctx.fillStyle = kropp;
    ctx.fillRect(x - 4, y - 16, 8, 12);
    ctx.fillRect(x - 3.5, y - 4, 3, 4);
    ctx.fillRect(x + 0.5, y - 4, 3, 4);
    ctx.fillStyle = '#e8d6bf';
    ctx.beginPath();
    ctx.arc(x, y - 20, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    if (slag === 'embetsmann') {
        ctx.fillStyle = P.kritt;
        ctx.fillRect(x - 3, y - 31, 6, 8);
        ctx.fillRect(x - 5, y - 24, 10, 2);
    } else {
        ctx.fillStyle = P.silke;
        ctx.beginPath();
        ctx.arc(x, y - 22, 4, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x + 2, y - 25, 4, 3);
    }
    // Armen: 0 = ned, 1 = rett opp.
    ctx.strokeStyle = kropp;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 3, y - 14);
    ctx.lineTo(x + 4 + 5 * (1 - arm), y - 14 - 11 * arm + 4 * (1 - arm));
    ctx.stroke();
}

/** En mynt med tekst (prisen eller bonusen). */
function mynt(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, farge: string, tekst: string) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = farge;
    ctx.fill();
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = P.hvit;
    ctx.font = `bold 15px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(tekst, x, y + 5);
}

/**
 * Bevilgningsportene: en høy tømmerport i dalen før et dyrt fjell. Lavt gjennom = bevilg
 * (prisen fra sekken og en bit av valgbudsjettet, staten bærer deg over fjellet). Over porten =
 * nei til kongen: Ueland gir bonus, men du må fyre deg over fjellet selv.
 */
export function tegnBevilg(ctx: CanvasRenderingContext2D, g: Game, tid: number) {
    const x0 = g.x - B.skjermX;
    const BV = TUNING.bevilg;
    for (const b of g.ter.bevilg) {
        const sx = b.x - x0;
        if (sx < -120 || sx > 1080) continue;
        // Buen henger så høyt at hele ballongen går under den når kurven er under terskelen.
        const bue = b.bunn - BV.åpning - B.høyde - 8;
        const v = 44;
        const valgt = b.valgt;
        ctx.save();
        if (valgt === 'nei') ctx.globalAlpha = 0.45;
        // Lys i åpningen mens porten ligger foran deg.
        if (!valgt) {
            const puls = 0.22 + 0.14 * Math.sin(tid * 5);
            const gr = ctx.createLinearGradient(0, bue, 0, b.bunn);
            gr.addColorStop(0, 'rgba(240,200,120,0)');
            gr.addColorStop(1, `rgba(240,200,120,${puls.toFixed(3)})`);
            ctx.fillStyle = gr;
            ctx.fillRect(sx - v, bue, v * 2, b.bunn - bue);
        }
        // Statens vei: en stiplet gullsti fra åpningen langs fjellet til der staten slipper deg.
        // Den viser byttet uten ord: under porten blir du båret over fjellet, over porten ikke.
        if (valgt !== 'nei') {
            ctx.save();
            ctx.strokeStyle = valgt === 'ja' ? P.silke : 'rgba(214,160,60,0.9)';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 8]);
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
        // Stolpene og buen.
        ctx.fillStyle = '#5b4a38';
        ctx.fillRect(sx - v - 6, bue - 6, 10, b.bunn - bue + 6);
        ctx.fillRect(sx + v - 4, bue - 6, 10, b.bunn - bue + 6);
        ctx.fillRect(sx - v - 14, bue - 12, v * 2 + 28, 9);
        // Kongens krok henger i åpningen: kommer du lavt nok, hekter staten deg på.
        if (!valgt) {
            const sving = Math.sin(tid * 2) * 3;
            ctx.strokeStyle = '#5b4a38';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sx, bue - 3);
            ctx.lineTo(sx + sving, bue + 34);
            ctx.stroke();
            ctx.strokeStyle = P.silke;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(sx + sving, bue + 42, 7, -Math.PI / 2, Math.PI * 0.9);
            ctx.stroke();
        }
        // Nede i åpningen: kongens embetsmenn med pengesekken og prisen. Går du under, tar de den.
        if (valgt !== 'nei') {
            const hopp = valgt === 'ja' ? Math.abs(Math.sin(tid * 8)) * 3 : 0;
            figur(ctx, sx - v + 14, b.bunn - hopp, 'embetsmann', valgt === 'ja' ? 1 : 0.5 + 0.3 * Math.sin(tid * 3));
            figur(ctx, sx + v - 14, b.bunn - hopp, 'embetsmann', valgt === 'ja' ? 1 : 0.5 + 0.3 * Math.sin(tid * 3 + 1));
            // Pengesekken mellom dem.
            ctx.fillStyle = '#b89a6a';
            ctx.beginPath();
            ctx.ellipse(sx + v - 28, b.bunn - 7, 8, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = P.kritt;
            ctx.lineWidth = 1;
            ctx.stroke();
            if (!valgt) mynt(ctx, sx, b.bunn - 34, 20, P.karmin, `-${b.pris}`);
        }
        // Skiltet: navnet. Oppå står bøndene med Uelands bonus for et nei.
        const bw = 176;
        const bh = 34;
        const by = bue - bh - 14;
        ctx.fillStyle = valgt === 'ja' ? P.silke : P.hvit;
        ctx.strokeStyle = P.kritt;
        ctx.lineWidth = 1.5;
        ctx.fillRect(sx - bw / 2, by, bw, bh);
        ctx.strokeRect(sx - bw / 2, by, bw, bh);
        ctx.textAlign = 'center';
        if (valgt) {
            ctx.fillStyle = valgt === 'ja' ? P.hvit : P.silkeMørk;
            ctx.font = `bold 15px ${FONT}`;
            ctx.fillText(valgt === 'ja' ? 'BEVILGET' : 'SA NEI', sx, by + 15);
            ctx.fillStyle = valgt === 'ja' ? P.hvit : P.kritt;
            ctx.font = `italic 13px ${FONT}`;
            ctx.fillText(b.navn, sx, by + 29);
        } else {
            ctx.fillStyle = P.kritt;
            ctx.font = `italic bold 15px ${FONT}`;
            ctx.fillText(b.navn, sx, by + 22);
        }
        if (valgt !== 'ja') {
            // Bøndene jubler (hopper) når du sa nei, og vinker deg opp mens porten ligger foran.
            const jubel = valgt === 'nei' ? 1 : 0;
            ctx.globalAlpha = 1;
            for (let i = 0; i < 3; i++) {
                const hopp = jubel * Math.abs(Math.sin(tid * 9 + i * 1.3)) * 6;
                figur(ctx, sx - 52 + i * 22, by - hopp, 'bonde', jubel ? 1 : 0.6 + 0.4 * Math.sin(tid * 5 + i));
            }
            if (!valgt) {
                const bonus = TUNING.bevilg.nei * Math.max(1, g.ganger);
                mynt(ctx, sx + 44, by - 16, 20, P.silke, `+${bonus}`);
            }
        }
        ctx.restore();
    }
}
