// Kartet i Petisjonen: Østlandet rundt 1849, nord opp.
//
// Koordinater: x østover, z sørover (three.js: -z er nord). Kartet er et ark på
// MAP_W x MAP_D. Stedene ligger omtrent riktig i forhold til hverandre - Drammen
// vest for Christiania, Hamar og Toten langt nord, Kongsberg sørvest - men
// avstandene er klemt sammen så en runde rekker hele Østlandet.

export type XZ = [number, number];

export const MAP_W = 88;
export const MAP_D = 64;
export const HALF_W = MAP_W / 2;
export const HALF_D = MAP_D / 2;

export interface House {
    p: XZ;
    rot: number;
    /** 0 = stue, 1 = låve, 2 = husmannsstue (liten). */
    kind: 0 | 1 | 2;
    r: number;
}

export interface Place {
    id: string;
    name: string;
    /** Midten av tunet foran låven - der møtet holdes. */
    tun: XZ;
    /** Hvor mange husmenn og arbeidere bygda har rundt seg. */
    folk: number;
    /** Hvor mange medlemmer foreningen kan vokse til. */
    cap: number;
    /** Hvor mange fra bygda som må være med på rullen før det kan holdes møte. */
    need: number;
    /** Gården til bonden med stemmerett. */
    gard: XZ;
    houses: House[];
    /** Steder der husmenn står (rundt husmannsstuene). */
    spots: XZ[];
    by: boolean;
}

// Liten deterministisk tilfeldighet, så kartet er likt hver gang.
export function rng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

interface Raw {
    id: string;
    name: string;
    at: XZ;
    cap: number;
    by?: boolean;
    /** Retningen fra tunet til gården (radianer), når standarden kolliderer med noe. */
    ga?: number;
}

// Foreninger fantes på hele Østlandet (artikkelen). Byene er større enn bygdene.
const RAW: Raw[] = [
    { id: 'drammen', name: 'Drammen', at: [-24, 12], cap: 1900, by: true },
    { id: 'christiania', name: 'Christiania', at: [2, 14], cap: 2600, by: true },
    { id: 'kongsberg', name: 'Kongsberg', at: [-35, 22], cap: 1300, by: true },
    { id: 'modum', name: 'Modum', at: [-37, -1], cap: 900 },
    { id: 'ringerike', name: 'Ringerike', at: [-21, -12], cap: 1100 },
    { id: 'asker', name: 'Asker', at: [-11, 6], cap: 900 },
    { id: 'hadeland', name: 'Hadeland', at: [-8, -17], cap: 1000 },
    { id: 'land', name: 'Land', at: [-24, -25], cap: 700 },
    { id: 'toten', name: 'Toten', at: [5, -25], cap: 1200 },
    { id: 'hamar', name: 'Hamar', at: [27, -24], cap: 1100, by: true },
    { id: 'eidsvoll', name: 'Eidsvoll', at: [18, -9], cap: 1000 },
    { id: 'romerike', name: 'Romerike', at: [10, 1], cap: 1300 },
    { id: 'solor', name: 'Solør', at: [36, -8], cap: 800 },
    { id: 'aurskog', name: 'Aurskog', at: [30, 8], cap: 800 },
    { id: 'follo', name: 'Follo', at: [15, 21], cap: 900 },
    { id: 'holmestrand', name: 'Holmestrand', at: [-15.5, 25], cap: 900, ga: -Math.PI / 2 },
];

/** Slottet i Christiania - der petisjonen skal leveres til kongen. */
export const SLOTTET: XZ = [-5.5, 24.5];
export const SLOTTET_R = 3.2;
/**
 * Arbeider-Foreningernes Blad, trykkeriet i Christiania. Navn som leveres hit, er
 * trygge - de kan ikke rives av rullen lenger.
 */
export const BLADET: XZ = [6.5, 7];
export const BLADET_R = 2.1;
export const BLADET_HUS: XZ = [6.5, 4.6];
/** Hvor embetsmennene og lensmennene rir ut fra. */
export const HUNTER_HOME: XZ = [6, 19];

function buildPlace(raw: Raw, i: number): Place {
    const R = rng(1000 + i * 97);
    const [cx, cz] = raw.at;
    const houses: House[] = [];
    const spots: XZ[] = [];
    // Låven står nord for tunet. Gården til bonden ligger et stykke unna mot
    // nordøst, og husmannsstuene ligger i en ring rundt resten av bygda.
    const ga = (raw.ga ?? -0.55) + (R() - 0.5) * 0.3;
    const gard: XZ = [cx + Math.cos(ga) * 9, cz + Math.sin(ga) * 9 * 0.85];
    houses.push({ p: [cx, cz - 2.4], rot: (R() - 0.5) * 0.3, kind: 1, r: 1.5 });
    houses.push({ p: [gard[0] + 0.4, gard[1] - 1.9], rot: (R() - 0.5) * 0.4, kind: 0, r: 1.1 });
    const n = raw.by ? 5 : 3;
    for (let k = 0; k < n; k++) {
        const a = 1.3 + (k / Math.max(1, n - 1)) * Math.PI * 1.3 + (R() - 0.5) * 0.3;
        const d = 5.4 + R() * 1.4;
        const p: XZ = [cx + Math.cos(a) * d, cz + Math.sin(a) * d * 0.85];
        houses.push({ p, rot: R() * Math.PI, kind: 2, r: 0.8 });
        for (let s = 0; s < 3; s++) {
            const sa = R() * Math.PI * 2;
            spots.push([p[0] + Math.cos(sa) * 1.7, p[1] + Math.sin(sa) * 1.7]);
        }
    }
    if (raw.by)
        for (let k = 0; k < 3; k++)
            houses.push({
                p: [cx - 5.2 + k * 2.3, cz + 4.6 + (k % 2) * 0.8],
                rot: R() * 0.3,
                kind: 0,
                r: 0.95,
            });
    return {
        id: raw.id,
        name: raw.name,
        tun: [cx, cz],
        folk: raw.by ? 9 : 6,
        cap: raw.cap,
        need: raw.by ? 4 : 3,
        gard,
        houses,
        spots,
        by: !!raw.by,
    };
}

export const PLACES: Place[] = RAW.map(buildPlace);
export const START_PLACE = 0; // Drammen, desember 1848

/** Alle hus som rullen ikke kommer gjennom, pluss Slottet. */
export const SOLIDS: { p: XZ; r: number }[] = [
    ...PLACES.flatMap((p) => p.houses.map((h) => ({ p: h.p, r: h.r }))),
    { p: SLOTTET, r: 2.6 },
    { p: BLADET_HUS, r: 1.3 },
];

// Trær: utenfor bygdene og veiene. Bare pynt - rullen kjører gjennom og bøyer dem.
function buildTrees(): XZ[] {
    const R = rng(4242);
    const out: XZ[] = [];
    let guard = 0;
    while (out.length < 420 && guard++ < 8000) {
        const p: XZ = [(R() - 0.5) * (MAP_W + 20), (R() - 0.5) * (MAP_D + 16)];
        if (PLACES.some((pl) => dist(pl.tun, p) < 9.5)) continue;
        if (dist(p, SLOTTET) < 7) continue;
        if (ROADS.some(([a, b]) => segDist(p, PLACES[a].tun, PLACES[b].tun) < 2)) continue;
        // Skogen klumper seg: behold bare punkter nær en skogkjerne.
        const f =
            Math.sin(p[0] * 0.13 + 1.3) * Math.cos(p[1] * 0.17 - 0.4) +
            Math.sin(p[0] * 0.05 - p[1] * 0.07);
        if (f < 0.15) continue;
        out.push(p);
    }
    return out;
}

// Veiene mellom stedene (indekser i PLACES). Tegnes på kartet.
export const ROADS: [number, number][] = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 5],
    [0, 15],
    [5, 1],
    [3, 4],
    [4, 6],
    [4, 7],
    [6, 8],
    [6, 1],
    [8, 9],
    [8, 10],
    [9, 10],
    [10, 11],
    [11, 1],
    [11, 13],
    [10, 12],
    [12, 13],
    [1, 14],
    [14, 13],
    [2, 15],
];

export const TREES: XZ[] = buildTrees();

export function dist(a: XZ, b: XZ) {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function segDist(p: XZ, a: XZ, b: XZ) {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const L = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / L));
    return Math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dz * t));
}
