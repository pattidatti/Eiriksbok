// Ting som rører seg: skilt som svinger i vinden, luker og dører som åpnes om morgenen og lukkes om
// kvelden, en vugge som gynger, bunter som heises opp i gavlen, og klesvask som blafrer på snora.
//
// Hver del er en liten egen mesh med hengselet i origo (`Uro`). Den koster ett tegnekall per materiale,
// så cellene har få av dem, og de står stille og skjules bak `UTE` meter. Klesvasken er ikke deler: den
// er seilduk (`seil`-materialet, seilduk.ts) i cellas vanlige geometri, og vinden i shaderen blåser den
// uten at noe regnes ut her.
//
// Vinden (`vind()`) kommer fra været: et grunnpust, mer når det trekker over, mest i regnet, og vindkast
// oppå. Hvordan skilt, vasksnorer og vugger så ut i Bergen i 1420-årene, er ikke funnet [K]; formene er
// valgt for spillet [S].
import * as THREE from 'three';
import { MeshKit } from '../motor/meshkit';
import type { Materials } from '../motor/materials';
import { fase, type Fase } from './dagsplan';
import { toGroup } from './gard';

let vaer: (() => { dekke: number; regn: number }) | null = null;

/** Spillet kobler været hit (graboks/strandliv.ts). */
export function koblVind(f: () => { dekke: number; regn: number }): void {
    vaer = f;
}

/** Vinden nå (0-1,3): grunnpust etter været, med kast oppå. `t` i sekunder. */
export function vind(t: number): number {
    const v = vaer?.() ?? { dekke: 0.3, regn: 0 };
    const grunn = 0.25 + 0.35 * v.dekke + 0.45 * v.regn;
    const kast = 0.5 + 0.5 * Math.sin(t * 0.37) * Math.sin(t * 0.23 + 1.3);
    return grunn * (0.65 + 0.7 * kast);
}

/** Bak dette (fra kameraet) står delene stille og skjules. */
const UTE = 40;

interface Del {
    obj: THREE.Object3D;
    tick: (t: number, dt: number, v: number) => void;
}

export class Uro {
    readonly group = new THREE.Group();
    private readonly deler: Del[] = [];
    private readonly mats: Materials;

    constructor(mats: Materials, navn = 'uro') {
        this.mats = mats;
        this.group.name = navn;
    }

    /** Lag en del: `fn` bygger i delens rom (hengselet i origo), som så står ved `pos` dreid `rotY`. */
    private lag(pos: THREE.Vector3, rotY: number, fn: (k: MeshKit) => void): { rot: THREE.Group; vend: THREE.Group } {
        const k = new MeshKit();
        fn(k);
        const vend = new THREE.Group();
        vend.position.copy(pos);
        vend.rotation.y = rotY;
        const rot = toGroup(k, this.mats, `${this.group.name}:del`);
        vend.add(rot);
        this.group.add(vend);
        return { rot, vend };
    }

    /**
     * Noe som henger og svinger i vinden (et skilt, en lykt, en bunt fisk). Bygg det hengende ned fra
     * origo; det svinger rundt `akse` i delens rom (et skilt i en arm langs z svinger rundt armen: 'z').
     */
    pendel(pos: THREE.Vector3, rotY: number, fn: (k: MeshKit) => void, amp = 0.28, takt = 1.7, akse: 'x' | 'z' = 'x'): void {
        const { rot, vend } = this.lag(pos, rotY, fn);
        const f = (pos.x * 0.37 + pos.z * 0.71) % 6.28;
        let v = 0;
        let a = 0;
        this.deler.push({
            obj: vend,
            tick: (t, dt, vi) => {
                // En fjær med demping, dyttet av vinden og kastene: svinger og roer seg igjen.
                const kraft = vi * amp * (0.55 + 0.45 * Math.sin(t * takt * 0.53 + f)) + vi * amp * 0.5 * Math.sin(t * takt * 1.9 + f * 2);
                const acc = takt * takt * (kraft - a) - 1.1 * v;
                v += acc * dt;
                a += v * dt;
                rot.rotation[akse] = a;
            },
        });
    }

    /** Noe som gynger av seg selv (en vugge): rundt z i delens rom, med egen takt. */
    gynge(pos: THREE.Vector3, rotY: number, fn: (k: MeshKit) => void, amp = 0.12, takt = 2.2, aktiv: () => boolean = () => true): void {
        const { rot, vend } = this.lag(pos, rotY, fn);
        let s = 0;
        let fase0 = 0;
        this.deler.push({
            obj: vend,
            tick: (_t, dt) => {
                s += ((aktiv() ? 1 : 0) - s) * Math.min(1, dt * 0.6);
                fase0 += dt * takt;
                rot.rotation.z = Math.sin(fase0) * amp * s;
            },
        });
    }

    /**
     * En luke eller dør på et hengsel (loddrett akse i origo). `aapen` er vinkelen når den står åpen.
     * `naar` er delene av dagen den står åpen (en glugg-luke), eller en funksjon som sier om den skal
     * være åpen nå (en dør som går opp når noen kommer). Slår litt i vinden når den står åpen. Bygg
     * den lukket, med bladet fra hengselet langs +x.
     */
    luke(pos: THREE.Vector3, rotY: number, fn: (k: MeshKit) => void, aapen: number, naar: Fase[] | (() => boolean)): void {
        const { rot, vend } = this.lag(pos, rotY, fn);
        const forskyv = ((pos.x * 13.1 + pos.z * 7.7) % 40) - 20;
        const skal = typeof naar === 'function' ? naar : () => naar.includes(fase(forskyv));
        const fart = typeof naar === 'function' ? 2.2 : 0.8;
        let vinkel = skal() ? aapen : 0;
        const f = (pos.x * 0.53 + pos.z * 0.29) % 6.28;
        this.deler.push({
            obj: vend,
            tick: (t, dt, vi) => {
                const vil = skal() ? aapen : 0;
                vinkel += THREE.MathUtils.clamp(vil - vinkel, -dt * fart, dt * fart);
                const slark = vil !== 0 ? vi * 0.06 * Math.sin(t * 1.3 + f) * Math.sin(t * 0.41 + f) : 0;
                rot.rotation.y = vinkel + slark * Math.sign(aapen);
            },
        });
    }

    /**
     * En bunt som heises opp under vinsjen i gavlen og tas inn, og en ny som heises (om dagen). Bygg
     * bunten med toppen i origo. `tau` får lengden fra trinsa til bunten.
     */
    heis(trinse: THREE.Vector3, rotY: number, fn: (k: MeshKit) => void, bunnY: number, aktiv: Fase[]): void {
        const { rot, vend } = this.lag(trinse, rotY, fn);
        // Tauet: en tynn stokk med lengde 1, skalert i høyden.
        const tk = new MeshKit();
        tk.withTint({ top: 0.5, bottom: 0.5, hue: [1.05, 0.95, 0.8] }, () => tk.log('mork', new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 0), 0.012, 4, false));
        const tau = toGroup(tk, this.mats, `${this.group.name}:tau`, false);
        vend.add(tau);
        const fall = trinse.y - bunnY;
        const f = (trinse.x * 0.7 + trinse.z * 0.3) % 1;
        let t0 = f * 40;
        this.deler.push({
            obj: vend,
            tick: (_t, dt, vi) => {
                t0 += dt;
                // Syklus på 40 s: henger nede (lastes), heises (12 s), henger oppe (tas inn), borte en stund.
                const s = t0 % 40;
                const paa = aktiv.includes(fase());
                let h = 0;
                let synlig = paa;
                if (s < 6) h = 0;
                else if (s < 18) h = THREE.MathUtils.smoothstep(s, 6, 18);
                else if (s < 23) h = 1;
                else synlig = false;
                const y = -fall * (1 - h) - 0.6;
                rot.position.y = y;
                rot.visible = synlig;
                rot.rotation.z = Math.sin(t0 * 1.9) * 0.05 * vi * h;
                rot.rotation.y = Math.sin(t0 * 0.4) * 0.3;
                tau.scale.set(1, synlig ? -y : 0.6, 1);
                tau.visible = true;
            },
        });
    }

    /** Hvert bilde (fra cellas `tick`). */
    tick(t: number, dt: number, kamera: THREE.Vector3): void {
        const v = vind(t);
        for (const d of this.deler) {
            const naer = d.obj.position.distanceToSquared(kamera) < UTE * UTE;
            d.obj.visible = naer;
            if (naer) d.tick(t, dt, v);
        }
    }

    dispose(): void {
        this.group.traverse((o) => {
            if (o instanceof THREE.Mesh) o.geometry.dispose();
        });
    }
}

/**
 * Klesvask på ei snor mellom to stolper (`a` og `b` på bakken, snora langs x). Plaggene er seilduk:
 * vinden i shaderen blåser dem (seilduk.ts), med v = 1 ved snora. Bygges i cellas egen `MeshKit` (`k.matrix` gjelder, men snora skal gå langs x i verden: vinden
 * blåser langs +z).
 */
export function klesvask(k: MeshKit, a: THREE.Vector3, b: THREE.Vector3, r: () => number, hoyde = 1.8): void {
    const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    k.withTint({ top: 0.6, bottom: 0.55, hue: [1, 0.95, 0.88] }, () => {
        for (const p of [a, b]) k.log('raatre', V(p.x, -0.05, p.z), V(p.x, hoyde + 0.15, p.z), 0.045, 5, true);
    });
    const len = b.x - a.x;
    const henge = (u: number) => hoyde - 0.12 * Math.sin(Math.PI * u);
    k.withTint({ top: 0.5, bottom: 0.5, hue: [1.05, 0.95, 0.8] }, () => {
        const N = 6;
        for (let i = 0; i < N; i++) {
            const u0 = i / N;
            const u1 = (i + 1) / N;
            k.log('mork', V(a.x + len * u0, henge(u0), a.z), V(a.x + len * u1, henge(u1), a.z), 0.008, 3, false);
        }
    });
    // Plaggene: ufarget lin og vadmel, et blått og et rødbrunt [S].
    const FARGER: [number, number, number][] = [[1, 0.97, 0.9], [0.95, 0.9, 0.8], [0.62, 0.7, 0.9], [0.85, 0.6, 0.5], [0.8, 0.78, 0.7]];
    let x = 0.35;
    while (x < len - 0.4) {
        const w = 0.35 + r() * 0.5;
        if (x + w > len - 0.2) break;
        const h = 0.45 + r() * 0.55;
        const hue = FARGER[Math.floor(r() * FARGER.length)];
        const u0 = 0.32 + r() * 0.25;
        const top0 = henge(x / len);
        const top1 = henge((x + w) / len);
        const NI = 2;
        const NJ = 4;
        const P = (i: number, j: number) => {
            const s = i / NI;
            const y = THREE.MathUtils.lerp(top0, top1, s) - h * (1 - j / NJ);
            return V(a.x + x + w * s, y, a.z + 0.005);
        };
        const uv = (i: number, j: number): [number, number] => [u0 + (i / NI) * 0.12, j / NJ];
        k.withTint({ top: 1, bottom: 1, hue }, () => {
            for (const side of [1, -1]) {
                const b0 = k.bucket('seil');
                const base = b0.vertexCount;
                const n = V(0, 0, side).applyMatrix3(new THREE.Matrix3().getNormalMatrix(k.matrix)).normalize();
                for (let i = 0; i <= NI; i++) {
                    for (let j = 0; j <= NJ; j++) {
                        const p = P(i, j).setZ(P(i, j).z + side * 0.004).applyMatrix4(k.matrix);
                        const [uu, vv] = uv(i, j);
                        b0.pos.push(p.x, p.y, p.z);
                        b0.nor.push(n.x, n.y, n.z);
                        b0.uv.push(uu, vv);
                        const sh = 0.9 + 0.1 * (j / NJ);
                        b0.col.push(sh * hue[0], sh * hue[1], sh * hue[2]);
                    }
                }
                const idx = (i: number, j: number) => base + i * (NJ + 1) + j;
                for (let i = 0; i < NI; i++) {
                    for (let j = 0; j < NJ; j++) {
                        if (side > 0) b0.idx.push(idx(i, j), idx(i + 1, j), idx(i + 1, j + 1), idx(i, j), idx(i + 1, j + 1), idx(i, j + 1));
                        else b0.idx.push(idx(i, j), idx(i + 1, j + 1), idx(i + 1, j), idx(i, j), idx(i, j + 1), idx(i + 1, j + 1));
                    }
                }
            }
        });
        x += w + 0.08 + r() * 0.25;
    }
}
