// Garnet i Brevnettet: ulltrådene (slakke kjedelinjer som dirrer når de klikker fast og
// pisker når de ryker), brevene som glir mellom tente stuer, dra-tråden, spøkelsestråden og
// fnugget. Alt er instanser: ett draw call for alle trådbitene, ett for brevene.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TUNING } from './tuning';
import { HAUGE, avstand, type Punkt } from './net';
import { FARGE, sikreFarger, treff, type Drag, type Spøkelse } from './view';
import { kanBinde, node, type Game } from './game';
import { MAKS_BRUDD, MAKS_FNUGG, type Fx } from './fx';
import { ressurser } from './ressurser';

const MAKS_T = TUNING.maksTråder;
/** Ledd per tråd (kjedelinja), og per halvdel av en tråd som ryker. */
const SEG = 12;
const SEG_B = 6;
const MAKS_BITER = MAKS_T * SEG + MAKS_BRUDD * 2 * SEG_B + SEG * 2;
/** Trådene går ut fra forsiden av stuene. */
const Z0 = 0.24;

type GRef = React.MutableRefObject<Game>;

const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const pos = new THREE.Vector3();
const skala = new THREE.Vector3();
const yAkse = new THREE.Vector3(0, 1, 0);
const retn = new THREE.Vector3();
const farge = new THREE.Color();
const BRUN = new THREE.Color(FARGE.brun);
/** Hauges tråder: indigo, litt lysere enn frakken så de synes på den lyse ulla. */
const INDIGO_LYS = '#3d64a8';
const PKT = Array.from({ length: SEG + 1 }, () => new THREE.Vector3());

interface Form {
    /** Hvor mye tråden henger (enheter). */
    sag: number;
    /** Hvor langt den står ut fra veven på midten. */
    bue: number;
    /** Utslag på tvers (dirring, pisking). */
    vib: number;
    /** Antall bølger av utslaget langs tråden. */
    bølger: number;
}

/** Ett punkt på tråden mellom a og b (s = 0-1). */
function punkt(a: Punkt, b: Punkt, s: number, f: Form, out: THREE.Vector3) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.max(0.001, Math.hypot(dx, dy));
    const klokke = 4 * s * (1 - s);
    const tvers = f.vib * Math.sin(Math.PI * s * f.bølger);
    out.set(
        a.x + dx * s - (dy / len) * tvers,
        a.y + dy * s + (dx / len) * tvers - f.sag * klokke,
        Z0 + f.bue * klokke
    );
    return out;
}

/** Legg en tråd som `n` ledd i instansene fra indeks i. Returnerer neste ledige indeks. */
function legg(
    mesh: THREE.InstancedMesh,
    i: number,
    a: Punkt,
    b: Punkt,
    f: Form,
    r: number,
    n: number,
    stiplet = false
) {
    for (let k = 0; k <= n; k++) punkt(a, b, k / n, f, PKT[k]);
    for (let k = 0; k < n; k++) {
        const p0 = PKT[k];
        const p1 = PKT[k + 1];
        retn.subVectors(p1, p0);
        const len = retn.length();
        if (len < 1e-5) continue;
        retn.divideScalar(len);
        q.setFromUnitVectors(yAkse, retn);
        pos.addVectors(p0, p1).multiplyScalar(0.5);
        const synlig = !stiplet || k % 2 === 0;
        skala.set(synlig ? r : 0, len * 1.06, synlig ? r : 0);
        mesh.setMatrixAt(i, m4.compose(pos, q, skala));
        mesh.setColorAt(i, farge);
        i++;
    }
    return i;
}

const form: Form = { sag: 0, bue: 0, vib: 0, bølger: 1 };

export function Garn({
    gRef,
    dragRef,
    spøkelseRef,
    fx,
}: {
    gRef: GRef;
    dragRef: React.MutableRefObject<Drag | null>;
    spøkelseRef: React.MutableRefObject<Spøkelse | null>;
    fx: Fx;
}) {
    const R = ressurser();
    const biter = useRef<THREE.InstancedMesh>(null);
    const brev = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    useFrame((_, dt) => {
        tid.current += dt;
        const T = tid.current;
        const g = gRef.current;
        const m = biter.current;
        const bm = brev.current;
        if (!m || !bm) return;
        sikreFarger(m);
        let i = 0;
        let j = 0;
        for (const x of g.tråder) {
            const a = node(g, x.a);
            const c = node(g, x.b);
            if (!a || !c) continue;
            const hauge = x.a === HAUGE || x.b === HAUGE;
            const venner = !hauge && !!g.stuer.get(x.a)?.lys && !!g.stuer.get(x.b)?.lys;
            const len = avstand(a, c);
            // Stram når den klikker fast, så synker den slakt ned i løpet av et halvt sekund.
            const slakk = Math.min(1, x.alder / 0.5);
            const knyttet = fx.dirr.get(x.id);
            const sidenFast = Math.min(x.alder, knyttet ?? Infinity);
            form.sag = Math.min(0.5, 0.05 * len) * slakk * slakk;
            form.bue = 0.28;
            form.vib = 0.24 * Math.exp(-sidenFast * 5) * Math.sin(sidenFast * 44);
            form.bølger = 1;
            let r = hauge ? 0.05 : 0.06;
            if (x.kutt > 0) {
                // Lensmannen strammer tråden han skal klippe: rød, tykk og skjelvende.
                const puls = 0.5 + 0.5 * Math.sin(T * 14);
                r = 0.07 + 0.06 * puls;
                form.sag *= 0.2;
                form.vib = 0.05 * Math.sin(T * 61);
                form.bølger = 3;
                farge.setRGB(1, 0.18 + 0.2 * puls, 0.12);
            } else farge.set(hauge ? INDIGO_LYS : venner ? FARGE.gul : FARGE.brun);
            i = legg(m, i, a, c, form, r, SEG);
            // Brev går bare mellom to tente stuer: der lever nettet uten Hauge.
            if (!venner) continue;
            punkt(a, c, x.brev, form, pos);
            pos.z += 0.08;
            skala.set(0.36, 0.25, 1);
            bm.setMatrixAt(j++, m4.compose(pos, q.identity(), skala));
        }

        // Tråder som røk: to løse ender som pisker og faller.
        for (const b of fx.brudd) {
            if (b.t > 1.1) continue;
            const k = b.t / 1.1;
            const midt = { x: (b.a.x + b.b.x) / 2, y: (b.a.y + b.b.y) / 2 };
            farge.set(b.hauge ? FARGE.indigo : FARGE.gul).lerp(BRUN, k);
            for (const fast of [b.a, b.b]) {
                const fri = {
                    x: midt.x + (fast.x - midt.x) * 0.55 * k,
                    y: midt.y + (fast.y - midt.y) * 0.55 * k - 2.2 * b.t * b.t,
                };
                form.sag = 0;
                form.bue = 0.2;
                form.vib = 0.35 * (1 - k) * Math.sin(b.t * 30);
                form.bølger = 2;
                i = legg(m, i, fast, fri, form, 0.055 * (1 - k * 0.7), SEG_B);
            }
        }

        // Dra-tråden: stram som garn mellom fingrene, rød der den ikke kan festes.
        const d = dragRef.current;
        const fra = d ? node(g, d.fra) : null;
        if (d && fra) {
            const til = treff(g, d);
            const mål = til !== null && til !== d.fra ? node(g, til) : null;
            const ok = mål ? kanBinde(g, d.fra, til!) : true;
            farge.set(ok ? (d.fra === HAUGE ? INDIGO_LYS : FARGE.gul) : FARGE.rød);
            form.sag = 0;
            form.bue = 0.12;
            form.vib = 0.025 * Math.sin(T * 38);
            form.bølger = 2;
            i = legg(m, i, fra, mål ?? d, form, 0.06, SEG);
        }
        // Spøkelsestråden viser svaret: stiplet og pulserende.
        const s = spøkelseRef.current;
        const sa = s ? node(g, s.a) : null;
        const sb = s ? node(g, s.b) : null;
        if (sa && sb && !d) {
            const puls = 0.5 + 0.5 * Math.sin(T * 5);
            farge.set(s!.a === HAUGE ? FARGE.indigo : FARGE.gul).lerp(BRUN, 0.5 - 0.5 * puls);
            form.sag = 0.15;
            form.bue = 0.2;
            form.vib = 0;
            i = legg(m, i, sa, sb, form, 0.05 + 0.05 * puls, SEG, true);
        }

        m.count = i;
        bm.count = j;
        m.instanceMatrix.needsUpdate = true;
        bm.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    return (
        <group>
            <instancedMesh
                ref={biter}
                args={[R.geo.segment, R.mat.garn, MAKS_BITER]}
                frustumCulled={false}
            />
            <instancedMesh
                ref={brev}
                args={[R.geo.plan, R.mat.brev, MAKS_T]}
                frustumCulled={false}
            />
        </group>
    );
}

/** Fnugg: ullfibre og gnister som spretter ut når en stue tennes, rakner eller en tråd ryker. */
export function Fnugg({ fx }: { fx: Fx }) {
    const R = ressurser();
    const ref = useRef<THREE.InstancedMesh>(null);
    useFrame(() => {
        const m = ref.current;
        if (!m) return;
        sikreFarger(m);
        let i = 0;
        for (const f of fx.fnugg) {
            if (f.t > f.liv) continue;
            const k = 1 - f.t / f.liv;
            pos.set(f.x, f.y, f.z);
            q.setFromAxisAngle(yAkse, f.t * 9);
            skala.setScalar(f.str * (0.4 + k));
            m.setMatrixAt(i, m4.compose(pos, q, skala));
            farge.setRGB(f.r * 1.4, f.g * 1.4, f.b * 1.4);
            m.setColorAt(i, farge);
            i++;
        }
        m.count = i;
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    return (
        <instancedMesh
            ref={ref}
            args={[R.geo.plan, R.mat.fnugg, MAKS_FNUGG]}
            frustumCulled={false}
        />
    );
}
