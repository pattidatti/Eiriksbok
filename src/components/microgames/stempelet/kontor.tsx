// Kontoret rundt bordet, øverst til høyre: døra ut til gangen der køen står som små skikkelser,
// og bunkene med permer som blir flere år for år (kontoret vokser). Bare pynt, ingen regler.
// Skikkelsene og permene er instanser (få draw calls på Chromebook). Leser gRef hver frame.

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BRETT, KØ } from './levels';
import { nå } from './fx';
import type { Game } from './state';

type GRef = React.MutableRefObject<Game>;

const MAKS = 10;
/** Døra: midt i døråpningen, bakerst til høyre på bordet. */
const DØR = { x: 3.05, z: -2.0 };
/** Skikkelsene er større enn ekte skala, så de synes på Chromebook. */
const SKALA = 1.6;
/** Køen går fra døra og fram mot bordet. Punkt 0 er fremst i køen. */
const STI = [
    new THREE.Vector3(2.45, 0, -1.4),
    new THREE.Vector3(2.85, 0, -1.55),
    new THREE.Vector3(3.05, 0, -1.85),
    new THREE.Vector3(3.05, 0, -2.5),
];
const kurve = new THREE.CatmullRomCurve3(STI);
const LENGDE = kurve.getLength();
const AVSTAND = 0.3;

/** Permene på kontoret, år for år: flere saker, flere permer. */
const PERMER = [4, 7, 10, 13, 16, 19, 22, 26];
const PERM_MAKS = 28;
const BUNKER = [
    { x: 3.95, z: -1.55 },
    { x: 4.5, z: -1.6 },
    { x: 4.0, z: -1.15 },
    { x: 4.55, z: -1.2 },
];
const PERM_H = 0.07;
const PERMFARGER = ['#6b2a24', '#2f4f3e', '#2c3d5c', '#5b4632', '#7a5a20', '#3d3d42'];

const FRAKK = ['#3b3f45', '#4a3a2e', '#2f3b33', '#5a4b3a', '#30323a', '#5c3a3a', '#3a4a5c'];
const HUD = ['#d9b08c', '#c99a74', '#b9835d', '#e3bf9c', '#a8714e', '#d4a37f'];
const HATT = ['#1f1f22', '#4a3a2e', '#6b5a48', '#2a2f3a'];
const SKJERF = ['#b5534a', '#5e7d9a', '#c9a25a', '#e9e1cf'];

const tmpM = new THREE.Matrix4();
const tmpP = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpS = new THREE.Vector3();
const ingen = new THREE.Vector3(1e-4, 1e-4, 1e-4);
const tmpY = new THREE.Vector3();
const opp = new THREE.Vector3(0, 1, 0);
const rygg = new THREE.Vector3();
const tmpC = new THREE.Color();

/** Døra: karm, mørk gang bak, og dørbladet som står åpent innover. */
function Dør() {
    const tre = '#4a3426';
    return (
        <group position={[DØR.x, 0, DØR.z]} scale={1.35}>
            {/* Gangen bak døra: mørk og litt varm, så skikkelsene synes mot den. */}
            <mesh position={[0, 0.46, -0.02]}>
                <planeGeometry args={[0.6, 0.92]} />
                <meshBasicMaterial color="#1c1612" />
            </mesh>
            <mesh position={[-0.34, 0.48, 0]}>
                <boxGeometry args={[0.08, 0.98, 0.1]} />
                <meshLambertMaterial color={tre} />
            </mesh>
            <mesh position={[0.34, 0.48, 0]}>
                <boxGeometry args={[0.08, 0.98, 0.1]} />
                <meshLambertMaterial color={tre} />
            </mesh>
            <mesh position={[0, 0.98, 0]}>
                <boxGeometry args={[0.78, 0.08, 0.12]} />
                <meshLambertMaterial color={tre} />
            </mesh>
            {/* Dørbladet med frostet glass, slått opp mot høyre. */}
            <group position={[0.3, 0, 0]} rotation={[0, -1.15, 0]}>
                <mesh position={[0.29, 0.46, 0]}>
                    <boxGeometry args={[0.58, 0.92, 0.04]} />
                    <meshLambertMaterial color="#6b4a32" />
                </mesh>
                <mesh position={[0.29, 0.66, 0.025]}>
                    <planeGeometry args={[0.4, 0.34]} />
                    <meshLambertMaterial color="#d8dccf" />
                </mesh>
            </group>
        </group>
    );
}

/** Køen som skikkelser: kropp, hode og (for noen) hatt eller skjerf. Går ett steg fram når et pass kommer. */
function Skikkelser({ gRef }: { gRef: GRef }) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const hode = useRef<THREE.InstancedMesh>(null);
    const hatt = useRef<THREE.InstancedMesh>(null);
    const steg = useRef({ id: -1, skift: 0, n: 0 });
    const typer = useMemo(
        () =>
            Array.from({ length: 24 }, (_, i) => ({
                frakk: new THREE.Color(FRAKK[(i * 5) % FRAKK.length]),
                hud: new THREE.Color(HUD[(i * 7 + 2) % HUD.length]),
                hatt: i % 3 === 1 ? null : new THREE.Color(i % 3 === 0 ? HATT[i % HATT.length] : SKJERF[i % SKJERF.length]),
                skjerf: i % 3 === 2,
                høyde: 0.9 + ((i * 37) % 11) / 50,
                barn: i % 7 === 5,
            })),
        []
    );
    useLayoutEffect(() => {
        [kropp, hode, hatt].forEach((r) => {
            if (r.current) r.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        });
    }, []);
    useFrame((_, dt) => {
        const g = gRef.current;
        const k = kropp.current;
        const h = hode.current;
        const ha = hatt.current;
        if (!k || !h || !ha) return;
        const s = steg.current;
        // Et nytt pass på bordet = den fremste har gått fram til luka; resten tar ett steg.
        if (s.id !== g.nesteId) {
            if (s.id >= 0) s.skift = 1;
            s.id = g.nesteId;
            s.n++;
        }
        s.skift = Math.max(0, s.skift - dt * 1.6);
        const antall = Math.min(MAKS, KØ[g.brett] ?? 4);
        const t = nå();
        for (let i = 0; i < MAKS; i++) {
            const type = typer[(i + s.n) % typer.length];
            const synlig = i < antall;
            const d = (i + s.skift) * AVSTAND;
            const u = Math.min(1, d / LENGDE);
            kurve.getPointAt(u, tmpP);
            const gå = s.skift > 0 ? Math.abs(Math.sin(s.skift * Math.PI * 3)) * 0.03 : 0;
            const pust = Math.sin(t * 1.3 + i * 1.7) * 0.006;
            const sk = synlig ? (type.barn ? 0.7 : 1) * type.høyde * SKALA : 0;
            // Kropp: en frakk som en avkuttet kjegle.
            tmpS.setScalar(sk || 1e-4);
            tmpQ.identity();
            tmpM.compose(tmpY.copy(tmpP).setY(0.2 * sk + gå), tmpQ, synlig ? tmpS : ingen);
            k.setMatrixAt(i, tmpM);
            k.setColorAt(i, type.frakk);
            const hodeY = 0.44 * sk + gå + pust;
            tmpM.compose(tmpY.copy(tmpP).setY(hodeY), tmpQ, synlig ? tmpS : ingen);
            h.setMatrixAt(i, tmpM);
            h.setColorAt(i, type.hud);
            // Hatt på hodet, eller skjerf rundt halsen.
            const harPynt = synlig && type.hatt;
            const pyntY = type.skjerf ? 0.36 * sk + gå : 0.51 * sk + gå + pust;
            tmpS.set(sk * (type.skjerf ? 0.95 : 1.15), sk * (type.skjerf ? 1.2 : 1), sk * (type.skjerf ? 0.95 : 1.15));
            tmpM.compose(tmpY.copy(tmpP).setY(pyntY), tmpQ, harPynt ? tmpS : ingen);
            ha.setMatrixAt(i, tmpM);
            if (type.hatt) ha.setColorAt(i, type.hatt);
        }
        for (const m of [k, h, ha]) {
            m.instanceMatrix.needsUpdate = true;
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
        }
    });
    return (
        <group>
            <instancedMesh ref={kropp} args={[undefined, undefined, MAKS]} frustumCulled={false}>
                <cylinderGeometry args={[0.07, 0.12, 0.4, 10]} />
                <meshLambertMaterial />
            </instancedMesh>
            <instancedMesh ref={hode} args={[undefined, undefined, MAKS]} frustumCulled={false}>
                <sphereGeometry args={[0.065, 12, 10]} />
                <meshLambertMaterial />
            </instancedMesh>
            <instancedMesh ref={hatt} args={[undefined, undefined, MAKS]} frustumCulled={false}>
                <cylinderGeometry args={[0.06, 0.075, 0.035, 12]} />
                <meshLambertMaterial />
            </instancedMesh>
        </group>
    );
}

/** Permene: bunker som vokser år for år, hver perm med en lys etikett på ryggen. */
function Permer({ gRef }: { gRef: GRef }) {
    const perm = useRef<THREE.InstancedMesh>(null);
    const etikett = useRef<THREE.InstancedMesh>(null);
    const vist = useRef(-1);
    useFrame(() => {
        const g = gRef.current;
        const n = Math.min(PERM_MAKS, PERMER[g.brett] ?? PERMER[BRETT.length - 1]);
        if (n === vist.current || !perm.current || !etikett.current) return;
        vist.current = n;
        for (let i = 0; i < PERM_MAKS; i++) {
            const b = BUNKER[i % BUNKER.length];
            const lag = Math.floor(i / BUNKER.length);
            const vri = Math.sin(i * 2.7) * 0.18;
            tmpQ.setFromAxisAngle(opp, vri);
            const synlig = i < n;
            tmpS.setScalar(synlig ? 1 : 0.0001);
            tmpP.set(b.x + Math.sin(i * 1.9) * 0.025, PERM_H / 2 + lag * PERM_H, b.z + Math.cos(i * 1.3) * 0.02);
            tmpM.compose(tmpP, tmpQ, tmpS);
            perm.current.setMatrixAt(i, tmpM);
            perm.current.setColorAt(i, tmpC.set(PERMFARGER[(i * 5 + lag) % PERMFARGER.length]));
            // Etiketten sitter på ryggen som vender mot eleven.
            rygg.set(0, 0, 0.181).applyQuaternion(tmpQ);
            tmpP.add(rygg);
            tmpM.compose(tmpP, tmpQ, tmpS);
            etikett.current.setMatrixAt(i, tmpM);
        }
        perm.current.instanceMatrix.needsUpdate = true;
        if (perm.current.instanceColor) perm.current.instanceColor.needsUpdate = true;
        etikett.current.instanceMatrix.needsUpdate = true;
    });
    return (
        <group>
            <instancedMesh ref={perm} args={[undefined, undefined, PERM_MAKS]} frustumCulled={false}>
                <boxGeometry args={[0.5, PERM_H * 0.92, 0.36]} />
                <meshLambertMaterial />
            </instancedMesh>
            <instancedMesh ref={etikett} args={[undefined, undefined, PERM_MAKS]} frustumCulled={false}>
                <boxGeometry args={[0.2, PERM_H * 0.6, 0.004]} />
                <meshLambertMaterial color="#efe6cf" />
            </instancedMesh>
        </group>
    );
}

export function Kontor({ gRef }: { gRef: GRef }) {
    return (
        <group>
            <Dør />
            <Skikkelser gRef={gRef} />
            <Permer gRef={gRef} />
        </group>
    );
}
