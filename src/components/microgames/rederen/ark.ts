// Kartarkene: gulnet papir, kobberstukket kyst med vannlinjer, kompassrose, dybdekurver,
// stedsnavn og gradert ramme. Tegnes én gang til et offscreen-canvas per ark og oppløsning,
// og gjenbrukes hvert bilde med drawImage. Ingen gradienter her (lampelyset legges på i draw.ts).

import { KART, type Kart, type KartId } from './levels';

export const P = {
    papir: '#ece3cb',
    papirMørk: '#e1d4b2',
    land: '#d4b783',
    is: '#dfe3dc',
    blekk: '#1e2a35',
    hval: '#3a5878',
    grønn: '#5e8a58',
    rød: '#a83a26',
    rav: '#c58a2c',
    grå: '#8f8877',
};

export const SERIF = 'Georgia, "Times New Roman", serif';

/** Enkel seedet tilfeldighet, så arket ser likt ut hver gang. */
function rngFra(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function lagCanvas(w: number, h: number) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return [c, c.getContext('2d')!] as const;
}

function sti(ctx: CanvasRenderingContext2D, p: [number, number][]) {
    ctx.beginPath();
    p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
}

function papir(ctx: CanvasRenderingContext2D, k: Kart, rng: () => number) {
    ctx.fillStyle = P.papir;
    ctx.fillRect(0, 0, 960, 540);
    // Alder: eldre ark er mørkere og har flere flekker.
    ctx.fillStyle = `rgba(150,100,20,${0.05 + 0.42 * k.alder})`;
    ctx.fillRect(0, 0, 960, 540);
    // Papirfiber: korte, svake streker.
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 1400; i++) {
        const x = rng() * 960;
        const y = rng() * 540;
        const a = rng() * Math.PI;
        const l = 3 + rng() * 9;
        ctx.strokeStyle = rng() < 0.5 ? 'rgba(120,90,40,0.10)' : 'rgba(255,250,235,0.22)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
        ctx.stroke();
    }
    // Flekker: noen få runde merker i flat farge, som vann eller tran på papiret.
    const flekker = 1 + Math.round(k.alder * 3);
    for (let i = 0; i < flekker; i++) {
        const x = 80 + rng() * 800;
        const y = 60 + rng() * 400;
        const r = 18 + rng() * 40;
        for (let j = 0; j < 4; j++) {
            ctx.fillStyle = `rgba(140,100,40,${0.025 + 0.015 * k.alder})`;
            ctx.beginPath();
            ctx.ellipse(
                x + j * 2,
                y - j,
                r * (1 - j * 0.18),
                r * (0.8 - j * 0.12),
                rng(),
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        ctx.strokeStyle = `rgba(120,80,30,${0.08 + 0.06 * k.alder})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    // Brettekanter: arket har vært brettet i fire.
    for (const [x0, y0, x1, y1] of [
        [480, 0, 480, 540],
        [0, 270, 960, 270],
    ]) {
        ctx.strokeStyle = 'rgba(110,80,40,0.16)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,252,240,0.35)';
        ctx.beginPath();
        ctx.moveTo(x0 + (x0 === x1 ? 1.5 : 0), y0 + (y0 === y1 ? 1.5 : 0));
        ctx.lineTo(x1 + (x0 === x1 ? 1.5 : 0), y1 + (y0 === y1 ? 1.5 : 0));
        ctx.stroke();
    }
}

/** Kurslinjene ut fra kompassrosa, som på gamle sjøkart. */
function kurslinjer(ctx: CanvasRenderingContext2D, k: Kart) {
    ctx.strokeStyle = 'rgba(30,42,53,0.07)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(k.rose.x, k.rose.y);
        ctx.lineTo(k.rose.x + Math.cos(a) * 1300, k.rose.y + Math.sin(a) * 1300);
        ctx.stroke();
    }
}

/** Vannlinjene: tynne blekkstreker som følger kysten utover og blir svakere jo lenger ut. */
function vannlinjer(k: Kart, r: number) {
    const [c, ctx] = lagCanvas(960 * r, 540 * r);
    ctx.scale(r, r);
    ctx.lineJoin = 'round';
    const N = 6;
    for (let i = N; i >= 1; i--) {
        const d = 3 + i * 7;
        for (const l of k.land) {
            sti(ctx, l.p);
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = `rgba(30,42,53,${0.5 - i * 0.065})`;
            ctx.lineWidth = d * 2 + 0.9;
            ctx.stroke();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = d * 2 - 0.2;
            ctx.stroke();
        }
    }
    ctx.globalCompositeOperation = 'source-over';
    return c;
}

function land(ctx: CanvasRenderingContext2D, k: Kart) {
    for (const l of k.land) {
        sti(ctx, l.p);
        ctx.fillStyle = l.is ? P.is : P.land;
        ctx.fill();
        // Skravering inne på land (eller isen): fine, skrå streker.
        ctx.save();
        sti(ctx, l.p);
        ctx.clip();
        ctx.strokeStyle = l.is ? 'rgba(60,90,110,0.16)' : 'rgba(30,42,53,0.10)';
        ctx.lineWidth = 0.8;
        for (let x = -540; x < 960; x += l.is ? 9 : 6) {
            ctx.beginPath();
            ctx.moveTo(x, 540);
            ctx.lineTo(x + 540, 0);
            ctx.stroke();
        }
        // En mørkere stripe langs kysten på innsiden, som et kobberstikk.
        sti(ctx, l.p);
        ctx.strokeStyle = 'rgba(30,42,53,0.22)';
        ctx.lineWidth = 9;
        ctx.stroke();
        ctx.restore();
        sti(ctx, l.p);
        ctx.strokeStyle = P.blekk;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();
    }
}

function rose(ctx: CanvasRenderingContext2D, k: Kart) {
    const { x, y, r } = k.rose;
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.84, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        const l = i % 4 === 0 ? 0.16 : 0.08;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * r * 0.84, y + Math.sin(a) * r * 0.84);
        ctx.lineTo(x + Math.cos(a) * r * (0.84 + l), y + Math.sin(a) * r * (0.84 + l));
        ctx.stroke();
    }
    // Stjerna: åtte spisser, hver delt i en mørk og en lys halvdel.
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const lang = i % 2 === 0 ? r * 0.82 : r * 0.5;
        const b = r * 0.12;
        const tx = x + Math.cos(a) * lang;
        const ty = y + Math.sin(a) * lang;
        for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(tx, ty);
            ctx.lineTo(
                x + Math.cos(a + (side * Math.PI) / 2) * b,
                y + Math.sin(a + (side * Math.PI) / 2) * b
            );
            ctx.closePath();
            ctx.fillStyle = side < 0 ? P.blekk : P.papir;
            ctx.fill();
            ctx.stroke();
        }
    }
    ctx.fillStyle = P.blekk;
    ctx.font = `bold 14px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.fillText('N', x, y - r - 6);
}

function dybder(ctx: CanvasRenderingContext2D, k: Kart, rng: () => number) {
    ctx.strokeStyle = 'rgba(30,42,53,0.38)';
    ctx.lineWidth = 1;
    ctx.setLineDash([1.5, 4]);
    for (const d of k.dyp) {
        for (let j = 0; j < 3; j++) {
            const rr = d.r * (1 - j * 0.28);
            const fase = rng() * 6;
            ctx.beginPath();
            for (let a = 0; a <= 40; a++) {
                const v = (a / 40) * Math.PI * 2;
                const w = rr * (1 + 0.12 * Math.sin(v * 3 + fase));
                const px = d.x + Math.cos(v) * w * 1.4;
                const py = d.y + Math.sin(v) * w * 0.8;
                if (a) ctx.lineTo(px, py);
                else ctx.moveTo(px, py);
            }
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(30,42,53,0.55)';
        ctx.font = `italic 13px ${SERIF}`;
        ctx.textAlign = 'center';
        ctx.fillText(d.tall, d.x, d.y + 4);
    }
    ctx.setLineDash([]);
    // Spredte dybdetall i sjøen.
    ctx.fillStyle = 'rgba(30,42,53,0.28)';
    ctx.font = `italic 13px ${SERIF}`;
    for (let i = 0; i < 14; i++) {
        const x = 40 + rng() * 880;
        const y = 120 + rng() * 360;
        ctx.fillText(String(20 + Math.round(rng() * 18) * 10), x, y);
    }
}

function navn(ctx: CanvasRenderingContext2D, k: Kart) {
    ctx.textAlign = 'center';
    for (const n of k.navn) {
        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(n.vinkel ?? 0);
        if (n.stor) {
            ctx.font = `bold 21px ${SERIF}`;
            ctx.fillStyle = 'rgba(30,42,53,0.6)';
            ctx.fillText(n.t.split('').join(' '), 0, 0);
        } else {
            ctx.font = `italic 16px ${SERIF}`;
            ctx.fillStyle = 'rgba(30,42,53,0.75)';
            ctx.fillText(n.t, 0, 0);
        }
        ctx.restore();
    }
}

/** Gradert ramme: dobbel strek med vekselvis svarte og hvite felt. */
function ramme(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = P.blekk;
    ctx.lineWidth = 2;
    ctx.strokeRect(3, 3, 954, 534);
    ctx.lineWidth = 1;
    ctx.strokeRect(9, 9, 942, 522);
    ctx.fillStyle = P.blekk;
    for (let x = 9, i = 0; x < 951; x += 30, i++) {
        if (i % 2) continue;
        ctx.fillRect(x, 4, Math.min(30, 951 - x), 4);
        ctx.fillRect(x, 532, Math.min(30, 951 - x), 4);
    }
    for (let y = 9, i = 0; y < 531; y += 30, i++) {
        if (i % 2) continue;
        ctx.fillRect(4, y, 4, Math.min(30, 531 - y));
        ctx.fillRect(952, y, 4, Math.min(30, 531 - y));
    }
}

/** Tegner et helt kartark i oppløsningen r (piksler per logisk piksel). */
export function lagArk(id: KartId, r: number): HTMLCanvasElement {
    const k = KART[id];
    const rng = rngFra(id.length * 977 + 13);
    const [c, ctx] = lagCanvas(960 * r, 540 * r);
    ctx.scale(r, r);
    papir(ctx, k, rng);
    kurslinjer(ctx, k);
    dybder(ctx, k, rng);
    ctx.drawImage(vannlinjer(k, r), 0, 0, 960, 540);
    land(ctx, k);
    rose(ctx, k);
    navn(ctx, k);
    ramme(ctx);
    return c;
}

const cache = new Map<string, HTMLCanvasElement>();

/** Arket fra cachen (tegnes på nytt bare når oppløsningen endrer seg mye). */
export function ark(id: KartId, r: number): HTMLCanvasElement {
    const rr = Math.max(1, Math.min(2.5, Math.round(r * 4) / 4));
    const key = `${id}@${rr}`;
    let c = cache.get(key);
    if (!c) {
        if (cache.size > 6) cache.clear();
        c = lagArk(id, rr);
        cache.set(key, c);
    }
    return c;
}

/**
 * Hvalstempelet: en blåhval sett ovenfra, i stempelblått med ujevnt blekk. Hodet peker mot
 * høyre, halefinnen (to fliker) til venstre, og to små luffer på sidene. Fire varianter.
 */
const stempler: HTMLCanvasElement[] = [];
export const STEMPEL = { w: 28, h: 13 };

export function stempel(i: number): HTMLCanvasElement {
    if (!stempler.length) {
        for (let v = 0; v < 4; v++) {
            const S = 4;
            const [c, ctx] = lagCanvas(STEMPEL.w * S, STEMPEL.h * S);
            ctx.scale(S, S);
            const rng = rngFra(101 + v * 31);
            const m = STEMPEL.h / 2;
            ctx.fillStyle = P.hval;
            // Kroppen: bred over luffene, smal mot halen.
            ctx.beginPath();
            ctx.moveTo(27.4, m);
            ctx.bezierCurveTo(27.4, m - 3.4, 22, m - 3.9, 16, m - 3.5);
            ctx.bezierCurveTo(11, m - 3.0, 7.5, m - 1.4, 5.2, m - 0.7);
            ctx.lineTo(5.2, m + 0.7);
            ctx.bezierCurveTo(7.5, m + 1.4, 11, m + 3.0, 16, m + 3.5);
            ctx.bezierCurveTo(22, m + 3.9, 27.4, m + 3.4, 27.4, m);
            ctx.fill();
            // Halefinnen: to fliker.
            ctx.beginPath();
            ctx.moveTo(5.8, m);
            ctx.quadraticCurveTo(3.6, m - 5.6, 0.4, m - 5.8);
            ctx.quadraticCurveTo(2.4, m - 2.2, 2.2, m);
            ctx.quadraticCurveTo(2.4, m + 2.2, 0.4, m + 5.8);
            ctx.quadraticCurveTo(3.6, m + 5.6, 5.8, m);
            ctx.fill();
            // Luffene.
            for (const k of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(19.5, m + k * 3);
                ctx.quadraticCurveTo(16.5, m + k * 6.4, 14.2, m + k * 6.3);
                ctx.quadraticCurveTo(16, m + k * 4.2, 16.4, m + k * 3.2);
                ctx.fill();
            }
            // Blåsehullet og ryggen: lyse streker, så hvalen får form.
            ctx.globalCompositeOperation = 'destination-out';
            ctx.globalAlpha = 0.55;
            ctx.beginPath();
            ctx.ellipse(23.4, m, 0.9, 0.55, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 0.28;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(21, m);
            ctx.lineTo(8, m);
            ctx.stroke();
            // Ujevnt blekk: små hull i stempelet.
            for (let k = 0; k < 12 + v * 4; k++) {
                ctx.globalAlpha = 0.25 + rng() * 0.45;
                ctx.beginPath();
                ctx.arc(4 + rng() * 22, m - 3 + rng() * 6, 0.25 + rng() * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            stempler.push(c);
        }
    }
    return stempler[i % stempler.length];
}
