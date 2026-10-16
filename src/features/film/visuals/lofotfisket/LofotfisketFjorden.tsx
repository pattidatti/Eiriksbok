import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Lofoten i 3D, vinter. To steder:
 * - Trollfjorden: en trang fjord mellom bratte fjell, med munningen mot +x. Modus «slaget»
 *   (noten, dampskipene og båtene som bryter gjennom), «dampskip» (ny teknologi og
 *   Kaarbøs plan) og «is» (fjorden fryser, gammelt mot nytt).
 * - Et fiskevær: rorbuer på påler, hjeller med fisk og nordlandsbåter. Modus «hjell» og «rorbu».
 * Filmen viser aldri at noen blir skadet. Vannet fra slangene er bare hvite buer.
 */

type Modus = 'slaget' | 'hjell' | 'rorbu' | 'dampskip' | 'is';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const MUNNING = 17;

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    switch (modus) {
        case 'slaget':
            return [
                { pos: v(72 - t * 0.8, 26, 28), se: v(-10, 2, 0) },
                { pos: v(29, 9, 1), se: v(12, 0.5, 0) },
                { pos: v(-14, 16, 0), se: v(-48, 2, 0) },
                { pos: v(58 - t * 0.6, 16, 20), se: v(8, 0, 0) },
                { pos: v(-12, 20, 8), se: v(-40, 1, 0) },
            ][Math.min(beat, 4)];
        case 'dampskip':
            return [
                { pos: v(70, 9, 12), se: v(48, 2, -8) },
                { pos: v(68, 18, 28), se: v(51, 0, 4) },
                { pos: v(36, 11, 28), se: v(50, 1, 4) },
                { pos: v(92, 30, 42), se: v(32, 0, 0) },
                { pos: v(32, 14, 10), se: v(-4, 0, 0) },
                { pos: v(40, 9, 15), se: v(12, 1, 0) },
            ][Math.min(beat, 5)];
        case 'is':
            return [
                { pos: v(40, 22, 2), se: v(-14, 0, 0) },
                { pos: v(60, 5, 6), se: v(44, 2, -8) },
                { pos: v(34, 4, 2), se: v(46, 2, -9) },
                { pos: v(62 + t * 0.4, 30, 32), se: v(30, 0, -4) },
            ][Math.min(beat, 3)];
        case 'hjell':
            return [
                { pos: v(-7, 3, -4.5), se: v(-10, 0.6, -11) },
                { pos: v(0, 7, 6), se: v(-16, 2.5, -18) },
                { pos: v(-25 + t * 0.3, 3.6, -7), se: v(-16, 3, -18) },
                { pos: v(-11, 3.3, -10.2), se: v(-11.6, 3, -14) },
            ][Math.min(beat, 3)];
        case 'rorbu':
            return [
                { pos: v(8, 14, 44), se: v(22, 0, 14) },
                { pos: v(23, 3.6, 2.6), se: v(20, 1.7, -2.5) },
                { pos: v(20, 9, -4), se: v(40, 2, 80) },
                { pos: v(31 - t * 0.4, 6, 15), se: v(29, 3.5, -6) },
                { pos: v(28, 3.5, 28), se: v(20, 1.6, 20) },
                { pos: v(34, 20, 52), se: v(26, 0, 4) },
            ][Math.min(beat, 5)];
    }
}

const mat = {
    fjell: new THREE.MeshStandardMaterial({
        color: '#4f5864',
        roughness: 0.95,
        flatShading: true,
    }),
    sno: new THREE.MeshStandardMaterial({
        color: '#f4f7fa',
        emissive: '#9fb2c4',
        emissiveIntensity: 0.25,
        roughness: 0.9,
        flatShading: true,
    }),
    tre: new THREE.MeshStandardMaterial({ color: '#7a5230', roughness: 0.85, flatShading: true }),
    mork: new THREE.MeshStandardMaterial({ color: '#3b2a1c', roughness: 0.9 }),
    seil: new THREE.MeshStandardMaterial({
        color: '#efe6d2',
        roughness: 0.9,
        side: THREE.DoubleSide,
    }),
    skrog: new THREE.MeshStandardMaterial({ color: '#23272e', roughness: 0.8, flatShading: true }),
    rod: new THREE.MeshStandardMaterial({ color: '#9b2c2c', roughness: 0.8 }),
    hvit: new THREE.MeshStandardMaterial({ color: '#eef2f5', roughness: 0.7 }),
    svart: new THREE.MeshStandardMaterial({ color: '#16181c', roughness: 0.8 }),
    rorbu: new THREE.MeshStandardMaterial({ color: '#a3302a', roughness: 0.85 }),
    tak: new THREE.MeshStandardMaterial({ color: '#2f3237', roughness: 0.9 }),
    not: new THREE.MeshBasicMaterial({ color: '#1f2937', wireframe: true }),
    flottor: new THREE.MeshStandardMaterial({ color: '#e0a526', emissive: '#7a5410' }),
    fisk: new THREE.MeshStandardMaterial({
        color: '#c9d2da',
        emissive: '#5c6874',
        emissiveIntensity: 0.4,
        roughness: 0.5,
    }),
    sprut: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: '#cfe3f1',
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.85,
    }),
    is: new THREE.MeshStandardMaterial({
        color: '#eaf3fa',
        emissive: '#9cb6cc',
        emissiveIntensity: 0.35,
        roughness: 0.4,
        transparent: true,
        opacity: 0,
    }),
    isflak: new THREE.MeshStandardMaterial({
        color: '#eef5fb',
        emissive: '#8ea9c0',
        emissiveIntensity: 0.3,
        flatShading: true,
    }),
};

/* ---------------- Fjell ---------------- */

interface Topp {
    x: number;
    z: number;
    r: number;
    h: number;
}

function Fjell({ topper }: { topper: Topp[] }) {
    return (
        <group>
            {topper.map((f, i) => (
                <group key={i} position={[f.x, 0, f.z]} rotation={[0, i * 0.7, 0]}>
                    <mesh material={mat.fjell} position={[0, f.h / 2 - 1, 0]}>
                        <coneGeometry args={[f.r, f.h, 7, 1]} />
                    </mesh>
                    <mesh material={mat.sno} position={[0, f.h - 1 - (f.h * 0.38) / 2, 0]}>
                        <coneGeometry args={[f.r * 0.38 + 0.2, f.h * 0.38, 7, 1]} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

const FJORDFJELL: Topp[] = Array.from({ length: 20 }, (_, k) => {
    const i = Math.floor(k / 2);
    const side = k % 2 === 0 ? 1 : -1;
    return {
        x: 12 - i * 11 + (side > 0 ? 0 : 4),
        z: side * (16.5 + (i % 3) * 1.5),
        r: 10 + (i % 2) * 2,
        h: 26 + ((i * 5 + (side > 0 ? 0 : 2)) % 4) * 5,
    };
}).concat([
    { x: 150, z: 70, r: 26, h: 40 },
    { x: 170, z: -60, r: 30, h: 46 },
    { x: 120, z: -110, r: 22, h: 34 },
]);

const VAERFJELL: Topp[] = Array.from({ length: 9 }, (_, i) => ({
    x: -70 + i * 18,
    z: -52 - (i % 2) * 8,
    r: 16 + (i % 3) * 3,
    h: 30 + ((i * 7) % 3) * 8,
})).concat([
    { x: 60, z: 110, r: 24, h: 32 },
    { x: -10, z: 130, r: 28, h: 38 },
]);

/* ---------------- Båter ---------------- */

/** Nordlandsbåten i sideprofil: lav midt på, høye stavner i begge ender. */
function nordlandsGeometri() {
    const s = new THREE.Shape();
    s.moveTo(-3, 1.5);
    s.lineTo(-2.5, 0.8);
    s.lineTo(2.5, 0.8);
    s.lineTo(3, 1.5);
    s.lineTo(2.5, 0.15);
    s.lineTo(1.4, -0.3);
    s.lineTo(-1.4, -0.3);
    s.lineTo(-2.5, 0.15);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 1.4, bevelEnabled: false });
    g.translate(0, 0, -0.7);
    return g;
}

function Nordlandsbat() {
    const skrog = useMemo(() => nordlandsGeometri(), []);
    return (
        <group>
            <mesh geometry={skrog} material={mat.tre} />
            <mesh material={mat.mork} position={[0.3, 2.8, 0]}>
                <cylinderGeometry args={[0.07, 0.09, 4.2, 6]} />
            </mesh>
            <mesh material={mat.seil} position={[0.45, 3, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[2.6, 2.8]} />
            </mesh>
        </group>
    );
}

type Plassering = { x: number; z: number; rot: number; synlig: boolean };

/** Mange nordlandsbåter som instanser: skrog, mast og seil. */
function Flate({
    antall,
    plass,
    beat,
    beatTid,
    duver = true,
}: {
    antall: number;
    plass: (i: number, beat: number, t: number) => Plassering;
    beat: number;
    beatTid: React.RefObject<number>;
    duver?: boolean;
}) {
    const skrog = useMemo(() => nordlandsGeometri(), []);
    const refs = [
        useRef<THREE.InstancedMesh>(null),
        useRef<THREE.InstancedMesh>(null),
        useRef<THREE.InstancedMesh>(null),
    ];
    const lokale = useMemo(
        () => [
            new THREE.Matrix4(),
            new THREE.Matrix4().makeTranslation(0.3, 2.8, 0),
            new THREE.Matrix4()
                .makeTranslation(0.45, 3, 0)
                .multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2)),
        ],
        []
    );
    const tmp = useMemo(
        () => ({
            m: new THREE.Matrix4(),
            u: new THREE.Matrix4(),
            q: new THREE.Quaternion(),
            e: new THREE.Euler(),
            p: new THREE.Vector3(),
            s: new THREE.Vector3(1, 1, 1),
            null: new THREE.Vector3(0, 0, 0),
        }),
        []
    );
    useFrame(() => {
        const t = beatTid.current ?? 0;
        for (let i = 0; i < antall; i++) {
            const pl = plass(i, beat, t);
            const gyng = duver ? Math.sin(t * 1.3 + i * 1.7) * 0.06 : 0;
            tmp.p.set(pl.x, gyng, pl.z);
            tmp.e.set(0, pl.rot, duver ? Math.sin(t * 1.1 + i) * 0.04 : 0);
            tmp.q.setFromEuler(tmp.e);
            tmp.m.compose(tmp.p, tmp.q, pl.synlig ? tmp.s : tmp.null);
            refs.forEach((r, k) => {
                if (!r.current) return;
                tmp.u.multiplyMatrices(tmp.m, lokale[k]);
                r.current.setMatrixAt(i, tmp.u);
            });
        }
        refs.forEach((r) => {
            if (r.current) r.current.instanceMatrix.needsUpdate = true;
        });
    });
    return (
        <>
            <instancedMesh ref={refs[0]} args={[skrog, mat.tre, antall]} frustumCulled={false} />
            <instancedMesh ref={refs[1]} args={[undefined, mat.mork, antall]} frustumCulled={false}>
                <cylinderGeometry args={[0.07, 0.09, 4.2, 6]} />
            </instancedMesh>
            <instancedMesh ref={refs[2]} args={[undefined, mat.seil, antall]} frustumCulled={false}>
                <planeGeometry args={[2.6, 2.8]} />
            </instancedMesh>
        </>
    );
}

function skrogGeometri(lengde: number, hoyde: number, bredde: number, baug: number) {
    const s = new THREE.Shape();
    const h = lengde / 2;
    s.moveTo(-h, -0.6);
    s.lineTo(h - baug, -0.6);
    s.lineTo(h, hoyde + 0.3);
    s.lineTo(-h, hoyde);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: bredde, bevelEnabled: false });
    g.translate(0, 0, -bredde / 2);
    return g;
}

/** Et lite dampskip med skorstein. Baugen peker mot +x. */
function Dampskip() {
    const skrog = useMemo(() => skrogGeometri(14, 1.8, 2.6, 2), []);
    return (
        <group>
            <mesh geometry={skrog} material={mat.skrog} />
            <mesh material={mat.rod} position={[0, 0.02, 0]}>
                <boxGeometry args={[13, 0.25, 2.7]} />
            </mesh>
            <mesh material={mat.hvit} position={[-0.5, 2.7, 0]}>
                <boxGeometry args={[4.5, 1.6, 2]} />
            </mesh>
            <mesh material={mat.svart} position={[-1, 4.6, 0]}>
                <cylinderGeometry args={[0.45, 0.5, 2.6, 10]} />
            </mesh>
            <mesh material={mat.rod} position={[-1, 5.4, 0]}>
                <cylinderGeometry args={[0.47, 0.47, 0.35, 10]} />
            </mesh>
            <mesh material={mat.svart} position={[4, 4.4, 0]}>
                <cylinderGeometry args={[0.07, 0.09, 5.5, 6]} />
            </mesh>
        </group>
    );
}

/* ---------------- Fjorden ---------------- */

const N_BATER = 48;

function utePlass(i: number) {
    const rad = Math.floor(i / 8);
    const kol = i % 8;
    return {
        x: MUNNING + 13 + kol * 4.4 + Math.sin(i * 3.1) * 1.2,
        z: -16 + rad * 6.2 + Math.cos(i * 2.3) * 1.3,
    };
}
function innePlass(i: number) {
    const rad = Math.floor(i / 12);
    const kol = i % 12;
    return { x: -32 + kol * 3.9 + (rad % 2) * 1.6, z: -4.2 + rad * 2.8 };
}
function langtUte(i: number) {
    return { x: 110 + (i % 8) * 6, z: -40 + Math.floor(i / 8) * 14 };
}

function slagetPlass(i: number, beat: number, t: number): Plassering {
    const ute = utePlass(i);
    const inne = innePlass(i);
    if (beat < 3) return { ...ute, rot: Math.PI, synlig: true };
    const forsinkelse = (i % 8) * 0.25;
    const a = beat === 3 ? Math.min(1, Math.max(0, (t - 1.5 - forsinkelse) / 7)) : 1;
    const e = a * a * (3 - 2 * a);
    return {
        x: THREE.MathUtils.lerp(ute.x, inne.x, e),
        z: THREE.MathUtils.lerp(ute.z, inne.z, e),
        rot: Math.PI,
        synlig: true,
    };
}

function dampskipPlass(i: number, beat: number, t: number): Plassering {
    if (beat < 3) return { x: 0, z: 0, rot: 0, synlig: false };
    const fra = langtUte(i);
    const til = utePlass(i);
    const a = beat === 3 ? Math.min(1, t / 8) : 1;
    const e = 1 - Math.pow(1 - a, 2);
    return {
        x: THREE.MathUtils.lerp(fra.x, til.x, e),
        z: THREE.MathUtils.lerp(fra.z, til.z, e),
        rot: Math.PI,
        synlig: true,
    };
}

function isPlass(i: number): Plassering {
    return { ...innePlass(i), rot: Math.PI, synlig: true };
}

/** Noten tvers over munningen: to halvdeler som kan rives fra hverandre. */
function Not({ synlig, revet }: { synlig: boolean; revet: number }) {
    const halv = 12;
    return (
        <group position={[MUNNING, 0, 0]} visible={synlig}>
            {[1, -1].map((side) => (
                <group
                    key={side}
                    position={[0, -revet * 2.2, side * (halv / 2 + revet * 7)]}
                    rotation={[side * revet * 0.5, 0, 0]}
                >
                    <mesh material={mat.not} rotation={[0, Math.PI / 2, 0]} position={[0, -1, 0]}>
                        <planeGeometry args={[halv, 3.6, 18, 6]} />
                    </mesh>
                    {Array.from({ length: 7 }, (_, k) => (
                        <mesh
                            key={k}
                            material={mat.flottor}
                            position={[0, 0.85, -halv / 2 + 0.8 + k * 1.75]}
                        >
                            <sphereGeometry args={[0.28, 8, 6]} />
                        </mesh>
                    ))}
                </group>
            ))}
        </group>
    );
}

/** Sølvglimt i vannflaten: stimen med skrei. */
function Stim({
    antall,
    senter,
    bredde,
    dybde,
    synlig,
}: {
    antall: number;
    senter: [number, number];
    bredde: number;
    dybde: number;
    synlig: boolean;
}) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const frø = useMemo(
        () =>
            Array.from({ length: antall }, (_, i) => ({
                x: senter[0] + (((i * 37) % 101) / 101 - 0.5) * bredde,
                z: senter[1] + (((i * 53) % 97) / 97 - 0.5) * dybde,
                f: i * 0.9,
            })),
        [antall, senter, bredde, dybde]
    );
    const tmp = useMemo(() => new THREE.Object3D(), []);
    useFrame(({ clock }) => {
        const m = ref.current;
        if (!m) return;
        const t = clock.elapsedTime;
        frø.forEach((p, i) => {
            tmp.position.set(p.x + Math.sin(t * 0.8 + p.f) * 0.5, 0.08, p.z);
            tmp.rotation.set(-Math.PI / 2, 0, p.f);
            tmp.scale.setScalar(synlig ? 0.6 + 0.4 * Math.abs(Math.sin(t * 2 + p.f)) : 0);
            tmp.updateMatrix();
            m.setMatrixAt(i, tmp.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, mat.fisk, antall]} frustumCulled={false}>
            <planeGeometry args={[0.9, 0.3]} />
        </instancedMesh>
    );
}

/** Ringen av flottører når noten omringer stimen. */
function NotRing({ synlig }: { synlig: boolean }) {
    return (
        <group position={[52, 0, 6]} visible={synlig}>
            {Array.from({ length: 20 }, (_, k) => {
                const a = (k / 20) * Math.PI * 2;
                return (
                    <mesh
                        key={k}
                        material={mat.flottor}
                        position={[Math.cos(a) * 7, 0.3, Math.sin(a) * 7]}
                    >
                        <sphereGeometry args={[0.35, 8, 6]} />
                    </mesh>
                );
            })}
        </group>
    );
}

/** Hvite buer med vann fra slangene, ut over vannet foran båtene. */
function Sprut({ synlig, beatTid }: { synlig: boolean; beatTid: React.RefObject<number> }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tmp = useMemo(() => new THREE.Object3D(), []);
    const BUER = [
        { fra: v(-38, 3.2, 1.6), til: v(-31, 0.2, 3.6) },
        { fra: v(-38, 3.2, -1.6), til: v(-31, 0.2, -3.8) },
        { fra: v(-50, 3.2, 0), til: v(-33, 0.2, 0.4) },
    ];
    const PER = 10;
    useFrame(() => {
        const m = ref.current;
        if (!m) return;
        const t = beatTid.current ?? 0;
        BUER.forEach((b, j) => {
            for (let k = 0; k < PER; k++) {
                const u = (k / PER + t * 0.45 + j * 0.3) % 1;
                tmp.position.lerpVectors(b.fra, b.til, u);
                tmp.position.y += Math.sin(u * Math.PI) * 3;
                tmp.scale.setScalar(synlig ? 0.35 + u * 0.25 : 0);
                tmp.updateMatrix();
                m.setMatrixAt(j * PER + k, tmp.matrix);
            }
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, mat.sprut, 3 * PER]} frustumCulled={false}>
            <sphereGeometry args={[0.5, 6, 5]} />
        </instancedMesh>
    );
}

function Isflak({ synlig }: { synlig: boolean }) {
    const flak = useMemo(
        () =>
            Array.from({ length: 34 }, (_, i) => ({
                x: -60 + ((i * 41) % 97) * 0.78,
                z: (((i * 29) % 53) / 53 - 0.5) * 9,
                s: 1 + ((i * 7) % 5) * 0.35,
                r: i * 1.3,
            })),
        []
    );
    return (
        <group visible={synlig}>
            {flak.map((f, i) => (
                <mesh
                    key={i}
                    material={mat.isflak}
                    position={[f.x, 0.12, f.z]}
                    rotation={[0, f.r, 0]}
                    scale={[f.s, 0.25, f.s * 0.8]}
                >
                    <dodecahedronGeometry args={[1, 0]} />
                </mesh>
            ))}
        </group>
    );
}

/* ---------------- Fiskeværet ---------------- */

const RORBUER = [14, 24, 34, 44];
const HJELLER: [number, number][] = [
    [-24, -14],
    [-10, -14],
    [-24, -22],
    [-10, -22],
];

function Rorbu() {
    return (
        <group>
            {[
                [-2.4, -1.8],
                [2.4, -1.8],
                [-2.4, 1.8],
                [2.4, 1.8],
            ].map(([x, z], i) => (
                <mesh key={i} material={mat.mork} position={[x, 0.6, z]}>
                    <cylinderGeometry args={[0.15, 0.15, 2.4, 6]} />
                </mesh>
            ))}
            <mesh material={mat.rorbu} position={[0, 2.9, 0]}>
                <boxGeometry args={[6, 3.4, 5]} />
            </mesh>
            {[1, -1].map((s) => (
                <mesh
                    key={s}
                    material={mat.tak}
                    position={[0, 5.25, s * 1.35]}
                    rotation={[s * 0.6, 0, 0]}
                >
                    <boxGeometry args={[6.5, 0.25, 3.3]} />
                </mesh>
            ))}
            <mesh material={mat.hvit} position={[1.6, 2.9, 2.52]}>
                <boxGeometry args={[1, 1, 0.05]} />
            </mesh>
        </group>
    );
}

/** En hjell: to A-bukker og en bom. Fisken henger i egne instanser. */
function Hjell({ hoyde }: { hoyde: number }) {
    return (
        <group scale={[1, Math.max(0.001, hoyde), 1]}>
            {[-4.5, 4.5].map((x) =>
                [1, -1].map((s) => (
                    <mesh
                        key={`${x}${s}`}
                        material={mat.mork}
                        position={[x, 1.9, s * 0.6]}
                        rotation={[s * 0.32, 0, 0]}
                    >
                        <cylinderGeometry args={[0.1, 0.12, 4, 5]} />
                    </mesh>
                ))
            )}
            <mesh material={mat.mork} position={[0, 3.75, 0]}>
                <boxGeometry args={[10, 0.22, 0.22]} />
            </mesh>
        </group>
    );
}

const FISK_PER_HJELL = 28;

function HengendeFisk({ synlig, torr }: { synlig: number; torr: React.RefObject<number> }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const material = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: '#c9d2da',
                emissive: '#3a4148',
                emissiveIntensity: 0.4,
                roughness: 0.7,
            }),
        []
    );
    const fersk = useMemo(() => new THREE.Color('#c9d2da'), []);
    const ferdig = useMemo(() => new THREE.Color('#a9824f'), []);
    const tmp = useMemo(() => new THREE.Object3D(), []);
    useFrame(({ clock }) => {
        const m = ref.current;
        if (!m) return;
        const t = clock.elapsedTime;
        material.color.copy(fersk).lerp(ferdig, torr.current ?? 0);
        HJELLER.forEach(([hx, hz], h) => {
            for (let k = 0; k < FISK_PER_HJELL; k++) {
                const side = k % 2 === 0 ? 1 : -1;
                const x = hx - 4.3 + Math.floor(k / 2) * 0.66;
                tmp.position.set(x, 3.05, hz + side * 0.22);
                tmp.rotation.set(Math.sin(t * 1.6 + k + h) * 0.08, 0, 0);
                tmp.scale.setScalar(synlig);
                tmp.updateMatrix();
                m.setMatrixAt(h * FISK_PER_HJELL + k, tmp.matrix);
            }
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh
            ref={ref}
            args={[undefined, material, HJELLER.length * FISK_PER_HJELL]}
            frustumCulled={false}
        >
            <boxGeometry args={[0.22, 1.2, 0.42]} />
        </instancedMesh>
    );
}

function Fiskehaug({ synlig }: { synlig: boolean }) {
    const fisk = useMemo(
        () =>
            Array.from({ length: 22 }, (_, i) => ({
                x: -10 + (((i * 37) % 23) / 23 - 0.5) * 3.2,
                y: 0.55 + Math.floor(i / 8) * 0.22,
                z: -11 + (((i * 17) % 19) / 19 - 0.5) * 2.2,
                r: i * 0.9,
            })),
        []
    );
    return (
        <group visible={synlig}>
            {fisk.map((f, i) => (
                <mesh
                    key={i}
                    material={mat.fisk}
                    position={[f.x, f.y, f.z]}
                    rotation={[Math.PI / 2, 0, f.r]}
                >
                    <boxGeometry args={[0.22, 1.2, 0.42]} />
                </mesh>
            ))}
        </group>
    );
}

function Lofotkiste() {
    return (
        <group position={[20, 1.75, -2.5]}>
            <mesh material={mat.tre}>
                <boxGeometry args={[1.6, 0.8, 0.9]} />
            </mesh>
            <mesh material={mat.mork} position={[0, 0.45, 0]}>
                <boxGeometry args={[1.66, 0.14, 0.96]} />
            </mesh>
            {[-0.5, 0.5].map((x) => (
                <mesh key={x} material={mat.svart} position={[x, 0, 0]}>
                    <boxGeometry args={[0.08, 0.84, 0.94]} />
                </mesh>
            ))}
        </group>
    );
}

const N_VAER = 20;
function vaerPlass(i: number, beat: number, t: number): Plassering {
    const kol = i % 10;
    const rad = Math.floor(i / 10);
    const fortoyd = { x: 10 + kol * 4.2 + rad * 1.5, z: 8 + rad * 5 };
    if (i === 0) return { x: 20, z: 20, rot: 0.15, synlig: true };
    const fra = { x: 40 + kol * 7, z: 70 + rad * 16 + (i % 3) * 6 };
    const a = beat === 0 ? Math.min(1, t / 9) : 1;
    const e = 1 - Math.pow(1 - a, 2);
    return {
        x: THREE.MathUtils.lerp(fra.x, fortoyd.x, e),
        z: THREE.MathUtils.lerp(fra.z, fortoyd.z, e),
        rot: e < 0.95 ? 2.2 : 0.15,
        synlig: true,
    };
}

/* ---------------- Scenen ---------------- */

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrigeBeat = useRef(-1);
    const kamSe = useRef(new THREE.Vector3(0, 2, 0));
    const forste = useRef(true);
    const revet = useRef(0);
    const notRef = useRef<THREE.Group>(null);
    const skip = useRef<THREE.Group>(null);
    const torr = useRef(beat >= 2 ? 1 : 0);
    const hjellHoyde = useRef(beat >= 1 ? 1 : 0);
    const hjellRefs = useRef<(THREE.Group | null)[]>([]);

    const fjord = modus === 'slaget' || modus === 'dampskip' || modus === 'is';

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;
        const glatt = dt || 0.016;

        // Noten rives når båtene bryter gjennom (slaget beat 3).
        const målRevet =
            modus === 'slaget' ? (beat < 3 ? 0 : beat === 3 ? Math.min(1, t / 6) : 1) : 0;
        revet.current =
            modus === 'slaget' && beat === 3 ? målRevet : damp(revet.current, målRevet, 3, glatt);
        const halvdeler = notRef.current?.children[0]?.children;
        if (halvdeler) {
            halvdeler.forEach((c, k) => {
                const side = k === 0 ? 1 : -1;
                c.position.y = -revet.current * 2.2;
                c.position.z = side * (6 + revet.current * 7);
                c.rotation.x = side * revet.current * 0.5;
            });
        }

        // Dampskipet i «dampskip»: ute på havet, så ved munningen, så inne i fjorden.
        if (skip.current && modus === 'dampskip') {
            const mål = beat < 3 ? v(48 - t * 0.3, 0, -8) : beat < 5 ? v(28, 0, 0) : v(4, 0, 0);
            if (forste.current) skip.current.position.copy(mål);
            skip.current.position.x = damp(skip.current.position.x, mål.x, 0.8, glatt);
            skip.current.position.z = damp(skip.current.position.z, mål.z, 0.8, glatt);
            skip.current.rotation.y = beat >= 3 ? Math.PI : 0;
        }

        // Fiskeværet: hjellene reiser seg, fisken tørker.
        const målHoyde = modus === 'hjell' ? (beat >= 1 ? 1 : 0) : 1;
        hjellHoyde.current = damp(hjellHoyde.current, målHoyde, 2.2, glatt);
        hjellRefs.current.forEach((g) => {
            if (g) g.scale.y = Math.max(0.001, hjellHoyde.current);
        });
        const målTorr = modus === 'hjell' ? (beat >= 2 ? 1 : 0) : 0.7;
        torr.current = damp(torr.current, målTorr, beat === 2 ? 0.35 : 3, glatt);

        mat.is.opacity = modus === 'is' ? 0.92 : 0;

        const mål = kameraFor(modus, beat, t);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mål.pos, k);
        kamSe.current.lerp(mål.se, k);
        camera.lookAt(kamSe.current);
    });

    return (
        <>
            <color attach="background" args={['#cfdbe6']} />
            <fog attach="fog" args={['#d3dee8', 70, 280]} />
            <ambientLight intensity={0.8} color="#e6eef5" />
            <directionalLight position={[-40, 50, 40]} intensity={1.15} color="#fff4e2" />
            <hemisphereLight args={['#e2ebf3', '#2b4255', 0.5]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[900, 900]} />
                <meshStandardMaterial color="#3d5a70" emissive="#1c3245" roughness={0.55} />
            </mesh>

            {fjord && (
                <>
                    <Fjell topper={FJORDFJELL} />
                    {/* Dampskipene inne i fjorden */}
                    {modus !== 'dampskip' && (
                        <>
                            <group position={[-40, 0, 1.6]} rotation={[0, Math.PI, 0]}>
                                <Dampskip />
                            </group>
                            <group position={[-55, 0, -1.4]} rotation={[0, Math.PI, 0]}>
                                <Dampskip />
                            </group>
                        </>
                    )}
                    {modus === 'dampskip' && (
                        <group ref={skip} position={[48, 0, -8]}>
                            <Dampskip />
                        </group>
                    )}
                    <group ref={notRef}>
                        <Not
                            synlig={
                                (modus === 'slaget' && beat >= 1) ||
                                (modus === 'dampskip' && beat >= 5)
                            }
                            revet={0}
                        />
                    </group>
                    <Stim
                        antall={110}
                        senter={[-14, 0]}
                        bredde={56}
                        dybde={8}
                        synlig={modus === 'slaget'}
                    />
                    <Stim
                        antall={50}
                        senter={[52, 6]}
                        bredde={11}
                        dybde={11}
                        synlig={modus === 'dampskip' && beat >= 1 && beat <= 2}
                    />
                    <NotRing synlig={modus === 'dampskip' && (beat === 1 || beat === 2)} />
                    <Sprut synlig={modus === 'slaget' && beat === 4} beatTid={beatTid} />
                    <Isflak synlig={(modus === 'dampskip' && beat >= 4) || modus === 'is'} />
                    <mesh
                        material={mat.is}
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[-36, 0.1, 0]}
                    >
                        <planeGeometry args={[106, 20]} />
                    </mesh>
                    {modus === 'slaget' && (
                        <Flate antall={N_BATER} plass={slagetPlass} beat={beat} beatTid={beatTid} />
                    )}
                    {modus === 'dampskip' && (
                        <Flate
                            antall={N_BATER}
                            plass={dampskipPlass}
                            beat={beat}
                            beatTid={beatTid}
                        />
                    )}
                    {modus === 'is' && (
                        <>
                            <Flate
                                antall={N_BATER}
                                plass={isPlass}
                                beat={beat}
                                beatTid={beatTid}
                                duver={false}
                            />
                            <group position={[44, 0, -12]} rotation={[0, 0.2, 0]}>
                                <Nordlandsbat />
                            </group>
                            <group position={[47, 0, -4]} rotation={[0, 0.2, 0]}>
                                <Dampskip />
                            </group>
                        </>
                    )}
                </>
            )}

            {!fjord && (
                <>
                    <Fjell topper={VAERFJELL} />
                    {/* Land med snø og en brygge foran rorbuene */}
                    <mesh material={mat.sno} position={[0, -0.1, -34.5]}>
                        <boxGeometry args={[220, 1, 51]} />
                    </mesh>
                    <mesh material={mat.tre} position={[29, 1.2, -2.5]}>
                        <boxGeometry args={[42, 0.3, 3]} />
                    </mesh>
                    {RORBUER.map((x) => (
                        <group key={x} position={[x, 0, -6]}>
                            <Rorbu />
                        </group>
                    ))}
                    {HJELLER.map(([x, z], i) => (
                        <group
                            key={i}
                            position={[x, 0.4, z]}
                            ref={(g) => {
                                hjellRefs.current[i] = g;
                            }}
                        >
                            <Hjell hoyde={1} />
                        </group>
                    ))}
                    <HengendeFisk synlig={modus === 'hjell' && beat === 0 ? 0 : 1} torr={torr} />
                    <Fiskehaug synlig={modus === 'hjell' && beat === 0} />
                    {modus === 'rorbu' && (
                        <>
                            <Lofotkiste />
                            <Flate
                                antall={N_VAER}
                                plass={vaerPlass}
                                beat={beat}
                                beatTid={beatTid}
                            />
                        </>
                    )}
                </>
            )}
        </>
    );
}

const MERKER: Record<Modus, (string | null)[]> = {
    slaget: [
        'Trollfjorden, 6. mars 1890',
        'Noten: en sperring av nett',
        'Dampskipene vil ha fisken',
        'Flere tusen fiskere',
        'Fiskerne vinner',
    ],
    hjell: [
        'Fersk torsk råtner fort',
        'Hjeller: stativ av tre',
        'Vind og kulde',
        'Torsk = tørrfisk',
    ],
    rorbu: [
        'Etter jul: mot Lofoten',
        'Lofotkista',
        'Hjemme: gård, dyr, barn og de gamle',
        'Rorbuer',
        'Nordlandsbåten',
        '85-90 % av all torsk',
    ],
    dampskip: [
        'Dampskip og not',
        'Noten omringer stimen',
        'Dampskipet Spitsbergen, 1888',
        'Februar 1890: Raftsundet',
        'Is i fjorden: 1 krone per båt',
        'Kaarbøs plan: sperre fjorden',
    ],
    is: [
        'Dagen etter: fjorden fryser',
        'Gammelt mot nytt',
        'Maskiner endrer arbeidet',
        '1897: ny lofotlov',
    ],
};

interface Props {
    modus: Modus;
}

export function LofotfisketFjorden({ beat, playing, props }: VisualProps<Props>) {
    const modus = props.modus ?? 'slaget';
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
                camera={{ fov: 42, near: 0.5, far: 900, position: [70, 26, 28] }}
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
                        className="absolute top-[7%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
