// Nordnes: neset på den andre siden av Vågen, ytterst mot havet, sett fra Bryggen som en ås i tåka.
//
// Det vi vet [V §5.2]: Munkeliv kloster lå på Nordnes, grunnlagt 1107-1110. Birgittinerne (en orden
// med både nonner og munker) overtok det i 1420-årene, og det brant i 1455. Byens rettersted lå nær
// Margaretakirken på nordøstsiden av neset i middelalderen. Hvordan klosteret så ut, er ikke funnet
// [K]: her er det en steinkirke med tårn og tre lange hus rundt en klostergård [S]. Retterstedet er
// ikke med. Formen på åsen, husene ned mot sjøen og avstandene er valgt for spillet [S].
//
// Alt er langt unna (over 120 m fra kaia), så alt er i flat farge i ett tegnekall med tynnere tåke
// (`fjernLand`): en blek silhuett i disen, som fjellene bak. Ingen kollidere: båten stoppes av grensa.
import * as THREE from 'three';
import { MeshKit } from '../motor/meshkit';
import type { Materials } from '../motor/materials';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Strandkanten på Nordnes-sida: rett bak grensa for båten (z = -120), som Stranden. */
const STRAND = -123;

/**
 * Lager Nordnes fra `x0` (der Stranden slutter) og ut mot havet, og åsen bak Stranden tilbake til
 * `xBak` (bunnen av Vågen). Klosteret står i lia.
 */
export function lagNordnes(mats: Materials, x0: number, xBak: number): THREE.Mesh {
    const k = new MeshKit();
    const x1 = x0 + 170;
    const farge = (key: Parameters<Materials['lodColor']>[0], f = 1) => mats.lodColor(key).multiplyScalar(f);
    const lyng = farge('torv', 0.85);
    const jord = farge('gjorme', 1.0);
    const stein = farge('stein', 1.05);
    const laft = farge('laft', 0.9);
    const torv = farge('torv', 1.0);
    const bord = farge('bordtak', 1.1);

    // Åsen: lav ved Stranden, høyest et stykke ut, og faller mot havet ytterst. Litt ujevn.
    const kloster = { x: x0 + 55, z: -150, y: 0 };
    const hoyde = (x: number, z: number): number => {
        const u = (x - x0) / (x1 - x0);
        // Ute på neset: stiger fra Stranden, høyest et stykke ut, og går ned i sjøen ytterst.
        const fram = Math.sin(Math.min(1, Math.max(0, u) * 1.6) * Math.PI * 0.5) * (1 - THREE.MathUtils.smoothstep(u, 0.62, 1));
        // Bak Stranden: åsen fortsetter innover land, lenger fra sjøen.
        const bak = 0.62 + 0.12 * Math.sin(x * 0.031);
        const b = THREE.MathUtils.smoothstep(u, -0.02, 0.28);
        const langs = THREE.MathUtils.lerp(bak, fram, b);
        const inn = THREE.MathUtils.lerp(THREE.MathUtils.smoothstep(-z, 163, 205), THREE.MathUtils.smoothstep(-z, -(STRAND - 3), -(STRAND - 45)), b);
        let h = 0.3 + 40 * langs * inn + Math.sin(x * 0.07) * Math.cos(z * 0.09) * 2.2 * inn;
        // En hylle i lia der klosteret står.
        const d = Math.hypot((x - kloster.x) / 34, (z - kloster.z) / 20);
        if (d < 1) h = THREE.MathUtils.lerp(kloster.y || h, h, THREE.MathUtils.smoothstep(d, 0.55, 1));
        return h;
    };
    kloster.y = hoyde(kloster.x, kloster.z) * 0.92;

    const G = 7;
    const z0 = STRAND;
    const z1 = STRAND - 133;
    const col = (q: THREE.Vector3) => {
        // Jord og tang i fjæra, lyng og gress oppover.
        const t = THREE.MathUtils.smoothstep(q.y, 0.5, 4);
        return new THREE.Color().copy(jord).lerp(lyng, t);
    };
    /** Et rutenett av trekanter fra (xa, za) innover; samme rutenett som naboen der de møtes. */
    const rutenett = (xa: number, xb: number, za: number) => {
        const nx = Math.round((xb - xa) / G);
        const nz = Math.round((za - z1) / G);
        const p = (i: number, j: number) => {
            const x = xa + i * G;
            const z = za - j * G;
            return V(x, hoyde(x, z), z);
        };
        for (let i = 0; i < nx; i++) {
            for (let j = 0; j < nz; j++) {
                const a = p(i, j);
                const b = p(i + 1, j);
                const c = p(i + 1, j + 1);
                const d = p(i, j + 1);
                const ca = col(a);
                k.withTint({ top: 1, bottom: 1, hue: [ca.r, ca.g, ca.b] }, () => {
                    // Rekkefølgen gir normalen opp (mot +y).
                    k.tri('mork', a, b, c, [0, 0], [0, 0], [0, 0], [1, 0.95, 1]);
                    k.tri('mork', a, c, d, [0, 0], [0, 0], [0, 0], [1, 1.05, 0.95]);
                });
            }
        }
    };
    rutenett(x0, x1, z0);
    // Bak Stranden (som har sin egen flate bakke ned mot sjøen) starter åsen lenger inne.
    rutenett(x0 - Math.ceil((x0 - xBak) / G) * G, x0, z0 - 6 * G);
    // Fjæra: en skrå kant ned i vannet langs hele neset.
    k.withTint({ top: 0.8, bottom: 0.8, hue: [jord.r, jord.g, jord.b] }, () =>
        k.quad('mork', V(x0, -2.2, STRAND + 3), V(x1 - x0, 0, 0), V(0, 2.5, -3), [0, 0], [0.6, 1])
    );

    const boks = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, c: THREE.Color, rot = 0) =>
        k.at(cx, cy, cz, rot, () => k.withTint({ top: 1, bottom: 1, hue: [c.r, c.g, c.b] }, () => k.box('mork', 0, sy / 2, 0, sx, sy, sz, { skip: ['bottom'] })));
    const saltak = (cx: number, cy: number, cz: number, l: number, b: number, rise: number, c: THREE.Color, rot = 0) =>
        k.at(cx, cy, cz, rot, () => {
            k.withTint({ top: 1, bottom: 1, hue: [c.r, c.g, c.b] }, () => {
                const hw = b / 2 + 0.3;
                // Rekkefølgen gir normalene ut og opp.
                k.quad('mork', V(-l / 2, 0, -hw), V(0, rise, hw), V(l, 0, 0));
                k.quad('mork', V(l / 2, 0, hw), V(0, rise, -hw), V(-l, 0, 0));
                k.tri('mork', V(-l / 2, 0, -hw), V(-l / 2, 0, hw), V(-l / 2, rise, 0), [0, 0], [0, 0], [0, 0]);
                k.tri('mork', V(l / 2, 0, hw), V(l / 2, 0, -hw), V(l / 2, rise, 0), [0, 0], [0, 0], [0, 0]);
            });
        });

    // Munkeliv: kirka med vesttårn og klostergården sør for den (mot Vågen).
    {
        const { x, y, z } = kloster;
        const r = 0.12;
        boks(x, y - 2, z, 26, 11.5, 11, stein, r);
        saltak(x, y + 9.5, z, 26, 11, 5.5, bord, r);
        const tx = x - Math.cos(r) * 16.5;
        const tz = z + Math.sin(r) * 16.5;
        boks(tx, y - 2, tz, 7, 24, 7, stein, r);
        k.at(tx, y + 22, tz, r, () => k.withTint({ top: 1, bottom: 1, hue: [bord.r, bord.g, bord.b] }, () => {
            const top = V(0, 7, 0);
            const hw = 3.8;
            const c = [V(-hw, 0, -hw), V(hw, 0, -hw), V(hw, 0, hw), V(-hw, 0, hw)];
            for (let i = 0; i < 4; i++) k.tri('mork', c[(i + 1) % 4], c[i], top, [0, 0], [0, 0], [0, 0]);
        }));
        // Klosterhusene rundt gården, på sjøsida av kirka.
        for (const [dx, dz, l, rot] of [[0, 15, 26, 0], [-11, 8, 12, Math.PI / 2], [11, 8, 12, Math.PI / 2]] as const) {
            const hx = x + Math.cos(r) * dx + Math.sin(r) * dz;
            const hz = z - Math.sin(r) * dx + Math.cos(r) * dz;
            boks(hx, y - 2, hz, l, 8, 6.5, dz === 15 ? stein : laft, r + rot);
            saltak(hx, y + 6, hz, l, 6.5, 3.5, dz === 15 ? bord : torv, r + rot);
        }
    }

    // Hus ned mot sjøen innerst på neset, der det møter Stranden: naust og laftehus.
    let s = 77;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let x = x0 + 8; x < x0 + 110; x += 9 + rnd() * 12) {
        const naust = rnd() < 0.5;
        const z = STRAND - 3 - rnd() * 10;
        const y = hoyde(x, z) - 0.4;
        const l = naust ? 9 : 7;
        const b = naust ? 6 : 5.5;
        boks(x, y, z - l / 2, b, naust ? 2.6 : 3.4, l, laft, Math.PI / 2 + (rnd() - 0.5) * 0.2);
        saltak(x, y + (naust ? 2.6 : 3.4), z - l / 2, l, b, b * 0.42, torv, Math.PI / 2);
    }

    const mesh = new THREE.Mesh(k.bucket('mork').toGeometry(), mats.fjernLand());
    mesh.name = 'nordnes';
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
}
