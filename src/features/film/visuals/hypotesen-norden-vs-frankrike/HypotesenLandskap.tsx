import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Vikingtiden i 3D, fire steder:
 *  - lindisfarne: klosteret på øya, og langskipene som glir opp i fjæresteinene
 *  - dannevirke:  jordvollen tvers over Jylland, og den eldre nordre vollen
 *  - elv:         geriljakrig: skipene slår til der rytterne ikke er, og er borte når de kommer
 *  - kanhave:     fra spredte skip til en samlet flåte, og kanalen tvers over Samsø
 *
 * Ingen mennesker vises i kamp. Munkene og vikingene er ikke med i bildet, bare stedene og skipene.
 */

type Modus = 'lindisfarne' | 'dannevirke' | 'elv' | 'kanhave';

const damp = (a: number, b: number, l: number, dt: number) =>
    THREE.MathUtils.lerp(a, b, 1 - Math.exp(-l * dt));
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

interface KameraMal {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

const SAMSO_X = 260;

function kameraFor(modus: Modus, beat: number, t: number): KameraMal {
    if (modus === 'lindisfarne') {
        switch (beat) {
            case 0:
                return { pos: v(-16 + t * 0.3, 7, 17), se: v(-3, 2, 0) };
            case 1:
                return { pos: v(-8, 10, 22), se: v(38, 1, 0) };
            case 2:
                return { pos: v(36, 7, 20), se: v(12, 1, 0) };
            default:
                return { pos: v(-36, 34 + t * 0.3, 46), se: v(8, 0, 0) };
        }
    }
    if (modus === 'dannevirke') {
        switch (beat) {
            case 0:
                return { pos: v(0, 24, 66), se: v(0, 0, 12) };
            case 1:
                return { pos: v(-44, 14, 24), se: v(0, 1, 0) };
            case 2:
                return { pos: v(0, 74, 44), se: v(0, 0, 0) };
            default:
                return { pos: v(-12, 12, -32), se: v(-2, 1, -9) };
        }
    }
    if (modus === 'elv') {
        switch (beat) {
            case 0:
                return { pos: v(34, 22, 40), se: v(24, 0, 0) };
            case 1:
            case 2:
                return { pos: v(-4, 30, 48), se: v(-6, 0, 0) };
            default:
                return { pos: v(-2, 34, 52), se: v(-10, 0, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(0, 46, 60), se: v(0, 0, 0) };
        case 1:
            return { pos: v(-30, 26, 44), se: v(0, 0, 0) };
        case 2:
            return { pos: v(SAMSO_X - 30, 30, 34), se: v(SAMSO_X, 0, 0) };
        case 3:
            return { pos: v(SAMSO_X, 46, 30), se: v(SAMSO_X, 0, 0) };
        default:
            return { pos: v(SAMSO_X - 20, 58 + t * 0.3, 52), se: v(SAMSO_X, 0, 0) };
    }
}

function useBeatKlokke(beat: number, playing: boolean) {
    const tid = useRef(0);
    const forrige = useRef(-1);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
    });
    return { tid };
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const forste = useRef(true);
    const se = useRef(new THREE.Vector3());
    const tid = useRef(0);
    const forrige = useRef(-1);
    useFrame(({ camera }, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const m = kameraFor(modus, beat, tid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

/* ---------- Langskipet ---------- */

function useSkrog() {
    return useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(-4.2, 1.9);
        s.quadraticCurveTo(-3.6, 0, -2.4, 0);
        s.lineTo(2.4, 0);
        s.quadraticCurveTo(3.6, 0, 4.2, 1.9);
        s.lineTo(3.8, 1.9);
        s.quadraticCurveTo(3.2, 0.9, 2.3, 0.9);
        s.lineTo(-2.3, 0.9);
        s.quadraticCurveTo(-3.2, 0.9, -3.8, 1.9);
        s.closePath();
        const g = new THREE.ExtrudeGeometry(s, {
            depth: 1.2,
            bevelEnabled: true,
            bevelThickness: 0.35,
            bevelSize: 0.2,
            bevelSegments: 2,
        });
        g.translate(0, 0, -0.6);
        return g;
    }, []);
}

function Langskip({ skrog, enkel = false }: { skrog: THREE.BufferGeometry; enkel?: boolean }) {
    return (
        <group>
            <mesh geometry={skrog} position={[0, -0.35, 0]}>
                <meshStandardMaterial color="#6b3f1f" roughness={0.9} flatShading />
            </mesh>
            <mesh position={[0, 3, 0]}>
                <cylinderGeometry args={[0.08, 0.1, 4.4, 6]} />
                <meshStandardMaterial color="#3f2a16" />
            </mesh>
            <mesh position={[0, 3.3, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[2.8, 2.3]} />
                <meshStandardMaterial
                    color="#b91c1c"
                    emissive="#5f0f0f"
                    emissiveIntensity={0.25}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {!enkel && (
                <>
                    {[-1, 1].map((side) =>
                        [-2, -1, 0, 1, 2].map((i) => (
                            <mesh
                                key={`${side}${i}`}
                                position={[i * 0.95, 0.95, side * 1.0]}
                                rotation={[0, side > 0 ? 0 : Math.PI, 0]}
                            >
                                <circleGeometry args={[0.26, 10]} />
                                <meshStandardMaterial
                                    color={i % 2 === 0 ? '#eab308' : '#f8fafc'}
                                    side={THREE.DoubleSide}
                                />
                            </mesh>
                        ))
                    )}
                </>
            )}
        </group>
    );
}

/** Et skip som glir mot et mål for hver beat. Første bilde hopper rett dit. */
function GlidendeSkip({
    skrog,
    mal,
    vinkel,
    playing,
    enkel,
    skala = 1,
    fart = 0.7,
}: {
    skrog: THREE.BufferGeometry;
    mal: THREE.Vector3;
    vinkel: number;
    playing: boolean;
    enkel?: boolean;
    skala?: number;
    fart?: number;
}) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const tid = useRef((mal.x * 0.37 + mal.z * 0.71) % 10);
    useFrame((_, raw) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(raw, 0.05) : 0;
        tid.current += dt;
        if (forste.current) {
            g.position.copy(mal);
            g.rotation.y = vinkel;
            forste.current = false;
        } else {
            g.position.x = damp(g.position.x, mal.x, fart, dt);
            g.position.z = damp(g.position.z, mal.z, fart, dt);
            g.position.y = mal.y + Math.sin(tid.current * 1.6) * 0.08;
            g.rotation.y = damp(g.rotation.y, vinkel, 1.5, dt);
        }
    });
    return (
        <group ref={ref} scale={skala}>
            <Langskip skrog={skrog} enkel={enkel} />
        </group>
    );
}

function Hav({ farge = '#2f6f8f' }: { farge?: string }) {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[1400, 1400]} />
            <meshStandardMaterial
                color={farge}
                emissive="#123a4d"
                emissiveIntensity={0.45}
                roughness={0.6}
            />
        </mesh>
    );
}

function Lys() {
    return (
        <>
            <hemisphereLight args={['#e0f2fe', '#4b5d3a', 0.9]} />
            <directionalLight position={[30, 50, 20]} intensity={1.3} />
        </>
    );
}

/* ---------- Lindisfarne ---------- */

function Kloster({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 1.3, 0]}>
                <boxGeometry args={[4.4, 2.6, 2.4]} />
                <meshStandardMaterial color="#d6cfc2" flatShading />
            </mesh>
            <mesh position={[0, 3.1, 0]} rotation={[0, 0, 0]} scale={[1, 1, 1]}>
                <cylinderGeometry args={[0.01, 1.7, 1.4, 4, 1]} />
                <meshStandardMaterial color="#57534e" flatShading />
            </mesh>
            <mesh position={[2.6, 2.2, 0]}>
                <boxGeometry args={[1.3, 4.4, 1.3]} />
                <meshStandardMaterial color="#cbc3b4" flatShading />
            </mesh>
            <mesh position={[2.6, 4.9, 0]}>
                <boxGeometry args={[0.18, 1.0, 0.18]} />
                <meshStandardMaterial color="#1c1917" />
            </mesh>
            <mesh position={[2.6, 5.1, 0]}>
                <boxGeometry args={[0.6, 0.16, 0.18]} />
                <meshStandardMaterial color="#1c1917" />
            </mesh>
            {[
                [-4.5, -2.2],
                [-3.8, 2.6],
                [-6.2, 0.4],
            ].map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    <mesh position={[0, 0.6, 0]}>
                        <boxGeometry args={[1.6, 1.2, 1.4]} />
                        <meshStandardMaterial color="#a8a29e" flatShading />
                    </mesh>
                    <mesh position={[0, 1.5, 0]}>
                        <coneGeometry args={[1.2, 0.9, 4]} />
                        <meshStandardMaterial color="#a16207" flatShading />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

function LindisfarneScene({ beat, playing }: { beat: number; playing: boolean }) {
    const skrog = useSkrog();
    const xer = beat === 0 ? 110 : beat === 1 ? 46 : 18.5;
    return (
        <>
            <color attach="background" args={['#cfe3ee']} />
            <fog attach="fog" args={['#cfe3ee', 60, 190]} />
            <Lys />
            <Hav />
            <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[17.5, 18.5, 0.6, 14]} />
                <meshStandardMaterial color="#d9c79b" flatShading />
            </mesh>
            <mesh position={[-1, 0.9, 0]}>
                <cylinderGeometry args={[13, 15.5, 1.4, 11]} />
                <meshStandardMaterial color="#6f9a4a" flatShading />
            </mesh>
            <Kloster position={[-3, 1.6, 0]} />
            {[-7, 0, 7].map((z, i) => (
                <GlidendeSkip
                    key={z}
                    skrog={skrog}
                    mal={v(xer + i * 3, 0, z)}
                    vinkel={0}
                    playing={playing}
                    fart={0.55}
                />
            ))}
        </>
    );
}

/* ---------- Dannevirke ---------- */

const VOLL_X0 = -30;
const VOLL_DELER = 10;
const VOLL_LENGDE = 6;

function VollDel({
    x,
    z,
    synlig,
    gull,
    playing,
}: {
    x: number;
    z: number;
    synlig: boolean;
    gull: boolean;
    playing: boolean;
}) {
    const ref = useRef<THREE.Group>(null);
    const jord = useRef<THREE.MeshStandardMaterial>(null);
    const forste = useRef(true);
    const farge = useMemo(() => new THREE.Color(), []);
    useFrame((_, raw) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const mal = synlig ? 1 : 0.001;
        g.scale.y = forste.current ? mal : damp(g.scale.y, mal, 2.5, dt);
        g.visible = g.scale.y > 0.01;
        if (jord.current) {
            farge.set(gull ? '#d97706' : '#7c5a2e');
            if (forste.current) jord.current.color.copy(farge);
            else jord.current.color.lerp(farge, 1 - Math.exp(-3 * dt));
        }
        forste.current = false;
    });
    return (
        <group ref={ref} position={[x, 0.6, z]}>
            <mesh position={[0, 0.9, 0]}>
                <boxGeometry args={[VOLL_LENGDE + 0.1, 1.8, 3.2]} />
                <meshStandardMaterial ref={jord} color="#7c5a2e" flatShading />
            </mesh>
            <mesh position={[0, 2.3, -0.6]}>
                <boxGeometry args={[VOLL_LENGDE + 0.1, 1.0, 0.35]} />
                <meshStandardMaterial color="#4a3219" />
            </mesh>
        </group>
    );
}

function Haer({ playing, synlig }: { playing: boolean; synlig: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const gruppe = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const N = 84;
    useEffect(() => {
        const m = ref.current;
        if (!m) return;
        const o = new THREE.Object3D();
        for (let i = 0; i < N; i++) {
            const r = Math.floor(i / 14);
            const k = i % 14;
            o.position.set(-13 + k * 2, 0.8, r * 2);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    }, []);
    useFrame((_, raw) => {
        const g = gruppe.current;
        if (!g) return;
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const mal = synlig ? 16 : 60;
        g.position.z = forste.current ? mal : damp(g.position.z, mal, 0.5, dt);
        g.visible = g.position.z < 55;
        forste.current = false;
    });
    return (
        <group ref={gruppe}>
            <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
                <boxGeometry args={[0.8, 1.6, 0.8]} />
                <meshStandardMaterial color="#991b1b" />
            </instancedMesh>
        </group>
    );
}

function DannevirkeScene({ beat, playing }: { beat: number; playing: boolean }) {
    const { tid } = useBeatKlokke(beat, playing);
    return (
        <>
            <color attach="background" args={['#d7e6ee']} />
            <fog attach="fog" args={['#d7e6ee', 80, 230]} />
            <Lys />
            <Hav />
            <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[59.6, 0.6, 260]} />
                <meshStandardMaterial color="#7fa35a" flatShading />
            </mesh>
            {/* Den nordre, eldre vollen */}
            {[-2, -1, 0].map((i) => (
                <VollDel
                    key={`n${i}`}
                    x={-6 + i * VOLL_LENGDE}
                    z={-9}
                    synlig
                    gull={beat >= 3}
                    playing={playing}
                />
            ))}
            <VollRekke beat={beat} playing={playing} tid={tid} />
            <Haer playing={playing} synlig={beat <= 1} />
        </>
    );
}

function VollRekke({
    beat,
    playing,
    tid,
}: {
    beat: number;
    playing: boolean;
    tid: React.RefObject<number>;
}) {
    // Antall deler som står, regnet ut på hver beat. I beat 1 vokser de fram én etter én.
    const deler = Array.from({ length: VOLL_DELER }, (_, i) => i);
    return (
        <>
            {deler.map((i) => (
                <VollDelTid key={i} i={i} beat={beat} playing={playing} tid={tid} />
            ))}
        </>
    );
}

function VollDelTid({
    i,
    beat,
    playing,
    tid,
}: {
    i: number;
    beat: number;
    playing: boolean;
    tid: React.RefObject<number>;
}) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, raw) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const fram = beat === 0 ? false : beat === 1 ? (tid.current ?? 0) * 1.8 > i + 0.5 : true;
        const mal = fram ? 1 : 0.001;
        g.scale.y = forste.current ? mal : damp(g.scale.y, mal, 3, dt);
        g.visible = g.scale.y > 0.01;
        forste.current = false;
    });
    return (
        <group ref={ref} position={[VOLL_X0 + VOLL_LENGDE / 2 + i * VOLL_LENGDE, 0.6, 0]}>
            <mesh position={[0, 0.9, 0]}>
                <boxGeometry args={[VOLL_LENGDE + 0.1, 1.8, 3.2]} />
                <meshStandardMaterial color="#7c5a2e" flatShading />
            </mesh>
            <mesh position={[0, 2.3, -0.6]}>
                <boxGeometry args={[VOLL_LENGDE + 0.1, 1.0, 0.35]} />
                <meshStandardMaterial color="#4a3219" />
            </mesh>
        </group>
    );
}

/* ---------- Elva: geriljakrig ---------- */

function Hytter({ x, kirke = false }: { x: number; kirke?: boolean }) {
    return (
        <group position={[x, 1.2, -10]}>
            {[-3, 0, 3].map((dx, i) => (
                <group key={i} position={[dx, 0, (i % 2) * 2.5]}>
                    <mesh position={[0, 0.6, 0]}>
                        <boxGeometry args={[2, 1.2, 1.6]} />
                        <meshStandardMaterial color="#a8a29e" flatShading />
                    </mesh>
                    <mesh position={[0, 1.6, 0]}>
                        <coneGeometry args={[1.5, 1, 4]} />
                        <meshStandardMaterial color="#a16207" flatShading />
                    </mesh>
                </group>
            ))}
            {kirke && (
                <group position={[0, 0, -4]}>
                    <mesh position={[0, 1.2, 0]}>
                        <boxGeometry args={[3, 2.4, 2]} />
                        <meshStandardMaterial color="#d6cfc2" flatShading />
                    </mesh>
                    <mesh position={[0, 3.1, 0]}>
                        <boxGeometry args={[0.2, 1.4, 0.2]} />
                        <meshStandardMaterial color="#1c1917" />
                    </mesh>
                    <mesh position={[0, 3.3, 0]}>
                        <boxGeometry args={[0.8, 0.2, 0.2]} />
                        <meshStandardMaterial color="#1c1917" />
                    </mesh>
                </group>
            )}
        </group>
    );
}

function Ryttere({ x, playing }: { x: number; playing: boolean }) {
    const hester = useRef<THREE.InstancedMesh>(null);
    const folk = useRef<THREE.InstancedMesh>(null);
    const gruppe = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const tid = useRef(0);
    const N = 12;
    useEffect(() => {
        const o = new THREE.Object3D();
        for (let i = 0; i < N; i++) {
            const px = (i % 4) * 2.4;
            const pz = Math.floor(i / 4) * 1.8;
            o.position.set(px, 1.1, pz);
            o.updateMatrix();
            hester.current?.setMatrixAt(i, o.matrix);
            o.position.set(px, 2.1, pz);
            o.updateMatrix();
            folk.current?.setMatrixAt(i, o.matrix);
        }
        if (hester.current) hester.current.instanceMatrix.needsUpdate = true;
        if (folk.current) folk.current.instanceMatrix.needsUpdate = true;
    }, []);
    useFrame((_, raw) => {
        const g = gruppe.current;
        if (!g) return;
        const dt = playing ? Math.min(raw, 0.05) : 0;
        tid.current += dt;
        g.position.x = forste.current ? x : damp(g.position.x, x, 0.6, dt);
        const beveger = Math.abs(g.position.x - x) > 0.5;
        g.position.y = beveger ? Math.abs(Math.sin(tid.current * 9)) * 0.25 : 0;
        forste.current = false;
    });
    return (
        <group ref={gruppe} position={[x, 1.2, 9]} scale={1.4}>
            <instancedMesh ref={hester} args={[undefined, undefined, N]} frustumCulled={false}>
                <boxGeometry args={[1.9, 1.0, 0.6]} />
                <meshStandardMaterial color="#5b3a1e" />
            </instancedMesh>
            <instancedMesh ref={folk} args={[undefined, undefined, N]} frustumCulled={false}>
                <boxGeometry args={[0.5, 1.1, 0.5]} />
                <meshStandardMaterial color="#9ca3af" metalness={0.4} roughness={0.4} />
            </instancedMesh>
        </group>
    );
}

function ElvScene({ beat, playing }: { beat: number; playing: boolean }) {
    const skrog = useSkrog();
    const rytterX = beat <= 2 ? 26 : -12;
    const skip1 = beat === 0 ? v(-90, 0, 1) : beat <= 2 ? v(-10, 0, -2.6) : v(-95, 0, 0);
    const skip2 = beat <= 1 ? v(-120, 0, 1.5) : beat === 2 ? v(-40, 0, 2.4) : v(-110, 0, 1.5);
    return (
        <>
            <color attach="background" args={['#d9e8ee']} />
            <fog attach="fog" args={['#d9e8ee', 60, 190]} />
            <Lys />
            <Hav farge="#3b7fa0" />
            {[-1, 1].map((s) => (
                <mesh key={s} position={[0, 0.6, s * 26]}>
                    <boxGeometry args={[400, 1.2, 40]} />
                    <meshStandardMaterial color="#7fa35a" flatShading />
                </mesh>
            ))}
            <Hytter x={26} kirke />
            <Hytter x={-10} kirke />
            <Hytter x={-40} />
            <Ryttere x={rytterX} playing={playing} />
            <GlidendeSkip
                skrog={skrog}
                mal={skip1}
                vinkel={0}
                playing={playing}
                fart={0.8}
                skala={0.8}
            />
            <GlidendeSkip
                skrog={skrog}
                mal={skip2}
                vinkel={0}
                playing={playing}
                fart={0.8}
                skala={0.8}
            />
        </>
    );
}

/* ---------- Flåten og Kanhave-kanalen ---------- */

const SPREDT: [number, number, number][] = [
    [-34, -18, 0.6],
    [-12, 14, 2.4],
    [8, -26, -1.0],
    [30, 6, 3.6],
    [-28, 22, -2.2],
    [22, -8, 1.4],
    [40, 26, -0.4],
    [-44, -2, 2.9],
    [2, 30, 0.2],
    [14, 18, -2.8],
    [-6, -8, 1.9],
    [36, -24, -1.6],
];

function samsoForm() {
    const pts: [number, number][] = [
        [-3, -16],
        [3, -17],
        [6, -11],
        [5, -5],
        [3.2, -1.6],
        [3.2, 1.6],
        [6, 5],
        [8, 12],
        [4, 18],
        [-3, 17],
        [-6, 10],
        [-4, 4],
        [-3, 1.6],
        [-3, -1.6],
        [-5, -6],
        [-6, -12],
    ];
    const s = new THREE.Shape();
    pts.forEach(([x, z], i) => (i === 0 ? s.moveTo(x, -z) : s.lineTo(x, -z)));
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 1.2, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    return g;
}

function KanhaveScene({ beat, playing }: { beat: number; playing: boolean }) {
    const skrog = useSkrog();
    const oy = useMemo(() => samsoForm(), []);
    const kanalSkip = beat <= 2 ? v(SAMSO_X - 16, 0, 0) : v(SAMSO_X + 16, 0, 0);
    return (
        <>
            <color attach="background" args={['#cfe3ee']} />
            <fog attach="fog" args={['#cfe3ee', 70, 220]} />
            <Lys />
            <Hav />
            {SPREDT.map(([x, z, r], i) => {
                const rad = Math.floor(i / 4);
                const kol = i % 4;
                const samlet = beat >= 1;
                const mal = samlet ? v(-12 + kol * 9 + rad * 2, 0, -8 + rad * 8) : v(x, 0, z);
                return (
                    <GlidendeSkip
                        key={i}
                        skrog={skrog}
                        mal={mal}
                        vinkel={samlet ? 0 : r}
                        playing={playing}
                        enkel
                        fart={0.6}
                    />
                );
            })}
            <group position={[SAMSO_X, 0, 0]}>
                <mesh geometry={oy}>
                    <meshStandardMaterial color="#7fa35a" flatShading />
                </mesh>
                <mesh position={[0, 1.24, 0]}>
                    <boxGeometry args={[7.4, 0.08, 1.2]} />
                    <meshStandardMaterial
                        color="#38bdf8"
                        emissive="#0369a1"
                        emissiveIntensity={0.6}
                    />
                </mesh>
            </group>
            <GlidendeSkip
                skrog={skrog}
                mal={kanalSkip}
                vinkel={0}
                playing={playing}
                enkel
                skala={0.32}
                fart={0.22}
            />
        </>
    );
}

/* ---------- Merkelapper ---------- */

interface Merkelapp {
    id: string;
    tekst: string;
    farge: string;
    synlig: boolean;
    punkt: THREE.Vector3;
}

function merkerFor(modus: Modus, beat: number): Merkelapp[] {
    if (modus === 'lindisfarne')
        return [
            {
                id: 'l0',
                tekst: 'Klosteret',
                farge: '#334155',
                synlig: beat === 0,
                punkt: v(-1, 7.5, 0),
            },
            {
                id: 'l1',
                tekst: 'Langskip',
                farge: '#991b1b',
                synlig: beat === 1,
                punkt: v(50, 7, 0),
            },
            {
                id: 'l3',
                tekst: 'Lindisfarne',
                farge: '#166534',
                synlig: beat === 3,
                punkt: v(-4, 10, 0),
            },
        ];
    if (modus === 'dannevirke')
        return [
            {
                id: 'd0a',
                tekst: 'Danmark',
                farge: '#166534',
                synlig: beat === 0,
                punkt: v(0, 3, -26),
            },
            {
                id: 'd0b',
                tekst: 'Hæren fra sør',
                farge: '#991b1b',
                synlig: beat === 0,
                punkt: v(0, 5, 18),
            },
            {
                id: 'd1',
                tekst: 'Dannevirke',
                farge: '#78350f',
                synlig: beat === 1,
                punkt: v(14, 6, 0),
            },
            { id: 'd1b', tekst: 'Sør', farge: '#991b1b', synlig: beat === 1, punkt: v(22, 3, 16) },
            {
                id: 'd2a',
                tekst: 'Nordsjøen',
                farge: '#1d4ed8',
                synlig: beat === 2,
                punkt: v(-42, 1, 0),
            },
            {
                id: 'd2b',
                tekst: 'Østersjøen',
                farge: '#1d4ed8',
                synlig: beat === 2,
                punkt: v(42, 1, 0),
            },
            {
                id: 'd3',
                tekst: 'Nordre vollen: år 737',
                farge: '#b45309',
                synlig: beat === 3,
                punkt: v(-6, 3.4, -9),
            },
        ];
    if (modus === 'elv')
        return [
            {
                id: 'e0',
                tekst: 'Forsvar hjemme',
                farge: '#334155',
                synlig: beat === 0,
                punkt: v(30, 6, 9),
            },
            {
                id: 'e1',
                tekst: 'Vikingene slår til her',
                farge: '#991b1b',
                synlig: beat === 1,
                punkt: v(-10, 4.2, -9),
            },
            {
                id: 'e3',
                tekst: 'Ryttere i rustning',
                farge: '#334155',
                synlig: beat === 3,
                punkt: v(-6, 6, 11),
            },
        ];
    return [
        {
            id: 'k0',
            tekst: 'Små grupper?',
            farge: '#334155',
            synlig: beat === 0,
            punkt: v(0, 6, -30),
        },
        {
            id: 'k1',
            tekst: 'En samlet flåte',
            farge: '#991b1b',
            synlig: beat === 1,
            punkt: v(2, 3, 14),
        },
        {
            id: 'k2',
            tekst: 'Samsø',
            farge: '#166534',
            synlig: beat === 2,
            punkt: v(SAMSO_X - 4, 4, -10),
        },
        {
            id: 'k2b',
            tekst: 'Kanhave-kanalen, 726',
            farge: '#1d4ed8',
            synlig: beat === 2,
            punkt: v(SAMSO_X + 9, 3, 2),
        },
        {
            id: 'k3a',
            tekst: '← Jylland',
            farge: '#334155',
            synlig: beat === 3,
            punkt: v(SAMSO_X - 22, 1, 0),
        },
        {
            id: 'k3b',
            tekst: 'Sjælland →',
            farge: '#334155',
            synlig: beat === 3,
            punkt: v(SAMSO_X + 22, 1, 0),
        },
    ];
}

const tmp = new THREE.Vector3();

function Merkeflytter({
    merker,
    finn,
}: {
    merker: Merkelapp[];
    finn: (id: string) => HTMLDivElement | null | undefined;
}) {
    useFrame(({ camera, size }) => {
        for (const m of merker) {
            const el = finn(m.id);
            if (!el) continue;
            tmp.copy(m.punkt).project(camera);
            const bak = tmp.z > 1;
            el.style.left = `${((tmp.x + 1) / 2) * size.width}px`;
            el.style.top = `${((1 - tmp.y) / 2) * size.height}px`;
            el.style.opacity = m.synlig && !bak ? '1' : '0';
        }
    });
    return null;
}

const KORT: Record<Modus, ({ tittel: string; tekst?: string } | null)[]> = {
    lindisfarne: [null, null, null, { tittel: 'Starten på vikingtiden?', tekst: '8. juni 793' }],
    dannevirke: [
        { tittel: 'Karl truer Danmark' },
        { tittel: 'Kong Godfred bygger ut', tekst: 'en grensevoll av jord' },
        { tittel: 'Rundt 30 kilometer', tekst: 'tvers over Jylland' },
        { tittel: 'Eldre enn Godfred', tekst: 'datert med årringer i treverket' },
    ],
    elv: [
        { tittel: 'Hvis hypotesen stemmer:', tekst: 'kongene må forsvare seg hjemme' },
        { tittel: 'Geriljakrig', tekst: 'små, raske angrep' },
        { tittel: 'Hvor som helst, når som helst' },
        { tittel: 'Borte før hæren kommer' },
    ],
    kanhave: [
        null,
        { tittel: 'Den store hedenske hæren', tekst: 'East Anglia, 865: for å erobre' },
        null,
        { tittel: 'Kontroll over seilasen', tekst: 'mellom Jylland og Sjælland' },
        { tittel: 'Krever en sterk makt', tekst: 'en konge, eller en slags stat?' },
    ],
};

export function HypotesenLandskap({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'lindisfarne';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const refs = useRef<Record<string, HTMLDivElement | null>>({});
    const merker = merkerFor(modus, beat);
    const kort = KORT[modus][Math.min(beat, KORT[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [30, 20, 40] }}
            >
                <Kamera modus={modus} beat={beat} playing={playing} />
                {modus === 'lindisfarne' && <LindisfarneScene beat={beat} playing={playing} />}
                {modus === 'dannevirke' && <DannevirkeScene beat={beat} playing={playing} />}
                {modus === 'elv' && <ElvScene beat={beat} playing={playing} />}
                {modus === 'kanhave' && <KanhaveScene beat={beat} playing={playing} />}
                <Merkeflytter merker={merker} finn={(id) => refs.current[id]} />
            </Canvas>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {merker.map((m) => (
                    <div
                        key={m.id}
                        ref={(el) => {
                            refs.current[m.id] = el;
                        }}
                        className="absolute"
                        style={{ opacity: 0, transition: 'opacity 0.6s' }}
                    >
                        <div
                            className="px-4 py-1.5 rounded-xl bg-white/95 shadow-lg font-black text-2xl whitespace-nowrap border-b-4"
                            style={{
                                transform: 'translate(-50%, -100%)',
                                color: m.farge,
                                borderColor: m.farge,
                            }}
                        >
                            {m.tekst}
                        </div>
                    </div>
                ))}
            </div>
            {kort && (
                <div
                    className="absolute inset-x-0 flex justify-center pointer-events-none"
                    style={{ top: '4%' }}
                >
                    <motion.div
                        key={kort.tittel}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="px-7 py-3 rounded-2xl bg-white/95 shadow-xl text-center border-b-4 border-red-800"
                    >
                        <div className="text-3xl font-black text-stone-900">{kort.tittel}</div>
                        {kort.tekst && (
                            <div className="text-xl font-semibold text-stone-500">{kort.tekst}</div>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
}
