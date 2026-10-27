import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Jernbanevogna i Compiègne-skogen i 3D: et spor gjennom en høstskog og én vogn med lys i
 * vinduene. Kameraet kommer inn gjennom skogen, går tett på vinduene, og løfter seg over
 * trærne når klokka er 11.00 og det blir stille.
 */

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

function kameraFor(beat: number, t: number) {
    switch (beat) {
        case 0:
            return { pos: v(-26 + Math.min(t, 12) * 1.2, 4, 22 - Math.min(t, 12) * 0.6), se: v(0, 1.6, 0) };
        case 1:
            return { pos: v(5.5, 2.4, 7.5), se: v(0, 2, 0) };
        case 2:
            return { pos: v(-9, 6 + Math.min(t, 10) * 0.4, 14), se: v(0, 1.8, 0) };
        default:
            return { pos: v(-4, 22 + Math.min(t, 10) * 0.6, 26), se: v(0, 0, -4) };
    }
}

const GRØNN = new THREE.Color('#2f4a2c');
const HØST = [new THREE.Color('#9a5b1e'), new THREE.Color('#b7791f'), new THREE.Color('#6b4e1f'), GRØNN];

function Skog() {
    const kroner = useRef<THREE.InstancedMesh>(null);
    const stammer = useRef<THREE.InstancedMesh>(null);
    const traer = useMemo(() => {
        const ut: { x: number; z: number; h: number; f: THREE.Color }[] = [];
        for (let i = 0; i < 140; i++) {
            const x = (frø(i) - 0.5) * 110;
            const z = (frø(i + 300) - 0.5) * 90;
            // Hold sporet og vogna fri for trær.
            if (Math.abs(z) < 6 || (z > 0 && z < 34 && x > -34 && x < 14)) continue;
            ut.push({ x, z, h: 5 + frø(i + 700) * 5, f: HØST[Math.floor(frø(i + 900) * HØST.length)] });
        }
        return ut;
    }, []);
    useLayoutEffect(() => {
        const k = kroner.current;
        const s = stammer.current;
        if (!k || !s) return;
        const o = new THREE.Object3D();
        traer.forEach((t, i) => {
            o.position.set(t.x, t.h, t.z);
            o.scale.set(2.4, 2.8, 2.4);
            o.updateMatrix();
            k.setMatrixAt(i, o.matrix);
            k.setColorAt(i, t.f);
            o.position.set(t.x, t.h / 2, t.z);
            o.scale.set(0.35, t.h, 0.35);
            o.updateMatrix();
            s.setMatrixAt(i, o.matrix);
        });
        k.instanceMatrix.needsUpdate = true;
        if (k.instanceColor) k.instanceColor.needsUpdate = true;
        s.instanceMatrix.needsUpdate = true;
    }, [traer]);
    return (
        <>
            <instancedMesh ref={kroner} args={[undefined, undefined, traer.length]} frustumCulled={false}>
                <icosahedronGeometry args={[1, 0]} />
                <meshLambertMaterial flatShading />
            </instancedMesh>
            <instancedMesh ref={stammer} args={[undefined, undefined, traer.length]} frustumCulled={false}>
                <cylinderGeometry args={[0.5, 0.7, 1, 6]} />
                <meshLambertMaterial color="#3f2d1d" />
            </instancedMesh>
        </>
    );
}

function Spor() {
    const sviller = useRef<THREE.InstancedMesh>(null);
    const antall = 60;
    useLayoutEffect(() => {
        const m = sviller.current;
        if (!m) return;
        const o = new THREE.Object3D();
        for (let i = 0; i < antall; i++) {
            o.position.set(-60 + i * 2, 0.12, 0);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    }, []);
    return (
        <>
            <mesh position={[0, 0.06, 0]}>
                <boxGeometry args={[130, 0.12, 3.4]} />
                <meshLambertMaterial color="#8b8174" />
            </mesh>
            <instancedMesh ref={sviller} args={[undefined, undefined, antall]} frustumCulled={false}>
                <boxGeometry args={[0.4, 0.14, 2.8]} />
                <meshLambertMaterial color="#4a3728" />
            </instancedMesh>
            {[-0.75, 0.75].map((z) => (
                <mesh key={z} position={[0, 0.26, z]}>
                    <boxGeometry args={[130, 0.14, 0.12]} />
                    <meshLambertMaterial color="#52525b" />
                </mesh>
            ))}
        </>
    );
}

function Vogn({ lys }: { lys: number }) {
    const vinduer = useRef<THREE.MeshLambertMaterial[]>([]);
    useFrame(() => {
        vinduer.current.forEach((m) => {
            if (m) m.emissiveIntensity = lys;
        });
    });
    return (
        <group position={[0, 0, 0]}>
            {/* Hjul og understell */}
            {[-3.6, -2.2, 2.2, 3.6].map((x) =>
                [-0.75, 0.75].map((z) => (
                    <mesh key={`${x}-${z}`} position={[x, 0.75, z]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.45, 0.45, 0.15, 12]} />
                        <meshLambertMaterial color="#1c1917" />
                    </mesh>
                ))
            )}
            <mesh position={[0, 1.3, 0]}>
                <boxGeometry args={[9.6, 0.4, 2.4]} />
                <meshLambertMaterial color="#292524" />
            </mesh>
            {/* Kassen */}
            <mesh position={[0, 2.75, 0]}>
                <boxGeometry args={[10, 2.5, 2.7]} />
                <meshLambertMaterial color="#5b3a26" />
            </mesh>
            <mesh position={[0, 4.1, 0]}>
                <boxGeometry args={[10.3, 0.2, 3]} />
                <meshLambertMaterial color="#3f3f46" />
            </mesh>
            <mesh position={[0, 4.35, 0]}>
                <boxGeometry args={[10, 0.3, 2]} />
                <meshLambertMaterial color="#3f3f46" />
            </mesh>
            {/* Vinduer på begge sider */}
            {[-3.6, -1.8, 0, 1.8, 3.6].map((x, i) =>
                [1.36, -1.36].map((z, j) => (
                    <mesh key={`${x}-${z}`} position={[x, 3.05, z]}>
                        <boxGeometry args={[1.2, 0.9, 0.04]} />
                        <meshLambertMaterial
                            ref={(m) => {
                                if (m) vinduer.current[i * 2 + j] = m;
                            }}
                            color="#fde68a"
                            emissive="#fbbf24"
                            emissiveIntensity={lys}
                        />
                    </mesh>
                ))
            )}
            {/* Plattformene i endene */}
            {[-5.3, 5.3].map((x) => (
                <mesh key={x} position={[x, 1.6, 0]}>
                    <boxGeometry args={[0.8, 0.2, 2.4]} />
                    <meshLambertMaterial color="#44403c" />
                </mesh>
            ))}
        </group>
    );
}

function Scene({ beat, playing }: { beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const pos = useRef(new THREE.Vector3());
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const sol = useRef<THREE.DirectionalLight>(null);
    useFrame(({ camera }, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = kameraFor(beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        pos.current.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.position.copy(pos.current);
        camera.lookAt(se.current);
        if (sol.current) {
            const mål = beat >= 2 ? 1.5 : 0.9;
            sol.current.intensity += (mål - sol.current.intensity) * (forste.current ? 1 : 1 - Math.exp(-0.8 * dt));
        }
    });
    const morgen = beat >= 2;
    return (
        <>
            <color attach="background" args={[morgen ? '#d9d4c7' : '#a8a9a3']} />
            <fog attach="fog" args={[morgen ? '#d9d4c7' : '#a8a9a3', 18, 75]} />
            <hemisphereLight args={['#f1f5f9', '#3f3a2c', 1.0]} />
            <directionalLight ref={sol} position={[-20, 25, 15]} intensity={0.9} color="#fff7ed" />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[300, 300]} />
                <meshLambertMaterial color="#5b5a33" />
            </mesh>
            <Skog />
            <Spor />
            <Vogn lys={beat <= 1 ? 0.9 : 0.4} />
        </>
    );
}

const KORT: { tittel: string; tekst?: string }[] = [
    { tittel: 'Compiègne-skogen, Frankrike', tekst: 'en jernbanevogn' },
    { tittel: 'Våpenhvile', tekst: 'alle skal slutte å skyte' },
    { tittel: '11. november 1918', tekst: 'det blir stille ved fronten' },
    { tittel: 'Krigen er over', tekst: 'men freden gjenstår å vinne' },
];

export function KrigensLopVogn({ beat, playing }: VisualProps) {
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const kort = KORT[Math.min(beat, KORT.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, position: [-26, 4, 22] }}>
                <Scene beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={kort.tittel}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute rounded-2xl bg-white/95 px-6 py-3 shadow-xl"
                    style={{ top: '5%', left: '3%' }}
                >
                    <div className="text-3xl font-black text-slate-900 whitespace-nowrap">{kort.tittel}</div>
                    {kort.tekst && <div className="text-xl font-bold text-slate-600 mt-0.5 whitespace-nowrap">{kort.tekst}</div>}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
