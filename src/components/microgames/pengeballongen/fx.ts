// Juice: partikler (mynter, gnister, røyk, flosshatter), mynter som fyker til telleren,
// skjermrystelse og blink. Alt i flatekoordinater (960 x 540). Rystelsen svinner i ekte tid.

import { P } from './art';

export type Slag = 'mynt' | 'gnist' | 'røyk' | 'hatt' | 'glo' | 'papir' | 'lue';

interface Partikkel {
    slag: Slag;
    x: number;
    y: number;
    vx: number;
    vy: number;
    liv: number;
    maks: number;
    rot: number;
    vr: number;
    str: number;
    /** Følger fjellet (glir bakover når ballongen flytter seg). */
    verden: boolean;
    /** Flyr i en bue til et mål (telleren i HUD-en). */
    fra?: { x: number; y: number };
    mål?: { x: number; y: number };
}

export interface Fx {
    p: Partikkel[];
    rist: number;
    blink: number;
    blinkFarge: string;
    /** Telleren «Spart» spretter når mynter lander (0-1). */
    sprett: number;
    /** Ueland-ovalen spretter når gangeren øker (0-1). */
    gangerSprett: number;
    /** Valgstabelen blinker når den nærmer seg streken. */
    stabelBlink: number;
    /** Tid siden start (ekte sekunder) - til animasjon. */
    klokke: number;
}

export const nyFx = (): Fx => ({
    p: [],
    rist: 0,
    blink: 0,
    blinkFarge: P.hvit,
    sprett: 0,
    gangerSprett: 0,
    stabelBlink: 0,
    klokke: 0,
});

const MAKS = 260;

/** Ny runde: tøm partiklene og rystelsen. */
export function nullstillFx(fx: Fx) {
    fx.p.length = 0;
    fx.rist = 0;
    fx.blink = 0;
}

export function slipp(
    fx: Fx,
    slag: Slag,
    x: number,
    y: number,
    o: Partial<Pick<Partikkel, 'vx' | 'vy' | 'maks' | 'str' | 'verden' | 'vr'>> & {
        mål?: { x: number; y: number };
    } = {}
) {
    if (fx.p.length >= MAKS) fx.p.shift();
    const maks = o.maks ?? 0.8;
    fx.p.push({
        slag,
        x,
        y,
        vx: o.vx ?? 0,
        vy: o.vy ?? 0,
        liv: maks,
        maks,
        rot: Math.random() * 6.28,
        vr: o.vr ?? (Math.random() - 0.5) * 8,
        str: o.str ?? 1,
        verden: o.verden ?? false,
        fra: o.mål ? { x, y } : undefined,
        mål: o.mål,
    });
}

export function rist(fx: Fx, styrke: number) {
    fx.rist = Math.max(fx.rist, styrke);
}

export function blink(fx: Fx, styrke: number, farge: string = P.hvit) {
    fx.blink = Math.max(fx.blink, styrke);
    fx.blinkFarge = farge;
}

/**
 * Ett steg. `spill` er spilltid (sakte film under lærings-øyeblikk), `ekte` er ekte tid
 * (rystelse og sprett). `scroll` er hvor langt verden flyttet seg (px) dette steget.
 * Returnerer hvor mange mynter som landet i telleren.
 */
export function oppdaterFx(fx: Fx, spill: number, ekte: number, scroll: number): number {
    fx.klokke += ekte;
    fx.rist = Math.max(0, fx.rist - ekte * 22);
    fx.blink = Math.max(0, fx.blink - ekte * 2.5);
    fx.sprett = Math.max(0, fx.sprett - ekte * 4);
    fx.gangerSprett = Math.max(0, fx.gangerSprett - ekte * 2.5);
    fx.stabelBlink = Math.max(0, fx.stabelBlink - ekte * 3);
    let landet = 0;
    const dt = spill;
    for (let i = fx.p.length - 1; i >= 0; i--) {
        const q = fx.p[i];
        q.liv -= q.mål ? ekte : dt;
        if (q.mål && q.fra) {
            const u = 1 - Math.max(0, q.liv) / q.maks;
            const e = u * u * (3 - 2 * u);
            const cx = (q.fra.x + q.mål.x) / 2;
            const cy = Math.min(q.fra.y, q.mål.y) - 90;
            q.x = (1 - e) * (1 - e) * q.fra.x + 2 * (1 - e) * e * cx + e * e * q.mål.x;
            q.y = (1 - e) * (1 - e) * q.fra.y + 2 * (1 - e) * e * cy + e * e * q.mål.y;
            q.rot += q.vr * ekte;
            if (q.liv <= 0) {
                landet++;
                fx.p.splice(i, 1);
            }
            continue;
        }
        if (q.liv <= 0) {
            fx.p.splice(i, 1);
            continue;
        }
        const tyngde =
            q.slag === 'røyk' ? -18 : q.slag === 'glo' ? -60 : q.slag === 'papir' ? 120 : 520;
        q.vy += tyngde * dt;
        if (q.slag === 'røyk' || q.slag === 'papir') {
            q.vx *= 1 - 1.5 * dt;
            q.vy *= 1 - 1.5 * dt;
        }
        q.x += q.vx * dt - (q.verden ? scroll : 0);
        q.y += q.vy * dt;
        q.rot += q.vr * dt;
    }
    return landet;
}

export function tegnFx(ctx: CanvasRenderingContext2D, fx: Fx, lag: 'bak' | 'foran') {
    for (const q of fx.p) {
        const bak = q.slag === 'røyk';
        if ((lag === 'bak') !== bak) continue;
        const u = Math.max(0, q.liv / q.maks);
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(q.rot);
        switch (q.slag) {
            case 'mynt': {
                const sx = Math.abs(Math.cos(q.rot * 2)) * 0.8 + 0.2;
                ctx.globalAlpha = q.mål ? 1 : Math.min(1, u * 3);
                ctx.scale(sx, 1);
                ctx.fillStyle = P.hvit;
                ctx.strokeStyle = P.kritt;
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.arc(0, 0, 5 * q.str, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 0, 2.6 * q.str, 0, Math.PI * 2);
                ctx.stroke();
                break;
            }
            case 'gnist': {
                ctx.globalAlpha = u;
                ctx.strokeStyle = P.hvit;
                ctx.lineWidth = 2 * q.str;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-q.vx * 0.03, -q.vy * 0.03);
                ctx.stroke();
                break;
            }
            case 'glo': {
                ctx.globalAlpha = u;
                ctx.fillStyle = u > 0.5 ? P.silkeLys : P.silke;
                ctx.fillRect(-1.5 * q.str, -1.5 * q.str, 3 * q.str, 3 * q.str);
                break;
            }
            case 'røyk': {
                ctx.globalAlpha = u * 0.5;
                ctx.fillStyle = P.halv;
                ctx.beginPath();
                ctx.arc(0, 0, (8 + (1 - u) * 22) * q.str, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'hatt': {
                ctx.globalAlpha = Math.min(1, u * 2);
                ctx.fillStyle = P.kritt;
                ctx.fillRect(-7, -2, 14, 3);
                ctx.fillRect(-4.5, -13, 9, 12);
                ctx.fillStyle = P.karmin;
                ctx.fillRect(-4.5, -5, 9, 2);
                break;
            }
            case 'lue': {
                ctx.globalAlpha = Math.min(1, u * 2);
                ctx.fillStyle = P.karmin;
                ctx.beginPath();
                ctx.moveTo(-6, 2);
                ctx.quadraticCurveTo(0, -12, 7, -6);
                ctx.lineTo(6, 2);
                ctx.fill();
                break;
            }
            case 'papir': {
                ctx.globalAlpha = Math.min(1, u * 2);
                ctx.fillStyle = P.hvit;
                ctx.strokeStyle = P.kritt;
                ctx.lineWidth = 1;
                ctx.fillRect(-5, -6, 10, 12);
                ctx.strokeRect(-5, -6, 10, 12);
                break;
            }
        }
        ctx.restore();
    }
}
