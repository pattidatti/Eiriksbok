// Tegningen: Harland and Wolffs blåkopi av Titanic, snitt ved spant 80, i natta.
// Papir og skipssnitt ligger ferdig i papir.ts; her tegnes bare det som beveger seg:
// lys i rommene, folk i trappene og i køen, landgangen, båtene på davitene, vannet,
// båtene som driver ut i mørket og nødrakettene. Båtene står i baater.ts, profilstripa og
// tittelfeltet (HUD-en) i hud.ts, små byggeklosser i former.ts.

import type { ArcadeView } from '../arcade/useArcade';

import { kanSendeStuert, køAntall, nesteSammenleggbar, stuertBorte } from './rules';
import type { Game, Gruppe } from './state';
import { TUNING } from './tuning';
import { ARK, DEKK_Y, MIDT, SKROG, TRAPP, iVerden, skala, vannY, vinkel } from './geom';
import { rakettLys, ristNå, type Fx } from './fx';
import { P, etikett, frø, lagPapir, lagSnitt, ramme, strek } from './papir';

import { artAv, figur, type TegneValg } from './former';
import { davitBåt, driver, flytTall, landgang, plask, raketter, stempel } from './baater';
import { profil, tasteFelt, tittelfelt } from './hud';

export type { TegneValg } from './former';
// ---------- Hurtiglager for det som står stille ----------

let papir: { cv: HTMLCanvasElement; key: string } | null = null;
let snitt: { cv: HTMLCanvasElement; key: string } | null = null;

function hentPapir(w: number, h: number, lav: boolean) {
    const key = `${Math.round(w)}x${Math.round(h)}${lav}`;
    if (!papir || papir.key !== key) papir = { cv: lagPapir(w, h, lav), key };
    return papir.cv;
}
function hentSnitt(s: number) {
    const key = s.toFixed(2);
    if (!snitt || snitt.key !== key) snitt = { cv: lagSnitt(s), key };
    return snitt.cv;
}

// ---------- Himmel, hav og vann ----------

function himmel(c: CanvasRenderingContext2D, g: Game, o: TegneValg) {
    const r = frø(7);
    c.fillStyle = P.hvit;
    for (let i = 0; i < 70; i++) {
        const x = 20 + r() * (ARK.w - 40);
        const y = 66 + r() * 220;
        const blink = o.lav ? 0.5 : 0.35 + 0.3 * Math.sin(g.t * (0.6 + r()) + i);
        c.globalAlpha = 0.18 + 0.25 * blink;
        c.fillRect(x, y, 1.2, 1.2);
    }
    c.globalAlpha = 1;
}

/** Havet bak skipet: horisonten og dønninger som driver sakte (parallakse). */
function havetBak(c: CanvasRenderingContext2D, g: Game, o: TegneValg) {
    const vy = vannY(g.t);
    const hor = vy - 30;
    strek(
        c,
        () => {
            c.moveTo(16, hor);
            c.lineTo(ARK.w - 16, hor);
        },
        0.8,
        P.blyant,
        0.5
    );
    if (o.lav) return;
    for (let l = 0; l < 3; l++) {
        const y = hor + 7 + l * 7;
        const fart = 4 + l * 6;
        c.globalAlpha = 0.18 + l * 0.08;
        c.strokeStyle = P.hvit;
        c.lineWidth = 0.7;
        c.beginPath();
        for (let x = -40 + ((g.t * fart) % 40); x < ARK.w; x += 40) {
            c.moveTo(x, y);
            c.quadraticCurveTo(x + 6, y - 2, x + 12, y);
        }
        c.stroke();
    }
    c.globalAlpha = 1;
}

function bølge(x: number, t: number, lag: number) {
    return (
        Math.sin(x * 0.035 + t * 1.3 + lag) * 3 +
        Math.sin(x * 0.011 - t * 0.8 + lag * 2) * 4 +
        Math.sin(x * 0.09 + t * 2.4) * 1
    );
}

/** Tåke som driver sakte over natta (lyse flekker på papiret). */
function tåke(c: CanvasRenderingContext2D, g: Game) {
    for (let i = 0; i < 3; i++) {
        const x = ((g.t * (9 + i * 5) + i * 380) % (ARK.w + 500)) - 250;
        const y = 150 + i * 90;
        const gr = c.createRadialGradient(x, y, 0, x, y, 230);
        gr.addColorStop(0, 'rgba(150,180,225,0.10)');
        gr.addColorStop(1, 'rgba(150,180,225,0)');
        c.fillStyle = gr;
        c.fillRect(x - 230, y - 230, 460, 460);
    }
}

function vann(c: CanvasRenderingContext2D, g: Game, o: TegneValg) {
    const vy = vannY(g.t);
    const steg = o.lav ? 24 : 12;
    c.fillStyle = P.dyp;
    c.globalAlpha = 0.86;
    c.beginPath();
    c.moveTo(0, ARK.h);
    for (let x = 0; x <= ARK.w; x += steg) c.lineTo(x, vy + bølge(x, g.t, 0));
    c.lineTo(ARK.w, ARK.h);
    c.closePath();
    c.fill();
    c.globalAlpha = 1;
    strek(
        c,
        () => {
            for (let x = 0; x <= ARK.w; x += steg) {
                const y = vy + bølge(x, g.t, 0);
                if (x === 0) c.moveTo(x, y);
                else c.lineTo(x, y);
            }
        },
        1.4,
        P.hvit,
        0.85
    );
    // Hvite bølgestreker under flata (skravur).
    const lag = o.lav ? 1 : 3;
    c.strokeStyle = P.hvit;
    c.lineWidth = 0.7;
    for (let l = 1; l <= lag; l++) {
        c.globalAlpha = 0.28 - l * 0.06;
        c.beginPath();
        const y0 = vy + l * 13;
        for (let x = ((l * 37 + g.t * 6 * (l % 2 ? 1 : -1)) % 60) - 60; x < ARK.w; x += 60) {
            const y = y0 + bølge(x, g.t, l) * 0.6;
            c.moveTo(x, y);
            c.quadraticCurveTo(x + 9, y - 3, x + 18, y);
        }
        c.stroke();
    }
    c.globalAlpha = 1;
}

// ---------- Inne i skipet (snittets ramme) ----------

/** Lys i rommene: lanternegult der vannet ikke er, slukker dekk for dekk. */
function lys(c: CanvasRenderingContext2D, g: Game, a: number) {
    const vy = vannY(g.t);
    const r = frø(33);
    for (let i = 0; i < 7; i++) {
        const y1 = DEKK_Y(i);
        for (let x = SKROG.x0 + 10; x < SKROG.x1 - 16; x += 23) {
            const på = r() < 0.55;
            const fl = r();
            if (!på) continue;
            if (Object.values(TRAPP).some((t) => Math.abs(t.x - x - 6) < 18)) continue;
            const p = iVerden(x + 6, y1 - 9, a);
            const avstand = vy - p.y;
            if (avstand < 0) continue;
            let alfa = 0.85;
            if (avstand < 16 && Math.sin(g.t * 23 + fl * 40) < -0.2) alfa *= 0.3;
            c.fillStyle = P.gul;
            c.globalAlpha = alfa * 0.16;
            c.fillRect(x, y1 - 17, 12, 13);
            c.globalAlpha = alfa;
            c.fillRect(x + 3, y1 - 13, 6, 5);
        }
    }
    c.globalAlpha = 1;
}

/** Gruppene i trappene: små klynger av folk på vei opp. */
function trappefolk(c: CanvasRenderingContext2D, g: Game) {
    c.fillStyle = P.gul;
    const venter: Gruppe[] = [];
    for (const gr of g.grupper) {
        const t = TRAPP[gr.klasse];
        if (gr.klasse === 3 && !g.portÅpen && gr.pos >= TUNING.port.pos - 1e-6) {
            venter.push(gr);
            continue;
        }
        const m = Math.min(gr.antall, 7);
        for (let i = 0; i < m; i++) {
            const pos = Math.max(0, gr.pos - i * 0.011);
            const dekk = t.fra + pos * (7 - t.fra);
            const d = Math.floor(dekk);
            const frac = dekk - d;
            const v = (d - t.fra) % 2 === 0 ? -1 : 1;
            const x = t.x + v * 9 - v * 18 * frac;
            const fot = DEKK_Y(t.fra) + (DEKK_Y(7) - DEKK_Y(t.fra)) * pos;
            const gang = Math.sin(g.t * 9 + gr.id + i) * 0.6;
            figur(c, x + gang, fot, 10, artAv(gr.id * 7 + i));
        }
    }
    // Tredje klasse bak gitterporten på D-dekk.
    const n = venter.reduce((s, x) => s + x.antall, 0);
    const portY = DEKK_Y(3);
    const vist = Math.min(n, 44);
    for (let i = 0; i < vist; i++) {
        const rad = Math.floor(i / 11);
        const kol = i % 11;
        c.globalAlpha = 1 - rad * 0.16;
        figur(
            c,
            TRAPP[3].x + 16 + kol * 5.4 + (rad % 2) * 2.5,
            portY - rad * 4,
            10 - rad * 0.5,
            artAv(i * 3 + 1)
        );
    }
    c.globalAlpha = 1;
    // Porten. Den glir til side når den åpnes.
    const x = TRAPP[3].x;
    const åpen = g.portÅpen;
    const kan = kanSendeStuert(g);
    if (kan) {
        // Porten venter på stuerten: en rolig, pulserende ring.
        const p = 0.5 + 0.5 * Math.sin(g.t * 4);
        c.strokeStyle = P.gul;
        c.globalAlpha = 0.35 + 0.5 * p;
        c.lineWidth = 1.6;
        c.beginPath();
        c.arc(x, portY - 15, 22 + p * 4, 0, Math.PI * 2);
        c.stroke();
        c.globalAlpha = 1;
    }
    c.strokeStyle = åpen ? P.blyant : P.rød;
    c.lineWidth = 1.4;
    c.beginPath();
    c.rect(x - 12, portY - 30, 24, 30);
    // Porten glir til side når den åpnes, og tilbake når den glir igjen.
    const glid = Math.min(1, (g.t - g.portEndret) / 0.7);
    const sk = 10 * (åpen ? glid : 1 - glid);
    for (let b = -8; b <= 8; b += 4) {
        c.moveTo(x + b - sk, portY - 30);
        c.lineTo(x + b - sk, portY);
    }
    c.stroke();
}

/**
 * Stuerten: en hvit figur med lykt som løper ned trappa til porten på D-dekk og
 * opp igjen. Mens han er borte, står landgangen stille.
 */
function stuert(c: CanvasRenderingContext2D, g: Game) {
    if (g.stuertSendt === null || g.stuertMål !== 'port') return;
    const s = g.t - g.stuertSendt;
    const { ned, borte } = TUNING.stuert;
    if (s < 0 || s > borte) return;
    const port = TUNING.port.pos;
    // Ned fra båtdekket (1) til porten, så opp igjen.
    const pos =
        s < ned ? 1 - (1 - port) * (s / ned) : port + (1 - port) * ((s - ned) / (borte - ned));
    const t = TRAPP[3];
    const dekk = t.fra + pos * (7 - t.fra);
    const d = Math.floor(dekk);
    const frac = dekk - d;
    const v = (d - t.fra) % 2 === 0 ? -1 : 1;
    const x = t.x + v * 9 - v * 18 * frac;
    const fot = DEKK_Y(t.fra) + (DEKK_Y(7) - DEKK_Y(t.fra)) * pos;
    c.fillStyle = P.hvit;
    figur(c, x + Math.sin(g.t * 14) * 0.6, fot, 12, 0);
    // Lykta.
    const fl = 0.75 + 0.25 * Math.sin(g.t * 23);
    c.fillStyle = P.gul;
    c.globalAlpha = 0.3 * fl;
    c.beginPath();
    c.arc(x + 5, fot - 7, 7, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
    c.beginPath();
    c.arc(x + 5, fot - 7, 1.8, 0, Math.PI * 2);
    c.fill();
}

/** Køen på båtdekket: alle i én kø, den forreste nærmest landgangen. */
function kø(c: CanvasRenderingContext2D, g: Game, kq: KøVisning, dt: number) {
    const fot = DEKK_Y(7) - 1;
    const pr = 24;
    const start = g.landgang === 'B' ? SKROG.x0 + 16 : SKROG.x1 - 16;
    const retning = g.landgang === 'B' ? 1 : -1;
    let j = 0;
    const maks = 128;
    for (let gi = 0; gi < g.kø.length && j < maks; gi++) {
        const gr = g.kø[gi];
        for (let i = 0; i < gr.antall && j < maks; i++, j++) {
            const rad = Math.floor(j / pr);
            const kol = j % pr;
            const tx = start + retning * (kol * 10 + rad * 4.5 + (gi % 2) * 2);
            const ty = fot - rad * 7;
            if (kq.x[j] === undefined) {
                kq.x[j] = tx;
                kq.y[j] = ty;
            }
            const k = Math.min(1, dt * 7);
            kq.x[j] += (tx - kq.x[j]) * k;
            kq.y[j] += (ty - kq.y[j]) * k;
            kq.art[j] = artAv(gr.id * 13 + i);
            kq.foran[j] = gi === 0 ? 1 : 0;
        }
    }
    kq.x.length = j;
    kq.y.length = j;
    // Tegn bakerste rad først.
    // Mørk kant rundt hver silhuett, så de skiller seg fra hverandre og fra dekket.
    c.strokeStyle = P.dyp;
    c.lineWidth = 1.6;
    for (let i = j - 1; i >= 0; i--) {
        const rad = Math.floor(i / pr);
        c.globalAlpha = (kq.foran[i] ? 1 : 0.82) - rad * 0.12;
        c.fillStyle = kq.foran[i] ? P.gul : P.lykt;
        const sv = Math.sin(g.t * 1.7 + i * 0.9) * 0.9;
        figur(c, kq.x[i] + sv, kq.y[i], 17 - rad * 0.8, kq.art[i], true);
    }
    c.globalAlpha = 1;
}

export interface KøVisning {
    x: number[];
    y: number[];
    art: number[];
    foran: number[];
}
export const nyKøVisning = (): KøVisning => ({ x: [], y: [], art: [], foran: [] });

// ---------- Hele tegningen ----------

export function tegn(view: ArcadeView, g: Game, fx: Fx, kq: KøVisning, dt: number, o: TegneValg) {
    const { ctx: c, w, h } = view;
    if (w < 4) return;
    const k = skala(w, h);
    c.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    c.drawImage(hentPapir(w * view.dpr, h * view.dpr, o.lav), 0, 0, w, h);
    c.save();
    const r = ristNå(fx, g.t);
    c.translate(k.ox + r.x * k.s, k.oy + r.y * k.s);
    c.scale(k.s, k.s);
    c.lineCap = 'round';
    c.lineJoin = 'round';

    himmel(c, g, o);
    tåke(c, g);
    havetBak(c, g, o);

    // Snittet krenger rundt PIVOT.
    const a = vinkel(g.t);
    c.save();
    c.translate(MIDT, 300);
    c.rotate(a);
    c.translate(-MIDT, -300);
    lys(c, g, a);
    c.drawImage(hentSnitt(Math.min(3, k.s * view.dpr)), 0, 0, ARK.w, ARK.h);
    trappefolk(c, g);
    stuert(c, g);
    kø(c, g, kq, dt);
    c.restore();

    vann(c, g, o);
    driver(c, g, fx);
    landgang(c, g, fx, a);
    davitBåt(c, g, 'B', fx, o);
    davitBåt(c, g, 'S', fx, o);
    plask(c, g, fx);
    stempel(c, g, fx);
    flytTall(c, g, fx);

    // Etiketter som ikke krenger.
    const n = køAntall(g);
    if (n > 0) etikett(c, `KØ ${n}`, MIDT, 104, 11, P.gul, 'center');
    const bakPort = g.grupper
        .filter((gr) => gr.klasse === 3 && !g.portÅpen && gr.pos >= TUNING.port.pos - 1e-6)
        .reduce((s, gr) => s + gr.antall, 0);
    if (bakPort > 0) {
        const p = iVerden(TRAPP[3].x, DEKK_Y(3) - 40, a);
        etikett(c, `3. KLASSE ${bakPort}`, p.x, p.y, 10, P.gul, 'center');
    }
    if (o.spiller && kanSendeStuert(g)) {
        const p = iVerden(TRAPP[3].x, DEKK_Y(3) + 14, a);
        etikett(c, 'S: ÅPNE PORTEN', p.x, p.y, 11, P.hvit, 'center', 800);
    }
    if (g.portÅpen && g.portLukkes > g.t && !(g.t >= g.portÅpner)) {
        const p = iVerden(TRAPP[3].x, DEKK_Y(3) + 14, a);
        etikett(c, `ÅPEN ${Math.ceil(g.portLukkes - g.t)} S`, p.x, p.y, 11, P.gul, 'center', 800);
    }
    if (stuertBorte(g)) {
        const rigg = g.stuertMål === 'rigg';
        const neste = nesteSammenleggbar(g);
        etikett(
            c,
            rigg
                ? `LANDGANGEN VENTER - STUERTEN RIGGER ${neste && !g.stuertGjort ? neste.navn.toUpperCase() : 'BÅTEN'}`
                : 'LANDGANGEN VENTER - STUERTEN ER NEDE VED PORTEN',
            MIDT,
            90,
            12,
            P.hvit,
            'center',
            800
        );
    }

    raketter(c, g, fx);
    profil(c, g);
    if (o.spiller) {
        tittelfelt(c, g);
        tasteFelt(c, g);
    }
    ramme(c);
    // Rakettlyset: hele tegningen blekes et øyeblikk.
    const l = rakettLys(fx, g.t);
    if (l > 0) {
        c.fillStyle = P.hvit;
        c.globalAlpha = l * 0.22;
        c.fillRect(0, 0, ARK.w, ARK.h);
        c.globalAlpha = 1;
    }
    c.restore();
}
