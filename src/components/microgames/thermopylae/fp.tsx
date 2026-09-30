import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type G } from './game';
import { PAL, doryGeo, handGeo, aspisGeo, trailTexture, glowTexture, DORY_TIP_Z } from './look';
import { shieldArrows } from './view';

// Det eleven har i hendene: spydet (dory) nede til høyre, grepet overhånds, og
// bronseskjoldet (aspis) nede til venstre. Skjoldet er tungt: det svinger opp med litt
// etterslep og setter seg med et dunk. Stikket er raskt og etterlater et lysspor.
// Spissen blir blodig etter hvert. Følger kameraet hvert bilde.

type GRef = React.MutableRefObject<G>;

const STAB_IN = 0.07;
const STAB_OUT = 0.24;
const SHOVE_S = 0.32;
const E = new THREE.Euler();
const V = new THREE.Vector3();
const A = new THREE.Vector3();
const B = new THREE.Vector3();
const W = new THREE.Vector3();
const N = new THREE.Vector3();
const MB = new THREE.Matrix4();
const BRONZE = new THREE.Color(PAL.bronzeHi);
// Litt egenlys, så innsida av skjoldet ikke blir et svart hull i skyggen.
const SHIELD_BASE = new THREE.Color(0.1, 0.035, 0.02);

/** Et flatt kort for sporet: x på tvers, y langs stikket (0 = hale, 1 = tupp). */
function trailGeo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, -0.5, 1, 0, 0.5, 1, 0], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 0, 1, 1, 0, 1, 1], 2));
    g.setIndex([0, 1, 2, 2, 1, 3]);
    return g;
}

export function FirstPerson({ gRef }: { gRef: GRef }) {
    const root = useRef<THREE.Group>(null);
    const spear = useRef<THREE.Group>(null);
    const shield = useRef<THREE.Group>(null);
    const trail = useRef<THREE.Mesh>(null);
    const trailMat = useRef<THREE.MeshBasicMaterial>(null);
    const flare = useRef<THREE.Sprite>(null);
    const blood = useRef<THREE.Mesh>(null);
    const arrows = useRef<THREE.Group>(null);
    const shieldMat = useMemo(
        () => new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.75, roughness: 0.28, emissive: new THREE.Color('#000'), envMapIntensity: 1.3, side: THREE.DoubleSide }),
        [],
    );
    const spearMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.45, roughness: 0.4, envMapIntensity: 1.2 }), []);
    const tGeo = useMemo(() => trailGeo(), []);
    const st = useRef({ lastSwing: -9, clock: 9, kind: 'stikk' as 'stikk' | 'dytt', sh: 0, shV: 0, parries: 0, flash: 0, lx: 0, lz: 0, bob: 0, hp: 100, jolt: 0 });
    useFrame((state, rawDt) => {
        const dt = Math.min(0.05, rawDt);
        const g = gRef.current;
        const s = st.current;
        const r = root.current;
        if (!r) return;
        r.position.copy(state.camera.position);
        r.quaternion.copy(state.camera.quaternion);
        const t = state.clock.elapsedTime;

        if (g.swingAt !== s.lastSwing) {
            s.lastSwing = g.swingAt;
            s.clock = 0;
            s.kind = g.swingKind;
        }
        s.clock += dt;
        if (g.parries !== s.parries) {
            s.parries = g.parries;
            s.flash = 1;
        }
        if (g.hp < s.hp - 0.5) s.jolt = 1;
        s.hp = g.hp;
        s.flash = Math.max(0, s.flash - dt * 4);
        s.jolt = Math.max(0, s.jolt - dt * 5);
        const moved = Math.hypot(g.px - s.lx, g.pz - s.lz);
        s.lx = g.px;
        s.lz = g.pz;
        s.bob += moved * 3.4;
        const bx = Math.sin(s.bob) * 0.018;
        const by = -Math.abs(Math.cos(s.bob)) * 0.02;

        // Skjoldet: en tung fjær (litt overskudd når det løftes).
        const want = g.shield ? 1 : 0;
        s.shV += ((want - s.sh) * 190 - s.shV * 17) * dt;
        s.sh += s.shV * dt;
        const k = s.sh;
        const broken = g.guardBroken > 0;
        const shove = s.kind === 'dytt' && s.clock < SHOVE_S ? Math.sin((s.clock / SHOVE_S) * Math.PI) : 0;
        const sh = shield.current;
        if (sh) {
            const tremble = broken ? Math.sin(t * 40) * 0.01 : 0;
            sh.position.set(
                -0.56 + k * 0.38 + bx - shove * 0.08,
                -0.62 + k * 0.3 + by + tremble - (broken ? 0.14 : 0) - s.jolt * 0.05,
                -0.78 + k * 0.1 - shove * 0.38,
            );
            E.set(0.22 - k * 0.16 - shove * 0.2, 0.42 - k * 0.3 - shove * 0.12, 0.12 - k * 0.1, 'YXZ');
            sh.quaternion.setFromEuler(E);
            shieldMat.emissive.copy(BRONZE).multiplyScalar(s.flash * 1.1).add(SHIELD_BASE);
        }

        // Spydet: stikk fram og tilbake, med et lite løft i starten.
        let stab = 0;
        if (s.kind === 'stikk') {
            if (s.clock < STAB_IN) stab = s.clock / STAB_IN;
            else if (s.clock < STAB_IN + STAB_OUT) stab = 1 - (s.clock - STAB_IN) / STAB_OUT;
            stab = stab * stab * (3 - 2 * stab);
        }
        const sp = spear.current;
        if (sp) {
            sp.position.set(
                0.36 - stab * 0.2 + bx * 1.2 - k * 0.04,
                -0.3 + stab * 0.08 + by - k * 0.06 - s.jolt * 0.04,
                -0.28 - stab * 1.05,
            );
            E.set(-0.03 + stab * 0.03, 0.07 - stab * 0.05, -0.12, 'YXZ');
            sp.quaternion.setFromEuler(E);
        }
        // Blod på spydet: mer for hver perser.
        const bl = blood.current;
        if (bl) {
            bl.visible = g.kills > 0;
            const b = Math.min(1, g.kills / 12);
            bl.scale.set(1 + b * 0.3, 1 + b * 0.3, 0.4 + b * 1.4);
        }

        // Sporet: et lysende bånd fra der spissen var til der den er.
        const tr = trail.current;
        const tm = trailMat.current;
        if (tr && tm && sp) {
            const a = s.kind === 'stikk' && s.clock < STAB_IN + 0.16 ? 1 - Math.max(0, s.clock - STAB_IN * 0.5) / 0.2 : 0;
            tr.visible = a > 0.02;
            if (tr.visible) {
                A.set(0.36, -0.3, -0.28 + DORY_TIP_Z * 0.95);
                B.set(0, 0, DORY_TIP_Z).applyQuaternion(sp.quaternion).add(sp.position);
                const along = V.copy(B).sub(A);
                const len = along.length() + 0.25;
                along.normalize();
                const mid = W.copy(A).add(B).multiplyScalar(0.5);
                N.copy(mid).negate().normalize();
                const across = W.clone().crossVectors(along, N).normalize().multiplyScalar(0.16);
                N.crossVectors(across, along).normalize();
                MB.makeBasis(across, along.multiplyScalar(len), N);
                MB.setPosition(A.clone().addScaledVector(V.copy(B).sub(A).normalize(), -0.25));
                tr.matrix.copy(MB);
                tr.matrixAutoUpdate = false;
                tm.opacity = a;
            }
        }
        const fl = flare.current;
        if (fl && sp) {
            const on = s.kind === 'stikk' && s.clock > STAB_IN * 0.7 && s.clock < STAB_IN + 0.12;
            fl.visible = on;
            if (on) {
                V.set(0, 0, DORY_TIP_Z - 0.05).applyQuaternion(sp.quaternion).add(sp.position);
                fl.position.copy(V);
                const f = 1 - (s.clock - STAB_IN * 0.7) / 0.17;
                fl.scale.setScalar(0.25 + f * 0.35);
            }
        }
        // Piler i skjoldet etter et pilregn.
        const ar = arrows.current;
        if (ar) {
            const n = shieldArrows(g);
            ar.children.forEach((c, i) => {
                c.visible = i < n;
            });
        }
    });
    const arrowSpots: [number, number, number, number][] = [
        [0.12, 0.28, 0.3, -0.2],
        [-0.2, 0.18, -0.25, 0.1],
        [0.3, -0.05, 0.2, 0.25],
        [-0.05, 0.34, 0.05, -0.35],
        [-0.3, -0.12, -0.3, 0.2],
        [0.18, -0.26, 0.1, 0.1],
    ];
    return (
        <group ref={root}>
            <group ref={spear}>
                <mesh geometry={doryGeo()} material={spearMat} />
                <mesh geometry={handGeo()} position={[0.02, -0.02, 0.05]} material={spearMat} />
                {/* Blodet: på spissen og nedover skaftet. */}
                <mesh ref={blood} position={[0, 0, DORY_TIP_Z + 0.32]} visible={false}>
                    <cylinderGeometry args={[0.03, 0.028, 0.25, 6]} />
                    <meshStandardMaterial color={PAL.blood} roughness={0.25} />
                </mesh>
            </group>
            <group ref={shield} scale={0.95}>
                <mesh geometry={aspisGeo()} material={shieldMat} />
                <group ref={arrows}>
                    {arrowSpots.map(([x, y, rx, ry], i) => (
                        <mesh key={i} position={[x, y, -0.55]} rotation={[rx + 0.2, ry, 0]} visible={false}>
                            <boxGeometry args={[0.02, 0.02, 0.8]} />
                            <meshStandardMaterial color="#3b2618" />
                        </mesh>
                    ))}
                </group>
            </group>
            <mesh ref={trail} geometry={tGeo} visible={false} renderOrder={8}>
                <meshBasicMaterial
                    ref={trailMat}
                    map={trailTexture()}
                    color={[2.4, 2.0, 1.3]}
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </mesh>
            <sprite ref={flare} visible={false} renderOrder={9}>
                <spriteMaterial map={glowTexture()} color={[3, 2.6, 1.8]} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
            </sprite>
        </group>
    );
}
