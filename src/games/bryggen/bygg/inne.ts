// Hus man kan gå inn i. Laftekroppen bygges som fire vegger med hull der dørene og gluggene står
// åpne, i stedet for én lukket kloss. Innsiden er sotet, golvet ligger litt over bakken, og
// innergavlene og åsene under taket lukker rommet oppover.
//
// Bare hus med én etasje og uten utkraging kan være åpne (`inne` i HouseSpec). Samme rom som
// modulene: x på tvers, z innover fra framgavlen, y opp.
import * as THREE from 'three';
import type { ColliderKit, MeshKit, Tint } from '../motor/meshkit';
import { eaveY, riseOf, type HouseSpec } from './moduler';

/** Tykkelsen på laftveggene. Stokkene er 0,24 m, men veggen er høvlet litt inn på innsiden. */
export const WALL_T = 0.2;
/** Golvet inne ligger over bakken utenfor: man går over dørstokken (svillen). */
export const GOLV_Y = 0.2;
const SVILL_Y = 0.24;
const FOOT = 0.9;

/** Sot fra ildstedet: mørkest øverst, der røyken samlet seg under taket. */
export const SOT: Tint = { top: 0.3, bottom: 0.52, hue: [0.95, 0.9, 0.84] };

interface Hull {
    /** Midten langs veggen. */
    x: number;
    w: number;
    y0: number;
    h: number;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/**
 * Én vegg i eget rom: x langs veggen (0 = midten), utsiden mot -z, innsiden i z = WALL_T.
 * Veggen deles i biter rundt hullene. Hver bit får laft på utsiden i husets tone, sotet laft på
 * innsiden og en kollider. Innsiden kan gå litt høyere enn utsiden (`innerTop`) og tetter da
 * glipa opp mot taket.
 */
function vegg(k: MeshKit, c: ColliderKit, s: HouseSpec, len: number, hull: Hull[], top: number, innerTop: number): void {
    const T = WALL_T;
    const xs = [-len / 2, len / 2];
    for (const h of hull) xs.push(Math.max(-len / 2, h.x - h.w / 2), Math.min(len / 2, h.x + h.w / 2));
    xs.sort((a, b) => a - b);
    const t = s.tint;
    for (let i = 0; i < xs.length - 1; i++) {
        const a = xs[i];
        const b = xs[i + 1];
        if (b - a < 0.01) continue;
        const mid = (a + b) / 2;
        // Høydene som står igjen i denne søylen, når hullene her er tatt bort.
        let spans: [number, number][] = [[SVILL_Y, top]];
        for (const h of hull) {
            if (Math.abs(mid - h.x) >= h.w / 2) continue;
            spans = spans.flatMap(([y0, y1]): [number, number][] => {
                const out: [number, number][] = [];
                if (h.y0 > y0) out.push([y0, Math.min(y1, h.y0)]);
                if (h.y0 + h.h < y1) out.push([Math.max(y0, h.y0 + h.h), y1]);
                return out.filter(([p, q]) => q - p > 0.01);
            });
        }
        for (const [y0, y1] of spans) {
            // Utsiden: mørk fot nederst (fukt og skitt), som på de lukkede husene.
            const bands: [number, number, boolean][] = y0 < FOOT && y1 > FOOT ? [[y0, FOOT, true], [FOOT, y1, false]] : [[y0, y1, y0 < FOOT]];
            for (const [p, q, foot] of bands) {
                // Topp og bunn synes bare i kanten av et hull (overligger og bunnstokk).
                const skip: ('top' | 'bottom' | 'pz')[] = ['pz'];
                if (q >= top - 0.001) skip.push('top');
                if (p <= SVILL_Y + 0.001) skip.push('bottom');
                k.withTint(foot ? { ...t, bottom: t.top * 0.55 } : t, () =>
                    k.box('laft', mid, (p + q) / 2, T / 2, b - a, q - p, T, { skip, shadeFoot: foot })
                );
            }
            k.withTint(SOT, () => k.box('laft', mid, (y0 + y1) / 2, T / 2, b - a, y1 - y0, T, { skip: ['top', 'bottom', 'nz', 'px', 'nx'], shadeFoot: true }));
            c.box(mid, (y0 + y1) / 2, T / 2, b - a, y1 - y0, T);
        }
    }
    // Stripa mellom veggtoppen og taket på innsiden.
    if (innerTop > top) {
        k.withTint({ ...SOT, bottom: SOT.top }, () =>
            k.box('laft', 0, (top + innerTop) / 2, T / 2, len, innerTop - top, T, { skip: ['top', 'bottom', 'nz', 'px', 'nx'] })
        );
    }
}

/** Hullene i en langvegg (side ±1), i veggens egen x. */
function langveggHull(s: HouseSpec, side: -1 | 1): Hull[] {
    const lx = (z: number) => (side > 0 ? z - s.l / 2 : s.l / 2 - z);
    const out: Hull[] = [];
    for (const d of s.doors ?? []) if (d.side === side && d.open) out.push({ x: lx(d.z), w: DOR_W, y0: SVILL_Y, h: DOR_H });
    for (const g of s.glugger ?? []) if (g.side === side && g.open && g.floor === 0) out.push({ x: lx(g.at), w: 0.6, y0: 1.1, h: 0.55 });
    return out;
}

export const DOR_W = 1.05;
export const DOR_H = 1.9;

/**
 * Laftekroppen med rom inni: svill rundt, fire vegger, golv, innergavler og åser.
 * Erstatter den lukkede kroppen for hus med `inne`.
 */
export function laftKroppInne(k: MeshKit, c: ColliderKit, s: HouseSpec): void {
    const T = WALL_T;
    const t = s.tint;
    const h = eaveY(s);
    const rise = riseOf(s);
    // Veggen inne går opp til der taket treffer innsiden av veggen.
    const innerTop = h + T * s.pitch + 0.03;

    // Svillen: fire stokker langs veggene. Under en åpen dør er den dørstokken.
    k.withTint({ ...t, top: t.top * 0.7 }, () => {
        for (const sx of [-1, 1]) k.box('raatre', sx * (s.w / 2 - T / 2 + 0.015), SVILL_Y / 2, s.l / 2, T + 0.06, SVILL_Y, s.l + 0.06, { skip: ['bottom'] });
        for (const z of [T / 2 - 0.015, s.l - T / 2 + 0.015]) k.box('raatre', 0, SVILL_Y / 2, z, s.w - T * 2, SVILL_Y, T + 0.06, { skip: ['bottom'] });
    });

    // Langveggene over hele lengden, gavlveggene imellom (ellers kniver flatene i hjørnene).
    for (const side of [-1, 1] as const) {
        k.at(side * (s.w / 2), 0, s.l / 2, side > 0 ? -Math.PI / 2 : Math.PI / 2, () => vegg(k, c, s, s.l, langveggHull(s, side), h, innerTop));
    }
    k.at(0, 0, 0, 0, () => vegg(k, c, s, s.w - T * 2, [], h, innerTop));
    k.at(0, 0, s.l, Math.PI, () => vegg(k, c, s, s.w - T * 2, [], h, innerTop));

    // Golvet: gamle bord, mørke av sot og skitt. Kollideren fyller under, så golvet bærer.
    k.withTint({ top: 0.55, bottom: 0.55, hue: [1, 0.95, 0.9] }, () =>
        k.box('dekke', 0, GOLV_Y - 0.05, s.l / 2, s.w - T * 2, 0.1, s.l - T * 2, { skip: ['bottom'], grain: 'x' })
    );
    c.box(0, (GOLV_Y - 1) / 2, s.l / 2, s.w, 1 + GOLV_Y, s.l);

    // Innergavlene: trekanten over veggtoppen, sett innenfra.
    const hw = s.w / 2 - T;
    const y0 = innerTop;
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
 * Døra som står åpen inn i et rom: dørbladet slått inn mot veggen innenfor, hengslet på venstre
 * side sett utenfra. Samme rom som `dor` (veggen i z = 0, utsiden -z).
 */
export function dorbladInne(k: MeshKit, c: ColliderKit): void {
    const t = k.tint;
    const x = -DOR_W / 2 + 0.03;
    const z = WALL_T + DOR_W / 2 - 0.02;
    k.withTint({ ...t, top: t.top * 1.1, hue: [1.06, 1.0, 0.9] }, () =>
        k.box('bordvegg', x, SVILL_Y + DOR_H / 2, z, 0.04, DOR_H - 0.02, DOR_W - 0.04)
    );
    c.box(x, SVILL_Y + DOR_H / 2, z, 0.06, DOR_H, DOR_W - 0.04, true);
}
