// Kartarkene: gulnet papir, kobberstukket kyst med vannlinjer, kompassrose, dybdekurver,
// stedsnavn og gradert ramme. Tegnes én gang til et offscreen-canvas per ark og oppløsning,
// og gjenbrukes hvert bilde med drawImage. Ingen gradienter her (lampelyset legges på i draw.ts).

import { KART, type Art, type Kart, type KartId } from './levels';

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
 * Hvalstempelet: én hval sett ovenfra, i stempelblekk med ujevne hull. Hodet peker mot høyre,
 * halefinnen (to fliker) mot venstre. Tre arter, tre former: blåhvalen er lang og lys med
 * bred, rund snute og flekker; finnhvalen er slank og spiss med lys høyre kjeve; seihvalen
 * er kort, butt og mørk. Tegnet i enheter der hvalen er 100 lang, og skalert når den brukes.
 */
export const HVAL = { l: 100, h: 34 };

interface Form {
    farge: string;
    /** Halve bredden på det bredeste stedet (enheter). */
    bred: number;
    /** Hvor bredest (0-100). */
    midt: number;
    /** 0 = spiss snute, 1 = bred og rund. */
    rund: number;
    /** Luffene: plass og lengde. */
    luffX: number;
    luff: number;
    /** Ryggfinne (strek) og lyse flekker. */
    finne: number;
    flekker: number;
    /** Lys høyre kjeve (finnhval). */
    kjeve: boolean;
}

const FORM: Record<Art, Form> = {
    blå: {
        farge: '#4f7396',
        bred: 7.8,
        midt: 64,
        rund: 1,
        luffX: 70,
        luff: 9,
        finne: 0.6,
        flekker: 26,
        kjeve: false,
    },
    finn: {
        farge: '#34506e',
        bred: 7.6,
        midt: 60,
        rund: 0.35,
        luffX: 70,
        luff: 9,
        finne: 1,
        flekker: 6,
        kjeve: true,
    },
    sei: {
        farge: '#26374a',
        bred: 10,
        midt: 58,
        rund: 0.25,
        luffX: 68,
        luff: 10,
        finne: 1.4,
        flekker: 4,
        kjeve: false,
    },
};

const hvaler = new Map<string, HTMLCanvasElement>();

export function hvalStempel(art: Art, v: number): HTMLCanvasElement {
    const nøkkel = `${art}${v % 3}`;
    const ferdig = hvaler.get(nøkkel);
    if (ferdig) return ferdig;
    const S = 2.2;
    const [c, ctx] = lagCanvas(HVAL.l * S, HVAL.h * S);
    ctx.scale(S, S);
    const fm = FORM[art];
    const rng = rngFra(311 + (v % 3) * 47 + art.length * 13);
    const m = HVAL.h / 2;
    const b = fm.bred;
    const nese = 99;
    ctx.fillStyle = fm.farge;
    // Kroppen: bred over luffene, smal mot halen. Snuta er rund (blåhval) eller spiss.
    const r = fm.rund;
    ctx.beginPath();
    ctx.moveTo(nese, m);
    ctx.bezierCurveTo(nese, m - b * (0.3 + 0.7 * r), nese - 10, m - b, fm.midt, m - b);
    ctx.bezierCurveTo(fm.midt - 22, m - b * 0.95, 26, m - b * 0.45, 12, m - 1.3);
    ctx.lineTo(12, m + 1.3);
    ctx.bezierCurveTo(26, m + b * 0.45, fm.midt - 22, m + b * 0.95, fm.midt, m + b);
    ctx.bezierCurveTo(nese - 10, m + b, nese, m + b * (0.3 + 0.7 * r), nese, m);
    ctx.fill();
    // Halefinnen: to brede fliker med et hakk i midten.
    ctx.beginPath();
    ctx.moveTo(15, m);
    ctx.quadraticCurveTo(9, m - 15, 1, m - 15.5);
    ctx.quadraticCurveTo(5, m - 6, 4, m - 0.6);
    ctx.lineTo(6, m);
    ctx.lineTo(4, m + 0.6);
    ctx.quadraticCurveTo(5, m + 6, 1, m + 15.5);
    ctx.quadraticCurveTo(9, m + 15, 15, m);
    ctx.fill();
    // Luffene: smale, bakoverstrøkne.
    for (const k of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(fm.luffX + 2, m + k * (b - 1));
        ctx.quadraticCurveTo(
            fm.luffX - 4,
            m + k * (b + fm.luff * 0.8),
            fm.luffX - 9,
            m + k * (b + fm.luff)
        );
        ctx.quadraticCurveTo(fm.luffX - 5, m + k * (b + 1), fm.luffX - 4, m + k * (b - 1.5));
        ctx.fill();
    }
    // Lyst: blåsehull, ryggstrek, ryggfinne, flekker og (finnhval) lys høyre kjeve.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 0.7;
    for (const k of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(nese - 17, m + k * 0.9, 1.4, 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(nese - 22, m);
    ctx.lineTo(18, m);
    ctx.stroke();
    if (fm.kjeve) {
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.ellipse(nese - 8, m + b * 0.55, 8, b * 0.32, -0.08, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 0.4;
    for (let k = 0; k < fm.flekker; k++) {
        ctx.beginPath();
        const x = 22 + rng() * 64;
        ctx.ellipse(
            x,
            m - b * 0.7 + rng() * b * 1.4,
            0.6 + rng() * 1.6,
            0.4 + rng() * 0.8,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    // Ujevnt blekk: små hull i stempelet.
    for (let k = 0; k < 30; k++) {
        ctx.globalAlpha = 0.2 + rng() * 0.4;
        ctx.beginPath();
        ctx.arc(4 + rng() * 92, m - 6 + rng() * 12, 0.3 + rng() * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    // Ryggfinnen: en liten mørk strek langt bak (seihvalen har den størst).
    ctx.strokeStyle = '#162230';
    ctx.lineWidth = 1.1 * fm.finne;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(34, m);
    ctx.lineTo(34 - 5 * fm.finne, m);
    ctx.stroke();
    hvaler.set(nøkkel, c);
    return c;
}

/** Tegn en hval med midten i (x, y), retning `vri` og lengde `l` (px). */
export function tegnHvalStempel(
    ctx: CanvasRenderingContext2D,
    art: Art,
    v: number,
    x: number,
    y: number,
    vri: number,
    l: number
) {
    const h = (l * HVAL.h) / HVAL.l;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(vri);
    ctx.drawImage(hvalStempel(art, v), -l / 2, -h / 2, l, h);
    ctx.restore();
}

const silhuetter = new Map<string, HTMLCanvasElement>();

/** Hvalstempelet farget helt i én farge (til kanten rundt hvalen). */
function silhuett(art: Art, v: number, farge: string): HTMLCanvasElement {
    const nøkkel = `${art}${v % 3}${farge}`;
    const ferdig = silhuetter.get(nøkkel);
    if (ferdig) return ferdig;
    const src = hvalStempel(art, v);
    const c = document.createElement('canvas');
    c.width = src.width;
    c.height = src.height;
    const ctx = c.getContext('2d');
    if (ctx) {
        ctx.drawImage(src, 0, 0);
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = farge;
        ctx.fillRect(0, 0, c.width, c.height);
    }
    silhuetter.set(nøkkel, c);
    return c;
}

/**
 * Hvalen med en farget kant rundt seg: grønn når flokken vokser, rød når den krymper.
 * Kanten er hvalens egen form, tegnet litt forskjøvet i åtte retninger under stempelet.
 */
export function tegnHvalKant(
    ctx: CanvasRenderingContext2D,
    art: Art,
    v: number,
    x: number,
    y: number,
    vri: number,
    l: number,
    farge: string,
    tykk: number
) {
    const h = (l * HVAL.h) / HVAL.l;
    const sil = silhuett(art, v, farge);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(vri);
    for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.drawImage(sil, -l / 2 + Math.cos(a) * tykk, -h / 2 + Math.sin(a) * tykk, l, h);
    }
    ctx.restore();
    tegnHvalStempel(ctx, art, v, x, y, vri, l);
}
