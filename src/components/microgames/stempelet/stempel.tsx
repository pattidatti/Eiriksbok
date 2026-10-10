// Stempelet: nikkelfot, oransje gummi, messinghals og trehåndtak. Det henger etter pekeren,
// løftes mens eleven holder og smeller ned når eleven slipper. Ingen timing: hvert slag er fullt.
// Ved slaget spruter blekket.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FARGE } from './farger';
import { nå, type Fx } from './fx';
import type { Game } from './state';
import { TUNING } from './tuning';

type GRef = React.MutableRefObject<Game>;
type FxRef = React.MutableRefObject<Fx>;

const S = TUNING.stempel;
const DRÅPER = 18;
const dråpeGeo = new THREE.SphereGeometry(0.035, 6, 4);
const hjelp = new THREE.Object3D();
const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);

/** Blekket som spruter ut ved slaget, og en sjokkring i bordet. */
function Blekk({ fxRef }: { fxRef: FxRef }) {
    const dråper = useRef<THREE.InstancedMesh>(null);
    const ring = useRef<THREE.Mesh>(null);
    const ringMat = useRef<THREE.MeshBasicMaterial>(null);
    useFrame(() => {
        const fx = fxRef.current;
        const e = nå() - fx.slag;
        const m = dråper.current;
        if (m) {
            const n = fx.slagFullt ? DRÅPER : 8;
            m.visible = e < 0.9;
            if (m.visible) {
                for (let i = 0; i < n; i++) {
                    const a = (i / n) * Math.PI * 2 + fx.slagId * 0.7;
                    const fart = 0.7 + ((i * 37) % 10) / 14;
                    const u = Math.min(1, e / 0.28);
                    const r = 0.32 + fart * 0.55 * easeOut(u);
                    hjelp.position.set(
                        fx.slagX + Math.cos(a) * r,
                        0.02 + Math.sin(u * Math.PI) * 0.18 * fart,
                        fx.slagZ + Math.sin(a) * r * 0.8
                    );
                    const s = u < 1 ? 1 : Math.max(0, 1 - (e - 0.28) / 0.6);
                    hjelp.scale.set(s * (u < 1 ? 1 : 1.6), s * (u < 1 ? 1 : 0.2), s * (u < 1 ? 1 : 1.6));
                    hjelp.updateMatrix();
                    m.setMatrixAt(i, hjelp.matrix);
                }
                m.count = n;
                m.instanceMatrix.needsUpdate = true;
            }
        }
        if (ring.current && ringMat.current) {
            ring.current.visible = e < 0.35;
            ring.current.position.set(fx.slagX, 0.03, fx.slagZ);
            ring.current.scale.setScalar(0.5 + easeOut(Math.min(1, e / 0.35)) * 1.3);
            ringMat.current.opacity = Math.max(0, 1 - e / 0.35) * (fx.slagFullt ? 0.8 : 0.4);
        }
    });
    return (
        <>
            <instancedMesh ref={dråper} args={[dråpeGeo, undefined, DRÅPER]} frustumCulled={false}>
                <meshBasicMaterial color={FARGE.oransje} />
            </instancedMesh>
            <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                <ringGeometry args={[0.5, 0.58, 40]} />
                <meshBasicMaterial ref={ringMat} color="#fff3dc" transparent opacity={0.8} />
            </mesh>
        </>
    );
}

export function Stempel({ gRef, fxRef }: { gRef: GRef; fxRef: FxRef }) {
    const kropp = useRef<THREE.Group>(null);
    const skygge = useRef<THREE.Mesh>(null);
    const skyggeMat = useRef<THREE.MeshBasicMaterial>(null);
    const forrige = useRef({ x: 0, z: 2.2, tiltX: 0, tiltZ: 0 });
    useFrame(({ clock }, raw) => {
        const g = gRef.current;
        const st = g.stempel;
        const fx = fxRef.current;
        const t = clock.elapsedTime;
        const etter = nå() - Math.max(fx.slag, fx.bom);
        const h = st.hold;
        let y = 0.85;
        let skjelv = 0;
        if (h !== null) {
            y = 0.85 + easeOut(Math.min(1, h / S.lysTil)) * 0.85;
            if (h > 1.2) skjelv = Math.min(0.5, (h - 1.2) * 2);
        } else if (etter < 0.07) y = 0.06;
        else if (etter < 0.4) y = 0.06 + easeOut((etter - 0.07) / 0.33) * 0.79;
        else y = 0.85 + Math.sin(t * 2) * 0.02;
        // Tyngde: stempelet lener seg etter bevegelsen.
        const f = forrige.current;
        const dt = Math.max(0.001, raw);
        const vx = (st.x - f.x) / dt;
        const vz = (st.z - f.z) / dt;
        f.x = st.x;
        f.z = st.z;
        f.tiltZ += (-vx * 0.03 - f.tiltZ) * Math.min(1, dt * 10);
        f.tiltX += (vz * 0.03 - f.tiltX) * Math.min(1, dt * 10);
        if (kropp.current) {
            kropp.current.position.set(
                st.x + Math.sin(t * 55) * 0.02 * skjelv,
                y,
                st.z + Math.cos(t * 49) * 0.02 * skjelv
            );
            kropp.current.rotation.set(
                Math.max(-0.35, Math.min(0.35, f.tiltX)),
                0,
                Math.max(-0.35, Math.min(0.35, f.tiltZ))
            );
            const klem = etter < 0.07 ? 0.85 : 1;
            kropp.current.scale.set(1 / Math.sqrt(klem), klem, 1 / Math.sqrt(klem));
        }
        // Skyggen krymper når stempelet løftes og vokser når det slår.
        if (skygge.current && skyggeMat.current) {
            skygge.current.position.set(st.x + y * 0.12, 0.035, st.z + y * 0.05);
            skygge.current.scale.setScalar(0.75 + (1.8 - y) * 0.25);
            skyggeMat.current.opacity = 0.55 - y * 0.15;
        }
    });
    return (
        <>
            <Blekk fxRef={fxRef} />
            <mesh ref={skygge} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.4, 28]} />
                <meshBasicMaterial ref={skyggeMat} color="#000" transparent opacity={0.4} />
            </mesh>
            <group ref={kropp}>
                {/* Gummien med blekk */}
                <mesh position={[0, 0.02, 0]}>
                    <cylinderGeometry args={[0.36, 0.36, 0.04, 32]} />
                    <meshLambertMaterial color="#b8561c" />
                </mesh>
                {/* Nikkelfoten */}
                <mesh position={[0, 0.12, 0]}>
                    <cylinderGeometry args={[0.37, 0.4, 0.16, 32]} />
                    <meshStandardMaterial color={FARGE.nikkel} metalness={0.7} roughness={0.32} />
                </mesh>
                <mesh position={[0, 0.215, 0]}>
                    <cylinderGeometry args={[0.24, 0.36, 0.05, 32]} />
                    <meshStandardMaterial color={FARGE.nikkel} metalness={0.7} roughness={0.32} />
                </mesh>
                {/* Messinghalsen */}
                <mesh position={[0, 0.42, 0]}>
                    <cylinderGeometry args={[0.07, 0.1, 0.38, 16]} />
                    <meshStandardMaterial color="#b9903e" metalness={0.75} roughness={0.35} />
                </mesh>
                {/* Trehåndtaket */}
                <mesh position={[0, 0.72, 0]} scale={[1, 1.15, 1]}>
                    <sphereGeometry args={[0.19, 20, 14]} />
                    <meshLambertMaterial color="#5a3420" />
                </mesh>
            </group>
        </>
    );
}
