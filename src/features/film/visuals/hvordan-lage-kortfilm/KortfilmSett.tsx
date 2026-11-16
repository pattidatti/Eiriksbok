import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Et lite filmsett i 3D, sett gjennom søkeren på et kamera.
 * - apning: Ali åpner skapet i gangen, en lapp faller ut, og kameraet går helt inntil lappen.
 * - avstand: de fem kameraavstandene, fra totalbilde til ekstremt nært.
 * - vinkel: fugleperspektiv, normalperspektiv og froskeperspektiv.
 * - lys: vindu bak personen (silhuett), personen snudd mot vinduet, taklys mot bordlys, A4-ark.
 */

type Modus = 'apning' | 'avstand' | 'vinkel' | 'lys';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const HUD = '#f8fafc';

/* ---------------------------------------------------------------- figuren */

/** Ali: en enkel figur som ser mot +z, med ansikt, og hender som holder en telefon. */
function Ali({
    gruppe,
    hender,
    telefon,
}: {
    gruppe: React.RefObject<THREE.Group | null>;
    hender: React.RefObject<THREE.Group | null>;
    telefon: boolean;
}) {
    const hud = '#e8b996';
    const genser = '#0f766e';
    return (
        <group ref={gruppe}>
            {[-0.12, 0.12].map((x) => (
                <mesh key={x} position={[x, 0.45, 0]}>
                    <boxGeometry args={[0.16, 0.9, 0.18]} />
                    <meshStandardMaterial color="#1e293b" />
                </mesh>
            ))}
            <mesh position={[0, 1.22, 0]}>
                <boxGeometry args={[0.48, 0.66, 0.28]} />
                <meshStandardMaterial color={genser} />
            </mesh>
            {/* Overarmer */}
            {[-0.3, 0.3].map((x) => (
                <mesh key={x} position={[x, 1.32, 0]}>
                    <boxGeometry args={[0.11, 0.42, 0.12]} />
                    <meshStandardMaterial color={genser} />
                </mesh>
            ))}
            {/* Underarmer og hender som holder telefonen foran brystet */}
            <group ref={hender}>
                {[-0.22, 0.22].map((x) => (
                    <mesh key={x} position={[x * 0.85, 1.1, 0.16]} rotation={[0, -x * 1.2, 0]}>
                        <boxGeometry args={[0.1, 0.1, 0.34]} />
                        <meshStandardMaterial color={genser} />
                    </mesh>
                ))}
                {[-0.07, 0.07].map((x) => (
                    <mesh key={x} position={[x, 1.1, 0.34]}>
                        <boxGeometry args={[0.07, 0.09, 0.07]} />
                        <meshStandardMaterial color={hud} />
                    </mesh>
                ))}
                {/* Fingre rundt kanten på telefonen */}
                {[-0.06, -0.02, 0.02, 0.06].map((x) => (
                    <mesh key={x} position={[x, 1.165, 0.37]}>
                        <boxGeometry args={[0.025, 0.05, 0.025]} />
                        <meshStandardMaterial color={hud} />
                    </mesh>
                ))}
                {telefon && (
                    <group position={[0, 1.13, 0.39]} rotation={[-0.5, 0, 0]}>
                        <mesh>
                            <boxGeometry args={[0.15, 0.27, 0.02]} />
                            <meshStandardMaterial color="#0f172a" />
                        </mesh>
                        <mesh position={[0, 0, 0.011]}>
                            <planeGeometry args={[0.13, 0.24]} />
                            <meshStandardMaterial
                                color="#7dd3fc"
                                emissive="#38bdf8"
                                emissiveIntensity={0.8}
                            />
                        </mesh>
                    </group>
                )}
            </group>
            {/* Hode */}
            <mesh position={[0, 1.72, 0]}>
                <sphereGeometry args={[0.17, 20, 16]} />
                <meshStandardMaterial color={hud} />
            </mesh>
            <mesh position={[0, 1.78, -0.02]}>
                <sphereGeometry args={[0.18, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#3f2a14" />
            </mesh>
            {[-0.06, 0.06].map((x) => (
                <mesh key={x} position={[x, 1.74, 0.155]}>
                    <sphereGeometry args={[0.022, 10, 8]} />
                    <meshStandardMaterial color="#0f172a" />
                </mesh>
            ))}
            {[-0.06, 0.06].map((x) => (
                <mesh key={x} position={[x, 1.79, 0.15]} rotation={[0, 0, x > 0 ? -0.25 : 0.25]}>
                    <boxGeometry args={[0.07, 0.014, 0.01]} />
                    <meshStandardMaterial color="#3f2a14" />
                </mesh>
            ))}
            <mesh position={[0, 1.65, 0.158]}>
                <boxGeometry args={[0.07, 0.014, 0.01]} />
                <meshStandardMaterial color="#9a3412" />
            </mesh>
        </group>
    );
}

/** Lappen med tekst, tegnet på et lerret og lagt på et plan. */
function useLappTekstur() {
    return useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 384;
        const g = c.getContext('2d');
        if (g) {
            g.fillStyle = '#fffdf4';
            g.fillRect(0, 0, 512, 384);
            g.strokeStyle = '#bfdbfe';
            g.lineWidth = 3;
            for (let y = 90; y < 384; y += 70) {
                g.beginPath();
                g.moveTo(20, y + 20);
                g.lineTo(492, y + 20);
                g.stroke();
            }
            g.fillStyle = '#1e3a8a';
            g.font = 'italic 700 50px Georgia, serif';
            g.textAlign = 'center';
            g.fillText('Møt meg bak', 256, 100);
            g.fillText('gymsalen', 256, 170);
            g.fillText('kl 15:00', 256, 240);
        }
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    }, []);
}

/* ---------------------------------------------------------------- gangen */

const SKAP_Z = Array.from({ length: 22 }, (_, i) => 6 - i * 0.62);

function Gangen() {
    const skap = useRef<THREE.InstancedMesh>(null);
    const klar = useRef(false);
    useFrame(() => {
        if (!skap.current || klar.current) return;
        const o = new THREE.Object3D();
        SKAP_Z.forEach((z, i) => {
            o.position.set(-2.05, 1, z);
            o.updateMatrix();
            skap.current!.setMatrixAt(i, o.matrix);
        });
        skap.current.instanceMatrix.needsUpdate = true;
        klar.current = true;
    });
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]}>
                <planeGeometry args={[4.6, 30]} />
                <meshStandardMaterial color="#cbd5e1" emissive="#475569" emissiveIntensity={0.25} />
            </mesh>
            <mesh position={[-2.35, 1.6, -4]}>
                <boxGeometry args={[0.1, 3.2, 30]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
            <mesh position={[2.35, 1.6, -4]}>
                <boxGeometry args={[0.1, 3.2, 30]} />
                <meshStandardMaterial color="#f1f5f9" />
            </mesh>
            <instancedMesh
                ref={skap}
                args={[undefined, undefined, SKAP_Z.length]}
                frustumCulled={false}
            >
                <boxGeometry args={[0.5, 2, 0.58]} />
                <meshStandardMaterial color="#2563eb" emissive="#1e3a8a" emissiveIntensity={0.25} />
            </instancedMesh>
            {/* Takplater med lys */}
            {[4, 0, -4, -8, -12, -16].map((z) => (
                <mesh key={z} position={[0, 3.18, z]} rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[1.2, 0.6]} />
                    <meshBasicMaterial color="#fefce8" />
                </mesh>
            ))}
            {/* Vindu i enden av gangen */}
            <mesh position={[0, 1.7, -18.9]}>
                <planeGeometry args={[3, 2]} />
                <meshBasicMaterial color="#e0f2fe" />
            </mesh>
        </group>
    );
}

/* ---------------------------------------------------------------- rommet (lys) */

function Rommet({
    tak,
    bordlys,
    ark,
    stativ,
    stativZ,
}: {
    tak: React.RefObject<THREE.MeshBasicMaterial | null>;
    bordlys: React.RefObject<THREE.MeshBasicMaterial | null>;
    ark: React.RefObject<THREE.Group | null>;
    stativ: React.RefObject<THREE.Group | null>;
    stativZ: number;
}) {
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]}>
                <planeGeometry args={[12, 12]} />
                <meshStandardMaterial color="#a8a29e" emissive="#44403c" emissiveIntensity={0.2} />
            </mesh>
            {/* Veggen med vinduet */}
            <mesh position={[-2.6, 1.6, -4.05]}>
                <boxGeometry args={[3.4, 3.2, 0.1]} />
                <meshStandardMaterial color="#d6d3d1" />
            </mesh>
            <mesh position={[2.6, 1.6, -4.05]}>
                <boxGeometry args={[3.4, 3.2, 0.1]} />
                <meshStandardMaterial color="#d6d3d1" />
            </mesh>
            <mesh position={[0, 0.35, -4.05]}>
                <boxGeometry args={[1.8, 0.7, 0.1]} />
                <meshStandardMaterial color="#d6d3d1" />
            </mesh>
            <mesh position={[0, 2.95, -4.05]}>
                <boxGeometry args={[1.8, 0.5, 0.1]} />
                <meshStandardMaterial color="#d6d3d1" />
            </mesh>
            <mesh position={[0, 1.7, -4.12]}>
                <planeGeometry args={[1.8, 2]} />
                <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
            <mesh position={[0, 1.7, -4.06]}>
                <boxGeometry args={[0.06, 2, 0.04]} />
                <meshStandardMaterial color="#78716c" />
            </mesh>
            {/* Taklampe */}
            <mesh position={[0, 3.1, -1.5]}>
                <boxGeometry args={[1, 0.08, 0.3]} />
                <meshBasicMaterial ref={tak} color="#57534e" />
            </mesh>
            {/* Bord med lampe på siden */}
            <mesh position={[1.4, 0.7, -1.5]}>
                <boxGeometry args={[0.8, 0.06, 0.8]} />
                <meshStandardMaterial color="#92400e" />
            </mesh>
            {[-0.35, 0.35].flatMap((x) =>
                [-0.35, 0.35].map((z) => (
                    <mesh key={`${x}${z}`} position={[1.4 + x, 0.35, -1.5 + z]}>
                        <boxGeometry args={[0.05, 0.7, 0.05]} />
                        <meshStandardMaterial color="#78350f" />
                    </mesh>
                ))
            )}
            <mesh position={[1.4, 0.95, -1.5]}>
                <cylinderGeometry args={[0.02, 0.06, 0.45, 8]} />
                <meshStandardMaterial color="#1c1917" />
            </mesh>
            <mesh position={[1.4, 1.22, -1.5]}>
                <coneGeometry args={[0.18, 0.2, 16, 1, true]} />
                <meshBasicMaterial ref={bordlys} color="#57534e" side={THREE.DoubleSide} />
            </mesh>
            {/* Det hvite arket utenfor bildet */}
            <group ref={ark} position={[-0.75, 1.35, -1.9]} rotation={[0, 0.9, 0]}>
                <mesh>
                    <planeGeometry args={[0.45, 0.63]} />
                    <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
                </mesh>
            </group>
            {/* Kamera på stativ */}
            <group ref={stativ} position={[0, 0, stativZ]}>
                {[0, 2.1, 4.2].map((a) => (
                    <mesh
                        key={a}
                        position={[Math.sin(a) * 0.18, 0.62, Math.cos(a) * 0.18]}
                        rotation={[Math.cos(a) * 0.28, 0, -Math.sin(a) * 0.28]}
                    >
                        <cylinderGeometry args={[0.02, 0.02, 1.3, 6]} />
                        <meshStandardMaterial color="#1f2937" />
                    </mesh>
                ))}
                <mesh position={[0, 1.38, 0]}>
                    <boxGeometry args={[0.24, 0.2, 0.36]} />
                    <meshStandardMaterial color="#111827" />
                </mesh>
                <mesh position={[0, 1.38, -0.24]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.07, 0.08, 0.14, 16]} />
                    <meshStandardMaterial color="#374151" />
                </mesh>
            </group>
        </group>
    );
}

/* ---------------------------------------------------------------- kamera per beat */

interface Bilde {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

const LAPP = v(-0.8, 0.012, 0.55);

function kameraFor(modus: Modus, beat: number, t: number, aliZ: number): Bilde {
    if (modus === 'apning') {
        if (beat === 0) return { pos: v(1.6 - Math.min(t, 6) * 0.08, 1.7, 6), se: v(-1.3, 1.2, 0) };
        if (beat === 1) return { pos: v(1.1, 1.3, 3.6), se: v(-1.3, 0.8, 0.1) };
        if (beat === 2) return { pos: v(-0.72, 0.42, 0.7), se: LAPP };
        return { pos: v(1.5, 3.6, 3.4), se: v(-1, 0.6, 0) };
    }
    if (modus === 'avstand') {
        const fot = v(0, 0, aliZ);
        const p = (x: number, y: number, z: number) => fot.clone().add(v(x, y, z));
        if (beat === 0) return { pos: p(0.4, 2.6 + Math.min(t, 6) * 0.05, 22), se: p(0, 1.3, 0) };
        if (beat === 1) return { pos: p(0.3, 1.6, 15), se: p(0, 1.3, 0) };
        if (beat === 2) return { pos: p(0.15, 1.1, 4.6), se: p(0, 0.95, 0) };
        if (beat === 3) return { pos: p(0.1, 1.35, 2.2), se: p(0, 1.35, 0) };
        if (beat === 4) return { pos: p(0.05, 1.72, 0.95), se: p(0, 1.7, 0) };
        return { pos: p(0.12, 1.3, 0.85), se: p(0, 1.12, 0.38) };
    }
    if (modus === 'vinkel') {
        const fot = v(0, 0, aliZ);
        const p = (x: number, y: number, z: number) => fot.clone().add(v(x, y, z));
        if (beat === 0) {
            const h = 0.4 + (Math.sin(t * 0.7 - Math.PI / 2) + 1) * 2.2;
            return { pos: p(1.4, h, 3.4), se: p(0, 1.1, 0) };
        }
        if (beat === 1) return { pos: p(0.4, 6.2, 1.6), se: p(0, 0.6, 0) };
        if (beat === 2) return { pos: p(0, 1.68, 3.3), se: p(0, 1.3, 0) };
        return { pos: p(0.2, 0.25, 2.1), se: p(0, 1.75, 0) };
    }
    // lys
    if (beat === 0) return { pos: v(4.6, 2.6, 2.6), se: v(0, 1.3, -1.8) };
    if (beat === 1) return { pos: v(0, 1.55, 0.9), se: v(0, 1.45, -1.5) };
    if (beat === 2) return { pos: v(0.1, 1.6, -3.4), se: v(0, 1.5, -1.5) };
    if (beat === 3) return { pos: v(-0.2, 1.68, -2.5), se: v(0, 1.66, -1.5) };
    return { pos: v(-2.2, 2.0, -0.6), se: v(-0.3, 1.4, -1.9) };
}

/* ---------------------------------------------------------------- scenen */

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const ali = useRef<THREE.Group>(null);
    const hender = useRef<THREE.Group>(null);
    const dor = useRef<THREE.Group>(null);
    const lapp = useRef<THREE.Mesh>(null);
    const amb = useRef<THREE.AmbientLight>(null);
    const fra = useRef<THREE.DirectionalLight>(null);
    const bak = useRef<THREE.DirectionalLight>(null);
    const topp = useRef<THREE.PointLight>(null);
    const side = useRef<THREE.PointLight>(null);
    const fyll = useRef<THREE.PointLight>(null);
    const tak = useRef<THREE.MeshBasicMaterial>(null);
    const bordlys = useRef<THREE.MeshBasicMaterial>(null);
    const ark = useRef<THREE.Group>(null);
    const stativ = useRef<THREE.Group>(null);
    const se = useRef(new THREE.Vector3());
    const forrigeBeat = useRef(-1);
    const beatTid = useRef(0);
    const forste = useRef(true);
    const tekstur = useLappTekstur();
    const aliZ = modus === 'avstand' || modus === 'vinkel' ? -6 : 0;
    const lys = modus === 'lys';

    useFrame((state, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;

        // Ali: hvor Ali står og ser.
        if (ali.current) {
            if (modus === 'apning') {
                ali.current.position.set(-1.25, 0, 0);
                ali.current.rotation.y = beat >= 2 ? -Math.PI / 2 + 0.5 : -Math.PI / 2;
            } else if (lys) {
                ali.current.position.set(0, 0, -1.5);
                const mal = beat <= 1 ? 0 : Math.PI;
                ali.current.rotation.y =
                    beat === 2 ? Math.min(Math.PI, ali.current.rotation.y + dt * 3) : mal;
                if (beat === 2 && forste.current) ali.current.rotation.y = Math.PI;
            } else {
                ali.current.position.set(0, 0, aliZ);
                ali.current.rotation.y = 0;
            }
        }
        // Skjelvende fingre bare mens filmen går, så skjermbildet er stabilt.
        if (hender.current) {
            const skjelv = modus === 'avstand' && beat === 5 && playing;
            hender.current.position.x = skjelv ? Math.sin(state.clock.elapsedTime * 38) * 0.004 : 0;
            hender.current.position.y = skjelv ? Math.cos(state.clock.elapsedTime * 31) * 0.003 : 0;
        }

        // Skapdøra og lappen.
        if (dor.current) {
            const apen = modus === 'apning' ? (beat === 0 ? Math.min(1, t / 1.5) : 1) : 0;
            dor.current.rotation.y = -apen * 1.9;
        }
        if (lapp.current) {
            const fall = beat === 1 ? Math.min(1, t / 0.7) : beat >= 2 ? 1 : 0;
            lapp.current.visible = modus === 'apning' && (beat >= 1 || t > 1.4);
            lapp.current.position.set(
                THREE.MathUtils.lerp(-1.75, LAPP.x, fall),
                THREE.MathUtils.lerp(1.3, LAPP.y, fall),
                THREE.MathUtils.lerp(0, LAPP.z, fall)
            );
            lapp.current.rotation.set((-Math.PI / 2) * fall, 0, (1 - fall) * 0.8);
        }

        // Lyset.
        const mal = {
            amb: 0.75,
            fra: 1.6,
            bak: 0.3,
            topp: 0,
            side: 0,
            fyll: 0,
            tak: '#57534e',
            bordlys: '#57534e',
        };
        if (lys) {
            mal.amb = 0.3;
            mal.fra = 0;
            mal.bak = 0;
            if (beat <= 1) {
                mal.bak = 2.6;
                mal.amb = beat === 1 ? 0.07 : 0.35;
            } else if (beat === 2) {
                mal.fra = 2.4;
                mal.amb = 0.35;
            } else if (beat === 3) {
                // Først problemet (taklys), så løsningen (bordlys) midt i beaten. På pause: problemet.
                const bord = t > 2.6 && playing;
                mal.amb = 0.12;
                mal.topp = bord ? 0 : 6;
                mal.side = bord ? 4 : 0;
                mal.tak = bord ? '#57534e' : '#fffbe6';
                mal.bordlys = bord ? '#fde68a' : '#57534e';
            } else {
                mal.fra = 1.6;
                mal.fyll = 2.2;
                mal.amb = 0.35;
            }
        }
        const lyst = forste.current ? 1 : 1 - Math.exp(-4 * dt);
        if (amb.current) amb.current.intensity += (mal.amb - amb.current.intensity) * lyst;
        if (fra.current) fra.current.intensity += (mal.fra - fra.current.intensity) * lyst;
        if (bak.current) bak.current.intensity += (mal.bak - bak.current.intensity) * lyst;
        if (topp.current) topp.current.intensity = mal.topp;
        if (side.current) side.current.intensity = mal.side;
        if (fyll.current) fyll.current.intensity += (mal.fyll - fyll.current.intensity) * lyst;
        tak.current?.color.set(mal.tak);
        bordlys.current?.color.set(mal.bordlys);
        if (ark.current) ark.current.visible = lys && beat === 4;
        if (stativ.current) {
            stativ.current.visible = lys && (beat === 0 || beat === 4);
            stativ.current.position.z = beat <= 1 ? 0.9 : -3.4;
            stativ.current.rotation.y = beat <= 1 ? 0 : Math.PI;
        }

        const kam = kameraFor(modus, beat, t, aliZ);
        if (forste.current) {
            camera.position.copy(kam.pos);
            se.current.copy(kam.se);
            forste.current = false;
        } else {
            const f = 1 - Math.exp(-1.6 * dt);
            camera.position.lerp(kam.pos, f);
            se.current.lerp(kam.se, f);
        }
        // Rett ned på lappen: sett «opp» slik at teksten står rett.
        camera.up.set(0, 1, 0);
        if (modus === 'apning' && beat === 2) camera.up.set(0, 0, -1);
        camera.lookAt(se.current);
    });

    return (
        <>
            <color attach="background" args={[lys ? '#292524' : '#cbd5e1']} />
            {!lys && <fog attach="fog" args={['#cbd5e1', 14, 34]} />}
            <ambientLight ref={amb} intensity={0.75} />
            <hemisphereLight args={['#ffffff', '#64748b', lys ? 0.15 : 0.6]} />
            {/* Lys fra vinduet: forfra (mot ansiktet) eller bakfra (mot ryggen) */}
            <directionalLight ref={fra} position={[0.5, 2.5, lys ? -6 : 6]} intensity={1.6} />
            <directionalLight ref={bak} position={[0, 2.5, -8]} intensity={0.3} />
            <pointLight
                ref={topp}
                position={[0, 2.6, -1.5]}
                intensity={0}
                distance={2.4}
                decay={1}
            />
            <pointLight
                ref={side}
                position={[1.3, 1.5, -1.6]}
                intensity={0}
                distance={4}
                decay={1}
            />
            <pointLight
                ref={fyll}
                position={[-0.7, 1.4, -1.8]}
                intensity={0}
                distance={3}
                decay={1}
            />
            {lys ? (
                <Rommet tak={tak} bordlys={bordlys} ark={ark} stativ={stativ} stativZ={0.9} />
            ) : (
                <Gangen />
            )}
            <Ali gruppe={ali} hender={hender} telefon={modus !== 'apning'} />
            {modus === 'apning' && (
                <>
                    {/* Ali sitt skap med døra som åpnes */}
                    <group ref={dor} position={[-1.78, 1, -0.29]}>
                        <mesh position={[0, 0, 0.29]}>
                            <boxGeometry args={[0.04, 1.96, 0.56]} />
                            <meshStandardMaterial color="#1d4ed8" />
                        </mesh>
                    </group>
                    <mesh position={[-1.81, 1, 0]}>
                        <boxGeometry args={[0.02, 1.9, 0.52]} />
                        <meshStandardMaterial color="#0f172a" />
                    </mesh>
                    <mesh ref={lapp} position={[-1.75, 1.3, 0]}>
                        <planeGeometry args={[0.2, 0.15]} />
                        <meshBasicMaterial map={tekstur} side={THREE.DoubleSide} />
                    </mesh>
                </>
            )}
        </>
    );
}

/* ---------------------------------------------------------------- søkeren */

interface Merke {
    tekst: string;
    tone?: 'feil' | 'riktig' | 'noytral';
}

function merkeFor(modus: Modus, beat: number): Merke | null {
    if (modus === 'apning') {
        return [
            { tekst: 'Totalbilde: gangen' },
            { tekst: 'Halvtotalbilde: lappen faller' },
            { tekst: 'Ekstremt nært: lappen' },
            { tekst: 'Ingen forklarte. Du så det.' },
        ][Math.min(beat, 3)];
    }
    if (modus === 'avstand') {
        return [
            { tekst: 'Fem avstander' },
            { tekst: '1  Totalbilde: hvor er vi?' },
            { tekst: '2  Halvtotalbilde: hele kroppen' },
            { tekst: '3  Halvnært: mest brukt på TV' },
            { tekst: '4  Nært: ansiktet og følelsen' },
            { tekst: '5  Ekstremt nært: detaljen' },
        ][Math.min(beat, 5)];
    }
    if (modus === 'vinkel') {
        return [
            { tekst: 'Kamerahøyden' },
            { tekst: 'Fugleperspektiv: liten og sårbar' },
            { tekst: 'Normalperspektiv: likeverdig' },
            { tekst: 'Froskeperspektiv: mektig og truende' },
        ][Math.min(beat, 3)];
    }
    return (
        [
            { tekst: 'Lyset som allerede er der' },
            { tekst: 'Feil: vindu bak personen', tone: 'feil' },
            { tekst: 'Riktig: ansiktet mot vinduet', tone: 'riktig' },
            { tekst: 'Taklys gir harde skygger', tone: 'feil' },
            { tekst: 'Hvitt A4-ark utenfor bildet', tone: 'riktig' },
        ] as Merke[]
    )[Math.min(beat, 4)];
}

const TONE: Record<string, string> = {
    feil: '#dc2626',
    riktig: '#0d9488',
    noytral: 'rgba(15,23,42,0.82)',
};

function Hjorne({ style }: { style: React.CSSProperties }) {
    return (
        <div
            className="absolute"
            style={{ width: 54, height: 54, borderColor: HUD, borderStyle: 'solid', ...style }}
        />
    );
}

export function KortfilmSett({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props?.modus ?? 'apning';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const merke = merkeFor(modus, beat);
    const bordlys = modus === 'lys' && beat === 3 && playing;
    const visSoker = !(modus === 'lys' && (beat === 0 || beat === 4));
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [2, 2, 8] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            {/* Søkeren: hjørner og opptaksprikk */}
            {visSoker && (
                <div className="absolute pointer-events-none" style={{ inset: '5%' }}>
                    <Hjorne style={{ left: 0, top: 0, borderWidth: '5px 0 0 5px' }} />
                    <Hjorne style={{ right: 0, top: 0, borderWidth: '5px 5px 0 0' }} />
                    <Hjorne style={{ left: 0, bottom: 0, borderWidth: '0 0 5px 5px' }} />
                    <Hjorne style={{ right: 0, bottom: 0, borderWidth: '0 5px 5px 0' }} />
                    <div
                        className="absolute flex items-center font-bold"
                        style={{
                            right: 70,
                            top: 14,
                            gap: 10,
                            color: HUD,
                            fontSize: '1.5rem',
                            textShadow: '0 1px 4px #000',
                        }}
                    >
                        <span
                            className="rounded-full"
                            style={{
                                width: 20,
                                height: 20,
                                background: '#ef4444',
                                display: 'inline-block',
                            }}
                        />
                        REC
                    </div>
                </div>
            )}
            <div className="absolute pointer-events-none" style={{ left: '8%', top: '9%' }}>
                <AnimatePresence mode="wait">
                    {merke && (
                        <motion.div
                            key={merke.tekst}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="rounded-xl font-display font-bold text-white shadow-xl"
                            style={{
                                background: TONE[merke.tone ?? 'noytral'],
                                padding: '0.45rem 1.1rem',
                                fontSize: '2rem',
                            }}
                        >
                            {merke.tekst}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {bordlys && (
                <div className="absolute pointer-events-none" style={{ left: '8%', top: '22%' }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.6, duration: 0.5 }}
                        className="rounded-xl font-display font-bold text-white shadow-xl"
                        style={{
                            background: TONE.riktig,
                            padding: '0.45rem 1.1rem',
                            fontSize: '2rem',
                        }}
                    >
                        Bedre: bordlys fra siden
                    </motion.div>
                </div>
            )}
        </div>
    );
}
