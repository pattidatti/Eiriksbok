// Hus man kan gå inn i. Laftekroppen bygges som fire vegger med hull der dørene og gluggene står
// åpne, i stedet for én lukket kloss. Innsiden er sotet der det brant ild, golvet ligger litt over
// bakken, og et bjelkelag skiller etasjene.
//
// `inne.etasjer` sier hvor mange etasjer fra bunnen som er hule (standard: alle). Er alle hule, går
// rommet helt opp under taket (schøtstua). Ellers får den øverste hule etasjen tak av bjelker og
// bord, og etasjene over bygges som lukket laft (bua med lagerloftet over). Samme rom som modulene:
// x på tvers, z innover fra framgavlen, y opp.
import * as THREE from 'three';
import type { ColliderKit, MeshKit, Tint } from '../motor/meshkit';
import { eaveY, floorY, floorZ, riseOf, utkraging, type HouseSpec } from './moduler';
import { trapp } from './gard';

/** Tykkelsen på laftveggene. Stokkene er 0,24 m, men veggen er høvlet litt inn på innsiden. */
export const WALL_T = 0.2;
/** Golvet inne ligger over bakken utenfor: man går over dørstokken (svillen). */
export const GOLV_Y = 0.2;
const SVILL_Y = 0.24;
const FOOT = 0.9;
/** Bjelkelaget mellom etasjene: bord oppå (golvet over), bjelker under. */
const LAG_T = 0.12;
const BJELKE_H = 0.18;

/** Sot fra ildstedet: mørkest øverst, der røyken samlet seg under taket. */
export const SOT: Tint = { top: 0.3, bottom: 0.52, hue: [0.95, 0.9, 0.84] };
/** Innsiden av en bu uten ild: ubehandlet laft, mørkere nede ved golvet. */
const BU_INNE: Tint = { top: 0.72, bottom: 0.5, hue: [1.02, 0.97, 0.9] };

export interface Hull {
    /** Midten langs veggen. */
    x: number;
    w: number;
    y0: number;
    h: number;
}

/** Hvor mange etasjer fra bunnen som er hule. */
export const hule = (s: HouseSpec): number => (s.inne ? Math.min(s.inne.etasjer ?? s.floors.length, s.floors.length) : 0);
/** Rommet går helt opp under taket (ingen lukkede etasjer over). */
export const apentTak = (s: HouseSpec): boolean => !!s.inne && hule(s) === s.floors.length;
/** Golvet i etasje `i`, der man står. */
export const golvY = (s: HouseSpec, i: number): number => (i === 0 ? GOLV_Y : floorY(s, i) + LAG_T - 0.02);
const innside = (s: HouseSpec): Tint => (s.inne?.ljore ? SOT : BU_INNE);

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/**
 * Deler et rektangel (x fra `x0` til `x1`, y fra `y0` til `y1`) i biter rundt hullene: én søyle
 * per strekning mellom hullkantene, og i hver søyle det som står igjen over og under hullene.
 */
export function biter(x0: number, x1: number, y0: number, y1: number, hull: Hull[]): { a: number; b: number; y0: number; y1: number }[] {
    const xs = [x0, x1];
    for (const h of hull) xs.push(Math.max(x0, h.x - h.w / 2), Math.min(x1, h.x + h.w / 2));
    xs.sort((a, b) => a - b);
    const out: { a: number; b: number; y0: number; y1: number }[] = [];
    for (let i = 0; i < xs.length - 1; i++) {
        const a = xs[i];
        const b = xs[i + 1];
        if (b - a < 0.01) continue;
        const mid = (a + b) / 2;
        let spans: [number, number][] = [[y0, y1]];
        for (const h of hull) {
            if (Math.abs(mid - h.x) >= h.w / 2) continue;
            spans = spans.flatMap(([p, q]): [number, number][] => {
                const o: [number, number][] = [];
                if (h.y0 > p) o.push([p, Math.min(q, h.y0)]);
                if (h.y0 + h.h < q) o.push([Math.max(p, h.y0 + h.h), q]);
                return o.filter(([m, n]) => n - m > 0.01);
            });
        }
        for (const [p, q] of spans) out.push({ a, b, y0: p, y1: q });
    }
    return out;
}

/**
 * Én vegg i eget rom: x langs veggen (0 = midten), utsiden mot -z, innsiden i z = WALL_T.
 * Veggen deles i biter rundt hullene. Hver bit får laft på utsiden i husets tone, laft på
 * innsiden og en kollider. Innsiden kan gå litt høyere enn utsiden (`innerTop`) og tetter da
 * glipa opp mot taket.
 */
function vegg(k: MeshKit, c: ColliderKit, s: HouseSpec, len: number, hull: Hull[], bottom: number, top: number, innerTop: number): void {
    const T = WALL_T;
    const t = s.tint;
    const inn = innside(s);
    for (const { a, b, y0, y1 } of biter(-len / 2, len / 2, bottom, top, hull)) {
        const mid = (a + b) / 2;
        // Utsiden: mørk fot nederst (fukt og skitt), som på de lukkede husene.
        const bands: [number, number, boolean][] = y0 < FOOT && y1 > FOOT ? [[y0, FOOT, true], [FOOT, y1, false]] : [[y0, y1, y0 < FOOT]];
        for (const [p, q, foot] of bands) {
            // Topp og bunn synes bare i kanten av et hull (overligger og bunnstokk).
            const skip: ('top' | 'bottom' | 'pz')[] = ['pz'];
            if (q >= top - 0.001) skip.push('top');
            if (p <= bottom + 0.001) skip.push('bottom');
            k.withTint(foot ? { ...t, bottom: t.top * 0.55 } : t, () =>
                k.box('laft', mid, (p + q) / 2, T / 2, b - a, q - p, T, { skip, shadeFoot: foot })
            );
        }
        k.withTint(inn, () => k.box('laft', mid, (y0 + y1) / 2, T / 2, b - a, y1 - y0, T, { skip: ['top', 'bottom', 'nz', 'px', 'nx'], shadeFoot: true }));
        c.box(mid, (y0 + y1) / 2, T / 2, b - a, y1 - y0, T);
    }
    // Hullene er portaler inn til innredningen (portal.ts). Utsiden er -z.
    for (const h of hull) {
        k.aapning([V(h.x - h.w / 2, h.y0, 0), V(h.x + h.w / 2, h.y0, 0), V(h.x + h.w / 2, h.y0 + h.h, 0), V(h.x - h.w / 2, h.y0 + h.h, 0)], V(0, 0, -1));
    }
    // Stripa mellom veggtoppen og taket på innsiden.
    if (innerTop > top) {
        k.withTint({ ...inn, bottom: inn.top }, () =>
            k.box('laft', 0, (top + innerTop) / 2, T / 2, len, innerTop - top, T, { skip: ['top', 'bottom', 'nz', 'px', 'nx'] })
        );
    }
}

export const DOR_W = 1.05;
export const DOR_H = 1.9;
/** Bu-døra i gavlen og loftsdørene over (samme mål som i `fasade`). */
export const PORT = { w: 1.5, h: 2.05, y0: 0.18 };
export const LOFTSDOR = { w: 1.0, h: 1.45, over: 0.35 };
export const OVREDOR = { w: 0.95, h: 1.85, over: 0.1 };

/** Gluggen i etasje `i`: underkanten, bredden og høyden (samme mål som `glugger` i moduler). */
export const gluggMal = (s: HouseSpec, i: number) => ({ y0: floorY(s, i) + (i === 0 ? 1.1 : 0.95), w: 0.6, h: 0.55 });

/** Hullene i en langvegg (side ±1) i etasje `i`, i veggens egen x. */
function langveggHull(s: HouseSpec, side: -1 | 1, i: number): Hull[] {
    const lx = (z: number) => (side > 0 ? z - s.l / 2 - floorZ(s, i) / 2 : s.l / 2 - z + floorZ(s, i) / 2);
    const out: Hull[] = [];
    if (i === 0) for (const d of s.doors ?? []) if (d.side === side && d.open) out.push({ x: lx(d.z), w: DOR_W, y0: SVILL_Y, h: DOR_H });
    if (i === 1) {
        for (const d of s.upperDoors ?? []) {
            if (d.side === side && d.open) out.push({ x: lx(d.z), w: OVREDOR.w, y0: s.floors[0] + OVREDOR.over, h: OVREDOR.h });
        }
    }
    const g = gluggMal(s, i);
    for (const gl of s.glugger ?? []) if (gl.side === side && gl.open && gl.floor === i) out.push({ x: lx(gl.at), w: g.w, y0: g.y0, h: g.h });
    return out;
}

/** Hullene i framgavlen i etasje `i`, i husets x. Med bordkledd gavl står dørene der åpne. */
export function gavlHull(s: HouseSpec, i: number): Hull[] {
    const out: Hull[] = [];
    if (s.facade) {
        if (i === 0) out.push({ x: 0, w: PORT.w, y0: PORT.y0, h: PORT.h });
        else out.push({ x: 0, w: LOFTSDOR.w, y0: floorY(s, i) + LOFTSDOR.over, h: LOFTSDOR.h });
    }
    const g = gluggMal(s, i);
    for (const gl of s.glugger ?? []) if (gl.side === 0 && gl.open && gl.floor === i) out.push({ x: gl.at, w: g.w, y0: g.y0, h: g.h });
    return out;
}

/** Trappehullet i golvet over etasje 0: langs veggen der trappa står, fra hodehøyde og opp. */
export function trappehull(s: HouseSpec): { x0: number; x1: number; z0: number; z1: number } | null {
    const tr = s.inne?.trapp;
    if (!tr) return null;
    const xIn = s.w / 2 - WALL_T;
    const yTop = golvY(s, 1);
    const ceil = floorY(s, 1) - BJELKE_H - 0.02;
    // Der trinnet ligger høyere enn himlingen minus en gutt og litt luft, må hullet begynne.
    const f = (ceil - 1.75 - GOLV_Y) / (yTop - GOLV_Y);
    const z0 = tr.z0 + (tr.z1 - tr.z0) * THREE.MathUtils.clamp(f, 0, 1) - 0.1;
    const a = tr.side * xIn;
    const b = tr.side * (xIn - TRAPP_W - 0.1);
    return { x0: Math.min(a, b), x1: Math.max(a, b), z0, z1: tr.z1 };
}
const TRAPP_W = 1.0;

/** Ei plate fra x0..x1, z0..z1 (topp i `y`), med et hull i. Lager kollider også. */
function plate(k: MeshKit, c: ColliderKit, x0: number, x1: number, z0: number, z1: number, y: number, th: number, hole: { x0: number; x1: number; z0: number; z1: number } | null): void {
    const rects: [number, number, number, number][] = [];
    if (!hole) rects.push([x0, x1, z0, z1]);
    else {
        if (hole.z0 > z0) rects.push([x0, x1, z0, hole.z0]);
        if (hole.z1 < z1) rects.push([x0, x1, hole.z1, z1]);
        if (hole.x0 > x0) rects.push([x0, hole.x0, hole.z0, hole.z1]);
        if (hole.x1 < x1) rects.push([hole.x1, x1, hole.z0, hole.z1]);
    }
    for (const [a, b, p, q] of rects) {
        if (b - a < 0.01 || q - p < 0.01) continue;
        k.box('dekke', (a + b) / 2, y - th / 2, (p + q) / 2, b - a, th, q - p, { grain: 'x' });
        c.box((a + b) / 2, y - th / 2, (p + q) / 2, b - a, th, q - p);
    }
}

/**
 * Bjelkelaget over etasje `i`: tverrbjelker under og golvbord oppå. Er etasjen over hul, er
 * bordene golvet der oppe (med trappehull og rekkverk rundt det).
 */
function bjelkelag(k: MeshKit, c: ColliderKit, s: HouseSpec, i: number): void {
    const xIn = s.w / 2 - WALL_T;
    const y = floorY(s, i + 1);
    const oppe = i + 1 < hule(s);
    const z0 = (oppe ? floorZ(s, i + 1) : floorZ(s, i)) + WALL_T;
    const z1 = s.l - WALL_T;
    const hole = i === 0 && oppe ? trappehull(s) : null;
    k.withTint({ top: 0.6, bottom: 0.5, hue: [1.02, 0.97, 0.9] }, () => plate(k, c, -xIn, xIn, z0, z1, y + LAG_T - 0.02, LAG_T, hole));
    // Bjelkene: på tvers, en drøy meter imellom. Ved trappehullet stopper de mot en veksel.
    k.withTint({ top: 0.5, bottom: 0.4, hue: [0.98, 0.93, 0.87] }, () => {
        const by = y - 0.02 - BJELKE_H / 2;
        for (let z = floorZ(s, i) + WALL_T + 0.5; z < z1 - 0.2; z += 1.15) {
            if (hole && z > hole.z0 - 0.1 && z < hole.z1 + 0.1) {
                const a = hole.x0 <= -xIn + 0.01 ? hole.x1 : -xIn;
                const b = hole.x0 <= -xIn + 0.01 ? xIn : hole.x0;
                k.box('raatre', (a + b) / 2, by, z, b - a, BJELKE_H, 0.16);
            } else k.box('raatre', 0, by, z, xIn * 2, BJELKE_H, 0.16);
        }
        if (hole) {
            for (const z of [hole.z0 - 0.08, hole.z1 + 0.08]) k.box('raatre', (hole.x0 + hole.x1) / 2, by, z, hole.x1 - hole.x0, BJELKE_H, 0.16);
            const xe = Math.abs(hole.x0) < Math.abs(hole.x1) ? hole.x0 - 0.08 : hole.x1 + 0.08;
            k.box('raatre', xe, by, (hole.z0 + hole.z1) / 2, 0.16, BJELKE_H, hole.z1 - hole.z0 + 0.3);
        }
    });
    if (hole) rekkverk(k, c, s, hole, y + LAG_T - 0.02);
}

/** Rekkverket rundt trappehullet i etasjen over: langs den åpne siden og enden. Trappa kommer opp i z1. */
function rekkverk(k: MeshKit, c: ColliderKit, s: HouseSpec, h: { x0: number; x1: number; z0: number; z1: number }, y: number): void {
    const side = s.inne?.trapp?.side ?? -1;
    const xr = side < 0 ? h.x1 + 0.04 : h.x0 - 0.04;
    const H = 0.95;
    k.withTint({ top: 0.62, bottom: 0.5 }, () => {
        k.box('raatre', xr, y + H, (h.z0 + h.z1) / 2, 0.08, 0.07, h.z1 - h.z0);
        k.box('raatre', (h.x0 + h.x1) / 2, y + H, h.z0 - 0.04, h.x1 - h.x0, 0.07, 0.08);
        for (const z of [h.z0 - 0.04, (h.z0 + h.z1) / 2, h.z1 - 0.06]) k.box('raatre', xr, y + H / 2, z, 0.09, H, 0.09);
        k.box('raatre', (h.x0 + xr) / 2, y + H / 2, h.z0 - 0.04, 0.09, H, 0.09);
    });
    c.box(xr, y + H / 2, (h.z0 + h.z1) / 2, 0.1, H + 0.05, h.z1 - h.z0, true);
    c.box((h.x0 + h.x1) / 2, y + H / 2, h.z0 - 0.04, h.x1 - h.x0, H + 0.05, 0.1, true);
}

/**
 * De hule etasjene: svill rundt, fire vegger per etasje, golv, bjelkelag, og enten innergavler og
 * åser (rommet går opp under taket) eller lukket laft over. Erstatter `laftKropp` for de hule
 * etasjene; etasjene over bygges av den vanlige kroppen.
 */
export function laftKroppInne(k: MeshKit, c: ColliderKit, s: HouseSpec): void {
    const T = WALL_T;
    const t = s.tint;
    const n = hule(s);

    // Svillen: fire stokker langs veggene. Under en åpen dør er den dørstokken.
    k.withTint({ ...t, top: t.top * 0.7 }, () => {
        for (const sx of [-1, 1]) k.box('raatre', sx * (s.w / 2 - T / 2 + 0.015), SVILL_Y / 2, s.l / 2, T + 0.06, SVILL_Y, s.l + 0.06, { skip: ['bottom'] });
        for (const z of [T / 2 - 0.015, s.l - T / 2 + 0.015]) k.box('raatre', 0, SVILL_Y / 2, z, s.w - T * 2, SVILL_Y, T + 0.06, { skip: ['bottom'] });
    });

    for (let i = 0; i < n; i++) {
        const y0 = floorY(s, i);
        const y1 = y0 + s.floors[i];
        const bottom = i === 0 ? SVILL_Y : y0;
        const zf = floorZ(s, i);
        const len = s.l - zf;
        // Under taket går veggen inne opp til der taket treffer innsiden av veggen.
        const innerTop = apentTak(s) && i === n - 1 ? y1 + T * s.pitch + 0.03 : y1;
        // Langveggene over hele lengden, gavlveggene imellom (ellers kniver flatene i hjørnene).
        for (const side of [-1, 1] as const) {
            k.at(side * (s.w / 2), 0, zf + len / 2, side > 0 ? -Math.PI / 2 : Math.PI / 2, () => vegg(k, c, s, len, langveggHull(s, side, i), bottom, y1, innerTop), c);
        }
        k.at(0, 0, zf, 0, () => vegg(k, c, s, s.w - T * 2, gavlHull(s, i), bottom, y1, innerTop), c);
        k.at(0, 0, s.l, Math.PI, () => vegg(k, c, s, s.w - T * 2, [], bottom, y1, innerTop), c);
        if (i > 0 && floorZ(s, i - 1) - zf > 0.02) utkraging(k, s, y0, zf, floorZ(s, i - 1));
        if (i < s.floors.length - 1) bjelkelag(k, c, s, i);
    }

    // Golvet: gamle bord, mørke av sot og skitt. Kollideren fyller under, så golvet bærer.
    k.withTint({ top: 0.55, bottom: 0.55, hue: [1, 0.95, 0.9] }, () =>
        k.box('dekke', 0, GOLV_Y - 0.05, s.l / 2, s.w - T * 2, 0.1, s.l - T * 2, { skip: ['bottom'], grain: 'x' })
    );
    c.box(0, (GOLV_Y - 1) / 2, s.l / 2, s.w, 1 + GOLV_Y, s.l);

    const tr = s.inne?.trapp;
    if (tr && n > 1) {
        // Trappa opp til loftet langs veggen, med håndlist mot rommet.
        const xa = tr.side * (s.w / 2 - T - 0.02);
        const xb = tr.side * (s.w / 2 - T - TRAPP_W);
        k.at(0, GOLV_Y, 0, 0, () => trapp(k, c, xa, xb, tr.z0, tr.z1, golvY(s, 1) - GOLV_Y, xb), c);
    }

    if (apentTak(s)) innerTak(k, c, s);
}

/** Innergavlene (trekanten over veggtoppen, sett innenfra) og åsene. Bare når rommet går opp under taket. */
function innerTak(k: MeshKit, c: ColliderKit, s: HouseSpec): void {
    const T = WALL_T;
    const h = eaveY(s);
    const rise = riseOf(s);
    const hw = s.w / 2 - T;
    const y0 = h + T * s.pitch + 0.03;
    const top = h + rise;
    k.withTint(SOT, () => {
        const sh: [number, number, number] = [SOT.top, SOT.top, SOT.top * 0.8];
        const fz = T + 0.001;
        const bz = s.l - T - 0.001;
        k.tri('bordvegg', V(-hw, y0, fz), V(hw, y0, fz), V(0, top, fz), [-hw, y0], [hw, y0], [0, top], sh);
        k.tri('bordvegg', V(hw, y0, bz), V(-hw, y0, bz), V(0, top, bz), [hw, y0], [-hw, y0], [0, top], sh);
    });
    // Gavltrekantene kolliderer også, ellers trekker kameraet seg ut gjennom dem.
    for (const [z0, z1] of [[0, T], [s.l - T, s.l]]) {
        const pts: THREE.Vector3[] = [];
        for (const z of [z0, z1]) pts.push(V(-s.w / 2, h, z), V(s.w / 2, h, z), V(0, top, z));
        c.hull(pts);
    }

    // Åsene: mønsåsen og én ås på hver side, fra gavl til gavl. Taket hviler på dem.
    k.withTint({ top: 0.34, bottom: 0.34, hue: [0.95, 0.9, 0.85] }, () => {
        const r = 0.13;
        k.log('raatre', V(0, top - r - 0.04, T * 0.5), V(0, top - r - 0.04, s.l - T * 0.5), r, 7, false);
        for (const sx of [-1, 1]) {
            const x = sx * s.w / 4;
            const y = top - s.pitch * (s.w / 4) - r - 0.06;
            k.log('raatre', V(x, y, T * 0.5), V(x, y, s.l - T * 0.5), r * 0.9, 7, false);
        }
    });
}

/**
 * Rommene innenfor veggene, én boks per hul etasje, i husets rom. Inne dempes dagslyset; `demp`
 * sier hvor mye (1 = som i schøtstua, der ilden tar over).
 */
export function romIHus(s: HouseSpec, demp: number): { box: THREE.Box3; demp: number }[] {
    const xIn = s.w / 2 - WALL_T;
    const out: { box: THREE.Box3; demp: number }[] = [];
    for (let i = 0; i < hule(s); i++) {
        const y0 = floorY(s, i);
        const y1 = apentTak(s) && i === hule(s) - 1 ? eaveY(s) + riseOf(s) : y0 + s.floors[i];
        out.push({ box: new THREE.Box3(V(-xIn, y0, floorZ(s, i) + WALL_T), V(xIn, y1, s.l - WALL_T)), demp });
    }
    return out;
}

/**
 * Terskelen i en åpen dør inn til golvet: en lav kile fra bakken utenfor og opp til golvet, så
 * gutten ikke henger fast på kanten (autostep tar ikke de 0,2 m). Samme rom som `dor`: veggen i
 * z = 0, utsiden -z.
 */
export function terskel(c: ColliderKit, w: number): void {
    const pts: THREE.Vector3[] = [];
    for (const x of [-w / 2, w / 2]) {
        pts.push(V(x, -0.2, -0.55), V(x, 0, -0.55), V(x, GOLV_Y, -0.05), V(x, GOLV_Y, WALL_T + 0.15), V(x, -0.2, WALL_T + 0.15));
    }
    c.hull(pts);
}

/**
 * Døra som står åpen inn i et rom: dørbladet slått inn mot veggen innenfor, hengslet på venstre
 * side sett utenfra. Samme rom som `dor` (veggen i z = 0, utsiden -z). Brede dører har to blad,
 * ett mot hver side.
 */
export function dorbladInne(k: MeshKit, c: ColliderKit, w = DOR_W, h = DOR_H, y0 = SVILL_Y): void {
    const t = k.tint;
    const blad = w > 1.2 ? [[-1, w / 2], [1, w / 2]] : [[-1, w]];
    for (const [side, bw] of blad) {
        const x = side * (w / 2 - 0.03);
        const z = WALL_T + bw / 2 - 0.02;
        k.withTint({ ...t, top: t.top * 1.1, hue: [1.06, 1.0, 0.9] }, () => k.box('bordvegg', x, y0 + h / 2, z, 0.04, h - 0.02, bw - 0.04));
        c.box(x, y0 + h / 2, z, 0.06, h, bw - 0.04, true);
    }
}
