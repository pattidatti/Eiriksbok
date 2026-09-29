// Tegning for Seinen snur (gråboks): primitive former.

import { H, LAND, PARIS_Y, ROUEN_Y, VOLLEY_R, W, riverHalf, riverX, type Game } from './game';

export const INK = '#2d3553';
export const LINEN = '#e9dcbf';
export const TERRA = '#a64a2e';
export const OCHRE = '#c99531';
export const TEAL = '#3e6b64';
export const SERIF = "'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";

export interface Transform {
    s: number;
    ox: number;
    oy: number;
    w: number;
    h: number;
}
export function fit(w: number, h: number): Transform {
    const s = Math.min(w / W, h / H);
    return { s, ox: (w - W * s) / 2, oy: (h - H * s) / 2, w, h };
}
export type DrawAssets = Record<string, never>;
export const makeAssets = (): DrawAssets => ({});

export function drawWorld(
    ctx: CanvasRenderingContext2D,
    g: Game,
    tf: Transform,
    _a: DrawAssets,
    _o: { menu: boolean; dt: number; best: number }
) {
    ctx.save();
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, tf.w, tf.h);
    ctx.translate(tf.ox, tf.oy);
    ctx.scale(tf.s, tf.s);
    ctx.fillStyle = '#bbb';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#789';
    ctx.beginPath();
    for (let y = -10; y <= H + 10; y += 10) ctx.lineTo(riverX(y) - riverHalf(y), y);
    for (let y = H + 10; y >= -10; y -= 10) ctx.lineTo(riverX(y) + riverHalf(y), y);
    ctx.fill();
    ctx.strokeStyle = '#a33';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(riverX(ROUEN_Y) - riverHalf(ROUEN_Y) - 20, ROUEN_Y);
    ctx.lineTo(riverX(ROUEN_Y) + riverHalf(ROUEN_Y) + 20, ROUEN_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('PARIS', riverX(PARIS_Y) + 70, PARIS_Y);
    ctx.fillText('ROUEN', riverX(ROUEN_Y) + riverHalf(ROUEN_Y) + 20, ROUEN_Y);
    if (g.phase === 'plyndring')
        for (const f of g.forts) {
            ctx.strokeStyle = 'rgba(160,0,0,.4)';
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#633';
            ctx.fillRect(f.x - 14, f.y - 14, 28, 28);
        }
    g.villages.forEach((v) => {
        ctx.fillStyle = g.phase === 'avtale' ? (v.alive ? OCHRE : '#555') : '#999';
        ctx.fillRect(v.x - 16, v.y - 12, 32, 24);
    });
    for (const v of g.volleys) {
        ctx.strokeStyle = '#a00';
        ctx.beginPath();
        ctx.arc(v.x, v.y, VOLLEY_R, 0, Math.PI * 2);
        ctx.stroke();
    }
    for (const b of g.boats) {
        ctx.fillStyle = b.kind === 'frank' ? (g.phase === 'avtale' ? '#35a' : OCHRE) : TERRA;
        if (b.fleeing) ctx.globalAlpha = 0.4;
        ctx.fillRect(b.x - 12, b.y - 20, 24, 40);
        ctx.globalAlpha = 1;
        if (b.raidT > 0 && !b.fleeing) {
            ctx.strokeStyle = TERRA;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(b.x, b.y, 34, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * b.raidT) / 3.4);
            ctx.stroke();
        }
    }
    const s = g.ship;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.heading + Math.PI / 2);
    ctx.fillStyle = s.hit > 0 ? '#fff' : g.phase === 'avtale' ? '#2a2' : '#222';
    ctx.fillRect(-12, -26, 24, 52);
    ctx.restore();
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText(
        `${g.phase}  år ${g.year}  liv ${s.hp}  land ${g.villages.filter((v) => v.alive).length}/${LAND}  rekke ${g.combo}  poeng ${Math.floor(g.score)}`,
        30,
        30
    );
    ctx.restore();
}

export function drawHud(_ctx: CanvasRenderingContext2D, _g: Game, _tf: Transform, _best: number) {}
