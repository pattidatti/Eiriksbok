import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useKamera, v } from './felles3d';

/**
 * Et lite fiskevær i Finnmark, bygd av enkle former. Samme bygd i tre scener:
 * kaia der familien må om bord og bygda begynner å brenne, brent jord (hva en hær
 * vil ødelegge), og hjem til asken der husene reiser seg igjen. Filmen viser aldri
 * mennesker i flammene: folkene står på kaia og er i båten før noe brenner.
 */

type Modus = 'kai' | 'brentjord' | 'hjem';
type Type = 'hus' | 'fjos' | 'skole' | 'kirke';

interface Bygning {
    x: number;
    z: number;
    rot: number;
    b: number;
    d: number;
    h: number;
    type: Type;
    farge: string;
    /** Fargen huset får når det bygges opp igjen. */
    ny: string;
    /** Et av de fire byggene familien ser brenne først. */
    forst?: boolean;
}

const NY_FARGER = ['#e9c46a', '#8ecae6', '#f4a261', '#90be6d', '#f1faee', '#e76f51', '#a8dadc'];

const BYGG: Bygning[] = (() => {
    const ut: Bygning[] = [
        // Familiens hus, fjøset, skolen og kirken
        { x: -4, z: 1, rot: 0.1, b: 4, d: 3.2, h: 2.6, type: 'hus', farge: '#b23a2f', ny: '#e9c46a', forst: true },
        { x: -11, z: -3, rot: -0.15, b: 6.5, d: 4, h: 3.2, type: 'fjos', farge: '#8f2d22', ny: '#9b2c2c', forst: true },
        { x: 6, z: -5, rot: 0.05, b: 8, d: 3.6, h: 3, type: 'skole', farge: '#e8dcc0', ny: '#f1faee', forst: true },
        { x: 13, z: -12, rot: 0, b: 6, d: 3.6, h: 3.6, type: 'kirke', farge: '#f2f0ea', ny: '#ffffff', forst: true },
    ];
    const tomter: [number, number][] = [
        [-16, 2],
        [-8, 5],
        [1, 3],
        [-1, -7],
        [-6, -10],
        [3, -14],
        [-14, -12],
        [10, 2],
        [16, -3],
        [-20, -6],
        [8, -20],
    ];
    const farger = ['#c9b79c', '#7a4b3a', '#d8cfc0', '#a5432f', '#e0d6b9', '#6b7b8c'];
    tomter.forEach(([x, z], i) =>
        ut.push({
            x,
            z,
            rot: (frø(i + 3) - 0.5) * 0.5,
            b: 3.2 + frø(i) * 1.4,
            d: 2.8 + frø(i + 11) * 0.8,
            h: 2.2 + frø(i + 5) * 0.8,
            type: 'hus',
            farge: farger[i % farger.length],
            ny: NY_FARGER[i % NY_FARGER.length],
        })
    );
    return ut;
})();

/** Hvor mye hvert bygg brenner (flamme) og er brent (brent), per modus og beat. */
function brann(modus: Modus, beat: number, b: Bygning): { flamme: number; brent: number } {
    if (modus === 'kai') {
        if (beat === 3) return b.forst ? { flamme: 1, brent: 0.35 } : { flamme: 0, brent: 0 };
        if (beat >= 4) return { flamme: 1, brent: 0.6 };
        return { flamme: 0, brent: 0 };
    }
    if (modus === 'brentjord') {
        return beat >= 3 ? { flamme: 0.15, brent: 1 } : { flamme: 0, brent: 0 };
    }
    // hjem: aske, så husene reiser seg igjen.
    if (beat <= 1) return { flamme: 0, brent: 1 };
    const i = BYGG.indexOf(b);
    const reist = beat === 2 ? i % 2 === 0 : true;
    return { flamme: 0, brent: reist ? 0 : 1 };
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'kai') {
        switch (beat) {
            case 0:
                return { pos: v(30 - t * 0.5, 16 - t * 0.15, 42 - t * 0.3), se: v(0, 2, -3) };
            case 1:
                return { pos: v(-6 + t * 0.1, 3.2, 16.5), se: v(1, 1.4, 10.5) };
            case 2:
                return { pos: v(9, 5, 40), se: v(-1, 2.5, 0) };
            case 3:
                return { pos: v(7 - t * 0.1, 6, 31), se: v(1, 3, -5) };
            default:
                return { pos: v(-30 + t * 0.4, 18, 40), se: v(0, 2, -4) };
        }
    }
    if (modus === 'brentjord') {
        switch (beat) {
            case 0:
                return { pos: v(-30 + t * 0.5, 14, 30), se: v(0, 2, -3) };
            case 1:
                return { pos: v(0, 32, 34), se: v(-1, 0, -3) };
            case 2:
                return { pos: v(-6, 17, 32), se: v(-5, 0, 2) };
            default:
                return { pos: v(22 - t * 0.3, 12, 30), se: v(0, 1, -4) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(24 - t * 0.3, 10, 30), se: v(0, 1, -3) };
        case 1:
            return { pos: v(4 + t * 0.15, 11, 31), se: v(0, 1, 4) };
        case 2:
            return { pos: v(0, 17, 33), se: v(0, 1, -3) };
        case 3:
            return { pos: v(-5 + t * 0.15, 11, 25), se: v(-4, 1.5, 0) };
        default:
            return { pos: v(-30 + t * 0.4, 18, 38), se: v(0, 2, -4) };
    }
}

/** Et trekantet tak som ligger langs husets lengde. */
function useTak(b: number, d: number, hoyde: number) {
    return useMemo(() => {
        const form = new THREE.Shape();
        form.moveTo(-d / 2 - 0.25, 0);
        form.lineTo(d / 2 + 0.25, 0);
        form.lineTo(0, hoyde);
        form.closePath();
        const g = new THREE.ExtrudeGeometry(form, { depth: b + 0.4, bevelEnabled: false });
        g.translate(0, 0, -(b + 0.4) / 2);
        g.rotateY(Math.PI / 2);
        return g;
    }, [b, d, hoyde]);
}

/** Hvor mye hvert bygg brenner akkurat nå. Leses av røyken og ildlyset. */
const NIVAA: number[] = BYGG.map(() => 0);

const SVART = new THREE.Color('#1c1715');
const GLOD = new THREE.Color('#ff7a1a');

function Bygg({
    b,
    modus,
    beat,
    playing,
    indeks,
}: {
    b: Bygning;
    modus: Modus;
    beat: number;
    playing: boolean;
    indeks: number;
}) {
    const kropp = useRef<THREE.Mesh>(null);
    const tak = useRef<THREE.Mesh>(null);
    const taarn = useRef<THREE.Group>(null);
    const flammer = useRef<THREE.Group>(null);
    const tilstand = useRef({ flamme: 0, brent: 0, forste: true, tid: 0 });
    const takGeo = useTak(b.b, b.d, b.type === 'kirke' ? 2.6 : 1.6);
    const opprinnelig = useMemo(() => new THREE.Color(b.farge), [b.farge]);
    const nyFarge = useMemo(() => new THREE.Color(b.ny), [b.ny]);
    const takFarge = useMemo(
        () => new THREE.Color(b.type === 'hus' ? '#3a3a3f' : b.type === 'kirke' ? '#4a5560' : '#4b3a2e'),
        [b.type]
    );
    const gjenreist = modus === 'hjem';

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const s = tilstand.current;
        const mål = brann(modus, beat, b);
        if (s.forste) {
            s.flamme = mål.flamme;
            s.brent = mål.brent;
            s.forste = false;
        }
        s.tid += dt;
        s.flamme = damp(s.flamme, mål.flamme, 1.6, dt);
        // Gjenreisningen går saktere enn brannen, og hvert hus kommer litt etter det forrige.
        const fart = gjenreist && mål.brent < s.brent ? 0.9 : 0.55;
        const vent = gjenreist && mål.brent < 0.5 ? (indeks % 6) * 0.25 : 0;
        if (s.tid > vent || mål.brent > s.brent) s.brent = damp(s.brent, mål.brent, fart, dt);
        if (mål.brent > s.brent) s.tid = 0;
        NIVAA[indeks] = s.flamme;

        // Brente hus synker sammen til en lav, svart tomt.
        const hoyde = 1 - s.brent * 0.88;
        if (kropp.current) {
            kropp.current.scale.y = hoyde;
            kropp.current.position.y = (b.h * hoyde) / 2;
            const m = kropp.current.material as THREE.MeshStandardMaterial;
            m.color.copy(gjenreist ? nyFarge : opprinnelig).lerp(SVART, Math.min(1, s.brent * 1.3));
            m.emissive.copy(GLOD);
            m.emissiveIntensity = s.flamme * (0.45 + 0.15 * Math.sin(s.tid * 9 + indeks));
        }
        if (tak.current) {
            tak.current.visible = s.brent < 0.55;
            tak.current.position.y = b.h * hoyde;
            const m = tak.current.material as THREE.MeshStandardMaterial;
            m.color.copy(takFarge).lerp(SVART, Math.min(1, s.brent * 1.6));
        }
        if (taarn.current) {
            taarn.current.visible = s.brent < 0.55;
        }
        if (flammer.current) {
            const f = s.flamme;
            flammer.current.visible = f > 0.03;
            flammer.current.children.forEach((c, k) => {
                const flakk = 0.8 + 0.25 * Math.sin(s.tid * (7 + k * 3) + indeks * 1.7);
                c.scale.set(f * (0.9 + k * 0.2), f * flakk * (1.2 + k * 0.4), f * (0.9 + k * 0.2));
            });
            flammer.current.position.y = b.h * hoyde + 0.4;
        }
    });

    return (
        <group position={[b.x, 0, b.z]} rotation={[0, b.rot, 0]}>
            <mesh ref={kropp}>
                <boxGeometry args={[b.b, b.h, b.d]} />
                <meshStandardMaterial color={b.farge} flatShading />
            </mesh>
            <mesh ref={tak} geometry={takGeo} position={[0, b.h, 0]}>
                <meshStandardMaterial color={takFarge} flatShading />
            </mesh>
            {/* Pipa blir stående når huset brenner. Det er det som står igjen på tomta. */}
            <mesh position={[b.b * 0.22, (b.h + 1.6) / 2, 0]}>
                <boxGeometry args={[0.5, b.h + 1.6, 0.5]} />
                <meshStandardMaterial color="#5b5550" flatShading />
            </mesh>
            {b.type === 'kirke' && (
                <group ref={taarn} position={[-b.b / 2 - 0.9, 0, 0]}>
                    <mesh position={[0, 3, 0]}>
                        <boxGeometry args={[1.8, 6, 1.8]} />
                        <meshStandardMaterial color={b.farge} flatShading />
                    </mesh>
                    <mesh position={[0, 7.4, 0]}>
                        <coneGeometry args={[1.3, 2.8, 4]} />
                        <meshStandardMaterial color="#4a5560" flatShading />
                    </mesh>
                </group>
            )}
            <group ref={flammer} visible={false}>
                {[-0.25, 0.15, 0.3].map((x, k) => (
                    <mesh key={k} position={[x * b.b, 0.6, (k - 1) * 0.5]}>
                        <coneGeometry args={[0.9, 2.4, 6]} />
                        <meshBasicMaterial
                            color={k === 1 ? '#ffd166' : '#ff6b1a'}
                            transparent
                            opacity={0.88}
                        />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

const ROYK = 120;
/** Røykpartiklene lever utenfor React, de flyttes hvert bilde. */
const ROYK_DELER = Array.from({ length: ROYK }, (_, i) => ({
    bygg: i % BYGG.length,
    alder: frø(i + 50) * 7,
    dx: (frø(i + 80) - 0.5) * 1.6,
}));

/** Røyk fra byggene som brenner. Hver partikkel hører til ett bygg. */
function Royk({ playing }: { playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const deler = ROYK_DELER;
    const tmp = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        for (let i = 0; i < deler.length; i++) {
            const p = deler[i];
            p.alder += dt;
            if (p.alder > 7) p.alder -= 7;
            const b = BYGG[p.bygg];
            const n = NIVAA[p.bygg] ?? 0;
            const s = n < 0.05 ? 0 : (0.7 + p.alder * 0.45) * Math.min(1, n * 1.4);
            tmp.position.set(
                b.x + p.dx + p.alder * 1.1,
                b.h + 1.5 + p.alder * 1.9,
                b.z - p.alder * 0.5
            );
            tmp.scale.setScalar(s);
            tmp.updateMatrix();
            m.setMatrixAt(i, tmp.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, ROYK]} frustumCulled={false}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
                color="#4a4746"
                emissive="#2a1d16"
                transparent
                opacity={0.5}
                flatShading
                depthWrite={false}
            />
        </instancedMesh>
    );
}

/** Båten som tar familien bort. Folkene står på kaia, og er i båten fra beat 2. */
function Baaten({ beat, modus, playing }: { beat: number; modus: Modus; playing: boolean }) {
    const baat = useRef<THREE.Group>(null);
    const folkKai = useRef<THREE.Group>(null);
    const folkBaat = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const ute = modus === 'kai' && beat >= 2;
    const vis = modus === 'kai';
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const g = baat.current;
        if (!g) return;
        g.visible = vis;
        const mål = ute ? v(6, 0, 27) : v(3.2, 0, 12);
        if (forste.current) {
            g.position.copy(mål);
            forste.current = false;
        }
        const k = 1 - Math.exp(-0.45 * dt);
        g.position.lerp(mål, k);
        g.rotation.y = damp(g.rotation.y, ute ? 0.35 : 0, 0.5, dt);
        if (folkKai.current) folkKai.current.visible = vis && !ute;
        if (folkBaat.current) folkBaat.current.visible = ute;
    });
    const folk = (n: number) =>
        Array.from({ length: n }, (_, i) => (
            <group key={i} position={[(i - (n - 1) / 2) * 0.7, 0, 0]}>
                <mesh position={[0, 0.55, 0]}>
                    <capsuleGeometry args={[0.2, 0.55, 3, 8]} />
                    <meshStandardMaterial color={['#3b3f4a', '#5a3d2e', '#2f3b52', '#6b4e3d'][i % 4]} />
                </mesh>
                <mesh position={[0, 1.15, 0]}>
                    <sphereGeometry args={[i === 3 ? 0.13 : 0.16, 10, 8]} />
                    <meshStandardMaterial color="#e2c4a8" />
                </mesh>
            </group>
        ));
    return (
        <>
            {/* Familien og sekkene på kaia */}
            <group ref={folkKai} position={[0, 1.1, 11]}>
                {folk(4)}
                <mesh position={[1.7, 0.3, 0.3]}>
                    <boxGeometry args={[0.6, 0.6, 0.5]} />
                    <meshStandardMaterial color="#a68a64" />
                </mesh>
                <mesh position={[-1.8, 0.25, 0.2]}>
                    <boxGeometry args={[0.9, 0.5, 0.7]} />
                    <meshStandardMaterial color="#d9d2c3" />
                </mesh>
            </group>
            <group ref={baat}>
                <mesh position={[0, 0.5, 0]}>
                    <boxGeometry args={[2.6, 1.2, 7]} />
                    <meshStandardMaterial color="#2f3e46" flatShading />
                </mesh>
                <mesh position={[0, 0.5, 4]} rotation={[0, Math.PI / 4, 0]}>
                    <boxGeometry args={[1.84, 1.2, 1.84]} />
                    <meshStandardMaterial color="#2f3e46" flatShading />
                </mesh>
                <mesh position={[0, 1.5, -2]}>
                    <boxGeometry args={[1.8, 1.2, 2]} />
                    <meshStandardMaterial
                        color="#e5e1d8"
                        emissive="#ffcf7a"
                        emissiveIntensity={0.25}
                        flatShading
                    />
                </mesh>
                <mesh position={[0, 3, 1]}>
                    <cylinderGeometry args={[0.08, 0.08, 4.2, 6]} />
                    <meshStandardMaterial color="#3a2f28" />
                </mesh>
                <group ref={folkBaat} position={[0, 1.1, 1.6]} visible={false}>
                    {folk(4)}
                </group>
            </group>
        </>
    );
}

/** Ringer som viser hva en hær på retrett vil ødelegge: mat, husly, veier og båter. */
const MAAL: { x: number; z: number; r: number; navn: string }[] = [
    { x: -11, z: -3, r: 5.2, navn: 'Mat' },
    { x: -4, z: 1, r: 3.4, navn: 'Husly' },
    { x: -16, z: 6.5, r: 3, navn: 'Veier' },
    { x: 6, z: 13, r: 4, navn: 'Båter' },
];

function Ringer({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        g.visible = synlig;
        g.children.forEach((c, i) => {
            const s = 1 + 0.08 * Math.sin(tid.current * 3 + i);
            c.scale.set(s, s, s);
        });
    });
    return (
        <group ref={ref} visible={false}>
            {MAAL.map((m) => (
                <mesh key={m.navn} position={[m.x, 0.15, m.z]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[m.r - 0.45, m.r, 40]} />
                    <meshBasicMaterial color="#facc15" />
                </mesh>
            ))}
        </group>
    );
}

/** Midlertidige brakker som husly før gjenreisningen. */
function Brakker({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const s = damp(g.scale.y, synlig ? 1 : 0.001, 1.5, dt);
        g.scale.set(1, s, 1);
        g.visible = s > 0.02;
    });
    return (
        <group ref={ref} scale={[1, 0.001, 1]}>
            {[
                [-9, 7.4],
                [-3, 6.8],
                [3, 6.4],
                [9, 6.8],
            ].map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    <mesh position={[0, 0.9, 0]}>
                        <boxGeometry args={[4.4, 1.8, 2.2]} />
                        <meshStandardMaterial color="#7c8a86" flatShading />
                    </mesh>
                    <mesh position={[0, 2, 0]}>
                        <boxGeometry args={[4.7, 0.3, 2.6]} />
                        <meshStandardMaterial color="#3d4543" />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

function Landskap() {
    const fjell = useMemo(
        () =>
            Array.from({ length: 9 }, (_, i) => ({
                x: -70 + i * 17 + frø(i) * 6,
                z: -48 - frø(i + 4) * 14,
                r: 14 + frø(i + 9) * 8,
                h: 14 + frø(i + 2) * 10,
            })),
        []
    );
    return (
        <>
            {/* Snødekt land og fjorden */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -40]}>
                <planeGeometry args={[220, 100]} />
                <meshStandardMaterial color="#e3e9f0" emissive="#5d6b80" emissiveIntensity={0.25} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 60]}>
                <planeGeometry args={[220, 100]} />
                <meshStandardMaterial color="#2c5677" emissive="#1d3c5c" emissiveIntensity={0.6} />
            </mesh>
            {/* Bekken og brua */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-16, 0.02, -15]}>
                <planeGeometry args={[2, 50]} />
                <meshStandardMaterial color="#2c5677" emissive="#1d3c5c" emissiveIntensity={0.6} />
            </mesh>
            {/* Veien langs fjorden */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 6.5]}>
                <planeGeometry args={[60, 1.6]} />
                <meshStandardMaterial color="#8d8a84" />
            </mesh>
            <mesh position={[-16, 0.35, 6.5]}>
                <boxGeometry args={[3.4, 0.3, 2]} />
                <meshStandardMaterial color="#6b4f3a" flatShading />
            </mesh>
            {/* Kaia */}
            <mesh position={[0, 0.5, 11]}>
                <boxGeometry args={[3.6, 0.4, 7]} />
                <meshStandardMaterial color="#6b4f3a" flatShading />
            </mesh>
            {/* Små fiskebåter ved land */}
            {[
                [7, 12],
                [9.5, 11],
                [5, 14.5],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.2, z]} rotation={[0, 0.3 * i, 0]}>
                    <boxGeometry args={[1.2, 0.6, 3.2]} />
                    <meshStandardMaterial color={['#f1f1f1', '#3d6b8c', '#a83a32'][i]} flatShading />
                </mesh>
            ))}
            {fjell.map((f, i) => (
                <group key={i} position={[f.x, 0, f.z]}>
                    <mesh position={[0, f.h / 2, 0]}>
                        <coneGeometry args={[f.r, f.h, 7]} />
                        <meshStandardMaterial
                            color="#cfd8e3"
                            emissive="#5a6b84"
                            emissiveIntensity={0.3}
                            flatShading
                        />
                    </mesh>
                </group>
            ))}
        </>
    );
}

const HIMMEL: Record<Modus, string[]> = {
    kai: ['#33476a', '#33476a', '#33476a', '#3b3550', '#4a3346'],
    brentjord: ['#6f7f99', '#6f7f99', '#6f7f99', '#5c5a66'],
    hjem: ['#8796a8', '#8f9db0', '#a9bfd6', '#b4cbe2', '#bcd6ee'],
};

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera((b, t) => kameraFor(modus, b, t), beat, playing);
    const bakgrunn = useRef<THREE.Color>(null);
    const taake = useRef<THREE.Fog>(null);
    const ambient = useRef<THREE.AmbientLight>(null);
    const ild = useRef<THREE.PointLight>(null);
    const forste = useRef(true);
    const maalFarge = useMemo(() => new THREE.Color(), []);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const liste = HIMMEL[modus];
        maalFarge.set(liste[Math.min(beat, liste.length - 1)]);
        const k = forste.current ? 1 : 1 - Math.exp(-0.8 * dt);
        forste.current = false;
        bakgrunn.current?.lerp(maalFarge, k);
        taake.current?.color.lerp(maalFarge, k);
        const snitt = NIVAA.reduce((a, b) => a + b, 0) / NIVAA.length;
        if (ild.current) ild.current.intensity = snitt * 110;
        if (ambient.current)
            ambient.current.intensity = damp(
                ambient.current.intensity,
                modus === 'kai' ? 0.75 : modus === 'hjem' && beat >= 2 ? 1.1 : 0.9,
                1,
                dt
            );
    });

    return (
        <>
            <color ref={bakgrunn} attach="background" args={[HIMMEL[modus][0]]} />
            <fog ref={taake} attach="fog" args={[HIMMEL[modus][0], 60, 170]} />
            <ambientLight ref={ambient} intensity={0.8} />
            <hemisphereLight args={['#c9d6ea', '#3c4655', 0.7]} />
            <directionalLight position={[-30, 40, 30]} intensity={modus === 'kai' ? 0.7 : 1.1} color="#dfe8f5" />
            <pointLight ref={ild} position={[0, 7, -4]} color="#ff8a3d" intensity={0} distance={70} decay={1} />
            <Landskap />
            {BYGG.map((b, i) => (
                <Bygg
                    key={i}
                    b={b}
                    indeks={i}
                    modus={modus}
                    beat={beat}
                    playing={playing}
                />
            ))}
            <Royk playing={playing} />
            <Baaten beat={beat} modus={modus} playing={playing} />
            <Ringer synlig={modus === 'brentjord' && beat === 2} playing={playing} />
            <Brakker synlig={modus === 'hjem' && (beat === 1 || beat === 2)} playing={playing} />
        </>
    );
}

const LAPPER: Record<Modus, string[]> = {
    kai: [
        'Et fiskevær i Finnmark, november 1944',
        'Alle må om bord',
        'Båten legger fra land',
        'Huset, fjøset, skolen, kirken',
        'Hele bygda brenner',
    ],
    brentjord: [
        'Brent jord',
        'Ødelegg alt fienden kan bruke',
        'Mat, husly, veier, båter',
        'Ingenting igjen til fienden',
    ],
    hjem: [
        'Mai 1945: hjem til ingenting',
        'Først: husly',
        'Våren 1947: gjenreisningen starter',
        'Tilbake til samme plass',
        'Gjenreist på åtte til ni år',
    ],
};

export function FinnmarkBygda({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'kai';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = LAPPER[modus];
    const lapp = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 400, position: [30, 16, 42] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={lapp}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[7%] left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-white/90 text-slate-900 font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                >
                    {lapp}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {modus === 'brentjord' && beat === 2 && (
                    <motion.div
                        key="maal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-[6%] left-1/2 -translate-x-1/2 flex gap-3"
                    >
                        {MAAL.map((m, i) => (
                            <motion.span
                                key={m.navn}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.5 }}
                                className="px-5 py-2 rounded-xl bg-yellow-300 text-slate-900 font-black text-xl md:text-3xl shadow-xl"
                            >
                                {m.navn}
                            </motion.span>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
