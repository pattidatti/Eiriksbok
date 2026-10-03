// Gråboks-visningen: bokser og flate farger, ingen kunst. Leser spillet fra gRef hver frame.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { flate, løft } from './crowd';
import { flertallsFarge, type Game } from './state';
import { TUNING } from './tuning';
import { FARGE } from './farger';

const KOLONNER = 110;
const RADER = 3;
const AVSTAND = 0.42;

/** Mengden: søyler av hender i tre rader, høyden fra bølgene. */
function Hender({ gRef }: { gRef: React.MutableRefObject<Game> }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const m = useMemo(() => new THREE.Matrix4(), []);
    const c = useMemo(() => new THREE.Color(), []);
    useFrame(() => {
        const mesh = ref.current;
        if (!mesh) return;
        const g = gRef.current;
        const x0 = Math.floor((g.x - 14) / AVSTAND) * AVSTAND;
        const farge = FARGE[flertallsFarge(g)];
        let i = 0;
        for (let r = 0; r < RADER; r++)
            for (let k = 0; k < KOLONNER; k++) {
                const x = x0 + k * AVSTAND + r * 0.21;
                // Radene bak rekker litt høyere, så de synes over raden foran.
                const h = Math.max(0.15, flate(g, x) - 0.15 + r * 0.25);
                m.makeScale(0.3, h, 0.3);
                m.setPosition(x, h / 2, -0.9 - r * 0.9);
                mesh.setMatrixAt(i, m);
                c.set(farge).multiplyScalar(1 - r * 0.18);
                mesh.setColorAt(i, c);
                i++;
            }
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
    return (
        <instancedMesh
            ref={ref}
            args={[undefined, undefined, KOLONNER * RADER]}
            frustumCulled={false}
        >
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial />
        </instancedMesh>
    );
}

/** Stolen, passasjeren, livgarden og den neste i køen. */
function Stol({ gRef }: { gRef: React.MutableRefObject<Game> }) {
    const stol = useRef<THREE.Group>(null);
    const pass = useRef<THREE.Mesh>(null);
    const passMat = useRef<THREE.MeshBasicMaterial>(null);
    const hatt = useRef<THREE.Mesh>(null);
    const vern = useRef<THREE.Group>(null);
    const kø = useRef<THREE.Mesh>(null);
    const køMat = useRef<THREE.MeshBasicMaterial>(null);
    useFrame(() => {
        const g = gRef.current;
        if (!stol.current) return;
        stol.current.position.set(g.x, g.y, 0);
        stol.current.rotation.z = g.luft ? Math.atan2(g.vy, g.vx) * 0.4 : 0;
        if (pass.current && passMat.current && hatt.current) {
            pass.current.visible = !!g.stol;
            hatt.current.visible = !!g.stol;
            if (g.stol) passMat.current.color.set(FARGE[g.stol.farge]);
        }
        if (vern.current) {
            vern.current.visible = løft(g) === 'vern';
            vern.current.position.set(g.x, 0, 0.6);
            vern.current.children.forEach((ch, i) => {
                const h = Math.max(0.2, flate(g, g.x + (i - 1.5) * 0.5));
                ch.scale.y = h;
                ch.position.set((i - 1.5) * 0.5, h / 2, 0);
            });
        }
        if (kø.current && køMat.current) {
            kø.current.visible = !!g.kø && g.køSynlig;
            if (g.kø) køMat.current.color.set(FARGE[g.kø.farge]);
            const kx = g.x - 1.6;
            kø.current.position.set(kx, flate(g, kx) + 0.55, -0.4);
        }
    });
    return (
        <>
            <group ref={stol}>
                {/* Sete og fire ben */}
                <mesh position={[0, 0.32, 0]}>
                    <boxGeometry args={[0.9, 0.18, 0.8]} />
                    <meshBasicMaterial color={FARGE.stol} />
                </mesh>
                {[-0.35, 0.35].map((x) =>
                    [-0.3, 0.3].map((z) => (
                        <mesh key={`${x}${z}`} position={[x, 0.12, z]}>
                            <boxGeometry args={[0.1, 0.3, 0.1]} />
                            <meshBasicMaterial color={FARGE.stol} />
                        </mesh>
                    ))
                )}
                <mesh ref={pass} position={[0, 0.75, 0]}>
                    <boxGeometry args={[0.5, 0.7, 0.4]} />
                    <meshBasicMaterial ref={passMat} color={FARGE.blå} />
                </mesh>
                <mesh ref={hatt} position={[0, 1.28, 0]}>
                    <boxGeometry args={[0.32, 0.36, 0.32]} />
                    <meshBasicMaterial color={FARGE.hatt} />
                </mesh>
            </group>
            <group ref={vern}>
                {[0, 1, 2, 3].map((i) => (
                    <mesh key={i}>
                        <boxGeometry args={[0.3, 1, 0.3]} />
                        <meshBasicMaterial color={FARGE.gull} />
                    </mesh>
                ))}
            </group>
            <mesh ref={kø}>
                <boxGeometry args={[0.4, 0.6, 0.3]} />
                <meshBasicMaterial ref={køMat} color={FARGE.rød} />
            </mesh>
        </>
    );
}

const POOL = 12;

/** Hindringer, avisark og bannere fra lister i spillet, tegnet fra en fast pott. */
function Ting({ gRef }: { gRef: React.MutableRefObject<Game> }) {
    const hindre = useRef<(THREE.Mesh | null)[]>([]);
    const ark = useRef<(THREE.Mesh | null)[]>([]);
    const bannere = useRef<(THREE.Mesh | null)[]>([]);
    const bannerMat = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
    useFrame(() => {
        const g = gRef.current;
        const B = TUNING.hindring.bredde;
        hindre.current.forEach((m, i) => {
            if (!m) return;
            const o = g.hindringer[i];
            m.visible = !!o;
            if (!o) return;
            if (o.type === 'tråd') {
                m.scale.set(B, 0.12, 0.2);
                m.position.set(o.x, o.bunn + 0.06, 0);
            } else {
                m.scale.set(B, o.topp, 1.2);
                m.position.set(o.x, o.topp / 2, 0);
            }
        });
        ark.current.forEach((m, i) => {
            if (!m) return;
            const a = g.ark[i];
            m.visible = !!a && !a.tatt;
            if (a) m.position.set(a.x, a.y, 0);
        });
        bannere.current.forEach((m, i) => {
            if (!m) return;
            const b = g.bannere[i];
            m.visible = !!b && !b.truffet;
            if (!b) return;
            m.position.set(g.x + (b.t - g.t) * g.vx, 4, -0.2);
            bannerMat.current[i]?.color.set(b.rødt >= 58 ? FARGE.rød : FARGE.blå);
        });
    });
    return (
        <>
            {Array.from({ length: POOL }, (_, i) => (
                <mesh key={`h${i}`} ref={(el) => void (hindre.current[i] = el)} visible={false}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshBasicMaterial color={FARGE.hindring} />
                </mesh>
            ))}
            {Array.from({ length: POOL }, (_, i) => (
                <mesh key={`a${i}`} ref={(el) => void (ark.current[i] = el)} visible={false}>
                    <boxGeometry args={[0.5, 0.65, 0.05]} />
                    <meshBasicMaterial color={FARGE.ark} />
                </mesh>
            ))}
            {Array.from({ length: 3 }, (_, i) => (
                <mesh key={`b${i}`} ref={(el) => void (bannere.current[i] = el)} visible={false}>
                    <boxGeometry args={[0.25, 8, 0.25]} />
                    <meshBasicMaterial
                        ref={(el) => void (bannerMat.current[i] = el)}
                        color={FARGE.rød}
                        transparent
                        opacity={0.6}
                    />
                </mesh>
            ))}
        </>
    );
}

/** Gata, den stiplede gatelinja og kameraet som følger stolen. */
function Gate({ gRef }: { gRef: React.MutableRefObject<Game> }) {
    const gate = useRef<THREE.Group>(null);
    useFrame(({ camera }) => {
        const g = gRef.current;
        const cy = Math.max(1.6, g.y * 0.55 + 1.4);
        camera.position.set(g.x + 2, cy + 0.6, 12);
        camera.lookAt(g.x + 4.5, cy, -1);
        if (gate.current) gate.current.position.x = Math.floor(g.x / 2) * 2;
    });
    return (
        <group ref={gate}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0, -2]}>
                <planeGeometry args={[90, 14]} />
                <meshBasicMaterial color="#b9ad94" />
            </mesh>
            {Array.from({ length: 30 }, (_, i) => (
                <mesh key={i} position={[-20 + i * 2, 0.03, 1.2]}>
                    <boxGeometry args={[1, 0.04, 0.12]} />
                    <meshBasicMaterial color={FARGE.gate} />
                </mesh>
            ))}
        </group>
    );
}

export function Verden({ gRef }: { gRef: React.MutableRefObject<Game> }) {
    return (
        <>
            <Gate gRef={gRef} />
            <Hender gRef={gRef} />
            <Stol gRef={gRef} />
            <Ting gRef={gRef} />
        </>
    );
}
