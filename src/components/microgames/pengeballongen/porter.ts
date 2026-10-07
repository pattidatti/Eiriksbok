// Bevilgningsportene midt i runden: tømmerporten, kongens krok, skiltet med prisen som mynt og
// den stiplede gullstien over fjellet som viser hvor staten bærer deg om du går under.

import { P } from './art';
import { FONT } from './scene';
import type { Game } from './state';
import { bakke } from './terrain';
import { TUNING } from './tuning';

const B = TUNING.ballong;

/**
 * Bevilgningsportene: en høy tømmerport i dalen før et dyrt fjell. Lavt gjennom = bevilg
 * (prisen fra sekken, staten bærer deg over fjellet). Over porten = spar sekken, fyr selv.
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
        // Skiltet: bare navnet og prisen som en rød mynt. Valget viser stien og kroken.
        const bw = 176;
        const bh = 40;
        const by = bue - bh - 14;
        ctx.fillStyle = valgt === 'ja' ? P.silke : P.hvit;
        ctx.strokeStyle = P.kritt;
        ctx.lineWidth = 1.5;
        ctx.fillRect(sx - bw / 2, by, bw, bh);
        ctx.strokeRect(sx - bw / 2, by, bw, bh);
        ctx.textAlign = 'center';
        if (valgt) {
            ctx.fillStyle = valgt === 'ja' ? P.hvit : P.karmin;
            ctx.font = `bold 16px ${FONT}`;
            ctx.fillText(valgt === 'ja' ? 'BEVILGET' : 'SA NEI', sx, by + 17);
            ctx.fillStyle = valgt === 'ja' ? P.hvit : P.kritt;
            ctx.font = `italic 14px ${FONT}`;
            ctx.fillText(b.navn, sx, by + 34);
        } else {
            ctx.fillStyle = P.kritt;
            ctx.font = `italic bold 15px ${FONT}`;
            ctx.fillText(b.navn, sx - 18, by + 25);
            // Prisen: en mynt på kanten av skiltet.
            const mx = sx + bw / 2 - 4;
            const my = by + bh / 2;
            ctx.beginPath();
            ctx.arc(mx, my, 22, 0, Math.PI * 2);
            ctx.fillStyle = P.karmin;
            ctx.fill();
            ctx.strokeStyle = P.kritt;
            ctx.stroke();
            ctx.fillStyle = P.hvit;
            ctx.font = `bold 15px ${FONT}`;
            ctx.fillText(`-${b.pris}`, mx, my + 5);
        }
        ctx.restore();
    }
}
