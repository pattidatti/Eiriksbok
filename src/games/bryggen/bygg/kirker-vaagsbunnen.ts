// Kirkene i Vågsbunnen: ruinen av Mikaelskirken bak verkstedene, og Korskirken som landemerke der
// Skostredet svinger rundt bunnen av Vågen.
//
// Mikaelskirken [V Wikipedia «Vågsbunnen»]: av stein, sognekirke for de tyske skomakerne. Den brant
// i 1393 og igjen i 1413, og ble ikke bygget opp igjen. I 1420-årene var den altså en brent ruin.
// Hvor stor den var, hvordan den så ut og hvor mye av murene som sto, er ikke funnet [K], så målene,
// tårnstubben og murene som er rast ned, er valgt for spillet [S].
//
// Korskirken [V Wikipedia]: reist på «et lite nes» i Vågsbunnen (Eyrastein), og står fortsatt. Hvordan
// den så ut i 1420-årene (før brannene og ombyggingene senere), er ikke sjekket [K]. Her er den en
// enkel steinkirke med vesttårn [S], laget for å synes over takene.
//
// Begge bygges i eget rom: x langs skipet (koret mot +x), z på tvers, y opp fra bakken.
import * as THREE from 'three';
import type { ColliderKit, MeshKit, Tint } from '../motor/meshkit';
import { STEIN, TAK } from './stein';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Sotet stein: mørkere oppover der flammene slikket murene. */
const SOTET: Tint = { top: 0.55, bottom: 0.78, hue: [0.88, 0.9, 0.9] };

/** Et frø for murkronene, så ruinen er lik hver gang. */
function lagRng(seed: number): () => number {
    let s = seed;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/**
 * En mur som har rast: søyler av stein med ujevn topp, og hull der vinduene var. `hull` er
 * strekninger langs muren uten stein (fra golvet, som en dør, eller fra `y`, som et vindu).
 */
function ruinmur(
    k: MeshKit, c: ColliderKit, a: THREE.Vector2, b: THREE.Vector2, tykk: number, hMin: number, hMax: number, r: () => number,
    hull: { u0: number; u1: number; y: number }[] = []
): void {
    const len = a.distanceTo(b);
    const dir = new THREE.Vector2().subVectors(b, a).normalize();
    const rot = Math.atan2(-dir.y, dir.x);
    const n = Math.max(1, Math.round(len / 0.9));
    const bit = len / n;
    let h = (hMin + hMax) / 2;
    k.at(a.x, 0, a.y, rot, () => {
        for (let i = 0; i < n; i++) {
            const u = (i + 0.5) * bit;
            // Kronen vandrer opp og ned: hele partier har rast, andre står nesten til takfoten.
            h = THREE.MathUtils.clamp(h + (r() - 0.5) * 1.6, hMin, hMax);
            const hh = hull.find((q) => u > q.u0 && u < q.u1);
            if (hh && hh.y <= 0.01) continue;
            const top = hh ? Math.min(h, hh.y) : h;
            k.withTint(SOTET, () => k.box('stein', u, top / 2, 0, bit + 0.02, top, tykk, { skip: ['bottom'], shadeFoot: true }));
            if (hh && h > hh.y + 1.6) k.withTint(SOTET, () => k.box('stein', u, (hh.y + 1.6 + h) / 2, 0, bit + 0.02, h - hh.y - 1.6, tykk, { skip: ['bottom'] }));
            c.box(u, Math.max(top, 1.2) / 2, 0, bit, Math.max(top, 1.2), tykk);
        }
    }, c);
}

/**
 * Ruinen av Mikaelskirken: skip og kor uten tak, en tårnstubbe i vest, steinrøys og forkullede
 * bjelker inne. Kan gås inn i gjennom vestportalen og hullene i muren.
 */
export function mikaelskirken(k: MeshKit, c: ColliderKit, r = lagRng(1413)): void {
    const S = { l: 17, b: 9, t: 1.0 };
    const K = { l: 7, b: 6.5 };
    const P = (x: number, z: number) => new THREE.Vector2(x, z);
    const x0 = -S.l / 2;
    const x1 = S.l / 2;
    const zb = S.b / 2;
    // Skipet: langmurene med to vinduer hver, vestmuren med portalen (ved tårnet).
    ruinmur(k, c, P(x0, -zb), P(x1, -zb), S.t, 2.2, 6.5, r, [{ u0: 4, u1: 5.2, y: 2.6 }, { u0: 10.5, u1: 11.7, y: 2.6 }, { u0: 13.3, u1: 15.5, y: 0 }]);
    ruinmur(k, c, P(x1, zb), P(x0, zb), S.t, 1.2, 5.8, r, [{ u0: 3.5, u1: 4.7, y: 2.6 }, { u0: 9, u1: 10.2, y: 2.6 }]);
    // Østmuren mot koret: korbuen er et stort hull.
    ruinmur(k, c, P(x1, -zb), P(x1, zb), S.t, 3, 7.5, r, [{ u0: 2.6, u1: 6.4, y: 0 }]);
    // Koret: lavere murer, den ene nesten borte.
    ruinmur(k, c, P(x1, -K.b / 2), P(x1 + K.l, -K.b / 2), 0.9, 1.0, 4.5, r, [{ u0: 3, u1: 4, y: 2.0 }]);
    ruinmur(k, c, P(x1 + K.l, -K.b / 2), P(x1 + K.l, K.b / 2), 0.9, 2.5, 5.5, r, [{ u0: 2.8, u1: 3.7, y: 2.2 }]);
    ruinmur(k, c, P(x1 + K.l, K.b / 2), P(x1, K.b / 2), 0.9, 0.4, 2.0, r);
    // Tårnstubben i vest: står høyest, med portalen gjennom.
    const tw = 6;
    const tx = x0 - tw / 2 + 0.5;
    ruinmur(k, c, P(tx - tw / 2, -tw / 2), P(tx + tw / 2, -tw / 2), 1.2, 6, 9.5, r);
    ruinmur(k, c, P(tx + tw / 2, tw / 2), P(tx - tw / 2, tw / 2), 1.2, 5, 9, r);
    ruinmur(k, c, P(tx - tw / 2, tw / 2), P(tx - tw / 2, -tw / 2), 1.2, 7, 10, r, [{ u0: 2.2, u1: 3.8, y: 0 }]);
    ruinmur(k, c, P(tx + tw / 2, -tw / 2), P(tx + tw / 2, tw / 2), 1.2, 6, 9, r, [{ u0: 2.2, u1: 3.8, y: 0 }]);

    // Steinrøys langs murene inne, og forkullede bjelker som har falt ned fra taket.
    k.withTint({ ...STEIN, top: 0.7, bottom: 0.6 }, () => {
        for (let i = 0; i < 26; i++) {
            const side = r() < 0.5 ? -1 : 1;
            const x = x0 + 1 + r() * (S.l - 2);
            const z = side * (zb - S.t / 2 - 0.4 - r() * 1.2);
            const s = 0.25 + r() * 0.45;
            k.at(x, s * 0.35, z, r() * 3, () => k.box('stein', 0, 0, 0, s * 1.4, s * 0.8, s), undefined);
        }
    });
    k.withTint({ top: 0.16, bottom: 0.16, hue: [1, 0.95, 0.9] }, () => {
        k.log('raatre', V(x0 + 2, 0.15, -1.5), V(x0 + 9, 1.4, 2.6), 0.16, 6);
        k.log('raatre', V(x0 + 7, 0.12, 3.2), V(x0 + 13, 0.12, 1.0), 0.18, 6);
        k.log('raatre', V(x1 - 1.5, 0.2, -3.0), V(x1 - 4.0, 2.2, -zb + 0.6), 0.14, 6);
        k.log('raatre', V(x0 + 3, 0.1, 2.8), V(x0 + 5.5, 0.1, 3.4), 0.12, 6);
    });
    c.box(x0 + 5.5, 0.6, 0.55, 7.5, 1.2, 0.5, true);
    // Gress og ugress på golvet der taket var: lys, grønnlig gjørme.
    k.withTint({ top: 0.85, bottom: 0.85, hue: [0.8, 1.0, 0.65] }, () => k.box('gjorme', 0, 0.02, 0, S.l - 2 * S.t, 0.04, S.b - 2 * S.t, { skip: ['bottom'] }));
}

/**
 * Korskirken som landemerke: skip med saltak, lavere kor i øst og et høyt vesttårn med
 * pyramidetak. Bare utsiden; ingen kollidere (den står bak grensa).
 */
export function korskirken(k: MeshKit): void {
    const S = { l: 22, b: 10, h: 8 };
    const K = { l: 8, b: 7, h: 6 };
    const T = { b: 7, h: 19 };
    const x0 = -S.l / 2;
    const x1 = S.l / 2;
    const vegg = (cx: number, cz: number, sx: number, sz: number, h: number) => k.withTint(STEIN, () => k.box('stein', cx, h / 2, cz, sx, h, sz, { skip: ['bottom'], shadeFoot: true }));
    const saltak = (cx: number, sx: number, b: number, h: number, pitch: number) => {
        const hw = b / 2 + 0.4;
        const rise = (b / 2) * pitch;
        const a = Math.atan(pitch);
        k.withTint(TAK, () => {
            for (const side of [-1, 1]) {
                const m = new THREE.Matrix4().makeRotationX(side * a).setPosition(cx, h + rise / 2, (side * hw) / 2);
                k.slab('bordtak', m, sx + 0.6, 0.1, hw / Math.cos(a));
            }
        });
        k.withTint(STEIN, () => {
            for (const [x, ut] of [[cx - sx / 2, -1], [cx + sx / 2, 1]] as const) {
                const p = [V(x, h, -b / 2), V(x, h, b / 2), V(x, h + rise, 0)];
                if (ut < 0) k.tri('stein', p[0], p[1], p[2], [-b / 2, h], [b / 2, h], [0, h + rise]);
                else k.tri('stein', p[1], p[0], p[2], [b / 2, h], [-b / 2, h], [0, h + rise]);
            }
        });
    };
    vegg(0, 0, S.l, S.b, S.h);
    saltak(0, S.l, S.b, S.h, 0.95);
    vegg(x1 + K.l / 2, 0, K.l, K.b, K.h);
    saltak(x1 + K.l / 2, K.l, K.b, K.h, 0.95);
    const tx = x0 - T.b / 2 + 0.3;
    vegg(tx, 0, T.b, T.b, T.h);
    // Pyramidetaket på tårnet, og lydhull øverst (mørke flater).
    k.withTint(TAK, () => {
        const h = T.h;
        const top = V(tx, h + 7, 0);
        const hw = T.b / 2 + 0.3;
        const c = [V(tx - hw, h, -hw), V(tx + hw, h, -hw), V(tx + hw, h, hw), V(tx - hw, h, hw)];
        for (let i = 0; i < 4; i++) {
            const a = c[i];
            const b = c[(i + 1) % 4];
            k.tri('bordtak', b, a, top, [0, 0], [hw * 2, 0], [hw, 7]);
        }
    });
    for (const [ux, uz, rot] of [[tx, -T.b / 2 - 0.02, Math.PI], [tx, T.b / 2 + 0.02, 0], [tx - T.b / 2 - 0.02, 0, -Math.PI / 2], [tx + T.b / 2 + 0.02, 0, Math.PI / 2]] as const) {
        k.at(ux, 0, uz, rot, () => {
            for (const du of [-1.1, 1.1]) k.quad('mork', V(du - 0.4, T.h - 3.2, 0), V(0.8, 0, 0), V(0, 1.6, 0), [0, 0], [0.12, 0.12]);
        });
    }
    // Vinduer høyt oppe i skipet.
    for (const side of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
            const x = x0 + 3.5 + i * 5;
            k.at(x, 0, side * (S.b / 2 + 0.02), side > 0 ? 0 : Math.PI, () => k.quad('mork', V(-0.4, 4.2, 0), V(0.8, 0, 0), V(0, 1.8, 0), [0, 0], [0.12, 0.12]));
        }
    }
}
