// Gråboksen: alt tegnes med flate former i paletten fra kunstbriefen. Ingen kunst, ingen
// juice ennå. Tegningen leser bare spillet.

import type { ArcadeView } from '../arcade/useArcade';
import { BRETT } from './levels';
import { grenseVises } from './rules';
import { bakke } from './terrain';
import type { Game } from './state';
import { TUNING } from './tuning';

export const P = {
    stein: '#d6d9cc',
    kritt: '#2e3236',
    halv: '#7d877f',
    hvit: '#f6f4ec',
    silke: '#c8692b',
    karmin: '#6d2f4a',
};

const B = TUNING.ballong;

export interface Skala {
    s: number;
    ox: number;
    oy: number;
}

export const skala = (w: number, h: number): Skala => {
    const s = Math.min(w / 960, h / 540);
    return { s, ox: (w - 960 * s) / 2, oy: (h - 540 * s) / 2 };
};

/** Et punkt på flata (960 x 540) -> CSS-piksler i spillvinduet. */
export const tilSkjerm = (k: Skala, x: number, y: number) => ({
    x: k.ox + x * k.s,
    y: k.oy + y * k.s,
});

/** Verdens-x -> x på flata. */
export const flateX = (g: Game, x: number) => x - g.x + B.skjermX;

export interface TegneValg {
    spøkelse: number[] | null;
    meny: boolean;
}

export function tegn(view: ArcadeView, g: Game, valg: TegneValg) {
    const { ctx, w, h, dpr } = view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = P.hvit;
    ctx.fillRect(0, 0, w, h);
    const k = skala(w, h);
    ctx.setTransform(dpr * k.s, 0, 0, dpr * k.s, dpr * k.ox, dpr * k.oy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 960, 540);
    ctx.clip();

    // Himmel og fjerne fjell (parallakse).
    ctx.fillStyle = P.stein;
    ctx.fillRect(0, 0, 960, 540);
    ctx.fillStyle = P.halv;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.moveTo(0, 540);
    for (let x = 0; x <= 960; x += 16) {
        const wx = (x + g.x * 0.3) / 140;
        ctx.lineTo(x, 330 + Math.sin(wx) * 40 + Math.sin(wx * 2.7) * 18);
    }
    ctx.lineTo(960, 540);
    ctx.fill();
    ctx.globalAlpha = 1;

    const ter = g.ter;
    const x0 = g.x - B.skjermX;

    // Valgstedene: en tingstue på bakken.
    for (const v of ter.valg) {
        const sx = v.x - x0;
        if (sx < -60 || sx > 1020) continue;
        const by = bakke(ter, v.x);
        ctx.fillStyle = v.ekte ? P.karmin : P.halv;
        ctx.fillRect(sx - 14, by - 22, 28, 22);
        ctx.beginPath();
        ctx.moveTo(sx - 18, by - 22);
        ctx.lineTo(sx, by - 36);
        ctx.lineTo(sx + 18, by - 22);
        ctx.fill();
        ctx.fillStyle = P.kritt;
        ctx.fillRect(sx - 1, by - 120, 2, 84);
        ctx.font = 'italic 16px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Valg ${v.år}`, sx, by - 126);
    }

    // Forgrunnsfjellene.
    ctx.fillStyle = P.kritt;
    ctx.beginPath();
    ctx.moveTo(-10, 540);
    for (let sx = -10; sx <= 970; sx += 6) ctx.lineTo(sx, bakke(ter, x0 + sx));
    ctx.lineTo(970, 540);
    ctx.fill();

    // Knausene ved veiskillene, med kongens bom under før 1882.
    for (const kn of ter.knauser) {
        const a = kn.x0 - x0;
        const b = kn.x1 - x0;
        if (b < -20 || a > 980) continue;
        ctx.fillStyle = P.kritt;
        ctx.fillRect(a, kn.topp, b - a, kn.bunn - kn.topp);
        if (kn.bom) {
            ctx.fillStyle = P.karmin;
            const midt = (a + b) / 2;
            ctx.fillRect(midt - 6, kn.bunn, 12, bakke(ter, (kn.x0 + kn.x1) / 2) - kn.bunn);
            krone(ctx, midt, kn.topp - 14);
        }
    }

    // Kongens brå utgifter: en krone over den spisse toppen.
    ctx.textAlign = 'center';
    for (const u of ter.utgifter) {
        const sx = u.x - x0;
        if (sx < -60 || sx > 1020) continue;
        krone(ctx, sx, u.y - 18);
        if (u.navn) {
            ctx.fillStyle = P.karmin;
            ctx.font = 'italic 16px Georgia, serif';
            ctx.fillText(u.navn, sx, u.y - 34);
        }
    }

    // Funn som henger lavt.
    for (const f of ter.funn) {
        if (f.tatt) continue;
        const sx = f.x - x0;
        if (sx < -30 || sx > 990) continue;
        ctx.fillStyle = P.hvit;
        ctx.strokeStyle = P.kritt;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, f.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    // Spøkelsesballongen (rekordrunden).
    if (valg.spøkelse && !valg.meny) {
        const i = Math.floor(g.x / 8);
        const y = valg.spøkelse[i];
        if (y !== undefined) {
            ctx.strokeStyle = P.halv;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.arc(B.skjermX, y - 48, 28, 0, Math.PI * 2);
            ctx.strokeRect(B.skjermX - 10, y - 12, 20, 12);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    ballong(ctx, g);
    ctx.restore();
    hud(ctx, g, valg.meny);
}

function krone(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = P.karmin;
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 6);
    ctx.lineTo(x - 10, y - 4);
    ctx.lineTo(x - 5, y + 1);
    ctx.lineTo(x, y - 7);
    ctx.lineTo(x + 5, y + 1);
    ctx.lineTo(x + 10, y - 4);
    ctx.lineTo(x + 10, y + 6);
    ctx.fill();
}

function ballong(ctx: CanvasRenderingContext2D, g: Game) {
    const x = B.skjermX;
    const y = g.y;
    // Flammen når du holder.
    if (g.varme > 0.15) {
        ctx.fillStyle = P.silke;
        ctx.globalAlpha = Math.min(1, g.varme);
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 18);
        ctx.lineTo(x, y - 18 - 16 * g.varme);
        ctx.lineTo(x + 5, y - 18);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 12);
    ctx.lineTo(x - 22, y - 36);
    ctx.moveTo(x + 10, y - 12);
    ctx.lineTo(x + 22, y - 36);
    ctx.stroke();
    ctx.fillStyle = P.silke;
    ctx.beginPath();
    ctx.ellipse(x, y - 50, 26, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    // Kurven, med flosshattene som har klatret om bord.
    ctx.fillStyle = P.kritt;
    ctx.fillRect(x - 10, y - 12, 20, 12);
    for (let i = 0; i < Math.min(g.hatter, 8); i++) {
        ctx.fillRect(x - 10 + (i % 4) * 5, y - 20 - Math.floor(i / 4) * 4, 4, 7);
    }
}

function hud(ctx: CanvasRenderingContext2D, g: Game, meny: boolean) {
    if (meny) return;
    const T = TUNING;
    // Nedre marg: bildeteksten (år og sted).
    ctx.fillStyle = P.hvit;
    ctx.font = 'italic 20px Georgia, serif';
    ctx.textAlign = 'center';
    const sted = BRETT[g.brett].sted.replace(/^\d{4}/, String(Math.floor(g.år)));
    ctx.fillText(sted, 480, 528);

    // Oppe til høyre: Spart.
    ctx.textAlign = 'right';
    ctx.fillStyle = P.kritt;
    ctx.font = 'italic 26px Georgia, serif';
    ctx.fillText(`Spart: ${Math.floor(g.spart).toLocaleString('nb-NO')} Spd.`, 944, 38);

    // Målet: tidslinja 1815 til 1884 øverst i midten.
    const tx0 = 330;
    const tx1 = 630;
    const u = Math.min(1, (g.år - T.år.start) / (T.år.slutt - T.år.start));
    ctx.strokeStyle = P.kritt;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx0, 26);
    ctx.lineTo(tx1, 26);
    ctx.stroke();
    ctx.fillStyle = P.silke;
    ctx.beginPath();
    ctx.arc(tx0 + (tx1 - tx0) * u, 26, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.kritt;
    ctx.font = '15px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText('1815', tx0 - 8, 31);
    ctx.textAlign = 'left';
    ctx.fillText('1884 Løvebakken', tx1 + 8, 31);

    // Venstre marg: pengestabelen siden forrige valg, med grensen som karmin strek.
    if (g.stabel) {
        const x = 18;
        const bunn = 400;
        const pxPerSpd = 6;
        const høy = T.penger.grense * 1.4 * pxPerSpd;
        ctx.fillStyle = 'rgba(246,244,236,0.75)';
        ctx.fillRect(x - 6, bunn - høy - 40, 52, høy + 64);
        const fylt = Math.min(g.periode, T.penger.grense * 1.4) * pxPerSpd;
        const over = grenseVises(g) && g.periode > T.penger.grense;
        ctx.fillStyle = over ? P.karmin : P.halv;
        ctx.fillRect(x + 4, bunn - fylt, 32, fylt);
        ctx.strokeStyle = P.kritt;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 4, bunn - høy, 32, høy);
        if (grenseVises(g)) {
            const gy = bunn - T.penger.grense * pxPerSpd;
            ctx.fillStyle = P.karmin;
            ctx.fillRect(x - 2, gy - 2, 44, 4);
        }
        ctx.fillStyle = P.kritt;
        ctx.font = '15px Georgia, serif';
        ctx.textAlign = 'center';
        const neste = g.ter.valg[g.nesteValg];
        ctx.fillText(neste ? `Valg` : '', x + 20, bunn - høy - 22);
        ctx.fillText(neste ? String(neste.år) : '', x + 20, bunn - høy - 6);
        ctx.fillText(`${Math.round(g.periode)}`, x + 20, bunn + 18);
    }

    // Ueland-gangeren.
    if (g.år >= T.ganger.fra) {
        ctx.fillStyle = 'rgba(246,244,236,0.85)';
        ctx.beginPath();
        ctx.ellipse(110, 60, 40, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = g.ganger > 1 ? P.silke : P.kritt;
        ctx.font = 'bold 26px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(`×${g.ganger}`, 110, 66);
        ctx.fillStyle = P.kritt;
        ctx.font = '14px Georgia, serif';
        ctx.fillText('Ueland', 110, 104);
    }
}
