// Teksturene i Stempelet, tegnet på canvas: skrivebordet, passene (guilloche, bilde, navn,
// stempelmerker), frimerkearket, husleie-regningen, kortene i papirløs-hylla og vinduslyset.
// Rene tegnefunksjoner uten React. Kunstbriefen: sikkerhetstrykk fra 1930-tallet.

import { FARGE } from './farger';
import { PERSONER } from './levels';

/** Overskrifter: geometriske versaler (art deco). Brødtekst: serif. */
export const SKRIFT_DECO = 'Outfit, "Century Gothic", Futura, sans-serif';
export const SKRIFT_SERIF = 'Georgia, "Times New Roman", serif';
export const SKRIFT_MASKIN = '"Courier New", Courier, monospace';

/** Liten deterministisk tilfeldighet (samme pass = samme tegning). */
export function hash(n: number): () => number {
    let s = (n * 2654435761) >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Fint papirkorn: små prikker i en litt mørkere tone. */
function korn(ctx: CanvasRenderingContext2D, w: number, h: number, farge: string, n: number, seed: number) {
    const r = hash(seed);
    ctx.fillStyle = farge;
    for (let i = 0; i < n; i++) ctx.fillRect(r() * w, r() * h, 0.7, 0.7);
}

/** Guilloche: tette bølgelinjer i én farge, som på verdipapirer. */
function guillocheBånd(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    farge: string,
    linjer = 6
) {
    ctx.save();
    ctx.strokeStyle = farge;
    ctx.lineWidth = 0.5;
    const vannrett = x1 - x0 > y1 - y0;
    const lengde = vannrett ? x1 - x0 : y1 - y0;
    const bredde = vannrett ? y1 - y0 : x1 - x0;
    for (let k = 0; k < linjer; k++) {
        ctx.beginPath();
        for (let i = 0; i <= lengde; i += 1) {
            const fase = (k / linjer) * Math.PI * 2;
            const a = Math.sin(i * 0.32 + fase) * 0.5 + Math.sin(i * 0.11 - fase * 0.5) * 0.5;
            const u = bredde / 2 + a * (bredde / 2 - 0.6);
            const px = vannrett ? x0 + i : x0 + u;
            const py = vannrett ? y0 + u : y0 + i;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
    }
    ctx.restore();
}

/** En rosett: guilloche i en sirkel (bakgrunn i passet og på frimerket). */
function rosett(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, farge: string) {
    ctx.save();
    ctx.strokeStyle = farge;
    ctx.lineWidth = 0.45;
    for (let k = 0; k < 14; k++) {
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
            const t = (i / 120) * Math.PI * 2;
            const rr = r * (0.62 + 0.38 * Math.abs(Math.sin(t * 6 + k * 0.45)));
            const px = cx + Math.cos(t + k * 0.22) * rr;
            const py = cy + Math.sin(t + k * 0.22) * rr;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
    }
    ctx.restore();
}

/** Skrivebordet: mørkt valnøtt rundt et skogsgrønt skinnunderlag med gullinje. */
export function tegnBord(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#3a2516';
    ctx.fillRect(0, 0, w, h);
    // Treverk: lange årer.
    const r = hash(7);
    for (let i = 0; i < 260; i++) {
        const y = r() * h;
        ctx.strokeStyle = `rgba(${r() < 0.5 ? '70,50,36' : '24,16,11'},${0.25 + r() * 0.3})`;
        ctx.lineWidth = 0.6 + r() * 1.4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.01 + i) * 3);
        ctx.stroke();
    }
    // Skinnunderlaget.
    const m = { x: w * 0.045, y: h * 0.07, w: w * 0.91, h: h * 0.8 };
    ctx.fillStyle = FARGE.bord;
    ctx.fillRect(m.x, m.y, m.w, m.h);
    const g = ctx.createRadialGradient(w * 0.45, h * 0.45, 40, w * 0.5, h * 0.5, w * 0.6);
    g.addColorStop(0, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = g;
    ctx.fillRect(m.x, m.y, m.w, m.h);
    korn(ctx, w, h, 'rgba(8,26,18,0.5)', 9000, 3);
    korn(ctx, w, h, 'rgba(80,110,96,0.18)', 5000, 5);
    // Slitte kanter og preget gullinje.
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 6;
    ctx.strokeRect(m.x + 3, m.y + 3, m.w - 6, m.h - 6);
    ctx.strokeStyle = 'rgba(196,160,88,0.55)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(m.x + 14, m.y + 14, m.w - 28, m.h - 28);
    ctx.lineWidth = 0.7;
    ctx.strokeRect(m.x + 19, m.y + 19, m.w - 38, m.h - 38);
}

/** Bildet i passet: et ovalt fotografi i gråtoner med en rolig silhuett. */
function portrett(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, person: number) {
    const p = PERSONER[person];
    const r = hash(person + 11);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.clip();
    const bg = ctx.createLinearGradient(x, y, x + w, y + h);
    const lys = 190 + Math.floor(r() * 30);
    bg.addColorStop(0, `rgb(${lys},${lys - 4},${lys - 12})`);
    bg.addColorStop(1, `rgb(${lys - 70},${lys - 72},${lys - 76})`);
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    const cx = x + w / 2 + (r() - 0.5) * 3;
    const hud = 60 + Math.floor(r() * 40);
    const tone = `rgb(${hud + 40},${hud + 36},${hud + 30})`;
    const mørk = `rgb(${hud - 30},${hud - 32},${hud - 34})`;
    // Skuldrer og frakk.
    ctx.fillStyle = mørk;
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 1.02, w * 0.5, h * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
    // Krage.
    ctx.fillStyle = `rgb(${lys - 20},${lys - 22},${lys - 26})`;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.12, y + h * 0.7);
    ctx.lineTo(cx, y + h * 0.84);
    ctx.lineTo(cx + w * 0.12, y + h * 0.7);
    ctx.fill();
    // Hals og hode.
    ctx.fillStyle = tone;
    ctx.fillRect(cx - w * 0.08, y + h * 0.55, w * 0.16, h * 0.16);
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.42, w * 0.2, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Hår: kort for menn, oppsatt eller skjerf for kvinner.
    ctx.fillStyle = mørk;
    if (p?.kvinne) {
        if (r() < 0.4) {
            ctx.beginPath();
            ctx.ellipse(cx, y + h * 0.4, w * 0.27, h * 0.27, 0, Math.PI, Math.PI * 2);
            ctx.lineTo(cx + w * 0.27, y + h * 0.62);
            ctx.lineTo(cx - w * 0.27, y + h * 0.62);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(cx, y + h * 0.36, w * 0.23, h * 0.18, 0, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + w * 0.16, y + h * 0.3, w * 0.09, h * 0.08, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        ctx.beginPath();
        ctx.ellipse(cx, y + h * 0.34, w * 0.21, h * 0.12, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        if (r() < 0.4) {
            // Bart.
            ctx.fillRect(cx - w * 0.06, y + h * 0.49, w * 0.12, h * 0.025);
        }
    }
    // Lys fra venstre.
    const sk = ctx.createLinearGradient(x, y, x + w, y);
    sk.addColorStop(0, 'rgba(255,255,255,0.12)');
    sk.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = sk;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    ctx.strokeStyle = 'rgba(21,23,26,0.6)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
}

/** Stempelmerket: en rund rosett med tekst i ringen. Skjevt slag = utvisket, halvt merke. */
function merke(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    år: number,
    fullt: boolean,
    rot: number,
    friskt: boolean
) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    const farge = friskt ? 'rgba(232,120,40,0.92)' : 'rgba(224,122,46,0.78)';
    const tegn = () => {
        ctx.strokeStyle = farge;
        ctx.fillStyle = farge;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.66, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = `700 ${r * 0.27}px ${SKRIFT_DECO}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const tekst = `NANSEN · GENÈVE · ${år} · `;
        for (let i = 0; i < tekst.length; i++) {
            const a = (i / tekst.length) * Math.PI * 2;
            ctx.save();
            ctx.rotate(a);
            ctx.translate(0, -r * 0.83);
            ctx.fillText(tekst[i], 0, 0);
            ctx.restore();
        }
        ctx.font = `800 ${r * 0.42}px ${SKRIFT_DECO}`;
        ctx.fillText(String(år), 0, 0);
    };
    if (fullt) tegn();
    else {
        // Halvt og utvisket: bare den ene halvdelen, og en skygge ved siden av.
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.rect(-r * 1.2, -r * 1.2, r * 2.4, r * 1.35);
        ctx.clip();
        tegn();
        ctx.translate(r * 0.12, r * 0.06);
        ctx.globalAlpha = 0.25;
        tegn();
    }
    ctx.restore();
}

let grunn: { c: HTMLCanvasElement; skala: number } | null = null;

/** Den felles grunnen i passet, i samme pikseltetthet som lerretet det skal tegnes på. */
function passGrunn(w: number, h: number, skala: number): HTMLCanvasElement {
    if (grunn && grunn.skala === skala) return grunn.c;
    const c = document.createElement('canvas');
    c.width = Math.round(w * skala);
    c.height = Math.round(h * skala);
    const ctx = c.getContext('2d')!;
    ctx.setTransform(skala, 0, 0, skala, 0, 0);
    ctx.fillStyle = FARGE.papir;
    ctx.fillRect(0, 0, w, h);
    korn(ctx, w, h, 'rgba(120,110,90,0.18)', 900, 1);
    rosett(ctx, w * 0.62, h * 0.47, h * 0.36, 'rgba(63,143,107,0.22)');
    const gr = FARGE.grønn;
    guillocheBånd(ctx, 6, 5, w - 6, 14, gr);
    guillocheBånd(ctx, 6, h - 40, w - 6, h - 31, gr);
    guillocheBånd(ctx, 5, 14, 13, h - 40, gr, 4);
    guillocheBånd(ctx, w - 13, 14, w - 5, h - 40, gr, 4);
    ctx.strokeStyle = gr;
    ctx.lineWidth = 1;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.fillStyle = gr;
    ctx.font = `700 10px ${SKRIFT_DECO}`;
    ctx.fillText("CERTIFICAT D'IDENTITÉ · NANSEN", 20, 28);
    grunn = { c, skala };
    return c;
}

export interface PassTegning {
    person: number;
    merker: boolean[];
    /** Årstall for hvert merke. */
    merkeÅr: number[];
    grå: boolean;
    id: number;
}

/** Passet: guilloche-ramme, bilde, navn, gebyrfelt og stempelmerkene. Logisk 300 x 212. */
export function tegnPass(ctx: CanvasRenderingContext2D, w: number, h: number, d: PassTegning) {
    const p = PERSONER[d.person];
    const gr = FARGE.grønn;
    // Grunnen (papir, rosett, guilloche-ramme) er lik for alle pass og tegnes bare én gang.
    const skala = ctx.getTransform().a;
    ctx.drawImage(passGrunn(w, h, skala), 0, 0, w, h);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    // Bildet.
    portrett(ctx, 20, 38, 68, 88, d.person);
    // Navn og land.
    ctx.fillStyle = FARGE.tekst;
    const navn = p?.navn ?? '';
    const str = navn.length > 7 ? 27 : 32;
    ctx.font = `700 ${str}px ${SKRIFT_DECO}`;
    ctx.fillText(navn, 98, 72);
    ctx.font = `600 13px ${SKRIFT_DECO}`;
    ctx.fillStyle = '#3c4440';
    ctx.fillText(`FRA ${p?.fra ?? ''}`, 99, 92);
    ctx.font = `400 11px ${SKRIFT_SERIF}`;
    ctx.fillText('uten statsborgerskap', 99, 108);
    // Gebyrfeltet der lomma ligger (mynt eller tomt).
    ctx.setLineDash([3, 2]);
    ctx.strokeStyle = 'rgba(21,23,26,0.45)';
    ctx.beginPath();
    ctx.arc(w * 0.82, h * 0.36, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = `700 9px ${SKRIFT_DECO}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(21,23,26,0.55)';
    ctx.fillText('GEBYR', w * 0.82, h * 0.36 + 38);
    // Feltet for båndet.
    ctx.textAlign = 'left';
    ctx.font = `700 9px ${SKRIFT_DECO}`;
    ctx.fillStyle = gr;
    ctx.fillText('GYLDIG TIL', 18, h - 16);
    // Stempelmerkene, de siste fire.
    const fra = Math.max(0, d.merker.length - 4);
    for (let i = fra; i < d.merker.length; i++) {
        const r = hash(d.id * 31 + i);
        merke(
            ctx,
            110 + r() * 110,
            118 + r() * 34,
            30,
            d.merkeÅr[i] ?? 1931,
            d.merker[i],
            (r() - 0.5) * 0.9,
            i === d.merker.length - 1
        );
    }
    if (d.grå) {
        ctx.fillStyle = 'rgba(70,72,72,0.45)';
        ctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w * 0.55, h * 0.5);
        ctx.rotate(-0.18);
        ctx.strokeStyle = 'rgba(120,24,22,0.85)';
        ctx.lineWidth = 3;
        ctx.strokeRect(-78, -20, 156, 40);
        ctx.fillStyle = 'rgba(120,24,22,0.9)';
        ctx.font = `800 26px ${SKRIFT_DECO}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('UTLØPT', 0, 1);
        ctx.restore();
    }
}

/** Frimerkearket: tolv Nansen-frimerker med takker. Logisk 256 x 190. */
export function tegnArk(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#f3efe4';
    ctx.fillRect(0, 0, w, h);
    const kol = 4;
    const rad = 3;
    const mw = (w - 16) / kol;
    const mh = (h - 16) / rad;
    for (let i = 0; i < kol * rad; i++) {
        const x = 8 + (i % kol) * mw;
        const y = 8 + Math.floor(i / kol) * mh;
        ctx.fillStyle = '#7a2c2a';
        ctx.fillRect(x + 4, y + 4, mw - 8, mh - 8);
        ctx.fillStyle = '#f3efe4';
        // Takkene.
        for (let k = 0; k < 7; k++) {
            ctx.beginPath();
            ctx.arc(x + 4 + (k * (mw - 8)) / 6, y + 4, 1.6, 0, Math.PI * 2);
            ctx.arc(x + 4 + (k * (mw - 8)) / 6, y + mh - 4, 1.6, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#e8d9b8';
        ctx.beginPath();
        ctx.ellipse(x + mw / 2, y + mh * 0.46, mw * 0.22, mh * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7a2c2a';
        ctx.beginPath();
        ctx.ellipse(x + mw / 2, y + mh * 0.42, mw * 0.08, mh * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + mw / 2, y + mh * 0.62, mw * 0.15, mh * 0.08, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f3efe4';
        ctx.font = `700 7px ${SKRIFT_DECO}`;
        ctx.textAlign = 'center';
        ctx.fillText('NORGE', x + mw / 2, y + mh - 9);
    }
}

/** Husleie-regningen: rødt hode, årstall og hull for myntene. Logisk 240 x 170. */
export function tegnRegning(ctx: CanvasRenderingContext2D, w: number, h: number, år: number) {
    ctx.fillStyle = FARGE.papir;
    ctx.fillRect(0, 0, w, h);
    korn(ctx, w, h, 'rgba(120,110,90,0.2)', 400, år);
    ctx.fillStyle = FARGE.rød;
    ctx.fillRect(0, 0, w, 30);
    ctx.fillStyle = FARGE.papir;
    ctx.font = `700 17px ${SKRIFT_DECO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`HUSLEIE ${år}`, w / 2, 16);
    ctx.fillStyle = FARGE.tekst;
    ctx.font = `400 11px ${SKRIFT_MASKIN}`;
    ctx.fillText('Betales 31. desember', w / 2, h - 12);
}

/** Et kort i papirløs-hylla: navn og året personen mistet papirene. Logisk 128 x 96. */
export function tegnHylleKort(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    person: number,
    år: number
) {
    ctx.fillStyle = '#b9b9b4';
    ctx.fillRect(0, 0, w, h);
    portrett(ctx, 8, 10, 40, 52, person);
    ctx.fillStyle = FARGE.tekst;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const navn = PERSONER[person]?.navn ?? '';
    ctx.font = `700 ${navn.length > 6 ? 13 : 16}px ${SKRIFT_DECO}`;
    ctx.fillText(navn, 53, 32);
    ctx.font = `700 15px ${SKRIFT_MASKIN}`;
    ctx.fillText(String(år), 53, 52);
    ctx.fillStyle = 'rgba(120,24,22,0.9)';
    ctx.font = `700 11px ${SKRIFT_DECO}`;
    ctx.fillText('UTEN PAPIRER', 8, h - 12);
}

/** Vinduslyset: tolv ruter med sprosser imellom, myke kanter. Hvitt på gjennomsiktig. */
export function tegnVindu(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.clearRect(0, 0, w, h);
    const kol = 3;
    const rad = 4;
    const sp = 9;
    const rw = (w - sp * (kol + 1)) / kol;
    const rh = (h - sp * (rad + 1)) / rad;
    ctx.filter = 'blur(5px)';
    ctx.fillStyle = 'rgba(255,255,255,1)';
    for (let i = 0; i < kol; i++)
        for (let j = 0; j < rad; j++)
            ctx.fillRect(sp + i * (rw + sp), sp + j * (rh + sp), rw, rh);
    ctx.filter = 'none';
}
