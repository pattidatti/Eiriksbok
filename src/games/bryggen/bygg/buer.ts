// Murer med ekte hull: portaler, buer og vinduer man kan gå eller se gjennom.
//
// Kirkene og borgen var kulisser med mørke flater der dørene og vinduene skulle stå. Nå kan man gå
// inn, og da må hullene gå tvers gjennom muren. En mur bygges i sitt eget rom: x langs muren, y opp
// og tykkelsen rundt z = 0 (flatene i z = ±t/2). Over hvert hull står en bue, rund (romansk) eller
// spiss (gotisk). Buen er trekanter på begge flatene og en hvelvet underside gjennom muren.
import * as THREE from 'three';
import type { ColliderKit, MatKey, MeshKit } from '../motor/meshkit';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Et hull i muren: midten langs muren (`u`), bunnen (`y0`), bredden og høyden opp til buen. */
export interface Hull {
    u: number;
    y0: number;
    w: number;
    h: number;
    bue?: 'rund' | 'spiss';
}

/** Hvor høy buen over et hull er. */
export const bueHoyde = (h: Hull): number => (h.bue === 'spiss' ? h.w * 0.9 : h.w / 2);

/** Buen fra venstre vederlag over toppen til høyre, og hvilket punkt som er toppen. */
function profil(h: Hull): { p: THREE.Vector2[]; topp: number } {
    const r = h.w / 2;
    const ys = h.y0 + h.h;
    if (h.bue === 'spiss') {
        return { p: [new THREE.Vector2(h.u - r, ys), new THREE.Vector2(h.u, ys + bueHoyde(h)), new THREE.Vector2(h.u + r, ys)], topp: 1 };
    }
    const seg = 8;
    const p: THREE.Vector2[] = [];
    for (let i = 0; i <= seg; i++) {
        const a = Math.PI - (i / seg) * Math.PI;
        p.push(new THREE.Vector2(h.u + Math.cos(a) * r, ys + Math.sin(a) * r));
    }
    return { p, topp: seg / 2 };
}

/** Trekant med normalen mot `n`, uansett hvilken vei hjørnene kom inn. `tri` leser ikke tint.top. */
export function triMot(k: MeshKit, key: MatKey, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, n: THREE.Vector3, uv: (p: THREE.Vector3) => [number, number]): void {
    const nn = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a));
    const s = k.tint.top;
    if (nn.dot(n) < 0) k.tri(key, a, c, b, uv(a), uv(c), uv(b), [s, s, s]);
    else k.tri(key, a, b, c, uv(a), uv(b), uv(c), [s, s, s]);
}

/** Firkant med normalen mot `n`. */
function quadMot(k: MeshKit, key: MatKey, o: THREE.Vector3, ua: THREE.Vector3, va: THREE.Vector3, n: THREE.Vector3): void {
    const s = k.tint.top;
    if (new THREE.Vector3().crossVectors(ua, va).dot(n) < 0) k.quad(key, o, va, ua, [0, 0], [s, s]);
    else k.quad(key, o, ua, va, [0, 0], [s, s]);
}

export interface MurOpts {
    /** Mørk fot nederst på murflatene (regnsprut). */
    fot?: boolean;
    /** Tegn endene av muren (av der den møter en annen mur). */
    ender?: boolean;
    /** Flater som aldri synes: 'pz' eller 'nz' (den ene siden av muren). */
    skip?: ('pz' | 'nz')[];
}

/**
 * En mur fra `u0` til `u1` langs x og fra `y0` til `y1`, `t` tykk, med hull tvers gjennom.
 * Kolliderne er bokser: mellom hullene, under dem og over vederlaget (buen trengs ikke for å
 * stoppe noen). Hullene må ikke overlappe hverandre eller endene.
 */
export function murMedHull(k: MeshKit, c: ColliderKit | null, key: MatKey, u0: number, u1: number, y0: number, y1: number, t: number, hull: Hull[], o: MurOpts = {}): void {
    const sortert = [...hull].sort((a, b) => a.u - b.u);
    const ender = o.ender ?? true;
    const skip = o.skip ?? [];
    const boks = (a: number, b: number, ya: number, yb: number, sider: ('top' | 'bottom' | 'px' | 'nx')[] = []) => {
        if (b - a < 0.005 || yb - ya < 0.005) return;
        k.box(key, (a + b) / 2, (ya + yb) / 2, 0, b - a, yb - ya, t, { skip: [...sider, ...skip], shadeFoot: o.fot && ya <= y0 + 0.01 });
        c?.box((a + b) / 2, (ya + yb) / 2, 0, b - a, yb - ya, t);
    };
    // Søylene mellom hullene, i full høyde. Sidene mot et hull er hullets vanger.
    let a = u0;
    sortert.forEach((h, i) => {
        const b = h.u - h.w / 2;
        boks(a, b, y0, y1, ['bottom', ...(i === 0 && !ender ? ['nx' as const] : [])]);
        a = h.u + h.w / 2;
    });
    boks(a, u1, y0, y1, ['bottom', ...(!ender ? ['px' as const] : []), ...(sortert.length === 0 && !ender ? ['nx' as const] : [])]);

    for (const h of sortert) {
        const l = h.u - h.w / 2;
        const r = h.u + h.w / 2;
        const ys = h.y0 + h.h;
        const topp = ys + bueHoyde(h);
        // Brystningen under et vindu, og muren over buen.
        boks(l, r, y0, h.y0, ['bottom', 'px', 'nx']);
        if (topp < y1) {
            k.box(key, h.u, (topp + y1) / 2, 0, h.w, y1 - topp, t, { skip: ['bottom', 'px', 'nx', ...skip] });
        }
        c?.box(h.u, (ys + y1) / 2, 0, h.w, y1 - ys, t);

        // Svikler: trekantvifter fra hjørnene over buen ned til buelinja, på begge flatene.
        const { p, topp: ti } = profil(h);
        for (const side of [1, -1] as const) {
            if (skip.includes(side > 0 ? 'pz' : 'nz')) continue;
            const z = (side * t) / 2;
            const n = V(0, 0, side);
            const uv = (q: THREE.Vector3): [number, number] => [q.x, q.y];
            const A = V(l, topp, z);
            const B = V(r, topp, z);
            for (let i = 0; i < p.length - 1; i++) {
                const hj = i < ti ? A : B;
                triMot(k, key, hj, V(p[i].x, p[i].y, z), V(p[i + 1].x, p[i + 1].y, z), n, uv);
            }
        }
        // Undersiden av buen: firkanter gjennom muren, med normalen ned i hullet.
        const midt = new THREE.Vector2(h.u, ys);
        for (let i = 0; i < p.length - 1; i++) {
            const s0 = p[i];
            const s1 = p[i + 1];
            const m = s0.clone().add(s1).multiplyScalar(0.5);
            const d = s1.clone().sub(s0);
            let n = new THREE.Vector2(d.y, -d.x);
            if (n.dot(midt.clone().sub(m)) < 0) n = n.negate();
            quadMot(k, key, V(s0.x, s0.y, -t / 2), V(d.x, d.y, 0), V(0, 0, t), V(n.x, n.y, 0));
        }
    }
}
