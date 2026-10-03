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
import { vannHoyde, type SkrogFot } from '../motor/vann';
import { KOGGE, lagKogge, type SkipInfo } from '../motor/kogge-modell';
import { jektSpec, lagJekt } from '../motor/jekt-modell';
import { V3, skrogKollider, tau, vannlinje, type SkrogSpec } from '../motor/skrog';
import { toGroup } from './gard';

export interface Skipene {
    group: THREE.Group;
    /** Kalles hvert bilde med samme tid som vannet, så skipene gynger i takt med krusningen. */
    update: (t: number) => void;
    /** Omrisset av hvert skrog i vannlinja (vannet tegnes ikke innenfor). */
    skrog: SkrogFot[];
    /**
     * Ekstra krenging (rull, radianer, + mot styrbord) og trim (duv, + baugen ned) for et skip, f.eks.
     * når lasten står skjevt i koggen (kontor-koggen.ts). Tones inn mykt.
     */
    krenging: (navn: string, rull: number, duv: number) => void;
    /** Omrisset av skipene som synes nå (en filmscene kan skjule koggen, sekvens.ts). */
    synlige: () => SkrogFot[];
    /** Jekta som ligger for anker (lekteren i trafikk.ts losser den). */
    anker: { x: number; z: number; yaw: number };
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
    fot: SkrogFot;
    navn: string;
    /** Krenging og trim fra lasten (`krenging`), tonet mot målet. */
    ekstra: { rull: number; duv: number; maalRull: number; maalDuv: number };
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
        // Kastellene står over skrog-kollideren: de skjuler bare navneskiltene bak (sikt-skjerm).
        for (const pts of info.skjerm ?? []) {
            const col = phys.addSkjerm(pts.map((q) => q.clone().applyMatrix4(base)));
            if (col) kollidere.push(col);
        }
        // Skipet ligger 0,15 m dypere enn skroget sier (update): vannlinja står litt opp i skroget.
        const vl = vannlinje(sp, 0.3);
        const fot: SkrogFot = { x: p.x + Math.sin(p.yaw) * vl.forut, z: z + Math.cos(p.yaw) * vl.forut, yaw: p.yaw, L: vl.L, B: vl.B, fyldig: vl.fyldig };
        skip.push({ root, navn: p.navn, x: p.x, z, yaw: p.yaw, sp, rull: p.rull, fase: i * 2.1, fot, ekstra: { rull: 0, duv: 0, maalRull: 0, maalDuv: 0 } });
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
            // Litt dypere enn skroget sier: ellers løfter kjølen seg over vannet i endene.
            s.root.position.y = WATER_Y - 0.15 + (hF + hA + hB + hS) / 4 + Math.sin(tid * 0.55) * 0.035;
            const e = s.ekstra;
            e.rull += (e.maalRull - e.rull) * 0.04;
            e.duv += (e.maalDuv - e.duv) * 0.04;
            s.root.rotation.x = -(hF - hA) / (2 * l) + Math.sin(tid * 0.41 + 1.3) * s.rull * 0.35 + e.duv;
            s.root.rotation.z = (hB - hS) / (2 * b) + Math.sin(tid * 0.83) * s.rull + e.rull;
        }
    };

    return {
        group,
        update,
        skrog: skip.map((s) => s.fot),
        krenging: (navn, rull, duv) => {
            const s = skip.find((x) => x.navn === navn);
            if (s) Object.assign(s.ekstra, { maalRull: rull, maalDuv: duv });
        },
        synlige: () => skip.filter((s) => s.root.visible).map((s) => s.fot),
        anker: (() => {
            const p = PLASSER.find((q) => q.z !== undefined)!;
            return { x: p.x, z: p.z!, yaw: p.yaw };
        })(),
        dispose: () => {
            for (const c of kollidere) phys.world.removeCollider(c, false);
            group.traverse((o) => {
                if (o instanceof THREE.Mesh) o.geometry.dispose();
            });
        },
    };
}
