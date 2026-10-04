// Kunsten: Atelier Populaire-silketrykk fra mai 1968. Alt som står stille, tegnes én gang til
// offscreen-lerreter her (mur, plakatpapir, kartlinje, flekkemaske, figurer). draw.ts setter
// dem sammen hver ramme. Ingen gradienter, ingen shadowBlur, ingen filtre.

import { seeded } from '../sim';
import type { Brett } from './levels';

/** Paletten fra kunstbriefen, brukt flatt. */
export const P = {
    papir: '#f2f2ef',
    rød: '#e0261d',
    svart: '#151413',
    blå: '#1f4f9f',
    tynn: '#f3b8ad',
    grå: '#8f8a80',
    mur: '#8b8b8d',
    murMørk: '#76767a',
};

/** Outfit 900 er alltid lastet; klemt sammen vannrett ser den ut som håndmalte plakatbokstaver. */
export const FONT = 'Outfit, Inter, system-ui, sans-serif';
export const BODY = 'Inter, Outfit, system-ui, sans-serif';

export type Tier = 'lav' | 'middels' | 'hoy';

/** Kvalitetsnivået: ?kvalitet=lav|middels|hoy, ellers en gjetning fra maskinen. */
export function pickTier(): Tier {
    try {
        const q = new URLSearchParams(window.location.search).get('kvalitet');
        if (q === 'lav' || q === 'middels' || q === 'hoy') return q;
        const cores = navigator.hardwareConcurrency ?? 4;
        return cores >= 8 ? 'hoy' : cores >= 4 ? 'middels' : 'lav';
    } catch {
        return 'lav';
    }
}

// ---------------------------------------------------------------------------
// Oppsettet: plakaten på muren, kartet i plakaten, HUD-feltet øverst og knappestripa nederst.

export const HUD_H = 92;
export const FOT_H = 64;
/** Plakaten henger litt skjevt (ca. 0,7 grader). */
export const SKJEV = -0.012;

export interface Layout {
    s: number;
    /** Kartets øvre venstre hjørne (før skjevheten). */
    ox: number;
    oy: number;
    /** Plakaten. */
    px: number;
    py: number;
    pw: number;
    ph: number;
    /** Midtpunktet plakaten roteres rundt. */
    cx: number;
    cy: number;
}

export function layout(w: number, h: number, b: Brett): Layout {
    const s = Math.max(8, Math.floor(Math.min((w - 80) / b.b, (h - 28 - HUD_H - FOT_H) / b.h)));
    const mw = s * b.b;
    const pw = Math.min(w - 16, Math.max(mw + 40, 640));
    const px = Math.round((w - pw) / 2);
    const py = 12;
    const ph = h - 24;
    const ox = Math.round(px + (pw - mw) / 2);
    const oy = Math.round(py + HUD_H + (ph - HUD_H - FOT_H - s * b.h) / 2);
    return { s, ox, oy, px, py, pw, ph, cx: px + pw / 2, cy: py + ph / 2 };
}

/** Rute (x, y) -> punkt i spillvinduet, med samme skjevhet som tegningen. */
export function ruteTilSkjerm(L: Layout, x: number, y: number) {
    const lx = L.ox + (x + 0.5) * L.s - L.cx;
    const ly = L.oy + (y + 0.5) * L.s - L.cy;
    const c = Math.cos(SKJEV);
    const sn = Math.sin(SKJEV);
    return { x: L.cx + lx * c - ly * sn, y: L.cy + lx * sn + ly * c };
}

// ---------------------------------------------------------------------------
// Kartlinjene per brett, i rutekoordinater. Bare pynt: hele rutenettet er spillbart.

type Pt = [number, number];

const FRANKRIKE: Pt[] = [
    [19.5, -0.3],
    [24, 0.8],
    [26, 2],
    [32, 4.5],
    [32.6, 7.5],
    [31, 10],
    [29.6, 12],
    [31, 15],
    [32.4, 18],
    [29, 18.6],
    [26.5, 19.4],
    [22, 19.2],
    [18.5, 20.3],
    [12, 19.6],
    [6.6, 18.9],
    [6.6, 14],
    [5, 12],
    [3.5, 10.6],
    [1.5, 9.2],
    [-0.4, 7.4],
    [3, 6],
    [6.5, 5.5],
    [6.5, 2.6],
    [8.5, 3.8],
    [11, 2.2],
    [15.5, 0.8],
];
const NORDVEST_KYST: Pt[] = [
    [28.5, -0.2],
    [22, 0.3],
    [17, 1.5],
    [12, 1.8],
    [11, 0.4],
    [10.5, 3.5],
    [6, 4],
    [-0.5, 4.6],
];
const NORDVEST_SØR: Pt[] = [
    [-0.5, 10.5],
    [1.5, 12.5],
    [3, 15],
    [3.5, 18.5],
];
const SEINE: Pt[] = [
    [22.5, 9.2],
    [17, 8.6],
    [12, 7.7],
    [9, 6.6],
    [6.5, 7.8],
    [4.2, 10.3],
    [2.4, 8.4],
    [3.8, 5],
    [2.2, 1.6],
    [-0.5, 0.6],
];

export interface Etikett {
    t: string;
    x: number;
    y: number;
}

export const ETIKETTER: Record<number, Etikett[]> = {
    1: [
        { t: 'PARIS', x: 11, y: 5.6 },
        { t: 'NANTERRE', x: 4, y: 1.6 },
        { t: 'SAINT-DENIS', x: 13, y: 0.6 },
        { t: 'VINCENNES', x: 18.4, y: 6.6 },
        { t: 'BILLANCOURT', x: 3.6, y: 12.4 },
        { t: 'ORLY', x: 12, y: 13.4 },
    ],
    2: [
        { t: 'PARIS', x: 21, y: 4.4 },
        { t: 'NORMANDIE', x: 14, y: 6.4 },
        { t: 'LE MANS', x: 12, y: 14.4 },
        { t: 'NANTES', x: 6.5, y: 16.6 },
        { t: 'BRETAGNE', x: 3, y: 7.4 },
    ],
    3: [
        { t: 'PARIS', x: 17, y: 3.4 },
        { t: 'NORD', x: 22.5, y: 2.6 },
        { t: 'NANTES', x: 4, y: 12.6 },
        { t: 'LYON', x: 27.8, y: 13 },
        { t: 'SOCHAUX', x: 30.2, y: 7.4 },
        { t: 'MARSEILLE', x: 23.5, y: 18.4 },
        { t: 'TOULOUSE', x: 11, y: 15.4 },
    ],
};

// ---------------------------------------------------------------------------

function mk(w: number, h: number) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return [c, c.getContext('2d')!] as const;
}

/** En ru strek: punktene får små tilfeldige knekker, som en pensel. */
function ruLinje(
    ctx: CanvasRenderingContext2D,
    pts: { x: number; y: number }[],
    rng: () => number,
    ru: number,
    lukk = false
) {
    ctx.beginPath();
    const n = pts.length;
    for (let i = 0; i < n + (lukk ? 1 : 0); i++) {
        const a = pts[i % n];
        const b = pts[(i + 1) % n];
        if (i === 0) ctx.moveTo(a.x, a.y);
        if (i === n - 1 && !lukk) break;
        const steg = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 14));
        for (let k = 1; k <= steg; k++) {
            const t = k / steg;
            const j = k === steg ? 0 : ru;
            ctx.lineTo(
                a.x + (b.x - a.x) * t + (rng() - 0.5) * j,
                a.y + (b.y - a.y) * t + (rng() - 0.5) * j
            );
        }
    }
    if (lukk) ctx.closePath();
}

/**
 * Bakgrunnen for ett brett: muren, gamle plakatrester, plakatpapiret (skjevt) med kartlinje,
 * stedsnavn i blyant og en limrynke. Tegnes én gang per størrelse og brett.
 */
export function tegnBakgrunn(w: number, h: number, dpr: number, b: Brett, L: Layout) {
    const [c, ctx] = mk(w * dpr, h * dpr);
    ctx.scale(dpr, dpr);
    const rng = seeded(1968 + b.nr);
    // Muren: grå betong med flekker og fuger.
    ctx.fillStyle = P.mur;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = P.murMørk;
    for (let i = 0; i < 260; i++) {
        const r = 2 + rng() * 9;
        ctx.globalAlpha = 0.15 + rng() * 0.25;
        ctx.beginPath();
        ctx.arc(rng() * w, rng() * h, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#5c5c60';
    ctx.lineWidth = 1;
    for (let y = 30; y < h; y += 46) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y + 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Gamle plakatrester som stikker fram bak plakaten.
    const rester = [
        { x: L.px - 46, y: L.py + 40, w: 120, h: 210, f: '#d8241b', r: 0.05, t: 'NON' },
        {
            x: L.px + L.pw - 70,
            y: L.py + L.ph - 230,
            w: 120,
            h: 200,
            f: '#e0261d',
            r: -0.04,
            t: 'OUI',
        },
        { x: L.px + L.pw - 60, y: L.py - 6, w: 100, h: 120, f: '#f2f2ef', r: 0.07, t: '68' },
        { x: L.px - 30, y: L.py + L.ph - 150, w: 90, h: 150, f: '#b91d15', r: -0.06, t: '' },
    ];
    for (const r of rester) {
        ctx.save();
        ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
        ctx.rotate(r.r);
        ctx.fillStyle = r.f;
        const pts = [
            { x: -r.w / 2, y: -r.h / 2 },
            { x: r.w / 2, y: -r.h / 2 + 6 },
            { x: r.w / 2 - 4, y: r.h / 2 },
            { x: -r.w / 2 + 8, y: r.h / 2 - 5 },
        ];
        ruLinje(ctx, pts, rng, 9, true);
        ctx.fill();
        if (r.t) {
            ctx.fillStyle = r.f === '#f2f2ef' ? '#c9221a' : '#f2f2ef';
            ctx.font = `900 46px ${FONT}`;
            ctx.textAlign = 'center';
            ctx.globalAlpha = 0.7;
            ctx.fillText(r.t, 0, 0);
            ctx.globalAlpha = 1;
        }
        ctx.restore();
    }
    // Plakaten, litt skjev.
    ctx.save();
    ctx.translate(L.cx, L.cy);
    ctx.rotate(SKJEV);
    ctx.translate(-L.cx, -L.cy);
    ctx.fillStyle = P.papir;
    ruLinje(
        ctx,
        [
            { x: L.px, y: L.py },
            { x: L.px + L.pw, y: L.py },
            { x: L.px + L.pw, y: L.py + L.ph },
            { x: L.px, y: L.py + L.ph },
        ],
        rng,
        2.5,
        true
    );
    ctx.fill();
    // Papirstruktur: små grå korn.
    ctx.fillStyle = P.grå;
    for (let i = 0; i < (L.pw * L.ph) / 900; i++) {
        ctx.globalAlpha = 0.06 + rng() * 0.08;
        ctx.fillRect(L.px + rng() * L.pw, L.py + rng() * L.ph, 1 + rng() * 1.5, 1 + rng() * 1.5);
    }
    // Limrynka: et lyst og et mørkt drag på skrå.
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = P.svart;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(L.px + L.pw * 0.62, L.py);
    ctx.quadraticCurveTo(L.px + L.pw * 0.7, L.py + L.ph * 0.5, L.px + L.pw * 0.66, L.py + L.ph);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(L.px + L.pw * 0.62 + 3, L.py);
    ctx.quadraticCurveTo(
        L.px + L.pw * 0.7 + 3,
        L.py + L.ph * 0.5,
        L.px + L.pw * 0.66 + 3,
        L.py + L.ph
    );
    ctx.stroke();
    ctx.globalAlpha = 1;
    // HUD-streken under telleren.
    ctx.fillStyle = P.svart;
    ctx.fillRect(L.px + 16, L.py + HUD_H - 10, L.pw - 32, 3);

    // Kartet.
    const s = L.s;
    const til = (p: Pt) => ({ x: L.ox + (p[0] + 0.5) * s, y: L.oy + (p[1] + 0.5) * s });
    ctx.save();
    ctx.beginPath();
    ctx.rect(L.ox - 2, L.oy - 2, s * b.b + 4, s * b.h + 4);
    ctx.clip();
    // Svake blyantprikker der rutene møtes.
    ctx.fillStyle = P.grå;
    ctx.globalAlpha = 0.35;
    for (let x = 1; x < b.b; x++)
        for (let y = 1; y < b.h; y++) ctx.fillRect(L.ox + x * s - 1, L.oy + y * s - 1, 2, 2);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = P.svart;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (b.nr === 3) {
        // Havet: tynne blyantstreker utenfor landet.
        ctx.save();
        ruLinje(ctx, FRANKRIKE.map(til), rng, 4, true);
        ctx.rect(L.ox + s * b.b + 10, L.oy - 10, -(s * b.b + 20), s * b.h + 20);
        ctx.clip('evenodd');
        bølgestreker(ctx, L, b, rng);
        ctx.restore();
        ctx.lineWidth = 3;
        ruLinje(ctx, FRANKRIKE.map(til), rng, 3, true);
        ctx.stroke();
    } else if (b.nr === 2) {
        ctx.save();
        const hav = [...NORDVEST_KYST.map(til), til([-0.5, -0.5]), til([28.5, -0.5])];
        ruLinje(ctx, hav, rng, 3, true);
        ctx.clip();
        bølgestreker(ctx, L, b, rng);
        ctx.restore();
        ctx.save();
        const hav2 = [...NORDVEST_SØR.map(til), til([-0.5, 18.5])];
        ruLinje(ctx, hav2, rng, 3, true);
        ctx.clip();
        bølgestreker(ctx, L, b, rng);
        ctx.restore();
        ctx.lineWidth = 3;
        ruLinje(ctx, NORDVEST_KYST.map(til), rng, 3);
        ctx.stroke();
        ruLinje(ctx, NORDVEST_SØR.map(til), rng, 3);
        ctx.stroke();
    } else {
        // Seinen og ringveien rundt Paris.
        ctx.lineWidth = s * 0.35;
        ctx.strokeStyle = '#d9d4c8';
        ruLinje(ctx, SEINE.map(til), rng, 2);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.strokeStyle = P.svart;
        ruLinje(ctx, SEINE.map(til), rng, 2);
        ctx.stroke();
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = P.grå;
        ctx.beginPath();
        const p = til([b.paris.x, b.paris.y]);
        ctx.ellipse(p.x, p.y, s * 5, s * 3.4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    // Elva på brett 2 med to broer (den stengte broen tegnes i draw.ts).
    if (b.elv) {
        ctx.fillStyle = '#d3d6d4';
        ctx.strokeStyle = P.svart;
        ctx.lineWidth = 2;
        for (const e of b.elv.celler) {
            const p = til([e.x, e.y]);
            ctx.fillRect(p.x - s * 0.45, p.y - s * 0.5 - 1, s * 0.9, s + 2);
        }
        ctx.beginPath();
        for (const side of [-0.45, 0.45]) {
            const x = L.ox + (b.elv.celler[0].x + 0.5 + side) * s;
            ctx.moveTo(x, L.oy);
            ctx.lineTo(x, L.oy + s * b.h);
        }
        ctx.stroke();
        // Broene: planker på tvers.
        const alle: { x: number; y: number }[] = [];
        for (let y = 0; y < b.h; y++)
            if (!b.elv.celler.some((c) => c.y === y)) alle.push({ x: b.elv.celler[0].x, y });
        ctx.fillStyle = P.papir;
        for (const q of alle) {
            const p = til([q.x, q.y]);
            ctx.fillRect(p.x - s * 0.6, p.y - s * 0.5, s * 1.2, s);
            ctx.strokeRect(p.x - s * 0.6, p.y - s * 0.5, s * 1.2, s);
            ctx.beginPath();
            for (let k = 1; k < 4; k++) {
                ctx.moveTo(p.x - s * 0.6 + k * s * 0.3, p.y - s * 0.5);
                ctx.lineTo(p.x - s * 0.6 + k * s * 0.3, p.y + s * 0.5);
            }
            ctx.stroke();
        }
    }
    // Silketrykk: et svakt raster av røde prikker og rakelstriper over hele kartet.
    ctx.fillStyle = P.rød;
    ctx.globalAlpha = 0.07;
    for (let y = L.oy; y < L.oy + s * b.h; y += 7)
        for (let x = L.ox + ((y / 7) % 2) * 3.5; x < L.ox + s * b.b; x += 7) {
            const rr = 0.6 + rng() * 1.1;
            ctx.fillRect(x, y, rr, rr);
        }
    ctx.globalAlpha = 0.05;
    for (let k = 0; k < 7; k++) {
        const y = L.oy + rng() * s * b.h;
        ctx.fillRect(L.ox, y, s * b.b, 3 + rng() * 9);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    // Stedsnavn som store plakatbokstaver, svakt trykt i bakgrunnen.
    ctx.textAlign = 'center';
    ctx.fillStyle = P.svart;
    for (const e of ETIKETTER[b.nr] ?? []) {
        const p = til([e.x, e.y]);
        ctx.save();
        ctx.translate(p.x, p.y + 4);
        ctx.rotate((rng() - 0.5) * 0.08);
        ctx.globalAlpha = 0.11;
        ctx.font = `900 ${Math.round(s * 1.25)}px ${FONT}`;
        ctx.fillText(e.t, 0, s * 0.35);
        ctx.globalAlpha = 0.55;
        ctx.font = `800 12px ${BODY}`;
        ctx.fillText(e.t, 0, 0);
        ctx.restore();
    }
    ctx.globalAlpha = 1;
    // Sorbonne: en liten svart stjerne.
    const sp = til([b.paris.x, b.paris.y]);
    ctx.fillStyle = P.svart;
    stjerne(ctx, sp.x, sp.y + s * 0.95, s * 0.28);
    ctx.font = `700 13px ${BODY}`;
    ctx.fillText('SORBONNE', sp.x, sp.y + s * 1.6);
    ctx.restore();
    return c;
}

function bølgestreker(ctx: CanvasRenderingContext2D, L: Layout, b: Brett, rng: () => number) {
    ctx.strokeStyle = P.grå;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1.2;
    for (let y = L.oy + 8; y < L.oy + L.s * b.h; y += 13) {
        for (let x = L.ox + rng() * 30; x < L.ox + L.s * b.b; x += 40 + rng() * 30) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + 6, y - 3, x + 12, y);
            ctx.quadraticCurveTo(x + 18, y + 3, x + 24, y);
            ctx.stroke();
        }
    }
    ctx.globalAlpha = 1;
}

function stjerne(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 ? r * 0.45 : r;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
}

/**
 * Flekkemasken: små hull der rakelen ikke presset blekket gjennom. Legges på blekklaget med
 * `destination-out`, så papiret skinner gjennom det røde og det blå.
 */
export function tegnFlekker(w: number, h: number, dpr: number) {
    const [c, ctx] = mk(w * dpr, h * dpr);
    ctx.scale(dpr, dpr);
    const rng = seeded(68);
    ctx.fillStyle = '#000';
    for (let i = 0; i < (w * h) / 130; i++) {
        ctx.globalAlpha = 0.25 + rng() * 0.6;
        const r = 0.4 + rng() * rng() * 2;
        ctx.beginPath();
        ctx.arc(rng() * w, rng() * h, r, 0, Math.PI * 2);
        ctx.fill();
    }
    // Lange striper der rakelen hoppet.
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 18; i++) {
        const y = rng() * h;
        ctx.fillRect(0, y, w, 1 + rng() * 2);
    }
    ctx.globalAlpha = 1;
    return c;
}

/** Fabrikken som venter: svart silhuett med sagtak og pipe. Tegnes rundt (0, 0), bredde ca. 1,2 s. */
export function fabrikkForm(ctx: CanvasRenderingContext2D, s: number) {
    const w = s * 1.15;
    const h = s * 0.62;
    const x0 = -w / 2;
    const y0 = s * 0.38;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0, y0 - h * 0.55);
    // Sagtaket: tre tenner.
    for (let i = 0; i < 3; i++) {
        const a = x0 + (i * w * 0.7) / 3;
        ctx.lineTo(a + (w * 0.7) / 3, y0 - h);
        ctx.lineTo(a + (w * 0.7) / 3, y0 - h * 0.55);
    }
    // Pipa.
    ctx.lineTo(x0 + w * 0.76, y0 - h * 0.55);
    ctx.lineTo(x0 + w * 0.76, y0 - h * 1.55);
    ctx.lineTo(x0 + w * 0.92, y0 - h * 1.55);
    ctx.lineTo(x0 + w * 0.92, y0 - h * 0.55);
    ctx.lineTo(x0 + w, y0 - h * 0.55);
    ctx.lineTo(x0 + w, y0);
    ctx.closePath();
}

/** Tre streikende arm i arm (hode og skuldre), tegnet som form rundt (0, 0). Skjæres ut av det røde. */
export function folkForm(ctx: CanvasRenderingContext2D, s: number) {
    const r = s * 0.085;
    ctx.beginPath();
    for (let i = -1; i <= 1; i++) {
        const x = i * s * 0.22;
        const y = i === 0 ? -s * 0.07 : -s * 0.03;
        ctx.moveTo(x + r, y - s * 0.06);
        ctx.arc(x, y - s * 0.06, r, 0, Math.PI * 2);
        ctx.moveTo(x - r * 1.5, y + s * 0.2);
        ctx.quadraticCurveTo(x - r * 1.5, y + s * 0.04, x, y + s * 0.04);
        ctx.quadraticCurveTo(x + r * 1.5, y + s * 0.04, x + r * 1.5, y + s * 0.2);
        ctx.closePath();
    }
}

/** Knyttneven som vokser ut av en fabrikkpipe (hodet), som form rundt (0, 0), pekende opp. */
export function neveForm(ctx: CanvasRenderingContext2D, s: number) {
    ctx.beginPath();
    // Pipa/armen.
    ctx.rect(-s * 0.07, -s * 0.02, s * 0.14, s * 0.32);
    // Neven: en blokk med fire knoker øverst og tommelen på siden.
    ctx.rect(-s * 0.16, -s * 0.2, s * 0.32, s * 0.2);
    for (let i = 0; i < 4; i++) {
        const x = -s * 0.12 + i * s * 0.08;
        ctx.moveTo(x + s * 0.045, -s * 0.2);
        ctx.arc(x, -s * 0.2, s * 0.045, 0, Math.PI * 2);
    }
    ctx.moveTo(-s * 0.16, -s * 0.08);
    ctx.arc(-s * 0.17, -s * 0.08, s * 0.05, 0, Math.PI * 2);
}

/** De Gaulles profil med kepi, mot høyre, flat blå. Tegnes rundt (0, 0), høyde ca. `r` x 2. */
export function deGaulleForm(ctx: CanvasRenderingContext2D, r: number) {
    const pts: [number, number][] = [
        [-0.45, 1],
        [-0.42, 0.45],
        [-0.55, 0.1],
        [-0.6, -0.15],
        [-0.55, -0.75],
        [0.3, -0.8],
        [0.35, -0.3],
        [0.78, -0.24],
        [0.33, -0.16],
        [0.38, -0.05],
        [0.42, 0.02],
        [0.8, 0.26],
        [0.45, 0.33],
        [0.48, 0.45],
        [0.42, 0.6],
        [0.25, 0.68],
        [0.15, 0.75],
        [0.25, 1],
    ];
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * r, y * r) : ctx.moveTo(x * r, y * r)));
    ctx.closePath();
}
