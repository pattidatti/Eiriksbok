import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Bygda i 3D: en liten rød skole, butikken, husene langs dalen og veien ut mot byen i det
 * fjerne. Fire moduser: skolen (tolv elever, bussen, protesten), flytting (de unge reiser
 * til byen, de eldre blir igjen), sirkel (lysene slukner, butikken og skolen stenger) og
 * tilbake (skolen igjen, med begge sider).
 */

type Modus = 'skolen' | 'flytting' | 'sirkel' | 'tilbake';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

const VEI_Z = 10;
const BYEN_X = 190;
const SKOLE = v(0, 0, -2);
const BUTIKK = v(-22, 0, 1);

/** Husene i bygda. Rekkefølgen er rekkefølgen lysene slukner i. */
const HUS: { x: number; z: number; r: number; farge: string }[] = [
    { x: -38, z: -6, r: 0.2, farge: '#9b2c2c' },
    { x: 22, z: -14, r: -0.3, farge: '#f1e7d0' },
    { x: -10, z: -22, r: 0.1, farge: '#c08a2e' },
    { x: 34, z: 24, r: 0.5, farge: '#9b2c2c' },
    { x: -46, z: 22, r: -0.2, farge: '#f1e7d0' },
    { x: 10, z: 26, r: 0.3, farge: '#9b2c2c' },
    { x: -30, z: -28, r: -0.4, farge: '#c08a2e' },
    { x: 46, z: -6, r: 0.1, farge: '#f1e7d0' },
    { x: -56, z: 0, r: 0.6, farge: '#9b2c2c' },
    { x: 28, z: -34, r: -0.1, farge: '#f1e7d0' },
];

/** Hvor mange hus som har mørke vinduer, per modus og beat. */
function morkeHus(modus: Modus, beat: number) {
    if (modus === 'flytting') return beat >= 3 ? 4 : 0;
    if (modus === 'sirkel') return [0, 3, 5, 7, 8][Math.min(beat, 4)];
    return 0;
}
const butikkStengt = (m: Modus, b: number) => m === 'sirkel' && b >= 2;
const skoleStengt = (m: Modus, b: number) => m === 'sirkel' && b >= 2;

/** Bussen: x-posisjon langs veien ut fra tida i beaten. null = ikke i bildet. */
function bussX(modus: Modus, beat: number, t: number): number | null {
    if (modus === 'skolen' && beat === 3) return 6 + Math.min(t / 9, 1) * 150;
    if (modus === 'flytting' && beat === 1) return 16;
    if (modus === 'flytting' && beat === 2) return 8 + Math.min(t / 8, 1) * (BYEN_X - 26);
    if (modus === 'sirkel' && beat === 3) return 8 + Math.min(t / 9, 1) * 140;
    return null;
}

function kameraFor(modus: Modus, beat: number, t: number, bx: number | null) {
    if (bx !== null && !(modus === 'flytting' && beat === 1)) {
        if (modus === 'flytting') return { pos: v(BYEN_X - 75, 12, 42), se: v(BYEN_X + 4, 8, -8) };
        return { pos: v(bx - 22, 9, VEI_Z + 22), se: v(bx + 14, 1.5, VEI_Z) };
    }
    if (modus === 'skolen') {
        switch (beat) {
            case 0:
                return { pos: v(-60 + t * 0.8, 30, 80), se: v(0, 2, 0) };
            case 1:
                return { pos: v(-4, 10, 26), se: v(-2, 1.5, 3) };
            case 2:
                return { pos: v(10 - t * 0.2, 5, 24), se: v(0, 3.5, -2) };
            default:
                return { pos: v(-20, 8, 30), se: v(0, 2.5, 0) };
        }
    }
    if (modus === 'flytting') {
        switch (beat) {
            case 0:
                return { pos: v(-50, 28, 60), se: v(80, 4, 0) };
            case 1:
                return { pos: v(6, 5, 28), se: v(10, 1.5, VEI_Z - 2) };
            case 3:
                return { pos: v(-36, 12, 40), se: v(-14, 2, 0) };
            default:
                return { pos: v(-50, 40, 90), se: v(10, 0, 0) };
        }
    }
    if (modus === 'sirkel') {
        switch (beat) {
            case 0:
                return { pos: v(-70, 46, 90), se: v(-4, 0, 0) };
            case 1:
                return { pos: v(-60, 24, 50), se: v(-8, 2, 0) };
            case 2:
                return { pos: v(-30, 10, 30), se: v(-10, 2, -1) };
            default:
                return { pos: v(-90 - t * 0.5, 60, 110), se: v(0, 0, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-4, 9, 28), se: v(-2, 2, 2) };
        default:
            return { pos: v(-14, 12, 40), se: v(-6, 2, 0) };
    }
}

const mat = {
    gress: new THREE.MeshStandardMaterial({ color: '#7f8f4e', emissive: '#2c3318', roughness: 1 }),
    vei: new THREE.MeshStandardMaterial({ color: '#4b5160', emissive: '#1b1e25', roughness: 0.8 }),
    stripe: new THREE.MeshBasicMaterial({ color: '#f8fafc' }),
    grus: new THREE.MeshStandardMaterial({ color: '#b9ad97', emissive: '#3e3729', roughness: 1 }),
    skole: new THREE.MeshStandardMaterial({ color: '#a32626', roughness: 0.8, flatShading: true }),
    hvit: new THREE.MeshStandardMaterial({ color: '#f8f5ee', roughness: 0.8 }),
    tak: new THREE.MeshStandardMaterial({ color: '#3a3f4a', roughness: 0.8, flatShading: true }),
    lys: new THREE.MeshStandardMaterial({
        color: '#ffd27a',
        emissive: '#ffb23e',
        emissiveIntensity: 1.2,
    }),
    mork: new THREE.MeshStandardMaterial({ color: '#1f2430', roughness: 0.6 }),
    planke: new THREE.MeshStandardMaterial({ color: '#8a6a45', roughness: 1 }),
    butikk: new THREE.MeshStandardMaterial({ color: '#e8edf2', roughness: 0.8 }),
    skilt: new THREE.MeshStandardMaterial({
        color: '#1d4ed8',
        emissive: '#1e3a8a',
        emissiveIntensity: 0.5,
    }),
    fjell: new THREE.MeshStandardMaterial({
        color: '#66705a',
        emissive: '#22281c',
        roughness: 1,
        flatShading: true,
    }),
    bjork: new THREE.MeshStandardMaterial({
        color: '#e0a526',
        emissive: '#5a3b06',
        roughness: 0.9,
        flatShading: true,
    }),
    gran: new THREE.MeshStandardMaterial({
        color: '#2f5a3a',
        emissive: '#10231a',
        roughness: 0.9,
        flatShading: true,
    }),
    stamme: new THREE.MeshStandardMaterial({ color: '#e7e2d8', roughness: 1 }),
    buss: new THREE.MeshStandardMaterial({
        color: '#facc15',
        emissive: '#7a5d00',
        emissiveIntensity: 0.4,
        flatShading: true,
    }),
    glass: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.2 }),
    hjul: new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.9 }),
    by: new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        emissive: '#334155',
        roughness: 0.7,
        flatShading: true,
    }),
    hud: new THREE.MeshStandardMaterial({ color: '#f1c7a0', roughness: 0.9 }),
    graatt: new THREE.MeshStandardMaterial({ color: '#e5e7eb', roughness: 0.9 }),
    flagg: new THREE.MeshStandardMaterial({
        color: '#ba0c2f',
        emissive: '#4a0512',
        side: THREE.DoubleSide,
    }),
};

const KLAER = ['#2563eb', '#16a34a', '#db2777', '#f97316', '#7c3aed', '#0891b2'].map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 })
);

function Hus({
    x,
    z,
    r,
    farge,
    mork,
}: {
    x: number;
    z: number;
    r: number;
    farge: string;
    mork: boolean;
}) {
    const vegg = useMemo(
        () => new THREE.MeshStandardMaterial({ color: farge, roughness: 0.85, flatShading: true }),
        [farge]
    );
    return (
        <group position={[x, 0, z]} rotation={[0, r, 0]}>
            <mesh material={vegg} position={[0, 1.6, 0]}>
                <boxGeometry args={[5, 3.2, 4]} />
            </mesh>
            <mesh
                material={mat.tak}
                position={[0, 3.9, 0]}
                rotation={[0, Math.PI / 4, 0]}
                scale={[1, 1, 1]}
            >
                <coneGeometry args={[3.9, 1.8, 4, 1]} />
            </mesh>
            <mesh material={mork ? mat.mork : mat.lys} position={[0, 1.8, 2.02]}>
                <planeGeometry args={[3.2, 1.1]} />
            </mesh>
        </group>
    );
}

function Skolen({ stengt }: { stengt: boolean }) {
    return (
        <group position={SKOLE.toArray()}>
            <mesh material={mat.skole} position={[0, 2.4, 0]}>
                <boxGeometry args={[12, 4.8, 7]} />
            </mesh>
            {[-1, 1].map((side) => (
                <mesh
                    key={side}
                    material={mat.tak}
                    position={[0, 5.75, side * 1.85]}
                    rotation={[side * 0.62, 0, 0]}
                >
                    <boxGeometry args={[12.6, 0.3, 4.6]} />
                </mesh>
            ))}
            <mesh material={mat.skole} position={[6.8, 1.8, 1]}>
                <boxGeometry args={[3, 3.6, 4]} />
            </mesh>
            {[-3.6, 0, 3.6].map((x) => (
                <mesh key={x} material={stengt ? mat.mork : mat.lys} position={[x, 2.6, 3.52]}>
                    <planeGeometry args={[2, 1.6]} />
                </mesh>
            ))}
            <mesh material={mat.hvit} position={[6.8, 1.2, 3.02]}>
                <planeGeometry args={[1.4, 2.4]} />
            </mesh>
            {stengt && (
                <mesh material={mat.planke} position={[6.8, 1.3, 3.1]} rotation={[0, 0, 0.6]}>
                    <boxGeometry args={[2.6, 0.35, 0.1]} />
                </mesh>
            )}
            <mesh material={mat.hvit} position={[-9, 5, 6]}>
                <cylinderGeometry args={[0.12, 0.12, 10, 6]} />
            </mesh>
            <mesh material={mat.flagg} position={[-7.9, 9, 6]}>
                <planeGeometry args={[2.2, 1.5]} />
            </mesh>
            <mesh material={mat.grus} rotation={[-Math.PI / 2, 0, 0]} position={[-3, 0.03, 6.5]}>
                <planeGeometry args={[16, 6]} />
            </mesh>
        </group>
    );
}

function Butikken({ stengt }: { stengt: boolean }) {
    return (
        <group position={BUTIKK.toArray()} rotation={[0, 0.15, 0]}>
            <mesh material={mat.butikk} position={[0, 1.8, 0]}>
                <boxGeometry args={[9, 3.6, 6]} />
            </mesh>
            <mesh material={mat.tak} position={[0, 3.75, 0]}>
                <boxGeometry args={[9.6, 0.3, 6.6]} />
            </mesh>
            <mesh material={stengt ? mat.mork : mat.skilt} position={[0, 3.1, 3.02]}>
                <planeGeometry args={[6, 0.9]} />
            </mesh>
            <mesh material={stengt ? mat.mork : mat.lys} position={[0, 1.3, 3.02]}>
                <planeGeometry args={[6.5, 1.8]} />
            </mesh>
            {stengt &&
                [-0.5, 0.5].map((r) => (
                    <mesh
                        key={r}
                        material={mat.planke}
                        position={[0, 1.3, 3.12]}
                        rotation={[0, 0, r]}
                    >
                        <boxGeometry args={[7, 0.35, 0.1]} />
                    </mesh>
                ))}
        </group>
    );
}

/** En liten figur: kropp i farge, hode, valgfritt grått hår (eldre) og kofferter (de unge). */
function Figur({
    x,
    z,
    stor = 1,
    farge,
    eldre = false,
    koffert = false,
    skilt = false,
}: {
    x: number;
    z: number;
    stor?: number;
    farge: number;
    eldre?: boolean;
    koffert?: boolean;
    skilt?: boolean;
}) {
    return (
        <group position={[x, 0, z]} scale={stor}>
            <mesh material={KLAER[farge % KLAER.length]} position={[0, 0.75, 0]}>
                <cylinderGeometry args={[0.32, 0.42, 1.5, 7]} />
            </mesh>
            <mesh material={mat.hud} position={[0, 1.8, 0]}>
                <sphereGeometry args={[0.36, 10, 8]} />
            </mesh>
            {eldre && (
                <mesh material={mat.graatt} position={[0, 2.0, -0.05]}>
                    <sphereGeometry args={[0.33, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                </mesh>
            )}
            {koffert && (
                <mesh material={mat.planke} position={[0.6, 0.45, 0]}>
                    <boxGeometry args={[0.35, 0.8, 0.9]} />
                </mesh>
            )}
            {skilt && (
                <group position={[0.4, 2.6, 0.2]}>
                    <mesh material={mat.planke} position={[0, -0.6, 0]}>
                        <boxGeometry args={[0.08, 1.4, 0.08]} />
                    </mesh>
                    <mesh material={mat.hvit} position={[0, 0.3, 0.06]}>
                        <boxGeometry args={[1.6, 0.9, 0.06]} />
                    </mesh>
                </group>
            )}
        </group>
    );
}

/** Tolv elever i skolegården. */
const ELEVER = Array.from({ length: 12 }, (_, i) => ({
    x: -9 + (i % 6) * 2.4 + frø(i) * 0.6,
    z: 3 + Math.floor(i / 6) * 2 + frø(i + 9) * 0.5,
}));

/** Folk fra bygda i en rekke foran skolen, med skilt. */
const PROTEST = Array.from({ length: 14 }, (_, i) => ({
    x: -10 + i * 1.6,
    z: 3.2 + (i % 2) * 1.6,
}));

function Busser({ bussRef }: { bussRef: React.RefObject<THREE.Group | null> }) {
    return (
        <group ref={bussRef} position={[0, 0, VEI_Z - 1.4]} visible={false}>
            <mesh material={mat.buss} position={[0, 1.9, 0]}>
                <boxGeometry args={[9, 3, 2.6]} />
            </mesh>
            <mesh material={mat.glass} position={[0, 2.4, 1.31]}>
                <planeGeometry args={[7.6, 1]} />
            </mesh>
            <mesh material={mat.glass} position={[4.51, 2.3, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[2.2, 1.4]} />
            </mesh>
            {[-3, 3].map((x) => (
                <mesh
                    key={x}
                    material={mat.hjul}
                    position={[x, 0.5, 1.2]}
                    rotation={[Math.PI / 2, 0, 0]}
                >
                    <cylinderGeometry args={[0.5, 0.5, 0.4, 10]} />
                </mesh>
            ))}
        </group>
    );
}

/** Byen i enden av dalen: høye blokker med lys i vinduene. */
function Byen() {
    const blokker = useMemo(
        () =>
            Array.from({ length: 14 }, (_, i) => ({
                x: BYEN_X + (i % 5) * 7 - 6 + frø(i) * 2,
                z: -26 + Math.floor(i / 5) * 9 + frø(i + 3) * 2,
                h: 10 + frø(i + 20) * 22,
            })),
        []
    );
    return (
        <group>
            {blokker.map((b, i) => (
                <group key={i} position={[b.x, 0, b.z]}>
                    <mesh material={mat.by} position={[0, b.h / 2, 0]}>
                        <boxGeometry args={[5.5, b.h, 5.5]} />
                    </mesh>
                    <mesh material={mat.lys} position={[0, b.h * 0.6, 2.77]}>
                        <planeGeometry args={[3.6, b.h * 0.6]} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/** Trær langs dalsidene: bjørk i høstfarger og gran. */
function Traer() {
    const N = 150;
    const kroner = useRef<THREE.InstancedMesh>(null);
    const graner = useRef<THREE.InstancedMesh>(null);
    const stammer = useRef<THREE.InstancedMesh>(null);
    const pos = useMemo(() => {
        const ut: { x: number; z: number; s: number; gran: boolean }[] = [];
        let i = 0;
        while (ut.length < N) {
            i++;
            const x = -120 + frø(i) * 340;
            const z = -70 + frø(i + 500) * 130;
            if (Math.abs(z - VEI_Z) < 6) continue;
            if (x > -64 && x < 54 && z > -40 && z < 32 && frø(i + 77) < 0.75) continue;
            if (x > -80 && x < 70 && z > VEI_Z && z < 60) continue;
            if (x > BYEN_X - 16 && x < BYEN_X + 36 && z < 4 && z > -36) continue;
            ut.push({ x, z, s: 0.8 + frø(i + 900) * 0.8, gran: frø(i + 33) < 0.4 });
        }
        return ut;
    }, []);
    const settRef = (m: THREE.InstancedMesh | null, hvilke: 'krone' | 'gran' | 'stamme') => {
        if (!m) return;
        const o = new THREE.Object3D();
        let n = 0;
        pos.forEach((p) => {
            if (hvilke === 'krone' && p.gran) return;
            if (hvilke === 'gran' && !p.gran) return;
            if (hvilke === 'stamme') o.position.set(p.x, 1 * p.s, p.z);
            else o.position.set(p.x, (p.gran ? 3.6 : 3.4) * p.s, p.z);
            o.scale.setScalar(p.s);
            o.updateMatrix();
            m.setMatrixAt(n++, o.matrix);
        });
        m.count = n;
        m.instanceMatrix.needsUpdate = true;
    };
    return (
        <>
            <instancedMesh
                ref={(m) => {
                    kroner.current = m;
                    settRef(m, 'krone');
                }}
                args={[undefined, undefined, N]}
                material={mat.bjork}
                frustumCulled={false}
            >
                <icosahedronGeometry args={[1.8, 0]} />
            </instancedMesh>
            <instancedMesh
                ref={(m) => {
                    graner.current = m;
                    settRef(m, 'gran');
                }}
                args={[undefined, undefined, N]}
                material={mat.gran}
                frustumCulled={false}
            >
                <coneGeometry args={[1.8, 5.5, 6]} />
            </instancedMesh>
            <instancedMesh
                ref={(m) => {
                    stammer.current = m;
                    settRef(m, 'stamme');
                }}
                args={[undefined, undefined, N]}
                material={mat.stamme}
                frustumCulled={false}
            >
                <cylinderGeometry args={[0.18, 0.22, 2, 5]} />
            </instancedMesh>
        </>
    );
}

function Fjell() {
    const fjell = [
        [-100, -110, 70, 60],
        [-10, -130, 90, 75],
        [100, -120, 80, 65],
        [210, -110, 70, 55],
        [-130, 90, 60, 45],
        [60, 120, 80, 50],
        [190, 110, 70, 45],
    ];
    return (
        <>
            {fjell.map(([x, z, r, h], i) => (
                <mesh key={i} material={mat.fjell} position={[x, h / 2 - 2, z]}>
                    <coneGeometry args={[r, h, 7, 1]} />
                </mesh>
            ))}
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const bussRef = useRef<THREE.Group>(null);
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);

    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;
        const bx = bussX(modus, beat, t);
        const g = bussRef.current;
        if (g) {
            g.visible = bx !== null;
            if (bx !== null) g.position.x = bx;
        }
        const m = kameraFor(modus, beat, t, bx);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        // Når kameraet følger bussen, henger det tett etter, så bussen ikke glir ut av bildet.
        const kk =
            bx !== null && modus !== 'flytting' ? (forste.current ? 1 : 1 - Math.exp(-4 * dt)) : k;
        forste.current = false;
        camera.position.lerp(m.pos, kk);
        se.current.lerp(m.se, kk);
        camera.lookAt(se.current);
    });

    const mork = morkeHus(modus, beat);
    const visElever =
        (modus === 'skolen' && beat <= 2) ||
        modus === 'tilbake' ||
        (modus === 'sirkel' && beat <= 1);
    const visProtest = modus === 'skolen' && beat === 4;
    const visUnge = modus === 'flytting' && beat <= 1;
    const visEldre = modus === 'flytting' && beat >= 3;

    return (
        <>
            <color attach="background" args={['#c7d6e2']} />
            <fog attach="fog" args={['#c7d6e2', 120, 420]} />
            <ambientLight intensity={0.75} color="#f3efe6" />
            <directionalLight position={[-60, 90, 50]} intensity={1.3} color="#fff1dc" />
            <hemisphereLight args={['#e6eef6', '#4b5a38', 0.5]} />
            <mesh material={mat.gress} rotation={[-Math.PI / 2, 0, 0]} position={[60, 0, 0]}>
                <planeGeometry args={[700, 500]} />
            </mesh>
            <mesh material={mat.vei} rotation={[-Math.PI / 2, 0, 0]} position={[80, 0.04, VEI_Z]}>
                <planeGeometry args={[340, 6]} />
            </mesh>
            {Array.from({ length: 28 }, (_, i) => (
                <mesh
                    key={i}
                    material={mat.stripe}
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[-80 + i * 12, 0.06, VEI_Z]}
                >
                    <planeGeometry args={[4, 0.25]} />
                </mesh>
            ))}
            <Fjell />
            <Traer />
            {HUS.map((h, i) => (
                <Hus key={i} {...h} mork={i < mork} />
            ))}
            <Skolen stengt={skoleStengt(modus, beat)} />
            <Butikken stengt={butikkStengt(modus, beat)} />
            <Byen />
            <Busser bussRef={bussRef} />
            {visElever &&
                ELEVER.map((e, i) => <Figur key={i} x={e.x} z={e.z} stor={0.8} farge={i} />)}
            {visProtest &&
                PROTEST.map((p, i) => (
                    <Figur key={i} x={p.x} z={p.z} farge={i + 2} skilt={i % 3 === 0} />
                ))}
            {visUnge &&
                [0, 1, 2, 3, 4].map((i) => (
                    <Figur
                        key={i}
                        x={3 + i * 1.6}
                        z={VEI_Z - 3.6 - (i % 2) * 0.9}
                        farge={i + 1}
                        koffert
                    />
                ))}
            {visEldre &&
                [0, 1, 2, 3].map((i) => (
                    <Figur key={i} x={-20 + i * 2} z={7 + (i % 2)} farge={5} eldre />
                ))}
        </>
    );
}

const MERKER: Record<Modus, (string | null)[]> = {
    skolen: [
        'En liten skole i en bygd',
        null,
        'Skal skolen legges ned?',
        'Over en time med buss hver dag',
        'Skolen er også en møteplass',
    ],
    flytting: [
        'Utdanning og jobb i byen',
        'Unge flytter for å studere',
        'Jobb, familie, blir boende',
        'Færre barn, de eldre blir igjen',
        'Over 70 år i 2050',
    ],
    sirkel: [
        'En bygd',
        'Folk flytter',
        'Butikken og skolen stenger',
        'Enda flere flytter',
        'En ond sirkel',
    ],
    tilbake: ['Den lille skolen', 'Kommunen', 'Bygda', 'Begge sider har gode argumenter'],
};

/** Den onde sirkelen som fire bokser i en ring. Beaten lyser opp stegene etter tur. */
const SIRKEL = [
    'Folk flytter',
    'Færre kunder og elever',
    'Butikk og skole legges ned',
    'Mindre fristende å bo',
];

function Sirkelen({ beat }: { beat: number }) {
    const aktiv = [-1, 2, 3, 4, 4][Math.min(beat, 4)];
    const R = 118;
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute right-[2.5%] bottom-[5%] rounded-3xl bg-white/90 shadow-2xl"
            style={{ width: 380, height: 360 }}
        >
            <svg viewBox="0 0 380 360" className="absolute inset-0 w-full h-full">
                <defs>
                    <marker
                        id="sentr-pil"
                        viewBox="0 0 10 10"
                        refX="6"
                        refY="5"
                        markerWidth="5"
                        markerHeight="5"
                        orient="auto"
                    >
                        <path d="M0,0 L10,5 L0,10 z" fill="#dc2626" />
                    </marker>
                </defs>
                <circle
                    cx={190}
                    cy={180}
                    r={R}
                    fill="none"
                    stroke={beat >= 4 ? '#dc2626' : '#cbd5e1'}
                    strokeWidth={6}
                    strokeDasharray="30 18"
                    markerEnd="url(#sentr-pil)"
                />
            </svg>
            {SIRKEL.map((s, i) => {
                const vinkel = -Math.PI / 2 + (i * Math.PI) / 2;
                const x = 190 + Math.cos(vinkel) * R;
                const y = 180 + Math.sin(vinkel) * R;
                const paa = beat >= 4 || i + 1 === aktiv || (aktiv === 4 && i === 0);
                const sett = aktiv >= i + 1 || beat >= 4;
                return (
                    <div
                        key={s}
                        className="absolute"
                        style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
                    >
                        <div
                            className="rounded-2xl px-3 py-2 text-center font-bold shadow-lg"
                            style={{
                                width: 165,
                                fontSize: 22,
                                lineHeight: 1.15,
                                background: paa ? '#dc2626' : sett ? '#fee2e2' : '#f1f5f9',
                                color: paa ? '#fff' : '#334155',
                                transition: 'background 0.6s',
                            }}
                        >
                            {s}
                        </div>
                    </div>
                );
            })}
        </motion.div>
    );
}

function Elevtall({ beat }: { beat: number }) {
    return (
        <div className="absolute right-[3%] top-[20%] flex flex-col gap-4">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: beat >= 1 ? 1 : 0, x: 0 }}
                className="rounded-2xl bg-white px-6 py-3 shadow-xl"
            >
                <div className="text-2xl font-bold text-slate-600">For 20 år siden</div>
                <div className="text-5xl font-black text-slate-600 tabular-nums">
                    over 60 elever
                </div>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: beat >= 1 ? 1 : 0, x: 0 }}
                transition={{ delay: 0.8 }}
                className="rounded-2xl bg-white/95 px-6 py-3 shadow-xl"
            >
                <div className="text-2xl font-bold text-slate-700">Nå</div>
                <div className="text-6xl font-black text-red-600 tabular-nums">12 elever</div>
            </motion.div>
        </div>
    );
}

function EldreStolper() {
    const rader = [
        { etikett: 'Mest sentrale kommuner', tekst: '16 prosent', andel: 16 },
        { etikett: 'Minst sentrale kommuner', tekst: 'rundt en firedel', andel: 25 },
    ];
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-[3%] bottom-[6%] rounded-3xl bg-white/95 px-7 py-5 shadow-2xl"
            style={{ width: 470 }}
        >
            <div className="text-xl font-bold text-slate-500 mb-3">
                Andel over 70 år i 2050 (SSB)
            </div>
            {rader.map((r, i) => (
                <div key={r.etikett} className="mb-3">
                    <div className="text-2xl font-bold text-slate-800">{r.etikett}</div>
                    <div className="flex items-center gap-4">
                        <div
                            className="relative rounded-full bg-slate-200"
                            style={{ width: 200, height: 24 }}
                        >
                            <motion.div
                                className="absolute left-0 top-0 h-full rounded-full"
                                style={{ background: i ? '#ea580c' : '#2563eb' }}
                                initial={{ width: 0 }}
                                animate={{ width: (r.andel / 30) * 200 }}
                                transition={{ delay: 0.4 + i * 0.8, duration: 1 }}
                            />
                        </div>
                        <span className="text-3xl font-black text-slate-900 whitespace-nowrap">
                            {r.tekst}
                        </span>
                    </div>
                </div>
            ))}
        </motion.div>
    );
}

function ToSider({ beat }: { beat: number }) {
    const kort = [
        {
            fra: 1,
            tittel: 'Kommunen',
            tekst: 'må spare penger. En liten skole koster mer per elev.',
            farge: '#2563eb',
            side: 'left',
        },
        {
            fra: 2,
            tittel: 'Bygda',
            tekst: 'kan miste enda mer. Et steg videre i den onde sirkelen.',
            farge: '#dc2626',
            side: 'right',
        },
    ] as const;
    return (
        <>
            {kort.map((k) =>
                beat >= k.fra ? (
                    <motion.div
                        key={k.tittel}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-[6%] rounded-3xl bg-white/95 px-6 py-4 shadow-2xl"
                        style={{ width: 380, [k.side]: '3%', borderTop: `8px solid ${k.farge}` }}
                    >
                        <div className="text-3xl font-black" style={{ color: k.farge }}>
                            {k.tittel}
                        </div>
                        <div className="text-2xl font-semibold text-slate-700 leading-snug">
                            {k.tekst}
                        </div>
                    </motion.div>
                ) : null
            )}
        </>
    );
}

export function SentraliseringBygda({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'skolen';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekst = MERKER[modus][Math.min(beat, MERKER[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 900, position: [-60, 30, 80] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                {tekst && (
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[6%] inset-x-0 flex justify-center pointer-events-none"
                    >
                        <div className="px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap">
                            {tekst}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {modus === 'skolen' && beat === 1 && <Elevtall beat={beat} />}
            {modus === 'flytting' && beat === 4 && <EldreStolper />}
            {modus === 'sirkel' && <Sirkelen beat={beat} />}
            {modus === 'tilbake' && <ToSider beat={beat} />}
        </div>
    );
}
