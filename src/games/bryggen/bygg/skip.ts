// Skipene i Vågen: en kogge fortøyd utenfor kaia ved Nikolaikirkeallmenningen, en jekt med
// tørrfisk langs kaia vest for den første gården, og en jekt til for anker lenger ute.
//
// Kogger inn og ut av Vågen og jekter med tørrfisk om sommeren er blueprint §8.9 [V/U]. Hvor
// skipene lå, og at de ligger akkurat her, er valgt for spillet [S]: koggen ligger et par meter
// ut fra kaia så færingen kan ro mellom, og ingen av dem står i veien for færingens startplass.
//
// Skipene står ikke i en celle: de er få, alltid i Vågen og synes langt. Hvert skip er én MeshKit
// (ett tegnekall per materiale) som gynger på vannet, og én konveks kollider rundt skroget (står
// stille; gyngingen er bare noen centimeter).
import * as THREE from 'three';
import type RAPIER_NS from '@dimforge/rapier3d-compat';
import type { Physics } from '../motor/physics';
import type { Materials } from '../motor/materials';
import { ColliderKit, MeshKit } from '../motor/meshkit';
import { WATER_Y } from '../motor/boat';
import { vannHoyde } from '../motor/vann';
import { KOGGE, lagKogge, type SkipInfo } from '../motor/kogge-modell';
import { jektSpec, lagJekt } from '../motor/jekt-modell';
import { V3, skrogKollider, tau, type SkrogSpec } from '../motor/skrog';
import { toGroup } from './gard';

export interface Skipene {
    group: THREE.Group;
    /** Kalles hvert bilde med samme tid som vannet, så skipene gynger i takt med krusningen. */
    update: (t: number) => void;
    dispose: () => void;
}

interface Plassering {
    navn: string;
    x: number;
    /** Avstand ut fra kaifronten (fortøyd), eller fast z (for anker). */
    ut?: number;
    z?: number;
    yaw: number;
    /** Hvor mye skipet ruller: mindre når det er fortøyd. */
    rull: number;
    bygg: (k: MeshKit) => { info: SkipInfo; sp: SkrogSpec };
}

const PLASSER: Plassering[] = [
    { navn: 'kogge', x: 24, ut: 9.2, yaw: Math.PI / 2, rull: 0.007, bygg: (k) => ({ info: lagKogge(k), sp: KOGGE }) },
    {
        navn: 'jekt-kai', x: -25, ut: 3.6, yaw: -Math.PI / 2, rull: 0.012,
        bygg: (k) => { const sp = jektSpec(1); return { info: lagJekt(k, sp, 0.85, 7), sp }; },
    },
    {
        navn: 'jekt-anker', x: -40, z: -19, yaw: 2.55, rull: 0.022,
        bygg: (k) => { const sp = jektSpec(0.86); return { info: lagJekt(k, sp, 0.4, 31), sp }; },
    },
];

interface Skip {
    root: THREE.Group;
    x: number;
    z: number;
    yaw: number;
    sp: SkrogSpec;
    rull: number;
    fase: number;
}

/** `kaiFront(x)` er z for kaifronten (bolverket) ved x. */
export function lagSkipene(phys: Physics, mats: Materials, kaiFront: (x: number) => number): Skipene {
    const group = new THREE.Group();
    group.name = 'skip';
    const skip: Skip[] = [];
    const kollidere: RAPIER_NS.Collider[] = [];

    PLASSER.forEach((p, i) => {
        const front = kaiFront(p.x);
        const z = p.z ?? front - (p.ut ?? 0);
        const base = new THREE.Matrix4().makeRotationY(p.yaw).setPosition(p.x, WATER_Y, z);
        const inv = base.clone().invert();
        const k = new MeshKit();
        const { info, sp } = p.bygg(k);

        if (p.ut !== undefined) {
            // Fortøyd: tau fra pullertene på siden mot kaia, skrått inn til kaikanten.
            const side = -Math.sign(Math.sin(p.yaw)) || 1;
            for (const f of info.fortoy) {
                const a = V3(side * f.x, f.y, f.z);
                const w = a.clone().applyMatrix4(base);
                const langs = a.z > 0 ? 3 : -3;
                const dir = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
                const ende = V3(w.x + dir.x * langs, 0.06, front + 0.45).applyMatrix4(inv);
                tau(k, a, ende, 0.035, 0.25);
            }
        } else {
            // For anker: ankertauet går skrått ned i vannet forut.
            tau(k, info.baug, V3(0, -0.6, info.baug.z + 3), 0.035, 0.1);
        }

        const root = toGroup(k, mats, p.navn);
        root.rotation.order = 'YXZ';
        root.position.set(p.x, WATER_Y, z);
        root.rotation.y = p.yaw;
        group.add(root);

        const c = new ColliderKit();
        c.matrix = base;
        skrogKollider(c, sp);
        for (const s of c.specs) {
            if (s.kind !== 'hull') continue;
            const col = phys.addHull(s.points);
            if (col) kollidere.push(col);
        }
        skip.push({ root, x: p.x, z, yaw: p.yaw, sp, rull: p.rull, fase: i * 2.1 });
    });

    const update = (t: number) => {
        for (const s of skip) {
            // Høyden på vannet ved baugen, akterenden og begge sider: skipet følger bølgene, men
            // et langt skrog jevner dem ut. Oppå det en langsom rulling og duving.
            const fx = Math.sin(s.yaw);
            const fz = Math.cos(s.yaw);
            const l = s.sp.L * 0.7;
            const b = s.sp.B;
            const hF = vannHoyde(s.x + fx * l, s.z + fz * l, t);
            const hA = vannHoyde(s.x - fx * l, s.z - fz * l, t);
            const hB = vannHoyde(s.x + fz * b, s.z - fx * b, t);
            const hS = vannHoyde(s.x - fz * b, s.z + fx * b, t);
            const tid = t + s.fase;
            s.root.position.y = WATER_Y + (hF + hA + hB + hS) / 4 + Math.sin(tid * 0.55) * 0.035;
            s.root.rotation.x = -(hF - hA) / (2 * l) + Math.sin(tid * 0.41 + 1.3) * s.rull * 0.35;
            s.root.rotation.z = (hB - hS) / (2 * b) + Math.sin(tid * 0.83) * s.rull;
        }
    };

    return {
        group,
        update,
        dispose: () => {
            for (const c of kollidere) phys.world.removeCollider(c, false);
            group.traverse((o) => {
                if (o instanceof THREE.Mesh) o.geometry.dispose();
            });
        },
    };
}
