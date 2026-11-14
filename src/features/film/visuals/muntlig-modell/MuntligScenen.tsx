import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * De tre tekstene i modellsvaret som tre små steder i 3D:
 * - skog / troll: eventyrskogen med bonden, de tre sønnene og trollet (Askeladden)
 * - kai: fergemannshuset på kaia i Kristiania, våt snø og gasslykter (Karens jul)
 * - by: gata i Kristiania, en ung mann på en benk med tankene sine (Sult)
 * Bare stedet for modusen bygges. Merkelappene ligger som DOM over lerretet.
 */

type Modus = 'skog' | 'troll' | 'kai' | 'by';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

interface Kam {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kam {
    const drift = Math.min(t, 12) * 0.12;
    if (modus === 'skog') {
        if (beat <= 1) return { pos: v(-1.2 + drift, 2.1, 8.5 - beat), se: v(-5.6, 1.2, 0.3) };
        if (beat === 2) return { pos: v(-2.2, 2.4, 6.2), se: v(-4, 1.8, 0.8) };
        return { pos: v(2 + drift, 8, 24), se: v(1.5, 2.2, -1) };
    }
    if (modus === 'troll') {
        if (beat === 0) return { pos: v(-1 + drift, 9, 26), se: v(0, 2, -2) };
        if (beat === 1) return { pos: v(-5.5, 2.4, 9.5), se: v(-7, 1.2, 0) };
        if (beat === 2) return { pos: v(6.5, 4, 17), se: v(7.5, 3, -0.5) };
        if (beat === 3) return { pos: v(3.2, 1.7, 4.6), se: v(5.2, 1, 0.8) };
        return { pos: v(0.5 + drift, 3.2, 14), se: v(7.5, 2.8, 0) };
    }
    if (modus === 'kai') {
        if (beat === 0) return { pos: v(1 + drift, 6, 20), se: v(2, 1.5, 0) };
        if (beat === 1) return { pos: v(5.2, 2.3, 7.5), se: v(2, 1.3, -0.8) };
        if (beat === 2) return { pos: v(-1.5, 3.2, 8), se: v(-6, 3, 2) };
        if (beat === 3) return { pos: v(-2 + drift, 11, 23), se: v(3, 0, -2) };
        return { pos: v(5, 2, 6.5), se: v(2, 1.4, -1) };
    }
    // by
    if (beat === 0) return { pos: v(-2 + drift, 5, 18), se: v(0, 3, -3) };
    if (beat === 1) return { pos: v(1.8, 2, 4.8), se: v(0, 1.6, 1) };
    if (beat === 2) return { pos: v(-7 + drift, 3.5, 13), se: v(2, 3, -4) };
    return { pos: v(2.8, 1.7, 5.2), se: v(0, 1.1, 1) };
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const se = useRef(new THREE.Vector3());
    const forrigeBeat = useRef(-1);
    const beatTid = useRef(0);
    const forste = useRef(true);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const k = kameraFor(modus, beat, beatTid.current);
        if (forste.current) {
            camera.position.copy(k.pos);
            se.current.copy(k.se);
            forste.current = false;
        } else {
            const f = 1 - Math.exp(-1.3 * dt);
            camera.position.lerp(k.pos, f);
            se.current.lerp(k.se, f);
        }
        camera.lookAt(se.current);
    });
    return null;
}

function Mat({ farge, glod = 0.25 }: { farge: string; glod?: number }) {
    return (
        <meshStandardMaterial color={farge} emissive={farge} emissiveIntensity={glod} flatShading />
    );
}

/** Et enkelt menneske av kapsel og kule. */
function Person({
    pos,
    skala = 1,
    kropp,
    lue,
    boyd = 0,
}: {
    pos: [number, number, number];
    skala?: number;
    kropp: string;
    lue?: string;
    boyd?: number;
}) {
    return (
        <group position={pos} scale={skala} rotation={[boyd, 0, 0]}>
            <mesh position={[0, 0.85, 0]}>
                <capsuleGeometry args={[0.3, 0.9, 4, 8]} />
                <Mat farge={kropp} />
            </mesh>
            <mesh position={[0, 1.68, 0]}>
                <sphereGeometry args={[0.27, 12, 10]} />
                <Mat farge="#f1c9a5" glod={0.3} />
            </mesh>
            {lue && (
                <mesh position={[0, 1.98, 0]}>
                    <coneGeometry args={[0.24, 0.42, 10]} />
                    <Mat farge={lue} glod={0.4} />
                </mesh>
            )}
        </group>
    );
}

const TRAER: [number, number, number][] = [
    [2, -8, 1.3],
    [6, -10, 1.6],
    [13, -8, 1.4],
    [17, -4, 1.2],
    [-1, -12, 1.5],
    [9, -13, 1.7],
    [15, 2, 1.1],
    [-16, -9, 1.3],
    [-3, -6, 1.0],
    [19, -11, 1.5],
];

function Eventyr({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const iSkogen = modus === 'troll' && beat >= 2;
    const gutt: [number, number, number] = iSkogen ? [5, 0, 1] : [-4, 0, 1];
    const stjerne = useRef<THREE.Mesh>(null);
    const draper = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const tid = useRef(0);
    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        tid.current += dt;
        if (stjerne.current) {
            stjerne.current.rotation.y = tid.current * 1.2;
            stjerne.current.position.y = 2.9 + Math.sin(tid.current * 2) * 0.1;
        }
        const m = draper.current;
        if (m) {
            for (let i = 0; i < 10; i++) {
                const a = (tid.current * 0.9 + i / 10) % 1;
                o.position.set(0.42 + Math.sin(i * 2.3) * 0.05, 1.0 - a * 1.0, 0.32);
                o.scale.setScalar(0.045);
                o.updateMatrix();
                m.setMatrixAt(i, o.matrix);
            }
            m.instanceMatrix.needsUpdate = true;
        }
    });
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[60, 40]} />
                <meshStandardMaterial color="#6f9a52" emissive="#3f6b2c" emissiveIntensity={0.35} />
            </mesh>
            {TRAER.map(([x, z, s]) => (
                <group key={`${x}:${z}`} position={[x, 0, z]} scale={s}>
                    <mesh position={[0, 0.8, 0]}>
                        <cylinderGeometry args={[0.18, 0.24, 1.6, 6]} />
                        <Mat farge="#6b4a2f" />
                    </mesh>
                    <mesh position={[0, 3, 0]}>
                        <coneGeometry args={[1.4, 3.6, 7]} />
                        <Mat farge="#2f5d3a" glod={0.3} />
                    </mesh>
                </group>
            ))}
            {/* Den lille gården */}
            <group position={[-12, 0, -3]}>
                <mesh position={[0, 1.1, 0]}>
                    <boxGeometry args={[4, 2.2, 3]} />
                    <Mat farge="#8a5a3a" />
                </mesh>
                <mesh position={[0, 2.7, 0]} rotation={[0, 0, Math.PI / 4]}>
                    <boxGeometry args={[2.3, 2.3, 3.2]} />
                    <Mat farge="#4a3a2a" />
                </mesh>
            </group>
            {/* Bonden og de to eldste sønnene */}
            <Person pos={[-9.2, 0, 0]} kropp="#7c7c74" boyd={0.25} />
            <Person pos={[-7.6, 0, 0.4]} skala={1.08} kropp="#3f5f8a" />
            <Person pos={[-6.1, 0, 0.2]} skala={1.02} kropp="#7a3f3f" />
            {/* Askeladden: minst, med rød lue */}
            <group position={gutt} rotation={[0, iSkogen ? 0.9 : 0, 0]}>
                <Person pos={[0, 0, 0]} skala={0.74} kropp="#b7894a" lue="#dc2626" />
                {modus === 'troll' && beat >= 3 && (
                    <>
                        <mesh position={[0.42, 1.08, 0.32]}>
                            <cylinderGeometry args={[0.16, 0.16, 0.16, 12]} />
                            <meshStandardMaterial
                                color="#fffbe8"
                                emissive="#fff3c4"
                                emissiveIntensity={0.6}
                            />
                        </mesh>
                        <instancedMesh
                            ref={draper}
                            args={[undefined, undefined, 10]}
                            frustumCulled={false}
                        >
                            <sphereGeometry args={[1, 6, 5]} />
                            <meshBasicMaterial color="#bfe6ff" />
                        </instancedMesh>
                    </>
                )}
            </group>
            {modus === 'skog' && beat >= 2 && (
                <mesh ref={stjerne} position={[gutt[0], 2.9, gutt[2]]}>
                    <octahedronGeometry args={[0.32, 0]} />
                    <meshStandardMaterial
                        color="#fde047"
                        emissive="#facc15"
                        emissiveIntensity={1.4}
                    />
                </mesh>
            )}
            {/* Trollet */}
            <group position={[10, 0, -1]} rotation={[0, -0.6, 0]}>
                <mesh position={[0, 3.2, 0]} scale={[1, 1.3, 0.85]}>
                    <sphereGeometry args={[2, 12, 10]} />
                    <Mat farge="#6b7a4a" />
                </mesh>
                <mesh position={[0, 6.2, 0.2]}>
                    <sphereGeometry args={[1.2, 12, 10]} />
                    <Mat farge="#7a8a55" />
                </mesh>
                <mesh position={[0, 5.75, 1.75]} rotation={[Math.PI / 2 + 0.45, 0, 0]}>
                    <coneGeometry args={[0.45, 1.9, 8]} />
                    <Mat farge="#8a9a5f" />
                </mesh>
                {[-0.45, 0.45].map((x) => (
                    <mesh key={x} position={[x, 6.55, 1.3]}>
                        <sphereGeometry args={[0.22, 8, 6]} />
                        <meshStandardMaterial
                            color="#fef9c3"
                            emissive="#fde68a"
                            emissiveIntensity={0.9}
                        />
                    </mesh>
                ))}
                {[-1.2, 1.2].map((x) => (
                    <mesh key={x} position={[x, 0.7, 0]}>
                        <cylinderGeometry args={[0.45, 0.55, 1.6, 8]} />
                        <Mat farge="#5a6840" />
                    </mesh>
                ))}
                {[-2.1, 2.1].map((x) => (
                    <mesh key={x} position={[x, 3.2, 0.2]} rotation={[0, 0, x > 0 ? -0.35 : 0.35]}>
                        <cylinderGeometry args={[0.35, 0.4, 3, 8]} />
                        <Mat farge="#5a6840" />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

const SNO = 180;
function Sno({ playing }: { playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const start = useMemo(
        () =>
            Array.from({ length: SNO }, (_, i) => ({
                x: -12 + ((i * 37) % 300) / 10,
                z: -4 + ((i * 53) % 100) / 10,
                y: ((i * 71) % 120) / 10,
            })),
        []
    );
    const tid = useRef(0);
    useFrame((_, delta) => {
        const m = ref.current;
        if (!m) return;
        tid.current += playing ? Math.min(delta, 0.05) : 0;
        start.forEach((s, i) => {
            const y = (((s.y - tid.current * 1.1) % 12) + 12) % 12;
            // Våt snø: fnuggene krymper mot bakken og er borte før de lander.
            const sk = 0.07 * Math.min(1, Math.max(0, (y - 0.3) / 3));
            o.position.set(s.x + Math.sin(tid.current + i) * 0.2, y, s.z);
            o.scale.setScalar(sk);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, SNO]} frustumCulled={false}>
            <sphereGeometry args={[1, 6, 5]} />
            <meshBasicMaterial color="#e2e8f0" />
        </instancedMesh>
    );
}

const LYKTER = [-6, 8, 15];

function Kai({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#1f3347" emissive="#1a2d40" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[3, -0.3, 0]}>
                <boxGeometry args={[40, 0.6, 9]} />
                <Mat farge="#4f463e" glod={0.3} />
            </mesh>
            {/* Fergemannshuset */}
            <group position={[2, 0, -1]}>
                <mesh position={[0, 1.2, 0]}>
                    <boxGeometry args={[3, 2.4, 2.6]} />
                    <Mat farge="#5b4a3a" />
                </mesh>
                <mesh position={[0, 2.75, 0]} rotation={[0, 0, Math.PI / 4]}>
                    <boxGeometry args={[1.6, 1.6, 2.8]} />
                    <Mat farge="#3b302a" />
                </mesh>
                <mesh position={[-0.6, 0.85, 1.31]}>
                    <boxGeometry args={[0.8, 1.7, 0.05]} />
                    <Mat farge="#2a211b" />
                </mesh>
                <mesh position={[0.75, 1.5, 1.31]}>
                    <boxGeometry args={[0.6, 0.5, 0.05]} />
                    <meshStandardMaterial
                        color="#6b5534"
                        emissive="#8a6a2e"
                        emissiveIntensity={0.5}
                    />
                </mesh>
            </group>
            {/* Karen med barnet i døråpningen, når stemmen snakker om henne */}
            {(beat === 1 || beat === 4) && (
                <group position={[1.4, 0, 0.55]}>
                    <Person pos={[0, 0, 0]} skala={0.9} kropp="#57534e" />
                    <mesh position={[0.05, 1.05, 0.3]}>
                        <sphereGeometry args={[0.2, 10, 8]} />
                        <Mat farge="#e7e5e4" glod={0.4} />
                    </mesh>
                </group>
            )}
            {LYKTER.map((x) => (
                <group key={x} position={[x, 0, 3]}>
                    <mesh position={[0, 2, 0]}>
                        <cylinderGeometry args={[0.08, 0.12, 4, 6]} />
                        <Mat farge="#1f2937" />
                    </mesh>
                    <mesh position={[0, 4.2, 0]}>
                        <boxGeometry args={[0.45, 0.6, 0.45]} />
                        <meshStandardMaterial
                            color="#d18f2e"
                            emissive="#c27a1c"
                            emissiveIntensity={1.3}
                        />
                    </mesh>
                </group>
            ))}
            <pointLight position={[-6, 4, 3]} color="#d18f2e" intensity={12} distance={12} />
            {/* Byen i bakgrunnen */}
            {[-14, -8, -2, 4, 10, 16, 22].map((x, i) => (
                <mesh key={x} position={[x, 2.5 + (i % 3), -14]}>
                    <boxGeometry args={[5, 5 + (i % 3) * 2, 3]} />
                    <Mat farge="#323b46" glod={0.2} />
                </mesh>
            ))}
            <Sno playing={playing} />
        </group>
    );
}

const HUS = [-18, -13, -8, -3, 2, 7, 12, 17];
const HUSFARGER = ['#9a7b5c', '#8a8178', '#a38a63', '#7d746c'];

function Vinduer() {
    const lys = useRef<THREE.InstancedMesh>(null);
    const morke = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const ferdig = useRef(false);
    useFrame(() => {
        const lysM = lys.current;
        const morkM = morke.current;
        if (ferdig.current || !lysM || !morkM) return;
        let l = 0;
        let m = 0;
        HUS.forEach((x, h) => {
            for (let etg = 0; etg < 3; etg++) {
                for (let k = 0; k < 3; k++) {
                    o.position.set(x - 1.3 + k * 1.3, 1.6 + etg * 2, -4.48);
                    o.scale.set(0.6, 0.9, 1);
                    o.updateMatrix();
                    if ((h * 7 + etg * 3 + k) % 4 === 0) lysM.setMatrixAt(l++, o.matrix);
                    else morkM.setMatrixAt(m++, o.matrix);
                }
            }
        });
        lysM.count = l;
        morkM.count = m;
        lysM.instanceMatrix.needsUpdate = true;
        morkM.instanceMatrix.needsUpdate = true;
        ferdig.current = true;
    });
    return (
        <>
            <instancedMesh ref={lys} args={[undefined, undefined, 72]} frustumCulled={false}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial color="#f4c76b" />
            </instancedMesh>
            <instancedMesh ref={morke} args={[undefined, undefined, 72]} frustumCulled={false}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial color="#3a3530" />
            </instancedMesh>
        </>
    );
}

function By({ beat, playing }: { beat: number; playing: boolean }) {
    const glod = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    useFrame((_, delta) => {
        tid.current += playing ? Math.min(delta, 0.05) : 0;
        if (glod.current) glod.current.scale.setScalar(1 + Math.sin(tid.current * 2.2) * 0.08);
    });
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[120, 120]} />
                <meshStandardMaterial color="#6e6a66" emissive="#4a4744" emissiveIntensity={0.4} />
            </mesh>
            {HUS.map((x, i) => (
                <mesh key={x} position={[x, 3.5 + (i % 2), -6]}>
                    <boxGeometry args={[4.8, 7 + (i % 2) * 2, 3]} />
                    <Mat farge={HUSFARGER[i % HUSFARGER.length]} glod={0.25} />
                </mesh>
            ))}
            <Vinduer />
            {/* Gatelykt */}
            <group position={[-3, 0, 1.6]}>
                <mesh position={[0, 2, 0]}>
                    <cylinderGeometry args={[0.07, 0.1, 4, 6]} />
                    <Mat farge="#1f2937" />
                </mesh>
                <mesh position={[0, 4.15, 0]}>
                    <boxGeometry args={[0.4, 0.5, 0.4]} />
                    <meshStandardMaterial
                        color="#f4c76b"
                        emissive="#e0a53a"
                        emissiveIntensity={1.2}
                    />
                </mesh>
            </group>
            {/* Benken og mannen som sitter der */}
            <group position={[0, 0, 1]}>
                <mesh position={[0, 0.5, 0]}>
                    <boxGeometry args={[2.4, 0.12, 0.6]} />
                    <Mat farge="#5b3f2a" />
                </mesh>
                {[-1, 1].map((x) => (
                    <mesh key={x} position={[x, 0.25, 0]}>
                        <boxGeometry args={[0.1, 0.5, 0.5]} />
                        <Mat farge="#2a211b" />
                    </mesh>
                ))}
                <mesh position={[0, 1.05, -0.05]}>
                    <capsuleGeometry args={[0.24, 0.6, 4, 8]} />
                    <Mat farge="#3a3a44" />
                </mesh>
                <mesh position={[0, 0.62, 0.3]}>
                    <boxGeometry args={[0.4, 0.16, 0.6]} />
                    <Mat farge="#2f2f38" />
                </mesh>
                <mesh position={[0, 0.32, 0.58]}>
                    <boxGeometry args={[0.38, 0.6, 0.14]} />
                    <Mat farge="#2f2f38" />
                </mesh>
                <mesh position={[0, 1.67, 0]}>
                    <sphereGeometry args={[0.22, 12, 10]} />
                    <Mat farge="#e8c4a0" glod={0.3} />
                </mesh>
                <mesh position={[0, 1.9, 0]}>
                    <cylinderGeometry args={[0.24, 0.26, 0.22, 12]} />
                    <Mat farge="#1c1c22" />
                </mesh>
                {beat >= 1 && (
                    <mesh ref={glod} position={[0, 1.7, 0]}>
                        <sphereGeometry args={[0.55, 16, 12]} />
                        <meshBasicMaterial
                            color="#c084fc"
                            transparent
                            opacity={0.35}
                            depthWrite={false}
                        />
                    </mesh>
                )}
            </group>
        </group>
    );
}

const HIMMEL: Record<Modus, { bg: string; fog: [number, number]; lys: number }> = {
    skog: { bg: '#a9c7d9', fog: [40, 120], lys: 1.0 },
    troll: { bg: '#a9c7d9', fog: [40, 120], lys: 1.0 },
    kai: { bg: '#2f3a47', fog: [22, 80], lys: 0.55 },
    by: { bg: '#8c8478', fog: [25, 90], lys: 0.85 },
};

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const h = HIMMEL[modus];
    return (
        <>
            <color attach="background" args={[h.bg]} />
            <fog attach="fog" args={[h.bg, h.fog[0], h.fog[1]]} />
            <hemisphereLight args={['#ffffff', '#3b3b3b', h.lys]} />
            <directionalLight position={[-15, 25, 20]} intensity={h.lys * 1.3} />
            <Kamera modus={modus} beat={beat} playing={playing} />
            {(modus === 'skog' || modus === 'troll') && (
                <Eventyr modus={modus} beat={beat} playing={playing} />
            )}
            {modus === 'kai' && <Kai beat={beat} playing={playing} />}
            {modus === 'by' && <By beat={beat} playing={playing} />}
        </>
    );
}

interface Merke {
    fraBeat: number;
    tilBeat?: number;
    tittel: string;
    tekst?: string;
    x: number;
    y: number;
    tone: 'lys' | 'mork' | 'gull' | 'sitat';
    bredde?: number;
}

const MERKER: Record<Modus, Merke[]> = {
    skog: [
        {
            fraBeat: 0,
            tilBeat: 1,
            tittel: 'Den minste broren',
            tekst: 'fattig, og ledd av',
            x: 4,
            y: 7,
            tone: 'lys',
        },
        { fraBeat: 1, tilBeat: 1, tittel: 'Ingen tror på ham', x: 4, y: 30, tone: 'mork' },
        {
            fraBeat: 2,
            tilBeat: 2,
            tittel: 'Eventyret lover:',
            tekst: 'han kommer til å vinne',
            x: 4,
            y: 7,
            tone: 'gull',
        },
        {
            fraBeat: 3,
            tittel: 'Muntlig eksamen i norsk',
            tekst: 'slik åpner en tenkt elev',
            x: 4,
            y: 7,
            tone: 'lys',
        },
        { fraBeat: 4, tittel: 'Hvorfor gir den en 6-er?', x: 4, y: 30, tone: 'gull' },
    ],
    troll: [
        {
            fraBeat: 0,
            tilBeat: 0,
            tittel: 'Askeladden som kappåt med trollet',
            tekst: 'samlet av Asbjørnsen og Moe på 1840-tallet',
            x: 4,
            y: 7,
            tone: 'lys',
            bredde: 46,
        },
        {
            fraBeat: 1,
            tilBeat: 1,
            tittel: 'Askeladden',
            tekst: 'den yngste av tre sønner',
            x: 4,
            y: 7,
            tone: 'gull',
        },
        { fraBeat: 2, tilBeat: 2, tittel: 'Liten og svak', x: 4, y: 7, tone: 'lys' },
        { fraBeat: 2, tilBeat: 2, tittel: 'Stort og sterkt', x: 70, y: 70, tone: 'mork' },
        {
            fraBeat: 3,
            tilBeat: 3,
            tittel: 'En hvit ost',
            tekst: 'trollet tror det er en stein',
            x: 4,
            y: 7,
            tone: 'lys',
        },
        {
            fraBeat: 4,
            tittel: 'Den smarte kontrasten',
            tekst: 'den lille vinner fordi han er smartere',
            x: 4,
            y: 7,
            tone: 'gull',
        },
    ],
    kai: [
        {
            fraBeat: 0,
            tilBeat: 0,
            tittel: 'Karens jul',
            tekst: 'Amalie Skram, 1885',
            x: 4,
            y: 7,
            tone: 'lys',
        },
        {
            fraBeat: 1,
            tilBeat: 1,
            tittel: 'Et forlatt fergemannshus',
            tekst: 'på en kai i Kristiania',
            x: 4,
            y: 7,
            tone: 'lys',
        },
        {
            fraBeat: 2,
            tilBeat: 2,
            tittel: 'Snøen smelter mens den faller',
            x: 4,
            y: 7,
            tone: 'lys',
        },
        { fraBeat: 2, tilBeat: 2, tittel: 'Skittent, branngult lys', x: 4, y: 24, tone: 'gull' },
        {
            fraBeat: 3,
            tilBeat: 3,
            tittel: 'Naturalismen',
            tekst: 'miljøet bestemmer mennesket',
            x: 4,
            y: 7,
            tone: 'mork',
        },
        {
            fraBeat: 4,
            tittel: '«Det er bare meg, Karen. Jæ sitter her med ungen min.»',
            tekst: 'Karens jul, Amalie Skram (1885)',
            x: 4,
            y: 64,
            tone: 'sitat',
            bredde: 56,
        },
    ],
    by: [
        {
            fraBeat: 0,
            tilBeat: 0,
            tittel: 'Sult',
            tekst: 'Knut Hamsun, 1890',
            x: 4,
            y: 7,
            tone: 'lys',
        },
        { fraBeat: 1, tilBeat: 1, tittel: 'Skram: motgangen i samfunnet', x: 4, y: 7, tone: 'lys' },
        { fraBeat: 1, tilBeat: 1, tittel: 'Hamsun: motgangen i hodet', x: 4, y: 24, tone: 'gull' },
        {
            fraBeat: 2,
            tilBeat: 2,
            tittel: '«Det var i den tid jeg gikk omkring og sultet i Kristiania, denne forunderlige by som ingen forlater før han har fått merker av den.»',
            tekst: 'Sult, Knut Hamsun (1890)',
            x: 4,
            y: 6,
            tone: 'sitat',
            bredde: 62,
        },
        {
            fraBeat: 3,
            tittel: 'Ung skribent uten penger',
            tekst: 'har pantsatt tingene sine',
            x: 4,
            y: 7,
            tone: 'lys',
        },
    ],
};

const TONE: Record<Merke['tone'], string> = {
    lys: 'bg-white/95 text-slate-900',
    mork: 'bg-slate-900/90 text-white',
    gull: 'bg-amber-300/95 text-slate-900',
    sitat: 'bg-slate-950/85 text-amber-50',
};

export function MuntligScenen({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'skog';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const merker = MERKER[modus].filter(
        (m) => beat >= m.fraBeat && (m.tilBeat === undefined || beat <= m.tilBeat)
    );
    const start = kameraFor(modus, 0, 0).pos;
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [start.x, start.y, start.z] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                {merker.map((m) => (
                    <motion.div
                        key={m.tittel}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className={`absolute rounded-2xl shadow-xl px-5 py-3 ${TONE[m.tone]}`}
                        style={{ left: `${m.x}%`, top: `${m.y}%`, maxWidth: `${m.bredde ?? 38}%` }}
                    >
                        <div
                            className={
                                m.tone === 'sitat'
                                    ? 'text-2xl font-semibold italic leading-snug'
                                    : 'text-2xl font-black leading-tight'
                            }
                            style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
                        >
                            {m.tittel}
                        </div>
                        {m.tekst && (
                            <div className="text-lg font-semibold opacity-90 mt-1">{m.tekst}</div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
