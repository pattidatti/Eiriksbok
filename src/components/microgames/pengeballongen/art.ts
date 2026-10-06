// Kunsten som lages én gang: paletten, kritt-kornet (et støymønster), skyene og
// kvalitetsnivået. Tonelitografi: blek tonestein, kornet litokritt, skrapt hvitt.

export const P = {
    stein: '#d6d9cc',
    steinLys: '#e4e6db',
    kritt: '#2e3236',
    halv: '#7d877f',
    hvit: '#f6f4ec',
    silke: '#c8692b',
    silkeMørk: '#9c4a1c',
    silkeLys: '#e3934f',
    karmin: '#6d2f4a',
    /** Varm tonestein i 1880-årene (himmelen lysner). */
    varm: '#e6dcc4',
};

export type Kvalitet = 'lav' | 'middels' | 'hoy';

let kvalitetNå: Kvalitet | null = null;

/** ?kvalitet=lav|middels|hoy, ellers en gjetning fra maskinen. Samme spill på alle nivåer. */
export function kvalitet(): Kvalitet {
    if (kvalitetNå) return kvalitetNå;
    let k: Kvalitet = 'middels';
    if (typeof window !== 'undefined') {
        const q = new URLSearchParams(window.location.search).get('kvalitet');
        const kjerner = navigator.hardwareConcurrency || 4;
        const minne = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
        if (kjerner <= 4 || minne <= 4 || /CrOS/.test(navigator.userAgent)) k = 'lav';
        else if (kjerner >= 8) k = 'hoy';
        if (q === 'lav' || q === 'middels' || q === 'hoy') k = q;
    }
    kvalitetNå = k;
    return k;
}

/** Deterministisk «tilfeldig» tall 0-1 fra et heltall (samme fjell hver gang). */
export function hash(n: number): number {
    let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
    x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35);
    x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
}

/** Glatt støy (verdistøy) for fjellkammer i bakgrunnen. */
export function støy(x: number): number {
    const i = Math.floor(x);
    const f = x - i;
    const s = f * f * (3 - 2 * f);
    return hash(i) * (1 - s) + hash(i + 1) * s;
}

function lagCanvas(w: number, h: number) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
}

export interface Kunst {
    /** Mørkt kritt-korn (prikker med varierende tetthet) - legges over fjellene. */
    korn: CanvasPattern | null;
    /** Lyst korn (skrapt hvitt) - legges over himmelen og snøen. */
    kornLys: CanvasPattern | null;
    /** Skyer som ferdige bilder (skrapt hvitt med kornet kant). */
    skyer: HTMLCanvasElement[];
}

let kunst: Kunst | null = null;

/** Lager kornet og skyene første gang de trengs (krever document). */
export function hentKunst(ctx: CanvasRenderingContext2D): Kunst {
    if (kunst) return kunst;
    const korn = lagCanvas(160, 160);
    const k = korn.getContext('2d')!;
    for (let i = 0; i < 2600; i++) {
        const x = hash(i * 3 + 1) * 160;
        const y = hash(i * 3 + 2) * 160;
        const a = 0.12 + hash(i * 3 + 3) * 0.3;
        k.fillStyle = `rgba(20,22,24,${a.toFixed(3)})`;
        k.fillRect(x, y, 1 + (hash(i + 77) > 0.8 ? 1 : 0), 1);
    }
    const lys = lagCanvas(160, 160);
    const l = lys.getContext('2d')!;
    for (let i = 0; i < 1400; i++) {
        const x = hash(i * 5 + 11) * 160;
        const y = hash(i * 5 + 12) * 160;
        l.fillStyle = `rgba(250,248,240,${(0.15 + hash(i * 5 + 13) * 0.35).toFixed(3)})`;
        l.fillRect(x, y, 1.4, 1.4);
    }
    const skyer: HTMLCanvasElement[] = [];
    for (let s = 0; s < 4; s++) skyer.push(lagSky(s));
    kunst = {
        korn: ctx.createPattern(korn, 'repeat'),
        kornLys: ctx.createPattern(lys, 'repeat'),
        skyer,
    };
    return kunst;
}

/** En sky: klynger av ellipser i skrapt hvitt, med kornet underkant i halvtone. */
function lagSky(n: number): HTMLCanvasElement {
    const W = 260;
    const H = 90;
    const c = lagCanvas(W, H);
    const g = c.getContext('2d')!;
    const klumper = 6 + Math.floor(hash(n * 31) * 4);
    // Skyggen under (halvtone).
    g.fillStyle = 'rgba(125,135,127,0.35)';
    for (let i = 0; i < klumper; i++) {
        const x = 30 + hash(n * 31 + i) * (W - 60);
        const r = 14 + hash(n * 17 + i) * 20;
        g.beginPath();
        g.ellipse(x, 60, r * 1.4, r * 0.6, 0, 0, Math.PI * 2);
        g.fill();
    }
    // Selve skya (skrapt hvitt).
    g.fillStyle = 'rgba(246,244,236,0.92)';
    for (let i = 0; i < klumper; i++) {
        const x = 30 + hash(n * 31 + i) * (W - 60);
        const r = 14 + hash(n * 17 + i) * 20;
        g.beginPath();
        g.ellipse(x, 52 - hash(n * 13 + i) * 18, r * 1.3, r * 0.8, 0, 0, Math.PI * 2);
        g.fill();
    }
    // Kornet kant: visk ut litt med korn.
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 900; i++) {
        g.fillStyle = `rgba(0,0,0,${(hash(n * 1000 + i) * 0.5).toFixed(2)})`;
        g.fillRect(hash(n * 2000 + i) * W, hash(n * 3000 + i) * H, 2, 2);
    }
    return c;
}

/** Flytt et mønster med verden (så kornet glir med fjellet i stedet for å stå stille). */
export function flyttMønster(p: CanvasPattern | null, dx: number, dy = 0) {
    if (!p || typeof DOMMatrix === 'undefined') return;
    p.setTransform(new DOMMatrix().translateSelf(dx, dy));
}

/** Blander to hex-farger (t 0-1). */
export function blandFarge(a: string, b: string, t: number): string {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
