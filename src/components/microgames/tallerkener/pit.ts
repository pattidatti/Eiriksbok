// Orkestergraven foran scenen: rampelysene (gulltaket), kista med myntberget,
// skottenes hånd som drar gull ut, og myntene og sekkene som flyr.

import type { Game } from './state';
import { PAL } from './art';
import { CHEST, H, STAGE, W, lampPos } from './layout';
import { coinPos, type ViewState } from './fx';

const TAU = Math.PI * 2;

export function drawLamps(ctx: CanvasRenderingContext2D, g: Game, v: ViewState) {
    // Rampelysene: ett foran hver stang (gulltaket), og to faste i hver ende.
    const items: { x: number; lit: number }[] = [];
    for (const s of g.slots) {
        const lp = lampPos(s.id);
        const base = s.state === 'stengt' ? 0.25 : v.lamp[s.id];
        items.push({ x: lp.x, lit: base });
    }
    for (const x of [130, 175, 785, 830]) items.push({ x, lit: 1 });
    const sorted = [...items].sort((a, b) => Math.abs(b.x - W / 2) - Math.abs(a.x - W / 2));
    // Tom kiste: lysene slukner ett og ett fra kantene (halvveis allerede når den nesten er tom).
    const mork = Math.max(v.morke, v.kisteVarsel * 0.55);
    sorted.forEach((it, i) => {
        if (mork > (1 - i / sorted.length) * 0.98) it.lit = 0;
    });
    const y = STAGE.edge - 4;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const it of items) {
        if (it.lit < 0.05) continue;
        const fl = 0.85 + Math.sin(v.tid * 13 + it.x) * 0.08 + Math.sin(v.tid * 7.3 + it.x * 2) * 0.07;
        const r = 60 * it.lit * fl;
        const gl = ctx.createRadialGradient(it.x, y - 8, 1, it.x, y - 8, r);
        gl.addColorStop(0, `rgba(255,214,140,${0.35 * it.lit})`);
        gl.addColorStop(1, 'rgba(255,190,110,0)');
        ctx.fillStyle = gl;
        ctx.fillRect(it.x - r, y - 8 - r, r * 2, r * 2);
    }
    ctx.restore();
    for (const it of items) {
        ctx.fillStyle = '#e9dcc0';
        ctx.fillRect(it.x - 2.5, y - 10, 5, 10);
        if (it.lit < 0.05) continue;
        const fl = 1 + Math.sin(v.tid * 15 + it.x) * 0.15;
        ctx.fillStyle = `rgba(255,236,180,${it.lit})`;
        ctx.beginPath();
        ctx.ellipse(it.x, y - 14, 2.2, 4.5 * fl * it.lit, 0, 0, TAU);
        ctx.fill();
    }
}

export function drawArm(ctx: CanvasRenderingContext2D, v: ViewState) {
    if (v.arm < 0.02) return;
    // Skottenes hånd: en mørk silhuett som rekker inn fra venstre og drar mynter ut av kista.
    const e = v.arm * v.arm * (3 - 2 * v.arm);
    const grab = Math.sin(v.tid * 5) * 0.5 + 0.5;
    const hx = -60 + (CHEST.x + 22 + 60) * e - grab * 8;
    const hy = CHEST.y - 4;
    ctx.save();
    ctx.lineCap = 'round';
    // Lynlys i kanten (kaldt blått), så hånda leses mot den mørke orkestergraven.
    ctx.strokeStyle = 'rgba(120,150,210,0.8)';
    ctx.lineWidth = 32;
    ctx.beginPath();
    ctx.moveTo(-40, H + 10);
    ctx.quadraticCurveTo(hx - 140, hy + 6, hx - 18, hy);
    ctx.stroke();
    ctx.strokeStyle = '#141c30';
    ctx.lineWidth = 28;
    ctx.beginPath();
    ctx.moveTo(-40, H + 12);
    ctx.quadraticCurveTo(hx - 140, hy + 8, hx - 18, hy + 1);
    ctx.stroke();
    // Hånda med fingre som griper.
    ctx.fillStyle = '#141c30';
    ctx.strokeStyle = 'rgba(120,150,210,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(hx - 8, hy, 16, 12, -0.2, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#141c30';
    ctx.lineWidth = 6;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(hx, hy - 6 + i * 4);
        ctx.lineTo(hx + 10 - grab * 6, hy - 9 + i * 5 + grab * 4);
        ctx.stroke();
    }
    ctx.restore();
}

export function drawChest(ctx: CanvasRenderingContext2D, g: Game, v: ViewState) {
    const shake = v.kisteVarsel * Math.sin(v.tid * 40) * 2;
    const x = CHEST.x + shake;
    const y = CHEST.y;
    const { w, h } = CHEST;
    if (v.kisteVarsel > 0.05) {
        const gl = ctx.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, 110);
        gl.addColorStop(0, `rgba(190,40,50,${0.45 * v.kisteVarsel * (0.6 + 0.4 * Math.sin(v.tid * 9))})`);
        gl.addColorStop(1, 'rgba(190,40,50,0)');
        ctx.fillStyle = gl;
        ctx.fillRect(x - 70, y - 70, w + 140, h + 140);
    }
    // Lokket står åpent bak.
    ctx.fillStyle = PAL.floMork;
    ctx.beginPath();
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x + 14, y - 30);
    ctx.lineTo(x + w - 14, y - 30);
    ctx.lineTo(x + w - 4, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PAL.gull;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Myntberget: høyden følger gullet i kista.
    const fill = Math.min(1, g.gull / 220);
    const mh = 4 + fill * 30 + v.kisteSprett * 3;
    if (g.gull > 0.5) {
        const mg = ctx.createLinearGradient(0, y - mh, 0, y + 6);
        mg.addColorStop(0, PAL.gullLys);
        mg.addColorStop(1, PAL.gullMork);
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 4);
        ctx.quadraticCurveTo(x + w / 2, y - mh * 2, x + w - 6, y + 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,246,214,0.8)';
        for (let i = 0; i < 2 + fill * 8; i++) {
            const u = ((i * 0.37) % 1) * 0.8 + 0.1;
            const cy = y + 2 - Math.sin(u * Math.PI) * mh * 0.9;
            ctx.beginPath();
            ctx.ellipse(x + u * w, cy, 4, 1.6, 0, 0, TAU);
            ctx.fill();
        }
    }
    // Kassen: karmosin fløyel med gullbeslag.
    const bg = ctx.createLinearGradient(0, y, 0, y + h);
    bg.addColorStop(0, '#a3303d');
    bg.addColorStop(1, PAL.floMork);
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = PAL.gull;
    ctx.fillRect(x, y, w, 4);
    ctx.fillRect(x, y + h - 4, w, 4);
    for (const bx of [x + 14, x + w - 20]) ctx.fillRect(bx, y, 6, h);
}

export function drawCoins(ctx: CanvasRenderingContext2D, v: ViewState) {
    for (const c of v.coins) {
        const p = coinPos(c);
        if (c.kind === 'sekk') {
            ctx.fillStyle = '#8a7350';
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, 8, 9, 0, 0, TAU);
            ctx.fill();
            ctx.fillStyle = '#5a4a32';
            ctx.fillRect(p.x - 3, p.y - 12, 6, 4);
            ctx.fillStyle = PAL.gull;
            ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
            continue;
        }
        if (c.kind === 'skjold') {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.scale(0.5, 0.5);
            ctx.fillStyle = PAL.gullLys;
            ctx.beginPath();
            ctx.moveTo(-13, -9);
            ctx.lineTo(13, -9);
            ctx.lineTo(13, 3);
            ctx.quadraticCurveTo(13, 13, 0, 18);
            ctx.quadraticCurveTo(-13, 13, -13, 3);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            continue;
        }
        const big = c.kind === 'skott' ? 1.5 : 1;
        const w = (Math.abs(Math.cos(c.rot)) * 3.4 + 0.6) * big;
        ctx.fillStyle = c.kind === 'gull' ? PAL.gullLys : c.kind === 'hoff' ? 'rgba(212,166,64,0.7)' : '#f0d58a';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, w, 3.4 * big, 0, 0, TAU);
        ctx.fill();
        if (c.kind === 'skott') {
            ctx.strokeStyle = '#6b4a14';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
}
