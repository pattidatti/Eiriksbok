import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Oljepengenes reise i 3D. Fire moduser:
 * - plattform: en oljeplattform i Nordsjøen. Pengene stiger opp og reiser ut til
 *   selskaper langt borte.
 * - kilder: tre strømmer inn i fondet (skatt, statens egne felt, utbytte fra Equinor).
 * - verden: hva fondet eier. Aksjer, obligasjoner og eiendom/vind, så mange selskaper.
 * - hona: handlingsregelen som en høne. Du spiser eggene, høna blir igjen.
 */

type Modus = 'plattform' | 'kilder' | 'verden' | 'hona';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const OVERSKRIFT: Record<Modus, string[]> = {
    plattform: [
        'Nordsjøen',
        'Olje og gass hentes opp',
        'Du eier en bit av tusenvis av selskaper',
        'Det gjør alle som bor i Norge',
    ],
    kilder: [
        'Tre veier fra olje til staten',
        'Skatt: 378 milliarder',
        'Statens egne felt: 256 milliarder',
        'Utbytte fra Equinor: 25 milliarder',
        'Rundt 671 milliarder inn i oljefondet',
    ],
    verden: [
        'Aksjer: 72,1 prosent',
        'Obligasjoner: 25,8 prosent',
        'Resten: eiendom og fornybar energi',
        'Rundt 7 100 selskaper',
    ],
    hona: [
        'Avkastning: høna legger egg',
        'Handlingsregelen, 2001',
        'Spis eggene, ikke høna',
        'Høna blir igjen til barnebarna',
    ],
};

// ---------- Plattformen ----------

function Plattform({ fakkel }: { fakkel: boolean }) {
    const flamme = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        const f = flamme.current;
        if (!f) return;
        const s = fakkel ? 1 + Math.sin(clock.elapsedTime * 9) * 0.15 : 0.001;
        f.scale.set(s, s * 1.3, s);
    });
    return (
        <group>
            {/* Fire bein ned i havet */}
            {[
                [-2.2, -2.2],
                [2.2, -2.2],
                [-2.2, 2.2],
                [2.2, 2.2],
            ].map(([x, z]) => (
                <mesh key={`${x}${z}`} position={[x, 2, z]}>
                    <cylinderGeometry args={[0.55, 0.7, 5, 12]} />
                    <meshStandardMaterial color="#facc15" flatShading />
                </mesh>
            ))}
            {/* Dekket */}
            <mesh position={[0, 4.9, 0]}>
                <boxGeometry args={[7.4, 1, 7.4]} />
                <meshStandardMaterial color="#64748b" flatShading />
            </mesh>
            {/* Boligmodul */}
            <mesh position={[-1.8, 6.3, -1.6]}>
                <boxGeometry args={[3.4, 1.8, 3.4]} />
                <meshStandardMaterial color="#f8fafc" flatShading />
            </mesh>
            <mesh position={[-1.8, 7.35, -1.6]}>
                <cylinderGeometry args={[1.9, 1.9, 0.2, 20]} />
                <meshStandardMaterial color="#16a34a" />
            </mesh>
            {/* Boretårnet */}
            <mesh position={[1.6, 8.4, 1.4]}>
                <cylinderGeometry args={[0.35, 1.3, 6, 4]} />
                <meshStandardMaterial color="#dc2626" flatShading wireframe />
            </mesh>
            <mesh position={[1.6, 8.4, 1.4]}>
                <cylinderGeometry args={[0.15, 0.15, 6, 6]} />
                <meshStandardMaterial color="#b91c1c" />
            </mesh>
            {/* Fakkelbommen */}
            <mesh position={[5.2, 6.4, 0]} rotation={[0, 0, -0.9]}>
                <cylinderGeometry args={[0.15, 0.15, 5, 6]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <mesh ref={flamme} position={[7.2, 7.9, 0]}>
                <coneGeometry args={[0.5, 1.4, 10]} />
                <meshBasicMaterial color="#fb923c" />
            </mesh>
        </group>
    );
}

/** Et skytteltankskip som legger til ved plattformen. */
function Tankskip({ pos }: { pos: THREE.Vector3 }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        if (forste.current) {
            g.position.copy(pos);
            forste.current = false;
        }
        g.position.x = damp(g.position.x, pos.x, 0.8, dt);
        g.position.z = damp(g.position.z, pos.z, 0.8, dt);
    });
    return (
        <group ref={ref}>
            <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[11, 1.4, 2.6]} />
                <meshStandardMaterial color="#7f1d1d" flatShading />
            </mesh>
            <mesh position={[0, 1.4, 0]}>
                <boxGeometry args={[10.4, 0.25, 2.3]} />
                <meshStandardMaterial color="#e5e7eb" />
            </mesh>
            <mesh position={[-4.2, 2.3, 0]}>
                <boxGeometry args={[1.8, 1.8, 2.2]} />
                <meshStandardMaterial color="#f8fafc" flatShading />
            </mesh>
        </group>
    );
}

// ---------- Fondet ----------

const FOND = v(16, 0, -2);

function Fondet({ fyll, glod }: { fyll: number; glod: boolean }) {
    const gull = useRef<THREE.Mesh>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        const g = gull.current;
        if (g) {
            const s = damp(g.scale.y, Math.max(0.03, fyll), 1.2, dt || 1);
            g.scale.y = s;
            g.position.y = 1.2 + 5 * s * 0.5;
        }
        if (mat.current)
            mat.current.emissiveIntensity = damp(mat.current.emissiveIntensity, glod ? 0.8 : 0.3, 2, dt);
    });
    return (
        <group position={FOND}>
            {/* Holmen fondet står på */}
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[7, 7.6, 1, 32]} />
                <meshStandardMaterial color="#86a86b" flatShading />
            </mesh>
            {/* Glassbeholderen */}
            <mesh position={[0, 3.7, 0]}>
                <cylinderGeometry args={[3, 3, 5, 28, 1, true]} />
                <meshStandardMaterial
                    color="#e0f2fe"
                    transparent
                    opacity={0.35}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>
            <mesh position={[0, 6.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[3, 0.18, 8, 32]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 1.1, 0]}>
                <cylinderGeometry args={[3.2, 3.2, 0.3, 28]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh ref={gull} position={[0, 1.2, 0]} scale={[1, 0.03, 1]}>
                <cylinderGeometry args={[2.85, 2.85, 5, 28]} />
                <meshStandardMaterial
                    ref={mat}
                    color="#facc15"
                    emissive="#a16207"
                    emissiveIntensity={0.3}
                />
            </mesh>
        </group>
    );
}

/** Equinor-kontoret: et høyt bygg på land. */
function Kontor({ pos }: { pos: THREE.Vector3 }) {
    return (
        <group position={pos}>
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[4, 4.4, 1, 24]} />
                <meshStandardMaterial color="#86a86b" flatShading />
            </mesh>
            <mesh position={[0, 4, 0]}>
                <boxGeometry args={[2.6, 6, 2.6]} />
                <meshStandardMaterial color="#cbd5e1" flatShading />
            </mesh>
            <mesh position={[0, 7.2, 0]}>
                <boxGeometry args={[2.8, 0.4, 2.8]} />
                <meshStandardMaterial color="#1d4ed8" />
            </mesh>
        </group>
    );
}

// ---------- Mynter ----------

interface Strom {
    fra: THREE.Vector3;
    til: THREE.Vector3;
    antall: number;
    hoyde: number;
}

const MYNTER = 90;

const PLATTFORM_A = v(-14, 0, -6);
const PLATTFORM_B = v(-12, 0, 10);
const EQUINOR = v(2, 0, 14);

/** Fjerne selskaper i en bue bak horisonten (plattform-modus). */
const FJERNE = Array.from({ length: 26 }, (_, i) => {
    const a = -1.1 + (i / 25) * 2.2;
    const r = 70 + (i % 3) * 8;
    return v(Math.sin(a) * r, 0, -Math.cos(a) * r);
});

function stromFor(modus: Modus, beat: number): Strom[] {
    const fondTopp = v(FOND.x, 6.6, FOND.z);
    if (modus === 'plattform') {
        if (beat < 2) return [];
        return FJERNE.filter((_, i) => i % 3 === 0).map((m) => ({
            fra: v(0, 7, 0),
            til: v(m.x, 5, m.z),
            antall: 8,
            hoyde: 14,
        }));
    }
    if (modus === 'kilder') {
        const s: Strom[] = [];
        if (beat === 1 || beat >= 4) s.push({ fra: v(PLATTFORM_A.x, 7, PLATTFORM_A.z), til: fondTopp, antall: beat >= 4 ? 18 : 30, hoyde: 3.5 });
        if (beat === 2 || beat >= 4) s.push({ fra: v(PLATTFORM_B.x, 7, PLATTFORM_B.z), til: fondTopp, antall: beat >= 4 ? 14 : 24, hoyde: 3.5 });
        if (beat === 3 || beat >= 4) s.push({ fra: v(EQUINOR.x, 7.6, EQUINOR.z), til: fondTopp, antall: beat >= 4 ? 4 : 8, hoyde: 2.5 });
        return s;
    }
    return [];
}

function Myntstrom({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const strom = useMemo(() => stromFor(modus, beat), [modus, beat]);
    const obj = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        let k = 0;
        for (const s of strom) {
            for (let j = 0; j < s.antall && k < MYNTER; j++, k++) {
                const f = (tid.current * 0.3 + j / s.antall) % 1;
                obj.position.lerpVectors(s.fra, s.til, f);
                obj.position.y += Math.sin(f * Math.PI) * s.hoyde;
                obj.rotation.set(Math.PI / 2, f * 6, 0);
                obj.scale.setScalar(modus === 'plattform' ? 1.4 : 1);
                obj.updateMatrix();
                m.setMatrixAt(k, obj.matrix);
            }
        }
        for (; k < MYNTER; k++) {
            obj.scale.setScalar(0);
            obj.updateMatrix();
            m.setMatrixAt(k, obj.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, MYNTER]} frustumCulled={false}>
            <cylinderGeometry args={[0.4, 0.4, 0.1, 16]} />
            <meshStandardMaterial color="#facc15" emissive="#a16207" emissiveIntensity={0.5} metalness={0.3} />
        </instancedMesh>
    );
}

// ---------- Selskaper (instanser) ----------

interface Bygg {
    pos: THREE.Vector3;
    h: number;
    b: number;
}

function Byggefelt({
    bygg,
    farge,
    synlig,
    gullbunn = false,
}: {
    bygg: Bygg[];
    farge: string;
    synlig: boolean;
    gullbunn?: boolean;
}) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const bunn = useRef<THREE.InstancedMesh>(null);
    const vekst = useRef(synlig ? 1 : 0);
    const obj = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, dt) => {
        vekst.current = damp(vekst.current, synlig ? 1 : 0, 2.5, dt || 1);
        const g = Math.max(0.001, vekst.current);
        if (ref.current) ref.current.visible = g > 0.01;
        if (bunn.current) bunn.current.visible = g > 0.01;
        const m = ref.current;
        if (m) {
            bygg.forEach((b, i) => {
                obj.position.set(b.pos.x, (b.h * g) / 2, b.pos.z);
                obj.scale.set(b.b, b.h * g, b.b);
                obj.updateMatrix();
                m.setMatrixAt(i, obj.matrix);
            });
            m.instanceMatrix.needsUpdate = true;
        }
        const n = bunn.current;
        if (n) {
            bygg.forEach((b, i) => {
                // 1,5 prosent av hvert selskap, som et gullbånd nederst (litt tykkere enn ekte, så det synes).
                const h = gullbunn ? Math.max(0.12, b.h * 0.03) * g : 0.001;
                obj.position.set(b.pos.x, h / 2, b.pos.z);
                obj.scale.set(b.b * 1.06, h, b.b * 1.06);
                obj.updateMatrix();
                n.setMatrixAt(i, obj.matrix);
            });
            n.instanceMatrix.needsUpdate = true;
        }
    });
    return (
        <>
            <instancedMesh ref={ref} args={[undefined, undefined, bygg.length]} frustumCulled={false}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={farge} flatShading />
            </instancedMesh>
            <instancedMesh ref={bunn} args={[undefined, undefined, bygg.length]} frustumCulled={false}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#facc15" emissive="#a16207" emissiveIntensity={0.6} />
            </instancedMesh>
        </>
    );
}

/** Pseudotilfeldig, men likt hver gang. */
function tilfeldig(i: number) {
    const x = Math.sin(i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
}

function byggISirkel(senter: THREE.Vector3, radius: number, antall: number, start: number, hMin: number, hMax: number): Bygg[] {
    return Array.from({ length: antall }, (_, i) => {
        const a = tilfeldig(start + i) * Math.PI * 2;
        const r = Math.sqrt(tilfeldig(start + i + 500)) * radius;
        return {
            pos: v(senter.x + Math.cos(a) * r, 0, senter.z + Math.sin(a) * r),
            h: hMin + tilfeldig(start + i + 900) * (hMax - hMin),
            b: 0.9 + tilfeldig(start + i + 1300) * 0.6,
        };
    });
}

// Felt sized etter andelen: aksjer 72,1, obligasjoner 25,8, resten.
const AKSJE_S = v(-4, 0, 0);
const OBLIG_S = v(10.5, 0, -3);
const REST_S = v(9.5, 0, 6.5);
const R_AKSJE = 9;
const R_OBLIG = 9 * Math.sqrt(25.8 / 72.1);
const R_REST = 9 * Math.sqrt(2.1 / 72.1) + 0.6;

function Vindmolle({ pos, playing }: { pos: THREE.Vector3; playing: boolean }) {
    const rotor = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (rotor.current && playing) rotor.current.rotation.z += Math.min(dt, 0.05) * 1.6;
    });
    return (
        <group position={pos}>
            <mesh position={[0, 2.5, 0]}>
                <cylinderGeometry args={[0.08, 0.14, 5, 8]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <group ref={rotor} position={[0, 5, 0.2]}>
                {[0, 1, 2].map((i) => (
                    <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]} position={[0, 0, 0]}>
                        <boxGeometry args={[0.18, 3.2, 0.05]} />
                        <meshStandardMaterial color="#f8fafc" />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

/** Obligasjoner: lånepapirer i bunker, med et rødt bånd. */
function Papirbunker({ synlig }: { synlig: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const bunker = useMemo(
        () =>
            Array.from({ length: 7 }, (_, i) => {
                const a = (i / 7) * Math.PI * 2;
                const r = i === 0 ? 0 : R_OBLIG * 0.55;
                return { x: OBLIG_S.x + Math.cos(a) * r, z: OBLIG_S.z + Math.sin(a) * r, h: 1 + (i % 3) * 0.6 };
            }),
        []
    );
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        const s = damp(g.scale.y, synlig ? 1 : 0.001, 2.5, dt || 1);
        g.scale.set(1, s, 1);
        g.visible = s > 0.01;
    });
    return (
        <group ref={ref}>
            {bunker.map((b, i) => (
                <group key={i} position={[b.x, 0, b.z]}>
                    <mesh position={[0, b.h / 2, 0]}>
                        <boxGeometry args={[1.8, b.h, 1.3]} />
                        <meshStandardMaterial color="#f8fafc" flatShading />
                    </mesh>
                    <mesh position={[0, b.h / 2, 0]}>
                        <boxGeometry args={[0.25, b.h + 0.02, 1.32]} />
                        <meshStandardMaterial color="#dc2626" />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

function Hus({ pos }: { pos: THREE.Vector3 }) {
    return (
        <group position={pos}>
            <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[1.4, 1.2, 1.4]} />
                <meshStandardMaterial color="#fef3c7" flatShading />
            </mesh>
            <mesh position={[0, 1.6, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[1.15, 0.9, 4]} />
                <meshStandardMaterial color="#9a3412" flatShading />
            </mesh>
        </group>
    );
}

function Felt({ senter, radius, farge, synlig }: { senter: THREE.Vector3; radius: number; farge: string; synlig: boolean }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (mat.current) mat.current.opacity = damp(mat.current.opacity, synlig ? 1 : 0, 3, dt || 1);
    });
    return (
        <mesh position={[senter.x, 0.03, senter.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[radius, 40]} />
            <meshStandardMaterial ref={mat} color={farge} transparent opacity={synlig ? 1 : 0} />
        </mesh>
    );
}

// ---------- Høna ----------

function Hone() {
    return (
        <group>
            {/* Kropp */}
            <mesh position={[0, 2.2, 0]} scale={[1.6, 1.25, 1.15]}>
                <sphereGeometry args={[1.5, 20, 16]} />
                <meshStandardMaterial color="#facc15" emissive="#a16207" emissiveIntensity={0.25} flatShading />
            </mesh>
            {/* Hale */}
            <mesh position={[-2.4, 3.1, 0]} rotation={[0, 0, 0.7]}>
                <coneGeometry args={[0.9, 1.9, 6]} />
                <meshStandardMaterial color="#eab308" flatShading />
            </mesh>
            {/* Hode */}
            <mesh position={[2, 3.9, 0]}>
                <sphereGeometry args={[0.85, 16, 12]} />
                <meshStandardMaterial color="#facc15" emissive="#a16207" emissiveIntensity={0.25} flatShading />
            </mesh>
            {/* Kam */}
            {[0, 1, 2].map((i) => (
                <mesh key={i} position={[1.7 + i * 0.32, 4.85 - Math.abs(i - 1) * 0.12, 0]}>
                    <sphereGeometry args={[0.24, 8, 8]} />
                    <meshStandardMaterial color="#dc2626" />
                </mesh>
            ))}
            {/* Nebb */}
            <mesh position={[2.95, 3.85, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.22, 0.6, 8]} />
                <meshStandardMaterial color="#ea580c" />
            </mesh>
            {/* Øyne */}
            {[-1, 1].map((s) => (
                <mesh key={s} position={[2.5, 4.1, s * 0.55]}>
                    <sphereGeometry args={[0.1, 8, 8]} />
                    <meshBasicMaterial color="#0f172a" />
                </mesh>
            ))}
            {/* Vinge */}
            {[-1, 1].map((s) => (
                <mesh key={s} position={[-0.2, 2.4, s * 1.6]} scale={[1.2, 0.7, 0.25]}>
                    <sphereGeometry args={[1, 12, 10]} />
                    <meshStandardMaterial color="#eab308" flatShading />
                </mesh>
            ))}
            {/* Bein */}
            {[-0.5, 0.5].map((z) => (
                <mesh key={z} position={[0.3, 0.45, z]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.9, 6]} />
                    <meshStandardMaterial color="#ea580c" />
                </mesh>
            ))}
        </group>
    );
}

/** Reiret høna sitter i. */
function Reir() {
    return (
        <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[3.4, 3, 0.5, 24]} />
            <meshStandardMaterial color="#b45309" flatShading />
        </mesh>
    );
}

const KURV = v(8, 0, 4);
const EGG = 6;

/** Gullegg: ligger i reiret, eller rulles over i kurven. */
function Egg({ beat, playing }: { beat: number; playing: boolean }) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        refs.current.forEach((m, i) => {
            if (!m) return;
            const iKurv = beat >= 2;
            const a = (i / EGG) * Math.PI * 1.4 - 0.2;
            const mal = iKurv
                ? v(KURV.x + Math.cos(i * 2.1) * 0.9, 1.1 + Math.floor(i / 3) * 0.45, KURV.z + Math.sin(i * 2.1) * 0.9)
                : v(Math.cos(a) * 3.9, 0.55, Math.sin(a) * 3.9 + 0.4);
            if (forste.current) m.position.copy(mal);
            m.position.x = damp(m.position.x, mal.x, 1.8, dt);
            m.position.z = damp(m.position.z, mal.z, 1.8, dt);
            m.position.y = damp(m.position.y, mal.y, 3, dt);
            m.scale.set(0.55, 0.72, 0.55);
        });
        forste.current = false;
    });
    return (
        <>
            {Array.from({ length: EGG }, (_, i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                >
                    <sphereGeometry args={[1, 14, 12]} />
                    <meshStandardMaterial color="#fde68a" emissive="#ca8a04" emissiveIntensity={0.45} metalness={0.3} />
                </mesh>
            ))}
        </>
    );
}

function Kurv() {
    return (
        <group position={KURV}>
            <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[1.7, 1.3, 1.2, 18, 1, true]} />
                <meshStandardMaterial color="#a16207" side={THREE.DoubleSide} flatShading />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[1.3, 1.3, 0.1, 18]} />
                <meshStandardMaterial color="#854d0e" />
            </mesh>
        </group>
    );
}

/** Mennesker som kommer etter oss: små figurer rundt høna. */
function Folk({ synlig }: { synlig: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const plass = useMemo(
        () =>
            Array.from({ length: 9 }, (_, i) => {
                const a = Math.PI * 0.55 + (i / 8) * Math.PI * 0.95;
                const r = 7 + (i % 2) * 1.6;
                return { x: Math.cos(a) * r, z: Math.sin(a) * r * -1 + 2, s: i % 3 === 0 ? 1 : 0.7 };
            }),
        []
    );
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        const s = damp(g.scale.y, synlig ? 1 : 0.001, 2.5, dt || 1);
        g.scale.set(1, s, 1);
        g.visible = s > 0.02;
    });
    const farger = ['#0d9488', '#2563eb', '#db2777', '#7c3aed'];
    return (
        <group ref={ref}>
            {plass.map((p, i) => (
                <group key={i} position={[p.x, 0, p.z]} scale={p.s}>
                    <mesh position={[0, 0.9, 0]}>
                        <capsuleGeometry args={[0.38, 0.9, 4, 10]} />
                        <meshStandardMaterial color={farger[i % farger.length]} />
                    </mesh>
                    <mesh position={[0, 2, 0]}>
                        <sphereGeometry args={[0.36, 14, 10]} />
                        <meshStandardMaterial color="#e8b48c" />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

// ---------- Kamera ----------

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'plattform') {
        switch (beat) {
            case 0:
                return { pos: v(26 - t * 0.5, 9, 26), se: v(0, 5, 0) };
            case 1:
                return { pos: v(14, 8, 12), se: v(1, 6, 0) };
            case 2:
                return { pos: v(-6, 16, 30), se: v(0, 6, -30) };
            default:
                return { pos: v(0, 50 + t * 0.4, 40), se: v(0, 0, -40) };
        }
    }
    if (modus === 'kilder') {
        switch (beat) {
            case 0:
                return { pos: v(0, 30, 40), se: v(0, 2, 2) };
            case 1:
                return { pos: v(-4, 22, 32), se: v(0, 3, -1) };
            case 2:
                return { pos: v(-8, 22, 36), se: v(0, 3, 3) };
            case 3:
                return { pos: v(8, 22, 38), se: v(4, 3, 5) };
            default:
                return { pos: v(Math.sin(t * 0.06) * 6, 32, 42), se: v(2, 2, 2) };
        }
    }
    if (modus === 'verden') {
        switch (beat) {
            case 0:
                return { pos: v(-6, 16, 24), se: v(-4, 2, 0) };
            case 1:
                return { pos: v(18, 14, 14), se: v(9, 1, -2) };
            case 2:
                return { pos: v(18, 10, 18), se: v(9, 1, 5) };
            default:
                return { pos: v(Math.sin(t * 0.07) * 4, 34, 36), se: v(3, 0, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(3, 6, 13), se: v(0.5, 2.6, 0) };
        case 1:
            return { pos: v(6, 8, 15), se: v(1.5, 3, 0) };
        case 2:
            return { pos: v(5, 9, 17), se: v(4, 2, 1.5) };
        default:
            return { pos: v(Math.sin(t * 0.08) * 4, 13, 21), se: v(1, 2, 0) };
    }
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const mal = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        se.current.lerp(mal.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

function Skilt({ tekst, tone }: { tekst: string; tone: 'rod' | 'gronn' | 'gull' | 'bla' | 'vanlig' }) {
    const farge = {
        rod: 'border-red-500 text-red-700',
        gronn: 'border-teal-500 text-teal-700',
        gull: 'border-amber-500 text-amber-700',
        bla: 'border-blue-500 text-blue-700',
        vanlig: 'border-slate-300 text-slate-800',
    }[tone];
    return (
        <div className={`px-3 py-1 rounded-xl bg-white/95 shadow-lg border-2 font-bold whitespace-nowrap text-lg ${farge}`}>
            {tekst}
        </div>
    );
}

// ---------- Scenene ----------

function Hav({ farge }: { farge: string }) {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[600, 600]} />
            <meshStandardMaterial color={farge} emissive="#0b3a66" emissiveIntensity={0.25} roughness={0.5} />
        </mesh>
    );
}

function PlattformScene({ beat, playing }: { beat: number; playing: boolean }) {
    const fjerne = useMemo<Bygg[]>(
        () => FJERNE.map((p, i) => ({ pos: p, h: 6 + tilfeldig(i + 40) * 10, b: 3 + tilfeldig(i + 80) * 2 })),
        []
    );
    return (
        <>
            <color attach="background" args={['#a5c8e4']} />
            <fog attach="fog" args={['#b8d3ea', 60, 190]} />
            <Hav farge="#2a6496" />
            <Plattform fakkel />
            <Tankskip pos={beat >= 1 ? v(-9, 0, -8) : v(-50, 0, -30)} />
            <Byggefelt bygg={fjerne} farge="#cbd5e1" synlig={beat >= 2} gullbunn={beat >= 3} />
            <Myntstrom modus="plattform" beat={beat} playing={playing} />
            {beat === 1 && (
                <Html position={[-9, 4.2, -8]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Olje og gass til salgs" tone="vanlig" />
                </Html>
            )}
        </>
    );
}

function KilderScene({ beat, playing }: { beat: number; playing: boolean }) {
    const fyll = [0.12, 0.45, 0.75, 0.8, 0.95][Math.min(beat, 4)];
    return (
        <>
            <color attach="background" args={['#a5c8e4']} />
            <fog attach="fog" args={['#b8d3ea', 70, 200]} />
            <Hav farge="#2a6496" />
            <group position={PLATTFORM_A} scale={0.8}>
                <Plattform fakkel />
            </group>
            <group position={PLATTFORM_B} scale={0.7}>
                <Plattform fakkel={beat >= 2} />
            </group>
            <Kontor pos={EQUINOR} />
            <Fondet fyll={fyll} glod={beat >= 4} />
            <Myntstrom modus="kilder" beat={beat} playing={playing} />
            {(beat === 0 || beat === 1) && (
                <Html position={[PLATTFORM_A.x, 10.5, PLATTFORM_A.z]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Skatt" tone={beat === 1 ? 'gull' : 'vanlig'} />
                </Html>
            )}
            {(beat === 0 || beat === 2) && (
                <Html position={[PLATTFORM_B.x, 9.5, PLATTFORM_B.z]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Statens egne felt" tone={beat === 2 ? 'gronn' : 'vanlig'} />
                </Html>
            )}
            {(beat === 0 || beat === 3) && (
                <Html position={[EQUINOR.x, 9.5, EQUINOR.z]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Equinor" tone={beat === 3 ? 'bla' : 'vanlig'} />
                </Html>
            )}
            <Html position={[FOND.x, 9, FOND.z]} center zIndexRange={[10, 0]}>
                <Skilt tekst="Oljefondet" tone="gull" />
            </Html>
        </>
    );
}

function VerdenScene({ beat, playing }: { beat: number; playing: boolean }) {
    const aksjer = useMemo(() => byggISirkel(AKSJE_S, R_AKSJE - 0.8, 70, 1, 1.5, 7), []);
    const ekstra = useMemo(
        () =>
            Array.from({ length: 90 }, (_, i) => {
                const a = tilfeldig(i + 3000) * Math.PI * 2;
                const r = 22 + tilfeldig(i + 3500) * 20;
                return { pos: v(Math.cos(a) * r, 0, Math.sin(a) * r), h: 1.5 + tilfeldig(i + 3900) * 6, b: 1 + tilfeldig(i + 4200) * 0.6 };
            }),
        []
    );
    const hus = useMemo(() => [v(REST_S.x - 0.9, 0, REST_S.z + 0.6), v(REST_S.x + 0.9, 0, REST_S.z + 0.9)], []);
    return (
        <>
            <color attach="background" args={['#dbeafe']} />
            <fog attach="fog" args={['#dbeafe', 50, 120]} />
            <ambientLight intensity={0.15} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[80, 48]} />
                <meshStandardMaterial color="#a3c78a" />
            </mesh>
            <Felt senter={AKSJE_S} radius={R_AKSJE} farge="#bfdbfe" synlig />
            <Felt senter={OBLIG_S} radius={R_OBLIG} farge="#fecaca" synlig={beat >= 1} />
            <Felt senter={REST_S} radius={R_REST} farge="#bbf7d0" synlig={beat >= 2} />
            <Byggefelt bygg={aksjer} farge="#64748b" synlig gullbunn={beat >= 3} />
            <Papirbunker synlig={beat >= 1} />
            {beat >= 2 && (
                <>
                    {hus.map((h, i) => (
                        <Hus key={i} pos={h} />
                    ))}
                    <Vindmolle pos={v(REST_S.x + 0.2, 0, REST_S.z - 1.1)} playing={playing} />
                </>
            )}
            <Byggefelt bygg={ekstra} farge="#94a3b8" synlig={beat >= 3} gullbunn={beat >= 3} />
            {beat <= 2 && (
                <>
                    {beat === 0 && (
                        <Html position={[AKSJE_S.x, 0.5, AKSJE_S.z + R_AKSJE + 1.2]} center zIndexRange={[10, 0]}>
                            <Skilt tekst="Aksjer: deler av selskaper" tone="bla" />
                        </Html>
                    )}
                    {beat >= 1 && (
                        <Html position={[OBLIG_S.x + 2, 0.5, OBLIG_S.z - R_OBLIG - 0.5]} center zIndexRange={[10, 0]}>
                            <Skilt tekst="Obligasjoner: lån" tone={beat === 1 ? 'rod' : 'vanlig'} />
                        </Html>
                    )}
                    {beat >= 2 && (
                        <Html position={[REST_S.x + 1, 0.3, REST_S.z + R_REST + 1]} center zIndexRange={[10, 0]}>
                            <Skilt tekst="Eiendom og fornybar energi" tone="gronn" />
                        </Html>
                    )}
                </>
            )}
            {beat >= 3 && (
                <Html position={[3, 0.5, 12]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Gull nederst: i snitt eier fondet 1,5 prosent av alle børsselskapene" tone="gull" />
                </Html>
            )}
        </>
    );
}

function HonaScene({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            <color attach="background" args={['#e0f2fe']} />
            <fog attach="fog" args={['#e0f2fe', 40, 90]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[60, 48]} />
                <meshStandardMaterial color="#a3c78a" />
            </mesh>
            <Reir />
            <group position={[0, 0.4, 0]}>
                <Hone />
            </group>
            <Egg beat={beat} playing={playing} />
            <Kurv />
            <Folk synlig={beat >= 3} />
            {beat <= 2 && (
                <Html position={[-3.6, 1.2, 2.4]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Høna = fondet" tone="gull" />
                </Html>
            )}
            {beat === 1 && (
                <Html position={[KURV.x, 3.4, KURV.z]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Bruk bare eggene" tone="gronn" />
                </Html>
            )}
            {beat === 0 && (
                <Html position={[4, 1.8, 3.6]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Eggene = det fondet tjener" tone="gronn" />
                </Html>
            )}
            {beat === 2 && (
                <Html position={[KURV.x, 3.4, KURV.z]} center zIndexRange={[10, 0]}>
                    <Skilt tekst="Bruker vi" tone="gronn" />
                </Html>
            )}
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[20, 30, 15]} intensity={1.4} color="#fff7e6" />
            <hemisphereLight args={['#e0f2fe', '#4b5563', 0.5]} />
            {modus === 'plattform' && <PlattformScene beat={beat} playing={playing} />}
            {modus === 'kilder' && <KilderScene beat={beat} playing={playing} />}
            {modus === 'verden' && <VerdenScene beat={beat} playing={playing} />}
            {modus === 'hona' && <HonaScene beat={beat} playing={playing} />}
            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

export function OljefondetReisen({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'plattform';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, near: 0.5, far: 600, position: [26, 9, 26] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
