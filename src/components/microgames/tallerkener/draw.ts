// Tegningen per bilde: maskeradescenen med tallerkener på forgylte lysestaker, tinntallerkenen
// på skymaskinen, sidene, kista foran rampen, skottenes hånd og teppet. De statiske lagene
// (bakteppe, kulisser, proscenium, korn) kommer ferdige fra art.ts.

import { TUNING, type PlateKind } from './tuning';
import { SLOTS } from './levels';
import type { Game } from './state';
import { aarNa, egneStenger } from './rules';
import { PAL, type Art } from './art';
import {
    H,
    STAGE,
    W,
    hookPos,
    platePos,
    poleFoot,
    type Pt,
} from './layout';
import { hoistPoint, pageAt, pagePlate, type ViewState } from './fx';
import { drawArm, drawChest, drawCoins, drawLamps } from './pit';

const S = TUNING.snurr;
const TAU = Math.PI * 2;

/** Navnet på hver kilde, skrevet på skiltet på stanga. */
export const NAVN: Record<PlateKind, string> = {
    skip: 'Skipsskatt',
    monopol: 'Monopol',
    vapen: 'Adelstittel',
};

const SERIF = "'IM Fell English', Georgia, 'Times New Roman', serif";

function ell(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
}

const dk = (slot: number) => 1 - SLOTS[slot].dybde * 0.17;

interface PlateLook {
    spin: number;
    vinkel: number;
    t: number;
    tinn?: boolean;
    protest?: number;
    reddet?: number;
    kombo?: number;
    alpha?: number;
}

/** En dreid tallerken i bladgull (eller matt tinn) med preget ikon og glans som roterer. */
export function drawPlate(ctx: CanvasRenderingContext2D, art: Art, x: number, y: number, k: number, kind: PlateKind | null, o: PlateLook) {
    const rx = 50 * k;
    const vakl = !o.tinn && o.spin < S.vakle ? Math.min(1, (S.vakle - o.spin) / S.vakle) : 0;
    const w = o.t * (5 + vakl * 10);
    const tilt = Math.sin(w) * vakl * 0.2;
    let ry = rx * 0.4 * (1 + Math.sin(w * 1.3) * vakl * 0.3);
    const shakeX = o.protest ? Math.sin(o.t * 46) * 3 * k : 0;
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    ctx.translate(x + shakeX, y + Math.abs(Math.sin(w)) * vakl * 4 * k);
    ctx.rotate(tilt);
    ry = Math.max(rx * 0.15, ry);
    // Skygge under fatet.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ell(ctx, 2 * k, ry * 0.5 + 3 * k, rx * 0.95, ry * 0.8);
    ctx.fill();
    // Fatet: forgylt (eller tinn) med lys fra rampen nedenfra.
    const g = ctx.createLinearGradient(0, -ry, 0, ry);
    if (o.tinn) {
        g.addColorStop(0, '#c9d0d2');
        g.addColorStop(0.5, PAL.tinn);
        g.addColorStop(1, PAL.tinnMork);
    } else {
        g.addColorStop(0, PAL.gullMork);
        g.addColorStop(0.45, PAL.gull);
        g.addColorStop(1, PAL.gullLys);
    }
    ctx.fillStyle = g;
    ell(ctx, 0, 0, rx, ry);
    ctx.fill();
    ctx.lineWidth = 2 * k;
    ctx.strokeStyle = o.tinn ? '#4a5254' : '#6b4a14';
    ctx.stroke();
    // Brettekanten og speilet i midten.
    ctx.fillStyle = o.tinn ? 'rgba(60,66,70,0.35)' : 'rgba(110,72,18,0.35)';
    ell(ctx, 0, ry * 0.08, rx * 0.66, ry * 0.62);
    ctx.fill();
    // Det pregede ikonet (litt sammenpresset, så det leses fra stolen i salen).
    if (kind) {
        const sz = 42 * k;
        ctx.save();
        ctx.scale(1, Math.min(1, (ry / rx) * 1.55));
        ctx.globalAlpha *= o.tinn ? 0.45 : 1;
        ctx.drawImage(art.icons[kind], -sz / 2, -sz / 2 + 1, sz, sz);
        ctx.restore();
    }
    if (!o.tinn) {
        // Glansen pisker rundt kanten med snurret: rask glans = godt snurr.
        const sp = Math.max(0, o.spin);
        const trail = sp > 0.6 ? 3 : sp > 0.3 ? 2 : 1;
        ctx.lineCap = 'round';
        for (let i = 0; i < trail; i++) {
            const a = o.vinkel - i * 0.32;
            ctx.strokeStyle = `rgba(255,248,225,${0.85 - i * 0.28})`;
            ctx.lineWidth = (3.2 - i * 0.7) * k;
            ctx.beginPath();
            ctx.ellipse(0, 0, rx * 0.93, ry * 0.9, 0, a, a + 0.55);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(0, 0, rx * 0.93, ry * 0.9, 0, a + Math.PI, a + Math.PI + 0.3);
            ctx.stroke();
        }
        // Overspinn: hvitglødende kant. Slakk: rødskjær.
        if (o.spin >= S.overspinn) {
            const p = 0.55 + Math.sin(o.t * 22) * 0.25;
            ctx.strokeStyle = `rgba(255,250,235,${p})`;
            ctx.lineWidth = 4 * k;
            ell(ctx, 0, 0, rx + 2 * k, ry + 1.5 * k);
            ctx.stroke();
        }
        const rod = o.protest ? 0.55 : o.spin < S.slakk ? 0.45 : vakl * 0.3;
        if (rod > 0) {
            ctx.fillStyle = `rgba(142,34,48,${rod})`;
            ell(ctx, 0, 0, rx, ry);
            ctx.fill();
        }
        if (o.kombo && o.kombo > 1) {
            ctx.strokeStyle = 'rgba(240,213,138,0.8)';
            ctx.lineWidth = 1.5 * k;
            ell(ctx, 0, 0, rx + 6 * k, ry + 4 * k);
            ctx.stroke();
        }
    }
    ctx.restore();
    // Reddet i siste liten: en lys bølge som vokser ut fra tallerkenen.
    if (o.reddet && o.reddet > 0) {
        const u = 1 - o.reddet / 0.8;
        ctx.strokeStyle = `rgba(255,248,225,${(1 - u) * 0.9})`;
        ctx.lineWidth = 3 * k;
        ell(ctx, x, y, rx * (1 + u * 0.8), rx * 0.4 * (1 + u * 0.8));
        ctx.stroke();
    }
}

/** En høy, slank forgylt lysestake (torchère). `h` er høyden fra foten til koppen. */
function drawPole(ctx: CanvasRenderingContext2D, foot: Pt, h: number, k: number, tinn = false) {
    const top = foot.y - h;
    const g = ctx.createLinearGradient(foot.x - 5 * k, 0, foot.x + 5 * k, 0);
    if (tinn) {
        g.addColorStop(0, PAL.tinnMork);
        g.addColorStop(0.4, '#c9d0d2');
        g.addColorStop(1, PAL.tinnMork);
    } else {
        g.addColorStop(0, PAL.gullMork);
        g.addColorStop(0.4, PAL.gullLys);
        g.addColorStop(1, PAL.gullMork);
    }
    ctx.fillStyle = g;
    // Tre føtter.
    ctx.beginPath();
    ctx.moveTo(foot.x - 16 * k, foot.y);
    ctx.quadraticCurveTo(foot.x - 4 * k, foot.y - 6 * k, foot.x - 3 * k, foot.y - 18 * k);
    ctx.lineTo(foot.x + 3 * k, foot.y - 18 * k);
    ctx.quadraticCurveTo(foot.x + 4 * k, foot.y - 6 * k, foot.x + 16 * k, foot.y);
    ctx.closePath();
    ctx.fill();
    // Skaftet med to knopper.
    ctx.fillRect(foot.x - 2.2 * k, top + 6 * k, 4.4 * k, h - 20 * k);
    for (const u of [0.35, 0.7]) {
        ell(ctx, foot.x, top + h * u, 5 * k, 3.5 * k);
        ctx.fill();
    }
    // Koppen under tallerkenen.
    ctx.beginPath();
    ctx.moveTo(foot.x - 9 * k, top);
    ctx.lineTo(foot.x + 9 * k, top);
    ctx.lineTo(foot.x + 2 * k, top + 9 * k);
    ctx.lineTo(foot.x - 2 * k, top + 9 * k);
    ctx.closePath();
    ctx.fill();
}

/** Et lite skilt på stanga med navnet på kilden. */
function plaque(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, fill = '#1a130b', ink = '#f3e6c4') {
    ctx.font = `600 11px ${SERIF}`;
    const w = ctx.measureText(text).width + 10;
    ctx.fillStyle = fill;
    ctx.strokeStyle = PAL.gull;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 8, w, 15, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
}

const poleH = (slot: number) => poleFoot(slot).y - platePos(slot).y;

function cloudPuffs(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, dark: boolean, t: number) {
    const n = 7;
    for (let pass = 0; pass < 2; pass++) {
        ctx.fillStyle = pass ? (dark ? '#3a4a66' : '#efe3c7') : dark ? '#141c2e' : '#7b8fb4';
        for (let i = 0; i < n; i++) {
            const u = i / (n - 1) - 0.5;
            const r = w * (0.16 + 0.08 * Math.sin(i * 2.3)) * (pass ? 0.65 : 1);
            ctx.beginPath();
            ctx.arc(x + u * w + Math.sin(t * 0.6 + i) * 2, y - Math.cos(u * 3) * w * 0.12 - (pass ? r * 0.35 : 0), r, 0, TAU);
            ctx.fill();
        }
    }
}

function drawStorm(ctx: CanvasRenderingContext2D, art: Art, v: ViewState) {
    // Stormkulissene glir inn over bakteppet (bak kulissene og stengene).
    const { x0, x1, y0, floorBack } = STAGE;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, y0, x1 - x0, floorBack - y0);
    ctx.clip();
    for (const side of [-1, 1] as const) {
        const u = side < 0 ? v.stormL : v.stormR;
        if (u < 0.01) continue;
        const e = u * u * (3 - 2 * u);
        const drift = Math.sin(v.tid * 0.4 + side) * 6;
        ctx.save();
        if (side < 0) ctx.translate(x0 - 360 + e * 360 + drift, y0);
        else {
            ctx.translate(x1 + 360 - e * 360 + drift, y0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(art.storm, 0, 0, 360, floorBack - y0);
        ctx.restore();
    }
    if (v.lyn > 0.05 && v.stormL > 0.5) {
        // Lynet fra venstre kulisse.
        ctx.strokeStyle = `rgba(225,235,255,${v.lyn})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        let x = x0 + 150;
        let y = y0 + 40;
        ctx.moveTo(x, y);
        for (let i = 0; i < 6; i++) {
            x += 14 + ((i * 37) % 23) - 8;
            y += 34;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    ctx.restore();
}

function drawHooks(ctx: CanvasRenderingContext2D, art: Art, g: Game, v: ViewState) {
    for (let i = 0; i < TUNING.parlament.kroker; i++) {
        const hp = hookPos(i);
        ctx.strokeStyle = 'rgba(120,128,132,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hp.x, STAGE.y0);
        ctx.lineTo(hp.x, hp.y);
        ctx.stroke();
        ctx.strokeStyle = PAL.tinn;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hp.x, hp.y + 4, 4, -Math.PI / 2, Math.PI * 0.9);
        ctx.stroke();
    }
    // Stenger parlamentet har tatt: heises opp og henger som matt tinn i loftet.
    for (const h of v.hoists) {
        const { base, e } = hoistPoint(h);
        const k0 = dk(h.slot);
        const k = k0 + (0.42 - k0) * e;
        const hh = poleH(h.slot) * (k / k0);
        const hp = hookPos(h.hook);
        const topY = base.y - hh;
        // Tauet og tinnhånda som har tak i stanga.
        ctx.strokeStyle = 'rgba(170,178,182,0.9)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(hp.x, hp.y);
        ctx.lineTo(base.x, topY - 10 * k);
        ctx.stroke();
        drawPole(ctx, base, hh, k, e > 0.6);
        drawPlate(ctx, art, base.x, topY, k, h.kind, { spin: 0.6, vinkel: 0, t: v.tid, tinn: e > 0.6 });
        if (h.t < 1) {
            ctx.fillStyle = PAL.tinn;
            ctx.beginPath();
            ctx.arc(base.x, topY - 10 * k, 6 * k + 2, 0, TAU);
            ctx.fill();
            ctx.fillStyle = PAL.tinnMork;
            ctx.fillRect(base.x - 5 * k, topY - 8 * k, 10 * k, 3 * k);
        }
    }
    void g;
}

function drawTin(ctx: CanvasRenderingContext2D, art: Art, g: Game, v: ViewState) {
    const t = v.tid;
    const nede = g.tin.state === 'nede';
    const oser = g.tin.state === 'oser';
    const p = v.tin;
    if (!oser) {
        // Skymaskinen: tau opp i loftet og en malt sky som bærer tinntallerkenen.
        ctx.strokeStyle = 'rgba(150,158,162,0.8)';
        ctx.lineWidth = 1.2;
        for (const dx of [-40, 40]) {
            ctx.beginPath();
            ctx.moveTo(p.x + dx, 0);
            ctx.lineTo(p.x + dx, p.y + 10);
            ctx.stroke();
        }
        cloudPuffs(ctx, p.x, p.y + 22, 130, false, t);
    } else {
        // Øser foran rampen: snurrer av seg selv på sin egen tinnstake.
        drawPole(ctx, { x: p.x, y: STAGE.edge - 6 }, STAGE.edge - 6 - p.y, 0.9, true);
    }
    if (v.tinDrag) {
        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = 'rgba(200,208,210,0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(v.tinDrag.x, v.tinDrag.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    const at = v.tinDrag ?? p;
    const k = 1.15;
    // Tinntallerkenen: bredere, glatt, uten forgylling.
    ctx.save();
    ctx.translate(at.x, at.y);
    const rx = 50 * k;
    const ry = rx * 0.38;
    const gr = ctx.createLinearGradient(0, -ry, 0, ry);
    gr.addColorStop(0, '#dfe4e5');
    gr.addColorStop(0.5, PAL.tinn);
    gr.addColorStop(1, PAL.tinnMork);
    ctx.fillStyle = gr;
    ell(ctx, 0, 0, rx, ry);
    ctx.fill();
    ctx.strokeStyle = '#3e4648';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(70,78,82,0.3)';
    ell(ctx, 0, 2, rx * 0.7, ry * 0.6);
    ctx.fill();
    const a = oser ? t * 14 : t * 0.4;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.92, ry * 0.88, 0, a, a + 0.5);
    ctx.stroke();
    ctx.restore();
    if (!oser && !v.tinDrag) {
        // Skilt under skyen: hva den grå tallerkenen er, også mens den venter i taket.
        // Låst til skottene kommer (1639), slik Karl måtte. Så står prisen på skiltet.
        const last = aarNa(g) < TUNING.parlament.fra;
        plaque(ctx, p.x, p.y + (nede ? 68 : 46), last ? 'Parlamentet: låst til 1639' : 'Parlamentet: +gull / -1 stang', '#2b3133', '#f3e6c4');
    }
    if (nede && !v.tinDrag) {
        // I rekkevidde: en bølge som vokser ut fra tallerkenen og blekner (står stille).
        const u = (t * 0.9) % 1;
        ctx.strokeStyle = `rgba(230,236,238,${(1 - u) * 0.8})`;
        ctx.lineWidth = 2.5;
        ell(ctx, p.x, p.y, rx * (1 + u * 0.5), ry * (1 + u * 0.9));
        ctx.stroke();
        ctx.font = `700 15px ${SERIF}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#10141f';
        ctx.fillText(`+${g.tin.gull} gull`, p.x + 1, p.y + 47);
        ctx.fillStyle = '#f3e6c4';
        ctx.fillText(`+${g.tin.gull} gull`, p.x, p.y + 46);
    }
    void art;
}

function drawPage(ctx: CanvasRenderingContext2D, art: Art, g: Game, v: ViewState) {
    const pg = v.page;
    if (!pg) return;
    const at = pageAt(pg);
    const k = dk(pg.slot);
    const walk = pg.u < 1 && !(!pg.leaving && pg.u >= 1) ? Math.sin(v.tid * 12) : 0;
    const x = at.x;
    const feet = poleFoot(pg.slot).y;
    const s = 1.15 * k;
    ctx.save();
    ctx.translate(x, feet);
    // En mørk silhuett uten ansikt: page i dublett med armene over hodet.
    ctx.fillStyle = '#0b0e17';
    ctx.strokeStyle = 'rgba(110,140,190,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-5 * s, 0);
    ctx.lineTo(-3 * s + walk * 4 * s, -30 * s);
    ctx.lineTo(3 * s - walk * 4 * s, -30 * s);
    ctx.lineTo(5 * s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-12 * s, -28 * s);
    ctx.quadraticCurveTo(0, -36 * s, 12 * s, -28 * s);
    ctx.lineTo(8 * s, -62 * s);
    ctx.lineTo(-8 * s, -62 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -70 * s, 7 * s, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 3.5 * s;
    ctx.strokeStyle = '#0b0e17';
    ctx.beginPath();
    ctx.moveTo(-7 * s, -58 * s);
    ctx.lineTo(-12 * s, -84 * s);
    ctx.moveTo(7 * s, -58 * s);
    ctx.lineTo(12 * s, -84 * s);
    ctx.stroke();
    ctx.restore();
    const plateAt = v.pageDrag ?? pagePlate(pg);
    if (!v.pageDrag && pg.u >= 1 && g.page) {
        // Hint: en stille stiplet bue fra siden til stanga.
        const top = platePos(pg.slot);
        ctx.setLineDash([3, 6]);
        ctx.strokeStyle = 'rgba(240,213,138,0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(plateAt.x, plateAt.y);
        ctx.quadraticCurveTo((plateAt.x + top.x) / 2, Math.min(plateAt.y, top.y) - 40, top.x, top.y);
        ctx.stroke();
        ctx.setLineDash([]);
        if (g.page.pris > 0) plaque(ctx, plateAt.x, plateAt.y - 26, `-${g.page.pris} gull`, '#3a0d16');
    }
    drawPlate(ctx, art, plateAt.x, plateAt.y, 0.6 * (v.pageDrag ? 1.2 : k), pg.kind, { spin: 0.7, vinkel: v.tid * 2, t: v.tid });
}

function drawSparks(ctx: CanvasRenderingContext2D, v: ViewState, smokeOnly: boolean) {
    for (const p of v.sparks) {
        if (p.life < 0 || !!p.smoke !== smokeOnly) continue;
        const a = 1 - p.life / p.max;
        ctx.globalAlpha = p.smoke ? a * 0.35 : a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawFalling(ctx: CanvasRenderingContext2D, art: Art, v: ViewState) {
    for (const f of v.falling) {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        drawPlate(ctx, art, 0, 0, f.k, f.kind, { spin: 0.6, vinkel: 0, t: v.tid, alpha: Math.max(0, 1 - f.t * 0.6) });
        ctx.restore();
    }
}

function drawTrail(ctx: CanvasRenderingContext2D, v: ViewState) {
    const pts = v.spor;
    if (pts.length >= 2) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        for (let i = 1; i < pts.length; i++) {
            const a = 1 - (v.tid - pts[i].t) / 0.45;
            if (a <= 0) continue;
            ctx.strokeStyle = `rgba(240,200,110,${a * 0.85})`;
            ctx.lineWidth = 2 + a * 7;
            ctx.beginPath();
            ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
            ctx.lineTo(pts[i].x, pts[i].y);
            ctx.stroke();
        }
        ctx.restore();
    }
    // Gullstøvet som viser sveipet de første sekundene (ingen tekst).
    if (v.demo > 0.6 && v.demo < 2.4) {
        const a = platePos(0);
        const b = platePos(1);
        const u = Math.min(1, (v.demo - 0.6) / 1.2);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 14; i++) {
            const w = u - i * 0.025;
            if (w < 0) break;
            const x = a.x - 70 + (b.x - a.x + 140) * w;
            const y = a.y + 30 - Math.sin(w * Math.PI) * 50;
            ctx.fillStyle = `rgba(250,220,140,${(1 - i / 14) * (1 - Math.max(0, v.demo - 1.8) / 0.6)})`;
            ctx.beginPath();
            ctx.arc(x, y, 5 - i * 0.3, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }
}

/** Støv som svever i rampelyset: salen lever selv når ingen rører noe. */
function drawMotes(ctx: CanvasRenderingContext2D, v: ViewState) {
    const n = v.lav ? 24 : 60;
    ctx.fillStyle = 'rgba(255,230,180,0.5)';
    for (let i = 0; i < n; i++) {
        const sx = (i * 97.3) % (STAGE.x1 - STAGE.x0);
        const sp = 6 + (i % 7) * 2;
        const y = STAGE.edge - 10 - ((v.tid * sp + i * 53) % 300);
        const x = STAGE.x0 + sx + Math.sin(v.tid * 0.7 + i) * 14;
        const a = Math.min(1, (STAGE.edge - y) / 60) * (1 - (STAGE.edge - y) / 300);
        ctx.globalAlpha = Math.max(0, a) * 0.8;
        ctx.fillRect(x, y, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
}

/** Hele scenen. `ctx` er allerede skalert til den logiske flata (960x540). */
/**
 * Skottene (fra 1638): små soldater med blå luer og piker marsjerer inn fra høyre kulisse og
 * blir flere når krigen starter i 1639. Etter 1640 er det parlamentets hær i rødt.
 */
function drawSkotter(ctx: CanvasRenderingContext2D, g: Game, v: ViewState) {
    const aar = aarNa(g);
    if (aar < TUNING.hendelser.skotter) return;
    const krig = aar >= TUNING.tid.skottene;
    const haer = aar >= TUNING.tid.seier;
    const n = haer ? 8 : krig ? 7 : 4;
    // Inn fra kulissen det første året, så står de.
    const inn = Math.min(1, (aar - TUNING.hendelser.skotter) / 0.6);
    const y0 = STAGE.edge - 18;
    for (let i = 0; i < n; i++) {
        const x = STAGE.x1 - 20 - (i % 4) * 34 * inn - (i >= 4 ? 17 : 0);
        const y = y0 - (i >= 4 ? 14 : 0);
        const k = i >= 4 ? 0.82 : 1;
        const stegT = inn < 1 ? v.tid * 7 + i : 0;
        const bob = Math.abs(Math.sin(stegT)) * 2;
        ctx.save();
        ctx.translate(x, y - bob);
        ctx.scale(k, k);
        // Bein.
        ctx.strokeStyle = '#1a130b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(-3 - Math.sin(stegT) * 3, 14);
        ctx.moveTo(3, 0);
        ctx.lineTo(3 + Math.sin(stegT) * 3, 14);
        ctx.stroke();
        // Frakk og lue.
        ctx.fillStyle = haer ? '#8e2230' : '#2a3550';
        ctx.fillRect(-6, -18, 12, 19);
        ctx.fillStyle = '#e2c9a4';
        ctx.beginPath();
        ctx.arc(0, -22, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = haer ? '#3a3a3a' : PAL.ultraLys;
        ctx.beginPath();
        ctx.ellipse(0, -26, 6, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Pike.
        ctx.strokeStyle = '#6b5a3a';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-8, 8);
        ctx.lineTo(-10, -44);
        ctx.stroke();
        ctx.restore();
    }
}

export function drawGame(ctx: CanvasRenderingContext2D, g: Game, v: ViewState, art: Art) {
    const sh = v.shake;
    const sx = sh > 0 ? (Math.random() - 0.5) * sh * 14 : 0;
    const sy = sh > 0 ? (Math.random() - 0.5) * sh * 10 : 0;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.drawImage(art.back, 0, 0, W, H);
    if (v.lyn > 0.02) {
        ctx.fillStyle = `rgba(190,210,255,${v.lyn * 0.28})`;
        ctx.fillRect(STAGE.x0, STAGE.y0, STAGE.x1 - STAGE.x0, STAGE.floorBack - STAGE.y0);
    }
    // Kjølig lys ovenfra fra snorloftet.
    drawStorm(ctx, art, v);
    drawHooks(ctx, art, g, v);

    // Lemmene for stenger som ikke er tatt i bruk ennå.
    for (const s of g.slots) {
        if (s.state !== 'stengt') continue;
        const f = poleFoot(s.id);
        const k = dk(s.id);
        ctx.strokeStyle = 'rgba(15,9,4,0.7)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(f.x - 16 * k, f.y - 3 * k, 32 * k, 7 * k);
    }

    // Stengene og tallerkenene, bakerst først.
    const order = g.slots.map((s) => s.id).sort((a, b) => SLOTS[b].dybde - SLOTS[a].dybde);
    const tilbud = g.tin.state === 'nede' ? g.tin.tilbud : [];
    const pct = Math.round(100 / Math.max(1, egneStenger(g)));
    for (const id of order) {
        const s = g.slots[id];
        if (s.state === 'stengt' || s.state === 'tatt') continue;
        const k = dk(id);
        const f = poleFoot(id);
        const r = v.rise[id];
        const re = r * r * (3 - 2 * r);
        const hh = poleH(id) * re;
        drawPole(ctx, f, hh, k);
        const top = { x: f.x, y: f.y - hh };
        if (s.plate && re > 0.7) {
            drawPlate(ctx, art, top.x, top.y, k, s.plate.kind, {
                spin: s.plate.spin,
                vinkel: v.vinkel[id],
                t: v.tid + id,
                // Hampden-tallerkenen er rød til den er sveipet to ganger.
                protest: s.plate.hampden > 0 ? Math.max(1, v.protest[id]) : v.protest[id],
                reddet: v.reddet[id],
                kombo: s.plate.kombo,
            });
            plaque(ctx, f.x, f.y - hh * 0.42, NAVN[s.plate.kind]);
        }
        if (tilbud.includes(id)) {
            // Parlamentet vil ha denne: tinnfarget bølge og prisen.
            const u = (v.tid * 0.9 + id * 0.2) % 1;
            ctx.strokeStyle = `rgba(220,228,230,${(1 - u) * 0.85})`;
            ctx.lineWidth = 2.5;
            ell(ctx, top.x, top.y, 50 * k * (1 + u * 0.4), 20 * k * (1 + u * 0.7));
            ctx.stroke();
            const n = tilbud.indexOf(id) + 1;
            plaque(ctx, top.x, top.y - 30 * k, `[${n}] -1 stang = -${pct} % poeng`, '#2b3133', '#f3e6c4');
        }
    }
    drawMotes(ctx, v);
    drawSkotter(ctx, g, v);
    drawPage(ctx, art, g, v);
    drawFalling(ctx, art, v);
    drawTin(ctx, art, g, v);

    // Teppet (klippet til åpningen).
    if (v.teppe > 0.003) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(STAGE.x0, 0, STAGE.x1 - STAGE.x0, STAGE.edge + 4);
        ctx.clip();
        ctx.drawImage(art.curtain, 0, -(1 - v.teppe) * H + (STAGE.edge - H + 6), W, H);
        ctx.restore();
    }

    ctx.drawImage(art.front, 0, 0, W, H);
    drawLamps(ctx, g, v);
    drawChest(ctx, g, v);
    drawArm(ctx, v);
    drawCoins(ctx, v);
    drawSparks(ctx, v, false);
    drawSparks(ctx, v, true);
    if (v.kisteVarsel > 0.02) {
        // Salen mørkner og et karmosin skjær pulserer i kantene når kista nesten er tom.
        const a = v.kisteVarsel;
        ctx.fillStyle = `rgba(6,8,14,${0.32 * a})`;
        ctx.fillRect(0, 0, W, H);
        const p = 0.5 + 0.5 * Math.sin(v.tid * 6);
        const rg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.62);
        rg.addColorStop(0, 'rgba(142,34,48,0)');
        rg.addColorStop(1, `rgba(142,34,48,${(0.35 + 0.25 * p) * a})`);
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, W, H);
        drawChest(ctx, g, v);
    }
    drawTrail(ctx, v);
    if (v.lyn > 0.02) {
        ctx.fillStyle = `rgba(200,215,255,${v.lyn * 0.08})`;
        ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
}
