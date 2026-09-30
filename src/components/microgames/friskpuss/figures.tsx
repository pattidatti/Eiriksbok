// Figurene i «Frisk puss!»: lærlingen, paven, mesteren og spøkelset, pluss effektene rundt dem.
//
// Hver figur er et lite ledd-skjelett av enkle former (kropp, hode, armer, bein, bøtte) slått
// sammen per ledd, så en figur er ni tegnekall. Kraftige kropper med store hender, i cangiante:
// skyggen får et fargeskjær (emissive) i en annen tone, ikke bare mørkere.
//
// Animasjonene leses rett fra spilltilstanden (G): løp med armsving, hopp med strekk og landing
// med squash, lener seg inn i svinger, hendene på kanten i kantgrep, klatring på stige/tau/vegg,
// fekting ved søl og seiersdans på toppen. Paven har stokk og rød kappe og rister stokken når han
// er nær. Mesteren står bøyd bakover med penselen mot taket.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeParts, type Part } from '../kit/mergeParts';
import { toonGradientMap } from '../kit/toonGradient';
import { useQuality } from '../kit/quality';
import { hazeify } from './materials';
import { ART } from './paint';
import type { Level } from './level';
import type { G } from './game';
import type { FxPool } from './fx';
import { PAINT_DUR, PAINT_START } from './panels';
import { masterPaintSpot } from './camera';

type GRef = React.MutableRefObject<G>;
type V3 = [number, number, number];

// ---------------------------------------------------------------------------
// Skjelettet
// ---------------------------------------------------------------------------

interface Look {
    skin: string;
    tunic: string;
    tunicShade: string;
    legs: string;
    shoes: string;
    hair: string;
    cap?: string;
    beard?: string;
    robe?: string; // lang kjortel (paven)
    cape?: string;
    bucket?: boolean;
    brush?: boolean;
    stick?: boolean;
}

export interface Rig {
    root: THREE.Group;
    body: THREE.Group;
    torso: THREE.Group;
    head: THREE.Group;
    armL: THREE.Group;
    armR: THREE.Group;
    legL: THREE.Group;
    legR: THREE.Group;
    bucketHand: THREE.Object3D | null;
    bucketBelt: THREE.Object3D | null;
    extra?: THREE.Object3D;
    mats: THREE.Material[];
}

const cap = (r: number, len: number) => new THREE.CapsuleGeometry(r, len, 3, 8);
const sph = (r: number) => new THREE.SphereGeometry(r, 10, 8);
const cyl = (r0: number, r1: number, h: number, s = 10) => new THREE.CylinderGeometry(r0, r1, h, s);

function bucketParts(): Part[] {
    return [
        { geometry: cyl(0.17, 0.14, 0.28, 10), color: '#8a5a31' },
        { geometry: new THREE.TorusGeometry(0.165, 0.014, 4, 14), rotation: [Math.PI / 2, 0, 0], position: [0, 0.08, 0], color: '#3b3632' },
        { geometry: new THREE.TorusGeometry(0.148, 0.014, 4, 14), rotation: [Math.PI / 2, 0, 0], position: [0, -0.09, 0], color: '#3b3632' },
        { geometry: cyl(0.155, 0.155, 0.02, 10), position: [0, 0.125, 0], color: '#f4efe2' },
        { geometry: new THREE.TorusGeometry(0.16, 0.012, 4, 10, Math.PI), position: [0, 0.14, 0], color: '#3b3632' },
    ];
}

const BUCKET_GEO = mergeParts(bucketParts());

function makeMaterial(opacity: number, emissive: string) {
    if (opacity < 1)
        return new THREE.MeshLambertMaterial({
            vertexColors: true,
            transparent: true,
            opacity,
            depthWrite: false,
            emissive: new THREE.Color('#6f86c8'),
            emissiveIntensity: 0.5,
        });
    return hazeify(
        new THREE.MeshToonMaterial({
            vertexColors: true,
            gradientMap: toonGradientMap(),
            emissive: new THREE.Color(emissive),
        }),
        false
    );
}

/**
 * Silhuetten gjennom stillaset: tegnes før figuren (renderOrder 1 mot figurens 2) og bare der
 * noe annet allerede står foran (GreaterDepth), i et halvtett rutemønster. Siden den tegnes før
 * figuren selv, lager ikke figurens egne ledd silhuett på hverandre.
 */
function silhouetteMaterial(color: string) {
    const m = new THREE.MeshBasicMaterial({
        color,
        depthFunc: THREE.GreaterDepth,
        depthWrite: false,
        toneMapped: false,
        fog: false,
    });
    m.onBeforeCompile = (sh) => {
        sh.fragmentShader = sh.fragmentShader.replace(
            'void main() {',
            'void main() {\nif (mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0) < 1.0) discard;'
        );
    };
    m.customProgramCacheKey = () => 'fp-sil';
    return m;
}

function buildRig(look: Look, opacity = 1, shade = '#1b2a1c', castShadow = false, sil?: string): Rig {
    const mat = makeMaterial(opacity, shade);
    const silMat = sil ? silhouetteMaterial(sil) : null;
    const mesh = (g: THREE.BufferGeometry) => {
        const m = new THREE.Mesh(g, mat);
        m.castShadow = castShadow;
        if (silMat) {
            m.renderOrder = 2;
            const sm = new THREE.Mesh(g, silMat);
            sm.renderOrder = 1;
            m.add(sm);
        }
        return m;
    };
    const root = new THREE.Group();
    const body = new THREE.Group();
    root.add(body);

    // Bein: hofteledd i 0,85 m
    const leg = (x: number) => {
        const grp = new THREE.Group();
        grp.position.set(x, 0.85, 0);
        grp.add(
            mesh(
                mergeParts([
                    { geometry: cap(0.09, 0.56), position: [0, -0.38, 0], color: look.legs },
                    { geometry: new THREE.BoxGeometry(0.15, 0.1, 0.26), position: [0, -0.8, 0.05], color: look.shoes },
                ])
            )
        );
        body.add(grp);
        return grp;
    };
    const legL = leg(0.11);
    const legR = leg(-0.11);

    // Overkroppen: skjørt, kropp, belte (og pavens lange kjortel og kappe)
    const torso = new THREE.Group();
    torso.position.set(0, 0.85, 0);
    body.add(torso);
    const tparts: Part[] = [
        { geometry: cap(0.21, 0.32), position: [0, 0.34, 0], scale: [1.1, 1, 0.85], color: look.tunic },
        { geometry: cyl(0.24, 0.3, 0.36, 12), position: [0, -0.1, 0], color: look.tunicShade },
        { geometry: cyl(0.235, 0.235, 0.07, 12), position: [0, 0.06, 0], color: '#5b3b22' },
        // Brede skuldre
        { geometry: sph(0.13), position: [0.22, 0.58, 0], color: look.tunic },
        { geometry: sph(0.13), position: [-0.22, 0.58, 0], color: look.tunic },
    ];
    if (look.robe) tparts.push({ geometry: cyl(0.24, 0.38, 0.85, 12), position: [0, -0.4, 0], color: look.robe });
    if (look.cape) tparts.push({ geometry: cyl(0.2, 0.36, 0.38, 12), position: [0, 0.48, 0], color: look.cape });
    torso.add(mesh(mergeParts(tparts)));

    // Hodet
    const head = new THREE.Group();
    head.position.set(0, 0.74, 0);
    torso.add(head);
    const hparts: Part[] = [
        { geometry: sph(0.15), position: [0, 0.13, 0], color: look.skin },
        { geometry: sph(0.155), position: [0, 0.17, -0.02], scale: [1, 0.75, 1], color: look.hair },
        { geometry: new THREE.BoxGeometry(0.05, 0.06, 0.06), position: [0, 0.11, 0.15], color: look.skin },
    ];
    if (look.cap) hparts.push({ geometry: sph(0.16), position: [0, 0.22, 0], scale: [1.05, 0.55, 1.05], color: look.cap });
    if (look.beard) hparts.push({ geometry: new THREE.ConeGeometry(0.11, 0.22, 8), position: [0, 0.0, 0.07], rotation: [Math.PI, 0, 0], color: look.beard });
    head.add(mesh(mergeParts(hparts)));

    // Armer: skulderledd, store hender
    const arm = (x: number, extra: Part[] = []) => {
        const grp = new THREE.Group();
        grp.position.set(x, 0.6, 0);
        grp.add(
            mesh(
                mergeParts([
                    { geometry: cap(0.075, 0.42), position: [0, -0.28, 0], color: look.robe ? look.robe : look.tunic },
                    { geometry: sph(0.085), position: [0, -0.58, 0.01], color: look.skin },
                    ...extra,
                ])
            )
        );
        torso.add(grp);
        return grp;
    };
    const armL = arm(0.3, look.brush ? [] : []);
    const rExtra: Part[] = [];
    if (look.brush) {
        // Kort pensel, vinklet bakover i hånda: med armen rett opp ligger børsten mot taket.
        const a = 1.15;
        const d = (k: number): V3 => [0, -0.6 - Math.cos(a) * k, 0.01 + Math.sin(a) * k];
        rExtra.push(
            { geometry: cyl(0.016, 0.016, 0.34, 5), position: d(0.17), rotation: [Math.PI - a, 0, 0], color: '#8a5a31' },
            { geometry: cyl(0.04, 0.014, 0.1, 6), position: d(0.38), rotation: [Math.PI - a, 0, 0], color: ART.lapis }
        );
    }
    if (look.stick) rExtra.push({ geometry: cyl(0.022, 0.022, 1.3, 5), position: [0, -0.62, 0.12], rotation: [0.25, 0, 0], color: '#6d4a2b' });
    const armR = arm(-0.3, rExtra);

    let bucketHand: THREE.Object3D | null = null;
    let bucketBelt: THREE.Object3D | null = null;
    if (look.bucket) {
        bucketHand = mesh(BUCKET_GEO);
        bucketHand.position.set(0, -0.78, 0.04);
        armR.add(bucketHand);
        bucketBelt = mesh(BUCKET_GEO);
        bucketBelt.position.set(-0.3, 0.02, -0.12);
        bucketBelt.visible = false;
        torso.add(bucketBelt);
    }
    return {
        root,
        body,
        torso,
        head,
        armL,
        armR,
        legL,
        legR,
        bucketHand,
        bucketBelt,
        mats: silMat ? [mat, silMat] : [mat],
    };
}

// ---------------------------------------------------------------------------
// Positur: mål for leddene, glidd mot med demping (ingen rykk mellom tilstandene)
// ---------------------------------------------------------------------------

interface Pose {
    legL: number;
    legR: number;
    armLx: number;
    armLz: number;
    armRx: number;
    armRz: number;
    torso: number;
    head: number;
    y: number; // kroppen opp/ned
}
const REST: Pose = { legL: 0, legR: 0, armLx: 0, armLz: 0.08, armRx: 0, armRz: -0.12, torso: 0, head: 0, y: 0 };

function applyPose(rig: Rig, cur: Pose, target: Pose, k: number) {
    (Object.keys(cur) as (keyof Pose)[]).forEach((key) => {
        cur[key] += (target[key] - cur[key]) * k;
    });
    rig.legL.rotation.x = cur.legL;
    rig.legR.rotation.x = cur.legR;
    rig.armL.rotation.set(cur.armLx, 0, cur.armLz);
    rig.armR.rotation.set(cur.armRx, 0, cur.armRz);
    rig.torso.rotation.x = cur.torso;
    rig.head.rotation.x = cur.head;
    rig.body.position.y = cur.y;
}

/** Bygger skjelettet i en effekt og henger det inn i en gruppe (ingen mutasjon av render-verdier). */
function useRig(make: () => Rig, deps: unknown[]) {
    const holder = useRef<THREE.Group>(null);
    const rig = useRef<Rig | null>(null);
    useEffect(() => {
        const r = make();
        rig.current = r;
        const h = holder.current;
        h?.add(r.root);
        return () => {
            h?.remove(r.root);
            r.mats.forEach((m) => m.dispose());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
    return { holder, rig };
}

const angDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

// ---------------------------------------------------------------------------
// Lærlingen
// ---------------------------------------------------------------------------

const APPRENTICE: Look = {
    skin: ART.skin,
    tunic: ART.lapis,
    tunicShade: '#5f86cf',
    legs: '#c9a13a',
    shoes: '#5b3b22',
    hair: '#6b4a2b',
    cap: '#e39a8c',
    bucket: true,
};

export function Player({ gRef }: { gRef: GRef }) {
    const q = useQuality();
    const { holder, rig: rigRef } = useRig(() => buildRig(APPRENTICE, 1, '#12301f', q.tier !== 'lav', '#6f9bff'), [q.tier]);
    const st = useRef({ pose: { ...REST }, phase: 0, climb: 0, lastY: 0, lastFacing: 0, roll: 0, spin: 0, idle: 0 });
    useFrame((state, rawDt) => {
        const dt = Math.min(0.05, rawDt);
        const g = gRef.current;
        const s = st.current;
        const t = state.clock.elapsedTime;
        const r = rigRef.current;
        if (!r) return;
        r.root.position.set(g.p[0], g.p[1], g.p[2]);
        const won = g.ended === 'vunnet';
        if (won) s.spin += dt * 2.6;
        else s.spin = 0;
        r.root.rotation.y = g.facing + s.spin;
        r.root.visible = g.mode !== 'spill' || g.spillT > 0.35 || Math.floor(g.spillT * 20) % 2 === 0;
        // Silhuetten er for stillaset under deg. I mål (taket like over, kameraet i nærbilde) av.
        if (r.mats[1]) r.mats[1].visible = !g.ended;

        const speed = Math.hypot(g.v[0], g.v[2]);
        const dy = g.p[1] - s.lastY;
        s.lastY = g.p[1];
        const T: Pose = { ...REST };
        let belt = false;
        let hangOffset = 0;
        switch (g.mode) {
            case 'ground': {
                const k = Math.min(1, speed / 5);
                s.phase += speed * dt * 2.3;
                const sn = Math.sin(s.phase);
                T.legL = 0.85 * k * sn;
                T.legR = -0.85 * k * sn;
                T.armLx = -0.7 * k * sn + 0.05 * Math.sin(t * 2);
                T.armRx = 0.2 * k * sn - 0.1 * k;
                T.armRz = -0.22;
                T.torso = 0.14 * k + (g.swayOn ? 0 : 0.02 * Math.sin(t * 2));
                T.y = Math.abs(Math.cos(s.phase)) * 0.06 * k;
                // Står han stille, ser han opp mot mesteren og vipper på foten
                if (speed < 0.3) {
                    s.idle += dt;
                    if (s.idle > 2.5) {
                        T.head = -0.45;
                        T.legL = Math.max(0, Math.sin(t * 6)) * -0.25;
                        T.armLx = -0.3 + Math.sin(t * 1.5) * 0.15;
                    }
                } else s.idle = 0;
                break;
            }
            case 'air': {
                if (g.v[1] < -7) {
                    T.armLx = -2.7 + Math.sin(t * 22) * 0.4;
                    T.armLz = 0.5;
                    T.legL = -0.4 + Math.sin(t * 18) * 0.5;
                    T.legR = 0.3 - Math.sin(t * 18) * 0.5;
                    T.armRx = -0.9;
                } else {
                    T.legL = -0.9;
                    T.legR = 0.35;
                    T.armLx = -2.3;
                    T.armLz = 0.35;
                    T.armRx = -0.45;
                    T.torso = 0.1;
                }
                break;
            }
            case 'hang':
            case 'heis': {
                belt = true;
                T.armLx = -2.95;
                T.armRx = -2.95;
                T.armLz = 0.12;
                T.armRz = -0.12;
                T.legL = 0.12 * Math.sin(t * 3);
                T.legR = -0.12 * Math.sin(t * 3);
                T.head = -0.25;
                hangOffset = -0.46;
                break;
            }
            case 'climbup': {
                belt = true;
                const u = Math.min(1, g.climbT / Math.max(0.01, g.climbDur));
                T.armLx = -2.95 + u * 2.5;
                T.armRx = -2.95 + u * 2.5;
                T.legL = -1.5 * Math.sin(u * Math.PI);
                T.legR = -0.4 * Math.sin(u * Math.PI);
                T.torso = 0.35 * Math.sin(u * Math.PI);
                hangOffset = -0.46 * (1 - u);
                break;
            }
            case 'ladder':
            case 'wall':
            case 'rope': {
                belt = true;
                s.climb += Math.abs(dy) * 4.5;
                const c = Math.sin(s.climb);
                const rope = g.mode === 'rope';
                T.armLx = -2.55 + 0.45 * c;
                T.armRx = -2.55 - 0.45 * c;
                T.armLz = rope ? 0.05 : 0.2;
                T.armRz = rope ? -0.05 : -0.2;
                T.legL = rope ? -0.5 : -0.7 * Math.max(0, c);
                T.legR = rope ? -0.3 : -0.7 * Math.max(0, -c);
                T.head = -0.2;
                break;
            }
            case 'spill': {
                T.armLx = -2.8 + Math.sin(t * 25) * 0.6;
                T.armRx = -2.2 - Math.sin(t * 25) * 0.6;
                T.armLz = 0.8;
                T.armRz = -0.8;
                T.legL = Math.sin(t * 20) * 0.7;
                T.legR = -Math.sin(t * 20) * 0.7;
                T.torso = -0.3;
                break;
            }
        }
        if (won) {
            // Seiersdans: små hopp, armene i en V og en runde rundt (hendene holder seg under
            // taket, som bare er to meter over plattformen)
            T.armLx = -2.4 + Math.sin(t * 12) * 0.25;
            T.armRx = -2.4 - Math.sin(t * 12) * 0.25;
            T.armLz = 0.75;
            T.armRz = -0.75;
            T.legL = Math.sin(t * 12) * 0.5;
            T.legR = -Math.sin(t * 12) * 0.5;
            T.y = Math.abs(Math.sin(t * 6)) * 0.08;
            T.head = -0.3;
        }
        if (hangOffset) T.y = hangOffset;
        applyPose(r, s.pose, T, 1 - Math.exp(-dt * 20));
        if (r.bucketHand) r.bucketHand.visible = !belt && !won && g.mode !== 'spill';
        if (r.bucketBelt) r.bucketBelt.visible = belt;
        if (r.bucketHand) r.bucketHand.rotation.x = -s.pose.armRx; // bøtta henger rett ned

        // Squash og strekk
        const land = g.landHard * Math.exp(-g.landT * 11);
        const rising = g.mode === 'air' && g.v[1] > 2 ? Math.min(1, g.v[1] / 8) : 0;
        const sy = 1 - land * 0.34 + rising * 0.14;
        const sxz = 1 + land * 0.24 - rising * 0.07;
        r.body.scale.set(sxz, sy, sxz);

        // Lener seg inn i svingen
        const dF = angDiff(g.facing, s.lastFacing);
        s.lastFacing = g.facing;
        const want = g.mode === 'ground' ? Math.max(-0.4, Math.min(0.4, (-dF / Math.max(dt, 1e-3)) * speed * 0.035)) : 0;
        s.roll += (want - s.roll) * Math.min(1, dt * 8);
        const sway = g.swayOn ? -g.sway * 0.45 : 0;
        r.body.rotation.z = s.roll + sway;
        if (g.mode === 'spill') r.body.rotation.x = Math.sin(t * 9) * 0.5;
        else r.body.rotation.x = 0;
    });
    return <group ref={holder} />;
}

// ---------------------------------------------------------------------------
// Paven: hvit kjortel, rød kappe og lue, hvitt skjegg og stokken
// ---------------------------------------------------------------------------

const POPE: Look = {
    skin: '#e3b08c',
    tunic: '#f3ede0',
    tunicShade: '#f3ede0',
    legs: '#f3ede0',
    shoes: '#b0382a',
    hair: '#e9e4da',
    cap: ART.red,
    beard: '#f1ece2',
    robe: '#f3ede0',
    cape: ART.red,
    stick: true,
};

export function Pope({ gRef }: { gRef: GRef }) {
    const q = useQuality();
    const { holder, rig: rigRef } = useRig(() => buildRig(POPE, 1, '#3a1a14', q.tier !== 'lav', '#ff4a2e'), [q.tier]);
    const st = useRef({ pose: { ...REST }, last: [0, 0, 0] as V3, phase: 0, face: 0 });
    useFrame((state, rawDt) => {
        const rig = rigRef.current;
        if (!rig) return;
        const dt = Math.max(1e-3, Math.min(0.05, rawDt));
        const g = gRef.current;
        const s = st.current;
        const t = state.clock.elapsedTime;
        rig.root.visible = g.popeActive;
        if (!g.popeActive) return;
        if (rig.mats[1]) rig.mats[1].visible = !g.ended;
        rig.root.position.set(g.pope[0], g.pope[1], g.pope[2]);
        const dx = g.pope[0] - s.last[0];
        const dy = g.pope[1] - s.last[1];
        const dz = g.pope[2] - s.last[2];
        s.last = [g.pope[0], g.pope[1], g.pope[2]];
        const h = Math.hypot(dx, dz) / dt;
        const climbing = Math.abs(dy) / dt > 0.3 && h < 0.8;
        if (h > 0.15 && !climbing) s.face = Math.atan2(dx, dz);
        const near = Math.hypot(g.p[0] - g.pope[0], g.p[1] - g.pope[1], g.p[2] - g.pope[2]) < 5;
        if (near) s.face = Math.atan2(g.p[0] - g.pope[0], g.p[2] - g.pope[2]);
        rig.root.rotation.y += angDiff(s.face, rig.root.rotation.y) * Math.min(1, dt * 8);
        const T: Pose = { ...REST };
        if (climbing) {
            s.phase += Math.abs(dy) * 4;
            const c = Math.sin(s.phase);
            T.armLx = -2.5 + 0.45 * c;
            T.armRx = -2.5 - 0.45 * c;
            T.legL = -0.6 * Math.max(0, c);
            T.legR = -0.6 * Math.max(0, -c);
        } else {
            s.phase += h * dt * 2.6;
            const k = Math.min(1, h / 2.5);
            T.legL = 0.5 * k * Math.sin(s.phase);
            T.legR = -0.5 * k * Math.sin(s.phase);
            T.armLx = -0.4 * k * Math.sin(s.phase);
            T.armRx = -0.35;
            T.torso = 0.12 * k;
            T.y = Math.abs(Math.cos(s.phase)) * 0.04 * k;
        }
        if (near && !climbing) {
            // Rister stokken mot lærlingen
            T.armRx = -2.4 + Math.sin(t * 14) * 0.5;
            T.armRz = -0.3;
            T.head = -0.1;
        }
        applyPose(rig, s.pose, T, 1 - Math.exp(-dt * 16));
    });
    return <group ref={holder} />;
}

// ---------------------------------------------------------------------------
// Mesteren: bøyd bakover med penselen mot taket. Vinker i starten, danser når bøtta er oppe.
// ---------------------------------------------------------------------------

const MASTER: Look = {
    skin: '#dca47e',
    tunic: '#b7c465',
    tunicShade: '#e0b64a',
    legs: '#c9705e',
    shoes: '#4a3322',
    hair: '#3b2a1d',
    beard: '#3b2a1d',
    cap: '#3b2a1d',
    brush: true,
};

export function Master({ gRef, L }: { gRef: GRef; L: Level }) {
    const q = useQuality();
    const { holder, rig: rigRef } = useRig(() => {
        const r = buildRig(MASTER, 1, '#1f3a14', q.tier !== 'lav');
        // Bøtta settes ned ved føttene hans når du er oppe
        const b = new THREE.Mesh(BUCKET_GEO, r.mats[0]);
        b.position.set(0.45, 0.14, 0.35);
        b.visible = false;
        r.root.add(b);
        r.extra = b;
        return r;
    }, [q.tier]);
    const pose = useRef<Pose>({ ...REST });
    const winT = useRef(-1);
    const place = useRef({ x: L.master.p[0], z: L.master.p[2], rot: L.master.rotY, hip: 0 });
    const spot = useRef<{ x: number; z: number; rotY: number } | null>(null);
    useFrame((state, rawDt) => {
        const rig = rigRef.current;
        if (!rig) return;
        const dt = Math.min(0.05, rawDt);
        const g = gRef.current;
        const t = state.clock.elapsedTime;
        const T: Pose = { ...REST };
        const won = g.ended === 'vunnet';
        winT.current = won ? (winT.current < 0 ? 0 : winT.current + dt) : -1;
        const wt = winT.current;
        // I mål går han de par skrittene til malestedet under feltet og snur seg mot lærlingen.
        const pl = place.current;
        if (won) spot.current ??= masterPaintSpot(L, g.p[0]);
        else spot.current = null;
        const goal = spot.current ?? { x: L.master.p[0], z: L.master.p[2], rotY: L.master.rotY };
        if (!won) {
            pl.x = goal.x;
            pl.z = goal.z;
            pl.rot = goal.rotY;
        } else {
            const kp = 1 - Math.exp(-dt * 7);
            pl.x += (goal.x - pl.x) * kp;
            pl.z += (goal.z - pl.z) * kp;
            pl.rot += angDiff(goal.rotY, pl.rot) * kp;
        }
        rig.root.position.set(pl.x, L.master.p[1], pl.z);
        rig.root.rotation.set(0, pl.rot, 0);
        let hip = 0;
        if (won && wt < PAINT_START) {
            // Dypper penselen i den ferske pussen
            T.torso = 0.5;
            T.armRx = -0.6;
            T.head = 0.4;
        } else if (won && wt < PAINT_START + PAINT_DUR + 0.2) {
            // Maler dagens felt: står oppreist på plattformen, hoftene litt fram, overkroppen bøyd
            // bakover (brystet fram), hodet i nakken med ansiktet mot taket, begge armene rett
            // opp og penselen flatt mot takflaten over hodet.
            const u = (wt - PAINT_START) / PAINT_DUR;
            T.torso = -0.55;
            T.head = -0.65;
            T.armRx = -2.62 + Math.sin(wt * 9) * 0.1;
            T.armRz = -0.25 + u * 0.4 + Math.sin(wt * 4.5) * 0.12;
            T.armLx = -2.6 + Math.sin(wt * 2) * 0.05;
            T.armLz = 0.12;
            T.legL = 0.05;
            T.legR = 0.26;
            T.y = -0.05;
            hip = 0.17;
        } else if (won) {
            // Glad, men under taket: armene i en V og små hopp
            T.armLx = -2.4 + Math.sin(t * 10) * 0.25;
            T.armRx = -2.4 - Math.sin(t * 10) * 0.25;
            T.armLz = 0.7;
            T.armRz = -0.7;
            T.y = Math.abs(Math.sin(t * 5)) * 0.07;
            T.head = -0.2;
        } else if (g.t < 7 && g.maxY < 3) {
            // Vinker ned til lærlingen: «Frisk puss!»
            T.armLx = -2.6;
            T.armLz = 0.5 + Math.sin(t * 9) * 0.45;
            T.armRx = -0.3;
            T.torso = 0.15;
            T.head = 0.35;
        } else {
            // Maler taket: bøyd bakover, hodet bakover, penselen i små strøk
            T.torso = -0.42;
            T.head = -0.55;
            T.armRx = -2.75 + Math.sin(t * 2.6) * 0.22;
            T.armRz = -0.1 + Math.sin(t * 1.3) * 0.25;
            T.armLx = -1.2;
            T.armLz = 0.4;
            T.legL = -0.25;
            T.legR = 0.25;
        }
        applyPose(rig, pose.current, T, 1 - Math.exp(-dt * 8));
        pl.hip += (hip - pl.hip) * (1 - Math.exp(-dt * 8));
        rig.body.position.z = pl.hip;
        if (rig.extra) rig.extra.visible = won;
    });
    return <group ref={holder} />;
}

// ---------------------------------------------------------------------------
// Garzonen: en annen lærling som knuser farge i en morter nede på gulvet (verden lever)
// ---------------------------------------------------------------------------

const HELPER: Look = {
    skin: '#d9a47a',
    tunic: '#8fae4c',
    tunicShade: '#e0b64a',
    legs: '#b04a3a',
    shoes: '#4a3322',
    hair: '#2d2118',
    cap: '#efe4cc',
};

const MORTAR = mergeParts([
    { geometry: cyl(0.22, 0.16, 0.22, 12), position: [0, 0.11, 0], color: '#bdb6a6' },
    { geometry: cyl(0.18, 0.18, 0.02, 12), position: [0, 0.22, 0], color: ART.lapis },
    { geometry: cyl(0.1, 0.09, 0.16, 8), position: [0.45, 0.08, 0.1], color: '#8a6a4a' },
    { geometry: cyl(0.09, 0.09, 0.02, 8), position: [0.45, 0.165, 0.1], color: ART.red },
    { geometry: cyl(0.1, 0.09, 0.16, 8), position: [-0.42, 0.08, 0.15], color: '#8a6a4a' },
    { geometry: cyl(0.09, 0.09, 0.02, 8), position: [-0.42, 0.165, 0.15], color: ART.gold },
]);

export function Helper({ gRef, L }: { gRef: GRef; L: Level }) {
    const { holder, rig: rigRef } = useRig(() => {
        const r = buildRig(HELPER, 1, '#3a2a10');
        const m = new THREE.Mesh(MORTAR, r.mats[0]);
        m.position.set(0, 0, 0.55);
        r.root.add(m);
        return r;
    }, []);
    const pose = useRef<Pose>({ ...REST });
    // Nær starten, inntil veggen bak kameraets blikk, utenfor ruten
    const spot = useMemo((): { p: V3; rot: number } => {
        const s = L.mirror ? -1 : 1;
        return L.id === 'forste'
            ? { p: [-15.2 * s, 0, -5.4], rot: 0 }
            : { p: [-5.2 * s, 0, 5.4], rot: Math.PI };
    }, [L]);
    useFrame((state, rawDt) => {
        const rig = rigRef.current;
        if (!rig) return;
        const dt = Math.min(0.05, rawDt);
        const g = gRef.current;
        const t = state.clock.elapsedTime;
        rig.root.position.set(spot.p[0], spot.p[1], spot.p[2]);
        // Snur hodet mot lærlingen når han er nær
        const near = Math.hypot(g.p[0] - spot.p[0], g.p[2] - spot.p[2]) < 4;
        rig.root.rotation.set(0, spot.rot, 0);
        const T: Pose = { ...REST };
        // Knestående: beina bøyd, kroppen senket, armene stamper i morteren
        T.legL = -1.45;
        T.legR = -0.2;
        T.y = -0.42;
        T.torso = 0.45;
        T.armLx = -1.0 + Math.sin(t * 5) * 0.25;
        T.armRx = -1.0 + Math.sin(t * 5) * 0.25;
        T.armLz = 0.2 + Math.cos(t * 5) * 0.12;
        T.armRz = -0.2 + Math.cos(t * 5) * 0.12;
        T.head = near ? -0.35 : 0.25 + Math.sin(t * 0.7) * 0.1;
        applyPose(rig, pose.current, T, 1 - Math.exp(-dt * 10));
    });
    return <group ref={holder} />;
}

// ---------------------------------------------------------------------------
// Spøkelset: beste runde, halvgjennomsiktig lærling med bøtte
// ---------------------------------------------------------------------------

export function Ghost({ gRef, trail }: { gRef: GRef; trail: number[] | null }) {
    const { holder, rig: rigRef } = useRig(() => buildRig({ ...APPRENTICE, cap: '#cfd8f0' }, 0.34), []);
    const st = useRef({ pose: { ...REST }, phase: 0 });
    useFrame((_state, rawDt) => {
        const rig = rigRef.current;
        if (!rig) return;
        const dt = Math.min(0.05, rawDt);
        const root = rig.root;
        const n = trail ? trail.length / 3 : 0;
        const f = gRef.current.t / 0.1;
        // Spøkelset vises bare mens det løper: ikke når det er i mål, og ikke i mål-sekvensen din.
        if (!trail || n < 2 || gRef.current.ended || f > n - 1) {
            root.visible = false;
            return;
        }
        const i = Math.min(n - 2, Math.floor(f));
        const u = Math.min(1, f - i);
        const a = i * 3;
        const b = a + 3;
        root.visible = true;
        root.position.set(
            trail[a] + (trail[b] - trail[a]) * u,
            trail[a + 1] + (trail[b + 1] - trail[a + 1]) * u,
            trail[a + 2] + (trail[b + 2] - trail[a + 2]) * u
        );
        const vx = (trail[b] - trail[a]) / 0.1;
        const vy = (trail[b + 1] - trail[a + 1]) / 0.1;
        const vz = (trail[b + 2] - trail[a + 2]) / 0.1;
        const h = Math.hypot(vx, vz);
        if (h > 0.2) root.rotation.y = Math.atan2(vx, vz);
        const s = st.current;
        const T: Pose = { ...REST };
        if (Math.abs(vy) > 1.2 && h < 1) {
            s.phase += Math.abs(vy) * dt * 4.5;
            T.armLx = -2.55 + 0.45 * Math.sin(s.phase);
            T.armRx = -2.55 - 0.45 * Math.sin(s.phase);
        } else if (Math.abs(vy) > 1.5) {
            T.legL = -0.9;
            T.legR = 0.35;
            T.armLx = -2.3;
        } else {
            s.phase += h * dt * 2.3;
            const k = Math.min(1, h / 5);
            T.legL = 0.85 * k * Math.sin(s.phase);
            T.legR = -0.85 * k * Math.sin(s.phase);
            T.armLx = -0.7 * k * Math.sin(s.phase);
            T.torso = 0.14 * k;
        }
        applyPose(rig, s.pose, T, 1 - Math.exp(-dt * 16));
    });
    return <group ref={holder} />;
}

// ---------------------------------------------------------------------------
// Effekter: støvsky, pussprut, spon, gnister. Ett tegnekall for alt.
// ---------------------------------------------------------------------------

const FX_M = new THREE.Matrix4();
const FX_Q = new THREE.Quaternion();
const FX_S = new THREE.Vector3();

export function Fx({ pool }: { pool: FxPool }) {
    const q = useQuality();
    const ref = useRef<THREE.InstancedMesh>(null);
    const mat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: new THREE.Color('#554433') }), []);
    useEffect(() => {
        // Lag fargebufferen med en gang, så shaderen ikke kompileres på nytt ved første støvsky
        const m = ref.current;
        if (!m) return;
        m.setColorAt(0, new THREE.Color('#ffffff'));
        m.count = 0;
    }, []);
    useFrame((_s, rawDt) => {
        const dt = Math.min(0.05, rawDt);
        const m = ref.current;
        if (!m) return;
        pool.setScale(q.tier === 'lav' ? 0.6 : 1);
        pool.step(dt);
        const items = pool.items;
        let n = 0;
        for (const it of items) {
            const u = it.life / it.max;
            const s = it.grow ? it.size * (0.6 + u * 1.6) * (1 - u) * 1.6 : it.size * (1 - u * u);
            FX_S.setScalar(Math.max(0.001, s));
            FX_M.compose(it.p, FX_Q, FX_S);
            m.setMatrixAt(n, FX_M);
            m.setColorAt(n, it.color);
            n++;
        }
        m.count = n;
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, pool.max]} material={mat} frustumCulled={false}>
            <icosahedronGeometry args={[1, 0]} />
        </instancedMesh>
    );
}

// ---------------------------------------------------------------------------
// Fartstreker: i fritt fall, i heisen og etter tau-flukten
// ---------------------------------------------------------------------------

const LINE_UP = new THREE.Vector3(0, 1, 0);
const LINE_DIR = new THREE.Vector3();

export function SpeedLines({ gRef }: { gRef: GRef }) {
    const N = 10;
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const seeds = useMemo(() => Array.from({ length: N }, (_, i) => ({ a: (i / N) * Math.PI * 2, r: 0.55 + (i % 3) * 0.18, o: i * 0.37 })), []);
    const fade = useRef(0);
    useFrame((state, rawDt) => {
        const dt = Math.min(0.05, rawDt);
        const g = gRef.current;
        const vy = g.v[1];
        const h = Math.hypot(g.v[0], g.v[2]);
        const fast = (g.mode === 'air' && (vy < -7 || h > 6.8)) || (g.mode === 'heis' && vy > 2);
        fade.current += ((fast ? 1 : 0) - fade.current) * Math.min(1, dt * 10);
        const speed = Math.hypot(g.v[0], g.v[1], g.v[2]);
        if (g.mode === 'heis') LINE_DIR.set(0, 1, 0);
        else if (speed > 0.1) LINE_DIR.set(g.v[0], g.v[1], g.v[2]).normalize();
        const t = state.clock.elapsedTime;
        seeds.forEach((s, i) => {
            const m = refs.current[i];
            if (!m) return;
            m.visible = fade.current > 0.05;
            if (!m.visible) return;
            const u = ((t * 3 + s.o) % 1) - 0.5;
            m.position.set(
                g.p[0] + Math.cos(s.a) * s.r,
                g.p[1] + 0.9 + Math.sin(s.a) * s.r * 0.6,
                g.p[2] + Math.sin(s.a) * s.r
            );
            m.position.addScaledVector(LINE_DIR, -u * 2.2);
            m.quaternion.setFromUnitVectors(LINE_UP, LINE_DIR);
            m.scale.set(1, 0.6 + fade.current * 0.8, 1);
            (m.material as THREE.MeshBasicMaterial).opacity = 0.55 * fade.current;
        });
    });
    return (
        <group>
            {seeds.map((_s, i) => (
                <mesh key={i} ref={(el) => void (refs.current[i] = el)} visible={false}>
                    <boxGeometry args={[0.025, 1.1, 0.025]} />
                    <meshBasicMaterial color="#fffaf0" transparent opacity={0.5} depthWrite={false} />
                </mesh>
            ))}
        </group>
    );
}
