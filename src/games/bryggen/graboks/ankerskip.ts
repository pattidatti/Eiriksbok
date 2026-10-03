// Skip for anker i Vågen som bare finnes mens et kapittel pågår: plyndrernes kogger i 1428
// (kap2.ts), og leidangsskipene og de sju koggene i 1429 (kap3.ts). Felles for begge kapitlene.
//
// Samme modeller som skipene som alltid ligger i Vågen (bygg/skip.ts): koggen med seilet beslått på
// råa, og jekta. Hvert skip er én gruppe som gynger med bølgene, med omrisset i vannlinja (vannet
// tegnes ikke innenfor) og samme skrogkollider som de fortøyde skipene, så færingen ikke ror gjennom.
// `flytt` legger et skip et annet sted (koggene legger seg inntil skipene de angriper i 1429). Et skip som
// er skjult (en filmscene viser sin egen kopi), skjærer ikke hull i vannet.
import * as THREE from 'three';
import { toGroup } from '../bygg/gard';
import { MeshKit, ColliderKit } from '../motor/meshkit';
import { KOGGE, lagKogge } from '../motor/kogge-modell';
import { jektSpec, lagJekt } from '../motor/jekt-modell';
import { raa, skrogKollider, vannlinje, type SkrogSpec } from '../motor/skrog';
import { WATER_Y } from '../motor/boat';
import { vannHoyde, type SkrogFot } from '../motor/vann';
import type { SpillKontekst } from './system';

export interface AnkerDef {
    x: number;
    z: number;
    yaw: number;
    /** Kogge (standard) eller jekt. Jekta får `skala` (1 = ca. 15 m). */
    type?: 'kogge' | 'jekt';
    skala?: number;
}

export interface Ankerskip {
    /** Gruppene i scenen, i samme rekkefølge som definisjonene. Navnet er `<prefiks>-<i>`. */
    grupper: THREE.Group[];
    /** Legg skip `i` et annet sted. */
    flytt(i: number, x: number, z: number, yaw: number): void;
    /** Hvert bilde: gynge med bølgene. */
    bilde(t: number): void;
    dispose(): void;
}

const SEIL = { top: 0.8, bottom: 0.8, hue: [1.04, 0.98, 0.9] as [number, number, number] };

type Kollider = NonNullable<ReturnType<SpillKontekst['phys']['addHull']>>;

interface Skip {
    g: THREE.Group;
    sp: SkrogSpec;
    fot: SkrogFot;
    kol: Kollider[];
    yaw: number;
}

/** Legger skipene i Vågen med en gang. `dispose` tar dem bort igjen. */
export function lagAnkerskip(k: SpillKontekst, prefiks: string, defs: AnkerDef[]): Ankerskip {
    const skip: Skip[] = [];

    function plasser(s: Skip, x: number, z: number, yaw: number): void {
        s.yaw = yaw;
        s.g.position.set(x, WATER_Y - 0.15, z);
        s.g.rotation.y = yaw;
        const vl = vannlinje(s.sp, 0.3);
        Object.assign(s.fot, { x: x + Math.sin(yaw) * vl.forut, z: z + Math.cos(yaw) * vl.forut, yaw, L: vl.L, B: vl.B, fyldig: vl.fyldig });
        for (const c of s.kol) k.phys.world.removeCollider(c, false);
        s.kol.length = 0;
        const c = new ColliderKit();
        c.matrix = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, WATER_Y, z);
        skrogKollider(c, s.sp);
        for (const sp of c.specs) {
            if (sp.kind !== 'hull') continue;
            const h = k.phys.addHull(sp.points);
            if (h) s.kol.push(h);
        }
    }

    defs.forEach((d, i) => {
        const navn = `${prefiks}-${i}`;
        const mk = new MeshKit();
        const g = new THREE.Group();
        g.name = navn;
        g.rotation.order = 'YXZ';
        let sp: SkrogSpec;
        if (d.type === 'jekt') {
            sp = jektSpec(d.skala ?? 1);
            lagJekt(mk, sp, 0, 11 + i * 7);
            g.add(toGroup(mk, k.world.materials, `${navn}:skrog`));
        } else {
            sp = KOGGE;
            const info = lagKogge(mk, false);
            g.add(toGroup(mk, k.world.materials, `${navn}:skrog`));
            const kb = new MeshKit();
            const ra = info.raa;
            raa(kb, ra.z, ra.y - 0.4, ra.halv, SEIL, ra.seilR);
            g.add(toGroup(kb, k.world.materials, `${navn}:seil`));
        }
        k.scene.add(g);
        const fot = { x: 0, z: 0, yaw: 0, L: 1, B: 1, fyldig: 1 } as SkrogFot;
        k.world.ekstraSkrog.push(fot);
        const s: Skip = { g, sp, fot, kol: [], yaw: d.yaw };
        plasser(s, d.x, d.z, d.yaw);
        skip.push(s);
    });

    return {
        grupper: skip.map((s) => s.g),
        flytt(i, x, z, yaw) {
            const s = skip[i];
            if (s) plasser(s, x, z, yaw);
        },
        bilde(t) {
            for (const s of skip) {
                // Et skip en filmscene har skjult (sekvens.ts), skal ikke skjære hull i vannet.
                const i = k.world.ekstraSkrog.indexOf(s.fot);
                if (s.g.visible && i < 0) k.world.ekstraSkrog.push(s.fot);
                else if (!s.g.visible && i >= 0) k.world.ekstraSkrog.splice(i, 1);
                // Skipene gynger med bølgene (som skip.ts).
                const p = s.g.position;
                const fx = Math.sin(s.yaw);
                const fz = Math.cos(s.yaw);
                const l = s.sp.L * 0.7;
                const hF = vannHoyde(p.x + fx * l, p.z + fz * l, t);
                const hA = vannHoyde(p.x - fx * l, p.z - fz * l, t);
                p.y = WATER_Y - 0.15 + (hF + hA) / 2;
                s.g.rotation.x = -(hF - hA) / (2 * l);
                s.g.rotation.z = Math.sin(t * 0.7 + p.x) * 0.012;
            }
        },
        dispose() {
            for (const s of skip) {
                k.scene.remove(s.g);
                s.g.traverse((o) => {
                    if (o instanceof THREE.Mesh) o.geometry.dispose();
                });
                const i = k.world.ekstraSkrog.indexOf(s.fot);
                if (i >= 0) k.world.ekstraSkrog.splice(i, 1);
                for (const c of s.kol) k.phys.world.removeCollider(c, false);
            }
            skip.length = 0;
        },
    };
}
