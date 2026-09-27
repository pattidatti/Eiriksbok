// Kartet for Thranittene: Sør-Norge fra Lindesnes til Trøndelag, med Sverige i
// øst. Alt er ren data og matte - ingen React, ingen three.
//
// Koordinater: x øker mot øst, z øker mot sør. Én lengdegrad er litt over én
// enhet, én breddegrad litt over to (slik kartet ser ut på 60 grader nord).

export type XZ = [number, number];

export const toXZ = (lon: number, lat: number): XZ => [(lon - 8.6) * 1.2, -(lat - 60.7) * 1.75];

export const dist = (a: XZ, b: XZ) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export interface Place {
    id: string;
    name: string;
    pos: XZ;
    /** Hvor mange husmenn og arbeidere som kan bli med i foreningen. */
    pop: number;
    region: 'øst' | 'sør' | 'vest' | 'nord';
}

const P = (
    id: string,
    name: string,
    lon: number,
    lat: number,
    pop: number,
    region: Place['region']
): Place => ({ id, name, pos: toXZ(lon, lat), pop, region });

export const PLACES: Place[] = [
    P('christiania', 'Christiania', 10.75, 59.91, 4800, 'øst'),
    P('drammen', 'Drammen', 10.2, 59.74, 2400, 'øst'),
    P('kongsberg', 'Kongsberg', 9.65, 59.67, 1500, 'øst'),
    P('honefoss', 'Ringerike', 10.26, 60.17, 1700, 'øst'),
    P('moss', 'Moss', 10.8, 59.43, 1300, 'øst'),
    P('fredrikstad', 'Fredrikstad', 11.02, 59.21, 1700, 'øst'),
    P('tonsberg', 'Tønsberg', 10.4, 59.27, 1400, 'øst'),
    P('larvik', 'Larvik', 10.03, 59.05, 1400, 'sør'),
    P('skien', 'Skien', 9.61, 59.21, 1800, 'sør'),
    P('arendal', 'Arendal', 8.77, 58.46, 1500, 'sør'),
    P('kristiansand', 'Kristiansand', 8.0, 58.15, 1700, 'sør'),
    P('stavanger', 'Stavanger', 5.73, 58.97, 1800, 'vest'),
    P('bergen', 'Bergen', 5.32, 60.39, 2800, 'vest'),
    P('voss', 'Voss', 6.42, 60.63, 1100, 'vest'),
    P('hallingdal', 'Hallingdal', 8.94, 60.7, 1200, 'øst'),
    P('hamar', 'Hamar', 11.07, 60.79, 2000, 'øst'),
    P('toten', 'Toten', 10.69, 60.72, 1900, 'øst'),
    P('lillehammer', 'Lillehammer', 10.47, 61.12, 1500, 'øst'),
    P('kongsvinger', 'Kongsvinger', 12.0, 60.19, 1400, 'øst'),
    P('elverum', 'Elverum', 11.56, 60.88, 1500, 'øst'),
    P('gudbrandsdalen', 'Gudbrandsdalen', 9.6, 61.75, 1300, 'øst'),
    P('roros', 'Røros', 11.39, 62.57, 1200, 'nord'),
    P('molde', 'Romsdal', 7.16, 62.74, 1200, 'vest'),
    P('trondheim', 'Trondheim', 10.4, 63.43, 2600, 'nord'),
    P('levanger', 'Levanger', 11.3, 63.75, 1300, 'nord'),
];

export const PRESS = 0; // pressa står i Christiania
/** Trykkeriet ligger litt nord for byen, så buntene ikke letter midt i bygda. */
export const PRESS_POS: XZ = [PLACES[0].pos[0] + 0.05, PLACES[0].pos[1] - 0.42];

export const TOTAL_POP = PLACES.reduce((s, p) => s + p.pop, 0);

// ---------------------------------------------------------------------------
// Kystlinja (lengde, bredde) - forenklet, med Oslofjorden som et hakk.
// ---------------------------------------------------------------------------

const NORWAY_LL: [number, number][] = [
    [11.25, 59.1], // Svinesund
    [11.0, 59.12],
    [10.9, 59.25],
    [10.74, 59.32],
    [10.7, 59.5],
    [10.62, 59.65],
    [10.72, 59.86],
    [10.62, 59.9],
    [10.5, 59.8],
    [10.52, 59.58],
    [10.3, 59.7],
    [10.12, 59.75],
    [10.35, 59.5],
    [10.42, 59.2],
    [10.2, 59.05],
    [9.95, 59.0],
    [9.6, 58.95],
    [9.4, 58.84],
    [9.05, 58.65],
    [8.75, 58.43],
    [8.4, 58.24],
    [8.0, 58.1],
    [7.5, 58.0],
    [7.05, 57.97],
    [6.75, 58.1],
    [6.55, 58.28],
    [6.0, 58.4],
    [5.6, 58.75],
    [5.55, 59.0],
    [5.85, 59.12],
    [5.4, 59.25],
    [5.25, 59.45],
    [5.35, 59.8],
    [5.05, 60.1],
    [5.1, 60.4],
    [4.85, 60.7],
    [4.95, 61.1],
    [4.95, 61.5],
    [5.05, 61.9],
    [5.15, 62.2],
    [5.75, 62.35],
    [6.2, 62.5],
    [6.8, 62.72],
    [7.3, 62.9],
    [7.8, 63.12],
    [8.4, 63.4],
    [9.1, 63.62],
    [9.7, 63.7],
    [10.1, 63.55],
    [10.6, 63.47],
    [11.0, 63.62],
    [11.3, 63.85],
    [11.2, 64.2],
    [11.9, 64.5],
    // Riksgrensen sørover
    [13.4, 64.5],
    [13.4, 63.9],
    [12.2, 63.4],
    [12.15, 62.9],
    [12.25, 62.3],
    [12.6, 61.6],
    [12.85, 61.2],
    [12.55, 60.7],
    [12.4, 60.2],
    [11.85, 59.85],
    [11.75, 59.45],
    [11.45, 59.25],
];

/** Riksgrensen mot Sverige, nord -> sør. Land øst for den tegnes som utland. */
const BORDER_LL: [number, number][] = [
    [13.4, 64.5],
    [13.4, 63.9],
    [12.2, 63.4],
    [12.15, 62.9],
    [12.25, 62.3],
    [12.6, 61.6],
    [12.85, 61.2],
    [12.55, 60.7],
    [12.4, 60.2],
    [11.85, 59.85],
    [11.75, 59.45],
    [11.45, 59.25],
    [11.25, 59.1],
];

/** Sverige, så kartet ikke slutter i løse lufta mot øst. */
const SWEDEN_LL: [number, number][] = [
    [11.25, 59.1],
    [11.15, 58.7],
    [11.3, 58.3],
    [11.75, 57.8],
    [12.0, 57.3],
    [16.5, 57.3],
    [16.5, 65],
    [13.4, 64.5],
    ...BORDER_LL.slice(1, -1),
];

/** Jylland i sør, bare som kulisse. */
const JUTLAND_LL: [number, number][] = [
    [8.1, 56.5],
    [8.2, 57.05],
    [8.6, 57.1],
    [9.6, 57.45],
    [10.55, 57.73],
    [10.45, 57.2],
    [10.35, 56.5],
];

const conv = (ll: [number, number][]) => ll.map(([lo, la]) => toXZ(lo, la));
export const NORWAY = conv(NORWAY_LL);
export const SWEDEN = conv(SWEDEN_LL);
export const JUTLAND = conv(JUTLAND_LL);
export const BORDER = conv(BORDER_LL);

export function inPoly(x: number, z: number, poly: XZ[]) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, zi] = poly[i];
        const [xj, zj] = poly[j];
        if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
    }
    return inside;
}

function segDist(px: number, pz: number, a: XZ, b: XZ) {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const l = dx * dx + dz * dz;
    const t = l > 0 ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l)) : 0;
    return Math.hypot(px - a[0] - t * dx, pz - a[1] - t * dz);
}

function polyDist(x: number, z: number, poly: XZ[], closed = true) {
    let d = Infinity;
    const n = closed ? poly.length : poly.length - 1;
    for (let i = 0; i < n; i++)
        d = Math.min(d, segDist(x, z, poly[i], poly[(i + 1) % poly.length]));
    return d;
}

export type Land = 'hav' | 'norge' | 'utland';
export function landAt(x: number, z: number): Land {
    if (inPoly(x, z, NORWAY)) return 'norge';
    if (inPoly(x, z, SWEDEN) || inPoly(x, z, JUTLAND)) return 'utland';
    return 'hav';
}

// Fjellene: Langfjella skiller Østlandet fra Vestlandet, Dovre skiller fra Trøndelag.
const PEAKS: { c: XZ; r: number; h: number }[] = [
    { c: toXZ(8.3, 61.6), r: 1.5, h: 1.25 }, // Jotunheimen
    { c: toXZ(7.6, 60.2), r: 1.6, h: 0.8 }, // Hardangervidda
    { c: toXZ(7.2, 61.2), r: 1.3, h: 1.0 }, // Sogn
    { c: toXZ(9.4, 62.25), r: 1.3, h: 0.95 }, // Dovre
    { c: toXZ(10.0, 61.9), r: 0.9, h: 0.8 }, // Rondane
    { c: toXZ(7.6, 59.4), r: 1.2, h: 0.6 }, // Setesdalsheiene
    { c: toXZ(8.3, 62.5), r: 1.1, h: 0.85 }, // Trollheimen
    { c: toXZ(6.6, 59.7), r: 0.9, h: 0.6 }, // Folgefonna
    { c: toXZ(12.6, 63.0), r: 1.5, h: 0.55 }, // grensefjella
    { c: toXZ(8.9, 60.4), r: 0.7, h: 0.45 }, // Norefjell
];

const hash = (x: number, z: number) => {
    const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
    return s - Math.floor(s);
};
function noise(x: number, z: number) {
    const xi = Math.floor(x);
    const zi = Math.floor(z);
    const xf = x - xi;
    const zf = z - zi;
    const u = xf * xf * (3 - 2 * xf);
    const v = zf * zf * (3 - 2 * zf);
    const a = hash(xi, zi);
    const b = hash(xi + 1, zi);
    const c = hash(xi, zi + 1);
    const d = hash(xi + 1, zi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Hvor høyt fjellet er her (0 = lavland), uten kystfall. */
export function mountainAt(x: number, z: number) {
    let m = 0;
    for (const p of PEAKS) {
        const d = Math.hypot(x - p.c[0], (z - p.c[1]) * 0.85) / p.r;
        if (d < 1) m = Math.max(m, p.h * (1 - d * d) * (1 - d * d));
    }
    return m;
}

export const SEA_Y = 0;
/** Terrenghøyde. Havbunnen ligger under vannflaten. */
export function heightAt(x: number, z: number): number {
    const land = landAt(x, z);
    if (land === 'hav') return -0.35;
    const coast = Math.min(
        polyDist(x, z, land === 'norge' ? NORWAY : SWEDEN),
        land === 'utland' ? polyDist(x, z, JUTLAND) : 9
    );
    const rise = Math.min(1, coast / 0.45);
    const n = noise(x * 1.7, z * 1.7) * 0.5 + noise(x * 4.1, z * 4.1) * 0.25;
    // Rygger og daler i fjellet, så det ikke blir glatte kupler.
    const ridge = 1 - Math.abs(noise(x * 3.3 + 7, z * 3.3) * 2 - 1);
    const m = mountainAt(x, z) * (0.45 + n * 0.25 + ridge * 0.35);
    return 0.04 + rise * (0.14 + n * 0.16 + m);
}

/** Om punktet er bak riksgrensen (for fargen). */
export function isForeign(x: number, z: number) {
    return landAt(x, z) === 'utland';
}

export { polyDist };

/** Bakkehøyden der en bygd eller et hus står (aldri under vannflaten). */
export const groundY = (p: XZ) => Math.max(0.05, heightAt(p[0], p[1]));
