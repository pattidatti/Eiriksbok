import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Skriverådene spilt ut som små scener. «venter»: en gutt sitter i ørkenen og venter på at
 * noen skal hente ham. «agens»: den samme gutten reiser seg, tar sekken og går mot fjellene.
 * «lyset»: et rom der lyset går etter et smell, og til slutt knuses et glass. «snik»: vi
 * sniker oss mot en vakt med jeg-personens øyne, og hopper et øyeblikk inn i hodet på vakten.
 */

type Modus = 'venter' | 'agens' | 'lyset' | 'snik';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/* ---------------------------------------------------------------- figuren */

interface Kropp {
    gruppe: THREE.Group | null;
    hofte: THREE.Group | null;
    bein: (THREE.Group | null)[];
}

/** En enkel figur som ser mot -z. «sitt» (0-1) bøyer beina fram og senker kroppen. */
function Figur({
    gruppe,
    hofte,
    bein,
    klaer,
    lue,
}: {
    gruppe: React.RefObject<THREE.Group | null>;
    hofte: React.RefObject<THREE.Group | null>;
    bein: React.RefObject<(THREE.Group | null)[]>;
    klaer: string;
    lue?: string;
}) {
    return (
        <group ref={gruppe}>
            <group ref={hofte} position={[0, 0.9, 0]}>
                {[-0.12, 0.12].map((x, i) => (
                    <group
                        key={x}
                        position={[x, 0, 0]}
                        ref={(g) => {
                            bein.current[i] = g;
                        }}
                    >
                        <mesh position={[0, -0.45, 0]}>
                            <boxGeometry args={[0.16, 0.9, 0.18]} />
                            <meshStandardMaterial color="#1f2937" />
                        </mesh>
                    </group>
                ))}
                <mesh position={[0, 0.33, 0]}>
                    <boxGeometry args={[0.46, 0.66, 0.28]} />
                    <meshStandardMaterial color={klaer} />
                </mesh>
                {[-0.3, 0.3].map((x) => (
                    <mesh key={x} position={[x, 0.28, 0]}>
                        <boxGeometry args={[0.11, 0.58, 0.12]} />
                        <meshStandardMaterial color={klaer} />
                    </mesh>
                ))}
                <mesh position={[0, 0.8, 0]}>
                    <sphereGeometry args={[0.16, 16, 12]} />
                    <meshStandardMaterial color="#e8b996" />
                </mesh>
                <mesh position={[0, 0.86, 0.02]}>
                    <sphereGeometry args={[0.17, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color={lue ?? '#3f2a14'} />
                </mesh>
                {lue && (
                    <mesh position={[0, 0.9, -0.12]}>
                        <boxGeometry args={[0.3, 0.04, 0.16]} />
                        <meshStandardMaterial color={lue} />
                    </mesh>
                )}
            </group>
        </group>
    );
}

/** Setter posituren: hvor figuren står, hvor den ser, hvor mye den sitter og om den går. */
function stillOpp(
    k: Kropp,
    pos: THREE.Vector3,
    retning: number,
    sitt: number,
    steg: number,
    gar: boolean,
    huk = 0
) {
    if (k.gruppe) {
        k.gruppe.position.copy(pos);
        k.gruppe.rotation.y = retning;
    }
    if (k.hofte) {
        k.hofte.position.y = 0.9 - sitt * 0.62 - huk * 0.3;
        k.hofte.rotation.x = -huk * 0.5;
    }
    k.bein.forEach((b, i) => {
        if (!b) return;
        const sving = gar ? Math.sin(steg + i * Math.PI) * 0.5 : 0;
        b.rotation.x = sitt * (Math.PI / 2) + sving + huk * 0.9;
    });
}

/* ---------------------------------------------------------------- ørkenen */

const SOL_HOY = v(-8, 11, -70);
const SOL_LAV = v(20, 6, -70);
const SPOR_AVSTAND = 0.7;
const MAKS_SPOR = 40;

function guttMalZ(modus: Modus, beat: number) {
    if (modus === 'venter' || beat <= 1) return 0;
    if (beat === 2) return -5;
    if (beat === 3) return -12;
    return -20;
}

function orkenKamera(modus: Modus, beat: number, t: number, gz: number) {
    if (modus === 'venter') {
        if (beat === 0) return { pos: v(6.5 - Math.min(t, 8) * 0.15, 2.3, 7), se: v(0, 0.7, 0) };
        if (beat === 1) return { pos: v(2.4, 1.3, 2.6), se: v(0, 0.75, 0) };
        if (beat === 2) return { pos: v(-5, 2.2, 6.5), se: v(4, 3, -14) };
        return { pos: v(0, 7 + Math.min(t, 8) * 0.5, 8), se: v(0, 0.4, 0) };
    }
    if (beat === 0) return { pos: v(5, 2.1, 6), se: v(0, 0.7, 0) };
    if (beat === 1) return { pos: v(1.6, 1.7, 3.8), se: v(0, 1.3, -10) };
    if (beat === 2) return { pos: v(3, 2.2, gz + 5), se: v(0, 1, gz - 6) };
    if (beat === 3) return { pos: v(0.4, 3, gz + 7), se: v(0, 0.8, gz - 10) };
    return { pos: v(13, 9, gz + 12), se: v(0, 0.5, gz - 4) };
}

const ORKEN = {
    sand: { color: '#e9c48a', emissive: '#7a5426', emissiveIntensity: 0.35 },
    dyne: { color: '#dcb070', emissive: '#6b4720', emissiveIntensity: 0.35 },
    fjell: { color: '#8b7d99', emissive: '#3a3150', emissiveIntensity: 0.35 },
};

function Orkenen({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const kroppG = useRef<THREE.Group>(null);
    const kroppH = useRef<THREE.Group>(null);
    const kroppB = useRef<(THREE.Group | null)[]>([]);
    const sekk = useRef<THREE.Mesh>(null);
    const sol = useRef<THREE.Mesh>(null);
    const lys = useRef<THREE.DirectionalLight>(null);
    const spor = useRef<THREE.InstancedMesh>(null);
    const sporKlar = useRef(false);
    const se = useRef(new THREE.Vector3());
    const gz = useRef(0);
    const sitt = useRef(1);
    const steg = useRef(0);
    const solPos = useRef(SOL_HOY.clone());
    const forrigeBeat = useRef(-1);
    const beatTid = useRef(0);
    const forste = useRef(true);

    const sporMatriser = useMemo(() => {
        const m = new THREE.Object3D();
        return Array.from({ length: MAKS_SPOR }, (_, i) => {
            m.position.set(i % 2 ? 0.13 : -0.13, 0.02, -(i + 1) * SPOR_AVSTAND + 0.3);
            m.rotation.set(-Math.PI / 2, 0, 0);
            m.updateMatrix();
            return m.matrix.clone();
        });
    }, []);

    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;

        // Står han, sitter han eller går han?
        const sittMal = modus === 'venter' || beat === 0 ? 1 : 0;
        const malZ = guttMalZ(modus, beat);
        if (forste.current) {
            gz.current = malZ;
            sitt.current = sittMal;
        }
        sitt.current = THREE.MathUtils.lerp(sitt.current, sittMal, 1 - Math.exp(-3 * dt));
        const igjen = malZ - gz.current;
        const gar = Math.abs(igjen) > 0.02 && sitt.current < 0.1;
        if (gar) {
            gz.current += Math.sign(igjen) * Math.min(Math.abs(igjen), 1.5 * dt);
            steg.current += dt * 7;
        }
        stillOpp(
            { gruppe: kroppG.current, hofte: kroppH.current, bein: kroppB.current },
            v(0, 0, gz.current),
            0,
            sitt.current,
            steg.current,
            gar
        );

        if (sekk.current) {
            if (modus === 'agens' && beat >= 2) {
                sekk.current.position.set(0, 1.3 - sitt.current * 0.6, gz.current + 0.26);
            } else {
                sekk.current.position.set(-0.6, 0.2, 0.1);
            }
        }

        if (spor.current && !sporKlar.current) {
            sporMatriser.forEach((m, i) => spor.current!.setMatrixAt(i, m));
            spor.current.instanceMatrix.needsUpdate = true;
            sporKlar.current = true;
        }
        if (spor.current) {
            const antall = Math.min(MAKS_SPOR, Math.floor(-gz.current / SPOR_AVSTAND));
            spor.current.count = Math.max(0, antall);
        }

        // Sola glir over himmelen mens han venter.
        const solMal = modus === 'venter' && beat >= 2 ? SOL_LAV : SOL_HOY;
        if (forste.current) solPos.current.copy(solMal);
        solPos.current.lerp(solMal, 1 - Math.exp(-0.5 * dt));
        sol.current?.position.copy(solPos.current);
        lys.current?.position.copy(solPos.current);

        const kam = orkenKamera(modus, beat, t, gz.current);
        if (forste.current) {
            camera.position.copy(kam.pos);
            se.current.copy(kam.se);
            forste.current = false;
        } else {
            const f = 1 - Math.exp(-1.3 * dt);
            camera.position.lerp(kam.pos, f);
            se.current.lerp(kam.se, f);
        }
        camera.lookAt(se.current);
    });

    const dyner: [number, number, number, number][] = [
        [-14, -10, 7, 1.4],
        [12, -16, 9, 1.8],
        [-6, -30, 10, 2.2],
        [18, 4, 6, 1.2],
        [-18, 6, 8, 1.3],
        [6, -40, 12, 2.6],
    ];
    const fjell: [number, number, number][] = [
        [-30, 22, 16],
        [-12, 30, 20],
        [6, 26, 18],
        [24, 34, 22],
        [40, 24, 16],
    ];
    return (
        <>
            <color attach="background" args={['#f6d9a8']} />
            <fog attach="fog" args={['#f6d9a8', 40, 120]} />
            <hemisphereLight args={['#fff4dc', '#b58a52', 1.1]} />
            <directionalLight ref={lys} intensity={1.5} color="#fff1d0" />
            <mesh ref={sol}>
                <sphereGeometry args={[4, 24, 16]} />
                <meshBasicMaterial color="#fff3b0" fog={false} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[300, 300]} />
                <meshStandardMaterial {...ORKEN.sand} />
            </mesh>
            {dyner.map(([x, z, r, h], i) => (
                <mesh key={i} position={[x, 0, z]} scale={[r, h, r * 0.7]}>
                    <sphereGeometry args={[1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial {...ORKEN.dyne} />
                </mesh>
            ))}
            {fjell.map(([x, h, r], i) => (
                <mesh key={i} position={[x, h / 2, -75]}>
                    <coneGeometry args={[r, h, 6]} />
                    <meshStandardMaterial {...ORKEN.fjell} flatShading />
                </mesh>
            ))}
            <Figur gruppe={kroppG} hofte={kroppH} bein={kroppB} klaer="#2563eb" />
            <mesh ref={sekk}>
                <boxGeometry args={[0.38, 0.46, 0.22]} />
                <meshStandardMaterial color="#ea580c" />
            </mesh>
            <instancedMesh ref={spor} args={[undefined, undefined, MAKS_SPOR]} count={0}>
                <circleGeometry args={[0.09, 10]} />
                <meshStandardMaterial color="#9a7340" />
            </instancedMesh>
        </>
    );
}

/* ---------------------------------------------------------------- rommet */

const GLASS = v(1.3, 0.98, -0.9);
const SKAR = Array.from({ length: 9 }, (_, i) => {
    const vinkel = (i / 9) * Math.PI * 2;
    return { vx: Math.cos(vinkel) * (0.6 + (i % 3) * 0.3), vz: Math.sin(vinkel) * 0.7, rot: i };
});

function Rommet({ beat, playing }: { beat: number; playing: boolean }) {
    const { camera } = useThree();
    const kroppG = useRef<THREE.Group>(null);
    const kroppH = useRef<THREE.Group>(null);
    const kroppB = useRef<(THREE.Group | null)[]>([]);
    const hemi = useRef<THREE.HemisphereLight>(null);
    const lampe = useRef<THREE.PointLight>(null);
    const pare = useRef<THREE.MeshStandardMaterial>(null);
    const bakgrunn = useRef<THREE.Color>(null);
    const glass = useRef<THREE.Mesh>(null);
    const skar = useRef<(THREE.Mesh | null)[]>([]);
    const forrigeBeat = useRef(-1);
    const beatTid = useRef(0);
    const forste = useRef(true);
    const styrke = useRef(1);

    useFrame((_, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;

        // Smellet kommer litt ut i beat 2, og så blir alt svart til beat 4.
        const morkt = (beat === 2 && t > 0.6) || beat === 3;
        const mal = morkt ? 0 : 1;
        if (forste.current) styrke.current = mal;
        styrke.current = morkt
            ? mal
            : THREE.MathUtils.lerp(styrke.current, mal, 1 - Math.exp(-2 * dt));
        if (hemi.current) hemi.current.intensity = 0.02 + styrke.current * 1.0;
        if (lampe.current) lampe.current.intensity = styrke.current * 14;
        if (pare.current) pare.current.emissiveIntensity = styrke.current * 1.6;
        bakgrunn.current?.set(morkt ? '#05070d' : '#2a2320');

        // Han hopper av smellet.
        const hopp =
            beat === 2 && t > 0.5 && t < 0.95 ? Math.sin(((t - 0.5) / 0.45) * Math.PI) * 0.35 : 0;
        stillOpp(
            { gruppe: kroppG.current, hofte: kroppH.current, bein: kroppB.current },
            v(-0.9, hopp, 0.4),
            Math.PI - 0.5,
            0,
            0,
            false
        );

        // I beat 4 knuses glasset mot gulvet.
        const knust = beat === 4;
        if (glass.current) glass.current.visible = !knust;
        skar.current.forEach((s, i) => {
            if (!s) return;
            s.visible = knust;
            if (!knust) return;
            const tt = Math.min(t, 1.2);
            const fall = Math.max(0.03, GLASS.y - 0.5 * 9.8 * tt * tt);
            const ute = Math.min(tt, 0.45);
            s.position.set(GLASS.x + 0.45 + SKAR[i].vx * ute, fall, GLASS.z + SKAR[i].vz * ute);
            s.rotation.set(SKAR[i].rot + tt * 4, SKAR[i].rot, 0);
        });

        const pos = beat >= 4 ? v(2.4, 2.3, 4.4) : beat === 1 ? v(3.2, 2.4, 5) : v(4.6, 2.6, 6.2);
        const mot = beat >= 4 ? v(0.3, 0.8, -0.5) : v(0, 1.3, -0.6);
        if (forste.current) {
            camera.position.copy(pos);
            forste.current = false;
        } else {
            camera.position.lerp(pos, 1 - Math.exp(-1.3 * dt));
        }
        camera.lookAt(mot);
    });

    const vegg = { color: '#d9c7a8', emissive: '#3b2f22', emissiveIntensity: 0.06 };
    return (
        <>
            <color ref={bakgrunn} attach="background" args={['#2a2320']} />
            <hemisphereLight ref={hemi} args={['#fff7e6', '#4a3a2a', 1]} />
            <pointLight
                ref={lampe}
                position={[0, 2.8, 0]}
                intensity={14}
                distance={14}
                color="#ffe2a8"
            />
            {/* Gulv og vegger */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[9, 9]} />
                <meshStandardMaterial color="#8b5e34" emissive="#2a1a0c" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[0, 2, -4]}>
                <boxGeometry args={[9, 4, 0.2]} />
                <meshStandardMaterial {...vegg} />
            </mesh>
            <mesh position={[-4.5, 2, 0.5]}>
                <boxGeometry args={[0.2, 4, 9]} />
                <meshStandardMaterial {...vegg} />
            </mesh>
            {/* Vinduet: svakt måneskinn når lyset er borte */}
            <mesh position={[-1.8, 2.2, -3.88]}>
                <boxGeometry args={[1.4, 1.5, 0.05]} />
                <meshStandardMaterial color="#1e3a5f" emissive="#3b5b8a" emissiveIntensity={0.7} />
            </mesh>
            {/* Taklampa */}
            <mesh position={[0, 3.5, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 1, 6]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
            <mesh position={[0, 2.95, 0]}>
                <coneGeometry args={[0.4, 0.3, 16, 1, true]} />
                <meshStandardMaterial color="#0f766e" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 2.82, 0]}>
                <sphereGeometry args={[0.12, 16, 12]} />
                <meshStandardMaterial
                    ref={pare}
                    color="#fff7d6"
                    emissive="#ffd27a"
                    emissiveIntensity={1.6}
                />
            </mesh>
            {/* Bordet med glasset */}
            <mesh position={[1.3, 0.9, -0.9]}>
                <boxGeometry args={[1.4, 0.08, 0.9]} />
                <meshStandardMaterial color="#6b4423" />
            </mesh>
            {[
                [0.7, -1.25],
                [1.9, -1.25],
                [0.7, -0.55],
                [1.9, -0.55],
            ].map(([x, z]) => (
                <mesh key={`${x}${z}`} position={[x, 0.43, z]}>
                    <boxGeometry args={[0.07, 0.86, 0.07]} />
                    <meshStandardMaterial color="#5a3a1c" />
                </mesh>
            ))}
            <mesh ref={glass} position={[GLASS.x, GLASS.y + 0.12, GLASS.z]}>
                <cylinderGeometry args={[0.07, 0.06, 0.22, 12]} />
                <meshStandardMaterial
                    color="#bae6fd"
                    emissive="#38bdf8"
                    emissiveIntensity={0.3}
                    transparent
                    opacity={0.8}
                />
            </mesh>
            {SKAR.map((_, i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        skar.current[i] = m;
                    }}
                    visible={false}
                >
                    <tetrahedronGeometry args={[0.05, 0]} />
                    <meshStandardMaterial
                        color="#bae6fd"
                        emissive="#38bdf8"
                        emissiveIntensity={0.5}
                    />
                </mesh>
            ))}
            <Figur gruppe={kroppG} hofte={kroppH} bein={kroppB} klaer="#7c2d12" />
        </>
    );
}

/* ---------------------------------------------------------------- gangen */

const VAKT = v(0.9, 0, -6.2);

function jegZ(beat: number) {
    if (beat === 0) return 4.5;
    if (beat === 1) return 2.4;
    if (beat <= 3) return 1.4;
    return 0.4;
}

function Gangen({ beat, playing }: { beat: number; playing: boolean }) {
    const { camera } = useThree();
    const jegG = useRef<THREE.Group>(null);
    const jegH = useRef<THREE.Group>(null);
    const jegB = useRef<(THREE.Group | null)[]>([]);
    const vaktG = useRef<THREE.Group>(null);
    const vaktH = useRef<THREE.Group>(null);
    const vaktB = useRef<(THREE.Group | null)[]>([]);
    const se = useRef(new THREE.Vector3());
    const jz = useRef(4.5);
    const steg = useRef(0);
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
        const mal = jegZ(beat);
        if (forste.current) jz.current = mal;
        const igjen = mal - jz.current;
        const gar = Math.abs(igjen) > 0.02;
        if (gar) {
            jz.current += Math.sign(igjen) * Math.min(Math.abs(igjen), 0.8 * dt);
            steg.current += dt * 4;
        }
        const jx = -0.6;
        stillOpp(
            { gruppe: jegG.current, hofte: jegH.current, bein: jegB.current },
            v(jx, 0, jz.current),
            0,
            0,
            steg.current,
            gar,
            1
        );
        const jegKropp = jegG.current;
        if (jegKropp) jegKropp.visible = beat === 2 || beat === 3;
        stillOpp(
            { gruppe: vaktG.current, hofte: vaktH.current, bein: vaktB.current },
            VAKT,
            Math.PI,
            0,
            0,
            false
        );

        let pos: THREE.Vector3;
        let mot: THREE.Vector3;
        let direkte = false;
        if (beat === 2) {
            // Hodehopp: kameraet sitter plutselig i øynene til vakten.
            pos = v(VAKT.x, 1.68, VAKT.z + 0.3);
            mot = v(jx, 0.6, jz.current);
            direkte = true;
        } else if (beat === 3) {
            pos = v(1.2, 8.5, 5.5);
            mot = v(0.2, 0.4, -2.6);
        } else {
            pos = v(jx, 1.05, jz.current);
            mot = v(VAKT.x * 0.6, 1.3, VAKT.z);
            direkte = true;
        }
        if (forste.current || direkte) {
            camera.position.copy(pos);
            if (forste.current) se.current.copy(mot);
            forste.current = false;
        } else {
            camera.position.lerp(pos, 1 - Math.exp(-1.6 * dt));
        }
        se.current.lerp(mot, direkte ? 1 : 1 - Math.exp(-1.6 * dt));
        camera.lookAt(se.current);
    });

    const vegg = { color: '#475569', emissive: '#1e293b', emissiveIntensity: 0.5 };
    return (
        <>
            <color attach="background" args={['#0f172a']} />
            <fog attach="fog" args={['#0f172a', 9, 22]} />
            <hemisphereLight args={['#cbd5e1', '#334155', 1.6]} />
            <pointLight position={[0.2, 3, -6]} intensity={18} distance={12} color="#fde68a" />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]}>
                <planeGeometry args={[4, 16]} />
                <meshStandardMaterial color="#6b4a2f" emissive="#2a1a0c" emissiveIntensity={0.5} />
            </mesh>
            {/* Gulvplankene */}
            {[-1.5, -0.75, 0, 0.75, 1.5].map((x) => (
                <mesh key={x} position={[x, 0.005, -1]}>
                    <boxGeometry args={[0.03, 0.01, 16]} />
                    <meshStandardMaterial color="#3b2a1a" />
                </mesh>
            ))}
            <mesh position={[-2, 1.6, -1]}>
                <boxGeometry args={[0.2, 3.2, 16]} />
                <meshStandardMaterial {...vegg} />
            </mesh>
            <mesh position={[2, 1.6, -1]}>
                <boxGeometry args={[0.2, 3.2, 16]} />
                <meshStandardMaterial {...vegg} />
            </mesh>
            <mesh position={[0, 1.6, -7.1]}>
                <boxGeometry args={[4, 3.2, 0.2]} />
                <meshStandardMaterial {...vegg} />
            </mesh>
            {/* Døra vakten står ved, med en lampe over */}
            <mesh position={[0, 1.1, -6.98]}>
                <boxGeometry args={[1.1, 2.2, 0.06]} />
                <meshStandardMaterial color="#7c3f12" emissive="#3a1a06" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0, 2.55, -6.95]}>
                <sphereGeometry args={[0.1, 12, 10]} />
                <meshStandardMaterial color="#fff7d6" emissive="#fbbf24" emissiveIntensity={1.4} />
            </mesh>
            <Figur gruppe={vaktG} hofte={vaktH} bein={vaktB} klaer="#1e3a8a" lue="#111827" />
            <Figur gruppe={jegG} hofte={jegH} bein={jegB} klaer="#18181b" />
        </>
    );
}

/* ---------------------------------------------------------------- merkene */

type Tone = 'lys' | 'mork' | 'gull' | 'rod' | 'gronn';
interface Merke {
    fraBeat: number;
    tilBeat?: number;
    tekst: string;
    rad: number;
    tone: Tone;
}
interface Sitat {
    fraBeat: number;
    tilBeat?: number;
    tekst: string;
    stryk?: number;
    tone: 'svak' | 'god';
}

const MERKER: Record<Modus, Merke[]> = {
    venter: [
        { fraBeat: 0, tilBeat: 1, tekst: 'Ørkenen', rad: 0, tone: 'lys' },
        { fraBeat: 2, tilBeat: 2, tekst: 'Han venter ...', rad: 0, tone: 'lys' },
        { fraBeat: 2, tilBeat: 2, tekst: 'og venter ...', rad: 1, tone: 'lys' },
        { fraBeat: 3, tekst: 'Ingenting skjer', rad: 0, tone: 'rod' },
        { fraBeat: 3, tekst: 'Han gjør ingenting', rad: 1, tone: 'mork' },
    ],
    agens: [
        { fraBeat: 0, tilBeat: 0, tekst: 'Ny sjanse', rad: 0, tone: 'lys' },
        { fraBeat: 1, tilBeat: 2, tekst: 'Han bestemmer seg', rad: 0, tone: 'gronn' },
        { fraBeat: 3, tekst: 'Agens', rad: 0, tone: 'gull' },
        { fraBeat: 3, tekst: '= den som handler', rad: 1, tone: 'mork' },
        { fraBeat: 4, tekst: 'Et problem, og et eget valg', rad: 2, tone: 'gronn' },
    ],
    lyset: [
        { fraBeat: 1, tilBeat: 1, tekst: '«Plutselig» varsler leseren', rad: 0, tone: 'rod' },
        { fraBeat: 3, tilBeat: 3, tekst: 'Vis, ikke fortell', rad: 0, tone: 'gull' },
        { fraBeat: 4, tekst: 'Sint? Ikke si det.', rad: 0, tone: 'mork' },
        { fraBeat: 4, tekst: 'Knus et glass.', rad: 1, tone: 'gull' },
    ],
    snik: [
        { fraBeat: 0, tilBeat: 1, tekst: 'Med øynene til jeg-personen', rad: 0, tone: 'lys' },
        { fraBeat: 1, tilBeat: 1, tekst: 'Hjertet hamrer', rad: 1, tone: 'rod' },
        { fraBeat: 2, tilBeat: 2, tekst: 'Nå er vi i hodet til vakten!', rad: 0, tone: 'rod' },
        { fraBeat: 3, tilBeat: 3, tekst: 'Hodehopping', rad: 0, tone: 'gull' },
        { fraBeat: 3, tilBeat: 3, tekst: 'To hoder i én scene', rad: 1, tone: 'lys' },
        { fraBeat: 4, tekst: 'Én synsvinkel om gangen', rad: 0, tone: 'gronn' },
    ],
};

const SITATER: Record<Modus, Sitat[]> = {
    venter: [
        {
            fraBeat: 1,
            tilBeat: 2,
            tekst: 'Han satt og ventet på at noen skulle hente ham.',
            tone: 'svak',
        },
    ],
    agens: [
        {
            fraBeat: 1,
            tilBeat: 1,
            tekst: 'Sola brant. Han visste at han ikke kunne bli her.',
            tone: 'god',
        },
        { fraBeat: 2, tilBeat: 2, tekst: 'Han pakket sekken og gikk mot fjellene.', tone: 'god' },
    ],
    lyset: [
        { fraBeat: 0, tilBeat: 1, tekst: 'Plutselig gikk lyset.', stryk: 1, tone: 'svak' },
        {
            fraBeat: 2,
            tilBeat: 3,
            tekst: 'Et høyt smell fikk ham til å hoppe. Alt ble svart.',
            tone: 'god',
        },
    ],
    snik: [
        { fraBeat: 1, tilBeat: 1, tekst: 'Jeg snek meg lydløst over gulvet.', tone: 'god' },
        {
            fraBeat: 2,
            tilBeat: 2,
            tekst: 'Vakten ved døra syntes noe virket galt.',
            tone: 'svak',
        },
        { fraBeat: 4, tekst: 'Vakten ved døra rørte seg ikke.', tone: 'god' },
    ],
};

const TONE: Record<Tone, string> = {
    lys: 'bg-white/95 text-slate-900',
    mork: 'bg-slate-900/95 text-white',
    gull: 'bg-amber-300/95 text-slate-900',
    rod: 'bg-red-600/95 text-white',
    gronn: 'bg-teal-600/95 text-white',
};

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };

export function HistorierScenen({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'venter';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const synlig = <T extends { fraBeat: number; tilBeat?: number }>(m: T) =>
        beat >= m.fraBeat && (m.tilBeat === undefined || beat <= m.tilBeat);
    const merker = MERKER[modus].filter(synlig);
    const sitater = SITATER[modus].filter(synlig);
    const forsteperson = modus === 'snik' && (beat <= 1 || beat === 4);
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [6, 2.3, 7] }}
            >
                {modus === 'lyset' ? (
                    <Rommet beat={beat} playing={playing} />
                ) : modus === 'snik' ? (
                    <Gangen beat={beat} playing={playing} />
                ) : (
                    <Orkenen modus={modus} beat={beat} playing={playing} />
                )}
            </Canvas>
            {/* Jeg-blikket: kanten av bildet mørkner, og banker når hjertet hamrer. */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{
                    opacity: forsteperson ? (beat === 1 ? [0.7, 1, 0.7] : 0.8) : 0,
                }}
                transition={
                    beat === 1 && forsteperson
                        ? { duration: 0.8, repeat: Infinity }
                        : { duration: 0.6 }
                }
                style={{
                    background:
                        beat === 1
                            ? 'radial-gradient(ellipse at center, rgba(127,29,29,0) 50%, rgba(127,29,29,0.7) 100%)'
                            : 'radial-gradient(ellipse at center, rgba(2,6,23,0) 50%, rgba(2,6,23,0.75) 100%)',
                }}
            />
            {/* Hodehoppet: rød ramme rundt bildet */}
            {modus === 'snik' && beat === 2 && (
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ boxShadow: 'inset 0 0 0 10px rgba(220,38,38,0.9)' }}
                />
            )}
            {/* Smellet */}
            <AnimatePresence>
                {modus === 'lyset' && beat === 2 && (
                    <motion.div
                        key="smell"
                        className="absolute font-black text-white"
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.2, 1, 1] }}
                        transition={{ duration: 1.6, times: [0, 0.2, 0.6, 1], delay: 0.4 }}
                        style={{
                            ...FONT,
                            right: '8%',
                            top: '14%',
                            fontSize: '5.5rem',
                            textShadow: '0 0 30px rgba(251,191,36,0.9)',
                        }}
                    >
                        SMELL!
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {merker.map((m) => (
                    <motion.div
                        key={m.tekst}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 + m.rad * 0.35 }}
                        className={`absolute rounded-2xl shadow-xl px-4 py-2 font-black ${TONE[m.tone]}`}
                        style={{
                            ...FONT,
                            left: '4%',
                            top: `${6 + m.rad * 12}%`,
                            fontSize: '1.6rem',
                        }}
                    >
                        {m.tekst}
                    </motion.div>
                ))}
            </AnimatePresence>
            <div
                className="absolute flex justify-center pointer-events-none"
                style={{ left: 0, right: 0, bottom: '6%' }}
            >
                <AnimatePresence>
                    {sitater.map((s) => {
                        const stroket = s.stryk !== undefined && beat >= s.stryk;
                        return (
                            <motion.div
                                key={s.tekst}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="rounded-2xl shadow-2xl"
                                style={{
                                    maxWidth: '80%',
                                    padding: '0.7rem 1.5rem',
                                    background: '#fffdf5',
                                    borderLeft: `10px solid ${s.tone === 'god' ? '#0d9488' : '#dc2626'}`,
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: 'Georgia, serif',
                                        fontSize: '1.75rem',
                                        color: stroket ? '#64748b' : '#1e293b',
                                        textDecoration: stroket ? 'line-through' : 'none',
                                        textDecorationColor: '#dc2626',
                                        textDecorationThickness: '4px',
                                        transition: 'color 0.6s',
                                    }}
                                >
                                    {s.tekst}
                                </span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
