import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useBeatTid, useKamera, v } from './felles';

/**
 * Fjorden i 3D: bratte fjell, en foss, en gård på ei fjellhylle og vannet nedenfor.
 * «fjord»: naturen går fra hinder til symbol, og maleren kommer. «bonde»: gården og
 * glansbildet. «brudeferd»: båtene med brudefølget på fjorden. «sprekker»: grått vær og
 * et utvandrerskip på vei ut fjorden.
 */

type Modus = 'fjord' | 'bonde' | 'brudeferd' | 'sprekker';

/** Gården ligger på ei hylle i fjellsida til venstre. */
const GARD = v(-15, 6, -6);
const FOSS_X = 13.5;
const FOSS_Z = -34;

/** Båtene med brudefølget glir innover fjorden. Samme funksjon styrer kameraet. */
function batZ(beat: number, t: number) {
    return [16, 10, 4, 0][Math.min(beat, 3)] - Math.min(t, 30) * 0.35;
}
/** Utvandrerskipet seiler ut fjorden, mot kameraet. */
function skipZ(beat: number, t: number) {
    return [-90, -60, -35, -20][Math.min(beat, 3)] + Math.min(t, 30) * 0.7;
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'fjord') {
        switch (beat) {
            case 0:
                return { pos: v(0, 12 + t * 0.1, 70 - t * 0.4), se: v(0, 12, -60) };
            case 1:
                return { pos: v(-6, 7, -2), se: v(FOSS_X, 14, FOSS_Z) };
            case 2:
                return { pos: v(4, 18, 30), se: v(13, 13, 10) };
            default:
                return { pos: v(-4, 34 + t * 0.2, 46), se: v(0, 32, -90) };
        }
    }
    if (modus === 'bonde') {
        switch (beat) {
            case 0:
                return { pos: v(4, 14, 26), se: v(GARD.x, GARD.y + 2, GARD.z) };
            case 1:
                return { pos: v(-4, 10, 8), se: v(GARD.x + 1, GARD.y + 1.5, GARD.z) };
            case 2:
                return { pos: v(-1, 11, 12), se: v(GARD.x - 1, GARD.y + 2, GARD.z) };
            case 3:
                return { pos: v(14, 22, 44), se: v(-6, 8, -20) };
            default:
                return { pos: v(2 - t * 0.05, 12, 18), se: v(GARD.x, GARD.y + 2, GARD.z) };
        }
    }
    if (modus === 'brudeferd') {
        const z = batZ(beat, t);
        switch (beat) {
            case 0:
                return { pos: v(0, 26, 80), se: v(0, 18, -80) };
            case 1:
                return { pos: v(9, 4, z + 13), se: v(0, 1.5, z + 3) };
            case 2:
                return { pos: v(7, 6, z - 10), se: v(-1, 1.2, z + 8) };
            default:
                return { pos: v(6, 16, z + 40), se: v(0, 6, z - 30) };
        }
    }
    const z = skipZ(beat, t);
    switch (beat) {
        case 0:
            return { pos: v(0, 12, 60), se: v(0, 10, -60) };
        case 1:
            return { pos: v(10, 7, z + 30), se: v(0, 5, z) };
        case 2:
            return { pos: v(-2, 30, z + 70), se: v(0, 8, z - 20) };
        default:
            return { pos: v(4, 13, 24), se: v(GARD.x, GARD.y + 2, GARD.z) };
    }
}

/** Lyset i hver beat: 0 = grått og kaldt, 1 = sol, 2 = gyllent glansbilde. */
function lysFor(modus: Modus, beat: number) {
    if (modus === 'fjord') return beat <= 1 ? 0 : 1;
    if (modus === 'bonde') return beat === 4 ? 2 : beat === 5 ? 0 : 1;
    if (modus === 'brudeferd') return 1;
    return 0;
}

const HIMMEL = [new THREE.Color('#9aa6b2'), new THREE.Color('#bcd8ec'), new THREE.Color('#f3d9a4')];

const mat = {
    fjell: new THREE.MeshStandardMaterial({
        color: '#6f7768',
        emissive: '#1e231d',
        roughness: 1,
        flatShading: true,
    }),
    fjellMork: new THREE.MeshStandardMaterial({
        color: '#5a6158',
        emissive: '#191c18',
        roughness: 1,
        flatShading: true,
    }),
    sno: new THREE.MeshStandardMaterial({
        color: '#f5f7fa',
        emissive: '#8a96a6',
        emissiveIntensity: 0.35,
        flatShading: true,
    }),
    gress: new THREE.MeshStandardMaterial({
        color: '#6f8f43',
        emissive: '#1f2a10',
        roughness: 1,
        flatShading: true,
    }),
    vegg: new THREE.MeshStandardMaterial({ color: '#8b3a2b', roughness: 0.9, flatShading: true }),
    stabbur: new THREE.MeshStandardMaterial({
        color: '#7a5230',
        roughness: 0.9,
        flatShading: true,
    }),
    torv: new THREE.MeshStandardMaterial({ color: '#4f6a2e', roughness: 1, flatShading: true }),
    tre: new THREE.MeshStandardMaterial({ color: '#6b4a2b', roughness: 0.9 }),
    foss: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: '#dbe9f5',
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.85,
    }),
    skum: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: '#cfe0ee',
        emissiveIntensity: 0.5,
    }),
    hud: new THREE.MeshStandardMaterial({ color: '#e7c3a0', roughness: 0.8 }),
    klaer: new THREE.MeshStandardMaterial({ color: '#1f2a44', roughness: 0.9 }),
    bunad: new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.9 }),
    hvit: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.9 }),
    krone: new THREE.MeshStandardMaterial({
        color: '#facc15',
        emissive: '#a16207',
        emissiveIntensity: 0.6,
    }),
    bat: new THREE.MeshStandardMaterial({ color: '#5b3a1e', roughness: 0.9, flatShading: true }),
    skrog: new THREE.MeshStandardMaterial({ color: '#2b2522', roughness: 0.9, flatShading: true }),
    seil: new THREE.MeshStandardMaterial({
        color: '#e9e4d8',
        emissive: '#55524a',
        emissiveIntensity: 0.3,
        side: THREE.DoubleSide,
    }),
    lerret: new THREE.MeshStandardMaterial({
        color: '#fdf6e3',
        emissive: '#6b6250',
        emissiveIntensity: 0.3,
    }),
    sol: new THREE.MeshBasicMaterial({ color: '#fff3c4', transparent: true }),
    royk: new THREE.MeshStandardMaterial({
        color: '#5b6068',
        transparent: true,
        opacity: 0.8,
        roughness: 1,
    }),
};

/** Fjellene langs fjorden, med snø på toppene. */
const FJELL = (() => {
    const ut: { x: number; z: number; r: number; h: number; mork: boolean }[] = [];
    for (let i = 0; i < 9; i++) {
        const z = 50 - i * 32;
        ut.push({
            x: -31 - frø(i) * 8,
            z,
            r: 24 + frø(i + 10) * 6,
            h: 42 + frø(i + 20) * 26,
            mork: i % 2 === 0,
        });
        ut.push({
            x: 31 + frø(i + 30) * 8,
            z: z - 14,
            r: 24 + frø(i + 40) * 6,
            h: 42 + frø(i + 50) * 26,
            mork: i % 2 === 1,
        });
    }
    // Fjellene i enden av fjorden
    ut.push({ x: -10, z: -270, r: 40, h: 80, mork: false });
    ut.push({ x: 26, z: -280, r: 38, h: 70, mork: true });
    return ut;
})();

function Fjell() {
    return (
        <>
            {FJELL.map((f, i) => (
                <group key={i} position={[f.x, 0, f.z]}>
                    <mesh
                        material={f.mork ? mat.fjellMork : mat.fjell}
                        position={[0, f.h / 2 - 1, 0]}
                    >
                        <coneGeometry args={[f.r, f.h, 7, 1]} />
                    </mesh>
                    <mesh material={mat.sno} position={[0, f.h - 1 - f.h * 0.14, 0]}>
                        <coneGeometry args={[f.r * 0.28 + 0.4, f.h * 0.28, 7, 1]} />
                    </mesh>
                </group>
            ))}
        </>
    );
}

/** Fossen: en bratt fjellvegg med hvite striper som flimrer, og skum nederst. */
function Foss({ playing }: { playing: boolean }) {
    const striper = useRef<(THREE.Mesh | null)[]>([]);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        striper.current.forEach((m, i) => {
            if (!m) return;
            m.scale.x = 0.8 + Math.sin(tid.current * 6 + i * 1.7) * 0.25;
        });
    });
    return (
        <group position={[FOSS_X, 0, FOSS_Z]}>
            <mesh material={mat.fjellMork} position={[4, 15, 0]}>
                <boxGeometry args={[6, 30, 14]} />
            </mesh>
            {[-1.6, -0.5, 0.6, 1.6].map((dz, i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        striper.current[i] = m;
                    }}
                    material={mat.foss}
                    position={[0.9, 14.5, dz]}
                    rotation={[0, -Math.PI / 2, 0]}
                >
                    <planeGeometry args={[1.1, 29]} />
                </mesh>
            ))}
            {[0, 1, 2, 3, 4].map((i) => (
                <mesh
                    key={i}
                    material={mat.skum}
                    position={[-0.5 - frø(i) * 1.5, 0.4, (i - 2) * 1.1]}
                >
                    <icosahedronGeometry args={[0.9 + frø(i + 5) * 0.5, 0]} />
                </mesh>
            ))}
        </group>
    );
}

function Person({
    klaer = mat.klaer,
    krone = false,
    skala = 1,
}: {
    klaer?: THREE.Material;
    krone?: boolean;
    skala?: number;
}) {
    return (
        <group scale={skala}>
            <mesh material={klaer} position={[0, 0.55, 0]}>
                <cylinderGeometry args={[0.22, 0.32, 1.1, 8]} />
            </mesh>
            <mesh material={mat.hud} position={[0, 1.3, 0]}>
                <sphereGeometry args={[0.22, 10, 8]} />
            </mesh>
            {krone && (
                <mesh material={mat.krone} position={[0, 1.58, 0]}>
                    <cylinderGeometry args={[0.2, 0.16, 0.22, 8]} />
                </mesh>
            )}
        </group>
    );
}

/** Gården på fjellhylla: våningshus, stabbur på stolper og bonden. */
function Gard({ fremhevBonde }: { fremhevBonde: boolean }) {
    const ring = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => {
        const m = ring.current;
        if (!m) return;
        const s = damp(m.scale.x, fremhevBonde ? 1 : 0.001, 4, Math.min(dt, 0.05));
        m.scale.set(s, s, 1);
    });
    return (
        <group position={GARD.toArray()}>
            {/* Hylla */}
            <mesh material={mat.gress} position={[0, -0.6, 0]}>
                <boxGeometry args={[16, 1.2, 12]} />
            </mesh>
            <mesh material={mat.fjell} position={[-2, -6, -1]}>
                <boxGeometry args={[15, 10, 11]} />
            </mesh>
            {/* Våningshuset */}
            <group position={[-4, 0, -2.5]}>
                <mesh material={mat.vegg} position={[0, 1.5, 0]}>
                    <boxGeometry args={[5, 3, 3.2]} />
                </mesh>
                <mesh
                    material={mat.torv}
                    position={[0, 3.6, 0]}
                    rotation={[0, 0, 0]}
                    scale={[1, 1, 0.66]}
                >
                    <cylinderGeometry args={[0.01, 3.2, 1.6, 4, 1]} />
                </mesh>
            </group>
            {/* Stabburet på stolper */}
            <group position={[2.5, 0, -3]}>
                {[
                    [-0.9, -0.9],
                    [0.9, -0.9],
                    [-0.9, 0.9],
                    [0.9, 0.9],
                ].map(([x, z], i) => (
                    <mesh key={i} material={mat.tre} position={[x, 0.5, z]}>
                        <cylinderGeometry args={[0.15, 0.15, 1, 6]} />
                    </mesh>
                ))}
                <mesh material={mat.stabbur} position={[0, 1.9, 0]}>
                    <boxGeometry args={[2.6, 1.8, 2.6]} />
                </mesh>
                <mesh material={mat.stabbur} position={[0, 3.1, 0]}>
                    <boxGeometry args={[3.2, 0.6, 3.2]} />
                </mesh>
                <mesh material={mat.torv} position={[0, 4.0, 0]} rotation={[0, Math.PI / 4, 0]}>
                    <coneGeometry args={[2.5, 1.3, 4, 1]} />
                </mesh>
            </group>
            {/* Bonden */}
            <group position={[0.5, 0, 2]}>
                <Person klaer={mat.klaer} skala={1.3} />
                <mesh
                    ref={ring}
                    material={mat.krone}
                    position={[0, 0.05, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    scale={[0.001, 0.001, 1]}
                >
                    <ringGeometry args={[0.9, 1.15, 32]} />
                </mesh>
            </group>
        </group>
    );
}

/** Maleren med staffeli på en fjellknaus. */
function Maler() {
    return (
        <group position={[14, 9.2, 8]} rotation={[0, -2.3, 0]}>
            <mesh material={mat.fjell} position={[0, -2, 0]}>
                <dodecahedronGeometry args={[3, 0]} />
            </mesh>
            <group position={[0, 0.6, 0]}>
                <Person klaer={mat.klaer} skala={1.2} />
            </group>
            <group position={[0.4, 0.6, 1.4]}>
                {[-0.4, 0.4].map((x, i) => (
                    <mesh key={i} material={mat.tre} position={[x, 0.9, 0]} rotation={[0.15, 0, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 1.9, 5]} />
                    </mesh>
                ))}
                <mesh material={mat.lerret} position={[0, 1.4, 0.08]} rotation={[0.15, Math.PI, 0]}>
                    <planeGeometry args={[1.3, 1]} />
                </mesh>
            </group>
        </group>
    );
}

const ROERE = [mat.bunad, mat.klaer, mat.hvit];

/** Brudefølget: fire robåter etter hverandre, bruden med krone i den første. */
function Bater({ beat, playing }: { beat: number; playing: boolean }) {
    const t = useBeatTid(beat, playing);
    const ref = useRef<THREE.Group>(null);
    const bolge = useRef(0);
    useFrame((_, rawDt) => {
        bolge.current += playing ? Math.min(rawDt, 0.05) : 0;
        const g = ref.current;
        if (!g) return;
        g.position.z = batZ(beat, t.current);
        g.children.forEach((c, i) => {
            c.position.y = Math.sin(bolge.current * 1.4 + i) * 0.08;
        });
    });
    return (
        <group ref={ref}>
            {[0, 1, 2, 3].map((i) => (
                <group key={i} position={[(i % 2 ? 1.4 : -1.2) * (i > 0 ? 1 : 0), 0, i * 7]}>
                    <mesh material={mat.bat} position={[0, 0.25, 0]} scale={[1, 0.5, 1]}>
                        <boxGeometry args={[1.8, 1, 5]} />
                    </mesh>
                    {[-1.4, 0, 1.4].map((dz, j) => (
                        <group key={j} position={[0, 0.5, dz]}>
                            <Person
                                klaer={i === 0 && j === 0 ? mat.bunad : ROERE[(i + j) % 3]}
                                krone={i === 0 && j === 0}
                                skala={0.85}
                            />
                        </group>
                    ))}
                </group>
            ))}
        </group>
    );
}

/** Utvandrerskipet: skrog, tre master og seil. */
function Skip({ beat, playing }: { beat: number; playing: boolean }) {
    const t = useBeatTid(beat, playing);
    const ref = useRef<THREE.Group>(null);
    useFrame(() => {
        if (ref.current) ref.current.position.z = skipZ(beat, t.current);
    });
    return (
        <group ref={ref} position={[2, 0, -60]}>
            <mesh material={mat.skrog} position={[0, 1, 0]}>
                <boxGeometry args={[4, 2.2, 16]} />
            </mesh>
            <mesh material={mat.skrog} position={[0, 1, 9]} rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[2.8, 2.2, 2.8]} />
            </mesh>
            {[-5, 0, 5].map((z, i) => (
                <group key={i} position={[0, 0, z]}>
                    <mesh material={mat.tre} position={[0, 7, 0]}>
                        <cylinderGeometry args={[0.15, 0.2, 12, 6]} />
                    </mesh>
                    <mesh
                        material={mat.seil}
                        position={[0, 7.5, 0.1]}
                        rotation={[0, Math.PI / 2, 0]}
                    >
                        <planeGeometry args={[4.2 - i * 0.3, 7]} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/** Fabrikkpiper med røyk innerst i fjorden: industribyene som vokser. */
function Fabrikker() {
    return (
        <group position={[-6, 0, -150]}>
            {[0, 1, 2].map((i) => (
                <group key={i} position={[i * 7, 0, i * -4]}>
                    <mesh material={mat.skrog} position={[0, 3, 0]}>
                        <boxGeometry args={[6, 6, 5]} />
                    </mesh>
                    <mesh material={mat.vegg} position={[1.5, 10, 0]}>
                        <cylinderGeometry args={[0.7, 0.9, 10, 8]} />
                    </mesh>
                    {[0, 1, 2].map((j) => (
                        <mesh key={j} material={mat.royk} position={[1.5 - j * 2, 16 + j * 3, 0]}>
                            <icosahedronGeometry args={[1.6 + j * 0.8, 1]} />
                        </mesh>
                    ))}
                </group>
            ))}
        </group>
    );
}

/** Himmel, tåke og lys som glir mellom grått, sol og gyllent. */
function Lys({ nivaa }: { nivaa: number }) {
    const himmel = useRef<THREE.Color>(null);
    const fog = useRef<THREE.Fog>(null);
    const sol = useRef<THREE.DirectionalLight>(null);
    const amb = useRef<THREE.AmbientLight>(null);
    const solkule = useRef<THREE.Mesh>(null);
    const k = useRef(nivaa);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        k.current = forste.current ? nivaa : damp(k.current, nivaa, 1.5, dt);
        forste.current = false;
        const x = k.current;
        const farge =
            x <= 1
                ? HIMMEL[0].clone().lerp(HIMMEL[1], x)
                : HIMMEL[1].clone().lerp(HIMMEL[2], x - 1);
        himmel.current?.copy(farge);
        fog.current?.color.copy(farge);
        if (fog.current) fog.current.far = 260 + Math.min(x, 1) * 160;
        if (sol.current) {
            sol.current.intensity = 0.5 + Math.min(x, 1) * 1.1 + Math.max(0, x - 1) * 0.4;
            sol.current.color.set(x > 1 ? '#ffe2a8' : '#fff6e6');
        }
        if (amb.current) amb.current.intensity = 0.75 + Math.min(x, 1) * 0.15;
        const s = solkule.current;
        if (s) {
            s.visible = x > 0.3;
            (s.material as THREE.MeshBasicMaterial).opacity = Math.min(1, x);
        }
    });
    return (
        <>
            <color ref={himmel} attach="background" args={['#bcd8ec']} />
            <fog ref={fog} attach="fog" args={['#bcd8ec', 60, 420]} />
            <ambientLight ref={amb} intensity={0.85} color="#eef2f6" />
            <directionalLight ref={sol} position={[40, 80, 60]} intensity={1.4} />
            <hemisphereLight args={['#e6eef6', '#3c4a36', 0.5]} />
            <mesh ref={solkule} material={mat.sol} position={[60, 120, -330]}>
                <sphereGeometry args={[14, 16, 12]} />
            </mesh>
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera((b, t) => kameraFor(modus, b, t), beat, playing);
    return (
        <>
            <Lys nivaa={lysFor(modus, beat)} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -100]}>
                <planeGeometry args={[200, 500]} />
                <meshStandardMaterial
                    color="#3f6f8f"
                    emissive="#1d3a4f"
                    emissiveIntensity={0.6}
                    roughness={0.35}
                    metalness={0.1}
                />
            </mesh>
            <Fjell />
            <Foss playing={playing} />
            <Gard fremhevBonde={modus === 'bonde' && beat >= 1 && beat <= 2} />
            {modus === 'fjord' && beat >= 2 && <Maler />}
            {modus === 'brudeferd' && <Bater beat={beat} playing={playing} />}
            {modus === 'sprekker' && beat <= 2 && <Skip beat={beat} playing={playing} />}
            {modus === 'sprekker' && beat >= 1 && <Fabrikker />}
        </>
    );
}

const MERKER: Record<Modus, (string | null)[]> = {
    fjord: [
        'Fjell, fjord og foss',
        'Før: et hinder, en ødemark',
        'Kunstnerne drar til fjells',
        'Hardfør, stolt, urokkelig',
    ],
    bonde: [
        'Gården på fjellhylla',
        'Bonden: bærer av det ekte norske',
        'Det bygdene hadde',
        'En forbindelse til sagatiden',
        'Glansbildet',
        'Det som ble visket bort',
    ],
    brudeferd: [
        'Gude: landskapet',
        'Tidemand: menneskene',
        'Brudeferd: reisen til bryllupet',
        'Menneske og natur i harmoni',
    ],
    sprekker: [
        'Norge forandrer seg',
        'Industribyer og nød: til Amerika',
        'Glansbildet slår sprekker',
        'Neste tid: realismen',
    ],
};

const BYGDA = ['Eventyr', 'Folkeviser', 'Håndverk', 'Bunader'];
const GLANS = ['Søndagsklær', 'Flotte stabbur', 'Evig solskinn'];
const BORTE = ['Fattigdom', 'Sult', 'Slit', 'Sykdom', 'Overtro'];

/** Sprekker over hele bildet, tegnet opp én etter én. */
function Sprekker() {
    const linjer = [
        'M 800 0 L 760 120 L 820 220 L 740 360 L 790 470 L 720 562',
        'M 760 120 L 610 160 L 540 260',
        'M 740 360 L 880 400 L 1000 380',
        'M 820 220 L 960 180',
    ];
    return (
        <svg
            viewBox="0 0 1000 562"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
        >
            {linjer.map((d, i) => (
                <motion.path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="#f8fafc"
                    strokeWidth={3}
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, delay: 0.3 + i * 0.4 }}
                />
            ))}
        </svg>
    );
}

export function NasjonalromantikkenFjord({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'fjord';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekst = MERKER[modus][Math.min(beat, MERKER[modus].length - 1)];
    const glans = (modus === 'bonde' && beat === 4) || (modus === 'sprekker' && beat === 0);
    const borte = modus === 'bonde' && beat === 5;
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 900, position: [0, 12, 70] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>

            {/* Gullramme rundt bildet: glansbildet */}
            <AnimatePresence>
                {glans && (
                    <motion.div
                        key="ramme"
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: modus === 'sprekker' ? 0.6 : 1,
                            rotate: modus === 'sprekker' ? 2 : 0,
                        }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-[3%] rounded-md pointer-events-none"
                        style={{
                            border: '18px solid #c8a24a',
                            boxShadow: 'inset 0 0 0 4px #7a5a1a, 0 0 0 4px #7a5a1a',
                        }}
                    />
                )}
            </AnimatePresence>
            {modus === 'sprekker' && beat >= 2 && <Sprekker />}

            <AnimatePresence mode="wait">
                {tekst && (
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[7%] inset-x-0 flex justify-center pointer-events-none"
                    >
                        <div className="px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap">
                            {tekst}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Lapper nederst: det bygdene hadde, glansbildet, og det som ble visket bort */}
            <AnimatePresence mode="wait">
                {modus === 'bonde' && (beat === 2 || glans || borte) && (
                    <motion.div
                        key={beat}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-[9%] inset-x-0 flex justify-center gap-3 pointer-events-none"
                    >
                        {(beat === 2 ? BYGDA : glans ? GLANS : BORTE).map((o, i) => (
                            <motion.div
                                key={o}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: borte ? 0.85 : 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.45 }}
                                className={
                                    borte
                                        ? 'px-4 py-2 rounded-xl bg-slate-700/85 text-slate-100 font-bold text-2xl shadow-lg'
                                        : glans
                                          ? 'px-4 py-2 rounded-xl bg-amber-100/95 text-amber-900 font-bold text-2xl shadow-lg'
                                          : 'px-4 py-2 rounded-xl bg-white/95 text-slate-900 font-bold text-2xl shadow-lg'
                                }
                            >
                                {o}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
