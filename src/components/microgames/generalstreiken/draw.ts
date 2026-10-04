// Gråboksen: kartet, kjeden, bølgen og HUD-en med primitive former. Ingen kunst, ingen juice.
// Leser bare spillet.

import type { ArcadeView } from '../arcade/useArcade';
import { bølgeAvstand, dag, fristIgjen, millioner, tiendeler, verdiFor } from './rules';
import type { Game } from './state';
import { BRETT_VUNNET } from './texts';

/** Paletten fra kunstbriefen, brukt flatt. */
export const P = {
    papir: '#f4f1ea',
    rød: '#e0261d',
    svart: '#151413',
    blå: '#1f4f9f',
    tynn: '#f3b8ad',
    grå: '#8f8a80',
};

export const fmt = (m: number) => tiendeler(m).toFixed(1).replace('.', ',');

/** Plass til HUD øverst og knappen nederst. */
const TOPP = 74;
const BUNN = 70;

export function rute(view: ArcadeView, g: Game) {
    const b = g.brett;
    const s = Math.floor(Math.min((view.w - 24) / b.b, (view.h - TOPP - BUNN) / b.h));
    const ox = Math.floor((view.w - s * b.b) / 2);
    const oy = TOPP + Math.floor((view.h - TOPP - BUNN - s * b.h) / 2);
    return { s, ox, oy };
}

export function tegn(view: ArcadeView, g: Game) {
    const { ctx, w, h } = view;
    const b = g.brett;
    const { s, ox, oy } = rute(view, g);
    ctx.fillStyle = '#bdb8ad';
    ctx.fillRect(0, 0, w, h);
    // Kartet: papir og rutenett.
    ctx.fillStyle = P.papir;
    ctx.fillRect(ox, oy, s * b.b, s * b.h);
    ctx.strokeStyle = 'rgba(143,138,128,.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= b.b; x++) {
        ctx.moveTo(ox + x * s + 0.5, oy);
        ctx.lineTo(ox + x * s + 0.5, oy + b.h * s);
    }
    for (let y = 0; y <= b.h; y++) {
        ctx.moveTo(ox, oy + y * s + 0.5);
        ctx.lineTo(ox + b.b * s, oy + y * s + 0.5);
    }
    ctx.stroke();
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 2;
    ctx.strokeRect(ox, oy, s * b.b, s * b.h);
    // Paris.
    ctx.strokeStyle = P.grå;
    ctx.beginPath();
    ctx.arc(ox + (b.paris.x + 0.5) * s, oy + (b.paris.y + 0.5) * s, s * 1.2, 0, Math.PI * 2);
    ctx.stroke();

    // Fabrikkene: svarte bokser med verdien.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of g.fabrikker) {
        const blink = Math.sin((g.bt - f.født) * 8) > -0.3;
        ctx.fillStyle = blink ? P.svart : P.grå;
        ctx.fillRect(ox + f.x * s + 1, oy + f.y * s + 1, s - 2, s - 2);
        ctx.fillStyle = P.svart;
        ctx.font = `700 13px Archivo, system-ui, sans-serif`;
        const tekst = `${f.navn ? f.navn + ' ' : ''}+${fmt(verdiFor(g, f))}`;
        ctx.fillText(tekst, ox + (f.x + 0.5) * s, oy + f.y * s - 8);
    }

    // Kjeden: røde ledd, de bølgen holder på å spise er blå.
    const L = g.body.length;
    g.body.forEach((c, i) => {
        const fraHale = L - 1 - i;
        ctx.fillStyle = g.grenelle !== null && fraHale < g.bølgeRest ? P.blå : P.rød;
        ctx.fillRect(ox + c.x * s + 2, oy + c.y * s + 2, s - 4, s - 4);
    });
    ctx.fillStyle = P.rød;
    ctx.beginPath();
    ctx.arc(ox + (g.hode.x + 0.5) * s, oy + (g.hode.y + 0.5) * s, s * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Bølgen bak halen.
    if (g.grenelle !== null && L) {
        const hale = g.body[L - 1];
        ctx.fillStyle = P.blå;
        ctx.beginPath();
        ctx.arc(ox + (hale.x + 0.5) * s, oy + (hale.y + 0.5) * s, s * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    hud(view, g);
    if (g.mode === 'kort') kort(view, BRETT_VUNNET[g.bi] ?? '');
}

function hud(view: ArcadeView, g: Game) {
    const { ctx, w } = view;
    const m = millioner(g);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'center';
    ctx.fillStyle = P.rød;
    ctx.font = '900 40px Anton, Impact, system-ui, sans-serif';
    ctx.fillText(fmt(m), w / 2, 44);
    ctx.font = '700 14px Archivo, system-ui, sans-serif';
    ctx.fillStyle = P.svart;
    ctx.fillText(`MILLIONER I STREIK  -  mål ${fmt(g.brett.mål)}`, w / 2, 64);
    // Skala 0-10 under telleren.
    const sx = w / 2 - 150;
    ctx.fillStyle = 'rgba(21,20,19,.15)';
    ctx.fillRect(sx, 68, 300, 4);
    ctx.fillStyle = P.rød;
    ctx.fillRect(sx, 68, Math.min(300, (m / 10) * 300), 4);
    ctx.fillStyle = P.svart;
    ctx.fillRect(sx + (g.brett.mål / 10) * 300 - 1, 64, 2, 12);

    ctx.textAlign = 'left';
    ctx.font = '700 15px Archivo, system-ui, sans-serif';
    ctx.fillText(`BRETT ${g.brett.nr}: ${g.brett.navn}`, 16, 64);
    ctx.textAlign = 'right';
    if (g.brett.kalender) {
        ctx.font = '900 22px Anton, Impact, system-ui, sans-serif';
        ctx.fillText(`MAI 68 - ${dag(g)}`, w - 16, 40);
    } else if (g.grenelle === null) {
        ctx.font = '700 15px Archivo, system-ui, sans-serif';
        ctx.fillText(`${Math.ceil(fristIgjen(g))} s igjen`, w - 16, 40);
    }
    if (g.grenelle !== null) {
        ctx.font = '700 16px Archivo, system-ui, sans-serif';
        ctx.fillStyle = P.blå;
        ctx.fillText(`BØLGEN ${Math.floor(bølgeAvstand(g))} LEDD UNNA`, w - 16, 64);
    }
    if (g.bt < g.x2Til) {
        ctx.textAlign = 'left';
        ctx.fillStyle = P.rød;
        ctx.font = '900 18px Anton, Impact, system-ui, sans-serif';
        ctx.fillText('x2 SAMMEN!', 16, 40);
    }
}

function kort(view: ArcadeView, tekst: string) {
    const { ctx, w, h } = view;
    ctx.fillStyle = 'rgba(244,241,234,.92)';
    ctx.fillRect(0, h / 2 - 50, w, 100);
    ctx.fillStyle = P.rød;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 44px Anton, Impact, system-ui, sans-serif';
    ctx.fillText(tekst, w / 2, h / 2);
}
